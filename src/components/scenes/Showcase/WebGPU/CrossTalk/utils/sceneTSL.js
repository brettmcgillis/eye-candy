import { uniform, uniformArray } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MAX_WINDOWS } from './radianceConstants';

// Occluder shape ids — must match getRadianceControls.js's dropdown order and
// radialShadowTSL.js's occluderSDF branches.
export const OCCLUDER_NONE = -1;
export const OCCLUDER_CIRCLE = 0;
export const OCCLUDER_BOX = 1;
export const OCCLUDER_TRIANGLE = 2;

function filledArray(count, factory) {
  return Array.from({ length: count }, factory);
}

// Fixed-size (MAX_WINDOWS) uniform arrays holding every alive window's rect
// + this preset's per-window light/occluder — mutated in place every GPU
// frame (see updateSceneUniforms) rather than rebuilt, since UniformArrayNode
// re-serializes `.array` on every render (NodeUpdateType.RENDER).
export function createSceneUniforms() {
  return {
    lightColor: uniformArray(
      filledArray(MAX_WINDOWS, () => new THREE.Color(0, 0, 0)),
      'color'
    ),
    // vec4(worldX, worldY, radius, intensity) — intensity <= 0 means "no
    // light broadcast by this window".
    lightData: uniformArray(
      filledArray(MAX_WINDOWS, () => new THREE.Vector4(0, 0, 0, 0)),
      'vec4'
    ),
    // vec4(worldX, worldY, rotation, shapeId) — shapeId OCCLUDER_NONE means
    // "no occluder broadcast by this window".
    occluderData: uniformArray(
      filledArray(MAX_WINDOWS, () => new THREE.Vector4(0, 0, 0, OCCLUDER_NONE)),
      'vec4'
    ),
    occluderSize: uniformArray(
      filledArray(MAX_WINDOWS, () => new THREE.Vector2(0, 0)),
      'vec2'
    ),
    windowCount: uniform(0, 'int'),
    // vec4(x, y, w, h) in absolute desktop pixels — same coordinate system
    // as useWindowSync's win.x/y/w/h.
    windowRect: uniformArray(
      filledArray(MAX_WINDOWS, () => new THREE.Vector4(0, 0, 0, 0)),
      'vec4'
    ),
  };
}

// `windows` is useWindowSync's array; `selfId`/`selfLight`/`selfOccluder`
// let this window use its own live (undebounced) drag/Leva state instead of
// waiting a round-trip through its own broadcast meta — same reasoning as
// GravityRoomsView preferring `c.gravityAngle` over `win.meta` for self.
// Mutates `u`'s uniform arrays in place by design — avoids a fresh allocation
// every GPU frame.
/* eslint-disable no-param-reassign */
export function updateSceneUniforms(
  u,
  { selfId, selfLight, selfOccluder, selfRect, windows }
) {
  const count = Math.min(windows.length, MAX_WINDOWS);
  let hasSelf = false;

  for (let i = 0; i < count; i += 1) {
    const win = windows[i];
    u.windowRect.array[i].set(win.x, win.y, win.w, win.h);

    const isSelf = win.id === selfId;
    hasSelf = hasSelf || isSelf;
    const light = isSelf ? selfLight : win.meta?.light;
    const occluder = isSelf ? selfOccluder : win.meta?.occluder;

    if (light) {
      u.lightData.array[i].set(
        win.x + win.w * 0.5 + light.offsetX * win.w,
        win.y + win.h * 0.5 + light.offsetY * win.h,
        light.radius,
        light.intensity
      );
      u.lightColor.array[i].set(light.color);
    } else {
      u.lightData.array[i].set(0, 0, 0, 0);
    }

    if (occluder) {
      u.occluderData.array[i].set(
        win.x + win.w * 0.5 + occluder.offsetX * win.w,
        win.y + win.h * 0.5 + occluder.offsetY * win.h,
        occluder.rotation,
        occluder.shape
      );
      u.occluderSize.array[i].set(
        occluder.size,
        occluder.sizeY ?? occluder.size
      );
    } else {
      u.occluderData.array[i].set(0, 0, 0, OCCLUDER_NONE);
    }
  }

  // Some runtime/browser setups can briefly report sibling windows but omit
  // this tab's own entry. Ensure the local light/occluder always participate
  // so the preset stays functional and debuggable.
  if (!hasSelf && selfRect) {
    const i = Math.min(count, MAX_WINDOWS - 1);
    u.windowRect.array[i].set(selfRect.x, selfRect.y, selfRect.w, selfRect.h);

    if (selfLight) {
      u.lightData.array[i].set(
        selfRect.x + selfRect.w * 0.5 + selfLight.offsetX * selfRect.w,
        selfRect.y + selfRect.h * 0.5 + selfLight.offsetY * selfRect.h,
        selfLight.radius,
        selfLight.intensity
      );
      u.lightColor.array[i].set(selfLight.color);
    } else {
      u.lightData.array[i].set(0, 0, 0, 0);
    }

    if (selfOccluder) {
      u.occluderData.array[i].set(
        selfRect.x + selfRect.w * 0.5 + selfOccluder.offsetX * selfRect.w,
        selfRect.y + selfRect.h * 0.5 + selfOccluder.offsetY * selfRect.h,
        selfOccluder.rotation,
        selfOccluder.shape
      );
      u.occluderSize.array[i].set(
        selfOccluder.size,
        selfOccluder.sizeY ?? selfOccluder.size
      );
    } else {
      u.occluderData.array[i].set(0, 0, 0, OCCLUDER_NONE);
    }

    u.windowCount.value = Math.min(count + 1, MAX_WINDOWS);
    return;
  }

  u.windowCount.value = count;
}
