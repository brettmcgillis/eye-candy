@group(0) @binding(0) var textureSampler: sampler;
@group(0) @binding(1) var sourceTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uniforms: FilterUniforms;
@group(0) @binding(3) var<uniform> filterSize: i32;

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) iuv: vec2f,
}

struct FilterUniforms {
    blurDir: vec2f,
}

override thicknessTextureWidth: f32;
override thicknessTextureHeight: f32;

fn clampCoord(coord: vec2f) -> vec2u {
    let dims = vec2f(textureDimensions(sourceTexture));

    return vec2u(clamp(coord, vec2f(0.0), dims - vec2f(1.0)));
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    let baseThickness = textureSample(sourceTexture, textureSampler, input.uv).r;

    if (baseThickness == 0.0) {
        return vec4f(0.0, 0.0, 0.0, 1.0);
    }

    let sigma = f32(filterSize) / 3.0;
    let sigmaSquareInv = 1.0 / (2.0 * sigma * sigma);
    let iuv = vec2f(thicknessTextureWidth, thicknessTextureHeight) * input.uv;
    var sum = baseThickness;
    var wsum = 1.0;

    for (var x = 1; x <= filterSize; x = x + 1) {
        let weight = exp(-f32(x * x) * sigmaSquareInv);
        let coords = vec2f(f32(x));
        let sampledLeft = textureLoad(sourceTexture, clampCoord(iuv - uniforms.blurDir * coords), 0).r;
        let sampledRight = textureLoad(sourceTexture, clampCoord(iuv + uniforms.blurDir * coords), 0).r;

        sum = sum + (sampledLeft + sampledRight) * weight;
        wsum = wsum + 2.0 * weight;
    }

    return vec4f(sum / wsum, 0.0, 0.0, 1.0);
}
