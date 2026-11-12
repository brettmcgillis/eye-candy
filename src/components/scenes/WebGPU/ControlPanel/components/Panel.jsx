import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { createPanelDriver } from '@modules/controlPanel';
import { createPanelRig } from '@modules/controlPanelRender';

import useMicBands from '../hooks/useMicBands';
import PanelTouch from './PanelTouch';

const CORNERS = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

// The box the camera sees on the panel's plane (z = 0), from its four
// corner rays; null when a corner misses the plane.
const near = new THREE.Vector3();
const far = new THREE.Vector3();

function viewOf(camera) {
  const box = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  camera.updateMatrixWorld();
  const hits = CORNERS.every(([x, y]) => {
    near.set(x, y, -1).unproject(camera);
    far.set(x, y, 1).unproject(camera).sub(near);
    if (far.z === 0) return false;
    const k = -near.z / far.z;
    if (k < 0) return false;
    const px = near.x + far.x * k;
    const py = near.y + far.y * k;
    box.x0 = Math.min(box.x0, px);
    box.x1 = Math.max(box.x1, px);
    box.y0 = Math.min(box.y0, py);
    box.y1 = Math.max(box.y1, py);
    return true;
  });
  return hits ? box : null;
}

function Panel({ config }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const configRef = useRef(config);
  configRef.current = config;

  const rig = useMemo(createPanelRig, []);
  const driver = useMemo(() => createPanelDriver(), []);
  const mic = useMicBands(config.audioSource === 'mic', config.audioGain);

  useEffect(() => {
    rig.updateEnvironment(gl, scene, config);
  }, [config.envIntensity, config.envTint, gl, rig, scene]);

  useEffect(
    () => () => {
      scene.environment = null;
      driver.session?.dispose();
      rig.dispose();
    },
    [driver, rig, scene]
  );

  useFrame((state, delta) => {
    const c = configRef.current;
    const { moving, offset, statics, patch, offsets, reveals } = driver.step(
      c,
      delta,
      {
        audio: mic.read(),
        release: c.releaseRef.current,
        replay: c.buildReplayRef.current,
        view: viewOf(state.camera),
      }
    );
    rig.group.position.set(offset[0], offset[1], 0);
    if (statics) rig.setStatics(statics);
    rig.setMoving(moving);
    rig.setCables(patch, offsets, reveals);
    c.patchSnapshotRef.current = driver.session.exportConfig;
  });

  return (
    <>
      <primitive object={rig.group} />
      <PanelTouch driver={driver} />
    </>
  );
}

export default memo(Panel);
