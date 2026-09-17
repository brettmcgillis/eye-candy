import { generatorDefaults } from './renderOptions.mjs';

export const DEFAULT_PARAMS = generatorDefaults();

export function resolveParams(params = {}) {
  const resolved = { ...DEFAULT_PARAMS };

  Object.keys(DEFAULT_PARAMS).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      resolved[key] = params[key];
    }
  });

  return resolved;
}
