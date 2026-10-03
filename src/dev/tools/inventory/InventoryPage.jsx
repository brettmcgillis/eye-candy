import React, { useCallback, useEffect, useMemo, useState } from 'react';

import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './InventoryPage.css';

const INVENTORY_ENDPOINT = '/dev-api/inventory';
const JOB_PAGE_SIZE = 25;

const ROOT_LABELS = {
  all: 'All',
  curated: 'Kept (public/images)',
  output: 'Output',
};

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    UNITS.length - 1
  );
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 100 || exponent === 0 ? 0 : 1)} ${UNITS[exponent]}`;
}

function formatCount(value) {
  return (value ?? 0).toLocaleString();
}

function formatAge(time, now) {
  if (!time) return '—';
  const minutes = (now - time) / 60000;
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function percent(part, whole) {
  return whole ? (part / whole) * 100 : 0;
}

function mergeTallies(...maps) {
  return maps
    .flatMap((map) => Object.entries(map ?? {}))
    .reduce((acc, [key, tally]) => {
      const prev = acc[key] ?? { bytes: 0, files: 0 };
      return {
        ...acc,
        [key]: {
          bytes: prev.bytes + tally.bytes,
          files: prev.files + tally.files,
        },
      };
    }, {});
}

function useSort(initialKey) {
  const [sort, setSort] = useState({ dir: 'desc', key: initialKey });
  const toggle = useCallback((key) => {
    setSort((current) =>
      current.key === key
        ? { dir: current.dir === 'asc' ? 'desc' : 'asc', key }
        : { dir: key === 'label' ? 'asc' : 'desc', key }
    );
  }, []);
  const apply = useCallback(
    (rows) =>
      [...rows].sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        const cmp =
          typeof av === 'string' || typeof bv === 'string'
            ? String(av ?? '').localeCompare(String(bv ?? ''))
            : (av ?? 0) - (bv ?? 0);
        return sort.dir === 'asc' ? cmp : -cmp;
      }),
    [sort]
  );
  return { apply, sort, toggle };
}

function SortHeader({ children, sortKey, sorter, numeric }) {
  const arrow = sorter.sort.dir === 'asc' ? ' ▲' : ' ▼';
  return (
    <th className={numeric ? 'inventory-num' : undefined}>
      <button
        className="inventory-sort"
        type="button"
        onClick={() => sorter.toggle(sortKey)}
      >
        {children}
        {sorter.sort.key === sortKey ? arrow : ''}
      </button>
    </th>
  );
}

function Bar({ value, max }) {
  return (
    <span className="inventory-bar">
      <span
        className="inventory-bar__fill"
        style={{ width: `${percent(value, max)}%` }}
      />
    </span>
  );
}

function StatCard({ label, value, detail }) {
  return (
    <div className="dev-panel inventory-stat">
      <div className="inventory-eyebrow">{label}</div>
      <div className="inventory-stat__value">{value}</div>
      {detail ? <div className="dev-muted">{detail}</div> : null}
    </div>
  );
}

function SectionHead({ title, meta, children }) {
  return (
    <div className="inventory-section-head">
      <h3 className="inventory-eyebrow">
        {title}
        {meta ? (
          <span className="inventory-section-head__meta">{meta}</span>
        ) : null}
      </h3>
      {children ? (
        <div className="inventory-section-head__controls">{children}</div>
      ) : null}
    </div>
  );
}

function DiskPanel({ disk, outputBytes, curatedBytes }) {
  if (!disk) {
    return (
      <section className="dev-panel inventory-section">
        <p className="dev-muted">
          Disk stats unavailable on this Node version.
        </p>
      </section>
    );
  }
  const otherUsed = Math.max(0, disk.used - outputBytes - curatedBytes);
  const segments = [
    { bytes: outputBytes, id: 'output', label: 'output/' },
    { bytes: curatedBytes, id: 'curated', label: 'Kept media' },
    { bytes: otherUsed, id: 'other', label: 'Everything else' },
    { bytes: disk.free, id: 'free', label: 'Free' },
  ];
  return (
    <section className="dev-panel inventory-section">
      <SectionHead meta={`${formatBytes(disk.total)} volume`} title="Disk" />
      <div className="inventory-disk">
        {segments.map((segment) => (
          <span
            key={segment.id}
            className={`inventory-swatch--${segment.id}`}
            style={{ width: `${percent(segment.bytes, disk.total)}%` }}
            title={`${segment.label}: ${formatBytes(segment.bytes)}`}
          />
        ))}
      </div>
      <ul className="inventory-legend">
        {segments.map((segment) => (
          <li key={segment.id}>
            <span
              className={`inventory-legend__swatch inventory-swatch--${segment.id}`}
            />
            <span className="inventory-legend__label">{segment.label}</span>
            <strong>{formatBytes(segment.bytes)}</strong>
            <span className="dev-muted">
              {percent(segment.bytes, disk.total).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ToolsTable({ groups, now }) {
  const sorter = useSort('bytes');
  const rows = useMemo(
    () =>
      sorter.apply(
        groups
          .filter((group) => group.root === 'output')
          .map((group) => {
            const kept = groups.find(
              (other) => other.root === 'curated' && other.label === group.label
            );
            return {
              artifacts: group.artifacts,
              bytes: group.bytes,
              curatedBytes: kept?.bytes ?? 0,
              curatedFiles: kept?.artifacts ?? 0,
              files: group.files,
              jobs: group.jobs,
              label: group.label,
              newest: group.newest,
              oldest: group.oldest,
            };
          })
      ),
    [groups, sorter]
  );
  const max = Math.max(1, ...rows.map((row) => row.bytes));

  return (
    <section className="dev-panel inventory-section">
      <SectionHead meta={`${rows.length} workbenches`} title="By tool" />
      <div className="inventory-scroll">
        <table className="inventory-table">
          <thead>
            <tr>
              <SortHeader sortKey="label" sorter={sorter}>
                Tool
              </SortHeader>
              <SortHeader numeric sortKey="bytes" sorter={sorter}>
                Output size
              </SortHeader>
              <th aria-label="share" />
              <SortHeader numeric sortKey="artifacts" sorter={sorter}>
                Artifacts
              </SortHeader>
              <SortHeader numeric sortKey="files" sorter={sorter}>
                Files
              </SortHeader>
              <SortHeader numeric sortKey="jobs" sorter={sorter}>
                Jobs
              </SortHeader>
              <SortHeader numeric sortKey="curatedBytes" sorter={sorter}>
                Kept
              </SortHeader>
              <SortHeader numeric sortKey="newest" sorter={sorter}>
                Newest
              </SortHeader>
              <SortHeader numeric sortKey="oldest" sorter={sorter}>
                Oldest
              </SortHeader>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className={row.bytes ? undefined : 'inventory-row--empty'}
              >
                <td className="inventory-strong">{row.label}</td>
                <td className="inventory-num">{formatBytes(row.bytes)}</td>
                <td className="inventory-bar-cell">
                  <Bar max={max} value={row.bytes} />
                </td>
                <td className="inventory-num">{formatCount(row.artifacts)}</td>
                <td className="inventory-num">{formatCount(row.files)}</td>
                <td className="inventory-num">{formatCount(row.jobs)}</td>
                <td className="inventory-num">
                  {row.curatedFiles ? (
                    <>
                      {formatBytes(row.curatedBytes)}{' '}
                      <span className="dev-muted">· {row.curatedFiles}</span>
                    </>
                  ) : (
                    <span className="dev-muted">—</span>
                  )}
                </td>
                <td className="inventory-num">{formatAge(row.newest, now)}</td>
                <td className="inventory-num">{formatAge(row.oldest, now)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TalliesPanel({ title, tallies, labels, formatLabel = (key) => key }) {
  const total = Object.values(tallies).reduce((sum, t) => sum + t.bytes, 0);
  const entries = labels
    ? labels.map(({ id, label }) => [
        label,
        tallies[id] ?? { bytes: 0, files: 0 },
      ])
    : Object.entries(tallies)
        .sort((a, b) => b[1].bytes - a[1].bytes)
        .map(([key, tally]) => [formatLabel(key), tally]);
  return (
    <div className="dev-panel inventory-section">
      <SectionHead title={title} />
      <ul className="inventory-tallies">
        {entries.map(([label, tally]) => (
          <li key={label}>
            <div className="inventory-tallies__row">
              <span className="inventory-strong">{label}</span>
              <span className="dev-muted">
                {formatCount(tally.files)} files
              </span>
              <span className="inventory-tallies__bytes">
                {formatBytes(tally.bytes)}
              </span>
              <span className="inventory-tallies__pct dev-muted">
                {percent(tally.bytes, total).toFixed(0)}%
              </span>
            </div>
            <Bar max={total} value={tally.bytes} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function JobsTable({ jobs, now, tools }) {
  const sorter = useSort('bytes');
  const [tool, setTool] = useState('all');
  const [limit, setLimit] = useState(JOB_PAGE_SIZE);
  const filtered = useMemo(
    () =>
      sorter.apply(
        (tool === 'all' ? jobs : jobs.filter((job) => job.label === tool)).map(
          (job) => ({
            ...job,
            created: job.createdAt ? Date.parse(job.createdAt) : job.newest,
          })
        )
      ),
    [jobs, sorter, tool]
  );
  const max = Math.max(1, ...filtered.map((job) => job.bytes));
  const filteredBytes = filtered.reduce((sum, job) => sum + job.bytes, 0);

  return (
    <section className="dev-panel inventory-section">
      <SectionHead
        meta={`${formatCount(filtered.length)} · ${formatBytes(filteredBytes)}`}
        title="Jobs"
      >
        <select
          className="inventory-select"
          value={tool}
          onChange={(event) => setTool(event.target.value)}
        >
          <option value="all">All tools</option>
          {tools.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      </SectionHead>
      <div className="inventory-scroll">
        <table className="inventory-table">
          <thead>
            <tr>
              <SortHeader sortKey="label" sorter={sorter}>
                Tool
              </SortHeader>
              <SortHeader sortKey="id" sorter={sorter}>
                Job
              </SortHeader>
              <SortHeader sortKey="kind" sorter={sorter}>
                Kind
              </SortHeader>
              <SortHeader sortKey="status" sorter={sorter}>
                Status
              </SortHeader>
              <SortHeader numeric sortKey="created" sorter={sorter}>
                Created
              </SortHeader>
              <SortHeader numeric sortKey="artifacts" sorter={sorter}>
                Artifacts
              </SortHeader>
              <SortHeader numeric sortKey="bytes" sorter={sorter}>
                Size
              </SortHeader>
              <th aria-label="share" />
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, limit).map((job) => (
              <tr key={`${job.group}/${job.id}`}>
                <td className="inventory-strong">{job.label}</td>
                <td className="inventory-mono dev-muted" title={job.id}>
                  {job.id.slice(0, 8)}
                </td>
                <td>
                  {job.kind ? (
                    <span className="inventory-pill">{job.kind}</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <span
                    className={`inventory-pill inventory-pill--${
                      job.status === 'completed' ? 'ok' : 'warn'
                    }`}
                  >
                    {job.status ?? 'unknown'}
                  </span>
                </td>
                <td className="inventory-num">{formatAge(job.created, now)}</td>
                <td className="inventory-num">{formatCount(job.artifacts)}</td>
                <td className="inventory-num">{formatBytes(job.bytes)}</td>
                <td className="inventory-bar-cell">
                  <Bar max={max} value={job.bytes} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > limit ? (
        <button
          className="dev-button inventory-more"
          type="button"
          onClick={() => setLimit((current) => current + JOB_PAGE_SIZE * 4)}
        >
          Show more ({formatCount(filtered.length - limit)} hidden)
        </button>
      ) : null}
    </section>
  );
}

export default function InventoryPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [root, setRoot] = useState('output');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(INVENTORY_ENDPOINT);
      const payload = await response.json();
      if (!payload.ok) throw new Error(payload.message);
      setData(payload);
    } catch (loadError) {
      setError(loadError.message || 'Failed to scan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rootTallies = useMemo(() => {
    if (!data) return null;
    const { curated, output } = data.roots;
    if (root === 'all') {
      return {
        byAge: mergeTallies(output.byAge, curated.byAge),
        byCategory: mergeTallies(output.byCategory, curated.byCategory),
        byType: mergeTallies(output.byType, curated.byType),
      };
    }
    return data.roots[root];
  }, [data, root]);

  const tools = useMemo(
    () =>
      data ? [...new Set(data.groups.map((group) => group.label))].sort() : [],
    [data]
  );

  const now = data?.scannedAt ?? 0;
  const output = data?.roots.output;
  const curated = data?.roots.curated;

  return (
    <div className="dev-page inventory-page">
      <DevPageHeaderBar title="Inventory" />

      <div className="inventory-toolbar">
        <p className="dev-page__description">
          Render workbench output in <code>output/</code> and kept media in{' '}
          <code>public/images</code>.
        </p>
        <div className="inventory-toolbar__actions">
          {error ? <span className="inventory-warn">{error}</span> : null}
          {data ? (
            <span className="dev-muted">
              Scanned {new Date(data.scannedAt).toLocaleTimeString()}
            </span>
          ) : null}
          <button
            className="dev-button dev-button--primary"
            disabled={loading}
            type="button"
            onClick={load}
          >
            {loading ? 'Scanning…' : 'Rescan'}
          </button>
        </div>
      </div>

      {data ? (
        <div className="inventory-body">
          <div className="inventory-stats">
            <StatCard
              detail={`${formatCount(output.files)} files · ${formatCount(data.jobs.length)} jobs`}
              label="output/"
              value={formatBytes(output.bytes)}
            />
            <StatCard
              detail="png · webp · svg · mp4"
              label="Artifacts"
              value={formatCount(output.artifacts)}
            />
            <StatCard
              detail={`${formatCount(curated.artifacts)} files in public/images`}
              label="Kept"
              value={formatBytes(curated.bytes)}
            />
            <StatCard
              detail={
                data.disk
                  ? `${percent(data.disk.free, data.disk.total).toFixed(0)}% of ${formatBytes(data.disk.total)}`
                  : undefined
              }
              label="Disk free"
              value={data.disk ? formatBytes(data.disk.free) : '—'}
            />
          </div>

          <DiskPanel
            curatedBytes={curated.bytes}
            disk={data.disk}
            outputBytes={output.bytes}
          />

          <ToolsTable groups={data.groups} now={now} />

          <div className="inventory-section-head inventory-section-head--bare">
            <h3 className="inventory-eyebrow">Breakdowns</h3>
            <div className="inventory-segmented" role="group">
              {Object.entries(ROOT_LABELS).map(([id, label]) => (
                <button
                  key={id}
                  aria-pressed={root === id}
                  type="button"
                  onClick={() => setRoot(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="inventory-grid">
            <TalliesPanel
              formatLabel={(key) => key[0].toUpperCase() + key.slice(1)}
              tallies={rootTallies.byCategory}
              title="By category"
            />
            <TalliesPanel
              formatLabel={(key) => (key.startsWith('(') ? key : `.${key}`)}
              tallies={rootTallies.byType}
              title="By file type"
            />
            <TalliesPanel
              labels={data.ageBuckets}
              tallies={rootTallies.byAge}
              title="By age"
            />
          </div>

          <JobsTable jobs={data.jobs} now={now} tools={tools} />
        </div>
      ) : null}
    </div>
  );
}
