import { useCallback, useMemo } from 'react';

import {
  decodeDesign,
  designFromSeed,
  emptyDesign,
  encodeDesign,
} from '@modules/trucheterieBlob';

import useDesignHistory from './useDesignHistory';

export default function useSceneDesign({ controls, setControls }) {
  const { blobDesign: code, designTool } = controls;
  const design = useMemo(() => (code ? decodeDesign(code) : null), [code]);
  const setCode = useCallback(
    (next) => setControls({ blobDesign: next }),
    [setControls]
  );
  const history = useDesignHistory(code, setCode, {
    keyboard: Boolean(design) && designTool !== 'off',
  });

  const replace = (next, extra = {}) => {
    history.checkpoint();
    setControls({ blobDesign: next ? encodeDesign(next) : '', ...extra });
  };

  const actions = {
    clear: () => design && replace(emptyDesign()),
    fromSeed: () => {
      const seeded = designFromSeed(controls);
      replace(seeded, {
        designTool: designTool === 'off' ? 'paint' : designTool,
      });
    },
    newBlank: () => replace(emptyDesign(), { designTool: 'paint' }),
    redo: history.redo,
    toSeed: () => replace(null, { designTool: 'off' }),
    undo: history.undo,
  };

  const editor = useMemo(
    () => ({
      design,
      onChange: (next) => setCode(encodeDesign(next)),
      onStrokeStart: history.checkpoint,
    }),
    [design, history.checkpoint, setCode]
  );

  return { actions, editor };
}
