/* eslint-disable no-param-reassign */
import {
  Fn,
  If,
  Loop,
  bool,
  float,
  floor,
  int,
  min,
  mx_cell_noise_float as mxCellNoise,
  screenCoordinate,
  screenSize,
  smoothstep,
  uniform,
  vec2,
  vec4,
} from 'three/tsl';

// Noise-driven quadtree pixelation: a screen-space grid whose cell size is
// not uniform. Starting from `cellSize` (the coarsest grid), each cell is
// hash-tested per level — if the hash clears `threshold` the cell splits in
// half for the next level, otherwise it locks at its current size. Bounded by
// `levels`, so this is a single fragment pass (no render targets, no
// compute), unlike a content-aware/variance-driven quadtree (see this
// effect's todo.md for that as a deferred follow-up).
//
// `sampleFn(uvNode) => colorNode` lets the same logic drive both a fullscreen
// post pass (sample a scene `pass()`) and a per-object `backdropNode` (sample
// `viewportSharedTexture()`), per docs/scene-conventions.md §8 — the caller
// owns how the resolved uv gets turned into a color.
export function fractalPixelate(sampleFn, options = {}) {
  const uniforms = {
    cellSize: uniform(options.cellSize ?? 12),
    levels: uniform(int(options.levels ?? 3)),
    threshold: uniform(options.threshold ?? 0.55),
    noiseScale: uniform(options.noiseScale ?? 1.5),
    seed: uniform(options.seed ?? 0),
    jitterAmount: uniform(options.jitterAmount ?? 0.12),
    outlineWidth: uniform(options.outlineWidth ?? 0.08),
    outlineStrength: uniform(options.outlineStrength ?? 0.5),
  };

  const colorNode = Fn(() => {
    const cellPx = uniforms.cellSize.toVar();
    const active = bool(true).toVar();

    Loop(
      { start: int(0), end: uniforms.levels, type: 'int', condition: '<' },
      ({ i }) => {
        const cellId = floor(screenCoordinate.xy.div(cellPx));
        const hash = mxCellNoise(
          cellId
            .mul(uniforms.noiseScale)
            .add(vec2(float(i).mul(13.7), uniforms.seed))
        );

        If(active.and(hash.greaterThan(uniforms.threshold)), () => {
          cellPx.assign(cellPx.div(2));
        }).Else(() => {
          active.assign(bool(false));
        });
      }
    );

    const cellId = floor(screenCoordinate.xy.div(cellPx));
    const cellCenterPx = cellId.add(0.5).mul(cellPx);
    const finalUV = cellCenterPx.div(screenSize);

    const sampled = sampleFn(finalUV);

    // Per-cell brightness jitter — a small hashed offset so neighboring
    // cells read as distinct tiles even when the content behind them is
    // flat, which is what made differently-sized cells hard to tell apart.
    const jitterHash = mxCellNoise(cellId.add(vec2(91.7, 47.3)));
    const brightness = jitterHash
      .mul(2)
      .sub(1)
      .mul(uniforms.jitterAmount)
      .add(1);

    // Thin edge darkening — smoothstepped distance to the cell's border, so
    // each cell's actual boundary (and therefore its size) stays legible
    // regardless of what's behind it.
    const localUV = screenCoordinate.xy.div(cellPx).sub(cellId);
    const edgeDist = min(localUV, localUV.oneMinus());
    const edgeDistMin = min(edgeDist.x, edgeDist.y);
    const outlineFactor = smoothstep(0, uniforms.outlineWidth, edgeDistMin)
      .oneMinus()
      .mul(uniforms.outlineStrength)
      .oneMinus();

    return vec4(sampled.rgb.mul(brightness).mul(outlineFactor), sampled.a);
  })();

  return { colorNode, uniforms };
}

export function updateFractalPixelateUniforms(uniforms, values) {
  if (values.cellSize !== undefined) uniforms.cellSize.value = values.cellSize;
  if (values.levels !== undefined) uniforms.levels.value = values.levels;
  if (values.threshold !== undefined)
    uniforms.threshold.value = values.threshold;
  if (values.noiseScale !== undefined)
    uniforms.noiseScale.value = values.noiseScale;
  if (values.seed !== undefined) uniforms.seed.value = values.seed;
  if (values.jitterAmount !== undefined)
    uniforms.jitterAmount.value = values.jitterAmount;
  if (values.outlineWidth !== undefined)
    uniforms.outlineWidth.value = values.outlineWidth;
  if (values.outlineStrength !== undefined)
    uniforms.outlineStrength.value = values.outlineStrength;
}
