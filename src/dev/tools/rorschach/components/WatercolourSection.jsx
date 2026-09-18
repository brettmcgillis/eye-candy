import React from 'react';

import { NumberField, ToggleField } from '@dev/renderWorkbench/SchemaFields';

// Only rendered while `ink` is on. Kept as one file rather than split further
// because its five sub-groups (paper/depth/bloom/pattern/palette/cell) are
// one option, not five schema sections — the subheadings are the grouping.
export default function WatercolourSection({ kind, options, setOption }) {
  return (
    <details className="rw-control-section rw-advanced">
      <summary>Watercolour</summary>
      <div className="rw-field-grid">
        <label className="rw-field" htmlFor="rw-ink-orientation">
          Paper plane
          <select
            id="rw-ink-orientation"
            onChange={(event) =>
              setOption('inkOrientation', event.target.value)
            }
            value={options.inkOrientation}
          >
            <option value="vertical">Vertical (z)</option>
            <option value="horizontal">Horizontal (y)</option>
          </select>
        </label>
        <NumberField
          id="rw-ink-settle"
          option="inkSettle"
          label="Settle steps"
          onChange={(value) => setOption('inkSettle', value)}
          value={options.inkSettle}
        />
        <NumberField
          id="rw-ink-resolution"
          option="inkResolution"
          label="Sim resolution"
          onChange={(value) => setOption('inkResolution', value)}
          value={options.inkResolution}
        />
        <NumberField
          id="rw-ink-paper-size"
          option="inkPaperSize"
          label="Paper size"
          onChange={(value) => setOption('inkPaperSize', value)}
          value={options.inkPaperSize}
        />
        <NumberField
          id="rw-ink-offset"
          option="inkOffset"
          label="Paper offset"
          onChange={(value) => setOption('inkOffset', value)}
          value={options.inkOffset}
        />
        <NumberField
          id="rw-ink-grain"
          option="inkPaperGrain"
          label="Paper tooth"
          onChange={(value) => setOption('inkPaperGrain', value)}
          value={options.inkPaperGrain}
        />
        {kind === 'video' ? (
          <NumberField
            id="rw-ink-carry"
            option="inkCarry"
            label="Carry steps"
            onChange={(value) => setOption('inkCarry', value)}
            value={options.inkCarry}
          />
        ) : null}
      </div>
      {kind === 'video' && Number(options.inkCarry) > 0 ? (
        <p className="rw-hint">
          Carrying the wet sim between frames replaces a full settle with these
          few steps — several times faster on an ink clip, at the cost of a
          frame no longer being reproducible on its own.
        </p>
      ) : null}

      <h3 className="rw-subheading">Depth</h3>
      <div className="rw-field-grid">
        <NumberField
          id="rw-ink-tonal-gap"
          option="inkTonalGap"
          label="Tonal gap"
          onChange={(value) => setOption('inkTonalGap', value)}
          value={options.inkTonalGap}
        />
        <NumberField
          id="rw-ink-recede"
          option="inkRecede"
          label="Recede"
          onChange={(value) => setOption('inkRecede', value)}
          value={options.inkRecede}
        />
        <NumberField
          id="rw-ink-desaturate"
          option="inkDesaturate"
          label="Desaturate"
          onChange={(value) => setOption('inkDesaturate', value)}
          value={options.inkDesaturate}
        />
      </div>

      <h3 className="rw-subheading">Bloom</h3>
      <div className="rw-field-grid">
        <ToggleField
          id="rw-ink-bloom"
          option="inkBloom"
          label="Ink bloom"
          onChange={(value) => setOption('inkBloom', value)}
          value={options.inkBloom}
        />
        <ToggleField
          id="rw-ink-bloom-emissive"
          option="inkBloomEmissiveOnly"
          label="Emissive bundles only"
          onChange={(value) => setOption('inkBloomEmissiveOnly', value)}
          value={options.inkBloomEmissiveOnly}
        />
        <NumberField
          id="rw-ink-bloom-strength"
          option="inkBloomStrength"
          label="Strength"
          onChange={(value) => setOption('inkBloomStrength', value)}
          value={options.inkBloomStrength}
        />
        <label className="rw-field" htmlFor="rw-ink-bloom-source">
          Source
          <select
            id="rw-ink-bloom-source"
            onChange={(event) =>
              setOption('inkBloomSource', event.target.value)
            }
            value={options.inkBloomSource}
          >
            <option value="thickness">Thickness</option>
            <option value="wetness">Wetness</option>
          </select>
        </label>
      </div>

      <h3 className="rw-subheading">Pattern</h3>
      <div className="rw-field-grid">
        <NumberField
          id="rw-ink-pattern-wash"
          option="inkPatternWash"
          label="Wash"
          onChange={(value) => setOption('inkPatternWash', value)}
          value={options.inkPatternWash}
        />
        <NumberField
          id="rw-ink-pattern-flow"
          option="inkPatternFlow"
          label="Flow"
          onChange={(value) => setOption('inkPatternFlow', value)}
          value={options.inkPatternFlow}
        />
        <NumberField
          id="rw-ink-pattern-fade"
          option="inkPatternFade"
          label="Fade"
          onChange={(value) => setOption('inkPatternFade', value)}
          value={options.inkPatternFade}
        />
        <NumberField
          id="rw-ink-pattern-density"
          option="inkPatternDensity"
          label="Density"
          onChange={(value) => setOption('inkPatternDensity', value)}
          value={options.inkPatternDensity}
        />
        <NumberField
          id="rw-ink-pattern-sharpness"
          option="inkPatternSharpness"
          label="Sharpness"
          onChange={(value) => setOption('inkPatternSharpness', value)}
          value={options.inkPatternSharpness}
        />
        <NumberField
          id="rw-ink-pattern-softness"
          option="inkPatternSoftness"
          label="Softness"
          onChange={(value) => setOption('inkPatternSoftness', value)}
          value={options.inkPatternSoftness}
        />
        <NumberField
          id="rw-ink-pattern-scale"
          option="inkPatternScale"
          label="Scale"
          onChange={(value) => setOption('inkPatternScale', value)}
          value={options.inkPatternScale}
        />
        <NumberField
          id="rw-ink-pattern-details"
          option="inkPatternDetails"
          label="Details"
          onChange={(value) => setOption('inkPatternDetails', value)}
          value={options.inkPatternDetails}
        />
        <NumberField
          id="rw-ink-pattern-symmetry"
          option="inkPatternSymmetry"
          label="Symmetry"
          onChange={(value) => setOption('inkPatternSymmetry', value)}
          value={options.inkPatternSymmetry}
        />
        <NumberField
          id="rw-ink-pattern-speed"
          option="inkPatternSpeed"
          label="Speed"
          onChange={(value) => setOption('inkPatternSpeed', value)}
          value={options.inkPatternSpeed}
        />
        <NumberField
          id="rw-ink-pattern-time"
          option="inkPatternTime"
          label="Time"
          onChange={(value) => setOption('inkPatternTime', value)}
          value={options.inkPatternTime}
        />
      </div>

      <h3 className="rw-subheading">Palette</h3>
      <div className="rw-field-grid">
        <NumberField
          id="rw-ink-palette-mix"
          option="inkPaletteMix"
          label="Spread"
          onChange={(value) => setOption('inkPaletteMix', value)}
          value={options.inkPaletteMix}
        />
        <NumberField
          id="rw-ink-palette-scale"
          option="inkPaletteScale"
          label="Region size"
          onChange={(value) => setOption('inkPaletteScale', value)}
          value={options.inkPaletteScale}
        />
        <NumberField
          id="rw-ink-palette-symmetry"
          option="inkPaletteSymmetry"
          label="Symmetry"
          onChange={(value) => setOption('inkPaletteSymmetry', value)}
          value={options.inkPaletteSymmetry}
        />
      </div>

      <h3 className="rw-subheading">Cell pixelation</h3>
      <div className="rw-field-grid">
        <NumberField
          id="rw-ink-cell-amount"
          option="inkCellAmount"
          label="Pixelation"
          onChange={(value) => setOption('inkCellAmount', value)}
          value={options.inkCellAmount}
        />
        <NumberField
          id="rw-ink-cell-reveal"
          option="inkCellReveal"
          label="Reveal"
          onChange={(value) => setOption('inkCellReveal', value)}
          value={options.inkCellReveal}
        />
        <NumberField
          id="rw-ink-cell-flatten"
          option="inkCellFlatten"
          label="Flatten"
          onChange={(value) => setOption('inkCellFlatten', value)}
          value={options.inkCellFlatten}
        />
        <NumberField
          id="rw-ink-cell-scale"
          option="inkCellScale"
          label="Cell size"
          onChange={(value) => setOption('inkCellScale', value)}
          value={options.inkCellScale}
        />
        <NumberField
          id="rw-ink-cell-reveal-scale"
          option="inkCellRevealScale"
          label="Reveal scale"
          onChange={(value) => setOption('inkCellRevealScale', value)}
          value={options.inkCellRevealScale}
        />
        <NumberField
          id="rw-ink-cell-symmetry"
          option="inkCellSymmetry"
          label="Cell symmetry"
          onChange={(value) => setOption('inkCellSymmetry', value)}
          value={options.inkCellSymmetry}
        />
      </div>
    </details>
  );
}
