function toPathData(segments, precision) {
  if (!segments.length) return '';
  const f = (value) => Number(value).toFixed(precision);
  return segments
    .map(([x1, y1, x2, y2]) => `M ${f(x1)} ${f(y1)} L ${f(x2)} ${f(y2)}`)
    .join(' ');
}

export default function serializeSvg({
  width,
  height,
  paperWidthMm,
  paperHeightMm,
  marginMm,
  strokeWidth,
  precision,
  outlines,
  hatching,
  metadata,
}) {
  const safeMargin = Math.max(0, marginMm);
  const drawWidth = Math.max(1, paperWidthMm - safeMargin * 2);
  const drawHeight = Math.max(1, paperHeightMm - safeMargin * 2);

  const scaleX = drawWidth / width;
  const scaleY = drawHeight / height;

  const scaleSegments = (segments) =>
    segments.map(([x1, y1, x2, y2]) => [
      safeMargin + x1 * scaleX,
      safeMargin + y1 * scaleY,
      safeMargin + x2 * scaleX,
      safeMargin + y2 * scaleY,
    ]);

  const outlinePath = toPathData(scaleSegments(outlines), precision);
  const hatchPath = toPathData(scaleSegments(hatching), precision);

  const metaText = metadata
    ? `\n  <!-- ${JSON.stringify(metadata).replace(/--/g, '__')} -->`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${paperWidthMm}mm" height="${paperHeightMm}mm" viewBox="0 0 ${paperWidthMm} ${paperHeightMm}">${metaText}
  <g id="outlines" fill="none" stroke="#111" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="${outlinePath}" />
  </g>
  <g id="hatching" fill="none" stroke="#555" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="${hatchPath}" />
  </g>
</svg>`;
}
