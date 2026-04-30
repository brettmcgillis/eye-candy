import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { BallCollider, CuboidCollider, RigidBody } from '@react-three/rapier';

import Label3D from './Label3D';

// Field dimensions
const FIELD_W = 30; // x
const FIELD_D = 20; // z
const WALL_H = 1.5;
const WALL_T = 0.3;
const FLOOR_Y = -1; // matches scene floor
const PITCH_Y = FLOOR_Y + 0.01; // sits just on top of the floor
const WALL_TOP_Y = FLOOR_Y + WALL_H / 2;
const BALL_RADIUS = 0.35;

// Goal dimensions
const GOAL_W = 6;
const GOAL_H = 2.5;
const GOAL_D = 1.8;
const POST_R = 0.12;

function GoalPost({ position, facingZ, onGoal }) {
  // facingZ: +1 = goal opens toward +z, -1 = opens toward -z
  const barY = FLOOR_Y + GOAL_H;
  const postBaseY = FLOOR_Y + GOAL_H / 2;
  const sideZ = facingZ * (GOAL_D / 2);
  const leftX = -GOAL_W / 2;
  const rightX = GOAL_W / 2;

  const handleIntersection = (payload) => {
    if (payload.other.rigidBody?.userData?.isSoccerBall) onGoal?.();
  };

  return (
    <RigidBody type="fixed" position={position}>
      {/* crossbar */}
      <mesh position={[0, barY, sideZ]} castShadow receiveShadow>
        <boxGeometry args={[GOAL_W + POST_R * 2, POST_R * 2, POST_R * 2]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* left post */}
      <mesh position={[leftX, postBaseY, sideZ]} castShadow receiveShadow>
        <boxGeometry args={[POST_R * 2, GOAL_H, POST_R * 2]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* right post */}
      <mesh position={[rightX, postBaseY, sideZ]} castShadow receiveShadow>
        <boxGeometry args={[POST_R * 2, GOAL_H, POST_R * 2]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* sensor inside goal mouth */}
      <CuboidCollider
        args={[GOAL_W / 2 - POST_R, GOAL_H / 2, GOAL_D / 2 - POST_R]}
        position={[0, postBaseY, 0]}
        sensor
        onIntersectionEnter={handleIntersection}
      />
    </RigidBody>
  );
}

const SoccerBall = forwardRef(function SoccerBall(
  { position: localPos, worldPos, onScore },
  ref
) {
  const rb = useRef(null);
  const lastReset = useRef(0);

  const reset = () => {
    if (!rb.current) return;
    rb.current.setTranslation({ x: worldPos[0], y: 2, z: worldPos[2] }, true);
    rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
  };

  useImperativeHandle(ref, () => ({ reset }));

  useFrame(({ clock }) => {
    if (!rb.current) return;
    const t = rb.current.translation();
    // If ball escapes the field reset it (shouldn't normally happen due to walls)
    const halfW = FIELD_W / 2 + 2;
    const halfD = FIELD_D / 2 + 2;
    if (
      Math.abs(t.x - worldPos[0]) > halfW ||
      Math.abs(t.z - worldPos[2]) > halfD ||
      t.y < worldPos[1] - 3
    ) {
      if (clock.elapsedTime - lastReset.current > 1) {
        lastReset.current = clock.elapsedTime;
        reset();
        onScore?.('reset');
      }
    }
  });

  return (
    <RigidBody
      ref={rb}
      position={localPos}
      userData={{ isSoccerBall: true }}
      colliders={false}
      restitution={0.8}
      friction={0.4}
      linearDamping={0.3}
      angularDamping={0.4}
      mass={0.45}
    >
      <BallCollider args={[BALL_RADIUS]} />
      <mesh castShadow>
        <sphereGeometry args={[BALL_RADIUS, 16, 16]} />
        <meshStandardMaterial color="white" roughness={0.4} metalness={0.05} />
      </mesh>
      {/* black pentagon patches */}
      <mesh>
        <sphereGeometry args={[BALL_RADIUS + 0.001, 16, 16]} />
        <meshStandardMaterial
          color="black"
          wireframe
          transparent
          opacity={0.25}
        />
      </mesh>
    </RigidBody>
  );
});

export default function SoccerField({ position = [0, 0, 40] }) {
  const { gl } = useThree();
  const isWebGPU = gl?.isWebGPURenderer === true;
  const [score, setScore] = useState({ home: 0, away: 0 });
  const scoreRef = useRef({ home: 0, away: 0 });
  const [lastGoal, setLastGoal] = useState(null);
  const ballRef = useRef(null);

  const px = position[0];
  const py = position[1];
  const pz = position[2];

  const halfW = FIELD_W / 2;
  const halfD = FIELD_D / 2;

  const handleGoalHome = () => {
    scoreRef.current = {
      ...scoreRef.current,
      home: scoreRef.current.home + 1,
    };
    setScore({ ...scoreRef.current });
    setLastGoal('HOME');
    ballRef.current?.reset();
    setTimeout(() => setLastGoal(null), 2500);
  };

  const handleGoalAway = () => {
    scoreRef.current = {
      ...scoreRef.current,
      away: scoreRef.current.away + 1,
    };
    setScore({ ...scoreRef.current });
    setLastGoal('AWAY');
    ballRef.current?.reset();
    setTimeout(() => setLastGoal(null), 2500);
  };

  const scoreText = `${score.home}  —  ${score.away}`;

  return (
    <group position={[px, py, pz]}>
      {/* ── Pitch surface ── */}
      <mesh
        position={[0, PITCH_Y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[FIELD_W, FIELD_D]} />
        <meshStandardMaterial color="#3a7d44" roughness={0.9} />
      </mesh>

      {/* Centre line */}
      <mesh position={[0, PITCH_Y + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.12, FIELD_D]} />
        <meshStandardMaterial color="white" transparent opacity={0.6} />
      </mesh>

      {/* Centre circle */}
      <mesh position={[0, PITCH_Y + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 3.15, 48]} />
        <meshStandardMaterial color="white" transparent opacity={0.6} />
      </mesh>

      {/* Score display on pitch floor */}
      {isWebGPU ? (
        <Label3D
          text={scoreText}
          color="white"
          maxWidth={8}
          position={[0, PITCH_Y + 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      ) : (
        <Text
          position={[0, PITCH_Y + 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={1.6}
          color="white"
          anchorX="center"
          anchorY="middle"
          userData={{ camExcludeCollision: true }}
        >
          {scoreText}
        </Text>
      )}

      {/* Goal flash label */}
      {lastGoal &&
        (isWebGPU ? (
          <Label3D
            text={`GOAL! — ${lastGoal}`}
            color="#ffdd00"
            maxWidth={8}
            position={[0, FLOOR_Y + 4, 0]}
          />
        ) : (
          <Text
            position={[0, FLOOR_Y + 4, 0]}
            fontSize={1.4}
            color="#ffdd00"
            anchorX="center"
            anchorY="middle"
            userData={{ camExcludeCollision: true }}
          >
            {`GOAL! — ${lastGoal}`}
          </Text>
        ))}

      {/* ── Perimeter walls ── */}
      {/* +Z wall */}
      <RigidBody type="fixed">
        <mesh position={[0, WALL_TOP_Y, halfD + WALL_T / 2]} receiveShadow>
          <boxGeometry args={[FIELD_W + WALL_T * 2, WALL_H, WALL_T]} />
          <meshStandardMaterial color="#2e6b39" />
        </mesh>
      </RigidBody>
      {/* -Z wall */}
      <RigidBody type="fixed">
        <mesh position={[0, WALL_TOP_Y, -(halfD + WALL_T / 2)]} receiveShadow>
          <boxGeometry args={[FIELD_W + WALL_T * 2, WALL_H, WALL_T]} />
          <meshStandardMaterial color="#2e6b39" />
        </mesh>
      </RigidBody>
      {/* +X wall */}
      <RigidBody type="fixed">
        <mesh position={[halfW + WALL_T / 2, WALL_TOP_Y, 0]} receiveShadow>
          <boxGeometry args={[WALL_T, WALL_H, FIELD_D]} />
          <meshStandardMaterial color="#2e6b39" />
        </mesh>
      </RigidBody>
      {/* -X wall */}
      <RigidBody type="fixed">
        <mesh position={[-(halfW + WALL_T / 2), WALL_TOP_Y, 0]} receiveShadow>
          <boxGeometry args={[WALL_T, WALL_H, FIELD_D]} />
          <meshStandardMaterial color="#2e6b39" />
        </mesh>
      </RigidBody>
      {/* ── Goals with sensors (aligned with net, ball-only) ── */}
      <GoalPost position={[0, 0, -halfD]} facingZ={1} onGoal={handleGoalHome} />
      <GoalPost position={[0, 0, halfD]} facingZ={-1} onGoal={handleGoalAway} />

      {/* ── Ball ── */}
      <SoccerBall
        ref={ballRef}
        position={[0, FLOOR_Y + BALL_RADIUS + 0.1, 0]}
        worldPos={[px, py + FLOOR_Y + BALL_RADIUS + 0.1, pz]}
        onScore={() => {}}
      />
    </group>
  );
}
