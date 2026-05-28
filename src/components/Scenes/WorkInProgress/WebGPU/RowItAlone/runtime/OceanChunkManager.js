import * as THREE from 'three/webgpu';

import OceanChunk from './OceanChunk';
import buildOceanChunkData from './OceanChunkBuilder';
import OceanMaterial from './OceanMaterial';
import SkyDome from './Sky';

const sharedCameraPosition = new THREE.Vector3();
const sharedScenePosition = new THREE.Vector3();
const sharedPatchOffset = new THREE.Vector3();

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
    this.patchSignature = '';
    this.patchTransform = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
    this.sun = new THREE.Vector3();
  }

  init() {
    this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    this.cubeRenderTarget.texture.format = THREE.RGBAFormat;
    this.cubeRenderTarget.texture.type = THREE.HalfFloatType;
    this.cubeRenderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter;
    this.cubeRenderTarget.texture.magFilter = THREE.LinearFilter;
    this.cubeRenderTarget.texture.generateMipmaps = true;

    this.cubeCamera = new THREE.CubeCamera(1, 1000000, this.cubeRenderTarget);
    this.cubeCamera.rotation.z = Math.PI / 2;
    this.cubeCamera.layers.set(2);

    const oceanMaterial = new OceanMaterial({
      environment: this.cubeRenderTarget.texture,
      foamStrength: this.params.waveGenerator.foamStrength,
      foamThreshold: this.params.waveGenerator.foamThreshold,
      ifftResolution: this.params.waveGenerator.size,
      gridResolution: DEFAULT_PATCH_RESOLUTION,
      lodScale: this.params.waveGenerator.lodScale,
      morphBlend: 0,
      cascades: this.params.waveGenerator.cascades,
      sunPosition: this.sun,
    });

    this.material = oceanMaterial.material;
    this.materialParameters = oceanMaterial.parameters;

    this.group = new THREE.Group();
    this.params.scene.add(this.group);

    this.sky = new SkyDome();
    this.sky.layers.set(2);
    this.sky.scale.setScalar(500000);
    this.params.scene.add(this.sky);

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
    this.patch.show();

    this.materialParameters.gridResolution.value = patchResolution;
    this.patchSignature = nextSignature;
  }

  applyConfig(config) {
    this.currentConfig = config;

    if (!config) {
      return;
    }

    this.ensurePatch(config.ocean);

    this.material.wireframe = config.ocean.wireframe;
    this.params.waveGenerator.setFoamStrength(config.foam.foamStrength);
    this.params.waveGenerator.setFoamThreshold(config.foam.foamThreshold);
    this.params.waveGenerator.setLodScale(config.ocean.lodScale);

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
  }

  update(camera = this.params.camera) {
    this.params.camera = camera;
    this.params.camera.getWorldPosition(sharedCameraPosition);
    this.params.scene.getWorldPosition(sharedScenePosition);

    const relativeCameraPosition = sharedCameraPosition
      .clone()
      .sub(sharedScenePosition);

    this.sky.parameters.cameraPosition.value.copy(relativeCameraPosition);
    this.cubeCamera.position.copy(relativeCameraPosition);
    this.cubeCamera.update(this.params.renderer, this.params.scene);

    if (this.patch) {
      this.patch.show();
      this.patch.mesh.material.wireframe =
        this.currentConfig?.ocean?.wireframe ?? false;
    }

    this.materialParameters.cameraPosition.value.copy(relativeCameraPosition);
    this.materialParameters.sunPosition.value.copy(this.sun);
  }

  dispose() {
    this.patch?.destroy();
    this.patch = null;
    this.patchSignature = '';

    this.params.scene.remove(this.group);
    this.params.scene.remove(this.sky);
    this.material.dispose();
    this.cubeRenderTarget.dispose();
    this.sky.geometry.dispose();
    this.sky.material.dispose();
  }
}
