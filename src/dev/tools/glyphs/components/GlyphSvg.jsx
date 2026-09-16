import React from 'react';

import { fontCellAspect, getTechnique } from '@modules/glyphs';

export const VIEW_HEIGHT = 100;

export function glyphViewBox(font) {
  return { height: VIEW_HEIGHT, width: fontCellAspect(font) * VIEW_HEIGHT };
}

// Glyph space (0..1, y up) -> SVG space for this font's cell and padding.
export function glyphToView(font, [x, y]) {
  const { height, width } = glyphViewBox(font);
  const scale = 1 - 2 * (font.params.padding ?? 0);
  return [
    ((x - 0.5) * scale + 0.5) * width,
    (1 - ((y - 0.5) * scale + 0.5)) * height,
  ];
}

function ScriptBits({ font, glyph }) {
  const { cellH, cellW, gapX, gapY } = font.params;
  const bits = getTechnique('script').glyphBits(glyph, font.params);
  const { height, width } = glyphViewBox(font);
  const px = width / (cellW + gapX);
  const py = height / (cellH + gapY);
  const rects = [];
  for (let row = 0; row < bits.length; row += 1) {
    for (let col = 0; col < bits[row].length; col += 1) {
      if (bits[row][col]) {
        rects.push(
          <rect
            fill={font.params.ink}
            height={py + 0.2}
            key={`${row}-${col}`}
            width={px + 0.2}
            x={col * px}
            y={height - (row + 1) * py}
          />
        );
      }
    }
  }
  return rects;
}

function StrokeLines({ font, glyph }) {
  const technique = getTechnique(font.technique);
  const { height } = glyphViewBox(font);
  const { params } = font;
  const width = Math.max(
    (params.thickness * 2 + params.softness * 0.6) * height,
    1.5
  );
  const lines = technique.glyphSegments(glyph, params).map((segment) => {
    const [x1, y1] = glyphToView(font, segment.a);
    const [x2, y2] = glyphToView(font, segment.b);
    return (
      <line
        key={`${segment.order}-${x1}-${y1}-${x2}-${y2}`}
        stroke={params.ink}
        strokeLinecap="round"
        strokeWidth={width}
        x1={x1}
        x2={x2}
        y1={y1}
        y2={y2}
      />
    );
  });

  if (font.technique !== 'sigil') return lines;

  const [, carveTop] = glyphToView(font, [0, 0.5]);
  const [, carveBottom] = glyphToView(font, [0, 0.4]);
  const [, baseY] = glyphToView(font, [0, 0.5]);
  return (
    <>
      {lines}
      {params.carve ? (
        <rect
          fill={params.paper}
          height={carveBottom - carveTop}
          width="100%"
          x={0}
          y={carveTop}
        />
      ) : null}
      {params.baseline ? (
        <line
          stroke={params.ink}
          strokeWidth={width}
          x1={0}
          x2="100%"
          y1={baseY}
          y2={baseY}
        />
      ) : null}
    </>
  );
}

export default function GlyphSvg({ children, className, font, glyphKey }) {
  const { height, width } = glyphViewBox(font);
  const glyph = font.glyphs[glyphKey];
  return (
    <svg
      className={className}
      preserveAspectRatio="xMidYMid meet"
      viewBox={`0 0 ${width} ${height}`}
    >
      <rect fill={font.params.paper} height={height} width={width} />
      {font.technique === 'script' ? (
        <ScriptBits font={font} glyph={glyph} />
      ) : (
        <StrokeLines font={font} glyph={glyph} />
      )}
      {children}
    </svg>
  );
}
