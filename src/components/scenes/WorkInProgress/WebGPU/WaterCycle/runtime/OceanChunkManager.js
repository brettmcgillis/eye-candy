import * as THREE from 'three/webgpu';

import OceanChunk from './OceanChunk';
import buildOceanChunkData from './OceanChunkBuilder';
import OceanMaterial from './OceanMaterial';
import SkyDome from './Sky';

const DEFAULT_PALETTE = {
  seaColor: '#01040c',
  horizonColor: '#6b9ed1',
  skyColor: '#143663',
  sunColor: '#ffe6b8',
};

const sharedCameraPosition = new THREE.Vector3();
const sharedScenePosition = new THREE.Vector3();
const sharedPatchOffset = new THREE.Vector3();
const sharedRelativeCameraPosition = new THREE.Vector3();

const DEFAULT_PATCH_SIZE = 160;
const DEFAULT_PATCH_RESOLUTION = 192;
const MIN_PATCH_RESOLUTION = 2;

function getPatchConfig(oceanConfig = {}) {
  return {
    patchResolution: Math.max(
      MIN_PATCH_RESOLUTION,
      Math.round(oceanConfig.patchResolution ?? DEFAULT_PATCH_RESOLUTION)
    ),
    patchSize: oceanConfig.patchSize ?? DEFAULT_PATCH_SIZE,
  };
}

export default class OceanChunkManager {
  constructor(params) {
    this.params = params;
    this.currentConfig = null;
    this.patch = null;
    this.patchVisible = true;
    this.patchSignature = '';
    this.patchTransform = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
    this.sun = new THREE.Vector3();
  }

  init() {
    const initialPalette = this.currentConfig?.ocean || DEFAULT_PALETTE;

    const oceanMaterial = new OceanMaterial({
      foamStrength: this.params.waveGenerator.foamStrength,
      foamThreshold: this.params.waveGenerator.foamThreshold,
      ifftResolution: this.params.waveGenerator.size,
      gridResolution: DEFAULT_PATCH_RESOLUTION,
      lodScale: this.params.waveGenerator.lodScale,
      reveal: this.currentConfig?.ocean?.reveal ? 1 : 0,
      impactFoamTexture: this.params.impactFoamTexture,
      impactFoamStrength: this.currentConfig?.ocean?.impactFoamStrength ?? 0.8,
      impactFoamPatchSize: this.currentConfig?.ocean?.impactAreaSize,
      seaColor: initialPalette.seaColor,
      horizonColor: initialPalette.horizonColor,
      skyColor: initialPalette.skyColor,
      sunColor: initialPalette.sunColor,
      morphBlend: 0,
      cascades: this.params.waveGenerator.cascades,
      sunPosition: this.sun,
    });

    this.material = oceanMaterial.material;
    this.materialParameters = oceanMaterial.parameters;

    this.group = new THREE.Group();
    this.params.scene.add(this.group);

    if (this.params.withSky !== false) {
      this.sky = new SkyDome();
      this.sky.layers.set(2);
      this.sky.scale.setScalar(500000);
      this.params.scene.add(this.sky);
    }

    this.ensurePatch();
  }

  ensurePatch(oceanConfig) {
    const { patchResolution, patchSize } = getPatchConfig(oceanConfig);
    const nextSignature = `${patchSize}:${patchResolution}`;

    if (this.patchSignature === nextSignature) {
      return;
    }

    this.patch?.destroy();

    sharedPatchOffset.set(0, 0, 0);

    this.patch = new OceanChunk({
      group: this.group,
      layer: this.params.layer,
      lod: 0,
      material: this.material,
      offset: sharedPatchOffset.clone(),
      transform: this.patchTransform,
      width: patchSize,
    });

    this.patch.rebuildMeshFromData(
      buildOceanChunkData({
        lod: 0,
        offset: sharedPatchOffset,
        resolution: patchResolution,
        width: patchSize,
        worldMatrix: this.patchTransform,
      })
    );
    this.patch.mesh.visible = this.patchVisible;

    this.materialParameters.gridResolution.value = patchResolution;
    this.patchSignature = nextSignature;
  }

  applyConfig(config) {
    this.currentConfig = config;

    if (!config) {
      return;
    }

    this.ensurePatch(config.ocean);

    this.patchVisible = config.ocean.visible ?? true;
    this.material.wireframe = config.ocean.wireframe;
    this.materialParameters.reveal.value = config.ocean.reveal ? 1 : 0;
    this.materialParameters.impactFoamStrength.value =
      config.ocean.impactFoamStrength ?? 0.8;
    this.materialParameters.impactFoamPatchSize.value =
      config.ocean.impactAreaSize ?? DEFAULT_PATCH_SIZE;
    this.materialParameters.seaColor.value.set(
      config.ocean.seaColor || DEFAULT_PALETTE.seaColor
    );
    this.materialParameters.horizonColor.value.set(
      config.ocean.horizonColor || DEFAULT_PALETTE.horizonColor
    );
    this.materialParameters.skyColor.value.set(
      config.ocean.skyColor || DEFAULT_PALETTE.skyColor
    );
    this.materialParameters.sunColor.value.set(
      config.ocean.sunColor || DEFAULT_PALETTE.sunColor
    );
    this.params.waveGenerator.setFoamStrength(config.foam.foamStrength);
    this.params.waveGenerator.setFoamThreshold(config.foam.foamThreshold);
    this.params.waveGenerator.setLodScale(config.ocean.lodScale);

    if (this.sky && config.sky) {
      this.sky.parameters.rayleigh.value = config.sky.rayleigh;
      this.sky.parameters.turbidity.value = config.sky.turbidity;
      this.sky.parameters.mieCoefficient.value = config.sky.mieCoefficient;
      this.sky.parameters.mieDirectionalG.value = config.sky.mieDirectionalG;
      this.sky.parameters.elevation.value = config.sky.elevation;
      this.sky.parameters.up.value.fromArray(config.sky.up);

      const phi = THREE.MathUtils.degToRad(90 - config.sky.elevation);
      const theta = THREE.MathUtils.degToRad(config.sky.azimuth);

      this.sun.setFromSphericalCoords(1, phi, theta);
      this.sky.parameters.sunPosition.value.copy(this.sun);

      if (typeof config.sky.exposure === 'number') {
        this.params.renderer.toneMappingExposure = config.sky.exposure;
      }
    } else {
      this.sun.set(0, 1, 0);
      this.params.renderer.toneMappingExposure = 1;
    }
  }

  update(camera = this.params.camera) {
    this.params.camera = camera;
    this.params.camera.getWorldPosition(sharedCameraPosition);
    this.params.scene.getWorldPosition(sharedScenePosition);

    sharedRelativeCameraPosition.subVectors(
      sharedCameraPosition,
      sharedScenePosition
    );

    this.sky?.parameters.cameraPosition.value.copy(
      sharedRelativeCameraPosition
    );

    if (this.patch) {
      this.patch.mesh.visible = this.patchVisible;
      this.patch.mesh.material.wireframe =
        this.currentConfig?.ocean?.wireframe ?? false;
    }

    this.materialParameters.cameraPosition.value.copy(
      sharedRelativeCameraPosition
    );
    this.materialParameters.sunPosition.value.copy(this.sun);
  }

  dispose() {
    this.patch?.destroy();
    this.patch = null;
    this.patchSignature = '';

    this.params.scene.remove(this.group);
    if (this.sky) {
      this.params.scene.remove(this.sky);
      this.sky.geometry.dispose();
      this.sky.material.dispose();
      this.sky = null;
    }
    this.material.dispose();
  }
}
