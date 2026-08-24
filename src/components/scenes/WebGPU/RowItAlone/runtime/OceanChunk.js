import * as THREE from 'three/webgpu';

export default class OceanChunk {
  constructor(params) {
    this.params = params;
    this.init(params);
  }

  destroy() {
    this.params.group.remove(this.mesh);
    this.geometry.dispose();
  }

  hide() {
    this.mesh.visible = false;
  }

  show() {
    this.mesh.visible = true;
  }

  init(params) {
    this.geometry = new THREE.BufferGeometry();
    this.mesh = new THREE.Mesh(this.geometry, params.material);

    const boundingSphereCenter = new THREE.Vector3(
      params.offset.x,
      params.offset.y
    );
    boundingSphereCenter.applyMatrix4(params.transform);

    this.geometry.boundingSphere = new THREE.Sphere(
      boundingSphereCenter,
      params.lod > 3 ? params.width * 1.75 : params.width * 3
    );

    this.mesh.castShadow = false;
    this.mesh.layers.set(params.layer);
    this.mesh.receiveShadow = true;
    params.group.add(this.mesh);
  }

  rebuildMeshFromData(data) {
    this.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(data.positions, 3)
    );
    this.geometry.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(data.normals, 3)
    );
    this.geometry.setAttribute(
      'vindex',
      new THREE.Int32BufferAttribute(data.vindices, 1)
    );
    this.geometry.setAttribute(
      'width',
      new THREE.Float32BufferAttribute(data.width, 1)
    );
    this.geometry.setAttribute(
      'lod',
      new THREE.Int32BufferAttribute(data.lod, 1)
    );
    this.geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.normal.needsUpdate = true;
    this.geometry.attributes.vindex.needsUpdate = true;
    this.geometry.attributes.width.needsUpdate = true;
    this.geometry.attributes.lod.needsUpdate = true;
  }
}
