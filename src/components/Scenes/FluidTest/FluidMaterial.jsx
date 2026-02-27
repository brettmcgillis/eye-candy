/* eslint-disable no-plusplus */
import * as THREE from 'three';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  DEBUG_CONTACT_CAP,
  DEBUG_CONTACT_TTL_DEFAULT,
  FLUID_PRESETS,
} from './fluidPresets';
import useFluidRenderTargets from './hooks/useFluidRenderTargets';
import {
  createFullscreenMaterial,
  createSimMaterial,
} from './shaders/fluidShaderMaterials';
import {
  advectionFragmentShader,
  bloomBlurFragmentShader,
  bloomComposeFragmentShader,
  bloomFinalFragmentShader,
  bloomPrefilterFragmentShader,
  blurFragmentShader,
  clearFragmentShader,
  curlFragmentShader,
  displayFragmentShader,
  displayVertexShader,
  divergenceFragmentShader,
  gradientSubtractFragmentShader,
  pressureFragmentShader,
  splatFragmentShader,
  sunraysFragmentShader,
  sunraysMaskFragmentShader,
  vorticityFragmentShader,
} from './shaders/fluidShaders';
import renderPass from './utils/fluidPassUtils';
import { createDitheringTexture } from './utils/fluidSimUtils';

const DYE_COLOR_SCALE = 0.15;
const MAX_BLOOM_CHAIN = 16;
const MAX_SPLAT_VELOCITY = 900;
const SIM_DIMENSION_QUANTIZATION = 32;

const FluidMaterial = forwardRef(
  (
    {
      autoPointersRef: externalAutoPointersRef,
      config,
      pointerRef: externalPointerRef,
      randomSplatsRef,
    },
    ref
  ) => {
    const { gl, size } = useThree();
    const internalPointerRef = useRef(null);
    const pointerRef = externalPointerRef || internalPointerRef;
    const startedRef = useRef(false);
    const internalRandomSplatsRef = useRef([]);
    const internalAutoPointersRef = useRef([
      { x: 0.5, y: 0.5, ttl: 0, phase: 0 },
    ]);
    const autoPointersRef = externalAutoPointersRef || internalAutoPointersRef;
    const sceneRandomSplatsRef = randomSplatsRef || internalRandomSplatsRef;
    const resetRequestedRef = useRef(false);
    const initialSizeRef = useRef(null);

    if (!initialSizeRef.current && size.width > 1 && size.height > 1) {
      initialSizeRef.current = { width: size.width, height: size.height };
    }
    const colorARef = useRef(new THREE.Color());
    const colorBRef = useRef(new THREE.Color());
    const colorCRef = useRef(new THREE.Color());
    const forceRef = useRef(new THREE.Vector3());
    const autoSplatColorRef = useRef(new THREE.Color());
    const debugContactsRef = useRef(
      Array.from({ length: DEBUG_CONTACT_CAP }, () => ({
        x: 0.5,
        y: 0.5,
        ttl: 0,
        kind: 0,
      }))
    );
    const debugContactWriteRef = useRef(0);

    const fluidValues = useMemo(
      () => ({ ...FLUID_PRESETS.default, ...(config || {}) }),
      [config]
    );

    const {
      paused,
      simResolution,
      pressureRelax,
      pressureIterations,
      vorticity,
      velocityDissipation,
      densityDissipation,
      splatRadius,
      splatForce,
      dyeStrength,
      autoSplat,
      autoSplatStrength,
      autoSplatRate,
      autoSplatBurst,
      autoSplatCount,
      shading,
      bloom,
      bloomResolution,
      bloomIterations,
      bloomIntensity,
      bloomThreshold,
      bloomSoftKnee,
      sunrays,
      sunraysResolution,
      sunraysWeight,
      colorA,
      colorB,
      colorC,
      colorful,
      colorUpdateSpeed,
      colorCycleSpeed,
      dithering,
      ditherStrength,
      ditherScale,
      bgA,
      bgB,
      brightness,
      contrast,
      saturation,
      blendMode,
      debugCursor,
      debugPointerColor,
      debugAutoColor,
      debugPointerSize,
      debugAutoSize,
      debugContactFadeDuration,
    } = fluidValues;

    const baseSimWidth = Math.max(
      1,
      initialSizeRef.current?.width || size.width
    );
    const baseSimHeight = Math.max(
      1,
      initialSizeRef.current?.height || size.height
    );

    const simWidth = Math.max(
      64,
      Math.max(
        SIM_DIMENSION_QUANTIZATION,
        Math.floor(
          (baseSimWidth * simResolution) / SIM_DIMENSION_QUANTIZATION
        ) * SIM_DIMENSION_QUANTIZATION
      )
    );
    const simHeight = Math.max(
      64,
      Math.max(
        SIM_DIMENSION_QUANTIZATION,
        Math.floor(
          (baseSimHeight * simResolution) / SIM_DIMENSION_QUANTIZATION
        ) * SIM_DIMENSION_QUANTIZATION
      )
    );

    const bloomWidth = Math.max(32, Math.floor(baseSimWidth * bloomResolution));
    const bloomHeight = Math.max(
      32,
      Math.floor(baseSimHeight * bloomResolution)
    );

    const sunraysWidth = Math.max(
      32,
      Math.floor(baseSimWidth * sunraysResolution)
    );
    const sunraysHeight = Math.max(
      32,
      Math.floor(baseSimHeight * sunraysResolution)
    );

    const type = gl.capabilities.isWebGL2
      ? THREE.HalfFloatType
      : THREE.UnsignedByteType;
    const filter = gl.capabilities.isWebGL2
      ? THREE.LinearFilter
      : THREE.NearestFilter;

    const rtOptions = useMemo(
      () => ({
        type,
        format: THREE.RGBAFormat,
        minFilter: filter,
        magFilter: filter,
        depthBuffer: false,
        stencilBuffer: false,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
      }),
      [filter, type]
    );

    const simTexel = useMemo(
      () => new THREE.Vector2(1 / simWidth, 1 / simHeight),
      [simWidth, simHeight]
    );

    const bloomTexel = useMemo(
      () => new THREE.Vector2(1 / bloomWidth, 1 / bloomHeight),
      [bloomWidth, bloomHeight]
    );

    const sunraysTexel = useMemo(
      () => new THREE.Vector2(1 / sunraysWidth, 1 / sunraysHeight),
      [sunraysWidth, sunraysHeight]
    );

    const simScene = useMemo(() => new THREE.Scene(), []);
    const simCamera = useMemo(
      () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
      []
    );
    const simMesh = useMemo(
      () =>
        new THREE.Mesh(
          new THREE.PlaneGeometry(2, 2),
          new THREE.MeshBasicMaterial({ color: 0x000000 })
        ),
      []
    );

    const {
      velocity,
      dye,
      pressureTex,
      curl,
      divergence,
      bloomComposite,
      bloomChain,
      sunraysMask,
      sunraysTex,
      sunraysTemp,
      clearAllTargets,
    } = useFluidRenderTargets({
      gl,
      simWidth,
      simHeight,
      bloomWidth,
      bloomHeight,
      sunraysWidth,
      sunraysHeight,
      rtOptions,
      maxBloomChain: MAX_BLOOM_CHAIN,
    });

    const advectionMat = useMemo(
      () =>
        createSimMaterial(advectionFragmentShader, {
          uVelocity: { value: null },
          uSource: { value: null },
          uTexel: { value: simTexel.clone() },
          uDt: { value: 0.016 },
          uDissipation: { value: densityDissipation },
          uManualFiltering: { value: filter === THREE.NearestFilter },
        }),
      [filter, simTexel]
    );

    const divergenceMat = useMemo(
      () =>
        createSimMaterial(divergenceFragmentShader, {
          uVelocity: { value: null },
          uTexel: { value: simTexel.clone() },
        }),
      [simTexel]
    );

    const clearMat = useMemo(
      () =>
        createFullscreenMaterial(clearFragmentShader, {
          uTexture: { value: null },
          uValue: { value: pressureRelax },
        }),
      [simTexel]
    );

    const pressureMat = useMemo(
      () =>
        createSimMaterial(pressureFragmentShader, {
          uPressure: { value: null },
          uDivergence: { value: null },
          uTexel: { value: simTexel.clone() },
        }),
      [simTexel]
    );

    const curlMat = useMemo(
      () =>
        createSimMaterial(curlFragmentShader, {
          uVelocity: { value: null },
          uTexel: { value: simTexel.clone() },
        }),
      [simTexel]
    );

    const gradientMat = useMemo(
      () =>
        createSimMaterial(gradientSubtractFragmentShader, {
          uPressure: { value: null },
          uVelocity: { value: null },
          uTexel: { value: simTexel.clone() },
        }),
      [simTexel]
    );

    const vorticityMat = useMemo(
      () =>
        createSimMaterial(vorticityFragmentShader, {
          uVelocity: { value: null },
          uCurlTex: { value: null },
          uTexel: { value: simTexel.clone() },
          uDt: { value: 0.016 },
          uCurl: { value: vorticity },
        }),
      [simTexel]
    );

    const splatMat = useMemo(
      () =>
        createFullscreenMaterial(splatFragmentShader, {
          uTarget: { value: null },
          uPoint: { value: new THREE.Vector2(0.5, 0.5) },
          uColor: { value: new THREE.Vector3(0, 0, 0) },
          uRadius: { value: splatRadius },
          uAspect: { value: simWidth / simHeight },
        }),
      [simHeight, simWidth]
    );

    const bloomPrefilterMat = useMemo(
      () =>
        createFullscreenMaterial(bloomPrefilterFragmentShader, {
          uTexture: { value: null },
          uCurve: { value: new THREE.Vector3(0, 0, 0) },
          uThreshold: { value: bloomThreshold },
        }),
      [bloomTexel]
    );

    const bloomBlurMat = useMemo(
      () =>
        createFullscreenMaterial(bloomBlurFragmentShader, {
          uTexture: { value: null },
          uTexel: { value: bloomTexel.clone() },
        }),
      [bloomTexel]
    );

    const bloomFinalMat = useMemo(
      () =>
        createFullscreenMaterial(bloomFinalFragmentShader, {
          uTexture: { value: null },
          uTexel: { value: bloomTexel.clone() },
          uIntensity: { value: bloomIntensity },
        }),
      [bloomTexel]
    );

    const bloomComposeMat = useMemo(
      () =>
        createFullscreenMaterial(bloomComposeFragmentShader, {
          uBase: { value: null },
          uAdd: { value: null },
          uAddFactor: { value: 1 },
        }),
      [bloomTexel]
    );

    const sunraysMaskMat = useMemo(
      () =>
        createFullscreenMaterial(sunraysMaskFragmentShader, {
          uTexture: { value: null },
        }),
      [sunraysTexel]
    );

    const sunraysMat = useMemo(
      () =>
        createFullscreenMaterial(sunraysFragmentShader, {
          uTexture: { value: null },
          uWeight: { value: sunraysWeight },
        }),
      [sunraysTexel]
    );

    const blurMat = useMemo(
      () =>
        createFullscreenMaterial(blurFragmentShader, {
          uTexture: { value: null },
          uTexel: { value: new THREE.Vector2(1, 0) },
        }),
      [sunraysTexel]
    );

    const displayMat = useMemo(
      () =>
        new THREE.ShaderMaterial({
          vertexShader: displayVertexShader,
          fragmentShader: displayFragmentShader,
          uniforms: {
            uDye: { value: null },
            uBloom: { value: null },
            uSunrays: { value: null },
            uDithering: { value: null },
            uDyeTexel: { value: simTexel.clone() },
            uDitherScale: { value: new THREE.Vector2(1, 1) },
            uDitheringEnabled: { value: true },
            uDitherStrength: { value: 1 },
            uBgA: { value: new THREE.Color(bgA) },
            uBgB: { value: new THREE.Color(bgB) },
            uBrightness: { value: brightness },
            uContrast: { value: contrast },
            uSaturation: { value: saturation },
            uShading: { value: shading },
            uBloomEnabled: { value: bloom },
            uSunraysEnabled: { value: sunrays },
            uBlendMode: { value: 0 },
            uDebugCursor: { value: false },
            uDebugPointer: { value: new THREE.Vector2(0.5, 0.5) },
            uDebugAuto: { value: new THREE.Vector2(0.5, 0.5) },
            uDebugPointerSize: {
              value: FLUID_PRESETS.default.debugPointerSize,
            },
            uDebugAutoSize: {
              value: FLUID_PRESETS.default.debugAutoSize,
            },
            uDebugPointerAspect: {
              value: FLUID_PRESETS.default.debugPointerAspect,
            },
            uDebugAutoAspect: {
              value: FLUID_PRESETS.default.debugAutoAspect,
            },
            uDebugLineWeightScale: {
              value: FLUID_PRESETS.default.debugLineWeightScale,
            },
            uDebugPointerActive: { value: 0 },
            uDebugAutoActive: { value: 0 },
            uDebugPointerColor: {
              value: new THREE.Color('#ffffff'),
            },
            uDebugAutoColor: {
              value: new THREE.Color('#000000'),
            },
            uDebugAutoCount: { value: 0 },
            uDebugAutos: {
              value: Array.from(
                { length: DEBUG_CONTACT_CAP },
                () => new THREE.Vector2(0.5, 0.5)
              ),
            },
            uDebugAutoLife: {
              value: Array.from({ length: DEBUG_CONTACT_CAP }, () => 0),
            },
            uDebugContacts: {
              value: Array.from(
                { length: DEBUG_CONTACT_CAP },
                () => new THREE.Vector2(0.5, 0.5)
              ),
            },
            uDebugContactLife: {
              value: Array.from({ length: DEBUG_CONTACT_CAP }, () => 0),
            },
            uDebugContactKind: {
              value: Array.from({ length: DEBUG_CONTACT_CAP }, () => 0),
            },
            uDebugContactFadeDuration: {
              value: DEBUG_CONTACT_TTL_DEFAULT,
            },
          },
          depthTest: false,
          depthWrite: false,
        }),
      [simTexel]
    );
    const ditheringTexture = useMemo(() => createDitheringTexture(), []);

    useEffect(() => {
      simScene.add(simMesh);
      return () => {
        simScene.remove(simMesh);
      };
    }, [simMesh, simScene]);

    useEffect(
      () => () => {
        simMesh.geometry.dispose();
        ditheringTexture.dispose();
        advectionMat.dispose();
        clearMat.dispose();
        curlMat.dispose();
        divergenceMat.dispose();
        pressureMat.dispose();
        gradientMat.dispose();
        vorticityMat.dispose();
        splatMat.dispose();
        bloomPrefilterMat.dispose();
        bloomBlurMat.dispose();
        bloomFinalMat.dispose();
        bloomComposeMat.dispose();
        sunraysMaskMat.dispose();
        sunraysMat.dispose();
        blurMat.dispose();
        displayMat.dispose();
      },
      [
        advectionMat,
        bloomBlurMat,
        bloomComposeMat,
        bloomFinalMat,
        bloomPrefilterMat,
        blurMat,
        clearMat,
        curlMat,
        divergenceMat,
        displayMat,
        ditheringTexture,
        gradientMat,
        pressureMat,
        simMesh.geometry,
        splatMat,
        sunraysMaskMat,
        sunraysMat,
        vorticityMat,
      ]
    );

    useImperativeHandle(ref, () => ({
      reset() {
        resetRequestedRef.current = true;
      },
    }));

    useFrame((state, delta) => {
      const dt = Math.min(0.033, delta);
      const t = state.clock.elapsedTime;

      for (let i = 0; i < DEBUG_CONTACT_CAP; i++) {
        const contact = debugContactsRef.current[i];
        contact.ttl = Math.max(0, contact.ttl - dt);
      }
      // Handle reset request
      if (resetRequestedRef.current) {
        clearAllTargets();
        resetRequestedRef.current = false;
      }

      const renderSimPass = (material, target) => {
        renderPass(gl, simScene, simCamera, simMesh, material, target);
      };

      colorARef.current.set(colorA);
      colorBRef.current.set(colorB);
      colorCRef.current.set(colorC);

      advectionMat.uniforms.uTexel.value.copy(simTexel);
      advectionMat.uniforms.uDt.value = dt;
      advectionMat.uniforms.uManualFiltering.value =
        filter === THREE.NearestFilter;

      divergenceMat.uniforms.uTexel.value.copy(simTexel);
      curlMat.uniforms.uTexel.value.copy(simTexel);

      vorticityMat.uniforms.uTexel.value.copy(simTexel);
      vorticityMat.uniforms.uDt.value = dt;
      vorticityMat.uniforms.uCurl.value = vorticity;

      pressureMat.uniforms.uTexel.value.copy(simTexel);
      clearMat.uniforms.uValue.value = pressureRelax;

      splatMat.uniforms.uRadius.value = splatRadius;
      splatMat.uniforms.uAspect.value = simWidth / simHeight;

      bloomPrefilterMat.uniforms.uThreshold.value = bloomThreshold;
      bloomBlurMat.uniforms.uTexel.value.copy(bloomTexel);
      bloomFinalMat.uniforms.uTexel.value.copy(bloomTexel);
      bloomFinalMat.uniforms.uIntensity.value = bloomIntensity;

      sunraysMat.uniforms.uWeight.value = sunraysWeight;

      displayMat.uniforms.uDyeTexel.value.copy(simTexel);
      displayMat.uniforms.uDithering.value = ditheringTexture;
      displayMat.uniforms.uDitherScale.value.set(
        (size.width / ditheringTexture.image.width) * (ditherScale || 1),
        (size.height / ditheringTexture.image.height) * (ditherScale || 1)
      );
      displayMat.uniforms.uDitherStrength.value = ditherStrength || 0;
      displayMat.uniforms.uDitheringEnabled.value = !!dithering;
      displayMat.uniforms.uBgA.value.set(bgA);
      displayMat.uniforms.uBgB.value.set(bgB);
      displayMat.uniforms.uBrightness.value = brightness;
      displayMat.uniforms.uContrast.value = contrast;
      displayMat.uniforms.uSaturation.value = saturation;
      displayMat.uniforms.uBlendMode.value = blendMode;
      displayMat.uniforms.uShading.value = shading;
      displayMat.uniforms.uBloomEnabled.value = bloom;
      displayMat.uniforms.uSunraysEnabled.value = sunrays;

      const pointer = pointerRef.current;

      const splatAt = (
        px,
        py,
        vx,
        vy,
        rgb,
        strength = 1,
        debugKind = -1,
        options = {}
      ) => {
        const { applyVelocity = true, applyDye = true } = options;
        const safePx = THREE.MathUtils.clamp(px, 0, 1);
        const safePy = THREE.MathUtils.clamp(py, 0, 1);
        const safeStrength = THREE.MathUtils.clamp(strength, 0, 3);
        if (debugKind >= 0) {
          const idx = debugContactWriteRef.current;
          debugContactsRef.current[idx].x = safePx;
          debugContactsRef.current[idx].y = safePy;
          debugContactsRef.current[idx].ttl = Math.max(
            0.05,
            debugContactFadeDuration
          );
          debugContactsRef.current[idx].kind = debugKind > 0 ? 1 : 0;
          debugContactWriteRef.current = (idx + 1) % DEBUG_CONTACT_CAP;
        }

        splatMat.uniforms.uPoint.value.set(safePx, safePy);

        if (applyVelocity) {
          splatMat.uniforms.uTarget.value = velocity.read.texture;
          forceRef.current.set(
            THREE.MathUtils.clamp(vx, -MAX_SPLAT_VELOCITY, MAX_SPLAT_VELOCITY),
            THREE.MathUtils.clamp(vy, -MAX_SPLAT_VELOCITY, MAX_SPLAT_VELOCITY),
            0
          );
          splatMat.uniforms.uColor.value.copy(forceRef.current);
          renderSimPass(splatMat, velocity.write);
          velocity.swap();
        }

        if (applyDye) {
          splatMat.uniforms.uTarget.value = dye.read.texture;
          forceRef.current
            .set(
              THREE.MathUtils.clamp(rgb.r, 0, 1),
              THREE.MathUtils.clamp(rgb.g, 0, 1),
              THREE.MathUtils.clamp(rgb.b, 0, 1)
            )
            .multiplyScalar(dyeStrength * safeStrength * DYE_COLOR_SCALE);
          splatMat.uniforms.uColor.value.copy(forceRef.current);
          renderSimPass(splatMat, dye.write);
          dye.swap();
        }
      };

      if (pointer?.down) {
        const cycleSpeed = colorCycleSpeed * Math.max(0.001, colorUpdateSpeed);
        const mixAB = 0.5 + 0.5 * Math.sin(t * cycleSpeed);
        const mixBC = 0.5 + 0.5 * Math.sin(t * cycleSpeed * 1.37 + 1.7);

        if (colorful) {
          colorARef.current.lerp(colorBRef.current, mixAB);
          colorARef.current.lerp(colorCRef.current, mixBC * 0.45);
        }

        // For multiply blend mode (ink on paper), invert colors so black becomes visible
        let paintColor = colorARef.current;
        if (blendMode > 0.5) {
          paintColor = colorARef.current
            .clone()
            .multiplyScalar(-1)
            .addScalar(1);
        }
        if (!colorful && blendMode > 0.5) {
          // When not colorful in multiply mode, need to invert the base colorA
          const baseColor = new THREE.Color(colorA);
          paintColor = baseColor.multiplyScalar(-1).addScalar(1);
        }

        const speed = Math.min(
          1,
          Math.hypot(pointer.vx || 0, pointer.vy || 0) * 80
        );
        const forceX = (pointer.vx || 0) * splatForce;
        const forceY = (pointer.vy || 0) * splatForce;

        splatAt(
          pointer.x,
          pointer.y,
          forceX,
          forceY,
          paintColor,
          0.65 + speed * 0.75,
          -1,
          {
            applyVelocity: !paused,
            applyDye: true,
          }
        );
      }

      if (!paused) {
        advectionMat.uniforms.uVelocity.value = velocity.read.texture;
        advectionMat.uniforms.uSource.value = velocity.read.texture;
        advectionMat.uniforms.uDissipation.value = velocityDissipation;
        renderSimPass(advectionMat, velocity.write);
        velocity.swap();

        curlMat.uniforms.uVelocity.value = velocity.read.texture;
        renderSimPass(curlMat, curl);

        vorticityMat.uniforms.uVelocity.value = velocity.read.texture;
        vorticityMat.uniforms.uCurlTex.value = curl.texture;
        renderSimPass(vorticityMat, velocity.write);
        velocity.swap();

        if (!pointer?.down && !startedRef.current) {
          startedRef.current = true;
          splatAt(0.5, 0.5, 0, 0, colorARef.current.set(0.2, 0.4, 0.7), 0.35);
        }

        if (autoSplat) {
          const burstCount = Math.max(1, Math.floor(autoSplatBurst));
          const count = Math.max(1, Math.floor(autoSplatCount || 1));

          for (let p = 0; p < count; p++) {
            const ap = autoPointersRef.current[p] || {};
            const phase = ap.phase || 0;
            const autoSpeed = Math.min(
              1,
              Math.hypot(ap.vx || 0, ap.vy || 0) * 140
            );
            let autoForceX =
              (ap.vx || 0) * splatForce * autoSplatStrength * 1.4;
            let autoForceY =
              (ap.vy || 0) * splatForce * autoSplatStrength * 1.4;
            if (autoSplatRate > 0) {
              const minForce = splatForce * autoSplatStrength * 0.0018;
              if (Math.hypot(autoForceX, autoForceY) < minForce) {
                autoForceX += Math.cos(phase * 1.9) * minForce;
                autoForceY += Math.sin(phase * 1.9) * minForce;
              }
            }

            // Check if enough time has elapsed since last splat
            autoSplatColorRef.current
              .set(
                Math.min(
                  1,
                  THREE.MathUtils.lerp(
                    colorARef.current.r,
                    colorBRef.current.r,
                    0.5 + 0.5 * Math.sin(phase * 0.61 + p * 0.13)
                  ) + 0.01
                ),
                Math.min(
                  1,
                  THREE.MathUtils.lerp(
                    colorBRef.current.g,
                    colorCRef.current.g,
                    0.5 + 0.5 * Math.sin(phase * 0.73 + 0.7 + p * 0.11)
                  ) + 0.01
                ),
                Math.min(
                  1,
                  THREE.MathUtils.lerp(
                    colorCRef.current.b,
                    colorARef.current.b,
                    0.5 + 0.5 * Math.sin(phase * 0.67 + 1.4 + p * 0.09)
                  ) + 0.01
                )
              )
              .multiplyScalar(0.75);

            if (blendMode > 0.5) {
              autoSplatColorRef.current.multiplyScalar(-1).addScalar(1);
            }

            const autoStrength =
              (0.12 + autoSpeed * 0.2) * autoSplatStrength * 0.75;

            splatAt(
              ap.x ?? 0.5,
              ap.y ?? 0.5,
              autoForceX,
              autoForceY,
              autoSplatColorRef.current,
              autoStrength
            );

            for (let i = 1; i < burstCount; i++) {
              const jitterPhase = phase + i * 1.73;
              const trailT = i / burstCount;
              const prevX = (ap.x || 0.5) - (ap.vx || 0);
              const prevY = (ap.y || 0.5) - (ap.vy || 0);
              const trailX = THREE.MathUtils.lerp(prevX, ap.x || 0.5, trailT);
              const trailY = THREE.MathUtils.lerp(prevY, ap.y || 0.5, trailT);
              const jitter = 0.006 * (i / Math.max(1, burstCount - 1));
              const jx = Math.sin(jitterPhase * 1.19) * jitter;
              const jy = Math.cos(jitterPhase * 1.47) * jitter;
              const decay = Math.max(0.12, 1 - i * 0.28);

              splatAt(
                trailX + jx,
                trailY + jy,
                autoForceX * decay,
                autoForceY * decay,
                autoSplatColorRef.current,
                autoStrength * decay * 0.55
              );
            }
          }
        }

        if (sceneRandomSplatsRef.current.length > 0) {
          for (let i = 0; i < sceneRandomSplatsRef.current.length; i += 1) {
            const randomSplat = sceneRandomSplatsRef.current[i];
            const tint = colorARef.current
              .clone()
              .lerp(colorBRef.current, randomSplat.hueMix)
              .lerp(colorCRef.current, randomSplat.colorMix);
            if (blendMode > 0.5) {
              tint.multiplyScalar(-1).addScalar(1);
            }

            splatAt(
              randomSplat.x,
              randomSplat.y,
              randomSplat.vx,
              randomSplat.vy,
              tint,
              randomSplat.strength,
              0
            );
          }

          sceneRandomSplatsRef.current = [];
        }

        divergenceMat.uniforms.uVelocity.value = velocity.read.texture;
        renderSimPass(divergenceMat, divergence);

        clearMat.uniforms.uTexture.value = pressureTex.read.texture;
        renderSimPass(clearMat, pressureTex.write);
        pressureTex.swap();

        pressureMat.uniforms.uDivergence.value = divergence.texture;
        for (let i = 0; i < pressureIterations; i++) {
          pressureMat.uniforms.uPressure.value = pressureTex.read.texture;
          renderSimPass(pressureMat, pressureTex.write);
          pressureTex.swap();
        }

        gradientMat.uniforms.uPressure.value = pressureTex.read.texture;
        gradientMat.uniforms.uVelocity.value = velocity.read.texture;
        renderSimPass(gradientMat, velocity.write);
        velocity.swap();

        advectionMat.uniforms.uVelocity.value = velocity.read.texture;
        advectionMat.uniforms.uSource.value = dye.read.texture;
        advectionMat.uniforms.uDissipation.value = densityDissipation;
        renderSimPass(advectionMat, dye.write);
        dye.swap();
      }

      displayMat.uniforms.uDebugCursor.value = debugCursor;
      displayMat.uniforms.uDebugPointer.value.set(
        pointer?.x ?? 0.5,
        pointer?.y ?? 0.5
      );
      const firstAuto = autoPointersRef.current[0] || {
        x: 0.5,
        y: 0.5,
        initialized: false,
        ttl: 0,
      };
      displayMat.uniforms.uDebugAuto.value.set(firstAuto.x, firstAuto.y);
      // populate autos array for shader (one per autonomous splat)
      const desiredCount = Math.max(0, Math.floor(autoSplatCount || 0));
      let highestActiveIndex = -1;
      for (let i = 0; i < autoPointersRef.current.length; i++) {
        const ap = autoPointersRef.current[i];
        if (ap && (ap.ttl || 0) > 0) highestActiveIndex = i;
      }
      const autoCount = Math.min(
        DEBUG_CONTACT_CAP,
        Math.max(desiredCount, highestActiveIndex + 1)
      );
      displayMat.uniforms.uDebugAutoCount.value = autoCount;
      for (let i = 0; i < DEBUG_CONTACT_CAP; i++) {
        const ap = autoPointersRef.current[i];
        if (i < autoCount && ap) {
          displayMat.uniforms.uDebugAutos.value[i].set(ap.x, ap.y);
          displayMat.uniforms.uDebugAutoLife.value[i] = ap.ttl || 0;
        } else {
          displayMat.uniforms.uDebugAutos.value[i].set(0.5, 0.5);
          displayMat.uniforms.uDebugAutoLife.value[i] = 0;
        }
      }
      displayMat.uniforms.uDebugPointerSize.value = debugPointerSize;
      displayMat.uniforms.uDebugAutoSize.value = debugAutoSize;
      displayMat.uniforms.uDebugPointerAspect.value =
        fluidValues.debugPointerAspect || 1.0;
      displayMat.uniforms.uDebugAutoAspect.value =
        fluidValues.debugAutoAspect || 1.0;
      displayMat.uniforms.uDebugLineWeightScale.value =
        fluidValues.debugLineWeightScale || 1.0;
      displayMat.uniforms.uDebugPointerActive.value = pointer?.down ? 1 : 0;
      displayMat.uniforms.uDebugAutoActive.value = firstAuto.ttl > 0 ? 1 : 0;
      displayMat.uniforms.uDebugPointerColor.value.set(debugPointerColor);
      displayMat.uniforms.uDebugAutoColor.value.set(debugAutoColor);
      displayMat.uniforms.uDebugContactFadeDuration.value = Math.max(
        0.05,
        debugContactFadeDuration
      );
      for (let i = 0; i < DEBUG_CONTACT_CAP; i++) {
        const contact = debugContactsRef.current[i];
        displayMat.uniforms.uDebugContacts.value[i].set(contact.x, contact.y);
        displayMat.uniforms.uDebugContactLife.value[i] = contact.ttl;
        displayMat.uniforms.uDebugContactKind.value[i] = contact.kind;
      }

      const bloomLevelCount = Math.min(
        bloomChain.length,
        Math.max(1, Math.floor(bloomIterations))
      );

      if (bloom && bloomLevelCount > 0) {
        const knee = bloomThreshold * bloomSoftKnee + 0.0001;
        bloomPrefilterMat.uniforms.uCurve.value.set(
          bloomThreshold - knee,
          knee * 2,
          0.25 / knee
        );
        bloomPrefilterMat.uniforms.uTexture.value = dye.read.texture;
        renderSimPass(bloomPrefilterMat, bloomChain[0]);

        for (let i = 1; i < bloomLevelCount; i++) {
          const src = bloomChain[i - 1];
          const dst = bloomChain[i];
          bloomBlurMat.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
          bloomBlurMat.uniforms.uTexture.value = src.texture;
          renderSimPass(bloomBlurMat, dst);
        }

        gl.setRenderTarget(bloomComposite.read);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        for (let i = bloomLevelCount - 1; i >= 0; i--) {
          bloomComposeMat.uniforms.uBase.value = bloomComposite.read.texture;
          bloomComposeMat.uniforms.uAdd.value = bloomChain[i].texture;
          bloomComposeMat.uniforms.uAddFactor.value =
            0.82 ** (bloomLevelCount - 1 - i);
          renderSimPass(bloomComposeMat, bloomComposite.write);
          bloomComposite.swap();
        }

        bloomFinalMat.uniforms.uTexel.value.copy(bloomTexel);
        bloomFinalMat.uniforms.uTexture.value = bloomComposite.read.texture;
        renderSimPass(bloomFinalMat, bloomComposite.write);
        bloomComposite.swap();

        displayMat.uniforms.uBloom.value = bloomComposite.read.texture;
      } else {
        displayMat.uniforms.uBloom.value = dye.read.texture;
      }

      if (sunrays) {
        sunraysMaskMat.uniforms.uTexture.value = dye.read.texture;
        renderSimPass(sunraysMaskMat, sunraysMask);

        sunraysMat.uniforms.uTexture.value = sunraysMask.texture;
        renderSimPass(sunraysMat, sunraysTex);

        blurMat.uniforms.uTexture.value = sunraysTex.texture;
        blurMat.uniforms.uTexel.value.set(sunraysTexel.x, 0);
        renderSimPass(blurMat, sunraysTemp);

        blurMat.uniforms.uTexture.value = sunraysTemp.texture;
        blurMat.uniforms.uTexel.value.set(0, sunraysTexel.y);
        renderSimPass(blurMat, sunraysTex);

        displayMat.uniforms.uSunrays.value = sunraysTex.texture;
      } else {
        displayMat.uniforms.uSunrays.value = dye.read.texture;
      }

      displayMat.uniforms.uDye.value = dye.read.texture;

      gl.setRenderTarget(null);
    });

    return <primitive object={displayMat} attach="material" />;
  }
);

export default FluidMaterial;
