export const OVERLAY_IG_QUERY_PARAM = 'ig';
export const OVERLAY_HIDE_UI_QUERY_PARAM = 'hideUI';
export const OVERLAY_NO_LEVA_QUERY_PARAM = 'noLeva';

export const OVERLAY_IG_PRESETS = {
  story: 'story',
  reel: 'reel',
  post: 'post',
};

const FALSY_FLAG_VALUES = new Set(['0', 'false', 'no', 'off']);

function getSearchParams() {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search);
}

// A bare `?flag` counts as on; `?flag=0` (or false/no/off) counts as off.
function readFlagParam(key) {
  const params = getSearchParams();
  if (!params || !params.has(key)) return false;

  const value = params.get(key);
  if (!value) return true;
  return !FALSY_FLAG_VALUES.has(value.trim().toLowerCase());
}

export function normalizeOverlayIgPreset(value) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  return OVERLAY_IG_PRESETS[normalized] || null;
}

export function getOverlayIgPreset() {
  const params = getSearchParams();
  if (!params) return null;
  return normalizeOverlayIgPreset(params.get(OVERLAY_IG_QUERY_PARAM));
}

export function getHideUIFromQueryParam() {
  const params = getSearchParams();
  return !!params?.has(OVERLAY_HIDE_UI_QUERY_PARAM);
}

export function getNoLevaFromQueryParam() {
  return readFlagParam(OVERLAY_NO_LEVA_QUERY_PARAM);
}
