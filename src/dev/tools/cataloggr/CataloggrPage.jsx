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
import SceneRow from './SceneRow';
import TodoWorkspace from './TodoWorkspace';
import {
  AREA_ORDER,
  buildCatalogScenes,
  getSceneTargets,
  getStatusKey,
  toCatalogDevTool,
} from './catalogData';

const CATALOG_ENDPOINT = '/dev-api/cataloggr';
const VIEW_OPTIONS = [
  ['all', 'All scenes'],
  ['post', 'Post'],
  ['finish', 'Finish'],
  ['ideas', 'Ideas'],
  ['todos', 'ToDos'],
];

function getSearchPlaceholder(view) {
  if (view === 'ideas') return 'Search ideas';
  if (view === 'post') return 'Search the publishing queue';
  return 'Search scenes or presets';
}

function normalizeSearchText(value) {
  return value.toLowerCase().replace(/&/gu, 'and').replace(/\s+/gu, ' ').trim();
}

function getProgress(scene, statuses) {
  const targets = getSceneTargets(scene);
  const postedCount = targets.filter(
    (presetName) => statuses[getStatusKey(scene.key, presetName)]
  ).length;

  return { postedCount, totalCount: targets.length };
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
  const [selectedStat, setSelectedStat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [todoSourcePath, setTodoSourcePath] = useState('');
  const deferredSearchText = useDeferredValue(searchText);

  const loadCatalog = useCallback(async (isCancelled) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(CATALOG_ENDPOINT);
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
    return DEV_PAGES.filter(
      (tool) =>
        !query ||
        normalizeSearchText(
          `${tool.label} ${tool.slug} ${tool.description}`
        ).includes(query)
    );
  }, [deferredSearchText]);

  const filteredDemoScenes = useMemo(() => {
    const query = deferredSearchText.trim().toLowerCase();
    const ids = new Set(demoSceneIds);

    return scenes.filter(
      (scene) =>
        ids.has(scene.id) &&
        (!query ||
          `${scene.label} ${scene.slug} ${scene.channelLabel} ${scene.areaLabel}`
            .toLowerCase()
            .includes(query))
    );
  }, [deferredSearchText, demoSceneIds, scenes]);

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
        ...scene.presetNames,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [area, channel, deferredSearchText, scenes, statuses, view]);

  const allEntries = useMemo(() => {
    const devTools =
      (area === 'all' || area === 'devtools') && channel === 'all'
        ? filteredDevTools.map(toCatalogDevTool)
        : [];

    return [...filteredScenes, ...devTools].sort(
      (left, right) =>
        left.label.localeCompare(right.label, undefined, {
          sensitivity: 'base',
        }) || left.key.localeCompare(right.key)
    );
  }, [area, channel, filteredDevTools, filteredScenes]);

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

  const handleManageTodo = useCallback((sourcePath) => {
    setTodoSourcePath(sourcePath);
    setError('');
    startTransition(() => {
      setSelectedStat(null);
      setView('todos');
    });
  }, []);

  const handleTodoError = useCallback((message) => setError(message), []);

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
  if (!loading && view === 'all') resultLabel = `${allEntries.length} entries`;
  if (!loading && view === 'ideas')
    resultLabel = `${filteredIdeas.length} ideas`;
  if (!loading && view === 'post') {
    resultLabel = `${filteredScenes.length + filteredDemoScenes.length + filteredDevTools.length} publishing targets`;
  }
  if (!loading && view === 'todos') resultLabel = 'TODO manager';
  let storageLabel = 'Checked-in catalog';
  if (saving) storageLabel = 'Saving to catalog.json...';
  if (view === 'todos') storageLabel = 'Colocated Markdown';

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
        className={`cataloggr-toolbar ${view === 'post' || view === 'ideas' || view === 'todos' ? 'cataloggr-toolbar--compact' : ''}`}
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
        {view !== 'todos' ? (
          <input
            aria-label="Search scenes and presets"
            onChange={(event) => setSearchText(event.target.value)}
            placeholder={getSearchPlaceholder(view)}
            type="search"
            value={searchText}
          />
        ) : null}
        {view !== 'post' && view !== 'ideas' && view !== 'todos' ? (
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
          </select>
        ) : null}
        {view !== 'post' && view !== 'ideas' && view !== 'todos' ? (
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
      </section>

      <div className="cataloggr-result-bar">
        <span>{resultLabel}</span>
        <span className="cataloggr-result-bar__end">
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
      {view === 'post' ? (
        <PostBoard
          demoScenes={filteredDemoScenes}
          devTools={filteredDevTools}
          disabled={loading || saving}
          onManageTodo={handleManageTodo}
          onToggle={handleToggle}
          showcaseScenes={filteredScenes}
          statuses={statuses}
        />
      ) : null}
      {view === 'todos' ? (
        <TodoWorkspace
          initialSourcePath={todoSourcePath}
          onError={handleTodoError}
        />
      ) : null}
      {view !== 'post' && view !== 'ideas' && view !== 'todos' ? (
        <section className="cataloggr-list" aria-label="Scenes and dev tools">
          {(view === 'all' ? allEntries : filteredScenes).map((scene) => (
            <SceneRow
              disabled={loading || saving}
              key={scene.key}
              onManageTodo={handleManageTodo}
              onToggle={handleToggle}
              scene={scene}
              statuses={statuses}
            />
          ))}
        </section>
      ) : null}
    </main>
  );
}
