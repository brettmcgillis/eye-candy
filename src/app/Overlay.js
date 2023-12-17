import { Leva } from "leva";

import "./Overlay.css";
import { useState } from "react";

function Overlay() {
  const date = new Date();

  const [showLeva, setShowLeva] = useState(true);
  const handleDebug = () => {
    setShowLeva(!showLeva);
  };

  return (
    <>
      <Leva hidden={!showLeva} />
      <div className="Overlay">
        <div className="Top-Left">
          <span className="Debug" onClick={handleDebug}>
            🔥&nbsp;
          </span>
          — 💀
        </div>
        <div className="Bottom-Left">Brett McGillis</div>
        <div className="Bottom-Right">
          {`${date.getDate()} | ${date.getMonth() + 1} | ${date.getFullYear()}`}
        </div>
      </div>
    </>
  );
}

export default Overlay;
