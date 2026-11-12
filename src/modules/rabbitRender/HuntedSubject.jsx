import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { POSE_TIME, layoutVolley } from '@modules/rabbit';
import { ShadowFloor } from '@modules/renderStage';

import Arrows, { createTie } from './Arrows';
import GrazeGrass from './GrazeGrass';
import HuntedRabbit from './HuntedRabbit';
import PaintedGround from './PaintedGround';
import Ribbon from './Ribbon';
import { fitBodyCapsules } from './bodyCapsules';
import { createWoundUniforms } from './materials';
import createPoseProbe from './poseProbe';

export const FLOOR_Y = 0;
// The clip's feet sit this far below the model origin.
const RABBIT_POSITION = [0, 0.016, 0];
const RABBIT_SCALE = 0.01;
const SUBJECT = { plotPart: 'subject' };

// The hunted rabbit, his volley of arrows, the ribbon and the graze grass on
// a shadow-catching floor: what the Stay Hunted scene draws and what
// RabbitCLI renders. `config` is a generation's scene keys; the clip starts
// at `startTime` and plays while `playing`; `handles` (a plain object) is
// filled with what a capture reads back.
export default function HuntedSubject({
  config,
  handles: given = null,
  playing = true,
  startTime = 0,
}) {
  const wounds = useMemo(createWoundUniforms, []);
  const tie = useMemo(createTie, []);
  const own = useMemo(() => ({}), []);
  const handles = given ?? own;
  const [model, setModel] = useState(null);
  const [tieReady, setTieReady] = useState(false);
  const probe = useMemo(() => model && createPoseProbe(model), [model]);
  useEffect(() => () => probe?.dispose(), [probe]);
  const capsules = useMemo(() => {
    if (!probe) return null;
    probe.pose(POSE_TIME);
    return fitBodyCapsules(probe.mesh);
  }, [probe]);

  const volley = useMemo(
    () => layoutVolley(config),
    [
      config.arrowCount,
      config.volley,
      config.volleyAzimuth,
      config.volleyElevation,
      config.volleyFan,
      config.volleySeed,
      config.volleySpread,
    ]
  );
  const volleyKey = useMemo(() => JSON.stringify(volley), [volley]);
  useEffect(() => setTieReady(false), [volleyKey]);

  useEffect(() => {
    wounds.strength.value = config.woundBloom ? config.woundStrength : 0;
  }, [config.woundBloom, config.woundStrength, wounds]);

  useEffect(() => {
    if (!probe) return;
    Object.assign(handles, {
      model,
      rabbit: probe.liveMesh,
      rabbitRoot: model.scene.parent,
    });
  }, [handles, model, probe]);

  const handleReady = useCallback((next) => setModel(next), []);
  const handleTieReady = useCallback(() => setTieReady(true), []);
  const subjectRef = useCallback(
    (group) => {
      // eslint-disable-next-line no-param-reassign
      handles.subject = group;
    },
    [handles]
  );

  return (
    <>
      <ShadowFloor
        color="#4a3f36"
        opacity={config.shadowOpacity}
        size={6}
        y={FLOOR_Y}
      />
      {config.paintStyle && config.paintStyle !== 'original' && (
        <PaintedGround config={config} floorY={FLOOR_Y} />
      )}
      <group ref={subjectRef} userData={SUBJECT}>
        <HuntedRabbit
          paintConfig={config}
          furEnabled={config.furEnabled}
          furLength={config.furLength}
          onReady={handleReady}
          outlineColor={config.outlineColor}
          outlineWidth={config.outlineWidth}
          playing={playing}
          position={RABBIT_POSITION}
          scale={RABBIT_SCALE}
          startTime={startTime}
          wounds={wounds}
        />

        {probe && (
          <>
            <Arrows
              paintConfig={config}
              capsules={capsules}
              damping={config.arrowDamping}
              floorY={FLOOR_Y}
              handles={handles}
              key={volleyKey}
              model={model}
              onTieReady={handleTieReady}
              outlineColor={config.outlineColor}
              outlineWidth={config.outlineWidth * 0.5}
              probe={probe}
              stiffness={config.arrowStiffness}
              tie={tie}
              volley={volley}
              wounds={wounds}
            />
            <GrazeGrass
              paintConfig={config}
              capsules={capsules}
              floorY={FLOOR_Y}
              handles={handles}
              height={config.grassHeight}
              probe={probe}
              push={config.grassPush}
              rootColor={config.grassRootColor}
              tipColor={config.grassTipColor}
              wind={config.grassWind}
            />
          </>
        )}

        {tieReady && (
          <Ribbon
            paintConfig={config}
            bend={config.ribbonBend}
            drag={config.ribbonDrag}
            floorY={FLOOR_Y}
            handles={handles}
            key={volleyKey}
            tie={tie}
            windSpeed={config.ribbonWind}
          />
        )}
      </group>
    </>
  );
}
