import React from 'react';

import { iconFile } from '@utils/appUtils';

import './DevPageTitle.css';

function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function DevPageTitle({
  className = '',
  compact = false,
  eyebrow,
  level = 'h1',
  title,
}) {
  const HeadingTag = level;

  return (
    <div
      className={classNames(
        'dev-page-title',
        compact && 'dev-page-title--compact',
        className
      )}
    >
      {eyebrow ? <p className="dev-page-title__eyebrow">{eyebrow}</p> : null}
      <HeadingTag className="dev-page-title__heading">
        <span className="dev-page-title__row">
          <span>{title}</span>
          <img
            className="dev-page-title__icon"
            src={iconFile('turbo_flex.png')}
            alt=""
            aria-hidden="true"
          />
        </span>
      </HeadingTag>
    </div>
  );
}
