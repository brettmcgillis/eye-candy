import React, { memo } from 'react';

import useFullscreen, {
  fullscreenSupported,
  isAppleMobile,
  isStandaloneApp,
} from '../hooks/useFullscreen';
import { PRESET_GAMES } from '../presets/games';
import { ROOM_SETTINGS, SETTINGS_BY_PRESET } from '../utils/roomSettings';

function SettingRow({ disabled, onChange, settingKey, value }) {
  const { format, label, options } = ROOM_SETTINGS[settingKey];
  return (
    <div className="pl-setting">
      <span>{label}</span>
      <div className="pl-choices">
        {options.map((option) => (
          <button
            className={`pl-choice${option === value ? ' is-active' : ''}`}
            disabled={disabled}
            key={option}
            onClick={() => onChange(settingKey, option)}
            type="button"
          >
            {format(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScreenSettings() {
  const fullscreen = useFullscreen();
  const standalone = isStandaloneApp();
  const canFullscreen = fullscreenSupported() && !standalone;
  const showInstallHint = isAppleMobile() && !standalone;
  if (!canFullscreen && !showInstallHint) return null;
  return (
    <section className="pl-settings-group">
      <div className="pl-setting">
        <span>Screen</span>
        {canFullscreen && (
          <div className="pl-choices">
            <button
              className={`pl-choice${fullscreen.active ? ' is-active' : ''}`}
              onClick={fullscreen.toggle}
              type="button"
            >
              {fullscreen.active ? 'Exit full screen' : '⛶ Full screen'}
            </button>
          </div>
        )}
        {showInstallHint && (
          <p className="pl-note pl-install">
            For full screen on iPhone: tap Share, then{' '}
            <strong>Add to Home Screen</strong>. It opens straight into this
            room.
          </p>
        )}
      </div>
    </section>
  );
}

function SettingsModal({ hostName, isHost, meta, onClose, room }) {
  const settings = meta?.settings ?? {};
  const change = (key, value) =>
    room.dispatch({ patch: { [key]: value }, type: 'settings' });

  return (
    <div className="pl-modal" onClick={onClose} role="presentation">
      <div
        className="pl-card pl-settings"
        onClick={(event) => event.stopPropagation()}
        role="presentation"
      >
        <div className="pl-settings-head">
          <h2>Settings</h2>
          <button
            aria-label="Close settings"
            className="pl-icon-button"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {!isHost && (
          <p className="pl-note">
            Only {hostName ?? 'the host'} can change these.
          </p>
        )}

        <div className="pl-setting">
          <span>Game</span>
          <div className="pl-choices">
            {Object.entries(PRESET_GAMES).map(([preset, game]) => (
              <button
                className={`pl-choice${meta?.preset === preset ? ' is-active' : ''}`}
                disabled={!isHost}
                key={preset}
                onClick={() => room.dispatch({ preset, type: 'preset' })}
                type="button"
              >
                {game.emoji} {game.label}
              </button>
            ))}
          </div>
        </div>

        {meta?.preset && SETTINGS_BY_PRESET[meta.preset] && (
          <section className="pl-settings-group">
            {SETTINGS_BY_PRESET[meta.preset].map((key) => (
              <SettingRow
                disabled={!isHost}
                key={key}
                onChange={change}
                settingKey={key}
                value={settings[key]}
              />
            ))}
          </section>
        )}

        <ScreenSettings />
      </div>
    </div>
  );
}

export default memo(SettingsModal);
