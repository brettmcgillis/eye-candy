import { createProject, normalizeProject } from './projectSchema';

const INDEX_KEY = 'eyeCandy:projectionMapping:index:v1';
const ACTIVE_KEY = 'eyeCandy:projectionMapping:active:v1';
const projectKey = (id) => `eyeCandy:projectionMapping:project:v1:${id}`;

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeIndex(ids) {
  localStorage.setItem(INDEX_KEY, JSON.stringify([...new Set(ids)]));
}

export function listProjects() {
  const ids = readJson(INDEX_KEY, []);
  return ids
    .map((id) => normalizeProject(readJson(projectKey(id), null)))
    .filter(Boolean)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function saveProject(project) {
  const normalized = normalizeProject({
    ...project,
    updatedAt: new Date().toISOString(),
  });
  if (!normalized) throw new Error('Projection mapping project is invalid.');

  localStorage.setItem(projectKey(normalized.id), JSON.stringify(normalized));
  writeIndex([...readJson(INDEX_KEY, []), normalized.id]);
  localStorage.setItem(ACTIVE_KEY, normalized.id);
  return normalized;
}

export function loadProject(id) {
  return id ? normalizeProject(readJson(projectKey(id), null)) : null;
}

export function loadActiveProject() {
  const requestedId = new URLSearchParams(window.location.search).get(
    'project'
  );
  const activeId = requestedId || localStorage.getItem(ACTIVE_KEY);
  const stored = loadProject(activeId) ?? listProjects()[0];
  return stored ?? saveProject(createProject());
}
