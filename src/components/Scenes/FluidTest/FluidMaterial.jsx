/* eslint-disable no-plusplus */
import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useFrame, useThree } from '@react-three/fiber';

const simVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const displayVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const advectionFragmentShader = `
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDissipation;
uniform float uVelocityScale;

void main() {
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  vec2 coord = vUv - uDt * velocity * uTexel * uVelocityScale;
  gl_FragColor = uDissipation * texture2D(uSource, coord);
}
`;

const divergenceFragmentShader = `
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform vec2 uTexel;

void main() {
  float L = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  float T = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
`;

const clearFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uValue;

void main() {
  gl_FragColor = uValue * texture2D(uTexture, vUv);
}
`;

const pressureFragmentShader = `
varying vec2 vUv;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;

void main() {
  float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float div = texture2D(uDivergence, vUv).x;

  float p = (L + R + B + T - div) * 0.25;
  gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
}
`;

const gradientSubtractFragmentShader = `
varying vec2 vUv;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;

void main() {
  float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;

  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity -= vec2(R - L, T - B) * 0.5;

  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

const curlFragmentShader = `
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform vec2 uTexel;

void main() {
  float L = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float R = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float B = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  float T = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  float vorticity = R - L - T + B;
  gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0);
}
`;

const vorticityFragmentShader = `
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uCurlTex;
uniform vec2 uTexel;
uniform float uDt;
uniform float uCurl;

void main() {
  float L = abs(texture2D(uCurlTex, vUv - vec2(uTexel.x, 0.0)).x);
  float R = abs(texture2D(uCurlTex, vUv + vec2(uTexel.x, 0.0)).x);
  float B = abs(texture2D(uCurlTex, vUv - vec2(0.0, uTexel.y)).x);
  float T = abs(texture2D(uCurlTex, vUv + vec2(0.0, uTexel.y)).x);
  float C = texture2D(uCurlTex, vUv).x;

  vec2 force = vec2(T - B, R - L) * 0.5;
  force /= (length(force) + 0.0001);
  force *= uCurl * C;
  force.y *= -1.0;

  vec2 velocity = texture2D(uVelocity, vUv).xy + force * uDt;
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

const splatFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTarget;
uniform vec2 uPoint;
uniform vec3 uColor;
uniform float uRadius;
uniform float uAspect;

void main() {
  vec4 base = texture2D(uTarget, vUv);
  vec2 p = vUv - uPoint;
  p.x *= uAspect;

  float influence = exp(-dot(p, p) / max(uRadius, 0.00001));
  gl_FragColor = vec4(base.rgb + uColor * influence, 1.0);
}
`;

const displayFragmentShader = `
varying vec2 vUv;
uniform sampler2D uDye;
uniform vec3 uBgA;
uniform vec3 uBgB;
uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;

vec3 saturateColor(vec3 col, float amount) {
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(l), col, amount);
}

void main() {
  vec3 bg = mix(uBgA, uBgB, smoothstep(0.0, 1.0, vUv.y));
  vec3 dye = texture2D(uDye, vUv).rgb;

  vec3 color = bg + dye;
  color = saturateColor(color, uSaturation);
  color = (color - 0.5) * uContrast + 0.5;
  color *= uBrightness;
  color = pow(max(color, 0.0), vec3(0.95));

  gl_FragColor = vec4(color, 1.0);
}
`;

function createMaterial(fragmentShader, uniforms) {
  return new THREE.ShaderMaterial({
    vertexShader: simVertexShader,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
}

function createPair(width, height, options) {
  const read = new THREE.WebGLRenderTarget(width, height, options);
  const write = new THREE.WebGLRenderTarget(width, height, options);

  return {
    read,
    write,
    swap() {
      const tmp = this.read;
      this.read = this.write;
      this.write = tmp;
    },
  };
}

const FLUID_PRESETS = {
  default: {
    paused: false,
    simResolution: 0.6,
    pressureRelax: 0.82,
    pressureIterations: 22,
    vorticity: 35,
    advectionScale: 1.15,
    velocityDissipation: 0.986,
    densityDissipation: 0.996,
    splatRadius: 0.02,
    splatForce: 170,
    dyeStrength: 0.55,
    autoSplat: false,
    autoSplatStrength: 0.18,
    colorA: '#1ed8ff',
    colorB: '#ff6bd6',
    colorC: '#8eff70',
    colorful: true,
    colorUpdateSpeed: 10,
    colorCycleSpeed: 0.8,
    bgA: '#02040a',
    bgB: '#0b0316',
    brightness: 1.08,
    contrast: 1.2,
    saturation: 1.25,
  },
  pavelLike: {
    paused: false,
    simResolution: 0.75,
    pressureRelax: 0.82,
    pressureIterations: 28,
    vorticity: 46,
    advectionScale: 1.35,
    velocityDissipation: 0.982,
    densityDissipation: 0.997,
    splatRadius: 0.016,
    splatForce: 280,
    dyeStrength: 0.82,
    autoSplat: false,
    autoSplatStrength: 0.22,
    colorA: '#1de9ff',
    colorB: '#ff4ccf',
    colorC: '#ffd35e',
    colorful: true,
    colorUpdateSpeed: 12,
    colorCycleSpeed: 1.25,
    bgA: '#000000',
    bgB: '#070012',
    brightness: 1.18,
    contrast: 1.33,
    saturation: 1.45,
  },
  mobile: {
    paused: false,
    simResolution: 0.38,
    pressureRelax: 0.86,
    pressureIterations: 14,
    vorticity: 28,
    advectionScale: 1.05,
    velocityDissipation: 0.988,
    densityDissipation: 0.997,
    splatRadius: 0.006,
    splatForce: 140,
    dyeStrength: 0.48,
    autoSplat: false,
    autoSplatStrength: 0.09,
    colorA: '#4bd5ff',
    colorB: '#ff7cd8',
    colorC: '#7cf08b',
    colorful: true,
    colorUpdateSpeed: 8,
    colorCycleSpeed: 0.7,
    bgA: '#030611',
    bgB: '#0b0414',
    brightness: 1.05,
    contrast: 1.16,
    saturation: 1.2,
  },
};

const FluidMaterial = forwardRef((_, ref) => {
  const { gl, size } = useThree();
  const pointerRef = useRef(null);
  const startedRef = useRef(false);
  const presetRef = useRef('default');
  const randomSplatQueueRef = useRef(0);
  const colorARef = useRef(new THREE.Color());
  const colorBRef = useRef(new THREE.Color());
  const colorCRef = useRef(new THREE.Color());
  const forceRef = useRef(new THREE.Vector3());

  const [
    {
      preset,
      paused,
      simResolution,
      pressureRelax,
      pressureIterations,
      vorticity,
      velocityDissipation,
      densityDissipation,
      advectionScale,
      splatRadius,
      splatForce,
      dyeStrength,
      colorA,
      colorB,
      colorC,
      colorful,
      colorUpdateSpeed,
      colorCycleSpeed,
      autoSplat,
      autoSplatStrength,
      bgA,
      bgB,
      brightness,
      contrast,
      saturation,
    },
    setControls,
  ] = useControls(
    'Fluid',
    () => ({
      preset: {
        value: 'default',
        options: {
          Default: 'default',
          'Pavel-Like': 'pavelLike',
          Mobile: 'mobile',
        },
      },
      Solver: folder(
        {
          paused: FLUID_PRESETS.default.paused,
          simResolution: {
            value: FLUID_PRESETS.default.simResolution,
            min: 0.2,
            max: 1,
            step: 0.05,
          },
          pressureRelax: {
            value: FLUID_PRESETS.default.pressureRelax,
            min: 0.2,
            max: 1,
            step: 0.01,
          },
          pressureIterations: {
            value: FLUID_PRESETS.default.pressureIterations,
            min: 8,
            max: 40,
            step: 1,
          },
          vorticity: {
            value: FLUID_PRESETS.default.vorticity,
            min: 0,
            max: 90,
            step: 1,
          },
          advectionScale: {
            value: FLUID_PRESETS.default.advectionScale,
            min: 0.2,
            max: 3,
            step: 0.05,
          },
          velocityDissipation: {
            value: FLUID_PRESETS.default.velocityDissipation,
            min: 0.9,
            max: 1,
            step: 0.001,
          },
          densityDissipation: {
            value: FLUID_PRESETS.default.densityDissipation,
            min: 0.9,
            max: 1,
            step: 0.001,
          },
        },
        { collapsed: true }
      ),
      Interaction: folder(
        {
          splatRadius: {
            value: FLUID_PRESETS.default.splatRadius,
            min: 0.001,
            max: 0.08,
            step: 0.001,
          },
          splatForce: {
            value: FLUID_PRESETS.default.splatForce,
            min: 1,
            max: 500,
            step: 1,
          },
          dyeStrength: {
            value: FLUID_PRESETS.default.dyeStrength,
            min: 0.05,
            max: 2.5,
            step: 0.01,
          },
          autoSplat: FLUID_PRESETS.default.autoSplat,
          autoSplatStrength: {
            value: FLUID_PRESETS.default.autoSplatStrength,
            min: 0,
            max: 0.6,
            step: 0.01,
          },
          randomBurst: button(() => {
            randomSplatQueueRef.current += 12;
          }),
        },
        { collapsed: true }
      ),
      Color: folder(
        {
          colorA: FLUID_PRESETS.default.colorA,
          colorB: FLUID_PRESETS.default.colorB,
          colorC: FLUID_PRESETS.default.colorC,
          colorful: FLUID_PRESETS.default.colorful,
          colorUpdateSpeed: {
            value: FLUID_PRESETS.default.colorUpdateSpeed,
            min: 0,
            max: 20,
            step: 0.1,
          },
          colorCycleSpeed: {
            value: FLUID_PRESETS.default.colorCycleSpeed,
            min: 0,
            max: 3,
            step: 0.05,
          },
        },
        { collapsed: true }
      ),
      Display: folder(
        {
          bgA: FLUID_PRESETS.default.bgA,
          bgB: FLUID_PRESETS.default.bgB,
          brightness: {
            value: FLUID_PRESETS.default.brightness,
            min: 0.5,
            max: 2,
            step: 0.01,
          },
          contrast: {
            value: FLUID_PRESETS.default.contrast,
            min: 0.6,
            max: 2,
            step: 0.01,
          },
          saturation: {
            value: FLUID_PRESETS.default.saturation,
            min: 0.2,
            max: 2.2,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  useEffect(() => {
    if (presetRef.current === preset) return;
    const nextPreset = FLUID_PRESETS[preset];
    if (nextPreset) setControls(nextPreset);
    presetRef.current = preset;
  }, [preset, setControls]);

  const simWidth = Math.max(64, Math.floor(size.width * simResolution));
  const simHeight = Math.max(64, Math.floor(size.height * simResolution));

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

  const texel = useMemo(
    () => new THREE.Vector2(1 / simWidth, 1 / simHeight),
    [simWidth, simHeight]
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

  const velocity = useMemo(
    () => createPair(simWidth, simHeight, rtOptions),
    [simHeight, simWidth, rtOptions]
  );
  const dye = useMemo(
    () => createPair(simWidth, simHeight, rtOptions),
    [simHeight, simWidth, rtOptions]
  );
  const pressureTex = useMemo(
    () => createPair(simWidth, simHeight, rtOptions),
    [simHeight, simWidth, rtOptions]
  );
  const curl = useMemo(
    () => new THREE.WebGLRenderTarget(simWidth, simHeight, rtOptions),
    [simHeight, simWidth, rtOptions]
  );
  const divergence = useMemo(
    () => new THREE.WebGLRenderTarget(simWidth, simHeight, rtOptions),
    [simHeight, simWidth, rtOptions]
  );

  const advectionMat = useMemo(
    () =>
      createMaterial(advectionFragmentShader, {
        uVelocity: { value: null },
        uSource: { value: null },
        uTexel: { value: texel },
        uDt: { value: 0.016 },
        uDissipation: { value: densityDissipation },
        uVelocityScale: { value: advectionScale },
      }),
    [advectionScale, densityDissipation, texel]
  );

  const divergenceMat = useMemo(
    () =>
      createMaterial(divergenceFragmentShader, {
        uVelocity: { value: null },
        uTexel: { value: texel },
      }),
    [texel]
  );

  const clearMat = useMemo(
    () =>
      createMaterial(clearFragmentShader, {
        uTexture: { value: null },
        uValue: { value: pressureRelax },
      }),
    [pressureRelax]
  );

  const pressureMat = useMemo(
    () =>
      createMaterial(pressureFragmentShader, {
        uPressure: { value: null },
        uDivergence: { value: null },
        uTexel: { value: texel },
      }),
    [texel]
  );

  const curlMat = useMemo(
    () =>
      createMaterial(curlFragmentShader, {
        uVelocity: { value: null },
        uTexel: { value: texel },
      }),
    [texel]
  );

  const gradientMat = useMemo(
    () =>
      createMaterial(gradientSubtractFragmentShader, {
        uPressure: { value: null },
        uVelocity: { value: null },
        uTexel: { value: texel },
      }),
    [texel]
  );

  const vorticityMat = useMemo(
    () =>
      createMaterial(vorticityFragmentShader, {
        uVelocity: { value: null },
        uCurlTex: { value: null },
        uTexel: { value: texel },
        uDt: { value: 0.016 },
        uCurl: { value: vorticity },
      }),
    [texel, vorticity]
  );

  const splatMat = useMemo(
    () =>
      createMaterial(splatFragmentShader, {
        uTarget: { value: null },
        uPoint: { value: new THREE.Vector2(0.5, 0.5) },
        uColor: { value: new THREE.Vector3(0, 0, 0) },
        uRadius: { value: splatRadius },
        uAspect: { value: simWidth / simHeight },
      }),
    [simHeight, simWidth, splatRadius]
  );

  const displayMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: displayVertexShader,
        fragmentShader: displayFragmentShader,
        uniforms: {
          uDye: { value: null },
          uBgA: { value: new THREE.Color(bgA) },
          uBgB: { value: new THREE.Color(bgB) },
          uBrightness: { value: brightness },
          uContrast: { value: contrast },
          uSaturation: { value: saturation },
        },
        depthTest: false,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    simScene.add(simMesh);
    return () => {
      simScene.remove(simMesh);
    };
  }, [simMesh, simScene]);

  useEffect(() => {
    const clearTarget = (target) => {
      gl.setRenderTarget(target);
      gl.clearColor();
    };

    clearTarget(velocity.read);
    clearTarget(velocity.write);
    clearTarget(dye.read);
    clearTarget(dye.write);
    clearTarget(pressureTex.read);
    clearTarget(pressureTex.write);
    clearTarget(curl);
    clearTarget(divergence);
    gl.setRenderTarget(null);

    return () => {
      simMesh.geometry.dispose();
      velocity.read.dispose();
      velocity.write.dispose();
      dye.read.dispose();
      dye.write.dispose();
      pressureTex.read.dispose();
      pressureTex.write.dispose();
      curl.dispose();
      divergence.dispose();

      advectionMat.dispose();
      clearMat.dispose();
      curlMat.dispose();
      divergenceMat.dispose();
      pressureMat.dispose();
      gradientMat.dispose();
      vorticityMat.dispose();
      splatMat.dispose();
      displayMat.dispose();
    };
  }, [
    advectionMat,
    clearMat,
    curl,
    curlMat,
    divergence,
    divergenceMat,
    dye.read,
    dye.write,
    displayMat,
    gl,
    gradientMat,
    pressureMat,
    pressureTex.read,
    pressureTex.write,
    simMesh.geometry,
    splatMat,
    velocity.read,
    velocity.write,
    vorticityMat,
  ]);

  useImperativeHandle(ref, () => ({
    setPointer(next) {
      pointerRef.current = next;
    },
  }));

  useFrame((state) => {
    const dt = Math.min(0.033, state.clock.getDelta());
    const t = state.clock.elapsedTime;

    const renderPass = (material, target) => {
      simMesh.material = material;
      gl.setRenderTarget(target);
      gl.render(simScene, simCamera);
    };

    colorARef.current.set(colorA);
    colorBRef.current.set(colorB);
    colorCRef.current.set(colorC);

    advectionMat.uniforms.uTexel.value.copy(texel);
    advectionMat.uniforms.uDt.value = dt;
    advectionMat.uniforms.uVelocityScale.value = advectionScale;

    curlMat.uniforms.uTexel.value.copy(texel);

    vorticityMat.uniforms.uTexel.value.copy(texel);
    vorticityMat.uniforms.uDt.value = dt;
    vorticityMat.uniforms.uCurl.value = vorticity;

    pressureMat.uniforms.uTexel.value.copy(texel);
    clearMat.uniforms.uValue.value = pressureRelax;

    splatMat.uniforms.uRadius.value = splatRadius;
    splatMat.uniforms.uAspect.value = simWidth / simHeight;

    displayMat.uniforms.uBgA.value.set(bgA);
    displayMat.uniforms.uBgB.value.set(bgB);
    displayMat.uniforms.uBrightness.value = brightness;
    displayMat.uniforms.uContrast.value = contrast;
    displayMat.uniforms.uSaturation.value = saturation;

    if (paused) {
      gl.setRenderTarget(null);
      return;
    }

    advectionMat.uniforms.uVelocity.value = velocity.read.texture;
    advectionMat.uniforms.uSource.value = velocity.read.texture;
    advectionMat.uniforms.uDissipation.value = velocityDissipation;
    renderPass(advectionMat, velocity.write);
    velocity.swap();

    curlMat.uniforms.uVelocity.value = velocity.read.texture;
    renderPass(curlMat, curl);

    vorticityMat.uniforms.uVelocity.value = velocity.read.texture;
    vorticityMat.uniforms.uCurlTex.value = curl.texture;
    renderPass(vorticityMat, velocity.write);
    velocity.swap();

    const splatAt = (px, py, vx, vy, rgb, strength = 1) => {
      splatMat.uniforms.uPoint.value.set(px, py);

      splatMat.uniforms.uTarget.value = velocity.read.texture;
      forceRef.current.set(vx, vy, 0);
      splatMat.uniforms.uColor.value.copy(forceRef.current);
      renderPass(splatMat, velocity.write);
      velocity.swap();

      splatMat.uniforms.uTarget.value = dye.read.texture;
      forceRef.current
        .set(rgb.r, rgb.g, rgb.b)
        .multiplyScalar(dyeStrength * strength);
      splatMat.uniforms.uColor.value.copy(forceRef.current);
      renderPass(splatMat, dye.write);
      dye.swap();
    };

    const pointer = pointerRef.current;

    if (pointer?.down) {
      const cycleSpeed = colorCycleSpeed * Math.max(0.001, colorUpdateSpeed);
      const mixAB = 0.5 + 0.5 * Math.sin(t * cycleSpeed);
      const mixBC = 0.5 + 0.5 * Math.sin(t * cycleSpeed * 1.37 + 1.7);

      if (colorful) {
        colorARef.current.lerp(colorBRef.current, mixAB);
        colorARef.current.lerp(colorCRef.current, mixBC * 0.45);
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
        colorful ? colorARef.current : colorARef.current.set(colorA),
        0.65 + speed * 0.75
      );
    } else if (!startedRef.current) {
      startedRef.current = true;
      splatAt(0.5, 0.5, 0, 0, colorARef.current.set(0.2, 0.4, 0.7), 0.35);
    }

    if (autoSplat) {
      const px = 0.5 + Math.sin(t * 0.43) * 0.22;
      const py = 0.5 + Math.cos(t * 0.57) * 0.18;
      const pvx = Math.cos(t * 1.6) * autoSplatStrength * 3.5;
      const pvy = Math.sin(t * 1.4) * autoSplatStrength * 3.5;

      const pulse =
        0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * colorCycleSpeed * 0.8));
      forceRef.current.set(
        colorBRef.current.r,
        colorCRef.current.g,
        colorARef.current.b
      );
      splatAt(px, py, pvx, pvy, forceRef.current, autoSplatStrength * pulse);
    }

    if (randomSplatQueueRef.current > 0) {
      const batch = Math.min(randomSplatQueueRef.current, 6);
      randomSplatQueueRef.current -= batch;
      for (let i = 0; i < batch; i++) {
        const px = Math.random();
        const py = Math.random();
        const vx = (Math.random() * 2 - 1) * splatForce * 0.35;
        const vy = (Math.random() * 2 - 1) * splatForce * 0.35;
        const hueMix = Math.random();
        const tint = colorARef.current
          .clone()
          .lerp(colorBRef.current, hueMix)
          .lerp(colorCRef.current, Math.random() * 0.5);
        splatAt(px, py, vx, vy, tint, 0.5 + Math.random() * 0.8);
      }
    }

    divergenceMat.uniforms.uVelocity.value = velocity.read.texture;
    renderPass(divergenceMat, divergence);

    clearMat.uniforms.uTexture.value = pressureTex.read.texture;
    renderPass(clearMat, pressureTex.write);
    pressureTex.swap();

    pressureMat.uniforms.uDivergence.value = divergence.texture;
    for (let i = 0; i < pressureIterations; i++) {
      pressureMat.uniforms.uPressure.value = pressureTex.read.texture;
      renderPass(pressureMat, pressureTex.write);
      pressureTex.swap();
    }

    gradientMat.uniforms.uPressure.value = pressureTex.read.texture;
    gradientMat.uniforms.uVelocity.value = velocity.read.texture;
    renderPass(gradientMat, velocity.write);
    velocity.swap();

    advectionMat.uniforms.uVelocity.value = velocity.read.texture;
    advectionMat.uniforms.uSource.value = dye.read.texture;
    advectionMat.uniforms.uDissipation.value = densityDissipation;
    renderPass(advectionMat, dye.write);
    dye.swap();

    displayMat.uniforms.uDye.value = dye.read.texture;

    gl.setRenderTarget(null);
  });

  return <primitive object={displayMat} attach="material" />;
});

export default FluidMaterial;
