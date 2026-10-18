import React, { useEffect, useMemo, useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import * as THREE from 'three/webgpu';

import WebGPUCanvas from '@app/scaffold/canvas/WebGPUCanvas';

const FOLD_COLOR = '#ff3b5c';
const SECTION_COLOR = '#e4572e';
const CLAY_COLOR = '#c9b5a3';

export const BACKDROPS = {
  dark: { background: '#25272c', grid: ['#4a4e58', '#33363d'] },
  grey: { background: '#8f9196', grid: ['#6f7176', '#7f8186'] },
  light: { background: '#d9dadc', grid: ['#b3b5b9', '#c6c8cb'] },
};

function useGeometry(body) {
  return useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(body.positions, 3)
    );
    geometry.setAttribute('normal', new THREE.BufferAttribute(body.normals, 3));
    geometry.setIndex(new THREE.BufferAttribute(body.indices, 1));

    const count = body.positions.length / 3;
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    if (body.colors) {
      for (let v = 0; v < count; v += 1) {
        color.setRGB(
          body.colors[v * 3],
          body.colors[v * 3 + 1],
          body.colors[v * 3 + 2],
          THREE.SRGBColorSpace
        );
        color.toArray(colors, v * 3);
      }
    } else {
      // Each vertex takes the colour of the first part that uses it, so the
      // skins keep theirs where the edge walls meet them.
      const done = new Uint8Array(count);
      const partColors = body.parts.map((part) => new THREE.Color(part.color));
      for (let t = 0; t < body.triPart.length; t += 1) {
        for (let k = 0; k < 3; k += 1) {
          const v = body.indices[t * 3 + k];
          if (!done[v]) {
            partColors[body.triPart[t]].toArray(colors, v * 3);
            done[v] = 1;
          }
        }
      }
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeBoundingBox();
    return geometry;
  }, [body]);
}

// A cut through the model shows its back faces in a flat colour, which is
// the wall's cross-section: thin spots, the socket and the stem fit read
// straight off it.
function Body({ body, clipping, offset, view }) {
  const geometry = useGeometry(body);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const surface = useMemo(() => {
    if (view.shading === 'normals') {
      return new THREE.MeshNormalMaterial();
    }
    return new THREE.MeshStandardMaterial({
      color: view.shading === 'clay' ? CLAY_COLOR : '#ffffff',
      metalness: 0,
      roughness: view.shading === 'clay' ? 0.82 : 0.65,
      vertexColors: view.shading === 'colour',
    });
  }, [view.shading]);
  const inside = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: SECTION_COLOR,
        side: THREE.BackSide,
      }),
    []
  );
  const wire = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#1b1d22',
        opacity: 0.35,
        transparent: true,
        wireframe: true,
      }),
    []
  );
  useEffect(() => () => surface.dispose(), [surface]);
  useEffect(
    () => () => {
      inside.dispose();
      wire.dispose();
    },
    [inside, wire]
  );
  useEffect(() => {
    [surface, inside, wire].forEach((material) => {
      // eslint-disable-next-line no-param-reassign
      material.clippingPlanes = clipping;
      // eslint-disable-next-line no-param-reassign
      material.needsUpdate = true;
    });
  }, [clipping, inside, surface, wire]);

  return (
    <group position={[0, offset, 0]}>
      <mesh geometry={geometry} material={surface} />
      {clipping.length ? <mesh geometry={geometry} material={inside} /> : null}
      {view.wireframe ? <mesh geometry={geometry} material={wire} /> : null}
    </group>
  );
}

function Folds({ spots }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(Float32Array.from(spots.flat()), 3)
    );
    return g;
  }, [spots]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <points geometry={geometry} renderOrder={2}>
      <pointsMaterial
        color={FOLD_COLOR}
        depthTest={false}
        size={6}
        sizeAttenuation={false}
      />
    </points>
  );
}

function Framing({ box, frameKey }) {
  const camera = useRef();
  const controls = useRef();
  useEffect(() => {
    if (!box || !camera.current || !controls.current) return;
    const size = new THREE.Vector3();
    const centre = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(centre);
    const radius = size.length() / 2;
    camera.current.position.set(
      centre.x + radius * 1.4,
      centre.y + radius * 0.8,
      centre.z + radius * 1.8
    );
    camera.current.near = radius / 100;
    camera.current.far = radius * 100;
    camera.current.updateProjectionMatrix();
    controls.current.target.copy(centre);
    controls.current.update();
    // Refit only when asked or when the piece's scale changes, not on every
    // knob turn.
  }, [frameKey]);
  return (
    <>
      <PerspectiveCamera fov={35} makeDefault ref={camera} />
      <OrbitControls makeDefault ref={controls} />
    </>
  );
}

const AXIS = { x: 0, y: 1, z: 2 };

export default function PrintPreview({ bodies, frameKey, report, view }) {
  const box = useMemo(() => {
    if (!bodies?.length) return null;
    const result = new THREE.Box3();
    bodies.forEach((body) => {
      const b = new THREE.Box3().setFromArray(body.positions);
      result.union(b);
    });
    return result;
  }, [bodies]);

  // Explode drops each later body (the stand) below the one before it.
  const offsets = useMemo(() => {
    if (!box || !bodies) return [];
    const height = box.max.y - box.min.y;
    return bodies.map((body, i) => (i === 0 ? 0 : -view.explode * height * i));
  }, [bodies, box, view.explode]);

  const clipping = useMemo(() => {
    if (!box || view.section === 'off') return [];
    const k = AXIS[view.section];
    const min = box.min.getComponent(k);
    const max = box.max.getComponent(k);
    const normal = new THREE.Vector3();
    normal.setComponent(k, -1);
    return [new THREE.Plane(normal, min + (max - min) * view.sectionAt)];
  }, [box, view.section, view.sectionAt]);

  const backdrop = BACKDROPS[view.backdrop];
  const span = box
    ? Math.max(box.max.x - box.min.x, box.max.z - box.min.z)
    : 100;
  const grid = Math.ceil((span * 1.4) / 10) * 10;

  return (
    <div className="ps-preview">
      <WebGPUCanvas>
        <color args={[backdrop.background]} attach="background" />
        <hemisphereLight args={['#f4f1ea', '#5a5c63', 1.3]} />
        <directionalLight intensity={2.2} position={[1, 2, 1.5]} />
        <directionalLight intensity={0.7} position={[-1.5, 0.5, -1]} />
        <Framing box={box} frameKey={frameKey} />
        {bodies?.map((body, i) => (
          <Body
            body={body}
            clipping={clipping}
            key={body.id}
            offset={offsets[i] ?? 0}
            view={view}
          />
        ))}
        {view.folds && report?.folds?.spots?.length ? (
          <Folds spots={report.folds.spots} />
        ) : null}
        <gridHelper args={[grid, grid / 10, ...backdrop.grid]} />
      </WebGPUCanvas>
    </div>
  );
}
