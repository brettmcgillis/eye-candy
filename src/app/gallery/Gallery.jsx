import React, { useState } from 'react';

import useDocumentTitle from '../scaffold/hooks/useDocumentTitle';
import { Loader22 } from '../scaffold/loader/loaders';
import './Gallery.css';
import GalleryModal from './GalleryModal';
import SHOWCASE_SCENES from './showcaseScenes';

const HOMEPAGE_URL = 'https://brettmcgillis.github.io/';

export default function Gallery() {
  const [open, setOpen] = useState(null);
  useDocumentTitle(null);

  return (
    <div className="gallery">
      <header className="gallery__header">
        <div className="gallery__brand">
          <div className="gallery__loader" aria-hidden="true">
            <Loader22 />
          </div>
          <div>
            <h1>Eye Candy</h1>
            <p>Digital canvas. Experiments in 3D.</p>
          </div>
        </div>
        <a className="gallery__home" href={HOMEPAGE_URL}>
          Brett McGillis ↗
        </a>
      </header>

      <main className="gallery__main">
        <ul className="gallery__grid">
          {SHOWCASE_SCENES.map((scene, i) => (
            <li key={scene.path}>
              <button
                type="button"
                className="gallery-card"
                aria-haspopup="dialog"
                onClick={() => setOpen(scene)}
              >
                <span className="gallery-card__frame">
                  {scene.thumbnail && (
                    <img
                      src={scene.thumbnail}
                      alt=""
                      loading="lazy"
                      width={640}
                      height={400}
                    />
                  )}
                  <span className="gallery-badge">{scene.channel}</span>
                </span>
                <span className="gallery-card__caption">
                  <span>
                    <span className="gallery-card__n">
                      {String(i + 1).padStart(2, '0')}
                    </span>{' '}
                    {scene.label}
                  </span>
                  <span aria-hidden="true">+</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </main>

      <GalleryModal scene={open} onClose={() => setOpen(null)} />
    </div>
  );
}
