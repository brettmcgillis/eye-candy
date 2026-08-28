import { parse } from '@babel/parser';

import fs from 'node:fs/promises';
import path from 'node:path';

const SCENES_PATH = path.join('src', 'components', 'scenes');
const PRESET_FILE_PATTERN =
  /\/presets\/(?:index|presets|scenePresets|[^/]+\.presets)\.js$/u;
const SCENE_FOLDER_PATTERN = /^(WebGL|WebGPU|Shared)\/([^/]+)\//u;

function getObjectPropertyName(property) {
  if (property.computed || property.type !== 'ObjectProperty') return null;
  if (property.key.type === 'Identifier') return property.key.name;

  if (
    property.key.type === 'StringLiteral' ||
    property.key.type === 'NumericLiteral'
  ) {
    return String(property.key.value);
  }

  return null;
}

function getObjectKeys(expression) {
  if (expression?.type !== 'ObjectExpression') return [];

  return expression.properties.map(getObjectPropertyName).filter(Boolean);
}

function getVariableObjects(program) {
  const objects = new Map();

  program.body.forEach((statement) => {
    const declaration =
      statement.type === 'ExportNamedDeclaration'
        ? statement.declaration
        : statement;

    if (declaration?.type !== 'VariableDeclaration') return;

    declaration.declarations.forEach((variable) => {
      if (
        variable.id.type === 'Identifier' &&
        variable.init?.type === 'ObjectExpression'
      ) {
        objects.set(variable.id.name, variable.init);
      }
    });
  });

  return objects;
}

function getExportedPresetObjects(program, variableObjects) {
  const presetObjects = [];

  program.body.forEach((statement) => {
    if (statement.type === 'ExportDefaultDeclaration') {
      const expression =
        statement.declaration.type === 'Identifier'
          ? variableObjects.get(statement.declaration.name)
          : statement.declaration;

      if (expression) presetObjects.push(expression);
      return;
    }

    if (statement.type !== 'ExportNamedDeclaration') return;

    if (statement.declaration?.type === 'VariableDeclaration') {
      statement.declaration.declarations.forEach((variable) => {
        if (
          variable.id.type === 'Identifier' &&
          /PRESETS$/u.test(variable.id.name) &&
          variable.init?.type === 'ObjectExpression'
        ) {
          presetObjects.push(variable.init);
        }
      });
    }

    statement.specifiers.forEach((specifier) => {
      const exportedName =
        specifier.exported?.name ?? specifier.exported?.value;

      if (/PRESETS$/u.test(exportedName ?? '')) {
        const expression = variableObjects.get(specifier.local.name);
        if (expression) presetObjects.push(expression);
      }
    });
  });

  return presetObjects;
}

function parsePresetNames(source) {
  const { program } = parse(source, {
    sourceType: 'module',
    plugins: ['jsx'],
  });
  const variableObjects = getVariableObjects(program);
  const presetObjects = getExportedPresetObjects(program, variableObjects);

  return new Set(presetObjects.flatMap(getObjectKeys));
}

export default async function discoverLocalPresets(rootDir) {
  const scenesPath = path.join(rootDir, SCENES_PATH);
  const relativePaths = await fs.readdir(scenesPath, { recursive: true });
  const presetPaths = relativePaths.filter((relativePath) =>
    PRESET_FILE_PATTERN.test(`/${relativePath}`)
  );
  const presetsByFolder = new Map();

  await Promise.all(
    presetPaths.map(async (relativePath) => {
      const folderMatch = relativePath.match(SCENE_FOLDER_PATTERN);
      if (!folderMatch) return;

      const folderKey = `${folderMatch[1]}/${folderMatch[2]}`;
      const source = await fs.readFile(
        path.join(scenesPath, relativePath),
        'utf8'
      );
      const presetNames = presetsByFolder.get(folderKey) ?? new Set();

      parsePresetNames(source).forEach((presetName) =>
        presetNames.add(presetName)
      );
      presetsByFolder.set(folderKey, presetNames);
    })
  );

  return Object.fromEntries(
    Array.from(presetsByFolder, ([folderKey, presetNames]) => [
      folderKey,
      Array.from(presetNames).sort((left, right) => left.localeCompare(right)),
    ]).sort(([left], [right]) => left.localeCompare(right))
  );
}
