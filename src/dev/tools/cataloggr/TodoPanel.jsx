import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  FiAlertTriangle,
  FiEdit3,
  FiEye,
  FiPlus,
  FiRefreshCw,
} from 'react-icons/fi';

import TodoMarkdownViewer from './TodoMarkdownViewer';
import {
  TODO_SECTIONS,
  addTaskContent,
  editTaskContent,
  readTodo,
  removeTaskContent,
  toggleTaskContent,
  writeTodo,
} from './todoApi';

function TodoPanel({ onError, onSaved, sourcePath }) {
  const [document, setDocument] = useState(null);
  const [draft, setDraft] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [quickAddText, setQuickAddText] = useState('');
  const [quickAddSection, setQuickAddSection] = useState('TODO');
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [reviewingFormat, setReviewingFormat] = useState(false);
  const [documentMode, setDocumentMode] = useState('viewer');
  const dirty = draft !== savedContent;

  const applySaved = useCallback((saved) => {
    setDocument(saved);
    setDraft(saved.content);
    setSavedContent(saved.content);
  }, []);

  const loadDocument = useCallback(async () => {
    setLoading(true);
    try {
      applySaved(await readTodo(sourcePath));
      setMissing(false);
      setConflict(false);
      setReviewingFormat(false);
    } catch (error) {
      if (error.code === 'TODO_NOT_FOUND') setMissing(true);
      else onError(error.message);
    } finally {
      setLoading(false);
    }
  }, [applySaved, onError, sourcePath]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  useEffect(() => {
    if (!document || !dirty || conflict) return undefined;
    const timeout = window.setTimeout(async () => {
      setSaving(true);
      try {
        applySaved(await writeTodo(document, draft));
        onSaved();
      } catch (error) {
        if (error.code === 'TODO_CONFLICT') setConflict(true);
        onError(error.message);
      } finally {
        setSaving(false);
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [applySaved, conflict, dirty, document, draft, onError, onSaved]);

  const handleQuickAdd = useCallback(async () => {
    if (!quickAddText.trim()) return;
    setSaving(true);
    try {
      const current = await readTodo(sourcePath);
      applySaved(
        await writeTodo(
          current,
          addTaskContent(current, quickAddSection, quickAddText)
        )
      );
      setQuickAddText('');
      onSaved();
    } catch (error) {
      if (error.code === 'TODO_CONFLICT') setConflict(true);
      onError(error.message);
    } finally {
      setSaving(false);
    }
  }, [applySaved, onError, onSaved, quickAddSection, quickAddText, sourcePath]);

  const updateDraft = useCallback(
    (transform) => {
      try {
        setDraft(transform(draft));
      } catch (error) {
        onError(error.message);
      }
    },
    [draft, onError]
  );

  const handleToggleTask = useCallback(
    (offset, checked) =>
      updateDraft((current) => toggleTaskContent(current, offset, checked)),
    [updateDraft]
  );

  const handleDeleteTask = useCallback(
    (start, end) =>
      updateDraft((current) => removeTaskContent(current, start, end)),
    [updateDraft]
  );

  const handleEditTask = useCallback(
    (offset, text) =>
      updateDraft((current) => editTaskContent(current, offset, text)),
    [updateDraft]
  );

  if (missing) {
    return (
      <p className="cataloggr-detail__empty">
        No todo.md in <code>{sourcePath}</code> yet.
      </p>
    );
  }

  let saveLabel = 'Saved';
  if (dirty) saveLabel = 'Unsaved';
  if (saving) saveLabel = 'Saving...';
  if (conflict) saveLabel = 'Conflict';

  const locked = !document || saving || dirty;

  return (
    <div className="cataloggr-todo-editor">
      <div className="cataloggr-todo-editor__header">
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
            Markdown
          </button>
        </div>
        <small>{saveLabel}</small>
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
          disabled={locked}
          onChange={(event) => setQuickAddSection(event.target.value)}
          value={quickAddSection}
        >
          {TODO_SECTIONS.map((section) => (
            <option key={section} value={section}>
              {section}
            </option>
          ))}
        </select>
        <input
          aria-label="New TODO item"
          disabled={locked}
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
          disabled={locked || !quickAddText.trim()}
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
          <button onClick={loadDocument} type="button">
            <FiRefreshCw aria-hidden="true" /> Reload
          </button>
        </div>
      ) : null}

      {documentMode === 'viewer' ? (
        <TodoMarkdownViewer
          content={draft}
          disabled={!document || loading || saving || conflict}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
          onToggleTask={handleToggleTask}
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
    </div>
  );
}

export default memo(TodoPanel);
