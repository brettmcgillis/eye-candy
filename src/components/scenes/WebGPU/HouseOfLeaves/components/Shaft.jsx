import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  createLanding,
  createStairSegment,
  rotateXZ,
} from '@modules/houseOfLeaves';

import collectMouths, { collectLandingFlares } from '../utils/mouths';
import { collectRuns, createGeometryCache } from '../utils/runs';
import createShaftGrid from '../utils/shaftGrid';
import buildShaftWall from '../utils/shaftWall';
import LandingMouths from './LandingMouths';

// Flights and landings are recycled through pools, each slot handed a cached
// geometry for its shape — the shaft opens as it descends and the drift
// changes the pitch, so the geometry differs run to run. The wall is lofted
// over the window on the shared grid and rebuilt only when the walker has
// moved far enough to need it. Everything lives in the shaft's frame, at
// absolute depth.
function Shaft({ config, flares, material, wallMaterial, walker, zone }) {
  const rootRef = useRef(null);
  const flightRefs = useRef([]);
  const plateRefs = useRef([]);
  const wallRef = useRef(null);
  const cache = useMemo(() => createGeometryCache(), []);
  const grid = useMemo(() => createShaftGrid(config.shaft), [config.shaft]);
  const [openings, setOpenings] = useState({ mouths: [], landingFlares: [] });
  const built = useRef({ from: Infinity, to: -Infinity, geometry: null });

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
    const { anchor, position } = walker;
    const root = rootRef.current;
    const { frame } = zone;
    if (root) {
      root.position.set(
        frame.x - anchor.x,
        frame.y - anchor.y,
        frame.z - anchor.z
      );
      root.rotation.y = frame.rotationY;
    }
    const u = walker.zone === zone ? walker.state.u : zone.uFor(position);
    const from = u - config.streamBehind;
    const to = u + config.streamAhead;
    const { runs, plates } = collectRuns(from, to, config);

    for (let i = 0; i < flightRefs.current.length; i += 1) {
      const mesh = flightRefs.current[i];
      const run = runs[i];
      if (mesh) {
        mesh.visible = !!run;
        if (run) {
          mesh.geometry = cache.get(run.key, () =>
            createStairSegment({
              innerRadius: run.innerRadius,
              outerRadius: run.innerRadius + config.stairWidth + config.wallGap,
              innerRadiusEnd: run.innerRadiusEnd,
              outerRadiusEnd:
                run.innerRadiusEnd + config.stairWidth + config.wallGap,
              riser: run.riser,
              stepCount: run.stepCount,
              arcPerStep: run.arcPerStep,
              thickness: config.slabThickness,
              axisShift: rotateXZ(
                run.axisShift.x,
                run.axisShift.z,
                run.rotation
              ),
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
              outerRadius:
                plate.innerRadius + config.stairWidth + config.wallGap,
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
      const state = built.current;
      const slack = config.wallRebuildSlack;
      if (from < state.from + slack || to > state.to - slack) {
        const spanFrom = from - slack * 2;
        const spanTo = to + slack * 2;
        const landings = collectRuns(spanFrom, spanTo, config).landings.filter(
          (landing) => landing.u >= spanFrom && landing.u <= spanTo
        );
        const mouths = collectMouths(landings, config, grid);
        const rowFrom = Math.max(
          0,
          Math.floor(grid.rowOfU(Math.max(0, spanFrom)))
        );
        const rowTo = Math.min(
          config.shaftRows.rowTop,
          Math.ceil(grid.rowOfU(Math.min(config.shaft.descentLength, spanTo)))
        );
        setOpenings({
          mouths: mouths.filter(
            (m) => m.rows[0] >= rowFrom && m.rows[1] <= rowTo
          ),
          landingFlares: collectLandingFlares(landings, config),
        });
        const next = buildShaftWall({
          grid,
          rowFrom,
          rowTo,
          patches: mouths,
        });
        state.geometry?.dispose();
        built.current = { from: spanFrom, to: spanTo, geometry: next };
        wall.geometry = next;
      }
    }
  });

  return (
    <group ref={rootRef}>
      {Array.from({ length: pool }, (_, i) => (
        <mesh
          castShadow
          key={`flight${i}`}
          material={material}
          receiveShadow
          ref={(node) => {
            flightRefs.current[i] = node;
          }}
        />
      ))}
      {Array.from({ length: pool }, (_, i) => (
        <mesh
          castShadow
          key={`plate${i}`}
          material={material}
          receiveShadow
          ref={(node) => {
            plateRefs.current[i] = node;
          }}
        />
      ))}
      <mesh material={wallMaterial} ref={wallRef} receiveShadow />
      <LandingMouths
        config={config}
        flares={flares}
        grid={grid}
        landingFlares={openings.landingFlares}
        material={wallMaterial}
        mouths={openings.mouths}
      />
      {/* The one place the darkness has a floor value: a faint cool fill so
          the far side of the shaft is barely there, which is the only way
          the shaft's growth can be perceived at all. */}
      <hemisphereLight
        args={[config.shaftFillColor, '#000000', config.shaftFill]}
      />
    </group>
  );
}

export default memo(Shaft);
