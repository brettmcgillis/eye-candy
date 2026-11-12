/* eslint-disable no-param-reassign */
import { useCallback, useEffect, useReducer, useRef } from 'react';

import { Vector3 } from 'three';

export default function useSpaceDrawing(assets, config, actionsRef) {
  const strokes = useRef([]);
  const active = useRef(null);
  const nextId = useRef(0);
  const [, update] = useReducer((v) => v + 1, 0);
  useEffect(() => {
    const list = strokes.current;
    return () => list.forEach((stroke) => stroke.texture.dispose());
  }, []);
  useEffect(() => {
    actionsRef.current = {
      snapshot: () =>
        strokes.current.map((stroke) => ({
          id: stroke.id,
          width: stroke.width,
          points: stroke.points.map(({ point, pressure }) => ({
            point: point.toArray(),
            pressure,
          })),
        })),
      clear: () => {
        strokes.current.forEach((stroke) => stroke.texture.dispose());
        strokes.current.length = 0;
        active.current = null;
        update();
      },
    };
    return () => {
      actionsRef.current = null;
    };
  }, [actionsRef]);
  const begin = useCallback(
    (event, root) => {
      if (active.current) return;
      event.stopPropagation();
      event.target.setPointerCapture(event.pointerId);
      const point = root.worldToLocal(event.point.clone());
      const texture = assets.strokeTexture.clone();
      texture.needsUpdate = true;
      const stroke = {
        id: nextId.current,
        points: [
          { point, pressure: 1 },
          { point: point.clone().add(new Vector3(0.001, 0, 0)), pressure: 1 },
        ],
        texture,
        width: config.spaceWidth,
        lastTime: performance.now(),
      };
      if (strokes.current.length >= 32)
        strokes.current.shift().texture.dispose();
      nextId.current += 1;
      strokes.current.push(stroke);
      active.current = stroke;
      update();
    },
    [assets, config.spaceWidth]
  );
  const move = useCallback(
    (event, root) => {
      const stroke = active.current;
      if (!stroke || stroke.points.length >= 512) return;
      event.stopPropagation();
      const previous = stroke.points.at(-1);
      const target = root.worldToLocal(event.point.clone());
      const now = performance.now();
      const distance = target.distanceTo(previous.point);
      if (distance < 0.012) return;
      let pressure = 1;
      if (config.spacePressure === 'pen' && event.pointerType === 'pen')
        pressure = Math.max(0.12, event.pressure);
      if (config.spacePressure === 'speed')
        pressure = Math.max(
          0.2,
          1.3 - (distance / Math.max(1, now - stroke.lastTime)) * 30
        );
      target.lerpVectors(previous.point, target, 1 - config.spaceSmoothing);
      stroke.points.push({ point: target, pressure });
      stroke.lastTime = now;
    },
    [config.spacePressure, config.spaceSmoothing]
  );
  const end = useCallback((event) => {
    if (!active.current) return;
    event.stopPropagation();
    event.target.releasePointerCapture(event.pointerId);
    active.current = null;
    update();
  }, []);
  return { strokes: [...strokes.current], begin, move, end };
}
