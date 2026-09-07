// Screen-space twin of the geometry Slit Scan (glitchMaterial.js): thin strips
// of the frame are stretched across the span they open up, and everything past
// a strip slides along by the same amount. Each slit's forward map is
// d = s + stretch * saturate((s - p) / width); this samples by its inverse, so
// stretch = 0 is exactly the identity and the smear stays a frozen row rather
// than a blur.
//
// Several slits compose, so the inverse is the composition of the individual
// inverses applied in reverse order — the last slit is undone first. Count is
// a uniform, so the loop is unrolled to MAX_SLITS and a slit past the count
// gets stretch 0, which makes its step of the composition the identity.
import {
  Fn,
  abs,
  cos,
  dot,
  float,
  fract,
  mix,
  radians,
  screenUV,
  select,
  sin,
  step,
  time,
  uniform,
  vec2,
} from 'three/tsl';

import { buildChunkMask, createChunkUniforms } from './screenChunks';

const MAX_SLITS = 8;

// Folds a coordinate back into 0..1 by reflection: identity while it is
// already in range, and a triangle wave outside it. Clamping instead would
// smear the frame's border across everything that overshoots, which on a dark
// scene reads as solid black bands rather than as a smear, and wrapping puts a
// hard seam where the two edges meet. Reflection always lands on real content
// and stays continuous across the fold.
const mirror = (t) => float(1).sub(fract(t.mul(0.5)).mul(2).sub(1).abs());

export function createSlitScanUniforms() {
  return {
    angle: uniform(45),
    angleJitter: uniform(0),
    position: uniform(0.35),
    width: uniform(0.02),
    stretch: uniform(0.3),
    push: uniform(0),
    speed: uniform(0),
    jitter: uniform(0),
    count: uniform(1),
    spread: uniform(1),
    chunks: createChunkUniforms(),
  };
}

export function buildSlitScanPostNode(sceneColor, u, chunkMode) {
  return Fn(() => {
    const { mask, chunkHash } = buildChunkMask(chunkMode, u.chunks);
    const active = mask.toVar('ssMask');

    // The smear runs along an arbitrary direction rather than along X or Y:
    // `coord` is the frame's extent projected onto that direction, and the
    // sample is displaced along it, so the perpendicular component is
    // untouched exactly the way the axis-aligned version left the other UV
    // component alone. Dividing by |dx| + |dy| — the length the unit square
    // projects to — renormalizes `coord` to 0..1 at any angle, which is what
    // keeps Slit Position meaning the same thing when the angle changes.
    //
    // Angle Jitter is applied per chunk, so adjacent chunks smear at
    // different angles and mirrored diagonals meet along their shared edge.
    // That collision is the herringbone; one global angle only ever gives
    // parallel streaks.
    const theta = radians(u.angle.add(chunkHash.sub(0.5).mul(u.angleJitter)));
    const dir = vec2(cos(theta), sin(theta));
    const norm = abs(dir.x).add(abs(dir.y)).max(0.0001);
    const coord = dot(screenUV.sub(0.5), dir).div(norm).add(0.5);

    const width = u.width.max(0.0001);
    const count = u.count.max(1);
    const origin = u.position
      .add(time.mul(u.speed))
      .add(chunkHash.mul(u.jitter));

    const source = coord.toVar('ssSource');

    // Each slit splits the frame into three regions: untouched before it, the
    // span it opens up, and everything after. Only the middle region smears —
    // a `width`-thin slice of source blown up to fill `span` — so `span` is
    // literally how much of the frame ends up looking stretched. It is
    // width + stretch, which is why a small Stretch reads as "a slice moved"
    // rather than "a slice smeared": the ribbon is a few percent of the frame
    // and the whole remainder is the third region, rigidly translated.
    //
    // Push is what that third region does. At 1 the frame behaves as if it
    // physically got longer, everything downstream sliding by to make room —
    // continuous, but the displacement accumulates across slits and walks off
    // the frame. At 0 the smear is purely local: the span is replaced in place
    // and the image resumes undisturbed past it, ending the ribbon on a hard
    // edge. Local is the painting's behaviour, and it also bounds the sample
    // to within `width` of the slit, so no amount of Stretch can push it off
    // the frame.
    for (let i = MAX_SLITS - 1; i >= 0; i -= 1) {
      const on = step(float(i).add(0.5), count);
      const stretch = u.stretch.mul(on);
      const span = width.add(stretch);
      const slit = fract(origin.add(float(i).div(count).mul(u.spread)));
      const past = source.sub(slit);

      source.assign(
        select(
          past.lessThan(0),
          source,
          select(
            past.lessThanEqual(span),
            slit.add(past.mul(width.div(span))),
            source.sub(stretch.mul(u.push))
          )
        )
      );
    }

    const displaced = screenUV.add(dir.mul(source.sub(coord).mul(norm)));
    const sourceUv = vec2(mirror(displaced.x), mirror(displaced.y));

    return mix(
      sceneColor.sample(screenUV),
      sceneColor.sample(sourceUv),
      active
    );
  })();
}
