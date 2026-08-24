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
  icon = 'turbo_flex.png',
  iconButtonLabel,
  level = 'h1',
  onIconClick,
  title,
}) {
  const HeadingTag = level;
  const iconImage = (
    <img
      className="dev-page-title__icon"
      src={iconFile(icon)}
      alt=""
      aria-hidden="true"
    />
  );

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
          {onIconClick ? (
            <button
              aria-label={iconButtonLabel}
              className="dev-page-title__icon-button"
              onClick={onIconClick}
              type="button"
            >
              {iconImage}
            </button>
          ) : (
            iconImage
          )}
        </span>
      </HeadingTag>
    </div>
  );
}
