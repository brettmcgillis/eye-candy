// The agent lives in the fractal's own coordinates — the clearances it steers
// by were measured there — while everything drawn lives in world space. The
// distance field maps one to the other as `q = pivot + p / worldScale`.
export function toWorld(fractalPoint, pivot, worldScale, out) {
  return out.copy(fractalPoint).sub(pivot).multiplyScalar(worldScale);
}

export function toFractal(worldPoint, pivot, worldScale, out) {
  return out.copy(worldPoint).divideScalar(worldScale).add(pivot);
}

export function fieldParams(config) {
  return {
    confine: config.confine,
    folds: config.folds,
    periodXZ: config.periodXZ,
    periodY: config.periodY,
    scaleBase: config.scaleBase,
    scaleGain: config.scaleGain,
    twist: config.twist,
  };
}

export function agentParams(config) {
  return {
    accel: config.accel,
    altitude: config.altitude,
    altitudeBand: config.altitudeBand,
    altitudeHold: config.altitudeHold,
    avoidance: config.avoidance,
    bounceDamping: config.bounceDamping,
    comfort: config.comfort,
    cruiseMax: config.cruiseMax,
    cruiseMin: config.cruiseMin,
    cruiseSpeed: config.cruiseSpeed,
    field: fieldParams(config),
    hugDistance: config.hugDistance,
    hugStrength: config.hugStrength,
    leash: config.leash,
    leashStrength: config.leashStrength,
    levelFlight: config.levelFlight,
    margin: config.margin,
    opennessBias: config.opennessBias,
    peerMax: config.peerMax,
    peerMin: config.peerMin,
    peerSpeed: config.peerSpeed,
    probeRange: config.probeRange,
    radius: config.agentRadius,
    stepSafety: config.stepSafety,
    turnRate: config.turnRate,
    wander: config.wander,
  };
}
