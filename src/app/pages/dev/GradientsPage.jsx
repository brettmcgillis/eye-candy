import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { iconFile } from '../../../utils/appUtils';

const GRADIENTS_ENDPOINT = '/dev-api/gradients';
const GRADIENTS_WRITE_ENDPOINT = '/dev-api/gradients/write';

const DEFAULT_FORM = {
  name: '',
  colorsText: '#0F172A, #1D4ED8, #F8FAFC',
};

const styles = {
  page: {
    minHeight: '100vh',
    padding: '1.5rem 1.5rem 3rem',
    boxSizing: 'border-box',
    background:
      'linear-gradient(135deg, #f8fafc 0%, #fff7ed 52%, #eff6ff 100%)',
    color: '#0f172a',
    fontFamily: 'system-ui, sans-serif',
  },
  nav: {
    marginBottom: '1rem',
  },
  back: {
    color: '#475569',
    fontSize: '0.85rem',
    textDecoration: 'none',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  header: {
    display: 'grid',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  titleRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5em',
  },
  titleIcon: {
    width: '0.9em',
    height: '0.9em',
    objectFit: 'contain',
    flexShrink: 0,
  },
  eyebrow: {
    margin: 0,
    fontSize: '0.75rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#b45309',
  },
  title: {
    margin: '0.4rem 0 0.2rem',
    fontSize: 'clamp(2rem, 5vw, 3.2rem)',
    lineHeight: 1,
  },
  lead: {
    margin: 0,
    maxWidth: '62rem',
    color: '#334155',
    lineHeight: 1.6,
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  searchField: {
    minWidth: 'min(18rem, 100%)',
    boxSizing: 'border-box',
    border: '1px solid rgba(148,163,184,0.5)',
    borderRadius: '999px',
    padding: '0.7rem 0.9rem',
    fontSize: '0.95rem',
    background: '#fff',
    color: '#0f172a',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '999px',
    background: 'rgba(15,23,42,0.06)',
    color: '#334155',
    padding: '0.45rem 0.7rem',
    fontSize: '0.8rem',
    fontWeight: 700,
  },
  sortRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.5rem',
  },
  sortButton: {
    border: '1px solid rgba(148,163,184,0.4)',
    background: 'rgba(255,255,255,0.9)',
    color: '#0f172a',
    borderRadius: '999px',
    padding: '0.55rem 0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  sortButtonActive: {
    background: '#0f172a',
    color: '#f8fafc',
    borderColor: '#0f172a',
  },
  addButton: {
    appearance: 'none',
    border: '1px solid rgba(15,23,42,0.18)',
    borderRadius: '999px',
    background: '#0f172a',
    color: '#f8fafc',
    padding: '0.7rem 1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  panel: {
    borderRadius: '24px',
    background: 'rgba(255,255,255,0.9)',
    border: '1px solid rgba(148,163,184,0.18)',
    boxShadow: '0 24px 80px rgba(15,23,42,0.08)',
    padding: '1.1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '0.9rem',
  },
  card: {
    display: 'grid',
    gap: '0',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.85)',
    overflow: 'hidden',
    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)',
    padding: 0,
    textAlign: 'left',
  },
  cardSelected: {
    borderColor: '#0f172a',
    boxShadow: '0 0 0 2px rgba(15,23,42,0.18)',
  },
  swatch: {
    height: '72px',
    width: '100%',
    borderBottom: '1px solid rgba(15,23,42,0.08)',
  },
  cardBody: {
    display: 'grid',
    gap: '0.5rem',
    padding: '0.85rem 0.9rem 0.9rem',
  },
  cardMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
  },
  cardName: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 700,
  },
  cardMeta: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#475569',
  },
  cardActions: {
    display: 'grid',
    gap: '0.45rem',
    minWidth: '5.5rem',
  },
  actionButton: {
    appearance: 'none',
    border: '1px solid rgba(15,23,42,0.2)',
    borderRadius: '10px',
    background: '#fff',
    color: '#0f172a',
    padding: '0.5rem 0.7rem',
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
  },
  secondaryActionButton: {
    appearance: 'none',
    border: '1px solid rgba(15,23,42,0.18)',
    borderRadius: '10px',
    background: '#f8fafc',
    color: '#0f172a',
    padding: '0.5rem 0.7rem',
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
  },
  metaList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.35rem',
  },
  swatchChip: {
    width: '1.55rem',
    height: '1.55rem',
    borderRadius: '0.35rem',
    border: '1px solid rgba(15,23,42,0.12)',
    display: 'inline-block',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)',
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    zIndex: 20,
  },
  modal: {
    width: 'min(42rem, 100%)',
    background: '#fff',
    borderRadius: '22px',
    border: '1px solid rgba(148,163,184,0.2)',
    boxShadow: '0 24px 80px rgba(15,23,42,0.2)',
    padding: '1.2rem',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.2rem',
  },
  closeButton: {
    appearance: 'none',
    border: 0,
    background: 'rgba(15,23,42,0.06)',
    color: '#0f172a',
    fontSize: '1.1rem',
    borderRadius: '999px',
    width: '2rem',
    height: '2rem',
    cursor: 'pointer',
  },
  form: {
    display: 'grid',
    gap: '0.9rem',
  },
  label: {
    display: 'grid',
    gap: '0.45rem',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid rgba(148,163,184,0.5)',
    borderRadius: '12px',
    padding: '0.72rem 0.9rem',
    fontSize: '0.96rem',
    background: '#fff',
    color: '#0f172a',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '6.5rem',
    resize: 'vertical',
    border: '1px solid rgba(148,163,184,0.5)',
    borderRadius: '12px',
    padding: '0.72rem 0.9rem',
    fontSize: '0.92rem',
    background: '#fff',
    color: '#0f172a',
    lineHeight: 1.5,
  },
  previewSection: {
    display: 'grid',
    gap: '0.65rem',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: '16px',
    background: 'rgba(248,250,252,0.9)',
    padding: '0.8rem',
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  previewLabel: {
    margin: 0,
    fontSize: '0.75rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#475569',
    fontWeight: 700,
  },
  previewActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  previewAddButton: {
    appearance: 'none',
    border: '1px solid rgba(15,23,42,0.2)',
    borderRadius: '0.35rem',
    background: '#fff',
    color: '#0f172a',
    width: '1.7rem',
    height: '1.7rem',
    fontSize: '1.1rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  previewSwatch: {
    height: '68px',
    width: '100%',
    borderRadius: '12px',
    border: '1px solid rgba(15,23,42,0.08)',
  },
  previewMetaList: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.4rem',
  },
  previewChipWrap: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewChip: {
    width: '1.7rem',
    height: '1.7rem',
    borderRadius: '0.35rem',
    border: '1px solid rgba(15,23,42,0.12)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)',
    cursor: 'pointer',
    padding: 0,
    background: 'transparent',
    position: 'relative',
  },
  removeChipButton: {
    position: 'absolute',
    top: '-0.3rem',
    right: '-0.3rem',
    width: '1rem',
    height: '1rem',
    borderRadius: '999px',
    border: '1px solid rgba(15,23,42,0.15)',
    background: 'rgba(255,255,255,0.88)',
    color: '#0f172a',
    fontSize: '0.7rem',
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(15,23,42,0.08)',
    padding: 0,
  },
  colorPicker: {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: '10rem',
    height: '10rem',
    zIndex: 40,
    border: '1px solid rgba(148,163,184,0.35)',
    borderRadius: '1rem',
    boxShadow: '0 24px 60px rgba(15,23,42,0.18)',
    background: '#fff',
    padding: 0,
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  secondaryButton: {
    appearance: 'none',
    border: '1px solid rgba(15,23,42,0.2)',
    borderRadius: '999px',
    background: '#fff',
    color: '#0f172a',
    padding: '0.7rem 1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  primaryButton: {
    appearance: 'none',
    border: '1px solid rgba(15,23,42,0.18)',
    borderRadius: '999px',
    background: '#0f172a',
    color: '#f8fafc',
    padding: '0.7rem 1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  error: {
    margin: 0,
    color: '#b91c1c',
    fontWeight: 600,
  },
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

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <Link to="/dev" style={styles.back}>
          ← back to dev
        </Link>
      </nav>

      <header style={styles.header}>
        <div style={styles.headerRow}>
          <div>
            <p style={styles.eyebrow}>Dev Authoring</p>
            <h1 style={styles.title}>
              <span style={styles.titleRow}>
                <span>Gradients &amp; Palettes</span>
                <img
                  src={iconFile('turbo_flex.png')}
                  alt="Turbo Flex"
                  style={styles.titleIcon}
                />
              </span>
            </h1>
          </div>

          <button type="button" style={styles.addButton} onClick={openAddModal}>
            + Add gradient
          </button>
        </div>

        <p style={styles.lead}>
          Browse the shared palette list, inspect each gradient, and save a new
          or updated entry back to the repo JSON file.
        </p>
      </header>

      <div style={styles.topBar}>
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search gradients…"
          style={styles.searchField}
          aria-label="Search gradients"
        />

        <span style={styles.badge}>
          {loading ? 'Loading…' : `${filteredGradients.length} gradients`}
        </span>

        <div style={styles.sortRow}>
          <button
            type="button"
            style={{
              ...styles.sortButton,
              ...(sortKey === 'name' ? styles.sortButtonActive : null),
            }}
            onClick={() => handleSort('name')}
          >
            Sort: Name{' '}
            {sortKey === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            type="button"
            style={{
              ...styles.sortButton,
              ...(sortKey === 'colorCount' ? styles.sortButtonActive : null),
            }}
            onClick={() => handleSort('colorCount')}
          >
            Sort: Colors{' '}
            {sortKey === 'colorCount'
              ? sortDirection === 'asc'
                ? '↑'
                : '↓'
              : ''}
          </button>
        </div>
      </div>

      {loading ? (
        <p style={styles.lead}>Loading gradients…</p>
      ) : (
        <div style={styles.grid}>
          {filteredGradients.map((gradient) => {
            const isSelected = selectedName === gradient.name;
            const colors = gradient.colors || [];

            return (
              <div
                key={gradient.name}
                style={{
                  ...styles.card,
                  ...(isSelected ? styles.cardSelected : null),
                }}
              >
                <div
                  style={{
                    ...styles.swatch,
                    background: gradientBackground(colors),
                  }}
                />

                <div style={styles.cardBody}>
                  <div style={styles.cardMetaRow}>
                    <div>
                      <p style={styles.cardName}>{gradient.name}</p>
                      <p style={styles.cardMeta}>{colors.length} colors</p>
                    </div>
                    <div style={styles.cardActions}>
                      <button
                        type="button"
                        style={styles.actionButton}
                        onClick={() => openEditModal(gradient)}
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        style={styles.secondaryActionButton}
                        onClick={() => openCopyModal(gradient)}
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div style={styles.metaList}>
                    {colors.map((color) => (
                      <span
                        key={`${gradient.name}-${color}`}
                        title={color}
                        style={{
                          ...styles.swatchChip,
                          background: color,
                        }}
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
        <div style={styles.modalBackdrop} onClick={closeModal}>
          <div
            style={styles.modal}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {modalMode === 'add' ? 'Add gradient' : 'Update gradient'}
              </h2>
              <button
                type="button"
                aria-label="Close"
                style={styles.closeButton}
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <div style={styles.form}>
              <label style={styles.label}>
                Gradient name
                <input
                  style={styles.input}
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

              <label style={styles.label}>
                Colors
                <textarea
                  style={styles.textarea}
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

              <div style={styles.previewSection}>
                <div style={styles.previewHeader}>
                  <p style={styles.previewLabel}>Preview</p>
                  <div style={styles.previewActions}>
                    <span style={styles.cardMeta}>
                      {modalPreviewColors.length} colors
                    </span>
                    <button
                      type="button"
                      aria-label="Add color"
                      style={styles.previewAddButton}
                      onClick={handleAddColor}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    ...styles.previewSwatch,
                    background: gradientBackground(modalPreviewColors),
                  }}
                />

                <div style={styles.previewMetaList}>
                  {modalPreviewColors.map((color, index) => {
                    const isHovered = hoveredColorIndex === index;

                    return (
                      <div
                        key={`preview-${color}-${index}`}
                        style={styles.previewChipWrap}
                        onMouseEnter={() => setHoveredColorIndex(index)}
                        onMouseLeave={() => setHoveredColorIndex(null)}
                      >
                        <button
                          type="button"
                          aria-label={`Edit color ${color}`}
                          title={color}
                          draggable
                          onClick={() => handleSelectColor(index)}
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => handleDrop(index)}
                          onDragEnd={() => setDragIndex(null)}
                          style={{
                            ...styles.previewChip,
                            background: color,
                          }}
                        />
                        {isHovered && (
                          <button
                            type="button"
                            aria-label={`Remove color ${color}`}
                            title="Remove color"
                            style={styles.removeChipButton}
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
                    style={styles.previewAddButton}
                    onClick={handleAddColor}
                  >
                    +
                  </button>
                </div>

                <input
                  ref={colorPickerRef}
                  type="color"
                  value={modalPreviewColors[colorPickerIndex ?? 0] || '#000000'}
                  onChange={handleColorChange}
                  onBlur={() => setColorPickerIndex(null)}
                  style={
                    colorPickerIndex === null
                      ? { display: 'none' }
                      : styles.colorPicker
                  }
                />
              </div>

              {error && <p style={styles.error}>{error}</p>}

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.primaryButton,
                    ...(saving ? { opacity: 0.7 } : {}),
                  }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? 'Saving…'
                    : modalMode === 'add'
                      ? 'Add gradient'
                      : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
