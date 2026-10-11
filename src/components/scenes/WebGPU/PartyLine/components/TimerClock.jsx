import React, { memo } from 'react';

const R = 10;

function wedge(fraction) {
  if (fraction >= 0.999) return null;
  const angle = fraction * Math.PI * 2;
  const x = 12 + R * Math.sin(angle);
  const y = 12 - R * Math.cos(angle);
  const large = fraction > 0.5 ? 1 : 0;
  return `M12 12 L12 ${12 - R} A${R} ${R} 0 ${large} 1 ${x} ${y} Z`;
}

function TimerClock({ className = '', remainingMs, totalMs, urgentMs = 5000 }) {
  const fraction = totalMs > 0 ? Math.min(1, remainingMs / totalMs) : 0;
  const path = wedge(fraction);
  const urgent = remainingMs <= urgentMs;
  return (
    <span className={`pl-clock${urgent ? ' is-urgent' : ''} ${className}`}>
      <svg aria-hidden="true" height="22" viewBox="0 0 24 24" width="22">
        <circle className="pl-clock-face" cx="12" cy="12" r={R} />
        {path ? (
          <path className="pl-clock-time" d={path} />
        ) : (
          <circle className="pl-clock-time" cx="12" cy="12" r={R} />
        )}
        <circle className="pl-clock-rim" cx="12" cy="12" r={R} />
      </svg>
      {Math.ceil(remainingMs / 1000)}
    </span>
  );
}

export default memo(TimerClock);
