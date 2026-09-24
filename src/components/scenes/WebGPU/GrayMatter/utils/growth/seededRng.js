/* eslint-disable no-bitwise */
// Port of 260316_DifferentialLayers/src/core/seededRng.ts.
export default class SeededRng {
  constructor(seed) {
    this.state = seed >>> 0 || 1;
  }

  next() {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0xffffffff;
  }

  signed() {
    return this.next() * 2 - 1;
  }
}
