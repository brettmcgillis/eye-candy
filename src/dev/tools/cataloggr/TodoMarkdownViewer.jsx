import React, {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

import remarkGfm from 'remark-gfm';

import { getTaskText } from './todoApi';

function MarkdownLink({ children, ...props }) {
  return (
    <a {...props} rel="noreferrer" target="_blank">
      {children}
    </a>
  );
}

const TaskActionsContext = createContext(null);
const TaskItemContext = createContext(null);

function TaskEditor({ initialText, onCancel, onSave }) {
  const [text, setText] = useState(initialText);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <input
      aria-label="Edit item"
      ref={inputRef}
      className="cataloggr-todo-markdown__edit"
      onBlur={() => (text.trim() ? onSave(text) : onCancel())}
      onChange={(event) => setText(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') onCancel();
      }}
      type="text"
      value={text}
    />
  );
}

function MarkdownCheckbox({ checked, node, ...props }) {
  const actions = useContext(TaskActionsContext);
  const item = useContext(TaskItemContext);
  const startOffset = item?.start ?? node?.position?.start?.offset ?? null;
  const endOffset = item?.end ?? node?.position?.end?.offset ?? null;
  const disabled = actions.disabled || startOffset === null;

  return (
    <>
      <input
        {...props}
        checked={checked}
        disabled={disabled}
        onChange={(event) =>
          actions.onToggleTask(startOffset, event.target.checked)
        }
      />
      <span className="cataloggr-todo-markdown__actions">
        <button
          aria-label="Edit item"
          disabled={disabled}
          onClick={item?.startEditing}
          title="Edit item (or double-click)"
          type="button"
        >
          <FiEdit2 aria-hidden="true" />
        </button>
        {checked ? (
          <button
            aria-label="Delete completed item"
            className="cataloggr-todo-markdown__delete"
            disabled={disabled}
            onClick={() => actions.onDeleteTask(startOffset, endOffset)}
            title="Delete item"
            type="button"
          >
            <FiTrash2 aria-hidden="true" />
          </button>
        ) : null}
      </span>
    </>
  );
}

function MarkdownListItem({ children, className, node, ...props }) {
  const actions = useContext(TaskActionsContext);
  const [editing, setEditing] = useState(false);
  const startOffset = node?.position?.start?.offset ?? null;
  const endOffset = node?.position?.end?.offset ?? null;
  const isTask = className?.includes('task-list-item');
  const item = useMemo(
    () => ({
      end: endOffset,
      startEditing: () => setEditing(true),
      start: startOffset,
    }),
    [endOffset, startOffset]
  );

  if (isTask && editing) {
    const checkbox = React.Children.toArray(children).find(
      (child) => child?.type === MarkdownCheckbox
    );

    return (
      <li className={className} {...props}>
        <TaskItemContext.Provider value={item}>
          {checkbox}
        </TaskItemContext.Provider>
        <TaskEditor
          initialText={getTaskText(actions.content, startOffset)}
          onCancel={() => setEditing(false)}
          onSave={(text) => {
            setEditing(false);
            actions.onEditTask(startOffset, text);
          }}
        />
      </li>
    );
  }

  return (
    <TaskItemContext.Provider value={item}>
      <li
        className={className}
        onDoubleClick={
          isTask && !actions.disabled && startOffset !== null
            ? () => setEditing(true)
            : undefined
        }
        {...props}
      >
        {children}
      </li>
    </TaskItemContext.Provider>
  );
}

const MARKDOWN_COMPONENTS = {
  a: MarkdownLink,
  input: MarkdownCheckbox,
  li: MarkdownListItem,
};

function TodoMarkdownViewer({
  content,
  disabled,
  onDeleteTask,
  onEditTask,
  onToggleTask,
}) {
  const actions = useMemo(
    () => ({ content, disabled, onDeleteTask, onEditTask, onToggleTask }),
    [content, disabled, onDeleteTask, onEditTask, onToggleTask]
  );

  return (
    <TaskActionsContext.Provider value={actions}>
      <div className="cataloggr-todo-markdown">
        <ReactMarkdown
          components={MARKDOWN_COMPONENTS}
          remarkPlugins={[remarkGfm]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </TaskActionsContext.Provider>
  );
}

export default memo(TodoMarkdownViewer);
