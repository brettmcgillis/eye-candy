export default function downloadSvg(svgString, fileName) {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('download', `${fileName || 'plotter'}.svg`);
  link.setAttribute('href', url);
  link.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 50);
}
