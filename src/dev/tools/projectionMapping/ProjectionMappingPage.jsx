import React, { useCallback, useEffect, useState } from 'react';
import {
  FiArrowDown,
  FiArrowUp,
  FiExternalLink,
  FiGrid,
  FiLayers,
  FiPlus,
  FiRotateCcw,
  FiRotateCw,
  FiTrash2,
} from 'react-icons/fi';

import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './ProjectionMappingPage.css';
import ProjectionStage from './components/ProjectionStage';
import TransformOverlay from './components/TransformOverlay';
import useProjectionSync from './hooks/useProjectionSync';
import { saveMedia } from './utils/mediaStore';
import { createLayer } from './utils/projectSchema';
import { loadActiveProject, saveProject } from './utils/projectStore';
import {
  SCENE_SOURCES,
  getSceneOptionLabel,
  getSceneSource,
} from './utils/sceneSources';
import {
  fitCorners,
  resetCorners,
  rotateCorners,
  scaleCorners,
  translateCorners,
} from './utils/transforms';

function OutputView({ project, setProject }) {
  useProjectionSync({ isOutput: true, project, setProject });

  return (
    <main className="pm-output">
      <ProjectionStage project={project} />
      <button
        className="pm-output__fullscreen"
        onClick={() => document.documentElement.requestFullscreen()}
        type="button"
      >
        Enter fullscreen
      </button>
    </main>
  );
}

function ControllerView({ project, setProject }) {
  const { outputConnected } = useProjectionSync({
    isOutput: false,
    project,
    setProject,
  });
  const selectedLayer = project.layers.find(
    (layer) => layer.id === project.selectedLayerId
  );
  const selectedScene =
    selectedLayer?.type === 'scene'
      ? getSceneSource(selectedLayer.source.path)
      : null;

  useEffect(() => {
    const timeout = window.setTimeout(() => saveProject(project), 180);
    return () => window.clearTimeout(timeout);
  }, [project]);

  const updateLayer = useCallback(
    (layerId, update) => {
      setProject((current) => ({
        ...current,
        layers: current.layers.map((layer) =>
          layer.id === layerId ? { ...layer, ...update } : layer
        ),
      }));
    },
    [setProject]
  );

  const addLayer = (type) => {
    const layer = createLayer(type);
    setProject((current) => ({
      ...current,
      layers: [...current.layers, layer],
      selectedLayerId: layer.id,
    }));
  };

  const moveLayer = (layerId, direction) => {
    setProject((current) => {
      const index = current.layers.findIndex((layer) => layer.id === layerId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.layers.length)
        return current;
      const layers = [...current.layers];
      [layers[index], layers[target]] = [layers[target], layers[index]];
      return { ...current, layers };
    });
  };

  const removeLayer = (layerId) => {
    setProject((current) => {
      if (current.layers.length === 1) return current;
      const layers = current.layers.filter((layer) => layer.id !== layerId);
      return {
        ...current,
        layers,
        selectedLayerId:
          current.selectedLayerId === layerId
            ? layers[layers.length - 1].id
            : current.selectedLayerId,
      };
    });
  };

  const transformSelected = useCallback(
    (transform) => {
      if (!selectedLayer || selectedLayer.locked) return;
      updateLayer(selectedLayer.id, {
        corners: transform(selectedLayer.corners),
      });
    },
    [selectedLayer, updateLayer]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target?.tagName;
      if (
        !selectedLayer ||
        selectedLayer.locked ||
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(tagName)
      ) {
        return;
      }
      const distance = event.shiftKey ? 10 : 1;
      const deltas = {
        ArrowDown: [0, distance],
        ArrowLeft: [-distance, 0],
        ArrowRight: [distance, 0],
        ArrowUp: [0, -distance],
      };
      const delta = deltas[event.key];
      if (!delta) return;
      event.preventDefault();
      transformSelected((corners) => translateCorners(corners, ...delta));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayer, transformSelected]);

  const openOutput = () => {
    const params = new URLSearchParams({
      project: project.id,
      view: 'output',
    });
    window.open(
      `/dev/projection-mapper?${params}`,
      `projection-output-${project.id}`
    );
  };

  return (
    <main className="pm-page">
      <DevPageHeaderBar
        eyebrow="Output calibration"
        title="Projection Mapper"
      />
      <div className="pm-toolbar">
        <strong>{project.name}</strong>
        <span>{`${project.output.width} × ${project.output.height}`}</span>
        <span className={outputConnected ? 'pm-status is-online' : 'pm-status'}>
          {outputConnected ? 'Output connected' : 'Output offline'}
        </span>
        <button onClick={openOutput} type="button">
          <FiExternalLink /> Open output
        </button>
      </div>
      <div className="pm-workbench">
        <aside className="pm-layer-panel">
          <div className="pm-layer-panel__heading">
            <FiLayers />
            <h2>Layers</h2>
          </div>
          <div className="pm-add-row">
            <button onClick={() => addLayer('scene')} type="button">
              <FiPlus /> Scene
            </button>
            <button onClick={() => addLayer('grid')} type="button">
              <FiGrid /> Grid
            </button>
            <button onClick={() => addLayer('color')} type="button">
              <FiPlus /> Color
            </button>
            <label className="pm-file-button" htmlFor="pm-media-file">
              <FiPlus /> Media
              <input
                accept="image/*,video/*"
                id="pm-media-file"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const media = await saveMedia(file);
                  const type = file.type.startsWith('video/')
                    ? 'video'
                    : 'image';
                  const layer = createLayer(type, {
                    name: file.name,
                    source: { assetId: media.id },
                  });
                  setProject((current) => ({
                    ...current,
                    layers: [...current.layers, layer],
                    selectedLayerId: layer.id,
                  }));
                }}
                type="file"
              />
            </label>
          </div>
          <div className="pm-layer-list">
            {[...project.layers].reverse().map((layer) => (
              <button
                className={
                  layer.id === project.selectedLayerId
                    ? 'pm-layer-row is-selected'
                    : 'pm-layer-row'
                }
                key={layer.id}
                onClick={() =>
                  setProject((current) => ({
                    ...current,
                    selectedLayerId: layer.id,
                  }))
                }
                type="button"
              >
                <span>{layer.name}</span>
                <small>{layer.type}</small>
              </button>
            ))}
          </div>
          {selectedLayer ? (
            <div className="pm-inspector">
              <label htmlFor="pm-layer-name">
                Name
                <input
                  id="pm-layer-name"
                  onChange={(event) =>
                    updateLayer(selectedLayer.id, { name: event.target.value })
                  }
                  value={selectedLayer.name}
                />
              </label>
              {selectedLayer.type === 'scene' ? (
                <label htmlFor="pm-scene-source">
                  Scene
                  <select
                    id="pm-scene-source"
                    onChange={(event) => {
                      const scene = getSceneSource(event.target.value);
                      updateLayer(selectedLayer.id, {
                        source: {
                          path: event.target.value,
                          preset: scene?.defaultPreset ?? null,
                        },
                      });
                    }}
                    value={selectedLayer.source.path}
                  >
                    {SCENE_SOURCES.map((scene) => (
                      <option key={scene.id} value={scene.path}>
                        {getSceneOptionLabel(scene)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {selectedScene?.presets.length ? (
                <label htmlFor="pm-scene-preset">
                  Preset
                  <select
                    id="pm-scene-preset"
                    onChange={(event) =>
                      updateLayer(selectedLayer.id, {
                        source: {
                          ...selectedLayer.source,
                          preset: event.target.value,
                        },
                      })
                    }
                    value={
                      selectedLayer.source.preset ?? selectedScene.defaultPreset
                    }
                  >
                    {selectedScene.presets.map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {selectedLayer.type === 'color' ? (
                <label htmlFor="pm-layer-color">
                  Color
                  <input
                    id="pm-layer-color"
                    onChange={(event) =>
                      updateLayer(selectedLayer.id, {
                        source: { color: event.target.value },
                      })
                    }
                    type="color"
                    value={selectedLayer.source.color}
                  />
                </label>
              ) : null}
              <label className="pm-check" htmlFor="pm-layer-lock">
                <input
                  checked={selectedLayer.locked}
                  id="pm-layer-lock"
                  onChange={(event) =>
                    updateLayer(selectedLayer.id, {
                      locked: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                Lock transform
              </label>
              <label className="pm-check" htmlFor="pm-layer-visible">
                <input
                  checked={selectedLayer.visible}
                  id="pm-layer-visible"
                  onChange={(event) =>
                    updateLayer(selectedLayer.id, {
                      visible: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                Visible
              </label>
              {selectedLayer.type === 'scene' ? (
                <label className="pm-check" htmlFor="pm-layer-interactive">
                  <input
                    checked={selectedLayer.interactive}
                    id="pm-layer-interactive"
                    onChange={(event) =>
                      updateLayer(selectedLayer.id, {
                        interactive: event.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                  Scene interaction
                </label>
              ) : null}
              <label htmlFor="pm-layer-opacity">
                Opacity
                <input
                  id="pm-layer-opacity"
                  max="1"
                  min="0"
                  onChange={(event) =>
                    updateLayer(selectedLayer.id, {
                      opacity: Number(event.target.value),
                    })
                  }
                  step="0.01"
                  type="range"
                  value={selectedLayer.opacity}
                />
              </label>
              <label htmlFor="pm-layer-blend">
                Blend
                <select
                  id="pm-layer-blend"
                  onChange={(event) =>
                    updateLayer(selectedLayer.id, {
                      blendMode: event.target.value,
                    })
                  }
                  value={selectedLayer.blendMode}
                >
                  {[
                    'normal',
                    'screen',
                    'multiply',
                    'overlay',
                    'difference',
                  ].map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>
              <div className="pm-layer-actions">
                <button
                  onClick={() => moveLayer(selectedLayer.id, 1)}
                  type="button"
                >
                  <FiArrowUp aria-hidden="true" /> Raise
                </button>
                <button
                  onClick={() => moveLayer(selectedLayer.id, -1)}
                  type="button"
                >
                  <FiArrowDown aria-hidden="true" /> Lower
                </button>
                <button
                  onClick={() => removeLayer(selectedLayer.id)}
                  type="button"
                >
                  <FiTrash2 aria-hidden="true" /> Delete
                </button>
              </div>
            </div>
          ) : null}
        </aside>
        <section className="pm-preview-panel">
          <div className="pm-transform-toolbar">
            <button
              onClick={() =>
                transformSelected(() => fitCorners(project.output))
              }
              type="button"
            >
              Fit
            </button>
            <button
              onClick={() =>
                transformSelected(() => resetCorners(project.output))
              }
              type="button"
            >
              Reset
            </button>
            <button
              onClick={() =>
                transformSelected((corners) => scaleCorners(corners, 0.9))
              }
              type="button"
            >
              − Scale
            </button>
            <button
              onClick={() =>
                transformSelected((corners) => scaleCorners(corners, 1.1))
              }
              type="button"
            >
              + Scale
            </button>
            <button
              aria-label="Rotate counterclockwise 15 degrees"
              onClick={() =>
                transformSelected((corners) => rotateCorners(corners, -15))
              }
              title="Rotate counterclockwise 15 degrees"
              type="button"
            >
              <FiRotateCcw />
            </button>
            <button
              aria-label="Rotate clockwise 15 degrees"
              onClick={() =>
                transformSelected((corners) => rotateCorners(corners, 15))
              }
              title="Rotate clockwise 15 degrees"
              type="button"
            >
              <FiRotateCw />
            </button>
          </div>
          <ProjectionStage project={project}>
            <TransformOverlay
              layer={selectedLayer}
              onCornersChange={(corners) =>
                updateLayer(selectedLayer.id, { corners })
              }
              output={project.output}
            />
          </ProjectionStage>
        </section>
      </div>
    </main>
  );
}

export default function ProjectionMappingPage() {
  const [project, setProject] = useState(loadActiveProject);
  const isOutput =
    new URLSearchParams(window.location.search).get('view') === 'output';

  return isOutput ? (
    <OutputView project={project} setProject={setProject} />
  ) : (
    <ControllerView project={project} setProject={setProject} />
  );
}
