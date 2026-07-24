import React, { memo } from 'react';

import SLOT_COMPONENTS from './lighting/LightSlots';

// Drop-in companion to CameraRig: scenes declare named light slots, pass the
// built runtime config in, and get back real lights with shadows, targets,
// layers and debug helpers. Disabled slots unmount rather than sit at
// intensity 0 — pass `onLightChange` (a stable callback) to track a light's
// instance when a consumer needs the actual object.
function LightingRig({ lighting, onLightChange = null }) {
  if (!lighting?.enabled) {
    return null;
  }

  return (
    <>
      {lighting.slots.map((slot) => {
        const SlotComponent = SLOT_COMPONENTS[slot.type];

        if (!slot.enabled || !SlotComponent) {
          return null;
        }

        return (
          <SlotComponent
            key={slot.id}
            onLightChange={onLightChange}
            slot={slot}
          />
        );
      })}
    </>
  );
}

export default memo(LightingRig);
