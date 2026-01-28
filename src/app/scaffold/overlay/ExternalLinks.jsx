import React from 'react';
import { FaInstagram, FaLinkedin } from 'react-icons/fa';

export default function ExternalLinks() {
  return (
    <div className="external-links">
      <span>Brett McGillis</span>
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
    </div>
  );
}
