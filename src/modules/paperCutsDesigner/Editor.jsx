import React, { memo, useEffect, useId, useRef, useState } from 'react';

import { editPieces, layerColor, removePieces, snap } from '@modules/paperCuts';

import usePointerTools from './usePointerTools';

function fittedView(design) {
  const lowX = Math.min(-2, ...design.pieces.map((p) => p.x - p.size / 2));
  const highX = Math.max(2, ...design.pieces.map((p) => p.x + p.size / 2));
  const lowY = Math.min(-2, ...design.pieces.map((p) => p.y - p.size / 2));
  const highY = Math.max(2, ...design.pieces.map((p) => p.y + p.size / 2));
  const width =
    Math.max(highX - lowX, highY - lowY) * (design.rotate ? Math.SQRT2 : 1) + 3;
  const angle = design.rotate ? -Math.PI / 4 : 0;
  const cx = (lowX + highX) / 2;
  const cy = (lowY + highY) / 2;
  return {
    x: cx * Math.cos(angle) - cy * Math.sin(angle) - width / 2,
    y: -(cx * Math.sin(angle) + cy * Math.cos(angle)) - width / 2,
    width,
    height: width,
  };
}
function Editor({
  design,
  config,
  activeLayer,
  brush,
  tool,
  selected,
  onSelect,
  onChange,
  onCheckpoint,
  frameRevision,
  isolate,
}) {
  const svgRef = useRef(null);
  const worldRef = useRef(null);
  const latest = useRef(design);
  latest.current = design;
  const [view, setView] = useState(() => fittedView(design));
  const id = useId().replaceAll(':', '');
  useEffect(() => setView(fittedView(latest.current)), [frameRevision]);
  useEffect(() => {
    const svg = svgRef.current;
    const wheel = (event) => {
      event.preventDefault();
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const local = point.matrixTransform(svg.getScreenCTM().inverse());
      setView((current) => {
        const width = Math.min(
          200,
          Math.max(2, current.width * Math.exp(event.deltaY * 0.001))
        );
        const factor = width / current.width;
        return {
          x: local.x - (local.x - current.x) * factor,
          y: local.y - (local.y - current.y) * factor,
          width,
          height: current.height * factor,
        };
      });
    };
    svg.addEventListener('wheel', wheel, { passive: false });
    return () => svg.removeEventListener('wheel', wheel);
  }, []);
  const { ghost, handlers } = usePointerTools({
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
  });
  const keyDown = (event) => {
    if (event.metaKey || event.ctrlKey) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onCheckpoint();
      onChange(removePieces(design, selected));
      onSelect([]);
    }
    const offsets = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1],
    };
    if (offsets[event.key] && selected.length) {
      event.preventDefault();
      const [dx, dy] = offsets[event.key];
      const step = event.shiftKey ? 1 : 0.25;
      const next = editPieces(design, selected, (p) => ({
        x: snap(p.x + dx * step),
        y: snap(p.y + dy * step),
      }));
      if (next) {
        onCheckpoint();
        onChange(next);
      }
    }
  };
  return (
    <svg
      {...handlers}
      ref={svgRef}
      aria-label="PaperCuts design editor"
      className="pcd-editor"
      role="application"
      tabIndex={0}
      onKeyDown={keyDown}
      viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
    >
      <defs>
        <pattern
          id={`${id}-quarter`}
          width="0.25"
          height="0.25"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M.25 0H0V.25"
            fill="none"
            stroke="#d9dde2"
            strokeWidth="0.008"
          />
        </pattern>
        <pattern
          id={`${id}-unit`}
          width="1"
          height="1"
          patternUnits="userSpaceOnUse"
        >
          <rect width="1" height="1" fill={`url(#${id}-quarter)`} />
          <path d="M1 0H0V1" fill="none" stroke="#bbc3cd" strokeWidth="0.015" />
        </pattern>
      </defs>
      <g
        ref={worldRef}
        transform={`scale(1 -1) rotate(${design.rotate ? -45 : 0})`}
      >
        <rect
          x="-1000"
          y="-1000"
          width="2000"
          height="2000"
          fill={`url(#${id}-unit)`}
        />
        {[...design.pieces]
          .sort((a, b) => b.layer - a.layer)
          .filter((p) => !isolate || p.layer === activeLayer)
          .map((p) => (
            <rect
              key={p.id}
              x={p.x - p.size / 2}
              y={p.y - p.size / 2}
              width={p.size}
              height={p.size}
              fill={layerColor(config, p.layer, design.layerCount)}
              fillOpacity={
                p.layer === activeLayer || tool === 'view' ? 1 : 0.24
              }
              stroke={selected.includes(p.id) ? '#1267d6' : '#384354'}
              strokeWidth={selected.includes(p.id) ? 0.065 : 0.018}
              pointerEvents="none"
            />
          ))}
        {ghost ? (
          <rect
            x={ghost.x - ghost.size / 2}
            y={ghost.y - ghost.size / 2}
            width={ghost.size}
            height={ghost.size}
            fill={ghost.valid ? '#14a66a' : '#d43c48'}
            fillOpacity="0.25"
            stroke={ghost.valid ? '#087d4b' : '#b42132'}
            strokeWidth="0.04"
            pointerEvents="none"
          />
        ) : null}
      </g>
    </svg>
  );
}
export default memo(Editor);
