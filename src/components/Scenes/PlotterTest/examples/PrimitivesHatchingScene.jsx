import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { CameraControls, Html, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import { PlotterRenderer } from './PlotterRenderer/plotter-renderer';
import './PrimitivesHatchingScene.css';
import usePrimitivesHatchingSceneControls from './usePrimitivesHatchingSceneControls';

const DEFAULT_CONFIG = {
  theme: 'dark',
  showSilhouettes: true,
  showEdges: true,
  showHatches: true,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  spaceX: 8,
  spaceY: 8,
  spaceZ: 8,
  insetPixels: 2,
  connectHatches: false,
  brightnessShading: true,
  minSpacing: 3,
  maxSpacing: 40,
  lightX: 5,
  lightY: 5,
  lightZ: 5,
  lightIntensity: 1,
};

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

function PrimitivesHatchingSceneControls({
  config,
  defaultConfig,
  onChange,
  onExport,
  onRender,
}) {
  usePrimitivesHatchingSceneControls({
    config,
    defaultConfig,
    onChange,
    onExport,
    onRender,
  });

  return null;
}

const PrimitivesHatchingScene = forwardRef(function PrimitivesHatchingScene(
  {
    initialConfig,
    autoRender = false,
    exportFileName = 'primitives-hidden-lines',
    showPanel = true,
    showLightHelper = true,
    onRenderComplete,
  },
  ref
) {
  const mergedInitialConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...initialConfig }),
    [initialConfig]
  );
  const { gl, scene, size, camera } = useThree();
  const pointLightRef = useRef(null);
  const plotterRendererRef = useRef(null);
  const svgOverlayRef = useRef(null);
  const initializedRef = useRef(false);
  const [config, setConfig] = useState(mergedInitialConfig);
  const [svgState, setSvgState] = useState({
    innerHTML: '',
    outerHTML: '',
    viewBox: null,
  });
  const [, setStats] = useState(
    'Use mouse to orbit. Click Render to generate.'
  );

  useEffect(() => {
    setConfig(mergedInitialConfig);
  }, [mergedInitialConfig]);

  const themeColors = useMemo(
    () => getThemeColors(config.theme),
    [config.theme]
  );

  useEffect(() => {
    if (!plotterRendererRef.current) {
      plotterRendererRef.current = new PlotterRenderer();
    }

    plotterRendererRef.current.setGLRenderer(gl);
  }, [gl]);

  useEffect(() => {
    if (!plotterRendererRef.current) return;

    plotterRendererRef.current.setSize(size.width, size.height);
  }, [size.height, size.width]);

  useEffect(() => {
    if (!pointLightRef.current) return;

    pointLightRef.current.position.set(
      Number(config.lightX) || 5,
      Number(config.lightY) || 5,
      Number(config.lightZ) || 5
    );
    pointLightRef.current.intensity = Number(config.lightIntensity) || 1;
  }, [config.lightIntensity, config.lightX, config.lightY, config.lightZ]);

  useEffect(() => {
    if (!svgOverlayRef.current) return;

    svgOverlayRef.current.innerHTML = svgState.innerHTML || '';
  }, [svgState.innerHTML]);

  const renderPlot = useCallback(async () => {
    if (!plotterRendererRef.current) return null;

    setStats('Rendering...');

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

    const startTime = performance.now();
    plotterRenderer.clear();
    await plotterRenderer.renderGPULayers(scene, camera);

    const nextSvg = extractSvgMarkup(plotterRenderer.domElement);
    const elapsed = performance.now() - startTime;

    if (svgOverlayRef.current) {
      svgOverlayRef.current.innerHTML = nextSvg.innerHTML || '';
      if (nextSvg.viewBox) {
        svgOverlayRef.current.setAttribute('viewBox', nextSvg.viewBox);
      } else {
        svgOverlayRef.current.removeAttribute('viewBox');
      }
    }

    setSvgState(nextSvg);
    setStats(`Render completed in ${elapsed.toFixed(0)}ms`);
    onRenderComplete?.({
      elapsed,
      svg: nextSvg.outerHTML,
      config,
    });

    return nextSvg.outerHTML;
  }, [camera, config, gl, onRenderComplete, scene, size.height, size.width]);

  const exportSvg = useCallback(async () => {
    const svgContent = svgState.outerHTML || (await renderPlot());
    if (!svgContent) return;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportFileName}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }, [exportFileName, renderPlot, svgState.outerHTML]);

  useImperativeHandle(
    ref,
    () => ({
      exportSvg,
      getConfig: () => config,
      getSvgString: () => svgState.outerHTML,
      render: renderPlot,
      setConfig: (nextConfig) => {
        setConfig((prev) => ({ ...prev, ...nextConfig }));
      },
    }),
    [config, exportSvg, renderPlot, svgState.outerHTML]
  );

  useEffect(() => {
    let handle = null;

    if (autoRender && !initializedRef.current) {
      initializedRef.current = true;
      handle = window.setTimeout(() => {
        renderPlot();
      }, 120);
    }

    return () => {
      if (handle !== null) {
        window.clearTimeout(handle);
      }
    };
  }, [autoRender, renderPlot]);

  return (
    <>
      {showPanel ? (
        <PrimitivesHatchingSceneControls
          config={config}
          defaultConfig={mergedInitialConfig}
          onChange={setConfig}
          onExport={exportSvg}
          onRender={renderPlot}
        />
      ) : null}

      <color attach="background" args={[themeColors.background]} />

      <PerspectiveCamera makeDefault fov={45} position={[8, 6, 10]} />
      <CameraControls />

      <ambientLight intensity={themeColors.ambient} />
      <pointLight ref={pointLightRef} intensity={50} position={[5, 5, 5]} />

      {showLightHelper ? (
        <mesh
          position={[
            Number(config.lightX) || 5,
            Number(config.lightY) || 5,
            Number(config.lightZ) || 5,
          ]}
          userData={{ excludeFromSVG: true }}
        >
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color={0xff8800} toneMapped={false} />
        </mesh>
      ) : null}

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
});

export default PrimitivesHatchingScene;
export { DEFAULT_CONFIG };
