import { useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { Howl, Howler } from 'howler';
import { Vector3 } from 'three';

import useSceneAudioStore from '@store/useSceneAudioStore';
import { audioFile } from '@utils/appUtils';

const FADE_MS = 2000;
const UP = new Vector3(0, 1, 0);

// Cone fields are included so every pannerAttr() object we hand Howler is
// complete — otherwise Howler merges our partial over an undefined cone value
// and assigns NaN to PannerNode.coneInnerAngle, which throws.
const DEFAULT_PANNER = Object.freeze({
  panningModel: 'HRTF',
  distanceModel: 'inverse',
  refDistance: 4,
  rolloffFactor: 1,
  maxDistance: 60,
  coneInnerAngle: 360,
  coneOuterAngle: 360,
  coneOuterGain: 0,
});

/**
 * Loop a track as a spatialized point source through Howler's Web Audio panner.
 *
 * Returns a ref to attach to an <object3D>; that object's world position drives
 * the source location, so dropping the anchor inside a transformed group keeps
 * the sound glued to whatever moves with it. The listener tracks the R3F camera.
 */
export default function usePositionalLoopedAudio(
  src,
  { volume = 0.5, panner } = {}
) {
  const camera = useThree((state) => state.camera);
  const registerAudio = useSceneAudioStore((s) => s.registerAudio);
  const unregisterAudio = useSceneAudioStore((s) => s.unregisterAudio);
  const audioEnabled = useSceneAudioStore((s) => s.audioEnabled);

  const soundRef = useRef(null);
  const anchorRef = useRef(null);
  const scratch = useRef({
    pos: new Vector3(),
    fwd: new Vector3(),
    up: new Vector3(),
  });

  useEffect(() => {
    if (!src) {
      return undefined;
    }

    const howl = new Howl({
      src: [audioFile(src)],
      loop: true,
      volume: 0,
      onloaderror: () => {},
    });

    howl.pannerAttr({ ...DEFAULT_PANNER, ...panner });
    soundRef.current = howl;

    return () => {
      howl.stop();
      howl.unload();
      soundRef.current = null;
    };
    // Recreated only on src change; live panner tweaks handled below.
  }, [src]);

  // Apply panner tweaks to the live source so Leva sliders update in real time.
  useEffect(() => {
    const sound = soundRef.current;

    if (!sound) {
      return;
    }

    sound.pannerAttr({ ...DEFAULT_PANNER, ...panner });
  }, [
    panner?.panningModel,
    panner?.distanceModel,
    panner?.refDistance,
    panner?.rolloffFactor,
    panner?.maxDistance,
  ]);

  useEffect(() => {
    if (!src) {
      return undefined;
    }

    registerAudio();

    return () => unregisterAudio();
  }, [src, registerAudio, unregisterAudio]);

  useEffect(() => {
    const sound = soundRef.current;

    if (!sound) {
      return undefined;
    }

    if (audioEnabled) {
      sound.play();
      sound.fade(0, volume, FADE_MS);
      return undefined;
    }

    sound.fade(volume, 0, FADE_MS);
    const id = setTimeout(() => sound.stop(), FADE_MS);
    return () => clearTimeout(id);
  }, [src, audioEnabled, volume]);

  useFrame(() => {
    const sound = soundRef.current;
    const anchor = anchorRef.current;

    if (!sound || !anchor) {
      return;
    }

    const { pos, fwd, up } = scratch.current;

    camera.getWorldPosition(pos);
    Howler.pos(pos.x, pos.y, pos.z);

    camera.getWorldDirection(fwd);
    up.copy(UP).applyQuaternion(camera.quaternion);
    Howler.orientation(fwd.x, fwd.y, fwd.z, up.x, up.y, up.z);

    anchor.getWorldPosition(pos);
    sound.pos(pos.x, pos.y, pos.z);
  });

  return anchorRef;
}
