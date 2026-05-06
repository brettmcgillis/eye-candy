import{r as t,a as P,W as T,I as b,C as z,V as S,P as Q,w as V,a8 as B,ao as F,b as E,j as v,f as N,K as w}from"./index-B4YcrCIe.js";import{u as k}from"./Gltf-CAc3-dR_.js";const j=`
  varying vec3 vViewNormal;

  void main() {
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,_=`
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
`;function A({pixelSize:s=8,refraction:i=0,clipOffset:c=0,children:p,...y}){const g=t.useRef(),{gl:e,scene:l,camera:m}=P(),r=t.useMemo(()=>new T(1,1),[]),n=t.useMemo(()=>new T(1,1),[]),a=t.useMemo(()=>new b,[]),d=t.useMemo(()=>new z,[]),x=t.useMemo(()=>new S,[]),C=t.useMemo(()=>new S,[]),f=t.useMemo(()=>new Q,[]),o=t.useMemo(()=>new V({vertexShader:j,fragmentShader:_,uniforms:{sceneTexture:{value:null},sceneDepthTexture:{value:null},fullSceneTexture:{value:null},fallbackColor:{value:new z(1,1,1)},resolution:{value:new b},pixelSize:{value:s},refractionStrength:{value:i}},transparent:!1,depthWrite:!0}),[]);return t.useEffect(()=>{r.depthTexture=new B(1,1),r.depthTexture.type=F},[r]),t.useEffect(()=>()=>{r.dispose(),n.dispose(),o.dispose()},[r,n,o]),E(()=>{const u=g.current;if(!u)return;e.getDrawingBufferSize(a),(r.width!==a.x||r.height!==a.y)&&(r.setSize(a.x,a.y),n.setSize(a.x,a.y)),o.uniforms.pixelSize.value=s,o.uniforms.refractionStrength.value=i,o.uniforms.resolution.value.copy(a),u.getWorldPosition(x),m.getWorldDirection(C),f.setFromNormalAndCoplanarPoint(C,x),f.constant+=c,u.visible=!1;const D=e.clippingPlanes,M=e.toneMapping;e.toneMapping=N;const h=e.getClearAlpha();e.getClearColor(d),l.background&&l.background.isColor?o.uniforms.fallbackColor.value.copy(l.background):o.uniforms.fallbackColor.value.setRGB(1,1,1);const R=e.getRenderTarget();e.setClearColor(d,h),e.clippingPlanes=[],e.setRenderTarget(n),e.clear(),e.render(l,m),e.setClearColor(0,0),e.clippingPlanes=[f],e.setRenderTarget(r),e.clear(),e.render(l,m),e.setRenderTarget(R),e.toneMapping=M,e.setClearColor(d,h),e.clippingPlanes=D,u.visible=!0,o.uniforms.sceneTexture.value=r.texture,o.uniforms.sceneDepthTexture.value=r.depthTexture,o.uniforms.fullSceneTexture.value=n.texture}),v.jsx("mesh",{ref:g,material:o,...y,children:p})}function G({sideA:s=!0,...i}){const{nodes:c,materials:p}=k(w("Record.glb"));return v.jsx("group",{...i,dispose:null,children:v.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:c["REC33#RECTextures"].geometry,material:p.RECTextures,rotation:[s?0:Math.PI,0,0]})})}k.preload(w("Record.glb"));export{A as C,G as R};
