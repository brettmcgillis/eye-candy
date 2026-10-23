import { max, vec4 } from 'three/tsl';

// Glow added over a frame that may be transparent: the light it spills past
// the subject's edge brings its own alpha, so a halo survives the cut-out.
export default function withGlow(input, glow) {
  return vec4(
    input.rgb.add(glow.rgb),
    max(input.a, max(glow.r, max(glow.g, glow.b))).min(1)
  );
}
