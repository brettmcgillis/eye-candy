import React, { memo, useMemo } from 'react';

import { CLOUD_VARIANT_COUNT } from '@elements/CartoonClouds/CartoonClouds';

import DesktopCloud from './DesktopCloud';

// Low saturation, high lightness — clouds should read as near-white with
// just a hint of per-window color, not vividly tinted.
const SATURATION = 15;
const LIGHTNESS = 94;
const Z_RANGE = 400;
// Large prime, not the target range — reducing mod-by-mod inside the loop
// (e.g. mod 6 for cloud variants) is a classic hash bug: 31 mod 6 is 1, so
// the `* 31` mixing step became a no-op and every id collapsed toward the
// same running sum mod 6 (every window picking the same cloud shape, while
// hue/zOffset — larger mods — happened to still look fine). Mix at full
// width throughout, and only reduce to the caller's range once, at the end.
const HASH_MODULUS = 2147483647;

// Stable per-id hash (not Math.random) — a window's cloud shape/tint
// shouldn't change on every re-render or reshuffle when a sibling window
// closes. Every tab computes the same result for the same id, so unlike
// `spread`/`bobAmount`/etc this never needs to be broadcast through meta.
function hashForId(id, mod) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % HASH_MODULUS;
  }
  return hash % mod;
}

// One DesktopCloud per alive window in the registry, each centered on that
// window's own screen rect (shared world coordinates — see DesktopStage).
// Size/bob come from that window's own broadcast `meta`, not from this tab's
// local controls — otherwise a cloud's appearance would depend on which
// window happened to be doing the rendering. `fallbackCloud` only covers the
// brief gap before a window's first meta broadcast lands. `hueShift` is a
// global palette nudge (not per-window state), so it's just a local prop.
function CloudField({ windows, fallbackCloud, hueShift }) {
  const clouds = useMemo(
    () =>
      windows.map((win) => {
        const hue = (hashForId(win.id, 360) + hueShift + 360) % 360;
        return {
          id: win.id,
          variant: hashForId(win.id, CLOUD_VARIANT_COUNT),
          color: `hsl(${hue}, ${SATURATION}%, ${LIGHTNESS}%)`,
          // Stable per-window depth so overlapping windows' clouds layer
          // instead of z-fighting/clipping into each other.
          zOffset: (hashForId(win.id, 1000) / 1000) * Z_RANGE - Z_RANGE / 2,
          targetCenter: { x: win.x + win.w / 2, y: win.y + win.h / 2 },
          style:
            win.meta && Object.keys(win.meta).length ? win.meta : fallbackCloud,
        };
      }),
    [windows, fallbackCloud, hueShift]
  );

  return (
    <>
      {clouds.map(({ id, variant, color, zOffset, targetCenter, style }) => (
        <DesktopCloud
          key={id}
          variant={variant}
          zOffset={zOffset}
          targetCenter={targetCenter}
          spread={style.spread}
          color={color}
          bobAmount={style.bobAmount}
          bobSpeed={style.bobSpeed}
        />
      ))}
    </>
  );
}

export default memo(CloudField);
