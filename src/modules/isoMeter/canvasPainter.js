/* eslint-disable no-param-reassign */
const css = ([r, g, b]) => `rgb(${r},${g},${b})`;

export default function createCanvasPainter(
  ctx,
  {
    height,
    mirroredX = false,
    mirroredY = false,
    pixelRatio = 1,
    refSize,
    width,
  }
) {
  const s = (Math.min(width, height) / refSize) * pixelRatio;
  const transform = () => {
    ctx.setTransform(
      (mirroredX ? -1 : 1) * s,
      0,
      0,
      (mirroredY ? -1 : 1) * s,
      (width / 2) * pixelRatio,
      (height / 2) * pixelRatio
    );
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';
  };

  const path = (points) => {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let n = 1; n < points.length; n += 1)
      ctx.lineTo(points[n][0], points[n][1]);
    ctx.closePath();
  };

  return {
    background(rgb) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = css(rgb);
      ctx.fillRect(0, 0, width * pixelRatio, height * pixelRatio);
      transform();
    },
    polygon(points, { fill, stroke }) {
      transform();
      path(points);
      if (fill) {
        ctx.fillStyle = css(fill);
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = css(stroke.color);
        ctx.lineWidth = stroke.width;
        ctx.stroke();
      }
    },
    segments(list, { color, width: lineWidth }) {
      transform();
      ctx.strokeStyle = css(color);
      ctx.lineWidth = lineWidth;
      list.forEach(([[x1, y1], [x2, y2]]) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    },
    triangles(list) {
      transform();
      list.forEach(({ fill, points }) => {
        path(points);
        ctx.fillStyle = css(fill);
        ctx.fill();
      });
    },
  };
}
