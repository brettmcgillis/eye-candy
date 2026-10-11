import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { CatalogRequestError } from './service';
import {
  TODO_FILE,
  findTodoPaths,
  normalizeTodoContent,
  parseTodo,
} from './todoFormat.mjs';

const MAX_TODO_BYTES = 1024 * 1024;

function getHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function toSourcePath(rootDir, todoPath) {
  return path
    .relative(rootDir, path.dirname(todoPath))
    .split(path.sep)
    .join('/');
}

async function getAllowedTodoPath(rootDir, sourcePath) {
  const normalizedSourcePath = String(sourcePath ?? '')
    .split('/')
    .join(path.sep);
  const candidate = path.resolve(rootDir, normalizedSourcePath, TODO_FILE);
  const allowedPaths = await findTodoPaths(rootDir);

  if (!allowedPaths.includes(candidate)) {
    throw new CatalogRequestError(
      404,
      'TODO_NOT_FOUND',
      'The requested TODO file was not found.'
    );
  }

  return candidate;
}

async function summarizeTodo(rootDir, todoPath, content) {
  const parsed = parseTodo(content);
  const stats = await fs.stat(todoPath);

  return {
    checkedCount: parsed.tasks.filter((task) => task.checked).length,
    createdAt: stats.birthtime.toISOString(),
    hash: getHash(content),
    issues: parsed.issues,
    openCount: parsed.tasks.filter((task) => !task.checked).length,
    searchText: parsed.plainText,
    sections: parsed.sections.map((section) => section.name),
    sourcePath: toSourcePath(rootDir, todoPath),
    tasks: parsed.tasks,
    title: parsed.title,
    updatedAt: stats.mtime.toISOString(),
  };
}

export async function listSceneTodos(rootDir) {
  const todoPaths = await findTodoPaths(rootDir);

  return Promise.all(
    todoPaths.map(async (todoPath) => {
      const content = await fs.readFile(todoPath, 'utf8');
      return summarizeTodo(rootDir, todoPath, content);
    })
  );
}

export async function readSceneTodo(rootDir, sourcePath) {
  const todoPath = await getAllowedTodoPath(rootDir, sourcePath);
  const content = await fs.readFile(todoPath, 'utf8');
  const parsed = parseTodo(content);

  return {
    ...(await summarizeTodo(rootDir, todoPath, content)),
    content,
    normalizedContent: normalizeTodoContent(content),
    sectionDetails: parsed.sections,
    tasks: parsed.tasks,
  };
}

export async function writeSceneTodo({
  baseHash,
  content,
  rootDir,
  sourcePath,
}) {
  if (
    typeof content !== 'string' ||
    Buffer.byteLength(content) > MAX_TODO_BYTES
  ) {
    throw new CatalogRequestError(
      400,
      'INVALID_TODO_CONTENT',
      'Scene TODO content must be a string smaller than 1 MiB.'
    );
  }

  const todoPath = await getAllowedTodoPath(rootDir, sourcePath);
  const currentContent = await fs.readFile(todoPath, 'utf8');

  if (getHash(currentContent) !== baseHash) {
    throw new CatalogRequestError(
      409,
      'TODO_CONFLICT',
      'This TODO changed on disk. Reload it before saving.'
    );
  }

  const temporaryPath = `${todoPath}.tmp`;
  const nextContent = content.endsWith('\n') ? content : `${content}\n`;
  await fs.writeFile(temporaryPath, nextContent, 'utf8');
  await fs.rename(temporaryPath, todoPath);

  return readSceneTodo(rootDir, sourcePath);
}
