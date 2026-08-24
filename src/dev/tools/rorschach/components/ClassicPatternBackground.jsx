import React, { useEffect, useRef } from 'react';

const VERTEX_SHADER = `
  attribute vec2 aCoords;

  uniform vec2 uCoordsAdjustment;

  varying vec2 vUv;
  varying vec2 vCanvasUV;

  void main(void) {
    gl_Position = vec4(aCoords, 0.0, 1.0);
    vUv = aCoords * uCoordsAdjustment;
    vCanvasUV = aCoords;
  }
`;

const FRAGMENT_SHADER = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif

  uniform float uTime;
  uniform float uSharpness;
  uniform float uThreshold;
  uniform float uScale;
  uniform float uSymmetry;
  uniform float uMaxDetails;
  uniform float uSeed;
  uniform vec3 uBackgroundColor;
  uniform vec3 uInkColor;

  varying vec2 vUv;
  varying vec2 vCanvasUV;

  vec3 random(vec3 point) {
    const vec3 seed1 = vec3(31.06, 19.86, 30.19);
    const vec3 seed2 = vec3(6640.0, 5790.4, 10798.861);
    return fract(sin(dot(point, seed1)) * seed2) - 0.5;
  }

  float gradientNoise(vec3 coordinates) {
    vec3 floorCoordinates = floor(coordinates);
    vec3 fractionalCoordinates = fract(coordinates);

    vec3 coordinates000 = floorCoordinates + vec3(0.0, 0.0, 0.0);
    vec3 coordinates001 = floorCoordinates + vec3(0.0, 0.0, 1.0);
    vec3 coordinates010 = floorCoordinates + vec3(0.0, 1.0, 0.0);
    vec3 coordinates011 = floorCoordinates + vec3(0.0, 1.0, 1.0);
    vec3 coordinates100 = floorCoordinates + vec3(1.0, 0.0, 0.0);
    vec3 coordinates101 = floorCoordinates + vec3(1.0, 0.0, 1.0);
    vec3 coordinates110 = floorCoordinates + vec3(1.0, 1.0, 0.0);
    vec3 coordinates111 = floorCoordinates + vec3(1.0, 1.0, 1.0);

    float noise000 = dot(random(coordinates000), coordinates - coordinates000);
    float noise001 = dot(random(coordinates001), coordinates - coordinates001);
    float noise010 = dot(random(coordinates010), coordinates - coordinates010);
    float noise011 = dot(random(coordinates011), coordinates - coordinates011);
    float noise100 = dot(random(coordinates100), coordinates - coordinates100);
    float noise101 = dot(random(coordinates101), coordinates - coordinates101);
    float noise110 = dot(random(coordinates110), coordinates - coordinates110);
    float noise111 = dot(random(coordinates111), coordinates - coordinates111);

    vec3 coefficients = fractionalCoordinates * fractionalCoordinates * fractionalCoordinates
      * (fractionalCoordinates * (6.0 * fractionalCoordinates - 15.0) + 10.0);

    float noiseX00 = mix(noise000, noise100, coefficients.x);
    float noiseX01 = mix(noise001, noise101, coefficients.x);
    float noiseX10 = mix(noise010, noise110, coefficients.x);
    float noiseX11 = mix(noise011, noise111, coefficients.x);
    float noiseXX0 = mix(noiseX00, noiseX10, coefficients.y);
    float noiseXX1 = mix(noiseX01, noiseX11, coefficients.y);

    return mix(noiseXX0, noiseXX1, coefficients.z);
  }

  float layeredNoise(vec3 coordinates) {
    float result = 0.0;
    float amplitude = 0.5;
    float scale = 2.5;

    for (int index = 0; index < 5; index++) {
      float noise = gradientNoise(coordinates * scale);
      result += amplitude * noise * smoothstep(0.0, 1.0, uMaxDetails - float(index));
      amplitude *= 0.5;
      scale *= 2.3;
    }

    return result;
  }

  float computeInkIntensity(vec2 uv, float noiseMask) {
    uv *= uScale;

    vec3 rorschachCoordinates = vec3(uv.x, uv.y + uSeed, 0.02 * uTime);
    rorschachCoordinates.x = abs(rorschachCoordinates.x);
    float rorschachNoise = layeredNoise(rorschachCoordinates) + 0.5;

    vec3 supportCoordinates = vec3(uv, 0.001 * uTime);
    float supportNoise = gradientNoise(supportCoordinates * 25.0);
    float supportFactor = 0.03 + 0.08
      * (1.0 - smoothstep(0.0, 0.08, abs(uv.x)));
    supportFactor *= 1.0 - uSymmetry;

    float inkNoise = rorschachNoise + supportFactor * supportNoise - noiseMask;
    return smoothstep(-uSharpness, 0.0, inkNoise - uThreshold);
  }

  void main(void) {
    float noiseMask = smoothstep(
      0.6,
      2.0,
      max(abs(vCanvasUV.x), abs(vCanvasUV.y))
    );
    float inkIntensity = computeInkIntensity(vUv, noiseMask);
    gl_FragColor = vec4(mix(uBackgroundColor, uInkColor, inkIntensity), 1.0);
  }
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || 'Unable to compile Rorschach shader.');
  }

  return shader;
}

function createProgram(gl) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(message || 'Unable to link Rorschach shader.');
  }

  return program;
}

function safePow(value, power) {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value ** power;
}

function mapDensity(value) {
  if (value < 0.5) return 0.5 * safePow(2 * value, 0.1);
  return 1 - 0.5 * safePow(2 - 2 * value, 0.05);
}

function hexToRgb(color) {
  return [1, 3, 5].map(
    (offset) => Number.parseInt(color.slice(offset, offset + 2), 16) / 255
  );
}

export default function ClassicPatternBackground({ settings }) {
  const canvasRef = useRef(null);
  const drawRef = useRef(null);
  const settingsRef = useRef(settings);
  const seedRef = useRef(Math.random() * 200 - 100);

  useEffect(() => {
    settingsRef.current = settings;
    drawRef.current?.(performance.now(), false);
  }, [settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { antialias: false });
    if (!gl) return undefined;

    let program;
    try {
      program = createProgram(gl);
    } catch (error) {
      canvas.dataset.webglError = error.message;
      return undefined;
    }

    const coordinates = gl.createBuffer();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const uniform = (name) => gl.getUniformLocation(program, name);
    const uniforms = {
      backgroundColor: uniform('uBackgroundColor'),
      coordsAdjustment: uniform('uCoordsAdjustment'),
      details: uniform('uMaxDetails'),
      inkColor: uniform('uInkColor'),
      scale: uniform('uScale'),
      seed: uniform('uSeed'),
      sharpness: uniform('uSharpness'),
      symmetry: uniform('uSymmetry'),
      threshold: uniform('uThreshold'),
      time: uniform('uTime'),
    };
    const attribute = gl.getAttribLocation(program, 'aCoords');
    let animationFrame = 0;
    let elapsed = 0;
    let lastFrame = performance.now();

    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, coordinates);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);

    function draw(now, scheduleNext = true) {
      const {
        backgroundColor,
        density,
        details,
        highDpi,
        inkColor,
        scale,
        sharpness,
        speed,
        symmetry,
      } = settingsRef.current;
      const pixelRatio = highDpi ? window.devicePixelRatio : 1;
      const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      const aspectRatio = width / height;
      const adjustment =
        aspectRatio >= 1 ? [aspectRatio, 1] : [1, 1 / aspectRatio];
      const delta = Math.min((now - lastFrame) / 1000, 0.1);
      lastFrame = now;
      if (!reducedMotion.matches && !document.hidden) {
        elapsed += delta * speed;
      }

      gl.uniform2fv(uniforms.coordsAdjustment, adjustment);
      gl.uniform1f(uniforms.time, elapsed);
      gl.uniform1f(uniforms.sharpness, 1 - safePow(sharpness, 0.05));
      gl.uniform1f(uniforms.threshold, 1 - mapDensity(density));
      gl.uniform1f(uniforms.scale, scale);
      gl.uniform1f(uniforms.symmetry, 2 * symmetry - 1);
      gl.uniform1f(uniforms.details, details);
      gl.uniform1f(uniforms.seed, seedRef.current);
      gl.uniform3fv(uniforms.backgroundColor, hexToRgb(backgroundColor));
      gl.uniform3fv(uniforms.inkColor, hexToRgb(inkColor));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (scheduleNext) animationFrame = requestAnimationFrame(draw);
    }

    drawRef.current = draw;
    draw(performance.now());

    return () => {
      drawRef.current = null;
      cancelAnimationFrame(animationFrame);
      gl.deleteBuffer(coordinates);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      aria-hidden="true"
      className="rw-pattern-background"
      ref={canvasRef}
    />
  );
}
