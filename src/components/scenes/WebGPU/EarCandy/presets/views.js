import AutomataView from '../components/Automata/AutomataView';
import LightplayView from '../components/Lightplay/LightplayView';
import PachinkoView from '../components/Pachinko/PachinkoView';
import PendulumsView from '../components/Pendulums/PendulumsView';
import RingsView from '../components/Rings/RingsView';
import RipplesView from '../components/Ripples/RipplesView';
import { DEFAULT_PRESET } from './presets';

export const TECHNIQUES = {
  automata: AutomataView,
  lightplay: LightplayView,
  pachinko: PachinkoView,
  pendulums: PendulumsView,
  rings: RingsView,
  ripples: RipplesView,
};

export const PRESET_TECHNIQUE = {
  'Garden Of Seeds': 'automata',
  'Glass Marimba': 'pachinko',
  'Pendulum Wave': 'pendulums',
  'Polyrhythm Rings': 'rings',
  Automata: 'automata',
  Lightplay: 'lightplay',
  Pachinko: 'pachinko',
  Ripples: 'ripples',
};

export function getTechnique(presetName) {
  return PRESET_TECHNIQUE[presetName] || PRESET_TECHNIQUE[DEFAULT_PRESET];
}

export function getPresetView(presetName) {
  return TECHNIQUES[getTechnique(presetName)];
}
