const TAU = Math.PI * 2;

function hash01(n) {
  const s = Math.sin(n * 127.1) * 43758.5453123;
  return s - Math.floor(s);
}

// A pattern of P flights that repeats. Every flight may differ — step count,
// rise, landing arc, what leaves the landing — but the pattern's total rotation
// is closed onto a whole number of turns by adjusting its last landing. That is
// what lets the stack be varied and still wrap invisibly: after P flights the
// helix is exactly where it started.
export default function buildEndlessPattern(config, tour) {
  const count = Math.max(tour.flightsPerTurn, tour.movingFlights);
  const spread = config.stairVariance;
  const flights = [];
  let angle = 0;
  let y = 0;

  for (let i = 0; i < count; i += 1) {
    const stepJitter = 1 + (hash01(i * 3.7 + 1.1) - 0.5) * spread;
    const arcJitter = 1 + (hash01(i * 8.3 + 5.9) - 0.5) * spread;
    const stepCount = Math.max(6, Math.round(config.stepCount * stepJitter));
    const riser =
      config.riser * (1 + (hash01(i * 5.1 + 2.7) - 0.5) * spread * 0.5);
    const spanArc = stepCount * tour.arcPerStep;
    const landingArc = Math.max(
      tour.arcPerStep * 4,
      tour.landingArc * arcJitter
    );
    flights.push({
      index: i,
      y,
      angle,
      stepCount,
      riser,
      spanArc,
      landingArc,
      rise: stepCount * riser + riser,
      overshoot:
        config.landingOvershoot +
        hash01(i * 11.3 + 0.4) * config.stairVariance * config.stairWidth,
      flare: hash01(i * 17.9 + 7.3) < config.stairFlareChance,
    });
    angle -= spanArc + landingArc;
    y -= stepCount * riser + riser;
  }

  // Close the pattern: nudge the final landing so the total rotation is a whole
  // number of turns. Without this the stack is out of phase at every wrap.
  const total = -angle;
  const turns = Math.max(1, Math.round(total / TAU));
  const correction = turns * TAU - total;
  const last = flights[flights.length - 1];
  last.landingArc += correction;
  if (last.landingArc < tour.arcPerStep * 2) {
    last.landingArc += TAU;
  }

  const totalRise = -y;
  const totalArc = flights.reduce(
    (sum, f) => sum + f.spanArc + f.landingArc,
    0
  );

  return { flights, totalRise, totalArc, turns };
}
