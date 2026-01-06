export function radians(deg) {
  return deg * (Math.PI / 180);
}

export function degrees(rads) {
  return rads * (180 / Math.PI);
}

export function getRandomNumber(min, max) {
  const randomFloat = Math.random();
  const randomNumber = min + Math.floor(randomFloat * (max - min));
  return randomNumber;
}

export function sineWave(time, speed, intensity) {
  return Math.sin(time * speed) * intensity;
}

export const fourtyFiveDegrees = radians(45);
export const ninetyDegrees = radians(90);
