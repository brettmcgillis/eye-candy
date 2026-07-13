import React, { memo, useRef } from 'react';

import CameraRig from '../../../../rigging/CameraRig';
import FieldLines from './components/FieldLines';
import LeafSwarm from './components/LeafSwarm';
import PhysicalAttractorMarkers from './components/PhysicalAttractorMarkers';
import useSceneControls from './hooks/useSceneControls';

// Strange attractors mode: a Thomas Labyrinth vector field driving a
// GPU-compute swarm of cartoon leaves & sakura petals, plus CPU-stepped
// streamlines tracing the same field. Physical attractors mode: draggable
// gravity+spin attractor markers pulling the same swarm (see todo.md). The
// god-rayed centerpiece light, the procedural tree, and the mossy/vined
// ground are deliberate later passes.
function Windswept() {
  const config = useSceneControls();
  // Shared with LeafSwarm (reads it for physics) and PhysicalAttractorMarkers
  // (owns/drags it) — lifted here since both are siblings.
  const attractorsRef = useRef([]);

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={['#05070c']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[6, 10, 4]} intensity={1.1} />
      <FieldLines config={config} />
      <PhysicalAttractorMarkers attractorsRef={attractorsRef} config={config} />
      <LeafSwarm attractorsRef={attractorsRef} config={config} />
    </>
  );
}

export default memo(Windswept);
