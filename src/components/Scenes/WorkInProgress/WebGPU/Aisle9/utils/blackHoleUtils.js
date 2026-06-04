import {
  BLACK_HOLE_VARIANT_LEGACY_PORT,
  BLACK_HOLE_VARIANT_SINGULARITY,
} from '../presets/presets';

export default function getActiveLensDiameter(config) {
  switch (config.blackHoleVariant) {
    case BLACK_HOLE_VARIANT_LEGACY_PORT:
      return config.legacyLensDiameter;
    case BLACK_HOLE_VARIANT_SINGULARITY:
      return config.singularityLensDiameter;
    default:
      return config.webgpuLensDiameter;
  }
}
