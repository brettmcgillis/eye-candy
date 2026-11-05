import React, { memo } from 'react';

const COLOURS = {
  plateColor: 'Plate',
  zoneColor: 'Zone',
  chassisColor: 'Chassis',
  knobColor: 'Knobs',
  capColorA: 'Cap A',
  capColorB: 'Cap B',
  capColorC: 'Cap C',
  legendColor: 'Legends',
  screenColor: 'Phosphor',
  ledColorA: 'LED A',
  ledColorB: 'LED B',
  ledColorC: 'LED C',
};

function Appearance({ config, setConfig, reset }) {
  return (
    <details className="cpd-section">
      <summary>Panel appearance</summary>
      <div className="cpd-fields">
        {Object.entries(COLOURS).map(([key, label]) => (
          <label className="rw-field" key={key} htmlFor={`cpd-${key}`}>
            {label}
            <input
              id={`cpd-${key}`}
              type="color"
              value={config[key]}
              onChange={(event) =>
                setConfig((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
            />
          </label>
        ))}
      </div>
      <label className="cpd-check" htmlFor="cpd-enclosure">
        <input
          id="cpd-enclosure"
          type="checkbox"
          checked={config.enclosure}
          onChange={(event) =>
            setConfig((current) => ({
              ...current,
              enclosure: event.target.checked,
            }))
          }
        />{' '}
        Enclosure
      </label>
      <button className="dev-button" type="button" onClick={reset}>
        Use render look instead
      </button>
    </details>
  );
}
export default memo(Appearance);
