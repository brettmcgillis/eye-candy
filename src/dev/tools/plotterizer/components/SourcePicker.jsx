import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronDown, FiChevronRight, FiStar, FiX } from 'react-icons/fi';

import { thumbnailUrl } from '@dev/renderWorkbench/assetGroups';

const PAGE = 60;
const PREFS = 'plotterizer.picker';
const RECENT = 'plotterizer.recent';
const RECENT_MAX = 24;

const stored = (key, fallback) => {
  try {
    return JSON.parse(window.localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const store = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private windows refuse storage; the picker just won't remember.
  }
};

export function rememberRecent(path) {
  if (!path) return;
  store(
    RECENT,
    [path, ...stored(RECENT, []).filter((p) => p !== path)].slice(0, RECENT_MAX)
  );
}

export const thumbUrl = thumbnailUrl;

const human = (text) => String(text ?? '').replace(/[-_]+/gu, ' ');

export const titleOf = (entry) =>
  entry.identity ??
  human(entry.generation ?? entry.name.replace(/\.svg$/u, ''));

const dateOf = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });

function Card({ entry, onPick }) {
  return (
    <button className="pz-card" onClick={() => onPick(entry)} type="button">
      <span className="pz-card__thumb">
        <img alt="" loading="lazy" src={thumbUrl(entry.path)} />
        {entry.kept ? (
          <span className="pz-card__kept" title="Kept">
            <FiStar />
          </span>
        ) : null}
      </span>
      <strong className="pz-card__title">{titleOf(entry)}</strong>
      <span className="pz-card__sub">
        {entry.identity && entry.generation
          ? `${human(entry.generation)} · `
          : ''}
        {entry.name.replace(/\.svg$/u, '')}
      </span>
      {entry.style.length ? (
        <span className="pz-card__chips">
          {entry.style.map((chip) => (
            <i key={chip}>{chip}</i>
          ))}
        </span>
      ) : null}
      <span className="pz-card__meta">
        {dateOf(entry.collection.createdAt)}
        {entry.widthMm ? ` · ${Math.round(entry.widthMm)} mm` : ''}
        {entry.layers ? ` · ${entry.layers} layers` : ''}
      </span>
    </button>
  );
}

// Every bench SVG as a gallery: a bench / job tree to narrow it, search
// over names and what each plot is, kept-only, newest or oldest first.
export default function SourcePicker({ loading, onClose, onPick, sources }) {
  const [prefs, setPrefs] = useState(() =>
    stored(PREFS, { collection: null, kept: false, node: 'all', sort: 'new' })
  );
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(() => new Set([prefs.node]));
  const [shown, setShown] = useState(PAGE);
  const sentinel = useRef(null);
  const recent = useMemo(() => stored(RECENT, []), []);

  const update = (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    store(PREFS, next);
    setShown(PAGE);
  };

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const benches = useMemo(() => {
    const map = new Map();
    sources.forEach((entry) => {
      if (prefs.kept && !entry.kept) return;
      const bench = map.get(entry.slug) ?? {
        collections: new Map(),
        count: 0,
        slug: entry.slug,
      };
      bench.count += 1;
      const collection = bench.collections.get(entry.collection.id) ?? {
        count: 0,
        createdAt: entry.collection.createdAt,
        id: entry.collection.id,
        kept: entry.kept,
        title: titleOf(entry),
      };
      collection.count += 1;
      bench.collections.set(entry.collection.id, collection);
      map.set(entry.slug, bench);
    });
    return [...map.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  }, [prefs.kept, sources]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const byPath = new Map(sources.map((entry) => [entry.path, entry]));
    const base =
      prefs.node === 'recent'
        ? recent.map((path) => byPath.get(path)).filter(Boolean)
        : sources;
    const list = base.filter(
      (entry) =>
        (!prefs.kept || entry.kept) &&
        (prefs.node === 'all' ||
          prefs.node === 'recent' ||
          entry.slug === prefs.node) &&
        (!prefs.collection || entry.collection.id === prefs.collection) &&
        (!needle ||
          [entry.path, entry.identity, ...entry.style]
            .join(' ')
            .toLowerCase()
            .includes(needle))
    );
    if (prefs.node === 'recent') return list;
    return prefs.sort === 'old' ? [...list].reverse() : list;
  }, [prefs, recent, search, sources]);

  useEffect(() => {
    const target = sentinel.current;
    if (!target) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setShown((count) => count + PAGE);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [filtered]);

  const toggle = (slug) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  const pick = (entry) => {
    rememberRecent(entry.path);
    onPick(entry);
  };

  return (
    <div className="pz-picker" role="dialog" aria-label="Choose a plot">
      <button
        aria-label="Close"
        className="pz-picker__backdrop"
        onClick={onClose}
        type="button"
      />
      <div className="pz-picker__panel">
        <header className="pz-picker__head">
          <strong>Choose a plot</strong>
          <input
            aria-label="Search plots"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            onChange={(event) => {
              setSearch(event.target.value);
              setShown(PAGE);
            }}
            placeholder="Search: toxic, pigeon, stipple, spiral…"
            value={search}
          />
          <label htmlFor="pz-kept-only">
            <input
              checked={prefs.kept}
              id="pz-kept-only"
              onChange={(event) => update({ kept: event.target.checked })}
              type="checkbox"
            />
            Kept only
          </label>
          <select
            aria-label="Sort"
            onChange={(event) => update({ sort: event.target.value })}
            value={prefs.sort}
          >
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
          </select>
          <span className="dev-muted">
            {filtered.length.toLocaleString()} plots
          </span>
          <button
            aria-label="Close"
            className="dev-button"
            onClick={onClose}
            type="button"
          >
            <FiX />
          </button>
        </header>
        <div className="pz-picker__body">
          <nav className="pz-tree">
            {[
              { label: `Recent (${recent.length})`, node: 'recent' },
              {
                label: `All (${sources.length.toLocaleString()})`,
                node: 'all',
              },
            ].map(({ label, node }) => (
              <button
                aria-pressed={prefs.node === node}
                className="pz-tree__item"
                key={node}
                onClick={() => update({ collection: null, node })}
                type="button"
              >
                {label}
              </button>
            ))}
            {benches.map((bench) => (
              <div key={bench.slug}>
                <button
                  aria-pressed={prefs.node === bench.slug && !prefs.collection}
                  className="pz-tree__item"
                  onClick={() => {
                    update({ collection: null, node: bench.slug });
                    toggle(bench.slug);
                  }}
                  type="button"
                >
                  {open.has(bench.slug) ? (
                    <FiChevronDown />
                  ) : (
                    <FiChevronRight />
                  )}
                  {bench.slug}
                  <span>{bench.count}</span>
                </button>
                {open.has(bench.slug)
                  ? [...bench.collections.values()]
                      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                      .map((collection) => (
                        <button
                          aria-pressed={prefs.collection === collection.id}
                          className="pz-tree__item pz-tree__item--job"
                          key={collection.id}
                          onClick={() =>
                            update({
                              collection: collection.id,
                              node: bench.slug,
                            })
                          }
                          title={collection.id}
                          type="button"
                        >
                          {collection.kept ? <FiStar /> : null}
                          <span className="pz-tree__label">
                            {dateOf(collection.createdAt)} · {collection.title}
                          </span>
                          <span>{collection.count}</span>
                        </button>
                      ))
                  : null}
              </div>
            ))}
          </nav>
          <section className="pz-grid">
            {loading && !sources.length ? (
              <p className="dev-muted">Reading plots…</p>
            ) : null}
            {!loading && !filtered.length ? (
              <p className="dev-muted">No plots match.</p>
            ) : null}
            {filtered.slice(0, shown).map((entry) => (
              <Card entry={entry} key={entry.path} onPick={pick} />
            ))}
            {shown < filtered.length ? (
              <div className="pz-grid__more" ref={sentinel} />
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
