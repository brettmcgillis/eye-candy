import { parse } from '@babel/parser';

export default function presetValues(
  source,
  name,
  { allowAssetPaths = false, importedValues = {} } = {}
) {
  const bindings = new Map();
  parse(source, { sourceType: 'module' }).program.body.forEach((statement) => {
    const declaration = statement.declaration ?? statement;
    if (declaration.type !== 'VariableDeclaration') return;
    declaration.declarations.forEach(({ id, init }) => {
      if (id.type === 'Identifier') bindings.set(id.name, init);
    });
  });

  function read(node, seen = new Set()) {
    if (!node) throw new Error(`Missing saved preset base "${name}".`);
    if (node.type === 'Identifier' && Object.hasOwn(importedValues, node.name))
      return importedValues[node.name];
    if (node.type === 'Identifier' && !seen.has(node.name)) {
      return read(bindings.get(node.name), new Set([...seen, node.name]));
    }
    if (
      ['StringLiteral', 'NumericLiteral', 'BooleanLiteral'].includes(node.type)
    ) {
      return node.value;
    }
    if (node.type === 'NullLiteral') return null;
    if (node.type === 'UnaryExpression' && node.operator === '-') {
      return -read(node.argument, seen);
    }
    if (
      allowAssetPaths &&
      node.type === 'CallExpression' &&
      [
        'textureFile',
        'imageFile',
        'modelFile',
        'audioFile',
        'fontFile',
        'videoFile',
      ].includes(node.callee.name) &&
      node.arguments.length === 1 &&
      node.arguments[0].type === 'StringLiteral'
    ) {
      const folders = {
        textureFile: 'textures',
        imageFile: 'images',
        modelFile: 'models',
        audioFile: 'audio',
        fontFile: 'fonts',
        videoFile: 'videos',
      };
      return `/${folders[node.callee.name]}/${node.arguments[0].value}`;
    }
    if (node.type === 'ArrayExpression') {
      return node.elements.map((element) => read(element, seen));
    }
    if (node.type === 'ObjectExpression') {
      return node.properties.reduce((values, property) => {
        if (property.type === 'SpreadElement') {
          return { ...values, ...read(property.argument, seen) };
        }
        if (property.type !== 'ObjectProperty' || property.computed) {
          throw new Error(`Preset base "${name}" must contain literal values.`);
        }
        return {
          ...values,
          [property.key.name ?? property.key.value]: read(property.value, seen),
        };
      }, {});
    }
    throw new Error(
      `Preset base "${name}" depends on executable code. Freeze it before saving artwork.`
    );
  }

  return read(bindings.get(name));
}
