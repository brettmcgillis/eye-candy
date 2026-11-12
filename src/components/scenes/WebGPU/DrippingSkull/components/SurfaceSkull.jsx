import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { acceleratedRaycast } from 'three-mesh-bvh';
import { Raycaster, Vector2 } from 'three/webgpu';

import { useMeltSurface } from '@elements/Skull';

import { createRig, createRotation, projectFacing } from '../utils/melt';

function SurfaceSkull({ config, floorY }) {
  const renderer = useThree((state) => state.gl);
  const body = useRef();
  const controls = useThree((state) => state.controls);
  const camera = useThree((state) => state.camera);
  const configRef = useRef(config);
  configRef.current = config;
  const rotationRef = useRef();
  const quality = useRef({
    elapsed: 0,
    frames: 0,
    detail: false,
    recovery: 0,
    cooldown: 0,
  });
  const setDpr = useThree((state) => state.setDpr);
  const initialDpr = useRef(renderer.getPixelRatio());
  useEffect(() => () => setDpr(initialDpr.current), [setDpr]);
  useEffect(() => {
    if (config.meltQuality !== 'auto')
      setDpr(
        config.meltQuality === 'low'
          ? Math.min(1, initialDpr.current)
          : initialDpr.current
      );
  }, [config.meltQuality, setDpr]);
  const lite = config.meltQuality !== 'high';
  const anatomy = {
    showMandible: config.showMandible,
    showTeeth: config.showTeeth,
  };
  const geometry = useMeltSurface(anatomy);
  const lowGeometry = useMeltSurface({ ...anatomy, lite: true });
  const rig = useMemo(
    () =>
      createRig(geometry, {
        lite,
        floorY,
        seed: config.meltSeed,
        display: lite ? lowGeometry : null,
      }),
    [geometry, lowGeometry, lite, floorY, config.meltSeed]
  );
  const resetRef = useRef(config.meltResetRef.current);
  const flipRef = useRef(config.meltFlipRef.current);
  useEffect(() => () => rig.dispose(), [rig]);
  useEffect(() => {
    if (!controls || !body.current) return undefined;
    const mesh = body.current;
    mesh.userData.shutterMatrixWorld = mesh.matrixWorld.clone();
    mesh.raycast = acceleratedRaycast;
    const raycaster = new Raycaster();
    raycaster.firstHitOnly = true;
    const pointer = new Vector2();
    const rotation = createRotation({
      body: mesh,
      camera,
      controls,
      domElement: renderer.domElement,
      radius: () => rig.shape.radius,
      mode: () => configRef.current.meltMotion,
      spin: () => configRef.current.meltSpin,
      shutter: () => 1 / 60,
      hit(x, y) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set(
          (2 * (x - rect.left)) / rect.width - 1,
          1 - (2 * (y - rect.top)) / rect.height
        );
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObject(mesh, false)[0];
        if (!hit) return null;
        const point = mesh.worldToLocal(hit.point);
        const direction = raycaster.ray.direction
          .clone()
          .transformDirection(mesh.matrixWorld.clone().invert());
        return projectFacing(rig.simulation.walk, point, direction);
      },
      press: {
        start: (hit) => rig.simulation.blobs.press(hit),
        release: (seconds) => rig.simulation.blobs.release(seconds),
        cancel: () => rig.simulation.blobs.cancel(),
      },
    });
    rotationRef.current = rotation;
    return () => {
      rotation.dispose();
      rotationRef.current = null;
    };
  }, [camera, controls, renderer, rig]);

  useFrame((_, delta) => {
    if (!body.current) return;
    rig.simulation.configure(config);
    if (resetRef.current !== config.meltResetRef.current) {
      rig.simulation.reset();
      resetRef.current = config.meltResetRef.current;
    }
    if (flipRef.current !== config.meltFlipRef.current) {
      rotationRef.current?.flip();
      flipRef.current = config.meltFlipRef.current;
    }
    rotationRef.current?.update(Math.min(delta, 0.1));
    body.current.updateMatrixWorld(true);
    const frame = rig.simulation.update(delta, body.current, camera);
    rig.surface.sync(frame.poolCount);
    rig.dropMesh.geometry.instanceCount = frame.dropCount;
    rig.puddleNodes.sync();
    rig.puddleMesh.visible = config.meltPuddle;
    rig.materials.forEach((look) => look.sync(config));
    renderer.compute(rig.surface.compute);
    const adaptive = quality.current;
    if (config.meltQuality === 'auto') {
      adaptive.elapsed += delta;
      adaptive.frames += 1;
      if (adaptive.elapsed >= 3) {
        const fps = adaptive.frames / adaptive.elapsed;
        if (fps < 45) {
          adaptive.recovery = 0;
          adaptive.cooldown = 10;
          if (adaptive.detail) adaptive.detail = false;
          else if (renderer.getPixelRatio() > 0.75)
            setDpr(Math.max(0.75, renderer.getPixelRatio() * 0.75));
        } else if (fps > 57) {
          adaptive.recovery += 1;
          if (adaptive.recovery >= 3 && adaptive.cooldown === 0) {
            if (renderer.getPixelRatio() < initialDpr.current)
              setDpr(
                Math.min(initialDpr.current, renderer.getPixelRatio() * 1.1)
              );
            else adaptive.detail = true;
            adaptive.recovery = 0;
          }
        }
        adaptive.cooldown = Math.max(0, adaptive.cooldown - 1);
        adaptive.elapsed = 0;
        adaptive.frames = 0;
      }
      rig.surface.setDetail(adaptive.detail);
    } else rig.surface.setDetail(config.meltQuality === 'high');
  });

  return (
    <>
      <mesh
        ref={body}
        position={[0, 0.6, 0]}
        geometry={rig.shape.geometry}
        material={rig.materials[0].material}
        castShadow
        receiveShadow
        frustumCulled={false}
        userData={rig.userData}
        dispose={null}
      />
      <primitive object={rig.dropMesh} dispose={null} />
      <primitive object={rig.puddleMesh} dispose={null} />
    </>
  );
}

export default memo(SurfaceSkull);
