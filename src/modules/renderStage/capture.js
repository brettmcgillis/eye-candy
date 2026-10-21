import { normalView, pass, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

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
