import React from 'react';
import { RxCrosshair2 } from 'react-icons/rx';

import useTrashBlasterStore from '../hooks/useTrashBlasterStore';

export default function ShootTrashButton() {
  const fireTrash = useTrashBlasterStore((s) => s.fireTrash);
  const tooltipLabel = 'Fire one off';

  return (
    <button
      type="button"
      onClick={() => fireTrash()}
      title={tooltipLabel}
      aria-label={tooltipLabel}
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
      <RxCrosshair2 />
    </button>
  );
}
