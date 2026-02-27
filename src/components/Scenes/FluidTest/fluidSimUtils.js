import * as THREE from 'three';

function createPair(width, height, options) {
  const read = new THREE.WebGLRenderTarget(width, height, options);
  const write = new THREE.WebGLRenderTarget(width, height, options);

  return {
    read,
    write,
    swap() {
      const tmp = this.read;
      this.read = this.write;
      this.write = tmp;
    },
  };
}

function createBloomChain(width, height, iterations, options) {
  const chain = [];
  const count = Math.max(1, Math.floor(iterations));
  let w = width;
  let h = height;

  for (let i = 0; i < count; i += 1) {
    w = Math.max(2, Math.floor(w / 2));
    h = Math.max(2, Math.floor(h / 2));
    chain.push(new THREE.WebGLRenderTarget(w, h, options));
  }

  return chain;
}

function createDitheringTexture() {
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const size = 4;
  const data = new Uint8Array(size * size * 4);

  for (let i = 0; i < bayer.length; i += 1) {
    const v = Math.floor((bayer[i] / 15) * 255);
    const idx = i * 4;
    data[idx] = v;
    data[idx + 1] = v;
    data[idx + 2] = v;
    data[idx + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

function clearRenderTarget(gl, target) {
  gl.setRenderTarget(target);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function clearRenderTargets(gl, targets) {
  for (let i = 0; i < targets.length; i += 1) {
    clearRenderTarget(gl, targets[i]);
  }
  gl.setRenderTarget(null);
}

export {
  createPair,
  createBloomChain,
  createDitheringTexture,
  clearRenderTarget,
  clearRenderTargets,
};
