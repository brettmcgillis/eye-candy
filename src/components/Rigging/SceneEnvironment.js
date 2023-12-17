import { useControls } from "leva";
import { Environment } from "@react-three/drei";

function SceneEnvironment() {
  const controls = useControls("Environment", {}, { collapsed: true });
  return (
    <>
      <color attach={"background"} args={["#000000"]} />
      <Environment background blur={1} preset="city" />
    </>
  );
}

export default SceneEnvironment;
