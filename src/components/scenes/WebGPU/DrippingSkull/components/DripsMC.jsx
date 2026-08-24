// Marching-cubes drip system — one small local volume per drip site.
//
// The liquid (and only the liquid — never the skull) is a metaball field
// polygonized by MarchingCubes, so everything merges smoothly: the runnel
// tail blends into the pool, the pool bulges, and the neck that forms as
// a drop sags is one continuous liquid body.
//
// Resolution is the whole game. A single grid spanning the skull leaves
// each cell larger than a drip (sub-voxel = invisible). Instead every
// runnel's drip-off point gets its own ~1.2-unit cube at 32–64³, so cells
// are ~4× smaller exactly where the liquid lives and empty air costs
// nothing.
//
// Agent state machine per runnel:
//   crawl   — head blob slides down the path tail into the volume
//   pool    — liquid gathers at the drip-off point
//   stretch — a hanging chain of metaballs thins into a neck
//   (detach)— the bulb becomes an instanced falling sphere; the agent
//             restarts partway up its path so the runnel keeps feeding
//
// Falling drops are plain instanced spheres: a free drop is spherical,
// needs no merging, and would otherwise force a huge field volume.
import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { MarchingCubes } from 'three-stdlib';
import * as THREE from 'three/webgpu';

const GRAVITY = 9.8;
const ISO = 80; // three-stdlib MarchingCubes default isolation
const SUBTRACT = 12;
const MAX_POLYS = 4000; // per local volume — keeps the per-frame upload small
// Rebuild each volume's isosurface every Nth frame, staggered. The full
// vertex buffer re-uploads on every rebuild, so this divides GPU upload
// and polygonize cost by N; the liquid moves slowly enough not to notice.
const REBUILD_EVERY = 4;
const MAX_VOLUMES = 12;
const MAX_DROPS = 64;
const CHAIN = 8; // metaballs in the hanging strand
const VOLUME_HALF = 0.62; // local cube half-extent, world units

const tmpObj = new THREE.Object3D();
const HIDDEN = new THREE.Matrix4().makeScale(0, 0, 0);

function rand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export default function DripsMC({ paths, material, config, floorY }) {
  const dropsRef = useRef();

  // One local MC volume per runnel, centered below its drip-off point.
  const volumes = useMemo(
    () =>
      paths.slice(0, MAX_VOLUMES).map((path) => {
        const mc = new MarchingCubes(
          config.mcResolution,
          material,
          false,
          false,
          MAX_POLYS
        );
        mc.isolation = ISO;
        mc.frustumCulled = false;
        const center = new THREE.Vector3(
          path.dripOff.x,
          path.dripOff.y - VOLUME_HALF * 0.55,
          path.dripOff.z
        );
        // Index where the path tail enters this volume — the visible
        // "runnel feeding the pool" segment.
        let tailStart = path.points.length - 1;
        for (let i = path.points.length - 1; i >= 0; i -= 1) {
          const p = path.points[i];
          if (
            Math.abs(p.x - center.x) > VOLUME_HALF - 0.06 ||
            Math.abs(p.y - center.y) > VOLUME_HALF - 0.06 ||
            Math.abs(p.z - center.z) > VOLUME_HALF - 0.06
          )
            break;
          tailStart = i;
        }
        return { mc, center, tailStart };
      }),
    [paths, material, config.mcResolution]
  );

  const agents = useMemo(
    () =>
      paths.slice(0, MAX_VOLUMES).map((path, i) => {
        // Stagger initial states so every drip site is alive on load.
        const roll = rand(i * 5.1);
        if (roll < 0.4) {
          return {
            state: 'crawl',
            u: path.points.length * (0.7 + 0.3 * rand(i * 3.7)),
            t: 0,
            seed: rand(i * 11.3),
          };
        }
        return {
          state: roll < 0.75 ? 'pool' : 'stretch',
          u: path.points.length - 1,
          t: rand(i * 9.3) * 0.5,
          seed: rand(i * 11.3),
        };
      }),
    [paths]
  );

  const falling = useRef({ list: [], cursor: 0 });
  const frameRef = useRef(0);

  useFrame((_, delta) => {
    frameRef.current += 1;
    const dt = Math.min(delta, 0.05);
    const now = performance.now() / 1000;
    const { viscosity, dropSize, dripRate } = config;
    const count = Math.min(config.dripCount, volumes.length);

    const crawlSpeed = (6 + 14 * (1 - viscosity)) * dripRate; // samples/sec
    const poolDur = (0.5 + viscosity * 1.6) / dripRate;
    const stretchDur = (0.45 + viscosity * 1.1) / dripRate;

    for (let i = 0; i < volumes.length; i += 1) {
      const vol = volumes[i];
      if (i >= count) {
        vol.mc.visible = false;
        // eslint-disable-next-line no-continue
        continue;
      }
      vol.mc.visible = true;
      const rebuild = (frameRef.current + i) % REBUILD_EVERY === 0;

      const { mc, center, tailStart } = vol;
      const agent = agents[i];
      const path = paths[i];
      const pts = path.points;
      const d = path.dripOff;

      // World radius → addBall strength inside this volume's grid space.
      const strength = (rWorld) => {
        const rg = rWorld / (2 * VOLUME_HALF);
        return rg * rg * (ISO + SUBTRACT);
      };
      const addBall = (x, y, z, r) => {
        mc.addBall(
          (x - center.x) / (2 * VOLUME_HALF) + 0.5,
          (y - center.y) / (2 * VOLUME_HALF) + 0.5,
          (z - center.z) / (2 * VOLUME_HALF) + 0.5,
          strength(r),
          SUBTRACT
        );
      };

      // Strand can't poke through the volume floor — clamp, and let go
      // early if a low-viscosity strand wants more length than we have.
      const bulbRMax = dropSize * 1.05;
      const sagMax = d.y - (center.y - VOLUME_HALF) - bulbRMax * 2 - 0.05;
      const strandLen = Math.min(
        dropSize * (1.5 + viscosity * 7),
        Math.max(sagMax, dropSize)
      );

      if (rebuild) mc.reset();

      const headR = dropSize * (0.55 + agent.seed * 0.15);

      if (agent.state === 'crawl') {
        agent.u += crawlSpeed * dt;
        if (agent.u >= pts.length - 1) {
          agent.u = pts.length - 1;
          agent.state = 'pool';
          agent.t = 0;
        }
        const idx = Math.floor(agent.u);
        if (rebuild && idx >= tailStart) {
          const head = pts[idx];
          addBall(head.x, head.y, head.z, headR);
          // Fading trail behind the head — a runnel, not a bead.
          for (let k = 1; k <= config.trailLength; k += 1) {
            const ti = idx - k * 2;
            if (ti < tailStart) break;
            const p = pts[ti];
            const fade = 1 - k / (config.trailLength + 1);
            addBall(p.x, p.y, p.z, headR * (0.45 + 0.35 * fade));
          }
        }
      } else if (agent.state === 'pool') {
        agent.t += dt;
        const g = Math.min(agent.t / poolDur, 1);
        if (rebuild) addBall(d.x, d.y, d.z, dropSize * (0.55 + 0.45 * g));
        if (g >= 1) {
          agent.state = 'stretch';
          agent.t = 0;
        }
      } else if (agent.state === 'stretch') {
        agent.t += dt;
        const q = Math.min(agent.t / stretchDur, 1);
        const sag = strandLen * q ** 1.7;
        const bulbR = dropSize * (0.85 + 0.15 * q);
        if (rebuild) {
          // Anchor pool drains as mass moves into the hanging drop.
          addBall(d.x, d.y, d.z, dropSize * (0.95 - 0.4 * q));
          // Hanging chain: thinning neck above, round bulb at the bottom.
          for (let k = 0; k < CHAIN; k += 1) {
            const f = k / (CHAIN - 1);
            const yk = d.y - sag * f ** 1.4;
            const neck = dropSize * 0.4 * (1 - 0.68 * q);
            const r = neck + (bulbR - neck) * f ** 2;
            addBall(d.x, yk, d.z, Math.max(r, dropSize * 0.14));
          }
        }
        if (q >= 1) {
          const fl = falling.current;
          fl.list[fl.cursor % MAX_DROPS] = {
            x: d.x,
            z: d.z,
            y0: d.y - sag,
            t0: now,
            r: bulbR * 0.95,
          };
          fl.cursor += 1;
          agent.state = 'crawl';
          // Restart just above the volume so the runnel is visible as it
          // slides back in — time spent outside the volume is dead air.
          agent.u = Math.max(
            tailStart - (config.trailLength + 4) * 2,
            tailStart - rand(fl.cursor * 7.7) * 30
          );
        }
      }

      if (rebuild) mc.update();
    }

    // ── Falling drops (instanced spheres, capillary wobble) ────────────
    const drops = dropsRef.current;
    if (drops) {
      const { list } = falling.current;
      for (let i = 0; i < MAX_DROPS; i += 1) {
        const dr = list[i];
        if (!dr) {
          drops.setMatrixAt(i, HIDDEN);
          // eslint-disable-next-line no-continue
          continue;
        }
        const f = now - dr.t0;
        const y = dr.y0 - 0.5 * GRAVITY * config.fallSpeed * f * f;
        if (y - dr.r <= floorY) {
          list[i] = null;
          drops.setMatrixAt(i, HIDDEN);
        } else {
          const osc = 1 + 0.12 * Math.exp(-3 * f) * Math.sin(40 * f);
          tmpObj.position.set(dr.x, y, dr.z);
          tmpObj.scale.set(
            dr.r / Math.sqrt(osc),
            dr.r * osc,
            dr.r / Math.sqrt(osc)
          );
          tmpObj.updateMatrix();
          drops.setMatrixAt(i, tmpObj.matrix);
        }
      }
      drops.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {volumes.map((v, i) => (
        <primitive
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          object={v.mc}
          position={[v.center.x, v.center.y, v.center.z]}
          scale={VOLUME_HALF}
        />
      ))}
      <instancedMesh
        ref={dropsRef}
        args={[undefined, material, MAX_DROPS]}
        castShadow
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 16, 16]} />
      </instancedMesh>
    </>
  );
}
