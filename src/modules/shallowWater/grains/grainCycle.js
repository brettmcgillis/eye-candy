import { hash, smoothstep } from 'three/tsl';

// Where a grain sits in its own recycle cycle, in 0..1.
//
// Derived from the shared phase rather than stored in a buffer, so the compute
// pass and the material agree on it with nothing passed between them. The seed
// offsets each grain, which is what staggers the population: at any instant a
// few grains are turning over and the rest are mid-flight, so the bed stays
// covered while every grain is genuinely being carried by the water.
//
// `back` walks the cycle one step into the past. The compute pass compares now
// against back to spot the turnover, and the material fades the grain out and
// in around it so the recycle is never seen.
export function grainAge(seed, uniforms, back = null) {
  const now = back ? uniforms.phase.sub(back) : uniforms.phase;
  return now
    .div(uniforms.grainLife.max(0.05))
    .add(hash(seed.mul(7919).add(11)))
    .fract();
}

// Trapezoid: up over the first `grainFade` of the cycle, flat, down over the
// last. Flat for most of it so the population loses as little coverage to the
// fade as the recycle can be hidden in.
export function grainCycleFade(seed, uniforms) {
  const age = grainAge(seed, uniforms);
  const edge = uniforms.grainFade.max(0.01);
  return smoothstep(0, edge, age).mul(smoothstep(1, edge.oneMinus(), age));
}
