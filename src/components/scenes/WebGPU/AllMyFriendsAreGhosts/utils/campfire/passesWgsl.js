import COMMON_WGSL from './commonWgsl';
import SCENE_WGSL from './sceneWgsl';

// Buffer A mainImage, changed only to share the ghost's world: scene-camera rays (x-mirrored
// for the original's handedness), the march stops at ghost depth, TAA reprojects via matrices.
export const BUFFER_A_WGSL = /* wgsl */ `
fn campfireBufferA(
  fragUv: vec2f,
  resolution: vec2f,
  time: f32,
  timeDelta: f32,
  fireLife: f32,
  frame: f32,
  pixelCone: f32,
  cameraPos: vec3f,
  cameraWorld: mat4x4<f32>,
  projectionInverse: mat4x4<f32>,
  prevViewProjection: mat4x4<f32>,
  fireOffset: vec3f,
  ghostColor: vec4f,
  ghostDepth: f32,
  history: texture_2d<f32>,
  historySampler: sampler,
  ch1: texture_2d<f32>,
  s1: sampler,
  ch2: texture_2d<f32>,
  s2: sampler,
  ch3: texture_cube<f32>,
  s3: sampler
) -> vec4f {
  let fragCoord = fragUv * resolution;
  let framerateBasedTaaStrength = 1.0 - saturate((timeDelta - 0.066) / 0.033);
  let subPixelJitter = fract(hash22(fragCoord) + (frame % 256.0) * kGoldenRatio * vec2f(1.0)) - 0.5 * vec2f(1.0);
  s_time = time * kTimeScale;
  s_timeDelta = timeDelta;
  s_pixelRand = subPixelJitter.x;
  s_pixelCone = pixelCone;
  s_zeroI = i32(min(frame, 0.0));
  s_zeroU = u32(s_zeroI);
  initLogs(fireLife);

  let jitterAmount = framerateBasedTaaStrength;
  let uvJittered = (fragCoord + jitterAmount * subPixelJitter) / resolution;

  let rayOriginWS = toCampfire(cameraPos - fireOffset);
  let rayDirectionWS = toCampfire(viewRay(uvJittered, cameraWorld, projectionInverse));

  var ghostDist = kMaxDist;
  if (ghostDepth < 1.0) {
    ghostDist = min(kMaxDist, depthToDistance(fragUv, ghostDepth, projectionInverse));
  }

  let m = march(rayOriginWS, rayDirectionWS, ghostDist, ch2, s2);
  let marchedDist = m.t;
  let endPointWS = rayOriginWS + rayDirectionWS * marchedDist;
  let hitGhost = !m.hit && ghostDist < kMaxDist;

  let cubemap = textureSampleLevel(ch3, s3, rayDirectionWS, 0.0).rgb;
  var sceneColour = max(0.0, rayDirectionWS.y) * cubemap * kSkyColour;
  if (m.hit) {
    sceneColour = computeSceneColour(endPointWS, rayDirectionWS, marchedDist, m.material, ch1, s1, ch2, s2);
  } else if (hitGhost) {
    sceneColour = ghostColor.rgb;
  }
  sceneColour = sceneColour * m.insTrans.a + m.insTrans.rgb;

  var taaStrength = (1.0 - min(1.0, m.insTrans.r * 100.0)) * framerateBasedTaaStrength;
  if (hitGhost) {
    taaStrength = 0.0;
  }

  let prevClip = prevViewProjection * vec4f(toCampfire(endPointWS) + fireOffset, 1.0);
  let prevNdc = prevClip.xy / prevClip.w;
  var prevFrameUv = vec2f(prevNdc.x * 0.5 + 0.5, 0.5 - prevNdc.y * 0.5);
  prevFrameUv = (prevFrameUv * resolution - jitterAmount * subPixelJitter) / resolution;
  if (prevClip.w <= 0.0 || any(abs(prevFrameUv - vec2f(0.5)) > vec2f(0.5))) {
    taaStrength = 0.0;
  }

  let prevData = textureSampleLevel(history, historySampler, prevFrameUv, 0.0);
  let prevTaaStrength = fract(prevData.a);
  let prevQuantisedMarchedDist = prevData.a;
  taaStrength *= 1.0 - saturate(abs(marchedDist - prevQuantisedMarchedDist) - 1.0);

  var blendToCurrent = mix(1.0, 1.0 / 8.0, taaStrength);
  taaStrength = mix(prevTaaStrength, taaStrength, blendToCurrent);
  blendToCurrent = mix(1.0, 1.0 / 8.0, taaStrength);

  sceneColour = max(vec3f(0.0), mix(prevData.rgb, sceneColour, blendToCurrent));
  sceneColour = min(vec3f(6.0), sceneColour);
  return vec4f(sceneColour, floor(marchedDist) + 0.999 * taaStrength);
}

fn toCampfire(v: vec3f) -> vec3f {
  return vec3f(-v.x, v.y, v.z);
}

fn viewRay(uv: vec2f, cameraWorld: mat4x4<f32>, projectionInverse: mat4x4<f32>) -> vec3f {
  let ndc = vec2f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
  let v = projectionInverse * vec4f(ndc, 1.0, 1.0);
  let dirView = normalize(v.xyz / v.w);
  return normalize((cameraWorld * vec4f(dirView, 0.0)).xyz);
}

fn depthToDistance(uv: vec2f, depth: f32, projectionInverse: mat4x4<f32>) -> f32 {
  let ndc = vec2f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
  let v = projectionInverse * vec4f(ndc, depth, 1.0);
  return length(v.xyz / v.w);
}
${SCENE_WGSL}
${COMMON_WGSL}
`;

// Returned in linear so the renderer's sRGB encode lands exactly on the original's pow(1/2.2).
export const IMAGE_WGSL = /* wgsl */ `
fn campfireImage(
  fragUv: vec2f,
  outputResolution: vec2f,
  bufferResolution: vec2f,
  frame: f32,
  bufferA: texture_2d<f32>,
  bufferSampler: sampler
) -> vec4f {
  let uv = fragUv;
  let colour = textureSampleLevel(bufferA, bufferSampler, uv, 0.0);
  let fragCoord = fragUv * outputResolution;
  let subPixelJitter = fract(hash22(fragCoord) + (frame % 256.0) * kGoldenRatio * vec2f(1.0)) - 0.5 * vec2f(1.0);

  var totalWeight = 0.0;
  var bloom = vec3f(0.0);
  let range = 1.0;
  for (var xo = -range; xo < range + 0.1; xo += 0.5) {
    for (var yo = -range; yo < range + 0.1; yo += 0.5) {
      var vo = vec2f(xo, yo);
      let weight = (range * range * 2.0) - dot(vo, vo);
      vo += 0.5 * subPixelJitter;
      let off = vo * (0.5 / range) / bufferResolution;
      if (weight > 0.0) {
        bloom += 0.4 * weight * textureSampleLevel(bufferA, bufferSampler, uv + off * exp2(4.0), 4.0).rgb;
        bloom += 0.4 * weight * textureSampleLevel(bufferA, bufferSampler, uv + off * exp2(5.0), 5.0).rgb;
        bloom += 0.4 * weight * textureSampleLevel(bufferA, bufferSampler, uv + off * exp2(6.0), 6.0).rgb;
      }
      totalWeight += weight;
    }
  }
  bloom /= totalWeight;

  var c = colour.rgb + 0.025 * pow(bloom, vec3f(2.0));
  c *= linearstep(0.8, 0.3, length(uv - vec2f(0.5)));
  c = tonemap(c);
  c = pow(c, vec3f(1.0 / 2.2));
  c += vec3f((hash12(fragCoord) - 0.5) / 255.0);
  return vec4f(srgbToLinear(c), 1.0);
}

fn srgbToLinear(c: vec3f) -> vec3f {
  let low = c / 12.92;
  let high = pow((max(c, vec3f(0.0)) + 0.055) / 1.055, vec3f(2.4));
  return select(high, low, c <= vec3f(0.04045));
}
${COMMON_WGSL}
`;
