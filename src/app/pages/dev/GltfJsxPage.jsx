import React, {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import { localEnv, modelFile } from '../../../utils/appUtils';
import { DEFAULT_SCENE_PATH } from '../../sceneRegistry';
import GltfPreviewCanvas from './GltfPreviewCanvas';

const CAPABILITIES_ENDPOINT = '/dev-api/gltfjsx/capabilities';
const CONVERT_ENDPOINT = '/dev-api/gltfjsx/convert';
const ENTRY_EXTENSIONS = new Set(['.glb', '.gltf']);
const ENVIRONMENT_OPTIONS = [
  '',
  'sunset',
  'dawn',
  'night',
  'warehouse',
  'forest',
  'apartment',
  'studio',
  'city',
  'park',
  'lobby',
];

const ASSET_DIRECTORY_OPTIONS = [
  {
    label: 'Dedicated folder in public/models',
    value: 'folder',
  },
  {
    label: 'Directly in public/models',
    value: 'root',
  },
];

const DEFAULT_OPTIONS = {
  bones: false,
  debug: false,
  degrade: '',
  degraderesolution: 512,
  draco: '',
  error: 0.001,
  exportdefault: true,
  format: 'webp',
  instance: false,
  instanceall: false,
  keepgroups: false,
  keepmaterials: false,
  keepmeshes: false,
  keepnames: false,
  meta: false,
  precision: 3,
  printwidth: 120,
  ratio: 0.75,
  resolution: 1024,
  shadows: true,
  simplify: false,
  transform: false,
  types: false,
  verbose: false,
};

const DEFAULT_PREVIEW_OPTIONS = {
  autoRotate: true,
  contactShadow: true,
  environment: 'city',
  intensity: 1,
  shadows: true,
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
  header: {
    display: 'grid',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  layout: {
    display: 'grid',
    gap: '1.25rem',
    gridTemplateColumns: 'minmax(22rem, 30rem) minmax(0, 1fr)',
    alignItems: 'start',
  },
  stack: {
    display: 'grid',
    gap: '1rem',
  },
  panel: {
    borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.08)',
    padding: '1.1rem',
  },
  eyebrow: {
    margin: 0,
    fontSize: '0.75rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#b45309',
  },
  title: {
    margin: '0.4rem 0 0.55rem',
    fontSize: 'clamp(2rem, 4vw, 3.4rem)',
    lineHeight: 0.95,
  },
  lead: {
    margin: 0,
    maxWidth: '64rem',
    color: '#334155',
    lineHeight: 1.6,
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.8rem',
    borderRadius: '999px',
    background: 'rgba(15, 23, 42, 0.08)',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  panelTitle: {
    margin: 0,
    fontSize: '0.95rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#475569',
  },
  panelLead: {
    margin: '0.55rem 0 0',
    color: '#475569',
    lineHeight: 1.55,
    fontSize: '0.92rem',
  },
  grid: {
    display: 'grid',
    gap: '0.85rem',
  },
  twoCol: {
    display: 'grid',
    gap: '0.85rem',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },
  field: {
    display: 'grid',
    gap: '0.35rem',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    alignItems: 'baseline',
  },
  label: {
    fontSize: '0.84rem',
    fontWeight: 600,
    color: '#0f172a',
  },
  hint: {
    margin: 0,
    fontSize: '0.76rem',
    color: '#64748b',
    lineHeight: 1.45,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '14px',
    border: '1px solid rgba(148, 163, 184, 0.4)',
    padding: '0.72rem 0.85rem',
    background: 'rgba(248, 250, 252, 0.98)',
    color: '#0f172a',
    fontSize: '0.92rem',
  },
  checkboxRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
    padding: '0.8rem 0.9rem',
    borderRadius: '16px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'rgba(248, 250, 252, 0.9)',
  },
  checkbox: {
    marginTop: '0.15rem',
  },
  checkboxBody: {
    display: 'grid',
    gap: '0.2rem',
  },
  dropzone: {
    borderRadius: '22px',
    borderWidth: '1px',
    borderStyle: 'dashed',
    borderColor: 'rgba(180, 83, 9, 0.35)',
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,247,237,0.92) 100%)',
    padding: '1.2rem',
    display: 'grid',
    gap: '0.75rem',
  },
  dropzoneActive: {
    borderColor: '#0f172a',
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(224,242,254,0.96) 100%)',
  },
  buttonRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  button: {
    border: 'none',
    borderRadius: '999px',
    padding: '0.78rem 1.05rem',
    background: '#0f172a',
    color: '#f8fafc',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.88rem',
  },
  secondaryButton: {
    border: '1px solid rgba(148, 163, 184, 0.42)',
    borderRadius: '999px',
    padding: '0.78rem 1.05rem',
    background: 'rgba(255,255,255,0.85)',
    color: '#0f172a',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.88rem',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  fileList: {
    display: 'grid',
    gap: '0.45rem',
    marginTop: '0.5rem',
  },
  fileItem: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    alignItems: 'center',
    borderRadius: '14px',
    padding: '0.65rem 0.8rem',
    background: 'rgba(248, 250, 252, 0.95)',
    border: '1px solid rgba(226, 232, 240, 0.95)',
    fontSize: '0.82rem',
  },
  fileMeta: {
    color: '#64748b',
  },
  message: {
    borderRadius: '18px',
    padding: '0.9rem 1rem',
    fontSize: '0.88rem',
    lineHeight: 1.5,
  },
  error: {
    background: '#fff1f2',
    border: '1px solid #fda4af',
    color: '#9f1239',
  },
  success: {
    background: '#ecfdf5',
    border: '1px solid #86efac',
    color: '#166534',
  },
  codeBlock: {
    margin: 0,
    padding: '1rem',
    borderRadius: '18px',
    background: '#020617',
    color: '#e2e8f0',
    overflowX: 'auto',
    fontSize: '0.8rem',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  statsGrid: {
    display: 'grid',
    gap: '0.65rem',
  },
  statRow: {
    display: 'grid',
    gap: '0.2rem',
  },
  statLabel: {
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#64748b',
  },
  statValue: {
    color: '#0f172a',
    fontSize: '0.9rem',
    wordBreak: 'break-word',
  },
};

function getFileRelativePath(file) {
  return String(file.webkitRelativePath || file.relativePath || file.name || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
}

function getBaseName(filePath) {
  const normalized = getFileRelativePath({ relativePath: filePath });
  const lastSlash = normalized.lastIndexOf('/');
  const fileName =
    lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);
  const extensionIndex = fileName.lastIndexOf('.');
  return extensionIndex === -1 ? fileName : fileName.slice(0, extensionIndex);
}

function toKebabCase(value) {
  return (
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'model'
  );
}

function sanitizeAssetBaseName(value) {
  return (
    String(value || '')
      .trim()
      .replace(/\.[A-Za-z0-9]+$/u, '')
      .replace(/[^A-Za-z0-9._-]+/gu, '-')
      .replace(/^-+|-+$/gu, '') || 'model'
  );
}

function toPascalCase(value) {
  const parts = String(value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  const nextValue = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const fallback = nextValue || 'Model';
  return /^[A-Za-z_$]/.test(fallback) ? fallback : `Model${fallback}`;
}

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${bytes} B`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || '');
      const [, base64 = ''] = result.split(',');
      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error(`Could not read ${file.name}.`));
    };

    reader.readAsDataURL(file);
  });
}

function mergeSelectedFiles(fileList) {
  const nextFiles = Array.from(fileList || []);
  const fileMap = new Map();

  nextFiles.forEach((file) => {
    fileMap.set(getFileRelativePath(file), file);
  });

  return Array.from(fileMap.values()).sort((a, b) => {
    return getFileRelativePath(a).localeCompare(getFileRelativePath(b));
  });
}

function buildInitialNames(files) {
  const primaryCandidate = files.find((file) => {
    const relativePath = getFileRelativePath(file);
    const extension = relativePath
      .slice(relativePath.lastIndexOf('.'))
      .toLowerCase();
    return ENTRY_EXTENSIONS.has(extension);
  });
  const primaryFilePath = primaryCandidate
    ? getFileRelativePath(primaryCandidate)
    : '';
  const baseName = primaryFilePath ? getBaseName(primaryFilePath) : 'model';

  return {
    componentName: toPascalCase(baseName),
    modelSlug: toKebabCase(baseName),
    primaryOutputName: sanitizeAssetBaseName(baseName),
    primaryFilePath,
  };
}

function describeServerState(isLocal, serverState) {
  if (!isLocal) {
    return {
      label: 'disabled',
      message:
        'The local converter is only available on localhost or a local-network dev session.',
    };
  }

  if (serverState.status === 'loading' || serverState.status === 'idle') {
    return {
      label: 'checking',
      message: 'Checking whether the local GLTF JSX API is reachable.',
    };
  }

  if (serverState.status === 'error') {
    return {
      label: 'error',
      message: serverState.error,
    };
  }

  if (!serverState.data?.features?.convert) {
    return {
      label: 'missing binary',
      message:
        'The dev page is live, but the local gltfjsx executable is not available yet.',
    };
  }

  return {
    label: serverState.data?.implementation || 'ready',
    message:
      'Drag files in, pick flags, and write repo-native output into public/models and src/components/elements.',
  };
}

function Field({ children, hint, label }) {
  return (
    <div style={styles.field}>
      <div style={styles.labelRow}>
        <span style={styles.label}>{label}</span>
      </div>
      {children}
      {hint ? <p style={styles.hint}>{hint}</p> : null}
    </div>
  );
}

function TextField({ hint, label, onChange, type = 'text', value }) {
  return (
    <Field hint={hint} label={label}>
      <input
        style={styles.input}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function SelectField({ hint, label, onChange, options, value }) {
  return (
    <Field hint={hint} label={label}>
      <select
        style={styles.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function ToggleField({ checked, hint, label, onChange }) {
  return (
    <div style={styles.checkboxRow}>
      <input
        aria-label={label}
        style={styles.checkbox}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span style={styles.checkboxBody}>
        <span style={styles.label}>{label}</span>
        {hint ? <span style={styles.hint}>{hint}</span> : null}
      </span>
    </div>
  );
}

function CodeBlockPanel({ actions, title, value }) {
  return (
    <div style={styles.panel}>
      <div style={{ ...styles.labelRow, marginBottom: '0.8rem' }}>
        <h2 style={styles.panelTitle}>{title}</h2>
        {actions}
      </div>
      <pre style={styles.codeBlock}>{value || 'Nothing generated yet.'}</pre>
    </div>
  );
}

export default function GltfJsxPage() {
  const isLocal = localEnv();
  const fileInputRef = useRef(null);
  const [dropActive, setDropActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [primaryFilePath, setPrimaryFilePath] = useState('');
  const [modelSlug, setModelSlug] = useState('model');
  const [componentName, setComponentName] = useState('Model');
  const [assetDirectoryMode, setAssetDirectoryMode] = useState('folder');
  const [renamePrimaryFile, setRenamePrimaryFile] = useState(true);
  const [primaryOutputName, setPrimaryOutputName] = useState('model');
  const [overwrite, setOverwrite] = useState(false);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [previewOptions, setPreviewOptions] = useState(DEFAULT_PREVIEW_OPTIONS);
  const [serverState, setServerState] = useState({
    data: null,
    error: null,
    status: isLocal ? 'idle' : 'unavailable',
  });
  const [conversionState, setConversionState] = useState('idle');
  const [conversionError, setConversionError] = useState(null);
  const [conversionResult, setConversionResult] = useState(null);

  const entryFiles = useMemo(() => {
    return uploadedFiles.filter((file) => {
      const relativePath = getFileRelativePath(file);
      const extension = relativePath
        .slice(relativePath.lastIndexOf('.'))
        .toLowerCase();
      return ENTRY_EXTENSIONS.has(extension);
    });
  }, [uploadedFiles]);

  const deferredCode = useDeferredValue(conversionResult?.code || '');
  const serverDescription = describeServerState(isLocal, serverState);

  const previewAsset = useMemo(() => {
    if (conversionResult?.assetPath) {
      return {
        type: 'saved',
        url: `${modelFile(conversionResult.assetPath)}?t=${conversionResult.generatedAt}`,
      };
    }

    if (!primaryFilePath || !entryFiles.length) {
      return null;
    }

    return {
      files: uploadedFiles,
      primaryFilePath,
      type: 'uploaded',
    };
  }, [conversionResult, entryFiles.length, primaryFilePath, uploadedFiles]);

  useEffect(() => {
    if (!isLocal) return undefined;

    let cancelled = false;

    async function loadCapabilities() {
      setServerState({ status: 'loading', data: null, error: null });

      try {
        const response = await fetch(CAPABILITIES_ENDPOINT);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || 'Capability check failed.');
        }

        if (!cancelled) {
          startTransition(() => {
            setServerState({ data: payload, error: null, status: 'ready' });
          });
        }
      } catch (error) {
        if (!cancelled) {
          setServerState({
            status: 'error',
            data: null,
            error:
              error instanceof Error
                ? error.message
                : 'Capability check failed.',
          });
        }
      }
    }

    loadCapabilities();

    return () => {
      cancelled = true;
    };
  }, [isLocal]);

  function invalidateResult() {
    startTransition(() => {
      setConversionResult(null);
      setConversionError(null);
    });
  }

  function applyFiles(nextFiles) {
    const mergedFiles = mergeSelectedFiles(nextFiles);
    const initialNames = buildInitialNames(mergedFiles);

    setUploadedFiles(mergedFiles);
    setPrimaryFilePath(initialNames.primaryFilePath);
    setModelSlug(initialNames.modelSlug);
    setComponentName(initialNames.componentName);
    setPrimaryOutputName(initialNames.primaryOutputName);
    invalidateResult();
  }

  function updateOption(key, value) {
    setOptions((current) => ({
      ...current,
      [key]: value,
    }));
    invalidateResult();
  }

  function updatePreviewOption(key, value) {
    setPreviewOptions((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleConvert() {
    if (!entryFiles.length || !primaryFilePath) return;

    setConversionState('working');
    setConversionError(null);

    try {
      const files = await Promise.all(
        uploadedFiles.map(async (file) => ({
          base64: await fileToBase64(file),
          name: file.name,
          relativePath: getFileRelativePath(file),
        }))
      );

      const response = await fetch(CONVERT_ENDPOINT, {
        body: JSON.stringify({
          assetDirectoryMode,
          componentName,
          files,
          modelSlug,
          options,
          overwrite,
          primaryFilePath,
          primaryOutputName,
          renamePrimaryFile,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Conversion failed.');
      }

      startTransition(() => {
        setConversionResult({
          ...payload,
          generatedAt: Date.now(),
        });
      });
    } catch (error) {
      setConversionError(
        error instanceof Error ? error.message : 'Conversion failed.'
      );
    } finally {
      setConversionState('idle');
    }
  }

  async function copyText(value) {
    await navigator.clipboard.writeText(value);
  }

  function downloadTextFile(fileName, value) {
    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  const canConvert =
    isLocal &&
    serverState.status === 'ready' &&
    serverState.data?.features?.convert &&
    conversionState !== 'working' &&
    Boolean(primaryFilePath);

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <Link to={DEFAULT_SCENE_PATH} style={styles.back}>
          ← back to app
        </Link>
      </nav>

      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Dev Authoring</p>
          <h1 style={styles.title}>GLTF JSX Workbench</h1>
          <p style={styles.lead}>
            This page recreates the GLTF-to-R3F workflow, but writes repo-native
            output. Drop a model bundle in, preview it, drive the full gltfjsx
            flag surface, and generate a component that already uses
            `modelFile()` and your repo paths.
          </p>
        </div>
        <div style={styles.statusPill}>{serverDescription.label}</div>
        <p style={{ ...styles.lead, maxWidth: '48rem' }}>
          {serverDescription.message}
        </p>
      </header>

      <div style={styles.layout}>
        <div style={styles.stack}>
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Upload</h2>
            <p style={styles.panelLead}>
              Drop `.glb` or `.gltf` files directly onto the page or add
              multiple files if the asset has sidecars.
            </p>
            <div
              style={{
                ...styles.dropzone,
                ...(dropActive ? styles.dropzoneActive : null),
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setDropActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDropActive(false);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDropActive(true);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDropActive(false);
                applyFiles(event.dataTransfer.files);
              }}
            >
              <div>
                <strong>Drop files here</strong>
                <p style={styles.hint}>
                  The primary entry file can be renamed through the model slug
                  field below, or preserved and written directly into
                  `public/models`.
                </p>
              </div>
              <div style={styles.buttonRow}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose files
                </button>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => {
                    setUploadedFiles([]);
                    setPrimaryFilePath('');
                    invalidateResult();
                  }}
                >
                  Clear
                </button>
              </div>
              <input
                ref={fileInputRef}
                hidden
                multiple
                type="file"
                onChange={(event) => {
                  const inputElement = event.target;
                  applyFiles(inputElement.files);
                  inputElement.value = '';
                }}
              />
            </div>
            {uploadedFiles.length ? (
              <div style={styles.fileList}>
                {uploadedFiles.map((file) => {
                  const relativePath = getFileRelativePath(file);
                  return (
                    <div key={relativePath} style={styles.fileItem}>
                      <span>{relativePath}</span>
                      <span style={styles.fileMeta}>
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Output Targets</h2>
            <div style={styles.grid}>
              <SelectField
                label="Asset placement"
                hint="Choose whether assets go into their own folder or directly into `public/models`."
                value={assetDirectoryMode}
                onChange={(value) => {
                  setAssetDirectoryMode(value);
                  invalidateResult();
                }}
                options={ASSET_DIRECTORY_OPTIONS}
              />
              {assetDirectoryMode === 'folder' ? (
                <TextField
                  label="Model folder"
                  hint="Creates `public/models/<folder>/` and writes the converted asset bundle inside it."
                  value={modelSlug}
                  onChange={(value) => {
                    setModelSlug(toKebabCase(value));
                    invalidateResult();
                  }}
                />
              ) : null}
              <TextField
                label="Component name"
                hint="Writes to `src/components/elements/<ComponentName>/<ComponentName>.jsx|tsx`."
                value={componentName}
                onChange={(value) => {
                  setComponentName(toPascalCase(value));
                  invalidateResult();
                }}
              />
              <SelectField
                label="Primary file"
                hint="Choose the entry `.glb` or `.gltf` when multiple candidates are present."
                value={primaryFilePath}
                onChange={(value) => {
                  setPrimaryFilePath(value);
                  invalidateResult();
                }}
                options={
                  entryFiles.length
                    ? entryFiles.map((file) => ({
                        label: getFileRelativePath(file),
                        value: getFileRelativePath(file),
                      }))
                    : [{ label: 'No entry file detected', value: '' }]
                }
              />
              <ToggleField
                checked={renamePrimaryFile}
                label="Rename primary file"
                hint="When off, the uploaded primary filename is preserved. When on, the field below sets the new base name."
                onChange={(value) => {
                  setRenamePrimaryFile(value);
                  invalidateResult();
                }}
              />
              {renamePrimaryFile ? (
                <TextField
                  label="Primary output name"
                  hint="Base name only. The original `.glb` or `.gltf` extension is preserved automatically."
                  value={primaryOutputName}
                  onChange={(value) => {
                    setPrimaryOutputName(sanitizeAssetBaseName(value));
                    invalidateResult();
                  }}
                />
              ) : null}
              <ToggleField
                checked={overwrite}
                label="Overwrite existing output"
                hint="Off by default. Existing folders block conversion until you explicitly replace them."
                onChange={(value) => {
                  setOverwrite(value);
                  invalidateResult();
                }}
              />
            </div>
          </section>

          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Codegen Flags</h2>
            <div style={styles.grid}>
              <ToggleField
                checked={options.exportdefault}
                label="Default export"
                hint="Repo-friendly default export instead of a named `Model` export."
                onChange={(value) => updateOption('exportdefault', value)}
              />
              <ToggleField
                checked={options.types}
                label="TypeScript definitions"
                hint="Emit TS types and write a `.tsx` component file."
                onChange={(value) => updateOption('types', value)}
              />
              <ToggleField
                checked={options.shadows}
                label="Mesh shadows"
                hint="Add `castShadow` and `receiveShadow` to generated meshes."
                onChange={(value) => updateOption('shadows', value)}
              />
              <ToggleField
                checked={options.bones}
                label="Declarative bones"
                hint="Keep bones in JSX instead of primitive skeleton roots."
                onChange={(value) => updateOption('bones', value)}
              />
              <ToggleField
                checked={options.meta}
                label="Metadata"
                hint="Include `userData` metadata on generated objects."
                onChange={(value) => updateOption('meta', value)}
              />
              <ToggleField
                checked={options.verbose}
                label="Verbose output"
                hint="Convenience toggle that enables both keep names and keep groups."
                onChange={(value) => updateOption('verbose', value)}
              />
              <ToggleField
                checked={options.keepnames}
                label="Keep names"
                hint="Preserve original node names even when output is otherwise compacted."
                onChange={(value) => updateOption('keepnames', value)}
              />
              <ToggleField
                checked={options.keepgroups}
                label="Keep groups"
                hint="Disable pruning of empty groups."
                onChange={(value) => updateOption('keepgroups', value)}
              />
              <ToggleField
                checked={options.instance}
                label="Instance repeated geometry"
                hint="Enable Merged-based instancing for duplicate meshes."
                onChange={(value) => updateOption('instance', value)}
              />
              <ToggleField
                checked={options.instanceall}
                label="Instance all geometry"
                hint="Force instancing across the whole asset. This also produces a transformed asset."
                onChange={(value) => updateOption('instanceall', value)}
              />
              <ToggleField
                checked={options.debug}
                label="Debug output"
                hint="Ask gltfjsx to log pruning and transform details while converting."
                onChange={(value) => updateOption('debug', value)}
              />
              <TextField
                label="Draco path"
                hint="Optional decoder path passed through to `useGLTF` for local Draco binaries."
                value={options.draco}
                onChange={(value) => updateOption('draco', value)}
              />
              <div style={styles.twoCol}>
                <TextField
                  label="Precision"
                  hint="Number of fractional digits in generated transforms."
                  type="number"
                  value={String(options.precision)}
                  onChange={(value) => updateOption('precision', Number(value))}
                />
                <TextField
                  label="Print width"
                  hint="Maximum print width before repo formatting runs."
                  type="number"
                  value={String(options.printwidth)}
                  onChange={(value) =>
                    updateOption('printwidth', Number(value))
                  }
                />
              </div>
            </div>
          </section>

          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Transform Flags</h2>
            <p style={styles.panelLead}>
              These map to the gltfjsx transform pipeline. `instance` and
              `instanceall` also trigger a transformed asset even if `transform`
              is off.
            </p>
            <div style={styles.grid}>
              <ToggleField
                checked={options.transform}
                label="Transform for web delivery"
                hint="Resize, compress, prune, and emit a transformed GLB beside the staged model files."
                onChange={(value) => updateOption('transform', value)}
              />
              <ToggleField
                checked={options.simplify}
                label="Simplify meshes"
                hint="Enable mesh simplification, then tune ratio and error below."
                onChange={(value) => updateOption('simplify', value)}
              />
              <ToggleField
                checked={options.keepmeshes}
                label="Keep meshes separate"
                hint="Disable mesh joins in the transform pass."
                onChange={(value) => updateOption('keepmeshes', value)}
              />
              <ToggleField
                checked={options.keepmaterials}
                label="Keep materials separate"
                hint="Disable palette joins in the transform pass."
                onChange={(value) => updateOption('keepmaterials', value)}
              />
              <div style={styles.twoCol}>
                <TextField
                  label="Resolution"
                  hint="Default texture resize target."
                  type="number"
                  value={String(options.resolution)}
                  onChange={(value) =>
                    updateOption('resolution', Number(value))
                  }
                />
                <TextField
                  label="Format"
                  hint="Texture output format used by gltfjsx transform."
                  value={options.format}
                  onChange={(value) => updateOption('format', value)}
                />
              </div>
              <div style={styles.twoCol}>
                <TextField
                  label="Simplify ratio"
                  hint="Lower values remove more geometry when simplify is enabled."
                  type="number"
                  value={String(options.ratio)}
                  onChange={(value) => updateOption('ratio', Number(value))}
                />
                <TextField
                  label="Simplify error"
                  hint="Maximum simplifier error threshold."
                  type="number"
                  value={String(options.error)}
                  onChange={(value) => updateOption('error', Number(value))}
                />
              </div>
              <TextField
                label="Degrade pattern"
                hint="Optional regex used to downsize matching textures more aggressively."
                value={options.degrade}
                onChange={(value) => updateOption('degrade', value)}
              />
              <TextField
                label="Degrade resolution"
                hint="Resolution used for textures that match the degrade pattern."
                type="number"
                value={String(options.degraderesolution)}
                onChange={(value) =>
                  updateOption('degraderesolution', Number(value))
                }
              />
            </div>
          </section>
        </div>

        <div style={styles.stack}>
          <section style={styles.panel}>
            <div style={{ ...styles.labelRow, marginBottom: '0.9rem' }}>
              <div>
                <h2 style={styles.panelTitle}>Preview</h2>
                <p style={styles.panelLead}>
                  Upload preview is immediate. After conversion, the viewer
                  reloads from the written `public/models` asset.
                </p>
              </div>
            </div>
            <div style={styles.grid}>
              <div style={styles.twoCol}>
                <ToggleField
                  checked={previewOptions.autoRotate}
                  label="Auto rotate"
                  hint="Match the reference viewer's default presentation."
                  onChange={(value) => updatePreviewOption('autoRotate', value)}
                />
                <ToggleField
                  checked={previewOptions.contactShadow}
                  label="Contact shadow"
                  hint="Display a ground shadow under the asset."
                  onChange={(value) =>
                    updatePreviewOption('contactShadow', value)
                  }
                />
              </div>
              <div style={styles.twoCol}>
                <ToggleField
                  checked={previewOptions.shadows}
                  label="Cast mesh shadows"
                  hint="Preview shadowed meshes before writing the component."
                  onChange={(value) => updatePreviewOption('shadows', value)}
                />
                <TextField
                  label="Light intensity"
                  hint="Overall preview lighting multiplier."
                  type="number"
                  value={String(previewOptions.intensity)}
                  onChange={(value) =>
                    updatePreviewOption('intensity', Number(value))
                  }
                />
              </div>
              <SelectField
                label="Environment"
                hint="HDRI preset for the preview canvas."
                value={previewOptions.environment}
                onChange={(value) => updatePreviewOption('environment', value)}
                options={ENVIRONMENT_OPTIONS.map((option) => ({
                  label: option || 'None',
                  value: option,
                }))}
              />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <GltfPreviewCanvas
                previewAsset={previewAsset}
                previewOptions={previewOptions}
              />
            </div>
          </section>

          <section style={styles.panel}>
            <div style={styles.buttonRow}>
              <button
                type="button"
                style={{
                  ...styles.button,
                  ...(!canConvert ? styles.disabledButton : null),
                }}
                disabled={!canConvert}
                onClick={handleConvert}
              >
                {conversionState === 'working'
                  ? 'Converting…'
                  : 'Convert and write files'}
              </button>
              {conversionResult?.code ? (
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() =>
                    downloadTextFile(
                      `${componentName}.${options.types ? 'tsx' : 'jsx'}`,
                      conversionResult.code
                    )
                  }
                >
                  Download component
                </button>
              ) : null}
            </div>
            {conversionError ? (
              <div
                style={{
                  ...styles.message,
                  ...styles.error,
                  marginTop: '0.9rem',
                }}
              >
                {conversionError}
              </div>
            ) : null}
            {conversionResult ? (
              <div
                style={{
                  ...styles.message,
                  ...styles.success,
                  marginTop: '0.9rem',
                }}
              >
                Conversion finished. Assets were written to{' '}
                <strong>{conversionResult.model.directory}</strong> and the
                component was written to{' '}
                <strong>{conversionResult.component.relativePath}</strong>.
              </div>
            ) : null}
          </section>

          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Write Summary</h2>
            <div style={{ ...styles.statsGrid, marginTop: '0.9rem' }}>
              <div style={styles.statRow}>
                <span style={styles.statLabel}>Component path</span>
                <span style={styles.statValue}>
                  {conversionResult?.component?.relativePath ||
                    `src/components/elements/${componentName}/${componentName}.${options.types ? 'tsx' : 'jsx'}`}
                </span>
              </div>
              <div style={styles.statRow}>
                <span style={styles.statLabel}>Model directory</span>
                <span style={styles.statValue}>
                  {conversionResult?.model?.directory ||
                    (assetDirectoryMode === 'folder'
                      ? `public/models/${modelSlug}`
                      : 'public/models')}
                </span>
              </div>
              <div style={styles.statRow}>
                <span style={styles.statLabel}>Primary asset</span>
                <span style={styles.statValue}>
                  {conversionResult?.model?.entryPath || 'Pending conversion'}
                </span>
              </div>
              <div style={styles.statRow}>
                <span style={styles.statLabel}>Resolved asset path</span>
                <span style={styles.statValue}>
                  {conversionResult?.assetPath || 'Pending conversion'}
                </span>
              </div>
            </div>
          </section>

          <CodeBlockPanel
            title="CLI Command"
            value={
              conversionResult?.command ||
              'The raw gltfjsx command will appear here after conversion.'
            }
            actions={
              conversionResult?.command ? (
                <div style={styles.buttonRow}>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => copyText(conversionResult.command)}
                  >
                    Copy command
                  </button>
                </div>
              ) : null
            }
          />

          <CodeBlockPanel
            title="Generated Component"
            value={deferredCode}
            actions={
              conversionResult?.code ? (
                <div style={styles.buttonRow}>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => copyText(conversionResult.code)}
                  >
                    Copy code
                  </button>
                </div>
              ) : null
            }
          />

          {conversionResult?.savedFiles?.length ? (
            <section style={styles.panel}>
              <h2 style={styles.panelTitle}>Saved Files</h2>
              <div style={{ ...styles.fileList, marginTop: '0.8rem' }}>
                {conversionResult.savedFiles.map((file) => (
                  <div key={file.outputPath} style={styles.fileItem}>
                    <span>{file.outputPath}</span>
                    <span style={styles.fileMeta}>from {file.sourcePath}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
