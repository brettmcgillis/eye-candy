import apollianPlugin from './apollian/plugin';
import birdsArentRealPlugin from './birdsArentReal/plugin';
import blockPartyPlugin from './blockParty/plugin';
import brutalistPlugin from './brutalist/plugin';
import cataloggrPlugin from './cataloggr/plugin';
import darkroomPlugin from './darkroom/plugin';
import dumpsterFirePlugin from './dumpsterFire/plugin';
import exhibitAPlugin from './exhibitA/plugin';
import floraPlugin from './flora/plugin';
import fractalAutomataPlugin from './fractalAutomata/plugin';
import fungiPlugin from './fungi/plugin';
import ghostBusterPlugin from './ghostBuster/plugin';
import gltfjsxPlugin from './gltfjsx/plugin';
import glyphsPlugin from './glyphs/plugin';
import hyperCubesPlugin from './hyperCubes/plugin';
import imperfectionPlugin from './imperfection/plugin';
import inventoryPlugin from './inventory/plugin';
import isoLinesPlugin from './isoLines/plugin';
import isoLinesReliefPlugin from './isoLinesRelief/plugin';
import isoMeterPlugin from './isoMeter/plugin';
import kumikoPlugin from './kumiko/plugin';
import nestingBoxesPlugin from './nestingBoxes/plugin';
import networkTestPlugin from './networkTest/plugin';
import plotterizerPlugin from './plotterizer/plugin';
import printShopPlugin from './printShop/plugin';
import pushComesToShovePlugin from './pushComesToShove/plugin';
import rorschachPlugin from './rorschach/plugin';
import rugPullPlugin from './rugPull/plugin';
import subdivisionPlugin from './subdivision/plugin';
import subdivisionReliefPlugin from './subdivisionRelief/plugin';
import thumbnailsPlugin from './thumbnails/plugin';
import trucheterie3dPlugin from './trucheterie3d/plugin';
import trucheteriePlugin from './trucheterie/plugin';
import trucheterieDesignerPlugin from './trucheterieDesigner/plugin';

export default function devServerPlugins() {
  return [
    apollianPlugin(),
    birdsArentRealPlugin(),
    blockPartyPlugin(),
    brutalistPlugin(),
    cataloggrPlugin(),
    darkroomPlugin(),
    dumpsterFirePlugin(),
    exhibitAPlugin(),
    floraPlugin(),
    fractalAutomataPlugin(),
    fungiPlugin(),
    ghostBusterPlugin(),
    glyphsPlugin(),
    gltfjsxPlugin(),
    hyperCubesPlugin(),
    imperfectionPlugin(),
    inventoryPlugin(),
    isoLinesPlugin(),
    isoLinesReliefPlugin(),
    isoMeterPlugin(),
    kumikoPlugin(),
    nestingBoxesPlugin(),
    networkTestPlugin(),
    plotterizerPlugin(),
    printShopPlugin(),
    pushComesToShovePlugin(),
    rorschachPlugin(),
    rugPullPlugin(),
    subdivisionPlugin(),
    subdivisionReliefPlugin(),
    trucheteriePlugin(),
    trucheterie3dPlugin(),
    trucheterieDesignerPlugin(),
    thumbnailsPlugin(),
  ];
}
