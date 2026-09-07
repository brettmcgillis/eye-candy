import { useEffect, useMemo } from 'react';

import { useTexture } from '@react-three/drei';

import * as THREE from 'three/webgpu';

import {
  SURFACE_MAPS,
  SURFACE_SETS,
  createSurfaceMaterial,
} from '@modules/houseOfLeaves';

const WALL_SIDES = {
  Solid: THREE.DoubleSide,
  Cutaway: THREE.BackSide,
};

function setPaths(set) {
  return SURFACE_MAPS.reduce(
    (paths, map) => ({ ...paths, [map]: `${SURFACE_SETS[set]}/${map}.jpg` }),
    {}
  );
}

const PATHS = [
  ...Object.values(setPaths('wall')),
  ...Object.values(setPaths('wood')),
  ...Object.values(setPaths('stone')),
];

export default function useKitMaterials(config) {
  const loaded = useTexture(PATHS);

  const sets = useMemo(() => {
    const byPath = new Map(PATHS.map((path, i) => [path, loaded[i]]));
    const build = (set) => {
      const paths = setPaths(set);
      return SURFACE_MAPS.reduce((maps, map) => {
        const texture = byPath.get(paths[map]);
        if (texture) {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.anisotropy = 8;
          // Albedo carries colour; the data maps must stay linear.
          texture.colorSpace =
            map === 'albedo' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        }
        return { ...maps, [map]: texture };
      }, {});
    };
    return { wall: build('wall'), wood: build('wood'), stone: build('stone') };
  }, [loaded]);

  const materials = useMemo(() => {
    const options = {
      scale: config.textureScale,
      sharpness: config.textureBlend,
      normalStrength: config.normalStrength,
      tint: config.stoneColor,
    };
    // Corridors and rooms take wood where they face up and flaking paint
    // everywhere else; stairs and landings are stone throughout.
    const stone = createSurfaceMaterial({
      wallMaps: sets.stone,
      options: { ...options, scale: config.textureScale * 0.6 },
    });
    const shell = createSurfaceMaterial({
      wallMaps: sets.wall,
      floorMaps: sets.wood,
      options,
    });
    const wall = createSurfaceMaterial({
      wallMaps: sets.wall,
      options,
    });
    wall.side = WALL_SIDES[config.wallMode] ?? THREE.DoubleSide;
    return { stone, shell, wall };
  }, [
    config.normalStrength,
    config.stoneColor,
    config.textureBlend,
    config.textureScale,
    config.wallMode,
    sets,
  ]);

  useEffect(
    () => () => Object.values(materials).forEach((m) => m.dispose()),
    [materials]
  );

  return materials;
}

export const WALL_MODES = ['Cutaway', 'Solid', 'Hidden'];
