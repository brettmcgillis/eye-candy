import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function GalleryModal({ scene, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (scene && !dialog.open) dialog.showModal();
    if (!scene && dialog.open) dialog.close();
  }, [scene]);

  const close = () => ref.current?.close();

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- backdrop click; Esc is native to <dialog>
    <dialog
      ref={ref}
      className="gallery-modal"
      aria-labelledby="gallery-modal-title"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      {scene && (
        <div className="gallery-modal__panel">
          <div className="gallery-modal__media">
            {scene.thumbnail ? (
              <img src={scene.thumbnail} alt={scene.label} />
            ) : (
              <div className="gallery-modal__placeholder">[ no thumbnail ]</div>
            )}
          </div>
          <div className="gallery-modal__body">
            <div className="gallery-modal__top">
              <span className="gallery-badge">{scene.channel}</span>
              <button
                type="button"
                className="gallery-icon-button"
                aria-label="Close"
                onClick={close}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 5l14 14M19 5L5 19" />
                </svg>
              </button>
            </div>
            <h2 id="gallery-modal-title">{scene.label}</h2>
            {scene.byline && <p>{scene.byline}</p>}
            <div className="gallery-modal__links">
              <Link to={scene.path} className="gallery-button">
                Open the scene ↗
              </Link>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
