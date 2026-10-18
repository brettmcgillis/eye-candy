import { pass, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { ghostLattice } from '@modules/ghostBuster';

import { resolveSkin } from './skins';

// The settled cloth in world space, read back from the sim's GPU buffer.
export async function readGhostLattice(renderer, ghost, skinName) {
  const { mesh, sim } = ghost;
  const buffer = await renderer.getArrayBufferAsync(sim.posBuf.value);
  mesh.updateWorldMatrix(true, false);
  return ghostLattice({
    local: new Float32Array(buffer),
    matrixWorld: mesh.matrixWorld.elements,
    skin: resolveSkin(skinName),
  });
}

// Points the R3F default camera at a frameGhost() view.
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

// Hides everything that is neither `only`, inside it nor one of its
// ancestors; returns the undo.
/* eslint-disable no-param-reassign */
function isolate(scene, only) {
  const keep = new Set();
  only.traverseAncestors((ancestor) => keep.add(ancestor));
  const hidden = [];
  const walk = (object) => {
    object.children.forEach((child) => {
      if (child === only) return;
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

// Linear view depth over two 8-bit channels, for the plot's hidden-line test
// and silhouette. `only` limits the pass to one object (the cloth), so the
// floor neither hides lines nor joins the outline; `covered` marks its pixels.
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
    const restore = only ? isolate(scene, only) : () => {};
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
// line is not hidden by the cloth it is drawn on, even where that cloth is
// steep to the camera.
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
