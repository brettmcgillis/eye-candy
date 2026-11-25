/* eslint-disable jsx-a11y/interactive-supports-focus */
import React, { useState } from 'react';
import { FaInstagram, FaLinkedin } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

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
          href="https://x.com/ruinedpaintings"
          target="_blank"
          rel="noreferrer"
          aria-label="X"
        >
          <FaXTwitter color="#000000" />
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
