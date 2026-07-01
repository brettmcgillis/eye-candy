import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// Scenes render inside <Canvas>, which is its own React reconciler tree —
// react-dom's createPortal can't bridge into it. Mounting a second root onto
// a DOM node under `.overlay` is the escape hatch back into real DOM.
export default function OverlayPortal({ datasetKey, children }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const container = document.createElement('div');
    container.dataset[datasetKey] = 'true';
    const mountTarget = document.querySelector('.overlay') ?? document.body;
    mountTarget.appendChild(container);

    rootRef.current = createRoot(container);

    return () => {
      rootRef.current?.unmount();
      rootRef.current = null;
      if (container.parentNode) container.parentNode.removeChild(container);
    };
  }, [datasetKey]);

  useEffect(() => {
    rootRef.current?.render(children);
  });

  return null;
}
