import React, { useEffect, useMemo, useRef, useState } from 'react';

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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './GradientsPage.css';

const GRADIENTS_ENDPOINT = '/dev-api/gradients';
const GRADIENTS_WRITE_ENDPOINT = '/dev-api/gradients/write';

const DEFAULT_FORM = {
  name: '',
  colorsText: '#0F172A, #1D4ED8, #F8FAFC',
};

let colorEntryId = 0;

function createColorEntry(color) {
  colorEntryId += 1;
  return { id: `gradient-color-${colorEntryId}`, color };
}

function createColorEntries(colors, currentEntries = []) {
  return colors.map((color, index) =>
    currentEntries[index]
      ? { ...currentEntries[index], color }
      : createColorEntry(color)
  );
}

function normalizeHex(value) {
  const next = String(value || '').trim();
  if (!next) return null;
  const match = next.match(
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/u
  );
  return match ? next.toUpperCase() : null;
}

function parseColors(text) {
  return String(text || '')
    .split(/[\n,]+/u)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => normalizeHex(entry))
    .filter(Boolean);
}

function gradientBackground(colors) {
  if (!colors.length) return 'transparent';
  if (colors.length === 1) return colors[0];
  return `linear-gradient(135deg, ${colors.join(', ')})`;
}

function readJsonResponse(response) {
  return response.json().catch(() => ({}));
}

function SortableColorChip({ colorEntry, onEdit, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: colorEntry.id });

  return (
    <div
      className="gradients-page__preview-chip-wrap"
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        {...attributes}
        {...listeners}
        className="gradients-page__preview-chip"
        type="button"
        aria-label={`Edit color ${colorEntry.color}`}
        title={colorEntry.color}
        onClick={() => onEdit(colorEntry.id)}
        style={{ '--chip-color': colorEntry.color }}
      />
      <button
        type="button"
        aria-label={`Remove color ${colorEntry.color}`}
        title="Remove color"
        className="gradients-page__remove-chip"
        onClick={() => onRemove(colorEntry.id)}
      >
        ×
      </button>
    </div>
  );
}

export default function GradientsPage() {
  const [gradients, setGradients] = useState([]);
  const [selectedName, setSelectedName] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchText, setSearchText] = useState('');
  const [toneFilter, setToneFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [modalForm, setModalForm] = useState(DEFAULT_FORM);
  const [modalColorEntries, setModalColorEntries] = useState(() =>
    createColorEntries(parseColors(DEFAULT_FORM.colorsText))
  );
  const [error, setError] = useState('');
  const [colorPickerId, setColorPickerId] = useState(null);
  const colorPickerRef = useRef(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const modalPreviewColors = modalColorEntries.map((entry) => entry.color);

  useEffect(() => {
    let cancelled = false;

    async function loadGradients() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(GRADIENTS_ENDPOINT);
        const payload = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(payload.message || 'Failed to load gradients.');
        }

        if (!cancelled) {
          const nextGradients = Array.isArray(payload.gradients)
            ? payload.gradients
            : [];
          setGradients(nextGradients);

          if (nextGradients.length) {
            setSelectedName(nextGradients[0].name);
          } else {
            setSelectedName('');
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load gradients.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGradients();
    return () => {
      cancelled = true;
    };
  }, []);

  const toneCounts = useMemo(
    () =>
      Array.from(
        new Set(gradients.map((gradient) => gradient.colors.length))
      ).sort((a, b) => a - b),
    [gradients]
  );

  const filteredGradients = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const rows = gradients
      .filter((gradient) =>
        query ? gradient.name.toLowerCase().includes(query) : true
      )
      .filter((gradient) =>
        toneFilter === 'all'
          ? true
          : gradient.colors.length === Number(toneFilter)
      );

    rows.sort((a, b) => {
      const primaryCompare =
        sortKey === 'colorCount'
          ? a.colors.length - b.colors.length
          : a.name.localeCompare(b.name);

      return sortDirection === 'asc' ? primaryCompare : -primaryCompare;
    });

    return rows;
  }, [gradients, searchText, sortDirection, sortKey, toneFilter]);

  function openAddModal() {
    setModalMode('add');
    setModalForm(DEFAULT_FORM);
    setModalColorEntries(
      createColorEntries(parseColors(DEFAULT_FORM.colorsText))
    );
    setError('');
    setModalOpen(true);
  }

  function openEditModal(gradient) {
    setSelectedName(gradient.name);
    setModalMode('edit');
    setModalForm({
      name: gradient.name,
      colorsText: gradient.colors.join(', '),
    });
    setModalColorEntries(createColorEntries(gradient.colors));
    setError('');
    setModalOpen(true);
  }

  function openCopyModal(gradient) {
    setModalMode('add');
    setModalForm({
      name: `${gradient.name} (copy)`,
      colorsText: gradient.colors.join(', '),
    });
    setModalColorEntries(createColorEntries(gradient.colors));
    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setError('');
    setColorPickerId(null);
  }

  function handleSort(key) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection('asc');
      return;
    }

    setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
  }

  function setModalColors(nextEntries) {
    setModalColorEntries(nextEntries);
    setModalForm((current) => ({
      ...current,
      colorsText: nextEntries.map((entry) => entry.color).join(', '),
    }));
  }

  function handleAddColor() {
    setModalColors([...modalColorEntries, createColorEntry('#FFFFFF')]);
  }

  function handleColorsTextChange(value) {
    const nextColors = parseColors(value);
    setModalForm((current) => ({ ...current, colorsText: value }));
    setModalColorEntries((current) => createColorEntries(nextColors, current));
  }

  function handleSelectColor(id) {
    setColorPickerId(id);
    setTimeout(() => colorPickerRef.current?.click(), 0);
  }

  function handleColorChange(event) {
    const nextColor = normalizeHex(event.target.value);
    if (!nextColor || !colorPickerId) {
      return;
    }

    setModalColors(
      modalColorEntries.map((entry) =>
        entry.id === colorPickerId ? { ...entry, color: nextColor } : entry
      )
    );
  }

  function handleRemoveColor(id) {
    setModalColors(modalColorEntries.filter((entry) => entry.id !== id));
    if (colorPickerId === id) {
      setColorPickerId(null);
    }
  }

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = modalColorEntries.findIndex(
      (entry) => entry.id === active.id
    );
    const newIndex = modalColorEntries.findIndex(
      (entry) => entry.id === over.id
    );
    setModalColors(arrayMove(modalColorEntries, oldIndex, newIndex));
  }

  async function handleSave() {
    const name = modalForm.name.trim();
    const colors = modalPreviewColors;

    if (!name) {
      setError('A gradient name is required.');
      return;
    }

    if (!colors.length) {
      setError('Add at least one valid hex color, e.g. #0f172a, #fbbf24');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(GRADIENTS_WRITE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          colors,
        }),
      });

      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(payload.message || 'Failed to save the gradient.');
      }

      const nextGradients = Array.isArray(payload.gradients)
        ? payload.gradients
        : [];
      setGradients(nextGradients);
      setSelectedName(name);
      setModalForm({
        name,
        colorsText: colors.join(', '),
      });
      setModalOpen(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save gradient.'
      );
    } finally {
      setSaving(false);
    }
  }

  const sortArrow = sortDirection === 'asc' ? '↑' : '↓';
  let saveLabel = 'Save changes';
  if (saving) {
    saveLabel = 'Saving…';
  } else if (modalMode === 'add') {
    saveLabel = 'Add gradient';
  }

  return (
    <div className="dev-page gradients-page">
      <DevPageHeaderBar title="Gradients & Palettes" />

      <header className="gradients-page__header">
        <div>
          <button
            className="dev-button dev-button--primary"
            type="button"
            onClick={openAddModal}
          >
            + Add gradient
          </button>
        </div>
      </header>

      <div className="gradients-page__toolbar">
        <input
          className="gradients-page__search"
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search gradients…"
          aria-label="Search gradients"
        />

        <select
          className="gradients-page__tone-filter"
          value={toneFilter}
          onChange={(event) => setToneFilter(event.target.value)}
          aria-label="Filter by number of tones"
        >
          <option value="all">All tones</option>
          {toneCounts.map((count) => (
            <option key={count} value={count}>
              {count} {count === 1 ? 'tone' : 'tones'}
            </option>
          ))}
        </select>

        <span className="gradients-page__count">
          {loading ? 'Loading…' : `${filteredGradients.length} gradients`}
        </span>

        <div className="gradients-page__sort-row">
          <button
            className={`dev-button gradients-page__sort${
              sortKey === 'name' ? ' gradients-page__sort--active' : ''
            }`}
            type="button"
            onClick={() => handleSort('name')}
          >
            Sort: Name {sortKey === 'name' ? sortArrow : ''}
          </button>
          <button
            className={`dev-button gradients-page__sort${
              sortKey === 'colorCount' ? ' gradients-page__sort--active' : ''
            }`}
            type="button"
            onClick={() => handleSort('colorCount')}
          >
            Sort: Colors {sortKey === 'colorCount' ? sortArrow : ''}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="dev-page__description">Loading gradients…</p>
      ) : (
        <div className="gradients-page__grid">
          {filteredGradients.map((gradient) => {
            const isSelected = selectedName === gradient.name;
            const colors = gradient.colors || [];
            const colorOccurrences = new Map();

            return (
              <div
                className={`gradients-page__card${
                  isSelected ? ' gradients-page__card--selected' : ''
                }`}
                key={gradient.name}
              >
                <div
                  className="gradients-page__swatch"
                  style={{
                    '--gradient-background': gradientBackground(colors),
                  }}
                />

                <div className="gradients-page__card-body">
                  <div className="gradients-page__card-meta-row">
                    <div>
                      <p className="gradients-page__card-name">
                        {gradient.name}
                      </p>
                      <p className="gradients-page__card-meta">
                        {colors.length} colors
                      </p>
                    </div>
                    <div className="gradients-page__card-actions">
                      <button
                        className="dev-button gradients-page__card-action"
                        type="button"
                        onClick={() => openEditModal(gradient)}
                      >
                        Update
                      </button>
                      <button
                        className="dev-button gradients-page__card-action"
                        type="button"
                        onClick={() => openCopyModal(gradient)}
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="gradients-page__chips">
                    {colors.map((color) => {
                      const occurrence = colorOccurrences.get(color) || 0;
                      colorOccurrences.set(color, occurrence + 1);

                      return (
                        <span
                          className="gradients-page__chip"
                          key={`${gradient.name}-${color}-${occurrence}`}
                          title={color}
                          style={{ '--chip-color': color }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="gradients-page__modal-backdrop" onClick={closeModal}>
          <div
            className="gradients-page__modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="gradients-page__modal-header">
              <h2 className="gradients-page__modal-title">
                {modalMode === 'add' ? 'Add gradient' : 'Update gradient'}
              </h2>
              <button
                type="button"
                aria-label="Close"
                className="gradients-page__close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <div className="gradients-page__form">
              <label className="gradients-page__label" htmlFor="gradient-name">
                Gradient name
                <input
                  id="gradient-name"
                  className="gradients-page__input"
                  value={modalForm.name}
                  onChange={(event) =>
                    setModalForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Midnight Bloom"
                />
              </label>

              <label
                className="gradients-page__label"
                htmlFor="gradient-colors"
              >
                Colors
                <textarea
                  id="gradient-colors"
                  className="gradients-page__textarea"
                  value={modalForm.colorsText}
                  onChange={(event) =>
                    handleColorsTextChange(event.target.value)
                  }
                  placeholder="#0F172A, #1D4ED8, #F8FAFC
#0EA5E9, #F59E0B"
                />
              </label>

              <div className="gradients-page__preview">
                <div className="gradients-page__preview-header">
                  <p className="gradients-page__preview-label">Preview</p>
                  <div className="gradients-page__preview-actions">
                    <span className="gradients-page__card-meta">
                      {modalPreviewColors.length} colors
                    </span>
                    <button
                      type="button"
                      aria-label="Add color"
                      className="gradients-page__preview-add"
                      onClick={handleAddColor}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div
                  className="gradients-page__preview-swatch"
                  style={{
                    '--gradient-background':
                      gradientBackground(modalPreviewColors),
                  }}
                />

                {/* eslint-disable react/jsx-no-bind -- dnd-kit requires function props. */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={modalColorEntries}
                    strategy={rectSortingStrategy}
                  >
                    <div className="gradients-page__preview-chips">
                      {modalColorEntries.map((colorEntry) => (
                        <SortableColorChip
                          colorEntry={colorEntry}
                          key={colorEntry.id}
                          onEdit={handleSelectColor}
                          onRemove={handleRemoveColor}
                        />
                      ))}

                      <button
                        type="button"
                        aria-label="Add color"
                        className="gradients-page__preview-add"
                        onClick={handleAddColor}
                      >
                        +
                      </button>
                    </div>
                  </SortableContext>
                </DndContext>
                {/* eslint-enable react/jsx-no-bind */}

                <input
                  className={`gradients-page__color-picker${
                    colorPickerId === null
                      ? ' gradients-page__color-picker--hidden'
                      : ''
                  }`}
                  ref={colorPickerRef}
                  type="color"
                  value={
                    modalColorEntries.find(
                      (entry) => entry.id === colorPickerId
                    )?.color || '#000000'
                  }
                  onInput={handleColorChange}
                />
              </div>

              {error && <p className="gradients-page__error">{error}</p>}

              <div className="gradients-page__modal-actions">
                <button
                  className="dev-button"
                  type="button"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  className="dev-button dev-button--primary"
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saveLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
