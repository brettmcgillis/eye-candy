import { useRef } from 'react';

const snap = (value) => Math.round(value * 4) / 4;

export default function usePlacement({
  editor,
  inside,
  tool,
  brush,
  catalogueIndex,
  placementRotation,
  controlBrush,
}) {
  const svg = useRef(null);
  const ghost = useRef(null);
  const drag = useRef(null);
  const { design, module } = editor;
  const items = inside ? module.controls : design.modules;
  const size = inside ? controlBrush : brush;
  const point = (event) => {
    const location = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      svg.current.getScreenCTM().inverse()
    );
    return { x: snap(location.x), y: snap(location.y) };
  };
  const showGhost = (x, y, w, h) => {
    const node = ghost.current;
    node.setAttribute('x', x);
    node.setAttribute('y', y);
    node.setAttribute('width', w);
    node.setAttribute('height', h);
    node.setAttribute('visibility', 'visible');
  };
  const start = (event, item) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const at = point(event);
    svg.current.setPointerCapture(event.pointerId);
    if (item) {
      editor.select({
        module: inside ? module.id : item.id,
        control: inside ? item.id : null,
      });
      if (tool === 'erase') {
        if (inside)
          editor.updateModule({
            controls: module.controls.filter((other) => other.id !== item.id),
          });
        else
          editor.change({
            ...design,
            modules: design.modules.filter((other) => other.id !== item.id),
          });
        return;
      }
      drag.current = { item, at, pointer: event.pointerId };
    } else if (tool === 'place') {
      if (inside)
        editor.placeControl(
          at.x,
          at.y,
          catalogueIndex,
          placementRotation,
          size
        );
      else editor.placeModule(at.x, at.y, size.w, size.h);
    } else editor.select({ module: inside ? module.id : null, control: null });
  };
  const move = (event) => {
    const at = point(event);
    if (drag.current) {
      const { item, at: from } = drag.current;
      showGhost(item.x + at.x - from.x, item.y + at.y - from.y, item.w, item.h);
    } else if (tool === 'place') showGhost(at.x, at.y, size.w, size.h);
    else ghost.current.setAttribute('visibility', 'hidden');
  };
  const end = (event) => {
    const gesture = drag.current;
    drag.current = null;
    ghost.current.setAttribute('visibility', 'hidden');
    if (svg.current.hasPointerCapture(event.pointerId))
      svg.current.releasePointerCapture(event.pointerId);
    if (
      !gesture ||
      gesture.pointer !== event.pointerId ||
      event.type === 'pointercancel'
    )
      return;
    const at = point(event);
    const patch = {
      x: gesture.item.x + at.x - gesture.at.x,
      y: gesture.item.y + at.y - gesture.at.y,
    };
    if (inside)
      editor.updateModule({
        controls: items.map((item) =>
          item.id === gesture.item.id ? { ...item, ...patch } : item
        ),
      });
    else
      editor.change({
        ...design,
        modules: items.map((item) =>
          item.id === gesture.item.id ? { ...item, ...patch } : item
        ),
      });
  };
  const cancel = () => {
    drag.current = null;
  };
  const leave = () => {
    if (!drag.current) ghost.current.setAttribute('visibility', 'hidden');
  };
  return { svg, ghost, start, move, end, cancel, leave };
}
