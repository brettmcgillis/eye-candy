import { attribute, positionGeometry, uv, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { pigmentSlotForBundle } from './pigments';

// How the ODE trajectories become wet paint. All three modes produce the same
// thing — a list of brush stamps in paper UV space — and differ only in which
// points they sample, how wide each stamp is and how much pigment it carries.
//
//   brush  each newly grown step deposits as the test draws itself, so the
//          blot blooms in step with Lines mode's growth
//   stamp  the whole finished trajectory lands at once and then bleeds
//   wash   sparse, wide, weak stamps that read as poured colour rather than
//          brushwork; the trajectory only shapes where the wash pools
export const DEPOSITION_MODES = ['brush', 'stamp', 'wash'];

const MODE_SHAPE = {
  brush: { strengthScale: 1, stride: 2, widthScale: 1 },
  stamp: { strengthScale: 0.55, stride: 3, widthScale: 1.15 },
  wash: { strengthScale: 0.32, stride: 14, widthScale: 4.5 },
};

// Four floats of geometry per stamp (centre, radius, strength) and four of
// pigment mask, so a stamp costs 32 bytes to upload.
const STAMP_FLOATS = 4;

function projectAxes(orientation) {
  return orientation === 'horizontal' ? [0, 2] : [0, 1];
}

// Walks the grown portion of every strand in `bundles` and writes stamps into
// `out`. `fromStep`/`toStep` bound which part of the trajectory contributes —
// brush mode passes the sliver grown since the last frame, the other modes pass
// the whole thing once. Returns how many stamps were written.
export function collectStamps({
  bundles,
  brushSize,
  fromStep,
  mode,
  orientation,
  out,
  outMask,
  paperSize,
  scale,
  strength,
  styles,
  toStep,
}) {
  const shape = MODE_SHAPE[mode] ?? MODE_SHAPE.brush;
  const [axisX, axisY] = projectAxes(orientation);
  const radius = (brushSize * shape.widthScale) / paperSize;
  const amount = strength * shape.strengthScale;
  const capacity = Math.floor(out.length / STAMP_FLOATS);
  const geometryOut = out;
  const maskOut = outMask;

  let count = 0;
  for (let b = 0; b < bundles.length && count < capacity; b += 1) {
    const style = styles[b];
    const bundle = bundles[b];
    const slot = pigmentSlotForBundle(b);
    const start = Math.max(0, fromStep ?? 0);
    const end =
      style && style.visible === false
        ? start
        : Math.min(bundle.grownSteps, toStep ?? bundle.grownSteps);

    for (let s = 0; s < bundle.strands.length && count < capacity; s += 1) {
      const points = bundle.strands[s];
      for (
        let step = start;
        step < end && count < capacity;
        step += shape.stride
      ) {
        const base = step * 3;
        const u = (points[base + axisX] * scale) / paperSize + 0.5;
        const v = (points[base + axisY] * scale) / paperSize + 0.5;
        // A little slack past the sheet: a stamp centred just off the edge
        // still bleeds back onto it.
        const onPaper = u > -0.1 && u < 1.1 && v > -0.1 && v < 1.1;

        if (onPaper) {
          const offset = count * STAMP_FLOATS;
          geometryOut[offset] = u;
          geometryOut[offset + 1] = v;
          geometryOut[offset + 2] = radius;
          geometryOut[offset + 3] = amount;

          const maskOffset = count * 4;
          maskOut[maskOffset] = slot === 0 ? 1 : 0;
          maskOut[maskOffset + 1] = slot === 1 ? 1 : 0;
          maskOut[maskOffset + 2] = slot === 2 ? 1 : 0;
          maskOut[maskOffset + 3] = slot === 3 ? 1 : 0;
          count += 1;
        }
      }
    }
  }
  return count;
}

// An instanced quad per stamp, drawn additively into the sim's splat target.
// Additive drawing is the whole reason the sim keeps its state in textures
// rather than storage buffers: overlapping stamps have to accumulate, and a
// compute pass writing the same cell from several invocations cannot do that
// without atomics.
// 32k stamps is roughly a full test at the default stride and costs 512KB of
// attributes. The old 262144 allocated ~20MB across the instance buffers and
// re-uploaded all of it on every flush regardless of how few stamps moved.
export function createSplatBrush({ capacity = 32768, renderer, sim }) {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const stampData = new Float32Array(capacity * STAMP_FLOATS);
  const stampMask = new Float32Array(capacity * 4);

  const dataAttribute = new THREE.InstancedBufferAttribute(stampData, 4);
  const maskAttribute = new THREE.InstancedBufferAttribute(stampMask, 4);
  dataAttribute.setUsage(THREE.DynamicDrawUsage);
  maskAttribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('stampData', dataAttribute);
  geometry.setAttribute('stampMask', maskAttribute);

  const material = new THREE.NodeMaterial();
  const data = attribute('stampData', 'vec4');
  material.positionNode = vec3(
    positionGeometry.xy.mul(data.z.mul(2)).add(data.xy),
    0
  );
  // Squared radial falloff: a hard-edged disc tiles into visible circles once
  // stamps overlap, and a linear one leaves a halo the fluid layer then spreads.
  const falloff = uv().sub(0.5).length().mul(2).clamp(0, 1).oneMinus();
  material.colorNode = attribute('stampMask', 'vec4').mul(
    falloff.mul(falloff).mul(data.w)
  );
  // Plain One/One rather than AdditiveBlending: the preset multiplies source
  // colour by its alpha, and a stamp's alpha is its fourth pigment channel —
  // which is zero for the other three pigments, so every one of them would
  // blend to nothing. Each channel here has to accumulate on its own terms.
  material.blending = THREE.CustomBlending;
  material.blendEquation = THREE.AddEquation;
  material.blendSrc = THREE.OneFactor;
  material.blendDst = THREE.OneFactor;
  material.blendEquationAlpha = THREE.AddEquation;
  material.blendSrcAlpha = THREE.OneFactor;
  material.blendDstAlpha = THREE.OneFactor;
  material.depthTest = false;
  material.depthWrite = false;
  material.transparent = true;

  const mesh = new THREE.InstancedMesh(geometry, material, capacity);
  mesh.frustumCulled = false;
  mesh.count = 0;
  // InstancedMesh allocates instanceMatrix zeroed, and NodeMaterial still
  // applies it even when positionNode replaces the vertex position — every
  // stamp collapses to a degenerate zero-area quad without this.
  const identity = new THREE.Matrix4();
  for (let i = 0; i < capacity; i += 1) mesh.setMatrixAt(i, identity);
  mesh.instanceMatrix.needsUpdate = true;

  const scene = new THREE.Scene();
  scene.add(mesh);
  // Paper UV space maps straight onto the target: model x/y in 0..1 is exactly
  // one texel range, so no extra transform sits between a stamp and the cell
  // it lands in.
  const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);

  return {
    capacity,
    dispose() {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
    mask: stampMask,
    positions: stampData,

    // Clears last frame's stamps, draws this frame's, and folds the result into
    // the sim's fluid, pigment and saturation fields.
    flush(count) {
      if (count <= 0) return;
      mesh.count = count;
      // Upload only the stamps that actually changed — a brush-mode frame
      // touches a few hundred of them, not the whole buffer.
      dataAttribute.clearUpdateRanges?.();
      maskAttribute.clearUpdateRanges?.();
      dataAttribute.addUpdateRange(0, count * 4);
      maskAttribute.addUpdateRange(0, count * 4);
      dataAttribute.needsUpdate = true;
      maskAttribute.needsUpdate = true;

      const target = renderer;
      const previousAutoClear = target.autoClear;
      target.autoClear = true;
      target.setRenderTarget(sim.splatTarget);
      target.clear();
      target.render(scene, camera);
      target.setRenderTarget(null);
      target.autoClear = previousAutoClear;

      sim.absorbSplat();
    },
  };
}

export default createSplatBrush;
