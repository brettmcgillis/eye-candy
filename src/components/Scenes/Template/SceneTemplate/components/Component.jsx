/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable unused-imports/no-unused-vars */
import { memo } from 'react';

// Component should get all its config from the scene it is in.
// Components should be able to be reused across scenes, and every component
// is memoized so changing an unrelated control elsewhere in the scene does
// not re-render this one.
function Component({ config }) {
  return null;
}

export default memo(Component);
