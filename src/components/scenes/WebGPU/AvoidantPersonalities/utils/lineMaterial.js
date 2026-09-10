import { Fn, mix, smoothstep, texture, uv, vec2, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

// The page is already a drawing; this only decides how a mark reads. The cut is
// a threshold with a narrow band so a stroke stays a stroke instead of fading
// into its neighbours, and the linear sampler supplies the edge antialiasing
// the analytic nib put there.
export default function createLineMaterial({
  inkTexture,
  paletteTexture,
  uniforms,
}) {
  // DoubleSide is load bearing: the porthole camera puts `top` above `bottom`
  // so y runs down the screen, and that inverted projection flips the quad's
  // winding. Front-side culling silently discards it with nothing logged.
  const material = new THREE.MeshBasicNodeMaterial({
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  const palette = texture(paletteTexture);

  material.colorNode = Fn(() => {
    const coord = uv();
    const page = texture(inkTexture, coord).toVar();

    const edge = uniforms.lineThreshold.max(1e-3).toVar();
    const band = uniforms.lineSoftness.max(1e-4).toVar();
    const drawn = smoothstep(edge.sub(band), edge.add(band), page.r).toVar();

    const stop = palette.sample(vec2(page.g.add(uniforms.paletteShift), 0.5));
    const stroke = mix(uniforms.lineColor, stop.rgb, uniforms.paletteMix);

    return vec4(mix(uniforms.groundColor, stroke, drawn), 1);
  })();

  return {
    material,
    setPalette: (next) => {
      palette.value = next;
    },
  };
}
