import{r as A,p as P,w as $,t as I,o as V,j as x,m as Q}from"./index-DyiJa5hr.js";import{b as U,d as G,a as X}from"./Line2-Bo0T6v1V.js";import{b as J,a as k,s as K,c as j}from"./waterUtils-BCo-ERgj.js";Q({Line2:X});const Z=`
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uWaveChoppiness;
  uniform float uWaveSpeed;
  uniform float uColumnTop;
  uniform float uColumnBottom;

  varying float vNormHeight;

  // Y-only wave displacement — walls stay vertical, only top undulates
  vec3 nurbsWaveDisplace(vec3 pos) {
    float normY = clamp(
      (pos.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
    );
    // Only vertices near the top move (sides lerp from 0 at bottom to full at top)
    float blend = smoothstep(0.5, 1.0, normY);

    vec2 dirs[4];
    dirs[0] = normalize(vec2( 0.6,  0.8));
    dirs[1] = normalize(vec2(-0.4,  0.9));
    dirs[2] = normalize(vec2( 0.9, -0.3));
    dirs[3] = normalize(vec2(-0.7, -0.6));

    float freqs[4];
    freqs[0] = 1.2; freqs[1] = 2.5; freqs[2] = 3.8; freqs[3] = 5.0;

    float baseAmps[4];
    baseAmps[0] = 1.0; baseAmps[1] = 0.4; baseAmps[2] = 0.2; baseAmps[3] = 0.1;

    float heightDisp = 0.0;
    for (int i = 0; i < 4; i++) {
      float amp = baseAmps[i] * uWaveHeight;
      float phase = uWaveSpeed * freqs[i];
      float theta = dot(dirs[i], pos.xz) * freqs[i] + uTime * phase;
      heightDisp += amp * cos(theta);
    }

    // Only displace in Y — no horizontal shift keeps walls flush
    return vec3(0.0, heightDisp * blend, 0.0);
  }

  vec3 nurbsWaveNormal(vec3 pos) {
    vec2 dirs[4];
    dirs[0] = normalize(vec2( 0.6,  0.8));
    dirs[1] = normalize(vec2(-0.4,  0.9));
    dirs[2] = normalize(vec2( 0.9, -0.3));
    dirs[3] = normalize(vec2(-0.7, -0.6));

    float freqs[4];
    freqs[0] = 1.2; freqs[1] = 2.5; freqs[2] = 3.8; freqs[3] = 5.0;

    float baseAmps[4];
    baseAmps[0] = 1.0; baseAmps[1] = 0.4; baseAmps[2] = 0.2; baseAmps[3] = 0.1;

    vec3 n = vec3(0.0, 1.0, 0.0);
    for (int i = 0; i < 4; i++) {
      float amp = baseAmps[i] * uWaveHeight;
      float Q = uWaveChoppiness / (freqs[i] * amp * 4.0);
      float phase = uWaveSpeed * freqs[i];
      float theta = dot(dirs[i], pos.xz) * freqs[i] + uTime * phase;
      float s = sin(theta);
      float c = cos(theta);
      float WA = freqs[i] * amp;
      n.x -= dirs[i].x * WA * s;
      n.z -= dirs[i].y * WA * s;
      n.y -= Q * WA * c;
    }
    return normalize(n);
  }
`,h=`
  #include <common>
  ${Z}
`,w=`
  // Blend wave normals in for top-facing surfaces only
  float _isTopFacing = step(0.5, normal.y);
  float _normY = clamp(
    (position.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
  );
  float _normalBlend = _isTopFacing * smoothstep(0.8, 1.0, _normY);
  vec3 _waveNorm = nurbsWaveNormal(position);
  vec3 objectNormal = mix(vec3(normal), _waveNorm, _normalBlend);
  #ifdef USE_TANGENT
    vec3 objectTangent = vec3(tangent.xyz);
  #endif
`,ee=`
  vec3 waveD = nurbsWaveDisplace(position);
  vec3 transformed = position + waveD;
  vNormHeight = clamp(
    (transformed.y - uColumnBottom) / (uColumnTop - uColumnBottom), 0.0, 1.0
  );
  #ifdef USE_ALPHAHASH
    vPosition = vec3(position);
  #endif
`,oe=`
  uniform vec3 uTopColor;
  uniform vec3 uBottomColor;
  varying float vNormHeight;
`,te=`
  #include <color_fragment>
  diffuseColor.rgb = mix(uBottomColor, uTopColor, vNormHeight);
`,N=32;function se(e,o,s,l){const C=new G;C.setPositions([-e,l,-o,e,l,-o,e,l,o,-e,l,o,-e,l,-o]);const z=[[-e,-o],[e,-o],[e,o],[-e,o]].map(([r,u])=>{const i=new G;return i.setPositions([r,l,u,r,s,u]),{geo:i,cx:r,cz:u}}),T=[{x0:-e,z0:-o,x1:e,z1:-o},{x0:e,z0:-o,x1:e,z1:o},{x0:e,z0:o,x1:-e,z1:o},{x0:-e,z0:o,x1:-e,z1:-o}].map(r=>{const u=[];for(let c=0;c<=N;c+=1){const p=c/N;u.push(r.x0+(r.x1-r.x0)*p,s,r.z0+(r.z1-r.z0)*p)}const i=new G;return i.setPositions(u),{geo:i,edge:r}});return{bottomGeo:C,vertGeos:z,topGeos:T}}function ie({width:e=3.6,depth:o=3.6,height:s=6,segments:l=24,topColor:C="#9edff0",bottomColor:M="#246f98",opacity:z=.34,transmission:S=.5,roughness:T=.3,ior:r=1.12,thickness:u=.35,waveHeight:i=.15,waveChoppiness:c=.5,waveSpeed:p=.6,edgeColor:L="#1f4455",edgeOpacity:H=.65,edgeLineWidth:O=1,showEdges:_=!0}){const y=A.useRef(0),d=A.useMemo(()=>({uTime:{value:y.current},uWaveHeight:{value:i},uWaveChoppiness:{value:c},uWaveSpeed:{value:p},uColumnTop:{value:s/2},uColumnBottom:{value:-s/2},uTopColor:{value:new P(C)},uBottomColor:{value:new P(M)}}),[C,M,s]),D=A.useMemo(()=>{const t=J({width:e,depth:o,height:s});return k(t,l,s,Math.max(e,o))},[e,o,s,l]),F=A.useMemo(()=>{const t=new $({transparent:!0,opacity:z,transmission:S,roughness:T,metalness:0,ior:r,thickness:u,side:I,depthWrite:!0});return t.onBeforeCompile=n=>{const a=n;Object.entries(d).forEach(([B,b])=>{a.uniforms[B]=b}),a.vertexShader=a.vertexShader.replace("#include <common>",h),a.vertexShader=a.vertexShader.replace("#include <beginnormal_vertex>",w),a.vertexShader=a.vertexShader.replace("#include <begin_vertex>",ee),a.fragmentShader=a.fragmentShader.replace("#include <common>",`#include <common>
${oe}`),a.fragmentShader=a.fragmentShader.replace("#include <color_fragment>",te)},t},[d,z,S,T,r,u]),v=A.useMemo(()=>{if(!_)return null;const t=e/2,n=o/2;return se(t,n,s/2,-s/2)},[_,e,s,o]),f=A.useMemo(()=>new U({transparent:!0,depthTest:!0,depthWrite:!1,toneMapped:!1}),[]);return V((t,n)=>{if(y.current+=n,d.uTime.value=y.current,d.uWaveHeight.value=i,d.uWaveChoppiness.value=c,d.uWaveSpeed.value=p,K(y.current),_&&f&&(f.color.set(L),f.opacity=H,f.linewidth=O,f.resolution.set(t.size.width,t.size.height)),v){const a=s/2,B=-s/2;v.topGeos.forEach(({geo:b,edge:m})=>{const E=[];for(let W=0;W<=N;W+=1){const q=W/N,g=m.x0+(m.x1-m.x0)*q,R=m.z0+(m.z1-m.z0)*q,Y=j(g,R,i,c,p);E.push(g,a+Y,R)}b.setPositions(E)}),v.vertGeos.forEach(({geo:b,cx:m,cz:E})=>{const W=j(m,E,i,c,p);b.setPositions([m,B,E,m,a+W,E])})}}),x.jsxs("group",{children:[D.map((t,n)=>x.jsx("mesh",{geometry:t,material:F},n)),_&&v&&x.jsxs(x.Fragment,{children:[x.jsx("line2",{geometry:v.bottomGeo,material:f}),v.vertGeos.map(({geo:t},n)=>x.jsx("line2",{geometry:t,material:f},`v${n}`)),v.topGeos.map(({geo:t},n)=>x.jsx("line2",{geometry:t,material:f},`t${n}`))]})]})}export{ie as N};
