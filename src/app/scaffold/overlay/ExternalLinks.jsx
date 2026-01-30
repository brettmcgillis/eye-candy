import React from 'react';
import { FaInstagram, FaLinkedin } from 'react-icons/fa';

import { isLocalHost } from '../../../utils/appUtils';

function getLocalTestFlag() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('localTest') === 'true';
}

export default function ExternalLinks() {
  const localHost = isLocalHost();

  const localTest = getLocalTestFlag();
  return (
    <div className="external-links">
      <span>Brett McGillis</span>
      {(!localHost || localTest) && (
        <>
          <a
            href="https://www.instagram.com/ruinedpaintings/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <FaInstagram size={16} color="#000000" />
          </a>
          <a
            href="https://www.linkedin.com/in/brett-mcgillis-61b93a125/"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
          >
            <FaLinkedin size={16} color="#000000" />
          </a>
        </>
      )}
    </div>
  );
}
