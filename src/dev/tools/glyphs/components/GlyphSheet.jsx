import React from 'react';

import { CHARSET } from '@modules/glyphs';

import GlyphSvg from './GlyphSvg';

export default function GlyphSheet({ edited, font, onSelect, selectedKey }) {
  return (
    <div className="glyphs-sheet">
      {[...CHARSET].map((key) => (
        <button
          aria-pressed={key === selectedKey}
          className={[
            'glyphs-sheet__cell',
            key === selectedKey ? 'glyphs-sheet__cell--selected' : '',
            edited.has(key) ? 'glyphs-sheet__cell--edited' : '',
          ].join(' ')}
          key={key}
          onClick={() => onSelect(key)}
          title={`Edit ${key}`}
          type="button"
        >
          <GlyphSvg
            className="glyphs-sheet__glyph"
            font={font}
            glyphKey={key}
          />
          <span className="glyphs-sheet__label">{key}</span>
        </button>
      ))}
    </div>
  );
}
