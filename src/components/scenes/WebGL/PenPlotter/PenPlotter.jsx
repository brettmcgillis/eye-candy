import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three';

import usePlotterControls from './Hooks/usePlotterControls';
import PlotView from './PlotView';
import { PlotterRenderer } from './PlotterRenderer/plotter-renderer';
import {
  downloadSvg,
  extractSvgMarkup,
  getThemeColors,
  getViewportLayout,
} from './utils/plotterUtils';

const VIEWPORT_DIVIDER_PX = 2;

export default function PenPlotter() {
  const svgOverlayRef = useRef(null);
  const plotterRendererRef = useRef(null);
  const offscreenGlRendererRef = useRef(null);
  const offscreenSizeRef = useRef({ width: 0, height: 0 });
  const configRef = useRef(null);
  const refreshStateRef = useRef({
    inFlight: false,
    pendingSnapshot: null,
  });
  const isMountedRef = useRef(true);
  const initialRefreshRequestedRef = useRef(false);
  const lastViewportSizeRef = useRef({ width: null, height: null });
  const getThree = useThree((state) => state.get);
  const viewportSize = useThree((state) => state.size);
  const [hasPreview, setHasPreview] = useState(false);
  const getFixedOverlayPosition = useCallback((_, __, size) => {
    if (!size) return [0, 0];
    return [size.width / 2, size.height / 2];
  }, []);

  const getCaptureAspect = useCallback(
    (cameraForProjection) => {
      const { size } = getThree();
      const layout = getViewportLayout(size);

      if (layout.leftWidth > 0 && layout.viewportHeight > 0) {
        return layout.captureAspect;
      }

      return Math.max(0.01, cameraForProjection?.aspect || 1);
    },
    [getThree]
  );

  const getCaptureSize = useCallback(() => {
    const { size } = getThree();
    const layout = getViewportLayout(size);

    return {
      width: Math.max(1, Math.round(layout.rightWidth)),
      height: Math.max(1, Math.round(layout.viewportHeight)),
    };
  }, [getThree]);

  const createProjectionCamera = useCallback(
    (cameraForProjection, captureAspect) => {
      if (!cameraForProjection) return null;

      cameraForProjection.updateMatrixWorld(true);
      if (cameraForProjection.updateProjectionMatrix) {
        cameraForProjection.updateProjectionMatrix();
      }

      const projectionCamera = cameraForProjection.clone();

      if (projectionCamera.isPerspectiveCamera) {
        projectionCamera.aspect = Math.max(
          0.01,
          captureAspect || cameraForProjection.aspect || 1
        );
      }

      projectionCamera.position.copy(cameraForProjection.position);
      projectionCamera.quaternion.copy(cameraForProjection.quaternion);
      projectionCamera.scale.copy(cameraForProjection.scale);
      projectionCamera.updateProjectionMatrix();
      projectionCamera.updateMatrixWorld(true);

      return projectionCamera;
    },
    []
  );

  const getOffscreenGlRenderer = useCallback((plotSize) => {
    if (!offscreenGlRendererRef.current) {
      offscreenGlRendererRef.current = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: 'low-power',
      });
      offscreenGlRendererRef.current.setPixelRatio(1);
      offscreenGlRendererRef.current.autoClear = true;
    }

    const targetWidth = Math.max(1, Math.round(plotSize.width));
    const targetHeight = Math.max(1, Math.round(plotSize.height));
    const previousSize = offscreenSizeRef.current;
    if (
      previousSize.width !== targetWidth ||
      previousSize.height !== targetHeight
    ) {
      offscreenGlRendererRef.current.setSize(targetWidth, targetHeight, false);
      offscreenSizeRef.current = {
        width: targetWidth,
        height: targetHeight,
      };
    }

    return offscreenGlRendererRef.current;
  }, []);

  const computePlotterSvg = useCallback(
    async (cfg, projectionCamera, plotSize, sourceScene) => {
      if (!sourceScene || !projectionCamera) {
        return null;
      }

      if (!plotterRendererRef.current) {
        plotterRendererRef.current = new PlotterRenderer();
      }

      const plotterRenderer = plotterRendererRef.current;
      const offscreenRenderer = getOffscreenGlRenderer(plotSize);
      plotterRenderer.setClearColor('#ffffff');
      plotterRenderer.setSize(plotSize.width, plotSize.height);
      plotterRenderer.setGLRenderer(offscreenRenderer);
      plotterRenderer.theme = cfg.theme;
      plotterRenderer.showSilhouettes = Boolean(cfg.showSilhouettes);
      plotterRenderer.showEdges = Boolean(cfg.showEdges);
      plotterRenderer.showHatches = Boolean(cfg.showHatches);
      plotterRenderer.showCrossHatches = Boolean(cfg.showCrossHatches);
      plotterRenderer.showPrimitivePoints = Boolean(cfg.showPrimitivePoints);
      plotterRenderer.showPrimitiveLines = Boolean(cfg.showPrimitiveLines);
      plotterRenderer.hiddenLineOptions = {
        smoothThreshold: cfg.smoothThreshold,
      };
      plotterRenderer.silhouetteOptions = {
        simplifyTolerance: cfg.silhouetteSimplifyTolerance,
        minArea: cfg.silhouetteMinArea,
        normalBuckets: cfg.silhouetteNormalBuckets,
      };
      plotterRenderer.edgeOptions = {
        stroke: null,
        strokeWidth: `${Math.max(0.7, cfg.strokeWidth * 1.1)}px`,
      };
      plotterRenderer.primitivePointOptions = {
        fill: null,
        radius: cfg.primitivePointRadius,
        opacity: cfg.primitivePointOpacity,
        densityQuantization: cfg.primitivePointDensityQuantization,
        maxCount: cfg.primitivePointDensityMaxCount,
      };
      plotterRenderer.primitiveLineOptions = {
        stroke: null,
        strokeWidth: `${Math.max(0.45, cfg.strokeWidth * cfg.primitiveLineStrokeWidthScale)}px`,
        opacity: cfg.primitiveLineOpacity,
        densityQuantization: cfg.primitiveLineDensityQuantization,
        maxSegments: cfg.primitiveLineDensityMaxSegments,
        minLength: cfg.primitiveLineDensityMinLength,
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
        strokeWidth: `${Math.max(0.6, cfg.strokeWidth * 0.85 * cfg.hatchStrokeWidthScale)}px`,
        baseSpacing: cfg.spaceX,
        frameBudgetMs: cfg.fullFrameBudgetMs || 10,
        insetPixels: cfg.insetPixels,
        minSpacing: cfg.minSpacing,
        maxSpacing: cfg.maxSpacing,
        maxSegments: cfg.hatchMaxSegments,
        connectHatches: Boolean(cfg.connectHatches),
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
      };
      plotterRenderer.crossHatchOptions = {
        stroke: null,
        strokeWidth: `${Math.max(0.6, cfg.strokeWidth * 0.85 * cfg.crossHatchStrokeWidthScale)}px`,
        baseSpacing: cfg.crossHatchSpaceX,
        frameBudgetMs: cfg.fullFrameBudgetMs || 10,
        insetPixels: cfg.crossHatchInsetPixels,
        minSpacing: cfg.minSpacing,
        maxSpacing: cfg.maxSpacing,
        maxSegments: cfg.crossHatchMaxSegments,
        connectHatches: Boolean(cfg.crossHatchConnectHatches),
        axisSettings: {
          x: { rotation: cfg.crossHatchRotX, spacing: cfg.crossHatchSpaceX },
          y: { rotation: cfg.crossHatchRotY, spacing: cfg.crossHatchSpaceY },
          z: { rotation: cfg.crossHatchRotZ, spacing: cfg.crossHatchSpaceZ },
        },
        brightnessShading: {
          enabled: Boolean(cfg.brightnessShading),
          invert: cfg.theme === 'dark',
          intensity: cfg.lightIntensity,
          lightDirection,
        },
      };

      sourceScene.updateMatrixWorld(true);
      projectionCamera.updateMatrixWorld(true);
      projectionCamera.updateProjectionMatrix();
      plotterRenderer.clear();
      await plotterRenderer.renderGPULayers(sourceScene, projectionCamera);

      const nextSvg = extractSvgMarkup(plotterRenderer.domElement);
      if (
        !nextSvg.outerHTML &&
        plotterRenderer.domElement?.outerHTML?.includes('<svg')
      ) {
        return {
          svg: plotterRenderer.domElement.outerHTML,
          fileName: `${cfg.exportName || 'plotter-test'}-output`,
          svgState: {
            innerHTML: plotterRenderer.domElement.innerHTML,
            outerHTML: plotterRenderer.domElement.outerHTML,
            viewBox: plotterRenderer.domElement.getAttribute('viewBox'),
          },
        };
      }
      if (!nextSvg.outerHTML) return null;

      return {
        svg: nextSvg.outerHTML,
        svgState: nextSvg,
        fileName: `${cfg.exportName || 'plotter-test'}-output`,
      };
    },
    [getOffscreenGlRenderer]
  );

  const createRefreshSnapshot = useCallback(
    (cfg, cameraForProjection) => {
      if (!cfg || !cameraForProjection) return null;

      const { scene } = getThree();
      if (!scene) return null;

      const captureAspect = getCaptureAspect(cameraForProjection);
      const projectionCamera = createProjectionCamera(
        cameraForProjection,
        captureAspect
      );
      if (!projectionCamera) return null;

      return {
        cfg: { ...cfg },
        sourceScene: scene,
        projectionCamera,
        plotSize: getCaptureSize(),
      };
    },
    [createProjectionCamera, getCaptureAspect, getCaptureSize, getThree]
  );

  const computePlotterOutput = useCallback(
    async (snapshot) => {
      if (!snapshot) return null;
      const output = await computePlotterSvg(
        snapshot.cfg,
        snapshot.projectionCamera,
        snapshot.plotSize,
        snapshot.sourceScene
      );
      if (!output?.svgState?.outerHTML) return null;

      if (svgOverlayRef.current) {
        svgOverlayRef.current.innerHTML = output.svgState.innerHTML || '';
        if (output.svgState.viewBox) {
          svgOverlayRef.current.setAttribute(
            'viewBox',
            output.svgState.viewBox
          );
        } else {
          svgOverlayRef.current.removeAttribute('viewBox');
        }
      }

      if (!isMountedRef.current) {
        return output;
      }

      return output;
    },
    [computePlotterSvg]
  );

  const scheduleRefresh = useCallback(
    (snapshot) => {
      if (!snapshot) return;

      const refreshState = refreshStateRef.current;
      refreshState.pendingSnapshot = snapshot;

      if (refreshState.inFlight) {
        return;
      }

      const processNext = async () => {
        const nextSnapshot = refreshState.pendingSnapshot;
        if (!nextSnapshot) {
          refreshState.inFlight = false;
          return;
        }

        refreshState.pendingSnapshot = null;

        // Yield once so camera interaction can present a fresh frame first.
        await new Promise((resolve) => {
          window.requestAnimationFrame(resolve);
        });

        const output = await computePlotterOutput(nextSnapshot);
        if (output && isMountedRef.current) {
          setHasPreview(true);
        }

        await processNext();
      };

      refreshState.inFlight = true;
      processNext().catch(() => {
        refreshState.inFlight = false;
      });
    },
    [computePlotterOutput]
  );

  const handleRefresh = useCallback(() => {
    if (!configRef.current) return;
    const snapshot = createRefreshSnapshot(
      configRef.current,
      getThree().camera
    );
    scheduleRefresh(snapshot);
  }, [createRefreshSnapshot, getThree, scheduleRefresh]);

  useEffect(() => {
    const isTypingTarget = (target) => {
      const element = target;
      if (!element) return false;

      const tagName = element.tagName?.toLowerCase();
      return (
        element.isContentEditable ||
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select'
      );
    };

    const onKeyDown = (event) => {
      if (event.code !== 'Space' || event.repeat) return;
      if (isTypingTarget(event.target)) return;

      event.preventDefault();
      handleRefresh();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleRefresh]);

  const handleExport = useCallback(
    async (snapshot) => {
      const cfg = snapshot || configRef.current;
      if (!cfg) return;

      const { camera } = getThree();
      const refreshSnapshot = createRefreshSnapshot(cfg, camera);
      if (!refreshSnapshot) return;

      const output = await computePlotterSvg(
        refreshSnapshot.cfg,
        refreshSnapshot.projectionCamera,
        refreshSnapshot.plotSize,
        refreshSnapshot.sourceScene
      );
      if (!output?.svg) return;

      downloadSvg(output.svg, output.fileName);
    },
    [computePlotterSvg, createRefreshSnapshot, getThree]
  );

  useEffect(
    () => () => {
      if (offscreenGlRendererRef.current) {
        offscreenGlRendererRef.current.dispose();
        offscreenGlRendererRef.current = null;
      }
    },
    []
  );

  const config = usePlotterControls({
    onExport: handleExport,
    onRefresh: handleRefresh,
  });

  const themeColors = useMemo(
    () => getThemeColors(config.theme),
    [config.theme]
  );

  const layout = useMemo(() => getViewportLayout(viewportSize), [viewportSize]);

  useEffect(() => {
    isMountedRef.current = true;

    configRef.current = config;

    return () => {
      isMountedRef.current = false;
    };
  }, [config]);

  // Render-on-mount disabled until async rendering is fully non-blocking.
  // useEffect(() => {
  //   if (initialRefreshRequestedRef.current || !configRef.current) {
  //     return undefined;
  //   }
  //
  //   initialRefreshRequestedRef.current = true;
  //   const frameId = window.requestAnimationFrame(() => {
  //     handleRefresh();
  //   });
  //
  //   return () => {
  //     window.cancelAnimationFrame(frameId);
  //   };
  // }, [handleRefresh, config]);

  useEffect(() => {
    const width = Math.round(Number(viewportSize?.width) || 0);
    const height = Math.round(Number(viewportSize?.height) || 0);

    if (!width || !height) {
      return undefined;
    }

    const previousSize = lastViewportSizeRef.current;
    if (previousSize.width === null || previousSize.height === null) {
      lastViewportSizeRef.current = { width, height };
      return undefined;
    }

    if (previousSize.width === width && previousSize.height === height) {
      return undefined;
    }

    lastViewportSizeRef.current = { width, height };

    const debounceMs = Math.max(
      0,
      Number(configRef.current?.interactiveDebounceMs) || 0
    );
    const timeoutId = window.setTimeout(() => {
      handleRefresh();
    }, debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [handleRefresh, viewportSize?.height, viewportSize?.width]);

  useFrame((state) => {
    if (!configRef.current) return;

    const { gl, size, camera: activeCamera, scene } = state;

    const { leftWidth, rightWidth, rightX, viewportHeight } =
      getViewportLayout(size);

    const originalAspect = activeCamera.aspect;
    const previousAutoClear = gl.autoClear;

    gl.autoClear = false;
    gl.setScissorTest(true);
    gl.clear(true, true, true);

    activeCamera.aspect = leftWidth / viewportHeight;
    activeCamera.updateProjectionMatrix();
    gl.setViewport(0, 0, leftWidth, viewportHeight);
    gl.setScissor(0, 0, leftWidth, viewportHeight);
    gl.render(scene, activeCamera);

    const previousClearColor = gl.getClearColor(new THREE.Color());
    const previousClearAlpha = gl.getClearAlpha();
    gl.setViewport(rightX, 0, rightWidth, viewportHeight);
    gl.setScissor(rightX, 0, rightWidth, viewportHeight);
    gl.setClearColor(themeColors.background, 1);
    gl.clear(true, true, true);
    gl.setClearColor(previousClearColor, previousClearAlpha);

    // Draw a fixed black separator directly on top of both viewports.
    const dividerX = Math.max(
      0,
      leftWidth - Math.floor(VIEWPORT_DIVIDER_PX / 2)
    );
    const dividerWidth = Math.min(VIEWPORT_DIVIDER_PX, size.width - dividerX);
    if (dividerWidth > 0) {
      const dividerClearColor = gl.getClearColor(new THREE.Color());
      const dividerClearAlpha = gl.getClearAlpha();
      gl.setViewport(dividerX, 0, dividerWidth, viewportHeight);
      gl.setScissor(dividerX, 0, dividerWidth, viewportHeight);
      gl.setClearColor('#000000', 1);
      gl.clear(true, false, false);
      gl.setClearColor(dividerClearColor, dividerClearAlpha);
    }

    activeCamera.aspect = originalAspect;
    activeCamera.updateProjectionMatrix();
    gl.setViewport(0, 0, size.width, size.height);
    gl.setScissor(0, 0, size.width, size.height);
    gl.setScissorTest(false);
    gl.autoClear = previousAutoClear;
  }, 1);

  useEffect(() => {
    return () => {
      const { gl, size } = getThree();
      gl.autoClear = true;
      gl.setScissorTest(false);
      gl.setViewport(0, 0, size.width, size.height);
      gl.setScissor(0, 0, size.width, size.height);
    };
  }, [getThree]);

  return (
    <>
      <PlotView />

      <Html
        fullscreen
        zIndexRange={[10, 0]}
        transform={false}
        calculatePosition={getFixedOverlayPosition}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: `${layout.rightX}px`,
              top: 0,
              width: `${layout.rightWidth}px`,
              height: `${layout.viewportHeight}px`,
              overflow: 'hidden',
            }}
          >
            <svg
              ref={svgOverlayRef}
              xmlns="http://www.w3.org/2000/svg"
              width={layout.rightWidth}
              height={layout.viewportHeight}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
              }}
            />

            {!hasPreview ? (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: themeColors.canvasText,
                  fontSize: '14px',
                  letterSpacing: '0.02em',
                  textAlign: 'center',
                }}
              >
                Press spacebar to render
              </div>
            ) : null}
          </div>
        </div>
      </Html>
    </>
  );
}
