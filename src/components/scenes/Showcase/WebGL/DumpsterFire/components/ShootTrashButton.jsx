import React from 'react';
import { RxCrosshair2 } from 'react-icons/rx';

import OverlayIconButton from '../../../../../../app/scaffold/overlay/components/OverlayIconButton';
import useTrashBlasterStore from '../hooks/useTrashBlasterStore';

export default function ShootTrashButton() {
  const fireTrash = useTrashBlasterStore((s) => s.fireTrash);

  return (
    <OverlayIconButton
      onClick={() => fireTrash()}
      icon={RxCrosshair2}
      label="Fire one off"
    />
  );
}
