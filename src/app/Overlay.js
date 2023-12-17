import { useState } from "react";
import { Leva } from "leva";

import "./Overlay.css";

function Overlay() {
  const date = new Date();

  const local = isLocalHost();

  const [showLeva, setShowLeva] = useState(local ? true : false);

  const handleDebug = () => {
    setShowLeva(!showLeva);
  };

  return (
    <>
      <Leva collapsed={local ? false : true} hidden={!showLeva} />
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

function isLocalHost() {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "[::1]"
  );
}

export default Overlay;
