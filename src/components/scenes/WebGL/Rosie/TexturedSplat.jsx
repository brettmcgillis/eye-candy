/* eslint-disable no-plusplus */

/* eslint-disable no-bitwise */

/* eslint-disable no-param-reassign */

/* eslint-disable no-use-before-define */

/* eslint-disable no-await-in-loop */

/* eslint-disable no-console */

/* eslint-disable no-restricted-syntax */

/* eslint-disable no-underscore-dangle */

/* eslint-disable no-promise-executor-return */

/* eslint-disable no-multi-assign */
import * as React from 'react';

import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame, useLoader, useThree } from '@react-three/fiber';

import * as THREE from 'three';

const TexturedSplatMaterial = shaderMaterial(
  {
    alphaTest: 0,
    viewport: new THREE.Vector2(1980, 1080),
    focal: 1000.0,
    centerAndScaleTexture: null,
    covAndColorTexture: null,
    splatDataTexture: null,
    useSplatDataTexture: false,
    sizeMultiplier: 1.0,
    alphaMultiplier: 1.0,
    maskCutoff: 0.001,
    maskGamma: 1.0,
  },
  /* glsl */ `
    precision highp sampler2D;
    precision highp usampler2D;
    out vec4 vColor;
    out vec3 vPosition;
    uniform vec2 resolution;
    uniform vec2 viewport;
    uniform float focal;
    uniform float sizeMultiplier;
    attribute uint splatIndex;
    uniform sampler2D centerAndScaleTexture;
    uniform usampler2D covAndColorTexture;

    vec2 unpackInt16(in uint value) {
      int v = int(value);
      int v0 = v >> 16;
      int v1 = (v & 0xFFFF);
      if((v & 0x8000) != 0)
        v1 |= 0xFFFF0000;
      return vec2(float(v1), float(v0));
    }

    void main () {
      ivec2 texSize = textureSize(centerAndScaleTexture, 0);
      ivec2 texPos = ivec2(splatIndex % uint(texSize.x), splatIndex / uint(texSize.x));
      vec4 centerAndScaleData = texelFetch(centerAndScaleTexture, texPos, 0);
      vec4 center = vec4(centerAndScaleData.xyz, 1);
      vec4 camspace = modelViewMatrix * center;
      vec4 pos2d = projectionMatrix * camspace;

      float bounds = 1.2 * pos2d.w;
      if (pos2d.z < -pos2d.w || pos2d.x < -bounds || pos2d.x > bounds
        || pos2d.y < -bounds || pos2d.y > bounds) {
        gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
        return;
      }

      uvec4 covAndColorData = texelFetch(covAndColorTexture, texPos, 0);
      vec2 cov3D_M11_M12 = unpackInt16(covAndColorData.x) * centerAndScaleData.w;
      vec2 cov3D_M13_M22 = unpackInt16(covAndColorData.y) * centerAndScaleData.w;
      vec2 cov3D_M23_M33 = unpackInt16(covAndColorData.z) * centerAndScaleData.w;
      mat3 Vrk = mat3(
        cov3D_M11_M12.x, cov3D_M11_M12.y, cov3D_M13_M22.x,
        cov3D_M11_M12.y, cov3D_M13_M22.y, cov3D_M23_M33.x,
        cov3D_M13_M22.x, cov3D_M23_M33.x, cov3D_M23_M33.y
      );

      mat3 J = mat3(
        focal / camspace.z, 0., -(focal * camspace.x) / (camspace.z * camspace.z),
        0., focal / camspace.z, -(focal * camspace.y) / (camspace.z * camspace.z),
        0., 0., 0.
      );

      mat3 W = transpose(mat3(modelViewMatrix));
      mat3 T = W * J;
      mat3 cov = transpose(T) * Vrk * T;
      vec2 vCenter = vec2(pos2d) / pos2d.w;
      float diagonal1 = cov[0][0] + 0.3;
      float offDiagonal = cov[0][1];
      float diagonal2 = cov[1][1] + 0.3;
      float mid = 0.5 * (diagonal1 + diagonal2);
      float radius = length(vec2((diagonal1 - diagonal2) / 2.0, offDiagonal));
      float lambda1 = mid + radius;
      float lambda2 = max(mid - radius, 0.1);
      vec2 diagonalVector = normalize(vec2(offDiagonal, lambda1 - diagonal1));
      vec2 v1 = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
      vec2 v2 = min(sqrt(2.0 * lambda2), 1024.0) * vec2(diagonalVector.y, -diagonalVector.x);
      uint colorUint = covAndColorData.w;
      vColor = vec4(
        float(colorUint & uint(0xFF)) / 255.0,
        float((colorUint >> uint(8)) & uint(0xFF)) / 255.0,
        float((colorUint >> uint(16)) & uint(0xFF)) / 255.0,
        float(colorUint >> uint(24)) / 255.0
      );
      vPosition = position;

      gl_Position = vec4(
        vCenter
          + (position.x * sizeMultiplier) * v2 / viewport * 2.0
          + (position.y * sizeMultiplier) * v1 / viewport * 2.0,
        pos2d.z / pos2d.w,
        1.0
      );
    }
  `,
  /* glsl */ `
    #include <alphatest_pars_fragment>
    #include <alphahash_pars_fragment>
    in vec4 vColor;
    in vec3 vPosition;
    uniform sampler2D splatDataTexture;
    uniform bool useSplatDataTexture;
    uniform float alphaMultiplier;
    uniform float maskCutoff;
    uniform float maskGamma;

    void main () {
      float B = 0.0;
      if (useSplatDataTexture) {
        vec2 uv = vec2(vPosition.x * 0.25 + 0.5, vPosition.y * 0.25 + 0.5);
        float textureMask = pow(texture(splatDataTexture, uv).a, maskGamma);
        if (textureMask <= maskCutoff) discard;
        B = vColor.a * textureMask * alphaMultiplier;
      } else {
        float A = -dot(vPosition.xy, vPosition.xy);
        if (A < -4.0) discard;
        B = exp(A) * vColor.a * alphaMultiplier;
      }

      vec4 diffuseColor = vec4(vColor.rgb, B);
      #include <alphatest_fragment>
      #include <alphahash_fragment>
      gl_FragColor = diffuseColor;
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `
);

function createWorker(self) {
  let matrices = null;
  let offset = 0;

  function sortSplats(view, hashed = false) {
    const vertexCount = matrices.length / 16;
    const threshold = -0.0001;

    let maxDepth = -Infinity;
    let minDepth = Infinity;
    const depthList = new Float32Array(vertexCount);
    const sizeList = new Int32Array(depthList.buffer);
    const validIndexList = new Int32Array(vertexCount);

    let validCount = 0;
    for (let i = 0; i < vertexCount; i += 1) {
      const depth =
        view[0] * matrices[i * 16 + 12] +
        view[1] * matrices[i * 16 + 13] +
        view[2] * matrices[i * 16 + 14] +
        view[3];

      if (hashed || (depth < 0 && matrices[i * 16 + 15] > threshold * depth)) {
        depthList[validCount] = depth;
        validIndexList[validCount] = i;
        validCount += 1;
        if (depth > maxDepth) maxDepth = depth;
        if (depth < minDepth) minDepth = depth;
      }
    }

    const depthInv = (256 * 256 - 1) / (maxDepth - minDepth);
    const counts0 = new Uint32Array(256 * 256);
    for (let i = 0; i < validCount; i += 1) {
      sizeList[i] = ((depthList[i] - minDepth) * depthInv) | 0;
      counts0[sizeList[i]] += 1;
    }

    const starts0 = new Uint32Array(256 * 256);
    for (let i = 1; i < 256 * 256; i += 1) {
      starts0[i] = starts0[i - 1] + counts0[i - 1];
    }

    const depthIndex = new Uint32Array(validCount);
    for (let i = 0; i < validCount; i += 1) {
      depthIndex[starts0[sizeList[i]]++] = validIndexList[i];
    }

    return depthIndex;
  }

  self.onmessage = (e) => {
    if (e.data.method === 'push') {
      if (offset === 0) matrices = new Float32Array(e.data.length);
      const newMatrices = new Float32Array(e.data.matrices);
      matrices.set(newMatrices, offset);
      offset += newMatrices.length;
    } else if (e.data.method === 'sort') {
      if (matrices !== null) {
        const indices = sortSplats(
          new Float32Array(e.data.view),
          e.data.hashed
        );
        self.postMessage({ indices, key: e.data.key }, [indices.buffer]);
      }
    }
  };
}

class SplatLoader extends THREE.Loader {
  constructor(...args) {
    super(...args);
    this.gl = null;
    this.chunkSize = 25000;
  }

  load(url, onLoad, onProgress, onError) {
    const shared = {
      gl: this.gl,
      url: this.manager.resolveURL(url),
      worker: new Worker(
        URL.createObjectURL(
          new Blob(['(', createWorker.toString(), ')(self)'], {
            type: 'application/javascript',
          })
        )
      ),
      manager: this.manager,
      update: (target, camera, hashed) =>
        update(camera, shared, target, hashed),
      connect: (target) => connect(shared, target),
      loading: false,
      loaded: false,
      loadedVertexCount: 0,
      chunkSize: this.chunkSize,
      totalDownloadBytes: 0,
      numVertices: 0,
      rowLength: 3 * 4 + 3 * 4 + 4 + 4,
      maxVertexes: 0,
      bufferTextureWidth: 0,
      bufferTextureHeight: 0,
      stream: null,
      centerAndScaleData: null,
      covAndColorData: null,
      covAndColorTexture: null,
      centerAndScaleTexture: null,
      onProgress,
    };

    load(shared)
      .then(onLoad)
      .catch((error) => {
        onError?.(error);
        shared.manager.itemError(shared.url);
      });
  }
}

async function load(shared) {
  shared.manager.itemStart(shared.url);
  const data = await fetch(shared.url);

  if (data.body === null) throw new Error('Failed to fetch file');
  const totalDownloadBytesHeader = data.headers.get('Content-Length');
  const totalDownloadBytes = totalDownloadBytesHeader
    ? parseInt(totalDownloadBytesHeader, 10)
    : undefined;

  if (totalDownloadBytes === undefined) {
    throw new Error('Failed to get content length');
  }

  shared.stream = data.body.getReader();
  shared.totalDownloadBytes = totalDownloadBytes;
  shared.numVertices = Math.floor(shared.totalDownloadBytes / shared.rowLength);

  const context = shared.gl.getContext();
  const maxTextureSize = context.getParameter(context.MAX_TEXTURE_SIZE);
  shared.maxVertexes = maxTextureSize * maxTextureSize;

  if (shared.numVertices > shared.maxVertexes) {
    shared.numVertices = shared.maxVertexes;
  }

  shared.bufferTextureWidth = maxTextureSize;
  shared.bufferTextureHeight =
    Math.floor((shared.numVertices - 1) / maxTextureSize) + 1;

  shared.centerAndScaleData = new Float32Array(
    shared.bufferTextureWidth * shared.bufferTextureHeight * 4
  );
  shared.covAndColorData = new Uint32Array(
    shared.bufferTextureWidth * shared.bufferTextureHeight * 4
  );

  shared.centerAndScaleTexture = new THREE.DataTexture(
    shared.centerAndScaleData,
    shared.bufferTextureWidth,
    shared.bufferTextureHeight,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  shared.centerAndScaleTexture.needsUpdate = true;

  shared.covAndColorTexture = new THREE.DataTexture(
    shared.covAndColorData,
    shared.bufferTextureWidth,
    shared.bufferTextureHeight,
    THREE.RGBAIntegerFormat,
    THREE.UnsignedIntType
  );
  shared.covAndColorTexture.internalFormat = 'RGBA32UI';
  shared.covAndColorTexture.needsUpdate = true;

  return shared;
}

async function lazyLoad(shared) {
  shared.loading = true;

  await waitForTextureHandles(shared);

  let bytesDownloaded = 0;
  let bytesProcessed = 0;
  const chunks = [];

  let lastReportedProgress = 0;
  const lengthComputable = shared.totalDownloadBytes !== 0;

  while (true) {
    try {
      const { value, done } = await shared.stream.read();
      if (done) break;

      bytesDownloaded += value.length;

      if (shared.totalDownloadBytes !== undefined) {
        const percent = (bytesDownloaded / shared.totalDownloadBytes) * 100;
        if (shared.onProgress && percent - lastReportedProgress > 1) {
          const event = new ProgressEvent('progress', {
            lengthComputable,
            loaded: bytesDownloaded,
            total: shared.totalDownloadBytes,
          });
          shared.onProgress(event);
          lastReportedProgress = percent;
        }
      }

      chunks.push(value);
      const bytesRemains = bytesDownloaded - bytesProcessed;

      if (
        shared.totalDownloadBytes !== undefined &&
        bytesRemains > shared.rowLength * shared.chunkSize
      ) {
        const vertexCount = Math.floor(bytesRemains / shared.rowLength);
        const concatenatedChunksBuffer = new Uint8Array(bytesRemains);

        let offset = 0;
        for (const chunk of chunks) {
          concatenatedChunksBuffer.set(chunk, offset);
          offset += chunk.length;
        }

        chunks.length = 0;
        if (bytesRemains > vertexCount * shared.rowLength) {
          const extraData = new Uint8Array(
            bytesRemains - vertexCount * shared.rowLength
          );
          extraData.set(
            concatenatedChunksBuffer.subarray(
              bytesRemains - extraData.length,
              bytesRemains
            ),
            0
          );
          chunks.push(extraData);
        }

        const buffer = new Uint8Array(vertexCount * shared.rowLength);
        buffer.set(concatenatedChunksBuffer.subarray(0, buffer.byteLength), 0);

        const matrices = await pushDataBufferWhenReady(
          shared,
          buffer.buffer,
          vertexCount
        );
        shared.worker.postMessage(
          {
            method: 'push',
            src: shared.url,
            length: shared.numVertices * 16,
            matrices: matrices.buffer,
          },
          [matrices.buffer]
        );

        bytesProcessed += vertexCount * shared.rowLength;

        if (shared.onProgress) {
          const event = new ProgressEvent('progress', {
            lengthComputable,
            loaded: shared.totalDownloadBytes,
            total: shared.totalDownloadBytes,
          });
          shared.onProgress(event);
        }
      }
    } catch (error) {
      console.error(error);
      break;
    }
  }

  if (bytesDownloaded - bytesProcessed > 0) {
    const concatenatedChunks = new Uint8Array(
      chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    );
    let offset = 0;
    for (const chunk of chunks) {
      concatenatedChunks.set(chunk, offset);
      offset += chunk.length;
    }

    const numVertices = Math.floor(
      concatenatedChunks.byteLength / shared.rowLength
    );
    const matrices = await pushDataBufferWhenReady(
      shared,
      concatenatedChunks.buffer,
      numVertices
    );
    shared.worker.postMessage(
      {
        method: 'push',
        src: shared.url,
        length: numVertices * 16,
        matrices: matrices.buffer,
      },
      [matrices.buffer]
    );
  }

  shared.loaded = true;
  shared.manager.itemEnd(shared.url);
}

async function waitForTextureHandles(shared) {
  while (true) {
    shared.gl.initTexture(shared.centerAndScaleTexture);
    shared.gl.initTexture(shared.covAndColorTexture);

    const centerAndScaleTextureProperties = shared.gl.properties.get(
      shared.centerAndScaleTexture
    );
    const covAndColorTextureProperties = shared.gl.properties.get(
      shared.covAndColorTexture
    );

    if (
      centerAndScaleTextureProperties?.__webglTexture &&
      covAndColorTextureProperties?.__webglTexture
    ) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

async function pushDataBufferWhenReady(shared, buffer, vertexCount) {
  while (true) {
    try {
      return pushDataBuffer(shared, buffer, vertexCount);
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'TEXTURE_NOT_READY') {
        throw error;
      }

      await waitForTextureHandles(shared);
    }
  }
}

function update(camera, shared, target, hashed) {
  camera.updateMatrixWorld();
  shared.gl.getCurrentViewport(target.viewport);

  target.material.viewport.x = target.viewport.z;
  target.material.viewport.y = target.viewport.w;
  target.material.focal =
    (target.viewport.w / 2.0) * Math.abs(camera.projectionMatrix.elements[5]);

  if (target.ready) {
    if (hashed && target.sorted) return;
    target.ready = false;

    const view = new Float32Array([
      target.modelViewMatrix.elements[2],
      -target.modelViewMatrix.elements[6],
      target.modelViewMatrix.elements[10],
      target.modelViewMatrix.elements[14],
    ]);

    shared.worker.postMessage(
      {
        method: 'sort',
        src: shared.url,
        key: target.uuid,
        view: view.buffer,
        hashed,
      },
      [view.buffer]
    );

    if (hashed && shared.loaded) target.sorted = true;
  }
}

function connect(shared, target) {
  if (!shared.loading) lazyLoad(shared);

  target.ready = false;
  target.pm = new THREE.Matrix4();
  target.vm1 = new THREE.Matrix4();
  target.vm2 = new THREE.Matrix4();
  target.viewport = new THREE.Vector4();

  const splatIndexArray = new Uint32Array(
    shared.bufferTextureWidth * shared.bufferTextureHeight
  );
  const splatIndexes = new THREE.InstancedBufferAttribute(
    splatIndexArray,
    1,
    false
  );
  splatIndexes.setUsage(THREE.DynamicDrawUsage);

  const geometry = (target.geometry = new THREE.InstancedBufferGeometry());
  const positionsArray = new Float32Array(6 * 3);
  const positions = new THREE.BufferAttribute(positionsArray, 3);
  geometry.setAttribute('position', positions);

  positions.setXYZ(2, -2.0, 2.0, 0.0);
  positions.setXYZ(1, 2.0, 2.0, 0.0);
  positions.setXYZ(0, -2.0, -2.0, 0.0);
  positions.setXYZ(5, -2.0, -2.0, 0.0);
  positions.setXYZ(4, 2.0, 2.0, 0.0);
  positions.setXYZ(3, 2.0, -2.0, 0.0);

  positions.needsUpdate = true;
  geometry.setAttribute('splatIndex', splatIndexes);
  geometry.instanceCount = 1;

  function listener(e) {
    if (target && e.data.key === target.uuid) {
      const indexes = new Uint32Array(e.data.indices);
      geometry.attributes.splatIndex.set(indexes);
      geometry.attributes.splatIndex.needsUpdate = true;
      geometry.instanceCount = indexes.length;
      target.ready = true;
    }
  }

  shared.worker.addEventListener('message', listener);

  async function wait() {
    while (true) {
      const centerAndScaleTextureProperties = shared.gl.properties.get(
        shared.centerAndScaleTexture
      );
      const covAndColorTextureProperties = shared.gl.properties.get(
        shared.covAndColorTexture
      );

      if (
        centerAndScaleTextureProperties?.__webglTexture &&
        covAndColorTextureProperties?.__webglTexture &&
        shared.loadedVertexCount > 0
      ) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    target.ready = true;
  }

  wait();
  return () => shared.worker.removeEventListener('message', listener);
}

function pushDataBuffer(shared, buffer, vertexCount) {
  const context = shared.gl.getContext();
  if (shared.loadedVertexCount + vertexCount > shared.maxVertexes) {
    vertexCount = shared.maxVertexes - shared.loadedVertexCount;
  }

  if (vertexCount <= 0) throw new Error('Failed to parse file');

  const uBuffer = new Uint8Array(buffer);
  const fBuffer = new Float32Array(buffer);
  const matrices = new Float32Array(vertexCount * 16);

  const covAndColorDataUint8 = new Uint8Array(shared.covAndColorData.buffer);
  const covAndColorDataInt16 = new Int16Array(shared.covAndColorData.buffer);

  for (let i = 0; i < vertexCount; i += 1) {
    const quat = new THREE.Quaternion(
      -(uBuffer[32 * i + 28 + 1] - 128) / 128.0,
      (uBuffer[32 * i + 28 + 2] - 128) / 128.0,
      (uBuffer[32 * i + 28 + 3] - 128) / 128.0,
      -(uBuffer[32 * i + 28 + 0] - 128) / 128.0
    );
    quat.invert();

    const center = new THREE.Vector3(
      fBuffer[8 * i],
      fBuffer[8 * i + 1],
      -fBuffer[8 * i + 2]
    );
    const scale = new THREE.Vector3(
      fBuffer[8 * i + 3],
      fBuffer[8 * i + 4],
      fBuffer[8 * i + 5]
    );

    const mtx = new THREE.Matrix4();
    mtx.makeRotationFromQuaternion(quat);
    mtx.transpose();
    mtx.scale(scale);
    const mtxT = mtx.clone();
    mtx.transpose();
    mtx.premultiply(mtxT);
    mtx.setPosition(center);

    const covIndexes = [0, 1, 2, 5, 6, 10];
    let maxValue = 0.0;
    for (let j = 0; j < covIndexes.length; j += 1) {
      if (Math.abs(mtx.elements[covIndexes[j]]) > maxValue) {
        maxValue = Math.abs(mtx.elements[covIndexes[j]]);
      }
    }

    let destOffset = shared.loadedVertexCount * 4 + i * 4;
    shared.centerAndScaleData[destOffset] = center.x;
    shared.centerAndScaleData[destOffset + 1] = -center.y;
    shared.centerAndScaleData[destOffset + 2] = center.z;
    shared.centerAndScaleData[destOffset + 3] = maxValue / 32767.0;

    destOffset = shared.loadedVertexCount * 8 + i * 4 * 2;
    for (let j = 0; j < covIndexes.length; j += 1) {
      covAndColorDataInt16[destOffset + j] =
        (mtx.elements[covIndexes[j]] * 32767.0) / maxValue;
    }

    destOffset = shared.loadedVertexCount * 16 + (i * 4 + 3) * 4;
    const col = new THREE.Color(
      uBuffer[32 * i + 24] / 255,
      uBuffer[32 * i + 25] / 255,
      uBuffer[32 * i + 26] / 255
    );
    col.convertSRGBToLinear();
    covAndColorDataUint8[destOffset] = col.r * 255;
    covAndColorDataUint8[destOffset + 1] = col.g * 255;
    covAndColorDataUint8[destOffset + 2] = col.b * 255;
    covAndColorDataUint8[destOffset + 3] = uBuffer[32 * i + 27];

    mtx.elements[15] =
      (Math.max(scale.x, scale.y, scale.z) * uBuffer[32 * i + 27]) / 255.0;
    for (let j = 0; j < 16; j += 1) matrices[i * 16 + j] = mtx.elements[j];
  }

  while (vertexCount > 0) {
    let width = 0;
    let height = 0;
    const xoffset = shared.loadedVertexCount % shared.bufferTextureWidth;
    const yoffset = Math.floor(
      shared.loadedVertexCount / shared.bufferTextureWidth
    );

    if (shared.loadedVertexCount % shared.bufferTextureWidth !== 0) {
      width =
        Math.min(shared.bufferTextureWidth, xoffset + vertexCount) - xoffset;
      height = 1;
    } else if (Math.floor(vertexCount / shared.bufferTextureWidth) > 0) {
      width = shared.bufferTextureWidth;
      height = Math.floor(vertexCount / shared.bufferTextureWidth);
    } else {
      width = vertexCount % shared.bufferTextureWidth;
      height = 1;
    }

    shared.gl.initTexture(shared.centerAndScaleTexture);
    shared.gl.initTexture(shared.covAndColorTexture);

    const centerAndScaleTextureProperties = shared.gl.properties.get(
      shared.centerAndScaleTexture
    );
    const covAndColorTextureProperties = shared.gl.properties.get(
      shared.covAndColorTexture
    );
    if (
      !centerAndScaleTextureProperties?.__webglTexture ||
      !covAndColorTextureProperties?.__webglTexture
    ) {
      throw new Error('TEXTURE_NOT_READY');
    }

    context.bindTexture(
      context.TEXTURE_2D,
      centerAndScaleTextureProperties.__webglTexture
    );
    context.texSubImage2D(
      context.TEXTURE_2D,
      0,
      xoffset,
      yoffset,
      width,
      height,
      context.RGBA,
      context.FLOAT,
      shared.centerAndScaleData,
      shared.loadedVertexCount * 4
    );

    context.bindTexture(
      context.TEXTURE_2D,
      covAndColorTextureProperties.__webglTexture
    );
    context.texSubImage2D(
      context.TEXTURE_2D,
      0,
      xoffset,
      yoffset,
      width,
      height,
      context.RGBA_INTEGER,
      context.UNSIGNED_INT,
      shared.covAndColorData,
      shared.loadedVertexCount * 4
    );

    shared.gl.resetState();

    shared.loadedVertexCount += width * height;
    vertexCount -= width * height;
  }

  return matrices;
}

extend({ TexturedSplatMaterial });

export default function TexturedSplat({
  src,
  toneMapped = false,
  alphaTest = 0,
  alphaHash = false,
  chunkSize = 25000,
  splatDataTexture = null,
  sizeMultiplier = 1.0,
  alphaMultiplier = 1.0,
  maskCutoff = 0.001,
  maskGamma = 1.0,
  ...props
}) {
  const ref = React.useRef(null);
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);

  const shared = useLoader(SplatLoader, src, (loader) => {
    loader.gl = gl;
    loader.chunkSize = chunkSize;
  });

  React.useLayoutEffect(() => shared.connect(ref.current), [shared, src]);
  useFrame(() => shared.update(ref.current, camera, alphaHash));

  return (
    <mesh ref={ref} frustumCulled={false} {...props}>
      <texturedSplatMaterial
        key={`${src}/${alphaTest}/${alphaHash}/${Boolean(splatDataTexture)}${TexturedSplatMaterial.key}`}
        transparent={!alphaHash}
        depthTest
        alphaTest={alphaHash ? 0 : alphaTest}
        centerAndScaleTexture={shared.centerAndScaleTexture}
        covAndColorTexture={shared.covAndColorTexture}
        splatDataTexture={splatDataTexture}
        useSplatDataTexture={Boolean(splatDataTexture)}
        sizeMultiplier={sizeMultiplier}
        alphaMultiplier={alphaMultiplier}
        maskCutoff={maskCutoff}
        maskGamma={maskGamma}
        depthWrite={alphaHash || alphaTest > 0}
        blending={alphaHash ? THREE.NormalBlending : THREE.CustomBlending}
        blendSrcAlpha={THREE.OneFactor}
        alphaHash={!!alphaHash}
        toneMapped={toneMapped}
      />
    </mesh>
  );
}
