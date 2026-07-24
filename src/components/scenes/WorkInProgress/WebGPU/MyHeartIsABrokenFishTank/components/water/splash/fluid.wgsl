@group(0) @binding(0) var textureSampler: sampler;
@group(0) @binding(1) var depthTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uniforms: RenderUniforms;
@group(0) @binding(3) var thicknessTexture: texture_2d<f32>;
@group(0) @binding(4) var backgroundTexture: texture_2d<f32>;
@group(0) @binding(5) var<uniform> fluidParams: vec4f;
@group(0) @binding(6) var sceneDepthTexture: texture_depth_2d;

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

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) iuv: vec2f,
}

fn clampDepthCoord(coord: vec2f) -> vec2u {
    let dims = vec2f(textureDimensions(depthTexture));

    return vec2u(clamp(coord, vec2f(0.0), dims - vec2f(1.0)));
}

fn clampSceneDepthCoord(coord: vec2f) -> vec2u {
    let dims = vec2f(textureDimensions(sceneDepthTexture));

    return vec2u(clamp(coord, vec2f(0.0), dims - vec2f(1.0)));
}

fn computeViewPosFromUVDepth(texCoord: vec2f, depth: f32) -> vec3f {
    var ndc = vec4f(texCoord.x * 2.0 - 1.0, 1.0 - texCoord.y * 2.0, 0.0, 1.0);

    ndc.z = -uniforms.projectionMatrix[2].z + uniforms.projectionMatrix[3].z / depth;
    ndc.w = 1.0;

    let eyePos = uniforms.invProjectionMatrix * ndc;

    return eyePos.xyz / eyePos.w;
}

fn computeViewPosFromSceneDepth(texCoord: vec2f, depth: f32) -> vec3f {
    let ndc = vec4f(texCoord.x * 2.0 - 1.0, 1.0 - texCoord.y * 2.0, depth, 1.0);
    let eyePos = uniforms.invProjectionMatrix * ndc;

    return eyePos.xyz / eyePos.w;
}

fn sampleDepth(coord: vec2f) -> f32 {
    return abs(textureLoad(depthTexture, clampDepthCoord(coord), 0).x);
}

fn sampleSceneDepth(coord: vec2f) -> f32 {
    return textureLoad(sceneDepthTexture, clampSceneDepthCoord(coord), 0);
}

fn sampleViewPos(uv: vec2f, iuv: vec2f) -> vec3f {
    return computeViewPosFromUVDepth(uv, sampleDepth(iuv));
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    let depth = sampleDepth(input.iuv);
    let sceneDepth = sampleSceneDepth(input.iuv);
    let background = textureSampleLevel(backgroundTexture, textureSampler, input.uv, 0.0).rgb;
    let thickness = max(textureSampleLevel(thicknessTexture, textureSampler, input.uv, 0.0).r, 0.0);

    if (depth >= 1e4) {
        return vec4f(background, 1.0);
    }

    if (sceneDepth < 0.999999) {
        let sceneSurfacePosView = computeViewPosFromSceneDepth(input.uv, sceneDepth);
        let sceneViewDepth = abs(sceneSurfacePosView.z);
        let occlusionBias = max(uniforms.sphereSize * 0.1, 0.01);

        if (sceneViewDepth + occlusionBias < depth) {
            return vec4f(background, 1.0);
        }
    }

    let surfacePosView = computeViewPosFromUVDepth(input.uv, depth);
    var ddx = sampleViewPos(
        input.uv + vec2f(uniforms.texelSize.x, 0.0),
        input.iuv + vec2f(1.0, 0.0)
    ) - surfacePosView;
    var ddy = sampleViewPos(
        input.uv + vec2f(0.0, uniforms.texelSize.y),
        input.iuv + vec2f(0.0, 1.0)
    ) - surfacePosView;
    let ddx2 = surfacePosView - sampleViewPos(
        input.uv - vec2f(uniforms.texelSize.x, 0.0),
        input.iuv - vec2f(1.0, 0.0)
    );
    let ddy2 = surfacePosView - sampleViewPos(
        input.uv - vec2f(0.0, uniforms.texelSize.y),
        input.iuv - vec2f(0.0, 1.0)
    );

    ddx = select(ddx, ddx2, abs(ddx.z) > abs(ddx2.z));
    ddy = select(ddy, ddy2, abs(ddy.z) > abs(ddy2.z));

    let normal = -normalize(cross(ddx, ddy));
    let viewDir = normalize(-surfacePosView);
    let refractionOffset = normal.xy * (0.022 + clamp(thickness * 0.18, 0.0, 0.04));
    let refractedUv = clamp(input.uv + refractionOffset, vec2f(0.0), vec2f(1.0));
    let refractedBackground = textureSampleLevel(backgroundTexture, textureSampler, refractedUv, 0.0).rgb;
    let absorption = exp(-fluidParams.a * thickness * (vec3f(1.0) - fluidParams.rgb));
    let refractedColor = refractedBackground * absorption + fluidParams.rgb * (1.0 - absorption) * 0.35;
    let fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 5.0);
    let lightDir = normalize(vec3f(-0.3, 0.65, 0.7));
    let specular = pow(max(dot(normal, lightDir), 0.0), 80.0) * 0.08;
    let reflectedColor = mix(refractedBackground, vec3f(1.0), 0.1);
    let finalColor = mix(refractedColor, reflectedColor, 0.18 + fresnel * 0.42) + specular;

    return vec4f(clamp(finalColor, vec3f(0.0), vec3f(1.0)), 1.0);
}
