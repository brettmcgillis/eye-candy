import * as THREE from 'three';
import {
  MSDFTextGeometry,
  MSDFTextNodeMaterial,
  generateMSDF,
} from 'three-msdf-text-utils/webgpu';
import { Fn, float, step, uniform, uv, vec2, vec3 } from 'three/tsl';
import * as THREE_WEBGPU from 'three/webgpu';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { extend, useFrame } from '@react-three/fiber';

import {
  CRT_MSDF_CHARSET,
  CRT_MSDF_FIELD_RANGE,
  CRT_MSDF_FONT_SIZE,
  CRT_MSDF_TEXTURE_SIZE,
  resolveCrtFontSource,
} from './crtFontCatalog';

extend(THREE_WEBGPU);

const MSDF_WORKER_URL = '/msdfgen/worker.bundled.js';
const MSDF_WASM_URL = '/msdfgen/msdfgen.wasm';

function buildScreenColorNode(uniforms) {
  return Fn(() => {
    const inputUv = uv();
    const centered = inputUv.sub(vec2(0.5));
    const vignette = float(1.0).sub(
      centered.length().mul(uniforms.vignette).smoothstep(0.55, 0.95)
    );
    const scanline = step(0.5, inputUv.y.mul(900.0).fract());
    const noise = inputUv.x
      .mul(812.0)
      .add(inputUv.y.mul(431.0))
      .add(uniforms.time.mul(60.0))
      .sin()
      .mul(0.04)
      .add(0.96);

    return vec3(uniforms.screenColor)
      .mul(vignette)
      .mul(noise)
      .sub(scanline.mul(uniforms.scanlineStrength.mul(0.08)));
  });
}

function useMsdfTextAssets({
  fontName,
  screenText,
  showCaret,
  caretMode,
  caretBlinkRate,
}) {
  const [assets, setAssets] = useState(null);
  const caretClock = useRef(0);
  const caretOn = useRef(true);

  useEffect(() => {
    let disposed = false;

    async function loadAssets() {
      const { font, atlas } = await generateMSDF(
        resolveCrtFontSource(fontName),
        {
          workerUrl: MSDF_WORKER_URL,
          wasmUrl: MSDF_WASM_URL,
          charset: CRT_MSDF_CHARSET,
          fontSize: CRT_MSDF_FONT_SIZE,
          textureSize: CRT_MSDF_TEXTURE_SIZE,
          fieldRange: CRT_MSDF_FIELD_RANGE,
        }
      );

      if (disposed) {
        atlas.dispose();
        return;
      }

      setAssets({ font, atlas });
    }

    loadAssets();

    return () => {
      disposed = true;
    };
  }, [fontName]);

  useFrame((_, delta) => {
    if (!showCaret || !assets) {
      return;
    }

    caretClock.current += delta;
    if (caretClock.current >= 1 / Math.max(caretBlinkRate, 0.001)) {
      caretClock.current = 0;
      caretOn.current = !caretOn.current;
    }
  });

  const resolvedText = useMemo(() => {
    if (!showCaret) {
      return screenText;
    }

    if (caretMode === 'underscore') {
      return `${screenText}${caretOn.current ? '_' : ' '}`;
    }

    if (caretMode === 'line') {
      return `${screenText}${caretOn.current ? '|' : ' '}`;
    }

    return `${screenText}${caretOn.current ? '█' : ' '}`;
  }, [caretMode, screenText, showCaret]);

  return { assets, resolvedText };
}

function MsdfTextOverlay({ assets, resolvedText, fontColor }) {
  const meshRef = useRef();

  const geometry = useMemo(() => {
    if (!assets) {
      return null;
    }

    return new MSDFTextGeometry({
      text: resolvedText,
      font: assets.font.data,
      align: 'center',
      width: 1500,
      lineHeight: 70,
      letterSpacing: 0,
    });
  }, [assets, resolvedText]);

  const material = useMemo(() => {
    if (!assets) {
      return null;
    }

    return new MSDFTextNodeMaterial({
      map: assets.atlas,
      color: fontColor,
      transparent: true,
      opacity: 1,
      isSmooth: 1,
      threshold: 0.5,
    });
  }, [assets, fontColor]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
      material?.dispose();
    };
  }, [geometry, material]);

  useFrame(() => {
    if (!meshRef.current || !geometry) {
      return;
    }

    meshRef.current.geometry = geometry;
  });

  if (!assets || !geometry || !material) {
    return null;
  }

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0.003]}
      scale={[0.0025, 0.0025, 0.0025]}
    >
      <primitive attach="geometry" object={geometry} />
      <primitive attach="material" object={material} />
    </mesh>
  );
}

function drawFallbackTextToCanvas({
  canvas,
  text,
  fontName,
  fontSize,
  fontColor,
  horizontalPadding,
  verticalPadding,
  showCaret,
  caretMode,
}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px "${fontName}"`;
  ctx.fillStyle = fontColor;
  ctx.textBaseline = 'top';

  const lineHeight = fontSize * 1.3;
  const maxWidth = canvas.width - horizontalPadding * 2;
  const chars = text.split('');
  let line = '';
  const lines = [];

  chars.forEach((char) => {
    if (char === '\n') {
      lines.push(line);
      line = '';
      return;
    }

    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = char;
      return;
    }

    line = test;
  });

  if (line) {
    lines.push(line);
  }

  lines.forEach((lineText, index) => {
    ctx.fillText(
      lineText,
      horizontalPadding,
      verticalPadding + index * lineHeight
    );
  });

  if (!showCaret || lines.length === 0) {
    return;
  }

  const lastLine = lines[lines.length - 1];
  const metrics = ctx.measureText(lastLine);
  const x = horizontalPadding + metrics.width + 4;
  const y = verticalPadding + (lines.length - 1) * lineHeight;
  const height =
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent ||
    fontSize;

  if (caretMode === 'underscore') {
    ctx.fillRect(x, y + fontSize * 1.05, fontSize * 0.8, 3);
  } else if (caretMode === 'line') {
    ctx.fillRect(x, y + 2, Math.max(3, fontSize * 0.08), height);
  } else {
    ctx.fillRect(x, y + 2, fontSize * 0.6, height);
  }
}

function FallbackCanvasTextOverlay({
  text,
  fontName,
  fontSize,
  fontColor,
  horizontalPadding,
  verticalPadding,
  showCaret,
  caretMode,
  caretBlinkRate,
}) {
  const textureRef = useRef(null);
  const canvasRef = useRef(null);
  const caretClock = useRef(0);
  const caretOn = useRef(true);

  if (!textureRef.current || !canvasRef.current) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    canvasRef.current = canvas;

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    textureRef.current = texture;
  }

  const redraw = (caretVisible) => {
    drawFallbackTextToCanvas({
      canvas: canvasRef.current,
      text,
      fontName,
      fontSize,
      fontColor,
      horizontalPadding,
      verticalPadding,
      showCaret: showCaret && caretVisible,
      caretMode,
    });
    textureRef.current.needsUpdate = true;
  };

  useEffect(() => {
    redraw(true);
  }, [
    caretMode,
    fontColor,
    fontName,
    fontSize,
    horizontalPadding,
    showCaret,
    text,
    verticalPadding,
  ]);

  useFrame((_, delta) => {
    if (!showCaret) {
      return;
    }

    caretClock.current += delta;
    if (caretClock.current >= 1 / Math.max(caretBlinkRate, 0.001)) {
      caretClock.current = 0;
      caretOn.current = !caretOn.current;
      redraw(caretOn.current);
    }
  });

  useEffect(
    () => () => {
      textureRef.current?.dispose?.();
    },
    []
  );

  return (
    <mesh position={[0, 0, 0.002]}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial
        transparent
        toneMapped={false}
        map={textureRef.current}
      />
    </mesh>
  );
}

export default function CRTBlueScreenMaterial({
  screenText = '12:00 FEB. 28, 1986',
  fontName = 'Press Start 2P',
  fontColor = '#FFFFFF',
  showCaret = false,
  caretMode = 'block',
  caretBlinkRate = 2,
  screenColor = '#0b2fd8',
  vignette = 1.15,
  scanlineStrength = 0.08,
  side = THREE.FrontSide,
  ...legacyProps
}) {
  const {
    fontSize = 28,
    horizontalPadding = 48,
    verticalPadding = 40,
    glowStrength = 0.35,
    curvature = 0.06,
    noiseStrength = 0.08,
    scanlineDensity = 900,
    rollSpeed = 0.4,
    rollStrength = 0,
    chromaOffset = 0.0025,
  } = legacyProps;

  const uniforms = useMemo(
    () => ({
      time: uniform(0),
      screenColor: uniform(new THREE.Color(screenColor)),
      vignette: uniform(vignette),
      scanlineStrength: uniform(scanlineStrength),
    }),
    []
  );

  useEffect(() => {
    uniforms.screenColor.value.set(screenColor);
    uniforms.vignette.value = vignette;
    uniforms.scanlineStrength.value = scanlineStrength;
  }, [screenColor, scanlineStrength, uniforms, vignette]);

  const backgroundMaterial = useMemo(() => {
    const nextMaterial = new THREE_WEBGPU.MeshBasicNodeMaterial({
      side,
      toneMapped: false,
    });

    nextMaterial.colorNode = buildScreenColorNode(uniforms)();
    return nextMaterial;
  }, [side, uniforms]);

  useEffect(() => {
    backgroundMaterial.userData.legacyProps = {
      fontSize,
      horizontalPadding,
      verticalPadding,
      glowStrength,
      curvature,
      noiseStrength,
      scanlineDensity,
      rollSpeed,
      rollStrength,
      chromaOffset,
    };
  }, [
    backgroundMaterial,
    chromaOffset,
    curvature,
    fontSize,
    glowStrength,
    horizontalPadding,
    noiseStrength,
    rollSpeed,
    rollStrength,
    scanlineDensity,
    verticalPadding,
  ]);

  useFrame(({ clock }) => {
    uniforms.time.value = clock.getElapsedTime();
  });

  const { assets, resolvedText } = useMsdfTextAssets({
    fontName,
    screenText,
    showCaret,
    caretMode,
    caretBlinkRate,
  });

  return (
    <>
      <primitive attach="material" object={backgroundMaterial} />
      <MsdfTextOverlay
        assets={assets}
        resolvedText={resolvedText}
        fontColor={fontColor}
      />
      <FallbackCanvasTextOverlay
        text={screenText}
        fontName={fontName}
        fontSize={fontSize}
        fontColor={fontColor}
        horizontalPadding={horizontalPadding}
        verticalPadding={verticalPadding}
        showCaret={showCaret}
        caretMode={caretMode}
        caretBlinkRate={caretBlinkRate}
      />
    </>
  );
}
