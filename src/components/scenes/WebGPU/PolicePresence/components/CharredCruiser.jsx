import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import { useFrame } from '@react-three/fiber';

import PoliceCruiser from '@elements/PoliceCruiser/PoliceCruiser';

import charMaterial, { createCharUniforms } from '../utils/charMaterial';

// The cruiser with its paint burnt: each of its meshes swapped onto a
// charred copy of its material (built once per material), restored when
// the char is switched off or the car unmounts.
function CharredCruiser({ config }) {
  const root = useRef(null);
  const u = useMemo(createCharUniforms, []);
  const built = useMemo(() => new Map(), []);
  useEffect(
    () => () => {
      built.forEach((material) => material?.dispose());
      built.clear();
    },
    [built]
  );

  useLayoutEffect(() => {
    const meshes = [];
    root.current?.traverse((object) => {
      if (object.isMesh) meshes.push(object);
    });
    const swapped = [];
    if (config.charEnabled) {
      for (let i = 0; i < meshes.length; i += 1) {
        const mesh = meshes[i];
        const original = mesh.material;
        if (!built.has(original)) {
          built.set(original, charMaterial(original, u));
        }
        const replacement = built.get(original);
        if (replacement) {
          mesh.material = replacement;
          swapped.push([mesh, original]);
        }
      }
    }
    return () => {
      for (let i = 0; i < swapped.length; i += 1) {
        const [mesh, original] = swapped[i];
        mesh.material = original;
      }
    };
  }, [built, config.charEnabled, config.showTires, u]);

  u.amount.value = config.charAmount;
  u.color.value.set(config.charColor);
  u.drip.value = config.charDrip;
  u.emberGlow.value = config.charEmberGlow;
  u.glowColor.value.set(config.fireLightColor);
  u.interiorGlow.value = config.charInteriorGlow;
  u.reach.value = config.charReach;

  useFrame((state) => {
    u.time.value = state.clock.elapsedTime;
  });

  return (
    <group ref={root}>
      <PoliceCruiser showTires={config.showTires} />
    </group>
  );
}

export default memo(CharredCruiser);
