import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

import React, {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
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
import AnimationDriver from './AnimationDriver';
import useGltfPreview from './useGltfPreview';

const MODELS_ENDPOINT = '/dev-api/gltfjsx/models';
const WRITE_ASSET_ENDPOINT = '/dev-api/gltfjsx/write-asset';
const POSE_CLIP_DURATION = 1 / 30;
const POSITION_EPSILON = 1e-6;

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
  boneItemName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  boneItemDepth: {
    flexShrink: 0,
    fontSize: '0.68rem',
    opacity: 0.55,
    letterSpacing: '-0.08em',
    marginRight: '0.35rem',
  },
  boneItemSelected: {
    background: '#0f172a',
    color: '#f8fafc',
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

function collectBones(scene) {
  const bones = [];

  scene.traverse((node) => {
    if (node.isBone) {
      bones.push(node);
    }
  });

  return bones;
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

function applyPoseSnapshot(snapshot, bones) {
  const boneByName = new Map(bones.map((bone) => [bone.name, bone]));

  Object.entries(snapshot.bones).forEach(([boneName, track]) => {
    const bone = boneByName.get(boneName);
    if (!bone) return;

    if (track.quaternion) {
      bone.quaternion.fromArray(track.quaternion);
    }

    if (track.position) {
      bone.position.fromArray(track.position);
    }
  });
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

// Inverse of buildPoseClip: recognize one-frame quaternion/position clips
// (the format Save writes) and turn them back into editable pose snapshots.
function poseSnapshotFromClip(clip) {
  const boneTracks = {};
  let hasQuaternion = false;

  const isPoseClip = clip.tracks.every((track) => {
    const match = track.name.match(/^(.+)\.(quaternion|position)$/);

    if (!match || track.times.length !== 1) {
      return false;
    }

    const [, boneName, property] = match;
    boneTracks[boneName] = boneTracks[boneName] || {};

    if (property === 'quaternion') {
      boneTracks[boneName].quaternion = Array.from(track.values.slice(0, 4));
      hasQuaternion = true;
    } else {
      boneTracks[boneName].position = Array.from(track.values.slice(0, 3));
    }

    return true;
  });

  if (!isPoseClip || !hasQuaternion || !clip.tracks.length) {
    return null;
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: clip.name,
    bones: boneTracks,
  };
}

function hydratePosesFromClips(clips) {
  return (clips || [])
    .map((clip) => poseSnapshotFromClip(clip))
    .filter(Boolean);
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

function BoneJoints({ bones, jointRadius, onSelect, selectedBone }) {
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
        color={bone === selectedBone ? '#f59e0b' : '#38bdf8'}
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
  bones,
  gizmoMode,
  onBoneTransformChange,
  onSelectBone,
  scene,
  selectedBone,
}) {
  const skeletonHelper = useMemo(() => {
    if (!scene || !bones.length) return null;

    const helper = new THREE.SkeletonHelper(scene);
    helper.material.depthTest = false;
    helper.renderOrder = 998;
    return helper;
  }, [scene, bones.length]);

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
        />
      ) : null}
      <primitive object={scene} />
      {skeletonHelper ? <primitive object={skeletonHelper} /> : null}
      <BoneJoints
        bones={bones}
        jointRadius={jointRadius}
        onSelect={onSelectBone}
        selectedBone={selectedBone}
      />
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

export default function PoseWorkbench({ uploadedAsset }) {
  const [modelList, setModelList] = useState([]);
  const [modelListError, setModelListError] = useState(null);
  const [selectedModelValue, setSelectedModelValue] = useState('');
  const [gizmoMode, setGizmoMode] = useState('rotate');
  const [selectedBone, setSelectedBone] = useState(null);
  const [boneEuler, setBoneEuler] = useState({ x: 0, y: 0, z: 0 });
  const [poseName, setPoseName] = useState('pose-1');
  const [poses, setPoses] = useState([]);
  const [outputPath, setOutputPath] = useState('model-posed.glb');
  const [overwrite, setOverwrite] = useState(false);
  const [saveState, setSaveState] = useState({ status: 'idle', message: null });
  const [animation, setAnimation] = useState({ clipName: '', playing: false });
  const [boneFilter, setBoneFilter] = useState('');
  const selectedBoneItemRef = useRef(null);

  const refreshModelList = useCallback(async () => {
    try {
      const response = await fetch(MODELS_ENDPOINT);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Could not list models.');
      }

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
    if (selectedModelValue === 'uploaded' && uploadedAsset) {
      return uploadedAsset;
    }

    if (selectedModelValue.startsWith('saved:')) {
      const assetPath = selectedModelValue.slice('saved:'.length);
      return {
        type: 'saved',
        assetPath,
        url: modelFile(assetPath),
      };
    }

    return null;
  }, [selectedModelValue, uploadedAsset]);

  const previewState = useGltfPreview(modelSource);
  const scene = previewState.gltf?.scene ?? null;
  const animationClips = previewState.gltf?.animations || [];

  const bones = useMemo(() => (scene ? collectBones(scene) : []), [scene]);
  const restPose = useMemo(() => captureRestPose(bones), [bones]);
  const filteredBones = useMemo(() => {
    const query = boneFilter.trim().toLowerCase();
    if (!query) return bones;

    return bones.filter((bone) =>
      (bone.name || bone.uuid).toLowerCase().includes(query)
    );
  }, [bones, boneFilter]);

  const modelSourceRef = useRef(modelSource);
  modelSourceRef.current = modelSource;
  const gltfRef = useRef(previewState.gltf);
  gltfRef.current = previewState.gltf;

  useEffect(() => {
    setSelectedBone(null);
    setAnimation({ clipName: '', playing: false });
    setBoneFilter('');
    setPoses(hydratePosesFromClips(gltfRef.current?.animations));
    setSaveState({ status: 'idle', message: null });
    setOutputPath(buildDefaultOutputPath(modelSourceRef.current));
  }, [scene]);

  // Keep the selected bone visible in the list when it's picked from the
  // viewport — long rigs otherwise leave the highlight scrolled out of view.
  useEffect(() => {
    selectedBoneItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedBone]);

  const selectBone = useCallback((bone) => {
    setSelectedBone(bone);
    if (bone) {
      setBoneEuler(readBoneEuler(bone));
    }
  }, []);

  const handleBoneTransformChange = useCallback(() => {
    if (selectedBone) {
      setBoneEuler(readBoneEuler(selectedBone));
    }
  }, [selectedBone]);

  function setBoneRotationAxis(axis, degrees) {
    if (!selectedBone || !Number.isFinite(degrees)) return;

    selectedBone.rotation[axis] = THREE.MathUtils.degToRad(degrees);
    setBoneEuler((current) => ({ ...current, [axis]: degrees }));
  }

  function resetSelectedBone() {
    if (!selectedBone) return;

    const rest = restPose.get(selectedBone);
    if (!rest) return;

    selectedBone.position.copy(rest.position);
    selectedBone.quaternion.copy(rest.quaternion);
    selectedBone.scale.copy(rest.scale);
    setBoneEuler(readBoneEuler(selectedBone));
  }

  function resetWholePose() {
    applyRestPose(restPose);
    if (selectedBone) {
      setBoneEuler(readBoneEuler(selectedBone));
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
      setAnimation({ clipName: '', playing: false });
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
      setAnimation({ clipName: '', playing: false });
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
    }

    const workingPose = capturePoseSnapshot('__working__', bones, restPose);

    try {
      // Export from the rest pose so the file keeps its bind pose; the
      // captured poses travel as one-frame animation clips instead.
      applyRestPose(restPose);

      const exporter = new GLTFExporter();
      const poseNames = new Set(poses.map((pose) => pose.name));
      const animations = [
        // Poses hydrated from the file are re-exported from the editable
        // list, so drop the original clips they came from to avoid duplicates.
        ...(previewState.gltf?.animations || []).filter(
          (clip) => !poseNames.has(clip.name)
        ),
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
    }
  }

  const modelOptions = useMemo(() => {
    const options = [{ label: 'Select a model…', value: '' }];

    if (uploadedAsset) {
      options.push({ label: 'Current upload', value: 'uploaded' });
    }

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
            bones={bones}
            gizmoMode={gizmoMode}
            onBoneTransformChange={handleBoneTransformChange}
            onSelectBone={selectBone}
            scene={scene}
            selectedBone={selectedBone}
          />
        </Canvas>
      </div>
    );
  }

  const canSave =
    Boolean(scene) && poses.length > 0 && saveState.status !== 'working';

  return (
    <div style={styles.layout}>
      <div style={styles.leftStack}>
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Model</h2>
          <p style={styles.panelLead}>
            Pose the current upload or any model already written to
            `public/models`. Posing needs a rigged (skinned) model.
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
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Bones</h2>
          <p style={styles.panelLead}>
            Click a joint in the viewport or pick a bone here, then rotate it
            with the gizmo or the sliders below.
          </p>
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
                {filteredBones.map((bone) => {
                  const depth = getBoneDepth(bone);
                  const boneName = bone.name || bone.uuid.slice(0, 8);
                  return (
                    <button
                      key={bone.uuid}
                      ref={
                        bone === selectedBone ? selectedBoneItemRef : undefined
                      }
                      type="button"
                      title={`${boneName} (depth ${depth})`}
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
                      <span style={styles.boneItemName}>{boneName}</span>
                    </button>
                  );
                })}
                {!filteredBones.length ? (
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
            <h2 style={styles.panelTitle}>
              Bone: {selectedBone.name || 'unnamed'}
            </h2>
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
          <p style={styles.panelLead}>
            Capture the current skeleton state as a named pose. Each pose is
            written as a one-frame animation clip so the exported model keeps
            its rig and bind pose.
          </p>
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
          <p style={styles.panelLead}>
            Writes a binary GLB into `public/models` with the captured poses
            embedded as animation clips (existing clips are preserved). Run it
            back through Import &amp; Optimize if it needs compression.
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

      <div style={styles.rightStack}>{renderViewport()}</div>
    </div>
  );
}
