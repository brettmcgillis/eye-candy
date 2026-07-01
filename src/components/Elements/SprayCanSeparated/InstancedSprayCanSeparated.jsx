import React from 'react';

import { Merged, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

const context = React.createContext();

export function Instances({ children, ...props }) {
  const { nodes } = useGLTF(modelFile('sprayCanSeparated.glb'));
  const instances = React.useMemo(
    () => ({
      Bluepanel: nodes.blue_panel,
      Blueslider: nodes.blue_slider,
      Canlabel: nodes.can_label,
      Colorring: nodes.color_ring,
      Greenpanel: nodes.green_panel,
      Greenslider: nodes.green_slider,
      Redpanel: nodes.red_panel,
      Redslider: nodes.red_slider,
      Spraycan: nodes.spray_can,
    }),
    [nodes]
  );
  return (
    <Merged meshes={instances} {...props}>
      {(instances) => (
        <context.Provider value={instances} children={children} />
      )}
    </Merged>
  );
}

export default function InstancedSprayCan(props) {
  const instances = React.useContext(context);
  return (
    <group {...props} dispose={null}>
      <instances.Bluepanel rotation={[-Math.PI / 2, 0, 0]} />
      <instances.Blueslider rotation={[-Math.PI / 2, 0, 0]} />
      <instances.Canlabel rotation={[-Math.PI / 2, 0, 0]} />
      <instances.Colorring rotation={[-Math.PI / 2, 0, 0]} />
      <instances.Greenpanel rotation={[-Math.PI / 2, 0, 0]} />
      <instances.Greenslider rotation={[-Math.PI / 2, 0, 0]} />
      <instances.Redpanel rotation={[-Math.PI / 2, 0, 0]} />
      <instances.Redslider rotation={[-Math.PI / 2, 0, 0]} />
      <instances.Spraycan rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  );
}

useGLTF.preload(modelFile('sprayCanSeparated.glb'));
