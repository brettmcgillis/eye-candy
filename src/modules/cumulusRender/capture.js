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
function readCloud(renderer, scene, camera, subject, width, height) {
  const hidden = [];
  const opacities = new Map();
  const blocker = new THREE.MeshBasicMaterial({
    colorWrite: false,
    side: THREE.DoubleSide,
  });
  subject.traverseVisible((node) => {
    let parent = node;
    while (parent && !parent.userData.plotCloud) parent = parent.parent;
    if (!node.material) return;
    if (parent) {
      const materials = Array.isArray(node.material)
        ? node.material
        : [node.material];
      materials.forEach((material) => {
        if (opacities.has(material)) return;
        opacities.set(material, material.opacity);
        material.opacity *= 0.18;
      });
      return;
    }
    hidden.push([node, node.material, node.visible]);
    if (node.isMesh) node.material = blocker;
    else node.visible = false;
  });
  try {
    return readFrame(renderer, scene, camera, width, height);
  } finally {
    hidden.forEach(([node, material, visible]) => {
      node.material = material;
      node.visible = visible;
    });
    opacities.forEach((opacity, material) => {
      material.opacity = opacity;
    });
    blocker.dispose();
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
function cloudPuffsOf(clouds, camera, width, height) {
  const puffs = [];
  const instance = new THREE.Matrix4();
  const matrix = new THREE.Matrix4();
  const center = new THREE.Vector3();
  const edge = new THREE.Vector3();
  clouds.forEach((cloud) =>
    cloud.traverseVisible((node) => {
      if (!node.isInstancedMesh) return;
      for (let i = 0; i < node.count; i += 1) {
        node.getMatrixAt(i, instance);
        matrix.multiplyMatrices(node.matrixWorld, instance);
        center.set(0, 0, 0).applyMatrix4(matrix);
        const depth = -center.clone().applyMatrix4(camera.matrixWorldInverse).z;
        center.project(camera);
        edge
          .set((node.geometry.parameters.width ?? 1) * 0.5, 0, 0)
          .applyMatrix4(matrix)
          .project(camera);
        const radiusX = Math.hypot(
          (edge.x - center.x) * width * 0.5,
          (edge.y - center.y) * height * 0.5
        );
        edge
          .set(0, (node.geometry.parameters.height ?? 1) * 0.5, 0)
          .applyMatrix4(matrix)
          .project(camera);
        const radiusY = Math.hypot(
          (edge.x - center.x) * width * 0.5,
          (edge.y - center.y) * height * 0.5
        );
        puffs.push({
          x: (center.x + 1) * width * 0.5,
          y: (1 - center.y) * height * 0.5,
          radius: Math.min(radiusX, radiusY),
          depth,
        });
      }
    })
  );
  return puffs;
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
  const censorUniforms = [...censors]
    .map((node) => node.material.uniforms?.pixelSize)
    .filter(Boolean);
  const previousPixels = censorUniforms.map((uniform) => uniform.value);
  const plotPixels =
    options.svgDrawing === 'ink'
      ? Math.max(
          1,
          Math.round(
            ((options.svgCensorCellMm ?? 4) * width) /
              (options.plotWidthMm || (options.width * 25.4) / 96)
          )
        )
      : null;
  const applyPixelGrid = () => {
    if (plotPixels)
      censorUniforms.forEach((uniform) => {
        uniform.value = plotPixels;
      });
  };
  const censorGrid = plotPixels
    ? {
        step: plotPixels,
        offsetX: plotPixels * 0.5,
        offsetY:
          (((height - plotPixels * 0.5) % plotPixels) + plotPixels) %
          plotPixels,
      }
    : null;
  const show = (nodes, visible) =>
    nodes.forEach((node) => {
      node.visible = visible;
    });
  const anatomy =
    options.svgAnatomyDetail === 'mesh'
      ? bones.flatMap((node) => readMeshes(node))
      : [];
  show([...bones, ...clouds, ...censors], false);
  const meshes = readMeshes(subject);
  show([...bones, ...clouds, ...censors], true);
  const lines = worldLines(subject, {
    camera,
    height: options.height,
    nodes: options.svgNodes,
  });
  let image;
  let solid;
  let albedo;
  let packed;
  let regionPass;
  let normals;
  let cloudImage;
  let censorSubject;
  try {
    scene.background = null;
    renderer.setClearAlpha(0);
    applyPixelGrid();
    image = readFrame(renderer, scene, camera, width, height);
    cloudImage = clouds.length
      ? readCloud(renderer, scene, camera, subject, width, height)
      : null;
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
    // The panel must sample the unlit pass, not its cached lit scene.
    censors.forEach((node) => node.material.userData.captureScene?.());
    applyPixelGrid();
    albedo = readFrame(renderer, scene, camera, width, height);
    if (plotPixels && censors.size) {
      const white = new THREE.MeshBasicMaterial({
        color: '#ffffff',
        side: THREE.DoubleSide,
      });
      temporary.push(white);
      const flats = originals.map(([node]) => [node, node.material]);
      show(clouds, false);
      flats.forEach(([node]) => {
        if (node.isMesh && !censors.has(node)) node.material = white;
      });
      censors.forEach((node) => node.material.userData.captureScene?.());
      applyPixelGrid();
      censors.forEach((node) =>
        node.material.uniforms.fallbackColor.value.setRGB(0, 0, 0)
      );
      censorSubject = readFrame(renderer, scene, camera, width, height);
      flats.forEach(([node, material]) => {
        node.material = material;
      });
      show(clouds, true);
    }
    {
      const ink = (color) => {
        const material = new THREE.MeshBasicMaterial({ color });
        temporary.push(material);
        return material;
      };
      const red = ink('#ff0000');
      const green = ink('#00ff00');
      const blue = ink('#0000ff');
      const skullMeshes = new Set();
      const boneMeshes = new Set();
      bones.forEach((bone) =>
        bone.traverse((node) => {
          if (node.isMesh) {
            boneMeshes.add(node);
            if (bone.userData.plotAnatomy === 'skull') skullMeshes.add(node);
          }
        })
      );
      const black = ink('#000000');
      const strokes = originals
        .filter(([node]) => !node.isMesh)
        .map(([node]) => node);
      show(clouds, false);
      show(strokes, false);
      originals.forEach(([node]) => {
        if (!node.isMesh) return;
        node.material = black;
        if (boneMeshes.has(node))
          node.material = skullMeshes.has(node) ? green : blue;
        if (censors.has(node)) node.material = red;
      });
      regionPass = readFrame(renderer, scene, camera, width, height);
      show(strokes, true);
      show(clouds, true);
    }
    originals.forEach(([node]) => {
      if (node.isMesh) node.material = depth;
    });
    show(clouds, false);
    packed = readFrame(renderer, scene, camera, width, height, false);
    if (
      bones.length &&
      options.svgDrawing !== 'ink' &&
      (options.svgAnatomyDetail ?? 'structure') === 'structure'
    ) {
      const normalMaterial = new THREE.MeshNormalMaterial({
        side: THREE.DoubleSide,
      });
      temporary.push(normalMaterial);
      originals.forEach(([node]) => {
        if (node.isMesh) node.material = normalMaterial;
      });
      normals = readFrame(renderer, scene, camera, width, height, false);
    }
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
    censorUniforms.forEach((uniform, i) => {
      uniform.value = previousPixels[i];
    });
    censors.forEach((node) => node.material.userData.captureScene?.());
  }
  const data = new Float32Array(width * height);
  const covered = new Uint8Array(data.length);
  const solids = new Uint8Array(data.length);
  const cloud = new Uint8Array(data.length);
  const censor = new Uint8Array(data.length);
  const anatomyMask = new Uint8Array(data.length);
  const skullMask = new Uint8Array(data.length);
  const femurMask = new Uint8Array(data.length);
  const background = originalBackground?.isColor
    ? originalBackground
        .clone()
        .convertLinearToSRGB()
        .toArray()
        .map((v) => v * 255)
    : [255, 255, 255];
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
    const panel = regionPass.data[j] > 127;
    const panelInk = censorSubject
      ? censorSubject.data[j] > 127
      : Math.hypot(
          image.data[j] - background[0],
          image.data[j + 1] - background[1],
          image.data[j + 2] - background[2]
        ) > 24;
    covered[i] = image.data[j + 3] > 56 && (!panel || panelInk) ? 1 : 0;
    solids[i] = solid.data[j + 3] > 16 ? 1 : 0;
    if (!solids[i]) data[i] = camera.far;
    cloud[i] = cloudImage?.data[j + 3] > 6 && !panel ? 1 : 0;
    if (cloud[i]) covered[i] = 1;
    censor[i] = covered[i] && panel ? 1 : 0;
    skullMask[i] = regionPass.data[j + 1] > 127 ? 1 : 0;
    femurMask[i] = regionPass.data[j + 2] > 127 ? 1 : 0;
    anatomyMask[i] = skullMask[i] || femurMask[i] ? 1 : 0;
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
  albedo.covered = covered;
  // Every view of a generation plots in the inks its first view picked.
  inks.palette ??= thoughtInks({ albedo, coverage, options });
  return renderThoughtSvg({
    albedo,
    anatomy,
    anatomyImage: solid,
    skullMask: { covered: skullMask, height, width },
    femurMask: { covered: femurMask, height, width },
    anatomyMask: bones.length ? { covered: anatomyMask, height, width } : null,
    camera: viewOf(camera, target),
    censor: censors.size ? { covered: censor, height, width } : null,
    censorGrid,
    cloud: clouds.length ? { covered: cloud, height, width } : null,
    cloudImage,
    cloudPuffs:
      options.svgDrawing === 'ink'
        ? cloudPuffsOf(clouds, camera, options.width, options.height)
        : [],
    coverage,
    image,
    lines,
    meshes,
    normals,
    options,
    palette: inks.palette,
    visible,
  });
}
