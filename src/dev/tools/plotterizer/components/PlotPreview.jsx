import React, { useEffect, useRef, useState } from 'react';

const PAD = 24;

function passPaths({ crowding, packed }) {
  const { closed, coords, starts } = packed;
  const ink = new Path2D();
  const travel = new Path2D();
  let at = [0, 0];
  for (let r = 0; r + 1 < starts.length; r += 1) {
    const from = starts[r];
    const to = starts[r + 1];
    if (to > from) {
      const x = coords[from * 2];
      const y = coords[from * 2 + 1];
      travel.moveTo(at[0], at[1]);
      travel.lineTo(x, y);
      ink.moveTo(x, y);
      if (to - from === 1) ink.lineTo(x, y);
      for (let i = from + 1; i < to; i += 1) {
        ink.lineTo(coords[i * 2], coords[i * 2 + 1]);
      }
      if (closed[r]) {
        ink.closePath();
        at = [x, y];
      } else {
        at = [coords[(to - 1) * 2], coords[(to - 1) * 2 + 1]];
      }
    }
  }
  const crowded = new Path2D();
  if (crowding) {
    const { cellMm, cells, cols } = crowding;
    cells.forEach((cell) => {
      crowded.rect(
        (cell % cols) * cellMm,
        Math.floor(cell / cols) * cellMm,
        cellMm,
        cellMm
      );
    });
  }
  return { crowded, ink, travel };
}

// Draws the plot on its paper at the pens' real nib widths. The geometry
// lives in `dataRef` (typed arrays never go through props); `version` says
// when it changed.
export default function PlotPreview({ dataRef, options, version }) {
  const canvasRef = useRef(null);
  const pathsRef = useRef([]);
  const viewRef = useRef({ x: 0, y: 0, zoom: 1 });
  const dragRef = useRef(null);
  const [size, setSize] = useState({ height: 0, width: 0 });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const observer = new ResizeObserver(([entry]) => {
      const { height, width } = entry.contentRect;
      setSize({ height, width });
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    pathsRef.current = (dataRef.current?.passes ?? []).map(passPaths);
    setTick((value) => value + 1);
  }, [dataRef, version]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const data = dataRef.current;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(size.width * ratio));
    canvas.height = Math.max(1, Math.round(size.height * ratio));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!data?.paper) return;
    const { paper, passes } = data;
    const fit = Math.min(
      (size.width - 2 * PAD) / paper.widthMm,
      (size.height - 2 * PAD) / paper.heightMm
    );
    const view = viewRef.current;
    const scale = fit * view.zoom * ratio;
    const originX =
      ((size.width - paper.widthMm * fit * view.zoom) / 2 + view.x) * ratio;
    const originY =
      ((size.height - paper.heightMm * fit * view.zoom) / 2 + view.y) * ratio;
    ctx.setTransform(scale, 0, 0, scale, originX, originY);
    ctx.fillStyle = paper.color;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 12 * ratio;
    ctx.fillRect(0, 0, paper.widthMm, paper.heightMm);
    ctx.shadowBlur = 0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    passes.forEach((pass, i) => {
      if (options.solo != null && options.solo !== i) return;
      const paths = pathsRef.current[i];
      if (!paths) return;
      ctx.strokeStyle = pass.pen.color;
      ctx.lineWidth = Math.max(pass.pen.nibMm, 0.6 / scale);
      ctx.stroke(paths.ink);
      if (options.showCrowding) {
        ctx.fillStyle = 'rgba(230, 30, 60, 0.45)';
        ctx.fill(paths.crowded);
      }
      if (options.showTravel) {
        ctx.strokeStyle = 'rgba(230, 60, 30, 0.7)';
        ctx.lineWidth = 0.8 / scale;
        ctx.setLineDash([4 / scale, 3 / scale]);
        ctx.stroke(paths.travel);
        ctx.setLineDash([]);
      }
    });
  }, [dataRef, options, size, tick]);

  const redraw = () => setTick((value) => value + 1);

  const onWheel = (event) => {
    const view = viewRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const factor = Math.exp(-event.deltaY * 0.0015);
    const zoom = Math.min(80, Math.max(0.5, view.zoom * factor));
    const applied = zoom / view.zoom;
    const cx = event.clientX - rect.left - rect.width / 2;
    const cy = event.clientY - rect.top - rect.height / 2;
    view.x = cx - (cx - view.x) * applied;
    view.y = cy - (cy - view.y) * applied;
    view.zoom = zoom;
    redraw();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const block = (event) => event.preventDefault();
    canvas.addEventListener('wheel', block, { passive: false });
    return () => canvas.removeEventListener('wheel', block);
  }, []);

  return (
    <canvas
      className="pz-preview"
      onDoubleClick={() => {
        viewRef.current = { x: 0, y: 0, zoom: 1 };
        redraw();
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = [event.clientX, event.clientY];
      }}
      onPointerMove={(event) => {
        if (!dragRef.current) return;
        const [x, y] = dragRef.current;
        viewRef.current.x += event.clientX - x;
        viewRef.current.y += event.clientY - y;
        dragRef.current = [event.clientX, event.clientY];
        redraw();
      }}
      onPointerUp={() => {
        dragRef.current = null;
      }}
      onWheel={onWheel}
      ref={canvasRef}
    />
  );
}
