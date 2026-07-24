import { attribute, texture, uniform, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  QT_OCEAN_MIN_CELL_RESOLUTION,
  QT_OCEAN_MIN_LOD_RADIUS,
} from './oceanConstants';
import {
  oceanFragmentStageWGSL,
  oceanVertexStageWGSL,
  vCascadeScales,
  vDisplacedPosition,
  vMorphedPosition,
} from './shaders/oceanShaders';

export default class OceanMaterial {
  constructor(params) {
    const shaderParams = {
      time: uniform(0),
      cameraPosition: uniform(new THREE.Vector3()),
      minLodRadius: QT_OCEAN_MIN_LOD_RADIUS,
      gridResolution: uniform(
        params.gridResolution ?? QT_OCEAN_MIN_CELL_RESOLUTION
      ),
      position: attribute('position'),
      vindex: attribute('vindex'),
      width: attribute('width'),
      lod: attribute('lod'),
      ifftResolution: uniform(params.ifftResolution),
      displacement0: texture(params.cascades[0].displacement),
      displacement1: texture(params.cascades[1].displacement),
      displacement2: texture(params.cascades[2].displacement),
      derivatives0: texture(params.cascades[0].derivative),
      derivatives1: texture(params.cascades[1].derivative),
      derivatives2: texture(params.cascades[2].derivative),
      jacobian0: texture(params.cascades[0].jacobian),
      jacobian1: texture(params.cascades[1].jacobian),
      jacobian2: texture(params.cascades[2].jacobian),
      ifft_sampler0: texture(params.cascades[0].derivative),
      ifft_sampler1: texture(params.cascades[1].derivative),
      ifft_sampler2: texture(params.cascades[2].derivative),
      foamStrength: params.foamStrength,
      foamThreshold: params.foamThreshold,
      lodScale: params.lodScale,
      morphBlend: uniform(params.morphBlend ?? 1),
      waveLengths: vec3(
        params.cascades[0].params.lengthScale,
        params.cascades[1].params.lengthScale,
        params.cascades[2].params.lengthScale
      ),
      sunPosition: uniform(params.sunPosition),
      vMorphedPosition,
      vDisplacedPosition,
      vCascadeScales,
    };

    const material = new THREE.MeshBasicNodeMaterial();
    material.positionNode = oceanVertexStageWGSL(shaderParams);
    material.colorNode = oceanFragmentStageWGSL(shaderParams);
    material.side = THREE.FrontSide;
    material.colorSpace = THREE.SRGBColorSpace;
    material.transparent = false;

    this.material = material;
    this.parameters = shaderParams;
  }
}
