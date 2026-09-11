import React, { useEffect, useRef, useState } from 'react';

import ProjectionSurface from './ProjectionSurface';

export default function ProjectionStage({ children, project }) {
  const frameRef = useRef(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    const updateScale = () => {
      const { clientHeight, clientWidth } = frame;
      setScale({
        x: clientWidth / project.output.width,
        y: clientHeight / project.output.height,
      });
    };
    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);
    updateScale();
    return () => observer.disconnect();
  }, [project.output.height, project.output.width]);

  return (
    <div className="pm-stage-frame" ref={frameRef}>
      <div
        className="pm-stage-fit"
        style={{
          height: '100%',
          width: '100%',
        }}
      >
        <div
          className="pm-stage"
          style={{
            background: project.background,
            height: project.output.height,
            transform: `scale(${scale.x}, ${scale.y})`,
            width: project.output.width,
          }}
        >
          {project.layers.map((layer) => (
            <ProjectionSurface
              height={project.output.height}
              key={layer.id}
              layer={layer}
              width={project.output.width}
            />
          ))}
          {children}
        </div>
      </div>
    </div>
  );
}
