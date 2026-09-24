import { folder } from 'leva';

import range from './controlRange';

export default function getDifferentialControls(p) {
  return folder(
    {
      dgSeed: range('Seed', p.dgSeed, 0, 999999, 1),
      dgSimSpeed: range('Simulation Rate', p.dgSimSpeed, 0.02, 3, 0.01),
      dgGrowthStep: range('Growth Step', p.dgGrowthStep, 0.05, 2, 0.01),
      dgSeedInfluence: range('Seed Influence', p.dgSeedInfluence, 0, 1, 0.01),
      dgEdgeLength: range('Edge Length', p.dgEdgeLength, 0.01, 0.1, 0.001),
      dgSplitThreshold: range(
        'Split Threshold',
        p.dgSplitThreshold,
        1.1,
        2.5,
        0.01
      ),
      dgRepulsion: range('Repulsion', p.dgRepulsion, 0, 1, 0.01),
      dgShapeRetention: range(
        'Shape Retention',
        p.dgShapeRetention,
        0,
        0.5,
        0.01
      ),
      dgMaxVertices: range('Max Vertices', p.dgMaxVertices, 2000, 40000, 1000),
      dgSmoothing: range('Smoothing', p.dgSmoothing, 0, 1, 0.01),
      dgSideBias: range('Side Bias', p.dgSideBias, -100, 100, 1),
      dgTubeRadius: range('Tube Radius', p.dgTubeRadius, 0.002, 0.05, 0.001),
      dgGradientStart: { label: 'Gradient Start', value: p.dgGradientStart },
      dgGradientEnd: { label: 'Gradient End', value: p.dgGradientEnd },
      dgCurvatureContrast: range(
        'Curvature Contrast',
        p.dgCurvatureContrast,
        0.2,
        3,
        0.01
      ),
      dgCurvatureBias: range('Curvature Bias', p.dgCurvatureBias, -1, 1, 0.01),
      dgGradientBlur: range('Gradient Blur', p.dgGradientBlur, 0, 1, 0.01),
      dgFresnel: range('Fresnel', p.dgFresnel, 0, 2, 0.01),
      dgSpecular: range('Specular', p.dgSpecular, 0, 2, 0.01),
    },
    { collapsed: true }
  );
}
