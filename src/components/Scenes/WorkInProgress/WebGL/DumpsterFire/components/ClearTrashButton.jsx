import React from 'react';
import { CgTrash, CgTrashEmpty } from 'react-icons/cg';

import useTrashBlasterStore from '../hooks/useTrashBlasterStore';

export default function ClearTrashButton() {
  const hasThrowables = useTrashBlasterStore((s) => s.hasThrowables);
  const clearTrash = useTrashBlasterStore((s) => s.clearTrash);
  const TrashIcon = hasThrowables ? CgTrash : CgTrashEmpty;
  const tooltipLabel = hasThrowables
    ? 'Clear thrown trash'
    : 'No thrown trash to clear';

  return (
    <button
      type="button"
      onClick={clearTrash}
      title={tooltipLabel}
      aria-label={tooltipLabel}
      disabled={!hasThrowables}
      style={{
        cursor: hasThrowables ? 'crosshair' : 'not-allowed',
        background: 'transparent',
        border: 0,
        padding: 0,
        color: 'inherit',
        opacity: hasThrowables ? 1 : 0.55,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TrashIcon />
    </button>
  );
}
