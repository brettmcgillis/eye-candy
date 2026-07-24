/* eslint-disable no-bitwise, import/prefer-default-export */
// Faithful port of ~/dev/examples/260308_DifferentialGrowth/src/core/seededRng.ts
// (LCG, deterministic per seed) so growth variation reproduces exactly across
// runs and snapshot restores.
export class SeededRng {
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

  getState() {
    return this.state >>> 0;
  }

  setState(state) {
    this.state = state >>> 0 || 1;
  }
}
