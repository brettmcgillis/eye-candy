import React from 'react';

import { NumberField, ToggleField } from '@dev/renderWorkbench/SchemaFields';

// Only rendered while `membrane` is on — the closure's own toggle lives in
// the page's layer row, not here, so the section can stay conditional.
export default function MembraneSection({ options, setOption }) {
  return (
    <details className="rw-control-section rw-advanced">
      <summary>Membrane</summary>
      <div className="rw-field-grid">
        <NumberField
          id="rw-membrane-opacity"
          option="membraneOpacity"
          label="Opacity"
          onChange={(value) => setOption('membraneOpacity', value)}
          value={options.membraneOpacity}
        />
        <NumberField
          id="rw-membrane-tear"
          option="membraneTear"
          label="Tear distance"
          onChange={(value) => setOption('membraneTear', value)}
          value={options.membraneTear}
        />
        <NumberField
          id="rw-membrane-step-stride"
          option="membraneStepStride"
          label="Step stride"
          onChange={(value) => setOption('membraneStepStride', value)}
          value={options.membraneStepStride}
        />
        <NumberField
          id="rw-membrane-strand-stride"
          option="membraneStrandStride"
          label="Strand stride"
          onChange={(value) => setOption('membraneStrandStride', value)}
          value={options.membraneStrandStride}
        />
        <ToggleField
          id="rw-membrane-weave"
          option="membraneWeave"
          label="Weave"
          onChange={(value) => setOption('membraneWeave', value)}
          value={options.membraneWeave}
        />
        <NumberField
          id="rw-membrane-tear-softness"
          option="membraneTearSoftness"
          label="Tear softness"
          onChange={(value) => setOption('membraneTearSoftness', value)}
          value={options.membraneTearSoftness}
        />
        <NumberField
          id="rw-membrane-edge-feather"
          option="membraneEdgeFeather"
          label="Edge feather"
          onChange={(value) => setOption('membraneEdgeFeather', value)}
          value={options.membraneEdgeFeather}
        />
        <NumberField
          id="rw-membrane-taper"
          option="membraneTaper"
          label="Taper"
          onChange={(value) => setOption('membraneTaper', value)}
          value={options.membraneTaper}
        />
        <NumberField
          id="rw-membrane-rim"
          option="membraneRim"
          label="Rim"
          onChange={(value) => setOption('membraneRim', value)}
          value={options.membraneRim}
        />
        <NumberField
          id="rw-membrane-tint"
          option="membraneTint"
          label="Tint"
          onChange={(value) => setOption('membraneTint', value)}
          value={options.membraneTint}
        />
      </div>
    </details>
  );
}
