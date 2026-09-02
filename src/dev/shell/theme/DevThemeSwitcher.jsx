import React from 'react';

import { useDevTheme } from './DevThemeContext';
import './DevThemeSwitcher.css';

export default function DevThemeSwitcher() {
  const { setTheme, themeId, themeOptions } = useDevTheme();
  const builtIn = themeOptions.filter((option) => option.colors === null);
  const palettes = themeOptions.filter((option) => option.colors !== null);

  return (
    <select
      aria-label="Dev page theme"
      className="dev-theme-switcher"
      onChange={(event) => setTheme(event.target.value)}
      value={themeId}
    >
      <optgroup label="Built-in">
        {builtIn.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </optgroup>
      {palettes.length ? (
        <optgroup label="Gradients & Palettes">
          {palettes.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </optgroup>
      ) : null}
    </select>
  );
}
