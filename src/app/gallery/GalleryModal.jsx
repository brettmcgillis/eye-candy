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

function getSceneLink(scene, preset) {
  return preset
    ? { pathname: scene.path, search: `?${new URLSearchParams({ preset })}` }
    : scene.path;
}

function Screenshots({ current, index, onSelect, scene }) {
  const shots = scene.screenshots;

  if (!current) {
    return <div className="gallery-modal__placeholder">[ no thumbnail ]</div>;
  }

  return (
    <>
      <figure className="gallery-modal__figure">
        {current.video ? (
          <video
            key={current.src}
            aria-label={current.caption || scene.label}
            autoPlay
            loop
            muted
            playsInline
            src={current.src}
          />
        ) : (
          <img src={current.src} alt={current.caption || scene.label} />
        )}
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
                onClick={() => onSelect(i)}
              >
                {shot.video ? (
                  <video muted playsInline preload="metadata" src={shot.src} />
                ) : (
                  <img src={shot.src} alt="" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ScenePanel({ close, scene }) {
  const [index, setIndex] = useState(0);
  const current = scene.screenshots[index] ?? scene.screenshots[0];

  return (
    <div className="gallery-modal__panel">
      <div className="gallery-modal__media">
        <Screenshots
          current={current}
          index={index}
          onSelect={setIndex}
          scene={scene}
        />
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
          <Link
            to={getSceneLink(scene, current?.preset)}
            className="gallery-button gallery-modal__open"
          >
            Open scene ↗
          </Link>
        )}
      </div>
    </div>
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
      {scene && <ScenePanel key={scene.path} close={close} scene={scene} />}
    </dialog>
  );
}
