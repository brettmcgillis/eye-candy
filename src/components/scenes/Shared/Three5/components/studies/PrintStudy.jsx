import React, { memo, useEffect, useMemo } from 'react';

import { CanvasTexture, DoubleSide, SRGBColorSpace } from 'three';

import printPlates from '../../utils/printPlates';
import Comparison from './Comparison';

function PrintStudy({ config, assets }) {
  const data = useMemo(
    () => printPlates(assets.main, config),
    [
      assets,
      config.printInks,
      config.printCell,
      config.printAngle,
      config.printRegistration,
      config.printDots,
      config.paper,
    ]
  );
  const texture = useMemo(() => {
    const source =
      config.printPlate === 'composite'
        ? data.composite
        : data.plates[
            Math.min(data.plates.length, Number(config.printPlate)) - 1
          ];
    const output = new CanvasTexture(source);
    output.colorSpace = SRGBColorSpace;
    return output;
  }, [data, config.printPlate]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <Comparison
      config={config}
      sourceLabel="Native watercolor"
      treatmentLabel={
        config.printPlate === 'composite'
          ? `${config.printInks} screened inks`
          : `Ink plate ${Math.min(config.printInks, Number(config.printPlate))}`
      }
    >
      {(mode) => (
        <mesh>
          <planeGeometry args={[5, 5]} />
          <meshBasicMaterial
            map={mode === 'original' ? assets.mainTexture : texture}
            side={DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}
    </Comparison>
  );
}
export default memo(PrintStudy);
