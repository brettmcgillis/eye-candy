import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import applySecurityCamOverlay from '@materials/WebGPU/crt/securityCamOverlayNode';
import {
  createSecurityCamTimestampTexture,
  drawSecurityCamTimestamp,
  resolveSurveillanceFrameBounds,
} from '@materials/WebGPU/crt/surveillanceHUD';

export const defaults = {
  label: 'CAM 00',
  site: 'SUB-LEVEL 2',
  opacity: 0.6,
};

export function controls(slot) {
  return {
    [`${slot.prefix}Label`]: { label: 'Camera Label', value: slot.label },
    [`${slot.prefix}Site`]: { label: 'Site Label', value: slot.site },
    [`${slot.prefix}Opacity`]: {
      label: 'HUD Opacity',
      max: 1,
      min: 0,
      step: 0.01,
      value: slot.opacity,
    },
  };
}

// The burned-in CCTV on-screen display (REC, timestamp, corner brackets,
// camera and site labels), framed to the safe area the overlay panels leave.
export function create({ ctx, input, slot }) {
  const hud = createSecurityCamTimestampTexture();
  const u = {
    surveillanceOverlayEnabled: uniform(1),
    surveillanceHudOpacity: uniform(slot.opacity),
    surveillanceEffectBoost: uniform(1),
    surveillanceFrameMin: uniform(new THREE.Vector2(0, 0)),
    surveillanceFrameMax: uniform(new THREE.Vector2(1, 1)),
  };
  let bounds = null;
  let boundsKey = '';

  return {
    node: applySecurityCamOverlay(input, u, hud.texture),
    update: (values) => {
      const element = ctx.renderer.domElement;
      const size = {
        width: element.clientWidth || element.width,
        height: element.clientHeight || element.height,
      };
      const key = `${size.width}x${size.height}`;
      if (key !== boundsKey) {
        boundsKey = key;
        bounds = resolveSurveillanceFrameBounds(size);
        u.surveillanceFrameMin.value.set(bounds.minX, bounds.minY);
        u.surveillanceFrameMax.value.set(bounds.maxX, bounds.maxY);
        u.surveillanceEffectBoost.value = bounds.effectBoost;
      }
      u.surveillanceHudOpacity.value =
        values[`${slot.prefix}Opacity`] ?? slot.opacity;
      drawSecurityCamTimestamp(
        hud,
        values[`${slot.prefix}Label`] ?? slot.label,
        bounds.frameAspect,
        values[`${slot.prefix}Site`] ?? slot.site,
        new Date(),
        bounds.isMobile
      );
    },
  };
}
