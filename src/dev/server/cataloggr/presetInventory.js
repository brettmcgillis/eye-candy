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

function getVariableInitializers(program) {
  const initializers = new Map();

  program.body.forEach((statement) => {
    const declaration =
      statement.type === 'ExportNamedDeclaration'
        ? statement.declaration
        : statement;

    if (declaration?.type !== 'VariableDeclaration') return;

    declaration.declarations.forEach((variable) => {
      if (variable.id.type === 'Identifier' && variable.init) {
        initializers.set(variable.id.name, variable.init);
      }
    });
  });

  return initializers;
}

function getExportedPresetExpressions(program, variableInitializers) {
  const presetExpressions = [];

  program.body.forEach((statement) => {
    if (statement.type === 'ExportDefaultDeclaration') {
      const expression =
        statement.declaration.type === 'Identifier'
          ? variableInitializers.get(statement.declaration.name)
          : statement.declaration;

      if (expression) presetExpressions.push(expression);
      return;
    }

    if (statement.type !== 'ExportNamedDeclaration') return;

    if (statement.declaration?.type === 'VariableDeclaration') {
      statement.declaration.declarations.forEach((variable) => {
        if (
          variable.id.type === 'Identifier' &&
          /PRESETS$/u.test(variable.id.name) &&
          variable.init
        ) {
          presetExpressions.push(variable.init);
        }
      });
    }

    statement.specifiers.forEach((specifier) => {
      const exportedName =
        specifier.exported?.name ?? specifier.exported?.value;

      if (/PRESETS$/u.test(exportedName ?? '')) {
        const expression = variableInitializers.get(specifier.local.name);
        if (expression) presetExpressions.push(expression);
      }
    });
  });

  return presetExpressions;
}

function parsePresetNames(source) {
  const { program } = parse(source, {
    sourceType: 'module',
    plugins: ['jsx'],
  });
  const variableInitializers = getVariableInitializers(program);
  const presetExpressions = getExportedPresetExpressions(
    program,
    variableInitializers
  );

  return {
    names: new Set(presetExpressions.flatMap(getObjectKeys)),
    requiresModuleLoad: presetExpressions.some(
      (expression) => expression.type !== 'ObjectExpression'
    ),
  };
}

function getModulePresetNames(module) {
  return new Set(
    Object.entries(module)
      .filter(
        ([exportName, value]) =>
          (exportName === 'default' || /PRESETS$/u.test(exportName)) &&
          value &&
          typeof value === 'object' &&
          !Array.isArray(value)
      )
      .flatMap(([, value]) => Object.keys(value))
  );
}

export default async function discoverLocalPresets(
  rootDir,
  { loadPresetModule } = {}
) {
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
      const parsedPresets = parsePresetNames(source);
      let discoveredNames = parsedPresets.names;

      if (loadPresetModule && parsedPresets.requiresModuleLoad) {
        try {
          const modulePath = `/${path.posix.join(SCENES_PATH, relativePath)}`;
          const module = await loadPresetModule(modulePath);
          discoveredNames = getModulePresetNames(module);
        } catch {
          // Static parsing keeps unrelated presets available when SSR loading fails.
        }
      }

      discoveredNames.forEach((presetName) => presetNames.add(presetName));
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
