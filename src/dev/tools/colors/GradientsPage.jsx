import React, { useEffect, useMemo, useRef, useState } from 'react';

import DevPageHeaderBar from '../../shell/DevPageHeaderBar';
import './GradientsPage.css';

const GRADIENTS_ENDPOINT = '/dev-api/gradients';
const GRADIENTS_WRITE_ENDPOINT = '/dev-api/gradients/write';

const DEFAULT_FORM = {
  name: '',
  colorsText: '#0F172A, #1D4ED8, #F8FAFC',
};

function normalizeHex(value) {
  const next = String(value || '').trim();
  if (!next) return null;
  const match = next.match(
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/u
  );
  return match ? next.toUpperCase() : null;
}

function parseColors(text) {
  return Array.from(
    new Set(
      String(text || '')
        .split(/[\n,]+/u)
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => normalizeHex(entry))
        .filter(Boolean)
    )
  );
}

function gradientBackground(colors) {
  return `linear-gradient(135deg, ${colors.join(', ')})`;
}

function readJsonResponse(response) {
  return response.json().catch(() => ({}));
}

export default function GradientsPage() {
  const [gradients, setGradients] = useState([]);
  const [selectedName, setSelectedName] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [modalForm, setModalForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState('');
  const [dragIndex, setDragIndex] = useState(null);
  const [hoveredColorIndex, setHoveredColorIndex] = useState(null);
  const [colorPickerIndex, setColorPickerIndex] = useState(null);
  const colorPickerRef = useRef(null);

  const modalPreviewColors = useMemo(
    () => parseColors(modalForm.colorsText),
    [modalForm.colorsText]
  );

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

  const filteredGradients = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const rows = query
      ? gradients.filter((gradient) =>
          gradient.name.toLowerCase().includes(query)
        )
      : gradients;

    rows.sort((a, b) => {
      const primaryCompare =
        sortKey === 'colorCount'
          ? a.colors.length - b.colors.length
          : a.name.localeCompare(b.name);

      return sortDirection === 'asc' ? primaryCompare : -primaryCompare;
    });

    return rows;
  }, [gradients, searchText, sortDirection, sortKey]);

  function openAddModal() {
    setModalMode('add');
    setModalForm(DEFAULT_FORM);
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
    setError('');
    setModalOpen(true);
  }

  function openCopyModal(gradient) {
    setModalMode('add');
    setModalForm({
      name: `${gradient.name} (copy)`,
      colorsText: gradient.colors.join(', '),
    });
    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setError('');
    setColorPickerIndex(null);
    setHoveredColorIndex(null);
  }

  function handleSort(key) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection('asc');
      return;
    }

    setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
  }

  function setModalColors(nextColors) {
    setModalForm((current) => ({
      ...current,
      colorsText: nextColors.join(', '),
    }));
  }

  function handleAddColor() {
    setModalColors([...modalPreviewColors, '#FFFFFF']);
  }

  function handleSelectColor(index) {
    setColorPickerIndex(index);
    setHoveredColorIndex(null);
    setTimeout(() => colorPickerRef.current?.click(), 0);
  }

  function handleColorChange(event) {
    const nextColor = normalizeHex(event.target.value);
    const index = colorPickerIndex;
    if (!nextColor || index === null || index === undefined) {
      return;
    }

    const nextColors = [...modalPreviewColors];
    nextColors[index] = nextColor;
    setModalColors(nextColors);
    setColorPickerIndex(null);
  }

  function handleRemoveColor(index) {
    const nextColors = modalPreviewColors.filter(
      (_, colorIndex) => colorIndex !== index
    );
    setModalColors(nextColors);
    setHoveredColorIndex(null);
    if (colorPickerIndex === index) {
      setColorPickerIndex(null);
    }
  }

  function handleDragStart(index) {
    setDragIndex(index);
  }

  function handleDrop(targetIndex) {
    if (dragIndex === null || dragIndex === undefined) {
      return;
    }

    if (dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }

    const nextColors = [...modalPreviewColors];
    const [movedColor] = nextColors.splice(dragIndex, 1);
    nextColors.splice(targetIndex, 0, movedColor);
    setModalColors(nextColors);
    setDragIndex(null);
  }

  async function handleSave() {
    const name = modalForm.name.trim();
    const colors = parseColors(modalForm.colorsText);

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
                    {colors.map((color) => (
                      <span
                        className="gradients-page__chip"
                        key={`${gradient.name}-${color}`}
                        title={color}
                        style={{ '--chip-color': color }}
                      />
                    ))}
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
                    setModalForm((current) => ({
                      ...current,
                      colorsText: event.target.value,
                    }))
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

                <div className="gradients-page__preview-chips">
                  {modalPreviewColors.map((color, index) => {
                    const isHovered = hoveredColorIndex === index;

                    return (
                      <div
                        className="gradients-page__preview-chip-wrap"
                        key={color}
                        onMouseEnter={() => setHoveredColorIndex(index)}
                        onMouseLeave={() => setHoveredColorIndex(null)}
                      >
                        <button
                          className="gradients-page__preview-chip"
                          type="button"
                          aria-label={`Edit color ${color}`}
                          title={color}
                          draggable
                          onClick={() => handleSelectColor(index)}
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => handleDrop(index)}
                          onDragEnd={() => setDragIndex(null)}
                          style={{ '--chip-color': color }}
                        />
                        {isHovered && (
                          <button
                            type="button"
                            aria-label={`Remove color ${color}`}
                            title="Remove color"
                            className="gradients-page__remove-chip"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveColor(index);
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    aria-label="Add color"
                    className="gradients-page__preview-add"
                    onClick={handleAddColor}
                  >
                    +
                  </button>
                </div>

                <input
                  className={`gradients-page__color-picker${
                    colorPickerIndex === null
                      ? ' gradients-page__color-picker--hidden'
                      : ''
                  }`}
                  ref={colorPickerRef}
                  type="color"
                  value={modalPreviewColors[colorPickerIndex ?? 0] || '#000000'}
                  onChange={handleColorChange}
                  onBlur={() => setColorPickerIndex(null)}
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
