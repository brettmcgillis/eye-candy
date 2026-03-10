import * as THREE from 'three';
import { PlotterRenderer } from 'three-plotter-renderer';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { PerspectiveCamera, Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

import CameraRig from '../../rigging/CameraRig';
import downloadSvg from './export/downloadSvg';
import usePlotterTestControls from './usePlotterTestControls';

const SOURCE_LAYER = 1;
const OUTPUT_LAYER = 2;

function applyLayerRecursive(root, layer) {
  if (!root) return;
  root.traverse((obj) => {
    obj.layers.set(layer);
  });
}

function drawSvgToCanvas(canvas, svgString) {
  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#fcfcfa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(true);
    };
    img.onerror = () => {
      resolve(false);
    };

    const encoded = encodeURIComponent(svgString)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22');
    img.src = `data:image/svg+xml;charset=utf-8,${encoded}`;
  });
}

export default function PlotterTest() {
  const sourceRef = useRef();
  const sourceViewRef = useRef();
  const outputViewRef = useRef();
  const sourceLightRef = useRef();
  const outputLightRef = useRef();
  const getThree = useThree((state) => state.get);
  const outputRenderCameraRef = useRef(null);
  const plotterRendererRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const previewTextureRef = useRef(null);
  const configRef = useRef(null);
  const isMountedRef = useRef(true);
  const computeRunningRef = useRef(false);
  const queuedComputeRef = useRef(null);
  const cameraSettledTimerRef = useRef(null);
  const refreshTickRef = useRef(0);
  const layerSyncTickRef = useRef(0);
  const cameraSignatureRef = useRef('');
  const controlsSignatureRef = useRef('');
  const [isPreviewComputing, setIsPreviewComputing] = useState(true);
  const [hasPreview, setHasPreview] = useState(false);

  const previewTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    previewCanvasRef.current = canvas;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    previewTextureRef.current = texture;
    return texture;
  }, []);

  useMemo(() => {
    const outputCamera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    outputCamera.position.set(0, 0, 8.5);
    outputCamera.lookAt(0, 0, 0);
    outputCamera.updateProjectionMatrix();
    outputRenderCameraRef.current = outputCamera;
    return outputCamera;
  }, []);

  const computePlotterOutput = useCallback(
    async (cfg, activeCamera, mode = 'full') => {
      const cameraForProjection = activeCamera || getThree().camera;
      const glRenderer = getThree().gl;
      if (
        !sourceRef.current ||
        !cameraForProjection ||
        !previewCanvasRef.current ||
        !glRenderer
      )
        return null;

      const fullResolution = Math.max(256, cfg.previewResolution || 1024);
      const isInteractive = mode === 'interactive';
      const resolution = isInteractive
        ? Math.min(fullResolution, 420)
        : fullResolution;
      const hatchMaxSegments = isInteractive
        ? Math.min(cfg.hatchMaxSegments, 900)
        : cfg.hatchMaxSegments;
      const hatchSpacing = isInteractive
        ? Math.max(cfg.hatchSpacing, 8)
        : cfg.hatchSpacing;
      const canvas = previewCanvasRef.current;
      if (canvas.width !== resolution || canvas.height !== resolution) {
        canvas.width = resolution;
        canvas.height = resolution;
      }

      if (!plotterRendererRef.current) {
        plotterRendererRef.current = new PlotterRenderer();
      }

      const plotterRenderer = plotterRendererRef.current;
      plotterRenderer.setSize(canvas.width, canvas.height);
      plotterRenderer.setGLRenderer(glRenderer);
      plotterRenderer.showSilhouettes = false;
      plotterRenderer.showEdges = true;
      plotterRenderer.showHatches = Boolean(cfg.showHatching);
      plotterRenderer.edgeOptions = {
        stroke: '#151515',
        strokeWidth: `${Math.max(0.7, cfg.strokeWidth * 1.1)}px`,
      };
      plotterRenderer.hatchOptions = {
        stroke: '#6e6e6e',
        strokeWidth: `${Math.max(0.6, cfg.strokeWidth * 0.85)}px`,
        baseSpacing: hatchSpacing,
        frameBudgetMs: isInteractive ? 4 : 10,
        axisSettings: {
          x: { rotation: cfg.hatchAngleDeg, spacing: hatchSpacing },
          y: { rotation: cfg.hatchAngleDeg, spacing: hatchSpacing },
          z: { rotation: cfg.hatchAngleDeg, spacing: hatchSpacing },
        },
        maxSegments: hatchMaxSegments,
      };

      plotterRenderer.clear();
      await plotterRenderer.renderGPULayers(
        sourceRef.current,
        cameraForProjection
      );
      const svgString = plotterRenderer.domElement?.outerHTML;
      if (!svgString) return null;

      await drawSvgToCanvas(canvas, svgString);

      if (previewTextureRef.current) {
        previewTextureRef.current.needsUpdate = true;
      }

      return { svgString, fileName: cfg.exportName || 'plotter-test' };
    },
    [getThree]
  );

  const runQueuedPreviewCompute = useCallback(() => {
    const next = queuedComputeRef.current;
    if (!next) {
      computeRunningRef.current = false;
      if (isMountedRef.current) setIsPreviewComputing(false);
      return;
    }

    queuedComputeRef.current = null;
    computeRunningRef.current = true;

    if (isMountedRef.current) setIsPreviewComputing(true);

    window.setTimeout(async () => {
      const output = await computePlotterOutput(
        next.cfg,
        next.camera,
        next.mode
      );
      if (output && isMountedRef.current) {
        setHasPreview(true);
      }

      runQueuedPreviewCompute();
    }, 0);
  }, [computePlotterOutput]);

  const requestPreviewCompute = useCallback(
    (cfg, activeCamera, mode = 'full') => {
      if (!cfg) return;

      queuedComputeRef.current = {
        cfg,
        camera: activeCamera || getThree().camera,
        mode,
      };

      if (!computeRunningRef.current) {
        runQueuedPreviewCompute();
      }
    },
    [getThree, runQueuedPreviewCompute]
  );

  const handleRefresh = useCallback(() => {
    if (!configRef.current) return;
    requestPreviewCompute(configRef.current, getThree().camera, 'full');
  }, [getThree, requestPreviewCompute]);

  const handleExport = useCallback(
    async (snapshot) => {
      const cfg = snapshot || configRef.current;
      if (!cfg) return;

      const output = await computePlotterOutput(cfg, getThree().camera, 'full');
      if (!output?.svgString) return;

      downloadSvg(output.svgString, output.fileName);
    },
    [computePlotterOutput, getThree]
  );

  const config = usePlotterTestControls({
    onExport: handleExport,
    onRefresh: handleRefresh,
  });

  useEffect(() => {
    isMountedRef.current = true;

    configRef.current = config;

    return () => {
      isMountedRef.current = false;
      if (cameraSettledTimerRef.current) {
        window.clearTimeout(cameraSettledTimerRef.current);
        cameraSettledTimerRef.current = null;
      }
    };
  }, [config]);

  useEffect(() => {
    if (!configRef.current) return;
    requestPreviewCompute(configRef.current, getThree().camera, 'interactive');
  }, [config, getThree, requestPreviewCompute]);

  useEffect(() => {
    applyLayerRecursive(sourceViewRef.current, SOURCE_LAYER);
    applyLayerRecursive(outputViewRef.current, OUTPUT_LAYER);
    applyLayerRecursive(sourceLightRef.current, SOURCE_LAYER);
    applyLayerRecursive(outputLightRef.current, OUTPUT_LAYER);
  }, []);

  useFrame((state) => {
    if (!configRef.current?.autoRefresh) return;

    refreshTickRef.current += 1;
    if (refreshTickRef.current % 8 !== 0) return;

    const cfg = configRef.current;

    const activeCamera = state.camera;
    const cameraSig = `${activeCamera.position.x.toFixed(3)}:${activeCamera.position.y.toFixed(
      3
    )}:${activeCamera.position.z.toFixed(3)}:${activeCamera.quaternion.x.toFixed(
      3
    )}:${activeCamera.quaternion.y.toFixed(3)}:${activeCamera.quaternion.z.toFixed(
      3
    )}:${activeCamera.quaternion.w.toFixed(3)}`;

    const controlsSig = [
      cfg.previewResolution,
      cfg.strokeWidth,
      cfg.showHatching,
      cfg.hatchSpacing,
      cfg.hatchAngleDeg,
      cfg.hatchThreshold,
      cfg.hatchMaxSegments,
      cfg.panelScale,
      cfg.paperWidthMm,
      cfg.paperHeightMm,
      cfg.marginMm,
      cfg.precision,
    ].join('|');

    const cameraChanged = cameraSig !== cameraSignatureRef.current;
    const controlsChanged = controlsSig !== controlsSignatureRef.current;

    if (!cameraChanged && !controlsChanged) return;

    if (cameraChanged) {
      cameraSignatureRef.current = cameraSig;

      if (cameraSettledTimerRef.current) {
        window.clearTimeout(cameraSettledTimerRef.current);
      }

      cameraSettledTimerRef.current = window.setTimeout(() => {
        if (!configRef.current?.autoRefresh) return;
        requestPreviewCompute(configRef.current, activeCamera, 'interactive');
      }, 220);
    }

    if (controlsChanged) {
      controlsSignatureRef.current = controlsSig;
      requestPreviewCompute(cfg, activeCamera, 'full');
    }
  });

  useFrame((state) => {
    if (!configRef.current) return;

    const { gl, size, camera: activeCamera, scene } = state;
    const outputCamera = outputRenderCameraRef.current;
    if (!outputCamera) return;

    const splitRatio = THREE.MathUtils.clamp(
      configRef.current.splitRatio,
      0.2,
      0.8
    );
    const gapRatio = THREE.MathUtils.clamp(
      configRef.current.viewportGapRatio,
      0,
      0.2
    );
    const gapPx = Math.floor(size.width * gapRatio);
    const leftWidth = Math.max(
      1,
      Math.floor((size.width - gapPx) * splitRatio)
    );
    const rightWidth = Math.max(1, size.width - gapPx - leftWidth);
    const rightX = leftWidth + gapPx;

    const originalAspect = activeCamera.aspect;

    gl.autoClear = false;
    gl.setScissorTest(true);
    gl.clear(true, true, true);

    activeCamera.layers.set(SOURCE_LAYER);
    activeCamera.aspect = leftWidth / size.height;
    activeCamera.updateProjectionMatrix();
    gl.setViewport(0, 0, leftWidth, size.height);
    gl.setScissor(0, 0, leftWidth, size.height);
    gl.render(scene, activeCamera);

    gl.clearDepth();
    outputCamera.layers.set(OUTPUT_LAYER);
    outputCamera.aspect = rightWidth / size.height;
    outputCamera.updateProjectionMatrix();
    gl.setViewport(rightX, 0, rightWidth, size.height);
    gl.setScissor(rightX, 0, rightWidth, size.height);
    gl.render(scene, outputCamera);

    activeCamera.layers.set(SOURCE_LAYER);
    activeCamera.layers.enable(OUTPUT_LAYER);
    activeCamera.aspect = originalAspect;
    activeCamera.updateProjectionMatrix();
    gl.setScissorTest(false);

    layerSyncTickRef.current += 1;
    if (layerSyncTickRef.current % 90 === 0) {
      applyLayerRecursive(sourceViewRef.current, SOURCE_LAYER);
      applyLayerRecursive(outputViewRef.current, OUTPUT_LAYER);
      applyLayerRecursive(sourceLightRef.current, SOURCE_LAYER);
      applyLayerRecursive(outputLightRef.current, OUTPUT_LAYER);
    }
  }, 1);

  return (
    <>
      <color attach="background" args={['#f4f1e8']} />

      <PerspectiveCamera makeDefault fov={34} position={[0, 0, 13]} />
      <CameraRig />

      <group ref={sourceLightRef}>
        <ambientLight intensity={0.12} />
        <directionalLight intensity={1.6} position={[5.5, 7, 4]} castShadow />
        <directionalLight intensity={0.8} position={[-3.5, 2.5, -4.5]} />
        <pointLight intensity={0.5} position={[0, -2.2, 3]} />
      </group>

      <group ref={outputLightRef}>
        <ambientLight intensity={0.95} />
      </group>

      <group ref={sourceViewRef}>
        <group ref={sourceRef}>
          <mesh
            position={[-0.8, 0.15, 0.1]}
            rotation={[0.22, -0.5, 0.08]}
            castShadow
          >
            <boxGeometry args={[1.15, 1.15, 1.15]} />
            <meshStandardMaterial
              color="#d64a38"
              roughness={0.35}
              metalness={0.08}
            />
          </mesh>
          <mesh position={[0.95, -0.25, -0.2]} castShadow>
            <sphereGeometry args={[0.75, 48, 48]} />
            <meshStandardMaterial
              color="#f1f0ea"
              roughness={0.18}
              metalness={0.12}
            />
          </mesh>
          <mesh
            position={[0, -1.18, -0.55]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[5.5, 3.8, 40, 28]} />
            <meshStandardMaterial
              color="#121212"
              roughness={0.92}
              metalness={0.02}
            />
          </mesh>
        </group>
      </group>

      <group ref={outputViewRef}>
        <mesh
          scale={[config.panelScale, config.panelScale, 1]}
          position={[0, 0, 0]}
        >
          <planeGeometry args={[1.2, 1.2]} />
          <meshBasicMaterial map={previewTexture} toneMapped={false} />
        </mesh>

        {(isPreviewComputing || !hasPreview) && (
          <Text
            position={[0, -config.panelScale * 0.56, 0.08]}
            fontSize={0.08}
            color="#4a4a4a"
            anchorX="center"
            anchorY="middle"
          >
            Generating preview...
          </Text>
        )}
      </group>
    </>
  );
}
