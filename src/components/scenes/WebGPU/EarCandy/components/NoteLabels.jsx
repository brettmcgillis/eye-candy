import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import useStage from '../hooks/useStage';

const FLOATING = 64;
const PLACED = 64;
const LIFE = 1.3;
const RISE = 22;

function makeSpan(container) {
  const span = document.createElement('span');
  Object.assign(span.style, {
    color: '#fff',
    font: '600 12px ui-monospace, SFMono-Regular, Menlo, monospace',
    left: '0',
    opacity: '0',
    position: 'absolute',
    textShadow: '0 0 6px currentColor',
    top: '0',
    whiteSpace: 'nowrap',
    willChange: 'transform, opacity',
  });
  container.appendChild(span);
  return span;
}

function voiceColor(voice) {
  let h = 0;
  for (let i = 0; i < voice.length; i += 1)
    h = (h * 31 + voice.charCodeAt(i)) % 360;
  return `hsl(${h}, 85%, 72%)`;
}

const NoteLabels = forwardRef(function NoteLabels(_, ref) {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const stage = useStage();
  const pool = useMemo(() => ({ floating: [], next: 0, placed: [] }), []);

  useEffect(() => {
    const container = document.createElement('div');
    Object.assign(container.style, {
      inset: '0',
      overflow: 'hidden',
      pointerEvents: 'none',
      position: 'absolute',
    });
    gl.domElement.parentElement.appendChild(container);
    pool.floating = Array.from({ length: FLOATING }, () => ({
      age: Infinity,
      span: makeSpan(container),
      x: 0,
      y: 0,
    }));
    pool.placed = Array.from({ length: PLACED }, () => makeSpan(container));
    return () => container.remove();
  }, [gl, pool]);

  const toScreen = (x, y) => [
    (x / stage.width + 0.5) * size.width,
    (0.5 - y / stage.height) * size.height,
  ];

  useImperativeHandle(ref, () => ({
    spawn(text, x, y, delay, voice) {
      const label = pool.floating[pool.next];
      if (!label) return;
      pool.next = (pool.next + 1) % FLOATING;
      label.age = -delay;
      label.x = x;
      label.y = y;
      label.span.textContent = text;
      label.span.style.color = voiceColor(voice);
    },
    place(i, text, x, y, alpha, color) {
      const span = pool.placed[i];
      if (!span) return;
      const [px, py] = toScreen(x, y);
      if (span.textContent !== text) span.textContent = text;
      span.style.color = color;
      span.style.opacity = String(alpha);
      span.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
    },
    hidePlaced(from) {
      for (let i = from; i < pool.placed.length; i += 1) {
        pool.placed[i].style.opacity = '0';
      }
    },
  }));

  useFrame((__, delta) => {
    pool.floating.forEach((label) => {
      if (label.age > LIFE) return;
      const item = label;
      item.age += delta;
      const { span } = item;
      if (item.age < 0 || item.age > LIFE) {
        span.style.opacity = '0';
        return;
      }
      const t = item.age / LIFE;
      const [px, py] = toScreen(item.x, item.y);
      span.style.opacity = String(1 - t * t);
      span.style.transform = `translate(${px}px, ${py - t * RISE}px) translate(-50%, -100%)`;
    });
  });

  return null;
});

export default memo(NoteLabels);
