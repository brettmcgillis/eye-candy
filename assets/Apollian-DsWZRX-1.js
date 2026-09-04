import{V as v,r as n,d as M,Z as A,a as F,br as y,f as T,j as p,C as z,m as W,az as d,a3 as Z}from"./index-DN0oVO6x.js";import{u as E,g as X,C as G}from"./useSceneCameraControls-BPVno8sp.js";import"./cameraSplinePresets-V8p1Ds6y.js";import"./useOperatorInput-Dx7RrU7n.js";import{u as Y}from"./usePresetsFolder-19LTK0A0.js";import{u as k}from"./useMediaRecorder-eB5-QYn2.js";import"./useCameraSpline-BJvGqjJ1.js";import"./PerspectiveCamera-9XlQ4x0_.js";import"./extends-CF3RwP-h.js";import"./Fbo-DbA1NBBn.js";import"./OrbitControls-By5n0Rf2.js";import"./Line-K669_l4f.js";import"./Line2-C3wn-MDM.js";import"./constants-DvwsRCQh.js";const B=`
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`,D=`
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
`,b=[Math.sqrt(.5),Math.sqrt(.4),Math.sqrt(.3)],q=.1,g=new v;function L({animate:t,manual:r,time:o}){if(!t)return g.set(r[0],r[1],r[2]);const l=q*o;return g.set(l*b[0],l*b[1],l*b[2])}const R=()=>typeof window>"u"?1:Math.min(window.devicePixelRatio,1.5);function U(){return{uResolution:{value:new W(1,1)},uTime:{value:0},uDomain:{value:0},uFolds:{value:7},uFoldScale:{value:1/.75},uSliceW:{value:.125},uSliceRot:{value:new v},uTreeScaleBase:{value:1.3},uTreeScaleGain:{value:.95},uTreeTwist:{value:Math.PI/5.5},uTreePeriodY:{value:2},uTreePeriodXZ:{value:2},uZoom:{value:1},uPivot:{value:new v},uUseCamera:{value:0},uCamPos:{value:new v},uCamRight:{value:new v(1,0,0)},uCamUp:{value:new v(0,1,0)},uCamForward:{value:new v(0,0,-1)},uTanHalfFov:{value:Math.tan(T.degToRad(36.87)/2)},uOrbitPeriod:{value:120},uLensShift:{value:.225},uMaxSteps:{value:130},uEpsilon:{value:3e-4},uBone:{value:new z(.89,.855,.788)},uAoStrength:{value:1},uFogAmount:{value:.001},uPostGamma:{value:.65},uSaturation:{value:-.5},uVignette:{value:1}}}function I({config:t}){const r=n.useRef(t);r.current=t;const o=n.useRef(0),{renderScale:l}=t,c=M(i=>i.setDpr),s=n.useMemo(U,[]),u=n.useMemo(()=>new A({depthTest:!1,depthWrite:!1,fragmentShader:D,uniforms:s,vertexShader:B}),[s]);return n.useEffect(()=>()=>u.dispose(),[u]),n.useEffect(()=>(c(R()*l),()=>c(R())),[l,c]),F((i,m)=>{const e=r.current,a=s;o.current+=m*e.timeScale,a.uTime.value=o.current;const{width:C,height:w}=i.size;a.uResolution.value.set(C,w),a.uDomain.value=e.domain==="tree"?1:0,a.uFolds.value=e.folds,a.uFoldScale.value=e.foldScale,a.uSliceW.value=e.sliceW,a.uSliceRot.value.copy(L({animate:e.sliceAnimate,manual:[e.sliceRotXW,e.sliceRotYW,e.sliceRotZW],time:o.current})),a.uTreeScaleBase.value=e.treeScaleBase,a.uTreeScaleGain.value=e.treeScaleGain,a.uTreeTwist.value=e.treeTwist,a.uTreePeriodY.value=e.treePeriodY,a.uTreePeriodXZ.value=e.treePeriodXZ,a.uOrbitPeriod.value=e.orbitPeriod,a.uLensShift.value=e.lensShift,a.uMaxSteps.value=e.maxSteps,a.uEpsilon.value=e.epsilon,a.uBone.value.setStyle(e.boneColor,y),a.uAoStrength.value=e.aoStrength,a.uFogAmount.value=e.fogAmount,a.uPostGamma.value=e.postGamma,a.uSaturation.value=e.saturation,a.uVignette.value=e.vignette;const P=e.viewMode==="camera";if(a.uUseCamera.value=P?1:0,!P)return;const{camera:h}=i;a.uZoom.value=e.zoom,a.uPivot.value.set(e.pivotX,e.pivotY,e.pivotZ),a.uCamPos.value.copy(h.position),h.matrixWorld.extractBasis(a.uCamRight.value,a.uCamUp.value,a.uCamForward.value),a.uCamForward.value.negate(),a.uTanHalfFov.value=Math.tan(T.degToRad(h.fov)/2)}),p.jsx("mesh",{frustumCulled:!1,material:u,renderOrder:-1,children:p.jsx("planeGeometry",{args:[2,2]})})}const V=n.memo(I),O={domain:"slice",folds:7,foldScale:1/.75,sliceW:.125,sliceAnimate:!0,sliceRotXW:0,sliceRotYW:0,sliceRotZW:0,treeScaleBase:1.3,treeScaleGain:.95,treeTwist:Math.PI/5.5,treePeriodY:2,treePeriodXZ:2,boneColor:"#e3dac9",aoStrength:1,fogAmount:.001,postGamma:.65,saturation:-.5,vignette:1,lensShift:.225,viewMode:"shader",orbitPeriod:120,zoom:1,pivotX:0,pivotY:0,pivotZ:0,renderScale:1,maxSteps:130,epsilon:3e-4,timeScale:1};function _(t,r={}){const o={...O,...r},l=`${t}.Fractal`,c=`${t}.View`,s=e=>e(`${l}.domain`)==="slice",u=e=>e(`${l}.domain`)==="tree",i=e=>e(`${c}.viewMode`)==="shader",m=e=>e(`${c}.viewMode`)==="camera";return{Fractal:d({domain:{value:o.domain,label:"Fractal",options:{"4D Slice":"slice","Gnarly Tree":"tree"}},folds:{value:o.folds,label:"Folds",min:1,max:12,step:1},foldScale:{value:o.foldScale,label:"Fold Scale",min:.5,max:2.5,step:.001,render:e=>s(e)},sliceW:{value:o.sliceW,label:"Slice W",min:-2,max:2,step:.001,render:e=>s(e)},sliceAnimate:{value:o.sliceAnimate,label:"Animate Slice",render:e=>s(e)},sliceRotXW:{value:o.sliceRotXW,label:"Rot XW",min:-Math.PI,max:Math.PI,step:.001,render:e=>s(e)&&!e(`${l}.sliceAnimate`)},sliceRotYW:{value:o.sliceRotYW,label:"Rot YW",min:-Math.PI,max:Math.PI,step:.001,render:e=>s(e)&&!e(`${l}.sliceAnimate`)},sliceRotZW:{value:o.sliceRotZW,label:"Rot ZW",min:-Math.PI,max:Math.PI,step:.001,render:e=>s(e)&&!e(`${l}.sliceAnimate`)},treeScaleBase:{value:o.treeScaleBase,label:"Branch Scale",min:.5,max:2.5,step:.001,render:e=>u(e)},treeScaleGain:{value:o.treeScaleGain,label:"Scale Gain",min:-1,max:2,step:.001,render:e=>u(e)},treeTwist:{value:o.treeTwist,label:"Twist",min:-Math.PI,max:Math.PI,step:.001,render:e=>u(e)},treePeriodY:{value:o.treePeriodY,label:"Period Y",min:.5,max:6,step:.01,render:e=>u(e)},treePeriodXZ:{value:o.treePeriodXZ,label:"Period XZ",min:.5,max:6,step:.01,render:e=>u(e)}},{collapsed:!0}),View:d({viewMode:{value:o.viewMode,label:"View",options:{"Shader Camera":"shader","Scene Camera":"camera"}},orbitPeriod:{value:o.orbitPeriod,label:"Orbit Period",min:5,max:600,step:1,render:e=>i(e)},zoom:{value:o.zoom,label:"Zoom",min:.05,max:5e3,step:.01,render:e=>m(e)},pivotX:{value:o.pivotX,label:"Pivot X",min:-3,max:3,step:1e-4,render:e=>m(e)},pivotY:{value:o.pivotY,label:"Pivot Y",min:-3,max:3,step:1e-4,render:e=>m(e)},pivotZ:{value:o.pivotZ,label:"Pivot Z",min:-3,max:3,step:1e-4,render:e=>m(e)},timeScale:{value:o.timeScale,label:"Time Scale",min:0,max:4,step:.01}},{collapsed:!0}),Look:d({boneColor:{value:o.boneColor,label:"Bone"},aoStrength:{value:o.aoStrength,label:"AO",min:0,max:4,step:.01},fogAmount:{value:o.fogAmount,label:"Fog",min:0,max:.02,step:1e-4},postGamma:{value:o.postGamma,label:"Gamma",min:.2,max:2,step:.01},saturation:{value:o.saturation,label:"Saturation",min:-2,max:1,step:.01},vignette:{value:o.vignette,label:"Vignette",min:0,max:1,step:.01},lensShift:{value:o.lensShift,label:"Lens Shift",min:-1,max:1,step:.001,render:e=>i(e)}},{collapsed:!0}),Render:d({renderScale:{value:o.renderScale,label:"Render Scale",min:.25,max:1,step:.05},maxSteps:{value:o.maxSteps,label:"Max Steps",min:16,max:512,step:1},epsilon:{value:o.epsilon,label:"Surface Epsilon",min:5e-5,max:.005,step:1e-5}},{collapsed:!0})}}const $="4D Slice",S={cameraMode:"orbit",folds:7,aoStrength:1,fogAmount:.001,postGamma:.65,saturation:-.5,vignette:1,lensShift:.225,boneColor:"#e3dac9",viewMode:"shader",orbitPeriod:120,zoom:1,pivotX:0,pivotY:0,pivotZ:0,timeScale:1,renderScale:1,maxSteps:130,epsilon:3e-4,treeScaleBase:1.3,treeScaleGain:.95,treeTwist:Math.PI/5.5,treePeriodY:2,treePeriodXZ:2,foldScale:1/.75,sliceW:.125,sliceAnimate:!0,sliceRotXW:0,sliceRotYW:0,sliceRotZW:0},j={"4D Slice":{...S,domain:"slice"},"Gnarly Tree":{...S,domain:"tree"},Explore:{...S,domain:"slice",viewMode:"camera",sliceAnimate:!1,sliceRotXW:.62,sliceRotYW:-1.1,sliceRotZW:.35},"Frozen Slice":{...S,domain:"slice",sliceAnimate:!1,sliceRotXW:.62,sliceRotYW:-1.1,sliceRotZW:.35,sliceW:.42,orbitPeriod:40}};function H({presetSnapshot:t}){return{...t}}const f=[0,0,0],K={defaultMode:"orbit",orbit:{desktop:{position:[-4,1,.001],target:f,pivot:f,fov:37},mobile:{position:[-5,1.25,.001],target:f,pivot:f,fov:45}},fixed:{behavior:"single",activeShot:"hero",shots:{hero:{desktop:{position:[-4,1,.001],target:f,fov:37}}}}},x="Apollian",N=`${x}.Camera`;function J(){const{attachSetControls:t,controlsSnapshotRef:r,presetsFolder:o}=Y({defaultPreset:$,getPresetControls:H,presets:j}),l=n.useRef(null),{buildCamera:c,cameraControls:s}=E({apiRef:l,camera:K,cameraFolderPath:N,controlsSnapshotRef:r}),u=n.useMemo(()=>_(x,r.current),[r]),[i,m]=Z(x,()=>({Presets:o,Camera:d(s,{collapsed:!0}),...u}));t(m),r.current={...i},k({fileName:x});const e=n.useMemo(()=>X(i),[i]),a=n.useMemo(()=>c(i),[c,e]);return n.useMemo(()=>({...i,cameraApiRef:l,camera:a}),[a,i])}function pe(){const t=J();return p.jsxs(p.Fragment,{children:[p.jsx(G,{camera:t.camera}),p.jsx(V,{config:t})]})}export{pe as default};
