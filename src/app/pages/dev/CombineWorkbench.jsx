import React, {
  Suspense,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import {
  Environment,
  OrbitControls,
  TransformControls,
} from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';

import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

import {
  labelForModelValue,
  modelSourceFromValue,
  useWorkbenchModelOptions,
} from './gltfWorkbenchModels';
import {
  applyPoseSnapshot,
  captureBonesSnapshot,
  collectBones,
  hydratePosesFromClips,
} from './poseUtils';
import { loadGltfFromSource } from './useGltfPreview';

// Sentinel pose value for the rest/bind pose (no clip applied).
const REST_POSE_VALUE = '__rest__';

const WRITE_ASSET_ENDPOINT = '/dev-api/gltfjsx/write-asset';
const CONVERT_ENDPOINT = '/dev-api/gltfjsx/convert';

// Sensible defaults for the combined-model conversion. The "Instance repeated
// geometry" toggle in the UI flips `options.instance` so duplicate models are
// emitted as a single instanced geometry.
const CONVERT_OPTIONS = {
  exportdefault: true,
  format: 'webp',
  keepmaterials: true,
  keepmeshes: true,
  precision: 3,
  printwidth: 120,
  resolution: 1024,
  shadows: true,
  transform: true,
};

const styles = {
  layout: {
    display: 'grid',
    gap: '1.25rem',
    gridTemplateColumns: 'minmax(22rem, 30rem) minmax(0, 1fr)',
    alignItems: 'start',
  },
  leftStack: {
    display: 'grid',
    gap: '1rem',
    alignSelf: 'start',
    maxHeight: 'calc(100vh - 3rem)',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    paddingRight: '0.25rem',
    position: 'sticky',
    top: '1.5rem',
  },
  rightStack: {
    display: 'grid',
    gap: '1rem',
    minWidth: 0,
  },
  panel: {
    borderRadius: '24px',
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.08)',
    padding: '1.1rem',
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
  field: {
    display: 'grid',
    gap: '0.35rem',
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
    padding: '0.55rem 0.9rem',
    background: 'rgba(255,255,255,0.85)',
    color: '#0f172a',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.82rem',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  checkboxRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    padding: '0.65rem 0.9rem',
    borderRadius: '16px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'rgba(248, 250, 252, 0.9)',
  },
  instanceItem: {
    display: 'grid',
    gap: '0.55rem',
    borderRadius: '14px',
    padding: '0.65rem 0.7rem',
    background: 'rgba(248, 250, 252, 0.95)',
    border: '1px solid rgba(226, 232, 240, 0.95)',
    fontSize: '0.82rem',
  },
  instanceItemSelected: {
    border: '1px solid #0f172a',
    boxShadow: '0 0 0 1px #0f172a inset',
  },
  instanceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.6rem',
    alignItems: 'center',
  },
  instanceName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 600,
  },
  vectorRow: {
    display: 'grid',
    gridTemplateColumns: '1.6rem repeat(3, 1fr)',
    gap: '0.4rem',
    alignItems: 'center',
  },
  vectorLabel: {
    fontSize: '0.72rem',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  miniInput: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '10px',
    border: '1px solid rgba(148, 163, 184, 0.4)',
    padding: '0.3rem 0.4rem',
    background: 'rgba(255, 255, 255, 0.98)',
    color: '#0f172a',
    fontSize: '0.76rem',
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
  shell: {
    position: 'relative',
    height: 'clamp(28rem, 70vh, 50rem)',
    borderRadius: '22px',
    overflow: 'hidden',
    border: '1px solid rgba(15, 23, 42, 0.08)',
    boxShadow: '0 24px 64px rgba(15, 23, 42, 0.12)',
    background: '#020617',
  },
  empty: {
    height: 'clamp(28rem, 70vh, 50rem)',
    borderRadius: '22px',
    border: '1px dashed rgba(148, 163, 184, 0.42)',
    display: 'grid',
    placeItems: 'center',
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(241,245,249,0.92) 100%)',
    color: '#475569',
    padding: '1.5rem',
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    zIndex: 1,
    padding: '0.5rem 0.75rem',
    borderRadius: '999px',
    background: 'rgba(15, 23, 42, 0.82)',
    color: '#e2e8f0',
    fontSize: '0.78rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
};

let instanceCounter = 0;

function nextInstanceId() {
  instanceCounter += 1;
  return `instance-${Date.now().toString(36)}-${instanceCounter}`;
}

function toKebabCase(value) {
  return (
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'combined-model'
  );
}

function toPascalCase(value) {
  const parts = String(value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  const result = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const fallback = result || 'CombinedModel';
  return /^[A-Za-z_$]/.test(fallback) ? fallback : `Model${fallback}`;
}

function boundsWidth(object) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return 1;
  return box.max.x - box.min.x || 1;
}

// Clone a scene for export with independent geometry per mesh. Sharing geometry
// across instances makes GLTFExporter emit one mesh referenced by several nodes;
// gltfjsx's GLTFLoader then crashes cloning that reused SkinnedMesh
// (`morphTargetInfluences.slice is not a function`). Unique geometry keeps each
// instance a standalone mesh — gltfjsx's transform pass re-dedupes identical
// geometry when instancing is enabled, so we keep the instancing payoff.
function cloneInstanceForExport(baseScene) {
  const clone = SkeletonUtils.clone(baseScene);

  clone.traverse((node) => {
    if (node.isMesh && node.geometry) {
      // eslint-disable-next-line no-param-reassign
      node.geometry = node.geometry.clone();
    }
  });

  return clone;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(index, index + chunkSize)
    );
  }

  return btoa(binary);
}

function applyInstanceTransform(object, instance) {
  object.position.fromArray(instance.position);
  object.rotation.set(
    THREE.MathUtils.degToRad(instance.rotation[0]),
    THREE.MathUtils.degToRad(instance.rotation[1]),
    THREE.MathUtils.degToRad(instance.rotation[2])
  );
  object.scale.fromArray(instance.scale);
}

function readInstanceTransform(object) {
  return {
    position: object.position.toArray(),
    rotation: [
      THREE.MathUtils.radToDeg(object.rotation.x),
      THREE.MathUtils.radToDeg(object.rotation.y),
      THREE.MathUtils.radToDeg(object.rotation.z),
    ],
    scale: object.scale.toArray(),
  };
}

function FitCamera({ groupRef, fitKey }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length() || 1;

    camera.position
      .copy(center)
      .add(new THREE.Vector3(size * 0.55, size * 0.4, size * 0.9));
    camera.near = Math.max(size / 200, 0.01);
    camera.far = size * 20;
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.copy(center);
      controls.update();
    }
    // fitKey is the explicit re-frame trigger, bumped on each add.
  }, [fitKey]);

  return null;
}

function CombineScene({
  fitKey,
  gizmoMode,
  instances,
  objectsRef,
  onSelect,
  onTransformChange,
  selectedId,
}) {
  const groupRef = useRef(null);
  const selectedObject = selectedId ? objectsRef.current.get(selectedId) : null;

  return (
    <>
      <color attach="background" args={['#020617']} />
      <hemisphereLight intensity={0.4} groundColor="#0f172a" />
      <directionalLight position={[4, 8, 6]} intensity={1.4} castShadow />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>
      <gridHelper args={[20, 20, '#1e293b', '#0f172a']} />
      <FitCamera groupRef={groupRef} fitKey={fitKey} />
      <group ref={groupRef}>
        {instances.map((instance) => {
          const object = objectsRef.current.get(instance.id);
          if (!object) return null;

          return (
            <primitive
              key={instance.id}
              object={object}
              position={instance.position}
              rotation={[
                THREE.MathUtils.degToRad(instance.rotation[0]),
                THREE.MathUtils.degToRad(instance.rotation[1]),
                THREE.MathUtils.degToRad(instance.rotation[2]),
              ]}
              scale={instance.scale}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(instance.id);
              }}
            />
          );
        })}
      </group>
      {selectedObject ? (
        <TransformControls
          mode={gizmoMode}
          object={selectedObject}
          size={0.7}
          onObjectChange={onTransformChange}
        />
      ) : null}
      <OrbitControls makeDefault />
    </>
  );
}

function VectorRow({ axisLabel, decimals = 2, label, onChange, step, values }) {
  return (
    <div style={styles.vectorRow}>
      <span style={styles.vectorLabel}>{label}</span>
      {['x', 'y', 'z'].map((axis, index) => (
        <input
          key={axis}
          aria-label={`${axisLabel} ${axis}`}
          style={styles.miniInput}
          type="number"
          step={step}
          value={Math.round(values[index] * 10 ** decimals) / 10 ** decimals}
          onChange={(event) => onChange(index, Number(event.target.value))}
        />
      ))}
    </div>
  );
}

export default function CombineWorkbench({ uploadedAsset }) {
  const { modelListError, modelOptions, refreshModelList } =
    useWorkbenchModelOptions(uploadedAsset, 'Select a model...');
  const [pickerValue, setPickerValue] = useState('');
  const [instances, setInstances] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [gizmoMode, setGizmoMode] = useState('translate');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [fitKey, setFitKey] = useState(0);

  const [componentName, setComponentName] = useState('CombinedModel');
  const [outputPath, setOutputPath] = useState('combined-model.glb');
  const [overwrite, setOverwrite] = useState(false);
  const [instanceRepeated, setInstanceRepeated] = useState(true);
  const [saveState, setSaveState] = useState({ status: 'idle', message: null });
  const [convertState, setConvertState] = useState({
    status: 'idle',
    message: null,
  });

  // Base scenes keyed by model value, and the per-instance clones rendered in
  // the viewport (kept in refs so React state only carries plain transforms).
  const sceneCacheRef = useRef(new Map());
  const objectsRef = useRef(new Map());
  // Per-model pose snapshots (hydrated from the GLB's one-frame pose clips) and
  // the model's rest snapshot, used to apply/reset poses on instances. Bumping
  // poseVersion forces option lists to re-read these refs after a model loads.
  const posesCacheRef = useRef(new Map());
  const restCacheRef = useRef(new Map());
  const [poseVersion, setPoseVersion] = useState(0);

  const ensureLoadedScene = useCallback(
    async (value) => {
      if (sceneCacheRef.current.has(value)) {
        return sceneCacheRef.current.get(value);
      }

      const source = modelSourceFromValue(value, uploadedAsset);
      if (!source) {
        throw new Error('That model source is no longer available.');
      }

      const gltf = await loadGltfFromSource(source);
      sceneCacheRef.current.set(value, gltf.scene);

      // Hydrate the model's pose clips and capture its rest snapshot so each
      // instance of this model can be posed independently.
      posesCacheRef.current.set(value, hydratePosesFromClips(gltf.animations));
      restCacheRef.current.set(
        value,
        captureBonesSnapshot(collectBones(gltf.scene))
      );
      setPoseVersion((version) => version + 1);

      return gltf.scene;
    },
    [uploadedAsset]
  );

  // Apply a pose (by name) to a live instance object, resetting to the model's
  // rest snapshot first so switching poses never leaves stale bone rotations.
  const applyPoseToObject = useCallback((object, modelValue, poseName) => {
    if (!object) return;

    const bones = collectBones(object);
    const restSnapshot = restCacheRef.current.get(modelValue);
    applyPoseSnapshot(restSnapshot, bones);

    if (poseName && poseName !== REST_POSE_VALUE) {
      const poses = posesCacheRef.current.get(modelValue) || [];
      const pose = poses.find((entry) => entry.name === poseName);
      applyPoseSnapshot(pose, bones);
    }
  }, []);

  const updateInstance = useCallback((id, patch) => {
    setInstances((current) =>
      current.map((instance) =>
        instance.id === id ? { ...instance, ...patch } : instance
      )
    );
  }, []);

  async function addInstance() {
    if (!pickerValue || adding) return;

    setAdding(true);
    setAddError(null);

    try {
      const baseScene = await ensureLoadedScene(pickerValue);
      const clone = SkeletonUtils.clone(baseScene);
      const id = nextInstanceId();
      objectsRef.current.set(id, clone);

      // Stagger new copies along x by the model's width so they don't stack.
      const width = boundsWidth(baseScene);
      const offset = instances.length * width;

      setInstances((current) => [
        ...current,
        {
          id,
          label: labelForModelValue(pickerValue, uploadedAsset),
          modelValue: pickerValue,
          poseName: REST_POSE_VALUE,
          position: [offset, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
      ]);
      setSelectedId(id);
      setFitKey((key) => key + 1);
    } catch (error) {
      setAddError(
        error instanceof Error ? error.message : 'Could not add that model.'
      );
    } finally {
      setAdding(false);
    }
  }

  function duplicateInstance(instance) {
    const baseScene = sceneCacheRef.current.get(instance.modelValue);
    if (!baseScene) return;

    const clone = SkeletonUtils.clone(baseScene);
    const id = nextInstanceId();
    objectsRef.current.set(id, clone);
    // The clone starts at rest; replay the source instance's pose onto it.
    applyPoseToObject(clone, instance.modelValue, instance.poseName);

    const width = boundsWidth(baseScene);
    setInstances((current) => [
      ...current,
      {
        ...instance,
        id,
        position: [
          instance.position[0] + width,
          instance.position[1],
          instance.position[2],
        ],
      },
    ]);
    setSelectedId(id);
  }

  function removeInstance(id) {
    objectsRef.current.delete(id);
    setInstances((current) => current.filter((instance) => instance.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }

  const handleTransformChange = useCallback(() => {
    if (!selectedId) return;

    const object = objectsRef.current.get(selectedId);
    if (!object) return;

    updateInstance(selectedId, readInstanceTransform(object));
  }, [selectedId, updateInstance]);

  function setVectorAxis(id, key, axisIndex, value) {
    if (!Number.isFinite(value)) return;

    setInstances((current) =>
      current.map((instance) => {
        if (instance.id !== id) return instance;

        const nextVector = [...instance[key]];
        nextVector[axisIndex] = value;
        const nextInstance = { ...instance, [key]: nextVector };

        // Keep the live object in sync so the gizmo tracks the typed value.
        const object = objectsRef.current.get(id);
        if (object) {
          applyInstanceTransform(object, nextInstance);
        }

        return nextInstance;
      })
    );
  }

  function setInstancePose(id, poseName) {
    setInstances((current) =>
      current.map((instance) => {
        if (instance.id !== id) return instance;

        // Apply to the live viewport object immediately.
        const object = objectsRef.current.get(id);
        applyPoseToObject(object, instance.modelValue, poseName);

        return { ...instance, poseName };
      })
    );
  }

  // Geometry instancing dedupes by node/skeleton; differently-posed copies of
  // the same model must stay distinct, so disable it when any pose is applied.
  const hasPosedInstances = instances.some(
    (instance) => instance.poseName && instance.poseName !== REST_POSE_VALUE
  );
  const instancingActive = instanceRepeated && !hasPosedInstances;

  async function buildCombinedGlbBase64() {
    const root = new THREE.Group();
    root.name = toPascalCase(componentName);

    instances.forEach((instance, index) => {
      const baseScene = sceneCacheRef.current.get(instance.modelValue);
      if (!baseScene) return;

      const clone = cloneInstanceForExport(baseScene);
      // Bake the selected pose into the clone's bones. Each instance owns an
      // independent skeleton, so two different poses of the same model don't
      // collide — the pose travels as static bone transforms, not a clip.
      applyPoseToObject(clone, instance.modelValue, instance.poseName);
      applyInstanceTransform(clone, instance);
      clone.name = `${toPascalCase(instance.label)}_${index + 1}`;
      root.add(clone);
    });

    const exporter = new GLTFExporter();
    const buffer = await exporter.parseAsync(root, { binary: true });
    return arrayBufferToBase64(buffer);
  }

  async function handleSave() {
    if (!instances.length || saveState.status === 'working') return;

    setSaveState({ status: 'working', message: null });

    try {
      const base64 = await buildCombinedGlbBase64();
      const response = await fetch(WRITE_ASSET_ENDPOINT, {
        body: JSON.stringify({ assetPath: outputPath, base64, overwrite }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Saving the combined model failed.');
      }

      setSaveState({
        status: 'success',
        message: `Wrote ${payload.outputPath} (${payload.bytes} bytes) from ${instances.length} instance${
          instances.length === 1 ? '' : 's'
        }.`,
      });
      refreshModelList();
    } catch (error) {
      setSaveState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Saving the combined model failed.',
      });
    }
  }

  async function handleConvert() {
    if (!instances.length || convertState.status === 'working') return;

    setConvertState({ status: 'working', message: null });

    try {
      const base64 = await buildCombinedGlbBase64();
      const slug = toKebabCase(componentName);
      const fileName = `${slug}.glb`;

      const response = await fetch(CONVERT_ENDPOINT, {
        body: JSON.stringify({
          assetDirectoryMode: 'root',
          componentName: toPascalCase(componentName),
          files: [{ base64, name: fileName, relativePath: fileName }],
          modelSlug: slug,
          options: { ...CONVERT_OPTIONS, instance: instancingActive },
          overwrite,
          primaryFilePath: fileName,
          primaryOutputName: slug,
          renamePrimaryFile: false,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Converting to JSX failed.');
      }

      setConvertState({
        status: 'success',
        message: `Wrote ${payload.component.relativePath} and assets to ${payload.model.directory}.`,
      });
      refreshModelList();
    } catch (error) {
      setConvertState({
        status: 'error',
        message:
          error instanceof Error ? error.message : 'Converting to JSX failed.',
      });
    }
  }

  const selectedInstance =
    instances.find((instance) => instance.id === selectedId) || null;
  const canExport = instances.length > 0;

  function renderViewport() {
    if (!instances.length) {
      return (
        <div style={styles.empty}>
          Add a model on the left to start combining. Pick the same model
          repeatedly to instance it.
        </div>
      );
    }

    return (
      <div style={styles.shell}>
        <div style={styles.overlay}>
          {selectedInstance
            ? `Editing: ${selectedInstance.label}`
            : `${instances.length} instance${instances.length === 1 ? '' : 's'}`}
        </div>
        <Canvas camera={{ fov: 50, position: [3, 2, 4] }} dpr={[1, 2]} shadows>
          <CombineScene
            fitKey={fitKey}
            gizmoMode={gizmoMode}
            instances={instances}
            objectsRef={objectsRef}
            onSelect={setSelectedId}
            onTransformChange={handleTransformChange}
            selectedId={selectedId}
          />
        </Canvas>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      <div style={styles.leftStack}>
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Add Models</h2>
          <p style={styles.panelLead}>
            Combine any models from `public/models` (or the current upload) into
            one GLTF. Add the same model again and again to instance it, then
            position and rotate each copy.
          </p>
          <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
            <div style={styles.field}>
              <span style={styles.label}>Model</span>
              <select
                style={styles.input}
                value={pickerValue}
                onChange={(event) => setPickerValue(event.target.value)}
              >
                {modelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.buttonRow}>
              <button
                type="button"
                style={{
                  ...styles.button,
                  ...(pickerValue && !adding ? null : styles.disabledButton),
                }}
                disabled={!pickerValue || adding}
                onClick={addInstance}
              >
                {adding ? 'Adding…' : 'Add to scene'}
              </button>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={refreshModelList}
              >
                Refresh list
              </button>
            </div>
            {addError ? (
              <p style={{ ...styles.hint, color: '#9f1239' }}>{addError}</p>
            ) : null}
            {modelListError ? (
              <p style={{ ...styles.hint, color: '#9f1239' }}>
                {modelListError}
              </p>
            ) : null}
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Instances</h2>
          {instances.length ? (
            <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
              <div style={styles.field}>
                <span style={styles.label}>Gizmo mode</span>
                <select
                  style={styles.input}
                  value={gizmoMode}
                  onChange={(event) => setGizmoMode(event.target.value)}
                >
                  <option value="translate">Translate</option>
                  <option value="rotate">Rotate</option>
                  <option value="scale">Scale</option>
                </select>
              </div>
              {instances.map((instance) => {
                const isSelected = instance.id === selectedId;
                return (
                  <div
                    key={instance.id}
                    style={{
                      ...styles.instanceItem,
                      ...(isSelected ? styles.instanceItemSelected : null),
                    }}
                  >
                    <div style={styles.instanceHeader}>
                      <button
                        type="button"
                        style={{
                          ...styles.instanceName,
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          color: '#0f172a',
                          padding: 0,
                          flex: 1,
                        }}
                        title={instance.label}
                        onClick={() => setSelectedId(instance.id)}
                      >
                        {instance.label}
                      </button>
                      <span style={styles.buttonRow}>
                        <button
                          type="button"
                          style={styles.secondaryButton}
                          onClick={() => duplicateInstance(instance)}
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          style={styles.secondaryButton}
                          onClick={() => removeInstance(instance.id)}
                        >
                          Remove
                        </button>
                      </span>
                    </div>
                    {isSelected ? (
                      <>
                        {(() => {
                          // poseVersion gates the ref read so the list refreshes
                          // once a model's pose clips finish hydrating.
                          const instancePoses =
                            poseVersion >= 0
                              ? posesCacheRef.current.get(
                                  instance.modelValue
                                ) || []
                              : [];

                          return (
                            <div style={styles.field}>
                              <span style={styles.label}>Pose</span>
                              <select
                                style={styles.input}
                                value={instance.poseName || REST_POSE_VALUE}
                                onChange={(event) =>
                                  setInstancePose(
                                    instance.id,
                                    event.target.value
                                  )
                                }
                              >
                                <option value={REST_POSE_VALUE}>
                                  Rest pose (none)
                                </option>
                                {instancePoses.map((pose) => (
                                  <option key={pose.id} value={pose.name}>
                                    {pose.name}
                                  </option>
                                ))}
                              </select>
                              <p style={styles.hint}>
                                {instancePoses.length
                                  ? 'Baked into this copy on export.'
                                  : 'No poses found in this model. Author them in the Pose workbench first.'}
                              </p>
                            </div>
                          );
                        })()}
                        <VectorRow
                          axisLabel="Position"
                          label="Pos"
                          step={0.1}
                          decimals={3}
                          values={instance.position}
                          onChange={(axisIndex, value) =>
                            setVectorAxis(
                              instance.id,
                              'position',
                              axisIndex,
                              value
                            )
                          }
                        />
                        <VectorRow
                          axisLabel="Rotation"
                          decimals={3}
                          label="Rot"
                          step={1}
                          values={instance.rotation}
                          onChange={(axisIndex, value) =>
                            setVectorAxis(
                              instance.id,
                              'rotation',
                              axisIndex,
                              value
                            )
                          }
                        />
                        <VectorRow
                          axisLabel="Scale"
                          decimals={3}
                          label="Scl"
                          step={0.05}
                          values={instance.scale}
                          onChange={(axisIndex, value) =>
                            setVectorAxis(
                              instance.id,
                              'scale',
                              axisIndex,
                              value
                            )
                          }
                        />
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ ...styles.hint, marginTop: '0.9rem' }}>
              No instances yet. Add a model above to place it in the scene.
            </p>
          )}
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Save GLB</h2>
          <p style={styles.panelLead}>
            Writes a binary GLB of the combined scene into `public/models`. Run
            it back through Import &amp; Optimize, or use Convert to JSX below.
          </p>
          <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
            <div style={styles.field}>
              <span style={styles.label}>Output path</span>
              <input
                style={styles.input}
                type="text"
                value={outputPath}
                onChange={(event) => setOutputPath(event.target.value)}
              />
              <p style={styles.hint}>
                Relative to `public/models`. Must end in `.glb`.
              </p>
            </div>
            <div style={styles.checkboxRow}>
              <input
                aria-label="Overwrite existing output"
                type="checkbox"
                checked={overwrite}
                onChange={(event) => setOverwrite(event.target.checked)}
              />
              <span style={styles.label}>Overwrite existing output</span>
            </div>
            <div style={styles.buttonRow}>
              <button
                type="button"
                style={{
                  ...styles.button,
                  ...(canExport && saveState.status !== 'working'
                    ? null
                    : styles.disabledButton),
                }}
                disabled={!canExport || saveState.status === 'working'}
                onClick={handleSave}
              >
                {saveState.status === 'working'
                  ? 'Saving…'
                  : 'Save combined GLB'}
              </button>
            </div>
            {saveState.message ? (
              <div
                style={{
                  ...styles.message,
                  ...(saveState.status === 'error'
                    ? styles.error
                    : styles.success),
                }}
              >
                {saveState.message}
              </div>
            ) : null}
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Convert to JSX</h2>
          <p style={styles.panelLead}>
            Runs the combined scene through gltfjsx, writing both an optimized
            asset and a component under `src/components/elements`.
          </p>
          <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
            <div style={styles.field}>
              <span style={styles.label}>Component name</span>
              <input
                style={styles.input}
                type="text"
                value={componentName}
                onChange={(event) => setComponentName(event.target.value)}
              />
              <p style={styles.hint}>
                Writes to
                `src/components/elements/&lt;ComponentName&gt;/&lt;ComponentName&gt;.jsx`.
              </p>
            </div>
            <div style={styles.checkboxRow}>
              <input
                aria-label="Instance repeated geometry"
                type="checkbox"
                checked={instanceRepeated}
                disabled={hasPosedInstances}
                onChange={(event) => setInstanceRepeated(event.target.checked)}
              />
              <span style={styles.label}>Instance repeated geometry</span>
            </div>
            {hasPosedInstances ? (
              <p style={styles.hint}>
                Instancing is off while any copy has a pose applied — posed
                copies need distinct skeletons.
              </p>
            ) : null}
            <div style={styles.buttonRow}>
              <button
                type="button"
                style={{
                  ...styles.button,
                  ...(canExport && convertState.status !== 'working'
                    ? null
                    : styles.disabledButton),
                }}
                disabled={!canExport || convertState.status === 'working'}
                onClick={handleConvert}
              >
                {convertState.status === 'working'
                  ? 'Converting…'
                  : 'Convert to JSX'}
              </button>
            </div>
            {convertState.message ? (
              <div
                style={{
                  ...styles.message,
                  ...(convertState.status === 'error'
                    ? styles.error
                    : styles.success),
                }}
              >
                {convertState.message}
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div style={styles.rightStack}>{renderViewport()}</div>
    </div>
  );
}
