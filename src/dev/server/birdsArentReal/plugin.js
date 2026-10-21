// Relative, not `@modules/birdsArentReal`: this runs inside Vite's config
// loader, which resolves no aliases.
import {
  RENDER_OPTIONS,
  normalizeOptions,
} from '../../../modules/birdsArentReal/renderOptions.mjs';
import liveCaptureRoute from '../renderJobs/liveCapture';
import createRenderJobPlugin from '../renderJobs/plugin';
import { createSchemaJobService } from '../renderJobs/schemaTool';

const SLUG = 'birds-arent-real';

export default function birdsArentRealDevPlugin() {
  const service = createSchemaJobService({
    normalizeOptions,
    options: RENDER_OPTIONS,
    slug: SLUG,
    tool: 'birdsArentReal',
  });
  return createRenderJobPlugin({
    routes: [liveCaptureRoute({ service, slug: SLUG })],
    service,
    tool: 'birdsArentReal',
  });
}
