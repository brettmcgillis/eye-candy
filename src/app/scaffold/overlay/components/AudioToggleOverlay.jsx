import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import AudioToggle from './AudioToggle';

export default function AudioToggleOverlay() {
  const rootRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = document.createElement('div');
    container.dataset.audioTogglePortal = 'true';
    const mountTarget = document.querySelector('.overlay') ?? document.body;
    mountTarget.appendChild(container);

    containerRef.current = container;
    rootRef.current = createRoot(container);
    rootRef.current.render(<AudioToggle />);

    return () => {
      rootRef.current?.unmount();
      rootRef.current = null;

      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }

      containerRef.current = null;
    };
  }, []);

  return null;
}
