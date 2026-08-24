import React, { memo } from 'react';

import CloudField from './CloudField';

// Everything the Clouds preset needs, self-contained: lighting + the cloud
// field. `meta` is this window's own broadcast cloud style (computed once by
// presets/views.js' getMeta so the same object serves as both the outgoing
// windowSync payload and this window's own fallback style — see CrossTalk.jsx).
function CloudsView({ c, meta, windows }) {
  return (
    <>
      {/* cartoon_clouds.glb is an untextured PBR material (white, roughness
          0.6) — flat ambient/hemisphere fill alone lit every surface equally
          and hid the model's sculpted volume. A directional "sun" (a true
          directional light illuminates uniformly regardless of how far a
          cloud has drifted from world origin, so no per-window handling
          needed) gives it the highlight/shadow gradient that reads as form;
          ambient/hemisphere are dialed down to fill only, not wash it out. */}
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#ffffff', '#b0c4de', 0.3]} />
      <directionalLight
        color="#fff8e7"
        intensity={1.6}
        position={[-300, 400, 250]}
      />

      <CloudField
        windows={windows}
        fallbackCloud={meta}
        hueShift={c.hueShift}
      />
    </>
  );
}

export default memo(CloudsView);
