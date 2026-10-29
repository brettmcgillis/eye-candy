import React, { memo, useEffect, useMemo, useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import WebGLCanvas from '@app/scaffold/canvas/WebGLCanvas';
import { frameFromDesign } from '@modules/paperCuts';
import { createPaperRig, createStudio } from '@modules/paperCutsRender';

function Content({ design, config, frameRevision }) {
  const rig = useMemo(createPaperRig, []);
  const studio = useMemo(() => createStudio(), []);
  const orbit = useRef(null);
  const { camera, size } = useThree();
  const current = useRef({ design, config });
  current.current = { design, config };
  useEffect(() => {
    const frame = frameFromDesign(design, config);
    frame.settings.dataScaleMultiplier = 1;
    rig.apply(frame, config);
    const [x, y] = frame.settings.origin;
    const angle = config.rotate ? -Math.PI / 4 : 0;
    rig.group.position.set(
      x * Math.cos(angle) - y * Math.sin(angle),
      x * Math.sin(angle) + y * Math.cos(angle),
      0
    );
    studio.apply(config);
  }, [rig, studio, design, config]);
  useEffect(
    () => () => {
      rig.dispose();
      studio.dispose();
    },
    [rig, studio]
  );
  useEffect(() => {
    const snapshot = current.current;
    const frame = frameFromDesign(snapshot.design, snapshot.config);
    const angle = snapshot.config.rotate ? -Math.PI / 4 : 0;
    const [x, y] = frame.settings.origin;
    const cx = x * Math.cos(angle) - y * Math.sin(angle);
    const cy = x * Math.sin(angle) + y * Math.cos(angle);
    const reach = Math.max(4, frame.stats.halfExtent * Math.SQRT2);
    const distance =
      reach /
      Math.sin(
        Math.atan(Math.tan(Math.PI / 9) * Math.min(1, size.width / size.height))
      );
    camera.position.set(cx + distance * 0.18, cy + distance * 0.12, distance);
    camera.lookAt(cx, cy, 0);
    camera.updateProjectionMatrix();
    orbit.current?.target.set(cx, cy, 0);
    orbit.current?.update();
  }, [camera, frameRevision, size.width, size.height]);
  return (
    <>
      <color attach="background" args={[config.backgroundColor]} />
      <primitive object={rig.group} dispose={null} />
      <primitive object={studio.group} dispose={null} />
      <OrbitControls ref={orbit} makeDefault />
    </>
  );
}
const MemoContent = memo(Content);
function Preview(props) {
  return (
    <WebGLCanvas>
      <PerspectiveCamera
        makeDefault
        fov={40}
        position={[0, 0, 18]}
        near={0.01}
        far={2000}
      />
      <MemoContent {...props} />
    </WebGLCanvas>
  );
}
export default memo(Preview);
