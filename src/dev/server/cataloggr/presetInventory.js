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
    requiresModuleLoad:
      program.body.some(
        (statement) => statement.type === 'ExpressionStatement'
      ) ||
      presetExpressions.some(
        (expression) =>
          expression.type !== 'ObjectExpression' ||
          expression.properties.some(
            (property) => property.type === 'SpreadElement'
          )
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

function findPresetsFolderCalls(program) {
  const calls = [];

  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'Identifier' &&
      node.callee.name === 'usePresetsFolder' &&
      node.arguments[0]?.type === 'ObjectExpression'
    ) {
      const presets = node.arguments[0].properties.find(
        (property) => getObjectPropertyName(property) === 'presets'
      )?.value;
      if (presets?.type === 'Identifier') calls.push(presets.name);
    }
    Object.values(node).forEach((value) => {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    });
  }

  visit(program);
  return calls;
}

function findImport(program, localName) {
  const statement = program.body.find(
    (item) =>
      item.type === 'ImportDeclaration' &&
      item.specifiers.some((specifier) => specifier.local.name === localName)
  );
  if (!statement) return null;
  const specifier = statement.specifiers.find(
    (item) => item.local.name === localName
  );

  return {
    exportName:
      specifier.type === 'ImportDefaultSpecifier'
        ? 'default'
        : (specifier.imported?.name ?? specifier.imported?.value),
    source: statement.source.value,
  };
}

// Follows each usePresetsFolder({ presets }) argument to the module the hook
// imports it from, so Cataloggr lists exactly the collection the hook gets.
async function discoverHookPresets(
  scenesPath,
  relativePaths,
  { loadPresetModule, resolvePresetModule }
) {
  const hookPaths = relativePaths.filter(
    (relativePath) =>
      /\.jsx?$/u.test(relativePath) &&
      SCENE_FOLDER_PATTERN.test(relativePath.split(path.sep).join('/'))
  );
  const presetsByFolder = new Map();

  await Promise.all(
    hookPaths.map(async (relativePath) => {
      const filePath = path.join(scenesPath, relativePath);
      const source = await fs.readFile(filePath, 'utf8');
      if (!source.includes('usePresetsFolder(')) return;

      let program;
      try {
        ({ program } = parse(source, {
          sourceType: 'module',
          plugins: ['jsx'],
        }));
      } catch {
        return;
      }

      const [, renderer, scene] = relativePath
        .split(path.sep)
        .join('/')
        .match(SCENE_FOLDER_PATTERN);
      const folderKey = `${renderer}/${scene}`;

      await Promise.all(
        findPresetsFolderCalls(program).map(async (localName) => {
          const imported = findImport(program, localName);
          if (!imported) {
            const local = getVariableInitializers(program).get(localName);
            const names = getObjectKeys(local);
            if (!names.length) return;
            const known = presetsByFolder.get(folderKey) ?? new Set();
            names.forEach((name) => known.add(name));
            presetsByFolder.set(folderKey, known);
            return;
          }
          try {
            const moduleId = await resolvePresetModule(
              imported.source,
              filePath
            );
            if (!moduleId) return;
            const collection = (await loadPresetModule(moduleId))[
              imported.exportName
            ];
            if (
              !collection ||
              typeof collection !== 'object' ||
              Array.isArray(collection)
            )
              return;
            const names = presetsByFolder.get(folderKey) ?? new Set();
            Object.keys(collection).forEach((name) => names.add(name));
            presetsByFolder.set(folderKey, names);
          } catch {
            // The filename-based discovery below still covers this scene.
          }
        })
      );
    })
  );

  return presetsByFolder;
}

export default async function discoverLocalPresets(
  rootDir,
  { loadPresetModule, resolvePresetModule } = {}
) {
  const scenesPath = path.join(rootDir, SCENES_PATH);
  const relativePaths = await fs.readdir(scenesPath, { recursive: true });
  const hookPresets =
    loadPresetModule && resolvePresetModule
      ? await discoverHookPresets(scenesPath, relativePaths, {
          loadPresetModule,
          resolvePresetModule,
        })
      : new Map();
  const presetPaths = relativePaths.filter((relativePath) =>
    PRESET_FILE_PATTERN.test(`/${relativePath}`)
  );
  const presetsByFolder = new Map();

  await Promise.all(
    presetPaths.map(async (relativePath) => {
      const folderMatch = relativePath.match(SCENE_FOLDER_PATTERN);
      if (!folderMatch) return;

      const folderKey = `${folderMatch[1]}/${folderMatch[2]}`;
      if (hookPresets.has(folderKey)) return;
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

  hookPresets.forEach((presetNames, folderKey) =>
    presetsByFolder.set(folderKey, presetNames)
  );

  return Object.fromEntries(
    Array.from(presetsByFolder, ([folderKey, presetNames]) => [
      folderKey,
      Array.from(presetNames).sort((left, right) => left.localeCompare(right)),
    ]).sort(([left], [right]) => left.localeCompare(right))
  );
}
