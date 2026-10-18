import createOptionSchema, { SHARED_SECTIONS, resolveList } from './schema.mjs';

export { SHARED_SECTIONS, resolveList };
export * from './specs.mjs';
export { IG_PRESETS, default as standard } from './standard.mjs';
export default createOptionSchema;
