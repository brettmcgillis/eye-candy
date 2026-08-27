// The app's `hideUI` query param, driven from inside the R3F Canvas.
//
// Both owners of this param — the Overlay and useAppScenes — re-read it from
// the *router* location, and this scene can't reach the router: R3F renders
// through its own reconciler, so React context (including react-router's)
// doesn't cross into the Canvas and useSearchParams would throw here. So the
// param is written straight to history and the router is nudged into
// re-reading it, which leaves both owners in agreement rather than fighting.
const HIDE_UI_QUERY_PARAM = 'hideUI';

// `has`, not `get`: the Overlay treats a bare `?hideUI` as hidden, and `get`
// would return an empty string for it.
export function isAppUiHidden() {
  if (typeof window === 'undefined') return false;

  return new URLSearchParams(window.location.search).has(HIDE_UI_QUERY_PARAM);
}

export function setAppUiHidden(hidden) {
  if (typeof window === 'undefined' || isAppUiHidden() === hidden) return;

  const params = new URLSearchParams(window.location.search);

  if (hidden) params.set(HIDE_UI_QUERY_PARAM, '1');
  else params.delete(HIDE_UI_QUERY_PARAM);

  const query = params.toString();
  window.history.replaceState(
    {},
    '',
    `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  );
  window.dispatchEvent(new PopStateEvent('popstate'));
}
