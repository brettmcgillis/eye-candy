import apollianPlugin from './apollian/plugin';
import blockPartyPlugin from './blockParty/plugin';
import brutalistPlugin from './brutalist/plugin';
import cataloggrPlugin from './cataloggr/plugin';
import darkroomPlugin from './darkroom/plugin';
import floraPlugin from './flora/plugin';
import fungiPlugin from './fungi/plugin';
import gltfjsxPlugin from './gltfjsx/plugin';
import glyphsPlugin from './glyphs/plugin';
import hyperCubesPlugin from './hyperCubes/plugin';
import inventoryPlugin from './inventory/plugin';
import isoLinesPlugin from './isoLines/plugin';
import isoLinesReliefPlugin from './isoLinesRelief/plugin';
import kumikoPlugin from './kumiko/plugin';
import nestingBoxesPlugin from './nestingBoxes/plugin';
import networkTestPlugin from './networkTest/plugin';
import pushComesToShovePlugin from './pushComesToShove/plugin';
import rorschachPlugin from './rorschach/plugin';
import rugPullPlugin from './rugPull/plugin';
import subdivisionPlugin from './subdivision/plugin';
import trucheteriePlugin from './trucheterie/plugin';

export default function devServerPlugins() {
  return [
    apollianPlugin(),
    blockPartyPlugin(),
    brutalistPlugin(),
    cataloggrPlugin(),
    darkroomPlugin(),
    floraPlugin(),
    fungiPlugin(),
    glyphsPlugin(),
    gltfjsxPlugin(),
    hyperCubesPlugin(),
    inventoryPlugin(),
    isoLinesPlugin(),
    isoLinesReliefPlugin(),
    kumikoPlugin(),
    nestingBoxesPlugin(),
    networkTestPlugin(),
    pushComesToShovePlugin(),
    rorschachPlugin(),
    rugPullPlugin(),
    subdivisionPlugin(),
    trucheteriePlugin(),
  ];
}
