/* eslint-disable no-continue */
import { Vector3 } from 'three';

import { makeRng } from './paintStyle';
import { finishRibbons, writeRibbon } from './streamRibbons';

const view = new Vector3();
const a = new Vector3();
const b = new Vector3();
const center = new Vector3();
const tangent = new Vector3();
const offset = new Vector3();
const sphere = new Vector3(0.8, 1.4, 1.2);

export function lightValue(point, normal, light, shadow) {
  let value = Math.max(0, normal.dot(light));
  if (shadow) {
    offset.subVectors(sphere, point);
    const along = offset.dot(light);
    if (along > 0 && offset.lengthSq() - along * along < 0.65 * 0.65)
      value *= 0.12;
  }
  return value;
}

export function hatchSamples(faces, count, seed) {
  const rng = makeRng(seed);
  const areas = faces.map((face) =>
    face.points[1]
      .clone()
      .sub(face.points[0])
      .cross(face.points[2].clone().sub(face.points[0]))
      .length()
  );
  const total = areas.reduce((sum, area) => sum + area, 0);
  const cumulative = [];
  let sum = 0;
  areas.forEach((area) => {
    sum += area / total;
    cumulative.push(sum);
  });
  return Array.from({ length: count }, () => {
    const choice = rng();
    const face =
      faces[cumulative.findIndex((v) => v >= choice)] || faces.at(-1);
    const u = Math.sqrt(rng());
    const v = rng();
    return {
      point: face.points[0]
        .clone()
        .multiplyScalar(1 - u)
        .addScaledVector(face.points[1], u * (1 - v))
        .addScaledVector(face.points[2], u * v)
        .addScaledVector(face.normal, 0.018),
      normal: face.normal,
      threshold: rng(),
    };
  });
}

export function drawContours(geometry, edges, camera, depth, config) {
  let count = 0;
  edges.forEach((edge) => {
    const facing = edge.faces.map(
      (face) => view.subVectors(camera, face.center).dot(face.normal) > 0
    );
    const silhouette = facing.length === 1 || facing[0] !== facing[1];
    const crease =
      edge.faces.length > 1 &&
      edge.faces[0].normal.dot(edge.faces[1].normal) <
        Math.cos((config.contourAngle * Math.PI) / 180);
    if (
      !(config.contourSilhouette && silhouette) &&
      !(config.contourCreases && crease)
    )
      return;
    for (let j = 0; j < 8; j += 1) {
      a.lerpVectors(edge.a, edge.b, j / 8);
      b.lerpVectors(edge.a, edge.b, (j + 1) / 8);
      center.addVectors(a, b).multiplyScalar(0.5);
      const visible = depth.visible(center);
      if (!visible && (!config.contourHidden || j % 2)) continue;
      writeRibbon(
        geometry,
        count,
        a,
        b,
        camera,
        config.contourWidth * (visible ? 1 : 0.45),
        j / 8,
        (j + 1) / 8
      );
      count += 1;
    }
  });
  finishRibbons(geometry, count);
}

export function drawHatching(geometry, samples, camera, light, config) {
  let count = 0;
  const angle = (config.markAngle * Math.PI) / 180;
  samples.forEach(({ point, normal, threshold }) => {
    const shade = lightValue(point, normal, light, config.markShadow);
    if (threshold < shade * 0.92) return;
    for (
      let cross = 0;
      cross < (config.markCross && shade < 0.28 ? 2 : 1);
      cross += 1
    ) {
      tangent.set(
        Math.cos(angle + cross * 1.2),
        Math.sin(angle + cross * 1.2),
        0.25
      );
      tangent
        .addScaledVector(normal, -tangent.dot(normal))
        .normalize()
        .multiplyScalar(config.markLength / 2);
      a.copy(point).sub(tangent);
      b.copy(point).add(tangent);
      writeRibbon(geometry, count, a, b, camera, config.markWidth);
      count += 1;
    }
  });
  finishRibbons(geometry, count);
}
