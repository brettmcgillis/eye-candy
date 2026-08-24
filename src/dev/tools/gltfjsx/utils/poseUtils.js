// Shared pose helpers used by both PoseWorkbench (authoring) and
// CombineWorkbench (baking posed instances into a combined GLB).
//
// A "pose snapshot" is the canonical in-memory shape:
//   { id, name, bones: { [boneName]: { quaternion: [x,y,z,w], position?: [x,y,z] } } }
// Snapshots are keyed by bone name (not object reference) so they survive
// SkeletonUtils.clone and can be re-applied to any matching skeleton.

// Collect every bone under a scene/object in traversal order.
export function collectBones(scene) {
  const bones = [];

  scene.traverse((node) => {
    if (node.isBone) {
      bones.push(node);
    }
  });

  return bones;
}

// Capture a full snapshot of the given bones (quaternion + position for every
// named bone). Useful as a "rest" baseline so a pose can be reset before a
// different pose is applied on top.
export function captureBonesSnapshot(bones, { name = '__rest__' } = {}) {
  const boneTracks = {};

  bones.forEach((bone) => {
    if (!bone.name) return;

    boneTracks[bone.name] = {
      quaternion: bone.quaternion.toArray(),
      position: bone.position.toArray(),
    };
  });

  return { id: name, name, bones: boneTracks };
}

// Apply a pose snapshot onto a set of bones, matching by bone name. Only the
// quaternion and (optional) position channels are written, matching how poses
// are authored and stored.
export function applyPoseSnapshot(snapshot, bones) {
  if (!snapshot) return;

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

// Recognize one-frame quaternion/position clips (the format PoseWorkbench's
// Save writes) and turn them back into editable pose snapshots. Returns null
// for anything that isn't a single-frame pose clip (e.g. real animations).
export function poseSnapshotFromClip(clip) {
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

// Hydrate every pose clip in a list of AnimationClips into pose snapshots,
// dropping any clip that isn't a one-frame pose clip.
export function hydratePosesFromClips(clips) {
  return (clips || [])
    .map((clip) => poseSnapshotFromClip(clip))
    .filter(Boolean);
}
