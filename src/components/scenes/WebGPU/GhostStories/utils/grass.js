// Blades skip worn paths and water, and shrink toward path edges and shores.
export default function sampleGrassGround(world, worldX, worldZ) {
  const path = world.samplePath(worldX, worldZ);
  if (path > 0.55) {
    return null;
  }
  const height = world.sampleHeight(worldX, worldZ);
  if (height < world.waterLevel + 0.05) {
    return null;
  }
  const pathShrink = 1 - path * 0.8;
  const shoreShrink = 1 - world.sampleShore(worldX, worldZ) * 0.5 * (1 - path);
  return { height, scale: pathShrink * shoreShrink };
}
