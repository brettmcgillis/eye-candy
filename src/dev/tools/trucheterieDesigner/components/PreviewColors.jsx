import React, { memo } from 'react';
import { FiShuffle } from 'react-icons/fi';

import {
  LANE_MODES,
  PALETTE_NAMES,
  PALETTE_NONE,
} from '@modules/trucheterieBlobRender';

function PreviewColors({ value, onChange }) {
  const hasPalette =
    !value.blobMonochrome && value.blobPalette !== PALETTE_NONE;
  const update = (key, next) =>
    onChange((previous) => ({ ...previous, [key]: next }));

  return (
    <>
      <label className="rw-field rw-field--wide" htmlFor="tdz-palette">
        Palette
        <select
          id="tdz-palette"
          onChange={(event) => update('blobPalette', event.target.value)}
          value={value.blobPalette}
        >
          {PALETTE_NAMES.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
      {hasPalette ? (
        <>
          <label className="rw-field" htmlFor="tdz-lane-mode">
            Lane colors
            <select
              id="tdz-lane-mode"
              onChange={(event) => update('blobLaneMode', event.target.value)}
              value={value.blobLaneMode}
            >
              {LANE_MODES.map((mode) => (
                <option key={mode}>{mode}</option>
              ))}
            </select>
          </label>
          <label className="rw-field rw-field--checkbox" htmlFor="tdz-exact">
            <input
              id="tdz-exact"
              checked={value.blobPaletteExact}
              onChange={(event) =>
                update('blobPaletteExact', event.target.checked)
              }
              type="checkbox"
            />
            Palette exact colors
          </label>
          <label className="rw-field" htmlFor="tdz-shuffle">
            Palette shuffle seed
            <input
              id="tdz-shuffle"
              max={999999}
              min={0}
              onChange={(event) =>
                update('blobPaletteShuffle', Number(event.target.value))
              }
              step={1}
              type="number"
              value={value.blobPaletteShuffle}
            />
          </label>
          <div className="tdz-row">
            <button
              aria-label="Shuffle palette colors"
              className="dev-button"
              onClick={() =>
                update(
                  'blobPaletteShuffle',
                  Math.floor(Math.random() * 999999) + 1
                )
              }
              title="Shuffle palette colors"
              type="button"
            >
              <FiShuffle />
            </button>
          </div>
        </>
      ) : null}
      <label className="rw-field rw-field--checkbox" htmlFor="tdz-monochrome">
        <input
          id="tdz-monochrome"
          checked={value.blobMonochrome}
          onChange={(event) => update('blobMonochrome', event.target.checked)}
          type="checkbox"
        />
        Monochrome
      </label>
      {value.blobMonochrome ? (
        <label className="rw-field" htmlFor="tdz-mono-color">
          Monochrome color
          <input
            id="tdz-mono-color"
            onChange={(event) => update('blobMonoColor', event.target.value)}
            type="color"
            value={value.blobMonoColor}
          />
        </label>
      ) : null}
      {[
        ['strokeColor', 'Stroke color'],
        ['bgColor', 'Tile background'],
        ['sceneBgColor', 'Scene background'],
      ].map(([key, label]) => (
        <label key={key} className="rw-field" htmlFor={`tdz-${key}`}>
          {label}
          <input
            id={`tdz-${key}`}
            onChange={(event) => update(key, event.target.value)}
            type="color"
            value={value[key]}
          />
        </label>
      ))}
      <label className="rw-field rw-field--checkbox" htmlFor="tdz-strokes">
        <input
          id="tdz-strokes"
          checked={value.blobShowStrokes}
          onChange={(event) => update('blobShowStrokes', event.target.checked)}
          type="checkbox"
        />
        Strokes
      </label>
    </>
  );
}

export default memo(PreviewColors);
