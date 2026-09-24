import buildMazeTubes from './buildMazeTubes';
import buildFineSurface from './fineSurface';

let fine = null;

globalThis.onmessage = ({ data }) => {
  if (data.type === 'surface') {
    fine = buildFineSurface(data.surface, data.maxEdge);
    const positions = fine.graph.positions.slice();
    globalThis.postMessage({ id: data.id, positions, type: 'surface' }, [
      positions.buffer,
    ]);
    return;
  }

  const strength = data.strength.map((v, i) => (fine.outer[i] ? v : 0));
  const tubes = buildMazeTubes({ ...data.options, strength, surface: fine });
  globalThis.postMessage({ id: data.id, tubes, type: 'trace' }, [
    tubes.points.buffer,
    tubes.normals.buffer,
  ]);
};
