import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import { AudioToggleButton } from '../../../../../../app/scaffold/overlay/components/AudioToggle';
import ClearTrashButton from './ClearTrashButton';

function TrashBlasterControls() {
  return (
    <div
      className="bottom-center overlay-panel"
      style={{
        cursor: 'crosshair',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
      }}
    >
      <AudioToggleButton />
      <ClearTrashButton />
    </div>
  );
}

export default function TrashBlasterOverlay() {
  const rootRef = useRef(null);

  useEffect(() => {
    const container = document.createElement('div');
    container.dataset.trashBlasterOverlayPortal = 'true';
    const mountTarget = document.querySelector('.overlay') ?? document.body;
    mountTarget.appendChild(container);

    rootRef.current = createRoot(container);
    rootRef.current.render(<TrashBlasterControls />);

    return () => {
      rootRef.current?.unmount();
      rootRef.current = null;

      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

  return null;
}
