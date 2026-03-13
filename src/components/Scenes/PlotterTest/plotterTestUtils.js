// Download an SVG string as a file
export function downloadSvg(svgString, fileName = 'export') {
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}
// Utility functions for PlotterTest

export function getThemeColors(theme) {
  return theme === 'light'
    ? {
        background: '#ffffff',
        canvasText: '#2f2f2f',
        sourceAmbient: 2.0,
        gridCenter: 0xcccccc,
        gridLines: 0xdddddd,
        paperBackground: '#f4f1e8',
      }
    : {
        background: '#222222',
        canvasText: '#e0e0e0',
        sourceAmbient: 0.25,
        gridCenter: 0x444444,
        gridLines: 0x333333,
        paperBackground: '#2a2a2a',
      };
}

export function getViewportLayout(size) {
  const FIXED_SPLIT_RATIO = 0.5;
  const viewportWidth = Math.max(1, Number(size?.width) || 1);
  const viewportHeight = Math.max(1, Number(size?.height) || 1);
  const leftWidth = Math.max(1, Math.floor(viewportWidth * FIXED_SPLIT_RATIO));
  const rightWidth = Math.max(1, viewportWidth - leftWidth);

  return {
    leftWidth,
    rightWidth,
    rightX: leftWidth,
    viewportHeight,
    captureAspect: leftWidth / viewportHeight,
  };
}

export function extractSvgMarkup(domElement) {
  if (!domElement) {
    return { innerHTML: '', outerHTML: '', viewBox: null };
  }

  return {
    innerHTML: domElement.innerHTML,
    outerHTML: domElement.outerHTML,
    viewBox: domElement.getAttribute('viewBox'),
  };
}
