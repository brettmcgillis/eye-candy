import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import { useEffect, useMemo, useRef, useState } from 'react';

import { localEnv } from '../../../../../../utils/appUtils';
import SPLINE_PRESETS from '../../../../../elements/spline/splinePresets';

export default function useSplineEditorControls(splines, setSplines) {
  const controlsSnapshotRef = useRef({});
  const selectedPresetRef = useRef('Default');
  const splinesRef = useRef(splines);
  splinesRef.current = splines;
  const [splineVisibility, setSplineVisibility] = useState(() =>
    splines.map(() => true)
  );

  const [
    {
      preset,
      tension,
      closed,
      showPoints,
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
                showPoints: p.showPoints ?? true,
                showUniform: p.showUniform,
                showCentripetal: p.showCentripetal,
                showChordal: p.showChordal,
              });
              setSplines([p.points.map((v) => v.clone())]);
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
          showPoints: {
            label: 'Show Points',
            value: SPLINE_PRESETS.Default.showPoints,
          },
          showUniform: {
            label: 'Uniform',
            value: SPLINE_PRESETS.Default.showUniform,
          },
          showCentripetal: {
            label: 'Centripetal',
            value: SPLINE_PRESETS.Default.showCentripetal,
          },
          showChordal: {
            label: 'Chordal',
            value: SPLINE_PRESETS.Default.showChordal,
          },
        },
        { collapsed: true }
      ),
      Actions: folder(
        {
          addSpline: button(
            () => {
              setSplines((prev) => [
                ...prev,
                [
                  new THREE.Vector3(
                    (Math.random() - 0.5) * 400,
                    Math.random() * 200,
                    (Math.random() - 0.5) * 400
                  ),
                  new THREE.Vector3(
                    (Math.random() - 0.5) * 400,
                    Math.random() * 200,
                    (Math.random() - 0.5) * 400
                  ),
                  new THREE.Vector3(
                    (Math.random() - 0.5) * 400,
                    Math.random() * 200,
                    (Math.random() - 0.5) * 400
                  ),
                ],
              ]);
            },
            { label: 'Add Spline' }
          ),
          removeSpline: button(
            () => {
              setSplines((prev) =>
                prev.length > 1 ? prev.slice(0, -1) : prev
              );
            },
            { label: 'Remove Spline' }
          ),
          exportSplines: button(
            () => {
              const all = splinesRef.current;
              const splinesCode = all
                .map((pts) => {
                  const strs = pts.map(
                    (p) =>
                      `    new THREE.Vector3(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)})`
                  );
                  return `  [\n${strs.join(',\n')}\n  ]`;
                })
                .join(',\n');
              const code = `[\n${splinesCode}\n]`;
              navigator.clipboard.writeText(code);
            },
            { label: 'Export (copy)' }
          ),
        },
        { collapsed: true }
      ),
      // Per-spline folders — rebuilt when spline count changes
      ...splines.reduce((acc, _, index) => {
        acc[`Spline ${index + 1}`] = folder(
          {
            [`visible_${index}`]: {
              label: 'Visible',
              value: true,
              onChange: (v) =>
                setSplineVisibility((prev) => {
                  const next = [...prev];
                  next[index] = v;
                  return next;
                }),
            },
            [`addPoint_${index}`]: button(
              () => {
                setSplines((prev) =>
                  prev.map((pts, i) => {
                    if (i !== index) return pts;
                    const last =
                      pts[pts.length - 1] ?? new THREE.Vector3(0, 0, 0);
                    return [
                      ...pts,
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
                  })
                );
              },
              { label: 'Add Point' }
            ),
            [`removePoint_${index}`]: button(
              () => {
                setSplines((prev) =>
                  prev.map((pts, i) => {
                    if (i !== index) return pts;
                    return pts.length > 2 ? pts.slice(0, -1) : pts;
                  })
                );
              },
              { label: 'Remove Last Point' }
            ),
          },
          { collapsed: false }
        );
        return acc;
      }, {}),
    }),
    [splines.length]
  );

  // Track selected preset name
  useEffect(() => {
    selectedPresetRef.current = preset;
  }, [preset]);

  // Update snapshot ref when controls or splines change
  useEffect(() => {
    controlsSnapshotRef.current = {
      tension,
      closed,
      showPoints,
      showUniform,
      showCentripetal,
      showChordal,
      splines: splines.map((pts) =>
        pts.map((p) => ({ x: p.x, y: p.y, z: p.z }))
      ),
    };
  }, [
    tension,
    closed,
    showPoints,
    showUniform,
    showCentripetal,
    showChordal,
    splines,
  ]);

  // Apply preset when selection changes
  useEffect(() => {
    const p = SPLINE_PRESETS[preset];
    if (!p) return;
    setControls({
      tension: p.tension,
      closed: p.closed,
      showPoints: p.showPoints ?? true,
      showUniform: p.showUniform,
      showCentripetal: p.showCentripetal,
      showChordal: p.showChordal,
    });
    setSplines([p.points.map((v) => v.clone())]);
    setSplineVisibility([true]);
  }, [preset]); // intentionally omit setControls/setSplines — only re-run on preset change

  // Keep visibility array in sync with spline count
  useEffect(() => {
    setSplineVisibility((prev) => {
      if (prev.length === splines.length) return prev;
      const next = splines.map((_, i) => prev[i] ?? true);
      return next;
    });
  }, [splines.length]);

  return useMemo(
    () => ({
      tension,
      closed,
      arcSegments,
      showPoints,
      showUniform,
      showCentripetal,
      showChordal,
      splineVisibility,
    }),
    [
      tension,
      closed,
      arcSegments,
      showPoints,
      showUniform,
      showCentripetal,
      showChordal,
      splineVisibility,
    ]
  );
}
