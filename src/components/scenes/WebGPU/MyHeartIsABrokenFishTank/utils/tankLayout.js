const MIN_INNER_SIZE = 0.2;
const MIN_INNER_HEIGHT = 0.12;
const MIN_WATER_HEIGHT = 0.08;
const MIN_SWIM_HEIGHT = 0.14;
export const MODEL_SAND_HEIGHT = 0.18;

function getTankLayout(tank) {
  const innerWidth = Math.max(
    tank.width - tank.glassThickness * 2 - tank.waterInset * 2,
    MIN_INNER_SIZE
  );
  const innerDepth = Math.max(
    tank.depth - tank.glassThickness * 2 - tank.waterInset * 2,
    MIN_INNER_SIZE
  );
  const innerHeight = Math.max(
    tank.height - tank.glassThickness * 2 - MODEL_SAND_HEIGHT - tank.waterInset,
    MIN_INNER_HEIGHT
  );
  const waterHeight = Math.max(MIN_WATER_HEIGHT, innerHeight * tank.waterLevel);
  const sandY = -tank.height / 2 + MODEL_SAND_HEIGHT / 2;
  const waterY = -tank.height / 2 + MODEL_SAND_HEIGHT + waterHeight / 2;
  const minFishY = -tank.height / 2 + MODEL_SAND_HEIGHT + 0.12;
  const maxFishY = minFishY + Math.max(MIN_SWIM_HEIGHT, waterHeight - 0.16);

  return {
    innerDepth,
    innerHeight,
    innerWidth,
    maxFishY,
    minFishY,
    sandY,
    waterHeight,
    waterY,
  };
}

export default getTankLayout;
