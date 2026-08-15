import { useEffect, useRef } from 'react';

import { useThree } from '@react-three/fiber';

const VIEWS = ['z+', 'z-', 'y+', 'y-'];

function axisPosition(view, distance) {
  switch (view) {
    case 'z-':
      return [0, 0, -distance];
    case 'y+':
      return [0, distance, 0];
    case 'y-':
      return [0, -distance, 0];
    default:
      return [0, 0, distance];
  }
}

// Spacebar cycles the orbit camera through the Test's 4 axis-aligned
// symmetry views (front/back along Z, top/bottom along Y), preserving
// whatever zoom distance the user's already orbited to. Doesn't touch the
// camera on mount/control changes — only a deliberate keypress moves it
// (docs/scene-conventions.md §10 is about accidental resets, not this).
export default function ViewHotkey() {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);
  const viewIndexRef = useRef(0);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.code !== 'Space' || !controls) return;
      const { target } = event;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return;
      }
      event.preventDefault();

      const distance = camera.position.distanceTo(controls.target);
      viewIndexRef.current = (viewIndexRef.current + 1) % VIEWS.length;
      const [x, y, z] = axisPosition(VIEWS[viewIndexRef.current], distance);
      camera.position.set(x, y, z);
      controls.target.set(0, 0, 0);
      controls.update();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [camera, controls]);

  return null;
}
