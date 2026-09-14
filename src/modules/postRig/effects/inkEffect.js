import {
  Fn,
  abs,
  cameraFar,
  cameraNear,
  max,
  mix,
  orthographicDepthToViewZ,
  perspectiveDepthToViewZ,
  screenSize,
  screenUV,
  smoothstep,
  uniform,
  vec2,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

export const defaults = {
  color: '#1a1a1a',
  crease: 0.05,
  silhouette: 0.02,
  strength: 0.85,
  thickness: 1.2,
};

export function controls(slot) {
  return {
    [`${slot.prefix}Color`]: { label: 'Ink', value: slot.color },
    [`${slot.prefix}Strength`]: {
      label: 'Strength',
      max: 1,
      min: 0,
      step: 0.01,
      value: slot.strength,
    },
    [`${slot.prefix}Thickness`]: {
      label: 'Thickness',
      max: 4,
      min: 0.25,
      step: 0.05,
      value: slot.thickness,
    },
    [`${slot.prefix}Silhouette`]: {
      label: 'Silhouette',
      max: 0.5,
      min: 0.001,
      step: 0.001,
      value: slot.silhouette,
    },
    [`${slot.prefix}Crease`]: {
      label: 'Crease',
      max: 0.5,
      min: 0.001,
      step: 0.001,
      value: slot.crease,
    },
  };
}

// Ink lines from view-space depth alone: a Sobel gradient catches silhouettes
// and a Laplacian catches creases. Under an orthographic camera view depth is
// linear across a flat face, so the Laplacian is zero on flats and spikes
// exactly on the fold — which is what makes this read as a drawn line rather
// than a shaded gradient.
export function create({ ctx, input, slot }) {
  const uColor = uniform(new THREE.Color(slot.color));
  const uStrength = uniform(slot.strength);
  const uThickness = uniform(slot.thickness);
  const uSilhouette = uniform(slot.silhouette);
  const uCrease = uniform(slot.crease);

  const depthNode = ctx.scenePass.getTextureNode('depth');
  const toViewZ = ctx.camera?.isPerspectiveCamera
    ? perspectiveDepthToViewZ
    : orthographicDepthToViewZ;

  const edge = Fn(() => {
    const step = uThickness.div(screenSize);
    const at = (dx, dy) =>
      abs(
        toViewZ(
          depthNode.sample(screenUV.add(vec2(dx, dy).mul(step))).r,
          cameraNear,
          cameraFar
        )
      );

    const tl = at(-1, -1);
    const t = at(0, -1);
    const tr = at(1, -1);
    const l = at(-1, 0);
    const c = at(0, 0);
    const r = at(1, 0);
    const bl = at(-1, 1);
    const b = at(0, 1);
    const br = at(1, 1);

    const gx = tl
      .add(l.mul(2))
      .add(bl)
      .sub(tr.add(r.mul(2)).add(br));
    const gy = tl
      .add(t.mul(2))
      .add(tr)
      .sub(bl.add(b.mul(2)).add(br));
    const gradient = vec2(gx, gy).length();
    const laplacian = abs(c.mul(4).sub(t.add(b).add(l).add(r)));

    return max(
      smoothstep(uSilhouette, uSilhouette.mul(2), gradient),
      smoothstep(uCrease, uCrease.mul(2), laplacian)
    );
  })();

  return {
    node: mix(input, uColor, edge.mul(uStrength)),
    update: (values) => {
      uColor.value.set(values[`${slot.prefix}Color`] ?? slot.color);
      uStrength.value = values[`${slot.prefix}Strength`] ?? slot.strength;
      uThickness.value = values[`${slot.prefix}Thickness`] ?? slot.thickness;
      uSilhouette.value = values[`${slot.prefix}Silhouette`] ?? slot.silhouette;
      uCrease.value = values[`${slot.prefix}Crease`] ?? slot.crease;
    },
  };
}
