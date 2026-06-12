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

import AnimationDriver from './AnimationDriver';
import useGltfPreview from './useGltfPreview';

const styles = {
  empty: {
    height: 'clamp(28rem, 65vh, 46rem)',
    borderRadius: '22px',
    border: '1px dashed rgba(148, 163, 184, 0.42)',
    display: 'grid',
    placeItems: 'center',
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(241,245,249,0.92) 100%)',
    color: '#475569',
    padding: '1.5rem',
    textAlign: 'center',
  },
  shell: {
    position: 'relative',
    height: 'clamp(28rem, 65vh, 46rem)',
    borderRadius: '22px',
    overflow: 'hidden',
    border: '1px solid rgba(15, 23, 42, 0.08)',
    boxShadow: '0 24px 64px rgba(15, 23, 42, 0.12)',
    background: '#020617',
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    zIndex: 1,
    padding: '0.5rem 0.75rem',
    borderRadius: '999px',
    background: 'rgba(15, 23, 42, 0.82)',
    color: '#e2e8f0',
    fontSize: '0.78rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  error: {
    height: 'clamp(28rem, 65vh, 46rem)',
    borderRadius: '22px',
    display: 'grid',
    placeItems: 'center',
    background: '#0f172a',
    color: '#fca5a5',
    padding: '1.5rem',
    textAlign: 'center',
  },
  animationBar: {
    position: 'absolute',
    bottom: '1rem',
    left: '1rem',
    right: '1rem',
    zIndex: 1,
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  animationSelect: {
    flex: '1 1 auto',
    minWidth: 0,
    borderRadius: '999px',
    border: '1px solid rgba(148, 163, 184, 0.35)',
    background: 'rgba(15, 23, 42, 0.82)',
    color: '#e2e8f0',
    padding: '0.5rem 0.85rem',
    fontSize: '0.82rem',
  },
  animationButton: {
    flexShrink: 0,
    borderRadius: '999px',
    border: '1px solid rgba(148, 163, 184, 0.35)',
    background: 'rgba(15, 23, 42, 0.82)',
    color: '#e2e8f0',
    padding: '0.5rem 0.95rem',
    fontSize: '0.82rem',
    cursor: 'pointer',
  },
};

function applyPreviewMeshProps(root, shadows) {
  root.traverse((node) => {
    if (!node.isMesh) return;

    const mesh = node;
    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;

    if (mesh.material && 'envMapIntensity' in mesh.material) {
      mesh.material.envMapIntensity = 0.8;
    }
  });
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

function AssetPreviewContent({ gltf, shadows }) {
  const scene = gltf?.scene ?? null;

  useLayoutEffect(() => {
    if (!scene) return;

    applyPreviewMeshProps(scene, shadows);
  }, [scene, shadows]);

  if (!scene) return null;

  return <primitive object={scene} />;
}

function GeneratedComponentPreviewContent({ Component, shadows }) {
  const groupRef = useRef(null);

  useLayoutEffect(() => {
    if (!groupRef.current) return;

    applyPreviewMeshProps(groupRef.current, shadows);
  }, [Component, shadows]);

  return (
    <group ref={groupRef}>
      <Component />
    </group>
  );
}

function PreviewScene({ animation, gltf, PreviewComponent, previewOptions }) {
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
              shadows={previewOptions.shadows}
            />
          ) : (
            <AssetPreviewContent gltf={gltf} shadows={previewOptions.shadows} />
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
      <div style={styles.empty}>
        Drop a `.glb` or `.gltf` bundle to preview it here.
      </div>
    );
  }

  if (previewState.status === 'error') {
    return <div style={styles.error}>{previewState.error}</div>;
  }

  return (
    <div style={styles.shell}>
      <div style={styles.overlay}>
        {previewState.status === 'loading' ? 'Loading preview' : previewLabel}
      </div>
      <Canvas
        camera={{ fov: 50, position: [0, 0, 150] }}
        dpr={[1, 2]}
        shadows
        style={styles.canvas}
      >
        <PreviewScene
          animation={animation}
          gltf={assetPreviewState.gltf}
          PreviewComponent={PreviewComponent}
          previewOptions={previewOptions}
        />
      </Canvas>
      {animationClips.length ? (
        <div style={styles.animationBar}>
          <select
            aria-label="Animation clip"
            style={styles.animationSelect}
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
              type="button"
              style={styles.animationButton}
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
