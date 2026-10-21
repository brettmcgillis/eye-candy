import {
  buildJob,
  jobPasses,
  packRuns,
  parseSvg,
  runLength,
  serializeJob,
} from './kernel/index.mjs';

let source = null;
let built = null;

const layerSummary = (layer) => ({
  id: layer.id,
  inkMm: layer.runs.reduce((sum, run) => sum + runLength(run), 0),
  runs: layer.runs.length,
  stroke: layer.stroke ?? null,
});

function preview(passes, extra) {
  const transfer = [];
  const shown = passes.map(
    ({ crowding, layerCrowding, layers, pen, runs, stats }) => {
      const packed = packRuns(runs);
      transfer.push(packed.coords.buffer, packed.starts.buffer);
      transfer.push(packed.closed.buffer);
      if (crowding) transfer.push(crowding.cells.buffer);
      return { crowding, layerCrowding, layers, packed, pen, stats };
    }
  );
  return { message: { ...extra, passes: shown }, transfer };
}

const handlers = {
  build({ settings }) {
    if (!source) throw new Error('Load a source first.');
    built = buildJob(source, settings);
    return preview(built.passes, {
      paper: built.paper,
      placement: built.placement,
    });
  },
  load({ svg }) {
    source = parseSvg(svg);
    built = null;
    return {
      message: {
        background: source.background,
        heightMm: source.heightMm,
        layers: source.layers.map(layerSummary),
        widthMm: source.widthMm,
      },
    };
  },
  openJob({ job }) {
    source = null;
    built = null;
    return preview(jobPasses(job), {
      paper: job.paper,
      placement: job.placement,
    });
  },
  serialize({ meta }) {
    if (!built) throw new Error('Nothing built yet.');
    return { message: { json: JSON.stringify(serializeJob(meta, built)) } };
  },
};

// eslint-disable-next-line no-restricted-globals
self.onmessage = ({ data }) => {
  try {
    const { message, transfer = [] } = handlers[data.type](data);
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ ...message, id: data.id }, transfer);
  } catch (error) {
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({ id: data.id, message: error.message, type: 'error' });
  }
};
