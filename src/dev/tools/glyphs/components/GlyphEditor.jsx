import React, { useMemo, useState } from 'react';

import {
  SIGIL_EDGES,
  SIGIL_SOURCE_GLYPH,
  findBands,
  inkAt,
  latticePoint,
  sigilToGlyph,
  strokeId,
  toggleScriptPixel,
} from '@modules/glyphs';

import GlyphSvg, { glyphToView, glyphViewBox } from './GlyphSvg';

const HIT_WIDTH = 7;

function HitLine({ font, from, onClick, title, to }) {
  const [x1, y1] = glyphToView(font, from);
  const [x2, y2] = glyphToView(font, to);
  return (
    <line
      className="glyphs-editor__hit"
      onClick={onClick}
      strokeWidth={HIT_WIDTH}
      x1={x1}
      x2={x2}
      y1={y1}
      y2={y2}
    >
      <title>{title}</title>
    </line>
  );
}

function RunesEditor({ font, glyphKey, onChange }) {
  const [pending, setPending] = useState(null);
  const { latticeX, latticeY } = font.params;
  const strokes = font.glyphs[glyphKey]?.strokes ?? [];
  const point = (i, j) => latticePoint(i, j, font.params);

  const toggle = (stroke) => {
    const id = strokeId(stroke);
    const exists = strokes.some((s) => strokeId(s) === id);
    onChange({
      strokes: exists
        ? strokes.filter((s) => strokeId(s) !== id)
        : [...strokes, stroke],
    });
  };

  const onPoint = (i, j) => {
    if (!pending) {
      setPending([i, j]);
      return;
    }
    toggle([pending[0], pending[1], i, j]);
    setPending(null);
  };

  const points = [];
  for (let i = 0; i < latticeX; i += 1) {
    for (let j = 0; j < latticeY; j += 1) {
      const [cx, cy] = glyphToView(font, point(i, j));
      const active = pending?.[0] === i && pending?.[1] === j;
      points.push(
        <circle
          className={`glyphs-editor__point${active ? ' glyphs-editor__point--active' : ''}`}
          cx={cx}
          cy={cy}
          key={`${i}-${j}`}
          onClick={() => onPoint(i, j)}
          r={active ? 4.5 : 3.5}
        >
          <title>{`Lattice point ${i}, ${j}`}</title>
        </circle>
      );
    }
  }

  return (
    <>
      <GlyphSvg
        className="glyphs-editor__canvas"
        font={font}
        glyphKey={glyphKey}
      >
        {strokes.map((stroke) => (
          <HitLine
            font={font}
            from={point(stroke[0], stroke[1])}
            key={strokeId(stroke)}
            onClick={() => toggle(stroke)}
            title="Remove stroke"
            to={point(stroke[2], stroke[3])}
          />
        ))}
        {points}
      </GlyphSvg>
      <p className="dev-muted">
        Click two lattice points to add or remove the stroke between them (the
        same point twice makes a dot). Click a stroke to remove it.{' '}
        {strokes.length} strokes.
      </p>
      {pending ? (
        <button
          className="dev-button"
          onClick={() => setPending(null)}
          type="button"
        >
          Cancel stroke
        </button>
      ) : null}
    </>
  );
}

const sigilPoint = (x, y) => sigilToGlyph([x, y]);

function SigilEditor({ font, glyphKey, onChange }) {
  const edges = new Set(font.glyphs[glyphKey]?.edges ?? []);
  const toggle = (index) => {
    const next = new Set(edges);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    onChange({ edges: [...next].sort((a, b) => a - b) });
  };

  return (
    <>
      <GlyphSvg
        className="glyphs-editor__canvas"
        font={font}
        glyphKey={glyphKey}
      >
        {SIGIL_EDGES.map(({ label, points }) => {
          const [x1, y1] = glyphToView(font, sigilPoint(points[0], points[1]));
          const [x2, y2] = glyphToView(font, sigilPoint(points[2], points[3]));
          return (
            <line
              className="glyphs-editor__guide"
              key={label}
              x1={x1}
              x2={x2}
              y1={y1}
              y2={y2}
            />
          );
        })}
        {SIGIL_EDGES.map(({ hit, label, points }, index) => {
          const [x1, y1, x2, y2] = hit ?? points;
          return (
            <HitLine
              font={font}
              from={sigilPoint(x1, y1)}
              key={label}
              onClick={() => toggle(index)}
              title={`${edges.has(index) ? 'Remove' : 'Add'} edge ${label}`}
              to={sigilPoint(x2, y2)}
            />
          );
        })}
      </GlyphSvg>
      <p className="dev-muted">
        Click an edge (dashed guides) to toggle it. An edge&apos;s position in
        the figure sets its reveal timing. {edges.size}/{SIGIL_EDGES.length}{' '}
        edges.
      </p>
      <button
        className="dev-button"
        onClick={() => onChange({ edges: [...SIGIL_SOURCE_GLYPH.edges] })}
        type="button"
      >
        Use source figure
      </button>
    </>
  );
}

const STRIP_COLUMNS = 72;
const STRIP_CELL = 8;

function ScriptEditor({ font, glyphKey, onChange }) {
  const { cellH, cellW, gapX, gapY } = font.params;
  const origin = font.glyphs[glyphKey] ?? { x: 0, y: font.params.bandY };
  const bands = useMemo(() => findBands(font.params), [font.params]);
  const bandIndex = bands.findIndex(
    (band) => origin.y >= band.y && origin.y < band.y + band.height
  );
  const stripStart = Math.max(
    0,
    origin.x - Math.floor((STRIP_COLUMNS - cellW) / 2)
  );
  const move = (dx, dy = 0) =>
    onChange({
      ...origin,
      x: Math.max(0, origin.x + dx),
      y: Math.max(0, origin.y + dy),
    });
  const flips = new Set((origin.flips ?? []).map(([r, c]) => `${r},${c}`));
  const toBand = (step) => {
    const band = bands[bandIndex + step];
    if (band) onChange({ ...origin, y: band.y });
  };

  const { height, width } = glyphViewBox(font);
  const px = width / (cellW + gapX);
  const py = height / (cellH + gapY);
  const grid = [];
  for (let row = 0; row < cellH; row += 1) {
    for (let col = 0; col < cellW; col += 1) {
      const edited = flips.has(`${row},${col}`);
      grid.push(
        <rect
          className={`glyphs-editor__pixel${edited ? ' glyphs-editor__pixel--edited' : ''}`}
          height={py}
          key={`${row}-${col}`}
          onClick={() => onChange(toggleScriptPixel(origin, row, col))}
          width={px}
          x={col * px}
          y={height - (row + 1) * py}
        >
          <title>{edited ? 'Revert to pattern' : 'Toggle pixel'}</title>
        </rect>
      );
    }
  }

  const strip = [];
  for (let row = 0; row < cellH; row += 1) {
    for (let col = 0; col < STRIP_COLUMNS; col += 1) {
      if (inkAt(stripStart + col, origin.y + row, font.params)) {
        strip.push(
          <rect
            fill={font.params.ink}
            height={STRIP_CELL}
            key={`${row}-${col}`}
            width={STRIP_CELL}
            x={col * STRIP_CELL}
            y={(cellH - 1 - row) * STRIP_CELL}
          />
        );
      }
    }
  }

  const buttons = [
    [`⟪ ${cellW}`, () => move(-cellW)],
    ['← 1', () => move(-1)],
    ['1 →', () => move(1)],
    [`${cellW} ⟫`, () => move(cellW)],
    ['y − 1', () => move(0, -1)],
    ['y + 1', () => move(0, 1)],
  ];

  return (
    <>
      <GlyphSvg
        className="glyphs-editor__canvas"
        font={font}
        glyphKey={glyphKey}
      >
        {grid}
      </GlyphSvg>
      <p className="dev-muted">
        Click pixels to toggle them ({flips.size} edited, outlined). The glyph
        is a {cellW}×{cellH} window cut from the script at x={origin.x}, y=
        {origin.y}; click the strip below to move the window there — your pixel
        edits move with it.
      </p>
      <svg
        className="glyphs-strip"
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const col = Math.floor(
            ((event.clientX - box.left) / box.width) * STRIP_COLUMNS
          );
          onChange({
            ...origin,
            x: Math.max(0, stripStart + col - Math.floor(cellW / 2)),
          });
        }}
        preserveAspectRatio="none"
        viewBox={`0 0 ${STRIP_COLUMNS * STRIP_CELL} ${cellH * STRIP_CELL}`}
      >
        <rect fill={font.params.paper} height="100%" width="100%" />
        {strip}
        <rect
          className="glyphs-strip__window"
          height={cellH * STRIP_CELL}
          width={cellW * STRIP_CELL}
          x={(origin.x - stripStart) * STRIP_CELL}
          y={0}
        />
      </svg>
      <div className="glyphs-editor__nudge">
        {buttons.map(([label, onClick]) => (
          <button
            className="dev-button"
            key={label}
            onClick={onClick}
            type="button"
          >
            {label}
          </button>
        ))}
        <button
          className="dev-button"
          disabled={!flips.size}
          onClick={() => onChange({ ...origin, flips: [] })}
          type="button"
        >
          Clear pixel edits
        </button>
        <button
          className="dev-button"
          disabled={bandIndex <= 0}
          onClick={() => toBand(-1)}
          type="button"
        >
          Band ↓
        </button>
        <button
          className="dev-button"
          disabled={bandIndex < 0 || bandIndex >= bands.length - 1}
          onClick={() => toBand(1)}
          type="button"
        >
          Band ↑
        </button>
      </div>
    </>
  );
}

const EDITORS = {
  runes: RunesEditor,
  script: ScriptEditor,
  sigil: SigilEditor,
};

export default function GlyphEditor({ font, glyphKey, onChange, onReroll }) {
  const Editor = EDITORS[font.technique];

  return (
    <div className="glyphs-editor">
      <div className="glyphs-editor__header">
        <span className="glyphs-editor__char">{glyphKey}</span>
        <button className="dev-button" onClick={onReroll} type="button">
          Reroll
        </button>
        {font.technique === 'script' ? null : (
          <button
            className="dev-button"
            onClick={() =>
              onChange(
                font.technique === 'runes' ? { strokes: [] } : { edges: [] }
              )
            }
            type="button"
          >
            Clear
          </button>
        )}
      </div>
      <Editor
        font={font}
        glyphKey={glyphKey}
        key={`${font.technique}-${glyphKey}`}
        onChange={onChange}
      />
    </div>
  );
}
