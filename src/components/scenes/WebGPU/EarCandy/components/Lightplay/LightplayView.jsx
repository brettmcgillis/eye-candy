import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import useStage from '../../hooks/useStage';
import createDroneBank from '../../utils/audio/droneBank';
import { degreeToMidi, midiToName, scaleLength } from '../../utils/audio/music';
import {
  DEFAULT_EMITTERS,
  DEFAULT_OCCLUDERS,
  FIELD_H,
  FIELD_W,
  MAX_EMITTERS,
  MAX_OCCLUDERS,
  computeField,
  occluderExtents,
  occluderType,
  regionLevels,
} from '../../utils/lightplay';
import PointerPlane from '../PointerPlane';
import Shapes from '../Shapes';

const UPDATE_INTERVAL = 1 / 30;
const GRID_LINES = 32;
const EMITTER_GRAB = 3.5;
const OCCLUDER_COLOR = new THREE.Color('#14141c');

function createItems(stage) {
  return {
    emitters: DEFAULT_EMITTERS.map((e) => ({
      x: e.x * stage.width,
      y: e.y * stage.height,
    })),
    occluders: DEFAULT_OCCLUDERS.map((o, i) => ({
      rot: i * 0.7,
      x: o.x * stage.width,
      y: o.y * stage.height,
    })),
  };
}

function LightplayView({ audio, c, labelsRef }) {
  const stage = useStage();
  const itemsRef = useRef(null);
  if (!itemsRef.current) itemsRef.current = createItems(stage);
  const dragRef = useRef(null);
  const bankRef = useRef(null);
  const clockRef = useRef(0);
  const emitterRef = useRef(null);
  const circleRef = useRef(null);
  const boxRef = useRef(null);
  const gridRef = useRef(null);

  const cols = scaleLength(c.scale);
  const rows = c.regionOctaves;
  const field = useMemo(() => new Float32Array(FIELD_W * FIELD_H * 3), []);
  const levels = useMemo(() => new Float32Array(cols * rows * 3), [cols, rows]);
  const colors = useMemo(
    () =>
      [c.emitter1Color, c.emitter2Color, c.emitter3Color, c.emitter4Color].map(
        (hex) => new THREE.Color(hex)
      ),
    [c.emitter1Color, c.emitter2Color, c.emitter3Color, c.emitter4Color]
  );

  const texture = useMemo(() => {
    const data = new Uint8Array(FIELD_W * FIELD_H * 4).fill(255);
    const t = new THREE.DataTexture(data, FIELD_W, FIELD_H, THREE.RGBAFormat);
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearFilter;
    t.needsUpdate = true;
    return t;
  }, []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicNodeMaterial({
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: texture,
        transparent: true,
      }),
    [texture]
  );

  useEffect(
    () => () => {
      texture.dispose();
      material.dispose();
    },
    [texture, material]
  );

  const { baseOctave, rootNote, scale } = c;
  useEffect(() => {
    const music = { baseOctave, rootNote, scale };
    const bank = createDroneBank(audio.Tone, audio.input, {
      cols,
      midiAt: (col, row) => degreeToMidi(col + row * cols, music),
      rows,
    });
    bankRef.current = bank;
    return () => {
      bank.dispose();
      bankRef.current = null;
    };
  }, [audio, cols, rows, baseOctave, rootNote, scale]);

  const buildOccluders = () => {
    const { occluders } = itemsRef.current;
    return occluders.slice(0, c.occluderCount).map((o, i) => {
      const type = occluderType(i);
      const [hw, hh] = occluderExtents(type, c.occluderSize);
      return { ...o, hh, hw, type };
    });
  };

  const placeLabels = () => {
    const labels = labelsRef?.current;
    if (!labels) return;
    let slot = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const base = (row * cols + col) * 3;
        const r = Math.min(1, levels[base]);
        const g = Math.min(1, levels[base + 1]);
        const b = Math.min(1, levels[base + 2]);
        const loudest = Math.max(r, g, b);
        if (loudest > 0.04) {
          labels.place(
            slot,
            midiToName(degreeToMidi(col + row * cols, c)),
            ((col + 0.5) / cols - 0.5) * stage.width,
            ((row + 0.5) / rows - 0.5) * stage.height,
            loudest ** 0.7,
            `rgb(${90 + 165 * r}, ${90 + 165 * g}, ${90 + 165 * b})`
          );
          slot += 1;
        }
      }
    }
    labels.hidePlaced(slot);
  };

  const updateField = () => {
    const { emitters } = itemsRef.current;
    const active = emitters.slice(0, c.emitterCount).map((e, i) => ({
      b: colors[i].b,
      g: colors[i].g,
      intensity: c.lightIntensity,
      r: colors[i].r,
      x: e.x,
      y: e.y,
    }));
    computeField(field, active, buildOccluders(), stage, c.lightRadius);

    const pixels = texture.image.data;
    for (let k = 0; k < FIELD_W * FIELD_H; k += 1) {
      pixels[k * 4] = (1 - Math.exp(-1.6 * field[k * 3])) * 255;
      pixels[k * 4 + 1] = (1 - Math.exp(-1.6 * field[k * 3 + 1])) * 255;
      pixels[k * 4 + 2] = (1 - Math.exp(-1.6 * field[k * 3 + 2])) * 255;
    }
    texture.needsUpdate = true;

    regionLevels(field, cols, rows, levels);
    for (let k = 0; k < levels.length; k += 1) levels[k] *= c.sensitivity;
    bankRef.current?.setLevels(levels);
    placeLabels();
  };

  const drawItems = () => {
    const { emitters, occluders } = itemsRef.current;
    const emitter = emitterRef.current;
    const circles = circleRef.current;
    const boxes = boxRef.current;
    const grid = gridRef.current;
    if (!emitter || !circles || !boxes || !grid) return;

    for (let i = 0; i < MAX_EMITTERS; i += 1) {
      if (i < c.emitterCount) {
        const col = colors[i];
        emitter.set(
          i,
          emitters[i].x,
          emitters[i].y,
          1.5,
          1.5,
          0,
          col.r,
          col.g,
          col.b
        );
      } else {
        emitter.hide(i);
      }
    }
    for (let i = 0; i < MAX_OCCLUDERS; i += 1) {
      const type = occluderType(i);
      const on = i < c.occluderCount;
      const [hw, hh] = occluderExtents(type, c.occluderSize);
      const o = occluders[i];
      if (on && type === 'circle') {
        circles.set(
          i,
          o.x,
          o.y,
          hw,
          hw,
          0,
          OCCLUDER_COLOR.r,
          OCCLUDER_COLOR.g,
          OCCLUDER_COLOR.b
        );
      } else {
        circles.hide(i);
      }
      if (on && type !== 'circle') {
        boxes.set(
          i,
          o.x,
          o.y,
          hw * 2,
          hh * 2,
          o.rot,
          OCCLUDER_COLOR.r,
          OCCLUDER_COLOR.g,
          OCCLUDER_COLOR.b
        );
      } else {
        boxes.hide(i);
      }
    }
    for (let i = 0; i < GRID_LINES; i += 1) {
      const vertical = i <= cols;
      const horizontal = !vertical && i - cols - 1 <= rows;
      if (c.showRegions && vertical) {
        grid.set(
          i,
          (i / cols - 0.5) * stage.width,
          0,
          0.08,
          stage.height,
          0,
          0.1,
          0.1,
          0.12
        );
      } else if (c.showRegions && horizontal) {
        const row = i - cols - 1;
        grid.set(
          i,
          0,
          (row / rows - 0.5) * stage.height,
          stage.width,
          0.08,
          0,
          0.1,
          0.1,
          0.12
        );
      } else {
        grid.hide(i);
      }
    }
    emitter.commit();
    circles.commit();
    boxes.commit();
    grid.commit();
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    itemsRef.current.occluders.forEach((o) => {
      const occluder = o;
      occluder.rot += c.occluderSpin * dt;
    });
    clockRef.current += dt;
    if (clockRef.current >= UPDATE_INTERVAL) {
      clockRef.current = 0;
      updateField();
    }
    drawItems();
  });

  const handleDown = useCallback(
    (point) => {
      const { emitters, occluders } = itemsRef.current;
      const pick = (list, count, grab) => {
        let best = null;
        let bestDistance = Infinity;
        list.slice(0, count).forEach((item) => {
          const d = Math.hypot(item.x - point.x, item.y - point.y);
          if (d < grab(item) && d < bestDistance) {
            best = item;
            bestDistance = d;
          }
        });
        return best;
      };
      const target =
        pick(emitters, c.emitterCount, () => EMITTER_GRAB) ||
        pick(occluders, c.occluderCount, () => c.occluderSize * 1.2);
      if (target) {
        dragRef.current = {
          dx: target.x - point.x,
          dy: target.y - point.y,
          target,
        };
      }
    },
    [c.emitterCount, c.occluderCount, c.occluderSize]
  );

  const handleMove = useCallback((point) => {
    const drag = dragRef.current;
    if (!drag) return;
    drag.target.x = point.x + drag.dx;
    drag.target.y = point.y + drag.dy;
  }, []);

  const handleUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <>
      <PointerPlane onDown={handleDown} onMove={handleMove} onUp={handleUp} />
      <mesh material={material} position={[0, 0, 0]}>
        <planeGeometry args={[stage.width, stage.height]} />
      </mesh>
      <Shapes
        ref={gridRef}
        additive
        capacity={GRID_LINES}
        shape="quad"
        z={0.05}
      />
      <Shapes
        ref={circleRef}
        additive={false}
        capacity={MAX_OCCLUDERS}
        z={0.2}
      />
      <Shapes
        ref={boxRef}
        additive={false}
        capacity={MAX_OCCLUDERS}
        shape="quad"
        z={0.2}
      />
      <Shapes ref={emitterRef} capacity={MAX_EMITTERS} z={0.4} />
    </>
  );
}

export default memo(LightplayView);
