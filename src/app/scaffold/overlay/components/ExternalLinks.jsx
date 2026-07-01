/* eslint-disable jsx-a11y/interactive-supports-focus */
import React, { useState } from 'react';
import { FaInstagram, FaLinkedin } from 'react-icons/fa';

export default function ExternalLinks() {
  const [showIcons, setShowIcons] = useState(false);

  return (
    <div className="external-links">
      <span
        className="external-links-name"
        onClick={() => setShowIcons((s) => !s)}
        role="button"
        aria-expanded={showIcons}
      >
        Brett McGillis
      </span>
      <span className={`external-links-icons${showIcons ? ' is-visible' : ''}`}>
        <a
          href="https://www.instagram.com/ruinedpaintings/"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
        >
          <FaInstagram color="#000000" />
        </a>
        <a
          href="https://www.linkedin.com/in/brett-mcgillis-61b93a125/"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
        >
          <FaLinkedin color="#000000" />
        </a>
      </span>
    </div>
  );
}
