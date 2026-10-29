/* eslint-disable no-param-reassign */
import * as THREE from 'three';

import { renderThoughtSvg, thoughtInks } from '@modules/cumulus';
import { readMeshes } from '@modules/renderStage';

function rows(bytes, width, height) {
  const data = new Uint8Array(bytes.length);
  for (let y = 0; y < height; y += 1)
    data.set(
      bytes.subarray((height - 1 - y) * width * 4, (height - y) * width * 4),
      y * width * 4
    );
  return { data, height, width };
}
export function readFrame(renderer, scene, camera, width, height, srgb = true) {
  const target = new THREE.WebGLRenderTarget(width, height, {
    type: THREE.UnsignedByteType,
  });
  target.texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  const previous = renderer.getRenderTarget();
  try {
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    const bytes = new Uint8Array(width * height * 4);
    renderer.readRenderTargetPixels(target, 0, 0, width, height, bytes);
    return rows(bytes, width, height);
  } finally {
    renderer.setRenderTarget(previous);
    target.dispose();
  }
}
export function viewOf(camera, target) {
  return {
    eye: camera.position.toArray(),
    target,
    up: camera.up.toArray(),
    near: camera.near,
    far: camera.far,
    fov: camera.fov,
    aspect: camera.aspect,
  };
}
// Network points draw at a fixed screen size, so each becomes a circle of
// that size facing the camera.
function worldLines(root, { camera, height, nodes }) {
  const lines = [];
  const point = new THREE.Vector3();
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  const ahead = camera.getWorldDirection(new THREE.Vector3());
  const perPx =
    (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / height;
  root.traverseVisible((node) => {
    if (!node.isLine && !node.isPoints) return;
    const attr = node.geometry.attributes.position;
    if (!attr) return;
    const count = Math.min(
      node.geometry.drawRange.count,
      node.geometry.index?.count ?? attr.count
    );
    const at = (i) => {
      point
        .fromBufferAttribute(
          attr,
          node.geometry.index ? node.geometry.index.getX(i) : i
        )
        .applyMatrix4(node.matrixWorld);
      return point.toArray();
    };
    if (node.isPoints) {
      if (nodes === 'none') return;
      const size = node.material.size ?? 1;
      for (let i = 0; i < count; i += 1) {
        const p = new THREE.Vector3(...at(i));
        const depth = p.clone().sub(camera.position).dot(ahead);
        const radius = (size / 2) * depth * perPx;
        const ring = [];
        for (let k = 0; k <= 12; k += 1) {
          const a = (k / 12) * Math.PI * 2;
          ring.push(
            p
              .clone()
              .addScaledVector(right, Math.cos(a) * radius)
              .addScaledVector(up, Math.sin(a) * radius)
              .toArray()
          );
        }
        lines.push(ring);
      }
    } else {
      for (let i = 0; i + 1 < count; i += node.isLineSegments ? 2 : 1)
        lines.push([at(i), at(i + 1)]);
    }
  });
  return lines;
}
export function plotFrame({
  camera,
  inks = {},
  options,
  renderer,
  scene,
  subject,
  target,
}) {
  const width = Math.round(options.width * options.pixelRatio);
  const height = Math.round(options.height * options.pixelRatio);
  const originalBackground = scene.background;
  const originals = [];
  const temporary = [];
  const oldToneMapping = renderer.toneMapping;
  const oldClearAlpha = renderer.getClearAlpha();
  const depth = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    side: THREE.DoubleSide,
  });
  const bones = [];
  const clouds = [];
  const censors = new Set();
  subject.traverseVisible((node) => {
    if (node.userData.plotAnatomy) bones.push(node);
    if (node.userData.plotCloud) clouds.push(node);
    if (node.userData.plotCensor)
      node.traverse((part) => {
        if (part.isMesh) censors.add(part);
      });
  });
  const show = (nodes, visible) =>
    nodes.forEach((node) => {
      node.visible = visible;
    });
  const anatomy = bones.flatMap((node) => readMeshes(node));
  show([...bones, ...clouds], false);
  const meshes = readMeshes(subject);
  show([...bones, ...clouds], true);
  const lines = worldLines(subject, {
    camera,
    height: options.height,
    nodes: options.svgNodes,
  });
  let image;
  let solid;
  let albedo;
  let packed;
  let censorPass = null;
  try {
    scene.background = null;
    renderer.setClearAlpha(0);
    image = readFrame(renderer, scene, camera, width, height);
    show(clouds, false);
    solid = readFrame(renderer, scene, camera, width, height);
    show(clouds, true);
    subject.traverseVisible((node) => {
      if (!node.material) return;
      originals.push([node, node.material]);
      const flat = (source) => {
        if (source.isShaderMaterial || !node.isMesh) return source;
        const material = new THREE.MeshBasicMaterial({
          color: source.color ?? '#ffffff',
          map: source.map,
          side: source.side,
          transparent: source.transparent,
          opacity: source.opacity,
          alphaTest: source.alphaTest,
          vertexColors: source.vertexColors,
        });
        temporary.push(material);
        return material;
      };
      node.material = Array.isArray(node.material)
        ? node.material.map(flat)
        : flat(node.material);
    });
    renderer.toneMapping = THREE.NoToneMapping;
    albedo = readFrame(renderer, scene, camera, width, height);
    if (censors.size) {
      // Which pixels the censor itself draws: it white, all else black.
      const ink = (color) => {
        const material = new THREE.MeshBasicMaterial({ color });
        temporary.push(material);
        return material;
      };
      const white = ink('#ffffff');
      const black = ink('#000000');
      const strokes = originals
        .filter(([node]) => !node.isMesh)
        .map(([node]) => node);
      show(clouds, false);
      show(strokes, false);
      originals.forEach(([node]) => {
        if (node.isMesh) node.material = censors.has(node) ? white : black;
      });
      censorPass = readFrame(renderer, scene, camera, width, height);
      show(strokes, true);
      show(clouds, true);
    }
    originals.forEach(([node]) => {
      if (node.isMesh) node.material = depth;
    });
    show(clouds, false);
    packed = readFrame(renderer, scene, camera, width, height, false);
  } finally {
    show(clouds, true);
    originals.forEach(([node, material]) => {
      node.material = material;
    });
    temporary.forEach((material) => material.dispose());
    depth.dispose();
    scene.background = originalBackground;
    renderer.toneMapping = oldToneMapping;
    renderer.setClearAlpha(oldClearAlpha);
  }
  albedo.covered = new Uint8Array(width * height);
  for (let i = 0; i < albedo.covered.length; i += 1)
    albedo.covered[i] = albedo.data[i * 4 + 3] > 16 ? 1 : 0;
  const data = new Float32Array(width * height);
  const covered = new Uint8Array(data.length);
  const solids = new Uint8Array(data.length);
  const cloud = new Uint8Array(data.length);
  const censor = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 1) {
    const j = i * 4;
    const unit =
      packed.data[j] / 256 +
      packed.data[j + 1] / 65536 +
      packed.data[j + 2] / 16777216 +
      packed.data[j + 3] / (255 * 16777216);
    data[i] =
      (camera.near * camera.far) /
      (camera.far - unit * (camera.far - camera.near));
    covered[i] = image.data[j + 3] > 16 ? 1 : 0;
    solids[i] = solid.data[j + 3] > 16 ? 1 : 0;
    cloud[i] = covered[i] && !solids[i] ? 1 : 0;
    censor[i] = censorPass && covered[i] && censorPass.data[j] > 127 ? 1 : 0;
  }
  const visible = options.svgOcclusion
    ? (x, y, z) => {
        const px = Math.round(x * options.pixelRatio);
        const py = Math.round(y * options.pixelRatio);
        let farthest = 0;
        for (let dy = -1; dy <= 1; dy += 1)
          for (let dx = -1; dx <= 1; dx += 1) {
            const sx = Math.max(0, Math.min(width - 1, px + dx));
            const sy = Math.max(0, Math.min(height - 1, py + dy));
            farthest = Math.max(
              farthest,
              solids[sy * width + sx] ? data[sy * width + sx] : camera.far
            );
          }
        return z <= farthest + 0.015;
      }
    : null;
  const coverage = { covered, data, height, width };
  // Every view of a generation plots in the inks its first view picked.
  inks.palette ??= thoughtInks({ albedo, coverage, options });
  return renderThoughtSvg({
    albedo,
    anatomy,
    camera: viewOf(camera, target),
    censor: censorPass ? { covered: censor, height, width } : null,
    cloud: { covered: cloud, height, width },
    coverage,
    image,
    lines,
    meshes,
    options,
    palette: inks.palette,
    visible,
  });
}
