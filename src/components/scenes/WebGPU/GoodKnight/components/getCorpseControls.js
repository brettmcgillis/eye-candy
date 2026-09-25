import { button, folder } from 'leva';

import { localEnv } from '@utils/appUtils';

import { POSE_OPTIONS } from '../presets/poses';

export default function getCorpseControls(p, apiRef) {
  return folder(
    {
      pose: { label: 'Pose', options: POSE_OPTIONS, value: p.pose ?? 'fallen' },
      'Reset Corpse': button(() => apiRef.current?.reset()),
      'Drop Live': button(() => apiRef.current?.drop()),
      ...(localEnv() && {
        'Copy Pose': button(() => {
          const bodies = apiRef.current?.capture();
          if (bodies) navigator.clipboard.writeText(JSON.stringify(bodies));
        }),
      }),
      ragdollDamping: {
        label: 'Limb Damping',
        value: p.ragdollDamping ?? 1.6,
        min: 0,
        max: 4,
        step: 0.05,
      },
      ragdollLinearDamping: {
        label: 'Body Damping',
        value: p.ragdollLinearDamping ?? 0.6,
        min: 0,
        max: 4,
        step: 0.05,
      },
      grabFollow: {
        label: 'Grab Follow',
        value: p.grabFollow ?? 0.18,
        min: 0.02,
        max: 1,
        step: 0.01,
      },
      ragdollFriction: {
        label: 'Friction',
        value: p.ragdollFriction ?? 1.3,
        min: 0,
        max: 2,
        step: 0.05,
      },
      physicsDebug: { label: 'Show Colliders', value: p.physicsDebug ?? false },
    },
    { collapsed: true }
  );
}
