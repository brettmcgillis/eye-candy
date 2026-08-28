import React, { forwardRef, memo, useEffect, useMemo, useRef } from 'react';

import {
  attribute,
  cross,
  dFdx,
  dFdy,
  float,
  mix,
  normalize,
  positionView,
  smoothstep,
  uniform,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { buildMembraneGeometry } from '@modules/rorschach';

// The canopy over a bundle's strands. Same lifecycle as TestStrokes: built
// once per bundle identity, written into by Test.jsx every frame, coloured
// through a mutated uniform so a colour edit never rebuilds the mesh.
const FADE_FRACTION = 0.5;
// Sheets composite under the strokes rather than fighting them for a place in
// three's transparent sort, which orders by object centroid — a poor proxy for
// a surface this large. Canopy behind, scaffold on top.
const MEMBRANE_RENDER_ORDER = -1;

const TestMembrane = forwardRef(function TestMembrane(
  {
    hsl,
    strandCount,
    steps,
    stepStride,
    strandStride,
    weave,
    opacity,
    tearDistance,
    tearSoftness,
    edgeFeather,
    taper,
    rim,
    tint,
    emissive,
    emissiveIntensity,
    visible = true,
  },
  ref
) {
  const colorUniformRef = useRef(null);
  const intensityUniformRef = useRef(null);
  const opacityUniformRef = useRef(null);
  const tearStartRef = useRef(null);
  const tearEndRef = useRef(null);
  const tearEnabledRef = useRef(null);
  const featherRef = useRef(null);
  const taperAmountRef = useRef(null);
  const taperDirRef = useRef(null);
  const rimRef = useRef(null);
  const materialRef = useRef(null);

  const mesh = useMemo(() => {
    const geometry = buildMembraneGeometry(strandCount, steps, {
      stepStride,
      strandStride,
      weave,
    });
    const material = new THREE.MeshBasicNodeMaterial({
      alphaTest: 0.005,
      transparent: true,
      side: THREE.DoubleSide,
      // One large mostly-transparent surface: writing depth lays an invisible
      // occluder over everything drawn after it, exactly as inkPaper documents.
      depthWrite: false,
      depthTest: true,
    });
    materialRef.current = material;

    const colorUniform = uniform(new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l));
    colorUniformRef.current = colorUniform;
    const intensityUniform = uniform(1);
    intensityUniformRef.current = intensityUniform;
    material.colorNode = colorUniform.mul(intensityUniform);

    const opacityUniform = uniform(1);
    opacityUniformRef.current = opacityUniform;
    const tearStart = uniform(1);
    const tearEnd = uniform(2);
    const tearEnabled = uniform(0);
    tearStartRef.current = tearStart;
    tearEndRef.current = tearEnd;
    tearEnabledRef.current = tearEnabled;

    const grownStepsUniform = uniform(1);
    const fadeWindow = grownStepsUniform.mul(FADE_FRACTION).max(1);
    const fadeLinear = attribute('stepIndex', 'float')
      .div(fadeWindow)
      .clamp(0, 1);
    const fadeEnabledUniform = uniform(0);

    const torn = float(1).sub(
      smoothstep(tearStart, tearEnd, attribute('edgeLength', 'float'))
    );

    // Feather 0 leaves the sheet square-edged; smoothstep's degenerate
    // zero-width edge would otherwise be undefined rather than a no-op.
    const feather = uniform(0);
    featherRef.current = feather;
    const feathered = smoothstep(
      float(0),
      feather.max(1e-5),
      attribute('edgeU', 'float')
    );

    // Ramp along the strand, so a canopy can thin out toward the tips (or the
    // root). Total steps, not grown steps — the ramp shouldn't slide as it grows.
    const taperAmount = uniform(0);
    const taperDir = uniform(0);
    taperAmountRef.current = taperAmount;
    taperDirRef.current = taperDir;
    const alongStrand = attribute('stepIndex', 'float')
      .div(Math.max(steps - 1, 1))
      .clamp(0, 1);
    const tapered = float(1).sub(
      taperAmount.mul(mix(alongStrand, float(1).sub(alongStrand), taperDir))
    );

    // Geometric normal from screen-space derivatives — no normal attribute to
    // rewrite as the sheet grows, and always correct. abs() because the sheet
    // is double-sided, so the derived normal may face either way.
    const rimUniform = uniform(0);
    rimRef.current = rimUniform;
    const faceNormal = normalize(cross(dFdx(positionView), dFdy(positionView)));
    const facing = faceNormal.dot(normalize(positionView).negate()).abs();
    const grazing = float(1).sub(facing).clamp(0, 1);

    material.opacityNode = opacityUniform
      .mul(mix(float(1), torn, tearEnabled))
      .mul(mix(float(1), feathered, feather.min(1)))
      .mul(tapered)
      .mul(mix(float(1), grazing, rimUniform))
      .mul(mix(float(1), fadeLinear.mul(fadeLinear), fadeEnabledUniform));

    const membrane = new THREE.Mesh(geometry, material);
    membrane.renderOrder = MEMBRANE_RENDER_ORDER;
    membrane.frustumCulled = false;
    membrane.userData.grownStepsUniform = grownStepsUniform;
    membrane.userData.fadeEnabledUniform = fadeEnabledUniform;
    return membrane;
    // hsl intentionally omitted — see TestStrokes.jsx.
  }, [strandCount, steps, stepStride, strandStride, weave]);

  // Tint offsets the sheet's lightness away from its bundle's stroke colour, so
  // canopy and scaffold read as two materials rather than one flat mass.
  useEffect(() => {
    colorUniformRef.current?.value.setHSL(
      hsl.h,
      hsl.s,
      THREE.MathUtils.clamp(hsl.l + tint, 0, 1)
    );
  }, [mesh, hsl.h, hsl.s, hsl.l, tint]);

  useEffect(() => {
    if (opacityUniformRef.current) opacityUniformRef.current.value = opacity;
  }, [mesh, opacity]);

  // Softness 0 collapses the smoothstep to a hard cut; 1 opens the gradient all
  // the way back to zero gap, so the sheet thins across its whole width.
  useEffect(() => {
    if (!tearEnabledRef.current) return;
    tearEnabledRef.current.value = tearDistance > 0 ? 1 : 0;
    const end = Math.max(tearDistance, 1e-4);
    tearEndRef.current.value = end;
    // A zero-width smoothstep is undefined in WGSL, so a hard cut is the
    // narrowest ramp the hardware will accept rather than literally no ramp.
    tearStartRef.current.value = Math.min(
      tearDistance * (1 - tearSoftness),
      end - 1e-4
    );
  }, [mesh, tearDistance, tearSoftness]);

  useEffect(() => {
    if (featherRef.current) featherRef.current.value = edgeFeather;
  }, [mesh, edgeFeather]);

  useEffect(() => {
    if (!taperAmountRef.current) return;
    taperAmountRef.current.value = Math.abs(taper);
    taperDirRef.current.value = taper < 0 ? 1 : 0;
  }, [mesh, taper]);

  useEffect(() => {
    if (rimRef.current) rimRef.current.value = rim;
  }, [mesh, rim]);

  useEffect(() => {
    if (intensityUniformRef.current) {
      intensityUniformRef.current.value = emissive ? emissiveIntensity : 1;
    }
    const material = materialRef.current;
    if (material && material.toneMapped !== !emissive) {
      material.toneMapped = !emissive;
      material.needsUpdate = true;
    }
  }, [mesh, emissive, emissiveIntensity]);

  return <primitive object={mesh} ref={ref} visible={visible} />;
});

export default memo(TestMembrane);
