import { useEffect, useLayoutEffect } from 'react';

import { useThree } from '@react-three/fiber';

import { Color, Fog } from 'three';

// Set imperatively rather than with <color attach="background"> and
// <fog attach="fog">. R3F 9 does not rebuild an args-changed object during
// commitUpdate; it pushes it onto a module-level queue and flushes only on a
// fiber whose sibling is null. A <color> sitting mid-tree above a function
// component therefore never flushes on its own commit, and shows the value
// captured by the PREVIOUS edit until something else happens to flush it.
export default function useSceneBackdrop({ color, fogFar, fogNear }) {
  const scene = useThree((state) => state.scene);

  // Layout, not passive: a fog that arrives after the first paint is a frame
  // of the wrong backdrop and a material recompile once it shows up.
  useLayoutEffect(() => {
    // Mutated in place where the object is already the right type: swapping
    // scene.fog for another Fog is a needless material rebuild on every tweak.
    if (scene.background && scene.background.isColor)
      scene.background.set(color);
    else scene.background = new Color(color);

    if (fogNear === undefined || fogFar === undefined) return;
    if (scene.fog && scene.fog.isFog) {
      scene.fog.color.set(color);
      scene.fog.near = fogNear;
      scene.fog.far = fogFar;
    } else {
      scene.fog = new Fog(color, fogNear, fogFar);
    }
  }, [color, fogFar, fogNear, scene]);

  useEffect(
    () => () => {
      scene.background = null;
      scene.fog = null;
    },
    [scene]
  );
}
