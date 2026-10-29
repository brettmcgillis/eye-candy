import React, { memo } from 'react';

import { MAX_LAYERS, moveLayer, normalizeDesign } from '@modules/paperCuts';

function Layers({ design, activeLayer, onLayer, onChange }) {
  const move = (delta) => {
    const target = activeLayer + delta;
    if (target < 0 || target >= design.layerCount) return;
    onChange(moveLayer(design, activeLayer, target));
    onLayer(target);
  };
  const remove = () => {
    const layerCount = Math.max(1, design.layerCount - 1);
    onChange(
      normalizeDesign({
        ...design,
        layerCount,
        pieces: design.pieces
          .filter((p) => p.layer !== activeLayer)
          .map((p) => ({
            ...p,
            layer: p.layer > activeLayer ? p.layer - 1 : p.layer,
          })),
      })
    );
    onLayer(Math.min(activeLayer, layerCount - 1));
  };
  return (
    <section className="pcd-section">
      <h2>
        Layers <small>1 is nearest the viewer</small>
      </h2>
      <div aria-label="Layers" className="pcd-layer-list">
        {Array.from({ length: design.layerCount }, (_, layer) => (
          <button
            aria-pressed={layer === activeLayer}
            className="dev-button"
            key={layer}
            onClick={() => onLayer(layer)}
            type="button"
          >
            Layer {layer + 1}
            <span>
              {design.pieces.filter((p) => p.layer === layer).length} pieces
            </span>
          </button>
        ))}
      </div>
      <div className="pcd-row">
        <button
          className="dev-button"
          disabled={design.layerCount >= MAX_LAYERS}
          onClick={() => {
            onChange({ ...design, layerCount: design.layerCount + 1 });
            onLayer(design.layerCount);
          }}
          type="button"
        >
          Add layer
        </button>
        <button
          className="dev-button"
          disabled={activeLayer === 0}
          onClick={() => move(-1)}
          type="button"
        >
          Bring forward
        </button>
        <button
          className="dev-button"
          disabled={activeLayer === design.layerCount - 1}
          onClick={() => move(1)}
          type="button"
        >
          Send back
        </button>
        <button className="dev-button" onClick={remove} type="button">
          Delete layer
        </button>
      </div>
    </section>
  );
}
export default memo(Layers);
