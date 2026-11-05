import { memo, useEffect } from 'react';

import { useThree } from '@react-three/fiber';

import { connectPanelPointer } from '@modules/controlPanelRender';

function PanelTouch({ driver }) {
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);
  useEffect(
    () =>
      connectPanelPointer({
        canvas: gl.domElement,
        controls,
        getCamera: () => camera,
        getSession: () => driver.session,
      }),
    [camera, controls, driver, gl]
  );
  return null;
}

export default memo(PanelTouch);
