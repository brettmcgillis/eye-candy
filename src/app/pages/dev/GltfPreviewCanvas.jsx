import React, { useLayoutEffect, useRef } from 'react';

import { OrbitControls, Stage } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

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
};

function PreviewScene({ gltf, previewOptions }) {
  const controlsRef = useRef(null);
  const scene = gltf?.scene ?? null;

  useLayoutEffect(() => {
    if (!scene) return;

    scene.traverse((node) => {
      if (!node.isMesh) return;

      const mesh = node;
      mesh.castShadow = previewOptions.shadows;
      mesh.receiveShadow = previewOptions.shadows;

      if (mesh.material && 'envMapIntensity' in mesh.material) {
        mesh.material.envMapIntensity = 0.8;
      }
    });
  }, [scene, previewOptions.shadows]);

  if (!scene) return null;

  return (
    <>
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.25} />
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
        <primitive object={scene} />
      </Stage>
      <OrbitControls
        autoRotate={previewOptions.autoRotate}
        autoRotateSpeed={1.1}
        ref={controlsRef}
      />
    </>
  );
}

export default function GltfPreviewCanvas({ previewAsset, previewOptions }) {
  const previewState = useGltfPreview(previewAsset);

  if (!previewAsset) {
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
        {previewState.status === 'loading'
          ? 'Loading preview'
          : 'Preview ready'}
      </div>
      <Canvas
        camera={{ fov: 50, position: [0, 0, 150] }}
        dpr={[1, 2]}
        shadows
        style={styles.canvas}
      >
        <PreviewScene
          gltf={previewState.gltf}
          previewOptions={previewOptions}
        />
      </Canvas>
    </div>
  );
}
