#!/usr/bin/env node

/* eslint-disable no-console */
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  TODO_FILE,
  createTodoContent,
  findTodoPaths,
  getBacklink,
  normalizeTodoContent,
  parseTodo,
} from '../src/dev/server/cataloggr/todoFormat.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const USAGE = `Usage:
  npm run todo:new -- <scene-or-tool-dir> "<Name>"
  npm run todo:check -- [dir ...] [--fix]`;

function toTodoPath(dir) {
  const resolved = path.resolve(ROOT, dir);
  return path.basename(resolved) === TODO_FILE
    ? resolved
    : path.join(resolved, TODO_FILE);
}

async function readIfExists(file) {
  try {
    return await fs.readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function createTodo([dir, title]) {
  if (!dir || !title) throw new Error(USAGE);

  const todoPath = toTodoPath(dir);
  const existing = await readIfExists(todoPath);

  if (existing && parseTodo(existing).title !== 'Scene Template') {
    throw new Error(`${path.relative(ROOT, todoPath)} already exists.`);
  }

  const content = createTodoContent(
    title,
    getBacklink(path.dirname(todoPath), ROOT)
  );
  await fs.writeFile(todoPath, content, 'utf8');
  console.log(`wrote ${path.relative(ROOT, todoPath)}`);
}

async function checkTodos(args) {
  const fix = args.includes('--fix');
  const dirs = args.filter((arg) => arg !== '--fix');
  const todoPaths = dirs.length
    ? dirs.map(toTodoPath)
    : await findTodoPaths(ROOT);
  const results = await Promise.all(
    todoPaths.map(async (todoPath) => {
      const relative = path.relative(ROOT, todoPath);
      const content = await readIfExists(todoPath);

      if (content === null) {
        return { issues: ['Missing — run npm run todo:new.'], relative };
      }
      if (!fix || !parseTodo(content).issues.length) {
        return { issues: parseTodo(content).issues, relative };
      }

      const fixed = normalizeTodoContent(content);
      await fs.writeFile(todoPath, fixed, 'utf8');
      console.log(`fixed ${relative}`);
      return { issues: parseTodo(fixed).issues, relative };
    })
  );
  const failures = results.filter(({ issues }) => issues.length).length;

  results
    .filter(({ issues }) => issues.length)
    .forEach(({ issues, relative }) => {
      console.log(`✗ ${relative}`);
      issues.forEach((issue) => console.log(`    ${issue}`));
    });

  console.log(
    `${todoPaths.length - failures}/${todoPaths.length} todo.md files match the Cataloggr shape`
  );
  if (failures) process.exitCode = 1;
}

const [command, ...args] = process.argv.slice(2);
const commands = { check: checkTodos, new: createTodo };

if (!commands[command]) {
  console.error(USAGE);
  process.exit(1);
}

try {
  await commands[command](args);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
