import { useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import { modelFile } from '@utils/appUtils';

const FILE = modelFile('SkullMelt.glb');

export default function useMeltSurface({
  showMandible,
  showTeeth,
  lite = false,
}) {
  const { nodes } = useGLTF(FILE);
  return useMemo(() => {
    const at = (name) => nodes[`${name}${lite ? 'Low' : ''}`].geometry;
    const geometries = [at('Cranium')];
    if (showMandible) geometries.push(at('Mandible'));
    if (showTeeth) {
      geometries.push(at('UpperTeeth'));
      if (showMandible) geometries.push(at('LowerTeeth'));
    }
    return mergeGeometries(geometries);
  }, [nodes, showMandible, showTeeth, lite]);
}
