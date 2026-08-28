import { toString } from 'mdast-util-to-string';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

import { CatalogRequestError } from './service';

const TODO_ROOTS = [
  path.join('src', 'components', 'scenes'),
  path.join('src', 'dev', 'tools'),
];
const TODO_FILE = 'todo.md';
const MAX_TODO_BYTES = 1024 * 1024;

export const TODO_SECTIONS = [
  'Intent / Use Cases',
  'TODO',
  'Presets',
  'Features',
  'Interactivity',
  'Bugs',
];

const SECTION_ALIASES = new Map([
  ['intent', 'Intent / Use Cases'],
  ['intent use cases', 'Intent / Use Cases'],
  ['todo', 'TODO'],
  ['presets', 'Presets'],
  ['features', 'Features'],
  ['interactivity', 'Interactivity'],
  ['bugs', 'Bugs'],
]);

function getHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function normalizeHeading(value) {
  return value
    .replace(/^\/\/\s*/u, '')
    .replace(/:$/u, '')
    .replace(/[/_-]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLowerCase();
}

function getCanonicalSection(value) {
  return SECTION_ALIASES.get(normalizeHeading(value)) ?? null;
}

function getNodeOffset(node, edge) {
  return node.position?.[edge]?.offset ?? null;
}

function getMarkdownTree(content) {
  const parser = unified().use(remarkParse).use(remarkGfm);
  return parser.runSync(parser.parse(content));
}

function findSectionForOffset(sections, offset) {
  let currentSection = null;

  sections.forEach((section) => {
    if (section.startOffset <= offset) currentSection = section.name;
  });

  return currentSection;
}

function parseTodo(content) {
  const tree = getMarkdownTree(content);
  const headings = tree.children.filter((node) => node.type === 'heading');
  const titleNode = headings[0];
  const sections = headings
    .map((node) => ({
      canonicalName: getCanonicalSection(toString(node)),
      depth: node.depth,
      endOffset: getNodeOffset(node, 'end'),
      rawName: toString(node),
      startOffset: getNodeOffset(node, 'start'),
    }))
    .filter((heading) => heading.canonicalName)
    .map((heading) => ({
      depth: heading.depth,
      endOffset: heading.endOffset,
      name: heading.canonicalName,
      rawName: heading.rawName,
      startOffset: heading.startOffset,
    }));
  const tasks = [];

  function visit(node) {
    if (node.type === 'listItem' && typeof node.checked === 'boolean') {
      const startOffset = getNodeOffset(node, 'start');
      const endOffset = getNodeOffset(node, 'end');
      const paragraph = node.children?.find(
        (child) => child.type === 'paragraph'
      );
      const paragraphEndOffset = paragraph
        ? getNodeOffset(paragraph, 'end')
        : null;
      const markerMatch =
        startOffset !== null && paragraphEndOffset !== null
          ? content
              .slice(startOffset, paragraphEndOffset)
              .match(/^\s*[-*+]\s+\[[ xX]\]\s*/u)
          : null;

      if (
        startOffset !== null &&
        endOffset !== null &&
        paragraphEndOffset !== null &&
        markerMatch
      ) {
        const textStartOffset = startOffset + markerMatch[0].length;
        tasks.push({
          checked: node.checked,
          endOffset,
          section: findSectionForOffset(sections, startOffset),
          startOffset,
          text: content.slice(textStartOffset, paragraphEndOffset),
          textEndOffset: paragraphEndOffset,
          textStartOffset,
        });
      }
    }

    node.children?.forEach(visit);
  }

  visit(tree);

  const canonicalNames = sections.map((section) => section.name);
  const canonicalOrder = canonicalNames
    .map((name) => TODO_SECTIONS.indexOf(name))
    .filter((index) => index >= 0);
  const issues = [];
  const backlinkPattern = /^\[Back to main TODO\]\(([^)]+)\)$/mu;

  if (
    !titleNode ||
    titleNode.depth !== 1 ||
    !toString(titleNode).startsWith('//')
  ) {
    issues.push('Title must use `# // Name`.');
  }
  if (!backlinkPattern.test(content)) {
    issues.push('Missing the root TODO backlink.');
  }
  if (sections.some((section) => section.depth !== 2)) {
    issues.push('Standard sections must use H2 headings.');
  }
  if (new Set(canonicalNames).size !== canonicalNames.length) {
    issues.push('Standard sections must not be duplicated.');
  }
  if (
    canonicalOrder.some(
      (value, index) => index && value < canonicalOrder[index - 1]
    )
  ) {
    issues.push('Standard sections are out of canonical order.');
  }
  if (
    headings
      .slice(1)
      .some(
        (heading) =>
          heading.depth <= 2 && !getCanonicalSection(toString(heading))
      )
  ) {
    issues.push(
      'Custom top-level headings must be nested under a standard section.'
    );
  }

  return {
    issues,
    plainText: toString(tree),
    sections,
    tasks,
    title: titleNode
      ? toString(titleNode).replace(/^\/\/\s*/u, '')
      : 'Untitled',
  };
}

function normalizeSectionBody(content, startOffset, endOffset, headings) {
  const body = content.slice(startOffset, endOffset);
  const edits = headings
    .filter(
      (heading) =>
        heading.depth <= 2 &&
        getNodeOffset(heading, 'start') >= startOffset &&
        getNodeOffset(heading, 'end') <= endOffset
    )
    .map((heading) => ({
      end: getNodeOffset(heading, 'end') - startOffset,
      replacement: `### ${toString(heading).replace(/^\/\/\s*/u, '')}`,
      start: getNodeOffset(heading, 'start') - startOffset,
    }))
    .sort((left, right) => right.start - left.start);

  return edits
    .reduce(
      (result, edit) =>
        result.slice(0, edit.start) + edit.replacement + result.slice(edit.end),
      body
    )
    .replace(/^\[Back to main TODO\]\([^)]+\)\s*$/gmu, '')
    .trim();
}

export function normalizeTodoContent(content) {
  const tree = getMarkdownTree(content);
  const headings = tree.children.filter((node) => node.type === 'heading');
  const titleNode = headings[0];
  const alternateTitleNode =
    titleNode &&
    !toString(titleNode).startsWith('//') &&
    headings[1] &&
    toString(headings[1]).startsWith('//') &&
    !getCanonicalSection(toString(headings[1]))
      ? headings[1]
      : null;
  const titleSource = alternateTitleNode ?? titleNode;
  const title = titleSource
    ? toString(titleSource).replace(/^\/\/\s*/u, '')
    : 'Untitled';
  const backlink =
    content.match(/^\[Back to main TODO\]\([^)]+\)$/mu)?.[0] ??
    '[Back to main TODO](../../../../../TODO.md)';
  const sections = headings
    .map((heading) => ({
      endOffset: getNodeOffset(heading, 'end'),
      heading,
      name: getCanonicalSection(toString(heading)),
      startOffset: getNodeOffset(heading, 'start'),
    }))
    .filter((section) => section.name);
  const firstSectionOffset = sections[0]?.startOffset ?? content.length;
  const titleEndOffset = titleNode ? getNodeOffset(titleNode, 'end') : 0;
  const preamble = normalizeSectionBody(
    content,
    titleEndOffset,
    firstSectionOffset,
    headings
  )
    .replace(`### ${title}`, '')
    .trim();
  const groupedBodies = new Map(TODO_SECTIONS.map((section) => [section, []]));

  if (preamble) groupedBodies.get('Intent / Use Cases').push(preamble);

  sections.forEach((section, index) => {
    const body = normalizeSectionBody(
      content,
      section.endOffset,
      sections[index + 1]?.startOffset ?? content.length,
      headings
    );
    if (body) groupedBodies.get(section.name).push(body);
  });

  const blocks = TODO_SECTIONS.flatMap((section) => {
    const bodies = groupedBodies.get(section);
    return bodies.length ? [`## ${section}\n\n${bodies.join('\n\n')}`] : [];
  });
  const parts = [`# // ${title}`, backlink];
  parts.push(...blocks);
  return `${parts.join('\n\n')}\n`;
}

async function findTodoPaths(rootDir) {
  const paths = [];

  async function walk(directory) {
    let entries;

    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }

    await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) await walk(entryPath);
        if (entry.isFile() && entry.name === TODO_FILE) paths.push(entryPath);
      })
    );
  }

  await Promise.all(
    TODO_ROOTS.map((todoRoot) => walk(path.join(rootDir, todoRoot)))
  );
  return paths.sort();
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

function summarizeTodo(rootDir, todoPath, content) {
  const parsed = parseTodo(content);

  return {
    checkedCount: parsed.tasks.filter((task) => task.checked).length,
    hash: getHash(content),
    issues: parsed.issues,
    openCount: parsed.tasks.filter((task) => !task.checked).length,
    searchText: parsed.plainText,
    sections: parsed.sections.map((section) => section.name),
    sourcePath: toSourcePath(rootDir, todoPath),
    tasks: parsed.tasks,
    title: parsed.title,
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
    ...summarizeTodo(rootDir, todoPath, content),
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
