import React from 'react';

import { Pinnable } from '@dev/renderWorkbench/SchemaFields';

function overriddenBundles(bundles) {
  if (!bundles) return [];
  return Object.keys(bundles)
    .map((key) => key.match(/^bundle(\d+)Override$/u))
    .filter((match) => match && bundles[match[0]])
    .map((match) => Number(match[1]))
    .sort((a, b) => a - b);
}

// The one option that is an object rather than a value, so it gets a summary
// and a discard rather than an input. Twenty folders of sixteen fields is a
// Leva panel, and the scene already has one — this is where its output lands,
// not a second copy of it.
function BundleField({ enabled, onChange, value }) {
  const overridden = overriddenBundles(value);

  return (
    <Pinnable label="Bundle overrides" option="bundles">
      <div className={`rw-bundles${enabled ? '' : ' rw-bundles--off'}`}>
        {value ? (
          <>
            <ul className="rw-bundles__list">
              {overridden.length > 0 ? (
                overridden.map((index) => (
                  <li key={index}>
                    <span
                      className="rw-bundles__swatch"
                      style={{
                        background: value[`bundle${index}ColorOverride`]
                          ? value[`bundle${index}Color`]
                          : 'transparent',
                      }}
                    />
                    Bundle {index}
                    {value[`bundle${index}Emissive`] ? ' · emissive' : ''}
                    {value[`bundle${index}StructuralOverride`]
                      ? ' · structural'
                      : ''}
                    {value[`bundle${index}Visible`] === false
                      ? ' · hidden'
                      : ''}
                  </li>
                ))
              ) : (
                <li>No bundle in this preset is overridden.</li>
              )}
            </ul>
            <button
              className="dev-button"
              onClick={() => onChange(null)}
              type="button"
            >
              Discard
            </button>
          </>
        ) : (
          <p className="rw-hint">Load a preset to bring its overrides in.</p>
        )}
      </div>
    </Pinnable>
  );
}

export default BundleField;
export { overriddenBundles };
