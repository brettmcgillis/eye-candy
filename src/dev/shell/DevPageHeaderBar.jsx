import React from 'react';
import { Link } from 'react-router-dom';

import './DevPageHeaderBar.css';
import DevPageTitle from './DevPageTitle';
import './DevPages.css';

function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function DevPageHeaderBar({
  backLabel = 'back to dev',
  backTo = '/dev',
  className = '',
  compact = true,
  eyebrow,
  icon,
  iconButtonLabel,
  level = 'h4',
  onIconClick,
  title,
}) {
  return (
    <header className={classNames('dev-page-header-bar', className)}>
      <Link className="dev-page-header-bar__back" to={backTo}>
        <span aria-hidden="true">←</span> {backLabel}
      </Link>
      <DevPageTitle
        compact={compact}
        eyebrow={eyebrow}
        icon={icon}
        iconButtonLabel={iconButtonLabel}
        level={level}
        onIconClick={onIconClick}
        title={title}
      />
    </header>
  );
}
