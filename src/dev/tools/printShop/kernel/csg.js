// Booleans through manifold-3d, which guarantees a watertight result (three's
// BVH CSG left T-junctions on the ghost). The initialised wasm module is
// injected as `env.manifold`, so the kernel itself imports nothing heavy and
// loads the same in the CLI and the page's worker.
//
// A component is { positions, indices, part | triPart, colors? }. Every
// output triangle is traced back to its component (runOriginalID) and source
// triangle (faceID), so parts and vertex colours survive the boolean.

const NUM_PROP = 6;

const hexToRgb = (hex) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

export default function createCsg(wasm, parts) {
  const { Manifold, Mesh } = wasm;
  const sources = new Map();

  function solidOf(component) {
    const count = component.positions.length / 3;
    const props = new Float32Array(count * NUM_PROP);
    const fallback = hexToRgb(parts[component.part ?? 0].color);
    for (let v = 0; v < count; v += 1) {
      for (let k = 0; k < 3; k += 1) {
        props[v * NUM_PROP + k] = component.positions[v * 3 + k];
        props[v * NUM_PROP + 3 + k] = component.colors
          ? component.colors[v * 3 + k]
          : fallback[k];
      }
    }
    const triangles = component.indices.length / 3;
    const mesh = new Mesh({
      faceID: Uint32Array.from({ length: triangles }, (_, t) => t),
      numProp: NUM_PROP,
      triVerts: Uint32Array.from(component.indices),
      vertProperties: props,
    });
    mesh.merge();
    const solid = new Manifold(mesh).asOriginal();
    sources.set(solid.originalID(), component);
    return solid;
  }

  // A manifold built by the library itself (an extruded mark): one part.
  function solidOfManifold(manifold, part) {
    const mesh = manifold.getMesh();
    const count = mesh.vertProperties.length / mesh.numProp;
    const positions = new Float64Array(count * 3);
    for (let v = 0; v < count; v += 1) {
      for (let k = 0; k < 3; k += 1) {
        positions[v * 3 + k] = mesh.vertProperties[v * mesh.numProp + k];
      }
    }
    return solidOf({ indices: mesh.triVerts, part, positions });
  }

  function toModel(solid) {
    const mesh = solid.getMesh();
    const count = mesh.vertProperties.length / mesh.numProp;
    const positions = new Float64Array(count * 3);
    const vertexColors = new Float64Array(count * 3);
    for (let v = 0; v < count; v += 1) {
      for (let k = 0; k < 3; k += 1) {
        positions[v * 3 + k] = mesh.vertProperties[v * mesh.numProp + k];
        vertexColors[v * 3 + k] =
          mesh.numProp >= NUM_PROP
            ? mesh.vertProperties[v * mesh.numProp + 3 + k]
            : 1;
      }
    }
    // Vertices split where their properties differ (colour seams); the
    // merge vectors weld them back so the triangles share one topology.
    const triVerts = Uint32Array.from(mesh.triVerts);
    if (mesh.mergeFromVert?.length) {
      const weld = new Map();
      mesh.mergeFromVert.forEach((from, i) =>
        weld.set(from, mesh.mergeToVert[i])
      );
      for (let i = 0; i < triVerts.length; i += 1) {
        triVerts[i] = weld.get(triVerts[i]) ?? triVerts[i];
      }
    }
    const triangles = triVerts.length / 3;
    const triPart = new Uint8Array(triangles);
    for (let run = 0; run < mesh.runOriginalID.length; run += 1) {
      const source = sources.get(mesh.runOriginalID[run]);
      for (
        let t = mesh.runIndex[run] / 3;
        t < mesh.runIndex[run + 1] / 3;
        t += 1
      ) {
        triPart[t] = source?.triPart
          ? source.triPart[mesh.faceID[t]]
          : (source?.part ?? 0);
      }
    }
    return {
      indices: triVerts,
      positions,
      triPart,
      vertexColors,
    };
  }

  return { Manifold, solidOf, solidOfManifold, toModel, wasm };
}
