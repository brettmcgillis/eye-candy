import React, { useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import { BufferGeometry, Float32BufferAttribute } from 'three';
import { EdgeSplitModifier, mergeVertices } from 'three-stdlib';
import { LoopSubdivision } from 'three-subdivide';

import { modelFile } from '@utils/appUtils';

const RIM_NORMAL_Z_THRESHOLD = 0.55;

function createGeometryFromBuffers(positionBuffer, normalBuffer, uvBuffer) {
  if (positionBuffer.length === 0) return null;

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(positionBuffer, 3)
  );

  if (normalBuffer.length > 0) {
    geometry.setAttribute(
      'normal',
      new Float32BufferAttribute(normalBuffer, 3)
    );
  }

  if (uvBuffer.length > 0) {
    geometry.setAttribute('uv', new Float32BufferAttribute(uvBuffer, 2));
  }

  return geometry;
}

function splitPlateGeometry(
  geometry,
  normalZThreshold = RIM_NORMAL_Z_THRESHOLD
) {
  const nonIndexedGeometry = geometry.index
    ? geometry.toNonIndexed()
    : geometry.clone();

  const positions = nonIndexedGeometry.getAttribute('position');
  const normals = nonIndexedGeometry.getAttribute('normal');
  const uvs = nonIndexedGeometry.getAttribute('uv');

  if (!positions) {
    return { faceGeometry: null, rimGeometry: null };
  }

  const rimPositions = [];
  const rimNormals = [];
  const rimUvs = [];
  const facePositions = [];
  const faceNormals = [];
  const faceUvs = [];

  const triangleCount = positions.count / 3;
  for (
    let triangleIndex = 0;
    triangleIndex < triangleCount;
    triangleIndex += 1
  ) {
    const vertexStart = triangleIndex * 3;

    let avgAbsNormalZ = 1;
    if (normals) {
      const n0z = Math.abs(normals.getZ(vertexStart));
      const n1z = Math.abs(normals.getZ(vertexStart + 1));
      const n2z = Math.abs(normals.getZ(vertexStart + 2));
      avgAbsNormalZ = (n0z + n1z + n2z) / 3;
    }

    const isRimTriangle = avgAbsNormalZ < normalZThreshold;

    const targetPositions = isRimTriangle ? rimPositions : facePositions;
    const targetNormals = isRimTriangle ? rimNormals : faceNormals;
    const targetUvs = isRimTriangle ? rimUvs : faceUvs;

    for (let i = 0; i < 3; i += 1) {
      const vertexIndex = vertexStart + i;
      targetPositions.push(
        positions.getX(vertexIndex),
        positions.getY(vertexIndex),
        positions.getZ(vertexIndex)
      );

      if (normals) {
        targetNormals.push(
          normals.getX(vertexIndex),
          normals.getY(vertexIndex),
          normals.getZ(vertexIndex)
        );
      }

      if (uvs) {
        targetUvs.push(uvs.getX(vertexIndex), uvs.getY(vertexIndex));
      }
    }
  }

  return {
    faceGeometry: createGeometryFromBuffers(
      facePositions,
      faceNormals,
      faceUvs
    ),
    rimGeometry: createGeometryFromBuffers(rimPositions, rimNormals, rimUvs),
  };
}

export default function Lb45Plate(props) {
  const { nodes, materials } = useGLTF(modelFile('/45lb_metal_plate.glb'));

  const plateMaterial = useMemo(() => {
    const baseMaterial = materials['Material.001'];
    if (!baseMaterial) return null;

    const smoothMaterial = baseMaterial.clone();
    smoothMaterial.flatShading = false;
    smoothMaterial.needsUpdate = true;
    return smoothMaterial;
  }, [materials]);

  const plateGeometries = useMemo(() => {
    const baseGeometry = nodes['45lb_Plate_Material001_0']?.geometry;
    if (!baseGeometry) return null;

    const { faceGeometry, rimGeometry } = splitPlateGeometry(baseGeometry);
    if (!rimGeometry || !faceGeometry) {
      return { fallbackGeometry: baseGeometry };
    }

    const mergedRimGeometry = mergeVertices(rimGeometry);
    mergedRimGeometry.deleteAttribute('normal');

    const edgeSplitModifier = new EdgeSplitModifier();
    const smoothedRimGeometry = edgeSplitModifier.modify(
      mergedRimGeometry,
      Math.PI,
      false
    );

    // Subdivide only the rim to improve cylindrical silhouette without warping face text.
    const subdividedRimGeometry = LoopSubdivision.modify(
      smoothedRimGeometry,
      2,
      {
        split: true,
        preserveEdges: false,
        uvSmooth: false,
        maxTriangles: 200000,
      }
    );

    subdividedRimGeometry.computeVertexNormals();
    return {
      faceGeometry,
      rimGeometry: subdividedRimGeometry,
      fallbackGeometry: null,
    };
  }, [nodes]);

  const hasSplitGeometry =
    plateGeometries?.faceGeometry && plateGeometries?.rimGeometry;

  return (
    <group {...props} dispose={null}>
      {hasSplitGeometry ? (
        <>
          <mesh
            castShadow
            receiveShadow
            geometry={plateGeometries.faceGeometry}
            material={plateMaterial || materials['Material.001']}
            rotation={[0, 0, -0.784]}
            scale={10}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={plateGeometries.rimGeometry}
            material={plateMaterial || materials['Material.001']}
            rotation={[0, 0, -0.784]}
            scale={10}
          />
        </>
      ) : (
        <mesh
          castShadow
          receiveShadow
          geometry={
            plateGeometries?.fallbackGeometry ||
            nodes['45lb_Plate_Material001_0'].geometry
          }
          material={plateMaterial || materials['Material.001']}
          rotation={[0, 0, -0.784]}
          scale={10}
        />
      )}
    </group>
  );
}

useGLTF.preload(modelFile('/45lb_metal_plate.glb'));
