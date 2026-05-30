import { button, folder } from 'leva';

import buildSplineInstanceActions from './buildSplineInstanceActions';

export default function buildFireAndSmokeControls({
  instances,
  setInstances,
  addInstance,
  cloneInstance,
  sectionLabel = 'Fire And Smoke',
  instanceLabel = 'Fire And Smoke',
  keyPrefix = 'fas',
  supportsAttractors = false,
}) {
  return {
    [`Add ${sectionLabel}`]: button(() =>
      setInstances((prev) => [...prev, addInstance()])
    ),
    [`Remove All ${sectionLabel}`]: button(() => setInstances([])),
    ...instances.reduce((acc, instance, index) => {
      const { id } = instance;
      const onCfg = (key) => (value) =>
        setInstances((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, config: { ...item.config, [key]: value } }
              : item
          )
        );
      const onInst = (key) => (value) =>
        setInstances((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, [key]: value } : item
          )
        );

      acc[`${instanceLabel} ${index + 1}`] = folder(
        {
          [`${keyPrefix}_visible_${id}`]: {
            label: 'Visible',
            value: instance.visible ?? true,
            onChange: onInst('visible'),
          },
          [`${keyPrefix}_pos_${id}`]: {
            label: 'Position',
            value: instance.pos,
            step: 0.1,
            onChange: onInst('pos'),
          },
          [`${keyPrefix}_rot_${id}`]: {
            label: 'Rotation',
            value: instance.rot,
            step: 0.05,
            onChange: onInst('rot'),
          },
          [`${keyPrefix}_scale_${id}`]: {
            label: 'Scale',
            value: instance.scale,
            min: 0.01,
            max: 10,
            step: 0.1,
            onChange: onInst('scale'),
          },
          ...(supportsAttractors
            ? {
                [`${keyPrefix}_enableAttractors_${id}`]: {
                  label: 'Enable Attractors',
                  value: instance.config.enableAttractors ?? true,
                  onChange: onCfg('enableAttractors'),
                },
              }
            : {}),
          'FAS Spline Editor': folder(
            {
              [`${keyPrefix}_handles_${id}`]: {
                label: 'Show Handles',
                value: instance.showHandles,
                onChange: onInst('showHandles'),
              },
              [`${keyPrefix}_showSpline_${id}`]: {
                label: 'Show Curve',
                value: instance.showSpline,
                onChange: onInst('showSpline'),
              },
              [`${keyPrefix}_pointMode_${id}`]: {
                label: 'Transform',
                value: instance.pointMode,
                options: ['translate', 'scale'],
                onChange: onInst('pointMode'),
              },
              [`${keyPrefix}_closed_${id}`]: {
                label: 'Closed',
                value: instance.config.closed,
                onChange: onCfg('closed'),
              },
            },
            { collapsed: true }
          ),
          'FAS Simulation': folder(
            {
              [`${keyPrefix}_timeScale_${id}`]: {
                label: 'Time Scale',
                value: instance.config.timeScale,
                min: 0,
                max: 10,
                step: 0.1,
                onChange: onCfg('timeScale'),
              },
              [`${keyPrefix}_spawn_${id}`]: {
                label: 'Spawn Interval',
                value: instance.config.spawnIntervalMs,
                min: 50,
                max: 1000,
                step: 10,
                onChange: onCfg('spawnIntervalMs'),
              },
              [`${keyPrefix}_pathTravel_${id}`]: {
                label: 'Path Travel',
                value: instance.config.pathTravel,
                min: 0,
                max: 1,
                step: 0.01,
                onChange: onCfg('pathTravel'),
              },
              [`${keyPrefix}_worldScale_${id}`]: {
                label: 'World Scale',
                value: instance.config.worldScale,
                min: 0.001,
                max: 0.1,
                step: 0.001,
                onChange: onCfg('worldScale'),
              },
              [`${keyPrefix}_poolSize_${id}`]: {
                label: 'Pool Size',
                value: instance.config.poolSize,
                min: 8,
                max: 160,
                step: 8,
                onChange: onCfg('poolSize'),
              },
              [`${keyPrefix}_particleCount_${id}`]: {
                label: 'Particle Count',
                value: instance.config.particleCount,
                min: 100,
                max: 1000,
                step: 50,
                onChange: onCfg('particleCount'),
              },
              [`${keyPrefix}_particleSize_${id}`]: {
                label: 'Particle Size',
                value: instance.config.particleSize,
                min: 0.05,
                max: 4,
                step: 0.05,
                onChange: onCfg('particleSize'),
              },
              [`${keyPrefix}_particleSizeMin_${id}`]: {
                label: 'Particle Size Min',
                value: instance.config.particleSizeMin,
                min: 0.01,
                max: 4,
                step: 0.01,
                onChange: onCfg('particleSizeMin'),
              },
              [`${keyPrefix}_particleSizeMax_${id}`]: {
                label: 'Particle Size Max',
                value: instance.config.particleSizeMax,
                min: 0.01,
                max: 4,
                step: 0.01,
                onChange: onCfg('particleSizeMax'),
              },
              [`${keyPrefix}_particlePointScale_${id}`]: {
                label: 'Point Scale',
                value: instance.config.particlePointScale,
                min: 1,
                max: 100,
                step: 1,
                onChange: onCfg('particlePointScale'),
              },
              [`${keyPrefix}_particleSpread_${id}`]: {
                label: 'Particle Spread',
                value: instance.config.particleSpread,
                min: 0,
                max: 3,
                step: 0.05,
                onChange: onCfg('particleSpread'),
              },
              [`${keyPrefix}_particleColor_${id}`]: {
                label: 'Particle Color',
                value: instance.config.particleColor,
                onChange: onCfg('particleColor'),
              },
              [`${keyPrefix}_showParticles_${id}`]: {
                label: 'Show Particles',
                value: instance.config.showParticles,
                onChange: onCfg('showParticles'),
              },
            },
            { collapsed: true }
          ),
          'FAS Flame': folder(
            {
              [`${keyPrefix}_radiusMin_${id}`]: {
                label: 'Scale Min',
                value: instance.config.radiusMin,
                min: 0.05,
                max: 3,
                step: 0.01,
                onChange: onCfg('radiusMin'),
              },
              [`${keyPrefix}_radiusMax_${id}`]: {
                label: 'Scale Max',
                value: instance.config.radiusMax,
                min: 0.05,
                max: 3,
                step: 0.01,
                onChange: onCfg('radiusMax'),
              },
              [`${keyPrefix}_shapeRadiusMin_${id}`]: {
                label: 'Shape Radius Min',
                value: instance.config.shapeRadiusMin,
                min: 1,
                max: 20,
                step: 0.1,
                onChange: onCfg('shapeRadiusMin'),
              },
              [`${keyPrefix}_shapeRadiusMax_${id}`]: {
                label: 'Shape Radius Max',
                value: instance.config.shapeRadiusMax,
                min: 1,
                max: 20,
                step: 0.1,
                onChange: onCfg('shapeRadiusMax'),
              },
              [`${keyPrefix}_detailMin_${id}`]: {
                label: 'Detail Min',
                value: instance.config.detailMin,
                min: 1,
                max: 12,
                step: 0.1,
                onChange: onCfg('detailMin'),
              },
              [`${keyPrefix}_detailMax_${id}`]: {
                label: 'Detail Max',
                value: instance.config.detailMax,
                min: 1,
                max: 12,
                step: 0.1,
                onChange: onCfg('detailMax'),
              },
              [`${keyPrefix}_driftScale_${id}`]: {
                label: 'Drift Scale',
                value: instance.config.driftScale,
                min: 0,
                max: 1,
                step: 0.01,
                onChange: onCfg('driftScale'),
              },
              [`${keyPrefix}_riseScale_${id}`]: {
                label: 'Rise Scale',
                value: instance.config.riseScale,
                min: 0,
                max: 0.1,
                step: 0.001,
                onChange: onCfg('riseScale'),
              },
            },
            { collapsed: true }
          ),
          'FAS Colors': folder(
            {
              [`${keyPrefix}_light2_${id}`]: {
                label: 'Light 2',
                value: instance.config.lightColor2,
                onChange: onCfg('lightColor2'),
              },
              [`${keyPrefix}_light_${id}`]: {
                label: 'Light',
                value: instance.config.lightColor,
                onChange: onCfg('lightColor'),
              },
              [`${keyPrefix}_normal_${id}`]: {
                label: 'Normal',
                value: instance.config.normalColor,
                onChange: onCfg('normalColor'),
              },
              [`${keyPrefix}_dark2_${id}`]: {
                label: 'Dark 2',
                value: instance.config.darkColor2,
                onChange: onCfg('darkColor2'),
              },
              [`${keyPrefix}_grey_${id}`]: {
                label: 'Grey',
                value: instance.config.greyColor,
                onChange: onCfg('greyColor'),
              },
              [`${keyPrefix}_dark_${id}`]: {
                label: 'Dark',
                value: instance.config.darkColor,
                onChange: onCfg('darkColor'),
              },
            },
            { collapsed: true }
          ),
          ...(cloneInstance
            ? buildSplineInstanceActions({
                id,
                setInstances,
                keyPrefix,
                pointsKey: 'controlPoints',
                cloneInstance,
              })
            : {
                [`${keyPrefix}_delete_${id}`]: button(
                  () =>
                    setInstances((prev) =>
                      prev.filter((item) => item.id !== id)
                    ),
                  { label: 'Delete Instance' }
                ),
              }),
        },
        { collapsed: true }
      );

      return acc;
    }, {}),
  };
}
