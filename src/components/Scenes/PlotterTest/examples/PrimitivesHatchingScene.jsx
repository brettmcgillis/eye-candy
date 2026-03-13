import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { CameraControls, Html, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import { PlotterRenderer } from './PlotterRenderer/plotter-renderer';
import './PrimitivesHatchingScene.css';
import usePrimitivesHatchingSceneControls from './usePrimitivesHatchingSceneControls';

function getThemeColors(theme) {
  if (theme === 'light') {
    return {
      background: '#ffffff',
      ambient: 2,
      gridCenter: 0xcccccc,
      gridLines: 0xdddddd,
    };
  }

  return {
    background: '#222222',
    ambient: 0.25,
    gridCenter: 0x444444,
    gridLines: 0x333333,
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

const EXPORT_FILE_NAME = 'primitives-hidden-lines';

function PrimitivesHatchingScene() {
  const { gl, scene, size, camera } = useThree();
  const plotterRendererRef = useRef(null);
  const svgOverlayRef = useRef(null);
  const renderPlotRef = useRef(null);
  const autoRenderRef = useRef(false);
  const svgOuterHtmlRef = useRef('');
  const [svgState, setSvgState] = useState({
    innerHTML: '',
    outerHTML: '',
    viewBox: null,
  });

  const handleRenderAction = useCallback(() => renderPlotRef.current?.(), []);
  const handleExportAction = useCallback(async () => {
    const svgContent =
      svgOuterHtmlRef.current || (await renderPlotRef.current?.());
    if (!svgContent) return;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${EXPORT_FILE_NAME}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const config = usePrimitivesHatchingSceneControls({
    onExport: handleExportAction,
    onRender: handleRenderAction,
  });

  const themeColors = useMemo(
    () => getThemeColors(config.theme),
    [config.theme]
  );

  const lightPosition = useMemo(
    () => [
      Number(config.lightX) || 5,
      Number(config.lightY) || 5,
      Number(config.lightZ) || 5,
    ],
    [config.lightX, config.lightY, config.lightZ]
  );
  const lightIntensity = Number(config.lightIntensity) || 1;

  useEffect(() => {
    if (!svgOverlayRef.current) return;

    svgOverlayRef.current.innerHTML = svgState.innerHTML || '';
    if (svgState.viewBox) {
      svgOverlayRef.current.setAttribute('viewBox', svgState.viewBox);
    } else {
      svgOverlayRef.current.removeAttribute('viewBox');
    }
  }, [svgState.innerHTML, svgState.viewBox]);

  const renderPlot = useCallback(async () => {
    if (!plotterRendererRef.current) {
      plotterRendererRef.current = new PlotterRenderer();
    }

    const plotterRenderer = plotterRendererRef.current;

    plotterRenderer.setGLRenderer(gl);
    plotterRenderer.setSize(size.width, size.height);
    plotterRenderer.theme = config.theme === 'light' ? 'light' : 'dark';
    plotterRenderer.showSilhouettes = Boolean(config.showSilhouettes);
    plotterRenderer.showEdges = Boolean(config.showEdges);
    plotterRenderer.showHatches = Boolean(config.showHatches);
    plotterRenderer.hatchOptions.axisSettings = {
      x: {
        rotation: Number(config.rotX) || 0,
        spacing: Number(config.spaceX) || 8,
      },
      y: {
        rotation: Number(config.rotY) || 0,
        spacing: Number(config.spaceY) || 8,
      },
      z: {
        rotation: Number(config.rotZ) || 0,
        spacing: Number(config.spaceZ) || 8,
      },
    };
    plotterRenderer.hatchOptions.brightnessShading = {
      enabled: Boolean(config.brightnessShading),
      invert: config.theme !== 'light',
      intensity: Number(config.lightIntensity) || 1,
    };
    plotterRenderer.hatchOptions.minSpacing = Number(config.minSpacing) || 3;
    plotterRenderer.hatchOptions.maxSpacing = Number(config.maxSpacing) || 40;
    plotterRenderer.hatchOptions.insetPixels = Number.isNaN(
      Number(config.insetPixels)
    )
      ? 2
      : Number(config.insetPixels);
    plotterRenderer.hatchOptions.connectHatches = Boolean(
      config.connectHatches
    );

    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();

    plotterRenderer.clear();
    await plotterRenderer.renderGPULayers(scene, camera);

    const nextSvg = extractSvgMarkup(plotterRenderer.domElement);

    svgOuterHtmlRef.current = nextSvg.outerHTML || '';
    setSvgState(nextSvg);

    return nextSvg.outerHTML;
  }, [camera, config, gl, scene, size.height, size.width]);

  useEffect(() => {
    renderPlotRef.current = renderPlot;
  }, [renderPlot]);

  useEffect(() => {
    let handle = null;

    if (!autoRenderRef.current) {
      autoRenderRef.current = true;
      handle = window.setTimeout(() => {
        renderPlotRef.current?.();
      }, 120);
    }

    return () => {
      if (handle !== null) {
        window.clearTimeout(handle);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { target } = event;
      const isTypingTarget =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

      if (isTypingTarget || event.repeat) return;

      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        renderPlotRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <>
      <color attach="background" args={[themeColors.background]} />

      <PerspectiveCamera makeDefault fov={45} position={[8, 6, 10]} />
      <CameraControls />

      <ambientLight intensity={themeColors.ambient} />
      <pointLight intensity={lightIntensity} position={lightPosition} />

      <mesh position={lightPosition} userData={{ excludeFromSVG: true }}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial color={0xff8800} toneMapped={false} />
      </mesh>

      <mesh position={[-4, 1.25, 0]}>
        <coneGeometry args={[1.5, 2.5, 4]} />
        <meshPhongMaterial color={0xff6644} flatShading shininess={0} />
      </mesh>

      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[1, 1, 2.5, 12]} />
        <meshPhongMaterial color={0x44ff66} flatShading shininess={0} />
      </mesh>

      <mesh position={[4, 1.5, 0]}>
        <icosahedronGeometry args={[1.5, 0]} />
        <meshPhongMaterial color={0x4466ff} flatShading shininess={0} />
      </mesh>

      <gridHelper
        args={[20, 20, themeColors.gridCenter, themeColors.gridLines]}
      />

      <Html fullscreen zIndexRange={[10, 0]}>
        <div className="plotter-example-overlay">
          <svg
            ref={svgOverlayRef}
            className="plotter-example-svgOverlay"
            xmlns="http://www.w3.org/2000/svg"
            width={size.width}
            height={size.height}
            viewBox={svgState.viewBox || undefined}
          />
        </div>
      </Html>
    </>
  );
}

export default PrimitivesHatchingScene;
