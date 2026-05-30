import { uniform, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import createBlackHoleShader from './blackHoleShader';
import createBlackHoleVolumeShader from './blackHoleVolumeShader';

export const BLACK_HOLE_BODY_COUNT = 3;

function createBodyUniforms() {
  return Array.from({ length: BLACK_HOLE_BODY_COUNT }, () => ({
    position: uniform(new THREE.Vector3(0, 0, 0)),
    color: uniform(new THREE.Color('#ffffff')),
    radius: uniform(1),
    enabled: uniform(0),
  }));
}

function createUniforms(config, size) {
  return {
    blackHoleMass: uniform(config.blackHoleMass ?? 1),
    diskInnerRadius: uniform(config.diskInnerRadius ?? 3),
    diskOuterRadius: uniform(config.diskOuterRadius ?? 12),
    diskTemperature: uniform(config.diskTemperature ?? 10),
    temperatureFalloff: uniform(config.temperatureFalloff ?? 0.75),
    diskBrightness: uniform(config.diskBrightness ?? 2),
    diskOpacity: uniform(config.diskOpacity ?? 1),
    diskOpacityFloor: uniform(config.diskOpacityFloor ?? 0),
    diskInnerColor: uniform(
      new THREE.Color(config.diskInnerColor ?? '#ffffff')
    ),
    diskMidColor: uniform(new THREE.Color(config.diskMidColor ?? '#ffffff')),
    diskOuterColor: uniform(
      new THREE.Color(config.diskOuterColor ?? '#ffffff')
    ),
    diskTintStrength: uniform(config.diskTintStrength ?? 0),
    diskRotationSpeed: uniform(config.diskRotationSpeed ?? 0.3),
    turbulenceScale: uniform(config.turbulenceScale ?? 1),
    turbulenceStretch: uniform(config.turbulenceStretch ?? 5),
    turbulenceSharpness: uniform(config.turbulenceSharpness ?? 1),
    turbulenceCycleTime: uniform(config.turbulenceCycleTime ?? 10),
    turbulenceLacunarity: uniform(config.turbulenceLacunarity ?? 2),
    turbulencePersistence: uniform(config.turbulencePersistence ?? 0.5),
    diskEdgeSoftnessInner: uniform(config.diskEdgeSoftnessInner ?? 0.15),
    diskEdgeSoftnessOuter: uniform(config.diskEdgeSoftnessOuter ?? 0.15),
    gravitationalLensing: uniform(config.gravitationalLensing ?? 1.5),
    dopplerStrength: uniform(config.dopplerStrength ?? 1),
    stepSize: uniform(config.stepSize ?? 0.3),
    raySteps: uniform(Math.max(1, Math.round(config.raySteps ?? 64)), 'int'),
    maxRayDistance: uniform(config.maxRayDistance ?? 100),
    starsEnabled: uniform(config.starsEnabled ? 1 : 0),
    starBackgroundColor: uniform(
      new THREE.Color(config.starBackgroundColor ?? '#000000')
    ),
    starDensity: uniform(config.starDensity ?? 0.003),
    starSize: uniform(config.starSize ?? 2),
    starBrightness: uniform(config.starBrightness ?? 1),
    nebulaEnabled: uniform(config.nebulaEnabled ? 1 : 0),
    nebula1Scale: uniform(config.nebula1Scale ?? 2),
    nebula1Density: uniform(config.nebula1Density ?? 0.5),
    nebula1Brightness: uniform(config.nebula1Brightness ?? 0.15),
    nebula1Color: uniform(new THREE.Color(config.nebula1Color ?? '#1a0033')),
    nebula2Scale: uniform(config.nebula2Scale ?? 6),
    nebula2Density: uniform(config.nebula2Density ?? 0.5),
    nebula2Brightness: uniform(config.nebula2Brightness ?? 0.15),
    nebula2Color: uniform(new THREE.Color(config.nebula2Color ?? '#4d1a26')),
    backgroundOpacity: uniform(config.backgroundOpacity ?? 1),
    time: uniform(0),
    resolution: uniform(new THREE.Vector2(size.width, size.height)),
    cameraPosition: uniform(new THREE.Vector3(0, 0, 20)),
    cameraTarget: uniform(new THREE.Vector3(0, 0, 0)),
    tanHalfFov: uniform(Math.tan(THREE.MathUtils.degToRad(60) * 0.5)),
    cameraInside: uniform(0),
    bodies: createBodyUniforms(),
  };
}

export function createBlackHoleGeometry() {
  const geometry = new THREE.SphereGeometry(100, 32, 32);
  geometry.scale(-1, 1, 1);
  return geometry;
}

export class BlackHoleSimulation {
  constructor(config, size) {
    this.cameraDirection = new THREE.Vector3();
    this.cameraTarget = new THREE.Vector3();
    this.localCameraPosition = new THREE.Vector3();
    this.localCameraTarget = new THREE.Vector3();
    this.uniforms = createUniforms(config, size);
  }

  createMaterial() {
    const material = new THREE.MeshBasicNodeMaterial();
    material.colorNode = createBlackHoleShader(this.uniforms);
    return material;
  }

  // In-scene volumetric material (Tier 1). Drawn over the store with the bright
  // disk/core; transparent where rays escape so the store shows through. The
  // shader writes the per-pixel depth of the first hit (depthNode), so store
  // geometry occludes the hole (and vice-versa) via the normal depth test.
  createVolumeMaterial() {
    const material = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.FrontSide,
    });
    const result = createBlackHoleVolumeShader(this.uniforms);
    const colorOut = result.get('color');
    material.colorNode = colorOut.rgb;
    material.opacityNode = colorOut.a;
    material.depthNode = result.get('depth');
    return material;
  }

  createMaskMaterial() {
    const material = new THREE.MeshBasicNodeMaterial({
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    });
    const shaderNode = createBlackHoleShader(this.uniforms);
    material.colorNode = vec3(shaderNode.a);
    return material;
  }

  updateUniforms(config) {
    const u = this.uniforms;

    if (config.blackHoleMass !== undefined) {
      u.blackHoleMass.value = config.blackHoleMass;
    }
    if (config.diskInnerRadius !== undefined) {
      u.diskInnerRadius.value = config.diskInnerRadius;
    }
    if (config.diskOuterRadius !== undefined) {
      u.diskOuterRadius.value = config.diskOuterRadius;
    }
    if (config.diskTemperature !== undefined) {
      u.diskTemperature.value = config.diskTemperature;
    }
    if (config.temperatureFalloff !== undefined) {
      u.temperatureFalloff.value = config.temperatureFalloff;
    }
    if (config.diskBrightness !== undefined) {
      u.diskBrightness.value = config.diskBrightness;
    }
    if (config.diskOpacity !== undefined) {
      u.diskOpacity.value = config.diskOpacity;
    }
    if (config.diskOpacityFloor !== undefined) {
      u.diskOpacityFloor.value = config.diskOpacityFloor;
    }
    if (config.diskInnerColor !== undefined) {
      u.diskInnerColor.value.set(config.diskInnerColor);
    }
    if (config.diskMidColor !== undefined) {
      u.diskMidColor.value.set(config.diskMidColor);
    }
    if (config.diskOuterColor !== undefined) {
      u.diskOuterColor.value.set(config.diskOuterColor);
    }
    if (config.diskTintStrength !== undefined) {
      u.diskTintStrength.value = config.diskTintStrength;
    }
    if (config.diskRotationSpeed !== undefined) {
      u.diskRotationSpeed.value = config.diskRotationSpeed;
    }
    if (config.turbulenceScale !== undefined) {
      u.turbulenceScale.value = config.turbulenceScale;
    }
    if (config.turbulenceStretch !== undefined) {
      u.turbulenceStretch.value = config.turbulenceStretch;
    }
    if (config.turbulenceSharpness !== undefined) {
      u.turbulenceSharpness.value = config.turbulenceSharpness;
    }
    if (config.turbulenceCycleTime !== undefined) {
      u.turbulenceCycleTime.value = config.turbulenceCycleTime;
    }
    if (config.turbulenceLacunarity !== undefined) {
      u.turbulenceLacunarity.value = config.turbulenceLacunarity;
    }
    if (config.turbulencePersistence !== undefined) {
      u.turbulencePersistence.value = config.turbulencePersistence;
    }
    if (config.diskEdgeSoftnessInner !== undefined) {
      u.diskEdgeSoftnessInner.value = config.diskEdgeSoftnessInner;
    }
    if (config.diskEdgeSoftnessOuter !== undefined) {
      u.diskEdgeSoftnessOuter.value = config.diskEdgeSoftnessOuter;
    }
    if (config.gravitationalLensing !== undefined) {
      u.gravitationalLensing.value = config.gravitationalLensing;
    }
    if (config.dopplerStrength !== undefined) {
      u.dopplerStrength.value = config.dopplerStrength;
    }
    if (config.stepSize !== undefined) {
      u.stepSize.value = config.stepSize;
    }
    if (config.raySteps !== undefined) {
      u.raySteps.value = Math.max(1, Math.round(config.raySteps));
    }
    if (config.maxRayDistance !== undefined) {
      u.maxRayDistance.value = config.maxRayDistance;
    }
    if (config.starsEnabled !== undefined) {
      u.starsEnabled.value = config.starsEnabled ? 1 : 0;
    }
    if (config.starBackgroundColor !== undefined) {
      u.starBackgroundColor.value.set(config.starBackgroundColor);
    }
    if (config.starDensity !== undefined) {
      u.starDensity.value = config.starDensity;
    }
    if (config.starSize !== undefined) {
      u.starSize.value = config.starSize;
    }
    if (config.starBrightness !== undefined) {
      u.starBrightness.value = config.starBrightness;
    }
    if (config.nebulaEnabled !== undefined) {
      u.nebulaEnabled.value = config.nebulaEnabled ? 1 : 0;
    }
    if (config.nebula1Scale !== undefined) {
      u.nebula1Scale.value = config.nebula1Scale;
    }
    if (config.nebula1Density !== undefined) {
      u.nebula1Density.value = config.nebula1Density;
    }
    if (config.nebula1Brightness !== undefined) {
      u.nebula1Brightness.value = config.nebula1Brightness;
    }
    if (config.nebula1Color !== undefined) {
      u.nebula1Color.value.set(config.nebula1Color);
    }
    if (config.nebula2Scale !== undefined) {
      u.nebula2Scale.value = config.nebula2Scale;
    }
    if (config.nebula2Density !== undefined) {
      u.nebula2Density.value = config.nebula2Density;
    }
    if (config.nebula2Brightness !== undefined) {
      u.nebula2Brightness.value = config.nebula2Brightness;
    }
    if (config.nebula2Color !== undefined) {
      u.nebula2Color.value.set(config.nebula2Color);
    }
    if (config.backgroundOpacity !== undefined) {
      u.backgroundOpacity.value = config.backgroundOpacity;
    }
  }

  update(deltaTime, camera, worldToLocalMatrix) {
    this.uniforms.time.value += deltaTime;
    this.uniforms.tanHalfFov.value = Math.tan(
      THREE.MathUtils.degToRad(
        typeof camera.getEffectiveFOV === 'function'
          ? camera.getEffectiveFOV()
          : (camera.fov ?? 60)
      ) * 0.5
    );

    this.cameraDirection.set(0, 0, -1).applyQuaternion(camera.quaternion);
    this.cameraTarget
      .copy(camera.position)
      .add(this.cameraDirection.multiplyScalar(10));

    if (worldToLocalMatrix) {
      this.localCameraPosition
        .copy(camera.position)
        .applyMatrix4(worldToLocalMatrix);
      this.localCameraTarget
        .copy(this.cameraTarget)
        .applyMatrix4(worldToLocalMatrix);
      this.uniforms.cameraPosition.value.copy(this.localCameraPosition);
      this.uniforms.cameraTarget.value.copy(this.localCameraTarget);
      return;
    }

    this.uniforms.cameraPosition.value.copy(camera.position);
    this.uniforms.cameraTarget.value.copy(this.cameraTarget);
  }

  onResize(width, height) {
    this.uniforms.resolution.value.set(width, height);
  }
}
