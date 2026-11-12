import { useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import { CanvasTexture, LinearFilter, SRGBColorSpace, Vector3 } from 'three';

import { configureBrush } from '../utils/paintStyle';

const Y_AXIS = new Vector3(0, 1, 0);

export default function useCameraInk({
  root,
  plane,
  paths,
  time,
  config,
  runtimeRef,
  enabled,
}) {
  const state = useMemo(
    () => ({
      current: {
        busy: false,
        next: 0,
        frame: 0,
        disposed: false,
        millis: 0,
        error: '',
        painted: false,
      },
    }),
    [config.resolution]
  );
  const output = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = config.resolution;
    canvas.height = config.resolution;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    return {
      canvas,
      texture,
      point: new Vector3(),
      center: new Vector3(),
      extent: new Vector3(),
      scale: new Vector3(),
      origin: new Vector3(),
    };
  }, [config.resolution]);
  useEffect(() => {
    state.current.disposed = false;
    const job = state.current;
    return () => {
      job.disposed = true;
      output.texture.dispose();
    };
  }, [output]);
  useEffect(() => {
    state.current.next = 0;
  }, [config]);
  useFrame(({ camera, clock }) => {
    if (!enabled || !root.current || !runtimeRef.current) return;
    plane.current.quaternion.copy(camera.quaternion);
    const job = state.current;
    if (job.busy || clock.elapsedTime < job.next) return;
    job.next = clock.elapsedTime + 1 / config.stabilityFps;
    root.current.updateWorldMatrix(true, false);
    output.center
      .set(0, 0, 0)
      .applyMatrix4(root.current.matrixWorld)
      .project(camera);
    root.current.getWorldScale(output.scale);
    root.current.getWorldPosition(output.origin);
    output.extent
      .set(3 * output.scale.x, 0, 0)
      .applyQuaternion(camera.quaternion)
      .add(output.origin)
      .project(camera);
    const spanX = Math.max(0.001, Math.abs(output.extent.x - output.center.x));
    output.extent
      .set(0, 3 * output.scale.y, 0)
      .applyQuaternion(camera.quaternion)
      .add(output.origin)
      .project(camera);
    const spanY = Math.max(0.001, Math.abs(output.extent.y - output.center.y));
    const projected = paths.map((path) =>
      path
        .filter((_p, index) => index % 4 === 0 || index === path.length - 1)
        .map((p, index, samples) => {
          output.point
            .set(p[0], p[1], p[2])
            .applyAxisAngle(Y_AXIS, time.current);
          output.point.x += Math.sin(time.current * 2) * 0.2;
          output.point.applyMatrix4(root.current.matrixWorld).project(camera);
          const phase = index / Math.max(1, samples.length - 1);
          const middle = config.pressureMiddle;
          let pressure =
            config.pressureStart + (middle - config.pressureStart) * phase * 2;
          if (phase > 0.5)
            pressure =
              middle + (config.pressureEnd - middle) * (phase - 0.5) * 2;
          return [
            384 + ((output.point.x - output.center.x) * 384) / spanX,
            384 - ((output.point.y - output.center.y) * 384) / spanY,
            pressure,
          ];
        })
    );
    const snapshot = {
      ...config,
      seed: config.seed + (config.stabilitySeed === 'boiling' ? job.frame : 0),
    };
    job.frame += 1;
    job.busy = true;
    const started = performance.now();
    runtimeRef.current
      .paint(
        [
          (brush) => {
            configureBrush(brush, snapshot);
            projected.forEach((path) => brush.spline(path, config.curvature));
          },
        ],
        snapshot
      )
      .then((canvas) => {
        if (!canvas || job.disposed) return;
        const ctx = output.canvas.getContext('2d');
        ctx.globalAlpha = job.painted ? 1 - config.stabilityPersistence : 1;
        ctx.drawImage(canvas, 0, 0);
        ctx.globalAlpha = 1;
        output.texture.needsUpdate = true;
        job.painted = true;
        job.millis = performance.now() - started;
        job.error = '';
      })
      .catch((error) => {
        if (!job.disposed) job.error = error.message;
      })
      .finally(() => {
        job.busy = false;
      });
  });
  return { texture: output.texture, job: state };
}
