// An SVG as top-down RGBA at `width`×`height` px, the page's twin of a CLI's
// sharp rasterise (for @modules/renderStage/svgStage).
export default async function rasterizeSvg(svg, { height, width }) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, width, height);
    const { data } = context.getImageData(0, 0, width, height);
    return { data, height, width };
  } finally {
    URL.revokeObjectURL(url);
  }
}
