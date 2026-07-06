const HEARTBEAT_MS = 500;
const MOVE_POLL_MS = 100;
const STALE_MS = 2000;

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function viewportRect() {
  return {
    x: window.screenX,
    y: window.screenY,
    w: window.innerWidth,
    h: window.innerHeight,
  };
}

function rectKey(rect) {
  return `${rect.x},${rect.y},${rect.w},${rect.h}`;
}

// Coordinates multiple same-origin browser windows/tabs through localStorage:
// each instance heartbeats its screen rect, every instance sees every other
// instance's rect via the `storage` event, and the lowest-id survivor is
// elected host. This is the same trick bgstaal/multipleWindow3dScene and the
// browsertabs-talking prototype use — see ~/dev/examples/ for the originals.
export default class WindowRegistry {
  constructor(channel) {
    this.key = `eyeCandy:windowSync:${channel}`;
    this.id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    this.windows = {};
    this.listeners = new Set();
    this.lastRectKey = '';
    this.meta = {};
    this.timer = null;
    this.moveTimer = null;

    this.handleStorage = (event) => {
      if (event.key === this.key) this.refresh();
    };
    this.handleResize = () => this.writeSelf();
    this.handleVisibility = () => this.writeSelf();
    this.handleUnload = () => this.stop();

    window.addEventListener('storage', this.handleStorage);
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('visibilitychange', this.handleVisibility);
    window.addEventListener('beforeunload', this.handleUnload);
  }

  start() {
    this.writeSelf();
    this.timer = setInterval(() => this.writeSelf(), HEARTBEAT_MS);
    this.moveTimer = setInterval(() => this.writeIfMoved(), MOVE_POLL_MS);
    this.refresh();
  }

  // Must be called on unmount — this scene lives inside a routed SPA, so a
  // window can leave the registry by switching scenes, not just by closing
  // the tab. Without an explicit stop(), a stale entry (and its cloud) would
  // linger in every other window until the heartbeat times out.
  stop() {
    clearInterval(this.timer);
    clearInterval(this.moveTimer);
    window.removeEventListener('storage', this.handleStorage);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    window.removeEventListener('beforeunload', this.handleUnload);

    const all = readJson(this.key, {});
    delete all[this.id];
    localStorage.setItem(this.key, JSON.stringify(all));
  }

  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Broadcasts arbitrary preset-owned state (color, size, strength — whatever
  // this window controls locally) alongside the rect, so every other window
  // renders THIS window's entity using this window's own values instead of
  // silently substituting whatever its own local Leva controls happen to be
  // set to.
  setMeta(meta) {
    this.meta = meta;
    this.writeSelf();
  }

  aliveWindows(now = Date.now()) {
    return Object.values(this.windows)
      .filter((win) => now - win.lastSeen <= STALE_MS)
      .filter((win) => win.visible !== false)
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  hostId() {
    return this.aliveWindows()[0]?.id || this.id;
  }

  writeSelf() {
    const now = Date.now();
    const all = readJson(this.key, {});
    Object.entries(all).forEach(([id, win]) => {
      if (now - win.lastSeen > STALE_MS) delete all[id];
    });

    const rect = viewportRect();
    all[this.id] = {
      id: this.id,
      ...rect,
      visible: document.visibilityState !== 'hidden',
      lastSeen: now,
      meta: this.meta,
    };

    localStorage.setItem(this.key, JSON.stringify(all));
    this.windows = all;
    this.lastRectKey = rectKey(rect);
    this.emit();
  }

  writeIfMoved() {
    if (rectKey(viewportRect()) !== this.lastRectKey) this.writeSelf();
  }

  refresh() {
    const now = Date.now();
    const all = readJson(this.key, {});
    let changed = false;
    Object.entries(all).forEach(([id, win]) => {
      if (now - win.lastSeen > STALE_MS) {
        delete all[id];
        changed = true;
      }
    });
    if (changed) localStorage.setItem(this.key, JSON.stringify(all));
    this.windows = all;
    this.emit();
  }

  emit() {
    const alive = this.aliveWindows();
    const host = this.hostId();
    this.listeners.forEach((listener) => listener(alive, host));
  }
}
