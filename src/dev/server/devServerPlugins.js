import cataloggrPlugin from './cataloggr/plugin';
import floraPlugin from './flora/plugin';
import gltfjsxPlugin from './gltfjsx/plugin';
import glyphsPlugin from './glyphs/plugin';
import rorschachPlugin from './rorschach/plugin';

export default function devServerPlugins() {
  return [
    cataloggrPlugin(),
    floraPlugin(),
    glyphsPlugin(),
    gltfjsxPlugin(),
    rorschachPlugin(),
  ];
}
