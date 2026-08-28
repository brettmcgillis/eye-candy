import React, { createContext, memo, useContext } from 'react';
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

function MarkdownListItem({ children, node, ...props }) {
  const taskOffset = node?.position?.start?.offset ?? null;

  return (
    <TaskOffsetContext.Provider value={taskOffset}>
      <li {...props}>{children}</li>
    </TaskOffsetContext.Provider>
  );
}

function MarkdownCheckbox({ node, ...props }) {
  const disabled = useContext(TaskDisabledContext);
  const taskOffset =
    useContext(TaskOffsetContext) ?? node?.position?.start?.offset ?? null;
  const onToggleTask = useContext(TaskToggleContext);

  return (
    <input
      {...props}
      disabled={disabled || taskOffset === null}
      onChange={(event) => onToggleTask?.(taskOffset, event.target.checked)}
    />
  );
}

const MARKDOWN_COMPONENTS = {
  a: MarkdownLink,
  input: MarkdownCheckbox,
  li: MarkdownListItem,
};

function TodoMarkdownViewer({ content, disabled, onToggleTask }) {
  return (
    <TaskDisabledContext.Provider value={disabled}>
      <TaskToggleContext.Provider value={onToggleTask}>
        <div className="cataloggr-todo-markdown">
          <ReactMarkdown
            components={MARKDOWN_COMPONENTS}
            remarkPlugins={[remarkGfm]}
          >
            {content}
          </ReactMarkdown>
        </div>
      </TaskToggleContext.Provider>
    </TaskDisabledContext.Provider>
  );
}

export default memo(TodoMarkdownViewer);
