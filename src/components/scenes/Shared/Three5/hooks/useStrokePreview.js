/* eslint-disable no-param-reassign */
import { useEffect, useMemo, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three';

import { unmatteInk } from '../utils/canvasOutputs';
import paintStrokes from '../utils/paintStrokes';

export default function useStrokePreview(
  assets,
  config,
  runtimeRef,
  strokes,
  paths
) {
  const version = useRef(0);
  const running = useRef(false);
  const feedback = useRef(null);
  const liveUpdates = useRef(0);
  const current = useRef({ assets, config });
  current.current = { assets, config };
  const [error, setError] = useState('');
  const preview = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = config.resolution;
    canvas.height = config.resolution;
    const context = canvas.getContext('2d');
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    return { canvas, context, texture, painted: -1, lastTime: 0, active: true };
  }, [config.resolution]);
  useEffect(() => {
    preview.active = true;
    return () => {
      preview.active = false;
      preview.texture.dispose();
    };
  }, [preview]);
  useEffect(() => {
    version.current += 1;
    if (feedback.current && !paths.current)
      feedback.current.textContent = 'Brush ready · drag to paint';
  }, [assets, config.paintEnabled]);

  useFrame(({ clock }) => {
    if (
      preview.painted === version.current ||
      running.current ||
      clock.elapsedTime - preview.lastTime < 0.06 ||
      !runtimeRef.current
    )
      return;
    preview.lastTime = clock.elapsedTime;
    preview.painted = version.current;
    const snapshot = current.current;
    const pending = strokes.current.filter(
      ({ id }) => id > snapshot.assets.lastStrokeId
    );
    const gesture = paths.current;
    if (gesture)
      gesture.forEach((path) => {
        if (path.length)
          pending.push({
            points: path.map((point) => [...point]),
            style: snapshot.config,
          });
      });
    if (!pending.length) {
      preview.context.clearRect(
        0,
        0,
        preview.canvas.width,
        preview.canvas.height
      );
      preview.texture.needsUpdate = true;
      return;
    }
    running.current = true;
    runtimeRef.current
      .paint([(brush) => paintStrokes(brush, pending)], snapshot.config, true)
      .then((ink) => {
        if (
          !preview.active ||
          !ink ||
          snapshot.assets !== current.current.assets
        )
          return;
        preview.context.clearRect(
          0,
          0,
          preview.canvas.width,
          preview.canvas.height
        );
        preview.context.drawImage(unmatteInk(ink, snapshot.config.ink), 0, 0);
        preview.texture.needsUpdate = true;
        if (feedback.current && gesture && paths.current === gesture) {
          liveUpdates.current += 1;
          feedback.current.dataset.liveUpdates = String(liveUpdates.current);
          feedback.current.textContent =
            'Painting · surface and earlier marks preserved';
        }
      })
      .catch((failure) => {
        if (preview.active) setError(failure.message);
      })
      .finally(() => {
        running.current = false;
      });
  });
  return {
    texture: preview.texture,
    feedback,
    error,
    touch: () => {
      version.current += 1;
      if (feedback.current)
        feedback.current.dataset.pointerDown = String(Boolean(paths.current));
      if (feedback.current && !paths.current)
        feedback.current.textContent = 'Finishing stroke…';
    },
  };
}
