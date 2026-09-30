import blockPartyPlugin from './blockParty/plugin';
import cataloggrPlugin from './cataloggr/plugin';
import floraPlugin from './flora/plugin';
import fungiPlugin from './fungi/plugin';
import gltfjsxPlugin from './gltfjsx/plugin';
import glyphsPlugin from './glyphs/plugin';
import hyperCubesPlugin from './hyperCubes/plugin';
import kumikoPlugin from './kumiko/plugin';
import nestingBoxesPlugin from './nestingBoxes/plugin';
import rorschachPlugin from './rorschach/plugin';
import subdivisionPlugin from './subdivision/plugin';
import trucheteriePlugin from './trucheterie/plugin';

export default function devServerPlugins() {
  return [
    blockPartyPlugin(),
    cataloggrPlugin(),
    floraPlugin(),
    fungiPlugin(),
    glyphsPlugin(),
    gltfjsxPlugin(),
    hyperCubesPlugin(),
    kumikoPlugin(),
    nestingBoxesPlugin(),
    rorschachPlugin(),
    subdivisionPlugin(),
    trucheteriePlugin(),
  ];
}
