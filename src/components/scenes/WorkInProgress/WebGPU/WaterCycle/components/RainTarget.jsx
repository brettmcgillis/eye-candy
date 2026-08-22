import * as THREE from 'three/webgpu';

import { memo, useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import useTargetNodes from '../hooks/useTargetNodes';
import createGhostMaterial from '../utils/ghostMaterial';
import createHeightProbe from '../utils/heightProbe';
import {
  bakeNodeGeometry,
  createPrimitiveGeometry,
} from '../utils/targetGeometry';

const PROBE_RESOLUTION = 1024;

// Targets arrive at wildly different authored scales — a logo extrusion is ~1.5
// units across, a torus ~25 — so every one is fitted to the same footprint and
// centred. That keeps `targetScale` meaning the same thing whatever is loaded.
const FIT_EXTENT = 22;

function measure(geometries) {
  const bounds = new THREE.Box3();

  geometries.forEach((geometry) => {
    geometry.computeBoundingBox();
    bounds.union(geometry.boundingBox);
  });

  // Fitted by bounding sphere, not by footprint: tilt swings the vertical
  // extent into XZ, so a footprint-based fit lets an upright target grow past
  // the probe area the moment it is rotated.
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());

  return {
    centre: bounds.getCenter(new THREE.Vector3()),
    fit: FIT_EXTENT / Math.max(sphere.radius * 2, 1e-4),
  };
}

function buildTarget(geometries, material, { centre, fit }) {
  const fitted = new THREE.Group();

  geometries.forEach((geometry) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(centre).negate();
    fitted.add(mesh);
  });
  fitted.scale.setScalar(fit);

  const tilt = new THREE.Group();
  const pivot = new THREE.Group();

  tilt.add(fitted);
  pivot.add(tilt);

  return {
    pivot,
    apply(target, spin) {
      tilt.rotation.x = target.tilt;
      pivot.rotation.y = spin;
      pivot.position.y = target.height;
      pivot.scale.setScalar(target.scale);
    },
  };
}

// The target drives the height probe and is otherwise invisible — the rain is
// the only thing that describes its shape. The reveal toggle adds a second
// hierarchy over the same geometry purely so the shape can be lined up by eye.
function RainTarget({ config, onReady }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const runtimeRef = useRef(null);
  const spinRef = useRef(0);
  const { mode } = config.target;
  const nodes = useTargetNodes(mode);

  useEffect(() => {
    if (!gl?.isWebGPURenderer) {
      return undefined;
    }

    const geometries = nodes
      ? nodes.map(bakeNodeGeometry)
      : [createPrimitiveGeometry(mode)];
    const layout = measure(geometries);
    const probe = createHeightProbe({ resolution: PROBE_RESOLUTION });

    const bakeMaterial = new THREE.MeshBasicMaterial();
    const ghostMaterial = createGhostMaterial();
    const baked = buildTarget(geometries, bakeMaterial, layout);
    const ghost = buildTarget(geometries, ghostMaterial, layout);

    ghost.pivot.visible = false;
    ghost.pivot.renderOrder = -1;

    probe.scene.add(baked.pivot);
    scene.add(ghost.pivot);

    runtimeRef.current = { baked, ghost, probe };
    onReady?.({ probe });

    return () => {
      runtimeRef.current = null;
      onReady?.(null);
      scene.remove(ghost.pivot);
      geometries.forEach((geometry) => geometry.dispose());
      bakeMaterial.dispose();
      ghostMaterial.dispose();
      probe.dispose();
    };
  }, [gl, mode, nodes, onReady, scene]);

  useFrame((state, delta) => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      return;
    }

    const { target } = config;

    spinRef.current += delta * target.spinSpeed;

    runtime.baked.apply(target, spinRef.current);
    runtime.ghost.apply(target, spinRef.current);
    runtime.ghost.pivot.visible = target.reveal === true;

    runtime.probe.setArea(target.probeArea);
    runtime.probe.bake(gl);
  });

  return null;
}

export default memo(RainTarget);
