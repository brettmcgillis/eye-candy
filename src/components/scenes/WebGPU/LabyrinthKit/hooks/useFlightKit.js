import { useEffect, useMemo } from 'react';

import {
  createLanding,
  createStairSegment,
  createWallSegment,
  stairSegmentSpan,
} from '@modules/houseOfLeaves';

import { MOUTH_VARIANTS, mouthDimensions } from '../utils/jitter';

const TAU = Math.PI * 2;

// The geometry one flight needs, plus the arithmetic that stacks flights into a
// column. Shared so the static assembly and the moving preview cannot drift.
//
// One radius rule holds everything together: the treads and the landing both
// end exactly on the wall's inner face. Anything wider slices through the wall.
export default function useFlightKit(config) {
  const kit = useMemo(() => {
    const arcPerStep = TAU / config.stepsPerTurn;
    const innerRadius = config.voidRadius;
    const wallRadius = config.voidRadius + config.stairWidth;
    const stairOptions = {
      innerRadius,
      outerRadius: wallRadius,
      riser: config.riser,
      stepCount: config.stepCount,
      arcPerStep,
      thickness: config.landingThickness,
    };
    const span = stairSegmentSpan(stairOptions);
    const landingArc = config.landingArc * TAU;

    // Wall panels tile the whole turn: one per flight and one per landing, each
    // covering its own arc with a small overlap, so no amount of variance can
    // open a blank gap in the shaft.
    const overlap = arcPerStep * 2;
    const landingDrop = span.rise + config.riser;
    const flightArc = span.arc + landingArc;
    // Each panel covers only its own slice of the turn, so the next panel at
    // the same azimuth is a whole revolution below — not one flight. Sizing
    // against the flight drop leaves a band of missing wall once per turn.
    const revolutionDrop = (TAU / flightArc) * landingDrop;
    const halfPanel = Math.max(config.wallHeight * 0.5, revolutionDrop * 0.6);
    const wallOptions = {
      radius: wallRadius,
      base: -halfPanel,
      height: halfPanel,
    };

    return {
      stair: createStairSegment(stairOptions),
      landing: createLanding({
        innerRadius: innerRadius - config.landingOvershoot,
        outerRadius: wallRadius,
        arc: landingArc,
        thickness: config.landingThickness,
      }),
      wallSolid: createWallSegment({
        ...wallOptions,
        arc: landingArc + overlap,
      }),
      wallFlight: createWallSegment({
        ...wallOptions,
        arc: span.arc + overlap,
      }),
      wallOpenVariants: Array.from({ length: MOUTH_VARIANTS }, (_, v) => {
        const dims = mouthDimensions(config, v);
        return createWallSegment({
          ...wallOptions,
          arc: landingArc + overlap,
          opening: {
            width: dims.mouthWidth,
            height: dims.mouthHeight,
            offset: 0,
            archRise: dims.mouthWidth * 0.5,
          },
        });
      }),
      span,
      landingArc,
      landingDrop,
      flightArc,
      wallRadius,
      innerRadius,
      landingMidRadius: (innerRadius + wallRadius) * 0.5,
    };
  }, [config]);

  useEffect(
    () => () => {
      kit.stair.dispose();
      kit.landing.dispose();
      kit.wallSolid.dispose();
      kit.wallFlight.dispose();
      kit.wallOpenVariants.forEach((geometry) => geometry.dispose());
    },
    [kit]
  );

  return kit;
}
