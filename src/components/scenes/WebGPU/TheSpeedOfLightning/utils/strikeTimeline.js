// Leader growth, branch growth and the shock ring all divide one distance by
// one speed, so they cannot drift out of step. The return stroke is the
// deliberate exception: a real return stroke is orders of magnitude faster than
// the leader that cut the channel, so it gets its own multiple of that speed.
export function createTimeline({
  frontSpeed,
  groundArc,
  holdDuration,
  restDuration,
  returnGap,
  returnSpeed,
  returnStrokes,
  totalArc,
}) {
  const contactAt = groundArc / frontSpeed;
  const growEnd = totalArc / frontSpeed;
  const strokeDuration = (2 * groundArc) / returnSpeed;
  const strokeCycle = strokeDuration + returnGap;
  const returnEnd = contactAt + returnStrokes * strokeCycle - returnGap;
  const dissolveAt = Math.max(growEnd, returnEnd) + holdDuration;

  return {
    contactAt,
    dissolveAt,
    duration: dissolveAt + restDuration,
    growEnd,
    returnEnd,
    strokeCycle,
    strokeDuration,
  };
}

export function sampleTimeline({
  frontSpeed,
  groundArc,
  maxRadius,
  previousShock,
  returnDecay,
  returnHold,
  returnHoldDecay,
  returnPeak,
  returnSpeed,
  returnStrokes,
  time,
  timeline,
  totalArc,
}) {
  const {
    contactAt,
    dissolveAt,
    duration,
    growEnd,
    returnEnd,
    strokeCycle,
    strokeDuration,
  } = timeline;
  const travelled = (time - contactAt) * frontSpeed;
  const minimumBand = 0.02;
  // The ring retires once it has swept past the bed; leaving it clamped at the
  // rim would keep re-ejecting the outermost grains every frame.
  const swept = time > contactAt && travelled <= maxRadius + minimumBand;
  const shockOuter = swept ? travelled : -1;

  let returnArc = -10;
  let returnStrength = 0;
  let channelFlash = 0;

  const sinceContact = time - contactAt;
  if (sinceContact >= 0 && time <= returnEnd) {
    const strokeIndex = Math.min(
      Math.floor(sinceContact / strokeCycle),
      returnStrokes - 1
    );
    const inStroke = sinceContact - strokeIndex * strokeCycle;
    const falloff = returnDecay ** strokeIndex;

    if (inStroke <= strokeDuration) {
      const swept2 = inStroke * returnSpeed;
      returnArc = swept2 <= groundArc ? groundArc - swept2 : swept2 - groundArc;
      const attack = Math.min(1, inStroke * returnSpeed * 6);
      returnStrength = returnPeak * falloff * attack;
    }

    // The whole channel lights at each stroke onset and decays — this is the
    // "hold" that reads as the channel staying ionised between strokes, rather
    // than only a travelling dot being lit.
    channelFlash = returnHold * falloff * Math.exp(-inStroke * returnHoldDecay);
  }

  // `frontArc` clamps at `totalArc` and stays there, so without this the tip
  // glow sits permanently lit on the last grains of the tree and bleeds through
  // the whole flash sequence. The leader is only searching until growEnd.
  const TIP_FADE = 0.15;
  const tipActive =
    time <= growEnd ? 1 : Math.max(0, 1 - (time - growEnd) / TIP_FADE);

  // Where the camera and DOF look. It rides the descending tip while the bolt
  // grows, then hands over to a straight interpolation back to the origin.
  // `focusRetrace` is that handover, 0 through growth and flash, eased 0..1
  // across the rest. It must NOT retrace the trunk polyline — that path is a
  // deliberately jagged stepped leader, and dragging the look target along it
  // reads as camera shake.
  const restSpan = Math.max(duration - dissolveAt, 1e-4);
  const retrace = Math.min(Math.max((time - dissolveAt) / restSpan, 0), 1);
  const focusRetrace = retrace * retrace * (3 - 2 * retrace);
  const focusArc = Math.min(time * frontSpeed, groundArc);

  return {
    boltDissolving: time >= dissolveAt ? 1 : 0,
    channelFlash,
    focusArc,
    focusRetrace,
    tipActive,
    frontArc: Math.min(time * frontSpeed, totalArc),
    returnArc,
    returnStrength,
    shockInner:
      shockOuter < 0 ? -1 : Math.min(previousShock, shockOuter - minimumBand),
    shockOuter,
  };
}
