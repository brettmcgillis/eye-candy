import getColorsInRange from '@utils/colors';

export function buildRingsConfig(controls) {
  const width = controls.ringsOuterRadius - controls.ringsInnerRadius;

  if (controls.ringsStyle === 'gradient') {
    const gradientColors = getColorsInRange(
      controls.ringsStart,
      controls.ringsEnd,
      controls.ringsSteps
    ).map((value) => ({
      width: width / controls.ringsSteps,
      color: value,
    }));

    return { innerRadius: controls.ringsInnerRadius, rings: gradientColors };
  }

  const colors = [
    { width: controls.ringsLg, color: controls.ringsSilver },
    { width: controls.ringsSm, color: controls.ringsBlack },
    { width: controls.ringsMed, color: controls.ringsWhite },
    { width: controls.ringsXl, color: controls.ringsBlack },
    { width: controls.ringsXl, color: controls.ringsBlue },
    { width: controls.ringsXl, color: controls.ringsLightblue },
    { width: controls.ringsSm, color: controls.ringsBlack },
    { width: controls.ringsLg, color: controls.ringsSilver },
  ];

  const totalWidthRatio = colors.reduce((total, ring) => total + ring.width, 0);
  const rings = colors.map((ring) => ({
    ...ring,
    width: Math.round((ring.width / totalWidthRatio) * width * 100) / 100,
  }));

  return { innerRadius: controls.ringsInnerRadius, rings };
}

export function buildNetworkConfig(controls) {
  return {
    shape: 'ring',
    innerDiameter: 3,
    outerDiameter: 7,
    height: 0.2,
    networkWidth: 7,
    networkHeight: 3,
    networkDepth: 7,
    particleCount: controls.networkParticleCount,
    maxParticleCount: 1000,
    minConnections: 1,
    maxConnections: 8,
    minDistance: 0.2,
    maxDistance: controls.networkMaxDistance,
    pointColor: controls.networkPointColor,
    lineColor: controls.networkLineColor,
    pointSize: controls.networkPointSize,
    pointBlending: 'normal',
    pointsToneMapped: false,
    pointsTransparent: true,
    pointsOpacity: 1,
    lineWidth: 1,
    linesToneMapped: false,
    linesTransparent: true,
    linesOpacity: 1,
    lineBlending: 'normal',
    timeScale: controls.networkTimeScale,
    angularSpeed: controls.networkAngularSpeed,
    radialSpeed: 1,
    verticalSpeed: 1,
    systemRotation: 1,
  };
}
