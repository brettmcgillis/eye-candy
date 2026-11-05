import React, { memo, useId, useState } from 'react';

import usePlacement from '../usePlacement';

const label = (item) =>
  `${item.type ?? item.id}${item.variant ? ` · ${item.variant}` : ''}${item.rotation ? ` · ${item.rotation}°` : ''}`;

function Editor({
  editor,
  mode,
  tool,
  brush,
  catalogueIndex,
  placementRotation,
  controlBrush,
}) {
  const [zoom, setZoom] = useState(1);
  const pattern = useId().replaceAll(':', '');
  const { design, module, selection } = editor;
  const inside = mode === 'controls' && module;
  const width = inside ? module.w : design.cols;
  const height = inside ? module.h : design.rows;
  const items = inside ? module.controls : design.modules;
  const { svg, ghost, start, move, end, cancel, leave } = usePlacement({
    editor,
    inside,
    tool,
    brush,
    catalogueIndex,
    placementRotation,
    controlBrush,
  });
  return (
    <div className="cpd-editor">
      <div className="cpd-row cpd-editor-bar">
        <span>
          {inside
            ? `Module ${module.id} · ${width} × ${height}`
            : `Panel · ${width} × ${height}`}
        </span>
        <button
          className="dev-button"
          type="button"
          onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
        >
          −
        </button>
        <button className="dev-button" type="button" onClick={() => setZoom(1)}>
          Fit
        </button>
        <button
          className="dev-button"
          type="button"
          onClick={() => setZoom(Math.min(4, zoom + 0.25))}
        >
          +
        </button>
      </div>
      <div className="cpd-scroll">
        <svg
          ref={svg}
          className={`cpd-grid cpd-grid--${tool}`}
          viewBox={`-0.5 -0.5 ${width + 1} ${height + 1}`}
          style={{
            width: `calc(min(100%, ${(68 * (width + 1)) / (height + 1)}vh) * ${zoom})`,
            aspectRatio: `${width + 1} / ${height + 1}`,
          }}
          aria-label={
            inside
              ? 'Module control placement grid'
              : 'Panel module placement grid'
          }
          onPointerDown={(event) => start(event, null)}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onLostPointerCapture={cancel}
          onPointerLeave={leave}
        >
          <defs>
            <pattern
              id={pattern}
              width="1"
              height="1"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 1 0 L 0 0 0 1"
                fill="none"
                stroke="#62717b"
                strokeOpacity="0.3"
                strokeWidth="0.015"
              />
              <path
                d="M .25 0 V 1 M .5 0 V 1 M .75 0 V 1 M 0 .25 H 1 M 0 .5 H 1 M 0 .75 H 1"
                stroke="#62717b"
                strokeOpacity="0.12"
                strokeWidth="0.008"
              />
            </pattern>
          </defs>
          <rect
            width={width}
            height={height}
            rx="0.03"
            fill="#11191e"
            stroke="#71818b"
            strokeWidth="0.025"
          />
          <rect
            width={width}
            height={height}
            fill={`url(#${pattern})`}
            pointerEvents="none"
          />
          {items.map((item) => {
            const selected = inside
              ? selection.control === item.id
              : selection.module === item.id;
            return (
              <g
                key={item.id}
                role="button"
                tabIndex={0}
                aria-label={inside ? label(item) : `Module ${item.id}`}
                onFocus={() =>
                  editor.select({
                    module: inside ? module.id : item.id,
                    control: inside ? item.id : null,
                  })
                }
                onPointerDown={(event) => start(event, item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter')
                    editor.select({
                      module: inside ? module.id : item.id,
                      control: inside ? item.id : null,
                    });
                }}
              >
                <rect
                  x={item.x + 0.025}
                  y={item.y + 0.025}
                  width={item.w - 0.05}
                  height={item.h - 0.05}
                  rx="0.06"
                  fill={item.zone ? '#304d63' : '#2c383f'}
                  stroke={selected ? '#ffbd69' : '#5a727f'}
                  strokeWidth={selected ? 0.055 : 0.025}
                />
                <text
                  x={item.x + 0.1}
                  y={item.y + 0.27}
                  fontSize={Math.min(
                    0.21,
                    (item.w / Math.max(3, label(item).length)) * 1.3
                  )}
                  fill="#eef2ed"
                  pointerEvents="none"
                >
                  {label(item)}
                </text>
                {!inside
                  ? item.controls.map((control) => (
                      <rect
                        key={control.id}
                        x={item.x + control.x + 0.08}
                        y={item.y + control.y + 0.37}
                        width={Math.max(0.1, control.w - 0.16)}
                        height={Math.max(0.1, control.h - 0.45)}
                        rx="0.08"
                        fill="#7896a0"
                        opacity="0.4"
                        pointerEvents="none"
                      />
                    ))
                  : null}
              </g>
            );
          })}
          <rect
            ref={ghost}
            visibility="hidden"
            fill="#ffc173"
            fillOpacity="0.12"
            stroke="#ffc173"
            strokeWidth="0.035"
            strokeDasharray="0.1 0.06"
            pointerEvents="none"
          />
        </svg>
      </div>
      <p className="rw-hint">
        {tool === 'place'
          ? 'Click to place at the ghost’s top-left corner.'
          : 'Drag to move. Select an item to resize or change its variant.'}{' '}
        Quarter-cell snapping · overlaps and out-of-bounds edits are refused ·
        ⌘/Ctrl-Z undo · Shift-⌘/Ctrl-Z redo · Delete removes · arrow keys nudge
        · R rotates 90° (Shift-R reverses).
      </p>
    </div>
  );
}
export default memo(Editor);
