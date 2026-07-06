import { useEffect, useRef, useState } from 'react';

import WindowRegistry from './WindowRegistry';

// Subscribes this component tree to the cross-window registry for `channel`.
// Returns this window's own rect plus every alive sibling window's rect, so a
// scene can render one entity per open browser window/tab and keep them all
// addressable by a stable id (not array index — index shifts when a sibling
// window closes).
//
// `meta` is this window's own locally-controlled state (color, size,
// strength — whatever a preset lets its window own) broadcast to every
// sibling. Each returned `windows[]` entry carries the *originating* window's
// meta, so a preset renders every entity using its own window's values —
// never substituting the observing tab's local control state, which would
// make appearance depend on which tab happens to be rendering.
export default function useWindowSync(channel, meta) {
  const registryRef = useRef(null);
  const [state, setState] = useState({ windows: [], hostId: null });

  useEffect(() => {
    const registry = new WindowRegistry(channel);
    registryRef.current = registry;

    const unsubscribe = registry.onChange((windows, hostId) => {
      setState({ windows, hostId });
    });

    registry.start();

    return () => {
      unsubscribe();
      registry.stop();
    };
  }, [channel]);

  // Callers pass a fresh object literal every render, so the effect is
  // keyed on a JSON summary (metaKey) rather than `meta` itself — otherwise
  // every render would re-broadcast even when nothing actually changed.
  const metaKey = JSON.stringify(meta ?? null);
  useEffect(() => {
    registryRef.current?.setMeta(meta ?? {});
  }, [metaKey]);

  const selfId = registryRef.current?.id ?? null;
  const self = state.windows.find((win) => win.id === selfId) ?? null;

  return {
    hostId: state.hostId,
    isHost: state.hostId === selfId,
    selfId,
    selfRect: self ? { x: self.x, y: self.y, w: self.w, h: self.h } : null,
    windows: state.windows,
  };
}
