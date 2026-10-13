import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import {
  fromFieldFrame,
  gridLineMaterial,
  gridLinesGeometry,
  openSidesGeometry,
  outlinesGeometry,
  overlayMaterial,
  previewGeometry,
  toFieldFrame,
} from './overlay';
import { applyTool, isStrokeTool, previewFor } from './tools';

const OUTLINE_WIDTH = 0.06;
const OPEN_WIDTH = 0.2;
const OPEN_INSET = 0.18;
const HIT_MARGIN = 1.15;
const OVERLAY_ORDER = 20;

const DEFAULT_COLORS = {
  blocked: '#e53935',
  grid: '#7a7a7a',
  open: '#ff7a1a',
  outline: '#1e6fd9',
  placeable: '#21a366',
};

const previewKey = (preview) => (preview ? JSON.stringify(preview) : '');

// WebGPU caches a render object's vertex buffers, so a changed geometry needs a fresh object (keyed by uuid).
function useDisposable(factory, deps) {
  const value = useMemo(factory, deps);
  useEffect(() => () => value.dispose(), [value]);
  return value;
}

function BlobDesignEditor({
  autoConnect = true,
  brush = 1,
  canvasSize,
  colors = DEFAULT_COLORS,
  design,
  onChange,
  onStrokeStart,
  tool,
}) {
  const get = useThree((state) => state.get);
  const gl = useThree((state) => state.gl);
  const hitRef = useRef(null);
  const designRef = useRef(design);
  const strokeRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const { gridSize } = design;
  const cellSize = canvasSize / gridSize;
  const frame = useMemo(
    () => toFieldFrame(gridSize, cellSize),
    [cellSize, gridSize]
  );
  const unframe = useMemo(
    () => fromFieldFrame(gridSize, cellSize),
    [cellSize, gridSize]
  );

  if (!strokeRef.current) designRef.current = design;

  const optionsRef = useRef(null);
  optionsRef.current = { autoConnect, brush, onChange, onStrokeStart, tool };

  useEffect(() => {
    if (tool === 'off') return undefined;
    const element = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const pointAt = (event) => {
      const hit = hitRef.current;
      if (!hit) return null;
      const rect = element.getBoundingClientRect();
      ndc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, get().camera);
      const [intersection] = raycaster.intersectObject(hit, false);
      if (!intersection) return null;
      const local = hit.worldToLocal(intersection.point.clone());
      return unframe(local.x, local.y);
    };

    const onGrid = ([x, y]) => x >= 0 && y >= 0 && x < gridSize && y < gridSize;

    const updatePreview = (point) => {
      const next =
        point && onGrid(point)
          ? previewFor(designRef.current, optionsRef.current.tool, ...point, {
              brush: optionsRef.current.brush,
            })
          : null;
      setPreview((current) =>
        previewKey(current) === previewKey(next) ? current : next
      );
    };

    const apply = (point, first) => {
      const { autoConnect: connect, brush: size } = optionsRef.current;
      const before = designRef.current;
      const next = applyTool(before, optionsRef.current.tool, ...point, {
        autoConnect: connect,
        brush: size,
        first,
      });
      if (next === before) return;
      designRef.current = next;
      optionsRef.current.onChange?.(next);
    };

    const strokeTo = (point) => {
      const { last } = strokeRef.current;
      const span = Math.hypot(point[0] - last[0], point[1] - last[1]);
      const step = Math.max(0.5, optionsRef.current.brush * 0.5);
      const steps = Math.max(1, Math.ceil(span / step));
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        apply(
          [
            last[0] + (point[0] - last[0]) * t,
            last[1] + (point[1] - last[1]) * t,
          ],
          false
        );
      }
      strokeRef.current.last = point;
    };

    const setControlsEnabled = (enabled) => {
      const { controls } = get();
      if (controls) controls.enabled = enabled;
    };

    const endStroke = (event) => {
      const stroke = strokeRef.current;
      if (!stroke || (event && event.pointerId !== stroke.pointerId)) return;
      strokeRef.current = null;
      setControlsEnabled(true);
      if (element.hasPointerCapture(stroke.pointerId)) {
        element.releasePointerCapture(stroke.pointerId);
      }
    };

    const onDown = (event) => {
      if (strokeRef.current) {
        endStroke();
        return;
      }
      if (event.button !== 0) return;
      const point = pointAt(event);
      if (!point || !onGrid(point)) return;
      event.stopPropagation();
      setControlsEnabled(false);
      strokeRef.current = { last: point, pointerId: event.pointerId };
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // The pointer can already be gone (a fast tap); the stroke still ends on pointerup.
      }
      optionsRef.current.onStrokeStart?.(designRef.current);
      apply(point, true);
      updatePreview(point);
    };

    const onMove = (event) => {
      const point = pointAt(event);
      const stroke = strokeRef.current;
      if (stroke && event.pointerId === stroke.pointerId && point) {
        if (isStrokeTool(optionsRef.current.tool)) strokeTo(point);
      }
      updatePreview(point);
    };

    const onLeave = () => setPreview(null);

    element.addEventListener('pointerdown', onDown, { capture: true });
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerup', endStroke);
    element.addEventListener('pointercancel', endStroke);
    element.addEventListener('pointerleave', onLeave);
    return () => {
      element.removeEventListener('pointerdown', onDown, { capture: true });
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerup', endStroke);
      element.removeEventListener('pointercancel', endStroke);
      element.removeEventListener('pointerleave', onLeave);
      endStroke();
      setPreview(null);
    };
  }, [get, gl, gridSize, tool, unframe]);

  const hitGeometry = useDisposable(
    () =>
      new THREE.PlaneGeometry(canvasSize * HIT_MARGIN, canvasSize * HIT_MARGIN),
    [canvasSize]
  );
  const gridGeometry = useDisposable(
    () => gridLinesGeometry(gridSize, frame),
    [frame, gridSize]
  );
  const outlineGeometry = useDisposable(
    () => outlinesGeometry(design, frame, OUTLINE_WIDTH),
    [design, frame]
  );
  const openGeometry = useDisposable(
    () => openSidesGeometry(design, frame, OPEN_WIDTH, OPEN_INSET),
    [design, frame]
  );
  const hoverGeometry = useDisposable(
    () => previewGeometry(design, preview, frame, OPEN_WIDTH * 1.4),
    [design, frame, preview]
  );

  const gridMaterial = useDisposable(
    () => gridLineMaterial(colors.grid, 0.35),
    [colors.grid]
  );
  const outlineMaterial = useDisposable(
    () => overlayMaterial(colors.outline, 0.7),
    [colors.outline]
  );
  const openMaterial = useDisposable(
    () => overlayMaterial(colors.open, 0.9),
    [colors.open]
  );
  const hoverMaterial = useDisposable(
    () => overlayMaterial(colors.placeable, 0.35),
    [colors.placeable]
  );
  useEffect(() => {
    const blocked = preview && !preview.ok;
    const removing = preview?.kind === 'erase' || preview?.opening === false;
    hoverMaterial.color.set(
      blocked || removing ? colors.blocked : colors.placeable
    );
    hoverMaterial.opacity = preview?.kind === 'sides' ? 0.85 : 0.4;
  }, [colors.blocked, colors.placeable, hoverMaterial, preview]);

  const visible = tool !== 'off';

  return (
    <group visible={visible}>
      <mesh ref={hitRef} geometry={hitGeometry} visible={false} />
      <lineSegments
        key={gridGeometry.uuid}
        geometry={gridGeometry}
        material={gridMaterial}
        renderOrder={OVERLAY_ORDER}
        frustumCulled={false}
      />
      <mesh
        key={outlineGeometry.uuid}
        geometry={outlineGeometry}
        material={outlineMaterial}
        renderOrder={OVERLAY_ORDER + 1}
        frustumCulled={false}
      />
      <mesh
        key={openGeometry.uuid}
        geometry={openGeometry}
        material={openMaterial}
        renderOrder={OVERLAY_ORDER + 2}
        frustumCulled={false}
      />
      <mesh
        key={hoverGeometry.uuid}
        geometry={hoverGeometry}
        material={hoverMaterial}
        renderOrder={OVERLAY_ORDER + 3}
        frustumCulled={false}
      />
    </group>
  );
}

export default memo(BlobDesignEditor);
