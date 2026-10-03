import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import OldSofa from '@elements/OldSofa/OldSofa';
import {
  DRAPE_KEYS,
  clothLayout,
  createRugCloth,
  rodHeightFor,
} from '@modules/rugPull';
import { FLOOR_GAP, WALL_GAP, createRugRig } from '@modules/rugPullRender';

import createRugClient, { weaveKey } from '../utils/createRugClient';

const SOFA_SCALE = 0.8;
const SOFA_DEPTH = 0.72 * SOFA_SCALE;
const PULL_SECONDS = 0.7;

const drapeKey = (config) => DRAPE_KEYS.map((key) => config[key]).join('|');

function Rug({ config }) {
  const configRef = useRef(config);
  configRef.current = config;
  const controls = useThree((state) => state.controls);
  const camera = useThree((state) => state.camera);

  const rig = useMemo(createRugRig, []);
  const [build, setBuild] = useState(null);
  const clothRef = useRef(null);
  const dragRef = useRef(null);
  const pullRef = useRef(null);
  const clientRef = useRef(null);
  const { pullRef: pullHandle } = config;

  useEffect(() => {
    const client = createRugClient(setBuild);
    clientRef.current = client;
    client.request(configRef.current);
    return () => client.dispose();
  }, []);

  const weave = weaveKey(config);
  useEffect(() => {
    clientRef.current?.request(configRef.current);
  }, [weave]);

  useEffect(() => {
    rig.apply(config);
  }, [config, rig]);

  useEffect(() => {
    if (build) rig.setBuild(build);
  }, [build, rig]);

  const drape = drapeKey(config);
  const layout = useMemo(() => {
    if (!build) return null;
    const c = configRef.current;
    return {
      cloth: clothLayout(build, c),
      rodHeight: rodHeightFor(build, c),
    };
  }, [build, drape]);

  useEffect(() => {
    if (!layout) return;
    const c = configRef.current;
    clothRef.current = createRugCloth(layout.cloth, {
      ...c,
      floorGap: FLOOR_GAP,
      iterations: 8,
      mode: c.rugMode,
      rodHeight: layout.rodHeight,
      seed: c.rugSeed,
      wallGap: WALL_GAP,
    });
    rig.setLayout(layout.cloth, {
      clipCount: c.clipCount,
      hangStyle: c.hangStyle,
      mode: c.rugMode,
      rodHeight: layout.rodHeight,
    });
    rig.updateCloth(clothRef.current.positions);
  }, [layout, rig]);

  useEffect(() => () => rig.dispose(), [rig]);

  // "Pull the rug": the foot edge is yanked out from under the room.
  useEffect(() => {
    pullHandle.current = () => {
      const cloth = clothRef.current;
      if (!cloth) return;
      const { nx, ny } = cloth;
      const index = (ny - 1) * nx + Math.floor(nx / 2);
      const from = Array.from(
        cloth.positions.subarray(index * 3, index * 3 + 3)
      );
      const wall = configRef.current.rugMode === 'wall';
      const to = wall
        ? [from[0], from[1] - 0.6, from[2] + 0.9]
        : [from[0], from[1] + 0.35, from[2] + 1.4];
      pullRef.current = { from, index, t: 0, to };
    };
    return () => {
      pullHandle.current = null;
    };
  }, [pullHandle]);

  useFrame((_, delta) => {
    const cloth = clothRef.current;
    if (!cloth) return;
    const c = configRef.current;
    cloth.set({ wind: c.wind });
    const pull = pullRef.current;
    if (pull && !dragRef.current) {
      pull.t += delta / PULL_SECONDS;
      const s = Math.min(1, pull.t);
      const ease = s * s * (3 - 2 * s);
      cloth.grab(
        pull.index,
        pull.from.map((v, i) => v + (pull.to[i] - v) * ease)
      );
      if (pull.t >= 1.4) {
        cloth.release();
        pullRef.current = null;
      }
    }
    cloth.step(delta, 1);
    rig.updateCloth(cloth.positions);
  });

  const handlers = useMemo(() => {
    const target = new THREE.Vector3();
    const normal = new THREE.Vector3();
    return {
      onPointerDown(event) {
        const cloth = clothRef.current;
        if (!cloth || event.object !== rig.mesh) return;
        event.stopPropagation();
        event.target.setPointerCapture?.(event.pointerId);
        camera.getWorldDirection(normal).negate();
        dragRef.current = {
          index: cloth.nearest(event.point.toArray()),
          plane: new THREE.Plane().setFromNormalAndCoplanarPoint(
            normal,
            event.point
          ),
        };
        if (controls) controls.enabled = false;
      },
      onPointerMove(event) {
        const drag = dragRef.current;
        if (!drag) return;
        if (event.ray.intersectPlane(drag.plane, target)) {
          clothRef.current?.grab(drag.index, target.toArray());
        }
      },
      onPointerUp(event) {
        if (!dragRef.current) return;
        event.target.releasePointerCapture?.(event.pointerId);
        dragRef.current = null;
        clothRef.current?.release();
        if (controls) controls.enabled = true;
      },
    };
  }, [camera, controls, rig]);

  const sofaZ = layout
    ? -(layout.cloth.totalLength / 2 + 0.3 + SOFA_DEPTH)
    : -2;

  return (
    <>
      <primitive object={rig.group} {...handlers} />
      {config.rugMode === 'floor' && config.sofa ? (
        <OldSofa position={[0, 0, sofaZ]} scale={SOFA_SCALE} />
      ) : null}
    </>
  );
}

export default memo(Rug);
