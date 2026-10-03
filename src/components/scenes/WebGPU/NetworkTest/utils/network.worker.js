import { buildNetwork, wire } from '@modules/networkTest';

// Building and rewiring take tens of milliseconds, so the scene does both
// here and keeps drawing the network it has until the answer lands.
globalThis.onmessage = ({ data }) => {
  const result =
    data.type === 'build'
      ? buildNetwork(data.config, { image: data.image })
      : wire(data.points, data.config);
  globalThis.postMessage({ id: data.id, result });
};
