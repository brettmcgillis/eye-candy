import React, { memo, useEffect, useRef } from 'react';

import AudioToggleOverlay from '@app/scaffold/overlay/components/AudioToggleOverlay';

import NoteLabels from './components/NoteLabels';
import Stage from './components/Stage';
import useAudio from './hooks/useAudio';
import useSceneControls from './hooks/useSceneControls';
import { getPresetView } from './presets/views';
import { midiToName } from './utils/audio/music';

function EarCandy() {
  const c = useSceneControls();
  const audio = useAudio(c);
  const View = getPresetView(c.preset);
  const labelsRef = useRef(null);

  useEffect(() => {
    if (!c.showNotes) return undefined;
    return audio.onNote(({ delay, midi, voice, x, y }) =>
      labelsRef.current?.spawn(midiToName(midi), x, y, delay, voice)
    );
  }, [audio, c.showNotes]);

  return (
    <>
      <Stage backgroundColor={c.backgroundColor}>
        <View key={c.preset} audio={audio} c={c} labelsRef={labelsRef} />
        {c.showNotes && <NoteLabels ref={labelsRef} />}
      </Stage>
      <AudioToggleOverlay />
    </>
  );
}

export default memo(EarCandy);
