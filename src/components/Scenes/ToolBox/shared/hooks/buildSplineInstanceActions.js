import { button, folder } from 'leva';
import * as THREE from 'three';

const defaultMakeNextPoint = (points) => {
  const last = points[points.length - 1];
  const basePos = last?.position ?? new THREE.Vector3(0, 0, 0);
  return {
    position: new THREE.Vector3(
      basePos.x + (Math.random() - 0.5) * 2,
      basePos.y + 0.5 + Math.random(),
      basePos.z + (Math.random() - 0.5) * 2
    ),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1, 1, 1),
  };
};

/**
 * Build the Actions sub-folder ({ Clone, Remove, Add Point, Remove Last Point })
 * for a single spline-bearing instance keyed by id.
 *
 * @param {object} opts
 * @param {string|number} opts.id              Instance id
 * @param {Function}      opts.setInstances    State setter for the instance list
 * @param {string}        opts.keyPrefix       Unique key prefix (e.g. 'ss', 'ps', 'df_fas')
 * @param {string}        [opts.pointsKey]     Field name holding the point array (default 'points')
 * @param {Function}      opts.cloneInstance   (instance) => clonedInstance.
 *                                             Caller is responsible for assigning a fresh id
 *                                             and deep-cloning any nested THREE objects.
 * @param {Function}      [opts.makeNextPoint] (points) => newPoint. Defaults to a small random offset.
 * @returns Leva schema object with one `Actions ${id}` folder.
 */
export default function buildSplineInstanceActions({
  id,
  setInstances,
  keyPrefix,
  pointsKey = 'points',
  cloneInstance,
  makeNextPoint = defaultMakeNextPoint,
}) {
  if (typeof cloneInstance !== 'function') {
    throw new Error(
      'buildSplineInstanceActions: cloneInstance is required (must assign a fresh id and deep-clone points)'
    );
  }

  return {
    [`Actions ${id}`]: folder(
      {
        [`${keyPrefix}_cloneSpline_${id}`]: button(
          () => {
            setInstances((prev) => {
              const source = prev.find((item) => item.id === id);
              if (!source) return prev;
              const cloned = cloneInstance(source);
              return [...prev, cloned];
            });
          },
          { label: 'Clone Spline' }
        ),
        [`${keyPrefix}_removeSpline_${id}`]: button(
          () => {
            setInstances((prev) =>
              prev.length > 1 ? prev.filter((item) => item.id !== id) : prev
            );
          },
          { label: 'Remove Spline' }
        ),
        [`${keyPrefix}_addPoint_${id}`]: button(
          () => {
            setInstances((prev) =>
              prev.map((item) => {
                if (item.id !== id) return item;
                const points = item[pointsKey] ?? [];
                return {
                  ...item,
                  [pointsKey]: [...points, makeNextPoint(points)],
                };
              })
            );
          },
          { label: 'Add Point' }
        ),
        [`${keyPrefix}_removePoint_${id}`]: button(
          () => {
            setInstances((prev) =>
              prev.map((item) => {
                if (item.id !== id) return item;
                const points = item[pointsKey] ?? [];
                return {
                  ...item,
                  [pointsKey]:
                    points.length > 2 ? points.slice(0, -1) : points,
                };
              })
            );
          },
          { label: 'Remove Last Point' }
        ),
      },
      { collapsed: true }
    ),
  };
}
