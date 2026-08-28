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

export function addTaskContent(document, sectionName, text) {
  const item = `- [ ] ${text.trim()}\n`;
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

  return `${before}\n\n${heading}${item}${after ? `\n${after}` : ''}`;
}
