import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

import remarkGfm from 'remark-gfm';

function BylineLink({ href, title, children }) {
  return (
    <a href={href} title={title} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

const BYLINE_COMPONENTS = { a: BylineLink };

function Screenshots({ scene }) {
  const [index, setIndex] = useState(0);
  const shots = scene.screenshots;
  const current = shots[index] ?? shots[0];

  if (!current) {
    return <div className="gallery-modal__placeholder">[ no thumbnail ]</div>;
  }

  return (
    <>
      <figure className="gallery-modal__figure">
        <img src={current.src} alt={current.caption || scene.label} />
        {current.caption && <figcaption>{current.caption}</figcaption>}
      </figure>
      {shots.length > 1 && (
        <ul className="gallery-modal__strip">
          {shots.map((shot, i) => (
            <li key={shot.src}>
              <button
                type="button"
                aria-label={shot.caption || `Screenshot ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
              >
                <img src={shot.src} alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

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
            <Screenshots key={scene.path} scene={scene} />
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
            {scene.byline && (
              <div className="gallery-modal__byline">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={BYLINE_COMPONENTS}
                >
                  {scene.byline}
                </ReactMarkdown>
              </div>
            )}
            {!scene.linkDisabled && (
              <div className="gallery-modal__links">
                <Link to={scene.path} className="gallery-button">
                  Open the scene ↗
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
