import createClothCpu from '@elements/WebGPU/cloth/clothCpu';
import {
  buildClothTopology,
  computeClothAlpha,
} from '@elements/WebGPU/cloth/clothTopology';
import {
  createGhostRigState,
  earAnchorPositions,
  ghostAnchors,
  ghostColliders,
  ghostPins,
  handRest,
  headCentre,
  stepGhostRig,
} from '@elements/WebGPU/ghost/ghostRig';

const FPS = 60;
// ClothMesh steps at 360 Hz: six sim steps per 60 fps frame, all reading the
// frame's `time`.
const STEPS_PER_FRAME = 6;
const DEG = Math.PI / 180;

// Euler XYZ with no Y turn: R = Rx · Rz.
export function rotateXZ(rx, rz, x, y, z) {
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const cz = Math.cos(rz);
  const sz = Math.sin(rz);
  const x1 = cz * x - sz * y;
  const y1 = sz * x + cz * y;
  return [x1, cx * y1 - sx * z, sx * y1 + cx * z];
}

// World down seen from inside the rotated group, as ClothMesh computes it
// from the mesh's world quaternion.
function localDown(rx, rz) {
  const ca = Math.cos(rx);
  const sa = Math.sin(rx);
  return [-Math.sin(rz) * ca, -Math.cos(rz) * ca, sa];
}

// Runs GhostCharacter's frame loop over the CPU cloth mirror until the
// capture time, and returns the sim plus the group transform at that frame.
export default function settleGhost(p, pose) {
  const segments = p.clothSegments;
  const head = headCentre();
  const hands = handRest(p);
  const ears = earAnchorPositions(p);
  const anchors = ghostAnchors(p, {
    earLeft: ears.left,
    earRight: ears.right,
    handLeft: hands.left,
    handRight: hands.right,
    head,
  });
  const colliders = ghostColliders(p, {
    handLeft: hands.left,
    handRight: hands.right,
    head,
  });
  const topology = buildClothTopology({
    anchors,
    centered: true,
    height: p.clothHeight,
    orientation: 'horizontal',
    pins: ghostPins(segments, segments),
    segmentsX: segments,
    segmentsY: segments,
    shape: 'circle',
    width: p.clothWidth,
  });
  const alpha = computeClothAlpha(topology, {
    edgeFade: p.edgeFade,
    holeAmount: p.holeAmount,
    scale: p.alphaScale,
    seed: p.alphaSeed,
    smoothEdges: p.smoothEdges,
    tatterEdge: p.tatterEdge,
  });
  const cloth = createClothCpu(topology, { alpha: alpha.alpha });
  const rig = createGhostRigState();
  const rigParams = {
    ...p,
    bobAmplitude: pose.calm ? 0 : p.bobAmplitude,
    swayAmplitude: pose.calm ? 0 : p.swayAmplitude,
  };

  const frames = Math.max(1, Math.round(pose.settle * FPS));
  const animationFrom =
    pose.animation === 'none'
      ? Infinity
      : frames - Math.round(pose.animationAt * FPS);
  const windAngle = pose.windAngle * DEG;
  const input = {
    windDirX: Math.cos(windAngle),
    windDirZ: Math.sin(windAngle),
    windStrength: pose.windStrength,
  };
  let frame = null;
  let rotationX = 0;

  for (let f = 0; f < frames; f += 1) {
    input.animation = f >= animationFrom ? pose.animation : null;
    frame = stepGhostRig(rig, 1 / FPS, input, rigParams, hands);
    rotationX = frame.rotationX + pose.lean * DEG;
    const state = {
      anchors: anchors.map(({ position }) => [
        position.x,
        position.y,
        position.z,
      ]),
      collisionMargin: p.collisionMargin,
      colliders: colliders.map(({ position, radius }) => ({
        radius,
        x: position.x,
        y: position.y,
        z: position.z,
      })),
      dampening: p.dampening,
      gravity: p.gravity * frame.gravityScale,
      gravityDir: localDown(rotationX, frame.rotationZ),
      maxVelocity: p.maxVelocity,
      stiffness: p.stiffness,
      time: f / FPS,
      wind: frame.windStrength,
      windAmplitude: p.windAmplitude,
      windDir: frame.windDir ?? [1, 0, 0],
    };
    for (let s = 0; s < STEPS_PER_FRAME; s += 1) cloth.step(state);
  }

  return {
    alpha,
    head,
    pos: cloth.pos,
    topology,
    transform: {
      rotationX,
      rotationZ: frame.rotationZ,
      squash: frame.squash,
    },
  };
}
