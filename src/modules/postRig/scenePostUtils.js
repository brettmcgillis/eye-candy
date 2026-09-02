export const SCENE_POST_TYPES = Object.freeze({
  bloom: 'bloom',
  dof: 'dof',
  godrays: 'godrays',
});

export const DOF_FOCUS_MODES = Object.freeze(['manual', 'target', 'pointer']);

function toPascalCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getPostSlotPrefix(slotId) {
  return `post${toPascalCase(slotId)}`;
}

export function isPostControlKey(key) {
  return /^post[A-Z]/.test(key);
}

// Scene controls objects change identity on every Leva edit, so
// buildPost(controls) can't be memoized on `controls` directly — any unrelated
// edit would tear down and rebuild the render pipeline. Memoize on this key.
export function getPostControlsKey(controls = {}) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(controls).filter(([key]) => isPostControlKey(key))
    )
  );
}

export function normalizeScenePostDeclaration(post = {}) {
  const slots = post?.slots ?? post ?? {};

  return {
    enabled: post?.enabled ?? true,
    // Declaration order is the composition order of the chain.
    slots: Object.entries(slots).map(([id, declaration]) => ({
      enabled: declaration?.enabled ?? true,
      id,
      label: declaration?.label ?? toPascalCase(id),
      prefix: getPostSlotPrefix(id),
      type: declaration?.type ?? id,
      ...declaration,
    })),
  };
}

export function buildScenePostRuntimeConfig(declaration, controls = {}) {
  const normalized = normalizeScenePostDeclaration(declaration);

  return {
    enabled: controls.postEnabled ?? normalized.enabled,
    slots: normalized.slots.map((slot) => ({
      ...slot,
      enabled: controls[`${slot.prefix}Enabled`] ?? slot.enabled,
    })),
  };
}
