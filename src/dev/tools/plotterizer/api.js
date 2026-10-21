const API = '/dev-api/plotterizer';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: options.body
      ? { 'Content-Type': 'application/json', ...options.headers }
      : options.headers,
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.message ?? `Request failed (${response.status}).`);
  }
  return payload;
}

export const listSources = () =>
  request('/sources').then(({ sources }) => sources);

export const sourceUrl = (path) =>
  `${API}/source?path=${encodeURIComponent(path)}`;

// A bench serves a job's assets only once it has listed its jobs since the
// dev server started, so a 404 lists them and tries again.
export async function fetchFromBench(url) {
  const response = await fetch(url);
  const bench = /^\/dev-api\/([^/]+)\/jobs\//u.exec(url);
  if (response.status !== 404 || !bench) return response;
  await fetch(`/dev-api/${bench[1]}/jobs`);
  return fetch(url);
}

export async function fetchSource(url) {
  const response = await fetchFromBench(url);
  if (!response.ok) throw new Error(`Could not load ${url}.`);
  return response.text();
}

export const loadPens = () => request('/pens').then(({ pens }) => pens);

export const savePens = (pens) =>
  request('/pens', { body: JSON.stringify({ pens }), method: 'PUT' });

export const listJobs = () => request('/jobs').then(({ jobs }) => jobs);

export const saveJob = (slug, json) =>
  request(`/jobs/${slug}`, { body: json, method: 'PUT' }).then(
    ({ job }) => job
  );

export const deleteJob = (slug) =>
  request(`/jobs/${slug}`, { method: 'DELETE' });

export async function fetchJob(slug) {
  const response = await fetch(`${API}/jobs/${slug}/files/job.json`);
  if (!response.ok) throw new Error(`Could not load job ${slug}.`);
  return response.json();
}

export const slugOf = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '')
    .slice(0, 80);
