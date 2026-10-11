import { folder } from 'leva';

const titleCase = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// Leva folders generated from an @modules/optionSchema table, so a scene's
// ranges, defaults, labels and visibility cannot drift from its CLI's.
export default function createSchemaFolders({
  collapseGroups = true,
  controls = {},
  folders,
  keys,
  label,
  open = [],
  options,
}) {
  const pathOf = (key) => {
    const { group, section } = options[key];
    return [label, folders[section], ...(group ? group.split('.') : []), key]
      .filter(Boolean)
      .join('.');
  };

  function schemaControl(key, saved) {
    const spec = options[key];
    const value = saved[key] ?? spec.default;
    const base = { label: spec.label };

    if (spec.when) {
      base.render = (get) =>
        Object.entries(spec.when).every(([other, allowed]) =>
          allowed.includes(get(pathOf(other)))
        );
    }
    if (controls[key]) return { ...base, value, ...controls[key] };
    if (spec.type === 'enum') {
      return {
        ...base,
        options: Object.fromEntries(
          spec.choices.map((choice) => [
            spec.choiceLabels?.[choice] ?? titleCase(String(choice)),
            choice,
          ])
        ),
        value,
      };
    }
    if (spec.type === 'number') {
      return { ...base, max: spec.max, min: spec.min, step: spec.step, value };
    }
    if (spec.type === 'seed') return { ...base, value: String(value ?? '') };
    return { ...base, value };
  }

  const toFolders = (node) =>
    Object.fromEntries(
      Object.entries(node).map(([name, entry]) =>
        entry?.isGroup
          ? [
              name,
              folder(toFolders(entry.children), { collapsed: collapseGroups }),
            ]
          : [name, entry]
      )
    );

  function sectionFolder(section, saved, extras, top) {
    const root = { ...top };
    keys
      .filter((key) => options[key].section === section)
      .forEach((key) => {
        const { group } = options[key];
        let level = root;
        (group ? group.split('.') : []).forEach((name) => {
          if (!level[name]) level[name] = { children: {}, isGroup: true };
          level = level[name].children;
        });
        Object.assign(level, extras[key]?.before);
        level[key] = schemaControl(key, saved);
        Object.assign(level, extras[key]?.after);
      });
    return folder(toFolders(root), { collapsed: !open.includes(section) });
  }

  // `extras[key]` places controls (buttons, uploads) before/after a key;
  // `top[section]` places them at the head of a section's folder.
  return (saved = {}, extras = {}, top = {}) =>
    Object.fromEntries(
      Object.entries(folders).map(([section, name]) => [
        name,
        sectionFolder(section, saved, extras, top[section]),
      ])
    );
}
