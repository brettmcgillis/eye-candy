import { useMemo } from 'react';

import {
  SCENE_KEYS,
  decodeDesign,
  emptyDesign,
  frameFromDesign,
  generate,
  sceneDefaults,
} from '@modules/paperCuts';

import { getFrameData } from '../data/FrameData';

export default function useComposition(controls) {
  const generated = controls.frame === 'generated';
  const generationKey = JSON.stringify(
    [
      'paperDesign',
      'generationSeed',
      'generationFamily',
      'symmetry',
      'growthRounds',
      'nesting',
      'branching',
      'reach',
      'bridges',
      'paperDepth',
    ].map((key) => controls[key])
  );
  const result = useMemo(() => {
    try {
      return {
        frame: generated ? generate(controls) : getFrameData(controls.frame),
        rotate:
          generated && controls.paperDesign
            ? decodeDesign(controls.paperDesign).rotate
            : controls.rotate,
        error: null,
      };
    } catch (error) {
      return {
        frame: frameFromDesign(emptyDesign(), controls),
        rotate: controls.rotate,
        error: error.message,
      };
    }
  }, [generated, controls.frame, generationKey, controls.rotate]);
  const lookKey = JSON.stringify(SCENE_KEYS.map((key) => controls[key]));
  const config = useMemo(
    () => ({
      ...sceneDefaults(),
      ...Object.fromEntries(SCENE_KEYS.map((key) => [key, controls[key]])),
      rotate: result.rotate,
      paperDepth: result.frame.settings.paperDepth,
    }),
    [lookKey, result]
  );
  return { ...result, config, generated };
}
