import React, { memo, useEffect, useState } from 'react';

import OverlayPortal from '@app/scaffold/overlay/components/OverlayPortal';

import EraserIcon from '../../components/EraserIcon';
import TimerClock from '../../components/TimerClock';
import useCountdown from '../../hooks/useCountdown';
import { INK_COLORS, inkHex } from '../../utils/palette';
import { BRUSH_WIDTHS } from './rules';

const CONFIRM_MS = 3000;

function saveDrawing(board, paperColor) {
  const out = document.createElement('canvas');
  out.width = board.canvas.width;
  out.height = board.canvas.height;
  const ctx = out.getContext('2d');
  ctx.fillStyle = paperColor;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(board.canvas, 0, 0);
  out.toBlob((blob) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `party-line-${Date.now()}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  });
}

function CollabHud({
  board,
  brush,
  game,
  erasing,
  ink,
  isHost,
  me,
  onBrush,
  onErase,
  onInk,
  paperColor,
  promptSeconds,
  room,
}) {
  const [confirming, setConfirming] = useState(false);
  const [picking, setPicking] = useState(false);
  const promptMs = (promptSeconds ?? 0) * 1000;
  const untilNext = useCountdown(
    room,
    game.promptAt + promptMs,
    Boolean(game.prompt) && promptMs > 0
  );

  useEffect(() => {
    if (!confirming) return undefined;
    const timer = setTimeout(() => setConfirming(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [confirming]);

  const onClear = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    room.dispatch({ type: 'clear' });
  };

  const color = inkHex(ink);
  const pickInk = (index) => {
    onInk(index);
    setPicking(false);
  };

  return (
    <OverlayPortal datasetKey="partyLineGameHud">
      <div className="pl-bottom">
        {game.prompt && (
          <div className="pl-prompt" key={game.promptSeq}>
            <span aria-hidden="true">💡</span> {game.prompt}
            {promptMs > 0 && (
              <TimerClock
                remainingMs={untilNext}
                totalMs={promptMs}
                urgentMs={3000}
              />
            )}
          </div>
        )}
        {me && picking && (
          <div className="pl-card pl-inks">
            {INK_COLORS.map(({ hex, name }, index) => (
              <button
                aria-label={name}
                className={`pl-swatch${ink === index ? ' is-active' : ''}`}
                key={hex}
                onClick={() => pickInk(index)}
                style={{ background: hex }}
                title={name}
                type="button"
              />
            ))}
          </div>
        )}
        {me && (
          <div className="pl-bar">
            <button
              aria-label="Ink colour"
              className={`pl-brush pl-ink${picking || !erasing ? ' is-active' : ''}`}
              onClick={() => {
                if (erasing) onInk(ink);
                setPicking((open) => !open);
              }}
              type="button"
            >
              <span style={{ background: color }} />
            </button>
            <button
              aria-label="Eraser"
              aria-pressed={erasing}
              className={`pl-brush pl-eraser${erasing ? ' is-active' : ''}`}
              onClick={() => {
                setPicking(false);
                onErase(!erasing);
              }}
              type="button"
            >
              <EraserIcon />
            </button>
            {BRUSH_WIDTHS.map((width, index) => (
              <button
                aria-label={`Brush ${index + 1}`}
                className={`pl-brush${brush === index ? ' is-active' : ''}`}
                key={width}
                onClick={() => onBrush(index)}
                type="button"
              >
                <span
                  style={{
                    background: color,
                    height: 6 + index * 8,
                    width: 6 + index * 8,
                  }}
                />
              </button>
            ))}
            {isHost && (
              <>
                <button
                  className="pl-button"
                  onClick={() => room.dispatch({ type: 'prompt' })}
                  type="button"
                >
                  New idea
                </button>
                <button
                  className={`pl-button${confirming ? ' is-warning' : ''}`}
                  onClick={onClear}
                  type="button"
                >
                  {confirming ? 'Sure?' : 'Clear'}
                </button>
              </>
            )}
            <button
              className="pl-button"
              onClick={() => saveDrawing(board, paperColor)}
              type="button"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </OverlayPortal>
  );
}

export default memo(CollabHud);
