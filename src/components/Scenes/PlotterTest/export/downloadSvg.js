export default function downloadSvg(svgString, fileName = 'export') {
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}
