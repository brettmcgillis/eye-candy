import { folder, useControls } from 'leva';

export const CraniumControls = {
  showCranium: { value: true, label: 'Show Cranium' },
  showLeftZygomatic: { value: true, label: 'Show Left Zygomatic' },
  showOccipital: { value: true, label: 'Show Occipital' },
  showRightLacrimal: { value: true, label: 'Show Right Lacrimal' },
  showRightMaxilla: { value: true, label: 'Show Right Maxilla' },
  showRightNasal: { value: true, label: 'Show Right Nasal' },
  showRightPalatine: { value: true, label: 'Show Right Palatine' },
  showRightParietal: { value: true, label: 'Show Right Parietal' },
  showRightTemporal: { value: true, label: 'Show Right Temporal' },
  showRightZygomatic: { value: true, label: 'Show Right Zygomatic' },
  showSphenoid: { value: true, label: 'Show Sphenoid' },
  showTeeth: { value: true, label: 'Show Teeth' },
  showVomer: { value: true, label: 'Show Vomer' },
  showEthmoid: { value: true, label: 'Show Ethmoid' },
  showFrontal: { value: true, label: 'Show Frontal' },
  showInferiorConchae: { value: true, label: 'Show Inferior Conchae' },
  showLeftLacrimal: { value: true, label: 'Show Left Lacrimal' },
  showLeftMaxilla: { value: true, label: 'Show Left Maxilla' },
  showLeftNasal: { value: true, label: 'Show Left Nasal' },
  showLeftPalatine: { value: true, label: 'Show Left Palatine' },
  showLeftParietal: { value: true, label: 'Show Left Parietal' },
  showLeftTemporal: { value: true, label: 'Show Left Temporal' },
};

export const MandibleControls = {
  showMandible: { value: true, label: 'Show Mandible' },
  showMandibleBone: { value: true, label: 'Show Mandible Bone' },
  showMandibleTeeth: { value: true, label: 'Show Bottom Teeth' },
};

export function overrideDefaults(defaults, overrides) {
  const updated = { ...defaults };
  Object.keys(overrides).forEach((key) => {
    if (Object.hasOwn(updated, key)) {
      updated[key].value = overrides[key];
    }
  });
  return updated;
}

export function useSkullControls(overrides = {}) {
  const craiumControls = overrideDefaults(
    CraniumControls,
    overrides.cranium ? overrides.cranium : {}
  );
  const mandibleControls = overrideDefaults(
    MandibleControls,
    overrides.mandible ? overrides.mandible : {}
  );

  return useControls(
    overrides.controlName ? overrides.controlName : 'Skull',
    {
      Cranium: folder(craiumControls, { collapsed: true }),
      Mandible: folder(mandibleControls, { collapsed: true }),
    },
    { collapsed: overrides.collapsed ? overrides.collapsed : true }
  );
}
