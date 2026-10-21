import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { designFrame } from '@modules/trucheterieBlob';

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
import {
  MAX_BRUSH,
  applyTool,
  groupAt,
  isDragTool,
  isStrokeTool,
  moveGroup,
  previewFor,
} from './tools';

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

  const { column, row, size: frameSize } = designFrame(design);
  const cellSize = canvasSize / frameSize;
  const frame = useMemo(
    () => toFieldFrame({ column, row, size: frameSize }, cellSize),
    [cellSize, column, frameSize, row]
  );
  const unframe = useMemo(
    () => fromFieldFrame({ column, row, size: frameSize }, cellSize),
    [cellSize, column, frameSize, row]
  );
  // The editable area always reaches a full brush past the design, and grows with it.
  const area = useMemo(
    () => ({
      column: column - MAX_BRUSH,
      row: row - MAX_BRUSH,
      size: frameSize + MAX_BRUSH * 2,
    }),
    [column, frameSize, row]
  );

  if (!strokeRef.current) designRef.current = design;

  const optionsRef = useRef(null);
  optionsRef.current = { autoConnect, brush, onChange, onStrokeStart, tool };
  const areaRef = useRef(null);
  areaRef.current = { area, unframe };

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
      return areaRef.current.unframe(local.x, local.y);
    };

    const onGrid = ([x, y]) => {
      const { area: bounds } = areaRef.current;
      return (
        x >= bounds.column &&
        y >= bounds.row &&
        x < bounds.column + bounds.size &&
        y < bounds.row + bounds.size
      );
    };

    const updatePreview = (point) => {
      const next =
        point && onGrid(point)
          ? previewFor(designRef.current, optionsRef.current.tool, ...point, {
              autoConnect: optionsRef.current.autoConnect,
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

    const dragTo = (point) => {
      const { move } = strokeRef.current;
      const dx = Math.round(point[0] - move.origin[0]);
      const dy = Math.round(point[1] - move.origin[1]);
      if (dx === move.offset[0] && dy === move.offset[1]) return;
      move.offset = [dx, dy];
      const result = moveGroup(move.base, move.group, dx, dy, {
        copy: move.copy,
      });
      if (result.preview.ok && result.design !== designRef.current) {
        designRef.current = result.design;
        optionsRef.current.onChange?.(result.design);
      }
      setPreview(result.preview);
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
      const moving = isDragTool(optionsRef.current.tool);
      const group = moving ? groupAt(designRef.current, ...point) : null;
      if (moving && group.length === 0) return;
      event.stopPropagation();
      setControlsEnabled(false);
      strokeRef.current = {
        last: point,
        move: moving
          ? {
              base: designRef.current,
              copy: optionsRef.current.tool === 'duplicate',
              group,
              offset: [0, 0],
              origin: point,
            }
          : null,
        pointerId: event.pointerId,
      };
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // The pointer can already be gone (a fast tap); the stroke still ends on pointerup.
      }
      optionsRef.current.onStrokeStart?.(designRef.current);
      if (moving) return;
      apply(point, true);
      updatePreview(point);
    };

    const onMove = (event) => {
      const point = pointAt(event);
      const stroke = strokeRef.current;
      if (stroke && event.pointerId === stroke.pointerId && point) {
        if (stroke.move) {
          dragTo(point);
          return;
        }
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
  }, [get, gl, tool]);

  const hitSize = area.size * cellSize * HIT_MARGIN;
  const hitGeometry = useDisposable(
    () => new THREE.PlaneGeometry(hitSize, hitSize),
    [hitSize]
  );
  const gridGeometry = useDisposable(
    () => gridLinesGeometry(area, frame),
    [area, frame]
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
      <mesh
        key={hitGeometry.uuid}
        ref={hitRef}
        geometry={hitGeometry}
        visible={false}
      />
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
