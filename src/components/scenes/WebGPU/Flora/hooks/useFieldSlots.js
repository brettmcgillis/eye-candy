import { useEffect, useMemo } from 'react';

import { createFieldSlots } from '@modules/floraRender';

export default function useFieldSlots() {
  const fields = useMemo(createFieldSlots, []);

  useEffect(() => () => fields.dispose(), [fields]);

  return fields;
}
