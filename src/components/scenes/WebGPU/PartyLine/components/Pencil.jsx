/* eslint-disable no-param-reassign */
import React, { forwardRef, memo } from 'react';

import { Shape, ShapeGeometry } from 'three';

import NameTag from './NameTag';

const HALF = 7;
const CONE = 26;
const BODY_END = 96;
const FERRULE_END = 106;
const LENGTH = 118;
const TILT = (50 * Math.PI) / 180;
const TIP_HALF = 3;
const TAG_GAP = 20;
const TAG_X = LENGTH * Math.cos(TILT);
const TAG_Y = LENGTH * Math.sin(TILT) + TAG_GAP;

function rect(x0, y0, x1, y1) {
  const shape = new Shape();
  shape.moveTo(x0, y0);
  shape.lineTo(x1, y0);
  shape.lineTo(x1, y1);
  shape.lineTo(x0, y1);
  shape.closePath();
  return new ShapeGeometry(shape);
}

function triangle(length, half) {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.lineTo(length, half);
  shape.lineTo(length, -half);
  shape.closePath();
  return new ShapeGeometry(shape);
}

function eraserCap() {
  const shape = new Shape();
  shape.moveTo(FERRULE_END, -HALF);
  shape.lineTo(LENGTH - 4, -HALF);
  shape.quadraticCurveTo(LENGTH, -HALF, LENGTH, -HALF + 4);
  shape.lineTo(LENGTH, HALF - 4);
  shape.quadraticCurveTo(LENGTH, HALF, LENGTH - 4, HALF);
  shape.lineTo(FERRULE_END, HALF);
  shape.closePath();
  return new ShapeGeometry(shape);
}

let parts = null;
function getParts() {
  if (!parts) {
    const graphite = (CONE * TIP_HALF) / HALF;
    parts = {
      body: rect(CONE, -HALF, BODY_END, HALF),
      dark: rect(CONE, -HALF, BODY_END, -HALF / 3),
      eraser: eraserCap(),
      ferrule: rect(BODY_END, -HALF - 0.5, FERRULE_END, HALF + 0.5),
      graphite: triangle(graphite, TIP_HALF),
      light: rect(CONE, HALF / 3, BODY_END, HALF),
      shadow: rect(4, -HALF, LENGTH, HALF),
      wood: triangle(CONE, HALF),
    };
  }
  return parts;
}

function Part({ color, geometry, name, opacity = 1, z }) {
  return (
    <mesh geometry={geometry} name={name} position-z={z}>
      <meshBasicMaterial
        color={color}
        opacity={opacity}
        toneMapped={false}
        transparent={opacity < 1}
      />
    </mesh>
  );
}

export function setPencilFlipped(group, flipped) {
  group.traverse((child) => {
    if (child.name !== 'flip') return;
    child.rotation.z = flipped ? Math.PI : 0;
    child.position.x = flipped ? LENGTH : 0;
  });
}

const Pencil = forwardRef(({ avatar, color, label, scale = 1 }, ref) => {
  const p = getParts();
  return (
    <group ref={ref} scale={scale} visible={false}>
      <group name="shadow" position={[5, -5, 0]} rotation-z={TILT}>
        <group name="flip">
          <Part color="#000000" geometry={p.shadow} opacity={0.22} z={0} />
        </group>
      </group>
      <group rotation-z={TILT}>
        <group name="flip">
          <Part color="#f1c38e" geometry={p.wood} z={0.1} />
          <Part color="#2b2b2b" geometry={p.graphite} name="tip" z={0.2} />
          <Part color={color} geometry={p.body} z={0.1} />
          <Part color="#ffffff" geometry={p.light} opacity={0.25} z={0.2} />
          <Part color="#000000" geometry={p.dark} opacity={0.18} z={0.2} />
          <Part color="#c9ccd1" geometry={p.ferrule} z={0.3} />
          <Part color="#ff8fab" geometry={p.eraser} z={0.1} />
        </group>
      </group>
      {label && (
        <group position={[TAG_X, TAG_Y, 1]} scale={1 / scale}>
          <NameTag avatar={avatar} color={color} name={label} />
        </group>
      )}
    </group>
  );
});

export default memo(Pencil);
