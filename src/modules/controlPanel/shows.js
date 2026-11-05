import createScrollShow from './scroll';
import createSwapShow from './swap';

// A view is the box the camera sees on the panel's plane, in cells about
// the panel's centre: { x0, x1, y0, y1 }.
const SLACK = 0.05;

// The columns and rows that cover `view`, centred: the panel overhangs the
// frame by under a cell rather than leaving a gap.
export function fitPanel(view) {
  const span = (a, b) =>
    Math.max(1, Math.ceil(2 * Math.max(Math.abs(a), Math.abs(b)) - SLACK));
  return {
    panelCols: span(view.x0, view.x1),
    panelRows: span(view.y0, view.y1),
  };
}

// The show a config's Sequence asks for, or null for a fixed panel.
export default function createPanelShow(config) {
  if (config.panelDesign) return null;
  if (config.sequence === 'swap')
    return createSwapShow(config, {
      cols: config.panelCols,
      rows: config.panelRows,
    });
  if (config.sequence === 'scroll') return createScrollShow(config);
  return null;
}
