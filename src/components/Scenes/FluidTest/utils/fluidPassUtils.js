export default function renderPass(gl, scene, camera, mesh, material, target) {
  const meshRef = mesh;
  meshRef.material = material;
  gl.setRenderTarget(target);
  gl.render(scene, camera);
}
