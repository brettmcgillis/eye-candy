import React, {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  Environment,
  OrbitControls,
  TransformControls,
} from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

import {
  modelSourceFromValue,
  useWorkbenchModelOptions,
} from '../hooks/gltfWorkbenchModels';
import useGltfPreview from '../hooks/useGltfPreview';
import {
  applyPoseSnapshot,
  collectBones,
  hydratePosesFromClips,
  poseSnapshotFromClip,
} from '../utils/poseUtils';
import AnimationDriver from './AnimationDriver';

const WRITE_ASSET_ENDPOINT = '/dev-api/gltfjsx/write-asset';
const POSE_CLIP_DURATION = 1 / 30;
const POSITION_EPSILON = 1e-6;
// App-level clipboard for a single bone's local transform. Backed by
// localStorage so it carries across tabs (e.g. the same skeleton open in two
// tabs) and survives reloads.
const BONE_CLIPBOARD_KEY = 'poseWorkbench.boneClipboard';

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
  boneList: {
    display: 'grid',
    gridAutoRows: 'max-content',
    gap: '0.15rem',
    border: '1px solid rgba(226, 232, 240, 0.95)',
    borderRadius: '14px',
    padding: '0.45rem',
    background: 'rgba(248, 250, 252, 0.95)',
    maxHeight: '22rem',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  },
  boneRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.1rem',
    borderRadius: '8px',
  },
  boneToggle: {
    flexShrink: 0,
    width: '1.2rem',
    border: 'none',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '0.7rem',
    lineHeight: 1,
    padding: '0.3rem 0',
    textAlign: 'center',
  },
  boneItem: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'baseline',
    border: 'none',
    background: 'transparent',
    textAlign: 'left',
    borderRadius: '8px',
    padding: '0.3rem 0.5rem',
    fontSize: '0.8rem',
    color: 'inherit',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  boneItemName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  boneItemSelected: {
    background: '#0f172a',
    color: '#f8fafc',
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '0.5rem',
  },
  timecode: {
    fontSize: '0.78rem',
    fontVariantNumeric: 'tabular-nums',
    color: '#64748b',
  },
  sliderRow: {
    display: 'grid',
    gridTemplateColumns: '1.2rem 1fr 3.4rem',
    gap: '0.5rem',
    alignItems: 'center',
    fontSize: '0.8rem',
  },
  poseItem: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.6rem',
    alignItems: 'center',
    borderRadius: '14px',
    padding: '0.55rem 0.7rem',
    background: 'rgba(248, 250, 252, 0.95)',
    border: '1px solid rgba(226, 232, 240, 0.95)',
    fontSize: '0.82rem',
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

// Display materials make pure-white authoring models easier to read while
// posing: clay gives soft shaded form, normals make finger overlap/depth
// unambiguous. These never touch the file — export always restores originals.
const DISPLAY_MODE_OPTIONS = [
  { label: 'Original', value: 'original' },
  { label: 'Clay', value: 'clay' },
  { label: 'Normals', value: 'normal' },
];

function makeDisplayMaterial(mode, wireframe) {
  if (mode === 'normal') {
    return new THREE.MeshNormalMaterial({ wireframe });
  }

  return new THREE.MeshStandardMaterial({
    color: '#c9b5a3',
    roughness: 0.82,
    metalness: 0.0,
    wireframe,
  });
}

function collectMeshes(scene) {
  const meshes = [];

  scene.traverse((node) => {
    if (node.isMesh) {
      meshes.push(node);
    }
  });

  return meshes;
}

function getBoneDepth(bone) {
  let depth = 0;
  let { parent } = bone;

  while (parent && parent.isBone) {
    depth += 1;
    parent = parent.parent;
  }

  return depth;
}

function boneHasChildren(bone) {
  return Boolean(bone.children?.some((child) => child.isBone));
}

function hasCollapsedAncestor(bone, collapsedIds) {
  let { parent } = bone;

  while (parent && parent.isBone) {
    if (collapsedIds.has(parent.uuid)) return true;
    parent = parent.parent;
  }

  return false;
}

function getRootBone(bone) {
  let current = bone;

  while (current.parent && current.parent.isBone) {
    current = current.parent;
  }

  return current;
}

// Group bones into armatures by their top-most bone. A combined model (e.g. two
// arm rigs) has one root bone per skeleton, so each becomes its own toggleable
// armature in the viewport.
function collectArmatures(bones) {
  const groups = new Map();

  bones.forEach((bone) => {
    const root = getRootBone(bone);

    if (!groups.has(root.uuid)) {
      const container = root.parent && !root.parent.isBone ? root.parent : root;
      groups.set(root.uuid, {
        bones: [],
        id: root.uuid,
        name: container.name || root.name || 'Armature',
        rootBone: root,
      });
    }

    groups.get(root.uuid).bones.push(bone);
  });

  return Array.from(groups.values());
}

function captureRestPose(bones) {
  const restPose = new Map();

  bones.forEach((bone) => {
    restPose.set(bone, {
      position: bone.position.clone(),
      quaternion: bone.quaternion.clone(),
      scale: bone.scale.clone(),
    });
  });

  return restPose;
}

function applyRestPose(restPose) {
  restPose.forEach((transforms, bone) => {
    bone.position.copy(transforms.position);
    bone.quaternion.copy(transforms.quaternion);
    bone.scale.copy(transforms.scale);
  });
}

// Pose snapshots are keyed by bone name with plain-array transforms so they
// can later drive Theatre.js sheet objects or AnimationClip tracks directly.
function capturePoseSnapshot(name, bones, restPose) {
  const boneTracks = {};

  bones.forEach((bone) => {
    if (!bone.name) return;

    const rest = restPose.get(bone);
    const track = { quaternion: bone.quaternion.toArray() };

    if (
      rest &&
      bone.position.distanceToSquared(rest.position) > POSITION_EPSILON
    ) {
      track.position = bone.position.toArray();
    }

    boneTracks[bone.name] = track;
  });

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    bones: boneTracks,
  };
}

function buildPoseClip(snapshot) {
  const tracks = [];

  Object.entries(snapshot.bones).forEach(([boneName, track]) => {
    tracks.push(
      new THREE.QuaternionKeyframeTrack(
        `${boneName}.quaternion`,
        [0],
        [...track.quaternion]
      )
    );

    if (track.position) {
      tracks.push(
        new THREE.VectorKeyframeTrack(
          `${boneName}.position`,
          [0],
          [...track.position]
        )
      );
    }
  });

  return new THREE.AnimationClip(snapshot.name, POSE_CLIP_DURATION, tracks);
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

function buildDefaultOutputPath(modelSource) {
  if (modelSource?.type === 'saved' && modelSource.assetPath) {
    return modelSource.assetPath.replace(/\.(glb|gltf)$/i, '-posed.glb');
  }

  if (modelSource?.type === 'uploaded' && modelSource.primaryFilePath) {
    const fileName = modelSource.primaryFilePath.split('/').pop() || 'model';
    return `${fileName.replace(/\.(glb|gltf)$/i, '')}-posed.glb`;
  }

  return 'model-posed.glb';
}

function readBoneEuler(bone) {
  return {
    x: THREE.MathUtils.radToDeg(bone.rotation.x),
    y: THREE.MathUtils.radToDeg(bone.rotation.y),
    z: THREE.MathUtils.radToDeg(bone.rotation.z),
  };
}

function readBonePosition(bone) {
  return { x: bone.position.x, y: bone.position.y, z: bone.position.z };
}

function describeGizmoMode(mode) {
  return mode === 'translate' ? 'translation' : 'rotation';
}

// The clipboard holds exactly one kind of value — rotation OR translation —
// matching the gizmo mode it was copied in. Paste only applies that kind.
function readBoneClipboard() {
  try {
    const raw = window.localStorage.getItem(BONE_CLIPBOARD_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (parsed?.mode === 'translate') {
      return Array.isArray(parsed.position) && parsed.position.length === 3
        ? parsed
        : null;
    }

    if (parsed?.mode === 'rotate') {
      return Array.isArray(parsed.quaternion) && parsed.quaternion.length === 4
        ? parsed
        : null;
    }

    return null;
  } catch {
    return null;
  }
}

function FitCameraOnLoad({ scene }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);

  useLayoutEffect(() => {
    if (!scene) return;

    const box = new THREE.Box3().setFromObject(scene);
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
  }, [scene, camera, controls]);

  return null;
}

function BoneJoints({
  bones,
  jointRadius,
  markerColor,
  onSelect,
  selectedBone,
}) {
  const meshRefs = useRef([]);

  useFrame(() => {
    bones.forEach((bone, index) => {
      const mesh = meshRefs.current[index];
      if (mesh) {
        bone.getWorldPosition(mesh.position);
      }
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
        color={bone === selectedBone ? '#f59e0b' : markerColor}
        depthTest={false}
        transparent
        opacity={bone === selectedBone ? 0.95 : 0.55}
      />
    </mesh>
  ));
}

function PoseScene({
  animation,
  animationClips,
  armatures,
  bones,
  gizmoMode,
  hiddenArmatureIds,
  markerColor,
  markerScale,
  onAnimationTimeChange,
  onBoneTransformChange,
  onSelectBone,
  scene,
  selectedBone,
  showMarkers,
  showMesh,
  hiddenMeshIds,
}) {
  // Skinned meshes carry a bind-pose bounding volume, so posing bones far from
  // rest makes three think they've left the frustum and culls them. Disable
  // frustum culling on the model's meshes and drive their visibility from the
  // Show mesh toggle (master) plus the per-mesh hidden set.
  useLayoutEffect(() => {
    if (!scene) return;

    scene.traverse((node) => {
      if (node.isMesh) {
        /* eslint-disable no-param-reassign */
        node.frustumCulled = false;
        node.visible = showMesh && !hiddenMeshIds.has(node.uuid);
        /* eslint-enable no-param-reassign */
      }
    });
  }, [scene, showMesh, hiddenMeshIds]);

  // One SkeletonHelper per armature so each skeleton's lines can be toggled
  // independently (a single scene-wide helper can't be split).
  const armatureHelpers = useMemo(() => {
    if (!scene) return [];

    return armatures.map((armature) => {
      const helper = new THREE.SkeletonHelper(armature.rootBone);
      helper.material.depthTest = false;
      helper.renderOrder = 998;
      return { helper, id: armature.id };
    });
  }, [armatures, scene]);

  // Markers are filtered to visible armatures; the full `bones` list still
  // drives posing and export regardless of what's shown.
  const markerBones = useMemo(() => {
    if (!hiddenArmatureIds.size) return bones;

    const hiddenBoneIds = new Set();
    armatures.forEach((armature) => {
      if (hiddenArmatureIds.has(armature.id)) {
        armature.bones.forEach((bone) => hiddenBoneIds.add(bone.uuid));
      }
    });

    return bones.filter((bone) => !hiddenBoneIds.has(bone.uuid));
  }, [armatures, bones, hiddenArmatureIds]);

  const jointRadius = useMemo(() => {
    if (!scene) return 0.02;

    const box = new THREE.Box3().setFromObject(scene);
    if (box.isEmpty()) return 0.02;

    const size = box.getSize(new THREE.Vector3()).length();
    return Math.max(size * 0.008, 0.002);
  }, [scene]);

  if (!scene) return null;

  return (
    <>
      <color attach="background" args={['#020617']} />
      <hemisphereLight intensity={0.4} groundColor="#0f172a" />
      <directionalLight position={[4, 8, 6]} intensity={1.4} castShadow />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>
      <FitCameraOnLoad scene={scene} />
      {animation?.clipName ? (
        <AnimationDriver
          clipName={animation.clipName}
          clips={animationClips}
          playing={animation.playing}
          root={scene}
          time={animation.time}
          onTimeChange={onAnimationTimeChange}
        />
      ) : null}
      <primitive object={scene} />
      {showMarkers
        ? armatureHelpers
            .filter(({ id }) => !hiddenArmatureIds.has(id))
            .map(({ helper, id }) => <primitive key={id} object={helper} />)
        : null}
      {showMarkers ? (
        <BoneJoints
          bones={markerBones}
          jointRadius={jointRadius * markerScale}
          markerColor={markerColor}
          onSelect={onSelectBone}
          selectedBone={selectedBone}
        />
      ) : null}
      {selectedBone && !(animation?.clipName && animation.playing) ? (
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

function AxisSlider({
  axis,
  label = 'Axis',
  max = 180,
  min = -180,
  onChange,
  precision = 1,
  step = 1,
  value,
}) {
  const factor = 10 ** precision;

  return (
    <div style={styles.sliderRow}>
      <span style={styles.label}>{axis.toUpperCase()}</span>
      <input
        aria-label={`${label} ${axis}`}
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <input
        aria-label={`${label} ${axis} value`}
        style={{
          ...styles.input,
          padding: '0.3rem 0.4rem',
          fontSize: '0.78rem',
        }}
        step={step}
        type="number"
        value={Math.round(value * factor) / factor}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export default function PoseWorkbench({ uploadedAsset }) {
  const [searchParams, setSearchParams] = useSearchParams();
  // Only saved models survive a refresh — an "uploaded" selection has no file
  // to reload, so we never restore it from the URL.
  const initialModelParam = searchParams.get('model') || '';
  const [selectedModelValue, setSelectedModelValue] = useState(
    initialModelParam.startsWith('saved:') ? initialModelParam : ''
  );
  // Captured once at mount so a refreshed clip selection can be reapplied after
  // the model (and its clips) finish loading.
  const pendingClipRef = useRef(searchParams.get('clip') || null);
  const [gizmoMode, setGizmoMode] = useState('rotate');
  const [selectedBone, setSelectedBone] = useState(null);
  const [boneEuler, setBoneEuler] = useState({ x: 0, y: 0, z: 0 });
  const [bonePosition, setBonePosition] = useState({ x: 0, y: 0, z: 0 });
  const [boneClipboard, setBoneClipboard] = useState(() => readBoneClipboard());
  const [poseName, setPoseName] = useState('pose-1');
  const [poses, setPoses] = useState([]);
  const [outputPath, setOutputPath] = useState('model-posed.glb');
  const [overwrite, setOverwrite] = useState(false);
  const [saveState, setSaveState] = useState({ status: 'idle', message: null });
  const [animation, setAnimation] = useState({
    clipName: '',
    playing: false,
    time: 0,
  });
  const [boneFilter, setBoneFilter] = useState('');
  // Collapsed bones (by uuid) hide their descendants in the list tree.
  const [collapsedBones, setCollapsedBones] = useState(() => new Set());
  // Display-material override for the viewport only (never exported).
  const [displayMode, setDisplayMode] = useState('original');
  const [wireframe, setWireframe] = useState(false);
  const originalMaterialsRef = useRef(new Map());
  // Viewport marker controls — markers default on, sized off the model bbox.
  const [showMesh, setShowMesh] = useState(true);
  // Meshes hidden from the viewport (by uuid) — individual toggles under the
  // Show mesh master, mirroring the per-armature toggles.
  const [hiddenMeshIds, setHiddenMeshIds] = useState(() => new Set());
  const [showMarkers, setShowMarkers] = useState(true);
  const [markerScale, setMarkerScale] = useState(0.25);
  const [markerColor, setMarkerColor] = useState('#38bdf8');
  // Armatures hidden from the viewport (by root-bone uuid) — lets you isolate
  // one skeleton on combined rigs where bones from each crowd together.
  const [hiddenArmatureIds, setHiddenArmatureIds] = useState(() => new Set());
  const selectedBoneItemRef = useRef(null);
  const { modelListError, modelOptions, refreshModelList } =
    useWorkbenchModelOptions(uploadedAsset, 'Select a model...');

  // Keep the Paste button live when another tab copies a bone transform.
  useEffect(() => {
    function handleStorage(event) {
      if (event.key === BONE_CLIPBOARD_KEY) {
        setBoneClipboard(readBoneClipboard());
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const modelSource = useMemo(() => {
    return modelSourceFromValue(selectedModelValue, uploadedAsset);
  }, [selectedModelValue, uploadedAsset]);

  const previewState = useGltfPreview(modelSource);
  const scene = previewState.gltf?.scene ?? null;

  const animationClips = previewState.gltf?.animations || [];
  const selectedClip = animationClips.find(
    (clip) => clip.name === animation.clipName
  );
  const clipDuration = selectedClip?.duration ?? 0;

  const bones = useMemo(() => (scene ? collectBones(scene) : []), [scene]);
  const armatures = useMemo(() => collectArmatures(bones), [bones]);
  const meshes = useMemo(() => (scene ? collectMeshes(scene) : []), [scene]);
  const restPose = useMemo(() => captureRestPose(bones), [bones]);
  // Sizes the translate sliders' range to the model so the gizmo and sliders
  // cover a comparable distance regardless of the model's units.
  const sceneSize = useMemo(() => {
    if (!scene) return 1;

    const box = new THREE.Box3().setFromObject(scene);
    if (box.isEmpty()) return 1;

    return box.getSize(new THREE.Vector3()).length() || 1;
  }, [scene]);
  const filteredBones = useMemo(() => {
    const query = boneFilter.trim().toLowerCase();
    if (!query) return bones;

    return bones.filter((bone) =>
      (bone.name || bone.uuid).toLowerCase().includes(query)
    );
  }, [bones, boneFilter]);
  // While filtering, show every match flat; otherwise hide descendants of any
  // collapsed bone so the tree can be folded down.
  const displayedBones = useMemo(() => {
    if (boneFilter.trim() || !collapsedBones.size) return filteredBones;

    return filteredBones.filter(
      (bone) => !hasCollapsedAncestor(bone, collapsedBones)
    );
  }, [filteredBones, boneFilter, collapsedBones]);

  const modelSourceRef = useRef(modelSource);
  modelSourceRef.current = modelSource;
  const gltfRef = useRef(previewState.gltf);
  gltfRef.current = previewState.gltf;

  useEffect(() => {
    const clips = gltfRef.current?.animations || [];

    // Reapply a clip restored from the URL once, after its model has loaded.
    const pendingClip = pendingClipRef.current;
    pendingClipRef.current = null;
    const restoredClip =
      pendingClip && clips.some((clip) => clip.name === pendingClip)
        ? pendingClip
        : '';

    setSelectedBone(null);
    setAnimation({ clipName: restoredClip, playing: false, time: 0 });
    setBoneFilter('');
    setCollapsedBones(new Set());
    setHiddenArmatureIds(new Set());
    setHiddenMeshIds(new Set());
    setPoses(hydratePosesFromClips(clips));
    setSaveState({ status: 'idle', message: null });
    setOutputPath(buildDefaultOutputPath(modelSourceRef.current));
  }, [scene]);

  // Persist the selected model + clip in the query string so the Pose tab
  // restores them after a refresh. Functional updates keep the tab param (set
  // by GltfJsxPage) intact.
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (selectedModelValue.startsWith('saved:')) {
          next.set('model', selectedModelValue);
        } else {
          next.delete('model');
        }
        return next;
      },
      { replace: true }
    );
  }, [selectedModelValue, setSearchParams]);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (animation.clipName) {
          next.set('clip', animation.clipName);
        } else {
          next.delete('clip');
        }
        return next;
      },
      { replace: true }
    );
  }, [animation.clipName, setSearchParams]);

  // Keep the selected bone visible in the list when it's picked from the
  // viewport — long rigs otherwise leave the highlight scrolled out of view.
  useEffect(() => {
    selectedBoneItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedBone]);

  // Capture each mesh's authored material when a new model loads, so the
  // display override can always restore exactly what the file shipped with.
  useEffect(() => {
    const map = new Map();
    if (scene) {
      scene.traverse((node) => {
        if (node.isMesh) map.set(node, node.material);
      });
    }
    originalMaterialsRef.current = map;
  }, [scene]);

  const restoreOriginalMaterials = useCallback(() => {
    originalMaterialsRef.current.forEach((material, node) => {
      // eslint-disable-next-line no-param-reassign
      node.material = material;
      if ('wireframe' in material) {
        // eslint-disable-next-line no-param-reassign
        material.wireframe = false;
      }
    });
  }, []);

  const applyDisplayMaterials = useCallback(() => {
    const created = [];
    if (!scene) return created;

    scene.traverse((node) => {
      if (!node.isMesh) return;

      if (displayMode === 'original') {
        const original = originalMaterialsRef.current.get(node);
        if (original) {
          // eslint-disable-next-line no-param-reassign
          node.material = original;
          if ('wireframe' in original) original.wireframe = wireframe;
        }
        return;
      }

      const material = makeDisplayMaterial(displayMode, wireframe);
      created.push(material);
      // eslint-disable-next-line no-param-reassign
      node.material = material;
    });

    return created;
  }, [scene, displayMode, wireframe]);

  // Swap viewport materials whenever the mode (or model) changes, disposing any
  // materials we created and restoring originals on cleanup.
  useEffect(() => {
    const created = applyDisplayMaterials();
    return () => {
      created.forEach((material) => material.dispose());
      restoreOriginalMaterials();
    };
  }, [applyDisplayMaterials, restoreOriginalMaterials]);

  const selectBone = useCallback((bone) => {
    setSelectedBone(bone);
    if (bone) {
      setBoneEuler(readBoneEuler(bone));
      setBonePosition(readBonePosition(bone));
    }
  }, []);

  const handleBoneTransformChange = useCallback(() => {
    if (selectedBone) {
      setBoneEuler(readBoneEuler(selectedBone));
      setBonePosition(readBonePosition(selectedBone));
    }
  }, [selectedBone]);

  // AnimationDriver reports the live playhead (throttled) so the timeline
  // slider tracks playback; scrubbing the slider feeds time back as a seek.
  const handleAnimationTimeChange = useCallback((time) => {
    setAnimation((current) => ({ ...current, time }));
  }, []);

  const seekAnimation = useCallback((time) => {
    setAnimation((current) => ({ ...current, playing: false, time }));
  }, []);

  function setBoneRotationAxis(axis, degrees) {
    if (!selectedBone || !Number.isFinite(degrees)) return;

    selectedBone.rotation[axis] = THREE.MathUtils.degToRad(degrees);
    setBoneEuler((current) => ({ ...current, [axis]: degrees }));
  }

  function setBonePositionAxis(axis, value) {
    if (!selectedBone || !Number.isFinite(value)) return;

    selectedBone.position[axis] = value;
    setBonePosition((current) => ({ ...current, [axis]: value }));
  }

  function copyBoneTransform() {
    if (!selectedBone) return;

    // Copy only what the current gizmo mode edits: rotation or translation.
    const payload =
      gizmoMode === 'translate'
        ? {
            boneName: selectedBone.name || '',
            mode: 'translate',
            position: selectedBone.position.toArray(),
          }
        : {
            boneName: selectedBone.name || '',
            mode: 'rotate',
            quaternion: selectedBone.quaternion.toArray(),
          };

    try {
      window.localStorage.setItem(BONE_CLIPBOARD_KEY, JSON.stringify(payload));
    } catch {
      // localStorage can be unavailable (private mode); keep the in-memory copy.
    }

    setBoneClipboard(payload);
  }

  function pasteBoneTransform() {
    if (!selectedBone) return;

    // Read fresh so a copy made in another tab is picked up immediately.
    const payload = readBoneClipboard() || boneClipboard;
    if (!payload) return;

    // Apply only the copied channel, leaving the bone's other transform intact.
    if (payload.mode === 'translate') {
      selectedBone.position.fromArray(payload.position);
    } else {
      selectedBone.quaternion.fromArray(payload.quaternion);
    }

    setBoneEuler(readBoneEuler(selectedBone));
    setBonePosition(readBonePosition(selectedBone));

    // Clear the clipboard so each copy is pasted once.
    try {
      window.localStorage.removeItem(BONE_CLIPBOARD_KEY);
    } catch {
      // Ignore unavailable localStorage; the in-memory clear below still runs.
    }
    setBoneClipboard(null);
  }

  function resetSelectedBone() {
    if (!selectedBone) return;

    const rest = restPose.get(selectedBone);
    if (!rest) return;

    selectedBone.position.copy(rest.position);
    selectedBone.quaternion.copy(rest.quaternion);
    selectedBone.scale.copy(rest.scale);
    setBoneEuler(readBoneEuler(selectedBone));
    setBonePosition(readBonePosition(selectedBone));
  }

  function resetWholePose() {
    applyRestPose(restPose);
    if (selectedBone) {
      setBoneEuler(readBoneEuler(selectedBone));
      setBonePosition(readBonePosition(selectedBone));
    }
  }

  function capturePose() {
    if (!bones.length) return;

    const trimmedName = poseName.trim() || `pose-${poses.length + 1}`;
    const snapshot = capturePoseSnapshot(trimmedName, bones, restPose);

    setPoses((current) => [
      ...current.filter((pose) => pose.name !== trimmedName),
      snapshot,
    ]);
    setPoseName(`pose-${poses.length + 2}`);
  }

  function applyPose(snapshot) {
    const finishApply = () => {
      applyPoseSnapshot(snapshot, bones);
      if (selectedBone) {
        setBoneEuler(readBoneEuler(selectedBone));
      }
    };

    if (animation.clipName) {
      // Deselect the clip first: AnimationDriver's unmount restores the
      // pre-clip transforms, which would wipe the pose we just applied.
      setAnimation({ clipName: '', playing: false, time: 0 });
      setTimeout(finishApply, 0);
      return;
    }

    finishApply();
  }

  function deletePose(snapshot) {
    setPoses((current) => current.filter((pose) => pose.id !== snapshot.id));
  }

  async function handleSave() {
    if (!scene || !poses.length) return;

    setSaveState({ status: 'working', message: null });

    if (animation.clipName) {
      // Stop clip playback so the mixer cannot mutate bones mid-export and
      // let AnimationDriver's unmount restore the pre-clip transforms first.
      setAnimation({ clipName: '', playing: false, time: 0 });
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
    }

    const workingPose = capturePoseSnapshot('__working__', bones, restPose);

    try {
      // Export from the rest pose so the file keeps its bind pose; the
      // captured poses travel as one-frame animation clips instead.
      applyRestPose(restPose);

      // Never bake the viewport's display override into the file.
      restoreOriginalMaterials();

      const exporter = new GLTFExporter();
      const animations = [
        // Drop every one-frame pose clip (the format Save writes) and re-emit
        // only the current editable poses. Otherwise a pose deleted from the
        // list survives via its original clip and reappears after reload. Real
        // multi-frame animation clips aren't pose clips, so they're preserved.
        ...animationClips.filter((clip) => poseSnapshotFromClip(clip) === null),
        ...poses.map((pose) => buildPoseClip(pose)),
      ];
      const buffer = await exporter.parseAsync(scene, {
        animations,
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
        throw new Error(payload.message || 'Saving the posed model failed.');
      }

      setSaveState({
        status: 'success',
        message: `Wrote ${payload.outputPath} (${payload.bytes} bytes) with ${poses.length} pose clip${poses.length === 1 ? '' : 's'}.`,
      });
      refreshModelList();

      // Follow the write: re-point the loaded model (and the persisted ?model
      // URL) at the file we just saved, so a reload shows these poses instead
      // of the originally-selected source — which is usually a different
      // filename, since Output path defaults to `<source>-posed.glb`.
      const savedModelValue = `saved:${payload.assetPath}`;
      if (savedModelValue !== selectedModelValue) {
        setSelectedModelValue(savedModelValue);
      }
    } catch (error) {
      setSaveState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Saving the posed model failed.',
      });
    } finally {
      applyPoseSnapshot(workingPose, bones);
      // Put the viewport's display override back after exporting originals.
      applyDisplayMaterials();
    }
  }

  function renderViewport() {
    if (!modelSource) {
      return (
        <div style={styles.empty}>
          Pick a model source on the left to start posing.
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

    let overlayLabel = 'Pick a bone to pose';

    if (previewState.status === 'loading') {
      overlayLabel = 'Loading model';
    } else if (selectedBone) {
      overlayLabel = `Posing: ${selectedBone.name || 'bone'}`;
    }

    return (
      <div style={styles.shell}>
        <div style={styles.overlay}>{overlayLabel}</div>
        <Canvas
          camera={{ fov: 50, position: [2, 1.5, 3] }}
          dpr={[1, 2]}
          shadows
        >
          <PoseScene
            animation={animation}
            animationClips={animationClips}
            armatures={armatures}
            bones={bones}
            gizmoMode={gizmoMode}
            hiddenArmatureIds={hiddenArmatureIds}
            markerColor={markerColor}
            markerScale={markerScale}
            onAnimationTimeChange={handleAnimationTimeChange}
            onBoneTransformChange={handleBoneTransformChange}
            onSelectBone={selectBone}
            scene={scene}
            selectedBone={selectedBone}
            showMarkers={showMarkers}
            showMesh={showMesh}
            hiddenMeshIds={hiddenMeshIds}
          />
        </Canvas>
      </div>
    );
  }

  function toggleArmature(id) {
    setHiddenArmatureIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleMesh(uuid) {
    setHiddenMeshIds((current) => {
      const next = new Set(current);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  }

  function toggleBoneCollapsed(uuid) {
    setCollapsedBones((current) => {
      const next = new Set(current);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  }

  const canSave =
    Boolean(scene) && poses.length > 0 && saveState.status !== 'working';

  // The X/Y/Z panel mirrors the gizmo: rotate edits degrees, translate edits
  // local position. Translate sliders center on the bone's bind position and
  // span a model-scaled range so the slider travel feels comparable to dragging
  // the gizmo.
  const isTranslate = gizmoMode === 'translate';
  const translateRange = sceneSize * 0.5;
  const translateStep = Math.max(sceneSize / 1000, 0.0001);
  const selectedRestPosition = selectedBone
    ? restPose.get(selectedBone)?.position
    : null;

  return (
    <div style={styles.layout}>
      <div style={styles.leftStack}>
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Model</h2>

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

        {animationClips.length ? (
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Animations</h2>
            <p style={styles.panelLead}>
              This model has {animationClips.length} clip
              {animationClips.length === 1 ? '' : 's'} (saved poses show up in
              the Poses panel below too). Pause mid-clip to pose from that frame
              or capture it as a pose; the gizmo is disabled while a clip plays.
            </p>
            <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
              <div style={styles.field}>
                <span style={styles.label}>Clip</span>
                <select
                  style={styles.input}
                  value={animation.clipName}
                  onChange={(event) =>
                    setAnimation({
                      clipName: event.target.value,
                      playing: Boolean(event.target.value),
                      time: 0,
                    })
                  }
                >
                  <option value="">No animation</option>
                  {animationClips.map((clip) => (
                    <option key={clip.name} value={clip.name}>
                      {clip.name}
                    </option>
                  ))}
                </select>
              </div>
              {animation.clipName ? (
                <>
                  <div style={styles.buttonRow}>
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() =>
                        setAnimation((current) => ({
                          ...current,
                          playing: !current.playing,
                        }))
                      }
                    >
                      {animation.playing ? 'Pause' : 'Play'}
                    </button>
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() => seekAnimation(0)}
                    >
                      Rewind
                    </button>
                  </div>
                  <div style={styles.field}>
                    <div style={styles.timelineHeader}>
                      <span style={styles.label}>Timeline</span>
                      <span style={styles.timecode}>
                        {(animation.time ?? 0).toFixed(2)}s /{' '}
                        {clipDuration.toFixed(2)}s
                      </span>
                    </div>
                    <input
                      aria-label="Animation timeline"
                      max={clipDuration}
                      min={0}
                      step={Math.max(clipDuration / 600, 0.001)}
                      type="range"
                      value={Math.min(animation.time ?? 0, clipDuration)}
                      onChange={(event) =>
                        seekAnimation(Number(event.target.value))
                      }
                    />
                    <p style={styles.hint}>
                      Scrub to a frame to pose from it — scrubbing pauses
                      playback and snaps the rig to that moment.
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </section>
        ) : null}

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Bones</h2>

          {bones.length ? (
            <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
              <div style={styles.field}>
                <span style={styles.label}>Gizmo mode</span>
                <select
                  style={styles.input}
                  value={gizmoMode}
                  onChange={(event) => setGizmoMode(event.target.value)}
                >
                  <option value="rotate">Rotate</option>
                  <option value="translate">Translate</option>
                </select>
              </div>
              <div style={styles.field}>
                <input
                  aria-label="Filter bones"
                  placeholder="Filter bones…"
                  style={styles.input}
                  type="text"
                  value={boneFilter}
                  onChange={(event) => setBoneFilter(event.target.value)}
                />
              </div>
              <div style={styles.boneList}>
                {displayedBones.map((bone) => {
                  const depth = getBoneDepth(bone);
                  const boneName = bone.name || bone.uuid.slice(0, 8);
                  const isSelected = bone === selectedBone;
                  const collapsible =
                    !boneFilter.trim() && boneHasChildren(bone);
                  const collapsed = collapsedBones.has(bone.uuid);
                  return (
                    <div
                      key={bone.uuid}
                      style={{
                        ...styles.boneRow,
                        paddingLeft: `${Math.min(depth, 8) * 0.6}rem`,
                        ...(isSelected ? styles.boneItemSelected : null),
                      }}
                    >
                      {collapsible ? (
                        <button
                          type="button"
                          aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${boneName}`}
                          title={collapsed ? 'Expand' : 'Collapse'}
                          style={styles.boneToggle}
                          onClick={() => toggleBoneCollapsed(bone.uuid)}
                        >
                          {collapsed ? '▸' : '▾'}
                        </button>
                      ) : (
                        <span style={styles.boneToggle} />
                      )}
                      <button
                        ref={isSelected ? selectedBoneItemRef : undefined}
                        type="button"
                        title={`${boneName} (depth ${depth})`}
                        style={styles.boneItem}
                        onClick={() => selectBone(bone)}
                      >
                        <span style={styles.boneItemName}>{boneName}</span>
                      </button>
                    </div>
                  );
                })}
                {!displayedBones.length ? (
                  <p style={{ ...styles.hint, padding: '0.3rem 0.5rem' }}>
                    No bones match “{boneFilter}”.
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <p style={{ ...styles.hint, marginTop: '0.9rem' }}>
              {scene
                ? 'No bones found in this model. Posing requires a rigged model.'
                : 'Load a model to list its bones.'}
            </p>
          )}
        </section>

        {selectedBone ? (
          <section style={styles.panel}>
            <div style={styles.timelineHeader}>
              <h2 style={styles.panelTitle}>
                Bone: {selectedBone.name || 'unnamed'}
              </h2>
              <span style={styles.timecode}>
                {isTranslate ? 'Translate · position' : 'Rotate · degrees'}
              </span>
            </div>
            <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
              {isTranslate
                ? ['x', 'y', 'z'].map((axis) => {
                    const center = selectedRestPosition?.[axis] ?? 0;
                    return (
                      <AxisSlider
                        key={axis}
                        axis={axis}
                        label="Position"
                        min={center - translateRange}
                        max={center + translateRange}
                        step={translateStep}
                        precision={4}
                        value={bonePosition[axis]}
                        onChange={(value) => setBonePositionAxis(axis, value)}
                      />
                    );
                  })
                : ['x', 'y', 'z'].map((axis) => (
                    <AxisSlider
                      key={axis}
                      axis={axis}
                      label="Rotation"
                      value={boneEuler[axis]}
                      onChange={(value) => setBoneRotationAxis(axis, value)}
                    />
                  ))}
              <div style={styles.buttonRow}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={copyBoneTransform}
                >
                  Copy {describeGizmoMode(gizmoMode)}
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.secondaryButton,
                    ...(boneClipboard ? null : styles.disabledButton),
                  }}
                  disabled={!boneClipboard}
                  onClick={pasteBoneTransform}
                >
                  Paste{' '}
                  {boneClipboard ? describeGizmoMode(boneClipboard.mode) : ''}
                </button>
              </div>
              <p style={styles.hint}>
                {boneClipboard
                  ? `Clipboard: ${describeGizmoMode(boneClipboard.mode)} from ${
                      boneClipboard.boneName || 'a bone'
                    } — Paste applies only that to the selected bone (works across tabs on the same skeleton).`
                  : 'Copy only what the gizmo mode edits (rotation or translation), then paste onto another bone — or the same bone in another tab.'}
              </p>
              <div style={styles.buttonRow}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={resetSelectedBone}
                >
                  Reset bone
                </button>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={resetWholePose}
                >
                  Reset whole pose
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Poses</h2>

          <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
            <div style={styles.field}>
              <span style={styles.label}>Pose name</span>
              <input
                style={styles.input}
                type="text"
                value={poseName}
                onChange={(event) => setPoseName(event.target.value)}
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
                onClick={capturePose}
              >
                Capture pose
              </button>
            </div>
            {poses.map((pose) => (
              <div key={pose.id} style={styles.poseItem}>
                <span>{pose.name}</span>
                <span style={styles.buttonRow}>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => applyPose(pose)}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() => deletePose(pose)}
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Export</h2>

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
                  ...(canSave ? null : styles.disabledButton),
                }}
                disabled={!canSave}
                onClick={handleSave}
              >
                {saveState.status === 'working'
                  ? 'Saving…'
                  : 'Save GLB with pose clips'}
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
      </div>

      <div style={styles.rightStack}>
        {renderViewport()}

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Display</h2>

          <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
            <div style={styles.field}>
              <span style={styles.label}>Material</span>
              <select
                style={styles.input}
                value={displayMode}
                onChange={(event) => setDisplayMode(event.target.value)}
              >
                {DISPLAY_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.checkboxRow}>
              <input
                aria-label="Wireframe overlay"
                type="checkbox"
                checked={wireframe}
                onChange={(event) => setWireframe(event.target.checked)}
              />
              <span style={styles.label}>Wireframe</span>
            </div>
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Meshes</h2>
          <p style={styles.panelLead}>
            Show or hide the model geometry — the whole model, or one mesh at a
            time to focus on a single part.
          </p>
          <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
            <div style={styles.checkboxRow}>
              <input
                aria-label="Show all meshes"
                type="checkbox"
                checked={showMesh}
                onChange={(event) => setShowMesh(event.target.checked)}
              />
              <span style={styles.label}>Show all meshes</span>
            </div>
            {meshes.length > 1 ? (
              <div style={styles.field}>
                <div style={styles.timelineHeader}>
                  <span style={styles.label}>Individual meshes</span>
                  {hiddenMeshIds.size ? (
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() => setHiddenMeshIds(new Set())}
                    >
                      Show all
                    </button>
                  ) : null}
                </div>
                {meshes.map((mesh, index) => (
                  <div key={mesh.uuid} style={styles.checkboxRow}>
                    <input
                      aria-label={`Show mesh ${mesh.name || index + 1}`}
                      disabled={!showMesh}
                      type="checkbox"
                      checked={!hiddenMeshIds.has(mesh.uuid)}
                      onChange={() => toggleMesh(mesh.uuid)}
                    />
                    <span style={styles.label}>
                      {index + 1}. {mesh.name || 'mesh'}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Markers</h2>
          <p style={styles.panelLead}>
            Tune the joint markers and skeleton overlay so they stay readable on
            small or dense rigs.
          </p>
          <div style={{ ...styles.grid, marginTop: '0.9rem' }}>
            <div style={styles.checkboxRow}>
              <input
                aria-label="Show bones and markers"
                type="checkbox"
                checked={showMarkers}
                onChange={(event) => setShowMarkers(event.target.checked)}
              />
              <span style={styles.label}>Show bones &amp; markers</span>
            </div>
            <div style={styles.field}>
              <div style={styles.timelineHeader}>
                <span style={styles.label}>Marker size</span>
                <span style={styles.timecode}>{markerScale.toFixed(2)}×</span>
              </div>
              <input
                aria-label="Marker size"
                disabled={!showMarkers}
                max={5}
                min={0.1}
                step={0.05}
                type="range"
                value={markerScale}
                onChange={(event) => setMarkerScale(Number(event.target.value))}
              />
            </div>
            <div style={styles.field}>
              <span style={styles.label}>Marker color</span>
              <input
                aria-label="Marker color"
                disabled={!showMarkers}
                style={{ ...styles.input, height: '2.6rem', padding: '0.2rem' }}
                type="color"
                value={markerColor}
                onChange={(event) => setMarkerColor(event.target.value)}
              />
              <p style={styles.hint}>
                The selected joint stays amber so it&apos;s easy to spot.
              </p>
            </div>
            {armatures.length > 1 ? (
              <div style={styles.field}>
                <div style={styles.timelineHeader}>
                  <span style={styles.label}>Armatures</span>
                  {hiddenArmatureIds.size ? (
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() => setHiddenArmatureIds(new Set())}
                    >
                      Show all
                    </button>
                  ) : null}
                </div>
                <p style={styles.hint}>
                  Hide a skeleton to isolate the other when bones from each
                  crowd together.
                </p>
                {armatures.map((armature, index) => (
                  <div key={armature.id} style={styles.checkboxRow}>
                    <input
                      aria-label={`Show armature ${armature.name}`}
                      disabled={!showMarkers}
                      type="checkbox"
                      checked={!hiddenArmatureIds.has(armature.id)}
                      onChange={() => toggleArmature(armature.id)}
                    />
                    <span style={styles.label}>
                      {index + 1}. {armature.name}
                      <span style={{ ...styles.hint, marginLeft: '0.4rem' }}>
                        {armature.bones.length} bones
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
