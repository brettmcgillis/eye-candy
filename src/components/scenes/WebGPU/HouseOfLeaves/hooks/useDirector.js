import { useMemo, useRef } from 'react';

import beatsFor from '../utils/director/beats';

// Runs the beats for whatever zone the walker is in. Each zone change starts
// that zone's list from the top; each beat gets a fresh context with its own
// clock, and the drive it leaves behind is what the walker acts on.
//
// The director itself is stable across control edits — a Leva tweak must not
// restart the beat in progress — so beats read the config as it stands when
// their zone is entered.
export default function useDirector(config) {
  const configRef = useRef(config);
  configRef.current = config;

  return useMemo(() => {
    const director = {
      zoneId: null,
      list: [],
      index: 0,
      ctx: null,
      reset() {
        director.zoneId = null;
        director.list = [];
        director.index = 0;
        director.ctx = null;
      },
      onZone(walker, zone) {
        const beats = beatsFor(configRef.current);
        director.zoneId = zone.id;
        director.list = beats[zone.kind]?.(zone, walker) ?? [];
        director.index = 0;
        director.ctx = null;
      },
      update(walker, dt) {
        if (walker.zoneId !== director.zoneId) {
          director.onZone(walker, walker.zone);
        }
        const beat = director.list[director.index];
        const { drive } = walker;
        if (!beat) {
          drive.forward = 0;
          return;
        }
        if (!director.ctx) {
          director.ctx = {
            walker,
            drive: walker.drive,
            zone: walker.zone,
            config: configRef.current,
            t: 0,
          };
          beat.enter?.(director.ctx);
        }
        director.ctx.t += dt;
        const done = beat.update(director.ctx, dt);
        if (done && director.index < director.list.length - 1) {
          director.index += 1;
          director.ctx = null;
        }
      },
      beatId: () => director.list[director.index]?.id ?? null,
    };
    return director;
  }, []);
}
