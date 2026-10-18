import { VOXEL_PX } from './voxelChunks';

const AZIMUTH = { back: 225, iso: 45, left: 135, right: 315, top: 45 };
const ISO_ELEVATION = Math.asin(1 / Math.sqrt(3));
const DEG = Math.PI / 180;
const DISTANCE = 3000;

export function voxelDirection(view, azimuthOffset = 0) {
  const azimuth = ((AZIMUTH[view] ?? 45) + azimuthOffset) * DEG;
  if (view === 'top') {
    return {
      direction: [0, 1, 0],
      up: [-Math.cos(azimuth), 0, -Math.sin(azimuth)],
    };
  }
  const c = Math.cos(ISO_ELEVATION);
  return {
    direction: [
      c * Math.cos(azimuth),
      Math.sin(ISO_ELEVATION),
      c * Math.sin(azimuth),
    ],
    up: [0, 1, 0],
  };
}

export function blockFit(piece, canvas) {
  const { height, width } = piece.reference;
  const pxPerRef = Math.min(canvas.width / width, canvas.height / height);
  const { i, j, k } = piece.center;
  const lift = piece.dims.I / 2 - i;
  return {
    pxPerRef,
    target: [i + lift, j + lift, k + lift],
    visibleHeight: canvas.height / pxPerRef / (VOXEL_PX * (piece.unit ?? 1)),
  };
}

export function stageFit(piece, canvas) {
  const pxPerRef = Math.min(canvas.width, canvas.height) / piece.refSize;
  return {
    pxPerRef,
    target: [0, 0, 0],
    visibleHeight: canvas.height / pxPerRef / VOXEL_PX,
  };
}

export function voxelFrame(
  fit,
  canvas,
  { azimuthOffset = 0, view = 'iso' } = {}
) {
  const { direction, up } = voxelDirection(view, azimuthOffset);
  const halfHeight = fit.visibleHeight / 2;
  return {
    eye: fit.target.map((v, a) => v + direction[a] * DISTANCE),
    far: DISTANCE * 2,
    halfHeight,
    halfWidth: (halfHeight * canvas.width) / canvas.height,
    near: 1,
    target: fit.target,
    up,
  };
}
