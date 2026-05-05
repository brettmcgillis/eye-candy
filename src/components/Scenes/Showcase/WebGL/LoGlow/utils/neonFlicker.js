export default function neonFlicker(
  time,
  baseIntensity = 8,
  flickerIntensity = 2,
  flickerFrequency = 10
) {
  const seconds = time / 1000;
  const noise = Math.random() * flickerIntensity;
  const flickerOscillation = Math.sin(seconds * 2 * Math.PI * flickerFrequency);
  const emissiveIntensity =
    baseIntensity + flickerIntensity * flickerOscillation + noise;

  return Math.max(1, Math.min(10, emissiveIntensity));
}
