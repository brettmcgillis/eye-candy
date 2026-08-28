import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  FiCheck,
  FiCornerUpLeft,
  FiEdit2,
  FiMove,
  FiPlus,
  FiShuffle,
  FiTrash2,
  FiX,
} from 'react-icons/fi';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function createIdeaId() {
  return `idea-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const IdeaEditor = memo(function IdeaEditor({
  initialText = '',
  onCancel,
  onSave,
  submitLabel,
}) {
  const [text, setText] = useState(initialText);

  function handleSubmit(event) {
    event.preventDefault();
    const nextText = text.trim();
    if (nextText) onSave(nextText);
  }

  return (
    <form className="cataloggr-idea-editor" onSubmit={handleSubmit}>
      <textarea
        aria-label="Scene idea"
        onChange={(event) => setText(event.target.value)}
        placeholder="What should exist?"
        rows={4}
        value={text}
      />
      <div className="cataloggr-idea-editor__actions">
        <button className="dev-button" onClick={onCancel} type="button">
          <FiX aria-hidden="true" /> Cancel
        </button>
        <button
          className="dev-button dev-button--primary"
          disabled={!text.trim()}
          type="submit"
        >
          <FiCheck aria-hidden="true" /> {submitLabel}
        </button>
      </div>
    </form>
  );
});

const SortableIdea = memo(function SortableIdea({
  disabled,
  editing,
  idea,
  onCancelEdit,
  onDelete,
  onEdit,
  onSaveEdit,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: idea.id, disabled });

  return (
    <article
      className="cataloggr-idea"
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Reorder idea"
        className="cataloggr-idea__drag"
        disabled={disabled}
        title="Drag to reorder"
        type="button"
      >
        <FiMove aria-hidden="true" />
      </button>

      {editing ? (
        <IdeaEditor
          initialText={idea.text}
          onCancel={onCancelEdit}
          onSave={onSaveEdit}
          submitLabel="Save"
        />
      ) : (
        <p>{idea.text}</p>
      )}

      {!editing ? (
        <div className="cataloggr-idea__actions">
          <button
            aria-label="Edit idea"
            disabled={disabled}
            onClick={() => onEdit(idea.id)}
            title="Edit idea"
            type="button"
          >
            <FiEdit2 aria-hidden="true" />
          </button>
          <button
            aria-label="Delete idea"
            disabled={disabled}
            onClick={() => onDelete(idea.id)}
            title="Delete idea"
            type="button"
          >
            <FiTrash2 aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </article>
  );
});

function IdeaBoard({ disabled, ideas, onChange, visibleIdeas }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [pickedIdea, setPickedIdea] = useState(null);
  const [removedIdea, setRemovedIdea] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  useEffect(() => {
    if (!removedIdea) return undefined;
    const timeout = window.setTimeout(() => setRemovedIdea(null), 8000);
    return () => window.clearTimeout(timeout);
  }, [removedIdea]);

  const handleAdd = useCallback(
    async (text) => {
      const saved = await onChange([...ideas, { id: createIdeaId(), text }]);
      if (saved) setAdding(false);
    },
    [ideas, onChange]
  );

  const handleDelete = useCallback(
    async (ideaId) => {
      const index = ideas.findIndex((idea) => idea.id === ideaId);
      if (index < 0) return;
      const deleted = { idea: ideas[index], index };
      const saved = await onChange(ideas.filter((idea) => idea.id !== ideaId));
      if (saved) {
        setEditingId(null);
        setPickedIdea(null);
        setRemovedIdea(deleted);
      }
    },
    [ideas, onChange]
  );

  const handleSaveEdit = useCallback(
    async (text) => {
      const saved = await onChange(
        ideas.map((idea) => (idea.id === editingId ? { ...idea, text } : idea))
      );
      if (saved) setEditingId(null);
    },
    [editingId, ideas, onChange]
  );

  const handleUndo = useCallback(async () => {
    if (!removedIdea) return;
    const nextIdeas = [...ideas];
    nextIdeas.splice(removedIdea.index, 0, removedIdea.idea);
    const saved = await onChange(nextIdeas);
    if (saved) setRemovedIdea(null);
  }, [ideas, onChange, removedIdea]);

  const handleDragEnd = useCallback(
    ({ active, over }) => {
      if (!over || active.id === over.id) return;
      const oldIndex = ideas.findIndex((idea) => idea.id === active.id);
      const newIndex = ideas.findIndex((idea) => idea.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0)
        onChange(arrayMove(ideas, oldIndex, newIndex));
    },
    [ideas, onChange]
  );

  const handlePick = useCallback(() => {
    if (!ideas.length) return;
    setPickedIdea(ideas[Math.floor(Math.random() * ideas.length)]);
  }, [ideas]);

  return (
    <section className="cataloggr-ideas" aria-label="Scene ideas">
      <div className="cataloggr-ideas__actions">
        <button
          className="dev-button"
          disabled={!ideas.length}
          onClick={handlePick}
          type="button"
        >
          <FiShuffle aria-hidden="true" /> Pick one
        </button>
        <button
          className="dev-button dev-button--primary"
          disabled={disabled || adding}
          onClick={() => setAdding(true)}
          type="button"
        >
          <FiPlus aria-hidden="true" /> Add idea
        </button>
      </div>

      {pickedIdea ? (
        <div className="cataloggr-idea-pick">
          <span>Try this one</span>
          <p>{pickedIdea.text}</p>
          <button
            aria-label="Dismiss picked idea"
            onClick={() => setPickedIdea(null)}
            type="button"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {adding ? (
        <IdeaEditor
          onCancel={() => setAdding(false)}
          onSave={handleAdd}
          submitLabel="Add idea"
        />
      ) : null}

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <SortableContext
          items={visibleIdeas.map((idea) => idea.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="cataloggr-ideas__list">
            {visibleIdeas.map((idea) => (
              <SortableIdea
                disabled={disabled}
                editing={editingId === idea.id}
                idea={idea}
                key={idea.id}
                onCancelEdit={() => setEditingId(null)}
                onDelete={handleDelete}
                onEdit={setEditingId}
                onSaveEdit={handleSaveEdit}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {removedIdea ? (
        <div className="cataloggr-idea-undo" role="status">
          <span>Idea deleted</span>
          <button disabled={disabled} onClick={handleUndo} type="button">
            <FiCornerUpLeft aria-hidden="true" /> Undo
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default memo(IdeaBoard);
