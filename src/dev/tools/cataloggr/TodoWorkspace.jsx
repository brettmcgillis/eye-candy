import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAlertTriangle,
  FiEdit3,
  FiEye,
  FiFileText,
  FiPlus,
  FiRefreshCw,
} from 'react-icons/fi';

import TodoMarkdownViewer from './TodoMarkdownViewer';
import {
  TODO_SECTIONS,
  addTaskContent,
  listTodos,
  readTodo,
  toggleTaskContent,
  writeTodo,
} from './todoApi';

function TodoWorkspace({ initialSourcePath, onError }) {
  const [todos, setTodos] = useState([]);
  const [selectedSourcePath, setSelectedSourcePath] = useState('');
  const [document, setDocument] = useState(null);
  const [draft, setDraft] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [complianceOnly, setComplianceOnly] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [quickAddSection, setQuickAddSection] = useState('TODO');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [reviewingFormat, setReviewingFormat] = useState(false);
  const [documentMode, setDocumentMode] = useState('viewer');
  const dirty = draft !== savedContent;

  const refreshTodos = useCallback(async () => {
    const nextTodos = await listTodos();
    setTodos(nextTodos);
    return nextTodos;
  }, []);

  const loadDocument = useCallback(async (sourcePath) => {
    if (!sourcePath) return null;
    const nextDocument = await readTodo(sourcePath);
    setDocument(nextDocument);
    setDraft(nextDocument.content);
    setSavedContent(nextDocument.content);
    setConflict(false);
    setReviewingFormat(false);
    setDocumentMode('viewer');
    return nextDocument;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const nextTodos = await refreshTodos();
        if (cancelled) return;
        const preferredSource =
          initialSourcePath &&
          nextTodos.some((todo) => todo.sourcePath === initialSourcePath)
            ? initialSourcePath
            : (nextTodos[0]?.sourcePath ?? '');
        setSelectedSourcePath(preferredSource);
        await loadDocument(preferredSource);
      } catch (error) {
        if (!cancelled) onError(error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [initialSourcePath, loadDocument, onError, refreshTodos]);

  useEffect(() => {
    if (!document || draft === savedContent || conflict) return undefined;
    const timeout = window.setTimeout(async () => {
      setSaving(true);
      try {
        const saved = await writeTodo(document, draft);
        setDocument(saved);
        setDraft(saved.content);
        setSavedContent(saved.content);
        await refreshTodos();
      } catch (error) {
        if (error.code === 'TODO_CONFLICT') setConflict(true);
        onError(error.message);
      } finally {
        setSaving(false);
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [conflict, document, draft, onError, refreshTodos, savedContent]);

  const handleSelect = useCallback(
    async (sourcePath) => {
      setSelectedSourcePath(sourcePath);
      setLoading(true);
      try {
        if (document && draft !== savedContent && !conflict) {
          await writeTodo(document, draft);
        }
        await loadDocument(sourcePath);
      } catch (error) {
        onError(error.message);
      } finally {
        setLoading(false);
      }
    },
    [conflict, document, draft, loadDocument, onError, savedContent]
  );

  const handleQuickAdd = useCallback(async () => {
    if (!selectedSourcePath || !quickAddText.trim()) return;
    setSaving(true);
    try {
      const current = await readTodo(selectedSourcePath);
      const saved = await writeTodo(
        current,
        addTaskContent(current, quickAddSection, quickAddText)
      );
      setDocument(saved);
      setDraft(saved.content);
      setSavedContent(saved.content);
      setQuickAddText('');
      await refreshTodos();
    } catch (error) {
      if (error.code === 'TODO_CONFLICT') setConflict(true);
      onError(error.message);
    } finally {
      setSaving(false);
    }
  }, [
    onError,
    quickAddSection,
    quickAddText,
    refreshTodos,
    selectedSourcePath,
  ]);

  const handleViewerTaskToggle = useCallback(
    (taskOffset, checked) => {
      try {
        setDraft((current) => toggleTaskContent(current, taskOffset, checked));
      } catch (error) {
        onError(error.message);
      }
    },
    [onError]
  );

  const visibleTodos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return todos
      .filter((todo) => !complianceOnly || todo.issues.length)
      .filter((todo) => {
        if (
          normalizedQuery &&
          !`${todo.title} ${todo.sourcePath} ${todo.searchText}`
            .toLowerCase()
            .includes(normalizedQuery)
        ) {
          return false;
        }

        if (sectionFilter === 'all') return true;
        return todo.tasks.some(
          (task) =>
            task.section === sectionFilter && (showCompleted || !task.checked)
        );
      })
      .sort(
        (left, right) =>
          left.title.localeCompare(right.title, undefined, {
            sensitivity: 'base',
          }) || left.sourcePath.localeCompare(right.sourcePath)
      );
  }, [complianceOnly, query, sectionFilter, showCompleted, todos]);

  let saveLabel = 'Autosaved';
  if (dirty) saveLabel = 'Waiting to autosave...';
  if (saving) saveLabel = 'Saving...';
  if (conflict) saveLabel = 'Conflict: reload required';

  return (
    <section className="cataloggr-todos" aria-label="Scene TODO manager">
      <div className="cataloggr-todos__filters">
        <input
          aria-label="Search scene TODOs"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tasks and scenes"
          type="search"
          value={query}
        />
        <select
          aria-label="Filter TODO section"
          onChange={(event) => setSectionFilter(event.target.value)}
          value={sectionFilter}
        >
          <option value="all">All sections</option>
          {TODO_SECTIONS.map((section) => (
            <option key={section} value={section}>
              {section}
            </option>
          ))}
        </select>
        <label htmlFor="cataloggr-show-completed">
          <input
            checked={showCompleted}
            id="cataloggr-show-completed"
            onChange={(event) => setShowCompleted(event.target.checked)}
            type="checkbox"
          />
          Completed
        </label>
        <label htmlFor="cataloggr-compliance-only">
          <input
            checked={complianceOnly}
            id="cataloggr-compliance-only"
            onChange={(event) => setComplianceOnly(event.target.checked)}
            type="checkbox"
          />
          Format issues
        </label>
      </div>

      <div className="cataloggr-todos__layout">
        <div className="cataloggr-todos__browser">
          {visibleTodos.map((todo) => (
            <article className="cataloggr-todo-group" key={todo.sourcePath}>
              <button
                aria-current={
                  todo.sourcePath === selectedSourcePath ? 'true' : undefined
                }
                className="cataloggr-todo-group__heading"
                onClick={() => handleSelect(todo.sourcePath)}
                type="button"
              >
                <span>
                  <strong>{todo.title}</strong>
                  <small>{todo.sourcePath}</small>
                </span>
                <span className="cataloggr-todo-group__counts">
                  {todo.issues.length ? (
                    <FiAlertTriangle aria-label="Format issues" />
                  ) : null}
                  {todo.openCount} open
                </span>
              </button>
            </article>
          ))}
        </div>

        <aside className="cataloggr-todo-editor">
          <div className="cataloggr-todo-editor__header">
            <span>
              <FiFileText aria-hidden="true" />
              <strong>{document?.title ?? 'Scene TODO'}</strong>
            </span>
            <div className="cataloggr-todo-editor__tools">
              <div
                aria-label="TODO document mode"
                className="cataloggr-todo-mode"
                role="group"
              >
                <button
                  aria-pressed={documentMode === 'viewer'}
                  onClick={() => setDocumentMode('viewer')}
                  title="View rendered Markdown"
                  type="button"
                >
                  <FiEye aria-hidden="true" />
                  Viewer
                </button>
                <button
                  aria-pressed={documentMode === 'editor'}
                  onClick={() => setDocumentMode('editor')}
                  title="Edit Markdown"
                  type="button"
                >
                  <FiEdit3 aria-hidden="true" />
                  Edit
                </button>
              </div>
              <small>{saveLabel}</small>
            </div>
          </div>

          {document?.issues.length ? (
            <div className="cataloggr-todo-editor__issues">
              <div>
                <strong>Format audit</strong>
                <button
                  disabled={dirty || saving}
                  onClick={() => setReviewingFormat(true)}
                  type="button"
                >
                  Review standard format
                </button>
              </div>
              {document.issues.map((issue) => (
                <span key={issue}>{issue}</span>
              ))}
            </div>
          ) : null}

          {reviewingFormat ? (
            <div className="cataloggr-todo-format-review">
              <div>
                <strong>Current</strong>
                <textarea readOnly value={document.content} />
              </div>
              <div>
                <strong>Proposed</strong>
                <textarea readOnly value={document.normalizedContent} />
              </div>
              <div className="cataloggr-todo-format-review__actions">
                <button
                  className="dev-button"
                  onClick={() => setReviewingFormat(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="dev-button dev-button--primary"
                  onClick={() => {
                    setDraft(document.normalizedContent);
                    setReviewingFormat(false);
                  }}
                  type="button"
                >
                  Apply standard format
                </button>
              </div>
            </div>
          ) : null}

          <div className="cataloggr-todo-quick-add">
            <select
              aria-label="Quick-add section"
              disabled={!document || saving || dirty}
              onChange={(event) => setQuickAddSection(event.target.value)}
              value={quickAddSection}
            >
              {TODO_SECTIONS.slice(1).map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
            <input
              aria-label="New TODO item"
              disabled={!document || saving || dirty}
              onChange={(event) => setQuickAddText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleQuickAdd();
              }}
              placeholder="Add an item"
              type="text"
              value={quickAddText}
            />
            <button
              aria-label="Add TODO item"
              disabled={!document || saving || dirty || !quickAddText.trim()}
              onClick={handleQuickAdd}
              title="Add item"
              type="button"
            >
              <FiPlus aria-hidden="true" />
            </button>
          </div>

          {conflict ? (
            <div className="cataloggr-todo-conflict" role="alert">
              <FiAlertTriangle aria-hidden="true" />
              <span>This file changed on disk. Reload before editing.</span>
              <button
                onClick={() => loadDocument(selectedSourcePath)}
                type="button"
              >
                <FiRefreshCw aria-hidden="true" /> Reload
              </button>
            </div>
          ) : null}

          {documentMode === 'viewer' ? (
            <TodoMarkdownViewer
              content={draft}
              disabled={!document || loading || saving || conflict}
              onToggleTask={handleViewerTaskToggle}
            />
          ) : (
            <textarea
              aria-label="Scene TODO Markdown"
              disabled={!document || loading || conflict}
              onChange={(event) => setDraft(event.target.value)}
              spellCheck="true"
              value={draft}
            />
          )}
        </aside>
      </div>
    </section>
  );
}

export default memo(TodoWorkspace);
