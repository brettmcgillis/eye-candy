import{aT as ie,az as fe,aQ as kn,j as p,r as h,n as re,m as ne,p as V,Q as Pe,V as B,b8 as ut,_ as Tn,ag as dt,b4 as Wn,Z as Dn,q as me,M as A,ak as pt,x as sn,bh as Rn,as as Cn,at as zn,N as Te,aD as Bn,bg as In,B as _n,a0 as Fn,aX as _}from"./index-CRhP28aw.js";import{R as ke,C as ye,i as Gn,P as Ln}from"./react-three-rapier.esm-DGxYMl02.js";import{S as On}from"./SkeletonUtils-DatH0SKd.js";import{u as ge}from"./Gltf-CEbDZt2i.js";import{u as En}from"./useAnimations-gdMqII2t.js";import{u as An,a as Vn,b as jn}from"./useOperatorInput-CJlb4df1.js";import{P as Nn}from"./PerspectiveCamera-DZOSxZzi.js";import{O as Un}from"./OrbitControls-CeeV2vAS.js";import{l as Hn,aA as Yn,F as $,f as N,z as ht,am as on,m as we,a as se,i as ln,Q as cn,aI as Ee,s as Xn,d as Zn,bw as Kn,bA as wt,C as ae,L as un,br as Ue,H as He,aW as qn,u as j}from"./three.tsl-DWuWk0ah.js";import{f as $n,O as Qn}from"./three-pinata.es-DFIGYP6H.js";import{b as Jn}from"./NurbsWaterColumn-uElieDIu.js";import{u as ei}from"./usePresetsFolder-CjBF_zGA.js";import"./constants-BqHkLWex.js";import"./extends-CF3RwP-h.js";import"./Fbo-BMThz8gB.js";import"./Line2-CJTZQ6EU.js";function ti(n){const t=ie.useRef(),{scene:i,animations:s}=ge(fe("goldfish.glb")),r=ie.useMemo(()=>On.clone(i),[i]),{nodes:a,materials:e}=kn(r),{actions:c}=En(s,t);return p.jsx("group",{ref:t,...n,dispose:null,children:p.jsxs("group",{name:"Scene",children:[p.jsx("group",{name:"Object_12",rotation:[-Math.PI/2,0,0],scale:100,children:p.jsx("primitive",{object:a._rootJoint})}),p.jsx("skinnedMesh",{name:"Object_15",geometry:a.Object_15.geometry,material:e.M_CometSp,skeleton:a.Object_15.skeleton,rotation:[-Math.PI/2,0,0],scale:100}),p.jsx("skinnedMesh",{name:"Object_17",geometry:a.Object_17.geometry,material:e.M_CometSp,skeleton:a.Object_17.skeleton,rotation:[-Math.PI/2,0,0],scale:100}),p.jsx("skinnedMesh",{name:"Object_19",geometry:a.Object_19.geometry,material:e.M_CometSp,skeleton:a.Object_19.skeleton,rotation:[-Math.PI/2,0,0],scale:100}),p.jsx("skinnedMesh",{name:"Object_21",geometry:a.Object_21.geometry,material:e.M_CometSp,skeleton:a.Object_21.skeleton,rotation:[-Math.PI/2,0,0],scale:100}),p.jsx("skinnedMesh",{name:"Object_23",geometry:a.Object_23.geometry,material:e.M_CometSp,skeleton:a.Object_23.skeleton,rotation:[-Math.PI/2,0,0],scale:100}),p.jsx("skinnedMesh",{name:"Object_25",geometry:a.Object_25.geometry,material:e.M_CometSp,skeleton:a.Object_25.skeleton,rotation:[-Math.PI/2,0,0],scale:100}),p.jsx("skinnedMesh",{name:"Object_27",geometry:a.Object_27.geometry,material:e.M_CometEyes,skeleton:a.Object_27.skeleton,rotation:[-Math.PI/2,0,0],scale:100}),p.jsx("skinnedMesh",{name:"Object_75",geometry:a.Object_75.geometry,material:e.M_CometSp,skeleton:a.Object_75.skeleton,rotation:[-Math.PI/2,0,0],scale:100}),p.jsx("skinnedMesh",{name:"Object_77",geometry:a.Object_77.geometry,material:e.M_CometSp,skeleton:a.Object_77.skeleton,rotation:[-Math.PI/2,0,0],scale:100}),p.jsx("skinnedMesh",{name:"Object_79",geometry:a.Object_79.geometry,material:e.M_CometEyes,skeleton:a.Object_79.skeleton,rotation:[-Math.PI/2,0,0],scale:100})]})})}ge.preload(fe("goldfish.glb"));const Mt=.2,ni=.12,ii=.08,ri=.14,de=.18;function pe(n){const t=Math.max(n.width-n.glassThickness*2-n.waterInset*2,Mt),i=Math.max(n.depth-n.glassThickness*2-n.waterInset*2,Mt),s=Math.max(n.height-n.glassThickness*2-de-n.waterInset,ni),r=Math.max(ii,s*n.waterLevel),a=-n.height/2+de/2,e=-n.height/2+de+r/2,c=-n.height/2+de+.12,l=c+Math.max(ri,r-.16);return{innerDepth:i,innerHeight:s,innerWidth:t,maxFishY:l,minFishY:c,sandY:a,waterHeight:r,waterY:e}}const ai={back:[0,0,-1],front:[0,0,1],left:[-1,0,0],right:[1,0,0]},si=2,oi=[0,Math.PI],li=[-.22,.22],Pt=.06;function ci(n,t,i,s){const r=li[n]??0;if(!t)return{x:r,y:-s.height/2+de+Pt,z:n===0?-.16:.16};const[a,,e]=ai[t],c=-s.height/2+Pt;return e!==0?{x:r,y:c,z:e*(s.depth/2+i.escapeDistance)}:{x:a*(s.width/2+i.escapeDistance),y:c,z:r}}function ui(n){switch(n){case"back":return Math.PI;case"left":return-Math.PI/2;case"right":return Math.PI/2;default:return 0}}function di({fish:n,runtime:t,tank:i,showMarkers:s=!1}){const r=h.useRef([]),a=h.useMemo(()=>Array.from({length:si},(e,c)=>l=>{r.current[c]=l}),[]);return re(e=>{if(!n.visible)return;const c=e.clock.elapsedTime*n.speed,l=t?t.getWaterLevel():i.waterLevel,u=t?t.getFirstBrokenPane():null,{innerDepth:d,innerWidth:f,maxFishY:o,minFishY:m,waterHeight:S}=pe({...i,waterLevel:l}),x=Math.min(n.radiusX,f*.42),y=Math.min(n.radiusZ,d*.42),v=m+Math.max(.05,S*.45)+n.baseYOffset,g=l<=n.strandLevel;for(let w=0;w<n.count;w+=1){const b=r.current[w];if(b){const W=oi[w]??0,k=c+W;if(g){const I=e.clock.elapsedTime*7+W,M=ci(w,u,n,i);b.position.set(M.x,M.y,M.z),b.rotation.y=ui(u),b.rotation.x=Math.sin(I)*n.flopAmplitude,b.rotation.z=Math.cos(I*.72)*n.flopAmplitude*.35}else{const I=Math.cos(k)*x,M=Math.sin(k)*y,C=Math.min(o,Math.max(m,v+Math.sin(k*2.1)*n.bobAmplitude));b.position.set(I,C,M),b.rotation.x=0,b.rotation.y=-k+Math.PI/2,b.rotation.z=Math.sin(k*2.8)*.08}}}}),Array.from({length:n.count},(e,c)=>p.jsxs("group",{ref:a[c],visible:n.visible,children:[p.jsx(ti,{scale:n.scale}),s&&p.jsxs("mesh",{position:[0,.08,0],children:[p.jsx("sphereGeometry",{args:[n.markerSize,12,12]}),p.jsx("meshBasicMaterial",{color:n.markerColor})]})]},`fish-${c}`))}const he=-.9,pi=.18,hi=.08,fi=.08,mi=.12,gi=.08,xi=1.6,Si=.16,vi=1.9;function bi(n){return n.width+Math.max(vi,n.spillExtent*1.25)}function yi(n){return n.depth+Math.max(xi,n.spillExtent*1.1)}function wi(n){return Math.max(Si,n.glassThickness*3)}function Mi(n){return Math.max(gi,n*1.25)}function Pi(n){return Math.max(fi,n*1.25)}function ki(n){return Math.max(mi,n*1.75)}function ft(n,t={}){const i=t.position??[0,0,0],s=Math.max(.01,t.width??bi(n)),r=Math.max(.01,t.depth??yi(n)),a=Math.max(.01,t.thickness??wi(n)),e=-n.height/2+i[1],c=Math.max(pi,a*1.4),l=Math.max(hi,a*.65),u=e-c/2,d=Math.max(.01,t.legs?.width??Mi(a)),f=Math.max(.01,t.legs?.depth??Pi(a)),o=Math.max(0,t.legs?.inset??ki(a)),m=Math.min(o,Math.max(0,s/2-d/2)),S=Math.min(o,Math.max(0,r/2-f/2)),x=Math.max(0,s/2-m-d/2),y=Math.max(0,r/2-S-f/2),v=Math.max(.01,e-a-he),g=he+v/2,w=[d/2,v/2,f/2],b=[d,v,f];return{depth:r,edgeBand:Math.max(.28,a*3),edgeColliders:[{args:[s/2,c/2,l/2],key:"front",position:[i[0],u,i[2]+r/2-l/2]},{args:[s/2,c/2,l/2],key:"back",position:[i[0],u,i[2]-r/2+l/2]},{args:[l/2,c/2,Math.max(.01,r/2-l)],key:"left",position:[i[0]-s/2+l/2,u,i[2]]},{args:[l/2,c/2,Math.max(.01,r/2-l)],key:"right",position:[i[0]+s/2-l/2,u,i[2]]}],legs:[{halfExtents:w,key:"front-left",position:[i[0]-x,g,i[2]+y],size:b},{halfExtents:w,key:"front-right",position:[i[0]+x,g,i[2]+y],size:b},{halfExtents:w,key:"back-left",position:[i[0]-x,g,i[2]-y],size:b},{halfExtents:w,key:"back-right",position:[i[0]+x,g,i[2]-y],size:b}],thickness:a,topHalfExtents:[s/2,a/2,r/2],topPosition:[i[0],e-a/2,i[2]],topY:e,width:s}}const Ye=24,Ti=24;function Wi({cameraConfig:n,cameraMode:t="Fixed",operatorCamera:i,sceneEnvironment:s}){const[r,a]=h.useState(null),[e,c]=h.useState(null),{cameraFov:l,cameraPosition:u,cameraTarget:d}=An(n),f=t==="Operator",o=t==="Orbit",m=Vn({enabled:f});return jn({enabled:f,inputRef:m,config:i}),h.useLayoutEffect(()=>{if(!f&&r){if(r.position.set(...u),r.fov=l,r.updateProjectionMatrix(),!e){r.lookAt(...d);return}e.target.set(...d),e.update()}},[l,r,u,d,e,f]),p.jsxs(p.Fragment,{children:[p.jsx(Nn,{ref:a,makeDefault:!0,position:u,fov:l,near:.1,far:100}),p.jsx(Un,{ref:c,makeDefault:!0,target:d,enabled:o,enablePan:o,enableRotate:o,enableZoom:o}),p.jsx("color",{attach:"background",args:[s.backgroundColor]}),p.jsx("fog",{attach:"fog",args:[s.fogColor,Math.min(s.fogNear,s.fogFar),Math.max(s.fogNear,s.fogFar)]}),p.jsx("ambientLight",{intensity:s.ambientIntensity}),p.jsx("directionalLight",{castShadow:!0,intensity:s.directionalIntensity,position:s.directionalPosition,"shadow-mapSize-width":1024,"shadow-mapSize-height":1024}),p.jsxs("mesh",{position:[0,he,0],receiveShadow:!0,rotation:[-Math.PI/2,0,0],children:[p.jsx("planeGeometry",{args:[Ye,Ye]}),p.jsx("meshStandardMaterial",{color:s.floorColor})]}),p.jsx("gridHelper",{args:[Ye,Ti,s.gridColor,s.gridColor],position:[0,he+.002,0]})]})}const Di=["glass","glass_2","glass_5"],K=["front","back","left","right"],Ri=[{key:"left",geometryKey:"glass_left",materialKey:"glass"},{key:"front",geometryKey:"glass_back",materialKey:"glass"},{key:"right",geometryKey:"glass_right",materialKey:"glass"},{key:"back",geometryKey:"glass_front",materialKey:"glass"}],dn=[{geometryKey:"rubber",materialKey:"rubber"},{geometryKey:"plastic_1",materialKey:"plastic_1"},{geometryKey:"rock_1",materialKey:"rock_1"},{geometryKey:"sand",materialKey:"sand"},{geometryKey:"rock_3",materialKey:"rock_3"},{geometryKey:"rock_4",materialKey:"rock_4"},{geometryKey:"rock_5",materialKey:"rock_5"},{geometryKey:"rock_6",materialKey:"rock_6"},{geometryKey:"rock_7",materialKey:"rock_7"},{geometryKey:"rock_2",materialKey:"rock_2"},{geometryKey:"stone",materialKey:"stone"},{geometryKey:"glass_2",materialKey:"glass_2"},{geometryKey:"glass_5",materialKey:"glass_5"},{geometryKey:"plastic_2",materialKey:"plastic_1"},{geometryKey:"lid_1",materialKey:"plastic_1"}],kt=dn.map(({geometryKey:n})=>n),ot=ie.forwardRef(function({glassColor:t,glassOpacity:i,paneProps:s={},renderPane:r,renderStaticMesh:a,sandColor:e,staticMeshProps:c={},...l},u){const{nodes:d,materials:f}=ge(fe("/fishTank.glb")),o=h.useMemo(()=>{const m=Object.fromEntries(Object.entries(f).map(([S,x])=>[S,x.clone()]));return Di.forEach(S=>{const x=m[S];x&&(t&&x.color&&x.color.set(t),i!=null&&(x.opacity=i,x.transparent=i<1||x.transparent,x.needsUpdate=!0))}),e&&m.sand?.color&&m.sand.color.set(e),m},[t,i,f,e]);return p.jsxs("group",{ref:u,...l,dispose:null,children:[dn.map(({geometryKey:m,materialKey:S})=>a?a({geometry:d[m].geometry,material:o[S],meshKey:m,meshProps:c[m]}):p.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:d[m].geometry,material:o[S],...c[m]},m)),Ri.map(({geometryKey:m,key:S,materialKey:x})=>r?r({geometry:d[m].geometry,material:o[x],paneKey:S,paneProps:s[S]}):p.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:d[m].geometry,material:o[x],...s[S]},S))]})});ot.displayName="FishTank";ge.preload(fe("/fishTank.glb"));const Ci=.996,zi=.18,Bi=36,Ii=.985,_i=.12,Fi=.28,Gi=new Tn,Tt=new B,Wt=new B,Dt=new B,q=new B,Rt=new Pe,Ct=new ut,Z=new B,Se=new B;function Ae(n,t){return Math.max(0,Math.min(t,n))}function zt(n,t,i,s,r){const a=n,e=Ae(Math.round((i+t.domainWidth/2)/t.domainWidth*(t.resolution-1)),t.resolution-1),c=Ae(Math.round((s+t.domainDepth/2)/t.domainDepth*(t.resolution-1)),t.resolution-1);for(let l=-2;l<=2;l+=1)for(let u=-2;u<=2;u+=1){const d=e+u,f=c+l;if(d>=0&&d<t.resolution&&f>=0&&f<t.resolution){const o=f*t.resolution+d,m=Math.exp(-(u*u+l*l)*.65);a[o]+=r*m}}}function Li(n,t,i,s,r){const a=n,e=Ae(Math.round((i+t.domainWidth/2)/t.domainWidth*(t.resolution-1)),t.resolution-1),c=Ae(Math.round((s+t.domainDepth/2)/t.domainDepth*(t.resolution-1)),t.resolution-1);for(let l=-2;l<=2;l+=1)for(let u=-2;u<=2;u+=1){const d=e+u,f=c+l;if(d>=0&&d<t.resolution&&f>=0&&f<t.resolution){const o=f*t.resolution+d,m=Math.exp(-(u*u+l*l)*.58);a[o]=Math.min(t.maxDepth,a[o]+r*m)}}}function Oi({resolution:n,tank:t,xCoords:i,zCoords:s}){const r=t.depth/2,a=t.width/2,e=t.depth*.42,c=t.width*.42,l=Math.max(_i,t.spillThickness*4),u=Math.max(Fi,t.spillThickness*6),d={back:[],front:[],left:[],right:[]};for(let f=0;f<n*n;f+=1){const o=i[f],m=s[f];Math.abs(o)<=c&&m>=r-l&&m<=r+u&&d.front.push(f),Math.abs(o)<=c&&m<=-r+l&&m>=-r-u&&d.back.push(f),Math.abs(m)<=e&&o>=a-l&&o<=a+u&&d.right.push(f),Math.abs(m)<=e&&o<=-a+l&&o>=-a-u&&d.left.push(f)}return d}function Ei(n,t){const i=ft(n,t),s=i.width,r=i.depth,a=Bi,e=new Wn(s,r,a-1,a-1);e.rotateX(-Math.PI/2);const c=e.getAttribute("position"),l=Float32Array.from(c.array),u=new Float32Array(a*a),d=Math.max(0,n.depth/2-n.glassThickness),f=Math.max(0,n.width/2-n.glassThickness),o=new Uint8Array(a*a),m=new Float32Array(a*a),S=new Float32Array(a*a);for(let x=0;x<a*a;x+=1){m[x]=l[x*3],S[x]=l[x*3+2];const y=m[x],v=S[x],g=Math.min(s/2-Math.abs(y),r/2-Math.abs(v));u[x]=V.clamp(1-g/i.edgeBand,0,1),o[x]=Math.abs(y)<f&&Math.abs(v)<d?1:0}return{basePositions:l,blockedHalfDepth:d,blockedHalfWidth:f,depthCurrent:new Float32Array(a*a),depthNext:new Float32Array(a*a),domainDepth:r,domainWidth:s,edgeDrain:u,geometry:e,maxDepth:Math.max(n.spillThickness*1.8,.03),positionAttr:c,resolution:a,sourceIndicesByPane:Oi({resolution:a,tank:n,xCoords:m,zCoords:S}),vertexCount:a*a,waveCurrent:new Float32Array(a*a),waveNext:new Float32Array(a*a),wavePrev:new Float32Array(a*a),xCoords:m,zCoords:S,tankBaseMask:o}}function Ai(n){n.depthCurrent.fill(0),n.depthNext.fill(0),n.waveCurrent.fill(0),n.waveNext.fill(0),n.wavePrev.fill(0)}function Vi({fluidCouplersRef:n,runtime:t,table:i,tank:s}){const r=ne(S=>S.camera),a=ne(S=>S.gl),e=h.useRef(new WeakMap),c=h.useRef(t?.getResetNonce?.()??0),l=ne(S=>S.pointer),u=h.useRef(null),d=h.useRef(null),f=a?.backend?.isWebGPUBackend===!0&&!!a?.backend?.device&&!!a?.backend?.context&&typeof navigator<"u"&&!!navigator.gpu,o=h.useMemo(()=>Ei(s,i),[i.depth,i.position,i.thickness,i.width,s.depth,s.glassThickness,s.height,s.spillExtent,s.spillThickness,s.width]),m=ft(s,i);return re((S,x)=>{if(f)return;const y=t?.getResetNonce?.()??0;y!==c.current&&(c.current=y,Ai(o),d.current=null,u.current&&(u.current.visible=!1));const v=t?t.getWaterLevel():s.waterLevel,g=t?t.getBrokenPaneCount():0,w=Math.min(x*60,2),b=s.waterLevel>0?1-v/s.waterLevel:0,W=Math.max(0,1-x*.02);for(let M=0;M<o.resolution;M+=1)for(let C=0;C<o.resolution;C+=1){const D=M*o.resolution+C;if(o.tankBaseMask[D])o.depthNext[D]=0,o.waveNext[D]=0;else if(C===0||M===0||C===o.resolution-1||M===o.resolution-1)o.depthNext[D]=o.depthCurrent[D]*.9,o.waveNext[D]=0;else{const G=D-1,U=D+1,L=D-o.resolution,H=D+o.resolution,T=(o.depthCurrent[G]+o.depthCurrent[U]+o.depthCurrent[L]+o.depthCurrent[H])/4,z=o.edgeDrain[D],P=Math.max(0,1-z*.18*w);o.depthNext[D]=V.clamp((o.depthCurrent[D]+(T-o.depthCurrent[D])*zi*w)*Ci*W*P,0,o.maxDepth),o.waveNext[D]=((o.waveCurrent[G]+o.waveCurrent[U]+o.waveCurrent[L]+o.waveCurrent[H])*.5-o.wavePrev[D])*Ii*Math.max(.45,1-z*.22)}}if(g&&v>0){const M=v*s.spillThickness*.18*w,C=M*.7+b*.0025;K.forEach(D=>{t?.isPaneBroken(D)&&o.sourceIndicesByPane[D].forEach(G=>{o.tankBaseMask[G]||(o.depthNext[G]=Math.min(o.maxDepth,o.depthNext[G]+M),o.waveNext[G]+=C)})})}if(u.current&&(g||b>.01))if(u.current.getWorldQuaternion(Rt),Tt.set(0,1,0).applyQuaternion(Rt).normalize(),u.current.getWorldPosition(Wt),Ct.setFromCamera(l,r),Ct.ray.intersectPlane(Gi.setFromNormalAndCoplanarPoint(Tt,Wt),Dt))if(q.copy(Dt),u.current.worldToLocal(q),Math.abs(q.x)<=o.domainWidth/2&&Math.abs(q.z)<=o.domainDepth/2&&!(Math.abs(q.x)<o.blockedHalfWidth&&Math.abs(q.z)<o.blockedHalfDepth)){const M=d.current;if(M){const C=M.distanceTo(q),D=Math.min(s.spillThickness*.8,C*s.waterDisturbance*3.2);D>5e-4&&zt(o.waveNext,o,q.x,q.z,D)}d.current=q.clone()}else d.current=null;else d.current=null;else d.current=null;if(u.current){const M=e.current;(n?.current??[]).forEach(C=>{if(!C)return;C.getWorldPosition(Se);const D=M.get(C);if(!D){M.set(C,Se.clone());return}if(Z.copy(Se),u.current.worldToLocal(Z),Math.abs(Z.x)<=o.domainWidth/2&&Math.abs(Z.z)<=o.domainDepth/2&&Math.abs(Z.y)<=.28&&!(Math.abs(Z.x)<o.blockedHalfWidth&&Math.abs(Z.z)<o.blockedHalfDepth)){const G=Se.distanceTo(D)/Math.max(x,.008333333333333333),U=Math.min(o.maxDepth*.85,G*65e-5),L=Math.min(o.maxDepth*.14,G*8e-5);U>4e-4&&zt(o.waveNext,o,Z.x,Z.z,U),L>15e-5&&Li(o.depthNext,o,Z.x,Z.z,L)}D.copy(Se)})}[o.depthCurrent,o.depthNext]=[o.depthNext,o.depthCurrent],[o.wavePrev,o.waveCurrent,o.waveNext]=[o.waveCurrent,o.waveNext,o.wavePrev];const k=o.positionAttr.array;let I=0;for(let M=0;M<o.vertexCount;M+=1){const C=o.depthCurrent[M],D=o.waveCurrent[M]*Math.min(1,C/Math.max(o.maxDepth,1e-4));k[M*3+1]=o.basePositions[M*3+1]+(o.tankBaseMask[M]?0:C+D),I=Math.max(I,C+Math.max(D,0))}o.positionAttr.needsUpdate=!0,o.geometry.computeVertexNormals(),u.current&&(u.current.visible=I>8e-4)}),f?null:p.jsx("mesh",{ref:u,geometry:o.geometry,position:[i.position[0],m.topY+.002,i.position[2]],receiveShadow:!0,visible:!1,children:p.jsx("meshPhysicalMaterial",{clearcoat:.45,color:s.waterColor,opacity:s.spillOpacity,roughness:.08,side:dt,thickness:.35,transmission:.18,transparent:!0})})}const Ve=$(([n,t,i,s,r,a])=>{const e=n.sub(t).div(i.sub(t)),c=s.add(e.mul(r.sub(s)));return ae(a,ht(cn(c,r),s),c)}),ji=qn(`
    fn voronoi3d(x: vec3<f32>, smoothness: f32, randomness: f32) -> f32
    {
        let p = floor(x);
        let f = fract(x);

        var res = 0.0;
        var totalWeight = 0.0;
        
        for (var k = -1; k <= 1; k++)
        {
            for (var j = -1; j <= 1; j++)
            {
                for (var i = -1; i <= 1; i++)
                {
                    let b = vec3<f32>(f32(i), f32(j), f32(k));
                    let hashOffset = hash3d(p + b) * randomness;
                    let r = b - f + hashOffset;
                    let d = length(r);
                    
                    let weight = exp(-d * d / max(smoothness * smoothness, 0.001));
                    res += d * weight;
                    totalWeight += weight;
                }
            }
        }
        
        if (totalWeight > 0.0)
        {
            res /= totalWeight;
        }
        
        return smoothstep(0.0, 1.0, res);
    }

    fn hash3d(p: vec3<f32>) -> vec3<f32>
    {
        var p3 = fract(p * vec3<f32>(0.1031, 0.1030, 0.0973));
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.xxy + p3.yzz) * p3.zyx);
    }
`),Bt=$(([n,t,i])=>{const s=N(1).sub(n),r=se(1),a=r.sub(r.sub(i).mul(r.sub(t)));return s.mul(t).add(n.mul(r.sub(t).mul(i).mul(t).add(t.mul(a))))}),pn=$(([n,t,i,s,r])=>{const a=N(1).toVar(),e=N(1).toVar(),c=N(0).toVar(),l=N(0).toVar(),u=t.floor();un(u,()=>{const o=He(n.mul(a));l.addAssign(o.mul(e)),c.addAssign(e),e.mulAssign(i),a.mulAssign(s)});const d=t.sub(u),f=d.greaterThan(.001);return ae(f,ae(r.equal(1),(()=>{const o=He(n.mul(a)),m=l.add(o.mul(e)),S=c.add(e),x=l.div(c).mul(.5).add(.5),y=m.div(S).mul(.5).add(.5);return we(x,y,d)})(),(()=>{const o=He(n.mul(a)),m=l.add(o.mul(e));return we(l,m,d)})()),ae(r.equal(1),l.div(c).mul(.5).add(.5),l))}),Ni=$(([n,t,i,s,r])=>{const a=N(1).toVar(),e=N(1).toVar(),c=N(0).toVar(),l=se(0).toVar(),u=t.floor();un(u,()=>{const o=Ue(n.mul(a));l.addAssign(o.mul(e)),c.addAssign(e),e.mulAssign(i),a.mulAssign(s)});const d=t.sub(u),f=d.greaterThan(.001);return ae(f,ae(r.equal(1),(()=>{const o=Ue(n.mul(a)),m=l.add(o.mul(e)),S=c.add(e),x=l.div(c).mul(.5).add(.5),y=m.div(S).mul(.5).add(.5);return we(x,y,d)})(),(()=>{const o=Ue(n.mul(a)),m=l.add(o.mul(e));return we(l,m,d)})()),ae(r.equal(1),l.div(c).mul(.5).add(.5),l))}),Ui=$(([n,t])=>{const i=n.mul(se(1,1,0)).length();return Ve(i,0,1,0,t,!0)}),_e=$(([n,t,i,s])=>{const r=se(i,i,s).mul(n),a=Ni(r.mul(1.6*1.5),N(1),N(.5),N(2),ln(1)).sub(.5).mul(t),e=n.mul(se(1,1,0)),c=e.normalize();return a.mul(c).add(e)}),Hi=$(([n,t,i,s,r,a])=>{const e=pn(n.mul(r),N(1),N(.5),N(1),ln(1)).mul(s).add(n).mul(t).fract().mul(a),c=cn(Ve(e,0,i,0,1,Ee(!0)),Ve(e,i,1,1,0,Ee(!0))),l=ht(on.length().div(10),1);return Xn(l.negate(),l,c.sub(.5)).mul(.5).add(.5)}),Yi=$(([n,t,i,s])=>{const r=Zn(Kn(n.y,n.x).div(wt).add(.5),0,1).mul(wt.mul(3)),a=se(r.sin(),i,r.cos().mul(t.z)),e=se(.1,1.19,.05).mul(a);return pn(e.mul(s),N(1),N(.5),N(2),Ee(!0))}),Xi=$(([n,t,i])=>{const s=_e(n.mul(t.div(50)),t.div(1e3),.1,1.77),r=ji(s.xy.mul(75),.5,1);return Ve(r,i,i.add(.21),0,1,Ee(!0))}),Zi=$(([n,t,i,s,r,a,e,c,l,u,d,f,o,m,S,x,y,v,g])=>{const w=Ui(n,t),b=_e(_e(n,w,i,s),r,a,.17),W=_e(b,e,c,.17),k=Hi(W.length(),N(1).div(l),u,d,f,o),I=Yi(W,n,W.length(),m),M=Xi(b,x,y.div(ht(on.length().mul(10),1))),C=we(v,g,k);return Bt(S,Bt(.407,C,M),I)}),Ki={teak:{transformationMatrix:new A().identity(),centerSize:1.11,largeWarpScale:.32,largeGrainStretch:.24,smallWarpStrength:.059,smallWarpScale:2,fineWarpStrength:.006,fineWarpScale:32.8,ringThickness:1/34,ringBias:.03,ringSizeVariance:.03,ringVarianceScale:4.4,barkThickness:.3,splotchScale:.2,splotchIntensity:.541,cellScale:910,cellSize:.1,darkGrainColor:"#0c0504",lightGrainColor:"#926c50"},walnut:{transformationMatrix:new A().identity(),centerSize:1.07,largeWarpScale:.42,largeGrainStretch:.34,smallWarpStrength:.016,smallWarpScale:10.3,fineWarpStrength:.028,fineWarpScale:12.7,ringThickness:1/32,ringBias:.08,ringSizeVariance:.03,ringVarianceScale:5.5,barkThickness:.98,splotchScale:1.84,splotchIntensity:.97,cellScale:710,cellSize:.31,darkGrainColor:"#311e13",lightGrainColor:"#523424"},white_oak:{transformationMatrix:new A().identity(),centerSize:1.23,largeWarpScale:.21,largeGrainStretch:.21,smallWarpStrength:.034,smallWarpScale:2.44,fineWarpStrength:.01,fineWarpScale:14.3,ringThickness:1/34,ringBias:.82,ringSizeVariance:.16,ringVarianceScale:1.4,barkThickness:.7,splotchScale:.2,splotchIntensity:.541,cellScale:800,cellSize:.28,darkGrainColor:"#8b4c21",lightGrainColor:"#c57e43"},pine:{transformationMatrix:new A().identity(),centerSize:1.23,largeWarpScale:.21,largeGrainStretch:.18,smallWarpStrength:.041,smallWarpScale:2.44,fineWarpStrength:.006,fineWarpScale:23.2,ringThickness:1/24,ringBias:.1,ringSizeVariance:.07,ringVarianceScale:5,barkThickness:.35,splotchScale:.51,splotchIntensity:3.32,cellScale:1480,cellSize:.07,darkGrainColor:"#c58355",lightGrainColor:"#d19d61"},poplar:{transformationMatrix:new A().identity(),centerSize:1.43,largeWarpScale:.33,largeGrainStretch:.18,smallWarpStrength:.04,smallWarpScale:4.3,fineWarpStrength:.004,fineWarpScale:33.6,ringThickness:1/37,ringBias:.07,ringSizeVariance:.03,ringVarianceScale:3.8,barkThickness:.3,splotchScale:1.92,splotchIntensity:.71,cellScale:830,cellSize:.04,darkGrainColor:"#716347",lightGrainColor:"#998966"},maple:{transformationMatrix:new A().identity(),centerSize:1.4,largeWarpScale:.38,largeGrainStretch:.25,smallWarpStrength:.067,smallWarpScale:2.5,fineWarpStrength:.005,fineWarpScale:33.6,ringThickness:1/35,ringBias:.1,ringSizeVariance:.07,ringVarianceScale:4.6,barkThickness:.61,splotchScale:.46,splotchIntensity:1.49,cellScale:800,cellSize:.03,darkGrainColor:"#b08969",lightGrainColor:"#bc9d7d"},red_oak:{transformationMatrix:new A().identity(),centerSize:1.21,largeWarpScale:.24,largeGrainStretch:.25,smallWarpStrength:.044,smallWarpScale:2.54,fineWarpStrength:.01,fineWarpScale:14.5,ringThickness:1/34,ringBias:.92,ringSizeVariance:.03,ringVarianceScale:5.6,barkThickness:1.01,splotchScale:.28,splotchIntensity:3.48,cellScale:800,cellSize:.25,darkGrainColor:"#af613b",lightGrainColor:"#e0a27a"},cherry:{transformationMatrix:new A().identity(),centerSize:1.33,largeWarpScale:.11,largeGrainStretch:.33,smallWarpStrength:.024,smallWarpScale:2.48,fineWarpStrength:.01,fineWarpScale:15.3,ringThickness:1/36,ringBias:.02,ringSizeVariance:.04,ringVarianceScale:6.5,barkThickness:.09,splotchScale:1.27,splotchIntensity:1.24,cellScale:1530,cellSize:.15,darkGrainColor:"#913f27",lightGrainColor:"#b45837"},cedar:{transformationMatrix:new A().identity(),centerSize:1.11,largeWarpScale:.39,largeGrainStretch:.12,smallWarpStrength:.061,smallWarpScale:1.9,fineWarpStrength:.006,fineWarpScale:4.8,ringThickness:1/25,ringBias:.01,ringSizeVariance:.07,ringVarianceScale:6.7,barkThickness:.1,splotchScale:.61,splotchIntensity:2.54,cellScale:630,cellSize:.19,darkGrainColor:"#9a5b49",lightGrainColor:"#ae745e"},mahogany:{transformationMatrix:new A().identity(),centerSize:1.25,largeWarpScale:.26,largeGrainStretch:.29,smallWarpStrength:.044,smallWarpScale:2.54,fineWarpStrength:.01,fineWarpScale:15.3,ringThickness:1/38,ringBias:.01,ringSizeVariance:.33,ringVarianceScale:1.2,barkThickness:.07,splotchScale:.77,splotchIntensity:1.39,cellScale:1400,cellSize:.23,darkGrainColor:"#501d12",lightGrainColor:"#6d3722"}},hn=["teak","walnut","white_oak","pine","poplar","maple","red_oak","cherry","cedar","mahogany"],fn=["raw","matte","semigloss","gloss"];function je(n,t){const i=Ki[n];let s,r,a;switch(t){case"gloss":a=.2,r=.1,s=1;break;case"semigloss":a=.4,r=.4,s=1;break;case"matte":a=.6,r=1,s=1;break;default:a=1,r=0,s=0}return{...i,transformationMatrix:new A().copy(i.transformationMatrix),genus:n,finish:t,clearcoat:s,clearcoatRoughness:r,clearcoatDarken:a}}const E=je(hn[0],fn[0]),R={};R.centerSize=j(E.centerSize).onObjectUpdate(({material:n})=>n.centerSize);R.largeWarpScale=j(E.largeWarpScale).onObjectUpdate(({material:n})=>n.largeWarpScale);R.largeGrainStretch=j(E.largeGrainStretch).onObjectUpdate(({material:n})=>n.largeGrainStretch);R.smallWarpStrength=j(E.smallWarpStrength).onObjectUpdate(({material:n})=>n.smallWarpStrength);R.smallWarpScale=j(E.smallWarpScale).onObjectUpdate(({material:n})=>n.smallWarpScale);R.fineWarpStrength=j(E.fineWarpStrength).onObjectUpdate(({material:n})=>n.fineWarpStrength);R.fineWarpScale=j(E.fineWarpScale).onObjectUpdate(({material:n})=>n.fineWarpScale);R.ringThickness=j(E.ringThickness).onObjectUpdate(({material:n})=>n.ringThickness);R.ringBias=j(E.ringBias).onObjectUpdate(({material:n})=>n.ringBias);R.ringSizeVariance=j(E.ringSizeVariance).onObjectUpdate(({material:n})=>n.ringSizeVariance);R.ringVarianceScale=j(E.ringVarianceScale).onObjectUpdate(({material:n})=>n.ringVarianceScale);R.barkThickness=j(E.barkThickness).onObjectUpdate(({material:n})=>n.barkThickness);R.splotchScale=j(E.splotchScale).onObjectUpdate(({material:n})=>n.splotchScale);R.splotchIntensity=j(E.splotchIntensity).onObjectUpdate(({material:n})=>n.splotchIntensity);R.cellScale=j(E.cellScale).onObjectUpdate(({material:n})=>n.cellScale);R.cellSize=j(E.cellSize).onObjectUpdate(({material:n})=>n.cellSize);R.darkGrainColor=j(new me(E.darkGrainColor)).onObjectUpdate(({material:n},t)=>t.value.set(n.darkGrainColor));R.lightGrainColor=j(new me(E.lightGrainColor)).onObjectUpdate(({material:n},t)=>t.value.set(n.lightGrainColor));R.transformationMatrix=j(new A().copy(E.transformationMatrix)).onObjectUpdate(({material:n})=>n.transformationMatrix);const qi=Zi(R.transformationMatrix.mul(Hn(Yn,1)).xyz,R.centerSize,R.largeWarpScale,R.largeGrainStretch,R.smallWarpStrength,R.smallWarpScale,R.fineWarpStrength,R.fineWarpScale,R.ringThickness,R.ringBias,R.ringSizeVariance,R.ringVarianceScale,R.barkThickness,R.splotchScale,R.splotchIntensity,R.cellScale,R.cellSize,R.darkGrainColor,R.lightGrainColor).mul(E.clearcoatDarken);class mt extends Dn{static get type(){return"WoodNodeMaterial"}constructor(t={}){super(),this.isWoodNodeMaterial=!0;const s={...je("teak","raw"),...t};for(const r in s)r==="genus"||r==="finish"||(typeof s[r]=="string"?this[r]=new me(s[r]):this[r]=s[r]);this.colorNode=qi,this.clearcoatNode=s.clearcoat,this.clearcoatRoughness=s.clearcoatRoughness}static fromPreset(t="teak",i="raw"){const s=je(t,i);return new mt(s)}}const $i=1e-4,gt="matte",xt="white_oak",Qi=[...fn],Ji=[...hn],mn=Object.freeze([0,0,0]),gn=Object.freeze([0,0,0]),xn=Object.freeze([1,1,1]),It=new pt;function _t(n){return`#${new me(n).getHexString()}`}function Xe(n,t){return Array.isArray(n)?n.map((i,s)=>Number.isFinite(i)?i:t[s]):t}function er({dimensions:n,grainOffset:t,grainRotation:i,grainScale:s}){const[r,a,e]=n.map(b=>Math.max(Math.abs(b)||0,$i)),[c,l,u]=Xe(t,mn),[d,f,o]=Xe(i,gn),[m,S,x]=Xe(s,xn),y=new A,v=new A,g=new A,w=new A;return It.set(V.degToRad(d),V.degToRad(f),V.degToRad(o)),y.makeTranslation(c,l,u),v.makeRotationFromEuler(It),g.makeScale(m/r,S/a,x/e),w.multiplyMatrices(y,v),w.multiply(g),w}function Sn(n=xt,t=gt){const i=je(n,t);return{barkThickness:i.barkThickness,cellScale:i.cellScale,cellSize:i.cellSize,centerSize:i.centerSize,clearcoat:i.clearcoat,clearcoatRoughness:i.clearcoatRoughness,darkGrainColor:_t(i.darkGrainColor),fineWarpScale:i.fineWarpScale,fineWarpStrength:i.fineWarpStrength,largeGrainStretch:i.largeGrainStretch,largeWarpScale:i.largeWarpScale,lightGrainColor:_t(i.lightGrainColor),ringBias:i.ringBias,ringSizeVariance:i.ringSizeVariance,ringThickness:i.ringThickness,ringVarianceScale:i.ringVarianceScale,smallWarpScale:i.smallWarpScale,smallWarpStrength:i.smallWarpStrength,splotchIntensity:i.splotchIntensity,splotchScale:i.splotchScale}}function Ft({barkThickness:n,cellScale:t,cellSize:i,centerSize:s,clearcoat:r,clearcoatRoughness:a,darkGrainColor:e,dimensions:c=[1,1,1],fallbackColor:l="#bca88c",fineWarpScale:u,fineWarpStrength:d,grainOffset:f=mn,grainRotation:o=gn,grainScale:m=xn,largeGrainStretch:S,largeWarpScale:x,lightGrainColor:y,metalness:v=0,ringBias:g,ringSizeVariance:w,ringThickness:b,ringVarianceScale:W,roughness:k=.78,smallWarpScale:I,smallWarpStrength:M,splotchIntensity:C,splotchScale:D}){const G=ne(H=>H.gl),U=G?.backend?.isWebGPUBackend===!0&&!!G?.backend?.device&&!!G?.backend?.context&&typeof navigator<"u"&&!!navigator.gpu,L=h.useMemo(()=>{if(!U)return null;const H=new mt({barkThickness:n,cellScale:t,cellSize:i,centerSize:s,clearcoat:r,clearcoatRoughness:a,darkGrainColor:e,fineWarpScale:u,fineWarpStrength:d,largeGrainStretch:S,largeWarpScale:x,lightGrainColor:y,ringBias:g,ringSizeVariance:w,ringThickness:b,ringVarianceScale:W,smallWarpScale:I,smallWarpStrength:M,splotchIntensity:C,splotchScale:D,transformationMatrix:er({dimensions:c,grainOffset:f,grainRotation:o,grainScale:m})});return H.metalness=v,H.roughness=k,H},[n,t,i,s,r,a,e,c,u,d,f,o,m,S,x,y,v,g,w,b,W,k,I,M,C,D,U]);return h.useEffect(()=>()=>{L?.dispose()},[L]),!U||!L?p.jsx("meshStandardMaterial",{color:l,metalness:v,roughness:k}):p.jsx("primitive",{attach:"material",object:L})}function tr({collisionMeshesRef:n,table:t,tank:i}){const s=h.useMemo(()=>ft(i,t),[t.depth,t.legs?.depth,t.legs?.inset,t.legs?.width,t.position,t.thickness,t.width,i.depth,i.glassThickness,i.height,i.spillExtent,i.width]),r=h.useMemo(()=>({barkThickness:t.wood.barkThickness,cellScale:t.wood.cellScale,cellSize:t.wood.cellSize,centerSize:t.wood.centerSize,clearcoat:t.wood.clearcoat,clearcoatRoughness:t.wood.clearcoatRoughness,darkGrainColor:t.wood.darkGrainColor,fallbackColor:t.color,fineWarpScale:t.wood.fineWarpScale,fineWarpStrength:t.wood.fineWarpStrength,grainOffset:t.wood.grainOffset,grainRotation:t.wood.grainRotation,grainScale:t.wood.grainScale,largeGrainStretch:t.wood.largeGrainStretch,largeWarpScale:t.wood.largeWarpScale,lightGrainColor:t.wood.lightGrainColor,metalness:t.metalness,ringBias:t.wood.ringBias,ringSizeVariance:t.wood.ringSizeVariance,ringThickness:t.wood.ringThickness,ringVarianceScale:t.wood.ringVarianceScale,roughness:t.roughness,smallWarpScale:t.wood.smallWarpScale,smallWarpStrength:t.wood.smallWarpStrength,splotchIntensity:t.wood.splotchIntensity,splotchScale:t.wood.splotchScale}),[t.color,t.metalness,t.roughness,t.wood.barkThickness,t.wood.cellScale,t.wood.cellSize,t.wood.centerSize,t.wood.clearcoat,t.wood.clearcoatRoughness,t.wood.darkGrainColor,t.wood.fineWarpScale,t.wood.fineWarpStrength,t.wood.grainOffset,t.wood.grainRotation,t.wood.grainScale,t.wood.largeGrainStretch,t.wood.largeWarpScale,t.wood.lightGrainColor,t.wood.ringBias,t.wood.ringSizeVariance,t.wood.ringThickness,t.wood.ringVarianceScale,t.wood.smallWarpScale,t.wood.smallWarpStrength,t.wood.splotchIntensity,t.wood.splotchScale]);return p.jsxs(p.Fragment,{children:[p.jsxs(ke,{type:"fixed",colliders:!1,children:[p.jsx(ye,{args:s.topHalfExtents,position:s.topPosition,friction:1.25,restitution:.04}),s.legs.map(a=>p.jsx(ye,{args:a.halfExtents,position:a.position,friction:1.22,restitution:.03},a.key)),s.edgeColliders.map(a=>p.jsx(ye,{args:a.args,position:a.position,friction:1.28,restitution:.03},a.key))]}),p.jsxs("mesh",{ref:a=>{const e=n.current;if(e[0]=a,a){const c=a;c.userData={...c.userData,surfaceType:"table-top"}}},castShadow:!0,position:s.topPosition,receiveShadow:!0,children:[p.jsx("boxGeometry",{args:[s.width,s.thickness,s.depth]}),p.jsx(Ft,{...r,dimensions:[s.width,s.thickness,s.depth]})]}),s.legs.map((a,e)=>p.jsxs("mesh",{ref:c=>{const l=n.current;if(l[e+1]=c,c){const u=c;u.userData={...u.userData,surfaceType:"table-leg"}}},castShadow:!0,position:a.position,receiveShadow:!0,children:[p.jsx("boxGeometry",{args:a.size}),p.jsx(Ft,{...r,dimensions:a.size})]},a.key))]})}const Ze=1.35,nr=18,lt=[0,nr,8,4],ir=.95,rr=.85,ar=.025,sr=.1,Ke=8,or=1.4,lr=0,cr=1,qe=.002,ur=.08,Gt=6e-4,We=new B,De=new B,Re=new B,J=new B,Lt=new B,Ot=new Pe,dr=new B,Et=new B,At=new Pe,Ce=new pt,Vt=new B,jt=new Pe,ze=new B,pr=Object.freeze([1,1,1]),hr=Object.freeze([0,0,0]),fr=Object.freeze([0,0,0]),Nt=Gn(cr,[lr]),mr=ie.memo(function({fragment:t,fragmentObjectsRef:i,fragmentHandlesRef:s,onImpact:r,paneKey:a}){const e=h.useRef(null),c=i?.current??null;return h.useEffect(()=>()=>{t.mesh.geometry?.dispose?.()},[t.mesh]),h.useEffect(()=>{const l=e.current;l&&(l.setLinvel(t.linearVelocity,!0),l.setAngvel(t.angularVelocity,!0),l.wakeUp?.())},[t.angularVelocity,t.linearVelocity]),h.useEffect(()=>{const{mesh:l}=t,u=s.current;return u[t.key]={body:e.current,generation:t.generation,mesh:l},l.userData={...l.userData,fragmentKey:t.key,paneKey:a,surfaceType:"tank-pane-fragment",onProjectileImpact:r},c&&(c[t.key]=l),()=>{delete u[t.key],c&&delete c[t.key],delete l.userData.fragmentKey,delete l.userData.onProjectileImpact,delete l.userData.paneKey,delete l.userData.surfaceType}},[t.generation,t.key,t.mesh,s,c,r,a]),p.jsxs(ke,{ref:e,colliders:!1,position:t.position,rotation:t.rotation,friction:ir,restitution:sr,mass:ar,linearDamping:rr,angularDamping:or,canSleep:!0,ccd:!0,children:[p.jsx(ye,{args:t.colliderArgs,collisionGroups:Nt,position:t.colliderPosition,solverGroups:Nt}),p.jsx("primitive",{object:t.mesh,position:fr,rotation:hr,scale:t.scale??pr})]})});function gr(n){return lt[Math.min(n,lt.length-1)]}function xr(n,t,i){return n.worldToLocal(Et.copy(i)),n.getWorldQuaternion(Ot),t.getWorldQuaternion(jt),At.copy(Ot).invert().multiply(jt),Ce.setFromQuaternion(At),{position:Et.toArray(),rotation:[Ce.x,Ce.y,Ce.z],scale:t.scale.toArray()}}function Sr(n){n.computeBoundingBox(),n.boundingBox?.getSize(We);const t=[{axis:"x",size:We.x},{axis:"y",size:We.y},{axis:"z",size:We.z}].sort((i,s)=>i.size-s.size);return{impactRadius:Math.max(Math.min(t[1].size,t[2].size)*.18,ur),projectionAxis:t[0].axis}}function vr(n,t){const{geometry:i}=n,s=Math.abs(t?.[0]??1),r=Math.abs(t?.[1]??1),a=Math.abs(t?.[2]??1);return i.computeBoundingBox(),i.boundingBox?.getCenter(De),i.boundingBox?.getSize(Re),{colliderArgs:[Math.max(Re.x*s*.5,qe),Math.max(Re.y*r*.5,qe),Math.max(Re.z*a*.5,qe)],colliderPosition:[De.x*s,De.y*r,De.z*a]}}function br(n){n.position.set(0,0,0),n.rotation.set(0,0,0),n.scale.set(1,1,1),n.updateMatrix(),n.updateMatrixWorld(!0)}function yr({assetGroup:n,fallbackWorldPoint:t,fragmentMesh:i,generation:s,impactWorldPoint:r,inheritedAngularVelocity:a,inheritedLinearVelocity:e,sourceMesh:c}){const l=i;l.castShadow=!0,l.receiveShadow=!0,l.updateWorldMatrix(!0,!1),l.getWorldPosition(ze),J.copy(ze).sub(r),J.lengthSq()<=Gt&&J.copy(ze).sub(t),J.lengthSq()<=Gt&&J.set(V.randFloatSpread(.2),1,V.randFloatSpread(.2)),J.normalize();const u=xr(n,c,ze),d=vr(l,u.scale);return br(l),{angularVelocity:{x:(a?.x??0)+V.randFloatSpread(Ke),y:(a?.y??0)+V.randFloatSpread(Ke),z:(a?.z??0)+V.randFloatSpread(Ke)},generation:s,key:l.uuid,linearVelocity:{x:(e?.x??0)+J.x*Ze*V.randFloat(.75,1.35),y:(e?.y??0)+J.y*Ze*V.randFloat(.75,1.35)+V.randFloat(.25,.6),z:(e?.z??0)+J.z*Ze*V.randFloat(.75,1.35)},mesh:l,colliderArgs:d.colliderArgs,colliderPosition:d.colliderPosition,position:u.position,rotation:u.rotation,scale:u.scale}}function wr({assetGroupRef:n,fragmentObjectsRef:t,geometry:i,material:s,paneKey:r,paneProps:a,runtime:e,tank:c}){const l=h.useRef({}),u=h.useRef(0),d=h.useRef([]),[f,o]=h.useState([]),m=h.useMemo(()=>s.clone(),[s]),S=h.useMemo(()=>{const g=s.clone();return g.color&&g.color.offsetHSL(0,0,.08),typeof g.opacity=="number"&&(g.opacity=Math.min(c.glassOpacity+.22,.5),g.transparent=!0),typeof g.roughness=="number"&&(g.roughness=Math.min(g.roughness+.16,1)),typeof g.metalness=="number"&&(g.metalness=.02),g.side=dt,g},[s,c.glassOpacity]),x=h.useMemo(()=>{const g=new $n(i.clone(),m,S);return g.castShadow=!0,g.receiveShadow=!0,g},[i,S,m]);h.useEffect(()=>{const g=a?.ref;return g?.(x),()=>{g?.(null),x.geometry?.dispose?.(),m.dispose(),S.dispose()}},[x,S,m,a]);const y=ie.useCallback(({inheritedAngularVelocity:g=null,inheritedLinearVelocity:w=null,sourceGeneration:b,sourceMesh:W,worldPoint:k})=>{const I=n.current;if(!I)return[];const M=b+1;if(M>=lt.length)return[];W.updateWorldMatrix(!0,!1),W.getWorldPosition(Vt);const C=Array.isArray(k)?Lt.fromArray(k):Lt.copy(k),D=W.worldToLocal(dr.copy(C)),G=Sr(W.geometry);return W.fracture(new Qn({fractureMethod:"voronoi",fragmentCount:gr(M),seed:(u.current+M)*101+r.length,voronoiOptions:{impactPoint:D,impactRadius:G.impactRadius,mode:"2.5D",projectionAxis:G.projectionAxis}})).map(L=>yr({assetGroup:I,fallbackWorldPoint:Vt,fragmentMesh:L,generation:M,impactWorldPoint:C,inheritedAngularVelocity:g,inheritedLinearVelocity:w,sourceMesh:W}))},[n,r]),v=h.useMemo(()=>(g,w)=>{const b=l.current[g];if(!b?.mesh)return;const W=y({inheritedAngularVelocity:b.body?.angvel?.()??null,inheritedLinearVelocity:b.body?.linvel?.()??null,sourceGeneration:b.generation,sourceMesh:b.mesh,worldPoint:w});W.length&&(b.mesh.visible=!1,o(k=>{const I=k.filter(M=>M.key!==g).concat(W);return d.current=I,I}))},[y]);return re(()=>{const g=e?.getPaneBreakEvent(r),w=g?.id??0,b=e?.isPaneBroken(r)??!1;if(!b&&(u.current||d.current.length)&&(u.current=0,d.current=[],l.current={},o([])),b&&w>u.current&&g?.worldPoint){u.current=w;const W=y({sourceGeneration:0,sourceMesh:x,worldPoint:g.worldPoint});d.current=W,o(W)}x.visible=!b}),p.jsxs(p.Fragment,{children:[p.jsx("primitive",{object:x}),f.map(g=>p.jsx(mr,{fragment:g,fragmentObjectsRef:t,fragmentHandlesRef:l,onImpact:w=>v(g.key,w),paneKey:r},g.key))]})}h.createContext();const Mr=["Object","Object1","Object2","Object3","Object4","Object5","Object6","Object7"],Pr=["Object_4","Object_10","Object_12","Object_20","Object_22","Object_32","Object_34","Object_36"],Fe=Mr.length;function kr({variant:n=0,...t}){const{nodes:i}=ge(fe("/rocks.glb")),s=(n%Fe+Fe)%Fe,r=i[Pr[s]];return r?p.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:r.geometry,material:r.material,...t}):null}ge.preload(fe("/rocks.glb"));const Ge=1e-4,Tr=he-12,Wr=.32,Dr=-60,Le=18,Rr=.9,Cr=1.8,zr=1.15,Br=1.15,Ir=.26,_r=.08,Fr=.14,$e=new B,te=new B,Ut=new B,Qe=new ut,le=new B,Ht=new B,Be=new B;function Gr(){return{active:!1,paneBroken:!1,previousWorldPosition:new B}}function vn(n){return[(n-(Le-1)/2)*Wr,Dr,0]}function Lr(n,t,i){if(!n.length)return null;$e.copy(i).sub(t);const s=$e.length();return s<=Ge?null:(Qe.set(t,$e.normalize()),Qe.far=s+Fr,Qe.intersectObjects(n,!1)[0]??null)}function bn(n,t){if(!n)return;const i=n;i.userData={...i.userData,isActiveThrowable:t}}function Oe(n,t){if(!n)return;const i=n,[s,r,a]=vn(t);i.setTranslation({x:s,y:r,z:a},!0),i.setRotation({x:0,y:0,z:0,w:1},!0),i.setLinvel({x:0,y:0,z:0},!0),i.setAngvel({x:0,y:0,z:0},!0),bn(i,!1),i.sleep?.()}const Or=ie.memo(function({bodyRefs:t,fluidObjectsRef:i,meshRefs:s,parkedPosition:r,rocks:a,slotIndex:e,variant:c}){const l=t.current,u=i?.current??null,d=s.current;return p.jsx(ke,{ref:f=>{if(l[e]=f,f&&!f.userData?.pooledRockInitialized){const o=f;Oe(o,e),o.userData={...o.userData,pooledRockInitialized:!0}}},angularDamping:Cr,canSleep:!0,ccd:!0,colliders:"hull",friction:zr,linearDamping:Br,mass:Ir,position:r,restitution:_r,children:p.jsx("group",{ref:f=>{d[e]=f,u&&(u[e]=f)},children:p.jsx(kr,{scale:a.scale,variant:c})})})}),yn=ie.forwardRef(function({collisionObjectsRef:t,fluidObjectsRef:i,onImpact:s,rocks:r,runtime:a},e){const{camera:c}=ne(),l=h.useRef([]),u=h.useRef(Array.from({length:Le},Gr)),d=h.useRef(a?.getResetNonce?.()??0),f=h.useRef(null),o=h.useRef([]),m=h.useRef(0),S=h.useMemo(()=>Array.from({length:Le},(x,y)=>({parkedPosition:vn(y),slotId:`tank-rock-body-${y}`,variant:y%Fe})),[]);return h.useImperativeHandle(e,()=>({launch({targetWorldPoint:x}){if(!f.current)return!1;const y=m.current,v=l.current[y],g=u.current[y];if(m.current=(y+1)%Le,!v||(c.getWorldDirection(te),le.copy(c.position).addScaledVector(te,Rr),Ht.copy(x),te.copy(Ht).sub(le),te.lengthSq()<=Ge))return!1;Oe(v,y),v.setTranslation({x:le.x,y:le.y,z:le.z},!0);const w=new pt(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI),b=new Pe().setFromEuler(w);return v.setRotation({x:b.x,y:b.y,z:b.z,w:b.w},!0),te.normalize().multiplyScalar(r.speed),v.setLinvel({x:te.x,y:te.y,z:te.z},!0),v.setAngvel({x:V.randFloatSpread(r.spin),y:V.randFloatSpread(r.spin),z:V.randFloatSpread(r.spin)},!0),bn(v,!0),v.wakeUp?.(),g.active=!0,g.paneBroken=!1,g.previousWorldPosition.copy(le),!0}}),[c,r.speed,r.spin]),re(()=>{const x=a?.getResetNonce?.()??0;x!==d.current&&(d.current=x,m.current=0,l.current.forEach((y,v)=>{Oe(y,v),u.current[v].active=!1,u.current[v].paneBroken=!1})),l.current.forEach((y,v)=>{const g=o.current[v],w=u.current[v];if(!(!y||!g||!w.active)){if(g.getWorldPosition(Be),!w.paneBroken&&Be.distanceToSquared(w.previousWorldPosition)>Ge*Ge){const b=Lr(t?.current??[],w.previousWorldPosition,Be),W=b?.object?.userData?.onProjectileImpact??null,k=b?.object?.userData?.paneKey??null,I=b?.object?.userData?.surfaceType??null;I==="tank-pane"&&k&&!a?.isPaneBroken?.(k)?(b.object.worldToLocal(Ut.copy(b.point)),s?.(k,{localPoint:Ut.clone(),worldPoint:b.point.clone()}),w.paneBroken=!0):I==="tank-pane-fragment"&&typeof W=="function"&&(W(b.point.clone()),w.paneBroken=!0)}w.previousWorldPosition.copy(Be),y.translation().y<Tr&&(Oe(y,v),w.active=!1,w.paneBroken=!1)}})}),p.jsx("group",{ref:f,children:S.map(({parkedPosition:x,slotId:y,variant:v},g)=>p.jsx(Or,{bodyRefs:l,fluidObjectsRef:i,meshRefs:o,parkedPosition:x,rocks:r,slotIndex:g,variant:v},y))})});yn.displayName="RockProjectiles";const Er=`struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) viewPosition: vec3f,
}

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) viewPosition: vec3f,
}

struct FragmentOutput {
    @location(0) depth: f32,
    @builtin(frag_depth) fragDepth: f32,
}

struct RenderUniforms {
    texelSize: vec2f,
    sphereSize: f32,
    _padding0: f32,
    projectionMatrix: mat4x4f,
    invProjectionMatrix: mat4x4f,
    viewMatrix: mat4x4f,
    invViewMatrix: mat4x4f,
    modelMatrix: mat4x4f,
}

struct PosVel {
    position: vec3f,
    v: vec3f,
}

@group(0) @binding(0) var<storage> particles: array<PosVel>;
@group(0) @binding(1) var<uniform> uniforms: RenderUniforms;

@vertex
fn vs(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
    let corners = array(
        vec2f(0.5, 0.5),
        vec2f(0.5, -0.5),
        vec2f(-0.5, -0.5),
        vec2f(0.5, 0.5),
        vec2f(-0.5, -0.5),
        vec2f(-0.5, 0.5),
    );
    let corner = vec3f(corners[vertexIndex] * uniforms.sphereSize, 0.0);
    let localPosition = (uniforms.modelMatrix * vec4f(particles[instanceIndex].position, 1.0)).xyz;
    let viewPosition = (uniforms.viewMatrix * vec4f(localPosition, 1.0)).xyz;
    let outputPosition = uniforms.projectionMatrix * vec4f(viewPosition + corner, 1.0);

    return VertexOutput(outputPosition, corners[vertexIndex] + 0.5, viewPosition);
}

@fragment
fn fs(input: FragmentInput) -> FragmentOutput {
    var out: FragmentOutput;
    let normalXY = input.uv * 2.0 - 1.0;
    let r2 = dot(normalXY, normalXY);

    if (r2 > 1.0) {
        discard;
    }

    let normal = vec3f(normalXY, sqrt(1.0 - r2));
    let radius = uniforms.sphereSize * 0.5;
    let realViewPos = vec4f(input.viewPosition + normal * radius, 1.0);
    let clipSpacePos = uniforms.projectionMatrix * realViewPos;

    out.fragDepth = clipSpacePos.z / clipSpacePos.w;
    out.depth = realViewPos.z;

    return out;
}
`,Ar=`@group(0) @binding(0) var textureSampler: sampler;
@group(0) @binding(1) var depthTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uniforms: RenderUniforms;
@group(0) @binding(3) var thicknessTexture: texture_2d<f32>;
@group(0) @binding(4) var backgroundTexture: texture_2d<f32>;
@group(0) @binding(5) var<uniform> fluidParams: vec4f;
@group(0) @binding(6) var sceneDepthTexture: texture_depth_2d;

struct RenderUniforms {
    texelSize: vec2f,
    sphereSize: f32,
    _padding0: f32,
    projectionMatrix: mat4x4f,
    invProjectionMatrix: mat4x4f,
    viewMatrix: mat4x4f,
    invViewMatrix: mat4x4f,
    modelMatrix: mat4x4f,
}

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) iuv: vec2f,
}

fn clampDepthCoord(coord: vec2f) -> vec2u {
    let dims = vec2f(textureDimensions(depthTexture));

    return vec2u(clamp(coord, vec2f(0.0), dims - vec2f(1.0)));
}

fn clampSceneDepthCoord(coord: vec2f) -> vec2u {
    let dims = vec2f(textureDimensions(sceneDepthTexture));

    return vec2u(clamp(coord, vec2f(0.0), dims - vec2f(1.0)));
}

fn computeViewPosFromUVDepth(texCoord: vec2f, depth: f32) -> vec3f {
    var ndc = vec4f(texCoord.x * 2.0 - 1.0, 1.0 - texCoord.y * 2.0, 0.0, 1.0);

    ndc.z = -uniforms.projectionMatrix[2].z + uniforms.projectionMatrix[3].z / depth;
    ndc.w = 1.0;

    let eyePos = uniforms.invProjectionMatrix * ndc;

    return eyePos.xyz / eyePos.w;
}

fn computeViewPosFromSceneDepth(texCoord: vec2f, depth: f32) -> vec3f {
    let ndc = vec4f(texCoord.x * 2.0 - 1.0, 1.0 - texCoord.y * 2.0, depth, 1.0);
    let eyePos = uniforms.invProjectionMatrix * ndc;

    return eyePos.xyz / eyePos.w;
}

fn sampleDepth(coord: vec2f) -> f32 {
    return abs(textureLoad(depthTexture, clampDepthCoord(coord), 0).x);
}

fn sampleSceneDepth(coord: vec2f) -> f32 {
    return textureLoad(sceneDepthTexture, clampSceneDepthCoord(coord), 0);
}

fn sampleViewPos(uv: vec2f, iuv: vec2f) -> vec3f {
    return computeViewPosFromUVDepth(uv, sampleDepth(iuv));
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    let depth = sampleDepth(input.iuv);
    let sceneDepth = sampleSceneDepth(input.iuv);
    let background = textureSampleLevel(backgroundTexture, textureSampler, input.uv, 0.0).rgb;
    let thickness = max(textureSampleLevel(thicknessTexture, textureSampler, input.uv, 0.0).r, 0.0);

    if (depth >= 1e4) {
        return vec4f(background, 1.0);
    }

    if (sceneDepth < 0.999999) {
        let sceneSurfacePosView = computeViewPosFromSceneDepth(input.uv, sceneDepth);
        let sceneViewDepth = abs(sceneSurfacePosView.z);
        let occlusionBias = max(uniforms.sphereSize * 0.1, 0.01);

        if (sceneViewDepth + occlusionBias < depth) {
            return vec4f(background, 1.0);
        }
    }

    let surfacePosView = computeViewPosFromUVDepth(input.uv, depth);
    var ddx = sampleViewPos(
        input.uv + vec2f(uniforms.texelSize.x, 0.0),
        input.iuv + vec2f(1.0, 0.0)
    ) - surfacePosView;
    var ddy = sampleViewPos(
        input.uv + vec2f(0.0, uniforms.texelSize.y),
        input.iuv + vec2f(0.0, 1.0)
    ) - surfacePosView;
    let ddx2 = surfacePosView - sampleViewPos(
        input.uv - vec2f(uniforms.texelSize.x, 0.0),
        input.iuv - vec2f(1.0, 0.0)
    );
    let ddy2 = surfacePosView - sampleViewPos(
        input.uv - vec2f(0.0, uniforms.texelSize.y),
        input.iuv - vec2f(0.0, 1.0)
    );

    ddx = select(ddx, ddx2, abs(ddx.z) > abs(ddx2.z));
    ddy = select(ddy, ddy2, abs(ddy.z) > abs(ddy2.z));

    let normal = -normalize(cross(ddx, ddy));
    let viewDir = normalize(-surfacePosView);
    let refractionOffset = normal.xy * (0.022 + clamp(thickness * 0.18, 0.0, 0.04));
    let refractedUv = clamp(input.uv + refractionOffset, vec2f(0.0), vec2f(1.0));
    let refractedBackground = textureSampleLevel(backgroundTexture, textureSampler, refractedUv, 0.0).rgb;
    let absorption = exp(-fluidParams.a * thickness * (vec3f(1.0) - fluidParams.rgb));
    let refractedColor = refractedBackground * absorption + fluidParams.rgb * (1.0 - absorption) * 0.35;
    let fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 5.0);
    let lightDir = normalize(vec3f(-0.3, 0.65, 0.7));
    let specular = pow(max(dot(normal, lightDir), 0.0), 80.0) * 0.08;
    let reflectedColor = mix(refractedBackground, vec3f(1.0), 0.1);
    let finalColor = mix(refractedColor, reflectedColor, 0.18 + fresnel * 0.42) + specular;

    return vec4f(clamp(finalColor, vec3f(0.0), vec3f(1.0)), 1.0);
}
`,Vr=`struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) iuv: vec2f,
}

override screenWidth: f32;
override screenHeight: f32;

@vertex
fn vs(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    var out: VertexOutput;
    let positions = array(
        vec2f(1.0, 1.0),
        vec2f(1.0, -1.0),
        vec2f(-1.0, -1.0),
        vec2f(1.0, 1.0),
        vec2f(-1.0, -1.0),
        vec2f(-1.0, 1.0),
    );
    let uvs = array(
        vec2f(1.0, 0.0),
        vec2f(1.0, 1.0),
        vec2f(0.0, 1.0),
        vec2f(1.0, 0.0),
        vec2f(0.0, 1.0),
        vec2f(0.0, 0.0),
    );

    out.position = vec4f(positions[vertexIndex], 0.0, 1.0);
    out.uv = uvs[vertexIndex];
    out.iuv = out.uv * vec2f(screenWidth, screenHeight);

    return out;
}
`,jr=`@group(0) @binding(0) var textureSampler: sampler;
@group(0) @binding(1) var sourceTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uniforms: FilterUniforms;
@group(0) @binding(3) var<uniform> filterSize: i32;

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) iuv: vec2f,
}

struct FilterUniforms {
    blurDir: vec2f,
}

override thicknessTextureWidth: f32;
override thicknessTextureHeight: f32;

fn clampCoord(coord: vec2f) -> vec2u {
    let dims = vec2f(textureDimensions(sourceTexture));

    return vec2u(clamp(coord, vec2f(0.0), dims - vec2f(1.0)));
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    let baseThickness = textureSample(sourceTexture, textureSampler, input.uv).r;

    if (baseThickness == 0.0) {
        return vec4f(0.0, 0.0, 0.0, 1.0);
    }

    let sigma = f32(filterSize) / 3.0;
    let sigmaSquareInv = 1.0 / (2.0 * sigma * sigma);
    let iuv = vec2f(thicknessTextureWidth, thicknessTextureHeight) * input.uv;
    var sum = baseThickness;
    var wsum = 1.0;

    for (var x = 1; x <= filterSize; x = x + 1) {
        let weight = exp(-f32(x * x) * sigmaSquareInv);
        let coords = vec2f(f32(x));
        let sampledLeft = textureLoad(sourceTexture, clampCoord(iuv - uniforms.blurDir * coords), 0).r;
        let sampledRight = textureLoad(sourceTexture, clampCoord(iuv + uniforms.blurDir * coords), 0).r;

        sum = sum + (sampledLeft + sampledRight) * weight;
        wsum = wsum + 2.0 * weight;
    }

    return vec4f(sum / wsum, 0.0, 0.0, 1.0);
}
`,Nr=`@group(0) @binding(1) var depthTexture: texture_2d<f32>;
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
`,Ur=`struct RenderUniforms {
    texelSize: vec2f,
    sphereSize: f32,
    _padding0: f32,
    projectionMatrix: mat4x4f,
    invProjectionMatrix: mat4x4f,
    viewMatrix: mat4x4f,
    invViewMatrix: mat4x4f,
    modelMatrix: mat4x4f,
}

struct PosVel {
    position: vec3f,
    v: vec3f,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) speed: f32,
    @location(2) viewPosition: vec3f,
}

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) speed: f32,
    @location(2) viewPosition: vec3f,
}

struct FragmentOutput {
    @location(0) color: vec4f,
    @builtin(frag_depth) fragDepth: f32,
}

@group(0) @binding(0) var<storage> particles: array<PosVel>;
@group(0) @binding(1) var<uniform> uniforms: RenderUniforms;

@vertex
fn vs(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
    let corners = array(
        vec2f(0.5, 0.5),
        vec2f(0.5, -0.5),
        vec2f(-0.5, -0.5),
        vec2f(0.5, 0.5),
        vec2f(-0.5, -0.5),
        vec2f(-0.5, 0.5),
    );
    let corner = vec3f(corners[vertexIndex] * uniforms.sphereSize, 0.0);
    let localPosition = (uniforms.modelMatrix * vec4f(particles[instanceIndex].position, 1.0)).xyz;
    let viewPosition = (uniforms.viewMatrix * vec4f(localPosition, 1.0)).xyz;
    let outputPosition = uniforms.projectionMatrix * vec4f(viewPosition + corner, 1.0);
    let speed = length(particles[instanceIndex].v);

    return VertexOutput(outputPosition, corners[vertexIndex] + 0.5, speed, viewPosition);
}

@fragment
fn fs(input: FragmentInput) -> FragmentOutput {
    var out: FragmentOutput;
    let normalXY = input.uv * 2.0 - 1.0;
    let r2 = dot(normalXY, normalXY);

    if (r2 > 1.0) {
        discard;
    }

    let normal = vec3f(normalXY, sqrt(1.0 - r2));
    let radius = uniforms.sphereSize * 0.5;
    let realViewPos = vec4f(input.viewPosition + normal * radius, 1.0);
    let clipSpacePos = uniforms.projectionMatrix * realViewPos;
    let speedTint = clamp(input.speed * 0.08, 0.0, 1.0);
    let slowColor = vec3f(0.28, 0.72, 1.0);
    let fastColor = vec3f(1.0, 0.92, 0.62);
    let color = mix(slowColor, fastColor, speedTint) * (0.45 + 0.55 * normal.z);

    out.fragDepth = clipSpacePos.z / clipSpacePos.w;
    out.color = vec4f(color, 1.0);

    return out;
}
`,Hr=`struct RenderUniforms {
    texelSize: vec2f,
    sphereSize: f32,
    _padding0: f32,
    projectionMatrix: mat4x4f,
    invProjectionMatrix: mat4x4f,
    viewMatrix: mat4x4f,
    invViewMatrix: mat4x4f,
    modelMatrix: mat4x4f,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
}

struct FragmentInput {
    @location(0) uv: vec2f,
}

struct PosVel {
    position: vec3f,
    v: vec3f,
}

@group(0) @binding(0) var<storage> particles: array<PosVel>;
@group(0) @binding(1) var<uniform> uniforms: RenderUniforms;

@vertex
fn vs(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
    let corners = array(
        vec2f(0.5, 0.5),
        vec2f(0.5, -0.5),
        vec2f(-0.5, -0.5),
        vec2f(0.5, 0.5),
        vec2f(-0.5, -0.5),
        vec2f(-0.5, 0.5),
    );
    let corner = vec3f(corners[vertexIndex] * uniforms.sphereSize, 0.0);
    let localPosition = (uniforms.modelMatrix * vec4f(particles[instanceIndex].position, 1.0)).xyz;
    let viewPosition = (uniforms.viewMatrix * vec4f(localPosition, 1.0)).xyz;
    let outputPosition = uniforms.projectionMatrix * vec4f(viewPosition + corner, 1.0);

    return VertexOutput(outputPosition, corners[vertexIndex] + 0.5);
}

@fragment
fn fs(input: FragmentInput) -> @location(0) vec4f {
    let normalXY = input.uv * 2.0 - 1.0;
    let r2 = dot(normalXY, normalXY);

    if (r2 > 1.0) {
        discard;
    }

    let thickness = sqrt(1.0 - r2);

    return vec4f(vec3f(0.05 * thickness), 1.0);
}
`,Yr=16,Yt=8,Xr=4,Xt=336;function Zr(n){return{invProjectionMatrix:new Float32Array(n,80,16),invViewMatrix:new Float32Array(n,208,16),modelMatrix:new Float32Array(n,272,16),projectionMatrix:new Float32Array(n,16,16),sphereSize:new Float32Array(n,8,2),texelSize:new Float32Array(n,0,2),viewMatrix:new Float32Array(n,144,16)}}class Kr{constructor({device:t,format:i,particleDiameter:s,posvelBuffer:r,sceneDepthTexture:a,width:e,height:c,fovRadians:l}){this.device=t,this.format=i,this.particleDiameter=s,this.posvelBuffer=r,this.sceneDepthTexture=a,this.fovRadians=l,this.renderValues=new ArrayBuffer(Xt),this.renderViews=Zr(this.renderValues),this.renderUniformBuffer=t.createBuffer({label:"fish-tank-splash-render-uniforms",size:Xt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.fluidParamsBuffer=t.createBuffer({label:"fish-tank-splash-fluid-params",size:Yr,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.filterXBuffer=t.createBuffer({label:"fish-tank-splash-filter-x",size:Yt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.filterYBuffer=t.createBuffer({label:"fish-tank-splash-filter-y",size:Yt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.thicknessFilterSizeBuffer=t.createBuffer({label:"fish-tank-splash-thickness-filter-size",size:Xr,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.filterXBuffer,0,new Float32Array([1,0])),this.device.queue.writeBuffer(this.filterYBuffer,0,new Float32Array([0,1])),this.device.queue.writeBuffer(this.thicknessFilterSizeBuffer,0,new Int32Array([15])),this.fullScreenModule=t.createShaderModule({code:Vr}),this.depthMapModule=t.createShaderModule({code:Er}),this.thicknessMapModule=t.createShaderModule({code:Hr}),this.depthFilterModule=t.createShaderModule({code:Nr}),this.gaussianModule=t.createShaderModule({code:jr}),this.fluidModule=t.createShaderModule({code:Ar}),this.sphereModule=t.createShaderModule({code:Ur}),this.sceneDepthTextureView=a.createView({aspect:"depth-only"}),this.sampler=t.createSampler({magFilter:"linear",minFilter:"linear"}),this.resize(e,c)}createPipelines(){const t=Math.max(1,Math.round(this.width/2)),i=Math.max(1,Math.round(this.height/2)),s=12,r={screenHeight:this.height,screenWidth:this.width},a={maxFilterSize:50,projectedParticleConstant:s*this.particleDiameter*.05*(this.height/2)/Math.max(Math.tan(this.fovRadians/2),.001)};this.depthMapPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-depth-map",layout:"auto",vertex:{module:this.depthMapModule},fragment:{module:this.depthMapModule,targets:[{format:"r32float"}]},primitive:{topology:"triangle-list"},depthStencil:{depthCompare:"less",depthWriteEnabled:!0,format:"depth32float"}}),this.spherePipeline=this.device.createRenderPipeline({label:"fish-tank-splash-sphere",layout:"auto",vertex:{module:this.sphereModule},fragment:{module:this.sphereModule,targets:[{format:this.format}]},primitive:{topology:"triangle-list"},depthStencil:{depthCompare:"less",depthWriteEnabled:!0,format:"depth32float"}}),this.depthFilter1DPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-depth-filter-1d",layout:"auto",vertex:{module:this.fullScreenModule,constants:r},fragment:{module:this.depthFilterModule,constants:{...a,blur2D:0},targets:[{format:"r32float"}]},primitive:{topology:"triangle-list"}}),this.depthFilter2DPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-depth-filter-2d",layout:"auto",vertex:{module:this.fullScreenModule,constants:r},fragment:{module:this.depthFilterModule,constants:{...a,blur2D:1},targets:[{format:"r32float"}]},primitive:{topology:"triangle-list"}}),this.thicknessMapPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-thickness-map",layout:"auto",vertex:{module:this.thicknessMapModule},fragment:{module:this.thicknessMapModule,targets:[{blend:{alpha:{dstFactor:"one",operation:"add",srcFactor:"one"},color:{dstFactor:"one",operation:"add",srcFactor:"one"}},format:"r16float",writeMask:GPUColorWrite.RED}]},primitive:{topology:"triangle-list"}}),this.thicknessFilterPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-thickness-filter",layout:"auto",vertex:{module:this.fullScreenModule,constants:r},fragment:{module:this.gaussianModule,constants:{thicknessTextureHeight:i,thicknessTextureWidth:t},targets:[{format:"r16float"}]},primitive:{topology:"triangle-list"}}),this.fluidPipeline=this.device.createRenderPipeline({label:"fish-tank-splash-fluid",layout:"auto",vertex:{module:this.fullScreenModule,constants:r},fragment:{module:this.fluidModule,targets:[{format:this.format}]},primitive:{topology:"triangle-list"}})}createTextures(){const t=Math.max(1,Math.round(this.width/2)),i=Math.max(1,Math.round(this.height/2));this.depthMapTexture=this.device.createTexture({label:"fish-tank-splash-depth-map-texture",size:[this.width,this.height,1],usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,format:"r32float"}),this.tmpDepthMapTexture=this.device.createTexture({label:"fish-tank-splash-depth-map-texture-tmp",size:[this.width,this.height,1],usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,format:"r32float"}),this.thicknessTexture=this.device.createTexture({label:"fish-tank-splash-thickness-texture",size:[t,i,1],usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,format:"r16float"}),this.tmpThicknessTexture=this.device.createTexture({label:"fish-tank-splash-thickness-texture-tmp",size:[t,i,1],usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,format:"r16float"}),this.depthTestTexture=this.device.createTexture({label:"fish-tank-splash-depth-test",size:[this.width,this.height,1],usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING,format:"depth32float"}),this.backgroundTexture=this.device.createTexture({label:"fish-tank-splash-background",size:[this.width,this.height,1],usage:GPUTextureUsage.COPY_DST|GPUTextureUsage.TEXTURE_BINDING,format:this.format}),this.depthMapTextureView=this.depthMapTexture.createView(),this.tmpDepthMapTextureView=this.tmpDepthMapTexture.createView(),this.thicknessTextureView=this.thicknessTexture.createView(),this.tmpThicknessTextureView=this.tmpThicknessTexture.createView(),this.depthTestTextureView=this.depthTestTexture.createView(),this.backgroundTextureView=this.backgroundTexture.createView()}createBindGroups(){this.depthMapBindGroup=this.device.createBindGroup({layout:this.depthMapPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.posvelBuffer}},{binding:1,resource:{buffer:this.renderUniformBuffer}}]}),this.thicknessMapBindGroup=this.device.createBindGroup({layout:this.thicknessMapPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.posvelBuffer}},{binding:1,resource:{buffer:this.renderUniformBuffer}}]}),this.sphereBindGroup=this.device.createBindGroup({layout:this.spherePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.posvelBuffer}},{binding:1,resource:{buffer:this.renderUniformBuffer}}]}),this.depthFilterBindGroups=[this.device.createBindGroup({layout:this.depthFilter1DPipeline.getBindGroupLayout(0),entries:[{binding:1,resource:this.depthMapTextureView},{binding:2,resource:{buffer:this.filterXBuffer}}]}),this.device.createBindGroup({layout:this.depthFilter1DPipeline.getBindGroupLayout(0),entries:[{binding:1,resource:this.tmpDepthMapTextureView},{binding:2,resource:{buffer:this.filterYBuffer}}]}),this.device.createBindGroup({layout:this.depthFilter2DPipeline.getBindGroupLayout(0),entries:[{binding:1,resource:this.depthMapTextureView},{binding:2,resource:{buffer:this.filterXBuffer}}]}),this.device.createBindGroup({layout:this.depthFilter2DPipeline.getBindGroupLayout(0),entries:[{binding:1,resource:this.tmpDepthMapTextureView},{binding:2,resource:{buffer:this.filterYBuffer}}]})],this.thicknessFilterBindGroups=[this.device.createBindGroup({layout:this.thicknessFilterPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:this.sampler},{binding:1,resource:this.thicknessTextureView},{binding:2,resource:{buffer:this.filterXBuffer}},{binding:3,resource:{buffer:this.thicknessFilterSizeBuffer}}]}),this.device.createBindGroup({layout:this.thicknessFilterPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:this.sampler},{binding:1,resource:this.tmpThicknessTextureView},{binding:2,resource:{buffer:this.filterYBuffer}},{binding:3,resource:{buffer:this.thicknessFilterSizeBuffer}}]})],this.fluidBindGroup=this.device.createBindGroup({layout:this.fluidPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:this.sampler},{binding:1,resource:this.depthMapTextureView},{binding:2,resource:{buffer:this.renderUniformBuffer}},{binding:3,resource:this.thicknessTextureView},{binding:4,resource:this.backgroundTextureView},{binding:5,resource:{buffer:this.fluidParamsBuffer}},{binding:6,resource:this.sceneDepthTextureView}]})}resize(t,i){this.width===t&&this.height===i||(this.destroyTextures(),this.width=t,this.height=i,this.createPipelines(),this.createTextures(),this.createBindGroups())}destroyTextures(){this.backgroundTexture?.destroy?.(),this.depthMapTexture?.destroy?.(),this.depthTestTexture?.destroy?.(),this.thicknessTexture?.destroy?.(),this.tmpDepthMapTexture?.destroy?.(),this.tmpThicknessTexture?.destroy?.()}update({camera:t,density:i,fluidColor:s,modelMatrix:r,sphereSize:a}){t.updateMatrixWorld(),this.renderViews.texelSize.set([1/this.width,1/this.height]),this.renderViews.sphereSize.set([a,0]),this.renderViews.projectionMatrix.set(t.projectionMatrix.elements),this.renderViews.invProjectionMatrix.set(t.projectionMatrixInverse.elements),this.renderViews.viewMatrix.set(t.matrixWorldInverse.elements),this.renderViews.invViewMatrix.set(t.matrixWorld.elements),this.renderViews.modelMatrix.set(r.elements),this.device.queue.writeBuffer(this.renderUniformBuffer,0,this.renderValues),this.device.queue.writeBuffer(this.fluidParamsBuffer,0,new Float32Array([s[0],s[1],s[2],i]))}copyBackground(t,i){t.copyTextureToTexture({texture:i},{texture:this.backgroundTexture},[this.width,this.height,1])}render(t,i,s,{showParticles:r=!1}={}){if(r){const o=t.beginRenderPass({colorAttachments:[{loadOp:"load",storeOp:"store",view:i}],depthStencilAttachment:{depthClearValue:1,depthLoadOp:"load",depthStoreOp:"store",view:this.sceneDepthTextureView},label:"fish-tank-splash-sphere-pass"});o.setBindGroup(0,this.sphereBindGroup),o.setPipeline(this.spherePipeline),o.draw(6,s),o.end();return}const a=t.beginRenderPass({colorAttachments:[{clearValue:{r:1e6,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.depthMapTextureView}],depthStencilAttachment:{depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store",view:this.depthTestTextureView},label:"fish-tank-splash-depth-pass"});a.setBindGroup(0,this.depthMapBindGroup),a.setPipeline(this.depthMapPipeline),a.draw(6,s),a.end();for(let o=0;o<2;o+=1){const m=t.beginRenderPass({colorAttachments:[{clearValue:{r:1e6,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.tmpDepthMapTextureView}],label:"fish-tank-splash-depth-filter-x"});m.setBindGroup(0,this.depthFilterBindGroups[0]),m.setPipeline(this.depthFilter1DPipeline),m.draw(6),m.end();const S=t.beginRenderPass({colorAttachments:[{clearValue:{r:1e6,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.depthMapTextureView}],label:`fish-tank-splash-depth-filter-y-${o}`});S.setBindGroup(0,this.depthFilterBindGroups[1]),S.setPipeline(this.depthFilter1DPipeline),S.draw(6),S.end()}const e=t.beginRenderPass({colorAttachments:[{clearValue:{r:1e6,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.tmpDepthMapTextureView}],label:"fish-tank-splash-depth-filter-2d-x"});e.setBindGroup(0,this.depthFilterBindGroups[2]),e.setPipeline(this.depthFilter2DPipeline),e.draw(6),e.end();const c=t.beginRenderPass({colorAttachments:[{clearValue:{r:1e6,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.depthMapTextureView}],label:"fish-tank-splash-depth-filter-2d-y"});c.setBindGroup(0,this.depthFilterBindGroups[3]),c.setPipeline(this.depthFilter2DPipeline),c.draw(6),c.end();const l=t.beginRenderPass({colorAttachments:[{clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.thicknessTextureView}],label:"fish-tank-splash-thickness-pass"});l.setBindGroup(0,this.thicknessMapBindGroup),l.setPipeline(this.thicknessMapPipeline),l.draw(6,s),l.end();const u=t.beginRenderPass({colorAttachments:[{clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.tmpThicknessTextureView}],label:"fish-tank-splash-thickness-filter-x"});u.setBindGroup(0,this.thicknessFilterBindGroups[0]),u.setPipeline(this.thicknessFilterPipeline),u.draw(6),u.end();const d=t.beginRenderPass({colorAttachments:[{clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:this.thicknessTextureView}],label:"fish-tank-splash-thickness-filter-y"});d.setBindGroup(0,this.thicknessFilterBindGroups[1]),d.setPipeline(this.thicknessFilterPipeline),d.draw(6),d.end();const f=t.beginRenderPass({colorAttachments:[{clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store",view:i}],label:"fish-tank-splash-fluid-pass"});f.setBindGroup(0,this.fluidBindGroup),f.setPipeline(this.fluidPipeline),f.draw(6),f.end()}dispose(){this.destroyTextures(),this.filterXBuffer.destroy(),this.filterYBuffer.destroy(),this.fluidParamsBuffer.destroy(),this.renderUniformBuffer.destroy(),this.thicknessFilterSizeBuffer.destroy()}}const qr=`struct Cell {
    vx: i32,
    vy: i32,
    vz: i32,
    mass: i32,
}

@group(0) @binding(0) var<storage, read_write> cells: array<Cell>;

@compute @workgroup_size(64)
fn clearGrid(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x < arrayLength(&cells)) {
        cells[id.x].mass = 0;
        cells[id.x].vx = 0;
        cells[id.x].vy = 0;
        cells[id.x].vz = 0;
    }
}
`,$r=`struct Particle {
    position: vec3f,
    v: vec3f,
    C: mat3x3f,
}

struct PosVel {
    position: vec3f,
    v: vec3f,
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read_write> posvel: array<PosVel>;
@group(0) @binding(2) var<uniform> numParticles: u32;

@compute @workgroup_size(64)
fn copyPosition(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x < numParticles) {
        posvel[id.x].position = particles[id.x].position;
        posvel[id.x].v = particles[id.x].v;
    }
}
`,Qr=`struct Particle {
    position: vec3f,
    v: vec3f,
    C: mat3x3f,
}

struct Cell {
    vx: i32,
    vy: i32,
    vz: i32,
    mass: i32,
}

struct SimulationUniforms {
    domainSize: vec4f,
    containMin: vec4f,
    containMax: vec4f,
    openSides: vec4f,
    impulseCenter: vec4f,
    impulseDir: vec4f,
    impulseParams: vec4f,
}

override fixedPointMultiplierInverse: f32;
override wallStiffness: f32;

fn decodeFixedPoint(fixedPoint: i32) -> f32 {
    return f32(fixedPoint) * fixedPointMultiplierInverse;
}

fn withinRange(value: f32, minValue: f32, maxValue: f32) -> bool {
    return value >= minValue - 1.0 && value <= maxValue + 1.0;
}

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<storage, read> cells: array<Cell>;
@group(0) @binding(2) var<uniform> sim: SimulationUniforms;
@group(0) @binding(3) var<uniform> numParticles: u32;

@compute @workgroup_size(64)
fn g2p(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x < numParticles) {
        let dt = sim.impulseParams.z;
        let sizeY = i32(sim.domainSize.y);
        let sizeZ = i32(sim.domainSize.z);
        let particle = particles[id.x];
        let cellIndex = floor(particle.position);
        let cellDiff = particle.position - (cellIndex + 0.5f);
        let domainMin = vec3f(1.0, 1.0, 1.0);
        let domainMax = sim.domainSize.xyz - vec3f(2.0, 2.0, 2.0);
        var weights: array<vec3f, 3>;
        var velocity = vec3f(0.0, 0.0, 0.0);
        var B = mat3x3f(vec3f(0.0), vec3f(0.0), vec3f(0.0));

        weights[0] = 0.5f * (0.5f - cellDiff) * (0.5f - cellDiff);
        weights[1] = 0.75f - cellDiff * cellDiff;
        weights[2] = 0.5f * (0.5f + cellDiff) * (0.5f + cellDiff);

        for (var gx = 0; gx < 3; gx = gx + 1) {
            for (var gy = 0; gy < 3; gy = gy + 1) {
                for (var gz = 0; gz < 3; gz = gz + 1) {
                    let weight = weights[gx].x * weights[gy].y * weights[gz].z;
                    let cellX = vec3f(
                        cellIndex.x + f32(gx) - 1.0,
                        cellIndex.y + f32(gy) - 1.0,
                        cellIndex.z + f32(gz) - 1.0
                    );
                    let cellDist = (cellX + 0.5f) - particle.position;
                    let cellIndex1D =
                        i32(cellX.x) * sizeY * sizeZ +
                        i32(cellX.y) * sizeZ +
                        i32(cellX.z);
                    let weightedVelocity = vec3f(
                        decodeFixedPoint(cells[cellIndex1D].vx),
                        decodeFixedPoint(cells[cellIndex1D].vy),
                        decodeFixedPoint(cells[cellIndex1D].vz)
                    ) * weight;

                    B = B + mat3x3f(
                        weightedVelocity * cellDist.x,
                        weightedVelocity * cellDist.y,
                        weightedVelocity * cellDist.z
                    );
                    velocity = velocity + weightedVelocity;
                }
            }
        }

        particles[id.x].v = velocity;
        particles[id.x].C = B * 4.0f;
        particles[id.x].position = clamp(
            particles[id.x].position + particles[id.x].v * dt,
            domainMin,
            domainMax
        );

        let xn = particles[id.x].position + particles[id.x].v * dt * 2.0;
        let insideYZ = withinRange(xn.y, sim.containMin.y, sim.containMax.y) &&
            withinRange(xn.z, sim.containMin.z, sim.containMax.z);
        let insideXZ = withinRange(xn.x, sim.containMin.x, sim.containMax.x) &&
            withinRange(xn.z, sim.containMin.z, sim.containMax.z);
        let insideXY = withinRange(xn.x, sim.containMin.x, sim.containMax.x) &&
            withinRange(xn.y, sim.containMin.y, sim.containMax.y);
        if (insideYZ && sim.openSides.x < 0.5 && xn.x < sim.containMin.x) {
            particles[id.x].v.x = particles[id.x].v.x + wallStiffness * (sim.containMin.x - xn.x);
        }
        if (insideYZ && sim.openSides.y < 0.5 && xn.x > sim.containMax.x) {
            particles[id.x].v.x = particles[id.x].v.x + wallStiffness * (sim.containMax.x - xn.x);
        }
        if (insideXY && sim.openSides.z < 0.5 && xn.z < sim.containMin.z) {
            particles[id.x].v.z = particles[id.x].v.z + wallStiffness * (sim.containMin.z - xn.z);
        }
        if (insideXY && sim.openSides.w < 0.5 && xn.z > sim.containMax.z) {
            particles[id.x].v.z = particles[id.x].v.z + wallStiffness * (sim.containMax.z - xn.z);
        }
        if (insideXZ && xn.y < sim.containMin.y) {
            particles[id.x].v.y = particles[id.x].v.y + wallStiffness * (sim.containMin.y - xn.y);
        }
        if (insideXZ && xn.y > sim.containMax.y) {
            particles[id.x].v.y = particles[id.x].v.y + wallStiffness * (sim.containMax.y - xn.y);
        }
        if (xn.y < sim.containMin.w) {
            particles[id.x].v.y = particles[id.x].v.y + wallStiffness * (sim.containMin.w - xn.y);
        }
    }
}
`,Jr=`struct Particle {
    position: vec3f,
    v: vec3f,
    C: mat3x3f,
}

struct Cell {
    vx: atomic<i32>,
    vy: atomic<i32>,
    vz: atomic<i32>,
    mass: atomic<i32>,
}

struct SimulationUniforms {
    domainSize: vec4f,
    containMin: vec4f,
    containMax: vec4f,
    openSides: vec4f,
    impulseCenter: vec4f,
    impulseDir: vec4f,
    impulseParams: vec4f,
}

override fixedPointMultiplier: f32;

fn encodeFixedPoint(floatingPoint: f32) -> i32 {
    return i32(floatingPoint * fixedPointMultiplier);
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read_write> cells: array<Cell>;
@group(0) @binding(2) var<uniform> sim: SimulationUniforms;
@group(0) @binding(3) var<uniform> numParticles: u32;

@compute @workgroup_size(64)
fn p2g_1(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x < numParticles) {
        var weights: array<vec3f, 3>;

        let particle = particles[id.x];
        let cellIndex = floor(particle.position);
        let cellDiff = particle.position - (cellIndex + 0.5f);
        let sizeY = i32(sim.domainSize.y);
        let sizeZ = i32(sim.domainSize.z);

        weights[0] = 0.5f * (0.5f - cellDiff) * (0.5f - cellDiff);
        weights[1] = 0.75f - cellDiff * cellDiff;
        weights[2] = 0.5f * (0.5f + cellDiff) * (0.5f + cellDiff);

        for (var gx = 0; gx < 3; gx = gx + 1) {
            for (var gy = 0; gy < 3; gy = gy + 1) {
                for (var gz = 0; gz < 3; gz = gz + 1) {
                    let weight = weights[gx].x * weights[gy].y * weights[gz].z;
                    let cellX = vec3f(
                        cellIndex.x + f32(gx) - 1.0,
                        cellIndex.y + f32(gy) - 1.0,
                        cellIndex.z + f32(gz) - 1.0
                    );
                    let cellDist = (cellX + 0.5f) - particle.position;
                    let Q = particle.C * cellDist;
                    let massContrib = weight;
                    let velContrib = massContrib * (particle.v + Q);
                    let cellIndex1D =
                        i32(cellX.x) * sizeY * sizeZ +
                        i32(cellX.y) * sizeZ +
                        i32(cellX.z);

                    atomicAdd(&cells[cellIndex1D].mass, encodeFixedPoint(massContrib));
                    atomicAdd(&cells[cellIndex1D].vx, encodeFixedPoint(velContrib.x));
                    atomicAdd(&cells[cellIndex1D].vy, encodeFixedPoint(velContrib.y));
                    atomicAdd(&cells[cellIndex1D].vz, encodeFixedPoint(velContrib.z));
                }
            }
        }
    }
}
`,ea=`struct Particle {
    position: vec3f,
    v: vec3f,
    C: mat3x3f,
}

struct Cell {
    vx: atomic<i32>,
    vy: atomic<i32>,
    vz: atomic<i32>,
    mass: i32,
}

struct SimulationUniforms {
    domainSize: vec4f,
    containMin: vec4f,
    containMax: vec4f,
    openSides: vec4f,
    impulseCenter: vec4f,
    impulseDir: vec4f,
    impulseParams: vec4f,
}

override fixedPointMultiplier: f32;
override fixedPointMultiplierInverse: f32;
override stiffness: f32;
override restDensity: f32;
override dynamicViscosity: f32;

fn encodeFixedPoint(floatingPoint: f32) -> i32 {
    return i32(floatingPoint * fixedPointMultiplier);
}

fn decodeFixedPoint(fixedPoint: i32) -> f32 {
    return f32(fixedPoint) * fixedPointMultiplierInverse;
}

@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<storage, read_write> cells: array<Cell>;
@group(0) @binding(2) var<uniform> sim: SimulationUniforms;
@group(0) @binding(3) var<uniform> numParticles: u32;
@group(0) @binding(4) var<storage, read_write> densities: array<f32>;

@compute @workgroup_size(64)
fn p2g_2(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x < numParticles) {
        var weights: array<vec3f, 3>;

        let particle = particles[id.x];
        let cellIndex = floor(particle.position);
        let cellDiff = particle.position - (cellIndex + 0.5f);
        let sizeY = i32(sim.domainSize.y);
        let sizeZ = i32(sim.domainSize.z);

        weights[0] = 0.5f * (0.5f - cellDiff) * (0.5f - cellDiff);
        weights[1] = 0.75f - cellDiff * cellDiff;
        weights[2] = 0.5f * (0.5f + cellDiff) * (0.5f + cellDiff);

        var density = 0.0;

        for (var gx = 0; gx < 3; gx = gx + 1) {
            for (var gy = 0; gy < 3; gy = gy + 1) {
                for (var gz = 0; gz < 3; gz = gz + 1) {
                    let weight = weights[gx].x * weights[gy].y * weights[gz].z;
                    let cellX = vec3f(
                        cellIndex.x + f32(gx) - 1.0,
                        cellIndex.y + f32(gy) - 1.0,
                        cellIndex.z + f32(gz) - 1.0
                    );
                    let cellIndex1D =
                        i32(cellX.x) * sizeY * sizeZ +
                        i32(cellX.y) * sizeZ +
                        i32(cellX.z);

                    density = density + decodeFixedPoint(cells[cellIndex1D].mass) * weight;
                }
            }
        }

        let volume = 1.0 / density;
        let pressure = max(0.0, stiffness * (pow(density / restDensity, 1.0) - 1.0));
        let dudv = particle.C;
        let strain = dudv + transpose(dudv);
        var stress = mat3x3f(
            vec3f(-pressure, 0.0, 0.0),
            vec3f(0.0, -pressure, 0.0),
            vec3f(0.0, 0.0, -pressure)
        );

        densities[id.x] = density;
        stress = stress + dynamicViscosity * strain;

        let eq16Term0 = -volume * 4.0 * stress * sim.impulseParams.z;

        for (var gx = 0; gx < 3; gx = gx + 1) {
            for (var gy = 0; gy < 3; gy = gy + 1) {
                for (var gz = 0; gz < 3; gz = gz + 1) {
                    let weight = weights[gx].x * weights[gy].y * weights[gz].z;
                    let cellX = vec3f(
                        cellIndex.x + f32(gx) - 1.0,
                        cellIndex.y + f32(gy) - 1.0,
                        cellIndex.z + f32(gz) - 1.0
                    );
                    let cellDist = (cellX + 0.5f) - particle.position;
                    let cellIndex1D =
                        i32(cellX.x) * sizeY * sizeZ +
                        i32(cellX.y) * sizeZ +
                        i32(cellX.z);
                    let momentum = eq16Term0 * weight * cellDist;

                    atomicAdd(&cells[cellIndex1D].vx, encodeFixedPoint(momentum.x));
                    atomicAdd(&cells[cellIndex1D].vy, encodeFixedPoint(momentum.y));
                    atomicAdd(&cells[cellIndex1D].vz, encodeFixedPoint(momentum.z));
                }
            }
        }
    }
}
`,ta=`struct Cell {
    vx: i32,
    vy: i32,
    vz: i32,
    mass: i32,
}

struct SimulationUniforms {
    domainSize: vec4f,
    containMin: vec4f,
    containMax: vec4f,
    openSides: vec4f,
    impulseCenter: vec4f,
    impulseDir: vec4f,
    impulseParams: vec4f,
}

override fixedPointMultiplier: f32;
override fixedPointMultiplierInverse: f32;
override gravity: f32;

fn encodeFixedPoint(floatingPoint: f32) -> i32 {
    return i32(floatingPoint * fixedPointMultiplier);
}

fn decodeFixedPoint(fixedPoint: i32) -> f32 {
    return f32(fixedPoint) * fixedPointMultiplierInverse;
}

fn decodeCellPosition(index: u32, domainSize: vec3u) -> vec3f {
    let yz = domainSize.y * domainSize.z;
    let x = index / yz;
    let y = (index / domainSize.z) % domainSize.y;
    let z = index % domainSize.z;

    return vec3f(f32(x), f32(y), f32(z));
}

@group(0) @binding(0) var<storage, read_write> cells: array<Cell>;
@group(0) @binding(1) var<uniform> sim: SimulationUniforms;

@compute @workgroup_size(64)
fn updateGrid(@builtin(global_invocation_id) id: vec3<u32>) {
    if (id.x < arrayLength(&cells) && cells[id.x].mass > 0) {
        let dt = sim.impulseParams.z;
        let domainSize = vec3u(sim.domainSize.xyz);
        let cellPos = decodeCellPosition(id.x, domainSize);
        let impulseDiff = sim.impulseCenter.xyz - cellPos;
        let impulseRadius = sim.impulseParams.x;
        let impulseStrength = select(
            0.0,
            smoothstep(
                impulseRadius * impulseRadius,
                0.0,
                dot(impulseDiff, impulseDiff)
            ) * sim.impulseParams.y,
            sim.impulseCenter.w > 0.5
        );
        let mass = decodeFixedPoint(cells[id.x].mass);
        var floatV = vec3f(
            decodeFixedPoint(cells[id.x].vx),
            decodeFixedPoint(cells[id.x].vy),
            decodeFixedPoint(cells[id.x].vz)
        ) / mass;

        floatV = vec3f(
            floatV.x + impulseStrength * sim.impulseDir.x,
            floatV.y + impulseStrength * sim.impulseDir.y - gravity * dt,
            floatV.z + impulseStrength * sim.impulseDir.z
        );

        cells[id.x].vx = encodeFixedPoint(floatV.x);
        cells[id.x].vy = encodeFixedPoint(floatV.y);
        cells[id.x].vz = encodeFixedPoint(floatV.z);

        if (cellPos.x < 2.0 || cellPos.x > sim.domainSize.x - 3.0) {
            cells[id.x].vx = 0;
        }
        if (cellPos.y < 2.0 || cellPos.y > sim.domainSize.y - 3.0) {
            cells[id.x].vy = 0;
        }
        if (cellPos.z < 2.0 || cellPos.z > sim.domainSize.z - 3.0) {
            cells[id.x].vz = 0;
        }
    }
}
`,ce=1e7,na=.18,ct=80,ia=32,ra=16,Zt=112,Kt=Object.freeze({dynamicViscosity:.1,gravity:.4,restDensity:3,stiffness:50,wallStiffness:1});function aa(n){return{containMax:new Float32Array(n,32,4),containMin:new Float32Array(n,16,4),domainSize:new Float32Array(n,0,4),impulseCenter:new Float32Array(n,64,4),impulseDir:new Float32Array(n,80,4),impulseParams:new Float32Array(n,96,4),openSides:new Float32Array(n,48,4)}}function sa(n){const t=[],i=n.particleSpacing*na;for(let a=n.initialFillMin[1];a<n.initialFillMax[1];a+=n.particleSpacing)for(let e=n.initialFillMin[0];e<n.initialFillMax[0];e+=n.particleSpacing)for(let c=n.initialFillMin[2];c<n.initialFillMax[2];c+=n.particleSpacing)t.push([e+(Math.random()-.5)*i,a+(Math.random()-.5)*i,c+(Math.random()-.5)*i]);const s=t.length,r=new ArrayBuffer(ct*s);return t.forEach((a,e)=>{const c=ct*e,l=new Float32Array(r,c,3),u=new Float32Array(r,c+16,3),d=new Float32Array(r,c+32,12);l.set(a),u.set([0,0,0]),d.set([0,0,0,0,0,0,0,0,0,0,0,0])}),{buffer:r,particleCount:s}}class oa{constructor({config:t,device:i,simulationSettings:s=Kt}){this.config=t,this.device=i,this.simulationSettings={...Kt,...s},this.simulationValues=new ArrayBuffer(Zt),this.simulationViews=aa(this.simulationValues);const r=sa(t);this.particleCount=r.particleCount,this.gridCount=t.domainSize[0]*t.domainSize[1]*t.domainSize[2],this.cellBuffer=i.createBuffer({label:"fish-tank-splash-cell-buffer",size:ra*this.gridCount,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.particleBuffer=i.createBuffer({label:"fish-tank-splash-particle-buffer",size:ct*this.particleCount,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.posvelBuffer=i.createBuffer({label:"fish-tank-splash-posvel-buffer",size:ia*this.particleCount,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.densityBuffer=i.createBuffer({label:"fish-tank-splash-density-buffer",size:4*this.particleCount,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.simulationUniformBuffer=i.createBuffer({label:"fish-tank-splash-sim-uniforms",size:Zt,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.numParticlesBuffer=i.createBuffer({label:"fish-tank-splash-num-particles",size:4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(this.particleBuffer,0,r.buffer),this.device.queue.writeBuffer(this.numParticlesBuffer,0,new Int32Array([this.particleCount])),this.clearGridPipeline=i.createComputePipeline({label:"fish-tank-splash-clear-grid",layout:"auto",compute:{module:i.createShaderModule({code:qr})}}),this.p2g1Pipeline=i.createComputePipeline({label:"fish-tank-splash-p2g1",layout:"auto",compute:{module:i.createShaderModule({code:Jr}),constants:{fixedPointMultiplier:ce}}}),this.p2g2Pipeline=i.createComputePipeline({label:"fish-tank-splash-p2g2",layout:"auto",compute:{module:i.createShaderModule({code:ea}),constants:{dynamicViscosity:this.simulationSettings.dynamicViscosity,fixedPointMultiplier:ce,fixedPointMultiplierInverse:1/ce,restDensity:this.simulationSettings.restDensity,stiffness:this.simulationSettings.stiffness}}}),this.updateGridPipeline=i.createComputePipeline({label:"fish-tank-splash-update-grid",layout:"auto",compute:{module:i.createShaderModule({code:ta}),constants:{fixedPointMultiplier:ce,fixedPointMultiplierInverse:1/ce,gravity:this.simulationSettings.gravity}}}),this.g2pPipeline=i.createComputePipeline({label:"fish-tank-splash-g2p",layout:"auto",compute:{module:i.createShaderModule({code:Qr}),constants:{fixedPointMultiplierInverse:1/ce,wallStiffness:this.simulationSettings.wallStiffness}}}),this.copyPositionPipeline=i.createComputePipeline({label:"fish-tank-splash-copy-position",layout:"auto",compute:{module:i.createShaderModule({code:$r})}}),this.clearGridBindGroup=i.createBindGroup({layout:this.clearGridPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.cellBuffer}}]}),this.p2g1BindGroup=i.createBindGroup({layout:this.p2g1Pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.particleBuffer}},{binding:1,resource:{buffer:this.cellBuffer}},{binding:2,resource:{buffer:this.simulationUniformBuffer}},{binding:3,resource:{buffer:this.numParticlesBuffer}}]}),this.p2g2BindGroup=i.createBindGroup({layout:this.p2g2Pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.particleBuffer}},{binding:1,resource:{buffer:this.cellBuffer}},{binding:2,resource:{buffer:this.simulationUniformBuffer}},{binding:3,resource:{buffer:this.numParticlesBuffer}},{binding:4,resource:{buffer:this.densityBuffer}}]}),this.updateGridBindGroup=i.createBindGroup({layout:this.updateGridPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.cellBuffer}},{binding:1,resource:{buffer:this.simulationUniformBuffer}}]}),this.g2pBindGroup=i.createBindGroup({layout:this.g2pPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.particleBuffer}},{binding:1,resource:{buffer:this.cellBuffer}},{binding:2,resource:{buffer:this.simulationUniformBuffer}},{binding:3,resource:{buffer:this.numParticlesBuffer}}]}),this.copyPositionBindGroup=i.createBindGroup({layout:this.copyPositionPipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.particleBuffer}},{binding:1,resource:{buffer:this.posvelBuffer}},{binding:2,resource:{buffer:this.numParticlesBuffer}}]})}update({containMax:t,containMin:i,delta:s,impulse:r,openSides:a,spillFloor:e}){this.simulationViews.domainSize.set([this.config.domainSize[0],this.config.domainSize[1],this.config.domainSize[2],0]),this.simulationViews.containMin.set([i[0],i[1],i[2],e]),this.simulationViews.containMax.set([t[0],t[1],t[2],0]),this.simulationViews.openSides.set([a[0],a[1],a[2],a[3]]),r?(this.simulationViews.impulseCenter.set([r.center[0],r.center[1],r.center[2],1]),this.simulationViews.impulseDir.set([r.direction[0],r.direction[1],r.direction[2],0]),this.simulationViews.impulseParams.set([r.radius,r.strength,s,0])):(this.simulationViews.impulseCenter.set([0,0,0,0]),this.simulationViews.impulseDir.set([0,0,0,0]),this.simulationViews.impulseParams.set([0,0,s,0])),this.device.queue.writeBuffer(this.simulationUniformBuffer,0,this.simulationValues)}step(t){const i=t.beginComputePass({label:"fish-tank-splash-compute"});i.setBindGroup(0,this.clearGridBindGroup),i.setPipeline(this.clearGridPipeline),i.dispatchWorkgroups(Math.ceil(this.gridCount/64)),i.setBindGroup(0,this.p2g1BindGroup),i.setPipeline(this.p2g1Pipeline),i.dispatchWorkgroups(Math.ceil(this.particleCount/64)),i.setBindGroup(0,this.p2g2BindGroup),i.setPipeline(this.p2g2Pipeline),i.dispatchWorkgroups(Math.ceil(this.particleCount/64)),i.setBindGroup(0,this.updateGridBindGroup),i.setPipeline(this.updateGridPipeline),i.dispatchWorkgroups(Math.ceil(this.gridCount/64)),i.setBindGroup(0,this.g2pBindGroup),i.setPipeline(this.g2pPipeline),i.dispatchWorkgroups(Math.ceil(this.particleCount/64)),i.setBindGroup(0,this.copyPositionBindGroup),i.setPipeline(this.copyPositionPipeline),i.dispatchWorkgroups(Math.ceil(this.particleCount/64)),i.end()}dispose(){this.cellBuffer.destroy(),this.densityBuffer.destroy(),this.numParticlesBuffer.destroy(),this.particleBuffer.destroy(),this.posvelBuffer.destroy(),this.simulationUniformBuffer.destroy()}}const la=1.5,wn=18e3,ca=.072,qt=.36,ua=.78,da=1.58,pa=24,ha=22,fa=36,ma=Object.freeze({Small:1e4,Medium:wn,Large:3e4,"Very Large":45e3}),ga=.42,xa=4.5,Sa=2.75,St=["left","right","back","front"],$t=new A,Qt=new A;function va(n,t,i){const s=Math.max(0,t[0]-n[0]),r=Math.max(0,t[1]-n[1]),a=Math.max(0,t[2]-n[2]);return Math.ceil(s/i)*Math.ceil(r/i)*Math.ceil(a/i)}function ba(n,t,i){let s=ua;for(;va(n,t,s)>i&&s<la;)s+=.08;return s}function ya(n){return ma[n.splashParticleBudget]??wn}function Me(n,t,i){return i.map((s,r)=>(s-n[r])/t)}function wa(n){const t=pe(n),i=ya(n),s=-n.height/2+de,r=V.clamp(Math.max(t.innerWidth/fa,t.innerDepth/pa,Math.max(t.waterHeight,t.innerHeight*.82)/ha),ca,.11),a=Math.max(qt,t.innerWidth*.55),e=Math.max(qt,t.innerDepth*.7),c=Math.max(.32,n.height*.18),l=Math.max(.2,n.height*.12),u=[-t.innerWidth/2-a,s-c,-t.innerDepth/2-e],f=[t.innerWidth/2+a,s+t.waterHeight+l,t.innerDepth/2+e].map((v,g)=>Math.ceil((v-u[g])/r)+4),o=Me(u,r,[-t.innerWidth/2,s,-t.innerDepth/2]),m=Me(u,r,[t.innerWidth/2,s+t.waterHeight,t.innerDepth/2]),S=[o[0]+1.5,o[1]+1.5,o[2]+1.5],x=[m[0]-1.5,m[1]-1.2,m[2]-1.5],y=ba(S,x,i);return{cellSize:r,domainMinLocal:u,domainSize:f,initialFillMin:S,initialFillMax:x,innerDepth:t.innerDepth,innerWidth:t.innerWidth,maxParticles:i,particleDiameterWorld:r*da,particleSpacing:y,waterBottom:s,signature:[f.join("x"),r.toFixed(4),i,n.waterLevel.toFixed(4),t.innerWidth.toFixed(4),t.innerDepth.toFixed(4),s.toFixed(4)].join(":")}}function Ma(n,t,i){const s=pe({...t,waterLevel:i}),r=[-s.innerWidth/2,n.waterBottom,-s.innerDepth/2],a=[s.innerWidth/2,n.waterBottom+s.waterHeight,s.innerDepth/2],e=Math.min(-t.height/2+n.particleDiameterWorld*.5,n.waterBottom-n.particleDiameterWorld*.25);return{containMax:Me(n.domainMinLocal,n.cellSize,a),containMin:Me(n.domainMinLocal,n.cellSize,r),layout:s,spillFloor:(e-n.domainMinLocal[1])/n.cellSize}}function Pa(n,t){return Me(n.domainMinLocal,n.cellSize,[t.x,t.y,t.z])}function ka(n){return St.map(t=>n?.isPaneBroken?.(t)?1:0)}function Ta(n){switch(n){case"left":return[-1,0,0];case"right":return[1,0,0];case"back":return[0,0,-1];case"front":return[0,0,1];default:return[0,0,0]}}function Wa(n,t,i,s,r){const a=Pa(n,s),e=Math.max(1e-4,t.splashBreakImpulseDuration??ga),c=Math.max(1e-4,t.splashBreakImpulseRadius??xa),l=Math.max(0,t.splashBreakImpulseStrength??Sa);switch(i){case"left":a[0]=r.containMin[0]+1.2;break;case"right":a[0]=r.containMax[0]-1.2;break;case"back":a[2]=r.containMin[2]+1.2;break;case"front":a[2]=r.containMax[2]-1.2;break}return{center:a,direction:Ta(i),duration:e,remaining:e,radius:c,strength:l}}function Da(n,t,i){return n.copy(t.matrixWorld),Qt.makeTranslation(i.domainMinLocal[0],i.domainMinLocal[1],i.domainMinLocal[2]),$t.makeScale(i.cellSize,i.cellSize,i.cellSize),n.multiply(Qt),n.multiply($t),n}const Ra=1e-4,Je=new B,et=new sn,Ca=new A,Jt=new B,tt=new B,za=new Set(["tank-pane","tank-pane-fragment"]);function en(){return Object.fromEntries(St.map(n=>[n,0]))}function Ba(n){const t=new me(n.waterColor).offsetHSL(0,.02,-.06);return[t.r,t.g,t.b]}function ve(n,t){if(t){if(!n?.queue?.onSubmittedWorkDone){t.dispose();return}n.queue.onSubmittedWorkDone().catch(()=>{}).then(()=>{t.dispose()})}}function Ia(){const n=new Rn({fog:!1,side:dt,toneMapped:!1});return n.colorWrite=!1,n}function _a(n){return!n?.isMesh||n.visible===!1?!1:n.userData?.excludeFromWaterDepthOcclusion?!0:za.has(n.userData?.surfaceType)}function Fa(n,t){const i=new Cn(n,t,zn);return i.name="fish-tank-splash-scene-depth",i.magFilter=Te,i.minFilter=Te,new Bn(n,t,{colorSpace:In,depthBuffer:!0,depthTexture:i,magFilter:Te,minFilter:Te,samples:0,stencilBuffer:!1})}function Ga({camera:n,gl:t,material:i,scene:s,target:r}){const a=s,e=[],c=t,l=a.overrideMaterial,u=c.getRenderTarget?.()??null;a.traverse(d=>{if(!_a(d))return;const f=d;e.push(f),f.visible=!1});try{c.setRenderTarget(r),a.overrideMaterial=i,c.clear(!0,!0,!1),c.render(a,n)}finally{e.forEach(d=>{const f=d;f.visible=!0}),a.overrideMaterial=l,c.setRenderTarget(u)}}function La({runtime:n,showWaterBounds:t=!1,tank:i}){const s=h.useRef(en()),r=h.useRef(null),a=h.useRef(null),e=h.useRef(""),c=h.useRef(null),l=h.useRef(null),u=h.useRef(null),d=h.useRef(null),f=h.useRef(""),o=h.useMemo(()=>wa(i),[i.depth,i.glassThickness,i.height,i.splashParticleBudget,i.waterInset,i.waterLevel,i.width]),m=h.useMemo(()=>Ba(i),[i.waterColor]),S=h.useMemo(()=>{const[y,v,g]=o.domainMinLocal,[w,b,W]=o.domainSize,k=[w*o.cellSize,b*o.cellSize,W*o.cellSize];return Jt.set(y+k[0]*.5,v+k[1]*.5,g+k[2]*.5),{position:Jt.toArray(),size:k}},[o]),x=h.useMemo(()=>({dynamicViscosity:i.splashViscosity,gravity:i.splashGravity,restDensity:i.splashRestDensity,stiffness:i.splashStiffness,wallStiffness:i.splashWallStiffness}),[i.splashGravity,i.splashRestDensity,i.splashStiffness,i.splashViscosity,i.splashWallStiffness]);return h.useEffect(()=>()=>{const y=c.current,v=l.current,g=u.current,w=d.current,b=y?.device??w?.device;e.current="",f.current="",c.current=null,l.current=null,u.current=null,d.current=null,ve(b,y),v?.dispose?.(),g?.dispose?.(),ve(b,w)},[]),re((y,v)=>{const{camera:g,gl:w,scene:b}=y,W=w?.backend,k=W?.device,I=W?.context,M=r.current,C=n?n.getWaterLevel():i.waterLevel,D=n?.isAnyPaneBroken?.()??!1,G=n?.isAnyPaneBroken?.()?i.waterLevel:C;if(!k||!I||!M||!D&&C<=Ra)return;const U=[o.signature,n?.getResetNonce?.()??0,x.dynamicViscosity,x.gravity,x.restDensity,x.stiffness,x.wallStiffness].join(":");U!==f.current&&(ve(k,c.current),ve(k,d.current),d.current=new oa({config:o,device:k,simulationSettings:x}),s.current=en(),a.current=null,e.current="",f.current=U);const L=d.current;if(!L){e.current="";return}w.getDrawingBufferSize(et);const H=Math.max(1,Math.round(et.x)),T=Math.max(1,Math.round(et.y));let z=l.current,P=u.current;z||(z=Ia(),l.current=z),P?(P.width!==H||P.height!==T)&&P.setSize(H,T):(P=Fa(H,T),u.current=P),Ga({camera:g,gl:w,material:z,scene:b,target:P}),w.render(b,g);const F=W?.get?.(P.depthTexture)?.texture;if(!F){e.current="";return}const Y=`${H}x${T}:${U}`;M.getWorldScale(tt),(!c.current||Y!==e.current)&&(ve(k,c.current),c.current=new Kr({device:k,format:navigator.gpu.getPreferredCanvasFormat(),height:T,fovRadians:V.degToRad(g.fov),particleDiameter:o.particleDiameterWorld*tt.x,posvelBuffer:L.posvelBuffer,sceneDepthTexture:F,width:H}),e.current=Y);const X=Ma(o,i,G);St.forEach(oe=>{const Ne=n?.getPaneBreakEvent?.(oe),yt=Ne?.id??0;yt<=s.current[oe]||!Ne?.worldPoint||(s.current[oe]=yt,Je.fromArray(Ne.worldPoint),M.worldToLocal(Je),a.current=Wa(o,i,oe,Je,X))});const ee=i.splashRunning!==!1;a.current&&ee&&(a.current.remaining=Math.max(0,a.current.remaining-v),a.current.remaining<=0&&(a.current=null));const vt=ka(n),xe=a.current?{center:a.current.center,direction:a.current.direction,radius:a.current.radius,strength:a.current.strength*(a.current.remaining/a.current.duration)}:null;if(ee){const oe=Math.min(v*i.splashSimSpeed,i.splashMaxDelta);L.update({containMax:X.containMax,containMin:X.containMin,delta:oe,impulse:xe,openSides:vt,spillFloor:X.spillFloor})}c.current.update({camera:g,density:i.splashColorDensity,fluidColor:m,modelMatrix:Da(Ca,M,o),sphereSize:o.particleDiameterWorld*tt.x});const Q=k.createCommandEncoder({label:"fish-tank-splash-frame"}),bt=I.getCurrentTexture();c.current.copyBackground(Q,bt),ee&&L.step(Q),c.current.render(Q,bt.createView(),L.particleCount,{showParticles:i.splashShowParticles===!0}),k.queue.submit([Q.finish()])},1),p.jsx("group",{ref:r,children:t&&p.jsxs("mesh",{position:S.position,children:[p.jsx("boxGeometry",{args:S.size}),p.jsx("meshBasicMaterial",{color:"#22d3ee",transparent:!0,opacity:.45,wireframe:!0})]})})}const Oa=.34,Ea=.036,tn=1e-4,ue=new B,be=new B;function nn(n){return`#${n.getHexString()}`}function Aa({fluidCouplersRef:n,runtime:t,tank:i}){const s=h.useRef(new WeakMap),r=h.useRef(0),a=h.useRef(null),e=h.useRef(.35),c=h.useRef(.03),l=h.useRef(.65),[u,d]=h.useMemo(()=>{const f=new me(i.waterColor),o=f.clone().offsetHSL(0,.03,-.22),m=f.clone().offsetHSL(0,.02,.12);return[nn(o),nn(m)]},[i.waterColor]);return re((f,o)=>{const m=a.current;if(!m)return;const S=t?t.getWaterLevel():i.waterLevel,x=t?t.getBrokenPaneCount():0,y=i.waterLevel>0?1-S/i.waterLevel:0,v=pe({...i,waterLevel:S}),g=s.current;let w=0;m.visible=S>tn,m.position.set(0,v.waterY,0),m.scale.set(v.innerWidth,v.waterHeight,v.innerDepth),(n?.current??[]).forEach(b=>{if(!b)return;b.getWorldPosition(be);const W=g.get(b);if(!W){g.set(b,be.clone());return}if(ue.copy(be),m.worldToLocal(ue),Math.abs(ue.x)<=.52&&Math.abs(ue.z)<=.52&&ue.y>=-.55&&ue.y<=.55){const k=be.distanceTo(W)/Math.max(o,.008333333333333333);w=Math.max(w,Math.min(.08,k*.0035))}W.copy(be)}),r.current=Math.max(r.current*.9,w),c.current=Math.max(.012,Ea+x*.014+y*.05+r.current),l.current=.4+i.waterDisturbance*1.6+x*.12+r.current*4,e.current=Math.min(1.4,.22+i.waterDisturbance*2.4+y*.45+r.current*5)}),p.jsx("group",{ref:a,visible:i.waterLevel>tn,children:p.jsx(Jn,{bottomColor:u,depth:1,height:1,ior:1.18,opacity:Oa,roughness:.14,segments:20,showEdges:!1,thickness:.55,topColor:d,transmission:.42,waveChoppinessRef:e,waveHeightRef:c,waveSpeedRef:l,width:1})})}function Va({fluidCouplersRef:n,runtime:t,showWaterBounds:i=!1,tank:s}){const r=ne(e=>e.gl);return r?.backend?.isWebGPUBackend===!0&&!!r?.backend?.device&&!!r?.backend?.context&&typeof navigator<"u"&&!!navigator.gpu?p.jsx(La,{runtime:t,showWaterBounds:i,tank:s}):p.jsx(Aa,{fluidCouplersRef:n,runtime:t,tank:s})}const nt=1e-4,ja=20,Na=8,Ua=new Set(["glass_2","glass_5","lid_1","plastic_1","plastic_2","rubber"]),Ha=1.05,Ya=.03,rn=new sn,it=new ut,Xa=new B,Za=ie.memo(function({geometry:t,material:i,colliderShape:s="trimesh",meshKey:r,meshProps:a}){return p.jsx(ke,{type:"fixed",colliders:s,friction:Ha,restitution:Ya,children:p.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:t,material:i,...a},r)})});function Ka({tank:n,debug:t,externalCollisionObjectsRef:i,fluidCouplersRef:s,rocks:r,runtime:a}){const e=ne(T=>T.camera),c=ne(T=>T.gl),l=h.useRef(null),u=h.useRef([]),d=h.useRef({}),f=h.useRef({}),o=h.useRef(null),m=h.useRef(null),S=h.useRef(null),x=h.useRef([]),y=h.useRef({}),v=h.useRef(null),[g,w]=h.useState(null),{innerDepth:b,innerWidth:W,waterHeight:k,waterY:I}=pe(n),M=c?.backend?.isWebGPUBackend===!0&&!!c?.backend?.device&&!!c?.backend?.context&&typeof navigator<"u"&&!!navigator.gpu;h.useLayoutEffect(()=>{if(g||!m.current)return;const T=new _n,z=new B,P=new B;m.current.updateWorldMatrix(!0,!0),T.setFromObject(m.current),Number.isFinite(T.min.x)&&(T.getCenter(z),T.getSize(P),w({center:z.toArray(),minY:T.min.y,size:P.toArray()}))},[g]);const C=h.useMemo(()=>{if(!g)return null;const[T,z,P]=g.size,[F,,Y]=g.center,X=[n.width/Math.max(T,nt),n.height/Math.max(z,nt),n.depth/Math.max(P,nt)];return{position:[-F*X[0],-n.height/2-g.minY*X[1],-Y*X[2]],scale:X}},[g,n.depth,n.height,n.width]);h.useEffect(()=>{const{domElement:T}=c,z=()=>{o.current=null},P=Y=>{Y.button===0&&(o.current={clientX:Y.clientX,clientY:Y.clientY})},F=Y=>{const X=o.current;if(o.current=null,!X||Y.button!==0||!S.current||Math.hypot(Y.clientX-X.clientX,Y.clientY-X.clientY)>Na)return;const ee=T.getBoundingClientRect();rn.set((Y.clientX-ee.left)/ee.width*2-1,-((Y.clientY-ee.top)/ee.height)*2+1),it.setFromCamera(rn,e);const xe=it.intersectObjects(K.map(Q=>f.current[Q]).filter(Q=>Q&&Q.visible),!1)[0]??null;S.current.launch({paneKey:xe?.object?.userData?.paneKey??null,targetWorldPoint:xe?xe.point.clone():it.ray.at(ja,Xa.clone())})};return T.addEventListener("pointerdown",P),window.addEventListener("pointerup",F),window.addEventListener("pointercancel",z),()=>{T.removeEventListener("pointerdown",P),window.removeEventListener("pointerup",F),window.removeEventListener("pointercancel",z)}},[e,c]),re(()=>{const T=a?a.getWaterLevel():n.waterLevel,z=pe({...n,waterLevel:T});u.current=[...i?.current??[],...kt.map(F=>y.current[F]),...Object.values(d.current),...K.map(F=>f.current[F])].filter(F=>F&&F.visible);const P=s?.current;if(P){P.splice(0,P.length,...x.current,...Object.values(d.current));for(let F=P.length-1;F>=0;F-=1)P[F]||P.splice(F,1)}v.current&&(v.current.position.set(0,z.waterY,0),v.current.rotation.set(0,0,0),v.current.scale.y=z.waterHeight+.01,v.current.visible=t.showWaterBounds&&T>0)});const D=(T,z)=>{a&&a.breakPane(T,z.localPoint,z.worldPoint)},G=h.useMemo(()=>Object.fromEntries(kt.map(T=>[T,{ref:z=>{const P=z;y.current[T]=P,P&&(P.userData={...P.userData,surfaceKey:T,surfaceType:"tank-static"})}}])),[]),U=h.useMemo(()=>Object.fromEntries(K.map(T=>[T,{ref:z=>{const P=z;f.current[T]=P,P&&(P.userData={...P.userData,paneKey:T,surfaceType:"tank-pane"})}}])),[]),L=h.useCallback(({geometry:T,material:z,meshKey:P,meshProps:F})=>Ua.has(P)?p.jsx(Za,{colliderShape:"trimesh",geometry:T,material:z,meshKey:P,meshProps:F},P):p.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:T,material:z,...F},P),[]),H=h.useCallback(({geometry:T,material:z,paneKey:P,paneProps:F})=>p.jsx(wr,{assetGroupRef:l,fragmentObjectsRef:d,geometry:T,material:z,paneKey:P,paneProps:F,runtime:a,tank:n},P),[a,n]);return p.jsxs(p.Fragment,{children:[!g&&p.jsx("group",{visible:!1,children:p.jsx(ot,{ref:m})}),n.visible&&p.jsxs(p.Fragment,{children:[p.jsx(yn,{collisionObjectsRef:u,fluidObjectsRef:x,ref:S,onImpact:D,rocks:r,runtime:a}),C&&p.jsx("group",{ref:l,position:C.position,scale:C.scale,children:p.jsx(ot,{glassColor:n.glassColor,glassOpacity:n.glassOpacity,paneProps:U,renderPane:H,renderStaticMesh:L,sandColor:n.sandColor,staticMeshProps:G})}),p.jsx(Va,{fluidCouplersRef:s,runtime:a,showWaterBounds:t.showWaterBounds,tank:n})]}),t.showTankBounds&&p.jsxs("mesh",{children:[p.jsx("boxGeometry",{args:[n.width+.01,n.height+.01,n.depth+.01]}),p.jsx("meshBasicMaterial",{color:"#f97316",transparent:!0,opacity:.45,wireframe:!0})]}),t.showWaterBounds&&!M&&p.jsxs("mesh",{ref:v,position:[0,I,0],scale:[1,k+.01,1],children:[p.jsx("boxGeometry",{args:[W+.01,1,b+.01]}),p.jsx("meshBasicMaterial",{color:"#22d3ee",transparent:!0,opacity:.45,wireframe:!0})]})]})}const O=Sn(xt,gt),Ie={ambientIntensity:.95,backgroundColor:"#0f172a",cameraDesktopFov:34,cameraDesktopPosition:{x:5.8,y:3.4,z:8.2},cameraDesktopTarget:{x:0,y:1.15,z:0},cameraMobileFov:46,cameraMobilePosition:{x:0,y:3.2,z:9.4},cameraMobileTarget:{x:0,y:1.1,z:0},cameraMode:"Fixed",directionalIntensity:1.25,directionalPosition:{x:6,y:9,z:4},drainRate:.16,fishEscapeDistance:1.2,fishBaseYOffset:.05,fishBobAmplitude:.08,fishCount:2,fishFlopAmplitude:.95,fishMarkerColor:"#f472b6",fishMarkerSize:.045,fishRadiusX:.78,fishRadiusZ:.42,fishScale:.018,fishSpeed:.45,fishStrandLevel:.2,fishVisible:!0,floorColor:"#bca88c",fogColor:"#0f172a",fogFar:24,fogNear:10,glassColor:"#dbeafe",glassOpacity:.16,gridColor:"#8aa1b1",operatorBoostMultiplier:2,operatorLiftSpeed:3,operatorMaxFov:72,operatorMinFov:22,operatorMoveSpeed:4,operatorPointerLookSensitivity:.0025,operatorStickLookSpeed:2.2,operatorZoomSpeed:28,rockGravity:8.5,rockScale:.7,rockSpeed:40,rockSpin:10,sandColor:"#c9a46b",showFishMarkers:!1,showRapierDebug:!1,splashBreakImpulseDuration:.42,splashBreakImpulseRadius:4.5,splashBreakImpulseStrength:2.75,splashColorDensity:1.3,splashGravity:.4,splashMaxDelta:.4,splashParticleBudget:"Medium",splashRestDensity:3,splashRunning:!0,splashShowParticles:!1,splashSimSpeed:12,splashStiffness:50,splashViscosity:.1,splashWallStiffness:1,spillExtent:3.8,spillOpacity:.28,spillThickness:.045,showTankBounds:!1,showWaterBounds:!1,tableDepth:5.98,tableLegDepth:.22,tableLegInset:.32,tableLegWidth:.22,tableMetalness:0,tablePosition:{x:0,y:1.1,z:0},tableRoughness:.78,tableThickness:.18,tableWidth:7.95,tableWoodBarkThickness:O.barkThickness,tableWoodCellScale:O.cellScale,tableWoodCellSize:O.cellSize,tableWoodCenterSize:O.centerSize,tableWoodClearcoat:O.clearcoat,tableWoodClearcoatRoughness:O.clearcoatRoughness,tableWoodDarkGrainColor:O.darkGrainColor,tableWoodFineWarpScale:O.fineWarpScale,tableWoodFineWarpStrength:O.fineWarpStrength,tableWoodFinish:gt,tableWoodGrainOffset:{x:0,y:0,z:0},tableWoodGrainRotation:{x:0,y:0,z:0},tableWoodGrainScale:{x:1,y:1,z:1},tableWoodGenus:xt,tableWoodLargeGrainStretch:O.largeGrainStretch,tableWoodLargeWarpScale:O.largeWarpScale,tableWoodLightGrainColor:O.lightGrainColor,tableWoodRingBias:O.ringBias,tableWoodRingSizeVariance:O.ringSizeVariance,tableWoodRingThickness:O.ringThickness,tableWoodRingVarianceScale:O.ringVarianceScale,tableWoodSmallWarpScale:O.smallWarpScale,tableWoodSmallWarpStrength:O.smallWarpStrength,tableWoodSplotchIntensity:O.splotchIntensity,tableWoodSplotchScale:O.splotchScale,tankDepth:1.8,tankHeight:2.2,tankPosition:{x:0,y:1.2,z:0},tankRotation:{x:0,y:0,z:0},tankScale:1,tankVisible:!0,tankWidth:3.2,waterColor:"#4cc9f0",waterDisturbance:.09,waterInset:.12,waterLevel:.78,glassThickness:.06},rt={Default:{...Ie},Orbit:{...Ie,backgroundColor:"#111827",cameraMode:"Orbit",fogFar:26,waterLevel:.72},Operator:{...Ie,cameraMode:"Operator",fishSpeed:.55,waterLevel:.68},Debug:{...Ie,backgroundColor:"#020617",cameraMode:"Orbit",showFishMarkers:!0,showRapierDebug:!0,showTankBounds:!0,showWaterBounds:!0,waterLevel:.58}},qa=Object.freeze({sceneTitle:"My Heart Is A Broken Fish Tank"}),an="Default";function Mn(n){return n.split("_").map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" ")}function $a({finish:n,genus:t}){const i=Sn(t,n);return{tableWoodBarkThickness:i.barkThickness,tableWoodCellScale:i.cellScale,tableWoodCellSize:i.cellSize,tableWoodCenterSize:i.centerSize,tableWoodClearcoat:i.clearcoat,tableWoodClearcoatRoughness:i.clearcoatRoughness,tableWoodDarkGrainColor:i.darkGrainColor,tableWoodFineWarpScale:i.fineWarpScale,tableWoodFineWarpStrength:i.fineWarpStrength,tableWoodLargeGrainStretch:i.largeGrainStretch,tableWoodLargeWarpScale:i.largeWarpScale,tableWoodLightGrainColor:i.lightGrainColor,tableWoodRingBias:i.ringBias,tableWoodRingSizeVariance:i.ringSizeVariance,tableWoodRingThickness:i.ringThickness,tableWoodRingVarianceScale:i.ringVarianceScale,tableWoodSmallWarpScale:i.smallWarpScale,tableWoodSmallWarpStrength:i.smallWarpStrength,tableWoodSplotchIntensity:i.splotchIntensity,tableWoodSplotchScale:i.splotchScale}}const Qa=Object.freeze(Object.fromEntries(Qi.map(n=>[Mn(n),n]))),Ja=Object.freeze(Object.fromEntries(Ji.map(n=>[Mn(n),n])));function es({presetSnapshot:n}){return{...n}}function ts(){const{attachSetControls:n,controlsSnapshotRef:t,initialPreset:i,presetsFolder:s}=ei({defaultPreset:an,getPresetControls:es,presets:rt}),r=rt[i]||rt[an],a=h.useRef(`${r.tableWoodGenus}:${r.tableWoodFinish}`),[e,c]=Fn(qa.sceneTitle,()=>({Presets:s,Scene:_({backgroundColor:{label:"Background",value:r.backgroundColor},floorColor:{label:"Floor",value:r.floorColor},gridColor:{label:"Grid",value:r.gridColor},fogColor:{label:"Fog",value:r.fogColor},fogNear:{label:"Fog Near",max:40,min:0,step:.25,value:r.fogNear},fogFar:{label:"Fog Far",max:60,min:1,step:.25,value:r.fogFar},ambientIntensity:{label:"Ambient",max:3,min:0,step:.05,value:r.ambientIntensity},directionalIntensity:{label:"Main Light",max:4,min:0,step:.05,value:r.directionalIntensity},directionalPosition:{label:"Light Pos",step:.1,value:r.directionalPosition}},{collapsed:!0}),Camera:_({cameraMode:{label:"Mode",options:["Fixed","Orbit","Operator"],value:r.cameraMode},"Fixed Frame":_({cameraDesktopPosition:{label:"Desktop Pos",step:.1,value:r.cameraDesktopPosition},cameraDesktopTarget:{label:"Desktop Target",step:.1,value:r.cameraDesktopTarget},cameraDesktopFov:{label:"Desktop Fov",max:90,min:15,step:1,value:r.cameraDesktopFov},cameraMobilePosition:{label:"Mobile Pos",step:.1,value:r.cameraMobilePosition},cameraMobileTarget:{label:"Mobile Target",step:.1,value:r.cameraMobileTarget},cameraMobileFov:{label:"Mobile Fov",max:90,min:15,step:1,value:r.cameraMobileFov}},{collapsed:!0}),Operator:_({operatorMoveSpeed:{label:"Move Speed",max:20,min:.5,step:.1,value:r.operatorMoveSpeed},operatorLiftSpeed:{label:"Lift Speed",max:20,min:.5,step:.1,value:r.operatorLiftSpeed},operatorBoostMultiplier:{label:"Boost",max:10,min:1,step:.1,value:r.operatorBoostMultiplier},operatorPointerLookSensitivity:{label:"Pointer Look",max:.02,min:5e-4,step:5e-4,value:r.operatorPointerLookSensitivity},operatorStickLookSpeed:{label:"Stick Look",max:10,min:.1,step:.1,value:r.operatorStickLookSpeed},operatorZoomSpeed:{label:"Zoom Speed",max:120,min:1,step:1,value:r.operatorZoomSpeed},operatorMinFov:{label:"Min Fov",max:90,min:10,step:1,value:r.operatorMinFov},operatorMaxFov:{label:"Max Fov",max:120,min:20,step:1,value:r.operatorMaxFov}},{collapsed:!0})},{collapsed:!0}),Tank:_({tankVisible:{label:"Visible",value:r.tankVisible},tankPosition:{label:"Position",step:.05,value:r.tankPosition},tankRotation:{label:"Rotation",max:Math.PI,min:-Math.PI,step:.01,value:r.tankRotation},tankScale:{label:"Scale",max:3,min:.1,step:.01,value:r.tankScale},Dimensions:_({tankWidth:{label:"Width",max:8,min:.5,step:.05,value:r.tankWidth},tankHeight:{label:"Height",max:8,min:.5,step:.05,value:r.tankHeight},tankDepth:{label:"Depth",max:8,min:.5,step:.05,value:r.tankDepth}},{collapsed:!0}),Glass:_({glassThickness:{label:"Thickness",max:.4,min:.01,step:.01,value:r.glassThickness},glassColor:{label:"Color",value:r.glassColor},glassOpacity:{label:"Opacity",max:1,min:0,step:.01,value:r.glassOpacity},"Break Impulse":_({splashBreakImpulseStrength:{label:"Strength",max:8,min:0,step:.05,value:r.splashBreakImpulseStrength},splashBreakImpulseRadius:{label:"Radius",max:12,min:.1,step:.1,value:r.splashBreakImpulseRadius},splashBreakImpulseDuration:{label:"Duration",max:2,min:.01,step:.01,value:r.splashBreakImpulseDuration}},{collapsed:!0})},{collapsed:!0}),Materials:_({sandColor:{label:"Sand Color",value:r.sandColor}},{collapsed:!0})},{collapsed:!0}),Water:_({waterInset:{label:"Water Inset",max:.4,min:.01,step:.01,value:r.waterInset},waterLevel:{label:"Water Level",max:1,min:.05,step:.01,value:r.waterLevel},waterColor:{label:"Water Color",value:r.waterColor},drainRate:{label:"Drain Rate",max:1,min:0,step:.01,value:r.drainRate},spillExtent:{label:"Spill Extent",max:10,min:0,step:.1,value:r.spillExtent},spillOpacity:{label:"Spill Opacity",max:1,min:0,step:.01,value:r.spillOpacity},spillThickness:{label:"Spill Thickness",max:.3,min:.005,step:.005,value:r.spillThickness},waterDisturbance:{label:"Cursor Push",max:.5,min:0,step:.005,value:r.waterDisturbance},Splash:_({splashParticleBudget:{label:"Particle Budget",options:["Small","Medium","Large","Very Large"],value:r.splashParticleBudget},splashSimSpeed:{label:"Step Scale",max:30,min:.25,step:.25,value:r.splashSimSpeed},splashMaxDelta:{label:"Max Dt",max:.5,min:.01,step:.01,value:r.splashMaxDelta},splashGravity:{label:"Gravity",max:2,min:0,step:.01,value:r.splashGravity},splashColorDensity:{label:"Color Density",max:6,min:0,step:.1,value:r.splashColorDensity},splashRestDensity:{label:"Rest Density",max:8,min:.5,step:.1,value:r.splashRestDensity},splashStiffness:{label:"Stiffness",max:120,min:1,step:1,value:r.splashStiffness},splashViscosity:{label:"Viscosity",max:1,min:0,step:.01,value:r.splashViscosity},splashWallStiffness:{label:"Wall Stiffness",max:4,min:0,step:.05,value:r.splashWallStiffness}},{collapsed:!0})},{collapsed:!0}),Table:_({tablePosition:{label:"Position",step:.05,value:r.tablePosition},Dimensions:_({tableWidth:{label:"Width",max:16,min:.5,step:.05,value:r.tableWidth},tableDepth:{label:"Depth",max:16,min:.5,step:.05,value:r.tableDepth},tableThickness:{label:"Thickness",max:1.5,min:.02,step:.01,value:r.tableThickness}},{collapsed:!0}),Legs:_({tableLegWidth:{label:"Width",max:1.5,min:.05,step:.01,value:r.tableLegWidth},tableLegDepth:{label:"Depth",max:1.5,min:.05,step:.01,value:r.tableLegDepth},tableLegInset:{label:"Inset",max:2,min:0,step:.01,value:r.tableLegInset}},{collapsed:!0}),Appearance:_({tableRoughness:{label:"Roughness",max:1,min:0,step:.01,value:r.tableRoughness},tableMetalness:{label:"Metalness",max:1,min:0,step:.01,value:r.tableMetalness},Preset:_({tableWoodGenus:{label:"Species",options:Ja,value:r.tableWoodGenus},tableWoodFinish:{label:"Finish",options:Qa,value:r.tableWoodFinish}},{collapsed:!1}),Colors:_({tableWoodDarkGrainColor:{label:"Dark Grain",value:r.tableWoodDarkGrainColor},tableWoodLightGrainColor:{label:"Light Grain",value:r.tableWoodLightGrainColor}},{collapsed:!0}),Mapping:_({tableWoodGrainScale:{label:"Scale",step:.05,value:r.tableWoodGrainScale},tableWoodGrainOffset:{label:"Offset",step:.01,value:r.tableWoodGrainOffset},tableWoodGrainRotation:{label:"Rotation",step:1,value:r.tableWoodGrainRotation}},{collapsed:!0}),Structure:_({tableWoodCenterSize:{label:"Center Size",max:2,min:0,step:.01,value:r.tableWoodCenterSize},tableWoodLargeWarpScale:{label:"Large Warp",max:1,min:0,step:.001,value:r.tableWoodLargeWarpScale},tableWoodLargeGrainStretch:{label:"Large Stretch",max:1,min:0,step:.001,value:r.tableWoodLargeGrainStretch},tableWoodSmallWarpStrength:{label:"Small Warp Strength",max:.2,min:0,step:.001,value:r.tableWoodSmallWarpStrength},tableWoodSmallWarpScale:{label:"Small Warp Scale",max:16,min:.1,step:.05,value:r.tableWoodSmallWarpScale},tableWoodFineWarpStrength:{label:"Fine Warp Strength",max:.05,min:0,step:.001,value:r.tableWoodFineWarpStrength},tableWoodFineWarpScale:{label:"Fine Warp Scale",max:50,min:.1,step:.1,value:r.tableWoodFineWarpScale}},{collapsed:!0}),Rings:_({tableWoodRingThickness:{label:"Ring Thickness",max:.08,min:.01,step:5e-4,value:r.tableWoodRingThickness},tableWoodRingBias:{label:"Ring Bias",max:1,min:-.2,step:.001,value:r.tableWoodRingBias},tableWoodRingSizeVariance:{label:"Ring Size Variance",max:.5,min:0,step:.001,value:r.tableWoodRingSizeVariance},tableWoodRingVarianceScale:{label:"Ring Variance Scale",max:10,min:.1,step:.1,value:r.tableWoodRingVarianceScale},tableWoodBarkThickness:{label:"Bark Thickness",max:1.2,min:0,step:.01,value:r.tableWoodBarkThickness}},{collapsed:!0}),"Grain Detail":_({tableWoodSplotchScale:{label:"Splotch Scale",max:2.5,min:0,step:.01,value:r.tableWoodSplotchScale},tableWoodSplotchIntensity:{label:"Splotch Intensity",max:4,min:0,step:.01,value:r.tableWoodSplotchIntensity},tableWoodCellScale:{label:"Cell Scale",max:2e3,min:100,step:5,value:r.tableWoodCellScale},tableWoodCellSize:{label:"Cell Size",max:.5,min:.01,step:.001,value:r.tableWoodCellSize}},{collapsed:!0}),Finish:_({tableWoodClearcoat:{label:"Clearcoat",max:1,min:0,step:.01,value:r.tableWoodClearcoat},tableWoodClearcoatRoughness:{label:"Clearcoat Roughness",max:1,min:0,step:.01,value:r.tableWoodClearcoatRoughness}},{collapsed:!0})},{collapsed:!0})},{collapsed:!0}),Rocks:_({rockScale:{label:"Scale",max:.7,min:.1,step:.1,value:r.rockScale},rockSpeed:{label:"Speed",max:80,min:1,step:.5,value:r.rockSpeed},rockGravity:{label:"Gravity",max:30,min:0,step:.5,value:r.rockGravity},rockSpin:{label:"Spin",max:30,min:0,step:.5,value:r.rockSpin}},{collapsed:!0}),Fish:_({fishVisible:{label:"Visible",value:r.fishVisible},fishCount:{label:"Count",options:[0,1,2],value:r.fishCount},fishScale:{label:"Scale",max:.2,min:.001,step:.001,value:r.fishScale},fishSpeed:{label:"Speed",max:4,min:.05,step:.05,value:r.fishSpeed},fishRadiusX:{label:"Radius X",max:4,min:.05,step:.01,value:r.fishRadiusX},fishRadiusZ:{label:"Radius Z",max:4,min:.05,step:.01,value:r.fishRadiusZ},fishBaseYOffset:{label:"Base Offset",max:2,min:-1,step:.01,value:r.fishBaseYOffset},fishStrandLevel:{label:"Strand Level",max:1,min:0,step:.01,value:r.fishStrandLevel},fishEscapeDistance:{label:"Escape Dist",max:4,min:0,step:.01,value:r.fishEscapeDistance},fishBobAmplitude:{label:"Bob",max:1,min:0,step:.01,value:r.fishBobAmplitude},fishFlopAmplitude:{label:"Flop",max:Math.PI,min:0,step:.01,value:r.fishFlopAmplitude},fishMarkerSize:{label:"Marker Size",max:.4,min:.005,step:.005,value:r.fishMarkerSize},fishMarkerColor:{label:"Marker Color",value:r.fishMarkerColor}},{collapsed:!0}),Debug:_({showRapierDebug:{label:"Rapier Debug",value:r.showRapierDebug},splashRunning:{label:"Sim Running",value:r.splashRunning},splashShowParticles:{label:"Show Particles",value:r.splashShowParticles},showTankBounds:{label:"Tank Bounds",value:r.showTankBounds},showWaterBounds:{label:"Water Bounds",value:r.showWaterBounds},showFishMarkers:{label:"Fish Markers",value:r.showFishMarkers}},{collapsed:!0})}),{collapsed:!0});n(c),t.current={...e},h.useEffect(()=>{const v=`${e.tableWoodGenus}:${e.tableWoodFinish}`;a.current!==v&&(a.current=v,c($a({finish:e.tableWoodFinish,genus:e.tableWoodGenus})))},[e.tableWoodFinish,e.tableWoodGenus,c]);const l=h.useMemo(()=>({desktopFov:e.cameraDesktopFov,desktopPosition:[e.cameraDesktopPosition.x,e.cameraDesktopPosition.y,e.cameraDesktopPosition.z],desktopTarget:[e.cameraDesktopTarget.x,e.cameraDesktopTarget.y,e.cameraDesktopTarget.z],mobileFov:e.cameraMobileFov,mobilePosition:[e.cameraMobilePosition.x,e.cameraMobilePosition.y,e.cameraMobilePosition.z],mobileTarget:[e.cameraMobileTarget.x,e.cameraMobileTarget.y,e.cameraMobileTarget.z]}),[e.cameraDesktopFov,e.cameraDesktopPosition.x,e.cameraDesktopPosition.y,e.cameraDesktopPosition.z,e.cameraDesktopTarget.x,e.cameraDesktopTarget.y,e.cameraDesktopTarget.z,e.cameraMobileFov,e.cameraMobilePosition.x,e.cameraMobilePosition.y,e.cameraMobilePosition.z,e.cameraMobileTarget.x,e.cameraMobileTarget.y,e.cameraMobileTarget.z]),u=h.useMemo(()=>({ambientIntensity:e.ambientIntensity,backgroundColor:e.backgroundColor,directionalIntensity:e.directionalIntensity,directionalPosition:[e.directionalPosition.x,e.directionalPosition.y,e.directionalPosition.z],floorColor:e.floorColor,fogColor:e.fogColor,fogFar:e.fogFar,fogNear:e.fogNear,gridColor:e.gridColor}),[e.ambientIntensity,e.backgroundColor,e.directionalIntensity,e.directionalPosition.x,e.directionalPosition.y,e.directionalPosition.z,e.floorColor,e.fogColor,e.fogFar,e.fogNear,e.gridColor]),d=h.useMemo(()=>({boostMultiplier:e.operatorBoostMultiplier,liftSpeed:e.operatorLiftSpeed,maxFov:Math.max(e.operatorMinFov,e.operatorMaxFov),minFov:Math.min(e.operatorMinFov,e.operatorMaxFov),moveSpeed:e.operatorMoveSpeed,pointerLookSensitivity:e.operatorPointerLookSensitivity,stickLookSpeed:e.operatorStickLookSpeed,zoomSpeed:e.operatorZoomSpeed}),[e.operatorBoostMultiplier,e.operatorLiftSpeed,e.operatorMaxFov,e.operatorMinFov,e.operatorMoveSpeed,e.operatorPointerLookSensitivity,e.operatorStickLookSpeed,e.operatorZoomSpeed]),f=h.useMemo(()=>({position:[e.tankPosition.x,e.tankPosition.y,e.tankPosition.z],rotation:[e.tankRotation.x,e.tankRotation.y,e.tankRotation.z],scale:e.tankScale}),[e.tankPosition.x,e.tankPosition.y,e.tankPosition.z,e.tankRotation.x,e.tankRotation.y,e.tankRotation.z,e.tankScale]),o=h.useMemo(()=>({depth:e.tankDepth,drainRate:e.drainRate,glassColor:e.glassColor,glassOpacity:e.glassOpacity,glassThickness:e.glassThickness,height:e.tankHeight,sandColor:e.sandColor,splashBreakImpulseDuration:e.splashBreakImpulseDuration,splashBreakImpulseRadius:e.splashBreakImpulseRadius,splashBreakImpulseStrength:e.splashBreakImpulseStrength,splashColorDensity:e.splashColorDensity,splashGravity:e.splashGravity,splashMaxDelta:e.splashMaxDelta,splashParticleBudget:e.splashParticleBudget,splashRestDensity:e.splashRestDensity,splashRunning:e.splashRunning,splashShowParticles:e.splashShowParticles,splashSimSpeed:e.splashSimSpeed,splashStiffness:e.splashStiffness,splashViscosity:e.splashViscosity,splashWallStiffness:e.splashWallStiffness,spillExtent:e.spillExtent,spillOpacity:e.spillOpacity,spillThickness:e.spillThickness,tankScale:e.tankScale,visible:e.tankVisible,waterColor:e.waterColor,waterDisturbance:e.waterDisturbance,waterInset:e.waterInset,waterLevel:e.waterLevel,width:e.tankWidth}),[e.tankDepth,e.drainRate,e.glassColor,e.glassOpacity,e.glassThickness,e.tankHeight,e.sandColor,e.splashBreakImpulseDuration,e.splashBreakImpulseRadius,e.splashBreakImpulseStrength,e.splashColorDensity,e.splashGravity,e.splashMaxDelta,e.splashParticleBudget,e.splashRestDensity,e.splashRunning,e.splashShowParticles,e.splashSimSpeed,e.splashStiffness,e.splashViscosity,e.splashWallStiffness,e.spillExtent,e.spillOpacity,e.spillThickness,e.tankScale,e.tankVisible,e.waterColor,e.waterDisturbance,e.waterInset,e.waterLevel,e.tankWidth]),m=h.useMemo(()=>({color:e.tableWoodLightGrainColor,depth:e.tableDepth,legs:{depth:e.tableLegDepth,inset:e.tableLegInset,width:e.tableLegWidth},metalness:e.tableMetalness,position:[e.tablePosition.x,e.tablePosition.y,e.tablePosition.z],roughness:e.tableRoughness,thickness:e.tableThickness,wood:{barkThickness:e.tableWoodBarkThickness,cellScale:e.tableWoodCellScale,cellSize:e.tableWoodCellSize,centerSize:e.tableWoodCenterSize,clearcoat:e.tableWoodClearcoat,clearcoatRoughness:e.tableWoodClearcoatRoughness,darkGrainColor:e.tableWoodDarkGrainColor,fineWarpScale:e.tableWoodFineWarpScale,fineWarpStrength:e.tableWoodFineWarpStrength,finish:e.tableWoodFinish,grainOffset:[e.tableWoodGrainOffset.x,e.tableWoodGrainOffset.y,e.tableWoodGrainOffset.z],grainRotation:[e.tableWoodGrainRotation.x,e.tableWoodGrainRotation.y,e.tableWoodGrainRotation.z],grainScale:[e.tableWoodGrainScale.x,e.tableWoodGrainScale.y,e.tableWoodGrainScale.z],genus:e.tableWoodGenus,largeGrainStretch:e.tableWoodLargeGrainStretch,largeWarpScale:e.tableWoodLargeWarpScale,lightGrainColor:e.tableWoodLightGrainColor,ringBias:e.tableWoodRingBias,ringSizeVariance:e.tableWoodRingSizeVariance,ringThickness:e.tableWoodRingThickness,ringVarianceScale:e.tableWoodRingVarianceScale,smallWarpScale:e.tableWoodSmallWarpScale,smallWarpStrength:e.tableWoodSmallWarpStrength,splotchIntensity:e.tableWoodSplotchIntensity,splotchScale:e.tableWoodSplotchScale},width:e.tableWidth}),[e.tableDepth,e.tableLegDepth,e.tableLegInset,e.tableLegWidth,e.tableMetalness,e.tablePosition.x,e.tablePosition.y,e.tablePosition.z,e.tableRoughness,e.tableThickness,e.tableWoodBarkThickness,e.tableWoodCellScale,e.tableWoodCellSize,e.tableWoodCenterSize,e.tableWoodClearcoat,e.tableWoodClearcoatRoughness,e.tableWoodDarkGrainColor,e.tableWoodFineWarpScale,e.tableWoodFineWarpStrength,e.tableWoodFinish,e.tableWoodGenus,e.tableWoodGrainOffset.x,e.tableWoodGrainOffset.y,e.tableWoodGrainOffset.z,e.tableWoodGrainRotation.x,e.tableWoodGrainRotation.y,e.tableWoodGrainRotation.z,e.tableWoodGrainScale.x,e.tableWoodGrainScale.y,e.tableWoodGrainScale.z,e.tableWoodLargeGrainStretch,e.tableWoodLargeWarpScale,e.tableWoodLightGrainColor,e.tableWoodRingBias,e.tableWoodRingSizeVariance,e.tableWoodRingThickness,e.tableWoodRingVarianceScale,e.tableWoodSmallWarpScale,e.tableWoodSmallWarpStrength,e.tableWoodSplotchIntensity,e.tableWoodSplotchScale,e.tableWidth]),S=h.useMemo(()=>({escapeDistance:e.fishEscapeDistance,baseYOffset:e.fishBaseYOffset,bobAmplitude:e.fishBobAmplitude,count:e.fishCount,flopAmplitude:e.fishFlopAmplitude,markerColor:e.fishMarkerColor,markerSize:e.fishMarkerSize,radiusX:e.fishRadiusX,radiusZ:e.fishRadiusZ,scale:e.fishScale,speed:e.fishSpeed,strandLevel:e.fishStrandLevel,visible:e.fishVisible}),[e.fishEscapeDistance,e.fishBaseYOffset,e.fishBobAmplitude,e.fishCount,e.fishFlopAmplitude,e.fishMarkerColor,e.fishMarkerSize,e.fishRadiusX,e.fishRadiusZ,e.fishScale,e.fishSpeed,e.fishStrandLevel,e.fishVisible]),x=h.useMemo(()=>({gravity:e.rockGravity,scale:e.rockScale,speed:e.rockSpeed,spin:e.rockSpin}),[e.rockGravity,e.rockScale,e.rockSpeed,e.rockSpin]),y=h.useMemo(()=>({showFishMarkers:e.showFishMarkers,showRapierDebug:e.showRapierDebug,showTankBounds:e.showTankBounds,showWaterBounds:e.showWaterBounds}),[e.showFishMarkers,e.showRapierDebug,e.showTankBounds,e.showWaterBounds]);return{cameraConfig:l,cameraMode:e.cameraMode,debug:y,fish:S,operatorCamera:d,rocks:x,sceneEnvironment:u,table:m,tank:o,tankTransform:f}}const ns=0;function at(){return Object.fromEntries(K.map(n=>[n,!1]))}function st(){return Object.fromEntries(K.map(n=>[n,{atSeconds:-1,id:0,point:[0,0,0],worldPoint:[0,0,0]}]))}function is(n){const t=h.useRef(n),i=h.useRef(at()),s=h.useRef(st()),r=h.useRef(0),a=h.useRef(n.waterLevel);h.useEffect(()=>{t.current=n,i.current=at(),s.current=st(),r.current+=1,a.current=n.waterLevel},[n.depth,n.drainRate,n.glassThickness,n.height,n.waterInset,n.waterLevel,n.width]),re((l,u)=>{const d=K.reduce((f,o)=>f+(i.current[o]?1:0),0);d&&(a.current=Math.max(ns,a.current-u*t.current.drainRate*d))});const e=h.useCallback((l,u,d)=>{if(!K.includes(l))return;const f=Array.isArray(u)?u:u?.toArray?.()??[0,0,0],o=Array.isArray(d)?d:d?.toArray?.()??f;i.current[l]=!0,s.current[l]={atSeconds:performance.now()/1e3,id:s.current[l].id+1,point:f,worldPoint:o}},[]),c=h.useCallback(()=>{i.current=at(),s.current=st(),r.current+=1,a.current=t.current.waterLevel},[]);return h.useMemo(()=>({breakPane:e,getPaneBreakEvent:l=>s.current[l]??null,getResetNonce:()=>r.current,getWaterLevel:()=>a.current,getBrokenPaneCount:()=>K.reduce((l,u)=>l+(i.current[u]?1:0),0),getFirstBrokenPane:()=>K.find(l=>i.current[l])||null,isAnyPaneBroken:()=>K.some(l=>i.current[l]),isFrontPaneBroken:()=>i.current.front,isPaneBroken:l=>!!i.current[l],resetRuntime:c}),[e,c])}const Pn=[18,.25,18],rs=[0,he-Pn[1],0],as=1/60;function ws(){const{cameraConfig:n,cameraMode:t,debug:i,fish:s,operatorCamera:r,rocks:a,sceneEnvironment:e,table:c,tank:l,tankTransform:u}=ts(),d=h.useRef([]),f=is(l),o=h.useRef([]);return p.jsxs(p.Fragment,{children:[p.jsx(Wi,{cameraConfig:n,cameraMode:t,operatorCamera:r,sceneEnvironment:e}),p.jsxs(Ln,{debug:i.showRapierDebug,interpolate:!0,timeStep:as,children:[p.jsx(ke,{type:"fixed",colliders:!1,children:p.jsx(ye,{args:Pn,position:rs,friction:1.15,restitution:.04})}),p.jsx(tr,{collisionMeshesRef:o,table:c,tank:l}),p.jsx(Vi,{fluidCouplersRef:d,runtime:f,table:c,tank:l}),p.jsxs("group",{position:u.position,rotation:u.rotation,scale:u.scale,children:[p.jsx(Ka,{debug:i,externalCollisionObjectsRef:o,fluidCouplersRef:d,rocks:a,runtime:f,tank:l}),p.jsx(di,{fish:s,runtime:f,tank:l,showMarkers:i.showFishMarkers})]})]})]})}export{ws as default};
