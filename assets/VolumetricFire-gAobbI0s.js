import{V as p,a4 as z,am as W,Q as T,n as xe,r as F,aF as H,U as R,o as we,j as V,aL as ge,X as K,ba as ve,_ as ye,a1 as Se,p as _e,x as Ee,a6 as be,bb as Ae,a_ as Fe,bc as ae,bd as ce,aw as Y,a7 as $,be as J}from"./index-ByL4sTkr.js";const le=[0,0,0],ue=[1,1,1];function X(e,t=le,n=ue){return{position:new p(...e),rotation:new z(...t),scale:new p(...n)}}function He({points:e=[],pos:t=[0,0,0],rot:n=le,scale:s=ue,...c}){return{...c,pos:[...t],rot:[...n],scale:[...s],points:e.map(i=>Array.isArray(i)?X(i):X(i.position,i.rotation,i.scale))}}const pe=[0,0,0],q=[0,0,0],G=[1,1,1],Z=new p,N=new T,ee=new p,te=new T,ne=new T,se=new z,oe=new p;new p;const re=new W;new W;const Te={pos:[...pe],rot:[...q],scale:[...G]},O=(e,t)=>Array.isArray(e)?[...e]:[...t];function Me(e){return{position:e.position.clone(),rotation:e.rotation?e.rotation.clone():new z(0,0,0),scale:e.scale?e.scale.clone():new p(1,1,1)}}function L(e=[]){return e.map(Me)}function Q(e={}){return{pos:O(e.pos,pe),rot:O(e.rot,q),scale:O(e.scale,G)}}function fe(e={}){return{...e,...Q(e),points:L(e.points??[])}}function Pe(e={}){return Array.isArray(e.pos)||Array.isArray(e.rot)||Array.isArray(e.scale)}function Ce(e,t){return Z.fromArray(e.pos),N.setFromEuler(new z(e.rot[0],e.rot[1],e.rot[2])),ee.fromArray(e.scale),t.compose(Z,N,ee),t}function Ie(e){const t=L(e.points??[]),n=t[0]?.position.clone()??new p(0,0,0);return t.forEach(s=>{s.position.sub(n)}),{...e,pos:n.toArray(),rot:[...q],scale:[...G],points:t}}function me(e={}){return Pe(e)?{...e,...Q(e),points:L(e.points??[])}:Ie(e)}function ze(e={}){const t=me(e),n=Q(t);return Ce(n,re),t.points.map(s=>(oe.copy(s.position).applyMatrix4(re),te.setFromEuler(s.rotation?s.rotation.clone():new z(0,0,0)),N.setFromEuler(new z(n.rot[0],n.rot[1],n.rot[2])),ne.copy(N).multiply(te),se.setFromQuaternion(ne),{position:oe.clone(),rotation:se.clone(),scale:new p((s.scale?.x??1)*n.scale[0],(s.scale?.y??1)*n.scale[1],(s.scale?.z??1)*n.scale[2])}))}function We(e={}){return ze(e)[0]?.position??new p}const k={name:"",visible:!0,type:"Smoke",smokeType:"Particle",fireType:"Classic",tension:1,closed:!0,showSpline:!0,showHelpers:!0,arcSegments:200,showSmokeVolume:!1,showFireVolume:!1,particleCount:15e3,particleSize:.4,particleColor:"#7c7989",opacity:.045,growth:2,fadeExponent:1.2,buoyancy:.2,rotSpeed:.3,blendMode:"Normal",springK:5,flowSpeed:.04,damping:.12,turbulence:1.2,turbulenceSpeed:.3,spawnSpread:1.2,maxDrift:6,fadeRate:8,volParticleCount:12e3,volSize:.6,volColor:"#9090a0",volOpacity:.06,volBlendMode:"Normal",volSpread:1.2,volSpringK:2.5,volDamping:.1,volTurbulence:1.8,volTurbulenceSpeed:.25,volMaxDrift:9,volGrowth:1.5,volFadeExp:1.2,volBuoyancy:0,fireWidth:.8,fireHeight:2,fireDepth:.8,fireSliceSpacing:.04,fireMagnitude:1.3,fireLacunarity:2,fireGain:.5,fireTintColor:"#ffffff",fireSaturation:1,fireBrightness:1.5,fireAnimated:!0,fireAnimSpeed:.5,cs184Magnitude:1.3,cs184Lacunarity:2,cs184Gain:.5,cs184Speed:.8,cs184Density:1.2,cs184Brightness:1.8,cs184Saturation:1,cs184TintColor:"#ffffff",cs184CoreColor:"#ffffcc",cs184BorderColor:"#ff6600",cs184SmokeColor:"#330000",cs184EmberDensity:.15,cs184EmberSize:.25,cs184EmberColor:"#ff4400",cs184Steps:64,cs184StepSize:1,cs184Animated:!0,cs184AnimSpeed:.5};function qe(e,t,n,s){e(c=>{const i=[...c];return i[t]={...i[t],[n]:s},i})}function Ge(e){let t=[];Array.isArray(e?.splines)?t=e.splines:e?.points&&(t=[e]);const n=t.map(me),s=n.map(i=>L(i.points)),c=n.map(i=>{const{points:l,pos:h,rot:u,scale:o,...a}=i;let m={...a};return(a.type==="Particle"||a.type==="Volumetric")&&(m={...a,smokeType:a.type,type:"Smoke"}),{...k,...m}});return{splineInstances:n,splines:s,splineConfigs:c}}function Qe(e,t){return e.splineInstances.reduce((n,s,c)=>{const i=e.splineConfigs[c]??k;return(i.type??k.type)!==t||(n.splineInstances.push(fe(s)),n.splines.push(L(s.points)),n.splineConfigs.push(i)),n},{splineInstances:[],splines:[],splineConfigs:[]})}function Ke(e,t){return e.map((n,s)=>{const c=t[s]??k,{showSpline:i,showHelpers:l,showSmokeVolume:h,showFireVolume:u,...o}=c,a=Array.isArray(n)?{...Te,points:L(n)}:fe(n),m=a.points.map(f=>{const d=f.position,_=f.rotation??new z,E=f.scale??new p(1,1,1);return`    { position: new THREE.Vector3(${d.x.toFixed(3)}, ${d.y.toFixed(3)}, ${d.z.toFixed(3)}), rotation: new THREE.Euler(${_.x.toFixed(3)}, ${_.y.toFixed(3)}, ${_.z.toFixed(3)}), scale: new THREE.Vector3(${E.x.toFixed(3)}, ${E.y.toFixed(3)}, ${E.z.toFixed(3)}) }`}),x=Object.entries(o).map(([f,d])=>typeof d=="string"?`    ${f}: '${d}'`:`    ${f}: ${d}`).join(`,
`),S=a.pos.map(f=>f.toFixed(3)).join(", "),v=a.rot.map(f=>f.toFixed(3)).join(", "),y=a.scale.map(f=>f.toFixed(3)).join(", ");return`  {
${x?`${x},
`:""}    pos: [${S}],
    rot: [${v}],
    scale: [${y}],
    points: [
${m.join(`,
`)}
    ]
  }`}).join(`,
`)}const De=`
    attribute vec3 position;
    attribute vec3 tex;
    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;
    varying vec3 texOut;
    void main(void) {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        texOut = tex;
    }
`,Ve=`
    precision highp float;
    uniform float time;
    uniform sampler2D nzw;
    uniform sampler2D fireProfile;
    uniform float magnitude;
    uniform float lacunarity;
    uniform float gain;
    uniform vec4 noiseScale;
    uniform vec3 colorTint;
    uniform float saturation;
    uniform float brightness;

    vec2 mBBS(vec2 val, float modulus) {
        val = mod(val, modulus);
        return mod(val * val, modulus);
    }
    const float modulus = 61.0;
    
    float mnoise(vec3 pos) {
        float intArg = floor(pos.z);
        float fracArg = fract(pos.z);
        vec2 hash = mBBS(intArg * 3.0 + vec2(0, 3), modulus);
        vec4 g = vec4(
            texture2D(nzw, vec2(pos.x, pos.y + hash.x) / modulus).xy,
            texture2D(nzw, vec2(pos.x, pos.y + hash.y) / modulus).xy
        ) * 2.0 - 1.0;
        return mix(g.x + g.y * fracArg, g.z + g.w * (fracArg - 1.0), smoothstep(0.0, 1.0, fracArg));
    }

    float turbulence(vec3 pos) {
        float sum = 0.0;
        float freq = 1.0;
        float amp = 1.0;
        for(int i = 0; i < 4; i++) {
            sum += abs(mnoise(pos * freq)) * amp;
            freq *= lacunarity;
            amp *= gain;
        }
        return sum;
    }

    vec4 sampleFire(vec3 loc, vec4 scale) {
        loc.xz = loc.xz * 2.0 - 1.0;
        vec2 st = vec2(sqrt(dot(loc.xz, loc.xz)), loc.y);
        loc.y -= time * scale.w;
        loc *= scale.xyz;
        float offset = sqrt(st.y) * magnitude * turbulence(loc);
        st.y += offset;
        
        if(st.y > 1.0) return vec4(0.0);
        
        vec4 result = texture2D(fireProfile, st);
        
        if(st.y < 0.1) result *= st.y / 0.1;
        
        return result;
    }

    varying vec3 texOut;
    void main(void) {
        vec4 color = sampleFire(texOut, noiseScale);
        vec3 tinted = color.rgb * colorTint * brightness;
        float lum = dot(tinted, vec3(0.2126, 0.7152, 0.0722));
        tinted = mix(vec3(lum), tinted, saturation);
        gl_FragColor = vec4(tinted, color.a);
    }
`;class Le{constructor(){this.contents=[],this.sorted=!1}sort(){this.contents.sort((t,n)=>t.priority-n.priority),this.sorted=!0}pop(){return this.sorted||this.sort(),this.contents.pop()}top(){return this.sorted||this.sort(),this.contents[this.contents.length-1]}push(t,n){this.contents.push({object:t,priority:n}),this.sorted=!1}}class Ue extends ge{constructor({width:t=1,height:n=2,depth:s=1,sliceSpacing:c=.1,camera:i=null,textureNoise:l=null,textureProfile:h=null,segments:u=32,debug:o=!1}={}){if(!i)throw new Error("VolumetricFire: 'camera' is required.");(!l||!h)&&console.error("VolumetricFire: 'textureNoise' and 'textureProfile' must be provided.");const a=u*300*6,m=new H;m.setAttribute("position",new R(new Float32Array(a*3),3).setUsage(K)),m.setAttribute("tex",new R(new Float32Array(a*3),3).setUsage(K)),m.setIndex(new R(new Uint32Array(a),1));const x=new ve({vertexShader:De,fragmentShader:Ve,uniforms:{nzw:{value:l},fireProfile:{value:h},time:{value:0},magnitude:{value:1.3},lacunarity:{value:2},gain:{value:.5},noiseScale:{value:new Ee(1,2,1,.3)},colorTint:{value:new _e(1,1,1)},saturation:{value:1},brightness:{value:1.5}},side:Se,blending:ye,transparent:!0,depthWrite:!1});super(m,x),this.type="VolumetricFire",this.frustumCulled=!1,this._camera=i,this._sliceSpacing=c,this._segments=u,this._viewVector=new p,this._posCurve=new be,this._posCurve.curveType="centripetal",this._cornerNeighbors=[[1,2,4],[0,5,3],[0,3,6],[1,7,2],[0,6,5],[1,4,7],[2,7,4],[3,5,6]],this._incomingEdges=[[-1,2,4,-1,1,-1,-1,-1],[5,-1,-1,0,-1,3,-1,-1],[3,-1,-1,6,-1,-1,0,-1],[-1,7,1,-1,-1,-1,-1,2],[6,-1,-1,-1,-1,0,5,-1],[-1,4,-1,-1,7,-1,-1,1],[-1,-1,7,-1,2,-1,-1,4],[-1,-1,-1,5,-1,6,3,-1]],this._controlPoints=[],this.setRectangularShape(t,n,s),o&&this._initLatticeWireframe(u)}setRectangularShape(t,n,s){const c=n/2,i=[{pos:new p(0,-c,0),scale:new p(t,1,s),rot:new T},{pos:new p(0,0,0),scale:new p(t,1,s),rot:new T},{pos:new p(0,c,0),scale:new p(t,1,s),rot:new T}];this.setControlPoints(i)}setControlPoints(t){this._controlPoints=t,this._posCurve.points=t.map(n=>n.pos),this._posCurve.updateArcLengths()}update(t){this.material.uniforms.time.value=t;const n=new W;n.multiplyMatrices(this._camera.matrixWorldInverse,this.matrixWorld),this._viewVector.set(-n.elements[2],-n.elements[6],-n.elements[10]).normalize(),this._slice()}_getInterpolatedState(t){const n=this._controlPoints,s=n.length,c=t*(s-1);let i=Math.floor(c),l=i+1,h=c-i;l>=s&&(i=s-1,l=s-1,h=0);const u=n[i],o=n[l],a=this._posCurve.getPoint(t),m=new p().lerpVectors(u.scale,o.scale,h),x=u.rot instanceof T?u.rot:new T().setFromEuler(u.rot),S=o.rot instanceof T?o.rot:new T().setFromEuler(o.rot),v=new T().copy(x).slerp(S,h);return{pos:a,scale:m,quat:v}}_slice(){const t=[],n=[],s=[],c=[];let i=null,l=0;this.wireframe&&this.wireframe.visible&&(i=this.wireframe.geometry.attributes.position.array);for(let o=0;o<=this._segments;o++){const a=o/this._segments,m=this._posCurve.getUtoTmapping(a),x=this._getInterpolatedState(m),S=x.scale.x*.5,v=x.scale.z*.5,y=[new p(-S,0,-v),new p(S,0,-v),new p(S,0,v),new p(-S,0,v)];y.forEach(w=>w.applyQuaternion(x.quat).add(x.pos)),c.push(y),i&&y.forEach(w=>{i[l++]=w.x,i[l++]=w.y,i[l++]=w.z})}this.wireframe&&this.wireframe.visible&&(this.wireframe.geometry.attributes.position.needsUpdate=!0);let h=0;for(let o=0;o<this._segments;o++){const a=c[o],m=c[o+1],x=[a[0],a[1],m[0],m[1],a[3],a[2],m[3],m[2]],S=o/this._segments,v=(o+1)/this._segments,y=[new p(0,S,0),new p(1,S,0),new p(0,v,0),new p(1,v,0),new p(0,S,1),new p(1,S,1),new p(0,v,1),new p(1,v,1)],w=this._sliceHexahedron(x,y,h);for(let f=0;f<w.p.length;f+=3)t.push(w.p[f],w.p[f+1],w.p[f+2]);for(let f=0;f<w.t.length;f+=3)n.push(w.t[f],w.t[f+1],w.t[f+2]);for(let f=0;f<w.i.length;f++)s.push(w.i[f]);h=w.nextIndex}const u=this.geometry;if(t.length>u.attributes.position.array.length){console.warn("VolumetricFire: Vertex buffer overflow. Increase buffer size or adjust segments/sliceSpacing.");return}u.index.array.set(s),u.attributes.position.array.set(t),u.attributes.tex.array.set(n),u.index.needsUpdate=!0,u.attributes.position.needsUpdate=!0,u.attributes.tex.needsUpdate=!0,u.setDrawRange(0,s.length)}_sliceHexahedron(t,n,s){const c=t.map(d=>d.dot(this._viewVector)),i=Math.min(...c),l=Math.max(...c),h=c.indexOf(l);let u=Math.floor(l/this._sliceSpacing)*this._sliceSpacing;const o=[];let a=0;const m=new Le,x=(d,_)=>{if(a>=12)return;const E={sIdx:d,eIdx:_,dPos:new p,dTex:new p,pos:new p,tex:new p,prev:0,next:0,expired:!1},r=c[d]-c[_];if(Math.abs(r)>1e-5){const b=1/r;E.dPos.subVectors(t[_],t[d]).multiplyScalar(b),E.dTex.subVectors(n[_],n[d]).multiplyScalar(b);const A=c[d]-u;E.pos.addVectors(E.dPos.clone().multiplyScalar(A),t[d]),E.tex.addVectors(E.dTex.clone().multiplyScalar(A),n[d]),E.dPos.multiplyScalar(this._sliceSpacing),E.dTex.multiplyScalar(this._sliceSpacing)}return m.push(E,c[_]),o[a++]=E,E};for(let d=0;d<3;d++){const _=x(h,this._cornerNeighbors[h][d]);_.prev=(d+2)%3,_.next=(d+1)%3}const S=[],v=[],y=[];let w=s,f=0;for(;u>i;){for(;m.contents.length>0&&m.top().priority>=u;){const r=m.pop().object;if(!r.expired&&!(!o[r.prev]||!o[r.next]))if(r.eIdx!==o[r.prev].eIdx&&r.eIdx!==o[r.next].eIdx){r.expired=!0;const b=x(r.eIdx,this._incomingEdges[r.eIdx][r.sIdx]);if(!b)break;b.prev=r.prev,o[r.prev].next=a-1,b.next=a;const A=x(r.eIdx,this._incomingEdges[r.eIdx][b.eIdx]);if(!A)break;A.prev=a-2,A.next=r.next,o[r.next].prev=a-1,o[A.next].prev=a-1,f=a-1}else{let b,A;if(r.eIdx===o[r.prev].eIdx?(b=o[r.prev],A=r):(b=r,A=o[r.next]),!b||!A)continue;b.expired=!0,A.expired=!0;const g=x(r.eIdx,this._incomingEdges[r.eIdx][b.sIdx]);if(!g)break;g.prev=b.prev,o[b.prev]&&(o[b.prev].next=a-1),g.next=A.next,o[A.next]&&(o[A.next].prev=a-1),f=a-1}}let d=f,_=0,E=0;for(;E++<15&&o[d];){const r=o[d];if(S.push(r.pos.x,r.pos.y,r.pos.z),v.push(r.tex.x,r.tex.y,r.tex.z),r.pos.add(r.dPos),r.tex.add(r.dTex),d=r.next,_++,d===f)break}if(_>=3){for(let r=2;r<_;r++)y.push(w,w+r-1,w+r);w+=_}u-=this._sliceSpacing}return{p:S,t:v,i:y,nextIndex:w}}_initLatticeWireframe(t){const n=new Float32Array((t+1)*4*3),s=new H;s.setAttribute("position",new R(n,3));const c=[];for(let l=0;l<t;l++){const h=l*4,u=(l+1)*4;for(let o=0;o<4;o++)c.push(h+o,h+(o+1)%4),c.push(h+o,u+o)}const i=t*4;for(let l=0;l<4;l++)c.push(i+l,i+(l+1)%4);s.setIndex(c),this.wireframe=new Ae(s,new Fe({color:4500223,transparent:!0,opacity:.3})),this.wireframe.visible=!0,this.add(this.wireframe)}setShowVolume(t){t&&!this.wireframe&&this._initLatticeWireframe(this._segments),this.wireframe&&(this.wireframe.visible=t)}}let M=null,P=null;function Re(){if(M)return M;const e=64,t=new Uint8Array(e*e*4);for(let n=0;n<e*e;n+=1){const s=Math.random()*Math.PI*2;t[n*4+0]=Math.round((Math.cos(s)*.5+.5)*255),t[n*4+1]=Math.round((Math.sin(s)*.5+.5)*255),t[n*4+2]=128,t[n*4+3]=255}return M=new ae(t,e,e,ce),M.wrapS=J,M.wrapT=J,M.magFilter=$,M.minFilter=$,M.needsUpdate=!0,M}function je(){if(P)return P;const e=64,t=64,n=new Uint8Array(e*t*4);for(let s=0;s<t;s+=1)for(let c=0;c<e;c+=1){const i=c/(e-1),l=s/(t-1),h=Math.max(0,1-i*1.2),u=Math.max(0,1-l*.92),o=h*u;let a,m,x;if(l<.12){const y=l/.12;a=.5+y*.5,m=.6+y*.4,x=1}else if(l<.35){const y=(l-.12)/.23;a=1,m=1,x=1-y*.85}else if(l<.7){const y=(l-.35)/.35;a=1,m=1-y*.72,x=.15-y*.12}else{const y=(l-.7)/.3;a=1-y*.5,m=.28-y*.28,x=.03}const S=Math.max(0,1-i*1.1),v=(s*e+c)*4;n[v+0]=Math.min(255,Math.round(a*S*255)),n[v+1]=Math.min(255,Math.round(m*S*255)),n[v+2]=Math.min(255,Math.round(x*S*255)),n[v+3]=Math.min(255,Math.round(o*255))}return P=new ae(n,e,t,ce),P.wrapS=Y,P.wrapT=Y,P.magFilter=$,P.minFilter=$,P.needsUpdate=!0,P}const Be=5;function $e(e){return Array.from({length:e},()=>({pos:new p,scale:new p(1,1,1),rot:new T}))}function Ne(e,t,n,s,c,i){const l=t/2;for(let h=0;h<e.length;h+=1){const u=h/(e.length-1),o=u*u,a=n*(1-u*.25),m=s*(1-u*.25);e[h].pos.set(c*o,-l+u*t,i*o),e[h].scale.set(a,1,m)}}const ie=41;function ke({guideGeo:e}){return V.jsx("line",{geometry:e,children:V.jsx("lineBasicMaterial",{color:4500223,transparent:!0,opacity:.7})})}function Ye({position:e=[0,0,0],inverted:t=!1,width:n=.35,height:s=1,depth:c=.35,sliceSpacing:i=.05,segments:l=24,bendX:h=0,bendZ:u=0,animated:o=!0,animSpeed:a=.5,showSpline:m=!1,showVolume:x=!1,magnitude:S=1.3,lacunarity:v=2,gain:y=.5,tintColor:w="#ffffff",saturation:f=1,brightness:d=1.5,controlPoints:_=null}){const{camera:E}=xe(),r=F.useRef(0),b=F.useRef({x:h,z:u}),A=F.useRef(null);A.current||(A.current=$e(Be));const g=F.useMemo(()=>new Ue({width:n,height:s,depth:c,sliceSpacing:i,segments:l,camera:E,textureNoise:Re(),textureProfile:je()}),[E,l]);F.useEffect(()=>{g.material.uniforms.magnitude.value=S,g.material.uniforms.lacunarity.value=v,g.material.uniforms.gain.value=y},[g,S,v,y]),F.useEffect(()=>{g.material.uniforms.colorTint.value.set(w)},[g,w]),F.useEffect(()=>{g.material.uniforms.saturation.value=f,g.material.uniforms.brightness.value=d},[g,f,d]),F.useEffect(()=>{g._sliceSpacing=i},[g,i]),F.useEffect(()=>{g.setShowVolume(x)},[g,x]),F.useEffect(()=>{b.current={x:h,z:u}},[h,u]),F.useEffect(()=>()=>{g.geometry.dispose(),g.material.dispose()},[g]);const j=F.useMemo(()=>{const B=new H;return B.setAttribute("position",new R(new Float32Array(ie*3),3)),B},[]);F.useEffect(()=>()=>j.dispose(),[j]),we(({clock:B},he)=>{if(_)g.setControlPoints(_);else{let U=b.current.x,C=b.current.z;if(o){r.current+=he*a;const I=r.current;U+=Math.sin(I*.8)*.14+Math.sin(I*2.1+.5)*.04,C+=Math.cos(I*.65+1.2)*.07+Math.cos(I*1.7)*.03}Ne(A.current,s,n,c,U,C),g.setControlPoints(A.current)}if(g.update(B.getElapsedTime()),m){const U=g._posCurve;if(U?.points?.length>1){const C=U.getPoints(ie-1),I=j.attributes.position;for(let D=0;D<C.length;D+=1)I.setXYZ(D,C[D].x,C[D].y,C[D].z);I.needsUpdate=!0}}});const de=_?0:s/2;return V.jsx("group",{position:e,rotation:t?[Math.PI,0,0]:[0,0,0],children:V.jsxs("group",{position:[0,de,0],children:[V.jsx("primitive",{object:g}),m&&V.jsx(ke,{guideGeo:j})]})})}export{k as D,Ye as V,Te as a,L as b,fe as c,We as d,Qe as f,ze as g,He as m,Ge as p,Ke as s,qe as u};
