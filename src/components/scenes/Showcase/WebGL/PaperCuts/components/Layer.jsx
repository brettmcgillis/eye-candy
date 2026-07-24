/* eslint-disable react/no-array-index-key */
import React from 'react';

import Square from './Square';

export default function Layer({
  layer,
  squares,
  depth,
  settings,
  highlightedSquareIndex = -1,
  highlightColor,
  highlightEmissiveIntensity,
  highlightStrength = 1,
  squareRoughness = 1,
  squareMetalness = 0,
  squareFlatShading = false,
  squareWatercolor = false,
}) {
  return (
    <group castShadow receiveShadow position={[0, 0, depth]}>
      {squares.map((square, index) => {
        return (
          <Square
            key={`sq-${index}`}
            index={index}
            layer={layer}
            {...square}
            settings={settings}
            isHighlighted={highlightedSquareIndex === index}
            highlightColor={highlightColor}
            highlightEmissiveIntensity={highlightEmissiveIntensity}
            highlightStrength={highlightStrength}
            roughness={squareRoughness}
            metalness={squareMetalness}
            flatShading={squareFlatShading}
            watercolor={squareWatercolor}
          />
        );
      })}
    </group>
  );
}
