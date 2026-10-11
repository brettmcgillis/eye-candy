import * as THREE from 'three';

function collectChildren(node, target) {
  if (node.children.length === 0) {
    target.push(node);
    return;
  }

  node.children.forEach((child) => {
    collectChildren(child, target);
  });
}

function createLodBuckets(minRadius, numLayers) {
  const lodRadii = [];
  const lodBuckets = [{ max: minRadius, min: 0 }];

  for (let index = 0; index < numLayers; index += 1) {
    const min = minRadius * 2 ** index;
    const max = minRadius * 2 ** (index + 1);
    lodRadii.push(min);
    lodBuckets.push({ min, max });
  }

  return { lodBuckets, lodRadii };
}

function childLod(lodRadii, childSize) {
  for (let index = 0; index < lodRadii.length; index += 1) {
    if (childSize < lodRadii[index]) {
      return index;
    }
  }

  return -1;
}

function determineLod(squaredDistance, lodBuckets) {
  for (let index = 0; index < lodBuckets.length; index += 1) {
    const bucket = lodBuckets[index];
    if (
      squaredDistance >= bucket.min ** 2 &&
      squaredDistance < bucket.max ** 2
    ) {
      return index;
    }
  }

  return -1;
}

function createChildren(node, localToWorld, tree) {
  const midpoint = node.bounds.getCenter(new THREE.Vector3());
  const childBounds = [
    new THREE.Box3(node.bounds.min, midpoint),
    new THREE.Box3(
      new THREE.Vector3(midpoint.x, node.bounds.min.y, 0),
      new THREE.Vector3(node.bounds.max.x, midpoint.y, 0)
    ),
    new THREE.Box3(
      new THREE.Vector3(node.bounds.min.x, midpoint.y, 0),
      new THREE.Vector3(midpoint.x, node.bounds.max.y, 0)
    ),
    new THREE.Box3(midpoint, node.bounds.max),
  ];

  return childBounds.map((bounds) => {
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const newCenter = center.clone().applyMatrix4(localToWorld);
    const transformedSize = size.clone().applyMatrix4(localToWorld);
    const newBounds = new THREE.Box3();

    newBounds.setFromCenterAndSize(
      newCenter,
      new THREE.Vector3(
        Math.abs(transformedSize.x),
        Math.abs(transformedSize.y),
        Math.abs(transformedSize.z)
      )
    );

    return {
      bounds,
      center,
      children: [],
      localToWorld: node.localToWorld,
      lod: null,
      newBounds,
      newCenter,
      parent: node,
      size,
      tree,
    };
  });
}

function insertNode(node, position, lodRadii, lodBuckets, localToWorld, tree) {
  const closestPoint = new THREE.Vector3();
  const sizeFactor = 2;
  const currentNode = node;

  currentNode.children = [];
  currentNode.newBounds.clampPoint(position, closestPoint);

  const squaredDistance = position.distanceToSquared(closestPoint);
  const currentLod = determineLod(squaredDistance, lodBuckets);
  currentNode.lod = childLod(lodRadii, currentNode.size.x * sizeFactor);

  if (
    currentLod !== -1 &&
    currentNode.size.x >= lodRadii[currentLod] / sizeFactor
  ) {
    currentNode.children = createChildren(currentNode, localToWorld, tree);
    currentNode.children.forEach((child) => {
      insertNode(child, position, lodRadii, lodBuckets, localToWorld, tree);
    });
  }
}

function createQuadTree(params) {
  const { size } = params;
  const bounds = new THREE.Box3(
    new THREE.Vector3(-size, -size, 0),
    new THREE.Vector3(size, size, 0)
  );

  const tree = {
    root: {
      bounds,
      center: bounds.getCenter(new THREE.Vector3()),
      children: [],
      localToWorld: params.localToWorld,
      lod: null,
      newBounds: new THREE.Box3(),
      newCenter: new THREE.Vector3(),
      parent: null,
      size: bounds.getSize(new THREE.Vector3()),
    },
  };

  tree.root.newCenter.copy(tree.root.center).applyMatrix4(params.localToWorld);

  const transformedSize = tree.root.size
    .clone()
    .applyMatrix4(params.localToWorld);

  tree.root.newBounds.setFromCenterAndSize(
    tree.root.newCenter,
    new THREE.Vector3(
      Math.abs(transformedSize.x),
      Math.abs(transformedSize.y),
      Math.abs(transformedSize.z)
    )
  );

  return {
    getChildren() {
      const children = [];
      collectChildren(tree.root, children);
      return children;
    },
    insert(position) {
      const { lodBuckets, lodRadii } = createLodBuckets(
        params.min_lod_radius,
        params.lod_layers
      );

      insertNode(
        tree.root,
        position,
        lodRadii,
        lodBuckets,
        params.localToWorld,
        tree
      );
    },
  };
}

export default class QuadTreeRoot {
  constructor(params) {
    const transform = new THREE.Matrix4().makeRotationX(-Math.PI / 2);

    this.transform = transform.clone();
    this.quadTree = createQuadTree({
      ...params,
      localToWorld: transform,
      worldToLocal: transform.clone().invert(),
    });
  }

  getChildren() {
    return {
      children: this.quadTree.getChildren(),
      transform: this.transform,
    };
  }

  insert(position) {
    this.quadTree.insert(position);
  }
}
