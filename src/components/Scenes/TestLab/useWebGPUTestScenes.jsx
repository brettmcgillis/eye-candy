import NoScene from '../../../app/scaffold/NoScene';
import MobilePhysicsTest from '../MobilePhysicsTest/MobilePhysicsTest';
import NetworkTest from '../NetworkTest/NetworkTest';

const scenes = [
  {
    id: 'noScene',
    label: 'None',
    Component: NoScene,
  },
  {
    id: 'networkTest',
    label: 'Network Test',
    Component: NetworkTest,
  },
  {
    id: 'mobilePhysicsTest',
    label: 'Mobile Physics Test',
    Component: MobilePhysicsTest,
  },
];

function compareScenes(a, b) {
  if (a.id === 'noScene') return -1;
  if (b.id === 'noScene') return 1;

  const aKey = a.label ?? a.id;
  const bKey = b.label ?? b.id;
  return aKey.localeCompare(bKey, undefined, { sensitivity: 'base' });
}

export default function useWebGPUTestScenes() {
  return { scenes: [...scenes].sort(compareScenes) };
}
