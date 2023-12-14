import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import { useControls } from "leva";

import "./App.css";

import Loader from "./components/loader/Loader";
import LightingRig from "./components/rigging/LightingRig";
import GridHelper from "./components/rigging/GridHelper";
import PolarGridHelper from "./components/rigging/PolarGridHelper";
import ScreenShotControsl from "./components/rigging/ScreenShot";

import NewScene from "./components/scenes/NewScene";

function App() {
  // COMPLEX CONTROLS~!
  // const controls = useControls("Controls", {
  //   show: { value: true, label: "Show color" },
  //   color: { value: "#fff", render: (get) => get("Controls.show") },
  //   show2: { value: false, label: "Show folder" },
  //   folder: folder(
  //     {
  //       number: 1,
  //       string: {
  //         value: "shown if `number >= 1`",
  //         render: (get) => get("Controls.folder.number") >= 1,
  //       },
  //     },
  //     { render: (get) => get("Controls.show2") }
  //   ),
  // });

  const controls = useControls(
    "Environment",
    {
      show_grid_helper: true,
      show_polar_grid_helper: false,
    },
    { collapsed: true }
  );

  return (
    <div className="App">
      <Canvas shadows gl={{ preserveDrawingBuffer: true }}>
        <Suspense fallback={<Loader />}>
          <GridHelper visible={controls.show_grid_helper} />
          <PolarGridHelper visible={controls.show_polar_grid_helper} />
          <LightingRig />

          <NewScene />

          <CameraControls makeDefault />
          <ScreenShotControsl />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
