import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';

import { Html, useProgress } from '@react-three/drei';

import './Loader.css';

function Loader() {
  const { progress } = useProgress();
  const p = Math.floor(progress);
  return (
    <Html center>
      <div className="Loader">
        <div className="Text-container">Loading</div>
        <ProgressBar now={p} />
        <div className="Text-container">{p} %</div>
      </div>
    </Html>
  );
}

export default Loader;
