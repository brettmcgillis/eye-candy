import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Environment,
  OrbitControls,
  TransformControls,
} from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';
import {
  allowedIndicesForGroup,
  bakeGeometryWorld,
  buildChainArmature,
  buildHandArmature,
  collectSkinnableMeshes,
  collectSubtree,
  computeSkinWeights,
  createBone,
  guessSide,
} from './rigSkinning';
import useGltfPreview from './useGltfPreview';

const MODELS_ENDPOINT = '/dev-api/gltfjsx/models';
const WRITE_ASSET_ENDPOINT = '/dev-api/gltfjsx/write-asset';

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
  rightStack: { display: 'grid', gap: '1rem', minWidth: 0 },
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
  grid: { display: 'grid', gap: '0.85rem' },
  field: { display: 'grid', gap: '0.35rem' },
  label: { fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' },
  hint: { margin: 0, fontSize: '0.76rem', color: '#64748b', lineHeight: 1.45 },
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
  buttonRow: { display: 'flex', flexWrap: 'wrap', gap: '0.75rem' },
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
  disabledButton: { opacity: 0.5, cursor: 'not-allowed' },
  checkboxRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    padding: '0.65rem 0.9rem',
    borderRadius: '16px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'rgba(248, 250, 252, 0.9)',
  },
  meshRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '0.6rem',
    alignItems: 'center',
    borderRadius: '14px',
    padding: '0.5rem 0.7rem',
    background: 'rgba(248, 250, 252, 0.95)',
    border: '1px solid rgba(226, 232, 240, 0.95)',
    fontSize: '0.82rem',
  },
  boneList: {
    display: 'grid',
    gridAutoRows: 'max-content',
    gap: '0.15rem',
    maxHeight: '18rem',
    overflowY: 'auto',
    border: '1px solid rgba(226, 232, 240, 0.95)',
    borderRadius: '14px',
    padding: '0.45rem',
    background: 'rgba(248, 250, 252, 0.95)',
  },
  boneItem: {
    display: 'flex',
    alignItems: 'baseline',
    border: 'none',
    background: 'transparent',
    textAlign: 'left',
    borderRadius: '8px',
    padding: '0.3rem 0.5rem',
    fontSize: '0.8rem',
    color: '#0f172a',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  boneItemSelected: { background: '#0f172a', color: '#f8fafc' },
  boneItemDepth: {
    flexShrink: 0,
    fontSize: '0.68rem',
    opacity: 0.55,
    letterSpacing: '-0.08em',
    marginRight: '0.35rem',
  },
  sliderRow: {
    display: 'grid',
    gridTemplateColumns: '1.2rem 1fr 3.4rem',
    gap: '0.5rem',
    alignItems: 'center',
    fontSize: '0.8rem',
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

function getBoneDepth(bone) {
  let depth = 0;
  let { parent } = bone;
  while (parent && parent.isBone) {
    depth += 1;
    parent = parent.parent;
  }
  return depth;
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

function readBoneEuler(bone) {
  return {
    x: THREE.MathUtils.radToDeg(bone.rotation.x),
    y: THREE.MathUtils.radToDeg(bone.rotation.y),
    z: THREE.MathUtils.radToDeg(bone.rotation.z),
  };
}

function unionBox(geometries) {
  const box = new THREE.Box3();
  geometries.forEach((geometry) => {
    geometry.computeBoundingBox();
    box.union(geometry.boundingBox);
  });
  return box;
}

// Build the working rig from the loaded scene: bake each skinnable mesh into a
// flat world space, generate the chosen armature (hand per side / chain / none
// for custom), and parent plain (display) meshes alongside the bones under one
// identity export root.
function buildRigDraft(meshes, assignments, mode, settings) {
  const exportRoot = new THREE.Group();
  exportRoot.name = 'RigRoot';

  const meshEntries = meshes.map((mesh) => ({
    name: mesh.name || 'mesh',
    group:
      assignments[mesh.uuid] ||
      (mode === 'hand' ? guessSide(mesh.name) : 'all'),
    geometry: bakeGeometryWorld(mesh),
    material: mesh.material,
  }));

  const bones = [];
  if (mode === 'hand') {
    const bySide = new Map();
    meshEntries.forEach((entry) => {
      if (!bySide.has(entry.group)) bySide.set(entry.group, []);
      bySide.get(entry.group).push(entry.geometry);
    });
    bySide.forEach((geometries, side) => {
      const armature = buildHandArmature(side, unionBox(geometries));
      exportRoot.add(armature.root);
      bones.push(...armature.bones);
    });
  } else if (mode === 'chain') {
    const armature = buildChainArmature(
      unionBox(meshEntries.map((entry) => entry.geometry)),
      settings.chainCount
    );
    exportRoot.add(armature.root);
    bones.push(...armature.bones);
  }
  // 'custom' starts with no bones — the user adds them after generating.

  const displayMeshes = meshEntries.map((entry) => {
    const mesh = new THREE.Mesh(entry.geometry, entry.material);
    mesh.name = entry.name;
    exportRoot.add(mesh);
    return mesh;
  });

  exportRoot.updateMatrixWorld(true);
  return {
    exportRoot,
    meshEntries,
    bones,
    displayMeshes,
    skinned: false,
    mode,
  };
}

// Swap display meshes for SkinnedMeshes bound to one shared skeleton. Each mesh
// is weighted only against its own side's bones, then we snapshot the bind pose
// so test-posing can be reset.
function bindRigDraft(draft, options) {
  const skeleton = new THREE.Skeleton(draft.bones);
  draft.exportRoot.updateMatrixWorld(true);
  draft.displayMeshes.forEach((mesh) => draft.exportRoot.remove(mesh));

  const skinnedMeshes = draft.meshEntries.map((entry) => {
    const allowed = allowedIndicesForGroup(draft.bones, entry.group);
    const geometry = computeSkinWeights(
      entry.geometry,
      draft.bones,
      allowed,
      options
    );
    const skinned = new THREE.SkinnedMesh(geometry, entry.material);
    skinned.name = entry.name;
    skinned.castShadow = true;
    skinned.receiveShadow = true;
    draft.exportRoot.add(skinned);
    skinned.updateMatrixWorld(true);
    skinned.bind(skeleton);
    return skinned;
  });

  const bindPose = draft.bones.map((bone) => ({
    position: bone.position.clone(),
    quaternion: bone.quaternion.clone(),
    scale: bone.scale.clone(),
  }));

  return { ...draft, skeleton, skinnedMeshes, bindPose, skinned: true };
}

function FitCameraOnLoad({ object }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);

  useEffect(() => {
    if (!object) return;
    const box = new THREE.Box3().setFromObject(object);
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
  }, [object, camera, controls]);

  return null;
}

function BoneJoints({ bones, jointRadius, onSelect, selectedBone }) {
  const meshRefs = useRef([]);
  useFrame(() => {
    bones.forEach((bone, index) => {
      const mesh = meshRefs.current[index];
      if (mesh) bone.getWorldPosition(mesh.position);
    });
  });

  return bones.map((bone, index) => (
    <mesh
      key={bone.uuid}
      ref={(element) => {
        meshRefs.current[index] = element;
      }}
      renderOrder={999}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(bone);
      }}
    >
      <sphereGeometry args={[jointRadius, 12, 12]} />
      <meshBasicMaterial
        color={bone === selectedBone ? '#f59e0b' : '#38bdf8'}
        depthTest={false}
        transparent
        opacity={bone === selectedBone ? 0.95 : 0.55}
      />
    </mesh>
  ));
}

function RigScene({
  object,
  bones,
  gizmoMode,
  onBoneTransformChange,
  onSelectBone,
  selectedBone,
}) {
  const skeletonHelper = useMemo(() => {
    if (!object || !bones.length) return null;
    const helper = new THREE.SkeletonHelper(object);
    helper.material.depthTest = false;
    helper.renderOrder = 998;
    return helper;
  }, [object, bones.length]);

  const jointRadius = useMemo(() => {
    if (!object) return 0.02;
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return 0.02;
    const size = box.getSize(new THREE.Vector3()).length();
    return Math.max(size * 0.008, 0.002);
  }, [object]);

  if (!object) return null;

  return (
    <>
      <color attach="background" args={['#020617']} />
      <hemisphereLight intensity={0.4} groundColor="#0f172a" />
      <directionalLight position={[4, 8, 6]} intensity={1.4} castShadow />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>
      <FitCameraOnLoad object={object} />
      <primitive object={object} />
      {skeletonHelper ? <primitive object={skeletonHelper} /> : null}
      <BoneJoints
        bones={bones}
        jointRadius={jointRadius}
        onSelect={onSelectBone}
        selectedBone={selectedBone}
      />
      {selectedBone ? (
        <TransformControls
          mode={gizmoMode}
          object={selectedBone}
          size={0.55}
          onObjectChange={onBoneTransformChange}
        />
      ) : null}
      <OrbitControls makeDefault />
    </>
  );
}

function AxisSlider({ axis, onChange, value }) {
  return (
    <div style={styles.sliderRow}>
      <span style={styles.label}>{axis.toUpperCase()}</span>
      <input
        aria-label={`Rotation ${axis}`}
        max={180}
        min={-180}
        step={1}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <input
        aria-label={`Rotation ${axis} degrees`}
        style={{
          ...styles.input,
          padding: '0.3rem 0.4rem',
          fontSize: '0.78rem',
        }}
        type="number"
        value={Math.round(value * 10) / 10}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export default function RigWorkbench({ uploadedAsset }) {
  const [modelList, setModelList] = useState([]);
  const [modelListError, setModelListError] = useState(null);
  const [selectedModelValue, setSelectedModelValue] = useState('');
  const [skeletonMode, setSkeletonMode] = useState('hand');
  const [chainCount, setChainCount] = useState(4);
  const [assignments, setAssignments] = useState({});
  const [draft, setDraft] = useState(null);
  const [bones, setBones] = useState([]);
  const [selectedBone, setSelectedBone] = useState(null);
  const [boneEuler, setBoneEuler] = useState({ x: 0, y: 0, z: 0 });
  const [gizmoMode, setGizmoMode] = useState('translate');
  const [boneFilter, setBoneFilter] = useState('');
  const [smoothing, setSmoothing] = useState(0.5);
  const [outputPath, setOutputPath] = useState('rigged.glb');
  const [overwrite, setOverwrite] = useState(false);
  const [saveState, setSaveState] = useState({ status: 'idle', message: null });

  const refreshModelList = useCallback(async () => {
    try {
      const response = await fetch(MODELS_ENDPOINT);
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.message || 'Could not list models.');
      setModelList(payload.models || []);
      setModelListError(null);
    } catch (error) {
      setModelListError(
        error instanceof Error ? error.message : 'Could not list models.'
      );
    }
  }, []);

  useEffect(() => {
    refreshModelList();
  }, [refreshModelList]);

  const modelSource = useMemo(() => {
    if (selectedModelValue === 'uploaded' && uploadedAsset)
      return uploadedAsset;
    if (selectedModelValue.startsWith('saved:')) {
      const assetPath = selectedModelValue.slice('saved:'.length);
      return { type: 'saved', assetPath, url: modelFile(assetPath) };
    }
    return null;
  }, [selectedModelValue, uploadedAsset]);

  const previewState = useGltfPreview(modelSource);
  const scene = previewState.gltf?.scene ?? null;

  const skinnableMeshes = useMemo(
    () => (scene ? collectSkinnableMeshes(scene) : []),
    [scene]
  );

  // Reset the draft + default group assignments whenever the model or skeleton
  // mode changes (hand → L/R guess, otherwise everything skins to all bones).
  useEffect(() => {
    setDraft(null);
    setBones([]);
    setSelectedBone(null);
    setSaveState({ status: 'idle', message: null });
    const nextAssignments = {};
    skinnableMeshes.forEach((mesh) => {
      nextAssignments[mesh.uuid] =
        skeletonMode === 'hand' ? guessSide(mesh.name) : 'all';
    });
    setAssignments(nextAssignments);
    if (modelSource?.assetPath) {
      setOutputPath(
        modelSource.assetPath.replace(/\.(glb|gltf)$/i, '-rigged.glb')
      );
    }
  }, [scene, skeletonMode]);

  const filteredBones = useMemo(() => {
    const query = boneFilter.trim().toLowerCase();
    if (!query) return bones;
    return bones.filter((bone) => bone.name.toLowerCase().includes(query));
  }, [bones, boneFilter]);

  const selectBone = useCallback((bone) => {
    setSelectedBone(bone);
    if (bone) setBoneEuler(readBoneEuler(bone));
  }, []);

  const handleBoneTransformChange = useCallback(() => {
    if (selectedBone) setBoneEuler(readBoneEuler(selectedBone));
  }, [selectedBone]);

  function generateTemplate() {
    if (!skinnableMeshes.length) return;
    const nextDraft = buildRigDraft(
      skinnableMeshes,
      assignments,
      skeletonMode,
      {
        chainCount,
      }
    );
    setDraft(nextDraft);
    setBones(nextDraft.bones);
    setSelectedBone(null);
    setGizmoMode('translate');
  }

  function bindSkin() {
    if (!draft || !draft.bones.length) return;
    const bound = bindRigDraft(draft, { strength: smoothing });
    setDraft(bound);
    setBones(bound.bones);
    setGizmoMode('rotate');
    setSelectedBone(null);
  }

  function resetToTemplate() {
    if (!skinnableMeshes.length) return;
    generateTemplate();
  }

  // Custom-mode authoring: add a bone (child of the selected bone, or a new
  // root) offset slightly from its anchor so it's visible, then select it.
  function addCustomBone() {
    if (!draft) return;
    const anchor = new THREE.Vector3();
    const size = new THREE.Box3()
      .setFromObject(draft.exportRoot)
      .getSize(new THREE.Vector3())
      .length();
    const offset = Math.max(size * 0.08, 0.01);
    if (selectedBone) {
      selectedBone.getWorldPosition(anchor);
      anchor.y += offset;
    } else {
      new THREE.Box3().setFromObject(draft.exportRoot).getCenter(anchor);
    }
    const bone = createBone(
      `Bone_${draft.bones.length + 1}`,
      anchor,
      selectedBone || null,
      draft.exportRoot
    );
    draft.bones.push(bone);
    setBones([...draft.bones]);
    selectBone(bone);
  }

  function deleteSelectedBone() {
    if (!selectedBone || !draft) return;
    const subtree = new Set(collectSubtree(selectedBone));
    selectedBone.parent?.remove(selectedBone);
    draft.bones = draft.bones.filter((bone) => !subtree.has(bone));
    setBones([...draft.bones]);
    setSelectedBone(null);
  }

  function renameSelectedBone(name) {
    if (!selectedBone || !draft) return;
    selectedBone.name = name;
    setBones([...draft.bones]);
  }

  function jointsLead() {
    if (draft?.skinned) {
      return 'Rotate joints to test the deformation. Rebuild to re-place joints.';
    }
    if (skeletonMode === 'custom') {
      return 'Add bones, then drag the joint spheres to place them.';
    }
    return 'Drag joint spheres to fit the mesh, then auto-skin below.';
  }

  function setBoneRotationAxis(axis, degrees) {
    if (!selectedBone || !Number.isFinite(degrees)) return;
    selectedBone.rotation[axis] = THREE.MathUtils.degToRad(degrees);
    setBoneEuler((current) => ({ ...current, [axis]: degrees }));
  }

  function resetTestPose() {
    if (!draft?.bindPose) return;
    draft.bones.forEach((bone, index) => {
      const rest = draft.bindPose[index];
      bone.position.copy(rest.position);
      bone.quaternion.copy(rest.quaternion);
      bone.scale.copy(rest.scale);
    });
    if (selectedBone) setBoneEuler(readBoneEuler(selectedBone));
  }

  async function handleSave() {
    if (!draft?.skinned) return;
    setSaveState({ status: 'working', message: null });
    resetTestPose();

    try {
      const exporter = new GLTFExporter();
      const buffer = await exporter.parseAsync(draft.exportRoot, {
        binary: true,
      });
      const response = await fetch(WRITE_ASSET_ENDPOINT, {
        body: JSON.stringify({
          assetPath: outputPath,
          base64: arrayBufferToBase64(buffer),
          overwrite,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Saving the rigged model failed.');
      }
      setSaveState({
        status: 'success',
        message: `Wrote ${payload.outputPath} (${payload.bytes} bytes). Open it in the Pose tab to pose it.`,
      });
      refreshModelList();
    } catch (error) {
      setSaveState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Saving the rigged model failed.',
      });
    }
  }

  const modelOptions = useMemo(() => {
    const options = [{ label: 'Select a model…', value: '' }];
    if (uploadedAsset)
      options.push({ label: 'Current upload', value: 'uploaded' });
    modelList.forEach((model) => {
      options.push({
        label: model.assetPath,
        value: `saved:${model.assetPath}`,
      });
    });
    return options;
  }, [modelList, uploadedAsset]);

  function renderViewport() {
    if (!modelSource) {
      return (
        <div style={styles.empty}>
          Pick an unrigged model on the left to start building a rig.
        </div>
      );
    }
    if (previewState.status === 'error') {
      return (
        <div style={{ ...styles.empty, color: '#9f1239' }}>
          {previewState.error}
        </div>
      );
    }

    let overlayLabel = 'Generate a template to begin';
    if (previewState.status === 'loading') overlayLabel = 'Loading model';
    else if (draft?.skinned) overlayLabel = 'Skinned — rotate joints to test';
    else if (selectedBone) overlayLabel = `Placing: ${selectedBone.name}`;
    else if (draft) overlayLabel = 'Place joints, then auto-skin';

    return (
      <div style={styles.shell}>
        <div style={styles.overlay}>{overlayLabel}</div>
        <Canvas
          camera={{ fov: 50, position: [2, 1.5, 3] }}
          dpr={[1, 2]}
          shadows
        >
          <RigScene
            object={draft?.exportRoot ?? scene}
            bones={bones}
            gizmoMode={gizmoMode}
            onBoneTransformChange={handleBoneTransformChange}
            onSelectBone={selectBone}
            selectedBone={selectedBone}
          />
        </Canvas>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      <div style={styles.leftStack}>
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Model</h2>
          <p style={styles.panelLead}>
            Pick an unrigged model. The Rig tab builds an armature, skins it,
            and writes a rigged GLB you can then open in the Pose tab.
          </p>
          <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
            <div style={styles.field}>
              <span style={styles.label}>Model source</span>
              <select
                style={styles.input}
                value={selectedModelValue}
                onChange={(event) => setSelectedModelValue(event.target.value)}
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
                style={styles.secondaryButton}
                onClick={refreshModelList}
              >
                Refresh list
              </button>
            </div>
            {modelListError ? (
              <p style={{ ...styles.hint, color: '#9f1239' }}>
                {modelListError}
              </p>
            ) : null}
          </div>
        </section>

        {skinnableMeshes.length ? (
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Skeleton</h2>
            <p style={styles.panelLead}>
              Choose how to build the armature. Changing the type clears the
              current draft.
            </p>
            <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
              <div style={styles.field}>
                <span style={styles.label}>Skeleton type</span>
                <select
                  style={styles.input}
                  value={skeletonMode}
                  onChange={(event) => setSkeletonMode(event.target.value)}
                >
                  <option value="hand">Hand (forearm → fingers)</option>
                  <option value="chain">Bone chain</option>
                  <option value="custom">Custom (build by hand)</option>
                </select>
              </div>

              {skeletonMode === 'hand'
                ? skinnableMeshes.map((mesh) => (
                    <div key={mesh.uuid} style={styles.meshRow}>
                      <span>{mesh.name || mesh.uuid.slice(0, 8)}</span>
                      <select
                        style={{
                          ...styles.input,
                          padding: '0.35rem 0.5rem',
                          width: 'auto',
                        }}
                        value={assignments[mesh.uuid] || 'R'}
                        disabled={Boolean(draft)}
                        onChange={(event) =>
                          setAssignments((current) => ({
                            ...current,
                            [mesh.uuid]: event.target.value,
                          }))
                        }
                      >
                        <option value="L">Left hand</option>
                        <option value="R">Right hand</option>
                      </select>
                    </div>
                  ))
                : null}

              {skeletonMode === 'chain' ? (
                <div style={styles.field}>
                  <span style={styles.label}>Bone count: {chainCount}</span>
                  <input
                    aria-label="Bone count"
                    max={16}
                    min={2}
                    step={1}
                    type="range"
                    value={chainCount}
                    disabled={Boolean(draft)}
                    onChange={(event) =>
                      setChainCount(Number(event.target.value))
                    }
                  />
                  <p style={styles.hint}>
                    A straight chain along the model&apos;s longest axis — good
                    for bills, ropes, tails, banners.
                  </p>
                </div>
              ) : null}

              {skeletonMode === 'custom' ? (
                <p style={styles.hint}>
                  Generate an empty rig, then add and place bones in the Joints
                  panel below.
                </p>
              ) : null}

              <div style={styles.buttonRow}>
                {!draft ? (
                  <button
                    type="button"
                    style={styles.button}
                    onClick={generateTemplate}
                  >
                    {skeletonMode === 'custom'
                      ? 'Start custom rig'
                      : 'Generate template'}
                  </button>
                ) : (
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={resetToTemplate}
                  >
                    Rebuild
                  </button>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {scene && !skinnableMeshes.length ? (
          <section style={styles.panel}>
            <p style={styles.hint}>
              No unrigged meshes found. This model may already be skinned — use
              the Pose tab instead.
            </p>
          </section>
        ) : null}

        {draft ? (
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Joints</h2>
            <p style={styles.panelLead}>{jointsLead()}</p>
            <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
              {skeletonMode === 'custom' && !draft.skinned ? (
                <div style={styles.buttonRow}>
                  <button
                    type="button"
                    style={styles.button}
                    onClick={addCustomBone}
                  >
                    {selectedBone ? 'Add child bone' : 'Add bone'}
                  </button>
                  {selectedBone ? (
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={deleteSelectedBone}
                    >
                      Delete bone
                    </button>
                  ) : null}
                </div>
              ) : null}
              <div style={styles.field}>
                <span style={styles.label}>Gizmo mode</span>
                <select
                  style={styles.input}
                  value={gizmoMode}
                  onChange={(event) => setGizmoMode(event.target.value)}
                >
                  <option value="translate">Translate (place)</option>
                  <option value="rotate">Rotate (pose)</option>
                </select>
              </div>
              <input
                aria-label="Filter bones"
                placeholder="Filter joints…"
                style={styles.input}
                type="text"
                value={boneFilter}
                onChange={(event) => setBoneFilter(event.target.value)}
              />
              <div style={styles.boneList}>
                {filteredBones.map((bone) => {
                  const depth = getBoneDepth(bone);
                  return (
                    <button
                      key={bone.uuid}
                      type="button"
                      style={{
                        ...styles.boneItem,
                        paddingLeft: `${0.5 + Math.min(depth, 7) * 0.45}rem`,
                        ...(bone === selectedBone
                          ? styles.boneItemSelected
                          : null),
                      }}
                      onClick={() => selectBone(bone)}
                    >
                      {depth > 0 ? (
                        <span style={styles.boneItemDepth}>
                          {'›'.repeat(Math.min(depth, 12))}
                        </span>
                      ) : null}
                      <span>{bone.name}</span>
                    </button>
                  );
                })}
                {!bones.length ? (
                  <p style={{ ...styles.hint, padding: '0.3rem 0.5rem' }}>
                    No bones yet — click “Add bone”.
                  </p>
                ) : null}
              </div>
              {selectedBone && skeletonMode === 'custom' && !draft.skinned ? (
                <div style={styles.field}>
                  <span style={styles.label}>Selected bone name</span>
                  <input
                    style={styles.input}
                    type="text"
                    value={selectedBone.name}
                    onChange={(event) => renameSelectedBone(event.target.value)}
                  />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {selectedBone && gizmoMode === 'rotate' ? (
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Rotate: {selectedBone.name}</h2>
            <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
              <AxisSlider
                axis="x"
                value={boneEuler.x}
                onChange={(value) => setBoneRotationAxis('x', value)}
              />
              <AxisSlider
                axis="y"
                value={boneEuler.y}
                onChange={(value) => setBoneRotationAxis('y', value)}
              />
              <AxisSlider
                axis="z"
                value={boneEuler.z}
                onChange={(value) => setBoneRotationAxis('z', value)}
              />
            </div>
          </section>
        ) : null}

        {draft ? (
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Skinning</h2>
            <p style={styles.panelLead}>
              Rigid nearest-bone assignment, then weights blend only across mesh
              edges — influence never bleeds between separate fingers. Strength
              sets how soft each joint boundary is.
            </p>
            <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
              <div style={styles.field}>
                <span style={styles.label}>
                  Smoothing strength: {smoothing.toFixed(2)}
                </span>
                <input
                  aria-label="Smoothing strength"
                  max={0.5}
                  min={0}
                  step={0.05}
                  type="range"
                  value={smoothing}
                  onChange={(event) => setSmoothing(Number(event.target.value))}
                />
              </div>
              <div style={styles.buttonRow}>
                <button
                  type="button"
                  style={{
                    ...styles.button,
                    ...(bones.length ? null : styles.disabledButton),
                  }}
                  disabled={!bones.length}
                  onClick={bindSkin}
                >
                  {draft.skinned ? 'Re-skin' : 'Auto-skin'}
                </button>
                {draft.skinned ? (
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={resetTestPose}
                  >
                    Reset pose
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {draft?.skinned ? (
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Export</h2>
            <p style={styles.panelLead}>
              Writes a rigged binary GLB into `public/models`. Run it back
              through Import &amp; Optimize if it needs compression.
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
                  aria-label="Overwrite existing file"
                  type="checkbox"
                  checked={overwrite}
                  onChange={(event) => setOverwrite(event.target.checked)}
                />
                <span style={styles.label}>Overwrite existing file</span>
              </div>
              <div style={styles.buttonRow}>
                <button
                  type="button"
                  style={{
                    ...styles.button,
                    ...(saveState.status === 'working'
                      ? styles.disabledButton
                      : null),
                  }}
                  disabled={saveState.status === 'working'}
                  onClick={handleSave}
                >
                  {saveState.status === 'working'
                    ? 'Saving…'
                    : 'Save rigged GLB'}
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
        ) : null}
      </div>

      <div style={styles.rightStack}>{renderViewport()}</div>
    </div>
  );
}
