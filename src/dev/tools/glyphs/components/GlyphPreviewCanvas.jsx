import React, { useEffect, useMemo, useRef, useState } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import WebGPUCanvas from '@app/scaffold/canvas/WebGPUCanvas';
import {
  createGlyphMaterial,
  fontCellAspect,
  layoutText,
} from '@modules/glyphs';

import './GlyphPreviewCanvas.css';

const MARGIN = 1.12;

function FitCamera({ height, width }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useEffect(() => {
    camera.zoom = Math.min(
      size.width / (width * MARGIN),
      size.height / (height * MARGIN)
    );
    camera.updateProjectionMatrix();
  }, [camera, height, size.height, size.width, width]);

  return null;
}

// One material per technique for the life of the page. Switching fonts or
// techniques only rewrites uniforms; a hidden plane keeps its material and
// stops updating until it's shown again.
function GlyphPlane({ font, size, text, visible }) {
  const [handle] = useState(() => createGlyphMaterial(font, { text }));

  useEffect(() => () => handle.dispose(), [handle]);

  useEffect(() => {
    if (visible) handle.update({ font, text });
  }, [font, handle, text, visible]);

  return (
    <mesh
      material={handle.material}
      scale={[size.width, size.height, 1]}
      visible={visible}
    >
      <planeGeometry />
    </mesh>
  );
}

export default function GlyphPreviewCanvas({ font, text }) {
  const lastFonts = useRef({});
  lastFonts.current[font.technique] = font;
  const [techniques, setTechniques] = useState([font.technique]);

  useEffect(() => {
    setTechniques((current) =>
      current.includes(font.technique) ? current : [...current, font.technique]
    );
  }, [font.technique]);

  const size = useMemo(() => {
    const layout = layoutText(text, { lineGap: font.params.lineGap });
    return {
      height: layout.rows,
      truncated: layout.truncated,
      width: layout.cols * fontCellAspect(font),
    };
  }, [font, text]);

  return (
    <div className="glyphs-preview">
      <WebGPUCanvas>
        <color args={['#0b0d12']} attach="background" />
        <OrthographicCamera makeDefault position={[0, 0, 10]} />
        <FitCamera height={size.height} width={size.width} />
        {techniques.map((id) => (
          <GlyphPlane
            font={lastFonts.current[id]}
            key={id}
            size={size}
            text={text}
            visible={id === font.technique}
          />
        ))}
      </WebGPUCanvas>
      {size.truncated ? (
        <p className="glyphs-preview__warning">
          Text is longer than a material holds; the preview is cut off.
        </p>
      ) : null}
    </div>
  );
}
