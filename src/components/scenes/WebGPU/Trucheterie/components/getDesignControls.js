import { button } from 'leva';

import { MAX_BRUSH } from '@modules/trucheterieDesigner';

import { BLOB_PATH, DESIGN_PATH } from './controlPaths';

const hasDesign = (get) => Boolean(get(`${BLOB_PATH}.blobDesign`));
const isEditing = (get) =>
  hasDesign(get) && get(`${DESIGN_PATH}.designTool`) !== 'off';

const action = (label, onClick, render) => ({
  ...button(onClick),
  label,
  ...(render ? { render } : {}),
});

// A ref because the actions need the setter Leva has not returned when this schema is built.
export default function getDesignControls(snapshot, designRef) {
  const saved = snapshot ?? {};
  const run = (name) => () => designRef.current?.[name]?.();
  return {
    fromSeed: action('Start From Seeded Field', run('fromSeed')),
    newDesign: action('New Blank Design', run('newBlank')),
    designTool: {
      label: 'Tool',
      options: {
        View: 'off',
        Paint: 'paint',
        Erase: 'erase',
        Connect: 'connect',
        Diagonal: 'diagonal',
        Order: 'order',
        Move: 'move',
      },
      render: hasDesign,
      value: saved.designTool ?? 'off',
    },
    designBrush: {
      label: 'Cell Size',
      max: MAX_BRUSH,
      min: 1,
      render: (get) =>
        isEditing(get) && get(`${DESIGN_PATH}.designTool`) === 'paint',
      step: 1,
      value: saved.designBrush ?? 2,
    },
    designAutoConnect: {
      label: 'Auto Connect',
      render: (get) =>
        isEditing(get) && get(`${DESIGN_PATH}.designTool`) === 'paint',
      value: saved.designAutoConnect ?? true,
    },
    undoDesign: action('Undo', run('undo'), hasDesign),
    redoDesign: action('Redo', run('redo'), hasDesign),
    clearDesign: action('Clear', run('clear'), hasDesign),
    seededField: action('Back To Seeded Field', run('toSeed'), hasDesign),
  };
}
