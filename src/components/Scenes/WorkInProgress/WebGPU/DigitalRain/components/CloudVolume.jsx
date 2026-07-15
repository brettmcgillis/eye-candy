import {
  Break,
  Fn,
  If,
  Loop,
  cameraPosition,
  float,
  length,
  max,
  min,
  normalize,
  positionWorld,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import { beersLaw, marchDirectionalLight } from '../utils/cloudLighting';
import cloudDensity from '../utils/density';

const BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);

// Raymarched volumetric cloud — a port of ~/dev/examples/three-volumetric-
// clouds's CloudMaterial + rayMarch.ts. Renders the BACK faces of a box, so
// each fragment's positionWorld is the ray's exit point; marching from the
// camera to that exit (clamped to the box's near intersection when the
// camera sits outside it) and sampling cloudDensity front-to-back gives
// Beer's-law transmittance + dual-lobe Henyey-Greenstein scattering, additive
// blended like the reference. The reference assumes a unit box and mixes
// world/normalized space as a result — this generalizes to an arbitrary box
// by marching in world space and only normalizing inside cloudDensity.
function CloudVolume({ field, config }) {
  const meshRef = useRef(null);
  const raymarchRef = useRef(null);
  const [renderObject, setRenderObject] = useState(null);

  useEffect(() => {
    const raymarch = {
      boxMin: uniform(new THREE.Vector3()),
      boxMax: uniform(new THREE.Vector3()),
      steps: uniform(48, 'int'),
      lightSteps: uniform(3, 'int'),
      lightStepSize: uniform(1.2),
      densityScale: uniform(1),
      lightAbsorption: uniform(1),
      anisotropy: uniform(0.4),
      phaseMix: uniform(0.4),
      lightPosition: uniform(new THREE.Vector3(-10, 14, 14)),
      lightColor: uniform(new THREE.Color('#ffffff')),
      ambientColor: uniform(new THREE.Color('#ffffff')),
    };

    const march = Fn(() => {
      const ro = cameraPosition;
      const rd = normalize(positionWorld.sub(ro));
      const invDir = vec3(1.0).div(rd);
      const t0 = raymarch.boxMin.sub(ro).mul(invDir);
      const t1 = raymarch.boxMax.sub(ro).mul(invDir);
      const tMinAxis = min(t0, t1);
      const near = max(
        max(max(tMinAxis.x, tMinAxis.y), tMinAxis.z),
        float(0.0)
      );
      const far = length(positionWorld.sub(ro));
      const travel = far.sub(near);

      const lightDir = normalize(ro.sub(raymarch.lightPosition));
      const cosTheta = rd.dot(lightDir);

      const stepSize = travel.div(raymarch.steps.toFloat()).max(0.0005);
      const adaptiveStepSize = stepSize.toVar();
      const depth = float(0.0).toVar();
      const density = float(0.0).toVar();
      const transmittance = float(1.0).toVar();
      const finalColor = vec3(0.0).toVar();
      const hasHit = float(0.0).toVar();

      Loop(raymarch.steps, () => {
        If(depth.greaterThan(travel), () => {
          Break();
        });

        const samplePos = ro.add(rd.mul(near.add(depth)));
        const sampleDensity = cloudDensity({
          worldPos: samplePos,
          field,
        }).saturate();
        density.addAssign(sampleDensity.mul(raymarch.densityScale));

        If(sampleDensity.greaterThan(0.0), () => {
          If(hasHit.equal(0.0), () => {
            hasHit.assign(1.0);
            depth.subAssign(adaptiveStepSize);
            adaptiveStepSize.assign(adaptiveStepSize.mul(0.5));
          }).Else(() => {
            const luminance = marchDirectionalLight({
              samplePos,
              lightDir,
              cosTheta,
              field,
              raymarch,
            });
            finalColor.addAssign(
              raymarch.lightColor.mul(luminance).mul(density).mul(transmittance)
            );
            transmittance.mulAssign(
              beersLaw(density, raymarch.lightAbsorption)
            );
            finalColor.addAssign(
              raymarch.ambientColor.mul(density).mul(transmittance)
            );
          });
        }).Else(() => {
          If(hasHit.equal(1.0), () => {
            hasHit.assign(0.0);
            adaptiveStepSize.assign(stepSize);
          });
        });

        If(density.greaterThanEqual(1.0), () => {
          Break();
        });

        depth.addAssign(adaptiveStepSize);
      });

      return vec4(finalColor, float(1.0).sub(transmittance));
    });

    const result = march().toVar();
    const material = new THREE.MeshBasicNodeMaterial();
    material.colorNode = result.xyz;
    material.opacityNode = result.w.saturate();
    material.transparent = true;
    material.depthWrite = false;
    material.blending = THREE.AdditiveBlending;
    material.side = THREE.BackSide;

    const mesh = new THREE.Mesh(BOX_GEOMETRY, material);
    mesh.frustumCulled = false;

    raymarchRef.current = raymarch;
    meshRef.current = mesh;
    setRenderObject(mesh);

    return () => {
      material.dispose();
      raymarchRef.current = null;
      meshRef.current = null;
    };
  }, [field]);

  useFrame(() => {
    const raymarch = raymarchRef.current;
    const mesh = meshRef.current;
    if (!raymarch || !mesh) {
      return;
    }

    mesh.position.copy(field.center.value);
    mesh.scale.set(
      field.halfSize.value.x * 2,
      field.halfSize.value.y * 2,
      field.halfSize.value.z * 2
    );
    raymarch.boxMin.value.copy(field.center.value).sub(field.halfSize.value);
    raymarch.boxMax.value.copy(field.center.value).add(field.halfSize.value);

    raymarch.steps.value = config.cloudSteps;
    raymarch.lightSteps.value = config.cloudLightSteps;
    raymarch.lightStepSize.value = config.cloudLightStepSize;
    raymarch.densityScale.value = config.cloudDensityScale;
    raymarch.lightAbsorption.value = config.cloudLightAbsorption;
    raymarch.anisotropy.value = config.cloudAnisotropy;
    raymarch.phaseMix.value = config.cloudPhaseMix;
    raymarch.lightPosition.value.set(
      config.cloudLightPosition.x,
      config.cloudLightPosition.y,
      config.cloudLightPosition.z
    );
    raymarch.lightColor.value.set(config.cloudLightColor);
    raymarch.ambientColor.value.set(config.cloudAmbientColor);
  });

  if (!renderObject) {
    return null;
  }

  return <primitive object={renderObject} />;
}

export default memo(CloudVolume);
