import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { FaMicrophoneLines, FaMicrophoneLinesSlash } from 'react-icons/fa6';
import { LuScreenShare, LuScreenShareOff } from 'react-icons/lu';

function isMobileDevice() {
  return /iP(hone|ad|od)|Android/.test(navigator.userAgent);
}

const BUTTON_STYLE = {
  cursor: 'crosshair',
  background: 'transparent',
  border: 0,
  padding: 0,
  color: 'inherit',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

function OverlayButton({ onClick, Icon, label, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      style={BUTTON_STYLE}
    >
      <Icon />
    </button>
  );
}

function AudioControls({ sourceMode, onMicClick, onScreenShareClick }) {
  const micActive = sourceMode === 'mic';
  const shareActive = sourceMode === 'system';
  const mobile = isMobileDevice();

  return (
    <div
      className="bottom-center overlay-panel"
      style={{
        cursor: 'crosshair',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
      }}
    >
      <OverlayButton
        onClick={onMicClick}
        Icon={micActive ? FaMicrophoneLines : FaMicrophoneLinesSlash}
        label={micActive ? 'Stop microphone' : 'Use microphone'}
        active={micActive}
      />
      {!mobile && (
        <OverlayButton
          onClick={onScreenShareClick}
          Icon={shareActive ? LuScreenShare : LuScreenShareOff}
          label={
            shareActive ? 'Stop screenshare audio' : 'Use screenshare audio'
          }
          active={shareActive}
        />
      )}
    </div>
  );
}

export default function HorsesForCoursesOverlay({
  sourceMode,
  onMicClick,
  onScreenShareClick,
}) {
  const rootRef = useRef(null);
  const propsRef = useRef({ sourceMode, onMicClick, onScreenShareClick });
  propsRef.current = { sourceMode, onMicClick, onScreenShareClick };

  useEffect(() => {
    const container = document.createElement('div');
    container.dataset.horsesForCoursesOverlayPortal = 'true';
    const mountTarget = document.querySelector('.overlay') ?? document.body;
    mountTarget.appendChild(container);

    function render() {
      const {
        sourceMode: sm,
        onMicClick: omc,
        onScreenShareClick: ossc,
      } = propsRef.current;
      rootRef.current?.render(
        <AudioControls
          sourceMode={sm}
          onMicClick={omc}
          onScreenShareClick={ossc}
        />
      );
    }

    rootRef.current = createRoot(container);
    render();

    return () => {
      rootRef.current?.unmount();
      rootRef.current = null;
      if (container.parentNode) container.parentNode.removeChild(container);
    };
  }, []);

  useEffect(() => {
    if (!rootRef.current) return;
    rootRef.current.render(
      <AudioControls
        sourceMode={sourceMode}
        onMicClick={onMicClick}
        onScreenShareClick={onScreenShareClick}
      />
    );
  }, [sourceMode, onMicClick, onScreenShareClick]);

  return null;
}
