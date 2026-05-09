import{r as c,ac as g,j as o,ak as C,aj as S,aa as x,ab as j,an as M,aq as h,bE as k,az as P}from"./index-fWJAS7dd.js";import{u as z,S as b}from"./tracks-CpqfhR6o.js";import{s as y}from"./shaderMaterial-CW7u5dyR.js";import{O as U}from"./OrbitControls-CMPugbKV.js";import{H as E}from"./Html-BpH-ZxJh.js";import{G as R}from"./Grid-D60coWtl.js";import"./extends-CF3RwP-h.js";import"./constants-p3HtcmN-.js";const F=y({uTime:0,uColorTop:new x("#ff9bf5"),uColorBottom:new x("#ff2fa4"),uBands:12,uIntensity:2.2},`
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,`
    uniform vec3 uColorTop;
    uniform vec3 uColorBottom;
    uniform float uBands;
    uniform float uIntensity;

    varying vec2 vUv;

    void main() {

      // solid band or hole
      float band = step(0.5, fract(vUv.y * uBands));
      if (band > 0.5) discard;

      // radial glow
      float dist = distance(vUv, vec2(0.5));
      float glow = smoothstep(0.0, 0.35, 1.0 - dist);

      // vertical gradient
      vec3 grad = mix(uColorBottom, uColorTop, vUv.y);
      vec3 color = grad * glow * uIntensity;

      gl_FragColor = vec4(color, 1.0);
    }
  `);j({SunMaterial:F});function m({colorTop:e="#ff9bf5",colorBottom:t="#ff2fa4",bands:l=12,intensity:r=2.2,...i}){const n=c.useRef();return g((d,u)=>{n.current&&(n.current.uTime+=u)}),o.jsxs("mesh",{...i,children:[o.jsx("sphereGeometry",{args:[1.5,64,64]}),o.jsx("sunMaterial",{ref:n,side:C,depthWrite:!0,depthTest:!0,uColorTop:e,uColorBottom:t,uBands:l,uIntensity:r})]})}function T({colorTop:e="#ff9bf5",colorBottom:t="#ff2fa4",innerColorTop:l="#6b2cff",innerColorBottom:r="#14002b",bands:i=12,intensity:n=2.2,radius:d=1.5,...u}){const s=c.useRef(),p=c.useRef();return g((v,a)=>{s.current&&(s.current.uTime+=a),p.current&&(p.current.uTime+=a*.6)}),o.jsxs("group",{...u,children:[o.jsxs("mesh",{children:[o.jsx("sphereGeometry",{args:[d,64,64]}),o.jsx("sunMaterial",{ref:s,side:C,depthWrite:!0,depthTest:!0,uColorTop:e,uColorBottom:t,uBands:i,uIntensity:n})]}),o.jsxs("mesh",{scale:.992,children:[o.jsx("sphereGeometry",{args:[d,64,64]}),o.jsx("sunMaterial",{ref:p,side:S,depthWrite:!0,depthTest:!0,uColorTop:l,uColorBottom:r,uBands:i,uIntensity:n*.75})]})]})}const B={Miami:{bg:"#07000f",grid:"#ff4fd8",wire:"#00f6ff",accent:"#ffe66d",fog:"#2b0051",skyTop:"#ff4fd8",skyBottom:"#00f6ff"},CyberSunset:{bg:"#02010a",grid:"#ff8c42",wire:"#b967ff",accent:"#2de2e6",fog:"#220039",skyTop:"#ff8c42",skyBottom:"#b967ff"},MonoNeon:{bg:"#000000",grid:"#00ff9c",wire:"#00ff9c",accent:"#ffffff",fog:"#00422e",skyTop:"#008b56",skyBottom:"#000000"}};function f({children:e,speed:t=.25,amp:l=.6}){const r=c.useRef();return g(i=>{const n=i.clock.elapsedTime*t;r.current&&(r.current.position.y=Math.sin(n)*l,r.current.rotation.y+=.002,r.current.rotation.x=Math.sin(n*.6)*.04)}),o.jsx("group",{ref:r,children:e})}const D=y({uTop:new x("#2b0f3f"),uBottom:new x("#060010")},`
    varying vec3 vPos;
    void main() {
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,`
    uniform vec3 uTop;
    uniform vec3 uBottom;
    varying vec3 vPos;

    void main() {
      float h = normalize(vPos).y * 0.5 + 0.5;
      vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, h));
      gl_FragColor = vec4(col, 1.0);
    }
  `);j({SkyMaterial:D});function G({top:e,bottom:t}){return o.jsxs("mesh",{scale:200,children:[o.jsx("sphereGeometry",{args:[1,64,64]}),o.jsx("skyMaterial",{side:S,uTop:e,uBottom:t})]})}function I({y:e=-2.401}){return o.jsxs("mesh",{rotation:[-Math.PI/2,0,0],position:[0,e,0],children:[o.jsx("planeGeometry",{args:[500,500]}),o.jsx("meshStandardMaterial",{color:"#000",transparent:!0,opacity:1,depthWrite:!0})]})}const H=y({uColorTop:new x("#ff9bf5"),uColorBottom:new x("#ff2fa4"),uBands:14,uHorizon:.35},`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,`
    uniform vec3 uColorTop;
    uniform vec3 uColorBottom;
    uniform float uBands;
    uniform float uHorizon;
    varying vec2 vUv;

    void main() {

      if (vUv.y < uHorizon) discard;

      float band = step(0.5, fract(vUv.y * uBands));

      float dist = distance(vUv, vec2(0.5));
      float glow = smoothstep(0.0, 0.35, 1.0 - dist);

      vec3 grad = mix(uColorBottom, uColorTop, vUv.y);
      vec3 color = grad * glow * 2.2;

      gl_FragColor = vec4(color, band);
    }
  `);j({HorizonSunMaterial:H});function _({colorTop:e,colorBottom:t,bands:l=14,horizon:r=.35,...i}){return o.jsxs("mesh",{...i,children:[o.jsx("sphereGeometry",{args:[2.4,64,64]}),o.jsx("horizonSunMaterial",{transparent:!0,depthWrite:!1,side:P,uColorTop:e,uColorBottom:t,uBands:l,uHorizon:r})]})}function O({theme:e}){const t=c.useMemo(()=>new k(e.fog,10,70),[e]);return o.jsxs(o.Fragment,{children:[o.jsx("primitive",{attach:"fog",object:t}),o.jsx(G,{top:e.skyTop,bottom:e.skyBottom}),o.jsx("ambientLight",{intensity:.6}),o.jsx("pointLight",{position:[0,6,-10],intensity:3,color:e.accent}),o.jsx(_,{position:[0,2.4,-155],scale:17,colorTop:e.accent,colorBottom:e.grid,bands:18,horizon:.38}),o.jsx(I,{y:-2.42}),o.jsx(R,{position:[0,-2.4,0],args:[140,140],cellSize:1,sectionSize:6,infiniteGrid:!0,fadeDistance:70,fadeStrength:1,cellColor:e.grid,sectionColor:e.grid}),o.jsx(f,{children:o.jsx(m,{position:[5,9,-12],colorTop:"#ededed",colorBottom:"#343434",bands:20})}),o.jsx(f,{children:o.jsx(m,{position:[-1,-3,2],colorTop:"#38daf6",colorBottom:"#7e007e",bands:7})}),o.jsx(f,{children:o.jsx(m,{scale:2.2,position:[-7,.5,-10],colorTop:"#b500b5",colorBottom:"#00ff59",bands:16})}),o.jsx(f,{children:o.jsx(T,{scale:2.2,position:[7,-.5,10],colorTop:"#b500b5",colorBottom:"#00ff59",innerColorTop:"#00ff59",innerColorBottom:"#b500b5",bands:16})}),o.jsx(f,{children:o.jsx(m,{scale:1.3,position:[4,-.3,-7],colorTop:"#e020e6",colorBottom:"#02c68e",bands:12})}),o.jsx(f,{children:o.jsx(m,{scale:.7,position:[-7,.5,4],colorTop:"#0d00ff",colorBottom:"#ff00ff",bands:16})}),o.jsxs(f,{children:[o.jsx(m,{scale:.7,position:[5.5,6,4],colorTop:"#ff0084",colorBottom:"#0080ff",bands:16}),o.jsx(T,{scale:.2,position:[6.5,7,4.5],colorTop:"#ff0084",colorBottom:"#0080ff",innerColorTop:"#ffffff",innerColorBottom:"#000000",bands:8})]})]})}function Z(){const{ready:e,play:t,stop:l,isPlaying:r}=z({withSamples:!0}),i=c.useMemo(()=>Object.fromEntries(Object.entries(b).map(([a,w])=>[a,w.toString()])),[]),{themeName:n,presetName:d,autoPlay:u}=M("Strudelizer",{Theme:h({themeName:{value:"Miami",options:Object.keys(B)}},{collapsed:!0}),Track:h({presetName:{value:"defaultPattern",options:Object.keys(i)},autoPlay:!1},{collapsed:!0})},{collapsed:!0}),s=B[n],[p,v]=c.useState(b.defaultPattern);return c.useEffect(()=>{const a=i[d];a&&(v(a),u&&e&&t(a))},[d,e,u,t]),o.jsxs(o.Fragment,{children:[o.jsx(U,{enablePan:!1,minDistance:6,maxDistance:16,target:[0,1.5,0],minPolarAngle:Math.PI*.35,maxPolarAngle:Math.PI*.495}),o.jsx(O,{theme:s}),o.jsx(E,{center:!0,transform:!0,position:[0,2.5,-2],children:o.jsxs("div",{style:{width:420,maxWidth:"90vw",background:`linear-gradient(180deg, ${s.bg}, #000)`,color:s.wire,padding:16,fontFamily:"monospace",borderRadius:14,border:`1px solid ${s.grid}`,boxShadow:`0 0 30px ${s.grid}55, inset 0 0 30px #000`,display:"flex",flexDirection:"column",gap:8,pointerEvents:"auto"},children:[o.jsxs("div",{style:{display:"flex",justifyContent:"space-between"},children:[o.jsx("strong",{style:{color:s.accent},children:"🎛 STRUDELIZER"}),o.jsx("span",{style:{color:e?s.wire:"#f33"},children:e?"ready":"loading"})]}),o.jsx("div",{style:{color:r?s.wire:"#f44"},children:r?"▶ playing":"■ stopped"}),o.jsx("textarea",{value:p,onChange:a=>v(a.target.value),rows:9,style:{width:"100%",background:"#000",color:s.wire,border:`1px solid ${s.grid}`,padding:10,resize:"none",borderRadius:8,outline:"none"}}),o.jsxs("div",{style:{display:"flex",gap:8},children:[o.jsx("button",{type:"button",onClick:()=>t(p),children:"▶ play"}),o.jsx("button",{type:"button",onClick:l,children:"■ stop"})]}),o.jsx("div",{style:{fontSize:11,opacity:.6},children:"First interaction must be a user tap (mobile audio unlock)"})]})})]})}export{Z as default};
