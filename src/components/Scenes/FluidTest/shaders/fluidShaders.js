export const simVertexShader = `
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 uTexel;

void main() {
  vUv = uv;
  vL = vUv - vec2(uTexel.x, 0.0);
  vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y);
  vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const fullscreenVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const displayVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const advectionFragmentShader = `
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDissipation;
uniform bool uManualFiltering;

vec4 bilerp(sampler2D sam, vec2 coord) {
  vec2 st = coord / uTexel - 0.5;
  vec2 iuv = floor(st);
  vec2 fuv = fract(st);

  vec2 aUv = (iuv + vec2(0.5, 0.5)) * uTexel;
  vec2 bUv = (iuv + vec2(1.5, 0.5)) * uTexel;
  vec2 cUv = (iuv + vec2(0.5, 1.5)) * uTexel;
  vec2 dUv = (iuv + vec2(1.5, 1.5)) * uTexel;

  vec4 a = texture2D(sam, aUv);
  vec4 b = texture2D(sam, bUv);
  vec4 c = texture2D(sam, cUv);
  vec4 d = texture2D(sam, dUv);

  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main() {
  vec2 coord;
  vec4 result;

  if (uManualFiltering) {
    coord = vUv - uDt * bilerp(uVelocity, vUv).xy * uTexel;
    result = bilerp(uSource, coord);
  } else {
    coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexel;
    result = texture2D(uSource, coord);
  }

  float decay = 1.0 + uDissipation * uDt;
  gl_FragColor = result / decay;
}
`;

export const divergenceFragmentShader = `
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;

void main() {
  vec2 C = texture2D(uVelocity, vUv).xy;

  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float B = texture2D(uVelocity, vB).y;
  float T = texture2D(uVelocity, vT).y;

  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vB.y < 0.0) B = -C.y;
  if (vT.y > 1.0) T = -C.y;

  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
`;

export const clearFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uValue;

void main() {
  gl_FragColor = uValue * texture2D(uTexture, vUv);
}
`;

export const pressureFragmentShader = `
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;

void main() {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float B = texture2D(uPressure, vB).x;
  float T = texture2D(uPressure, vT).x;
  float div = texture2D(uDivergence, vUv).x;

  float p = (L + R + B + T - div) * 0.25;
  gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
}
`;

export const gradientSubtractFragmentShader = `
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;

void main() {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float B = texture2D(uPressure, vB).x;
  float T = texture2D(uPressure, vT).x;

  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity -= vec2(R - L, T - B);

  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

export const curlFragmentShader = `
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;

void main() {
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float B = texture2D(uVelocity, vB).x;
  float T = texture2D(uVelocity, vT).x;
  float vorticity = R - L - T + B;
  gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
`;

export const vorticityFragmentShader = `
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurlTex;
uniform float uDt;
uniform float uCurl;

void main() {
  float L = texture2D(uCurlTex, vL).x;
  float R = texture2D(uCurlTex, vR).x;
  float B = texture2D(uCurlTex, vB).x;
  float T = texture2D(uCurlTex, vT).x;
  float C = texture2D(uCurlTex, vUv).x;

  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= uCurl * C;
  force.y *= -1.0;

  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity += force * uDt;
  velocity = clamp(velocity, vec2(-1000.0), vec2(1000.0));

  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

export const splatFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTarget;
uniform vec2 uPoint;
uniform vec3 uColor;
uniform float uRadius;
uniform float uAspect;

void main() {
  vec3 base = texture2D(uTarget, vUv).xyz;
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  vec3 splat = exp(-dot(p, p) / max(uRadius, 0.00001)) * uColor;
  gl_FragColor = vec4(base + splat, 1.0);
}
`;

export const bloomPrefilterFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec3 uCurve;
uniform float uThreshold;

void main() {
  vec3 c = texture2D(uTexture, vUv).rgb;
  float br = max(c.r, max(c.g, c.b));
  float rq = clamp(br - uCurve.x, 0.0, uCurve.y);
  rq = uCurve.z * rq * rq;
  c *= max(rq, br - uThreshold) / max(br, 0.0001);
  gl_FragColor = vec4(c, 1.0);
}
`;

export const bloomBlurFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uTexel;

void main() {
  vec4 sum = vec4(0.0);
  sum += texture2D(uTexture, vUv + vec2(uTexel.x, 0.0));
  sum += texture2D(uTexture, vUv - vec2(uTexel.x, 0.0));
  sum += texture2D(uTexture, vUv + vec2(0.0, uTexel.y));
  sum += texture2D(uTexture, vUv - vec2(0.0, uTexel.y));
  gl_FragColor = sum * 0.25;
}
`;

export const bloomFinalFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uTexel;
uniform float uIntensity;

void main() {
  vec4 sum = vec4(0.0);
  sum += texture2D(uTexture, vUv + vec2(uTexel.x, 0.0));
  sum += texture2D(uTexture, vUv - vec2(uTexel.x, 0.0));
  sum += texture2D(uTexture, vUv + vec2(0.0, uTexel.y));
  sum += texture2D(uTexture, vUv - vec2(0.0, uTexel.y));
  gl_FragColor = sum * 0.25 * uIntensity;
}
`;

export const bloomComposeFragmentShader = `
varying vec2 vUv;
uniform sampler2D uBase;
uniform sampler2D uAdd;
uniform float uAddFactor;

void main() {
  vec3 base = texture2D(uBase, vUv).rgb;
  vec3 add = texture2D(uAdd, vUv).rgb;
  gl_FragColor = vec4(base + add * uAddFactor, 1.0);
}
`;

export const sunraysMaskFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;

void main() {
  vec4 c = texture2D(uTexture, vUv);
  float br = max(c.r, max(c.g, c.b));
  c.a = 1.0 - min(max(br * 20.0, 0.0), 0.8);
  gl_FragColor = c;
}
`;

export const sunraysFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uWeight;

#define ITERATIONS 16

void main() {
  float Density = 0.3;
  float Decay = 0.95;
  float Exposure = 0.7;

  vec2 coord = vUv;
  vec2 dir = (vUv - 0.5) * (1.0 / float(ITERATIONS) * Density);

  float illuminationDecay = 1.0;
  float color = texture2D(uTexture, vUv).a;

  for (int i = 0; i < ITERATIONS; i++) {
    coord -= dir;
    float col = texture2D(uTexture, coord).a;
    color += col * illuminationDecay * uWeight;
    illuminationDecay *= Decay;
  }

  gl_FragColor = vec4(color * Exposure, 0.0, 0.0, 1.0);
}
`;

export const blurFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uTexel;

void main() {
  float offset = 1.3333333;
  vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
  sum += texture2D(uTexture, vUv - uTexel * offset) * 0.35294117;
  sum += texture2D(uTexture, vUv + uTexel * offset) * 0.35294117;
  gl_FragColor = sum;
}
`;

export const displayFragmentShader = `
varying vec2 vUv;
uniform sampler2D uDye;
uniform sampler2D uBloom;
uniform sampler2D uSunrays;
uniform sampler2D uDithering;
uniform vec2 uDyeTexel;
uniform vec2 uDitherScale;
uniform bool uDitheringEnabled;
uniform float uDitherStrength;
uniform vec3 uBgA;
uniform vec3 uBgB;
uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;
uniform bool uShading;
uniform bool uBloomEnabled;
uniform bool uSunraysEnabled;
uniform bool uDebugCursor;
uniform bool uDebugAutoSplat;
uniform bool uDebugStationarySplat;
uniform bool uDebugRandomBurst;
uniform float uBlendMode;
uniform vec2 uDebugAuto;
uniform float uViewportAspect;
uniform float uDebugPointerWidth;
uniform float uDebugPointerHeight;
uniform float uDebugAutoWidth;
uniform float uDebugAutoHeight;
uniform float uDebugPointerRotation;
uniform float uDebugAutoRotation;
uniform float uDebugStationaryWidth;
uniform float uDebugStationaryHeight;
uniform float uDebugStationaryRotation;
uniform float uDebugRandomWidth;
uniform float uDebugRandomHeight;
uniform float uDebugRandomRotation;
uniform float uDebugPointerLineWeight;
uniform float uDebugAutoLineWeight;
uniform float uDebugStationaryLineWeight;
uniform float uDebugRandomLineWeight;
uniform bool uDebugPointerFill;
uniform bool uDebugAutoFill;
uniform bool uDebugStationaryFill;
uniform bool uDebugRandomFill;
uniform float uDebugAutoActive;
uniform vec3 uDebugPointerColor;
uniform vec3 uDebugAutoColor;
uniform vec3 uDebugStationaryColor;
uniform vec3 uDebugRandomColor;
#define DEBUG_POINTER_CAP 8
uniform float uDebugPointerCount;
uniform vec2 uDebugPointers[DEBUG_POINTER_CAP];
uniform float uDebugPointerLife[DEBUG_POINTER_CAP];
#define DEBUG_CONTACT_CAP 12
#if DEBUG_CONTACT_CAP > 0
uniform float uDebugAutoCount;
uniform vec2 uDebugAutos[DEBUG_CONTACT_CAP];
uniform float uDebugAutoLife[DEBUG_CONTACT_CAP];
#endif
uniform vec2 uDebugContacts[DEBUG_CONTACT_CAP];
uniform float uDebugContactLife[DEBUG_CONTACT_CAP];
uniform float uDebugContactKind[DEBUG_CONTACT_CAP];
uniform float uDebugContactFadeDuration;

vec3 linearToGamma(vec3 color) {
  color = max(color, vec3(0.0));
  return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0.0));
}

vec3 saturateColor(vec3 col, float amount) {
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(l), col, amount);
}

vec2 rotate2D(vec2 point, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(c * point.x - s * point.y, s * point.x + c * point.y);
}

vec2 toMarkerSpace(vec2 point) {
  return vec2(point.x * uViewportAspect, point.y);
}

float squareOutline(
  vec2 uv,
  vec2 center,
  vec2 halfSize,
  float thickness,
  float rotation
) {
  vec2 p = abs(rotate2D(toMarkerSpace(uv - center), -rotation));
  float outer = step(p.x, halfSize.x) * step(p.y, halfSize.y);
  float innerSizeX = max(halfSize.x - thickness, 0.0);
  float innerSizeY = max(halfSize.y - thickness, 0.0);
  float inner = step(p.x, innerSizeX) * step(p.y, innerSizeY);
  return clamp(outer - inner, 0.0, 1.0);
}

float squareFill(vec2 uv, vec2 center, vec2 halfSize, float rotation) {
  vec2 p = abs(rotate2D(toMarkerSpace(uv - center), -rotation));
  return step(p.x, halfSize.x) * step(p.y, halfSize.y);
}

float squareMarker(
  vec2 uv,
  vec2 center,
  vec2 halfSize,
  float thickness,
  float rotation,
  bool fill
) {
  if (fill) {
    return squareFill(uv, center, halfSize, rotation);
  }
  return squareOutline(uv, center, halfSize, thickness, rotation);
}

void main() {
  vec3 c = texture2D(uDye, vUv).rgb;

  if (uShading) {
    vec3 lc = texture2D(uDye, vUv - vec2(uDyeTexel.x, 0.0)).rgb;
    vec3 rc = texture2D(uDye, vUv + vec2(uDyeTexel.x, 0.0)).rgb;
    vec3 tc = texture2D(uDye, vUv + vec2(0.0, uDyeTexel.y)).rgb;
    vec3 bc = texture2D(uDye, vUv - vec2(0.0, uDyeTexel.y)).rgb;

    float dx = length(rc) - length(lc);
    float dy = length(tc) - length(bc);

    vec3 n = normalize(vec3(dx, dy, length(uDyeTexel)));
    vec3 l = vec3(0.0, 0.0, 1.0);
    float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
    c *= diffuse;
  }

  if (uSunraysEnabled) {
    float rays = texture2D(uSunrays, vUv).r;
    c *= rays;
  }

  if (uBloomEnabled) {
    vec3 bloom = texture2D(uBloom, vUv).rgb;
    float noise = texture2D(uDithering, vUv * uDitherScale).r * 2.0 - 1.0;
    bloom += noise * uDitherStrength / 255.0 * (uDitheringEnabled ? 1.0 : 0.0);
    bloom = linearToGamma(bloom);

    if (uSunraysEnabled) {
      bloom *= texture2D(uSunrays, vUv).r;
    }

    c += bloom;
  }

  vec3 bg = mix(uBgA, uBgB, smoothstep(0.0, 1.0, vUv.y));
  vec3 color;
  
  if (uBlendMode > 1.5) {
    color = max(bg - c, vec3(0.0));
  } else if (uBlendMode > 0.5) {
    vec3 ink = vec3(1.0) - c;
    color = bg * ink;
  } else {
    color = bg + c;
  }

  color = saturateColor(color, uSaturation);
  color = (color - 0.5) * uContrast + 0.5;
  color *= uBrightness;

  vec2 pointerSize = vec2(
    max(uDebugPointerWidth, 0.0),
    max(uDebugPointerHeight, 0.0)
  );
  vec2 autoSize = vec2(max(uDebugAutoWidth, 0.0), max(uDebugAutoHeight, 0.0));
  vec2 stationarySize = vec2(
    max(uDebugStationaryWidth, 0.0),
    max(uDebugStationaryHeight, 0.0)
  );
  vec2 randomSize = vec2(
    max(uDebugRandomWidth, 0.0),
    max(uDebugRandomHeight, 0.0)
  );
  vec2 ptrHalf = pointerSize * 0.5;
  vec2 autoHalfVec = autoSize * 0.5;
  vec2 stationaryHalfMix = stationarySize * 0.5;
  vec2 randomHalfMix = randomSize * 0.5;
  vec2 autoCenter = uDebugAuto;
  float pointerMinSize = max(min(pointerSize.x, pointerSize.y), 0.0001);
  float autoMinSize = max(min(autoSize.x, autoSize.y), 0.0001);
  float stationaryMinSize = max(min(stationarySize.x, stationarySize.y), 0.0001);
  float randomMinSize = max(min(randomSize.x, randomSize.y), 0.0001);
  float pointerThickness = max(
    0.00035,
    pointerMinSize * 0.04 * uDebugPointerLineWeight
  );
  float autoThickness = max(
    0.00035,
    autoMinSize * 0.04 * uDebugAutoLineWeight
  );
  float stationaryThickness = max(
    0.00035,
    stationaryMinSize * 0.04 * uDebugStationaryLineWeight
  );
  float randomThickness = max(
    0.00035,
    randomMinSize * 0.04 * uDebugRandomLineWeight
  );

  if (uDebugAutoSplat) {
    float autoSquare = squareMarker(
      vUv,
      autoCenter,
      autoHalfVec,
      autoThickness,
      uDebugAutoRotation,
      uDebugAutoFill
    ) * uDebugAutoActive;
    color = mix(color, uDebugAutoColor, autoSquare);
  }

  if (uDebugCursor) {
    for (int i = 0; i < DEBUG_POINTER_CAP; i++) {
      if (float(i) >= uDebugPointerCount) continue;
      float pActive = clamp(
        uDebugPointerLife[i] / max(uDebugContactFadeDuration, 0.0001),
        0.0,
        1.0
      );
      float pointerSquare =
        squareMarker(
          vUv,
          uDebugPointers[i],
          ptrHalf,
          pointerThickness,
          uDebugPointerRotation,
          uDebugPointerFill
        ) * pActive;
      color = mix(color, uDebugPointerColor, pointerSquare);
    }
  }

  for (int i = 0; i < DEBUG_CONTACT_CAP; i++) {
    float contactActive = clamp(
      uDebugContactLife[i] / max(uDebugContactFadeDuration, 0.0001),
      0.0,
      1.0
    );
    float kind = clamp(uDebugContactKind[i], 0.0, 2.0);
    vec2 sizeVec = vec2(0.0);
    float thickness = 0.0;
    float rotation = 0.0;
    vec3 markColor = vec3(0.0);
    bool enabled = false;

    if (kind > 1.5) {
      enabled = uDebugStationarySplat;
      sizeVec = stationaryHalfMix;
      thickness = stationaryThickness;
      rotation = uDebugStationaryRotation;
      markColor = uDebugStationaryColor;
    } else {
      enabled = uDebugRandomBurst;
      sizeVec = randomHalfMix;
      thickness = randomThickness;
      rotation = uDebugRandomRotation;
      markColor = uDebugRandomColor;
    }

    if (!enabled) continue;

    float mark =
      squareMarker(
        vUv,
        uDebugContacts[i],
        sizeVec,
        thickness,
        rotation,
        kind > 1.5 ? uDebugStationaryFill : uDebugRandomFill
      ) *
      contactActive;
    color = mix(color, markColor, mark);
  }
  #if DEBUG_CONTACT_CAP > 0
  if (uDebugAutoSplat) {
    for (int i = 0; i < DEBUG_CONTACT_CAP; i++) {
      if (float(i) >= uDebugAutoCount) continue;
      if (i == 0) continue;
      float aActive = clamp(uDebugAutoLife[i] / max(uDebugContactFadeDuration, 0.0001), 0.0, 1.0);
      float aMark =
        squareMarker(
          vUv,
          uDebugAutos[i],
          autoHalfVec,
          autoThickness,
          uDebugAutoRotation,
          uDebugAutoFill
        ) *
        aActive;
      color = mix(color, uDebugAutoColor, aMark);
    }
  }
  #endif

  gl_FragColor = vec4(color, 1.0);
}
`;
