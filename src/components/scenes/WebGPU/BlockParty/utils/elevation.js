// The reference fakes height by nudging a drawing (-1, -1) in plan space and
// squashing the plan by 0.62. Under an orthographic camera at asin(0.62) that
// nudge is exactly this much real height per reference pixel.
export const SQUASH = 0.62;

export const ELEVATION_DEGREES = (Math.asin(SQUASH) * 180) / Math.PI;

export const PIXEL_RISE = Math.SQRT2 * Math.tan(Math.asin(SQUASH));
