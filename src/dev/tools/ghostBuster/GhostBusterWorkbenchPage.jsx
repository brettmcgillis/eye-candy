import React from 'react';
import { FiPlay } from 'react-icons/fi';

import { Stat } from '@dev/renderWorkbench/AssetGallery';
import RollWorkbench from '@dev/renderWorkbench/RollWorkbench';

import * as kernel from '@modules/ghostBuster';
import { SKIN_NAMES, resolveSkin } from '@modules/ghostBusterRender';
import { GHOST_TEXTURE_OPTIONS } from '@presets/ghost/ghostSkins';

import './GhostBusterWorkbenchPage.css';
import LiveGhost from './LiveGhost';

const textureChoices = Object.entries(GHOST_TEXTURE_OPTIONS).map(
  ([label, value]) => [value || 'none', label]
);
const sections = {
  choices: { outerTextureUrl: textureChoices, innerTextureUrl: textureChoices },
  handled: ['skin', 'ghostMode'],
  open: ['material', 'shape', 'face'],
};

const skinLibrary = Object.fromEntries(
  SKIN_NAMES.map((name) => [name, resolveSkin(name)])
);

function skinOptions(source) {
  const skin = resolveSkin(source);
  return Object.fromEntries(
    kernel.LOOK_KEYS.map((key) => [
      key,
      key.endsWith('TextureUrl') ? skin[key] || 'none' : skin[key],
    ])
  );
}

const workbenchSchema = {
  ...kernel,
  configFrom(source) {
    const config = kernel.configFrom(source);
    return { ...config, ...skinOptions(config), ghostMode: 'variations' };
  },
};

function GhostControls({ kind, options, pins, setOption, setOptions }) {
  const loadSkin = (name) => {
    setOptions((current) => ({ ...current, skin: name, ...skinOptions(name) }));
  };
  const rollGhost = () => {
    const config = kernel.rollGhostConfig(kernel.randomSeed(), {
      base: kernel.configFrom(options),
      keep: pins.heldFacets,
      mode: options.ghostMode,
      pinned: Object.fromEntries(
        [...pins.pins].map((key) => [key, options[key]])
      ),
      skinLibrary,
      skins: SKIN_NAMES,
    });
    setOptions((current) => ({ ...current, ...config }));
  };

  const namedCollection = () => {
    pins.clear();
    setOptions((current) => ({
      ...current,
      ghostMode: 'named',
      skinOrder: 'cycle',
      count: SKIN_NAMES.length,
      views: 'front',
    }));
  };

  return (
    <section className="rw-control-section">
      <h2>Create a ghost</h2>
      <label className="rw-field" htmlFor="gb-create-mode">
        Create
        <select
          id="gb-create-mode"
          value={options.ghostMode}
          onChange={(event) => setOption('ghostMode', event.target.value)}
        >
          <option value="new">New ghosts</option>
          <option value="variations">Variations of this ghost</option>
          <option value="named">Named ghost / exact traits</option>
        </select>
      </label>
      <label className="rw-field" htmlFor="gb-named-skin">
        Named ghost
        <select
          id="gb-named-skin"
          value={options.skin}
          onChange={(event) => loadSkin(event.target.value)}
        >
          {SKIN_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <div className="gb-live__toolbar">
        <button
          className="dev-button"
          type="button"
          onClick={() => loadSkin(options.skin)}
        >
          Reload named ghost
        </button>
        <button className="dev-button" type="button" onClick={rollGhost}>
          Roll ghost in Live
        </button>
      </div>
      {kind === 'still' ? (
        <>
          <div className="gb-live__toolbar">
            <button
              className="dev-button"
              type="button"
              onClick={namedCollection}
            >
              One of each named ghost
            </button>
          </div>
          <p className="rw-hint">
            The named collection resets holds and visits every skin once,
            preserving its authored traits. Configure colour and fill options in
            the SVG section.
          </p>
        </>
      ) : null}
      <p className="rw-hint">
        New ghosts mix character traits. Variations mutate the current ghost.
        Named ghost preserves its traits. Pin a control to edit and hold it in a
        batch; hold trait groups to keep a look.
      </p>
    </section>
  );
}

function prepareOptions(chosen, options) {
  return {
    ...chosen,
    base: options.ghostMode === 'new' ? null : kernel.configFrom(options),
  };
}

const preview = {
  placeholder: (metadata) => metadata.name ?? metadata.preset.skin,
  stats: (config) => (
    <>
      <Stat label="Based on" value={config.skin} />
      <Stat label="Creation" value={config.ghostMode ?? 'named'} />
      <Stat
        label="Cloth"
        value={`${config.clothWidth ?? 1} × ${config.clothHeight ?? 1}`}
      />
      <Stat label="Colour" value={config.color} />
      <Stat label="Location" value={config.location} />
      <Stat label="Backdrop" value={config.backdrop} />
      <Stat
        label="Wind"
        value={`${config.windStrength} from ${config.windAngle}°`}
      />
      <Stat label="Settle" value={`${config.settle}s`} />
      <Stat
        label="Camera"
        value={`${config.cameraAzimuth}° / ${config.cameraElevation}° ×${config.cameraZoom}`}
      />
    </>
  ),
};

const liveTab = (context) => [
  {
    icon: <FiPlay />,
    id: 'live',
    label: 'Live',
    render: () => <LiveGhost {...context} />,
  },
];

export default function GhostBusterWorkbenchPage() {
  return (
    <RollWorkbench
      controls={GhostControls}
      initialOptions={skinOptions(kernel.DEFAULT_SKIN)}
      defaultTab="live"
      leadingTabs={liveTab}
      name="GhostBuster"
      noun={{ many: 'ghosts', one: 'ghost' }}
      preview={preview}
      prepareOptions={prepareOptions}
      schema={workbenchSchema}
      sections={sections}
      title="GhostBusterCLI"
      tool="ghostBuster"
    />
  );
}
