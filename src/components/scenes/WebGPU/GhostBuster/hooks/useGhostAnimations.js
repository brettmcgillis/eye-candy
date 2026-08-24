import { useCallback, useRef } from 'react';

const JUMP_SQUASH_DUR = 0.15;
const JUMP_STRETCH_DUR = 0.2;
const JUMP_SETTLE_DUR = 0.3;
const JUMP_TOTAL = JUMP_SQUASH_DUR + JUMP_STRETCH_DUR + JUMP_SETTLE_DUR;

const ECCTRL_PROFILES = {
  idle: { bobMul: 1, tiltMul: 0, windMul: 1 },
  walk: { bobMul: 0.7, tiltMul: 0.4, windMul: 1.5 },
  run: { bobMul: 0.5, tiltMul: 0.8, windMul: 3 },
  jump: { bobMul: 0, tiltMul: 0.2, windMul: 2, squash: 1.25, windDirY: -0.4 },
  jumpIdle: { bobMul: 0, tiltMul: 0.1, windMul: 0.5, squash: 1.05 },
  jumpLand: {
    bobMul: 0,
    tiltMul: 0.3,
    windMul: 2.5,
    squash: 0.75,
    windDirY: 0.3,
  },
  fall: { bobMul: 0, tiltMul: 0.1, windMul: 1.5, squash: 1.15, windDirY: 0.5 },
};

export default function useGhostAnimations(config = {}) {
  const configRef = useRef(config);
  configRef.current = config;

  const stateRef = useRef({
    time: 0,
    jumpTime: -1,
    prevWindDirX: 0,
    prevWindDirZ: 0,
    bankX: 0,
    bankZ: 0,
  });

  const resultRef = useRef({
    bob: 0,
    tiltX: 0,
    tiltZ: 0,
    squash: 1,
    wind: 0,
    windDirX: 1,
    windDirY: 0,
    windDirZ: 0,
    jumpPhase: 0,
  });

  return useCallback((delta, input = {}) => {
    const {
      bobAmplitude = 0.03,
      bobSpeed = 2,
      swayAmplitude = 0.02,
      tiltIntensity = 0.3,
      baseWind = 0.3,
      windBoostMul = 2,
      squashIntensity = 0.3,
    } = configRef.current;

    const {
      windDirX: inputDirX = 0,
      windDirZ: inputDirZ = 0,
      windStrength = 0,
      jumpTriggered = false,
      curAnimation,
      velocity,
    } = input;

    const state = stateRef.current;
    const result = resultRef.current;
    const dt = Math.min(delta, 1 / 30);
    state.time += dt;

    // ── Ecctrl state mode ──
    if (curAnimation !== undefined) {
      const profile = ECCTRL_PROFILES[curAnimation] || ECCTRL_PROFILES.idle;
      const speed = velocity
        ? Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z)
        : 0;

      result.bob =
        Math.sin(state.time * bobSpeed * Math.PI * 2) *
        bobAmplitude *
        profile.bobMul;
      result.tiltX = velocity
        ? -velocity.z * tiltIntensity * profile.tiltMul
        : 0;
      result.tiltZ = velocity
        ? velocity.x * tiltIntensity * profile.tiltMul
        : 0;
      result.squash = profile.squash ?? 1;
      result.wind = baseWind * profile.windMul + speed * windBoostMul;
      result.windDirY = profile.windDirY ?? 0;
      result.jumpPhase = 0;

      if (speed > 0.01 && velocity) {
        result.windDirX = velocity.x / speed;
        result.windDirZ = velocity.z / speed;
      } else {
        result.windDirX = 1;
        result.windDirZ = 0;
      }

      return result;
    }

    // ── Canned mode (GhostBuster) ──

    // Idle bob
    result.bob = Math.sin(state.time * bobSpeed * Math.PI * 2) * bobAmplitude;

    // Sway (offset frequencies for organic feel)
    const swayX =
      Math.sin(state.time * bobSpeed * 0.7 * Math.PI * 2) * swayAmplitude;
    const swayZ =
      Math.sin(state.time * bobSpeed * 0.5 * Math.PI * 2 + 1.3) * swayAmplitude;

    // Wind
    const effectiveWind = baseWind + windStrength * windBoostMul;
    let wdx = inputDirX;
    let wdz = inputDirZ;
    if (windStrength < 0.001) {
      wdx = 1;
      wdz = 0;
    }

    // Turn bank overshoot
    const dirChangeX = wdx * windStrength - state.prevWindDirX;
    const dirChangeZ = wdz * windStrength - state.prevWindDirZ;
    state.bankX += dirChangeX * 0.5;
    state.bankZ += dirChangeZ * 0.5;
    state.bankX *= Math.exp(-8 * dt);
    state.bankZ *= Math.exp(-8 * dt);
    state.prevWindDirX = wdx * windStrength;
    state.prevWindDirZ = wdz * windStrength;

    // Tilt
    const tiltInputX = inputDirX * windStrength;
    const tiltInputZ = inputDirZ * windStrength;
    result.tiltX =
      -tiltInputZ * tiltIntensity + state.bankZ * 0.3 + swayX * 0.3;
    result.tiltZ = tiltInputX * tiltIntensity + state.bankX * 0.3 + swayZ * 0.3;

    // Jump
    if (jumpTriggered && state.jumpTime < 0) {
      state.jumpTime = 0;
    }

    result.squash = 1;
    result.jumpPhase = 0;
    result.windDirY = 0;

    if (state.jumpTime >= 0) {
      const t = state.jumpTime;
      state.jumpTime += dt;

      if (t < JUMP_SQUASH_DUR) {
        const p = t / JUMP_SQUASH_DUR;
        result.squash = 1 - squashIntensity * Math.sin(p * Math.PI * 0.5);
        result.jumpPhase = p * 0.33;
        result.windDirY = 0.3;
      } else if (t < JUMP_SQUASH_DUR + JUMP_STRETCH_DUR) {
        const p = (t - JUMP_SQUASH_DUR) / JUMP_STRETCH_DUR;
        result.squash = 1 + squashIntensity * 0.8 * Math.sin(p * Math.PI);
        result.jumpPhase = 0.33 + p * 0.34;
        result.windDirY = -0.4;
      } else if (t < JUMP_TOTAL) {
        const p = (t - JUMP_SQUASH_DUR - JUMP_STRETCH_DUR) / JUMP_SETTLE_DUR;
        result.squash =
          1 + squashIntensity * 0.2 * Math.sin(p * Math.PI) * (1 - p);
        result.jumpPhase = 0.67 + p * 0.33;
        result.windDirY = 0.2 * (1 - p);
      } else {
        state.jumpTime = -1;
      }
    }

    result.wind = effectiveWind;
    result.windDirX = wdx;
    result.windDirZ = wdz;

    return result;
  }, []);
}
