import { useEffect } from 'react';

export default function useHotkeys({
  editor,
  tab,
  tool,
  inside,
  placementRotation,
  rotatePlacement,
}) {
  useEffect(() => {
    const keydown = (event) => {
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) ||
        event.target.isContentEditable ||
        tab !== 'edit'
      )
        return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) editor.redo();
        else editor.undo();
      } else if (
        !event.metaKey &&
        !event.ctrlKey &&
        event.key.toLowerCase() === 'r'
      ) {
        event.preventDefault();
        if (tool === 'place' && inside)
          rotatePlacement(
            (placementRotation + (event.shiftKey ? 270 : 90)) % 360
          );
        else editor.rotate(event.shiftKey ? -1 : 1);
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        editor.remove();
      } else if (editor.item && event.key.startsWith('Arrow')) {
        const steps = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        };
        const delta = steps[event.key];
        if (delta) {
          event.preventDefault();
          const step = event.shiftKey ? 1 : 0.25;
          editor.updateItem({
            x: editor.item.x + delta[0] * step,
            y: editor.item.y + delta[1] * step,
          });
        }
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [editor, inside, placementRotation, rotatePlacement, tab, tool]);
}
