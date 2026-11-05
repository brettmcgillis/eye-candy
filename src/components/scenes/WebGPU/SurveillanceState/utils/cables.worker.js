import buildCables from './cables';

globalThis.onmessage = ({ data }) => {
  const cables = buildCables(data);
  globalThis.postMessage(
    cables,
    cables.map((cable) => cable.points.buffer)
  );
};
