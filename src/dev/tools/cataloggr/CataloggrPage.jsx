import React, {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FiActivity,
  FiBox,
  FiCamera,
  FiCheckCircle,
  FiCode,
  FiGrid,
  FiLayers,
  FiRefreshCw,
  FiSend,
  FiTool,
} from 'react-icons/fi';

import { AREAS } from '@app/sceneRegistry';

import DEV_PAGES from '../../devPageRegistry';
import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './CataloggrPage.css';
import IdeaBoard from './IdeaBoard';
import PostBoard from './PostBoard';
import SceneDetail from './SceneDetail';
import SceneGrid from './SceneGrid';
import ThumbnailSeeder, { readSeedSession } from './ThumbnailSeeder';
import {
  AREA_ORDER,
  buildCatalogScenes,
  getProgress,
  getSceneTargets,
  toCatalogDevTool,
  toCatalogTodoOnly,
} from './catalogData';
import { uploadThumbnail } from './thumbnailApi';
import { listTodos } from './todoApi';

const CATALOG_ENDPOINT = '/dev-api/cataloggr';
const VIEW_OPTIONS = [
  ['all', 'All scenes'],
  ['post', 'Post'],
  ['finish', 'Finish'],
  ['ideas', 'Ideas'],
];
const GRID_SORT_OPTIONS = [
  ['name', 'Name'],
  ['updated', 'TODO updated'],
  ['open', 'Open TODOs'],
];
const GRID_FILTER_OPTIONS = [
  ['all', 'Everything'],
  ['open', 'Has open TODOs'],
  ['noThumbnail', 'No thumbnail'],
  ['issues', 'TODO format issues'],
];
const DEV_TOOL_ENTRIES = DEV_PAGES.map(toCatalogDevTool);
const POST_SORT_OPTIONS = [
  ['name', 'Name'],
  ['posted', 'Posted'],
  ['remaining', 'Left to post'],
];
const DEFAULT_POST_SORT_DIRECTION = {
  name: 'asc',
  posted: 'desc',
  remaining: 'desc',
};

function getSearchPlaceholder(view) {
  if (view === 'ideas') return 'Search ideas';
  if (view === 'post') return 'Search the publishing queue';
  return 'Search scenes or presets';
}

function normalizeSearchText(value) {
  return value.toLowerCase().replace(/&/gu, 'and').replace(/\s+/gu, ' ').trim();
}

function matchesView(scene, view, statuses) {
  const progress = getProgress(scene, statuses);

  if (view === 'post') {
    return (
      scene.area === 'showcase' && progress.postedCount < progress.totalCount
    );
  }

  if (view === 'finish') return scene.area === 'wip';
  if (view === 'posted') return progress.postedCount > 0;
  return true;
}

export default function CataloggrPage() {
  const [scenes, setScenes] = useState(() => buildCatalogScenes());
  const [demoSceneIds, setDemoSceneIds] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const ideasRef = useRef([]);
  const [statuses, setStatuses] = useState({});
  const statusesRef = useRef({});
  const [searchText, setSearchText] = useState('');
  const [area, setArea] = useState('all');
  const [channel, setChannel] = useState('all');
  const [view, setView] = useState('all');
  const [postSortKey, setPostSortKey] = useState('name');
  const [postSortDirection, setPostSortDirection] = useState('asc');
  const [selectedStat, setSelectedStat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [todos, setTodos] = useState([]);
  const [thumbnails, setThumbnails] = useState({});
  const [selectedKey, setSelectedKey] = useState(null);
  const [gridSortKey, setGridSortKey] = useState('name');
  const [gridFilter, setGridFilter] = useState('all');
  const [seeder, setSeeder] = useState(null);
  const deferredSearchText = useDeferredValue(searchText);

  const loadCatalog = useCallback(async (isCancelled) => {
    setLoading(true);
    setError('');

    try {
      const [response, nextTodos] = await Promise.all([
        fetch(CATALOG_ENDPOINT),
        listTodos(),
      ]);
      const payload = await response.json();

      if (!response.ok)
        throw new Error(payload.message || 'Catalog failed to load.');
      if (!isCancelled()) {
        const nextStatuses = payload.statuses ?? {};
        setDemoSceneIds(payload.demoSceneIds ?? []);
        const nextIdeas = payload.ideas ?? [];
        ideasRef.current = nextIdeas;
        statusesRef.current = nextStatuses;
        setIdeas(nextIdeas);
        setStatuses(nextStatuses);
        setScenes(buildCatalogScenes(payload.presetsByFolder));
        setThumbnails(payload.thumbnails ?? {});
        setTodos(nextTodos);
      }
    } catch (loadError) {
      if (!isCancelled()) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Catalog failed to load.'
        );
      }
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCatalog(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadCatalog]);

  const handleRefresh = useCallback(() => {
    loadCatalog(() => false);
  }, [loadCatalog]);

  const todosBySource = useMemo(
    () => new Map(todos.map((todo) => [todo.sourcePath, todo])),
    [todos]
  );

  const todoOnlyEntries = useMemo(() => {
    const owned = new Set([
      ...scenes.map((scene) => scene.sourcePath),
      ...DEV_TOOL_ENTRIES.map((tool) => tool.sourcePath),
    ]);
    return todos
      .filter((todo) => !owned.has(todo.sourcePath))
      .map(toCatalogTodoOnly);
  }, [scenes, todos]);

  const refreshTodos = useCallback(async () => {
    try {
      setTodos(await listTodos());
    } catch (todoError) {
      setError(todoError.message);
    }
  }, []);

  const stats = useMemo(() => {
    const showcaseCount = scenes.filter(
      (scene) => scene.area === 'showcase'
    ).length;
    const wipCount = scenes.filter((scene) => scene.area === 'wip').length;
    const targetCount = scenes.reduce(
      (total, scene) => total + getSceneTargets(scene).length,
      0
    );
    const postedCount = scenes.reduce(
      (total, scene) => total + getProgress(scene, statuses).postedCount,
      0
    );
    const postNextCount = scenes.filter((scene) =>
      matchesView(scene, 'post', statuses)
    ).length;

    return {
      ideaCount: ideas.length,
      postedCount,
      postNextCount,
      sceneCount: showcaseCount + wipCount,
      showcaseCount,
      targetCount,
      testLabCount: scenes.filter((scene) => scene.area === 'testlab').length,
      toolboxCount: scenes.filter((scene) => scene.area === 'toolbox').length,
      wipCount,
    };
  }, [ideas.length, scenes, statuses]);

  const filteredIdeas = useMemo(() => {
    const query = deferredSearchText.trim().toLowerCase();
    return query
      ? ideas.filter((idea) => idea.text.toLowerCase().includes(query))
      : ideas;
  }, [deferredSearchText, ideas]);

  const filteredDevTools = useMemo(() => {
    const query = normalizeSearchText(deferredSearchText);

    if ((area !== 'all' && area !== 'devtools') || channel !== 'all') return [];

    return DEV_PAGES.filter(
      (tool) =>
        !query ||
        normalizeSearchText(
          `${tool.label} ${tool.slug} ${tool.description}`
        ).includes(query)
    );
  }, [area, channel, deferredSearchText]);

  const filteredDemoScenes = useMemo(() => {
    const query = deferredSearchText.trim().toLowerCase();
    const ids = new Set(demoSceneIds);

    return scenes.filter(
      (scene) =>
        ids.has(scene.id) &&
        area !== 'devtools' &&
        (area === 'all' || scene.area === area) &&
        (channel === 'all' || scene.channel === channel) &&
        (!query ||
          `${scene.label} ${scene.slug} ${scene.channelLabel} ${scene.areaLabel}`
            .toLowerCase()
            .includes(query))
    );
  }, [area, channel, deferredSearchText, demoSceneIds, scenes]);

  const filteredScenes = useMemo(() => {
    const query = deferredSearchText.trim().toLowerCase();

    return scenes.filter((scene) => {
      if (area === 'devtools') return false;
      if (area !== 'all' && scene.area !== area) return false;
      if (channel !== 'all' && scene.channel !== channel) return false;
      if (!matchesView(scene, view, statuses)) return false;
      if (!query) return true;

      return [
        scene.label,
        scene.id,
        scene.slug,
        scene.channelLabel,
        scene.areaLabel,
        todosBySource.get(scene.sourcePath)?.searchText ?? '',
        ...scene.presetNames,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [
    area,
    channel,
    deferredSearchText,
    scenes,
    statuses,
    todosBySource,
    view,
  ]);

  const gridEntries = useMemo(() => {
    const query = normalizeSearchText(deferredSearchText);
    const devTools =
      view === 'all' &&
      (area === 'all' || area === 'devtools') &&
      channel === 'all'
        ? filteredDevTools.map(toCatalogDevTool)
        : [];
    const others =
      view === 'all' &&
      (area === 'all' || area === 'other') &&
      channel === 'all'
        ? todoOnlyEntries.filter(
            (entry) =>
              !query ||
              normalizeSearchText(
                `${entry.label} ${entry.slug} ${todosBySource.get(entry.sourcePath)?.searchText ?? ''}`
              ).includes(query)
          )
        : [];
    const base = area === 'other' ? [] : filteredScenes;

    return [...base, ...devTools, ...others]
      .filter((entry) => {
        const todo = todosBySource.get(entry.sourcePath);
        if (gridFilter === 'open') return Boolean(todo?.openCount);
        if (gridFilter === 'issues') return Boolean(todo?.issues.length);
        if (gridFilter === 'noThumbnail') {
          return entry.trackPosting !== false && !thumbnails[entry.sourcePath];
        }
        return true;
      })
      .sort((left, right) => {
        const leftTodo = todosBySource.get(left.sourcePath);
        const rightTodo = todosBySource.get(right.sourcePath);
        const byName =
          left.label.localeCompare(right.label, undefined, {
            sensitivity: 'base',
          }) || left.key.localeCompare(right.key);

        if (gridSortKey === 'updated') {
          return (
            new Date(rightTodo?.updatedAt ?? 0).getTime() -
              new Date(leftTodo?.updatedAt ?? 0).getTime() || byName
          );
        }
        if (gridSortKey === 'open') {
          return (
            (rightTodo?.openCount ?? 0) - (leftTodo?.openCount ?? 0) || byName
          );
        }
        return byName;
      });
  }, [
    area,
    channel,
    deferredSearchText,
    filteredDevTools,
    filteredScenes,
    gridFilter,
    gridSortKey,
    thumbnails,
    todoOnlyEntries,
    todosBySource,
    view,
  ]);

  const entriesByKey = useMemo(
    () =>
      new Map(
        [...scenes, ...DEV_TOOL_ENTRIES, ...todoOnlyEntries].map((entry) => [
          entry.key,
          entry,
        ])
      ),
    [scenes, todoOnlyEntries]
  );
  const selectedEntry = selectedKey ? entriesByKey.get(selectedKey) : null;

  const captureTargets = useMemo(() => {
    const seen = new Set();
    return gridEntries.filter((entry) => {
      if (
        !entry.path ||
        entry.trackPosting === false ||
        entry.key.startsWith('devtool:') ||
        thumbnails[entry.sourcePath] ||
        seen.has(entry.sourcePath)
      ) {
        return false;
      }
      seen.add(entry.sourcePath);
      return true;
    });
  }, [gridEntries, thumbnails]);

  const handleToggle = useCallback(async (statusKey, posted) => {
    const previousStatuses = statusesRef.current;
    const nextStatuses = { ...previousStatuses, [statusKey]: posted };

    statusesRef.current = nextStatuses;
    setStatuses(nextStatuses);
    setSaving(true);
    setError('');

    try {
      const response = await fetch(CATALOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statuses: nextStatuses }),
      });
      const payload = await response.json();

      if (!response.ok)
        throw new Error(payload.message || 'Catalog failed to save.');
      statusesRef.current = payload.statuses ?? nextStatuses;
      setStatuses(statusesRef.current);
    } catch (saveError) {
      statusesRef.current = previousStatuses;
      setStatuses(previousStatuses);
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Catalog failed to save.'
      );
    } finally {
      setSaving(false);
    }
  }, []);

  const handleIdeasChange = useCallback(async (nextIdeas) => {
    const previousIdeas = ideasRef.current;
    ideasRef.current = nextIdeas;
    setIdeas(nextIdeas);
    setSaving(true);
    setError('');

    try {
      const response = await fetch(CATALOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideas: nextIdeas }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.message || 'Ideas failed to save.');
      ideasRef.current = payload.ideas ?? nextIdeas;
      setIdeas(ideasRef.current);
      return true;
    } catch (saveError) {
      ideasRef.current = previousIdeas;
      setIdeas(previousIdeas);
      setError(
        saveError instanceof Error ? saveError.message : 'Ideas failed to save.'
      );
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const handleTodoError = useCallback((message) => setError(message), []);

  const handleCloseDetail = useCallback(() => setSelectedKey(null), []);

  const handleThumbnailSaved = useCallback((sourcePath, updatedAt) => {
    setThumbnails((current) => ({ ...current, [sourcePath]: updatedAt }));
  }, []);

  const handleDropImage = useCallback(
    async (sourcePath, file) => {
      setSaving(true);
      setError('');
      try {
        const saved = await uploadThumbnail(sourcePath, file);
        handleThumbnailSaved(sourcePath, saved.updatedAt);
      } catch (uploadError) {
        setError(uploadError.message);
      } finally {
        setSaving(false);
      }
    },
    [handleThumbnailSaved]
  );

  const handleCaptureOne = useCallback((entry) => {
    setSeeder({ autoStart: true, targets: [entry] });
  }, []);

  const handleCaptureMissing = useCallback(() => {
    setSeeder({ autoStart: false, targets: captureTargets });
  }, [captureTargets]);

  const handleCloseSeeder = useCallback(() => setSeeder(null), []);

  const resumeCheckedRef = useRef(false);
  useEffect(() => {
    if (loading || resumeCheckedRef.current) return;
    resumeCheckedRef.current = true;
    if (readSeedSession() && captureTargets.length) {
      setSeeder({ autoStart: true, targets: captureTargets });
    }
  }, [captureTargets, loading]);

  const handlePostSortKeyChange = useCallback((nextSortKey) => {
    setPostSortKey(nextSortKey);
    setPostSortDirection(DEFAULT_POST_SORT_DIRECTION[nextSortKey]);
  }, []);

  const handlePostSortDirectionToggle = useCallback(() => {
    setPostSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
  }, []);

  const handleStatFilter = useCallback(
    (statKey, nextView, nextArea) => {
      startTransition(() => {
        if (selectedStat === statKey) {
          setSelectedStat(null);
          setView('all');
          setArea('all');
        } else {
          setSelectedStat(statKey);
          setView(nextView);
          setArea(nextArea ?? 'all');
        }
        setChannel('all');
      });
    },
    [selectedStat]
  );

  let resultLabel = `${filteredScenes.length} scenes`;
  if (loading) resultLabel = 'Loading catalog...';
  if (!loading && (view === 'all' || view === 'finish')) {
    resultLabel = `${gridEntries.length} entries`;
  }
  if (!loading && view === 'ideas')
    resultLabel = `${filteredIdeas.length} ideas`;
  if (!loading && view === 'post') {
    resultLabel = `${filteredScenes.length + filteredDemoScenes.length + filteredDevTools.length} publishing targets`;
  }
  let storageLabel = 'Checked-in catalog';
  if (saving) storageLabel = 'Saving...';
  const showGrid = view === 'all' || view === 'finish' || view === 'posted';

  return (
    <main className="dev-page cataloggr-page">
      <DevPageHeaderBar title="Cataloggr" />

      <section className="cataloggr-stats" aria-label="Catalog summary">
        <button
          aria-pressed={selectedStat === 'scenes'}
          onClick={() => handleStatFilter('scenes', 'all', 'all')}
          type="button"
        >
          <FiGrid />
          <strong>{stats.sceneCount}</strong>
          <span>
            {stats.showcaseCount} ready, {stats.wipCount} in progress
          </span>
        </button>
        <button
          aria-pressed={selectedStat === 'toolbox'}
          onClick={() => handleStatFilter('toolbox', 'all', 'toolbox')}
          type="button"
        >
          <FiBox />
          <strong>{stats.toolboxCount}</strong>
          <span>toolbox scenes</span>
        </button>
        <button
          aria-pressed={selectedStat === 'testlab'}
          onClick={() => handleStatFilter('testlab', 'all', 'testlab')}
          type="button"
        >
          <FiActivity />
          <strong>{stats.testLabCount}</strong>
          <span>test labs</span>
        </button>
        <button
          aria-pressed={selectedStat === 'devtools'}
          onClick={() => handleStatFilter('devtools', 'all', 'devtools')}
          type="button"
        >
          <FiCode />
          <strong>{DEV_PAGES.length}</strong>
          <span>dev tools</span>
        </button>
        <button
          aria-pressed={selectedStat === 'ideas'}
          onClick={() => handleStatFilter('ideas', 'ideas')}
          type="button"
        >
          <FiLayers />
          <strong>{stats.ideaCount}</strong>
          <span>ideas to start building</span>
        </button>
        <button
          aria-pressed={selectedStat === 'posted'}
          onClick={() => handleStatFilter('posted', 'posted')}
          type="button"
        >
          <FiCheckCircle />
          <strong>
            {stats.postedCount}/{stats.targetCount}
          </strong>
          <span>posted</span>
        </button>
        <button
          aria-pressed={selectedStat === 'toPost'}
          onClick={() => handleStatFilter('toPost', 'post')}
          type="button"
        >
          <FiSend />
          <strong>{stats.postNextCount}</strong>
          <span>to post</span>
        </button>
        <button
          aria-pressed={selectedStat === 'toFinish'}
          onClick={() => handleStatFilter('toFinish', 'finish')}
          type="button"
        >
          <FiTool />
          <strong>{stats.wipCount}</strong>
          <span>to finish</span>
        </button>
      </section>

      <section
        className={`cataloggr-toolbar ${view === 'post' ? 'cataloggr-toolbar--post' : ''} ${showGrid ? 'cataloggr-toolbar--grid' : ''} ${view === 'ideas' ? 'cataloggr-toolbar--compact' : ''}`}
        aria-label="Catalog filters"
      >
        <div className="cataloggr-segments">
          {VIEW_OPTIONS.map(([value, label]) => (
            <button
              className={view === value ? 'cataloggr-segment--active' : ''}
              key={value}
              onClick={() =>
                startTransition(() => {
                  setSelectedStat(null);
                  setView(value);
                })
              }
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <input
          aria-label="Search scenes and presets"
          onChange={(event) => setSearchText(event.target.value)}
          placeholder={getSearchPlaceholder(view)}
          type="search"
          value={searchText}
        />
        {view !== 'ideas' ? (
          <select
            aria-label="Filter by area"
            onChange={(event) => {
              setSelectedStat(null);
              setArea(event.target.value);
            }}
            value={area}
          >
            <option value="all">All areas</option>
            {AREA_ORDER.map((areaKey) => (
              <option key={areaKey} value={areaKey}>
                {AREAS[areaKey]}
              </option>
            ))}
            <option value="devtools">Dev tools</option>
            <option value="other">TODO only</option>
          </select>
        ) : null}
        {view !== 'ideas' ? (
          <select
            aria-label="Filter by renderer"
            onChange={(event) => {
              setSelectedStat(null);
              setChannel(event.target.value);
            }}
            value={channel}
          >
            <option value="all">All renderers</option>
            <option value="webgl">WebGL</option>
            <option value="webgpu">WebGPU</option>
          </select>
        ) : null}
        {showGrid ? (
          <select
            aria-label="Filter entries"
            onChange={(event) => setGridFilter(event.target.value)}
            value={gridFilter}
          >
            {GRID_FILTER_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        ) : null}
        {showGrid ? (
          <select
            aria-label="Sort entries"
            onChange={(event) => setGridSortKey(event.target.value)}
            value={gridSortKey}
          >
            {GRID_SORT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                Sort: {label}
              </option>
            ))}
          </select>
        ) : null}
        {view === 'post' ? (
          <div className="cataloggr-post-sort">
            <select
              aria-label="Sort publishing targets"
              onChange={(event) => handlePostSortKeyChange(event.target.value)}
              value={postSortKey}
            >
              {POST_SORT_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  Sort: {label}
                </option>
              ))}
            </select>
            <button
              aria-label={
                postSortDirection === 'asc'
                  ? 'Sort ascending, click for descending'
                  : 'Sort descending, click for ascending'
              }
              onClick={handlePostSortDirectionToggle}
              title={postSortDirection === 'asc' ? 'Ascending' : 'Descending'}
              type="button"
            >
              {postSortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        ) : null}
      </section>

      <div className="cataloggr-result-bar">
        <span>{resultLabel}</span>
        <span className="cataloggr-result-bar__end">
          {showGrid && captureTargets.length ? (
            <button
              className="cataloggr-capture-missing"
              disabled={loading}
              onClick={handleCaptureMissing}
              title="Load each visible scene without a thumbnail and capture it"
              type="button"
            >
              <FiCamera aria-hidden="true" />
              Capture {captureTargets.length} missing
            </button>
          ) : null}
          {storageLabel}
          <button
            aria-label="Refresh catalog data"
            className="cataloggr-refresh"
            disabled={loading || saving}
            onClick={handleRefresh}
            title="Refresh catalog data"
            type="button"
          >
            <FiRefreshCw
              aria-hidden="true"
              className={loading ? 'cataloggr-refresh__icon--spin' : ''}
            />
          </button>
        </span>
      </div>
      {error ? (
        <p className="cataloggr-error" role="alert">
          {error}
        </p>
      ) : null}

      {view === 'ideas' ? (
        <IdeaBoard
          disabled={loading || saving}
          ideas={ideas}
          onChange={handleIdeasChange}
          visibleIdeas={filteredIdeas}
        />
      ) : null}
      {showGrid || view === 'post' ? (
        <div
          className="cataloggr-browser"
          data-detail={selectedEntry ? 'open' : undefined}
        >
          {view === 'post' ? (
            <PostBoard
              demoScenes={filteredDemoScenes}
              devTools={filteredDevTools}
              onDropImage={handleDropImage}
              onSelect={setSelectedKey}
              selectedKey={selectedKey}
              showcaseScenes={filteredScenes}
              sortDirection={postSortDirection}
              sortKey={postSortKey}
              statuses={statuses}
              thumbnails={thumbnails}
              todosBySource={todosBySource}
            />
          ) : (
            <SceneGrid
              entries={gridEntries}
              label="Scenes and dev tools"
              onDropImage={handleDropImage}
              onSelect={setSelectedKey}
              selectedKey={selectedKey}
              statuses={statuses}
              thumbnails={thumbnails}
              todosBySource={todosBySource}
            />
          )}
          {selectedEntry ? (
            <SceneDetail
              disabled={loading || saving}
              entry={selectedEntry}
              onCapture={handleCaptureOne}
              onClose={handleCloseDetail}
              onDropImage={handleDropImage}
              onError={handleTodoError}
              onToggle={handleToggle}
              onTodoSaved={refreshTodos}
              statuses={statuses}
              thumbnailVersion={thumbnails[selectedEntry.sourcePath]}
            />
          ) : null}
        </div>
      ) : null}
      {seeder ? (
        <ThumbnailSeeder
          autoStart={seeder.autoStart}
          onCaptured={handleThumbnailSaved}
          onClose={handleCloseSeeder}
          targets={seeder.targets}
        />
      ) : null}
    </main>
  );
}
