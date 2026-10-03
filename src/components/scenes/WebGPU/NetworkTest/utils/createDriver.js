import {
  POINT_KEYS,
  WIRING_KEYS,
  buildInstances,
  createDrift,
  createEdgeFades,
  createInstanceBuffers,
  createPulses,
  growAt,
  growCycleSeconds,
} from '@modules/networkTest';

const MAX_DELTA = 1 / 15;
const REST_SECONDS = 0.6;
const BUILD_KEYS = [...POINT_KEYS, ...WIRING_KEYS];

const keyOf = (c, keys) => keys.map((key) => c[key]).join('|');

function sphereOf(positions) {
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let a = 0; a < 3; a += 1) {
      lo[a] = Math.min(lo[a], positions[i + a]);
      hi[a] = Math.max(hi[a], positions[i + a]);
    }
  }
  if (!Number.isFinite(lo[0])) return { center: [0, 0, 0], radius: 1 };
  return {
    center: lo.map((v, a) => (v + hi[a]) / 2),
    radius: Math.hypot(...hi.map((v, a) => v - lo[a])) / 2,
  };
}

// The scene's clock over the kernel. Builds and rewires go to the worker and
// land when they land; until then the network on screen keeps drawing.
// `grow` loops grow → hold → fade → rest with a new seed each rest, `drift`
// wanders and rewires, `reseed` rolls a new seed every hold. Returns
// instances only when they changed.
export default function createDriver() {
  const buffers = createInstanceBuffers();
  let client = null;
  let network = null;
  let live = null;
  let sphere = null;
  let buildKey = null;
  let building = false;
  let pending = null;
  let lastConfig = null;
  let dirty = false;
  let pulses = null;
  let pulseKey = null;
  let drift = null;
  let wander = null;
  let fades = null;
  let image = null;
  let driftTime = 0;
  let rewireIn = 0;
  let wiring = false;
  let growTime = 0;
  let growEpoch = 0;
  let cycle = 0;
  let reseedTime = 0;

  function adopt(next) {
    pulses?.retarget(network, next);
    network = next;
    live = next;
    sphere = sphereOf(next.positions);
    drift = null;
    wander = null;
    fades = null;
    dirty = true;
  }

  // One build in flight at a time. A webcam asks faster than a build
  // finishes, so newer requests coalesce into the next build instead of
  // superseding the one running — superseding starved the screen forever.
  function dispatch() {
    const c = pending;
    pending = null;
    building = true;
    const from = client;
    from.build(c, image).then((next) => {
      if (client !== from) return;
      building = false;
      adopt(next);
      if (pending) dispatch();
    });
  }

  function requestBuild(c) {
    pending = c;
    if (!building) dispatch();
  }

  function stepDrift(c, dt) {
    if (!drift) {
      drift = createDrift(network, c);
      fades = createEdgeFades(network.count, network.edges);
      live = network;
      rewireIn = 0;
    }
    driftTime += dt;
    const positions = drift(driftTime, c);
    rewireIn -= dt;
    if (rewireIn <= 0 && !wiring) {
      wiring = true;
      rewireIn = c.rewireSeconds;
      const from = network;
      client.wire(network, positions, c).then((result) => {
        wiring = false;
        if (from !== network || !fades) return;
        fades.update(result.edges);
        live = { ...network, ...result };
      });
    }
    return {
      edges: fades.step(dt, c.fadeSeconds),
      positions,
    };
  }

  return {
    attach(next) {
      client = next;
      buildKey = null;
      building = false;
      pending = null;
    },

    // Near and far of the network along the view axis, for the depth fade.
    depthRange(camera) {
      if (!sphere) return null;
      const d = Math.hypot(
        ...sphere.center.map((v, a) => camera.position.getComponent(a) - v)
      );
      return [Math.max(d - sphere.radius, 0), d + sphere.radius];
    },

    step(c, delta, { onReseed, replay, source = null, stops }) {
      if (!client) return null;
      const dt = Math.min(delta, MAX_DELTA);
      if (c !== lastConfig) {
        lastConfig = c;
        dirty = true;
      }

      const key = keyOf(c, BUILD_KEYS);
      if (key !== buildKey || source !== image) {
        buildKey = key;
        image = source;
        requestBuild(c);
      }
      if (!network) return null;

      const nextPulseKey = `${c.wireSeed}|${c.pulseCount}`;
      if (nextPulseKey !== pulseKey) {
        pulseKey = nextPulseKey;
        pulses = createPulses(c.wireSeed, c.pulseCount);
      }

      let grow = null;
      let { positions } = network;
      if (c.motionMode === 'grow') {
        if (replay !== growEpoch) {
          growEpoch = replay;
          growTime = 0;
          cycle = 0;
        }
        growTime += dt;
        grow = growAt(growTime, c);
        if (c.driftAmount > 0) {
          wander = wander ?? createDrift(network, c);
          driftTime += dt;
          positions = wander(driftTime, c);
        }
        const turn = Math.floor(
          (growTime + REST_SECONDS) / growCycleSeconds(c)
        );
        if (turn !== cycle) {
          cycle = turn;
          onReseed();
        }
      } else if (c.motionMode === 'off' && c.growProgress < 1) {
        grow = c.growProgress;
      }

      if (c.motionMode === 'reseed') {
        reseedTime += dt;
        if (reseedTime >= c.holdSeconds) {
          reseedTime = 0;
          onReseed();
        }
      }

      let edges = null;
      if (c.motionMode === 'drift') {
        ({ edges, positions } = stepDrift(c, dt));
      } else if (drift) {
        drift = null;
        fades = null;
        live = network;
        dirty = true;
      }

      const signalling = c.pulseCount > 0 && (grow == null || grow > 0);
      if (signalling) {
        pulses.step(live, positions, dt, c.pulseSpeed, grow ?? 1);
      }
      const animating =
        signalling || c.motionMode === 'drift' || c.motionMode === 'grow';
      if (!animating && !dirty) return null;
      dirty = false;

      return buildInstances({
        buffers,
        config: c,
        edges,
        grow,
        network: drift ? live : network,
        positions,
        pulses: signalling ? pulses.pulses : null,
        stops,
      });
    },
  };
}
