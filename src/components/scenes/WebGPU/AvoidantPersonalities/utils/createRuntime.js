import { createGrayScottField } from '@modules/reactionDiffusion';
import createFieldTexture from '@utils/storageField';

import createPageKernels from './inkPage';
import createLineMaterial from './lineMaterial';
import createWalkers, { createInkBuffer } from './walkers';

// A frame is: walk every live line one step, mark the steps they took, copy the
// page out for reading. The reaction field advances alongside because it is one
// of the three things a line consults about where it would rather go.
export default function createRuntime({
  gridHeight,
  gridWidth,
  inkUniforms,
  maxCount,
  paletteTexture,
  reactionHeight,
  reactionWidth,
  uniforms,
}) {
  const ink = createFieldTexture(gridWidth, gridHeight);
  const deposit = createInkBuffer(gridWidth * gridHeight);

  const reactionField = createGrayScottField({
    height: reactionHeight,
    width: reactionWidth,
  });

  const walkers = createWalkers({
    deposit,
    gridHeight,
    gridWidth,
    ink,
    maxCount,
    reactionHeight,
    reactionTexture: reactionField.outputTexture,
    reactionWidth,
    uniforms,
  });

  const page = createPageKernels({
    deposit,
    gridHeight,
    gridWidth,
    ink,
    uniforms,
  });

  const line = createLineMaterial({
    inkTexture: ink,
    paletteTexture,
    uniforms: { ...uniforms, ...inkUniforms },
  });

  return {
    dispose() {
      ink.dispose();
      reactionField.dispose();
      line.material.dispose();
    },
    material: line.material,
    reactionField,
    reset(renderer) {
      renderer.compute(page.wipe);
      renderer.compute(page.clearTexture);
      renderer.compute(page.frame);
      renderer.compute(page.resolve);
      reactionField.reseed(renderer, { radius: 2 });
      renderer.compute(walkers.init);
    },
    setCount(count) {
      const live = Math.max(1, Math.min(maxCount, Math.round(count)));
      walkers.init.count = live;
      walkers.walk.count = live;
      walkers.mark.count = live;
    },
    setPalette: line.setPalette,
    step(renderer, { reactionActive, steps }) {
      if (reactionActive) reactionField.update(renderer);

      for (let i = 0; i < steps; i += 1) {
        renderer.compute(walkers.walk);
        renderer.compute(walkers.mark);
        renderer.compute(page.resolve);
      }
    },
  };
}
