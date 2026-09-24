import { folder } from 'leva';

import range from './controlRange';

export default function getLookControls(p) {
  return folder(
    {
      hyphaColor: { label: 'Hypha', value: p.hyphaColor },
      bodyColor: { label: 'Body', value: p.bodyColor },
      metalness: range('Metalness', p.metalness, 0, 1, 0.01),
      roughness: range('Roughness', p.roughness, 0, 1, 0.01),
    },
    { collapsed: true }
  );
}
