import { buildLeaves } from '@modules/kumiko';

globalThis.onmessage = ({ data }) => {
  const { config, id, image } = data;
  globalThis.postMessage({ id, result: buildLeaves(config, { image }) });
};
