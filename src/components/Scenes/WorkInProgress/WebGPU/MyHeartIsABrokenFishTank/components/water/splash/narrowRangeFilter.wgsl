@group(0) @binding(1) var depthTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uniforms: FilterUniforms;

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) iuv: vec2f,
}

struct FilterUniforms {
    blurDir: vec2f,
}

override projectedParticleConstant: f32;
override maxFilterSize: f32;
override blur2D: u32;

fn clampDepthCoord(coord: vec2f) -> vec2u {
    let dims = vec2f(textureDimensions(depthTexture));

    return vec2u(clamp(coord, vec2f(0.0), dims - vec2f(1.0)));
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    let depth = abs(textureLoad(depthTexture, clampDepthCoord(input.iuv), 0).r);

    if (depth >= 1e4) {
        return vec4f(vec3f(depth), 1.0);
    }

    let filterSize = min(i32(maxFilterSize), i32(ceil(projectedParticleConstant / depth)));
    let sigma = f32(filterSize) / 2.0;
    let sigmaSquareInv = 1.0 / (2.0 * sigma * sigma);
    let depthThreshold = 6.0;
    let higherDepthBound = depth + 1.8;
    var sum = depth;
    var wsum = 1.0;

    if (blur2D == 0u) {
        var depthThresholdLowX = depth - depthThreshold;
        var depthThresholdHighX = depth + depthThreshold;
        var depthThresholdLowY = depth - depthThreshold;
        var depthThresholdHighY = depth + depthThreshold;

        for (var r = 1; r <= filterSize; r = r + 1) {
            let gaussianWeight = exp(-f32(r * r) * sigmaSquareInv);
            var sampledDepthX = abs(textureLoad(depthTexture, clampDepthCoord(input.iuv - vec2f(f32(r)) * uniforms.blurDir), 0).r);
            var sampledDepthY = abs(textureLoad(depthTexture, clampDepthCoord(input.iuv + vec2f(f32(r)) * uniforms.blurDir), 0).r);
            var wx = gaussianWeight;
            var wy = gaussianWeight;

            if (sampledDepthX < depthThresholdLowX) {
                wx = 0.0;
            } else if (sampledDepthX > depthThresholdHighX) {
                sampledDepthX = higherDepthBound;
            } else {
                depthThresholdLowX = min(depthThresholdLowX, sampledDepthX - depthThreshold);
                depthThresholdHighX = max(depthThresholdHighX, sampledDepthX + depthThreshold);
            }

            if (sampledDepthY < depthThresholdLowY) {
                wy = 0.0;
            } else if (sampledDepthY > depthThresholdHighY) {
                sampledDepthY = higherDepthBound;
            } else {
                depthThresholdLowY = min(depthThresholdLowY, sampledDepthY - depthThreshold);
                depthThresholdHighY = max(depthThresholdHighY, sampledDepthY + depthThreshold);
            }

            sum = sum + sampledDepthX * wx + sampledDepthY * wy;
            wsum = wsum + wx + wy;
        }
    } else {
        let filterSize2D = 2;
        var depthThresholdLow = depth - depthThreshold;
        var depthThresholdHigh = depth + depthThreshold;

        for (var r = 1; r <= filterSize2D; r = r + 1) {
            for (var i = 0; i < 2 * r; i = i + 1) {
                let gaussianWeight = exp((-f32(r * r) + f32((r - i) * (r - i))) * sigmaSquareInv);
                var depths = vec4f(
                    abs(textureLoad(depthTexture, clampDepthCoord(input.iuv - vec2f(f32(r), f32(r - i))), 0).r),
                    abs(textureLoad(depthTexture, clampDepthCoord(input.iuv + vec2f(f32(r), f32(r - i))), 0).r),
                    abs(textureLoad(depthTexture, clampDepthCoord(input.iuv - vec2f(f32(r - i), f32(r))), 0).r),
                    abs(textureLoad(depthTexture, clampDepthCoord(input.iuv + vec2f(f32(r - i), f32(r))), 0).r)
                );
                var weights = vec4f(gaussianWeight);

                for (var sampleIndex = 0; sampleIndex < 4; sampleIndex = sampleIndex + 1) {
                    if (depths[sampleIndex] < depthThresholdLow) {
                        weights[sampleIndex] = 0.0;
                    } else if (depths[sampleIndex] > depthThresholdHigh) {
                        depths[sampleIndex] = higherDepthBound;
                    } else {
                        depthThresholdLow = min(depthThresholdLow, depths[sampleIndex] - depthThreshold);
                        depthThresholdHigh = max(depthThresholdHigh, depths[sampleIndex] + depthThreshold);
                    }
                }

                sum = sum + dot(depths, weights);
                wsum = wsum + dot(weights, vec4f(1.0));
            }
        }
    }

    return vec4f(sum / wsum, 0.0, 0.0, 1.0);
}
