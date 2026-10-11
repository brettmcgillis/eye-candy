import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';
import SourceImageField from '@dev/renderWorkbench/SourceImageField';

import * as kernel from '@modules/subdivisionRelief';
import { PALETTE_NAMES } from '@modules/subdivisionReliefRender';

const PALETTE_CHOICES = [kernel.PALETTE_NONE, ...PALETTE_NAMES].map((name) => [
  name,
  name,
]);

function SourceField(props) {
  return (
    <SourceImageField api="/dev-api/subdivisionRelief/sources" {...props} />
  );
}

const sections = {
  choices: { palette: PALETTE_CHOICES },
  fields: { sourceImage: SourceField },
};

const preview = {
  placeholder: (metadata) => `Seed ${metadata.preset.seed}`,
  scene: 'subdivisionRelief',
  stats: (config, metadata) => (
    <>
      <Stat label="Seed" value={config.seed} />
      <Stat
        label="Structure"
        value={`${config.lattice} · ${config.driver} · ${config.levels} levels`}
      />
      <Stat label="Field" value={config.field} />
      <Stat label="Colour" value={`${config.palette} by ${config.colorMode}`} />
      <Stat
        label="Relief"
        value={`${config.reliefHeight} high · depth ${config.depthWeight} · field ${config.fieldWeight} · luma ${config.lumaWeight}`}
      />
      {metadata.stats?.leaves ? (
        <Stat label="Cells" value={metadata.stats.leaves} />
      ) : null}
    </>
  ),
};

const baseLabel = (config) => config.seed;

export default function SubdivisionReliefWorkbenchPage() {
  return (
    <RollWorkbench
      baseLabel={baseLabel}
      name="SubdivisionRelief"
      noun={{ many: 'pieces', one: 'piece' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="SubdivisionReliefCLI"
      tool="subdivisionRelief"
    />
  );
}
