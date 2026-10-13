import { useCallback, useEffect, useReducer, useRef } from 'react';

const LIMIT = 200;

const isTyping = (target) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    /^(INPUT|TEXTAREA|SELECT)$/u.test(target.tagName));

export default function useDesignHistory(
  code,
  setCode,
  { keyboard = false } = {}
) {
  const codeRef = useRef(code);
  codeRef.current = code;
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const [, bump] = useReducer((count) => count + 1, 0);

  const checkpoint = useCallback(() => {
    undoStack.current = [...undoStack.current, codeRef.current].slice(-LIMIT);
    redoStack.current = [];
    bump();
  }, []);

  const undo = useCallback(() => {
    const previous = undoStack.current.at(-1);
    if (previous === undefined) return;
    undoStack.current = undoStack.current.slice(0, -1);
    redoStack.current = [...redoStack.current, codeRef.current];
    setCode(previous);
    bump();
  }, [setCode]);

  const redo = useCallback(() => {
    const next = redoStack.current.at(-1);
    if (next === undefined) return;
    redoStack.current = redoStack.current.slice(0, -1);
    undoStack.current = [...undoStack.current, codeRef.current];
    setCode(next);
    bump();
  }, [setCode]);

  useEffect(() => {
    if (!keyboard) return undefined;
    const onKey = (event) => {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== 'z'
      ) {
        return;
      }
      if (isTyping(event.target)) return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyboard, redo, undo]);

  return {
    canRedo: redoStack.current.length > 0,
    canUndo: undoStack.current.length > 0,
    checkpoint,
    redo,
    undo,
  };
}
