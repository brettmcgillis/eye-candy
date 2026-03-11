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
const VIEWPORT_DIVIDER_PX = 2;

function getThemeColors(theme) {
  return theme === 'light'
    ? {
        background: '#ffffff',
        canvasText: '#2f2f2f',
        sourceAmbient: 2.0,
      }
    : {
        background: '#222222',
        canvasText: '#e0e0e0',
        sourceAmbient: 0.25,
      };
}

function applyLayerRecursive(root, layer) {
  if (!root) return;
  root.traverse((obj) => {
    obj.layers.set(layer);
  });
}

function drawSvgToCanvas(canvas, svgString, options = {}) {
  return new Promise((resolve) => {
    const {
      clear = true,
      background = '#fcfcfa',
      x = 0,
      y = 0,
      width = canvas.width,
      height = canvas.height,
    } = options;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      if (clear) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, x, y, width, height);
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

function extractLatestSvgString(domElement, size) {
  if (!domElement) {
    return { svgString: null, svgNodeCount: 0 };
  }

  const isRootSvg = domElement.tagName?.toLowerCase() === 'svg';
  const svgNodes = isRootSvg
    ? [domElement]
    : Array.from(domElement.querySelectorAll?.('svg') || []);
  const svgNodeCount = svgNodes.length;
  const latestSvg = svgNodes[svgNodeCount - 1];
  if (!latestSvg) {
    return { svgString: null, svgNodeCount };
  }

  const svgClone = latestSvg.cloneNode(true);
  if (!svgClone.getAttribute('xmlns')) {
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  if (!svgClone.getAttribute('viewBox')) {
    svgClone.setAttribute('viewBox', `0 0 ${size} ${size}`);
  }
  svgClone.setAttribute('width', String(size));
  svgClone.setAttribute('height', String(size));

  const svgString = new XMLSerializer().serializeToString(svgClone);
  return { svgString, svgNodeCount };
}

export default function PlotterTest() {
  const sourceRef = useRef();
  const sourceViewRef = useRef();
  const outputViewRef = useRef();
  const sourceLightRef = useRef();
  const outputLightRef = useRef();
  const sourceAmbientLightRef = useRef();
  const sourcePointLightRef = useRef();
  const getThree = useThree((state) => state.get);
  const outputRenderCameraRef = useRef(null);
  const plotterRendererRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const previewTextureRef = useRef(null);
  const configRef = useRef(null);
  const isMountedRef = useRef(true);
  const computeRunningRef = useRef(false);
  const computeStateRef = useRef('idle');
  const queuedComputeRef = useRef(null);
  const computeStatsRef = useRef({
    requests: 0,
    superseded: 0,
    errors: 0,
  });
  const cameraSettledTimerRef = useRef(null);
  const controlsSettledTimerRef = useRef(null);
  const initialRenderDoneRef = useRef(false);
  const refreshTickRef = useRef(0);
  const layerSyncTickRef = useRef(0);
  const cameraSignatureRef = useRef('');
  const controlsSignatureRef = useRef('');
  const [isPreviewComputing, setIsPreviewComputing] = useState(true);
  const [hasPreview, setHasPreview] = useState(false);
  const [renderProgress, setRenderProgress] = useState(null);
  const [, setDiagnostics] = useState({
    computeState: 'idle',
    queueDepth: 0,
    requests: 0,
    superseded: 0,
    errors: 0,
    lastComputeMs: 0,
    lastRenderer: 'none',
    lastPreviewMode: 'none',
    lastSvgNodes: 0,
  });

  const updateDiagnostics = useCallback((partial) => {
    setDiagnostics((prev) => ({ ...prev, ...partial }));
  }, []);

  const previewTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fcfcfa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    previewCanvasRef.current = canvas;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    previewTextureRef.current = texture;
    return texture;
  }, []);

  useMemo(() => {
    const outputCamera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    outputCamera.position.set(0, 0, 13);
    outputCamera.lookAt(0, 0, 0);
    outputCamera.updateProjectionMatrix();
    outputRenderCameraRef.current = outputCamera;
    return outputCamera;
  }, []);

  const getPreviewResolution = useCallback((cfg) => {
    return Math.max(256, cfg.previewResolution || 1024);
  }, []);

  const getInteractiveConfig = useCallback(
    (cfg) => {
      const interactiveResolution = Math.max(
        256,
        Math.floor(getPreviewResolution(cfg) * 0.5)
      );

      return {
        ...cfg,
        previewResolution: interactiveResolution,
        // Keep interactive updates responsive while orbiting.
        showSilhouettes: false,
        showHatches: false,
        hatchMaxSegments: Math.min(cfg.hatchMaxSegments || 2200, 900),
        thirdPartyFullFrameBudgetMs: Math.min(
          cfg.thirdPartyFullFrameBudgetMs || 10,
          6
        ),
      };
    },
    [getPreviewResolution]
  );

  const getPlotterControlsSignature = useCallback((cfg) => {
    return [
      cfg.theme,
      cfg.previewResolution,
      cfg.strokeWidth,
      cfg.showSilhouettes,
      cfg.showEdges,
      cfg.showHatches,
      cfg.rotX,
      cfg.rotY,
      cfg.rotZ,
      cfg.spaceX,
      cfg.spaceY,
      cfg.spaceZ,
      cfg.insetPixels,
      cfg.connectHatches,
      cfg.brightnessShading,
      cfg.minSpacing,
      cfg.maxSpacing,
      cfg.lightX,
      cfg.lightY,
      cfg.lightZ,
      cfg.lightIntensity,
      cfg.hatchMaxSegments,
      cfg.thirdPartyFullFrameBudgetMs,
      cfg.thirdPartySilhouetteMinArea,
      cfg.thirdPartySilhouetteNormalBuckets,
      cfg.thirdPartySilhouetteSimplifyTolerance,
      cfg.thirdPartySmoothThreshold,
    ].join('|');
  }, []);

  const computeThirdPartySvg = useCallback(
    async (cfg, cameraForProjection, onProgress = null) => {
      const glRenderer = getThree().gl;
      if (!sourceRef.current || !cameraForProjection || !glRenderer) {
        return null;
      }

      const resolution = getPreviewResolution(cfg);

      if (!plotterRendererRef.current) {
        plotterRendererRef.current = new PlotterRenderer();
      }

      const plotterRenderer = plotterRendererRef.current;
      const colors = getThemeColors(cfg.theme);
      plotterRenderer.setSize(resolution, resolution);
      plotterRenderer.setGLRenderer(glRenderer);
      plotterRenderer.theme = cfg.theme;
      plotterRenderer.showSilhouettes = Boolean(cfg.showSilhouettes);
      plotterRenderer.showEdges = Boolean(cfg.showEdges);
      plotterRenderer.showHatches = Boolean(cfg.showHatches);
      plotterRenderer.hiddenLineOptions = {
        smoothThreshold: cfg.thirdPartySmoothThreshold,
      };
      plotterRenderer.silhouetteOptions = {
        simplifyTolerance: cfg.thirdPartySilhouetteSimplifyTolerance,
        minArea: cfg.thirdPartySilhouetteMinArea,
        normalBuckets: cfg.thirdPartySilhouetteNormalBuckets,
      };
      plotterRenderer.edgeOptions = {
        stroke: null,
        strokeWidth: `${Math.max(0.7, cfg.strokeWidth * 1.1)}px`,
      };

      const lightDirection = new THREE.Vector3(
        cfg.lightX,
        cfg.lightY,
        cfg.lightZ
      );
      if (lightDirection.lengthSq() < 0.0001) {
        lightDirection.set(1, 1, 1);
      }
      lightDirection.normalize();

      plotterRenderer.hatchOptions = {
        stroke: null,
        strokeWidth: `${Math.max(0.6, cfg.strokeWidth * 0.85)}px`,
        baseSpacing: cfg.spaceX,
        frameBudgetMs: cfg.thirdPartyFullFrameBudgetMs || 10,
        insetPixels: cfg.insetPixels,
        minSpacing: cfg.minSpacing,
        maxSpacing: cfg.maxSpacing,
        connectHatches: Boolean(cfg.connectHatches),
        progressCallback: onProgress || undefined,
        axisSettings: {
          x: { rotation: cfg.rotX, spacing: cfg.spaceX },
          y: { rotation: cfg.rotY, spacing: cfg.spaceY },
          z: { rotation: cfg.rotZ, spacing: cfg.spaceZ },
        },
        brightnessShading: {
          enabled: Boolean(cfg.brightnessShading),
          invert: cfg.theme === 'dark',
          intensity: cfg.lightIntensity,
          lightDirection,
        },
        maxSegments: cfg.hatchMaxSegments,
      };

      plotterRenderer.clear();
      await plotterRenderer.renderGPULayers(
        sourceRef.current,
        cameraForProjection
      );
      const { svgString, svgNodeCount } = extractLatestSvgString(
        plotterRenderer.domElement,
        resolution
      );
      if (
        !svgString &&
        plotterRenderer.domElement?.outerHTML?.includes('<svg')
      ) {
        return {
          svgString: plotterRenderer.domElement.outerHTML,
          fileName: `${cfg.exportName || 'plotter-test'}-third-party`,
          renderer: 'thirdParty',
          svgNodeCount: 1,
          backgroundColor: colors.background,
        };
      }
      if (!svgString) return null;

      return {
        svgString,
        fileName: `${cfg.exportName || 'plotter-test'}-third-party`,
        renderer: 'thirdParty',
        svgNodeCount,
        backgroundColor: colors.background,
      };
    },
    [getPreviewResolution, getThree]
  );

  const computePlotterOutput = useCallback(
    async (cfg, activeCamera, onProgress = null, mode = 'full') => {
      const cameraForProjection = activeCamera || getThree().camera;
      if (!cameraForProjection || !previewCanvasRef.current) return null;

      const effectiveCfg =
        mode === 'interactive' ? getInteractiveConfig(cfg) : cfg;

      const resolution = getPreviewResolution(effectiveCfg);
      const canvas = previewCanvasRef.current;
      if (canvas.width !== resolution || canvas.height !== resolution) {
        canvas.width = resolution;
        canvas.height = resolution;
      }

      const output = await computeThirdPartySvg(
        effectiveCfg,
        cameraForProjection,
        onProgress
      );
      if (!output?.svgString) return null;

      await drawSvgToCanvas(canvas, output.svgString, {
        background: output.backgroundColor || '#fcfcfa',
      });
      if (previewTextureRef.current) {
        previewTextureRef.current.needsUpdate = true;
      }

      return output;
    },
    [computeThirdPartySvg, getInteractiveConfig, getPreviewResolution, getThree]
  );

  const runQueuedPreviewCompute = useCallback(() => {
    const next = queuedComputeRef.current;
    if (!next) {
      computeRunningRef.current = false;
      computeStateRef.current = 'idle';
      updateDiagnostics({ computeState: 'idle', queueDepth: 0 });
      if (isMountedRef.current) setIsPreviewComputing(false);
      return;
    }

    queuedComputeRef.current = null;
    computeRunningRef.current = true;
    computeStateRef.current = 'running';
    updateDiagnostics({ computeState: 'running', queueDepth: 0 });

    if (isMountedRef.current) setIsPreviewComputing(true);

    window.setTimeout(async () => {
      const startTime = performance.now();
      const onProgress = (p) => {
        if (next.mode === 'interactive') return;
        if (isMountedRef.current) setRenderProgress(Math.round(p * 100));
      };
      try {
        const output = await computePlotterOutput(
          next.cfg,
          next.camera,
          onProgress,
          next.mode
        );
        const computeMs = Math.round((performance.now() - startTime) * 10) / 10;
        if (isMountedRef.current) {
          setRenderProgress(null);
          if (output) {
            setHasPreview(true);
            updateDiagnostics({
              lastComputeMs: computeMs,
              lastRenderer: output.renderer || 'unknown',
              lastPreviewMode: next.mode,
              lastSvgNodes: output.svgNodeCount || 0,
            });
          }
        }
      } catch {
        computeStatsRef.current.errors += 1;
        if (isMountedRef.current) {
          setRenderProgress(null);
          setHasPreview(false);
        }
        updateDiagnostics({ errors: computeStatsRef.current.errors });
      }

      runQueuedPreviewCompute();
    }, 0);
  }, [computePlotterOutput, setRenderProgress, updateDiagnostics]);

  const requestPreviewCompute = useCallback(
    (cfg, activeCamera, mode = 'full') => {
      if (!cfg) return;

      computeStatsRef.current.requests += 1;
      if (queuedComputeRef.current) {
        computeStatsRef.current.superseded += 1;
      }

      queuedComputeRef.current = {
        cfg,
        camera: activeCamera || getThree().camera,
        mode,
      };

      const queueDepth = computeRunningRef.current ? 1 : 0;
      updateDiagnostics({
        queueDepth,
        requests: computeStatsRef.current.requests,
        superseded: computeStatsRef.current.superseded,
      });

      if (!computeRunningRef.current) {
        computeStateRef.current = 'queued';
        updateDiagnostics({ computeState: 'queued' });
        runQueuedPreviewCompute();
      }
    },
    [getThree, runQueuedPreviewCompute, updateDiagnostics]
  );

  const handleRefresh = useCallback(() => {
    if (!configRef.current) return;
    requestPreviewCompute(configRef.current, getThree().camera, 'full');
  }, [getThree, requestPreviewCompute]);

  const handleExport = useCallback(
    async (snapshot) => {
      const cfg = snapshot || configRef.current;
      if (!cfg) return;

      const { camera } = getThree();
      const output = await computeThirdPartySvg(cfg, camera);
      if (!output?.svgString) return;

      downloadSvg(output.svgString, output.fileName);
    },
    [computeThirdPartySvg, getThree]
  );

  const config = usePlotterTestControls({
    onExport: handleExport,
    onRefresh: handleRefresh,
  });

  const themeColors = useMemo(
    () => getThemeColors(config.theme),
    [config.theme]
  );

  const sceneConfig = useMemo(
    () => ({
      autoRefresh: config.autoRefresh,
      theme: config.theme,
      previewResolution: config.previewResolution,
      strokeWidth: config.strokeWidth,
      showSilhouettes: config.showSilhouettes,
      showEdges: config.showEdges,
      showHatches: config.showHatches,
      rotX: config.rotX,
      rotY: config.rotY,
      rotZ: config.rotZ,
      spaceX: config.spaceX,
      spaceY: config.spaceY,
      spaceZ: config.spaceZ,
      insetPixels: config.insetPixels,
      connectHatches: config.connectHatches,
      brightnessShading: config.brightnessShading,
      minSpacing: config.minSpacing,
      maxSpacing: config.maxSpacing,
      lightX: config.lightX,
      lightY: config.lightY,
      lightZ: config.lightZ,
      lightIntensity: config.lightIntensity,
      hatchMaxSegments: config.hatchMaxSegments,
      thirdPartyInteractiveDebounceMs: config.thirdPartyInteractiveDebounceMs,
      thirdPartyFullFrameBudgetMs: config.thirdPartyFullFrameBudgetMs,
      thirdPartySmoothThreshold: config.thirdPartySmoothThreshold,
      thirdPartySilhouetteSimplifyTolerance:
        config.thirdPartySilhouetteSimplifyTolerance,
      thirdPartySilhouetteMinArea: config.thirdPartySilhouetteMinArea,
      thirdPartySilhouetteNormalBuckets:
        config.thirdPartySilhouetteNormalBuckets,
      panelScale: config.panelScale,
      splitRatio: config.splitRatio,
      paperWidthMm: config.paperWidthMm,
      paperHeightMm: config.paperHeightMm,
      marginMm: config.marginMm,
      precision: config.precision,
      exportName: config.exportName,
    }),
    [
      config.autoRefresh,
      config.exportName,
      config.hatchMaxSegments,
      config.insetPixels,
      config.lightIntensity,
      config.lightX,
      config.lightY,
      config.lightZ,
      config.marginMm,
      config.maxSpacing,
      config.minSpacing,
      config.panelScale,
      config.paperHeightMm,
      config.paperWidthMm,
      config.precision,
      config.previewResolution,
      config.rotX,
      config.rotY,
      config.rotZ,
      config.showEdges,
      config.showHatches,
      config.showSilhouettes,
      config.spaceX,
      config.spaceY,
      config.spaceZ,
      config.splitRatio,
      config.strokeWidth,
      config.thirdPartyFullFrameBudgetMs,
      config.theme,
      config.thirdPartyInteractiveDebounceMs,
      config.thirdPartySilhouetteMinArea,
      config.thirdPartySilhouetteNormalBuckets,
      config.thirdPartySilhouetteSimplifyTolerance,
      config.thirdPartySmoothThreshold,
    ]
  );

  useEffect(() => {
    isMountedRef.current = true;

    configRef.current = sceneConfig;

    return () => {
      isMountedRef.current = false;
      if (cameraSettledTimerRef.current) {
        window.clearTimeout(cameraSettledTimerRef.current);
        cameraSettledTimerRef.current = null;
      }
      if (controlsSettledTimerRef.current) {
        window.clearTimeout(controlsSettledTimerRef.current);
        controlsSettledTimerRef.current = null;
      }
    };
  }, [sceneConfig]);

  useEffect(() => {
    if (!configRef.current || initialRenderDoneRef.current) return;
    initialRenderDoneRef.current = true;
    requestPreviewCompute(configRef.current, getThree().camera, 'full');
  }, [sceneConfig, getThree, requestPreviewCompute]);

  useEffect(() => {
    if (!configRef.current) return;

    const colors = getThemeColors(configRef.current.theme);
    const previewCanvas = previewCanvasRef.current;
    const previewCtx = previewCanvas?.getContext('2d');
    if (previewCtx && previewCanvas && !hasPreview) {
      // Keep a visible paper placeholder before first plot render.
      previewCtx.fillStyle = '#f4f1e8';
      previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      if (previewTextureRef.current) {
        previewTextureRef.current.needsUpdate = true;
      }
    }

    if (sourceAmbientLightRef.current) {
      sourceAmbientLightRef.current.intensity = colors.sourceAmbient;
    }

    if (sourcePointLightRef.current) {
      sourcePointLightRef.current.position.set(
        configRef.current.lightX,
        configRef.current.lightY,
        configRef.current.lightZ
      );
      sourcePointLightRef.current.intensity = configRef.current.lightIntensity;
    }
  }, [hasPreview, sceneConfig]);

  useEffect(() => {
    applyLayerRecursive(sourceViewRef.current, SOURCE_LAYER);
    applyLayerRecursive(outputViewRef.current, OUTPUT_LAYER);
    applyLayerRecursive(sourceLightRef.current, SOURCE_LAYER);
    applyLayerRecursive(outputLightRef.current, OUTPUT_LAYER);
  }, []);

  useFrame((state) => {
    if (!configRef.current) return;

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

    const controlsSig = getPlotterControlsSignature(cfg);

    const cameraChanged = cameraSig !== cameraSignatureRef.current;
    const controlsChanged = controlsSig !== controlsSignatureRef.current;

    if (!cameraChanged && !controlsChanged) return;

    if (controlsChanged) {
      controlsSignatureRef.current = controlsSig;
      requestPreviewCompute(cfg, activeCamera, 'interactive');

      if (controlsSettledTimerRef.current) {
        window.clearTimeout(controlsSettledTimerRef.current);
      }

      controlsSettledTimerRef.current = window.setTimeout(
        () => {
          requestPreviewCompute(cfg, activeCamera, 'full');
        },
        Math.max(120, cfg.thirdPartyInteractiveDebounceMs || 360)
      );
    }

    if (!cfg.autoRefresh) return;

    if (cameraChanged) {
      cameraSignatureRef.current = cameraSig;

      requestPreviewCompute(cfg, activeCamera, 'interactive');

      // Third-party GPU layer extraction is debounced; with frameBudgetMs
      // yielding to the browser, camera-settle recomputes stay non-blocking.
      if (cameraSettledTimerRef.current) {
        window.clearTimeout(cameraSettledTimerRef.current);
      }

      cameraSettledTimerRef.current = window.setTimeout(
        () => {
          if (!configRef.current?.autoRefresh) return;
          requestPreviewCompute(configRef.current, activeCamera, 'full');
        },
        Math.max(120, cfg.thirdPartyInteractiveDebounceMs || 360)
      );
    }
  }, 0);

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
    const leftWidth = Math.max(1, Math.floor(size.width * splitRatio));
    const rightWidth = Math.max(1, size.width - leftWidth);
    const rightX = leftWidth;

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

    // Draw a fixed black separator directly on top of both viewports.
    const dividerX = Math.max(
      0,
      leftWidth - Math.floor(VIEWPORT_DIVIDER_PX / 2)
    );
    const dividerWidth = Math.min(VIEWPORT_DIVIDER_PX, size.width - dividerX);
    if (dividerWidth > 0) {
      const previousClearColor = gl.getClearColor(new THREE.Color());
      const previousClearAlpha = gl.getClearAlpha();
      gl.setViewport(dividerX, 0, dividerWidth, size.height);
      gl.setScissor(dividerX, 0, dividerWidth, size.height);
      gl.setClearColor('#000000', 1);
      gl.clear(true, false, false);
      gl.setClearColor(previousClearColor, previousClearAlpha);
    }

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
      <color attach="background" args={[themeColors.background]} />

      <PerspectiveCamera makeDefault fov={34} position={[0, 0, 13]} />
      <CameraRig />

      <group ref={sourceLightRef}>
        <ambientLight
          ref={sourceAmbientLightRef}
          intensity={themeColors.sourceAmbient}
        />
        <directionalLight intensity={1.6} position={[5.5, 7, 4]} castShadow />
        <directionalLight intensity={0.8} position={[-3.5, 2.5, -4.5]} />
        <pointLight
          ref={sourcePointLightRef}
          intensity={config.lightIntensity}
          position={[config.lightX, config.lightY, config.lightZ]}
        />
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
            color={themeColors.canvasText}
            anchorX="center"
            anchorY="middle"
          >
            {renderProgress !== null
              ? `Rendering... ${renderProgress}%`
              : 'Generating preview...'}
          </Text>
        )}
      </group>
    </>
  );
}
