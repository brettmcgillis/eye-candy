/* eslint-disable no-param-reassign */
import { useEffect, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import { MAX_BATCH_POINTS, quantize } from '../utils/quantize';

const FLUSH_MS = 40;
const CURSOR_MS = 50;
const PARKED_RESEND_MS = 2000;

export default function useBoardPointer({
  enabled,
  onBatch,
  onCursor,
  rectRef,
}) {
  const gl = useThree((state) => state.gl);
  const localCursorRef = useRef({ down: false, u: 0, v: 0, visible: false });
  const handlersRef = useRef({ enabled, onBatch, onCursor });
  handlersRef.current = { enabled, onBatch, onCursor };

  useEffect(() => {
    const el = gl.domElement;
    const strokes = new Map();
    let lastCursorAt = 0;

    const toBoard = (event) => {
      const bounds = el.getBoundingClientRect();
      const rect = rectRef.current;
      return [
        (event.clientX - bounds.left - rect.x) / rect.size,
        (event.clientY - bounds.top - rect.y) / rect.size,
      ];
    };
    const inside = ([u, v]) => u >= 0 && u <= 1 && v >= 0 && v <= 1;
    const clamp01 = (value) => Math.min(1, Math.max(0, value));

    const sendCursor = (u, v, down, force) => {
      const local = localCursorRef.current;
      Object.assign(local, { down, u, v, visible: true });
      const now = performance.now();
      if (!force && now - lastCursorAt < CURSOR_MS) return;
      lastCursorAt = now;
      handlersRef.current.onCursor?.([quantize(u), quantize(v), down ? 1 : 0]);
    };

    const flush = (stroke) => {
      if (stroke.points.length < 4 && stroke.sent) return;
      const chunk = MAX_BATCH_POINTS * 2;
      for (
        let i = 0;
        i < stroke.points.length - 2 || !stroke.sent;
        i += chunk - 2
      ) {
        handlersRef.current.onBatch?.(stroke.points.slice(i, i + chunk));
        stroke.sent = true;
      }
      stroke.points = stroke.points.slice(-2);
    };

    const onDown = (event) => {
      const point = toBoard(event);
      if (!inside(point)) return;
      if (!handlersRef.current.enabled) {
        sendCursor(point[0], point[1], false, true);
        return;
      }
      el.setPointerCapture?.(event.pointerId);
      strokes.set(event.pointerId, {
        points: [quantize(point[0]), quantize(point[1])],
        sent: false,
      });
      sendCursor(point[0], point[1], true, true);
    };

    const onMove = (event) => {
      const stroke = strokes.get(event.pointerId);
      const samples = stroke
        ? (event.getCoalescedEvents?.() ?? [event])
        : [event];
      samples.forEach((sample) => {
        const [u, v] = toBoard(sample);
        if (!stroke) return;
        const qu = quantize(u);
        const qv = quantize(v);
        const n = stroke.points.length;
        if (stroke.points[n - 2] === qu && stroke.points[n - 1] === qv) return;
        stroke.points.push(qu, qv);
      });
      const [u, v] = toBoard(event);
      if (stroke || event.pointerType === 'mouse') {
        sendCursor(u, v, Boolean(stroke), false);
      }
    };

    const onUp = (event) => {
      const stroke = strokes.get(event.pointerId);
      if (stroke) {
        flush(stroke);
        strokes.delete(event.pointerId);
      }
      if (!stroke && event.pointerType !== 'mouse') return;
      const [u, v] = toBoard(event);
      if (event.pointerType === 'mouse') sendCursor(u, v, false, true);
      else sendCursor(clamp01(u), clamp01(v), false, true);
    };

    const onLeave = (event) => {
      if (event.pointerType !== 'mouse' || strokes.size) return;
      localCursorRef.current.visible = false;
      handlersRef.current.onCursor?.(null);
    };

    const timer = setInterval(() => {
      strokes.forEach(flush);
      const local = localCursorRef.current;
      if (!local.visible || performance.now() - lastCursorAt < PARKED_RESEND_MS)
        return;
      sendCursor(local.u, local.v, local.down, true);
    }, FLUSH_MS);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      clearInterval(timer);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [gl, rectRef]);

  return localCursorRef;
}
