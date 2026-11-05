import React, { memo, useState } from 'react';
import { Link } from 'react-router-dom';

import useSavedDesigns from '@dev/controlPanelDesigns/useSavedDesigns';
import { Stat } from '@dev/renderWorkbench/AssetGallery';
import { liveTabs } from '@dev/renderWorkbench/LiveStage';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/controlPanel';

import controlPanelLive from './live';

const preview = {
  placeholder: (metadata) => metadata.name ?? metadata.preset.domain,
  scene: 'controlPanel',
  stats: (config) => (
    <>
      <Stat label="Layout" value={config.layoutMode} />
      <Stat label="Domain" value={config.domain} />
      <Stat label="Grid" value={`${config.panelCols} × ${config.panelRows}`} />
      <Stat label="Seed" value={config.seed} />
      <Stat label="Enclosure" value={config.enclosure ? 'yes' : 'no'} />
    </>
  ),
};

const ResetPatch = memo(function ResetPatch({ setOption }) {
  return (
    <button
      className="dev-button"
      type="button"
      onClick={() => setOption('patchState', '')}
    >
      Reset to generated cables
    </button>
  );
});

const PatchActions = memo(function PatchActions({ options, setOption }) {
  const value = options.panelDesign;
  const key = value?.startsWith('cp1.') ? 'code' : 'design';
  const suffix = value ? `?${key}=${encodeURIComponent(value)}` : '';
  return (
    <>
      <Link className="dev-button" to={`/dev/control-panel-designer${suffix}`}>
        Open ControlPanelDesigner
      </Link>
      {value ? (
        <button
          className="dev-button"
          type="button"
          onClick={() => setOption('panelDesign', '')}
        >
          Use generated layout
        </button>
      ) : null}
      {options.patchState ? <ResetPatch setOption={setOption} /> : null}
    </>
  );
});

function ControlPanelWorkbenchPage() {
  const { designs } = useSavedDesigns();
  const [initialOptions] = useState(() => {
    const query = new URLSearchParams(window.location.search);
    const design = query.get('code') || query.get('design');
    return design ? { panelDesign: design } : {};
  });
  return (
    <RollWorkbench
      afterFields={PatchActions}
      initialOptions={initialOptions}
      sections={{
        handled: ['patchState'],
        choices: {
          panelDesign: [
            ['', 'None — generated'],
            ...designs.map(({ name }) => [name, name]),
          ],
        },
      }}
      defaultTab="live"
      leadingTabs={liveTabs(controlPanelLive, 'controlPanel')}
      name="ControlPanel"
      noun={{ many: 'panels', one: 'panel' }}
      preview={preview}
      schema={kernel}
      title="ControlPanelCLI"
      tool="controlPanel"
    />
  );
}

export default memo(ControlPanelWorkbenchPage);
