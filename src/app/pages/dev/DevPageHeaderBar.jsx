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
  level = 'h4',
  title,
}) {
  return (
    <header className={classNames('dev-page-header-bar', className)}>
      <DevPageTitle
        compact={compact}
        eyebrow={eyebrow}
        level={level}
        title={title}
      />
      <Link className="dev-page-header-bar__back" to={backTo}>
        <span aria-hidden="true">←</span> {backLabel}
      </Link>
    </header>
  );
}
