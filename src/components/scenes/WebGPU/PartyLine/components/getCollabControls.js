import { folder } from 'leva';

export default function getCollabControls(p, render) {
  return folder(
    {
      collabPromptSeconds: {
        label: 'Prompt Every (s)',
        max: 180,
        min: 0,
        step: 5,
        value: p.collabPromptSeconds,
      },
      collabResolution: {
        label: 'Canvas Resolution',
        options: [1024, 1536, 2048],
        value: p.collabResolution,
      },
    },
    { collapsed: true, render }
  );
}
