import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BsFire } from 'react-icons/bs';

function IgniteButton({ onIgnite }) {
  const tooltipLabel = 'burn some money';

  return (
    <div
      className="bottom-center overlay-panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <button
        type="button"
        onClick={() => onIgnite?.()}
        title={tooltipLabel}
        aria-label={tooltipLabel}
        style={{
          cursor: 'crosshair',
          background: 'transparent',
          border: 0,
          padding: 0,
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BsFire />
      </button>
    </div>
  );
}

export default function IgniteOverlay({ onIgnite }) {
  const rootRef = useRef(null);
  const onIgniteRef = useRef(onIgnite);
  onIgniteRef.current = onIgnite;

  useEffect(() => {
    const container = document.createElement('div');
    container.dataset.igniteOverlayPortal = 'true';
    const mountTarget = document.querySelector('.overlay') ?? document.body;
    mountTarget.appendChild(container);

    rootRef.current = createRoot(container);
    rootRef.current.render(
      <IgniteButton onIgnite={() => onIgniteRef.current?.()} />
    );

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
