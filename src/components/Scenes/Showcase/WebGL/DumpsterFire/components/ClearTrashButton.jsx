import React from 'react';
import { CgTrash, CgTrashEmpty } from 'react-icons/cg';

import OverlayIconButton from '../../../../../../app/scaffold/overlay/components/OverlayIconButton';
import useTrashBlasterStore from '../hooks/useTrashBlasterStore';

export default function ClearTrashButton() {
  const hasThrowables = useTrashBlasterStore((s) => s.hasThrowables);
  const clearTrash = useTrashBlasterStore((s) => s.clearTrash);
  const TrashIcon = hasThrowables ? CgTrash : CgTrashEmpty;
  const tooltipLabel = hasThrowables
    ? 'Clean up your mess'
    : 'Reset dumpster scene';

  return (
    <OverlayIconButton
      onClick={clearTrash}
      icon={TrashIcon}
      label={tooltipLabel}
    />
  );
}
