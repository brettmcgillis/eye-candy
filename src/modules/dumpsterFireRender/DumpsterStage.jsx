import React, { useLayoutEffect, useMemo, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import {
  DUMPSTER_LEFT_LID_PIVOT_POSITION,
  DUMPSTER_RIGHT_LID_PIVOT_POSITION,
  DumpsterLeftLid,
  DumpsterRightLid,
  DumpsterShell,
} from '@elements/Dumpster/Dumpster';
import FireAndSmoke from '@elements/FireAndSmoke/FireAndSmoke';
import SmokeParticles from '@elements/Smoke/SmokeParticles';
import VolumetricSmokeParticles from '@elements/Smoke/VolumetricSmokeParticles';
import {
  BRICK_WALL_POSITION,
  DECOR_RUG,
  DUMPSTER_LID_RANGE_DEG,
  DUMPSTER_POSITION,
  LIGHTING,
  SCENE_ROOT_POSITION,
  SIDEWALK_GROUND,
  layoutTrash,
  layoutWall,
  restSurface,
} from '@modules/dumpsterFire';
import { Backdrop, StudioEnvironment } from '@modules/renderStage';
import { createPropAsset, createTrashAsset } from '@modules/trashCatalog';

import FireLights, { DEFAULT_FIRE_LIGHT_RIG } from './FireLights';
import SidewalkGround from './SidewalkGround';
import useCinderblocks from './cinderblocks';
import { applySmokeGeneration, authoredSmoke } from './smokeGeneration';

const DEG = Math.PI / 180;
const NIGHT_SMOKE = { particleColor: '#d4d9df', volColor: '#b8c0ca' };
const FIRE_LIGHT = { day: 12, night: 18 };

const lidAngle = (angle) =>
  Math.min(
    DUMPSTER_LID_RANGE_DEG[1] * DEG,
    Math.max(DUMPSTER_LID_RANGE_DEG[0] * DEG, angle)
  );

const DUMPSTER_SCALE = createPropAsset('dumpster').scale ?? 1;

const lidPivot = ([x, y, z]) => [
  x * 0.01 * DUMPSTER_SCALE,
  z * 0.01 * DUMPSTER_SCALE,
  -y * 0.01 * DUMPSTER_SCALE,
];

function Fog({ color, far, near }) {
  const scene = useThree((state) => state.scene);
  useLayoutEffect(() => {
    scene.fog = new THREE.Fog(color, Math.min(near, far), Math.max(near, far));
    return () => {
      scene.fog = null;
    };
  }, [color, far, near, scene]);
  return null;
}

// The scene's ArticulatedDumpster without its bodies: the shell, and each
// lid hinged at its pivot, at the catalog's dumpster scale.
function StaticDumpster({ leftLidRotation, rightLidRotation }) {
  return (
    <group position={DUMPSTER_POSITION} userData={{ plotObject: 'dumpster' }}>
      <DumpsterShell
        frontLeftWheelRotation={Math.PI}
        frontRightWheelRotation={0}
        rearLeftWheelRotation={Math.PI}
        rearRightWheelRotation={0}
        scale={DUMPSTER_SCALE}
      />
      <group
        position={lidPivot(DUMPSTER_LEFT_LID_PIVOT_POSITION)}
        rotation={[lidAngle(leftLidRotation), 0, 0]}
      >
        <DumpsterLeftLid pivotPosition={[0, 0, 0]} scale={DUMPSTER_SCALE} />
      </group>
      <group
        position={lidPivot(DUMPSTER_RIGHT_LID_PIVOT_POSITION)}
        rotation={[lidAngle(rightLidRotation), 0, 0]}
      >
        <DumpsterRightLid pivotPosition={[0, 0, 0]} scale={DUMPSTER_SCALE} />
      </group>
    </group>
  );
}

const box = new THREE.Box3();

// A piece the scene drops with physics, set down instead: its lowest vertex
// on the rug or the ground under it, keeping its pose.
function TrashPiece({ item }) {
  const ref = useRef(null);
  const asset =
    item.body === 'dynamic'
      ? createTrashAsset(item.key)
      : createPropAsset(item.key);
  const { Component, componentProps, scale = 1 } = asset;

  useLayoutEffect(() => {
    const group = ref.current;
    if (!item.drop || !group) return;
    const [x, y, z] = item.position;
    group.position.y = y;
    group.updateWorldMatrix(true, true);
    box.setFromObject(group, true);
    if (box.isEmpty()) return;
    const ground = SCENE_ROOT_POSITION[1] + restSurface(x, z);
    group.position.y += ground - box.min.y;
    group.updateMatrixWorld(true);
  }, [item]);

  return (
    <group
      position={item.position}
      ref={ref}
      rotation={item.rotation}
      scale={scale}
      userData={{ plotObject: item.key }}
    >
      <Component {...componentProps} />
    </group>
  );
}

function WallBlocks({ blocks, variant }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    blocks.forEach((block, i) => {
      dummy.position.set(...block.position);
      dummy.rotation.set(...block.rotation);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [blocks]);
  if (!blocks.length) return null;
  return (
    <instancedMesh
      args={[variant.geometry, variant.material, blocks.length]}
      castShadow
      frustumCulled={false}
      receiveShadow
      ref={ref}
      userData={{ plotObject: 'wall', plotPerInstance: true }}
    />
  );
}

function Wall({ config }) {
  const variants = useCinderblocks(config.brickWallTintColor);
  const blocks = useMemo(
    () => layoutWall(config),
    [
      config.brickWallCrumble,
      config.brickWallEnabled,
      config.brickWallHeight,
      config.brickWallHoles,
      config.brickWallLength,
      config.brickWallRubble,
      config.brickWallSeed,
    ]
  );
  return (
    <group position={[BRICK_WALL_POSITION.x, 0, BRICK_WALL_POSITION.z]}>
      {variants.map((variant) => (
        <WallBlocks
          blocks={blocks.filter((block) => block.variant === variant.index)}
          key={variant.index}
          variant={variant}
        />
      ))}
    </group>
  );
}

function Smoke({ config, fireLight }) {
  const smoke = useMemo(
    () => applySmokeGeneration(authoredSmoke(), config),
    [
      config.smokeJitter,
      config.smokeLean,
      config.smokeMirror,
      config.smokeReach,
      config.smokeSeed,
      config.smokeSway,
      config.smokeSystem,
      config.smokeWaves,
    ]
  );
  const night = config.mood === 'night';
  return (
    <group position={SCENE_ROOT_POSITION}>
      {smoke.fireAndSmokeInstances
        .filter((instance) => instance.visible !== false)
        .map((instance) => {
          const fire = /fire/i.test(instance.name ?? '');
          return (
            <group
              key={instance.name}
              position={instance.pos}
              rotation={instance.rot}
              scale={instance.scale}
              userData={{ effect: fire ? 'fire' : 'plume' }}
            >
              <FireAndSmoke
                controlPoints={instance.controlPoints}
                {...instance.config}
              />
              {fire && config.fireLight !== false ? (
                <FireLights
                  rig={{ ...DEFAULT_FIRE_LIGHT_RIG, intensity: fireLight }}
                />
              ) : null}
            </group>
          );
        })}
      {smoke.particleSmokeSplines.map((spline, i) => {
        const smokeConfig = {
          ...smoke.particleSmokeConfigs[i],
          ...(night && NIGHT_SMOKE),
          pointMode: 'translate',
          prefillOnStart: true,
        };
        if (smokeConfig.visible === false) return null;
        const points = spline.points.map((point) => point.position);
        const rotations = spline.points.map((point) => point.rotation);
        const scales = spline.points.map((point) => point.scale);
        const type = smokeConfig.smokeType;
        return (
          <group
            key={smokeConfig.name ?? i}
            position={spline.pos}
            rotation={spline.rot}
            scale={spline.scale}
            userData={{ effect: 'particles' }}
          >
            {type === 'Particle' || type === 'Both' ? (
              <SmokeParticles
                config={smokeConfig}
                pointRotations={rotations}
                pointScales={scales}
                points={points}
              />
            ) : null}
            {type === 'Volumetric' || type === 'Both' ? (
              <VolumetricSmokeParticles
                config={smokeConfig}
                pointRotations={rotations}
                pointScales={scales}
                points={points}
              />
            ) : null}
          </group>
        );
      })}
    </group>
  );
}

function RugComponent() {
  const { Component, componentProps } = createPropAsset('persian-rug');
  return <Component {...componentProps} />;
}

// The DumpsterFire scene as a still life: its dumpster, litter, wall,
// sidewalk, fire and smoke laid out by a generation, with no physics, no
// camera rig and no interaction. What DumpsterFireCLI renders headlessly
// and its Live tab renders in the page. `solidsRef` reaches the solid
// pieces (each tagged `userData.plotObject`) and `effectsRef` the fire and
// smoke (tagged `userData.effect`), for capture.
export default function DumpsterStage({ config, effectsRef, solidsRef }) {
  const trash = useMemo(
    () => layoutTrash(config),
    [
      config.dumpsterContents,
      config.trashBags,
      config.trashFixed,
      config.trashHuddle,
      config.trashLayout,
      config.trashLoose,
      config.trashSeed,
      config.trashSpread,
      config.trashStacks,
    ]
  );
  const fireLight = FIRE_LIGHT[config.mood] ?? FIRE_LIGHT.day;

  return (
    <>
      <Backdrop color={config.sceneBackgroundColor} />
      <Fog
        color={config.sceneFogColor}
        far={config.sceneFogFar}
        near={config.sceneFogNear}
      />
      <ambientLight intensity={config.sceneAmbientIntensity} />
      <directionalLight
        intensity={config.sceneDirectionalIntensity}
        position={LIGHTING.directionalPosition}
      />
      <StudioEnvironment intensity={config.sceneEnvMapIntensity} />

      <group ref={solidsRef}>
        <group userData={{ plotObject: 'sidewalk', plotSidewalk: true }}>
          <SidewalkGround config={SIDEWALK_GROUND} />
        </group>
        <group position={SCENE_ROOT_POSITION}>
          <StaticDumpster
            leftLidRotation={config.dumpsterLeftLidRotation}
            rightLidRotation={config.dumpsterRightLidRotation}
          />
          <group
            position={DECOR_RUG.position}
            rotation={DECOR_RUG.rotation}
            scale={DECOR_RUG.scale}
            userData={{ plotObject: 'rug' }}
          >
            <RugComponent />
          </group>
          {[...trash.fixed, ...trash.dynamic].map((item) => (
            <TrashPiece
              item={item}
              key={item.id ?? `${item.key}-${item.position.join(',')}`}
            />
          ))}
          {config.brickWallEnabled ? <Wall config={config} /> : null}
        </group>
      </group>

      <group ref={effectsRef}>
        <Smoke config={config} fireLight={fireLight} />
      </group>
    </>
  );
}
