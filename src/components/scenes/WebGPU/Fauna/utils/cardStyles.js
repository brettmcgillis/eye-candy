const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export function panelStyle(narrow, collapsed) {
  const base = {
    background: 'rgba(12, 14, 18, 0.86)',
    backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    color: '#e8e6e1',
    fontFamily: MONO,
    fontSize: 11,
    lineHeight: 1.45,
    pointerEvents: 'auto',
    position: 'fixed',
  };

  if (narrow) {
    return {
      ...base,
      bottom: 12,
      left: '50%',
      maxHeight: collapsed ? undefined : '46vh',
      transform: 'translateX(-50%)',
      width: 'calc(100vw - 96px)',
    };
  }

  return {
    ...base,
    left: 16,
    maxHeight: collapsed ? undefined : 'calc(100vh - 190px)',
    top: 84,
    width: 272,
  };
}

const STYLES = {
  bar: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    flex: 1,
    height: 5,
    overflow: 'hidden',
  },
  body: { overflowY: 'auto', padding: '0 12px 12px' },
  close: {
    background: 'none',
    border: 'none',
    color: '#9a978f',
    cursor: 'pointer',
    fontSize: 14,
    padding: 0,
  },
  header: {
    alignItems: 'center',
    background: 'none',
    border: 'none',
    color: '#e8e6e1',
    cursor: 'pointer',
    display: 'flex',
    fontFamily: MONO,
    fontSize: 11,
    gap: 8,
    justifyContent: 'space-between',
    padding: '10px 12px',
    textAlign: 'left',
    width: '100%',
  },
  heading: { fontSize: 12, fontWeight: 600, letterSpacing: 0.4 },
  label: { color: '#9a978f', width: 88 },
  pixel: { aspectRatio: '1', borderRadius: 1 },
  pixels: {
    display: 'grid',
    gap: 2,
    gridTemplateColumns: 'repeat(8, 1fr)',
    margin: '8px 0',
    width: 88,
  },
  row: { alignItems: 'center', display: 'flex', gap: 8, margin: '2px 0' },
  section: {
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#9a978f',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 10,
    paddingTop: 8,
    textTransform: 'uppercase',
  },
  value: { minWidth: 44, textAlign: 'right' },
};

export default STYLES;
