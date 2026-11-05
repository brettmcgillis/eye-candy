import { useCallback, useEffect, useState } from 'react';

import {
  DESIGN_CATALOGUE,
  UNITS,
  controlSize,
  decodeDesign,
  emptyDesign,
  nextDesignId,
  normalizeDesign,
  overlaps,
  rotateDesignItem,
} from '@modules/controlPanel';

const STORAGE = 'eye-candy:control-panel-design:v1';
const initial = () => {
  try {
    const saved = localStorage.getItem(STORAGE);
    return saved ? normalizeDesign(JSON.parse(saved)) : emptyDesign();
  } catch {
    return emptyDesign();
  }
};

export default function useEditor() {
  const [history, setHistory] = useState(() => ({
    past: [],
    design: initial(),
    future: [],
  }));
  const [selection, select] = useState({ module: null, control: null });
  const [message, setMessage] = useState('');
  const { design } = history;
  const commit = useCallback((update) => {
    setHistory((current) => {
      if (JSON.stringify(update) === JSON.stringify(current.design))
        return current;
      return {
        past: [...current.past.slice(-99), current.design],
        design: update,
        future: [],
      };
    });
  }, []);
  const change = (update) => {
    try {
      const next = normalizeDesign(
        typeof update === 'function' ? update(design) : update
      );
      commit(next);
      setMessage('');
      return true;
    } catch (error) {
      setMessage(error.message);
      return false;
    }
  };
  const undo = useCallback(() => {
    setMessage('');
    setHistory((current) =>
      current.past.length
        ? {
            past: current.past.slice(0, -1),
            design: current.past.at(-1),
            future: [current.design, ...current.future],
          }
        : current
    );
  }, []);
  const redo = useCallback(() => {
    setMessage('');
    setHistory((current) =>
      current.future.length
        ? {
            past: [...current.past, current.design],
            design: current.future[0],
            future: current.future.slice(1),
          }
        : current
    );
  }, []);
  const module = design.modules.find((item) => item.id === selection.module);
  const control = module?.controls.find(
    (item) => item.id === selection.control
  );
  const item = selection.control ? control : module;
  const updateModule = (patch) =>
    change({
      ...design,
      modules: design.modules.map((entry) =>
        entry.id === module.id ? { ...entry, ...patch } : entry
      ),
    });
  const updateItem = (patch) => {
    if (!item) return false;
    let next = patch;
    if (
      control &&
      UNITS[control.type] &&
      (patch.w != null || patch.h != null)
    ) {
      const side = patch.w ?? patch.h;
      next = { ...patch, w: side, h: side };
    }
    if (!control) return updateModule(next);
    return updateModule({
      controls: module.controls.map((entry) =>
        entry.id === control.id ? { ...entry, ...next } : entry
      ),
    });
  };
  const rotate = (direction = 1) => {
    if (!item) return;
    updateItem(rotateDesignItem(item, direction));
  };
  const remove = () => {
    if (!module || (selection.control && !control)) return;
    if (control)
      updateModule({
        controls: module.controls.filter((entry) => entry.id !== control.id),
      });
    else
      change({
        ...design,
        modules: design.modules.filter((entry) => entry.id !== module.id),
      });
    select({ module: control ? module.id : null, control: null });
  };
  const placeModule = (x, y, w, h) => {
    const id = nextDesignId(design.modules, 'm');
    if (
      change({
        ...design,
        modules: [
          ...design.modules,
          { id, x, y, w, h, seed: 0, zone: false, controls: [] },
        ],
      })
    )
      select({ module: id, control: null });
  };
  const placeControl = (
    x,
    y,
    catalogueIndex,
    rotation = 0,
    footprint = null
  ) => {
    if (!module) return;
    const entry = DESIGN_CATALOGUE[catalogueIndex];
    const id = nextDesignId(module.controls, 'c');
    const size = footprint ?? controlSize({ ...entry, rotation });
    if (
      updateModule({
        controls: [
          ...module.controls,
          {
            id,
            x,
            y,
            w: size.w,
            h: size.h,
            ...(rotation && { rotation }),
            type: entry.id,
            variant: entry.variant,
            seed: 0,
          },
        ],
      })
    )
      select({ module: module.id, control: id });
  };
  const duplicate = () => {
    if (!item) return;
    const items = control ? module.controls : design.modules;
    const width = control ? module.w : design.cols;
    const height = control ? module.h : design.rows;
    for (let y = 0; y + item.h <= height; y += 0.25) {
      for (let x = 0; x + item.w <= width; x += 0.25) {
        const copy = {
          ...item,
          id: nextDesignId(items, control ? 'c' : 'm'),
          x,
          y,
        };
        const next = control
          ? {
              ...design,
              modules: design.modules.map((entry) =>
                entry.id === module.id
                  ? { ...entry, controls: [...items, copy] }
                  : entry
              ),
            }
          : { ...design, modules: [...items, copy] };
        if (!items.some((other) => overlaps(copy, other))) {
          if (change(next))
            select({
              module: control ? module.id : copy.id,
              control: control ? copy.id : null,
            });
          return;
        }
      }
    }
    setMessage('No free space for a copy.');
  };
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(design));
    } catch {
      return undefined;
    }
    return undefined;
  }, [design]);
  const open = (value) => {
    if (change(typeof value === 'string' ? decodeDesign(value) : value))
      select({ module: null, control: null });
  };
  return {
    design,
    selection,
    select,
    module,
    control,
    item,
    change,
    open,
    undo,
    redo,
    canUndo: Boolean(history.past.length),
    canRedo: Boolean(history.future.length),
    updateItem,
    updateModule,
    remove,
    duplicate,
    rotate,
    placeModule,
    placeControl,
    message,
    setMessage,
  };
}
