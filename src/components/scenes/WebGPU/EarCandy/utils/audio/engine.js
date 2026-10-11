import * as Tone from 'tone';

import { midiToFrequency } from './music';
import { createVoice } from './voices';

const LOOK_AHEAD = 0.03;

// Everything a sub-scene touches goes through this facade, so a view never
// sees whether Tone has been unlocked yet: play() is a no-op until the scene
// audio toggle (a user gesture) has started the context.
export default function createAudio() {
  let nodes = null;
  let enabled = false;
  let running = false;
  let teardownTimer = 0;
  let params = { bpm: 96, delay: 0.2, reverb: 0.3, volume: -10 };
  const voices = new Map();
  const listeners = new Set();

  function applyParams() {
    if (!nodes) return;
    Tone.getTransport().bpm.rampTo(params.bpm, 0.1);
    nodes.reverbSend.gain.rampTo(params.reverb, 0.1);
    nodes.delaySend.gain.rampTo(params.delay, 0.1);
    nodes.master.gain.rampTo(
      enabled ? Tone.dbToGain(params.volume) : 0,
      enabled ? 0.1 : 0.25
    );
  }

  function ensureNodes() {
    if (nodes) return nodes;
    Tone.getContext().lookAhead = LOOK_AHEAD;
    const master = new Tone.Gain(0);
    const limiter = new Tone.Limiter(-1);
    const input = new Tone.Gain(1);
    const dry = new Tone.Gain(1);
    const reverbSend = new Tone.Gain(params.reverb);
    const delaySend = new Tone.Gain(params.delay);
    const reverb = new Tone.Reverb({ decay: 5, preDelay: 0.02 });
    const delay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.38 });
    reverb.wet.value = 1;
    delay.wet.value = 1;
    input.fan(dry, reverbSend, delaySend);
    dry.connect(master);
    reverbSend.chain(reverb, master);
    delaySend.chain(delay, master);
    master.chain(limiter, Tone.getDestination());
    nodes = {
      delay,
      delaySend,
      dry,
      input,
      limiter,
      master,
      reverb,
      reverbSend,
    };
    applyParams();
    return nodes;
  }

  function teardown() {
    voices.forEach((voice) => voice.dispose());
    voices.clear();
    if (nodes) {
      Object.values(nodes).forEach((node) => node.dispose());
      nodes = null;
    }
    Tone.getTransport().stop();
  }

  function getVoice(name) {
    let voice = voices.get(name);
    if (!voice) {
      voice = createVoice(Tone, name);
      voice.out.connect(ensureNodes().input);
      voices.set(name, voice);
    }
    return voice;
  }

  return {
    Tone,

    // Views pull the input from their own effects, which run before the
    // owner's mount effect, so nodes are created on first demand.
    get input() {
      return ensureNodes().input;
    },

    get running() {
      return running;
    },

    mount() {
      clearTimeout(teardownTimer);
      ensureNodes();
    },

    async setEnabled(next) {
      enabled = next;
      if (!next) {
        running = false;
        applyParams();
        return;
      }
      await Tone.start();
      if (!nodes || !enabled) return;
      Tone.getTransport().start();
      running = true;
      applyParams();
    },

    setParams(next) {
      params = { ...params, ...next };
      applyParams();
    },

    now: () => Tone.now(),

    onNote(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    play(voiceName, midi, options = {}) {
      const {
        duration = 0.4,
        offset = 0,
        pan = 0,
        quantize,
        velocity = 0.7,
        x,
        y,
      } = options;
      const live = running && nodes && Tone.getContext().state === 'running';
      let delay = offset;
      if (live && offset === 0 && quantize && quantize !== 'off') {
        const grid = Tone.getTransport().nextSubdivision(quantize);
        if (grid > 0) delay = Math.max(0, grid - Tone.now());
      }
      if (x !== undefined) {
        listeners.forEach((listener) =>
          listener({ delay, midi, velocity, voice: voiceName, x, y })
        );
      }
      if (!live) return;
      getVoice(voiceName).play(
        midiToFrequency(midi),
        duration,
        Tone.now() + delay,
        Math.min(1, Math.max(0.02, velocity)),
        Math.min(1, Math.max(-1, pan))
      );
    },

    // Deferred so a view's own cleanup (which runs after this owner's) still
    // finds live nodes, and so a StrictMode remount can cancel it.
    dispose() {
      running = false;
      clearTimeout(teardownTimer);
      teardownTimer = setTimeout(teardown, 0);
    },
  };
}
