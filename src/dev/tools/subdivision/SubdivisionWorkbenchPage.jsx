import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';
import SourceImageField from '@dev/renderWorkbench/SourceImageField';

import * as kernel from '@modules/subdivision';
import { PALETTE_NAMES } from '@utils/gradientPalette';

import './SubdivisionWorkbenchPage.css';

const PALETTE_CHOICES = [kernel.PALETTE_NONE, ...PALETTE_NAMES].map((name) => [
  name,
  name,
]);

function SourceField(props) {
  return <SourceImageField api="/dev-api/subdivision/sources" {...props} />;
}

const sections = {
  choices: { palette: PALETTE_CHOICES },
  fields: { sourceImage: SourceField },
};

function Swatches({ palette = [] }) {
  return (
    <div className="sd-swatches">
      {palette.map((color, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <span key={index} style={{ background: color }} title={color} />
      ))}
    </div>
  );
}

const preview = {
  after: (config, metadata) => <Swatches palette={metadata.stats?.palette} />,
  placeholder: (metadata) => `Seed ${metadata.preset.seed}`,
  scene: 'subdivision',
  stats: (config, metadata) => (
    <>
      <Stat label="Seed" value={config.seed} />
      <Stat
        label="Structure"
        value={`${config.lattice} · ${config.driver} · ${config.levels} levels`}
      />
      <Stat label="Field" value={config.field} />
      <Stat label="Colour" value={`${config.palette} by ${config.colorMode}`} />
      {metadata.stats?.leaves ? (
        <Stat label="Cells" value={metadata.stats.leaves} />
      ) : null}
    </>
  ),
};

const baseLabel = (config) => config.seed;

export default function SubdivisionWorkbenchPage() {
  return (
    <RollWorkbench
      baseLabel={baseLabel}
      name="Subdivision"
      noun={{ many: 'pieces', one: 'piece' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="SubdivisionCLI"
      tool="subdivision"
    />
  );
}
