export const _45_deg = radians(45);
export const _90_deg = radians(90);

export function radians(degrees) {
  return degrees * (Math.PI / 180);
}

export function degrees(radians) {
  return radians * (180 / Math.PI);
}

export function getRandomNumber(min, max) {
  const randomFloat = Math.random();
  const randomNumber = min + Math.floor(randomFloat * (max - min));
  return randomNumber;
}
