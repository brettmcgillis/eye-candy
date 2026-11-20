import{r as t,b as Q,W as b,h as S,C as z,V as w,P as V,a5 as B,a4 as E,a_ as F,d as N,a as _,j as C,ag as D}from"./index-DQZ6GwWS.js";import{u as k}from"./Gltf-CibS0mrh.js";const j=`
  varying vec3 vViewNormal;

  void main() {
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,W=`
  uniform sampler2D sceneTexture;
  uniform sampler2D sceneDepthTexture;
  uniform sampler2D fullSceneTexture;
  uniform vec3 fallbackColor;
  uniform vec2 resolution;
  uniform float pixelSize;
  uniform float refractionStrength;
  varying vec3 vViewNormal;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;

    // Normal-based refraction offset (simulates glass distortion)
    uv += vViewNormal.xy * refractionStrength;

    // Quantize: pixelSize is block size in pixels.
    // Dividing screen resolution by block size gives block count per axis,
    // naturally preserving aspect ratio (isotropic cells).
    vec2 blockCount = resolution / vec2(pixelSize);
    vec2 uvQuantized = round(uv * blockCount) / blockCount;
    vec2 texel = 1.0 / resolution;
    uvQuantized = clamp(uvQuantized, texel * 0.5, vec2(1.0) - texel * 0.5);

    vec2 uvBaseQuantized = round((gl_FragCoord.xy / resolution) * blockCount) / blockCount;
    uvBaseQuantized = clamp(uvBaseQuantized, texel * 0.5, vec2(1.0) - texel * 0.5);

    vec4 sampleColor = texture2D(sceneTexture, uvQuantized);
    float clippedDepth = texture2D(sceneDepthTexture, uvQuantized).x;

    // Clear depth is 1.0; if depth is at far plane, clipped pass had no geometry.
    if (clippedDepth >= 0.999999) {
      sampleColor = texture2D(fullSceneTexture, uvBaseQuantized);
    }

    // If refracted lookup lands in an empty/transparent texel, fall back to
    // the non-refracted quantized sample to avoid see-through gaps.
    if (sampleColor.a < 0.001) {
      sampleColor = texture2D(sceneTexture, uvBaseQuantized);
    }

    // If clipped captures are empty, fall back to full-scene sample.
    if (sampleColor.a < 0.001) {
      sampleColor = texture2D(fullSceneTexture, uvBaseQuantized);
    }

    // Final guard: if no valid texel exists in either capture, use scene clear color.
    if (sampleColor.a < 0.001) {
      sampleColor = vec4(fallbackColor, 1.0);
    }

    gl_FragColor = vec4(sampleColor.rgb, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;function I({pixelSize:s=8,refraction:u=0,clipOffset:i=0,children:f,...y}){const h=t.useRef(),{gl:e,scene:n,camera:c}=Q(),a=t.useMemo(()=>new b(1,1),[]),l=t.useMemo(()=>new b(1,1),[]),o=t.useMemo(()=>new S,[]),p=t.useMemo(()=>new z,[]),v=t.useMemo(()=>new w,[]),g=t.useMemo(()=>new w,[]),d=t.useMemo(()=>new V,[]),r=t.useMemo(()=>new B({vertexShader:j,fragmentShader:W,uniforms:{sceneTexture:{value:null},sceneDepthTexture:{value:null},fullSceneTexture:{value:null},fallbackColor:{value:new z(1,1,1)},resolution:{value:new S},pixelSize:{value:s},refractionStrength:{value:u}},transparent:!1,depthWrite:!0}),[]);t.useEffect(()=>{a.depthTexture=new E(1,1),a.depthTexture.type=F},[a]),t.useEffect(()=>()=>{a.dispose(),l.dispose(),r.dispose()},[a,l,r]);const x=t.useCallback(()=>{const m=h.current;if(!m)return;e.getDrawingBufferSize(o),(a.width!==o.x||a.height!==o.y)&&(a.setSize(o.x,o.y),l.setSize(o.x,o.y)),r.uniforms.pixelSize.value=s,r.uniforms.refractionStrength.value=u,r.uniforms.resolution.value.copy(o),m.getWorldPosition(v),c.getWorldDirection(g),d.setFromNormalAndCoplanarPoint(g,v),d.constant+=i,m.visible=!1;const M=e.clippingPlanes,R=e.toneMapping;e.toneMapping=N;const T=e.getClearAlpha();e.getClearColor(p),n.background&&n.background.isColor?r.uniforms.fallbackColor.value.copy(n.background):r.uniforms.fallbackColor.value.setRGB(1,1,1);const P=e.getRenderTarget();e.setClearColor(p,T),e.clippingPlanes=[],e.setRenderTarget(l),e.clear(),e.render(n,c),e.setClearColor(0,0),e.clippingPlanes=[d],e.setRenderTarget(a),e.clear(),e.render(n,c),e.setRenderTarget(P),e.toneMapping=R,e.setClearColor(p,T),e.clippingPlanes=M,m.visible=!0,r.uniforms.sceneTexture.value=a.texture,r.uniforms.sceneDepthTexture.value=a.depthTexture,r.uniforms.fullSceneTexture.value=l.texture},[c,g,p,i,d,l,e,r,s,u,a,n,o,v]);return _(x),t.useEffect(()=>(r.userData.captureScene=x,()=>{delete r.userData.captureScene}),[x,r]),C.jsx("mesh",{ref:h,material:r,...y,children:f})}function L({sideA:s=!0,...u}){const{nodes:i,materials:f}=k(D("Record.glb"));return C.jsx("group",{...u,dispose:null,children:C.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:i["REC33#RECTextures"].geometry,material:f.RECTextures,rotation:[s?0:Math.PI,0,0]})})}k.preload(D("Record.glb"));export{I as C,L as R};
