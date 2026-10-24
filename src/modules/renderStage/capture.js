import { normalView, pass, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

const vertex = new THREE.Vector3();
const normal = new THREE.Vector3();
const instance = new THREE.Matrix4();
const placed = new THREE.Matrix4();

// One mesh's vertices through `matrix` (skinned on the CPU exactly as the
// GPU skins them), beside the rest positions that weld its seams.
export function meshEntry(mesh, matrix, displace = null) {
  const { index, attributes } = mesh.geometry;
  const { position } = attributes;
  const world = new Float32Array(position.count * 3);
  const rest = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i);
    rest[i * 3] = vertex.x;
    rest[i * 3 + 1] = vertex.y;
    rest[i * 3 + 2] = vertex.z;
    if (displace) {
      normal.fromBufferAttribute(attributes.normal, i);
      vertex.fromArray(displace(vertex.toArray(), normal.toArray()));
    } else if (mesh.isSkinnedMesh) {
      mesh.getVertexPosition(i, vertex);
    }
    vertex.applyMatrix4(matrix);
    world[i * 3] = vertex.x;
    world[i * 3 + 1] = vertex.y;
    world[i * 3 + 2] = vertex.z;
  }
  return {
    index: index ? Uint32Array.from(index.array) : null,
    position: world,
    rest,
  };
}

const plotted = (object) =>
  object.isMesh &&
  object.visible &&
  object.geometry?.attributes?.position &&
  object.userData.plot !== false;

// Every plotted mesh under `root` in world space (`userData.plot = false`
// opts one out), an instanced mesh as one entry per instance, each beside
// the rest positions that weld its seams.
export function readMeshes(root) {
  const entries = [];
  root.traverseVisible((object) => {
    if (!plotted(object)) return;
    if (object.isInstancedMesh) {
      for (let i = 0; i < object.count; i += 1) {
        object.getMatrixAt(i, instance);
        placed.multiplyMatrices(object.matrixWorld, instance);
        entries.push(meshEntry(object, placed));
      }
    } else {
      entries.push(meshEntry(object, object.matrixWorld));
    }
  });
  return entries;
}

// Points a camera at a framed view ({ eye, target, up, fov, near, far }).
export function aimCamera(camera, view, aspect) {
  Object.assign(camera, {
    aspect,
    far: view.far,
    fov: view.fov,
    near: view.near,
  });
  camera.up.set(...view.up);
  camera.position.set(...view.eye);
  camera.lookAt(...view.target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

// Hides everything that is neither one of `only`, inside one nor one of
// their ancestors; returns the undo.
/* eslint-disable no-param-reassign */
function isolate(scene, only) {
  const kept = new Set(only);
  const keep = new Set();
  only.forEach((object) =>
    object.traverseAncestors((ancestor) => keep.add(ancestor))
  );
  const hidden = [];
  const walk = (object) => {
    object.children.forEach((child) => {
      if (kept.has(child)) return;
      if (keep.has(child)) walk(child);
      else if (child.visible) {
        hidden.push(child);
        child.visible = false;
      }
    });
  };
  walk(scene);
  return () =>
    hidden.forEach((object) => {
      object.visible = true;
    });
}
/* eslint-enable no-param-reassign */

// Linear view depth over two 8-bit channels, for a plot's hidden-line test
// and silhouette. `only` (an object or a list) limits the pass to the
// subject, so a floor neither hides lines nor joins the outline; `covered`
// marks its pixels.
export function createDepthCapture(renderer) {
  let cached = null;

  return async function captureDepth(scene, camera, width, height, only) {
    if (cached?.scene !== scene || cached?.camera !== camera) {
      cached?.pipeline.dispose?.();
      const linear = pass(scene, camera).getLinearDepthNode();
      const unit = linear.clamp(0, 1).mul(65535);
      const high = unit.div(256).floor();
      const pipeline = new THREE.RenderPipeline(renderer);
      pipeline.outputColorTransform = false;
      pipeline.outputNode = vec4(
        high.div(255),
        unit.sub(high.mul(256)).floor().div(255),
        0,
        1
      );
      cached = { camera, pipeline, scene };
    }
    const target = new THREE.RenderTarget(width, height, {
      colorSpace: THREE.NoColorSpace,
    });
    let restore = () => {};
    if (only) restore = isolate(scene, Array.isArray(only) ? only : [only]);
    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget(target);
    cached.pipeline.render();
    renderer.setRenderTarget(previous);
    restore();
    const pixels = await renderer.readRenderTargetPixelsAsync(
      target,
      0,
      0,
      width,
      height
    );
    target.dispose();
    // WebGPU pads each row to 256 bytes except the last.
    const stride =
      pixels.length === width * 4 * height
        ? width * 4
        : Math.ceil((width * 4) / 256) * 256;
    const depths = new Float32Array(width * height);
    const covered = new Uint8Array(width * height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = y * stride + x * 4;
        const unitDepth = (pixels[i] * 256 + pixels[i + 1]) / 65535;
        depths[y * width + x] =
          camera.near + unitDepth * (camera.far - camera.near);
        covered[y * width + x] = unitDepth < 0.9999 ? 1 : 0;
      }
    }
    return { covered, data: depths, height, width };
  };
}

// A hidden-line test in output pixels: the farthest of a 5×5 patch, so a
// line is not hidden by the surface it is drawn on, even where that surface
// is steep to the camera.
export function depthProbe(depth, pixelRatio, bias = 0.02, reach = 2) {
  const clampTo = (v, max) => Math.min(Math.max(v, 0), max - 1);
  return (x, y, z) => {
    const px = Math.round(x * pixelRatio);
    const py = Math.round(y * pixelRatio);
    let farthest = -Infinity;
    for (let dy = -reach; dy <= reach; dy += 1) {
      for (let dx = -reach; dx <= reach; dx += 1) {
        const sx = clampTo(px + dx, depth.width);
        const sy = clampTo(py + dy, depth.height);
        farthest = Math.max(farthest, depth.data[sy * depth.width + sx]);
      }
    }
    return z <= farthest + bias;
  };
}

// A readback with WebGPU's row padding removed (every row but the last is
// padded to 256 bytes).
export function tightRows(pixels, width, height) {
  const stride =
    pixels.length === width * 4 * height
      ? width * 4
      : Math.ceil((width * 4) / 256) * 256;
  if (stride === width * 4) {
    return new Uint8ClampedArray(
      pixels.buffer,
      pixels.byteOffset,
      pixels.length
    );
  }
  const tight = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    tight.set(
      pixels.subarray(y * stride, y * stride + width * 4),
      y * width * 4
    );
  }
  return tight;
}

// View-space normals of `only` (an object or a list) as a Float32Array of
// xyz per pixel, for plots that split a surface where it creases.
export function createNormalCapture(renderer) {
  const material = new THREE.MeshBasicNodeMaterial();
  material.fragmentNode = vec4(normalView.mul(0.5).add(0.5), 1);

  return async function captureNormals(scene, camera, width, height, only) {
    const target = new THREE.RenderTarget(width, height, {
      colorSpace: THREE.NoColorSpace,
    });
    const restore = isolate(scene, Array.isArray(only) ? only : [only]);
    const { background, overrideMaterial } = scene;
    Object.assign(scene, { background: null, overrideMaterial: material });
    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(previous);
    Object.assign(scene, { background, overrideMaterial });
    restore();
    const pixels = tightRows(
      await renderer.readRenderTargetPixelsAsync(target, 0, 0, width, height),
      width,
      height
    );
    target.dispose();
    const normals = new Float32Array(width * height * 3);
    for (let i = 0; i < width * height; i += 1) {
      for (let c = 0; c < 3; c += 1) {
        normals[i * 3 + c] = (pixels[i * 4 + c] / 255) * 2 - 1;
      }
    }
    return normals;
  };
}

const toSrgb = (v) =>
  Math.round(
    255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055)
  );

// Each material's flat colour — base colour × map, unlit, unfogged — built
// once per source material.
function flatOf(material, cache) {
  const source = Array.isArray(material) ? material[0] : material;
  if (!source) return null;
  if (!cache.has(source)) {
    const flat = new THREE.MeshBasicNodeMaterial({
      alphaTest: source.alphaTest,
      color: source.color ?? new THREE.Color(1, 1, 1),
      fog: false,
      map: source.map ?? null,
      side: source.side,
      toneMapped: false,
      vertexColors: source.vertexColors,
    });
    // A node material's colour (a per-state or per-instance palette) is its
    // albedo too, and its GPU-placed vertices (a solved membrane, a grown
    // tube) are where it draws.
    if (source.colorNode) flat.colorNode = source.colorNode;
    if (source.positionNode) flat.positionNode = source.positionNode;
    if (source.maskNode) flat.maskNode = source.maskNode;
    // A ray-marched surface draws itself: its own shading stands in.
    if (source.fragmentNode) {
      flat.fragmentNode = source.fragmentNode;
      flat.depthNode = source.depthNode;
    }
    cache.set(source, flat);
  }
  return cache.get(source);
}

// The subject's albedo — every mesh of `only` in its flat material colour,
// no light, fog or background — as sRGB RGBA, with `covered` where it drew.
// A plot picks its inks from this, so a shaded or night render keeps the
// scene's real colours.
export function createAlbedoCapture(renderer) {
  const cache = new Map();
  const captureAlbedo = async (scene, camera, width, height, only) => {
    const list = Array.isArray(only) ? only : [only];
    const restore = isolate(scene, list);
    const swapped = [];
    list.forEach((root) =>
      root.traverse((object) => {
        if (!object.isMesh) return;
        const flat = flatOf(object.material, cache);
        if (!flat) return;
        swapped.push([object, object.material]);
        Object.assign(object, { material: flat });
      })
    );
    const { background, fog } = scene;
    Object.assign(scene, { background: null, fog: null });
    const target = new THREE.RenderTarget(width, height, {
      colorSpace: THREE.NoColorSpace,
      type: THREE.HalfFloatType,
    });
    const previous = renderer.getRenderTarget();
    const clear = renderer.getClearAlpha();
    renderer.setClearAlpha(0);
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(previous);
    renderer.setClearAlpha(clear);
    Object.assign(scene, { background, fog });
    swapped.forEach(([object, material]) =>
      Object.assign(object, { material })
    );
    restore();
    const raw = await renderer.readRenderTargetPixelsAsync(
      target,
      0,
      0,
      width,
      height
    );
    target.dispose();
    // Four half floats a pixel, rows padded to 256 bytes but the last.
    const half = raw instanceof Uint16Array;
    const tight = raw.length === width * height * 4;
    const stride = tight ? width * 4 : Math.ceil((width * 8) / 256) * 128;
    const data = new Uint8ClampedArray(width * height * 4);
    const covered = new Uint8Array(width * height);
    const value = (v) => (half ? THREE.DataUtils.fromHalfFloat(v) : v);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = y * stride + x * 4;
        const o = (y * width + x) * 4;
        const alpha = value(raw[i + 3]);
        covered[y * width + x] = alpha > 0.5 ? 1 : 0;
        for (let c = 0; c < 3; c += 1) {
          data[o + c] = toSrgb(Math.min(1, Math.max(0, value(raw[i + c]))));
        }
        data[o + 3] = 255;
      }
    }
    return { covered, data, height, width };
  };
  captureAlbedo.dispose = () => {
    cache.forEach((material) => material.dispose());
    cache.clear();
  };
  return captureAlbedo;
}

// A transparent capture clears to zero alpha and draws no background, so the
// subject keeps its edges when WebP / WebM carry the alpha out. A rig tags
// the world it draws round the subject: `userData.backdrop = 'shadow'` (a
// floor or wall) keeps only the shadows falling on it, `'hide'` goes.
export function setBackdrop(
  { renderer, scene },
  color,
  transparent,
  { shadowOpacity = 0.5 } = {}
) {
  /* eslint-disable no-param-reassign */
  scene.background = transparent ? null : new THREE.Color(color);
  scene.traverse((object) => {
    const role = object.userData.backdrop;
    if (role === 'hide') object.visible = !transparent;
    if (role !== 'shadow' || !object.isMesh) return;
    const { userData } = object;
    if (transparent && !userData.ownMaterial) {
      userData.ownMaterial = object.material;
      userData.shadowMaterial ??= new THREE.ShadowNodeMaterial({
        opacity: shadowOpacity,
        transparent: true,
      });
      object.material = userData.shadowMaterial;
    } else if (!transparent && userData.ownMaterial) {
      object.material = userData.ownMaterial;
      userData.ownMaterial = null;
    }
  });
  /* eslint-enable no-param-reassign */
  renderer.setClearColor(transparent ? 0x000000 : color, transparent ? 0 : 1);
}
