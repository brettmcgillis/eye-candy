/* eslint-disable no-unused-vars */

/* eslint-disable max-classes-per-file, no-underscore-dangle, no-plusplus, no-continue, no-loop-func, no-console */
import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

// ─── Shaders ─────────────────────────────────────────────────────────────────

const vs = `
    attribute vec3 position;
    attribute vec3 tex;
    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;
    varying vec3 texOut;
    void main(void) {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        texOut = tex;
    }
`;

const fs = `
    precision highp float;
    uniform float time;
    uniform sampler2D nzw;
    uniform sampler2D fireProfile;
    uniform float magnitude;
    uniform float lacunarity;
    uniform float gain;
    uniform vec4 noiseScale;
    uniform vec3 colorTint;
    uniform float saturation;
    uniform float brightness;

    vec2 mBBS(vec2 val, float modulus) {
        val = mod(val, modulus);
        return mod(val * val, modulus);
    }
    const float modulus = 61.0;
    
    float mnoise(vec3 pos) {
        float intArg = floor(pos.z);
        float fracArg = fract(pos.z);
        vec2 hash = mBBS(intArg * 3.0 + vec2(0, 3), modulus);
        vec4 g = vec4(
            texture2D(nzw, vec2(pos.x, pos.y + hash.x) / modulus).xy,
            texture2D(nzw, vec2(pos.x, pos.y + hash.y) / modulus).xy
        ) * 2.0 - 1.0;
        return mix(g.x + g.y * fracArg, g.z + g.w * (fracArg - 1.0), smoothstep(0.0, 1.0, fracArg));
    }

    float turbulence(vec3 pos) {
        float sum = 0.0;
        float freq = 1.0;
        float amp = 1.0;
        for(int i = 0; i < 4; i++) {
            sum += abs(mnoise(pos * freq)) * amp;
            freq *= lacunarity;
            amp *= gain;
        }
        return sum;
    }

    vec4 sampleFire(vec3 loc, vec4 scale) {
        loc.xz = loc.xz * 2.0 - 1.0;
        vec2 st = vec2(sqrt(dot(loc.xz, loc.xz)), loc.y);
        loc.y -= time * scale.w;
        loc *= scale.xyz;
        float offset = sqrt(st.y) * magnitude * turbulence(loc);
        st.y += offset;
        
        if(st.y > 1.0) return vec4(0.0);
        
        vec4 result = texture2D(fireProfile, st);
        
        if(st.y < 0.1) result *= st.y / 0.1;
        
        return result;
    }

    varying vec3 texOut;
    void main(void) {
        vec4 color = sampleFire(texOut, noiseScale);
        vec3 tinted = color.rgb * colorTint * brightness;
        float lum = dot(tinted, vec3(0.2126, 0.7152, 0.0722));
        tinted = mix(vec3(lum), tinted, saturation);
        gl_FragColor = vec4(tinted, color.a);
    }
`;

// ─── PriorityQueue ───────────────────────────────────────────────────────────

class PriorityQueue {
  constructor() {
    this.contents = [];
    this.sorted = false;
  }

  sort() {
    this.contents.sort((a, b) => a.priority - b.priority);
    this.sorted = true;
  }

  pop() {
    if (!this.sorted) this.sort();
    return this.contents.pop();
  }

  top() {
    if (!this.sorted) this.sort();
    return this.contents[this.contents.length - 1];
  }

  push(object, priority) {
    this.contents.push({ object, priority });
    this.sorted = false;
  }
}

// ─── VolumetricFireMesh (Three.js Mesh) ─────────────────────────────────────

class VolumetricFireMesh extends THREE.Mesh {
  constructor({
    width = 1.0,
    height = 2.0,
    depth = 1.0,
    sliceSpacing = 0.1,
    camera = null,
    textureNoise = null,
    textureProfile = null,
    segments = 32,
    debug = false,
  } = {}) {
    if (!camera) throw new Error("VolumetricFire: 'camera' is required.");
    if (!textureNoise || !textureProfile) {
      console.error(
        "VolumetricFire: 'textureNoise' and 'textureProfile' must be provided."
      );
    }

    const maxVerts = segments * 300 * 6;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(maxVerts * 3), 3).setUsage(
        THREE.DynamicDrawUsage
      )
    );
    geometry.setAttribute(
      'tex',
      new THREE.BufferAttribute(new Float32Array(maxVerts * 3), 3).setUsage(
        THREE.DynamicDrawUsage
      )
    );
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(maxVerts), 1));

    const material = new THREE.RawShaderMaterial({
      vertexShader: vs,
      fragmentShader: fs,
      uniforms: {
        nzw: { value: textureNoise },
        fireProfile: { value: textureProfile },
        time: { value: 0.0 },
        magnitude: { value: 1.3 },
        lacunarity: { value: 2.0 },
        gain: { value: 0.5 },
        noiseScale: { value: new THREE.Vector4(1.0, 2.0, 1.0, 0.3) },
        colorTint: { value: new THREE.Color(1, 1, 1) },
        saturation: { value: 1.0 },
        brightness: { value: 1.5 },
      },
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

    super(geometry, material);
    this.type = 'VolumetricFire';
    this.frustumCulled = false;

    this._camera = camera;
    this._sliceSpacing = sliceSpacing;
    this._segments = segments;
    this._viewVector = new THREE.Vector3();
    this._posCurve = new THREE.CatmullRomCurve3();
    this._posCurve.curveType = 'centripetal';

    this._cornerNeighbors = [
      [1, 2, 4],
      [0, 5, 3],
      [0, 3, 6],
      [1, 7, 2],
      [0, 6, 5],
      [1, 4, 7],
      [2, 7, 4],
      [3, 5, 6],
    ];
    this._incomingEdges = [
      [-1, 2, 4, -1, 1, -1, -1, -1],
      [5, -1, -1, 0, -1, 3, -1, -1],
      [3, -1, -1, 6, -1, -1, 0, -1],
      [-1, 7, 1, -1, -1, -1, -1, 2],
      [6, -1, -1, -1, -1, 0, 5, -1],
      [-1, 4, -1, -1, 7, -1, -1, 1],
      [-1, -1, 7, -1, 2, -1, -1, 4],
      [-1, -1, -1, 5, -1, 6, 3, -1],
    ];

    this._controlPoints = [];
    this.setRectangularShape(width, height, depth);

    if (debug) {
      this._initLatticeWireframe(segments);
    }
  }

  setRectangularShape(width, height, depth) {
    const halfH = height / 2;
    const pts = [
      {
        pos: new THREE.Vector3(0, -halfH, 0),
        scale: new THREE.Vector3(width, 1, depth),
        rot: new THREE.Quaternion(),
      },
      {
        pos: new THREE.Vector3(0, 0, 0),
        scale: new THREE.Vector3(width, 1, depth),
        rot: new THREE.Quaternion(),
      },
      {
        pos: new THREE.Vector3(0, halfH, 0),
        scale: new THREE.Vector3(width, 1, depth),
        rot: new THREE.Quaternion(),
      },
    ];
    this.setControlPoints(pts);
  }

  setControlPoints(points) {
    this._controlPoints = points;
    this._posCurve.points = points.map((p) => p.pos);
    this._posCurve.updateArcLengths();
  }

  update(elapsed) {
    this.material.uniforms.time.value = elapsed;

    const modelViewMatrix = new THREE.Matrix4();
    modelViewMatrix.multiplyMatrices(
      this._camera.matrixWorldInverse,
      this.matrixWorld
    );
    this._viewVector
      .set(
        -modelViewMatrix.elements[2],
        -modelViewMatrix.elements[6],
        -modelViewMatrix.elements[10]
      )
      .normalize();

    this._slice();
  }

  _getInterpolatedState(t) {
    const points = this._controlPoints;
    const numPoints = points.length;
    const point = t * (numPoints - 1);
    let idx0 = Math.floor(point);
    let idx1 = idx0 + 1;
    let weight = point - idx0;

    if (idx1 >= numPoints) {
      idx0 = numPoints - 1;
      idx1 = numPoints - 1;
      weight = 0;
    }

    const p0 = points[idx0];
    const p1 = points[idx1];

    const pos = this._posCurve.getPoint(t);
    const scale = new THREE.Vector3().lerpVectors(p0.scale, p1.scale, weight);
    const q0 =
      p0.rot instanceof THREE.Quaternion
        ? p0.rot
        : new THREE.Quaternion().setFromEuler(p0.rot);
    const q1 =
      p1.rot instanceof THREE.Quaternion
        ? p1.rot
        : new THREE.Quaternion().setFromEuler(p1.rot);
    const quat = new THREE.Quaternion().copy(q0).slerp(q1, weight);

    return { pos, scale, quat };
  }

  _slice() {
    const positions = [];
    const texCoords = [];
    const indices = [];
    const rings = [];

    let wfPositions = null;
    let wfIndex = 0;
    if (this.wireframe && this.wireframe.visible) {
      wfPositions = this.wireframe.geometry.attributes.position.array;
    }

    for (let i = 0; i <= this._segments; i++) {
      const u = i / this._segments;
      const t = this._posCurve.getUtoTmapping(u);
      const state = this._getInterpolatedState(t);

      const hw = state.scale.x * 0.5;
      const hd = state.scale.z * 0.5;

      const p = [
        new THREE.Vector3(-hw, 0, -hd),
        new THREE.Vector3(hw, 0, -hd),
        new THREE.Vector3(hw, 0, hd),
        new THREE.Vector3(-hw, 0, hd),
      ];

      p.forEach((v) => v.applyQuaternion(state.quat).add(state.pos));
      rings.push(p);

      if (wfPositions) {
        p.forEach((v) => {
          wfPositions[wfIndex++] = v.x;
          wfPositions[wfIndex++] = v.y;
          wfPositions[wfIndex++] = v.z;
        });
      }
    }

    if (this.wireframe && this.wireframe.visible) {
      this.wireframe.geometry.attributes.position.needsUpdate = true;
    }

    let vertexOffset = 0;
    for (let s = 0; s < this._segments; s++) {
      const r1 = rings[s];
      const r2 = rings[s + 1];

      const corners = [r1[0], r1[1], r2[0], r2[1], r1[3], r1[2], r2[3], r2[2]];

      const uv0 = s / this._segments;
      const uv1 = (s + 1) / this._segments;

      const texs = [
        new THREE.Vector3(0, uv0, 0),
        new THREE.Vector3(1, uv0, 0),
        new THREE.Vector3(0, uv1, 0),
        new THREE.Vector3(1, uv1, 0),
        new THREE.Vector3(0, uv0, 1),
        new THREE.Vector3(1, uv0, 1),
        new THREE.Vector3(0, uv1, 1),
        new THREE.Vector3(1, uv1, 1),
      ];

      const result = this._sliceHexahedron(corners, texs, vertexOffset);

      for (let i = 0; i < result.p.length; i += 3)
        positions.push(result.p[i], result.p[i + 1], result.p[i + 2]);
      for (let i = 0; i < result.t.length; i += 3)
        texCoords.push(result.t[i], result.t[i + 1], result.t[i + 2]);
      for (let i = 0; i < result.i.length; i++) indices.push(result.i[i]);

      vertexOffset = result.nextIndex;
    }

    const geo = this.geometry;

    if (positions.length > geo.attributes.position.array.length) {
      console.warn(
        'VolumetricFire: Vertex buffer overflow. Increase buffer size or adjust segments/sliceSpacing.'
      );
      return;
    }

    geo.index.array.set(indices);
    geo.attributes.position.array.set(positions);
    geo.attributes.tex.array.set(texCoords);

    geo.index.needsUpdate = true;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.tex.needsUpdate = true;
    geo.setDrawRange(0, indices.length);
  }

  _sliceHexahedron(corners, texCoords, startIndex) {
    const cornerDist = corners.map((v) => v.dot(this._viewVector));
    const minD = Math.min(...cornerDist);
    const maxD = Math.max(...cornerDist);

    const maxCorner = cornerDist.indexOf(maxD);

    let sliceD = Math.floor(maxD / this._sliceSpacing) * this._sliceSpacing;

    const activeEdges = [];
    let nextEdge = 0;
    const expirations = new PriorityQueue();

    const createEdge = (sIdx, eIdx) => {
      if (nextEdge >= 12) return undefined;
      const edge = {
        sIdx,
        eIdx,
        dPos: new THREE.Vector3(),
        dTex: new THREE.Vector3(),
        pos: new THREE.Vector3(),
        tex: new THREE.Vector3(),
        prev: 0,
        next: 0,
        expired: false,
      };
      const range = cornerDist[sIdx] - cornerDist[eIdx];
      if (Math.abs(range) > 1e-5) {
        const ir = 1.0 / range;
        edge.dPos.subVectors(corners[eIdx], corners[sIdx]).multiplyScalar(ir);
        edge.dTex
          .subVectors(texCoords[eIdx], texCoords[sIdx])
          .multiplyScalar(ir);
        const step = cornerDist[sIdx] - sliceD;
        edge.pos.addVectors(
          edge.dPos.clone().multiplyScalar(step),
          corners[sIdx]
        );
        edge.tex.addVectors(
          edge.dTex.clone().multiplyScalar(step),
          texCoords[sIdx]
        );
        edge.dPos.multiplyScalar(this._sliceSpacing);
        edge.dTex.multiplyScalar(this._sliceSpacing);
      }
      expirations.push(edge, cornerDist[eIdx]);
      activeEdges[nextEdge++] = edge;
      return edge;
    };

    for (let i = 0; i < 3; i++) {
      const e = createEdge(maxCorner, this._cornerNeighbors[maxCorner][i]);
      e.prev = (i + 2) % 3;
      e.next = (i + 1) % 3;
    }

    const p = [];
    const t = [];
    const idx = [];
    let nextIndex = startIndex;
    let firstEdge = 0;

    while (sliceD > minD) {
      while (
        expirations.contents.length > 0 &&
        expirations.top().priority >= sliceD
      ) {
        const edge = expirations.pop().object;
        if (edge.expired) continue;

        if (!activeEdges[edge.prev] || !activeEdges[edge.next]) continue;

        if (
          edge.eIdx !== activeEdges[edge.prev].eIdx &&
          edge.eIdx !== activeEdges[edge.next].eIdx
        ) {
          edge.expired = true;
          const e1 = createEdge(
            edge.eIdx,
            this._incomingEdges[edge.eIdx][edge.sIdx]
          );
          if (!e1) break;
          e1.prev = edge.prev;
          activeEdges[edge.prev].next = nextEdge - 1;
          e1.next = nextEdge;

          const e2 = createEdge(
            edge.eIdx,
            this._incomingEdges[edge.eIdx][e1.eIdx]
          );
          if (!e2) break;
          e2.prev = nextEdge - 2;
          e2.next = edge.next;
          activeEdges[edge.next].prev = nextEdge - 1;
          activeEdges[e2.next].prev = nextEdge - 1;

          firstEdge = nextEdge - 1;
        } else {
          let prev;
          let next;
          if (edge.eIdx === activeEdges[edge.prev].eIdx) {
            prev = activeEdges[edge.prev];
            next = edge;
          } else {
            prev = edge;
            next = activeEdges[edge.next];
          }

          if (!prev || !next) continue;
          prev.expired = true;
          next.expired = true;

          const newE = createEdge(
            edge.eIdx,
            this._incomingEdges[edge.eIdx][prev.sIdx]
          );
          if (!newE) break;
          newE.prev = prev.prev;
          if (activeEdges[prev.prev])
            activeEdges[prev.prev].next = nextEdge - 1;
          newE.next = next.next;
          if (activeEdges[next.next])
            activeEdges[next.next].prev = nextEdge - 1;
          firstEdge = nextEdge - 1;
        }
      }

      let cur = firstEdge;
      let count = 0;
      let loopGuard = 0;
      while (loopGuard++ < 15) {
        if (!activeEdges[cur]) break;
        const ae = activeEdges[cur];
        p.push(ae.pos.x, ae.pos.y, ae.pos.z);
        t.push(ae.tex.x, ae.tex.y, ae.tex.z);
        ae.pos.add(ae.dPos);
        ae.tex.add(ae.dTex);
        cur = ae.next;
        count++;
        if (cur === firstEdge) break;
      }

      if (count >= 3) {
        for (let i = 2; i < count; i++)
          idx.push(nextIndex, nextIndex + i - 1, nextIndex + i);
        nextIndex += count;
      }
      sliceD -= this._sliceSpacing;
    }

    return { p, t, i: idx, nextIndex };
  }

  _initLatticeWireframe(segments) {
    const wfPos = new Float32Array((segments + 1) * 4 * 3);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(wfPos, 3));

    const wfIndices = [];
    for (let s = 0; s < segments; s++) {
      const b = s * 4;
      const t = (s + 1) * 4;
      for (let i = 0; i < 4; i++) {
        wfIndices.push(b + i, b + ((i + 1) % 4));
        wfIndices.push(b + i, t + i);
      }
    }
    const tb = segments * 4;
    for (let i = 0; i < 4; i++) wfIndices.push(tb + i, tb + ((i + 1) % 4));

    geom.setIndex(wfIndices);
    this.wireframe = new THREE.LineSegments(
      geom,
      new THREE.LineBasicMaterial({
        color: 0x44aaff,
        transparent: true,
        opacity: 0.3,
      })
    );
    this.wireframe.visible = true;
    this.add(this.wireframe);
  }

  setShowVolume(visible) {
    if (visible && !this.wireframe) {
      this._initLatticeWireframe(this._segments);
    }
    if (this.wireframe) {
      this.wireframe.visible = visible;
    }
  }
}

// ─── Procedural Textures ─────────────────────────────────────────────────────
// Both textures are generated once and cached for the lifetime of the module.

let noiseTextureCache = null;
let profileTextureCache = null;

function getNoiseTexture() {
  if (noiseTextureCache) return noiseTextureCache;

  // 64×64 gradient-noise lookup: unit vectors packed into RG channels [0,255].
  // The shader uses mBBS hashing to look up grid-cell gradients then
  // bi-linearly interpolates, so smooth LINEAR filtering is intentional.
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    data[i * 4 + 0] = Math.round((Math.cos(angle) * 0.5 + 0.5) * 255);
    data[i * 4 + 1] = Math.round((Math.sin(angle) * 0.5 + 0.5) * 255);
    data[i * 4 + 2] = 128;
    data[i * 4 + 3] = 255;
  }

  noiseTextureCache = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  noiseTextureCache.wrapS = THREE.RepeatWrapping;
  noiseTextureCache.wrapT = THREE.RepeatWrapping;
  noiseTextureCache.magFilter = THREE.LinearFilter;
  noiseTextureCache.minFilter = THREE.LinearFilter;
  noiseTextureCache.needsUpdate = true;
  return noiseTextureCache;
}

function getFireProfileTexture() {
  if (profileTextureCache) return profileTextureCache;

  // 64×64 fire color-profile lookup table.
  // U axis (x): radial distance from the flame axis (0 = center, 1 = edge).
  // V axis (y): vertical height (0 = base, 1 = tip).
  // DataTexture flipY is false by default, so row 0 = UV y=0 = base.
  const w = 64;
  const h = 64;
  const data = new Uint8Array(w * h * 4);

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const radial = x / (w - 1); // 0 = center, 1 = edge
      const ht = y / (h - 1); // 0 = base, 1 = tip

      const radialFalloff = Math.max(0, 1.0 - radial * 1.2);
      const heightAlpha = Math.max(0, 1.0 - ht * 0.92);
      const alpha = radialFalloff * heightAlpha;

      let r;
      let g;
      let b;
      if (ht < 0.12) {
        // Blue-white base
        const t = ht / 0.12;
        r = 0.5 + t * 0.5;
        g = 0.6 + t * 0.4;
        b = 1.0;
      } else if (ht < 0.35) {
        // White-yellow hot core
        const t = (ht - 0.12) / 0.23;
        r = 1.0;
        g = 1.0;
        b = 1.0 - t * 0.85;
      } else if (ht < 0.7) {
        // Orange body
        const t = (ht - 0.35) / 0.35;
        r = 1.0;
        g = 1.0 - t * 0.72;
        b = 0.15 - t * 0.12;
      } else {
        // Red fading tip
        const t = (ht - 0.7) / 0.3;
        r = 1.0 - t * 0.5;
        g = 0.28 - t * 0.28;
        b = 0.03;
      }

      const edgeFade = Math.max(0, 1.0 - radial * 1.1);
      const idx = (y * w + x) * 4;
      data[idx + 0] = Math.min(255, Math.round(r * edgeFade * 255));
      data[idx + 1] = Math.min(255, Math.round(g * edgeFade * 255));
      data[idx + 2] = Math.min(255, Math.round(b * edgeFade * 255));
      data[idx + 3] = Math.min(255, Math.round(alpha * 255));
    }
  }

  profileTextureCache = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  profileTextureCache.wrapS = THREE.ClampToEdgeWrapping;
  profileTextureCache.wrapT = THREE.ClampToEdgeWrapping;
  profileTextureCache.magFilter = THREE.LinearFilter;
  profileTextureCache.minFilter = THREE.LinearFilter;
  profileTextureCache.needsUpdate = true;
  return profileTextureCache;
}

// ─── Control-Point Helpers ────────────────────────────────────────────────────

const CP_COUNT = 5;

// ─── Curve Control-Point Helpers ─────────────────────────────────────────────

/**
 * Normalise one element of a curvePoints array into a full control-point
 * object `{ pos, scale, rot }` compatible with VolumetricFireMesh.setControlPoints.
 *
 * Accepted input shapes per element:
 *   • [x, y, z]                          — position only
 *   • { pos: [x,y,z] | Vector3 }         — position only
 *   • { pos, rot: Euler | Quaternion }   — position + explicit rotation
 *   • { pos, scale: [x,y,z] | Vector3 } — position + explicit scale
 *   • { pos, rot, scale }                — all three
 */
function normaliseCurvePoint(raw) {
  if (Array.isArray(raw)) {
    return {
      pos: new THREE.Vector3(raw[0], raw[1], raw[2]),
      scale: new THREE.Vector3(1, 1, 1),
      rot: new THREE.Quaternion(),
    };
  }
  const pos =
    raw.pos instanceof THREE.Vector3
      ? raw.pos.clone()
      : new THREE.Vector3(...(raw.pos ?? [0, 0, 0]));

  let rot = new THREE.Quaternion();
  if (raw.rot) {
    if (raw.rot instanceof THREE.Quaternion) {
      rot = raw.rot.clone();
    } else if (raw.rot instanceof THREE.Euler) {
      rot.setFromEuler(raw.rot);
    } else if (Array.isArray(raw.rot)) {
      // Accept [x,y,z] Euler radians or [x,y,z,w] quaternion
      if (raw.rot.length === 4) {
        rot.set(raw.rot[0], raw.rot[1], raw.rot[2], raw.rot[3]);
      } else {
        rot.setFromEuler(new THREE.Euler(raw.rot[0], raw.rot[1], raw.rot[2]));
      }
    }
  }

  let scale = new THREE.Vector3(1, 1, 1);
  if (raw.scale) {
    if (raw.scale instanceof THREE.Vector3) {
      scale = raw.scale.clone();
    } else if (Array.isArray(raw.scale)) {
      scale.set(raw.scale[0], raw.scale[1], raw.scale[2]);
    }
  }

  return { pos, scale, rot };
}

// Reusable scratch objects – avoids per-frame allocation in buildCurveControlPoints.
const _tangent = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _right = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _mat = new THREE.Matrix4();

/**
 * Convert a user-supplied curvePoints array into the VolumetricFireMesh
 * control-point format.
 *
 * @param {Array}  rawPoints  – array of user curve point descriptors (see normaliseCurvePoint)
 * @param {number} width      – default cross-section width (used when scale is not supplied)
 * @param {number} depth      – default cross-section depth
 * @param {boolean} autoRotate – align each ring to the curve tangent when rot is not supplied
 * @param {boolean} autoTaper – linearly shrink scale from base to tip by taperAmount when scale is not supplied
 * @param {number} taperAmount – fraction to shrink width/depth by at the tip (0 = none, 0.25 = 25% smaller)
 * @param {Array}  out        – optional pre-allocated array to write into (avoids GC)
 */
function buildCurveControlPoints(
  rawPoints,
  {
    width = 1,
    depth = 1,
    autoRotate = true,
    autoTaper = true,
    taperAmount = 0.25,
  } = {},
  out = null
) {
  const n = rawPoints.length;
  const result =
    out ??
    Array.from({ length: n }, () => ({
      pos: new THREE.Vector3(),
      scale: new THREE.Vector3(1, 1, 1),
      rot: new THREE.Quaternion(),
    }));

  // Build a temporary CatmullRom curve just for tangent queries.
  const posList = rawPoints.map((r) => normaliseCurvePoint(r).pos);
  const tmpCurve = new THREE.CatmullRomCurve3(posList, false, 'centripetal');

  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0;
    const norm = normaliseCurvePoint(rawPoints[i]);

    // ── Position: always from the curve for smooth interpolation ──
    result[i].pos.copy(tmpCurve.getPoint(t));

    // ── Scale: use supplied value or derive from width/depth + taper ──
    if (
      rawPoints[i] != null &&
      !Array.isArray(rawPoints[i]) &&
      rawPoints[i].scale
    ) {
      result[i].scale.copy(norm.scale);
    } else {
      const taper = autoTaper ? 1.0 - t * taperAmount : 1.0;
      result[i].scale.set(width * taper, 1, depth * taper);
    }

    // ── Rotation: use supplied value or align to tangent ──────────
    if (
      rawPoints[i] != null &&
      !Array.isArray(rawPoints[i]) &&
      rawPoints[i].rot
    ) {
      result[i].rot.copy(norm.rot);
    } else if (autoRotate && posList.length > 1) {
      // Get the curve tangent at this t, build a rotation matrix from it.
      tmpCurve.getTangent(t, _tangent).normalize();
      _right.crossVectors(_up, _tangent).normalize();
      // If tangent is nearly parallel to up (vertical curve), fall back to Z-right.
      if (_right.lengthSq() < 0.01) _right.set(0, 0, 1);
      const up2 = new THREE.Vector3()
        .crossVectors(_tangent, _right)
        .normalize();
      _mat.makeBasis(_right, up2, _tangent.clone().negate());
      result[i].rot.setFromRotationMatrix(_mat);
    } else {
      result[i].rot.copy(norm.rot);
    }
  }

  return result;
}

// Per-component pre-allocated pool for buildCurveControlPoints output.
// Keyed by point count so it grows on demand but never shrinks unnecessarily.
function makeCurvePool(count) {
  return Array.from({ length: count }, () => ({
    pos: new THREE.Vector3(),
    scale: new THREE.Vector3(1, 1, 1),
    rot: new THREE.Quaternion(),
  }));
}

// Pre-allocate the control-point objects to avoid per-frame GC pressure.
function makeControlPointPool(count) {
  return Array.from({ length: count }, () => ({
    pos: new THREE.Vector3(),
    scale: new THREE.Vector3(1, 1, 1),
    rot: new THREE.Quaternion(),
  }));
}

// Fill a pre-allocated pool with the current spline state.
// The flame leans upward from a fixed base toward (bendX, bendZ) at the tip,
// and tapers slightly in width/depth from base to tip.
function fillControlPoints(pool, height, width, depth, bendX, bendZ) {
  const halfH = height / 2;
  for (let i = 0; i < pool.length; i += 1) {
    const t = i / (pool.length - 1);
    const lean = t * t; // quadratic: zero at base, full bend at tip
    const w = width * (1.0 - t * 0.25);
    const d = depth * (1.0 - t * 0.25);
    pool[i].pos.set(bendX * lean, -halfH + t * height, bendZ * lean);
    pool[i].scale.set(w, 1, d);
    // rot stays identity – rotation handled by the outer group for inverted flames
  }
}

// ─── SplineGuide ─────────────────────────────────────────────────────────────
// Visualises the CatmullRom curve that drives the flame shape.
// Rendered as a thin blue line in the same coordinate space as the fire mesh.

const GUIDE_POINTS = 41;

function SplineGuide({ guideGeo }) {
  return (
    // eslint-disable-next-line react/no-unknown-property
    <line geometry={guideGeo}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <lineBasicMaterial color={0x44aaff} transparent opacity={0.7} />
    </line>
  );
}

// ─── VolumetricFire ──────────────────────────────────────────────────────────
/**
 * A volumetric, slice-rendered flame using view-aligned quads.
 *
 * Props
 * ─────
 * position     [x,y,z]  Base of the flame in parent space.
 * inverted     bool     Flip the flame downward (bottom wick).
 * width/depth  number   Flame footprint at the base.
 * height       number   Total flame height.
 * sliceSpacing number   Distance between slices (lower = more slices = higher quality, also more expensive).
 * segments     number   Lattice segments along the curve (changing this recreates the mesh).
 * bendX/bendZ  number   Static lean at the tip of the flame.
 * animated     bool     Apply a continuous wind-like sway on top of the static bend.
 * animSpeed    number   Multiplier on the sway animation rate.
 * showSpline   bool     Draw the underlying CatmullRom guide curve.
 * magnitude    number   Turbulence magnitude uniform.
 * lacunarity   number   Turbulence lacunarity uniform.
 * gain         number   Turbulence gain uniform.
 */
export default function VolumetricFire({
  position = [0, 0, 0],
  inverted = false,
  width = 0.35,
  height = 1.0,
  depth = 0.35,
  sliceSpacing = 0.05,
  segments = 24,
  bendX = 0,
  bendZ = 0,
  animated = true,
  animSpeed = 0.5,
  showSpline = false,
  showVolume = false,
  magnitude = 1.3,
  lacunarity = 2.0,
  gain = 0.5,
  tintColor = '#ffffff',
  saturation = 1.0,
  brightness = 1.5,
  controlPoints = null,
  // ── Curve path props ──────────────────────────────────────────────────────
  /**
   * curvePoints – drive the flame along an arbitrary 3-D path.
   *
   * Each element may be one of:
   *   • [x, y, z]                           – position only
   *   • { pos: [x,y,z] | Vector3 }          – position only
   *   • { pos, rot: Euler|Quaternion|[...] } – position + rotation
   *   • { pos, scale: [x,y,z] | Vector3 }   – position + scale
   *   • { pos, rot, scale }                  – all three
   *
   * When supplied, `controlPoints`, `bendX/Z`, `animated` and the
   * height-based halfH offset are all bypassed.
   *
   * Example – a simple arc:
   *   curvePoints={[
   *     [0, 0, 0],
   *     [1, 1, 0],
   *     [2, 0.5, -1],
   *   ]}
   *
   * Example – with explicit rotation and scale per point:
   *   curvePoints={[
   *     { pos: [0,0,0], rot: new THREE.Euler(0, 0, Math.PI/4), scale: [0.4, 1, 0.4] },
   *     { pos: [0,1,0], rot: new THREE.Quaternion(), scale: [0.3, 1, 0.3] },
   *   ]}
   */
  curvePoints = null,
  /** Auto-align each ring to the curve tangent (only used when curvePoints is set and a point has no explicit rot). */
  curveAutoRotate = true,
  /** Taper the flame cross-section from base to tip along the curve. */
  curveAutoTaper = true,
  /** Fraction to shrink width/depth at the tip (0 = no taper, 0.25 = 25% narrower at tip). */
  curveTaperAmount = 0.25,
  /** Draw the curve path as a visible line (like showSpline, but for curvePoints). */
  showCurve = false,
}) {
  const { camera } = useThree();

  // Animation accumulator – kept as a ref to avoid re-renders.
  const animTimeRef = useRef(0);
  // Tracks latest static bend from props without triggering recreation.
  const baseBendRef = useRef({ x: bendX, z: bendZ });
  // Pre-allocated control-point pool (recreated only when CP_COUNT changes).
  const cpPoolRef = useRef(null);
  if (!cpPoolRef.current) cpPoolRef.current = makeControlPointPool(CP_COUNT);

  // Pre-allocated pool for curvePoints output – grown on demand, never triggers
  // a re-render, avoids per-frame GC pressure.
  const curvePoolRef = useRef(null);

  // ── Create VolumetricFireMesh ──────────────────────────────────────────────
  // Only `camera` and `segments` require a new instance; shape / spacing are
  // mutated imperatively inside useFrame / useEffect.
  const fire = useMemo(
    () =>
      new VolumetricFireMesh({
        width,
        height,
        depth,
        sliceSpacing,
        segments,
        camera,
        textureNoise: getNoiseTexture(),
        textureProfile: getFireProfileTexture(),
      }),
    [camera, segments] // segments changes require a new buffer allocation
  );

  // ── Sync shader uniforms ──────────────────────────────────────────────────
  useEffect(() => {
    fire.material.uniforms.magnitude.value = magnitude;
    fire.material.uniforms.lacunarity.value = lacunarity;
    fire.material.uniforms.gain.value = gain;
  }, [fire, magnitude, lacunarity, gain]);

  useEffect(() => {
    fire.material.uniforms.colorTint.value.set(tintColor);
  }, [fire, tintColor]);

  useEffect(() => {
    fire.material.uniforms.saturation.value = saturation;
    fire.material.uniforms.brightness.value = brightness;
  }, [fire, saturation, brightness]);

  // ── Sync slice spacing (mutable without recreating the mesh) ─────────────
  useEffect(() => {
    // eslint-disable-next-line no-underscore-dangle
    fire._sliceSpacing = sliceSpacing;
  }, [fire, sliceSpacing]);

  // ── Toggle volume wireframe ───────────────────────────────────────────────
  useEffect(() => {
    fire.setShowVolume(showVolume);
  }, [fire, showVolume]);

  // ── Sync base bend from props ─────────────────────────────────────────────
  useEffect(() => {
    baseBendRef.current = { x: bendX, z: bendZ };
  }, [bendX, bendZ]);

  // ── Dispose geometry + material when instance changes or unmounts ─────────
  useEffect(
    () => () => {
      fire.geometry.dispose();
      fire.material.dispose();
    },
    [fire]
  );

  // ── Guide geometry (preallocated, recreated only when needed) ────────────
  const guideGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(GUIDE_POINTS * 3), 3)
    );
    return geo;
  }, []);

  useEffect(() => () => guideGeo.dispose(), [guideGeo]);

  // ── Curve guide geometry (for showCurve) ─────────────────────────────────
  const curveGuideGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(GUIDE_POINTS * 3), 3)
    );
    return geo;
  }, []);

  useEffect(() => () => curveGuideGeo.dispose(), [curveGuideGeo]);

  // ── Per-frame update ──────────────────────────────────────────────────────
  useFrame(({ clock }, delta) => {
    if (curvePoints && curvePoints.length >= 2) {
      // Grow the pool if the point count has changed.
      if (
        !curvePoolRef.current ||
        curvePoolRef.current.length !== curvePoints.length
      ) {
        curvePoolRef.current = makeCurvePool(curvePoints.length);
      }
      buildCurveControlPoints(
        curvePoints,
        {
          width,
          depth,
          autoRotate: curveAutoRotate,
          autoTaper: curveAutoTaper,
          taperAmount: curveTaperAmount,
        },
        curvePoolRef.current
      );
      fire.setControlPoints(curvePoolRef.current);

      if (showCurve) {
        const curve = fire._posCurve; // eslint-disable-line no-underscore-dangle
        if (curve?.points?.length > 1) {
          const pts = curve.getPoints(GUIDE_POINTS - 1);
          const attr = curveGuideGeo.attributes.position;
          for (let i = 0; i < pts.length; i += 1) {
            attr.setXYZ(i, pts[i].x, pts[i].y, pts[i].z);
          }
          attr.needsUpdate = true;
        }
      }
    } else if (controlPoints) {
      fire.setControlPoints(controlPoints);
    } else {
      let bx = baseBendRef.current.x;
      let bz = baseBendRef.current.z;

      if (animated) {
        animTimeRef.current += delta * animSpeed;
        const t = animTimeRef.current;
        // Layered sinusoids give asymmetric, organic sway.
        bx += Math.sin(t * 0.8) * 0.14 + Math.sin(t * 2.1 + 0.5) * 0.04;
        bz += Math.cos(t * 0.65 + 1.2) * 0.07 + Math.cos(t * 1.7) * 0.03;
      }

      fillControlPoints(cpPoolRef.current, height, width, depth, bx, bz);
      fire.setControlPoints(cpPoolRef.current);
    }
    fire.update(clock.getElapsedTime());

    if (showSpline) {
      // eslint-disable-next-line no-underscore-dangle
      const curve = fire._posCurve;
      if (curve?.points?.length > 1) {
        const pts = curve.getPoints(GUIDE_POINTS - 1);
        const attr = guideGeo.attributes.position;
        for (let i = 0; i < pts.length; i += 1) {
          attr.setXYZ(i, pts[i].x, pts[i].y, pts[i].z);
        }
        attr.needsUpdate = true;
      }
    }
  });

  // ── Positioning ──────────────────────────────────────────────────────────
  // VolumetricFire centers its geometry at its own origin (flame spans
  // -halfH → +halfH).  The inner group shifts it up by halfH so the flame
  // *base* aligns with the supplied `position` prop, matching the behaviour
  // of the existing shader Flame component.
  // For inverted flames the outer group's π-rotation flips Y, turning the
  // upward offset into a downward offset automatically.
  // When curvePoints drives the shape the geometry already spans the full
  // curve, so no offset is needed.
  const halfH = controlPoints || curvePoints ? 0 : height / 2;

  return (
    <group
      position={position}
      rotation={inverted ? [Math.PI, 0, 0] : [0, 0, 0]}
    >
      <group position={[0, halfH, 0]}>
        <primitive object={fire} />
        {showSpline && <SplineGuide guideGeo={guideGeo} />}
        {showCurve && (
          <line geometry={curveGuideGeo}>
            {/* eslint-disable-next-line react/no-unknown-property */}
            <lineBasicMaterial color={0xff6600} transparent opacity={0.8} />
          </line>
        )}
      </group>
    </group>
  );
}
