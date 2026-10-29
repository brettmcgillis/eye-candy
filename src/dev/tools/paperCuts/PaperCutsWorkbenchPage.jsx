import React, { memo, useState } from 'react';
import { Link } from 'react-router-dom';

import useSavedDesigns from '@dev/paperCutsDesigns/useSavedDesigns';
import { Stat } from '@dev/renderWorkbench/AssetGallery';
import { liveTabs } from '@dev/renderWorkbench/LiveStage';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/paperCuts';
import { PALETTE_NAMES } from '@utils/paletteRegistry';

import live from './live';

const DesignerLink = memo(function DesignerLink({ options }) {
  const value = options.paperDesign;
  const key = value?.startsWith('pc1.') ? 'code' : 'design';
  const suffix = value ? `?${key}=${encodeURIComponent(value)}` : '';
  return (
    <Link className="dev-button" to={`/dev/paper-cuts-designer${suffix}`}>
      Open PaperCutsDesigner
    </Link>
  );
});
const preview = {
  scene: 'paperCuts',
  placeholder: (metadata) => metadata.name ?? 'Paper Cuts',
  stats: (config) => (
    <>
      <Stat
        label="Composition"
        value={config.paperDesign ? 'Hand made' : config.generationFamily}
      />
      <Stat label="Palette" value={config.paletteName} />
      <Stat label="Seed" value={config.generationSeed} />
      <Stat label="Symmetry" value={config.symmetry} />
    </>
  ),
};
function PaperCutsWorkbenchPage() {
  const { designs } = useSavedDesigns();
  const [initialOptions] = useState(() => {
    const name = new URLSearchParams(window.location.search).get('design');
    return name ? { paperDesign: name } : {};
  });
  return (
    <RollWorkbench
      name="PaperCuts"
      title="PaperCutsCLI"
      tool="paperCuts"
      noun={{ one: 'composition', many: 'compositions' }}
      preview={preview}
      controls={DesignerLink}
      schema={kernel}
      initialOptions={initialOptions}
      hint="Create or edit layouts in PaperCutsDesigner (/dev/paper-cuts-designer)."
      sections={{
        followWhen: true,
        choices: {
          paperDesign: [
            ['', 'None — generated'],
            ...designs.map(({ name }) => [name, name]),
          ],
          paletteName: ['None', ...PALETTE_NAMES].map((name) => [name, name]),
        },
      }}
      defaultTab="live"
      leadingTabs={liveTabs(live, 'paperCuts')}
    />
  );
}
export default memo(PaperCutsWorkbenchPage);
