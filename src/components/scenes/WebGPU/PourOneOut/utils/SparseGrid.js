import {
  Fn,
  Loop,
  float,
  instanceIndex,
  instancedArray,
  int,
  log2,
  mix,
  positionGeometry,
  uniform,
  varying,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { FLUID, SOLID } from '@modules/flip';

import { GRID } from './domain';

function levelDims(base) {
  const dims = [];
  for (let dim = base / 2; dim >= 2; dim /= 2) dims.push(dim);
  return dims;
}

function coordsOf(dim, index) {
  const d = int(dim);
  return {
    x: index.div(d).div(d),
    y: index.div(d).mod(d),
    z: index.mod(d),
  };
}

// A real adaptive octree, which is what the reference actually shows: the leaf
// set tiles the WHOLE volume, so empty space is covered by the largest boxes,
// obstacles pull refinement down to a middle level, and only the fluid drives
// it to the finest.
//
// Each node carries vec2(fluid, solid) occupancy taken straight from the FLIP
// solver's own marker array, max-reduced up the pyramid so a node knows what it
// contains. Reading the solver's classification rather than re-deriving one is
// the point: this is a picture of the grid the pressure solve actually ran on. A node refines while it is still coarser than
// the target level of anything inside it, and a node is DRAWN when it does not
// refine but its parent does — the standard leaf test. Drawing shells around
// content instead (draw where near, skip where the finer level is also near)
// is what left the empty space bare and every box the same size.
export default class SparseGrid {
  constructor(simulator) {
    this.simulator = simulator;
    this.dims = levelDims(simulator.n);

    let offset = 0;
    this.offsets = this.dims.map((dim) => {
      const start = offset;
      offset += dim * dim * dim;
      return start;
    });
    this.total = offset;

    this.uniforms = {
      color: uniform(new THREE.Color('#c8dcff')),
      coarseOpacity: uniform(0.16),
      falloff: uniform(1.1),
      fineOpacity: uniform(0.5),
      fluidLevel: uniform(0),
      margin: uniform(1),
      inset: uniform(0.98),
      solidLevel: uniform(1),
    };

    this.content = [
      instancedArray(this.total, 'vec2').setName('sparseContent'),
      instancedArray(this.total, 'vec2').setName('sparseContentDilated'),
    ];
    this.transforms = instancedArray(this.total, 'vec4').setName('sparseBoxes');

    this.buildKernels();
    this.buildMesh();
  }

  buildKernels() {
    const { dims, offsets } = this;
    const base = this.simulator.n;
    const { marker } = this.simulator.buffers;
    const [raw, near] = this.content;
    // Built at a fixed reach and masked by a uniform, so the halo around the
    // fluid is a live control rather than a kernel rebuild.
    const REACH = 2;

    const flat = (dim, x, y, z) => x.mul(dim).add(y).mul(dim).add(z);

    const classify = Fn(() => {
      const dim = dims[0];
      const { x, y, z } = coordsOf(dim, int(instanceIndex));

      const content = vec2(0).toVar('content');
      Loop({ start: 0, end: 2, type: 'int', name: 'dx' }, ({ dx }) => {
        Loop({ start: 0, end: 2, type: 'int', name: 'dy' }, ({ dy }) => {
          Loop({ start: 0, end: 2, type: 'int', name: 'dz' }, ({ dz }) => {
            const pointer = flat(
              base,
              x.mul(2).add(dx),
              y.mul(2).add(dy),
              z.mul(2).add(dz)
            );
            const kind = marker.element(pointer);
            content.assign(
              content.max(
                vec2(
                  kind.equal(int(FLUID)).select(float(1), float(0)),
                  kind.equal(int(SOLID)).select(float(1), float(0))
                )
              )
            );
          });
        });
      });

      raw.element(int(instanceIndex).add(offsets[0])).assign(content);
    })().compute(dims[0] ** 3);

    const dilate = Fn(() => {
      const dim = dims[0];
      const { x, y, z } = coordsOf(dim, int(instanceIndex));
      const found = vec2(0).toVar('found');

      Loop(
        { start: -REACH, end: REACH + 1, type: 'int', name: 'dx' },
        ({ dx }) => {
          Loop(
            { start: -REACH, end: REACH + 1, type: 'int', name: 'dy' },
            ({ dy }) => {
              Loop(
                { start: -REACH, end: REACH + 1, type: 'int', name: 'dz' },
                ({ dz }) => {
                  const within = float(dx)
                    .abs()
                    .max(float(dy).abs())
                    .max(float(dz).abs())
                    .lessThanEqual(this.uniforms.margin);
                  const neighbour = flat(
                    dim,
                    x.add(dx).clamp(0, dim - 1),
                    y.add(dy).clamp(0, dim - 1),
                    z.add(dz).clamp(0, dim - 1)
                  ).add(offsets[0]);
                  found.assign(
                    found.max(within.select(raw.element(neighbour), vec2(0)))
                  );
                }
              );
            }
          );
        }
      );

      near.element(int(instanceIndex).add(offsets[0])).assign(found);
    })().compute(dims[0] ** 3);

    const reduceUp = dims.slice(1).map((dim, index) => {
      const level = index + 1;
      const childDim = dims[level - 1];
      return Fn(() => {
        const { x, y, z } = coordsOf(dim, int(instanceIndex));
        const found = vec2(0).toVar('found');

        Loop({ start: 0, end: 2, type: 'int', name: 'dx' }, ({ dx }) => {
          Loop({ start: 0, end: 2, type: 'int', name: 'dy' }, ({ dy }) => {
            Loop({ start: 0, end: 2, type: 'int', name: 'dz' }, ({ dz }) => {
              const child = flat(
                childDim,
                x.mul(2).add(dx),
                y.mul(2).add(dy),
                z.mul(2).add(dz)
              ).add(offsets[level - 1]);
              found.assign(found.max(near.element(child)));
            });
          });
        });

        near.element(int(instanceIndex).add(offsets[level])).assign(found);
      })().compute(dim ** 3);
    });

    // A node subdivides while it is still coarser than what it holds wants.
    const refines = (content, level) =>
      content.x
        .greaterThan(0.5)
        .and(this.uniforms.fluidLevel.lessThan(level))
        .or(
          content.y
            .greaterThan(0.5)
            .and(this.uniforms.solidLevel.lessThan(level))
        );

    const emit = dims.map((dim, level) => {
      const boxSize = base / dim;
      const top = level === dims.length - 1;
      return Fn(() => {
        const index = int(instanceIndex);
        const { x, y, z } = coordsOf(dim, index);
        const own = near.element(index.add(offsets[level])).toConst('own');

        const visible = refines(own, level).not().toVar('visible');

        if (!top) {
          const parentDim = dims[level + 1];
          const parent = flat(parentDim, x.div(2), y.div(2), z.div(2)).add(
            offsets[level + 1]
          );
          visible.assign(visible.and(refines(near.element(parent), level + 1)));
        }

        const centre = vec3(float(x), float(y), float(z)).add(0.5).mul(boxSize);
        this.transforms
          .element(index.add(offsets[level]))
          .assign(
            visible.select(
              vec4(centre, float(boxSize).mul(this.uniforms.inset)),
              vec4(0)
            )
          );
      })().compute(dim ** 3);
    });

    this.pipeline = [classify, dilate, ...reduceUp, ...emit];
  }

  buildMesh() {
    const finest = GRID / this.dims[0];
    const steps = Math.max(1, this.dims.length - 1);

    // EdgesGeometry, not `wireframe: true`. Wireframe draws the triangle edges,
    // so every face gets a diagonal across it and a field of boxes turns into
    // unreadable hatching. This is the 12 real edges of the box, same as the
    // stage bounds.
    const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));

    const material = new THREE.LineBasicNodeMaterial({
      depthWrite: false,
      transparent: true,
    });

    const boxSize = varying(float(0), 'vBoxSize');

    material.positionNode = Fn(() => {
      const box = this.transforms.element(instanceIndex).toConst('box');
      boxSize.assign(box.w);
      return positionGeometry.mul(box.w).add(box.xyz);
    })();

    material.colorNode = this.uniforms.color;
    material.opacityNode = Fn(() => {
      const t = log2(boxSize.div(finest).max(1)).div(steps).clamp(0, 1);
      return mix(
        this.uniforms.fineOpacity,
        this.uniforms.coarseOpacity,
        t.pow(this.uniforms.falloff)
      );
    })();

    this.object = new THREE.LineSegments(geometry, material);
    this.object.count = this.total;
    this.object.frustumCulled = false;
    this.object.renderOrder = 2;
  }

  update(config) {
    this.uniforms.color.value.set(config.gridColor);
    this.uniforms.coarseOpacity.value = config.gridCoarseOpacity;
    this.uniforms.falloff.value = config.gridFalloff;
    this.uniforms.fineOpacity.value = config.gridFineOpacity;
    this.uniforms.fluidLevel.value = config.gridFluidLevel;
    this.uniforms.inset.value = config.gridInset;
    this.uniforms.margin.value = config.gridMargin;
    this.uniforms.solidLevel.value = config.gridSolidLevel;
    this.object.visible = config.showGrid;
  }

  compute(renderer) {
    if (!this.object.visible) return;
    renderer.compute(this.pipeline);
  }

  dispose() {
    this.object.geometry.dispose();
    this.object.material.dispose();
  }
}
