import gltfjsxPlugin from './gltfjsx/plugin';
import rorschachPlugin from './rorschach/plugin';

export default function devServerPlugins() {
  return [gltfjsxPlugin(), rorschachPlugin()];
}
