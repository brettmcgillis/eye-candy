// Relative, not `@modules/ghostBuster`: this runs inside Vite's config
// loader, which resolves no aliases.
import {
  RENDER_OPTIONS,
  normalizeOptions,
} from '../../../modules/ghostBuster/renderOptions.mjs';
import liveCaptureRoute from '../renderJobs/liveCapture';
import createRenderJobPlugin from '../renderJobs/plugin';
import { createSchemaJobService } from '../renderJobs/schemaTool';

const SLUG = 'ghost-buster';

export default function ghostBusterDevPlugin() {
  const service = createSchemaJobService({
    normalizeOptions,
    options: RENDER_OPTIONS,
    slug: SLUG,
    tool: 'ghostBuster',
  });
  return createRenderJobPlugin({
    routes: [liveCaptureRoute({ service, slug: SLUG })],
    service,
    tool: 'ghostBuster',
  });
}
