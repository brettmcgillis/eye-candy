import React from 'react';
import { FaInstagram, FaLinkedin } from 'react-icons/fa';

import { localEnv } from '../../../../utils/appUtils';

export default function ExternalLinks() {
  const local = localEnv();

  return (
    <div className="external-links">
      <span>Brett McGillis</span>
      {!local && (
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
