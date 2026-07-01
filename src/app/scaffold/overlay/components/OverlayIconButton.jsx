import React from 'react';

export default function OverlayIconButton({
  onClick,
  icon: Icon,
  label,
  active,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className="overlay-icon-button"
    >
      <Icon />
    </button>
  );
}
