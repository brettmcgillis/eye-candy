import {
  makeFireAndSmokeFireConfig,
  makeFireAndSmokeSmokeConfig,
} from '../../components/elements/fireAndSmoke/fireAndSmokeDefaults';
import { makeSpline } from '../splineAuthoring';

const DEFAULT_ROTATION = [0, 0, 0];
const DUMPSTER_SMOKE_POSITION = [-1.12, 1.52, -0.08];
const DUMPSTER_FIRE_POSITION = [-0.88, 1.28, 0.08];

const P = (position, scale, rotation = DEFAULT_ROTATION) => ({
  position,
  rotation,
  scale,
});

const DUMPSTER_PLUME_POINTS = [
  P([0, 0, 0], [0.9, 0.9, 0.9]),
  P([0.4, 0.5, 0.05], [1.0, 1.0, 1.0]),
  P([0.9, 1, 0.1], [1.1, 1.1, 1.1]),
  P([1.5, 1.5, 0], [1.25, 1.25, 1.25]),
  P([2.2, 1.9, -0.08], [1.4, 1.4, 1.4]),
  P([3, 2.4, 0.1], [1.55, 1.55, 1.55]),
  P([4, 2.9, -0.05], [1.7, 1.7, 1.7]),
  P([5.2, 3.4, 0.15], [1.9, 1.9, 1.9]),
  P([6.5, 3.9, -0.1], [2.1, 2.1, 2.1]),
  P([8, 4.4, 0], [2.35, 2.35, 2.35]),
];

const DUMPSTER_FIRE = {
  splines: [
    makeSpline({
      name: 'Dumpster Smoke',
      type: 'FireAndSmoke',
      visible: true,
      showHandles: true,
      showSpline: true,
      pointMode: 'translate',
      pos: DUMPSTER_SMOKE_POSITION,
      rot: [0, 0, 0],
      scale: [1, 1, 1],
      ...makeFireAndSmokeSmokeConfig({
        closed: false,
        particleColor: '#555555',
      }),
      points: DUMPSTER_PLUME_POINTS,
    }),
    makeSpline({
      name: 'Dumpster Fire',
      type: 'FireAndSmoke',
      visible: true,
      showHandles: true,
      showSpline: true,
      pointMode: 'translate',
      pos: DUMPSTER_FIRE_POSITION,
      rot: [0, 0, 0],
      scale: [1, 1, 1],
      ...makeFireAndSmokeFireConfig({
        closed: false,
      }),
      points: DUMPSTER_PLUME_POINTS,
    }),
  ],
};

export default DUMPSTER_FIRE;
