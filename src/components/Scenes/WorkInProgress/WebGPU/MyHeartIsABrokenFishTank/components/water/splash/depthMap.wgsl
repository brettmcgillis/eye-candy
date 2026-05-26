struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) viewPosition: vec3f,
}

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) viewPosition: vec3f,
}

struct FragmentOutput {
    @location(0) depth: f32,
    @builtin(frag_depth) fragDepth: f32,
}

struct RenderUniforms {
    texelSize: vec2f,
    sphereSize: f32,
    _padding0: f32,
    projectionMatrix: mat4x4f,
    invProjectionMatrix: mat4x4f,
    viewMatrix: mat4x4f,
    invViewMatrix: mat4x4f,
    modelMatrix: mat4x4f,
}

struct PosVel {
    position: vec3f,
    v: vec3f,
}

@group(0) @binding(0) var<storage> particles: array<PosVel>;
@group(0) @binding(1) var<uniform> uniforms: RenderUniforms;

@vertex
fn vs(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
    let corners = array(
        vec2f(0.5, 0.5),
        vec2f(0.5, -0.5),
        vec2f(-0.5, -0.5),
        vec2f(0.5, 0.5),
        vec2f(-0.5, -0.5),
        vec2f(-0.5, 0.5),
    );
    let corner = vec3f(corners[vertexIndex] * uniforms.sphereSize, 0.0);
    let localPosition = (uniforms.modelMatrix * vec4f(particles[instanceIndex].position, 1.0)).xyz;
    let viewPosition = (uniforms.viewMatrix * vec4f(localPosition, 1.0)).xyz;
    let outputPosition = uniforms.projectionMatrix * vec4f(viewPosition + corner, 1.0);

    return VertexOutput(outputPosition, corners[vertexIndex] + 0.5, viewPosition);
}

@fragment
fn fs(input: FragmentInput) -> FragmentOutput {
    var out: FragmentOutput;
    let normalXY = input.uv * 2.0 - 1.0;
    let r2 = dot(normalXY, normalXY);

    if (r2 > 1.0) {
        discard;
    }

    let normal = vec3f(normalXY, sqrt(1.0 - r2));
    let radius = uniforms.sphereSize * 0.5;
    let realViewPos = vec4f(input.viewPosition + normal * radius, 1.0);
    let clipSpacePos = uniforms.projectionMatrix * realViewPos;

    out.fragDepth = clipSpacePos.z / clipSpacePos.w;
    out.depth = realViewPos.z;

    return out;
}
