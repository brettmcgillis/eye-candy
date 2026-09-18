import React from 'react';

import {
  ChoiceField,
  ColorField,
  NumberField,
  ToggleField,
} from '@dev/renderWorkbench/SchemaFields';

import { PALETTE_NAMES } from '@modules/rorschach';

import BundleField from './BundleField';

const PALETTE_CHOICES = PALETTE_NAMES.map((name) => [name, name]);

// Everything the dice can roll: structure, palette, and the Bundle Editor's
// saved overrides. Enabling a field here pins it, same rule as a typed flag.
export default function TestSection({ bundlesPinned, options, setOption }) {
  return (
    <details className="rw-control-section rw-advanced">
      <summary>Test</summary>
      <p className="rw-hint">
        Every field here is something the dice set. Enable one to take it over —
        it becomes a pin, and the rest keep rolling. Leave them all off for a
        batch of pure rolls.
      </p>

      <h3 className="rw-subheading">Structure</h3>
      <div className="rw-field-grid">
        <NumberField
          id="rw-bundle-count"
          option="bundleCount"
          label="Bundles"
          onChange={(value) => setOption('bundleCount', value)}
          value={options.bundleCount}
        />
        <NumberField
          id="rw-strands"
          option="strandsPerBundle"
          label="Strands / bundle"
          onChange={(value) => setOption('strandsPerBundle', value)}
          value={options.strandsPerBundle}
        />
        <NumberField
          id="rw-steps"
          option="steps"
          label="Curl length"
          onChange={(value) => setOption('steps', value)}
          value={options.steps}
        />
        <NumberField
          id="rw-start-spread"
          option="startSpread"
          label="Strand spread"
          onChange={(value) => setOption('startSpread', value)}
          value={options.startSpread}
        />
        <ChoiceField
          choices={[
            ['scatter', 'Scatter'],
            ['line', 'Line (loftable)'],
          ]}
          id="rw-strand-seeding"
          option="strandSeeding"
          label="Strand seeding"
          onChange={(value) => setOption('strandSeeding', value)}
          value={options.strandSeeding}
        />
        <NumberField
          id="rw-membrane-span"
          option="membraneSpan"
          label="Membrane span"
          onChange={(value) => setOption('membraneSpan', value)}
          value={options.membraneSpan}
        />
        <NumberField
          id="rw-coeff-range"
          option="coeffRange"
          label="Chaos"
          onChange={(value) => setOption('coeffRange', value)}
          value={options.coeffRange}
        />
        <NumberField
          id="rw-freq"
          option="freq"
          label="Curl frequency"
          onChange={(value) => setOption('freq', value)}
          value={options.freq}
        />
        <ChoiceField
          choices={[
            ['cube', 'Cube'],
            ['sphere', 'Sphere'],
            ['none', 'None'],
          ]}
          id="rw-framing-shape"
          option="framingShape"
          label="Framing"
          onChange={(value) => setOption('framingShape', value)}
          value={options.framingShape}
        />
        <NumberField
          id="rw-bound-radius"
          option="boundRadius"
          label="Bound radius"
          onChange={(value) => setOption('boundRadius', value)}
          value={options.boundRadius}
        />
        <NumberField
          id="rw-bound-width"
          option="boundWidth"
          label="Bound width"
          onChange={(value) => setOption('boundWidth', value)}
          value={options.boundWidth}
        />
        <NumberField
          id="rw-bound-height"
          option="boundHeight"
          label="Bound height"
          onChange={(value) => setOption('boundHeight', value)}
          value={options.boundHeight}
        />
        <NumberField
          id="rw-min-spread"
          option="minSpread"
          label="Min spread"
          onChange={(value) => setOption('minSpread', value)}
          value={options.minSpread}
        />
      </div>

      <h3 className="rw-subheading">Palette</h3>
      <div className="rw-field-grid">
        <ChoiceField
          choices={PALETTE_CHOICES}
          id="rw-palette"
          option="palette"
          label="Palette"
          onChange={(value) => setOption('palette', value)}
          value={options.palette}
        />
        <ToggleField
          id="rw-palette-exact"
          option="paletteExact"
          label="Exact stops"
          onChange={(value) => setOption('paletteExact', value)}
          value={options.paletteExact}
        />
        <ToggleField
          id="rw-monochrome"
          option="monochrome"
          label="Monochrome"
          onChange={(value) => setOption('monochrome', value)}
          value={options.monochrome}
        />
        <ColorField
          id="rw-line-color"
          option="inkColor"
          label="Line colour"
          onChange={(value) => setOption('inkColor', value)}
          value={options.inkColor}
        />
        <ColorField
          id="rw-background-color"
          option="backgroundColor"
          label="Background"
          onChange={(value) => setOption('backgroundColor', value)}
          value={options.backgroundColor}
        />
        <NumberField
          id="rw-palette-shuffle"
          option="paletteShuffleSeed"
          label="Stop order"
          onChange={(value) => setOption('paletteShuffleSeed', value)}
          value={options.paletteShuffleSeed}
        />
      </div>

      <h3 className="rw-subheading">Bundle overrides</h3>
      <p className="rw-hint">
        The Bundle Editor&apos;s folders, as they were saved. They are tuned in
        the scene and loaded here — pinned, this whole block is held and every
        bundle not in it is off.
      </p>
      <BundleField
        enabled={bundlesPinned}
        onChange={(value) => setOption('bundles', value)}
        value={options.bundles}
      />
    </details>
  );
}
