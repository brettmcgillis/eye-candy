import React, { useEffect, useState } from 'react';

import { useProgress } from '@react-three/drei';

import { ALL_LOADERS } from './loaders';
import { INK, OrientationProvider } from './primitives';

function getOrientation() {
  return window.innerWidth > window.innerHeight ? 'h' : 'v';
}

export default function Loader({ onComplete }) {
  const [SelectedLoader] = useState(
    () => ALL_LOADERS[Math.floor(Math.random() * ALL_LOADERS.length)],
  );

  const [orientation, setOrientation] = useState(getOrientation);
  const [cycleDone, setCycleDone] = useState(false);
  const [loadingDone, setLoadingDone] = useState(false);
  const [fading, setFading] = useState(false);

  const { progress, active } = useProgress();

  useEffect(() => {
    const handler = () => setOrientation(getOrientation());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setCycleDone(true), SelectedLoader.cycleDuration * 1000);
    return () => clearTimeout(id);
  }, [SelectedLoader]);

  useEffect(() => {
    if (progress >= 100 || !active) setLoadingDone(true);
  }, [progress, active]);

  useEffect(() => {
    if (!cycleDone || !loadingDone) return;
    setFading(true);
    const id = setTimeout(() => onComplete?.(), 350);
    return () => clearTimeout(id);
  }, [cycleDone, loadingDone, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: INK.paper,
        display: 'grid',
        placeItems: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.35s ease',
        zIndex: 100,
      }}
    >
      <OrientationProvider orientation={orientation}>
        <div style={{ width: 'min(60vmin, 320px)', height: 'min(60vmin, 320px)' }}>
          <SelectedLoader />
        </div>
      </OrientationProvider>
    </div>
  );
}
