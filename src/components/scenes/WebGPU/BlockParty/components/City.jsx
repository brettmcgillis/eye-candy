import React, { memo, useEffect, useMemo } from 'react';

import {
  COMPOSITION_KEYS,
  FORM_KEYS,
  cityScale,
  compositionOf,
  layCity,
  metricsOf,
  pedestalDepthFor,
} from '@modules/blockParty';
import { createCityRig } from '@modules/blockPartyRender';

import useBuildClock from '../hooks/useBuildClock';
import useCityState from '../hooks/useCityState';

function City({ config, uniforms }) {
  const buildClockRef = useBuildClock({
    buildIn: config.buildIn,
    buildSeconds: config.buildSeconds,
    resetKey: config.seed,
    uniforms,
  });

  const compositionKey = COMPOSITION_KEYS.map((key) => config[key]).join('|');
  const composition = useMemo(() => compositionOf(config), [compositionKey]);
  const formKey = FORM_KEYS.map((key) => config[key]).join('|');
  const metrics = useMemo(() => metricsOf(config), [formKey]);

  const { cells, model } = useCityState({
    buildClockRef,
    composition,
    rebuildEnabled: config.rollingRebuild,
    rebuildOrder: config.rebuildOrder,
    rebuildSeconds: config.rebuildSeconds,
    referenceHeight: config.referenceHeight,
    revealBand: config.revealBand,
    seed: config.seed,
  });

  const rig = useMemo(() => createCityRig({ uniforms }), [uniforms]);

  useEffect(() => () => rig.dispose(), [rig]);

  const { deepest, layers } = useMemo(
    () => layCity({ cells, colorBy: config.colorBy, metrics, model }),
    [cells, config.colorBy, metrics, model]
  );

  useEffect(() => rig.setLayers(layers), [layers, rig]);

  useEffect(
    () =>
      rig.setGround({
        cells,
        radius: model.radius,
        shape: config.pedestalShape,
      }),
    [cells, config.pedestalShape, model.radius, rig]
  );

  const pedestalDepth = pedestalDepthFor(config, deepest);

  useEffect(
    () =>
      rig.setPedestal({
        depth: pedestalDepth,
        radius: model.radius,
        shape: config.pedestalShape,
      }),
    [config.pedestalShape, model.radius, pedestalDepth, rig]
  );

  useEffect(
    () => rig.setTowerBlend(config.towerBlend),
    [config.towerBlend, rig]
  );
  useEffect(
    () => rig.setTowerShadows(config.towerShadows),
    [config.towerShadows, rig]
  );

  const scale = cityScale(config, model);

  useEffect(() => rig.setScale(scale), [rig, scale]);

  return <primitive object={rig.group} />;
}

export default memo(City);
