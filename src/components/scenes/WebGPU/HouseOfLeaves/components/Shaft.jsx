import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  createLanding,
  createStairSegment,
  riseAt,
} from '@modules/houseOfLeaves';

import collectMouths, { collectLandingFlares } from '../utils/mouths';
import { collectRuns, createGeometryCache } from '../utils/runs';
import buildShaftWall, { WALL_COLUMNS, WALL_ROWS } from '../utils/shaftWall';
import ShaftMouths from './ShaftMouths';

// Flights and landings are recycled through pools the same way the corridor's
// units are, but here the geometry differs run to run — the shaft opens as it
// descends and the drift changes the pitch — so each slot is handed a cached
// geometry for its shape rather than one shared buffer.
function Shaft({ config, flares, material, wallMaterial, walker }) {
  const rootRef = useRef(null);
  const flightRefs = useRef([]);
  const plateRefs = useRef([]);
  const wallRef = useRef(null);
  const cache = useMemo(() => createGeometryCache(), []);
  // Mouths and the wall they pierce are rebuilt together and share a
  // reference, because a tunnel drifting away from its hole would show a gap
  // straight through the shaft.
  const [openings, setOpenings] = useState({
    mouths: [],
    landingFlares: [],
    uRef: 0,
  });
  const built = useRef({
    from: Infinity,
    to: -Infinity,
    uRef: 0,
    geometry: null,
  });

  useEffect(
    () => () => {
      cache.dispose();
      built.current.geometry?.dispose();
    },
    [cache]
  );

  const pool = useMemo(
    () =>
      Math.ceil(
        (config.streamAhead + config.streamBehind) /
          Math.max(
            1,
            config.shaft.landingSpacing * (1 - config.shaft.landingDriftAmount)
          )
      ) + 3,
    [config.shaft, config.streamAhead, config.streamBehind]
  );

  useFrame(() => {
    if (!walker.frame) return;
    const { runs, plates } = collectRuns(
      walker.progress,
      config.streamBehind,
      config.streamAhead,
      config,
      walker.frame
    );
    const { anchor } = walker;
    // One group carries both the rebase and the shaft's offset into the shared
    // world, so every piece below is placed in the shaft's own axis frame and
    // none of them has to know where the stairwell sits in the room.
    const root = rootRef.current;
    if (root) {
      root.position.set(
        config.origin.x - anchor.x,
        -anchor.y,
        config.origin.z - anchor.z
      );
    }

    for (let i = 0; i < flightRefs.current.length; i += 1) {
      const mesh = flightRefs.current[i];
      const run = runs[i];
      if (mesh) {
        mesh.visible = !!run;
        if (run) {
          mesh.geometry = cache.get(run.key, () =>
            createStairSegment({
              innerRadius: run.innerRadius,
              outerRadius: run.innerRadius + config.stairWidth,
              innerRadiusEnd: run.innerRadiusEnd,
              outerRadiusEnd: run.innerRadiusEnd + config.stairWidth,
              riser: run.riser,
              stepCount: run.stepCount,
              arcPerStep: run.arcPerStep,
              thickness: config.slabThickness,
            })
          );
          mesh.position.set(run.x, run.y, run.z);
          mesh.rotation.y = run.rotation;
        }
      }
    }

    for (let i = 0; i < plateRefs.current.length; i += 1) {
      const mesh = plateRefs.current[i];
      const plate = plates[i];
      if (mesh) {
        mesh.visible = !!plate;
        if (plate) {
          mesh.geometry = cache.get(`L${plate.key}`, () =>
            createLanding({
              innerRadius: plate.innerRadius - config.landingOvershoot,
              outerRadius: plate.innerRadius + config.stairWidth,
              innerRadiusEnd: plate.innerRadiusEnd - config.landingOvershoot,
              outerRadiusEnd: plate.innerRadiusEnd + config.stairWidth,
              arc: plate.arc,
              thickness: config.slabThickness,
            })
          );
          mesh.position.set(plate.x, plate.y, plate.z);
          mesh.rotation.y = plate.rotation;
        }
      }
    }

    const wall = wallRef.current;
    if (wall) {
      const from = walker.progress - config.streamBehind;
      const to = walker.progress + config.streamAhead;
      const state = built.current;
      const slack = config.wallRebuildSlack;

      // Frame-relative height differs from the built one by a single constant,
      // so between rebuilds the wall only has to be shifted in Y. Rebuilding
      // this every frame would be a megabyte of vertex upload for a surface
      // that has not changed shape.
      if (from < state.from + slack || to > state.to - slack) {
        const inRange = walker.frame.landings.filter(
          (landing) =>
            landing.u >= from - slack * 2 && landing.u <= to + slack * 2
        );
        const mouths = collectMouths(inRange, config);
        setOpenings({
          mouths,
          landingFlares: collectLandingFlares(inRange, config),
          uRef: walker.progress,
        });
        const next = buildShaftWall({
          fromU: from - slack * 2,
          toU: to + slack * 2,
          config,
          frame: walker.frame,
          mouths,
          uRef: walker.progress,
          rows: WALL_ROWS,
          columns: WALL_COLUMNS,
        });
        state.geometry?.dispose();
        built.current = {
          from: from - slack * 2,
          to: to + slack * 2,
          uRef: walker.progress,
          geometry: next,
        };
        wall.geometry = next;
      }

      // The offset has to be a *difference* of rises taken against one landing
      // set. A difference is independent of which landings the set happens to
      // hold, because any landing behind both ends contributes to both and
      // cancels — but the absolute rise is not, and a landing ageing out of
      // the window would jump the wall by its plateau.
      const shift =
        walker.frame.riseRef -
        riseAt(built.current.uRef, walker.frame.landings);
      wall.position.set(0, shift, 0);
    }
  });

  return (
    <group ref={rootRef}>
      {Array.from({ length: pool }, (_, i) => (
        <mesh
          key={`flight${i}`}
          material={material}
          ref={(node) => {
            flightRefs.current[i] = node;
          }}
        />
      ))}
      {Array.from({ length: pool }, (_, i) => (
        <mesh
          key={`plate${i}`}
          material={material}
          ref={(node) => {
            plateRefs.current[i] = node;
          }}
        />
      ))}
      <mesh material={wallMaterial} ref={wallRef} />
      <ShaftMouths
        config={config}
        flares={flares}
        landingFlares={openings.landingFlares}
        material={material}
        mouths={openings.mouths}
        uRef={openings.uRef}
        walker={walker}
      />
    </group>
  );
}

export default memo(Shaft);
