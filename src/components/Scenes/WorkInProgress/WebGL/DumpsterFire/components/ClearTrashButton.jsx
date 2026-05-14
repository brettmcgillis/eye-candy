import React from 'react';
import { CgTrash, CgTrashEmpty } from 'react-icons/cg';

import useTrashBlasterStore from '../hooks/useTrashBlasterStore';

export default function ClearTrashButton() {
  const hasThrowables = useTrashBlasterStore((s) => s.hasThrowables);
  const clearTrash = useTrashBlasterStore((s) => s.clearTrash);
  const TrashIcon = hasThrowables ? CgTrash : CgTrashEmpty;
  const tooltipLabel = hasThrowables ? 'Clean up your mess' : 'All clean';

  return (
    <button
      type="button"
      onClick={clearTrash}
      title={tooltipLabel}
      aria-label={tooltipLabel}
      disabled={!hasThrowables}
      style={{
        cursor: 'crosshair',
        background: 'transparent',
        border: 0,
        padding: 0,
        color: 'inherit',
        opacity: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TrashIcon />
    </button>
  );
}
