/* eslint-disable consistent-return */
import React, { useEffect, useRef, useState } from 'react';

import { useProgress } from '@react-three/drei';

import { ALL_LOADERS } from './loaders';
import { INK, OrientationProvider } from './primitives';

function getOrientation() {
  return window.innerWidth > window.innerHeight ? 'h' : 'v';
}

export default function Loader({ onComplete, suspended }) {
  const [SelectedLoader] = useState(
    () => ALL_LOADERS[Math.floor(Math.random() * ALL_LOADERS.length)]
  );

  const [orientation, setOrientation] = useState(getOrientation);
  const [cycleDone, setCycleDone] = useState(false);
  const [loadingDone, setLoadingDone] = useState(false);
  const [fading, setFading] = useState(false);

  const { progress, active } = useProgress();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const handler = () => setOrientation(getOrientation());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    const id = setTimeout(
      () => setCycleDone(true),
      SelectedLoader.cycleDuration * 1000
    );
    return () => clearTimeout(id);
  }, [SelectedLoader]);

  // Track the moment asset loading begins so we don't fire loadingDone prematurely.
  // On initial mount active is false, which would otherwise look like "already done".
  useEffect(() => {
    if (active) hasStartedRef.current = true;
  }, [active]);

  useEffect(() => {
    if (!hasStartedRef.current) return;
    if (progress >= 100 || !active) setLoadingDone(true);
  }, [progress, active]);

  // Fallback for scenes with no 3D assets — unblock after a short grace period
  // if loading never started at all.
  useEffect(() => {
    const id = setTimeout(() => {
      if (!hasStartedRef.current) setLoadingDone(true);
    }, 500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!cycleDone || !loadingDone || suspended) return;
    setFading(true);
    const id = setTimeout(() => onComplete?.(), 350);
    return () => clearTimeout(id);
  }, [cycleDone, loadingDone, onComplete, suspended]);

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
        <div
          style={{ width: 'min(60vmin, 320px)', height: 'min(60vmin, 320px)' }}
        >
          <SelectedLoader />
        </div>
      </OrientationProvider>
    </div>
  );
}
