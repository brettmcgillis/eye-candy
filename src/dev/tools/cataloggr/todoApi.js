const TODOS_ENDPOINT = '/dev-api/cataloggr/todos';

export const TODO_SECTIONS = [
  'Intent / Use Cases',
  'TODO',
  'Presets',
  'Features',
  'Interactivity',
  'Bugs',
];

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload.message || 'TODO request failed.');
    error.code = payload.code;
    throw error;
  }

  return payload;
}

function getTodoUrl(sourcePath) {
  const query = new URLSearchParams({ sourcePath });
  return `${TODOS_ENDPOINT}/file?${query}`;
}

export function listTodos() {
  return requestJson(TODOS_ENDPOINT);
}

export function readTodo(sourcePath) {
  return requestJson(getTodoUrl(sourcePath));
}

export function writeTodo(document, content) {
  return requestJson(getTodoUrl(document.sourcePath), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseHash: document.hash, content }),
  });
}

export function toggleTaskContent(content, taskOffset, checked) {
  const markerMatch = content.slice(taskOffset).match(/^[-*+]\s+\[[ xX]\]/u);

  if (!markerMatch) {
    throw new Error('This task changed. Reload and retry.');
  }

  const marker = markerMatch[0];
  const nextMarker = marker.replace(/\[[ xX]\]/u, checked ? '[x]' : '[ ]');

  return (
    content.slice(0, taskOffset) +
    nextMarker +
    content.slice(taskOffset + marker.length)
  );
}

export function removeTaskContent(content, taskStartOffset, taskEndOffset) {
  const markerMatch = content
    .slice(taskStartOffset)
    .match(/^[-*+]\s+\[[ xX]\]/u);

  if (!markerMatch) {
    throw new Error('This task changed. Reload and retry.');
  }

  const next = content.slice(0, taskStartOffset) + content.slice(taskEndOffset);

  return next.replace(/\n{3,}/gu, '\n\n');
}

export function editTaskContent(content, taskOffset, text) {
  const lineMatch = content
    .slice(taskOffset)
    .match(/^([-*+]\s+\[[ xX]\]\s*)([^\n]*)/u);

  if (!lineMatch) {
    throw new Error('This task changed. Reload and retry.');
  }

  const [line, marker] = lineMatch;

  return (
    content.slice(0, taskOffset) +
    marker +
    text.trim() +
    content.slice(taskOffset + line.length)
  );
}

export function getTaskText(content, taskOffset) {
  return (
    content.slice(taskOffset).match(/^[-*+]\s+\[[ xX]\]\s*([^\n]*)/u)?.[1] ?? ''
  );
}

export function addTaskContent(document, sectionName, text) {
  const isIntent = sectionName === TODO_SECTIONS[0];
  const item = `${isIntent ? '-' : '- [ ]'} ${text.trim()}\n`;
  const section = document.sectionDetails.find(
    (candidate) => candidate.name === sectionName
  );
  const sectionIndex = TODO_SECTIONS.indexOf(sectionName);
  const followingSection = document.sectionDetails.find((candidate) => {
    if (section) return candidate.startOffset > section.startOffset;
    return TODO_SECTIONS.indexOf(candidate.name) > sectionIndex;
  });
  const insertOffset = followingSection?.startOffset ?? document.content.length;
  const before = document.content.slice(0, insertOffset).trimEnd();
  const after = document.content.slice(insertOffset).trimStart();
  const headingName = sectionName === 'TODO' ? 'TODO:' : sectionName;
  const heading = section ? '' : `## // ${headingName}\n\n`;
  const lastLine = before.split('\n').pop() ?? '';
  const appendingAfterItem = /^[-*+]\s/u.test(lastLine);
  const separator = section && appendingAfterItem ? '\n' : '\n\n';

  return `${before}${separator}${heading}${item}${after ? `\n${after}` : ''}`;
}
