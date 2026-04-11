/* eslint-disable no-param-reassign */
import {
  MAX_AUTO_SPLATS,
  MAX_STATIONARY_SPLATS,
} from '../utils/constants';

// ─── Clamping helpers ───────────────────────────────────────────────────────

export function clamp01(v, fallback = 0.5) {
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback;
}

export function clampStationarySplatCount(v) {
  return Number.isFinite(v)
    ? Math.max(0, Math.min(MAX_STATIONARY_SPLATS, Math.floor(v)))
    : 0;
}

export function clampStationaryDebugMarkerCount(v) {
  return Number.isFinite(v)
    ? Math.max(0, Math.min(MAX_STATIONARY_SPLATS, Math.floor(v)))
    : 0;
}

export function clampAutoSplatCount(v) {
  return Number.isFinite(v)
    ? Math.max(1, Math.min(MAX_AUTO_SPLATS, Math.floor(v)))
    : 1;
}

// ─── Array helpers ──────────────────────────────────────────────────────────

export function rndPos() {
  return { x: 0.1 + Math.random() * 0.8, y: 0.1 + Math.random() * 0.8 };
}

export function normalizeFromPreset(arr, count, fallback = rndPos) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const pt = arr?.[i];
    out.push(pt ? { x: clamp01(pt.x), y: clamp01(pt.y) } : fallback());
  }
  return out;
}

// ─── Preset array extraction ────────────────────────────────────────────────

export function getAutoSplatStartsFromPreset(p) {
  const count = clampAutoSplatCount(
    p?.autoSplatCount ?? p?.autoSplatStarts?.length
  );
  return normalizeFromPreset(p?.autoSplatStarts, count);
}

export function getStationarySplatsFromPreset(p) {
  const count = clampStationarySplatCount(
    p?.stationarySplatCount ?? p?.stationarySplats?.length
  );
  return normalizeFromPreset(p?.stationarySplats, count);
}

export function getStationaryDebugMarkersFromPreset(p) {
  const count = clampStationaryDebugMarkerCount(
    p?.stationaryDebugMarkerCount ??
      p?.stationaryDebugMarkers?.length ??
      p?.stationarySplatCount ??
      p?.stationarySplats?.length
  );
  const arr = p?.stationaryDebugMarkers ?? p?.stationarySplats;
  return normalizeFromPreset(arr, count);
}

// ─── Leva control key helpers ───────────────────────────────────────────────

function autoSplatKey(i) {
  return `autoSplat${i + 1}StartPos`;
}

function stationarySplatKey(i) {
  return `stationarySplat${i + 1}Pos`;
}

function stationaryDebugMarkerKey(i) {
  return `stationaryDebugMarker${i + 1}Pos`;
}

// ─── Leva control builders ──────────────────────────────────────────────────

/**
 * Build Leva controls for auto-splat start positions.
 * @param {Array} starts - current start positions
 * @param {Function} setStarts - state setter
 * @param {string} sceneName - Leva root folder name (e.g. 'Fluid', 'Cardinals')
 */
export function buildAutoSplatStartControls(starts, setStarts, sceneName) {
  const out = {};
  for (let i = 0; i < MAX_AUTO_SPLATS; i += 1) {
    const pt = starts[i] || { x: 0.5, y: 0.5 };
    out[autoSplatKey(i)] = {
      label: `A${i + 1} Pos`,
      value: { x: clamp01(pt.x), y: clamp01(pt.y) },
      min: 0,
      max: 1,
      step: 0.001,
      render: (get) => {
        const count = clampAutoSplatCount(
          get(`${sceneName}.Interaction.AutoSplats.autoSplatCount`)
        );
        return i < count;
      },
      onChange: (next) => {
        setStarts((prev) => {
          if (!prev[i]) return prev;
          const nx = clamp01(next?.x);
          const ny = clamp01(next?.y);
          if (prev[i].x === nx && prev[i].y === ny) return prev;
          const arr = [...prev];
          arr[i] = { x: nx, y: ny };
          return arr;
        });
      },
    };
  }
  return out;
}

/**
 * Build Leva controls for stationary splat positions.
 * @param {Array} splats - current splat positions
 * @param {Function} setSplats - state setter
 * @param {string} sceneName - Leva root folder name
 */
export function buildStationarySplatControls(splats, setSplats, sceneName) {
  const out = {};
  for (let i = 0; i < MAX_STATIONARY_SPLATS; i += 1) {
    const pt = splats[i] || { x: 0.5, y: 0.5 };
    out[stationarySplatKey(i)] = {
      label: `S${i + 1} Pos`,
      value: { x: clamp01(pt.x), y: clamp01(pt.y) },
      min: 0,
      max: 1,
      step: 0.001,
      render: (get) => {
        const count = clampStationarySplatCount(
          get(`${sceneName}.Interaction.StationarySplats.stationarySplatCount`)
        );
        return i < count;
      },
      onChange: (next) => {
        setSplats((prev) => {
          if (!prev[i]) return prev;
          const nx = clamp01(next?.x);
          const ny = clamp01(next?.y);
          if (prev[i].x === nx && prev[i].y === ny) return prev;
          const arr = [...prev];
          arr[i] = { x: nx, y: ny };
          return arr;
        });
      },
    };
  }
  return out;
}

/**
 * Build Leva controls for stationary debug marker positions.
 * @param {Array} markers - current marker positions
 * @param {Function} setMarkers - state setter
 * @param {string} sceneName - Leva root folder name
 */
export function buildStationaryDebugMarkerControls(
  markers,
  setMarkers,
  sceneName
) {
  const out = {};
  for (let i = 0; i < MAX_STATIONARY_SPLATS; i += 1) {
    const pt = markers[i] || { x: 0.5, y: 0.5 };
    out[stationaryDebugMarkerKey(i)] = {
      label: `M${i + 1} Pos`,
      value: { x: clamp01(pt.x), y: clamp01(pt.y) },
      min: 0,
      max: 1,
      step: 0.001,
      render: (get) => {
        const count = clampStationaryDebugMarkerCount(
          get(
            `${sceneName}.Interaction.StationaryMarkers.stationaryDebugMarkerCount`
          )
        );
        return i < count;
      },
      onChange: (next) => {
        setMarkers((prev) => {
          if (!prev[i]) return prev;
          const nx = clamp01(next?.x);
          const ny = clamp01(next?.y);
          if (prev[i].x === nx && prev[i].y === ny) return prev;
          const arr = [...prev];
          arr[i] = { x: nx, y: ny };
          return arr;
        });
      },
    };
  }
  return out;
}

// ─── Preset application ─────────────────────────────────────────────────────

export function notifyArrayUpdate(
  setAutoSplatStarts,
  setStationarySplats,
  setStationaryDebugMarkers,
  presetSnapshot
) {
  setAutoSplatStarts(getAutoSplatStartsFromPreset(presetSnapshot));
  setStationarySplats(getStationarySplatsFromPreset(presetSnapshot));
  setStationaryDebugMarkers(
    getStationaryDebugMarkersFromPreset(presetSnapshot)
  );
}

// ─── Control patch builders (for Leva set-value patches) ────────────────────

export function buildAutoSplatStartControlPatch(autoSplatStarts) {
  return autoSplatStarts.reduce((acc, start, index) => {
    acc[autoSplatKey(index)] = {
      x: clamp01(start?.x),
      y: clamp01(start?.y),
    };
    return acc;
  }, {});
}

export function buildStationarySplatControlPatch(stationarySplats) {
  return stationarySplats.reduce((acc, splat, index) => {
    acc[stationarySplatKey(index)] = {
      x: clamp01(splat?.x),
      y: clamp01(splat?.y),
    };
    return acc;
  }, {});
}

export function buildStationaryDebugMarkerControlPatch(stationaryDebugMarkers) {
  return stationaryDebugMarkers.reduce((acc, marker, index) => {
    acc[stationaryDebugMarkerKey(index)] = {
      x: clamp01(marker?.x),
      y: clamp01(marker?.y),
    };
    return acc;
  }, {});
}
