import React, { createContext, memo, useContext, useMemo } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

import remarkGfm from 'remark-gfm';

function MarkdownLink({ children, ...props }) {
  return (
    <a {...props} rel="noreferrer" target="_blank">
      {children}
    </a>
  );
}

const TaskDisabledContext = createContext(true);
const TaskOffsetContext = createContext(null);
const TaskToggleContext = createContext(null);
const TaskDeleteContext = createContext(null);

function MarkdownListItem({ children, node, ...props }) {
  const startOffset = node?.position?.start?.offset ?? null;
  const endOffset = node?.position?.end?.offset ?? null;
  const taskOffset = useMemo(
    () => ({ end: endOffset, start: startOffset }),
    [endOffset, startOffset]
  );

  return (
    <TaskOffsetContext.Provider value={taskOffset}>
      <li {...props}>{children}</li>
    </TaskOffsetContext.Provider>
  );
}

function MarkdownCheckbox({ checked, node, ...props }) {
  const disabled = useContext(TaskDisabledContext);
  const contextOffset = useContext(TaskOffsetContext);
  const startOffset =
    contextOffset?.start ?? node?.position?.start?.offset ?? null;
  const endOffset = contextOffset?.end ?? node?.position?.end?.offset ?? null;
  const onToggleTask = useContext(TaskToggleContext);
  const onDeleteTask = useContext(TaskDeleteContext);

  return (
    <>
      <input
        {...props}
        checked={checked}
        disabled={disabled || startOffset === null}
        onChange={(event) => onToggleTask?.(startOffset, event.target.checked)}
      />
      {checked ? (
        <button
          aria-label="Delete completed item"
          className="cataloggr-todo-markdown__delete"
          disabled={disabled || startOffset === null}
          onClick={() => onDeleteTask?.(startOffset, endOffset)}
          title="Delete item"
          type="button"
        >
          <FiTrash2 aria-hidden="true" />
        </button>
      ) : null}
    </>
  );
}

const MARKDOWN_COMPONENTS = {
  a: MarkdownLink,
  input: MarkdownCheckbox,
  li: MarkdownListItem,
};

function TodoMarkdownViewer({ content, disabled, onDeleteTask, onToggleTask }) {
  return (
    <TaskDisabledContext.Provider value={disabled}>
      <TaskToggleContext.Provider value={onToggleTask}>
        <TaskDeleteContext.Provider value={onDeleteTask}>
          <div className="cataloggr-todo-markdown">
            <ReactMarkdown
              components={MARKDOWN_COMPONENTS}
              remarkPlugins={[remarkGfm]}
            >
              {content}
            </ReactMarkdown>
          </div>
        </TaskDeleteContext.Provider>
      </TaskToggleContext.Provider>
    </TaskDisabledContext.Provider>
  );
}

export default memo(TodoMarkdownViewer);
