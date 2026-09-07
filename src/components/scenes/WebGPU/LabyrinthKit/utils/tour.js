const TAU = Math.PI * 2;

// The whole descent laid out on one axis of travel: through the threshold,
// down the corridor, into the great room, around the shaft, onto the floor.
// Every stage's placement is derived here so the static and moving previews
// cannot disagree about where anything is.
export function buildTour(config) {
  const wallThickness = config.bulkheadThickness;
  const archRise = config.corridorHeight * config.archRatio;
  const wallRadius = config.voidRadius + config.stairWidth;
  const arcPerStep = TAU / config.stepsPerTurn;
  const spanArc = config.stepCount * arcPerStep;
  const riseRun = config.stepCount * config.riser;
  const landingDrop = riseRun + config.riser;

  // The helix is snapped to close after a whole number of flights. That is what
  // makes an endless middle section possible: translating down one flight and
  // rotating by one flight arc maps the staircase exactly onto itself, so a
  // moving section can screw along it and its joins with the fixed sections
  // above and below never move.
  const nominalFlightArc = spanArc + config.landingArc * TAU;
  const flightsPerTurn = Math.max(2, Math.round(TAU / nominalFlightArc));
  const flightArc = TAU / flightsPerTurn;
  const landingArc = Math.max(arcPerStep * 2, flightArc - spanArc);

  // Corridor: fixed run, endless run, fixed run.
  const fixedLength = config.segmentLength * config.tourFixedSegments;
  const movingLength = config.segmentLength * config.tourMovingSegments;
  const roomSize = config.mouthRoomSize;
  const roomPlane = -roomSize * 0.5;
  const corridorTotal = fixedLength * 2 + movingLength;
  const corridorStart = roomPlane - wallThickness - corridorTotal;
  const thresholdX = corridorStart - wallThickness;
  const movingStart = corridorStart + fixedLength;
  const exitStart = movingStart + movingLength;

  // Shaft: fixed flights under the great room, endless flights, fixed flights
  // onto the floor. The moving count is a multiple of a full turn so the wrap
  // needs no rotation correction.
  const fixedTopFlights = config.tourFixedFlights;
  const movingFlights =
    Math.max(1, Math.round(config.tourMovingFlights / flightsPerTurn)) *
    flightsPerTurn;
  const fixedBottomFlights = config.tourFixedFlights;
  const totalFlights = fixedTopFlights + movingFlights + fixedBottomFlights;
  const floorY = -totalFlights * landingDrop - config.riser;

  const revolutionDrop = (TAU / flightArc) * landingDrop;
  const panelHalf = revolutionDrop * 0.6;
  const landingAzimuth = (totalFlights - 1) * flightArc + spanArc;

  return {
    wallThickness,
    archRise,
    wallRadius,
    arcPerStep,
    spanArc,
    landingArc,
    landingDrop,
    flightArc,
    flightsPerTurn,
    revolutionDrop,
    panelHalf,
    landingAzimuth,
    fixedLength,
    movingLength,
    corridorStart,
    movingStart,
    exitStart,
    thresholdX,
    roomSize,
    roomPlane,
    fixedTopFlights,
    movingFlights,
    fixedBottomFlights,
    totalFlights,
    floorY,
    holeRadius: wallRadius,
  };
}

export { TAU };
