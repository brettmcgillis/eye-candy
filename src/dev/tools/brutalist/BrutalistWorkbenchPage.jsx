import React from 'react';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';
import { Segmented } from '@dev/renderWorkbench/SchemaFields';

import * as kernel from '@modules/brutalist';

const STAGE_OPTIONS = kernel.RENDER_OPTIONS.stage.choices.map((stage) => ({
  label: stage,
  value: stage,
}));

const sections = { handled: ['stage'] };

const preview = {
  placeholder: (metadata) => metadata.name ?? metadata.preset.family,
  scene: (saved) =>
    saved.scene === 'BrutalistMaquette' ? 'brutalistMaquette' : 'brutalist',
  stats: (config, metadata) => (
    <>
      <Stat label="Family" value={config.family} />
      <Stat label="Seed" value={config.formSeed} />
      <Stat label="Height" value={`${config.structureHeight}m`} />
      <Stat label="Biome" value={config.biome} />
      <Stat label="Look" value={config.look} />
      <Stat label="Stage" value={metadata.render?.stage} />
    </>
  ),
};

const jobTitle = (job) =>
  job.kind === 'video'
    ? `Brutalist ${job.options?.stage ?? ''} ${job.options?.mode ?? ''} video`
    : `Brutalist ${job.options?.stage ?? ''} stills`;

function StagePicker({ options, setOption }) {
  return (
    <Segmented
      label="Stage"
      onChange={(value) => setOption('stage', value)}
      options={STAGE_OPTIONS}
      value={options.stage}
    />
  );
}

export default function BrutalistWorkbenchPage() {
  return (
    <RollWorkbench
      controls={StagePicker}
      hint="hold form to see one structure in other weather, sites and moods."
      jobTitle={jobTitle}
      name="Brutalist"
      noun={{ many: 'structures', one: 'structure' }}
      preview={preview}
      schema={kernel}
      sections={sections}
      title="BrutalistCLI"
      tool="brutalist"
    />
  );
}
