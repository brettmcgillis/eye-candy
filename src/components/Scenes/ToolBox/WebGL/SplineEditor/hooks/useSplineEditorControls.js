import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import { useEffect, useMemo, useRef } from 'react';

import { localEnv } from '../../../../../../utils/appUtils';
import SPLINE_PRESETS from '../presets/presets';

export default function useSplineEditorControls(pointPositions, setPoints) {
  const controlsSnapshotRef = useRef({});
  const selectedPresetRef = useRef('Default');

  const [
    {
      preset,
      tension,
      closed,
      showUniform,
      showCentripetal,
      showChordal,
      arcSegments,
    },
    setControls,
  ] = useControls(
    'Spline Editor',
    () => ({
      Presets: folder(
        {
          preset: {
            label: 'Preset',
            value: 'Default',
            options: Object.keys(SPLINE_PRESETS),
          },
          reset: button(() => {
            const p = SPLINE_PRESETS[selectedPresetRef.current];
            if (p) {
              setControls({
                tension: p.tension,
                closed: p.closed,
                showUniform: p.showUniform,
                showCentripetal: p.showCentripetal,
                showChordal: p.showChordal,
              });
              setPoints(p.points.map((v) => v.clone()));
            }
          }),
          ...(localEnv()
            ? {
                copy: button(() => {
                  const snap = controlsSnapshotRef.current;
                  const asObjectLiteral = JSON.stringify(snap, null, 2).replace(
                    /"([A-Za-z_$][A-Za-z0-9_$]*)"\s*:/g,
                    '$1:'
                  );
                  navigator.clipboard.writeText(asObjectLiteral);
                }),
              }
            : {}),
        },
        { collapsed: true }
      ),
      Spline: folder(
        {
          tension: {
            label: 'Tension',
            value: SPLINE_PRESETS.Default.tension,
            min: 0,
            max: 1,
            step: 0.01,
          },
          closed: {
            label: 'Closed Loop',
            value: SPLINE_PRESETS.Default.closed,
          },
          arcSegments: {
            label: 'Arc Segments',
            value: 200,
            min: 10,
            max: 500,
            step: 10,
          },
        },
        { collapsed: true }
      ),
      Visibility: folder(
        {
          showUniform: {
            label: 'Uniform (red)',
            value: SPLINE_PRESETS.Default.showUniform,
          },
          showCentripetal: {
            label: 'Centripetal (green)',
            value: SPLINE_PRESETS.Default.showCentripetal,
          },
          showChordal: {
            label: 'Chordal (blue)',
            value: SPLINE_PRESETS.Default.showChordal,
          },
        },
        { collapsed: true }
      ),
      Actions: folder(
        {
          addPoint: button(
            () => {
              setPoints((prev) => {
                const last =
                  prev[prev.length - 1] ?? new THREE.Vector3(0, 0, 0);
                return [
                  ...prev,
                  last
                    .clone()
                    .add(
                      new THREE.Vector3(
                        (Math.random() - 0.5) * 200,
                        Math.random() * 100,
                        (Math.random() - 0.5) * 200
                      )
                    ),
                ];
              });
            },
            { label: 'Add Point' }
          ),
          removeLast: button(
            () => {
              setPoints((prev) => (prev.length > 2 ? prev.slice(0, -1) : prev));
            },
            { label: 'Remove Last' }
          ),
          exportSpline: button(
            () => {
              const pts = controlsSnapshotRef.current.points ?? [];
              const strs = pts.map(
                (p) =>
                  `new THREE.Vector3(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)})`
              );
              const code = `[\n  ${strs.join(',\n  ')}\n]`;
              navigator.clipboard.writeText(code);
            },
            { label: 'Export (copy)' }
          ),
        },
        { collapsed: true }
      ),
    }),
    { store: undefined }
  );

  // Track selected preset name
  useEffect(() => {
    selectedPresetRef.current = preset;
  }, [preset]);

  // Update snapshot ref when controls or points change
  useEffect(() => {
    controlsSnapshotRef.current = {
      tension,
      closed,
      showUniform,
      showCentripetal,
      showChordal,
      points: pointPositions.map((p) => ({ x: p.x, y: p.y, z: p.z })),
    };
  }, [
    tension,
    closed,
    showUniform,
    showCentripetal,
    showChordal,
    pointPositions,
  ]);

  // Apply preset when selection changes
  useEffect(() => {
    const p = SPLINE_PRESETS[preset];
    if (!p) return;
    setControls({
      tension: p.tension,
      closed: p.closed,
      showUniform: p.showUniform,
      showCentripetal: p.showCentripetal,
      showChordal: p.showChordal,
    });
    setPoints(p.points.map((v) => v.clone()));
  }, [preset]); // intentionally omit setControls/setPoints — only re-run on preset change

  return useMemo(
    () => ({
      tension,
      closed,
      arcSegments,
      showUniform,
      showCentripetal,
      showChordal,
    }),
    [tension, closed, arcSegments, showUniform, showCentripetal, showChordal]
  );
}
