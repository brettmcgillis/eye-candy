import { toString } from 'mdast-util-to-string';
import fs from 'node:fs/promises';
import path from 'node:path';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

export const TODO_ROOTS = [
  path.join('src', 'components', 'scenes'),
  path.join('src', 'components', 'postprocessing'),
  path.join('src', 'dev', 'tools'),
  path.join('src', 'app'),
];
export const TODO_FILE = 'todo.md';

export async function findTodoPaths(rootDir) {
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

function normalizeHeading(value) {
  return value
    .replace(/^\/\/\s*/u, '')
    .replace(/:$/u, '')
    .replace(/[/_-]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLowerCase();
}

function getCommentHeading(value) {
  return `// ${value.replace(/^\/\/\s*/u, '')}`;
}

function getSectionHeading(section) {
  return section === 'TODO' ? 'TODO:' : section;
}

function getCanonicalSection(value) {
  return SECTION_ALIASES.get(normalizeHeading(value)) ?? null;
}

function getNodeOffset(node, edge) {
  return node.position?.[edge]?.offset ?? null;
}

// Vite's CJS config bundle gives this .mjs file namespace objects for default imports.
const interopDefault = (module) => module.default ?? module;

function getMarkdownTree(content) {
  const parser = unified()
    .use(interopDefault(remarkParse))
    .use(interopDefault(remarkGfm));
  return parser.runSync(parser.parse(content));
}

function findSectionForOffset(sections, offset) {
  let currentSection = null;

  sections.forEach((section) => {
    if (section.startOffset <= offset) currentSection = section.name;
  });

  return currentSection;
}

export function parseTodo(content) {
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
  if (headings.some((heading) => !toString(heading).startsWith('//'))) {
    issues.push('Headings must use the comment-style `//` prefix.');
  }
  if (
    sections.some(
      (section) => section.name === 'TODO' && !section.rawName.endsWith(':')
    )
  ) {
    issues.push('The TODO heading must use `## // TODO:`.');
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

  const missingSections = TODO_SECTIONS.filter(
    (section) => !canonicalNames.includes(section)
  );

  if (missingSections.length) {
    issues.push(
      `Missing required section${missingSections.length > 1 ? 's' : ''}: ${missingSections
        .map((section) => `// ${getSectionHeading(section)}`)
        .join(', ')}.`
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
        getNodeOffset(heading, 'start') >= startOffset &&
        getNodeOffset(heading, 'end') <= endOffset
    )
    .map((heading) => ({
      end: getNodeOffset(heading, 'end') - startOffset,
      replacement: `${'#'.repeat(Math.max(3, heading.depth))} ${getCommentHeading(toString(heading))}`,
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
    .replace(`### // ${title}`, '')
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

  const blocks = TODO_SECTIONS.map((section) => {
    const bodies = groupedBodies.get(section);
    return `## // ${getSectionHeading(section)}${bodies.length ? `\n\n${bodies.join('\n\n')}` : ''}`;
  });
  const parts = [`# // ${title}`, backlink];
  parts.push(...blocks);
  return `${parts.join('\n\n')}\n`;
}

export function getBacklink(todoDir, rootDir) {
  const target = path.relative(todoDir, path.join(rootDir, 'TODO.md'));
  return `[Back to main TODO](${target.split(path.sep).join('/')})`;
}

export function createTodoContent(title, backlink) {
  const blocks = TODO_SECTIONS.map(
    (section) => `## // ${getSectionHeading(section)}`
  );
  return `${[`# // ${title}`, backlink, ...blocks].join('\n\n')}\n`;
}
