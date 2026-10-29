import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { emptyDesign } from '@modules/paperCuts';

export default function useHistory() {
  const [design, setDesign] = useState(emptyDesign);
  const present = useRef(design);
  const past = useRef([]);
  const future = useRef([]);
  const [, refresh] = useReducer((value) => value + 1, 0);
  const change = useCallback((next) => {
    present.current = next;
    setDesign(next);
  }, []);
  const checkpoint = useCallback(() => {
    past.current = [...past.current, present.current].slice(-200);
    future.current = [];
    refresh();
  }, []);
  const undo = useCallback(() => {
    if (!past.current.length) return;
    future.current.push(present.current);
    change(past.current.pop());
    refresh();
  }, [change]);
  const redo = useCallback(() => {
    if (!future.current.length) return;
    past.current.push(present.current);
    change(future.current.pop());
    refresh();
  }, [change]);
  const replace = useCallback(
    (next) => {
      checkpoint();
      change(next);
    },
    [change, checkpoint]
  );
  useEffect(() => {
    const key = (event) => {
      if (
        /^(INPUT|TEXTAREA|SELECT)$/u.test(event.target?.tagName) ||
        event.target?.isContentEditable
      )
        return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [undo, redo]);
  return {
    design,
    change,
    checkpoint,
    replace,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
