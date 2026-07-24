import { attribute, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import skyFragmentStageWGSL from './shaders/skyShaders';

export default class SkyDome extends THREE.Mesh {
  constructor() {
    const parameters = {
      position: attribute('position'),
      normal: attribute('normal'),
      turbidity: uniform(10),
      rayleigh: uniform(3),
      mieCoefficient: uniform(0.005),
      mieDirectionalG: uniform(0.7),
      elevation: uniform(2),
      sunPosition: uniform(new THREE.Vector3(0, 0, 0)),
      up: uniform(new THREE.Vector3(0, 1, 0)),
      cameraPosition: uniform(new THREE.Vector3(0, 0, 0)),
    };

    const material = new THREE.MeshBasicNodeMaterial();
    material.colorNode = skyFragmentStageWGSL(parameters);
    material.side = THREE.BackSide;
    material.colorSpace = THREE.SRGBColorSpace;

    super(new THREE.BoxGeometry(1, 1, 1), material);

    this.parameters = parameters;
  }
}
