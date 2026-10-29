import { useRef, useState } from 'react';

import { editPieces, placePiece, removePieces, snap } from '@modules/paperCuts';

export default function usePointerTools({
  design,
  onChange,
  onCheckpoint,
  selected,
  onSelect,
  activeLayer,
  brush,
  tool,
  svgRef,
  worldRef,
  view,
  setView,
}) {
  const gesture = useRef(null);
  const [ghost, setGhost] = useState(null);
  const pointOf = (event) => {
    const point = svgRef.current.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(
      worldRef.current.getScreenCTM().inverse()
    );
    return { x: snap(local.x), y: snap(local.y) };
  };
  const pick = (point) =>
    [...design.pieces]
      .reverse()
      .find(
        (p) =>
          p.layer === activeLayer &&
          Math.abs(p.x - point.x) <= p.size / 2 &&
          Math.abs(p.y - point.y) <= p.size / 2
      );
  const down = (event) => {
    if (event.button !== 0 && event.button !== 1) return;
    event.preventDefault();
    svgRef.current.focus();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* Pointer capture is unavailable on some SVG hosts. */
    }
    const start = pointOf(event);
    if (tool === 'view' || event.button === 1 || event.altKey) {
      gesture.current = {
        pan: true,
        clientX: event.clientX,
        clientY: event.clientY,
        view,
      };
      return;
    }
    const piece = pick(start);
    if (tool === 'select') {
      onSelect(piece ? [piece.id] : []);
      return;
    }
    if (tool === 'paint') {
      onCheckpoint();
      const next = placePiece(design, {
        ...start,
        size: brush,
        layer: activeLayer,
      });
      gesture.current = {
        paint: true,
        previous: start,
        design: next ?? design,
      };
      if (next) onChange(next);
      return;
    }
    if (!piece) {
      onSelect([]);
      return;
    }
    if (tool === 'erase') {
      onCheckpoint();
      onChange(removePieces(design, [piece.id]));
      onSelect([]);
      return;
    }
    const ids = selected.includes(piece.id) ? selected : [piece.id];
    onSelect(ids);
    onCheckpoint();
    gesture.current = { design, start, ids, duplicate: tool === 'duplicate' };
  };
  const move = (event) => {
    const drag = gesture.current;
    if (drag?.pan) {
      setView({
        ...drag.view,
        x:
          drag.view.x -
          ((event.clientX - drag.clientX) * drag.view.width) /
            svgRef.current.clientWidth,
        y:
          drag.view.y -
          ((event.clientY - drag.clientY) * drag.view.height) /
            svgRef.current.clientHeight,
      });
      return;
    }
    const point = pointOf(event);
    if (drag?.paint) {
      let next = drag.design;
      const steps = Math.max(
        1,
        Math.ceil(
          Math.max(
            Math.abs(point.x - drag.previous.x),
            Math.abs(point.y - drag.previous.y)
          ) * 4
        )
      );
      for (let i = 1; i <= steps; i += 1)
        next =
          placePiece(next, {
            x: snap(
              drag.previous.x + ((point.x - drag.previous.x) * i) / steps
            ),
            y: snap(
              drag.previous.y + ((point.y - drag.previous.y) * i) / steps
            ),
            size: brush,
            layer: activeLayer,
          }) ?? next;
      drag.previous = point;
      drag.design = next;
      onChange(next);
      setGhost(null);
      return;
    }
    if (drag?.ids) {
      const dx = snap(point.x - drag.start.x);
      const dy = snap(point.y - drag.start.y);
      if (drag.duplicate && dx === 0 && dy === 0) return;
      const next = editPieces(
        drag.design,
        drag.ids,
        (p) => ({ x: snap(p.x + dx), y: snap(p.y + dy) }),
        { duplicate: drag.duplicate }
      );
      const first = drag.design.pieces.find((p) => p.id === drag.ids[0]);
      setGhost({
        x: first.x + dx,
        y: first.y + dy,
        size: first.size,
        valid: !!next,
      });
      if (next) {
        onChange(next);
        if (drag.duplicate)
          onSelect(
            next.pieces
              .filter((p) => !drag.design.pieces.some((q) => q.id === p.id))
              .map((p) => p.id)
          );
      }
      return;
    }
    if (tool === 'paint')
      setGhost({
        ...point,
        size: brush,
        valid: !!placePiece(design, {
          ...point,
          size: brush,
          layer: activeLayer,
        }),
      });
    else setGhost(null);
  };
  const up = () => {
    gesture.current = null;
    setGhost(null);
  };
  return {
    ghost,
    handlers: {
      onPointerDown: down,
      onPointerMove: move,
      onPointerUp: up,
      onPointerCancel: up,
      onLostPointerCapture: up,
      onPointerLeave: () => {
        if (!gesture.current) setGhost(null);
      },
    },
  };
}
