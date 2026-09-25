import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

const FAR_AWAY = 1e5;

const DEFAULTS = {
  backlightStrength: 0,
  bladeBend: 0.3,
  bladeHeight: 0.35,
  bladeWidth: 0.03,
  fadeEnd: 60,
  fadeStart: 40,
  pressReach: 0.12,
  touchRadius: 1.4,
  touchStrength: 0.8,
  windAngle: 0,
  windScale: 0.35,
  windSpeed: 0.6,
  windStrength: 0.35,
};

export function setGrassUniforms(uniforms, values) {
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    const target = uniforms[key];
    if (target.value?.isColor) {
      target.value.set(value);
    } else {
      target.value = value;
    }
  });
}

export function setWindDirection(uniforms, x, z) {
  const { windAngle, windDir } = uniforms;
  windDir.value.set(x, z).normalize();
  windAngle.value = Math.atan2(windDir.value.y, windDir.value.x);
}

export function setBacklightDirection(uniforms, azimuthDeg, elevationDeg) {
  const azimuth = (azimuthDeg * Math.PI) / 180;
  const elevation = (elevationDeg * Math.PI) / 180;
  uniforms.backlightDir.value
    .set(
      -Math.sin(azimuth) * Math.cos(elevation),
      -Math.sin(elevation),
      -Math.cos(azimuth) * Math.cos(elevation)
    )
    .normalize();
}

export function createGrassUniforms({
  fadeCenter,
  touchPosition,
  ...values
} = {}) {
  const uniforms = {
    backlightColor: uniform(new THREE.Color('#ffffff')),
    backlightDir: uniform(new THREE.Vector3(0, -1, 0)),
    fadeCenter: fadeCenter ?? uniform(new THREE.Vector3(0, FAR_AWAY, 0)),
    rootColor: uniform(new THREE.Color('#1f3a14')),
    tipColor: uniform(new THREE.Color('#8fae4a')),
    touchPosition: touchPosition ?? uniform(new THREE.Vector3(FAR_AWAY, 0, 0)),
    windDir: uniform(new THREE.Vector2(1, 0)),
  };
  Object.entries(DEFAULTS).forEach(([key, value]) => {
    uniforms[key] = uniform(value);
  });
  setGrassUniforms(uniforms, values);
  return uniforms;
}
