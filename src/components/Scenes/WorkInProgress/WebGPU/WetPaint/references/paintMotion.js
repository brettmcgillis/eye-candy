/* eslint-disable  */
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { TubePainter } from 'three/addons/misc/TubePainter.js';
import { ssgi } from 'three/addons/tsl/display/SSGINode.js';
import { ssr } from 'three/addons/tsl/display/SSRNode.js';
import { traa } from 'three/addons/tsl/display/TRAANode.js';
import {
  add,
  colorToDirection,
  diffuseColor,
  directionToColor,
  metalness,
  mrt,
  normalView,
  output,
  pass,
  roughness,
  sample,
  vec2,
  vec4,
  velocity,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

let camera;
let scene;
let renderer;
let postProcessing;
let controls;
let painter;
let isDrawing = false;
let drawMode = true;
const lastPosition = new THREE.Vector3();
let lastTime = 0;
let currentSize = 1;

const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const wallPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.25);
const intersectionPoint = new THREE.Vector3();
const easedPosition = new THREE.Vector3();
const currentColor = new THREE.Color();

function getPointerCoords(clientX, clientY) {
  pointer.x = (clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(clientY / window.innerHeight) * 2 + 1;
}

init();

async function init() {
  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  renderer = new THREE.WebGPURenderer({
    requiredLimits: {
      maxColorAttachmentBytesPerSample: 40,
    },
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.domElement.style.cursor = 'crosshair';
  document.body.appendChild(renderer.domElement);

  await renderer.init();

  const environment = new RoomEnvironment();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(environment).texture;
  pmremGenerator.dispose();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = false;
  controls.update();

  postProcessing = new THREE.RenderPipeline(renderer);

  const scenePass = pass(scene, camera);
  scenePass.setMRT(
    mrt({
      output,
      diffuseColor,
      normal: directionToColor(normalView),
      metalrough: vec2(metalness, roughness), // pack metalness and roughness into a single attachment
      velocity,
    })
  );

  const scenePassColor = scenePass.getTextureNode('output');
  const scenePassDiffuse = scenePass.getTextureNode('diffuseColor');
  const scenePassDepth = scenePass.getTextureNode('depth');
  const scenePassNormal = scenePass.getTextureNode('normal');
  const scenePassMetalRough = scenePass.getTextureNode('metalrough');
  const scenePassVelocity = scenePass.getTextureNode('velocity');

  // bandwidth optimization

  const diffuseTexture = scenePass.getTexture('diffuseColor');
  diffuseTexture.type = THREE.UnsignedByteType;

  const normalTexture = scenePass.getTexture('normal');
  normalTexture.type = THREE.UnsignedByteType;

  const metalRoughTexture = scenePass.getTexture('metalrough');
  metalRoughTexture.type = THREE.UnsignedByteType;

  const sceneNormal = sample((uv) =>
    colorToDirection(scenePassNormal.sample(uv))
  );

  // ssgi

  const giPass = ssgi(scenePassColor, scenePassDepth, sceneNormal, camera);
  giPass.sliceCount.value = 2;
  giPass.stepCount.value = 8;
  giPass.aoIntensity.value = 1;

  // ssr

  const ssrPass = ssr(
    scenePassColor,
    scenePassDepth,
    sceneNormal,
    scenePassMetalRough.r,
    scenePassMetalRough.g,
    camera
  );

  // composite

  const ao = giPass.getAONode();
  const gi = giPass.getGINode();

  // apply AO to scene color and add GI multiplied by diffuse color
  const sceneWithGI = vec4(
    add(scenePassColor.rgb.mul(ao.r), scenePassDiffuse.rgb.mul(gi.rgb)),
    scenePassColor.a
  );

  // blend SSR reflections over the GI result
  const composite = sceneWithGI.add(ssrPass.rgb);

  postProcessing.outputNode = traa(
    composite,
    scenePassDepth,
    scenePassVelocity,
    camera
  );

  // scene

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0,
    })
  );
  scene.add(wall);

  painter = new TubePainter();
  painter.mesh.material.roughness = 0;
  painter.mesh.material.metalness = 0.25;
  scene.add(painter.mesh);

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  document.getElementById('modeToggle').addEventListener('click', () => {
    drawMode = !drawMode;
    controls.enabled = !drawMode;
    document.getElementById('mode').textContent = drawMode ? 'Draw' : 'Orbit';
  });

  document.getElementById('roughnessSlider').addEventListener('input', (e) => {
    painter.mesh.material.roughness = parseFloat(e.target.value);
    document.getElementById('roughness').textContent = e.target.value;
  });

  document.getElementById('metalnessSlider').addEventListener('input', (e) => {
    painter.mesh.material.metalness = parseFloat(e.target.value);
    document.getElementById('metalness').textContent = e.target.value;
  });

  document.getElementById('downloadGLB').addEventListener('click', () => {
    const { geometry } = painter.mesh;
    const drawCount = geometry.drawRange.count;

    if (drawCount === 0) return alert('Draw something first?');

    const exportGeometry = new THREE.BufferGeometry();
    exportGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        geometry.attributes.position.array.slice(0, drawCount * 3),
        3
      )
    );
    exportGeometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(
        geometry.attributes.normal.array.slice(0, drawCount * 3),
        3
      )
    );
    exportGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(
        geometry.attributes.color.array.slice(0, drawCount * 3),
        3
      )
    );

    const exportMesh = new THREE.Mesh(
      exportGeometry,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: painter.mesh.material.roughness,
        metalness: painter.mesh.material.metalness,
      })
    );

    const exporter = new GLTFExporter();
    exporter.parse(
      exportMesh,
      (result) => {
        const blob = new Blob([result], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'tube.glb';
        link.click();
      },
      (error) => {
        console.error('An error happened during export', error);
      },
      { binary: true }
    );
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerDown(event) {
  if (!drawMode || event.target.closest('#ui')) return;

  getPointerCoords(event.clientX, event.clientY);
  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(wallPlane, intersectionPoint);

  currentSize = 1;
  painter.moveTo(intersectionPoint);
  lastPosition.copy(intersectionPoint);
  lastTime = event.timeStamp;
  isDrawing = true;
}

function onPointerMove(event) {
  if (!drawMode || !isDrawing) return;

  getPointerCoords(event.clientX, event.clientY);
  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(wallPlane, intersectionPoint);

  const distance = intersectionPoint.distanceTo(lastPosition);
  const timeDelta = event.timeStamp - lastTime;
  const speed = timeDelta > 0 ? distance / timeDelta : 0;
  const targetSize = Math.min(15, Math.max(1, speed * 1000));

  currentSize += (targetSize - currentSize) * 0.3;

  // add easing with interpolation for smoother strokes
  easedPosition.lerpVectors(lastPosition, intersectionPoint, 0.7);

  currentColor.setHSL((event.timeStamp * 0.001) % 1, 1, 0.5);
  painter.setColor(currentColor);
  painter.setSize(currentSize);
  painter.lineTo(easedPosition);

  lastPosition.copy(easedPosition);
  lastTime = event.timeStamp;

  painter.update();
}

function onPointerUp() {
  isDrawing = false;
}

function animate() {
  controls.update();
  postProcessing.render();
}
