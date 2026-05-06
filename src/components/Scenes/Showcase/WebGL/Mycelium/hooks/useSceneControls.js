import { folder, useControls } from 'leva';

import { CLOUD_A_DEFAULTS, CLOUD_B_DEFAULTS } from '../utils/defaults';
import getMyceliumFolder from './useMyceliumControls';

export default function useSceneControls() {
  const scene = useControls(
    'Mycelium',
    {
      Environment: folder(
        {
          background: { label: 'Background', value: '#000000' },
          autoRotate: { label: 'Auto Rotate', value: true },
          autoRotateSpeed: {
            label: 'Rotate Speed',
            value: 0.4,
            min: -5,
            max: 5,
            step: 0.1,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );

  const [cloudA, setCloudA] = useControls('Mycelium', () => ({
    Hyphae: getMyceliumFolder(CLOUD_A_DEFAULTS),
  }));

  const [cloudB, setCloudB] = useControls('Mycelium', () => ({
    Physarum: getMyceliumFolder(CLOUD_B_DEFAULTS),
  }));

  return { scene, cloudA, setCloudA, cloudB, setCloudB };
}
