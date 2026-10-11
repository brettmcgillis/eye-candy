import {
  Fn,
  If,
  Loop,
  float,
  instanceIndex,
  instancedArray,
  int,
  length,
  mix,
  uint,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';

import { RING, createNormalPass, isPinned, skinSide } from './membraneGrid';

const damp = (current, target, lambda, dt) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

// 260421_CatenaryCanopy's inflation solve on the GPU, over the strips
// @modules/trucheterie3d's buildMembrane lays out. Per substep: a uniform
// lift (heavier toward each lane's crown) — straight out of its skin's side
// as in the reference, or along the skin's normal for a balloon — damped
// velocity, then
// rounds of spring corrections with the seams re-pinned, then velocity from
// how far each vertex moved. The reference relaxes springs one after
// another; here every vertex gathers its own springs each round (same
// per-spring correction), so convergence per round is slower. Lane units:
// one lane width = 1, z up.
export default function createMembraneSolver(membrane) {
  const count = membrane.pinned.length;
  const { pitch } = membrane;
  const rest = new Float32Array(count * 4);
  const meta = new Float32Array(count * 4);
  const { rows } = membrane;
  const strips = membrane.strips.length / 4;
  for (let s = 0; s < strips; s += 1) {
    const base = membrane.strips[s * 4];
    const cols = membrane.strips[s * 4 + 1];
    const loop = membrane.strips[s * 4 + 3];
    for (let v = base; v < base + cols * rows; v += 1) {
      meta.set([base, cols, rows, loop], v * 4);
    }
  }
  for (let v = 0; v < count; v += 1) {
    rest.set(
      [
        membrane.rest[v * 2] / pitch,
        membrane.rest[v * 2 + 1] / pitch,
        membrane.crown[v],
        membrane.pinned[v] + 2 * membrane.side[v],
      ],
      v * 4
    );
  }
  const flat = new Float32Array(count * 4);
  for (let v = 0; v < count; v += 1) {
    flat.set([rest[v * 4], rest[v * 4 + 1], 0, 0], v * 4);
  }

  const restBuffer = instancedArray(rest, 'vec4').setName('membraneRest');
  const metaBuffer = instancedArray(meta, 'vec4').setName('membraneMeta');
  const positions = [
    instancedArray(flat.slice(), 'vec4').setName('membranePositionA'),
    instancedArray(flat.slice(), 'vec4').setName('membranePositionB'),
  ];
  const previous = instancedArray(flat.slice(), 'vec4').setName(
    'membranePrevious'
  );
  const velocity = instancedArray(count, 'vec4').setName('membraneVelocity');
  const normals = instancedArray(count, 'vec4').setName('membraneSimNormal');
  const weldCount = membrane.weldGroups.length / 2;
  const weldGroups =
    weldCount > 0
      ? instancedArray(membrane.weldGroups, 'vec2').setName('membraneWelds')
      : null;
  const weldMembers =
    weldCount > 0
      ? instancedArray(membrane.weldMembers, 'uint').setName(
          'membraneWeldMembers'
        )
      : null;

  const u = {
    crownBias: uniform(0.2),
    damping: uniform(1),
    dt: uniform(1 / 60),
    lift: uniform(0),
    alongNormal: uniform(0),
    sewn: uniform(membrane.side.includes(1) ? 1 : 0),
    stiffness: uniform(0.19),
  };

  const pinnedAt = (i) => isPinned(restBuffer.element(i).w);

  const forEachSpring = (i, visit) => {
    const m = metaBuffer.element(i);
    const base = int(m.x);
    const cols = int(m.y);
    const rowCount = int(m.z);
    const local = int(i).sub(base);
    const col = local.div(rowCount);
    const row = local.mod(rowCount);
    RING.forEach(([dc, dk]) => {
      const c2 = col.add(dc).toVar();
      If(m.w.greaterThan(0.5), () => {
        c2.assign(c2.add(cols).mod(cols));
      });
      const k2 = row.add(dk);
      If(
        c2
          .greaterThanEqual(0)
          .and(c2.lessThan(cols))
          .and(k2.greaterThanEqual(0))
          .and(k2.lessThan(rowCount)),
        () => {
          visit(uint(base.add(c2.mul(rowCount)).add(k2)));
        }
      );
    });
  };

  const integrate = Fn(() => {
    const i = instanceIndex;
    const r = restBuffer.element(i);
    const p = positions[0].element(i);
    If(pinnedAt(i), () => {
      const anchor = vec4(r.x, r.y, 0, 0);
      p.assign(anchor);
      previous.element(i).assign(anchor);
      velocity.element(i).assign(vec4(0));
    }).Else(() => {
      previous.element(i).assign(p);
      const lift = u.lift.mul(float(1).add(r.z.mul(u.crownBias)));
      const outward = mix(
        vec3(0, 0, 1),
        normals.element(i).xyz,
        u.alongNormal
      ).mul(skinSide(r.w));
      const v = velocity
        .element(i)
        .xyz.add(outward.mul(lift.mul(u.dt)))
        .mul(u.damping)
        .toVar();
      velocity.element(i).assign(vec4(v, 0));
      p.assign(vec4(p.xyz.add(v.mul(u.dt)), 0));
    });
  })()
    .compute(count)
    .setName('membraneIntegrate');

  const relax = (read, write) =>
    Fn(() => {
      const i = instanceIndex;
      const r = restBuffer.element(i);
      If(pinnedAt(i), () => {
        write.element(i).assign(vec4(r.x, r.y, 0, 0));
      }).Else(() => {
        const p = read.element(i).xyz;
        const shift = vec3(0).toVar();
        forEachSpring(i, (j) => {
          const d = read.element(j).xyz.sub(p);
          const span = length(d);
          const restLength = length(restBuffer.element(j).xy.sub(r.xy));
          If(span.greaterThan(1e-6), () => {
            const share = pinnedAt(j).select(float(1), float(0.5));
            shift.addAssign(
              d.mul(span.sub(restLength).div(span).mul(u.stiffness).mul(share))
            );
          });
        });
        // Sewn skins meet on the seams' plane and never pass through it.
        const moved = p.add(shift).toVar();
        const side = skinSide(r.w);
        If(u.sewn.greaterThan(0.5).and(moved.z.mul(side).lessThan(0)), () => {
          moved.z.assign(0);
        });
        write.element(i).assign(vec4(moved, 0));
      });
    })()
      .compute(count)
      .setName('membraneRelax');
  const relaxPair = [
    relax(positions[0], positions[1]),
    relax(positions[1], positions[0]),
  ];

  const weld =
    weldCount > 0
      ? Fn(() => {
          const group = weldGroups.element(instanceIndex);
          const first = int(group.x);
          const end = first.add(int(group.y));
          const sum = vec3(0).toVar();
          Loop({ end, start: first, type: 'int' }, ({ i }) => {
            sum.addAssign(positions[0].element(weldMembers.element(i)).xyz);
          });
          const mean = vec4(sum.div(group.y), 0).toVar();
          Loop({ end, start: first, type: 'int' }, ({ i }) => {
            positions[0].element(weldMembers.element(i)).assign(mean);
          });
        })()
          .compute(weldCount)
          .setName('membraneWeld')
      : null;

  const settleVelocity = Fn(() => {
    const i = instanceIndex;
    If(pinnedAt(i).not(), () => {
      const moved = positions[0].element(i).xyz.sub(previous.element(i).xyz);
      velocity.element(i).assign(vec4(moved.div(u.dt), 0));
    });
  })()
    .compute(count)
    .setName('membraneVelocity');

  const shade = createNormalPass({
    count,
    layout: metaBuffer,
    name: 'membraneSimNormals',
    normals,
    positions: positions[0],
  });

  let pressure = 0;

  function reset() {
    pressure = 0;
    [positions[0], positions[1], previous].forEach(({ value }) => {
      value.array.set(flat);
      Object.assign(value, { needsUpdate: true });
    });
    velocity.value.array.fill(0);
    Object.assign(velocity.value, { needsUpdate: true });
  }

  // One frame of the reference's update(): delta clamped to maxDeltaTime
  // and split into substeps, pressure easing toward `target` as it goes.
  function step(renderer, delta, config, target) {
    const frame = Math.min(delta, config.membraneMaxDelta);
    if (frame <= 0) return;
    const substeps = Math.max(1, Math.round(config.membraneSubsteps));
    const pairs = Math.max(1, Math.round(config.membraneIterations / 2));
    const dt = frame / substeps;
    u.dt.value = dt;
    u.damping.value = Math.exp(-config.membraneDamping * dt);
    u.crownBias.value = config.membraneCrownBias;
    u.stiffness.value = config.membraneStiffness;
    const balloon = config.membranePressureMode === 'normal';
    u.alongNormal.value = balloon ? 1 : 0;
    for (let s = 0; s < substeps; s += 1) {
      pressure = damp(pressure, target, config.membraneResponse, dt);
      u.lift.value = pressure * config.membranePressureScale;
      if (balloon) renderer.compute(shade);
      renderer.compute(integrate);
      if (weld) renderer.compute(weld);
      for (let k = 0; k < pairs; k += 1) {
        renderer.compute(relaxPair[0]);
        renderer.compute(relaxPair[1]);
        if (weld) renderer.compute(weld);
      }
      renderer.compute(settleVelocity);
    }
  }

  return {
    count,
    layout: metaBuffer,
    pitch,
    positions: positions[0],
    reset,
    rest: restBuffer,
    step,
    get pressure() {
      return pressure;
    },
    dispose() {
      [
        restBuffer,
        metaBuffer,
        ...positions,
        previous,
        velocity,
        normals,
        weldGroups,
        weldMembers,
      ].forEach((buffer) => buffer?.value.dispose?.());
    },
  };
}
