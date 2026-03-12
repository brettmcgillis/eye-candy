import * as THREE from 'three';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

import TestScene from './TestScene';
import { PlotterRenderer } from './examples/PlotterRenderer/plotter-renderer';
import downloadSvg from './export/downloadSvg';
import usePlotterTestControls from './usePlotterTestControls';

const VIEWPORT_DIVIDER_PX = 2;
const FIXED_SPLIT_RATIO = 0.5;

function getThemeColors(theme) {
  return theme === 'light'
    ? {
        background: '#ffffff',
        canvasText: '#2f2f2f',
        sourceAmbient: 2.0,
        gridCenter: 0xcccccc,
        gridLines: 0xdddddd,
        paperBackground: '#f4f1e8',
      }
    : {
        background: '#222222',
        canvasText: '#e0e0e0',
        sourceAmbient: 0.25,
        gridCenter: 0x444444,
        gridLines: 0x333333,
        paperBackground: '#2a2a2a',
      };
}

function getViewportLayout(size) {
  const viewportWidth = Math.max(1, Number(size?.width) || 1);
  const viewportHeight = Math.max(1, Number(size?.height) || 1);
  const leftWidth = Math.max(1, Math.floor(viewportWidth * FIXED_SPLIT_RATIO));
  const rightWidth = Math.max(1, viewportWidth - leftWidth);

  return {
    leftWidth,
    rightWidth,
    rightX: leftWidth,
    viewportHeight,
    captureAspect: leftWidth / viewportHeight,
  };
}

function extractSvgMarkup(domElement) {
  if (!domElement) {
    return { innerHTML: '', outerHTML: '', viewBox: null };
  }

  return {
    innerHTML: domElement.innerHTML,
    outerHTML: domElement.outerHTML,
    viewBox: domElement.getAttribute('viewBox'),
  };
}

export default function PlotterTest() {
  const svgOverlayRef = useRef(null);
  const plotterRendererRef = useRef(null);
  const configRef = useRef(null);
  const isMountedRef = useRef(true);
  const initialRefreshRequestedRef = useRef(false);
  const lastViewportSizeRef = useRef({ width: null, height: null });
  const getThree = useThree((state) => state.get);
  const viewportSize = useThree((state) => state.size);
  const [hasPreview, setHasPreview] = useState(false);
  const [svgState, setSvgState] = useState({
    innerHTML: '',
    outerHTML: '',
    viewBox: null,
  });
  const getFixedOverlayPosition = useCallback((_, __, size) => {
    if (!size) return [0, 0];
    return [size.width / 2, size.height / 2];
  }, []);

  const getCaptureAspect = useCallback(
    (cameraForProjection) => {
      const { size } = getThree();
      const layout = getViewportLayout(size);

      if (layout.rightWidth > 0 && layout.viewportHeight > 0) {
        return layout.rightWidth / layout.viewportHeight;
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

  const computeThirdPartySvg = useCallback(
    async (cfg, cameraForProjection, captureAspect) => {
      const { gl: glRenderer, scene: rootScene } = getThree();
      if (!rootScene || !cameraForProjection || !glRenderer) {
        return null;
      }

      const projectionCamera = createProjectionCamera(
        cameraForProjection,
        captureAspect
      );
      if (!projectionCamera) return null;

      const plotSize = getCaptureSize();

      if (!plotterRendererRef.current) {
        plotterRendererRef.current = new PlotterRenderer();
      }

      const plotterRenderer = plotterRendererRef.current;
      plotterRenderer.setClearColor('#ffffff');
      plotterRenderer.setSize(plotSize.width, plotSize.height);
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
        axisSettings: {
          x: { rotation: cfg.rotX, spacing: cfg.spaceX },
          y: { rotation: cfg.rotY, spacing: cfg.spaceY },
          z: { rotation: cfg.rotZ, spacing: cfg.spaceZ },
        },
        secondaryPass: {
          enabled: Boolean(cfg.secondHatchPass),
          angleOffset: cfg.secondHatchPassAngle,
        },
        brightnessShading: {
          enabled: Boolean(cfg.brightnessShading),
          invert: cfg.theme === 'dark',
          intensity: cfg.lightIntensity,
          lightDirection,
        },
        maxSegments: cfg.hatchMaxSegments,
      };

      rootScene.updateMatrixWorld(true);
      projectionCamera.updateMatrixWorld(true);
      projectionCamera.updateProjectionMatrix();
      const previousRendererSize = glRenderer.getSize(new THREE.Vector2());

      try {
        // Keep PlotterRenderer passes in the same coordinate space as the
        // capture target to avoid stretched silhouettes/hatching.
        glRenderer.setSize(plotSize.width, plotSize.height, false);
        plotterRenderer.clear();
        await plotterRenderer.renderGPULayers(rootScene, projectionCamera);
      } finally {
        glRenderer.setSize(
          previousRendererSize.x,
          previousRendererSize.y,
          false
        );
      }

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
    [createProjectionCamera, getCaptureSize, getThree]
  );

  const computePlotterOutput = useCallback(
    async (cfg, activeCamera) => {
      const cameraForProjection = activeCamera || getThree().camera;
      if (!cameraForProjection) return null;

      const captureAspect = getCaptureAspect(cameraForProjection);
      const output = await computeThirdPartySvg(
        cfg,
        cameraForProjection,
        captureAspect
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

      setSvgState(output.svgState);

      return output;
    },
    [computeThirdPartySvg, getCaptureAspect, getThree]
  );

  const handleRefresh = useCallback(() => {
    if (!configRef.current) return;
    computePlotterOutput(configRef.current, getThree().camera).then(
      (output) => {
        if (output && isMountedRef.current) {
          setHasPreview(true);
        }
      }
    );
  }, [computePlotterOutput, getThree]);

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
      const captureAspect = getCaptureAspect(camera);
      const output = await computeThirdPartySvg(cfg, camera, captureAspect);
      if (!output?.svg) return;

      downloadSvg(output.svg, output.fileName);
    },
    [computeThirdPartySvg, getCaptureAspect, getThree]
  );

  const config = usePlotterTestControls({
    onExport: handleExport,
    onRefresh: handleRefresh,
  });

  const themeColors = useMemo(
    () => getThemeColors(config.theme),
    [config.theme]
  );

  const layout = useMemo(() => getViewportLayout(viewportSize), [viewportSize]);

  const sceneConfig = useMemo(
    () => ({
      autoRefresh: config.autoRefresh,
      theme: config.theme,
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
      secondHatchPass: config.secondHatchPass,
      secondHatchPassAngle: config.secondHatchPassAngle,
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
      config.maxSpacing,
      config.minSpacing,
      config.precision,
      config.rotX,
      config.rotY,
      config.rotZ,
      config.secondHatchPass,
      config.secondHatchPassAngle,
      config.showEdges,
      config.showHatches,
      config.showSilhouettes,
      config.spaceX,
      config.spaceY,
      config.spaceZ,
      config.strokeWidth,
      config.thirdPartyInteractiveDebounceMs,
      config.thirdPartyFullFrameBudgetMs,
      config.theme,
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
    };
  }, [sceneConfig]);

  useEffect(() => {
    if (initialRefreshRequestedRef.current || !configRef.current) {
      return undefined;
    }

    initialRefreshRequestedRef.current = true;
    const frameId = window.requestAnimationFrame(() => {
      handleRefresh();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [handleRefresh, sceneConfig]);

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
      Number(configRef.current?.thirdPartyInteractiveDebounceMs) || 0
    );
    const timeoutId = window.setTimeout(() => {
      handleRefresh();
    }, debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [handleRefresh, viewportSize?.height, viewportSize?.width]);

  useEffect(() => {
    if (svgOverlayRef.current) {
      svgOverlayRef.current.innerHTML = svgState.innerHTML || '';
      if (svgState.viewBox) {
        svgOverlayRef.current.setAttribute('viewBox', svgState.viewBox);
      } else {
        svgOverlayRef.current.removeAttribute('viewBox');
      }
    }
  }, [svgState.innerHTML, svgState.viewBox]);

  useFrame((state) => {
    if (!configRef.current) return;

    const { gl, size, camera: activeCamera, scene } = state;

    const { leftWidth, rightWidth, rightX, viewportHeight } =
      getViewportLayout(size);

    const originalAspect = activeCamera.aspect;

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
    gl.setScissorTest(false);
  }, 1);

  return (
    <>
      <color attach="background" args={[themeColors.background]} />
      <TestScene />

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
              viewBox={svgState.viewBox || undefined}
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
                Click &quot;refreshRender&quot; to generate
              </div>
            ) : null}
          </div>
        </div>
      </Html>
    </>
  );
}
