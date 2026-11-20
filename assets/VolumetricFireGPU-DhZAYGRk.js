import{Q as T,V as y,az as ae,aQ as le,aH as X,a3 as k,aB as Z,L as de,a8 as J,l as N,J as $,b9 as he,aY as ce,D as ue,C as fe,aa as me,ab as xe,I as ge,ba as ve,b2 as we,b as ye,r as S,X as ee,a as be,j as q,Z as Me}from"./index-DQZ6GwWS.js";import{u as C,ax as _e,F as j,g as te,h as Ve,A as Se,k as O,K as H,m as se,c as Ae,f as W,L as Ee,n as re,J as oe,j as Y,v as Fe,I as ne}from"./three.tsl-BQ1Hwkua.js";class Pe{constructor(){this.contents=[],this.sorted=!1}sort(){this.contents.sort((e,s)=>e.priority-s.priority),this.sorted=!0}pop(){return this.sorted||this.sort(),this.contents.pop()}top(){return this.sorted||this.sort(),this.contents[this.contents.length-1]}push(e,s){this.contents.push({object:e,priority:s}),this.sorted=!1}}class Te extends de{constructor({width:e=1,height:s=2,depth:n=1,sliceSpacing:c=.1,camera:d=null,textureNoise:i=null,textureProfile:v=null,segments:a=32,debug:t=!1,material:u=null}={}){if(!d)throw new Error("VolumetricFire: 'camera' is required.");(!i||!v)&&console.error("VolumetricFire: 'textureNoise' and 'textureProfile' must be provided.");const g=a*300*6,h=new J;h.setAttribute("position",new N(new Float32Array(g*3),3).setUsage($)),h.setAttribute("tex",new N(new Float32Array(g*3),3).setUsage($)),h.setIndex(new N(new Uint32Array(g),1));const o=u||new he({vertexShader:`
          attribute vec3 position;
          attribute vec3 tex;
          uniform mat4 projectionMatrix;
          uniform mat4 modelViewMatrix;
          varying vec3 texOut;
          void main(void) {
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              texOut = tex;
          }
        `,fragmentShader:`
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
        `,uniforms:{nzw:{value:i},fireProfile:{value:v},time:{value:0},magnitude:{value:1.3},lacunarity:{value:2},gain:{value:.5},noiseScale:{value:new me(1,2,1,.3)},colorTint:{value:new fe(1,1,1)},saturation:{value:1},brightness:{value:1.5}},side:ue,blending:ce,transparent:!0,depthWrite:!1});super(h,o),this.type="VolumetricFire",this.frustumCulled=!1,this._camera=d,this._sliceSpacing=c,this._segments=a,this._viewVector=new y,this._posCurve=new xe,this._posCurve.curveType="centripetal",this._cornerNeighbors=[[1,2,4],[0,5,3],[0,3,6],[1,7,2],[0,6,5],[1,4,7],[2,7,4],[3,5,6]],this._incomingEdges=[[-1,2,4,-1,1,-1,-1,-1],[5,-1,-1,0,-1,3,-1,-1],[3,-1,-1,6,-1,-1,0,-1],[-1,7,1,-1,-1,-1,-1,2],[6,-1,-1,-1,-1,0,5,-1],[-1,4,-1,-1,7,-1,-1,1],[-1,-1,7,-1,2,-1,-1,4],[-1,-1,-1,5,-1,6,3,-1]],this._controlPoints=[],this.setRectangularShape(e,s,n),t&&this._initLatticeWireframe(a)}setRectangularShape(e,s,n){const c=s/2,d=[{pos:new y(0,-c,0),scale:new y(e,1,n),rot:new T},{pos:new y(0,0,0),scale:new y(e,1,n),rot:new T},{pos:new y(0,c,0),scale:new y(e,1,n),rot:new T}];this.setControlPoints(d)}setControlPoints(e){this._controlPoints=e,this._posCurve.points=e.map(s=>s.pos),this._posCurve.updateArcLengths()}update(e){this.material.uniforms.time.value=e;const s=new ge;s.multiplyMatrices(this._camera.matrixWorldInverse,this.matrixWorld),this._viewVector.set(-s.elements[2],-s.elements[6],-s.elements[10]).normalize(),this._slice()}_getInterpolatedState(e){const s=this._controlPoints,n=s.length,c=e*(n-1);let d=Math.floor(c),i=d+1,v=c-d;i>=n&&(d=n-1,i=n-1,v=0);const a=s[d],t=s[i],u=this._posCurve.getPoint(e),g=new y().lerpVectors(a.scale,t.scale,v),h=a.rot instanceof T?a.rot:new T().setFromEuler(a.rot),o=t.rot instanceof T?t.rot:new T().setFromEuler(t.rot),l=new T().copy(h).slerp(o,v);return{pos:u,scale:g,quat:l}}_slice(){const e=[],s=[],n=[],c=[];let d=null,i=0;this.wireframe&&this.wireframe.visible&&(d=this.wireframe.geometry.attributes.position.array);for(let t=0;t<=this._segments;t++){const u=t/this._segments,g=this._posCurve.getUtoTmapping(u),h=this._getInterpolatedState(g),o=h.scale.x*.5,l=h.scale.z*.5,f=[new y(-o,0,-l),new y(o,0,-l),new y(o,0,l),new y(-o,0,l)];f.forEach(m=>m.applyQuaternion(h.quat).add(h.pos)),c.push(f),d&&f.forEach(m=>{d[i++]=m.x,d[i++]=m.y,d[i++]=m.z})}this.wireframe&&this.wireframe.visible&&(this.wireframe.geometry.attributes.position.needsUpdate=!0);let v=0;for(let t=0;t<this._segments;t++){const u=c[t],g=c[t+1],h=[u[0],u[1],g[0],g[1],u[3],u[2],g[3],g[2]],o=t/this._segments,l=(t+1)/this._segments,f=[new y(0,o,0),new y(1,o,0),new y(0,l,0),new y(1,l,0),new y(0,o,1),new y(1,o,1),new y(0,l,1),new y(1,l,1)],m=this._sliceHexahedron(h,f,v);for(let x=0;x<m.p.length;x+=3)e.push(m.p[x],m.p[x+1],m.p[x+2]);for(let x=0;x<m.t.length;x+=3)s.push(m.t[x],m.t[x+1],m.t[x+2]);for(let x=0;x<m.i.length;x++)n.push(m.i[x]);v=m.nextIndex}const a=this.geometry;if(e.length>a.attributes.position.array.length){console.warn("VolumetricFire: Vertex buffer overflow. Increase buffer size or adjust segments/sliceSpacing.");return}a.index.array.set(n),a.attributes.position.array.set(e),a.attributes.tex.array.set(s),a.index.needsUpdate=!0,a.attributes.position.needsUpdate=!0,a.attributes.tex.needsUpdate=!0,a.setDrawRange(0,n.length)}_sliceHexahedron(e,s,n){const c=e.map(w=>w.dot(this._viewVector)),d=Math.min(...c),i=Math.max(...c),v=c.indexOf(i);let a=Math.floor(i/this._sliceSpacing)*this._sliceSpacing;const t=[];let u=0;const g=new Pe,h=(w,V)=>{if(u>=12)return;const A={sIdx:w,eIdx:V,dPos:new y,dTex:new y,pos:new y,tex:new y,prev:0,next:0,expired:!1},r=c[w]-c[V];if(Math.abs(r)>1e-5){const M=1/r;A.dPos.subVectors(e[V],e[w]).multiplyScalar(M),A.dTex.subVectors(s[V],s[w]).multiplyScalar(M);const _=c[w]-a;A.pos.addVectors(A.dPos.clone().multiplyScalar(_),e[w]),A.tex.addVectors(A.dTex.clone().multiplyScalar(_),s[w]),A.dPos.multiplyScalar(this._sliceSpacing),A.dTex.multiplyScalar(this._sliceSpacing)}return g.push(A,c[V]),t[u++]=A,A};for(let w=0;w<3;w++){const V=h(v,this._cornerNeighbors[v][w]);V.prev=(w+2)%3,V.next=(w+1)%3}const o=[],l=[],f=[];let m=n,x=0;for(;a>d;){for(;g.contents.length>0&&g.top().priority>=a;){const r=g.pop().object;if(!r.expired&&!(!t[r.prev]||!t[r.next]))if(r.eIdx!==t[r.prev].eIdx&&r.eIdx!==t[r.next].eIdx){r.expired=!0;const M=h(r.eIdx,this._incomingEdges[r.eIdx][r.sIdx]);if(!M)break;M.prev=r.prev,t[r.prev].next=u-1,M.next=u;const _=h(r.eIdx,this._incomingEdges[r.eIdx][M.eIdx]);if(!_)break;_.prev=u-2,_.next=r.next,t[r.next].prev=u-1,t[_.next].prev=u-1,x=u-1}else{let M,_;if(r.eIdx===t[r.prev].eIdx?(M=t[r.prev],_=r):(M=r,_=t[r.next]),!M||!_)continue;M.expired=!0,_.expired=!0;const E=h(r.eIdx,this._incomingEdges[r.eIdx][M.sIdx]);if(!E)break;E.prev=M.prev,t[M.prev]&&(t[M.prev].next=u-1),E.next=_.next,t[_.next]&&(t[_.next].prev=u-1),x=u-1}}let w=x,V=0,A=0;for(;A++<15&&t[w];){const r=t[w];if(o.push(r.pos.x,r.pos.y,r.pos.z),l.push(r.tex.x,r.tex.y,r.tex.z),r.pos.add(r.dPos),r.tex.add(r.dTex),w=r.next,V++,w===x)break}if(V>=3){for(let r=2;r<V;r++)f.push(m,m+r-1,m+r);m+=V}a-=this._sliceSpacing}return{p:o,t:l,i:f,nextIndex:m}}_initLatticeWireframe(e){const s=new Float32Array((e+1)*4*3),n=new J;n.setAttribute("position",new N(s,3));const c=[];for(let i=0;i<e;i++){const v=i*4,a=(i+1)*4;for(let t=0;t<4;t++)c.push(v+t,v+(t+1)%4),c.push(v+t,a+t)}const d=e*4;for(let i=0;i<4;i++)c.push(d+i,d+(i+1)%4);n.setIndex(c),this.wireframe=new ve(n,new we({color:4500223,transparent:!0,opacity:.3})),this.wireframe.visible=!0,this.add(this.wireframe)}setShowVolume(e){e&&!this.wireframe&&this._initLatticeWireframe(this._segments),this.wireframe&&(this.wireframe.visible=e)}}let F=null,P=null;function ze(){if(F)return F;const p=64,e=new Uint8Array(p*p*4);for(let s=0;s<p*p;s+=1){const n=Math.random()*Math.PI*2;e[s*4+0]=Math.round((Math.cos(n)*.5+.5)*255),e[s*4+1]=Math.round((Math.sin(n)*.5+.5)*255),e[s*4+2]=128,e[s*4+3]=255}return F=new ae(e,p,p,le),F.wrapS=X,F.wrapT=X,F.magFilter=k,F.minFilter=k,F.needsUpdate=!0,F}function Ce(){if(P)return P;const p=64,e=64,s=new Uint8Array(p*e*4);for(let n=0;n<e;n+=1)for(let c=0;c<p;c+=1){const d=c/(p-1),i=n/(e-1),v=Math.max(0,1-d*1.2),a=Math.max(0,1-i*.92),t=v*a;let u,g,h;if(i<.12){const f=i/.12;u=.5+f*.5,g=.6+f*.4,h=1}else if(i<.35){const f=(i-.12)/.23;u=1,g=1,h=1-f*.85}else if(i<.7){const f=(i-.35)/.35;u=1,g=1-f*.72,h=.15-f*.12}else{const f=(i-.7)/.3;u=1-f*.5,g=.28-f*.28,h=.03}const o=Math.max(0,1-d*1.1),l=(n*p+c)*4;s[l+0]=Math.min(255,Math.round(u*o*255)),s[l+1]=Math.min(255,Math.round(g*o*255)),s[l+2]=Math.min(255,Math.round(h*o*255)),s[l+3]=Math.min(255,Math.round(t*255))}return P=new ae(s,p,e,le),P.wrapS=Z,P.wrapT=Z,P.magFilter=k,P.minFilter=k,P.needsUpdate=!0,P}const Re=5,ie=41;function Ue(p){return Array.from({length:p},()=>({pos:new y,scale:new y(1,1,1),rot:new T}))}function Ie(p,e,s,n,c,d){const i=e/2;for(let v=0;v<p.length;v+=1){const a=v/(p.length-1),t=a*a,u=s*(1-a*.25),g=n*(1-a*.25);p[v].pos.set(c*t,-i+a*e,d*t),p[v].scale.set(u,1,g)}}const De=Y(.2126,.7152,.0722),Q=W(61),Be=new me(1,2,1,.3);function Le(p,e,s){const n=_e("tex","vec3").toVarying("vVolumetricFireTex"),c=j(([o,l])=>{const f=te(o,l).toVar();return te(f.mul(f),l)}),d=j(([o])=>{const l=Ve(o.z).toVar(),f=Se(o.z).toVar(),m=c(O(l.mul(3),l.mul(3).add(3)),Q).toVar(),x=H(e,O(o.x,o.y.add(m.x)).div(Q)).xy.mul(2).sub(1).toVar(),w=H(e,O(o.x,o.y.add(m.y)).div(Q)).xy.mul(2).sub(1).toVar();return se(x.x.add(x.y.mul(f)),w.x.add(w.y.mul(f.sub(1))),Ae(0,1,f))}),i=j(([o])=>{const l=W(0).toVar(),f=W(1).toVar(),m=W(1).toVar();return Ee({start:re(0),end:re(4),type:"int",condition:"<"},()=>{l.addAssign(d(o.mul(f)).abs().mul(m)),f.mulAssign(p.lacunarity),m.mulAssign(p.gain)}),l}),a=j(()=>{const o=n.xz.mul(2).sub(1).toVar(),l=O(oe(o,o).sqrt(),n.y).toVar(),f=Y(o.x,n.y.sub(p.time.mul(p.noiseScale.w)),o.y).toVar();f.mulAssign(p.noiseScale.xyz);const m=l.y.sqrt().mul(p.magnitude).mul(i(f)).toVar();l.y.addAssign(m);const x=Fe(0,0,0,0).toVar();return ne(l.y.lessThanEqual(1),()=>{x.assign(H(s,l)),ne(l.y.lessThan(.1),()=>{x.mulAssign(l.y.div(.1))})}),x})().toVar(),t=a.rgb.mul(p.colorTint).mul(p.brightness).toVar(),u=oe(t,De).toVar(),g=se(Y(u,u,u),t,p.saturation),h=new Me({transparent:!0,depthWrite:!1,toneMapped:!1,side:ue,blending:ce});return h.colorNode=g,h.opacityNode=a.a,h.uniforms=p,h}function je({position:p=[0,0,0],inverted:e=!1,width:s=.35,height:n=1,depth:c=.35,sliceSpacing:d=.05,segments:i=24,bendX:v=0,bendZ:a=0,animated:t=!0,animSpeed:u=.5,showSpline:g=!1,showVolume:h=!1,magnitude:o=1.3,lacunarity:l=2,gain:f=.5,tintColor:m="#ffffff",saturation:x=1,brightness:w=1.5,controlPoints:V=null}){const{camera:A}=ye(),r=S.useRef(0),M=S.useRef({x:v,z:a}),_=S.useRef(null);_.current||(_.current=Ue(5));const E=S.useMemo(()=>ze(),[]),D=S.useMemo(()=>Ce(),[]),K=S.useMemo(()=>({time:C(0),magnitude:C(o),lacunarity:C(l),gain:C(f),noiseScale:C(Be.clone()),colorTint:C(new fe(m)),saturation:C(x),brightness:C(w)}),[]),b=S.useMemo(()=>{const z=new Te({width:s,height:n,depth:c,sliceSpacing:d,segments:i,camera:A,textureNoise:E,textureProfile:D}),G=z.material;return z.material=Le(K,E,D),G.dispose(),z},[A,c,D,n,E,i,d,K,s]),R=S.useMemo(()=>{const z=new J;return z.setAttribute("position",new N(new Float32Array(ie*3),3)),z},[]);S.useEffect(()=>{E.colorSpace=ee,E.needsUpdate=!0,D.colorSpace=ee,D.needsUpdate=!0},[D,E]),S.useEffect(()=>{b.material.uniforms.magnitude.value=o,b.material.uniforms.lacunarity.value=l,b.material.uniforms.gain.value=f},[b,f,l,o]),S.useEffect(()=>{b.material.uniforms.colorTint.value.set(m)},[b,m]),S.useEffect(()=>{b.material.uniforms.saturation.value=x,b.material.uniforms.brightness.value=w},[w,b,x]),S.useEffect(()=>{b._sliceSpacing=d},[b,d]),S.useEffect(()=>{b.setShowVolume(h)},[b,h]),S.useEffect(()=>{M.current={x:v,z:a}},[v,a]),S.useEffect(()=>()=>{b.geometry.dispose(),b.material.dispose()},[b]),S.useEffect(()=>()=>R.dispose(),[R]),be(({clock:z},G)=>{if(V)b.setControlPoints(V);else{let L=M.current.x,U=M.current.z;if(t){r.current+=G*u;const I=r.current;L+=Math.sin(I*.8)*.14+Math.sin(I*2.1+.5)*.04,U+=Math.cos(I*.65+1.2)*.07+Math.cos(I*1.7)*.03}Ie(_.current,n,s,c,L,U),b.setControlPoints(_.current)}if(b.update(z.getElapsedTime()),g){const L=b._posCurve;if(L?.points?.length>1){const U=L.getPoints(ie-1),I=R.attributes.position;for(let B=0;B<U.length;B+=1)I.setXYZ(B,U[B].x,U[B].y,U[B].z);I.needsUpdate=!0}}});const pe=V?0:n/2;return q.jsx("group",{position:p,rotation:e?[Math.PI,0,0]:[0,0,0],children:q.jsxs("group",{position:[0,pe,0],children:[q.jsx("primitive",{object:b}),g&&q.jsx("line",{geometry:R,children:q.jsx("lineBasicMaterial",{color:4500223,transparent:!0,opacity:.7})})]})})}export{Re as C,ie as G,Te as V,ze as a,je as b,Ie as f,Ce as g,Ue as m};
