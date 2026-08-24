/* eslint-disable no-underscore-dangle, no-plusplus, no-continue */
import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  Break,
  Continue,
  Fn,
  If,
  Loop,
  cameraPosition,
  dot,
  float,
  floor,
  fract,
  int,
  max,
  min,
  mix,
  positionWorld,
  smoothstep,
  uniform,
  uniformArray,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const MAX_CP = 8;
const MAX_STEPS = 128;
const DEFAULT_CP_COUNT = 5;

function makeControlPointPool(count) {
  return Array.from({ length: count }, () => ({
    pos: new THREE.Vector3(),
    scale: new THREE.Vector3(1, 1, 1),
    rot: new THREE.Quaternion(),
  }));
}

function fillControlPoints(pool, height, width, depth, bendX, bendZ) {
  const halfH = height / 2;

  for (let i = 0; i < pool.length; i++) {
    const t = i / (pool.length - 1);
    const lean = t * t;
    const w = width * (1 - t * 0.25);
    const d = depth * (1 - t * 0.25);

    pool[i].pos.set(bendX * lean, -halfH + t * height, bendZ * lean);
    pool[i].scale.set(w, 1, d);
  }
}

function createRaymarchMaterial(uniforms) {
  const hash13 = Fn(([pInput]) => {
    const p = vec3(pInput).toVar();

    p.assign(fract(p.mul(0.1031)));
    p.addAssign(dot(p, p.zyx.add(31.32)));

    return fract(p.x.add(p.y).mul(p.z));
  });

  const hash33 = Fn(([pInput]) => {
    const p = vec3(
      dot(pInput, vec3(127.1, 311.7, 74.7)),
      dot(pInput, vec3(269.5, 183.3, 246.1)),
      dot(pInput, vec3(113.5, 271.9, 124.6))
    );

    return fract(p.sin().mul(43758.5453123)).mul(2).sub(1);
  });

  const gnoise = Fn(([pInput]) => {
    const i = floor(pInput).toVar();
    const f = fract(pInput).toVar();
    const u = f
      .mul(f)
      .mul(vec3(3).sub(f.mul(2)))
      .toVar();

    return mix(
      mix(
        mix(
          dot(hash33(i.add(vec3(0, 0, 0))), f.sub(vec3(0, 0, 0))),
          dot(hash33(i.add(vec3(1, 0, 0))), f.sub(vec3(1, 0, 0))),
          u.x
        ),
        mix(
          dot(hash33(i.add(vec3(0, 1, 0))), f.sub(vec3(0, 1, 0))),
          dot(hash33(i.add(vec3(1, 1, 0))), f.sub(vec3(1, 1, 0))),
          u.x
        ),
        u.y
      ),
      mix(
        mix(
          dot(hash33(i.add(vec3(0, 0, 1))), f.sub(vec3(0, 0, 1))),
          dot(hash33(i.add(vec3(1, 0, 1))), f.sub(vec3(1, 0, 1))),
          u.x
        ),
        mix(
          dot(hash33(i.add(vec3(0, 1, 1))), f.sub(vec3(0, 1, 1))),
          dot(hash33(i.add(vec3(1, 1, 1))), f.sub(vec3(1, 1, 1))),
          u.x
        ),
        u.y
      ),
      u.z
    );
  });

  const turbulence = Fn(([pInput]) => {
    const sum = float(0).toVar();
    const freq = float(1).toVar();
    const amp = float(1).toVar();

    Loop({ start: int(0), end: int(5), type: 'int', condition: '<' }, () => {
      sum.addAssign(gnoise(pInput.mul(freq)).abs().mul(amp));
      freq.mulAssign(uniforms.lacunarity);
      amp.mulAssign(uniforms.gain);
    });

    return sum;
  });

  const sampleEnvelope = Fn(([pInput]) => {
    const inside = float(0).toVar();
    const height = float(0).toVar();

    If(uniforms.cpCount.lessThan(int(2)), () => {
      const c = uniforms.boundsMin.add(uniforms.boundsMax).mul(0.5).toVar();
      const h = pInput.y
        .sub(uniforms.boundsMin.y)
        .div(max(0.001, uniforms.boundsMax.y.sub(uniforms.boundsMin.y)))
        .toVar();
      const r = pInput.xz
        .sub(c.xz)
        .length()
        .div(
          max(0.001, uniforms.boundsMax.x.sub(uniforms.boundsMin.x).mul(0.5))
        )
        .toVar();
      const taper = mix(1.0, 0.12, h.mul(h)).toVar();

      height.assign(h.clamp(0, 1));
      inside.assign(
        smoothstep(1.0, 0.6, r.div(taper))
          .mul(smoothstep(-0.05, 0.1, h))
          .mul(smoothstep(1.1, 0.85, h))
      );
    }).Else(() => {
      const bestDist = float(1e10).toVar();
      const bestT = float(0).toVar();
      const bestScale = vec3(1, 1, 1).toVar();
      const totalLen = float(0).toVar();

      Loop(
        { start: int(0), end: int(MAX_CP - 1), type: 'int', condition: '<' },
        ({ i }) => {
          If(i.greaterThanEqual(uniforms.cpCount.sub(int(1))), () => Break());

          totalLen.addAssign(
            uniforms.cpPos
              .element(i.add(int(1)))
              .sub(uniforms.cpPos.element(i))
              .length()
          );
        }
      );

      If(totalLen.lessThan(0.001), () => totalLen.assign(1.0));

      const cumLen = float(0).toVar();

      Loop(
        { start: int(0), end: int(MAX_CP - 1), type: 'int', condition: '<' },
        ({ i }) => {
          If(i.greaterThanEqual(uniforms.cpCount.sub(int(1))), () => Break());

          const a = uniforms.cpPos.element(i).toVar();
          const b = uniforms.cpPos.element(i.add(int(1))).toVar();
          const ab = b.sub(a).toVar();
          const segLen = ab.length().toVar();

          If(segLen.lessThan(0.0001), () => {
            cumLen.addAssign(segLen);
            Continue();
          });

          const t = dot(pInput.sub(a), ab)
            .div(max(0.0001, dot(ab, ab)))
            .clamp(0, 1)
            .toVar();
          const d = pInput
            .sub(a.add(ab.mul(t)))
            .length()
            .toVar();

          If(d.lessThan(bestDist), () => {
            bestDist.assign(d);
            bestT.assign(cumLen.add(t.mul(segLen)).div(totalLen));
            bestScale.assign(
              mix(
                uniforms.cpScale.element(i),
                uniforms.cpScale.element(i.add(int(1))),
                t
              )
            );
          });

          cumLen.addAssign(segLen);
        }
      );

      const maxR = max(max(bestScale.x, bestScale.z).mul(0.5), 0.001).toVar();
      const taper = mix(1.0, 0.06, bestT.mul(bestT)).toVar();
      const normR = bestDist.div(maxR.mul(taper)).toVar();

      height.assign(bestT.clamp(0, 1));
      inside.assign(
        smoothstep(1.0, 0.4, normR)
          .mul(smoothstep(-0.02, 0.08, bestT))
          .mul(smoothstep(1.05, 0.82, bestT))
      );
    });

    return vec2(inside, height);
  });

  const fireColor = Fn(([rcInput]) => {
    const color = vec3(0, 0, 0).toVar();

    If(rcInput.greaterThan(0.65), () => {
      color.assign(
        mix(
          uniforms.borderColor,
          uniforms.coreColor,
          rcInput.sub(0.65).div(0.35).clamp(0, 1)
        )
      );
    })
      .ElseIf(rcInput.greaterThan(0.25), () => {
        color.assign(
          mix(
            uniforms.smokeColor,
            uniforms.borderColor,
            rcInput.sub(0.25).div(0.4).clamp(0, 1)
          )
        );
      })
      .Else(() => {
        color.assign(
          mix(vec3(0, 0, 0), uniforms.smokeColor, rcInput.div(0.25))
        );
      });

    return color;
  });

  const sampleEmbers = Fn(([pInput, timeInput]) => {
    const embers = float(0).toVar();

    If(uniforms.emberDensity.greaterThanEqual(0.001), () => {
      const ep = vec3(pInput).toVar();

      ep.y.subAssign(timeInput.mul(uniforms.speed).mul(1.8));
      ep.mulAssign(3.5).divAssign(max(uniforms.emberSize, 0.01));

      const cell = floor(ep).toVar();

      Loop(
        { start: int(-1), end: int(2), name: 'i', type: 'int', condition: '<' },
        ({ i }) => {
          Loop(
            {
              start: int(-1),
              end: int(2),
              name: 'j',
              type: 'int',
              condition: '<',
            },
            ({ j }) => {
              Loop(
                {
                  start: int(-1),
                  end: int(2),
                  name: 'k',
                  type: 'int',
                  condition: '<',
                },
                ({ k }) => {
                  const nb = cell
                    .add(vec3(i.toFloat(), j.toFloat(), k.toFloat()))
                    .toVar();
                  const prob = hash13(nb).toVar();

                  If(prob.greaterThan(uniforms.emberDensity), () => Continue());

                  const off = hash33(nb.add(97)).mul(0.5).add(0.5).toVar();
                  const d = ep.sub(nb.add(off)).length().toVar();

                  embers.addAssign(smoothstep(0.28, 0.0, d));
                }
              );
            }
          );
        }
      );
    });

    return embers.clamp(0, 1);
  });

  const boxHit = Fn(([roInput, rdInput, minInput, maxInput]) => {
    const inv = rdInput.reciprocal().toVar();
    const t0 = minInput.sub(roInput).mul(inv).toVar();
    const t1 = maxInput.sub(roInput).mul(inv).toVar();
    const tMin = min(t0, t1).toVar();
    const tMax = max(t0, t1).toVar();

    return vec2(
      max(tMin.x, max(tMin.y, tMin.z)),
      min(tMax.x, min(tMax.y, tMax.z))
    );
  });

  const raymarch = Fn(() => {
    const wRo = cameraPosition.toVar();
    const wRd = positionWorld.sub(cameraPosition).normalize().toVar();
    const fRo = uniforms.invGroupWorld.mul(vec4(wRo, 1.0)).xyz.toVar();
    const fRd = uniforms.invGroupWorld
      .mul(vec4(wRd, 0.0))
      .xyz.normalize()
      .toVar();
    const hit = boxHit(
      fRo,
      fRd,
      uniforms.boundsMin,
      uniforms.boundsMax
    ).toVar();

    hit.x.assign(max(hit.x, 0.0));
    const accColor = vec3(0, 0, 0).toVar();
    const accAlpha = float(0).toVar();

    If(hit.x.lessThan(hit.y), () => {
      const diag = uniforms.boundsMax.sub(uniforms.boundsMin).length().toVar();
      const stepSz = uniforms.stepSize
        .mul(diag)
        .div(uniforms.steps.toFloat())
        .toVar();
      const jitter = hash13(
        positionWorld.mul(743.7).add(vec3(uniforms.time.mul(0.1)))
      )
        .mul(stepSz)
        .toVar();

      Loop(
        { start: int(0), end: int(MAX_STEPS), type: 'int', condition: '<' },
        ({ i }) => {
          If(i.greaterThanEqual(uniforms.steps), () => Break());

          const t = hit.x.add(jitter).add(i.toFloat().mul(stepSz)).toVar();

          If(t.greaterThan(hit.y), () => Break());

          const fp = fRo.add(fRd.mul(t)).toVar();
          const env = sampleEnvelope(fp).toVar();

          If(env.x.lessThan(0.001), () => Continue());

          const np = vec3(fp).toVar();

          np.y.subAssign(uniforms.time.mul(uniforms.speed));
          np.mulAssign(vec3(2.0, 1.5, 2.0));

          const tb = turbulence(np).mul(uniforms.magnitude).toVar();
          const rc = float(1).sub(env.y).toVar();

          rc.assign(rc.mul(rc));
          rc.addAssign(tb.mul(0.15).mul(float(1).sub(env.y)));
          rc.mulAssign(env.x);
          rc.assign(rc.clamp(0, 1));

          const dn = vec2(env.x, env.y).x.toVar();

          dn.mulAssign(smoothstep(0.0, 0.12, env.y));
          dn.mulAssign(float(1).sub(tb.mul(0.3).mul(env.y)));
          dn.assign(dn.clamp(0, 1).mul(uniforms.density).mul(stepSz).mul(16.0));

          const col = fireColor(rc)
            .mul(uniforms.tintColor)
            .mul(uniforms.brightness)
            .toVar();
          const lm = dot(col, vec3(0.2126, 0.7152, 0.0722)).toVar();

          col.assign(mix(vec3(lm, lm, lm), col, uniforms.saturation));
          col.addAssign(
            uniforms.coreColor
              .mul(smoothstep(0.55, 1.0, rc))
              .mul(env.x)
              .mul(0.6)
          );

          const em = sampleEmbers(fp, uniforms.time)
            .mul(smoothstep(0.25, 0.75, env.y))
            .toVar();

          col.addAssign(uniforms.emberColor.mul(em).mul(2.5));
          dn.addAssign(em.mul(0.4).mul(uniforms.density).mul(stepSz));

          const a = dn.clamp(0, 1).mul(float(1).sub(accAlpha)).toVar();

          accColor.addAssign(col.mul(a));
          accAlpha.addAssign(a);

          If(accAlpha.greaterThan(0.97), () => Break());
        }
      );
    });

    return vec4(accColor, accAlpha);
  })();

  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
  });

  material.colorNode = raymarch.rgb;
  material.opacityNode = raymarch.a;
  material.uniforms = uniforms;

  return material;
}

const _v3a = new THREE.Vector3();
const _v3b = new THREE.Vector3();
const _v3c = new THREE.Vector3();
const _v3d = new THREE.Vector3();
const _bMin = new THREE.Vector3();
const _bMax = new THREE.Vector3();
const _center = new THREE.Vector3();
const _size = new THREE.Vector3();
const _invMat = new THREE.Matrix4();

export default function CS184VolumetricFireGPU({
  position = [0, 0, 0],
  inverted = false,
  width = 0.5,
  height = 1.5,
  depth = 0.5,
  bendX = 0,
  bendZ = 0,
  animated = true,
  animSpeed = 0.5,
  magnitude = 1.3,
  lacunarity = 2.0,
  gain = 0.5,
  speed = 0.8,
  density = 1.2,
  brightness = 1.8,
  saturation = 1.0,
  tintColor = '#ffffff',
  coreColor = '#ffffcc',
  borderColor = '#ff6600',
  smokeColor = '#330000',
  emberDensity = 0.15,
  emberSize = 0.25,
  emberColor = '#ff4400',
  steps = 64,
  stepSize = 1.0,
  controlPoints = null,
}) {
  const meshRef = useRef();
  const groupRef = useRef();
  const animTimeRef = useRef(0);
  const baseBendRef = useRef({ x: bendX, z: bendZ });
  const cpPoolRef = useRef(null);
  const cpPosStoreRef = useRef(
    Array.from({ length: MAX_CP }, () => new THREE.Vector3())
  );
  const cpScaleStoreRef = useRef(
    Array.from({ length: MAX_CP }, () => new THREE.Vector3(1, 1, 1))
  );

  if (!cpPoolRef.current) {
    cpPoolRef.current = makeControlPointPool(DEFAULT_CP_COUNT);
  }

  const uniforms = useMemo(
    () => ({
      time: uniform(0),
      invGroupWorld: uniform(new THREE.Matrix4()),
      boundsMin: uniform(new THREE.Vector3(-0.5, -0.75, -0.5)),
      boundsMax: uniform(new THREE.Vector3(0.5, 0.75, 0.5)),
      magnitude: uniform(magnitude),
      lacunarity: uniform(lacunarity),
      gain: uniform(gain),
      speed: uniform(speed),
      density: uniform(density),
      brightness: uniform(brightness),
      saturation: uniform(saturation),
      tintColor: uniform(new THREE.Color(tintColor)),
      coreColor: uniform(new THREE.Color(coreColor)),
      borderColor: uniform(new THREE.Color(borderColor)),
      smokeColor: uniform(new THREE.Color(smokeColor)),
      emberDensity: uniform(emberDensity),
      emberSize: uniform(emberSize),
      emberColor: uniform(new THREE.Color(emberColor)),
      steps: uniform(steps, 'int'),
      stepSize: uniform(stepSize),
      cpCount: uniform(0, 'int'),
      cpPos: uniformArray(cpPosStoreRef.current, 'vec3'),
      cpScale: uniformArray(cpScaleStoreRef.current, 'vec3'),
    }),
    []
  );

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(() => createRaymarchMaterial(uniforms), [uniforms]);

  useEffect(() => {
    uniforms.magnitude.value = magnitude;
    uniforms.lacunarity.value = lacunarity;
    uniforms.gain.value = gain;
    uniforms.speed.value = speed;
    uniforms.density.value = density;
    uniforms.brightness.value = brightness;
    uniforms.saturation.value = saturation;
    uniforms.tintColor.value.set(tintColor);
    uniforms.coreColor.value.set(coreColor);
    uniforms.borderColor.value.set(borderColor);
    uniforms.smokeColor.value.set(smokeColor);
    uniforms.emberDensity.value = emberDensity;
    uniforms.emberSize.value = emberSize;
    uniforms.emberColor.value.set(emberColor);
    uniforms.steps.value = steps;
    uniforms.stepSize.value = stepSize;
  }, [
    borderColor,
    brightness,
    coreColor,
    density,
    emberColor,
    emberDensity,
    emberSize,
    gain,
    lacunarity,
    magnitude,
    saturation,
    smokeColor,
    speed,
    steps,
    stepSize,
    tintColor,
    uniforms,
  ]);

  useEffect(() => {
    baseBendRef.current = { x: bendX, z: bendZ };
  }, [bendX, bendZ]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useFrame(({ clock }, delta) => {
    uniforms.time.value = clock.getElapsedTime();

    let pts;

    if (controlPoints && controlPoints.length >= 2) {
      pts = controlPoints;
    } else {
      let bx = baseBendRef.current.x;
      let bz = baseBendRef.current.z;

      if (animated) {
        animTimeRef.current += delta * animSpeed;

        const t = animTimeRef.current;

        bx += Math.sin(t * 0.8) * 0.14 + Math.sin(t * 2.1 + 0.5) * 0.04;
        bz += Math.cos(t * 0.65 + 1.2) * 0.07 + Math.cos(t * 1.7) * 0.03;
      }

      fillControlPoints(cpPoolRef.current, height, width, depth, bx, bz);
      pts = cpPoolRef.current;
    }

    const count = Math.min(pts.length, MAX_CP);

    uniforms.cpCount.value = count;

    _bMin.set(Infinity, Infinity, Infinity);
    _bMax.set(-Infinity, -Infinity, -Infinity);

    for (let i = 0; i < count; i++) {
      const cp = pts[i];
      const cpPos = cp.pos ?? cp.position ?? cp;
      const cpScale = cp.scale ?? [1, 1, 1];

      if (cpPos instanceof THREE.Vector3) {
        _v3a.copy(cpPos);
      } else if (Array.isArray(cpPos)) {
        _v3a.set(cpPos[0] || 0, cpPos[1] || 0, cpPos[2] || 0);
      } else {
        _v3a.set(cpPos.x || 0, cpPos.y || 0, cpPos.z || 0);
      }

      if (cpScale instanceof THREE.Vector3) {
        _v3b.copy(cpScale);
      } else if (Array.isArray(cpScale)) {
        _v3b.set(cpScale[0] || 1, cpScale[1] || 1, cpScale[2] || 1);
      } else {
        _v3b.set(cpScale.x || 1, cpScale.y || 1, cpScale.z || 1);
      }

      cpPosStoreRef.current[i].copy(_v3a);
      cpScaleStoreRef.current[i].copy(_v3b);

      const pad = Math.max(_v3b.x, _v3b.z) * 0.75;

      _v3c.copy(_v3a).addScalar(-pad);
      _v3d.copy(_v3a).addScalar(pad);
      _bMin.min(_v3c);
      _bMax.max(_v3d);
    }

    _bMin.y -= 0.15;
    _bMax.y += height * 0.35;
    _bMin.x -= 0.35;
    _bMin.z -= 0.35;
    _bMax.x += 0.35;
    _bMax.z += 0.35;

    uniforms.boundsMin.value.copy(_bMin);
    uniforms.boundsMax.value.copy(_bMax);

    if (meshRef.current) {
      _center.addVectors(_bMin, _bMax).multiplyScalar(0.5);
      _size.subVectors(_bMax, _bMin);

      meshRef.current.position.copy(_center);
      meshRef.current.scale.set(
        Math.max(_size.x, 0.01),
        Math.max(_size.y, 0.01),
        Math.max(_size.z, 0.01)
      );
    }

    if (groupRef.current) {
      groupRef.current.updateWorldMatrix(true, false);
      _invMat.copy(groupRef.current.matrixWorld).invert();
      uniforms.invGroupWorld.value.copy(_invMat);
    }
  });

  const halfH = controlPoints ? 0 : height / 2;

  return (
    <group
      position={position}
      rotation={inverted ? [Math.PI, 0, 0] : [0, 0, 0]}
    >
      <group ref={groupRef} position={[0, halfH, 0]}>
        <mesh
          ref={meshRef}
          geometry={geometry}
          material={material}
          frustumCulled={false}
        />
      </group>
    </group>
  );
}
