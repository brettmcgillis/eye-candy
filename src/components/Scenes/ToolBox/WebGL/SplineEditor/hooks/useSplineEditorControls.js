import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import { useEffect, useMemo, useRef, useState } from 'react';

import { localEnv } from '../../../../../../utils/appUtils';
import SPLINE_PRESETS from '../../../../../elements/spline/splinePresets';

const DEFAULT_SPLINE_CONFIG = {
  visible: true,
  tension: SPLINE_PRESETS.Default.tension,
  closed: SPLINE_PRESETS.Default.closed,
  arcSegments: 200,
};

function updateSplineConfig(setter, index, key, value) {
  setter((prev) => {
    const next = [...prev];
    next[index] = { ...next[index], [key]: value };
    return next;
  });
}

export default function useSplineEditorControls(splines, setSplines) {
  const controlsSnapshotRef = useRef({});
  const selectedPresetRef = useRef('Default');
  const splinesRef = useRef(splines);
  splinesRef.current = splines;
  const [splineConfigs, setSplineConfigs] = useState(() =>
    splines.map(() => ({ ...DEFAULT_SPLINE_CONFIG }))
  );

  const [
    { preset, showPoints, showUniform, showCentripetal, showChordal },
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
                showPoints: p.showPoints ?? true,
                showUniform: p.showUniform,
                showCentripetal: p.showCentripetal,
                showChordal: p.showChordal,
              });
              setSplines([p.points.map((v) => v.clone())]);
              setSplineConfigs([
                {
                  ...DEFAULT_SPLINE_CONFIG,
                  tension: p.tension,
                  closed: p.closed,
                },
              ]);
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
        const cfg = splineConfigs[index] ?? DEFAULT_SPLINE_CONFIG;
        acc[`Spline ${index + 1}`] = folder(
          {
            [`visible_${index}`]: {
              label: 'Visible',
              value: cfg.visible,
              onChange: (v) =>
                updateSplineConfig(setSplineConfigs, index, 'visible', v),
            },
            [`tension_${index}`]: {
              label: 'Tension',
              value: cfg.tension,
              min: 0,
              max: 1,
              step: 0.01,
              onChange: (v) =>
                updateSplineConfig(setSplineConfigs, index, 'tension', v),
            },
            [`closed_${index}`]: {
              label: 'Closed Loop',
              value: cfg.closed,
              onChange: (v) =>
                updateSplineConfig(setSplineConfigs, index, 'closed', v),
            },
            [`arcSegments_${index}`]: {
              label: 'Arc Segments',
              value: cfg.arcSegments,
              min: 10,
              max: 500,
              step: 10,
              onChange: (v) =>
                updateSplineConfig(setSplineConfigs, index, 'arcSegments', v),
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
      showPoints,
      showUniform,
      showCentripetal,
      showChordal,
      splines: splines.map((pts, i) => ({
        ...(splineConfigs[i] ?? DEFAULT_SPLINE_CONFIG),
        points: pts.map((p) => ({ x: p.x, y: p.y, z: p.z })),
      })),
    };
  }, [
    showPoints,
    showUniform,
    showCentripetal,
    showChordal,
    splines,
    splineConfigs,
  ]);

  // Apply preset when selection changes
  useEffect(() => {
    const p = SPLINE_PRESETS[preset];
    if (!p) return;
    setControls({
      showPoints: p.showPoints ?? true,
      showUniform: p.showUniform,
      showCentripetal: p.showCentripetal,
      showChordal: p.showChordal,
    });
    setSplines([p.points.map((v) => v.clone())]);
    setSplineConfigs([
      { ...DEFAULT_SPLINE_CONFIG, tension: p.tension, closed: p.closed },
    ]);
  }, [preset]); // intentionally omit setControls/setSplines — only re-run on preset change

  // Keep configs array in sync with spline count
  useEffect(() => {
    setSplineConfigs((prev) => {
      if (prev.length === splines.length) return prev;
      return splines.map((_, i) => prev[i] ?? { ...DEFAULT_SPLINE_CONFIG });
    });
  }, [splines.length]);

  return useMemo(
    () => ({
      showPoints,
      showUniform,
      showCentripetal,
      showChordal,
      splineConfigs,
    }),
    [showPoints, showUniform, showCentripetal, showChordal, splineConfigs]
  );
}
