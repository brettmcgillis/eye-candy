import { Fn, vec3 } from 'three/tsl';

import { safeNormalize } from './easing';

// A smoothstep bump plus its analytic derivative, so a painted stroke carries
// the slope the erosion filter needs rather than leaving it to be differenced
// back out of the heightmap.
const brushDelta = Fn(([mapPos, cursorPos, brushSize]) => {
  const toCursor = cursorPos.sub(mapPos).toVar();
  const dist = toCursor.length().toVar();
  const dir = safeNormalize(toCursor).toVar();

  const freq = brushSize.reciprocal().toVar();
  const x = freq.mul(dist).oneMinus().clamp(0, 1).toVar();

  return vec3(
    x.mul(x).mul(x.mul(-2).add(3)),
    dir.mul(x.mul(x.oneMinus()).mul(6).mul(freq))
  );
});

export default brushDelta;
