import { useMemo, useState } from 'react';

import useSavedDesigns from './useSavedDesigns';

const SEEDED = ['', 'None — seeded field'];

// A workbench opened from the designer arrives with ?design=<name> preselected.
export default function useDesignChoices() {
  const { designs } = useSavedDesigns();
  const [initialOptions] = useState(() => {
    const design = new URLSearchParams(window.location.search).get('design');
    return design ? { blobDesign: design } : {};
  });
  const choices = useMemo(
    () => [SEEDED, ...designs.map(({ name }) => [name, name])],
    [designs]
  );
  return { choices, initialOptions };
}
