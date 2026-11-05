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

function getPresetLink(scene, preset) {
  return {
    pathname: scene.path,
    search: `?${new URLSearchParams({ preset })}`,
  };
}

function Screenshots({ current, index, onSelect, scene }) {
  const shots = scene.screenshots;

  if (!current) {
    return <div className="gallery-modal__placeholder">[ no thumbnail ]</div>;
  }

  const image = current.video ? (
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
  );
  const linked = current.preset && !scene.linkDisabled;

  return (
    <>
      <figure className="gallery-modal__figure">
        {linked ? (
          <Link
            className="gallery-modal__figure-link"
            to={getPresetLink(scene, current.preset)}
            title={`Open ${scene.label} at "${current.preset}"`}
          >
            {image}
          </Link>
        ) : (
          image
        )}
        {(current.caption || linked) && (
          <figcaption>
            {current.caption}
            {linked && (
              <span className="gallery-modal__preset-tag">
                {current.preset}
              </span>
            )}
          </figcaption>
        )}
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

function PresetLinks({ scene }) {
  if (scene.linkDisabled || !scene.publicPresets.length) return null;

  return (
    <div className="gallery-modal__presets">
      <h3>Presets</h3>
      <ul>
        {scene.publicPresets.map((preset) => (
          <li key={preset}>
            <Link to={getPresetLink(scene, preset)}>{preset}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScenePanel({ close, scene }) {
  const [index, setIndex] = useState(0);
  const current = scene.screenshots[index] ?? scene.screenshots[0];
  const currentPreset = scene.linkDisabled ? null : current?.preset;

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
        <PresetLinks scene={scene} />
        {!scene.linkDisabled && (
          <div className="gallery-modal__links">
            {currentPreset && (
              <Link
                to={getPresetLink(scene, currentPreset)}
                className="gallery-button"
              >
                Open {currentPreset} ↗
              </Link>
            )}
            <Link
              to={scene.path}
              className={
                currentPreset
                  ? 'gallery-button gallery-button--quiet'
                  : 'gallery-button'
              }
            >
              Open the scene ↗
            </Link>
          </div>
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
