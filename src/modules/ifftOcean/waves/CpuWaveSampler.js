const DEFAULT_MODE_COUNT = 192;

export default class CpuWaveSampler {
  constructor({ modeCount = DEFAULT_MODE_COUNT } = {}) {
    this.modeCount = modeCount;
    this.ready = false;
    this.time = 0;
    this.lambda = 1;
    this.count = 0;
  }

  async load({ cascade, renderer }) {
    const spectrum = new Float32Array(
      await renderer.getArrayBufferAsync(cascade.spectrumBuffer)
    );
    const waveData = new Float32Array(
      await renderer.getArrayBufferAsync(cascade.waveDataBuffer)
    );
    const total = Math.min(spectrum.length, waveData.length) / 4;
    const ranked = [];

    for (let index = 0; index < total; index += 1) {
      const offset = index * 4;
      const omega = waveData[offset + 3];
      const h0pr = spectrum[offset];
      const h0pi = spectrum[offset + 1];
      const h0mr = spectrum[offset + 2];
      const h0mi = spectrum[offset + 3];
      const energy = h0pr * h0pr + h0pi * h0pi + h0mr * h0mr + h0mi * h0mi;

      if (omega !== 0 && energy > 0) {
        ranked.push({ energy, index });
      }
    }

    ranked.sort((a, b) => b.energy - a.energy);

    const count = Math.min(this.modeCount, ranked.length);

    this.count = count;
    this.kx = new Float32Array(count);
    this.kz = new Float32Array(count);
    this.invK = new Float32Array(count);
    this.omega = new Float32Array(count);
    this.h0pr = new Float32Array(count);
    this.h0pi = new Float32Array(count);
    this.h0mr = new Float32Array(count);
    this.h0mi = new Float32Array(count);
    this.hr = new Float32Array(count);
    this.hi = new Float32Array(count);

    for (let slot = 0; slot < count; slot += 1) {
      const offset = ranked[slot].index * 4;

      this.kx[slot] = waveData[offset];
      this.invK[slot] = waveData[offset + 1];
      this.kz[slot] = waveData[offset + 2];
      this.omega[slot] = waveData[offset + 3];
      this.h0pr[slot] = spectrum[offset];
      this.h0pi[slot] = spectrum[offset + 1];
      this.h0mr[slot] = spectrum[offset + 2];
      this.h0mi[slot] = spectrum[offset + 3];
    }

    this.lambda = cascade.params.lambda;
    this.ready = true;
    this.setTime(this.time);

    return this;
  }

  setTime(time) {
    this.time = time;

    if (!this.ready) {
      return;
    }

    for (let slot = 0; slot < this.count; slot += 1) {
      const phase = this.omega[slot] * time;
      const cosPhase = Math.cos(phase);
      const sinPhase = Math.sin(phase);

      this.hr[slot] =
        this.h0pr[slot] * cosPhase -
        this.h0pi[slot] * sinPhase +
        this.h0mr[slot] * cosPhase +
        this.h0mi[slot] * sinPhase;
      this.hi[slot] =
        this.h0pr[slot] * sinPhase +
        this.h0pi[slot] * cosPhase -
        this.h0mr[slot] * sinPhase +
        this.h0mi[slot] * cosPhase;
    }
  }

  sampleHeight(x, z) {
    if (!this.ready) {
      return 0;
    }

    let height = 0;

    for (let slot = 0; slot < this.count; slot += 1) {
      const theta = this.kx[slot] * x + this.kz[slot] * z;

      height +=
        this.hr[slot] * Math.cos(theta) - this.hi[slot] * Math.sin(theta);
    }

    return height;
  }

  sampleDisplacement(x, z, target) {
    if (!this.ready) {
      return target.set(0, 0, 0);
    }

    let displacementX = 0;
    let displacementY = 0;
    let displacementZ = 0;

    for (let slot = 0; slot < this.count; slot += 1) {
      const theta = this.kx[slot] * x + this.kz[slot] * z;
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);
      const real = this.hr[slot] * cosTheta - this.hi[slot] * sinTheta;
      const imaginary = this.hr[slot] * sinTheta + this.hi[slot] * cosTheta;
      const steepness = -imaginary * this.invK[slot];

      displacementX += steepness * this.kx[slot];
      displacementY += real;
      displacementZ += steepness * this.kz[slot];
    }

    return target.set(
      displacementX * this.lambda,
      displacementY,
      displacementZ * this.lambda
    );
  }

  sampleNormal(x, z, target, epsilon = 0.35) {
    const left = this.sampleHeight(x - epsilon, z);
    const right = this.sampleHeight(x + epsilon, z);
    const back = this.sampleHeight(x, z - epsilon);
    const front = this.sampleHeight(x, z + epsilon);

    return target.set(left - right, epsilon * 2, back - front).normalize();
  }

  sampleSurfaceHeight(x, z, scratch, iterations = 2) {
    if (!this.ready) {
      return 0;
    }

    let baseX = x;
    let baseZ = z;

    for (let pass = 0; pass < iterations; pass += 1) {
      this.sampleDisplacement(baseX, baseZ, scratch);
      baseX = x - scratch.x;
      baseZ = z - scratch.z;
    }

    this.sampleDisplacement(baseX, baseZ, scratch);

    return scratch.y;
  }

  dispose() {
    this.ready = false;
    this.count = 0;
  }
}
