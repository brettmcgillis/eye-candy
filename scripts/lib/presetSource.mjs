/* eslint-disable import/no-extraneous-dependencies, no-restricted-syntax, no-await-in-loop, no-continue */
import { parse } from '@babel/parser';

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

import presetValues from '../../src/dev/server/renderJobs/presetValues.mjs';
import { REPO_ROOT } from './loadModules.mjs';

async function sourceFile(specifier, parent) {
  let file = path.resolve(path.dirname(parent), specifier);
  if (specifier.startsWith('@')) {
    const config = JSON.parse(
      await readFile(path.join(REPO_ROOT, 'jsconfig.json'))
    );
    const [alias, ...parts] = specifier.split('/');
    const [target] = config.compilerOptions.paths[alias] ?? [];
    if (!target) throw new Error(`Unknown preset alias: ${alias}`);
    file = path.join(REPO_ROOT, target, ...parts);
  }
  const candidates = [
    file,
    `${file}.js`,
    `${file}.mjs`,
    path.join(file, 'index.js'),
  ];
  const found = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        await access(candidate);
        const text = await readFile(candidate, 'utf8');
        return { file: candidate, text };
      } catch {
        return null;
      }
    })
  );
  const result = found.find(Boolean);
  if (!result) throw new Error(`Cannot find preset source ${specifier}`);
  return result;
}

async function resolveBinding(source, name, seen = new Set()) {
  const id = `${source.file}:${name}`;
  if (seen.has(id)) throw new Error(`Cyclic preset data at ${id}`);
  const next = new Set([...seen, id]);
  const ast = parse(source.text, { sourceType: 'module' });
  for (const statement of ast.program.body) {
    if (statement.type === 'ImportDeclaration') {
      const imported = statement.specifiers.find(
        (item) => item.local.name === name
      );
      if (imported)
        return resolveBinding(
          await sourceFile(statement.source.value, source.file),
          imported.imported?.name ?? 'default',
          next
        );
    }
    if (statement.type === 'ExportNamedDeclaration' && statement.source) {
      const exported = statement.specifiers.find(
        (item) => item.exported.name === name
      );
      if (exported)
        return resolveBinding(
          await sourceFile(statement.source.value, source.file),
          exported.local.name,
          next
        );
    }
    if (statement.type === 'ExportDefaultDeclaration' && name === 'default') {
      if (statement.declaration.type !== 'Identifier')
        throw new Error('Preset collections must be named literal data.');
      return resolveBinding(source, statement.declaration.name, next);
    }
    const declaration = statement.declaration ?? statement;
    if (declaration.type === 'VariableDeclaration') {
      const binding = declaration.declarations.find(
        (item) => item.id.name === name
      );
      if (binding?.init?.type === 'Identifier')
        return resolveBinding(source, binding.init.name, next);
      if (binding) {
        const importedValues = {};
        const referenced = new Set();
        const visit = (node) => {
          if (!node || typeof node !== 'object') return;
          if (node.type === 'Identifier') referenced.add(node.name);
          Object.values(node).forEach((value) => {
            if (Array.isArray(value)) value.forEach(visit);
            else if (value && typeof value === 'object') visit(value);
          });
        };
        visit(binding.init);
        for (const importedStatement of ast.program.body.filter(
          (item) => item.type === 'ImportDeclaration'
        )) {
          for (const imported of importedStatement.specifiers.filter((item) =>
            referenced.has(item.local.name)
          )) {
            if (importedStatement.source.value === '@utils/appUtils') continue;
            const dependency = await sourceFile(
              importedStatement.source.value,
              source.file
            );
            if (!dependency.file.includes('/presets/'))
              throw new Error(
                'Preset values must come from snapshot data files.'
              );
            const resolved = await resolveBinding(
              dependency,
              imported.imported?.name ?? 'default',
              next
            );
            importedValues[imported.local.name] = resolved.values;
          }
        }
        const values = presetValues(source.text, name, {
          allowAssetPaths: true,
          importedValues,
        });
        const hasMetadata = ast.program.body.some(
          (item) =>
            item.type === 'ExportNamedDeclaration' &&
            item.declaration?.declarations?.some(
              (entry) => entry.id.name === 'PRESET_METADATA_KEYS'
            )
        );
        const metadata = hasMetadata
          ? presetValues(source.text, 'PRESET_METADATA_KEYS')
          : [];
        return { file: source.file, metadata, name, values };
      }
    }
  }
  throw new Error(`Cannot resolve literal preset collection ${id}`);
}

export default async function presetSource(entry, source, collectionName) {
  return resolveBinding(
    { file: path.join(REPO_ROOT, entry), text: source },
    collectionName
  );
}
