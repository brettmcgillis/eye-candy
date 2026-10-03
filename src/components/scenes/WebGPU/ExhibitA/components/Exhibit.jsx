import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import useRenderScale from '@hooks/useRenderScale';
import {
  FAMILY_KINDS,
  SHAPE_KEYS,
  buildExhibit,
  drawProgress,
  evolveConfig,
  exhibitFootprint,
  sweepAzimuth,
} from '@modules/exhibitA';
import { createExhibitRig, getPaletteStops } from '@modules/exhibitARender';

const MAX_DELTA = 1 / 15;
// Share of full detail a mesh exhibit is rebuilt at while it evolves.
const EVOLVE_BUDGET = 0.35;

function Exhibit({ config }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const configRef = useRef(config);
  configRef.current = config;
  const clock = useRef(0);
  const evolving = useRef(false);

  useRenderScale(config.renderScale);

  const rig = useMemo(createExhibitRig, []);
  const stops = useMemo(
    () => getPaletteStops(config.paletteName),
    [config.paletteName]
  );

  const shapeKey = SHAPE_KEYS.map((key) => config[key]).join('|');
  const built = useMemo(() => buildExhibit(config), [shapeKey]);
  const footprint = useMemo(
    () => exhibitFootprint(config, built),
    [built, config.objectTilt, config.objectSpin]
  );

  useEffect(() => {
    rig.setExhibit(configRef.current, built, footprint);
    evolving.current = false;
  }, [built, footprint, rig]);

  useEffect(() => {
    rig.updateEnvironment(gl, scene, config);
  }, [
    config.ambient,
    config.background,
    config.skyHorizon,
    config.skyZenith,
    gl,
    rig,
    scene,
  ]);

  useEffect(
    () => () => {
      scene.environment = null;
      rig.dispose();
    },
    [rig, scene]
  );

  useFrame((_, delta) => {
    const c = configRef.current;
    clock.current += Math.min(delta, MAX_DELTA) * c.motionSpeed;
    const t = clock.current;
    let shown = c;

    if (c.motionMode === 'evolve') {
      shown = evolveConfig(c, t);
      if (FAMILY_KINDS[c.family] !== 'field') {
        rig.setExhibit(
          shown,
          buildExhibit(shown, { budget: EVOLVE_BUDGET }),
          footprint
        );
      }
      evolving.current = true;
    } else if (evolving.current) {
      rig.setExhibit(c, built, footprint);
      evolving.current = false;
    }

    rig.apply(shown, {
      lightAzimuth:
        c.motionMode === 'sweep' ? sweepAzimuth(c, t) : c.lightAzimuth,
      progress: c.motionMode === 'draw' ? drawProgress(c, t) : 1,
      stops,
    });
  });

  return <primitive object={rig.group} />;
}

export default memo(Exhibit);
