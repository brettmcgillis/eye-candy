import * as THREE from 'three';

import { radians } from '@utils/math';

function applyShadow(light, slot) {
  const { shadow } = slot;
  const lightShadow = light.shadow;

  lightShadow.mapSize.set(shadow.mapSize, shadow.mapSize);
  lightShadow.bias = shadow.bias;
  lightShadow.normalBias = shadow.normalBias;
  if (shadow.radius != null) lightShadow.radius = shadow.radius;
  if (shadow.intensity != null) lightShadow.intensity = shadow.intensity;
  lightShadow.camera.near = shadow.near;
  lightShadow.camera.far = shadow.far;

  if (slot.type === 'directional') {
    lightShadow.camera.left = -shadow.extent;
    lightShadow.camera.right = shadow.extent;
    lightShadow.camera.top = shadow.extent;
    lightShadow.camera.bottom = -shadow.extent;
  }

  lightShadow.camera.updateProjectionMatrix();
}

function createLight(slot) {
  switch (slot.type) {
    case 'ambient':
      return new THREE.AmbientLight(slot.color, slot.intensity);
    case 'hemisphere':
      return new THREE.HemisphereLight(
        slot.skyColor ?? slot.color,
        slot.groundColor,
        slot.intensity
      );
    case 'directional':
      return new THREE.DirectionalLight(slot.color, slot.intensity);
    case 'point':
      return new THREE.PointLight(
        slot.color,
        slot.intensity,
        slot.distance,
        slot.decay
      );
    case 'spot':
      return new THREE.SpotLight(
        slot.color,
        slot.intensity,
        slot.distance,
        radians(slot.angle),
        slot.penumbra,
        slot.decay
      );
    default:
      return null;
  }
}

// The imperative twin of <LightingRig>, for renderers with no React tree (the
// headless CLIs). Takes the same runtime config buildSceneLightingRuntimeConfig
// returns and hands back a group of real lights. rectArea slots are skipped:
// their LTC tables load asynchronously through the canvas.
export default function createSceneLights(lighting, { shadows = true } = {}) {
  const group = new THREE.Group();
  if (!lighting?.enabled) return group;

  lighting.slots
    .filter((slot) => slot.enabled)
    .forEach((slot) => {
      const light = createLight(slot);
      if (!light) return;

      // A hemisphere light's direction is its position; LightSlots never sets
      // one, and the declared origin would normalize to NaN.
      if (slot.position && !['ambient', 'hemisphere'].includes(slot.type)) {
        light.position.set(...slot.position);
      }
      if (slot.layer?.channel !== undefined) {
        if (slot.layer.mode === 'enable')
          light.layers.enable(slot.layer.channel);
        else light.layers.set(slot.layer.channel);
      }
      if (slot.shadow && shadows && light.shadow) {
        light.castShadow = true;
        applyShadow(light, slot);
      }
      if (light.target) {
        light.target.position.set(...(slot.target ?? [0, 0, 0]));
        group.add(light.target);
      }
      group.add(light);
    });

  return group;
}
