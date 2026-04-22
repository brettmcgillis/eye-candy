/* eslint-disable no-underscore-dangle */
import { outline } from 'three/addons/tsl/display/OutlineNode.js';
import { mix, pass, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

/**
 * Proper TSL outline postprocess using Three.js OutlineNode.
 *
 * Performs real edge-detection (normals + depth discontinuities) on the
 * selected objects rather than a shell-mesh expansion. Correctly occludes
 * behind foreground geometry without any layer tricks.
 *
 * Props:
 *   targetRef        — React ref pointing at the THREE.Object3D to outline
 *   edgeStrength     — outline brightness multiplier (default 3)
 *   edgeThickness    — pixel spread of the edge (default 1)
 *   visibleEdgeColor — hex color for visible outline (default '#ffffff')
 *   hiddenEdgeColor  — hex color for occluded outline (default '#000000' = invisible)
 */
function OutlineTSL({
  targetRef,
  edgeStrength = 3,
  edgeGlow = 0.35,
  edgeThickness = 1,
  visibleEdgeColor = '#ffffff',
  hiddenEdgeColor = '#000000',
  hiddenEdgeStrength = 0,
}) {
  const { gl: renderer, scene, camera } = useThree();
  const postRef = useRef(null);
  const outlinePassRef = useRef(null);

  // Stable uniform objects — values pushed each frame
  const u = useMemo(
    () => ({
      strength: uniform(edgeStrength),
      visibleColor: uniform(new THREE.Color(visibleEdgeColor)),
      hiddenColor: uniform(new THREE.Color(hiddenEdgeColor)),
      hiddenStrength: uniform(hiddenEdgeStrength),
      glow: uniform(edgeGlow),
      thickness: uniform(edgeThickness),
    }),
    []
  );

  useEffect(() => {
    if (!renderer || !scene || !camera) return undefined;

    const op = outline(scene, camera, {
      selectedObjects: [],
      edgeGlow: u.glow,
      edgeThickness: u.thickness,
    });
    outlinePassRef.current = op;

    // The internal mask material defaults to FrontSide, which culls one side
    // of DoubleSide meshes (like the ghost cloth whose inner face is the
    // geometry's "front" face by winding order). This causes the outline to
    // follow the inner/back surface instead of the outer silhouette when
    // viewed from the front or sides.
    //
    // Forcing DoubleSide lets the hardware depth test in the mask buffer
    // pick the nearest face from any view angle, giving a correct outer
    // silhouette regardless of the mesh's winding convention.
    op._prepareMaskMaterial.side = THREE.DoubleSide;
    op._prepareMaskMaterial.needsUpdate = true;
    op._depthMaterial.side = THREE.DoubleSide;
    op._depthMaterial.needsUpdate = true;

    const { visibleEdge, hiddenEdge } = op;
    const outlineColor = visibleEdge
      .mul(u.visibleColor)
      .add(hiddenEdge.mul(u.hiddenColor).mul(u.hiddenStrength))
      .mul(u.strength);
    const edgeMask = visibleEdge
      .add(hiddenEdge.mul(u.hiddenStrength))
      .mul(u.strength)
      .clamp(0, 1);

    const scenePass = pass(scene, camera);

    const postProcessing = new THREE.PostProcessing(renderer);
    // Additive composition cannot darken pixels, so black outlines vanish on
    // bright backgrounds. Blend with an edge mask so dark outline colors work.
    postProcessing.outputNode = mix(scenePass, outlineColor, edgeMask);
    postRef.current = postProcessing;

    return () => {
      postRef.current = null;
      outlinePassRef.current = null;
    };
  }, [renderer, scene, camera, u]);

  useFrame(() => {
    const post = postRef.current;
    const op = outlinePassRef.current;
    if (!post || !op) return;

    // Support either a raw Object3D ref or an imperative ref exposing .mesh.
    const target = targetRef?.current?.mesh || targetRef?.current;

    // Set selected objects from the live ref each frame
    if (target) {
      op.selectedObjects = [target];
    } else {
      op.selectedObjects = [];
    }

    // Push prop values into GPU uniforms
    u.strength.value = edgeStrength;
    u.visibleColor.value.set(visibleEdgeColor);
    u.hiddenColor.value.set(hiddenEdgeColor);
    u.hiddenStrength.value = hiddenEdgeStrength;
    u.glow.value = edgeGlow;
    u.thickness.value = edgeThickness;

    post.render();
  }, 1);

  return null;
}

export default memo(OutlineTSL);
