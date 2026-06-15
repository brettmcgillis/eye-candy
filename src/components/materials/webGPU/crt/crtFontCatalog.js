import { fontFile } from '../../../../utils/appUtils';

export const CRT_MSDF_TEXTURE_SIZE = [1024, 1024];
export const CRT_MSDF_FONT_SIZE = 64;
export const CRT_MSDF_FIELD_RANGE = 4;
export const CRT_MSDF_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
  ' .,!?;:\\/:()[]{}<>+-=_*#%$@&|~`"\'' +
  '\n\r\t' +
  '░▒▓█▄▀■□◼◻';

const FONT_SOURCES = {
  'Press Start 2P': fontFile('PressStart2P-Regular.ttf'),
  VT323: fontFile('VT323-Regular.ttf'),
  Orbitron: fontFile('Orbitron-wght.ttf'),
  'Roboto Mono': fontFile('RobotoMono-wght.ttf'),
  Roboto: fontFile('Roboto-wdth-wght.ttf'),
  'Muro Slant': fontFile('Muroslant.ttf'),
};

const FONT_ALIASES = {
  'Arial Black': 'Roboto',
  Arial: 'Roboto',
  Verdana: 'Roboto',
  Tahoma: 'Roboto',
  'Trebuchet MS': 'Roboto',
  Impact: 'Roboto',
  'Courier New': 'Roboto Mono',
  'Lucida Console': 'Roboto Mono',
  Monaco: 'Roboto Mono',
  Consolas: 'Roboto Mono',
  Menlo: 'Roboto Mono',
  monospace: 'Roboto Mono',
  'sans-serif': 'Roboto',
  serif: 'Roboto',
  terminal: 'Roboto Mono',
};

export function resolveCrtFontName(fontName) {
  return FONT_ALIASES[fontName] || fontName || 'Roboto Mono';
}

export function resolveCrtFontSource(fontName) {
  const normalizedFontName = resolveCrtFontName(fontName);
  return FONT_SOURCES[normalizedFontName] || FONT_SOURCES['Roboto Mono'];
}
