import React, { useRef } from 'react';

import { scaleCorners } from '../utils/transforms';

const CORNER_NAMES = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

function eventPoint(event, stage, output) {
  const rect = stage.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * output.width,
    y: ((event.clientY - rect.top) / rect.height) * output.height,
  };
}

export default function TransformOverlay({ layer, onCornersChange, output }) {
  const dragRef = useRef(null);

  if (!layer) return null;

  const startDrag = (event, cornerIndex = null) => {
    if (layer.locked) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const stage = event.currentTarget.closest('.pm-stage');
    dragRef.current = {
      cornerIndex,
      origin: eventPoint(event, stage, output),
      startCorners: layer.corners.map((corner) => ({ ...corner })),
      stage,
    };
  };

  const moveDrag = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const point = eventPoint(event, drag.stage, output);
    const delta = {
      x: point.x - drag.origin.x,
      y: point.y - drag.origin.y,
    };
    onCornersChange(
      drag.startCorners.map((corner, index) =>
        drag.cornerIndex === null || drag.cornerIndex === index
          ? { x: corner.x + delta.x, y: corner.y + delta.y }
          : corner
      )
    );
  };

  const points = layer.corners
    .map((corner) => `${corner.x},${corner.y}`)
    .join(' ');

  return (
    <div
      className="pm-transform-overlay"
      onWheel={(event) => {
        if (layer.locked) return;
        event.preventDefault();
        onCornersChange(
          scaleCorners(layer.corners, event.deltaY < 0 ? 1.03 : 0.97)
        );
      }}
    >
      <svg
        aria-label={`Transform ${layer.name}`}
        className="pm-transform-overlay__svg"
        viewBox={`0 0 ${output.width} ${output.height}`}
      >
        <polygon
          className="pm-transform-overlay__polygon"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={() => {
            dragRef.current = null;
          }}
          points={points}
        />
      </svg>
      {layer.corners.map((corner, index) => (
        <button
          aria-label={`Move corner ${index + 1}`}
          className="pm-transform-overlay__handle"
          key={`${layer.id}-${CORNER_NAMES[index]}`}
          onPointerDown={(event) => startDrag(event, index)}
          onPointerMove={moveDrag}
          onPointerUp={() => {
            dragRef.current = null;
          }}
          style={{ left: corner.x, top: corner.y }}
          type="button"
        />
      ))}
    </div>
  );
}
