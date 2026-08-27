import React, { memo, useEffect, useMemo, useRef } from 'react';

import { PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { isAppUiHidden, setAppUiHidden } from '../utils/appUi';
import getTheatreSheet, { initTheatreStudio } from '../utils/theatreSheet';
import { THEATRE_DRIVEN_KEYS } from '../utils/theatreSpec';
import registerTheatreUiToolbar from '../utils/theatreToolbar';

// Group values arrive nested one level deep, since each technique is a
// compound prop (that nesting is what gives the studio panel its folders).
// Leaf keys are the flat scene control keys verbatim, so unwrapping one level
// lands them straight on config with no name mapping.
function assignGroups(target, groupValues) {
  Object.values(groupValues).forEach((group) => Object.assign(target, group));
}

// Theatre takes the scene by writing straight into the live config object
// rather than through React state. Every consumer already reads `config.x`
// inside its own useFrame, so an in-place write reaches all of them with no
// re-render — which matters when the values change every frame of a sequence.
// Leva stays the owner: the pre-sequence values are snapshotted on mount and
// put back on unmount, and the two never write the same key (see
// utils/theatreSheet.js).
//
// It also owns the camera outright while mounted. CameraRig is unmounted by
// the caller instead of being fought over, so its OrbitControls aren't there
// to overwrite the sequence's transform after it lands.
function TheatreDriver({ config }) {
  const {
    sheet,
    camera: cameraObject,
    glitch,
    post,
  } = useMemo(() => getTheatreSheet(), []);

  const cameraRef = useRef(null);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const snapshot = Object.fromEntries(
      THEATRE_DRIVEN_KEYS.map((key) => [key, configRef.current[key]])
    );

    return () => {
      Object.assign(configRef.current, snapshot);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    initTheatreStudio().then((studio) => {
      if (!studio || cancelled) return;

      registerTheatreUiToolbar(studio);

      if (config.theatreStudioVisible) {
        studio.ui.restore();
        // Selecting the object is what puts its tracks on the dopesheet — the
        // sequence editor opens on the current selection, so without this the
        // seeded slit-scan track is there but nothing shows it.
        studio.setSelection([glitch]);
      } else {
        studio.ui.hide();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [config.theatreStudioVisible, glitch]);

  // Hide the app chrome for the duration of the sequence and put back whatever
  // it was on the way out, so switching Drive Scene off doesn't strand the
  // scene with no Leva panel. The eye button in the studio toolbar (and
  // Shift+H) toggle it back without leaving Theatre.
  useEffect(() => {
    if (!config.theatreHideUi) return undefined;

    const wasHidden = isAppUiHidden();
    setAppUiHidden(true);

    return () => {
      setAppUiHidden(wasHidden);
    };
  }, [config.theatreHideUi]);

  useEffect(() => {
    if (config.theatrePlaying) {
      sheet.sequence.play({
        iterationCount: config.theatreLoop ? Infinity : 1,
        rate: config.theatreRate,
      });
    } else {
      sheet.sequence.pause();
    }
  }, [
    config.theatreLoop,
    config.theatrePlaying,
    config.theatreRate,
    sheet.sequence,
  ]);

  // Scrubbing only applies while paused, so a drag can't fight playback for
  // ownership of the playhead.
  useEffect(() => {
    if (!config.theatrePlaying) {
      sheet.sequence.position = config.theatreTime;
    }
  }, [config.theatrePlaying, config.theatreTime, sheet.sequence]);

  useFrame(() => {
    assignGroups(configRef.current, glitch.value);
    assignGroups(configRef.current, post.value);

    const camera = cameraRef.current;
    if (!camera) return;

    const { position, lookAt, fov, roll } = cameraObject.value;

    camera.position.set(position.x, position.y, position.z);
    camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    camera.rotateZ(THREE.MathUtils.degToRad(roll));

    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, -1000);

  return <PerspectiveCamera ref={cameraRef} makeDefault near={0.1} far={500} />;
}

export default memo(TheatreDriver);
