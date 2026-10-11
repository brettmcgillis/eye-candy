const CHANNELS = [
  { cutoff: 3200, detune: 0, level: 1, type: 'sine' },
  { cutoff: 2400, detune: 4, level: 0.8, type: 'triangle' },
  { cutoff: 1500, detune: -4, level: 0.45, type: 'sawtooth' },
];

const VOICE_GAIN = 0.3;
const RAMP = 0.12;

// One always-running oscillator per (region, colour channel); the light
// accumulated in a region only ever moves a gain, never starts a note.
export default function createDroneBank(Tone, output, { cols, midiAt, rows }) {
  const buses = CHANNELS.map((channel) => {
    const filter = new Tone.Filter(channel.cutoff, 'lowpass');
    filter.connect(output);
    return filter;
  });
  const panners = Array.from({ length: cols * CHANNELS.length }, (_, k) => {
    const channel = k % CHANNELS.length;
    const col = Math.floor(k / CHANNELS.length);
    const panner = new Tone.Panner(
      cols > 1 ? (col / (cols - 1)) * 1.6 - 0.8 : 0
    );
    panner.connect(buses[channel]);
    return panner;
  });

  const voices = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const frequency = Tone.Frequency(midiAt(col, row), 'midi').toFrequency();
      CHANNELS.forEach((channel, c) => {
        const osc = new Tone.Oscillator({
          detune: channel.detune,
          frequency,
          type: channel.type,
        });
        const gain = new Tone.Gain(0);
        osc.chain(gain, panners[col * CHANNELS.length + c]);
        osc.start();
        voices.push({ gain, osc });
      });
    }
  }

  return {
    setLevels(levels, master = 1) {
      for (let i = 0; i < voices.length; i += 1) {
        const channel = CHANNELS[i % CHANNELS.length];
        const target =
          Math.min(1, levels[i]) ** 1.4 * VOICE_GAIN * channel.level * master;
        voices[i].gain.gain.rampTo(target, RAMP);
      }
    },
    dispose() {
      voices.forEach(({ gain, osc }) => {
        osc.stop();
        osc.dispose();
        gain.dispose();
      });
      panners.forEach((p) => p.dispose());
      buses.forEach((b) => b.dispose());
    },
  };
}
