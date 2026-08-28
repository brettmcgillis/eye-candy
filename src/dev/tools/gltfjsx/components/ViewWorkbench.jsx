import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import DevTooltip from '../../../shell/DevTooltip';
import {
  modelSourceFromValue,
  useWorkbenchModelOptions,
} from '../hooks/gltfWorkbenchModels';
import { loadGltfFromSource } from '../hooks/useGltfPreview';
import GltfPreviewCanvas from './GltfPreviewCanvas';

const DISPLAY_MODE_OPTIONS = [
  { label: 'Original', value: 'original' },
  { label: 'Clay', value: 'clay' },
  { label: 'Normals', value: 'normal' },
];

const MATERIAL_CHANNEL_OPTIONS = [
  { label: 'Original material', value: 'original' },
  { label: 'Base color', value: 'baseColor' },
  { label: 'Normal map', value: 'normalMap' },
  { label: 'Roughness map', value: 'roughness' },
  { label: 'Metalness map', value: 'metalness' },
  { label: 'Emissive map', value: 'emissive' },
  { label: 'AO map', value: 'ao' },
  { label: 'Alpha map', value: 'alpha' },
  { label: 'Light map', value: 'light' },
  { label: 'Displacement map', value: 'displacement' },
  { label: 'Clearcoat map', value: 'clearcoat' },
];

const ENVIRONMENT_OPTIONS = [
  '',
  'sunset',
  'dawn',
  'night',
  'warehouse',
  'forest',
  'apartment',
  'studio',
  'city',
  'park',
  'lobby',
];

const SORT_OPTIONS = [
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' },
  { label: 'Size (smallest first)', value: 'size-asc' },
  { label: 'Size (largest first)', value: 'size-desc' },
];

const styles = {
  layout: {
    display: 'grid',
    gap: '1.25rem',
    gridTemplateColumns: 'minmax(22rem, 30rem) minmax(0, 1fr)',
    alignItems: 'start',
  },
  leftStack: {
    display: 'grid',
    gap: '1rem',
    alignSelf: 'start',
    maxHeight: 'calc(100vh - 3rem)',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    paddingRight: '0.25rem',
    position: 'sticky',
    top: '1.5rem',
  },
  panel: {
    borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.08)',
    padding: '1.1rem',
  },
  panelTitle: {
    margin: 0,
    fontSize: '0.95rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#475569',
  },
  panelLead: {
    margin: '0.55rem 0 0',
    color: '#475569',
    lineHeight: 1.55,
    fontSize: '0.92rem',
  },
  grid: {
    display: 'grid',
    gap: '0.85rem',
  },
  field: {
    display: 'grid',
    gap: '0.35rem',
  },
  label: {
    fontSize: '0.84rem',
    fontWeight: 600,
    color: '#0f172a',
  },
  hint: {
    margin: 0,
    fontSize: '0.76rem',
    color: '#64748b',
    lineHeight: 1.45,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '14px',
    border: '1px solid rgba(148, 163, 184, 0.4)',
    padding: '0.72rem 0.85rem',
    background: 'rgba(248, 250, 252, 0.98)',
    color: '#0f172a',
    fontSize: '0.92rem',
  },
  checkboxRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    padding: '0.65rem 0.9rem',
    borderRadius: '16px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'rgba(248, 250, 252, 0.9)',
  },
  modelList: {
    display: 'grid',
    gap: '0.3rem',
    maxHeight: '19rem',
    overflowY: 'auto',
    border: '1px solid rgba(226, 232, 240, 0.95)',
    borderRadius: '14px',
    padding: '0.45rem',
    background: 'rgba(248, 250, 252, 0.95)',
  },
  modelItem: {
    border: 'none',
    borderRadius: '10px',
    background: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    padding: '0.45rem 0.55rem',
    display: 'grid',
    gap: '0.2rem',
    color: '#0f172a',
  },
  modelItemActive: {
    background: '#0f172a',
    color: '#f8fafc',
  },
  modelMeta: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  buttonRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  secondaryButton: {
    border: '1px solid rgba(148, 163, 184, 0.42)',
    borderRadius: '999px',
    padding: '0.55rem 0.9rem',
    background: 'rgba(255,255,255,0.85)',
    color: '#0f172a',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.82rem',
  },
};

function formatFileSize(bytes) {
  const normalized = Number(bytes || 0);

  if (!Number.isFinite(normalized) || normalized <= 0) {
    return '0 B';
  }

  if (normalized >= 1024 * 1024) {
    return `${(normalized / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (normalized >= 1024) {
    return `${(normalized / 1024).toFixed(1)} KB`;
  }

  return `${normalized} B`;
}

function analyzeModelTraits(gltf) {
  const traitState = {
    animated: Boolean(gltf?.animations?.length),
    hasTextures: false,
    morphTargets: false,
    rigged: false,
  };
  const textureMapKeys = [
    'map',
    'normalMap',
    'roughnessMap',
    'metalnessMap',
    'aoMap',
    'alphaMap',
    'emissiveMap',
    'displacementMap',
    'lightMap',
    'clearcoatMap',
  ];

  gltf?.scene?.traverse((node) => {
    if (node.isBone || node.isSkinnedMesh) {
      traitState.rigged = true;
    }

    if (node.isMesh && node.morphTargetInfluences?.length) {
      traitState.morphTargets = true;
    }

    const materialList = Array.isArray(node.material)
      ? node.material
      : [node.material];
    materialList.forEach((material) => {
      if (!material || traitState.hasTextures) {
        return;
      }

      traitState.hasTextures = textureMapKeys.some((key) =>
        Boolean(material[key])
      );
    });
  });

  return traitState;
}

function buildSortComparator(sortMode) {
  if (sortMode === 'size-asc') {
    return (a, b) => Number(a.bytes || 0) - Number(b.bytes || 0);
  }

  if (sortMode === 'size-desc') {
    return (a, b) => Number(b.bytes || 0) - Number(a.bytes || 0);
  }

  if (sortMode === 'name-desc') {
    return (a, b) => b.assetPath.localeCompare(a.assetPath);
  }

  return (a, b) => a.assetPath.localeCompare(b.assetPath);
}

function traitsToLabel(traits) {
  if (!traits) {
    return 'Inspecting traits...';
  }

  const labels = [];

  if (traits.animated) labels.push('animated');
  if (traits.rigged) labels.push('rigged');
  if (traits.morphTargets) labels.push('morph targets');
  if (traits.hasTextures) labels.push('textured');

  return labels.length ? labels.join(' / ') : 'static / unrigged';
}

export default function ViewWorkbench({ uploadedAsset }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialModelParam = searchParams.get('viewModel') || '';
  const { modelList, modelListError, modelOptions, refreshModelList } =
    useWorkbenchModelOptions(uploadedAsset, 'Select a model...');
  const [selectedModelValue, setSelectedModelValue] = useState(() => {
    if (initialModelParam.startsWith('saved:')) {
      return initialModelParam;
    }

    return initialModelParam === 'uploaded' ? 'uploaded' : '';
  });
  const [searchText, setSearchText] = useState('');
  const [sortMode, setSortMode] = useState('name-asc');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [traitFilters, setTraitFilters] = useState({
    animated: false,
    hasTextures: false,
    morphTargets: false,
    rigged: false,
  });
  const [metadataByAssetPath, setMetadataByAssetPath] = useState({});
  const [metadataErrors, setMetadataErrors] = useState({});
  const inFlightMetadataRef = useRef(new Set());
  const [displayMode, setDisplayMode] = useState('original');
  const [materialChannel, setMaterialChannel] = useState('original');
  const [wireframe, setWireframe] = useState(false);
  const [previewOptions, setPreviewOptions] = useState({
    autoRotate: true,
    contactShadow: true,
    environment: 'city',
    intensity: 1,
    shadows: true,
  });
  const activeFilterCount = Object.values(traitFilters).filter(Boolean).length;

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (selectedModelValue) {
          next.set('viewModel', selectedModelValue);
        } else {
          next.delete('viewModel');
        }
        return next;
      },
      { replace: true }
    );
  }, [selectedModelValue, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    const pendingModels = modelList.filter((model) => {
      const { assetPath } = model;
      return (
        !metadataByAssetPath[assetPath] &&
        !inFlightMetadataRef.current.has(assetPath)
      );
    });

    if (!pendingModels.length) {
      return () => {
        cancelled = true;
      };
    }

    pendingModels.forEach((model) => {
      inFlightMetadataRef.current.add(model.assetPath);
    });

    async function loadTraitsForModel(model) {
      try {
        const source = modelSourceFromValue(`saved:${model.assetPath}`);
        const gltf = await loadGltfFromSource(source);

        if (cancelled) {
          return;
        }

        setMetadataByAssetPath((current) => ({
          ...current,
          [model.assetPath]: analyzeModelTraits(gltf),
        }));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setMetadataErrors((current) => ({
          ...current,
          [model.assetPath]:
            error instanceof Error ? error.message : 'Could not read traits.',
        }));
      } finally {
        inFlightMetadataRef.current.delete(model.assetPath);
      }
    }

    Promise.all(pendingModels.map(loadTraitsForModel));

    return () => {
      cancelled = true;
    };
  }, [metadataByAssetPath, modelList]);

  const filteredSavedModels = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const comparator = buildSortComparator(sortMode);

    return modelList
      .filter((model) => {
        if (query && !model.assetPath.toLowerCase().includes(query)) {
          return false;
        }

        const traits = metadataByAssetPath[model.assetPath];
        if (traitFilters.animated && !traits?.animated) return false;
        if (traitFilters.rigged && !traits?.rigged) return false;
        if (traitFilters.morphTargets && !traits?.morphTargets) return false;
        if (traitFilters.hasTextures && !traits?.hasTextures) return false;

        return true;
      })
      .sort(comparator);
  }, [metadataByAssetPath, modelList, searchText, sortMode, traitFilters]);

  const selectedModel = useMemo(() => {
    if (!selectedModelValue.startsWith('saved:')) {
      return null;
    }

    const assetPath = selectedModelValue.slice('saved:'.length);
    return modelList.find((model) => model.assetPath === assetPath) || null;
  }, [modelList, selectedModelValue]);

  const modelSource = useMemo(() => {
    return modelSourceFromValue(selectedModelValue, uploadedAsset);
  }, [selectedModelValue, uploadedAsset]);

  return (
    <div style={styles.layout}>
      <div style={styles.leftStack}>
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>View Models</h2>
          <p style={styles.panelLead}>
            Search your saved GLTF files, pick one, and inspect material and
            shading channels in the viewport.
          </p>
          <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
            <div style={styles.field}>
              <span style={styles.label}>Model source</span>
              <select
                style={styles.input}
                value={selectedModelValue}
                onChange={(event) => setSelectedModelValue(event.target.value)}
              >
                {modelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <span style={styles.label}>Search saved models</span>
              <input
                style={styles.input}
                type="search"
                value={searchText}
                placeholder="Filter by path or file name"
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>
            <div style={styles.field}>
              <span style={styles.label}>Sort</span>
              <select
                style={styles.input}
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <span className="view-workbench__filter-header">
                <button
                  aria-expanded={filtersOpen}
                  className="view-workbench__filter-toggle"
                  type="button"
                  onClick={() => setFiltersOpen((current) => !current)}
                >
                  <span aria-hidden="true">{filtersOpen ? '▾' : '▸'}</span>
                  Filter traits
                  {activeFilterCount ? ` (${activeFilterCount})` : ''}
                </button>
                <DevTooltip label="About trait filters">
                  Traits are detected asynchronously as models are scanned.
                </DevTooltip>
              </span>
              {filtersOpen ? (
                <div className="view-workbench__filter-options">
                  <div style={styles.checkboxRow}>
                    <input
                      aria-label="Filter animated models"
                      type="checkbox"
                      checked={traitFilters.animated}
                      onChange={(event) =>
                        setTraitFilters((current) => ({
                          ...current,
                          animated: event.target.checked,
                        }))
                      }
                    />
                    <span style={styles.label}>Animated</span>
                  </div>
                  <div style={styles.checkboxRow}>
                    <input
                      aria-label="Filter rigged models"
                      type="checkbox"
                      checked={traitFilters.rigged}
                      onChange={(event) =>
                        setTraitFilters((current) => ({
                          ...current,
                          rigged: event.target.checked,
                        }))
                      }
                    />
                    <span style={styles.label}>Rigged</span>
                  </div>
                  <div style={styles.checkboxRow}>
                    <input
                      aria-label="Filter morph-target models"
                      type="checkbox"
                      checked={traitFilters.morphTargets}
                      onChange={(event) =>
                        setTraitFilters((current) => ({
                          ...current,
                          morphTargets: event.target.checked,
                        }))
                      }
                    />
                    <span style={styles.label}>Morph Targets</span>
                  </div>
                  <div style={styles.checkboxRow}>
                    <input
                      aria-label="Filter textured models"
                      type="checkbox"
                      checked={traitFilters.hasTextures}
                      onChange={(event) =>
                        setTraitFilters((current) => ({
                          ...current,
                          hasTextures: event.target.checked,
                        }))
                      }
                    />
                    <span style={styles.label}>Textured</span>
                  </div>
                </div>
              ) : null}
            </div>
            <div style={styles.modelList}>
              {uploadedAsset ? (
                <button
                  type="button"
                  style={{
                    ...styles.modelItem,
                    ...(selectedModelValue === 'uploaded'
                      ? styles.modelItemActive
                      : null),
                  }}
                  onClick={() => setSelectedModelValue('uploaded')}
                >
                  <span>Current upload</span>
                  <span
                    style={{
                      ...styles.modelMeta,
                      ...(selectedModelValue === 'uploaded'
                        ? { color: 'rgba(226, 232, 240, 0.8)' }
                        : null),
                    }}
                  >
                    Live upload preview
                  </span>
                </button>
              ) : null}
              {filteredSavedModels.map((model) => {
                const value = `saved:${model.assetPath}`;
                const isActive = selectedModelValue === value;

                return (
                  <button
                    key={model.assetPath}
                    type="button"
                    style={{
                      ...styles.modelItem,
                      ...(isActive ? styles.modelItemActive : null),
                    }}
                    onClick={() => setSelectedModelValue(value)}
                  >
                    <span className="view-workbench__model-heading">
                      <span
                        className="view-workbench__model-name"
                        title={model.assetPath}
                      >
                        {model.assetPath}
                      </span>
                      <span
                        className="view-workbench__model-size"
                        style={{
                          ...styles.modelMeta,
                          ...(isActive
                            ? { color: 'rgba(226, 232, 240, 0.8)' }
                            : null),
                        }}
                      >
                        {formatFileSize(model.bytes)}
                      </span>
                    </span>
                    <span
                      style={{
                        ...styles.modelMeta,
                        ...(isActive
                          ? { color: 'rgba(226, 232, 240, 0.8)' }
                          : null),
                      }}
                    >
                      {traitsToLabel(metadataByAssetPath[model.assetPath])}
                    </span>
                    {metadataErrors[model.assetPath] ? (
                      <span
                        style={{
                          ...styles.modelMeta,
                          color: isActive ? '#fecaca' : '#b91c1c',
                        }}
                      >
                        traits error: {metadataErrors[model.assetPath]}
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {!uploadedAsset && !filteredSavedModels.length ? (
                <p style={styles.hint}>No saved models match that search.</p>
              ) : null}
            </div>
            <div style={styles.buttonRow}>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={refreshModelList}
              >
                Refresh list
              </button>
            </div>
            {selectedModel ? (
              <p style={styles.hint}>
                Selected: {selectedModel.assetPath} (
                {formatFileSize(selectedModel.bytes)}) •{' '}
                {traitsToLabel(metadataByAssetPath[selectedModel.assetPath])}
              </p>
            ) : null}
            {modelListError ? (
              <p style={{ ...styles.hint, color: '#9f1239' }}>
                {modelListError}
              </p>
            ) : null}
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Viewport Debug</h2>
          <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
            <div style={styles.field}>
              <span style={styles.label}>Display mode</span>
              <select
                style={styles.input}
                value={displayMode}
                onChange={(event) => setDisplayMode(event.target.value)}
              >
                {DISPLAY_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.field}>
              <span
                className="gltf-workbench-page__toggle-label"
                style={styles.label}
              >
                Material channel
                <DevTooltip label="About material channels">
                  Material-channel view is available when Display mode is
                  Original.
                </DevTooltip>
              </span>
              <select
                style={styles.input}
                value={materialChannel}
                onChange={(event) => setMaterialChannel(event.target.value)}
                disabled={displayMode !== 'original'}
              >
                {MATERIAL_CHANNEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.checkboxRow}>
              <input
                id="view-workbench-wireframe"
                aria-label="Wireframe overlay"
                type="checkbox"
                checked={wireframe}
                onChange={(event) => setWireframe(event.target.checked)}
              />
              <span style={styles.label}>Wireframe overlay</span>
            </div>
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Preview Lighting</h2>
          <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
            <div style={styles.field}>
              <span style={styles.label}>Environment</span>
              <select
                style={styles.input}
                value={previewOptions.environment}
                onChange={(event) =>
                  setPreviewOptions((current) => ({
                    ...current,
                    environment: event.target.value,
                  }))
                }
              >
                {ENVIRONMENT_OPTIONS.map((option) => (
                  <option key={option || 'none'} value={option}>
                    {option || 'none'}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.checkboxRow}>
              <input
                id="view-workbench-auto-rotate"
                aria-label="Auto rotate"
                type="checkbox"
                checked={previewOptions.autoRotate}
                onChange={(event) =>
                  setPreviewOptions((current) => ({
                    ...current,
                    autoRotate: event.target.checked,
                  }))
                }
              />
              <span style={styles.label}>Auto rotate</span>
            </div>
            <div style={styles.checkboxRow}>
              <input
                id="view-workbench-shadows"
                aria-label="Mesh shadows"
                type="checkbox"
                checked={previewOptions.shadows}
                onChange={(event) =>
                  setPreviewOptions((current) => ({
                    ...current,
                    shadows: event.target.checked,
                  }))
                }
              />
              <span style={styles.label}>Mesh shadows</span>
            </div>
            <div style={styles.checkboxRow}>
              <input
                id="view-workbench-contact-shadow"
                aria-label="Contact shadow"
                type="checkbox"
                checked={previewOptions.contactShadow}
                onChange={(event) =>
                  setPreviewOptions((current) => ({
                    ...current,
                    contactShadow: event.target.checked,
                  }))
                }
              />
              <span style={styles.label}>Contact shadow</span>
            </div>
          </div>
        </section>
      </div>

      <GltfPreviewCanvas
        previewAsset={modelSource}
        previewOptions={previewOptions}
        previewDebugSettings={{
          displayMode,
          materialChannel,
          wireframe,
        }}
      />
    </div>
  );
}
