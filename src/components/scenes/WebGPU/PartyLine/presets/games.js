import CollabGame from '../games/collab/CollabGame';
import CompeteGame from '../games/compete/CompeteGame';
import { DEFAULT_PRESET } from './presets';

export const PRESET_GAMES = {
  ScribbleTogether: {
    Component: CollabGame,
    emoji: '🖍️',
    label: 'Together',
  },
  ScribbleBattle: {
    Component: CompeteGame,
    emoji: '🏁',
    label: 'Battle',
  },
};

export function getPresetGame(presetName) {
  return PRESET_GAMES[presetName] || PRESET_GAMES[DEFAULT_PRESET];
}
