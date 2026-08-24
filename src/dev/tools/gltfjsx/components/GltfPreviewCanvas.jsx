import React, {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { OrbitControls, Stage } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

import * as THREE from 'three';

import AnimationDriver from './AnimationDriver';
import './GltfPreviewCanvas.css';
import useGltfPreview from '../hooks/useGltfPreview';

function makeChannelMaterial(channel, material, wireframe) {
  const channelMapKeyByMode = {
    alpha: 'alphaMap',
    ao: 'aoMap',
    baseColor: 'map',
    clearcoat: 'clearcoatMap',
    displacement: 'displacementMap',
    emissive: 'emissiveMap',
    light: 'lightMap',
    metalness: 'metalnessMap',
    normalMap: 'normalMap',
    roughness: 'roughnessMap',
  };
  const mapKey = channelMapKeyByMode[channel];
  const map = mapKey ? material?.[mapKey] : null;

  if (channel === 'normalMap') {
    return new THREE.MeshBasicMaterial({
      color: map ? '#ffffff' : '#334155',
      map,
      transparent: Boolean(material?.transparent || map),
      wireframe,
    });
  }

  if (channel === 'baseColor') {
    return new THREE.MeshBasicMaterial({
      color: map ? '#ffffff' : material?.color || '#f8fafc',
      map,
      transparent: Boolean(material?.transparent || map),
      wireframe,
    });
  }

  if (channel === 'emissive') {
    return new THREE.MeshBasicMaterial({
      color: map ? '#ffffff' : material?.emissive || '#0f172a',
      map,
      transparent: Boolean(material?.transparent || map),
      wireframe,
    });
  }

  return new THREE.MeshBasicMaterial({
    color: map ? '#ffffff' : '#d1d5db',
    map,
    transparent: Boolean(material?.transparent || map),
    wireframe,
  });
}

function makeOverrideMaterial(settings, sourceMaterial) {
  const mode = settings?.displayMode || 'original';
  const channel = settings?.materialChannel || 'original';
  const wireframe = Boolean(settings?.wireframe);

  if (mode === 'normal') {
    return new THREE.MeshNormalMaterial({ wireframe });
  }

  if (mode === 'clay') {
    return new THREE.MeshStandardMaterial({
      color: '#c9b5a3',
      roughness: 0.82,
      metalness: 0,
      wireframe,
    });
  }

  if (channel !== 'original') {
    return makeChannelMaterial(channel, sourceMaterial, wireframe);
  }

  return null;
}

function applyDebugPreviewSettings(root, settings, shadows) {
  const createdMaterials = [];
  const originalMaterials = new Map();
  const originalWireframe = new Map();

  root.traverse((node) => {
    if (!node.isMesh) return;

    const mesh = node;
    originalMaterials.set(mesh, mesh.material);

    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;

    const sourceMaterial = mesh.material;
    const overrideMaterial = Array.isArray(sourceMaterial)
      ? sourceMaterial.map((material) =>
          makeOverrideMaterial(settings, material)
        )
      : makeOverrideMaterial(settings, sourceMaterial);

    if (Array.isArray(sourceMaterial)) {
      sourceMaterial.forEach((material) => {
        if (!material) return;
        const source = material;
        if ('wireframe' in source && !originalWireframe.has(source)) {
          originalWireframe.set(source, source.wireframe);
          source.wireframe = Boolean(settings?.wireframe);
        }
        if ('envMapIntensity' in source) {
          source.envMapIntensity = 0.8;
        }
      });
    } else if (sourceMaterial) {
      if (
        'wireframe' in sourceMaterial &&
        !originalWireframe.has(sourceMaterial)
      ) {
        originalWireframe.set(sourceMaterial, sourceMaterial.wireframe);
        sourceMaterial.wireframe = Boolean(settings?.wireframe);
      }
      if ('envMapIntensity' in sourceMaterial) {
        sourceMaterial.envMapIntensity = 0.8;
      }
    }

    if (!overrideMaterial) {
      return;
    }

    if (Array.isArray(overrideMaterial)) {
      const hasOverride = overrideMaterial.some(Boolean);
      if (!hasOverride) {
        return;
      }

      const mergedMaterial = overrideMaterial.map((material, index) => {
        if (material) {
          createdMaterials.push(material);
          return material;
        }
        return Array.isArray(sourceMaterial)
          ? sourceMaterial[index]
          : sourceMaterial;
      });
      mesh.material = mergedMaterial;
      return;
    }

    createdMaterials.push(overrideMaterial);
    mesh.material = overrideMaterial;
  });

  return () => {
    originalMaterials.forEach((material, mesh) => {
      const targetMesh = mesh;
      targetMesh.material = material;
    });
    originalWireframe.forEach((wireframe, material) => {
      const targetMaterial = material;
      targetMaterial.wireframe = wireframe;
    });
    createdMaterials.forEach((material) => material.dispose?.());
  };
}

function useGeneratedComponentPreview(previewComponent) {
  const [state, setState] = useState({
    Component: null,
    error: null,
    status: previewComponent ? 'loading' : 'idle',
  });

  useEffect(() => {
    if (!previewComponent?.modulePath) {
      setState({ Component: null, error: null, status: 'idle' });
      return undefined;
    }

    let cancelled = false;

    async function loadComponent() {
      setState({ Component: null, error: null, status: 'loading' });

      try {
        const module = await import(
          /* @vite-ignore */ `${previewComponent.modulePath}?t=${previewComponent.version}`
        );
        const Component =
          module.default || module[previewComponent.exportName] || null;

        if (!Component) {
          throw new Error(
            'Generated component preview could not find a renderable export.'
          );
        }

        if (!cancelled) {
          setState({ Component, error: null, status: 'ready' });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            Component: null,
            error:
              error instanceof Error
                ? error.message
                : 'Generated component preview could not be loaded.',
            status: 'error',
          });
        }
      }
    }

    loadComponent();

    return () => {
      cancelled = true;
    };
  }, [
    previewComponent?.exportName,
    previewComponent?.modulePath,
    previewComponent?.version,
  ]);

  return state;
}

function AssetPreviewContent({ gltf, previewDebugSettings, shadows }) {
  const scene = gltf?.scene ?? null;

  useLayoutEffect(() => {
    if (!scene) return () => {};

    return applyDebugPreviewSettings(scene, previewDebugSettings, shadows);
  }, [previewDebugSettings, scene, shadows]);

  if (!scene) return null;

  return <primitive object={scene} />;
}

function GeneratedComponentPreviewContent({
  Component,
  previewDebugSettings,
  shadows,
}) {
  const groupRef = useRef(null);

  useLayoutEffect(() => {
    if (!groupRef.current) return () => {};

    return applyDebugPreviewSettings(
      groupRef.current,
      previewDebugSettings,
      shadows
    );
  }, [Component, previewDebugSettings, shadows]);

  return (
    <group ref={groupRef}>
      <Component />
    </group>
  );
}

function PreviewScene({
  animation,
  gltf,
  PreviewComponent,
  previewDebugSettings,
  previewOptions,
}) {
  const controlsRef = useRef(null);

  if (!gltf?.scene && !PreviewComponent) return null;

  return (
    <>
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.25} />
      {gltf?.scene && animation?.clipName ? (
        <AnimationDriver
          clipName={animation.clipName}
          clips={gltf.animations || []}
          playing={animation.playing}
          root={gltf.scene}
        />
      ) : null}
      <Suspense fallback={null}>
        <Stage
          adjustCamera
          controls={controlsRef}
          environment={previewOptions.environment || null}
          intensity={previewOptions.intensity}
          preset="rembrandt"
          shadows={
            previewOptions.contactShadow ? 'contact' : previewOptions.shadows
          }
        >
          {PreviewComponent ? (
            <GeneratedComponentPreviewContent
              Component={PreviewComponent}
              previewDebugSettings={previewDebugSettings}
              shadows={previewOptions.shadows}
            />
          ) : (
            <AssetPreviewContent
              gltf={gltf}
              previewDebugSettings={previewDebugSettings}
              shadows={previewOptions.shadows}
            />
          )}
        </Stage>
      </Suspense>
      <OrbitControls
        autoRotate={previewOptions.autoRotate}
        autoRotateSpeed={1.1}
        ref={controlsRef}
      />
    </>
  );
}

export default function GltfPreviewCanvas({
  previewAsset,
  previewComponent,
  previewDebugSettings,
  previewOptions,
}) {
  const assetPreviewState = useGltfPreview(
    previewComponent ? null : previewAsset
  );
  const componentPreviewState = useGeneratedComponentPreview(previewComponent);
  const previewState = previewComponent
    ? componentPreviewState
    : assetPreviewState;
  const PreviewComponent = previewComponent
    ? componentPreviewState.Component
    : null;
  const previewLabel = previewComponent
    ? 'Generated component ready'
    : 'Preview ready';
  const animationClips = useMemo(() => {
    return previewComponent ? [] : assetPreviewState.gltf?.animations || [];
  }, [assetPreviewState.gltf, previewComponent]);
  const [animation, setAnimation] = useState({ clipName: '', playing: true });

  useEffect(() => {
    setAnimation({
      clipName: animationClips.length === 1 ? animationClips[0].name : '',
      playing: true,
    });
  }, [animationClips]);

  if (!previewAsset && !previewComponent) {
    return (
      <div className="gltf-preview__empty">
        Drop a `.glb` or `.gltf` bundle to preview it here.
      </div>
    );
  }

  if (previewState.status === 'error') {
    return <div className="gltf-preview__error">{previewState.error}</div>;
  }

  return (
    <div className="gltf-preview__shell">
      <div className="gltf-preview__status">
        {previewState.status === 'loading' ? 'Loading preview' : previewLabel}
      </div>
      <Canvas
        camera={{ fov: 50, position: [0, 0, 150] }}
        dpr={[1, 2]}
        shadows
        className="gltf-preview__canvas"
      >
        <PreviewScene
          animation={animation}
          gltf={assetPreviewState.gltf}
          PreviewComponent={PreviewComponent}
          previewDebugSettings={previewDebugSettings}
          previewOptions={previewOptions}
        />
      </Canvas>
      {animationClips.length ? (
        <div className="gltf-preview__animation-bar">
          <select
            aria-label="Animation clip"
            className="gltf-preview__animation-select"
            value={animation.clipName}
            onChange={(event) =>
              setAnimation((current) => ({
                ...current,
                clipName: event.target.value,
              }))
            }
          >
            <option value="">No animation</option>
            {animationClips.map((clip) => (
              <option key={clip.name} value={clip.name}>
                {clip.name}
              </option>
            ))}
          </select>
          {animation.clipName ? (
            <button
              className="gltf-preview__animation-button"
              type="button"
              onClick={() =>
                setAnimation((current) => ({
                  ...current,
                  playing: !current.playing,
                }))
              }
            >
              {animation.playing ? 'Pause' : 'Play'}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
