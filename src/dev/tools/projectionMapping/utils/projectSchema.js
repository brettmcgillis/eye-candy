export const PROJECT_VERSION = 1;
export const DEFAULT_OUTPUT = { height: 1080, width: 1920 };
export const LAYER_TYPES = ['scene', 'image', 'video', 'color', 'grid'];

const DEFAULT_CORNERS = [
  { x: 240, y: 135 },
  { x: 1680, y: 135 },
  { x: 1680, y: 945 },
  { x: 240, y: 945 },
];

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function finiteNumber(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function normalizeCorners(corners) {
  if (!Array.isArray(corners) || corners.length !== 4) {
    return DEFAULT_CORNERS.map((corner) => ({ ...corner }));
  }

  return corners.map((corner, index) => ({
    x: finiteNumber(corner?.x, DEFAULT_CORNERS[index].x),
    y: finiteNumber(corner?.y, DEFAULT_CORNERS[index].y),
  }));
}

export function createLayer(type = 'grid', overrides = {}) {
  const safeType = LAYER_TYPES.includes(type) ? type : 'grid';
  const {
    corners: cornerOverrides,
    source: sourceOverrides,
    ...layerOverrides
  } = overrides;
  const sourceDefaults = {
    color: { color: '#ffffff' },
    grid: {
      backgroundColor: '#050505',
      lineColor: '#f3f0e8',
      majorColor: '#ff4d2e',
      spacing: 80,
    },
    image: { assetId: null },
    scene: { path: '/loGlow', preset: null },
    video: { assetId: null },
  };

  return {
    blendMode: 'normal',
    id: createId('layer'),
    interactive: false,
    locked: false,
    name: safeType === 'grid' ? 'Calibration grid' : safeType,
    opacity: 1,
    type: safeType,
    visible: true,
    ...layerOverrides,
    source: { ...sourceDefaults[safeType], ...(sourceOverrides ?? {}) },
    corners: normalizeCorners(cornerOverrides),
  };
}

export function normalizeProject(project) {
  if (!project || typeof project !== 'object') return null;

  const seen = new Set();
  const layers = (Array.isArray(project.layers) ? project.layers : [])
    .map((layer) => {
      if (!layer || !LAYER_TYPES.includes(layer.type)) return null;
      const normalized = createLayer(layer.type, layer);
      if (seen.has(normalized.id)) normalized.id = createId('layer');
      seen.add(normalized.id);
      normalized.opacity = Math.min(
        1,
        Math.max(0, finiteNumber(normalized.opacity, 1))
      );
      return normalized;
    })
    .filter(Boolean);

  const fallbackLayer = layers[0] ?? createLayer('grid');
  if (layers.length === 0) layers.push(fallbackLayer);

  return {
    background:
      typeof project.background === 'string' ? project.background : '#000000',
    createdAt: project.createdAt ?? new Date().toISOString(),
    id: typeof project.id === 'string' ? project.id : createId('mapping'),
    layers,
    name:
      typeof project.name === 'string' && project.name.trim()
        ? project.name.trim()
        : 'Untitled mapping',
    output: {
      height: Math.max(
        1,
        Math.round(finiteNumber(project.output?.height, DEFAULT_OUTPUT.height))
      ),
      width: Math.max(
        1,
        Math.round(finiteNumber(project.output?.width, DEFAULT_OUTPUT.width))
      ),
    },
    selectedLayerId: layers.some(
      (layer) => layer.id === project.selectedLayerId
    )
      ? project.selectedLayerId
      : fallbackLayer.id,
    updatedAt: project.updatedAt ?? new Date().toISOString(),
    version: PROJECT_VERSION,
  };
}

export function createProject(overrides = {}) {
  const grid = createLayer('grid');

  return normalizeProject({
    background: '#000000',
    createdAt: new Date().toISOString(),
    id: createId('mapping'),
    layers: [grid],
    name: 'Untitled mapping',
    output: DEFAULT_OUTPUT,
    selectedLayerId: grid.id,
    updatedAt: new Date().toISOString(),
    version: PROJECT_VERSION,
    ...overrides,
  });
}
