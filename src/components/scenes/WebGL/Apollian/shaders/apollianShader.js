export const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;

  #define PI 3.141592654

  const int MAX_STEPS = 512;
  const int MAX_FOLDS = 12;

  uniform vec2 uResolution;
  uniform float uTime;

  uniform float uDomain;
  uniform int uFolds;
  uniform float uFoldScale;
  uniform float uSliceW;
  uniform vec3 uSliceRot;
  uniform float uTreeScaleBase;
  uniform float uTreeScaleGain;
  uniform float uTreeTwist;
  uniform float uTreePeriodY;
  uniform float uTreePeriodXZ;

  uniform float uZoom;
  uniform vec3 uPivot;

  uniform float uUseCamera;
  uniform vec3 uCamPos;
  uniform vec3 uCamRight;
  uniform vec3 uCamUp;
  uniform vec3 uCamForward;
  uniform float uTanHalfFov;
  uniform float uOrbitPeriod;
  uniform float uLensShift;

  uniform int uMaxSteps;
  uniform float uEpsilon;

  uniform vec3 uBone;
  uniform float uAoStrength;
  uniform float uFogAmount;
  uniform float uPostGamma;
  uniform float uSaturation;
  uniform float uVignette;

  varying vec2 vUv;

  void rot(inout vec2 p, float a) {
    float c = cos(a);
    float s = sin(a);
    p = vec2(c*p.x + s*p.y, -s*p.x + c*p.y);
  }

  float box(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
  }

  float mod1(inout float p, float size) {
    float halfsize = size*0.5;
    float c = floor((p + halfsize)/size);
    p = mod(p + halfsize, size) - halfsize;
    return c;
  }

  vec2 modMirror2(inout vec2 p, vec2 size) {
    vec2 halfsize = size*0.5;
    vec2 c = floor((p + halfsize)/size);
    p = mod(p + halfsize, size) - halfsize;
    p *= mod(c,vec2(2))*2.0 - vec2(1.0);
    return c;
  }

  float apollian4(vec4 p, float s) {
    float scale = 1.0;

    for(int i=0; i<MAX_FOLDS; ++i) {
      if(i >= uFolds) break;

      p        = -1.0 + 2.0*fract(0.5*p+0.5);

      float r2 = dot(p,p);

      float k  = s/r2;
      p       *= k;
      scale   *= k;
    }

    vec4 ap = abs(p) / scale;
    float d = length(ap.yw);
    d = min(d, length(ap.xz));

    return 0.55*d;
  }

  float apollianTree(vec3 p) {
    float s = uTreeScaleBase + smoothstep(0.15, 1.5, p.y)*uTreeScaleGain;
    float scale = 1.0;

    for(int i=0; i<MAX_FOLDS; ++i) {
      if(i >= uFolds) break;

      mod1(p.y, uTreePeriodY);
      modMirror2(p.xz, vec2(uTreePeriodXZ));
      rot(p.xz, uTreeTwist);

      float r2 = dot(p,p);
      float k = s/r2;
      p *= k;
      scale *= k;
    }

    float d = box(p - 0.1, 1.0*vec3(1.0, 2.0, 1.0)) - 0.5;
    d = abs(d) - 0.01;
    return 0.25*d/scale;
  }

  float dfRaw(vec3 p) {
    if(uDomain < 0.5) {
      vec4 p4 = vec4(p, uSliceW);
      rot(p4.xw, uSliceRot.x);
      rot(p4.yw, uSliceRot.y);
      rot(p4.zw, uSliceRot.z);
      float d1 = apollian4(p4, uFoldScale);
      float db = box(p - vec3(0.0, 0.5, 0.0), vec3(1.5)) - 0.5;
      return max(d1, db);
    }

    float d1 = apollianTree(p);
    float db = box(p - vec3(0.0, 0.5, 0.0), vec3(0.75, 1.0, 0.75)) - 0.5;
    float dp = p.y;
    return min(dp, max(d1, db));
  }

  // Zoom rescales the domain about a pivot instead of flying the camera in:
  // the marcher keeps working at its original scale, so float precision stays
  // where the camera is looking however deep the zoom goes.
  float df(vec3 p) {
    return uZoom * dfRaw(uPivot + p/uZoom);
  }

  float intersect(vec3 ro, vec3 rd, out int iter) {
    float res = 0.0;
    float t = 0.2;
    iter = uMaxSteps;

    for(int i = 0; i < MAX_STEPS; ++i) {
      if(i >= uMaxSteps) break;

      vec3 p = ro + rd * t;
      res = df(p);
      if(res < uEpsilon * t || res > 20.) {
        iter = i;
        break;
      }
      t += res;
    }

    if(res > 20.) t = -1.;
    return t;
  }

  float ambientOcclusion(vec3 p, vec3 n) {
    float stepSize = 0.012;
    float t = stepSize;

    float oc = 0.0;

    for(int i = 0; i < 12; i++) {
      float d = df(p + n * t);
      oc += t - d;
      t += stepSize;
    }

    return clamp(oc * uAoStrength, 0.0, 1.0);
  }

  vec3 normal(in vec3 pos) {
    vec3  eps = vec3(.001,0.0,0.0);
    vec3 nor;
    nor.x = df(pos+eps.xyy) - df(pos-eps.xyy);
    nor.y = df(pos+eps.yxy) - df(pos-eps.yxy);
    nor.z = df(pos+eps.yyx) - df(pos-eps.yyx);
    return normalize(nor);
  }

  vec3 lighting(vec3 p, vec3 rd, int iter) {
    vec3 n = normal(p);
    float fake = float(iter)/float(uMaxSteps);
    float fakeAmb = exp(-fake*fake*9.0);
    float amb = ambientOcclusion(p, n);

    vec3 col = vec3(mix(1.0, 0.125, pow(amb, 3.0)))*vec3(fakeAmb)*uBone;
    return col;
  }

  vec3 post(vec3 col, vec2 q) {
    col=pow(clamp(col,0.0,1.0),vec3(uPostGamma));
    col=col*0.6+0.4*col*col*(3.0-2.0*col);
    col=mix(col, vec3(dot(col, vec3(0.33))), uSaturation);
    float vig = 0.5+0.5*pow(19.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),0.7);
    col*=mix(1.0, vig, uVignette);
    return col;
  }

  void main() {
    vec2 q = vUv;
    float aspect = uResolution.x/uResolution.y;

    vec3 ro;
    vec3 rd;
    vec2 uv;

    if(uUseCamera < 0.5) {
      uv = -1.0 + 2.0*q;
      uv.y += uLensShift;
      uv.x *= aspect;

      vec3 la = uDomain < 0.5 ? vec3(0.0, 0.0, 0.0) : vec3(0.0, 0.5, 0.0);
      ro = vec3(-4.0, 1., -0.0);
      rot(ro.xz, 2.0*PI*uTime/uOrbitPeriod);
      vec3 cf = normalize(la-ro);
      vec3 cs = normalize(cross(cf,vec3(0.0,1.0,0.0)));
      vec3 cu = normalize(cross(cs,cf));
      rd = normalize(uv.x*cs + uv.y*cu + 3.0*cf);
    } else {
      uv = -1.0 + 2.0*q;
      uv.x *= aspect;

      ro = uCamPos;
      rd = normalize(
        uv.x*uTanHalfFov*uCamRight + uv.y*uTanHalfFov*uCamUp + uCamForward
      );
    }

    vec3 bg = mix(uBone*0.5, uBone, smoothstep(-1.0, 1.0, uv.y));
    vec3 col = bg;

    vec3 p = ro;

    int iter = 0;

    float t = intersect(ro, rd, iter);

    if(t > -0.5) {
      p = ro + t * rd;
      col = lighting(p, rd, iter);
      col = mix(col, bg, 1.0-exp(-uFogAmount*t*t));
    }

    col = post(col, q);
    gl_FragColor = vec4(col.x, col.y, col.z, 1.0);
  }
`;
