export const MOUTH_VARIANTS = 4;

function hash01(n) {
  const s = Math.sin(n * 127.1) * 43758.5453123;
  return s - Math.floor(s);
}

export function signedHash(n) {
  return hash01(n) * 2 - 1;
}

// Doorway size is quantised into a small pool because the shaft wall's opening
// has to be cut to match it exactly — free-floating dimensions would reopen the
// gap between hallway and wall. Everything downstream of the doorway can vary
// continuously.
export function mouthVariant(index, variance) {
  if (variance <= 0) return 0;
  return (
    Math.floor(hash01(index * 3.7 + 0.5) * MOUTH_VARIANTS) % MOUTH_VARIANTS
  );
}

export function mouthDimensions(config, variant) {
  const spread = config.variance;
  const t = MOUTH_VARIANTS > 1 ? variant / (MOUTH_VARIANTS - 1) - 0.5 : 0;
  return {
    mouthWidth: config.mouthWidth * (1 + t * 0.7 * spread),
    mouthHeight: config.mouthHeight * (1 + t * 0.55 * spread),
  };
}

export function jitterBranchConfig(config, index, variant) {
  const spread = config.variance;
  const dims = mouthDimensions(config, variant);
  if (spread <= 0) return { ...config, ...dims };
  const j = (salt, amount) =>
    1 + signedHash(index * 7.3 + salt) * amount * spread;
  return {
    ...config,
    ...dims,
    tunnelLength: Math.max(3, config.tunnelLength * j(1, 0.65)),
    roomDepth: Math.max(2, config.roomDepth * j(2, 0.45)),
    roomWidth: Math.max(2, config.roomWidth * j(3, 0.45)),
    roomHeight: Math.max(2.5, config.roomHeight * j(4, 0.3)),
    roomAlong: Math.min(0.85, Math.max(0.15, config.roomAlong * j(5, 0.35))),
  };
}
