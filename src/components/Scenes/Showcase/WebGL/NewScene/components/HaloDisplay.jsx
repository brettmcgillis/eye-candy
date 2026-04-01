import React, { memo } from 'react';

import Lb45Plate from '../../../../../elements/45lbPlate/45lbPlate';
import Atom from '../../../../../elements/Atom/Atom';
import Halo from '../../../../../elements/halo/Halo';
import NeuralNetwork from '../../../../../elements/network/NeuralNetwork';
import Record from '../../../../../elements/record/Record';

/**
 * Renders the active halo type at a shared position/rotation/scale.
 * All halo components are wrapped in an outer group so the animation ref
 * applied in the scene always targets a stable Object3D.
 */
const HaloDisplay = memo(function HaloDisplay({
  haloRef,
  haloType,
  position,
  rotation,
  scale,
  visible,
  // Rings
  ringsConfig,
  // Record
  recordSideA,
  // Network
  networkConfig,
  // Atomic
  atomicNumber,
  atomAnimateElectrons,
  atomShellSpacing,
}) {
  return (
    <group
      ref={haloRef}
      position={position}
      rotation={rotation}
      scale={scale}
      visible={visible}
    >
      {haloType === 'rings' && <Halo {...ringsConfig} />}
      {haloType === 'record' && <Record sideA={recordSideA} />}
      {haloType === 'network' && <NeuralNetwork {...networkConfig} />}
      {haloType === 'plate' && <Lb45Plate />}
      {haloType === 'atomic' && (
        <Atom
          atomicNumber={atomicNumber}
          animateElectrons={atomAnimateElectrons}
          shellSpacing={atomShellSpacing}
        />
      )}
    </group>
  );
});

export default HaloDisplay;
