// TEMPORARY benchmark — delete once the ink pass cost is understood.
// Served by Vite so the page can import it and run against a real WebGPU
// device without needing a handle on the scene's renderer.
import { Fn, texture, uniform, uv, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import createInkPaper from '@modules/rorschach/watercolor/inkPaper';

async function makeRenderer(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const renderer = new THREE.WebGPURenderer({ canvas, forceWebGPU: true });
  renderer.setSize(size, size, false);
  await renderer.init();
  return renderer;
}

function makeTarget(size) {
  return new THREE.RenderTarget(size, size, {
    depthBuffer: false,
    type: THREE.FloatType,
  });
}

function trivialMaterial(map) {
  const material = new THREE.NodeMaterial();
  material.colorNode = Fn(() => texture(map, uv()).add(vec4(0.001, 0, 0, 0)))();
  material.blending = THREE.NoBlending;
  material.depthTest = false;
  material.depthWrite = false;
  material.transparent = true;
  return material;
}

async function timed(label, iterations, fn) {
  // Warm up so shader compilation is not measured.
  fn();
  await new Promise((resolve) => setTimeout(resolve, 200));
  const start = performance.now();
  for (let i = 0; i < iterations; i += 1) fn();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const total = performance.now() - start;
  return {
    label,
    iterations,
    msPerCall: +(total / iterations).toFixed(3),
    totalMs: +total.toFixed(1),
  };
}

export default async function runInkBench({ size = 512 } = {}) {
  const renderer = await makeRenderer(size);
  const results = [];

  const a = makeTarget(size);
  const b = makeTarget(size);
  const quad = new THREE.QuadMesh(new THREE.NodeMaterial());

  // 1. One material, ping-ponged: the cheapest possible full-screen pass.
  const single = trivialMaterial(a.texture);
  results.push(
    await timed('1 material, target kept bound', 200, () => {
      quad.material = single;
      renderer.setRenderTarget(b);
      quad.render(renderer);
    })
  );

  // 2. Same, but unbinding the target after every pass the way the sim does.
  results.push(
    await timed('1 material, setRenderTarget(null) each pass', 200, () => {
      quad.material = single;
      renderer.setRenderTarget(b);
      quad.render(renderer);
      renderer.setRenderTarget(null);
    })
  );

  // 3. Twenty-one distinct materials cycled, mimicking one sim step's swaps.
  const many = Array.from({ length: 21 }, () => trivialMaterial(a.texture));
  let cursor = 0;
  results.push(
    await timed('21 materials cycled (material swap cost)', 200, () => {
      quad.material = many[cursor % many.length];
      cursor += 1;
      renderer.setRenderTarget(b);
      quad.render(renderer);
      renderer.setRenderTarget(null);
    })
  );

  // 4. The real thing: one full sim step.
  const paper = createInkPaper({ renderer, resolution: size, seed: 1 });
  results.push(await timed('real sim.step()', 20, () => paper.sim.step()));

  // 5. A full advance() with a realistic trajectory set, which is what the
  // scene actually calls: deposit + splat + step.
  const makeBundles = (count, strands, steps) =>
    Array.from({ length: count }, (_, id) => ({
      grownSteps: steps,
      id,
      seed: 1,
      steps,
      strands: Array.from({ length: strands }, () => {
        const points = new Float32Array(steps * 3);
        for (let i = 0; i < steps; i += 1) {
          points[i * 3] = Math.sin(i * 0.01 + id) * 6;
          points[i * 3 + 1] = Math.cos(i * 0.013 + id) * 6;
          points[i * 3 + 2] = Math.sin(i * 0.007) * 3;
        }
        return points;
      }),
      structuralFingerprint: 'bench',
    }));

  const styles = Array.from({ length: 12 }, () => ({
    color: { h: 0.6, l: 0.3, s: 0.5 },
    visible: true,
  }));

  for (const [label, count, strands, steps, mode] of [
    ['advance stamp  5x24x900', 5, 24, 900, 'stamp'],
    ['advance brush  5x24x900', 5, 24, 900, 'brush'],
    ['advance brush 12x100x2000', 12, 100, 2000, 'brush'],
  ]) {
    const bundles = makeBundles(count, strands, steps);
    paper.setState({ depositionMode: mode });
    results.push(
      await timed(label, 5, () =>
        paper.advance({ bundles, scale: 0.4, steps: 1, styles })
      )
    );
  }

  paper.dispose();
  renderer.dispose?.();
  return results;
}
