import 'bootstrap/dist/css/bootstrap.min.css';
import ProgressBar from 'react-bootstrap/ProgressBar';

import { Html, useProgress } from '@react-three/drei';

import './Loader.css';

function Loader() {
  const { progress } = useProgress();
  const _progress = Math.floor(progress);
  return (
    <Html center>
      <div className="Loader">
        <div className="Text-container">Loading</div>
        <ProgressBar now={_progress} />
        <div className="Text-container">{_progress} %</div>
      </div>
    </Html>
  );
}

export default Loader;
