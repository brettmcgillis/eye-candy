import { useEffect, useMemo } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import {
  SURFACE_MAPS,
  SURFACE_SETS,
  createSurfaceMaterial,
  setSurfaceFrame,
} from '@modules/houseOfLeaves';
import { textureFile } from '@utils/appUtils';

const EXT = { albedo: 'jpg', normal: 'jpg', roughness: 'jpg', ao: 'jpg' };

function urlsFor(set) {
  return SURFACE_MAPS.map((map) =>
    textureFile(`${SURFACE_SETS[set]}/${map}.${EXT[map]}`)
  );
}
const ALL_URLS = Object.keys(SURFACE_SETS).flatMap(urlsFor);

function prepare(textures) {
  const maps = {};
  Object.keys(SURFACE_SETS).forEach((set, s) => {
    maps[set] = {};
    SURFACE_MAPS.forEach((map, m) => {
      const texture = textures[s * SURFACE_MAPS.length + m];
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.colorSpace =
        map === 'albedo' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.anisotropy = 8;
      maps[set][map] = texture;
    });
  });
  return maps;
}

// Photographic sets, projected triplanar from world space because the
// architecture is swept without UVs, tinted ash for the labyrinth and warm
// for the room. Faces look at the air, so nothing is double-sided.
export default function useSurfaces(config, walker) {
  const textures = useTexture(ALL_URLS);
  const maps = useMemo(() => prepare(textures), [textures]);

  const surfaces = useMemo(
    () => ({
      stone: createSurfaceMaterial({
        wallMaps: maps.wall,
        floorMaps: maps.stone,
        options: {
          scale: config.surfaceScale,
          tint: config.surfaceTint,
          floorTint: config.floorTint,
          detile: config.surfaceDetile,
          normalStrength: config.normalStrength,
          roughnessScale: config.roughnessScale,
        },
      }),
      // The living room: painted plaster and a wood floor.
      home: createSurfaceMaterial({
        wallMaps: maps.wall,
        floorMaps: maps.wood,
        options: {
          scale: config.livingScale,
          tint: config.livingTint,
          floorTint: config.livingFloorTint,
          detile: 0.2,
          normalStrength: config.normalStrength * 0.6,
          roughnessScale: 0.9,
        },
      }),
    }),
    [
      config.floorTint,
      config.livingFloorTint,
      config.livingScale,
      config.livingTint,
      config.normalStrength,
      config.roughnessScale,
      config.surfaceDetile,
      config.surfaceScale,
      config.surfaceTint,
      maps,
    ]
  );

  useEffect(
    () => () => Object.values(surfaces).forEach((m) => m.dispose()),
    [surfaces]
  );

  // Geometry is placed relative to the walker's anchor, so the projection
  // has to add it back or the texture would slide across the stone at every
  // rebase.
  const offset = useMemo(() => ({ x: 0, y: 0, z: 0 }), []);
  useFrame(() => {
    offset.x = -walker.anchor.x;
    offset.y = -walker.anchor.y;
    offset.z = -walker.anchor.z;
    setSurfaceFrame(surfaces.stone, offset);
    setSurfaceFrame(surfaces.home, offset);
  });

  return surfaces;
}

useTexture.preload(ALL_URLS);
