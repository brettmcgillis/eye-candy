import getGlitchControls from './src/components/scenes/WebGPU/GetWrecked/components/getGlitchControls.js';
import getPostEffectsControls from './src/components/scenes/WebGPU/GetWrecked/components/getPostEffectsControls.js';
import { PRESETS as NOW } from './src/components/scenes/WebGPU/GetWrecked/presets/presets.js';

import { PRESETS as OLD } from '/tmp/orig_presets.mjs';

const now = NOW.Pristine;
// technique -> its own keys, straight from the Leva folder structure
const folders = {};
const walk = (node, label) => {
  const schema = node?.schema ?? node;
  for (const [k, v] of Object.entries(schema ?? {})) {
    const isFolder =
      v && typeof v === 'object' && (v.schema || v.type === 'FOLDER');
    if (isFolder) walk(v, k);
    else if (label) (folders[label] ??= {})[k] = v;
  }
};
walk(getGlitchControls(now, () => {}));
walk(getPostEffectsControls(now));
// old preset name for each folder ('Vertical Hold' was the scroll-tear one)
const ALIAS = { 'Scroll Tear': 'Vertical Hold' };
for (const [label, ctrls] of Object.entries(folders)) {
  const oldName = ALIAS[label] ?? label;
  const old = OLD[oldName];
  if (!old) {
    console.log(
      `\n${label}: no pre-session preset (new technique) — keeping current`
    );
    continue;
  }
  const diffs = [];
  for (const [k, c] of Object.entries(ctrls)) {
    if (/Enabled$/.test(k)) continue;
    if (!(k in old)) {
      diffs.push(`  ${k}: (absent then) now ${JSON.stringify(now[k])}`);
      continue;
    }
    if (JSON.stringify(old[k]) === JSON.stringify(now[k])) continue;
    const bad =
      typeof c?.min === 'number' && (old[k] < c.min || old[k] > c.max);
    diffs.push(
      `  ${k}: was ${JSON.stringify(old[k])} -> now ${JSON.stringify(now[k])}${bad ? '   [OUT OF CURRENT RANGE]' : ''}`
    );
  }
  console.log(`\n${label}  (from "${oldName}")`);
  console.log(diffs.length ? diffs.join('\n') : '  identical');
}
