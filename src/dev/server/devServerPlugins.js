import cataloggrPlugin from './cataloggr/plugin';
import gltfjsxPlugin from './gltfjsx/plugin';
import rorschachPlugin from './rorschach/plugin';

export default function devServerPlugins() {
  return [cataloggrPlugin(), gltfjsxPlugin(), rorschachPlugin()];
}
