import React, { useMemo, useState } from 'react';

import { findBands, resolveScriptParams } from '@modules/glyphs';

import { GENERATOR_FIELDS, RENDER_FIELDS } from '../utils/paramFields';
import ParamField from './ParamField';

const PATTERN_KEYS = new Set(['s4', 'script', 'cursive']);

// Look parameters apply live. Generator parameters decide what the glyphs
// are, so they're staged and only take effect on an explicit regenerate —
// otherwise nudging a slider would silently wipe hand-edited glyphs.
export default function ParamsPanel({ font, onParam, onRegenerate }) {
  const [draft, setDraft] = useState({});
  const generatorFields = GENERATOR_FIELDS[font.technique];
  const values = { ...font.params, ...draft };
  const pending = Object.keys(draft).some(
    (key) => JSON.stringify(draft[key]) !== JSON.stringify(font.params[key])
  );

  const patternKey = JSON.stringify({
    cursive: values.cursive,
    s4: values.s4,
    script: values.script,
  });
  const bands = useMemo(
    () =>
      font.technique === 'script' ? findBands(JSON.parse(patternKey)) : [],
    [font.technique, patternKey]
  );

  const setDraftValue = (key, value, extra = {}) => {
    const next = { ...draft, ...extra, [key]: value };
    if (font.technique === 'script' && PATTERN_KEYS.has(key)) {
      const { params } = resolveScriptParams({
        ...font.params,
        ...next,
        bandY: -1,
      });
      next.bandY = params.bandY;
      next.cellH = params.cellH;
    }
    setDraft(next);
  };

  return (
    <div className="glyphs-params">
      <h2 className="dev-section-title dev-section-title--first">Look</h2>
      {RENDER_FIELDS[font.technique].map((field) => (
        <ParamField
          field={field}
          key={field.key}
          onChange={(value) => onParam(field.key, value)}
          value={font.params[field.key]}
        />
      ))}

      <h2 className="dev-section-title">Generator</h2>
      <p className="dev-muted">
        These decide the glyph shapes. Changes apply when you regenerate, which
        replaces every glyph including hand edits.
      </p>
      {generatorFields.map((field) => (
        <ParamField
          bands={bands}
          field={field}
          key={field.key}
          onChange={(value, extra) => setDraftValue(field.key, value, extra)}
          value={values[field.key]}
        />
      ))}
      <div className="glyphs-params__actions">
        <button
          className="dev-button dev-button--primary"
          onClick={() => {
            onRegenerate(draft);
            setDraft({});
          }}
          type="button"
        >
          Regenerate all glyphs
        </button>
        <button
          className="dev-button"
          disabled={!pending}
          onClick={() => setDraft({})}
          type="button"
        >
          Discard changes
        </button>
      </div>
      {pending ? (
        <p className="glyphs-params__pending">
          Generator changes not applied yet.
        </p>
      ) : null}
    </div>
  );
}
