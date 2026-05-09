import{a6 as K,r as E,aG as q,as as D,ac as Y,j as I,ap as T,a7 as m,aK as J,at as O,aL as $,aw as X,az as Z,aa as ee,a8 as te,aF as se,aM as re,aN as ne,aO as ie,aP as N,aQ as k,aR as L,aS as B,aT as W}from"./index-fWJAS7dd.js";const oe=`
    attribute vec3 position;
    attribute vec3 tex;
    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;
    varying vec3 texOut;
    void main(void) {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        texOut = tex;
    }
`,ae=`
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
`;class le{constructor(){this.contents=[],this.sorted=!1}sort(){this.contents.sort((e,r)=>e.priority-r.priority),this.sorted=!0}pop(){return this.sorted||this.sort(),this.contents.pop()}top(){return this.sorted||this.sort(),this.contents[this.contents.length-1]}push(e,r){this.contents.push({object:e,priority:r}),this.sorted=!1}}class ce extends J{constructor({width:e=1,height:r=2,depth:o=1,sliceSpacing:a=.1,camera:c=null,textureNoise:n=null,textureProfile:f=null,segments:i=32,debug:t=!1}={}){if(!c)throw new Error("VolumetricFire: 'camera' is required.");(!n||!f)&&console.error("VolumetricFire: 'textureNoise' and 'textureProfile' must be provided.");const l=i*300*6,u=new q;u.setAttribute("position",new D(new Float32Array(l*3),3).setUsage(O)),u.setAttribute("tex",new D(new Float32Array(l*3),3).setUsage(O)),u.setIndex(new D(new Uint32Array(l),1));const x=new $({vertexShader:oe,fragmentShader:ae,uniforms:{nzw:{value:n},fireProfile:{value:f},time:{value:0},magnitude:{value:1.3},lacunarity:{value:2},gain:{value:.5},noiseScale:{value:new te(1,2,1,.3)},colorTint:{value:new ee(1,1,1)},saturation:{value:1},brightness:{value:1.5}},side:Z,blending:X,transparent:!0,depthWrite:!1});super(u,x),this.type="VolumetricFire",this.frustumCulled=!1,this._camera=c,this._sliceSpacing=a,this._segments=i,this._viewVector=new m,this._posCurve=new se,this._posCurve.curveType="centripetal",this._cornerNeighbors=[[1,2,4],[0,5,3],[0,3,6],[1,7,2],[0,6,5],[1,4,7],[2,7,4],[3,5,6]],this._incomingEdges=[[-1,2,4,-1,1,-1,-1,-1],[5,-1,-1,0,-1,3,-1,-1],[3,-1,-1,6,-1,-1,0,-1],[-1,7,1,-1,-1,-1,-1,2],[6,-1,-1,-1,-1,0,5,-1],[-1,4,-1,-1,7,-1,-1,1],[-1,-1,7,-1,2,-1,-1,4],[-1,-1,-1,5,-1,6,3,-1]],this._controlPoints=[],this.setRectangularShape(e,r,o),t&&this._initLatticeWireframe(i)}setRectangularShape(e,r,o){const a=r/2,c=[{pos:new m(0,-a,0),scale:new m(e,1,o),rot:new T},{pos:new m(0,0,0),scale:new m(e,1,o),rot:new T},{pos:new m(0,a,0),scale:new m(e,1,o),rot:new T}];this.setControlPoints(c)}setControlPoints(e){this._controlPoints=e,this._posCurve.points=e.map(r=>r.pos),this._posCurve.updateArcLengths()}update(e){this.material.uniforms.time.value=e;const r=new re;r.multiplyMatrices(this._camera.matrixWorldInverse,this.matrixWorld),this._viewVector.set(-r.elements[2],-r.elements[6],-r.elements[10]).normalize(),this._slice()}_getInterpolatedState(e){const r=this._controlPoints,o=r.length,a=e*(o-1);let c=Math.floor(a),n=c+1,f=a-c;n>=o&&(c=o-1,n=o-1,f=0);const i=r[c],t=r[n],l=this._posCurve.getPoint(e),u=new m().lerpVectors(i.scale,t.scale,f),x=i.rot instanceof T?i.rot:new T().setFromEuler(i.rot),_=t.rot instanceof T?t.rot:new T().setFromEuler(t.rot),v=new T().copy(x).slerp(_,f);return{pos:l,scale:u,quat:v}}_slice(){const e=[],r=[],o=[],a=[];let c=null,n=0;this.wireframe&&this.wireframe.visible&&(c=this.wireframe.geometry.attributes.position.array);for(let t=0;t<=this._segments;t++){const l=t/this._segments,u=this._posCurve.getUtoTmapping(l),x=this._getInterpolatedState(u),_=x.scale.x*.5,v=x.scale.z*.5,y=[new m(-_,0,-v),new m(_,0,-v),new m(_,0,v),new m(-_,0,v)];y.forEach(p=>p.applyQuaternion(x.quat).add(x.pos)),a.push(y),c&&y.forEach(p=>{c[n++]=p.x,c[n++]=p.y,c[n++]=p.z})}this.wireframe&&this.wireframe.visible&&(this.wireframe.geometry.attributes.position.needsUpdate=!0);let f=0;for(let t=0;t<this._segments;t++){const l=a[t],u=a[t+1],x=[l[0],l[1],u[0],u[1],l[3],l[2],u[3],u[2]],_=t/this._segments,v=(t+1)/this._segments,y=[new m(0,_,0),new m(1,_,0),new m(0,v,0),new m(1,v,0),new m(0,_,1),new m(1,_,1),new m(0,v,1),new m(1,v,1)],p=this._sliceHexahedron(x,y,f);for(let g=0;g<p.p.length;g+=3)e.push(p.p[g],p.p[g+1],p.p[g+2]);for(let g=0;g<p.t.length;g+=3)r.push(p.t[g],p.t[g+1],p.t[g+2]);for(let g=0;g<p.i.length;g++)o.push(p.i[g]);f=p.nextIndex}const i=this.geometry;if(e.length>i.attributes.position.array.length){console.warn("VolumetricFire: Vertex buffer overflow. Increase buffer size or adjust segments/sliceSpacing.");return}i.index.array.set(o),i.attributes.position.array.set(e),i.attributes.tex.array.set(r),i.index.needsUpdate=!0,i.attributes.position.needsUpdate=!0,i.attributes.tex.needsUpdate=!0,i.setDrawRange(0,o.length)}_sliceHexahedron(e,r,o){const a=e.map(w=>w.dot(this._viewVector)),c=Math.min(...a),n=Math.max(...a),f=a.indexOf(n);let i=Math.floor(n/this._sliceSpacing)*this._sliceSpacing;const t=[];let l=0;const u=new le,x=(w,S)=>{if(l>=12)return;const P={sIdx:w,eIdx:S,dPos:new m,dTex:new m,pos:new m,tex:new m,prev:0,next:0,expired:!1},s=a[w]-a[S];if(Math.abs(s)>1e-5){const b=1/s;P.dPos.subVectors(e[S],e[w]).multiplyScalar(b),P.dTex.subVectors(r[S],r[w]).multiplyScalar(b);const M=a[w]-i;P.pos.addVectors(P.dPos.clone().multiplyScalar(M),e[w]),P.tex.addVectors(P.dTex.clone().multiplyScalar(M),r[w]),P.dPos.multiplyScalar(this._sliceSpacing),P.dTex.multiplyScalar(this._sliceSpacing)}return u.push(P,a[S]),t[l++]=P,P};for(let w=0;w<3;w++){const S=x(f,this._cornerNeighbors[f][w]);S.prev=(w+2)%3,S.next=(w+1)%3}const _=[],v=[],y=[];let p=o,g=0;for(;i>c;){for(;u.contents.length>0&&u.top().priority>=i;){const s=u.pop().object;if(!s.expired&&!(!t[s.prev]||!t[s.next]))if(s.eIdx!==t[s.prev].eIdx&&s.eIdx!==t[s.next].eIdx){s.expired=!0;const b=x(s.eIdx,this._incomingEdges[s.eIdx][s.sIdx]);if(!b)break;b.prev=s.prev,t[s.prev].next=l-1,b.next=l;const M=x(s.eIdx,this._incomingEdges[s.eIdx][b.eIdx]);if(!M)break;M.prev=l-2,M.next=s.next,t[s.next].prev=l-1,t[M.next].prev=l-1,g=l-1}else{let b,M;if(s.eIdx===t[s.prev].eIdx?(b=t[s.prev],M=s):(b=s,M=t[s.next]),!b||!M)continue;b.expired=!0,M.expired=!0;const d=x(s.eIdx,this._incomingEdges[s.eIdx][b.sIdx]);if(!d)break;d.prev=b.prev,t[b.prev]&&(t[b.prev].next=l-1),d.next=M.next,t[M.next]&&(t[M.next].prev=l-1),g=l-1}}let w=g,S=0,P=0;for(;P++<15&&t[w];){const s=t[w];if(_.push(s.pos.x,s.pos.y,s.pos.z),v.push(s.tex.x,s.tex.y,s.tex.z),s.pos.add(s.dPos),s.tex.add(s.dTex),w=s.next,S++,w===g)break}if(S>=3){for(let s=2;s<S;s++)y.push(p,p+s-1,p+s);p+=S}i-=this._sliceSpacing}return{p:_,t:v,i:y,nextIndex:p}}_initLatticeWireframe(e){const r=new Float32Array((e+1)*4*3),o=new q;o.setAttribute("position",new D(r,3));const a=[];for(let n=0;n<e;n++){const f=n*4,i=(n+1)*4;for(let t=0;t<4;t++)a.push(f+t,f+(t+1)%4),a.push(f+t,i+t)}const c=e*4;for(let n=0;n<4;n++)a.push(c+n,c+(n+1)%4);o.setIndex(a),this.wireframe=new ne(o,new ie({color:4500223,transparent:!0,opacity:.3})),this.wireframe.visible=!0,this.add(this.wireframe)}setShowVolume(e){e&&!this.wireframe&&this._initLatticeWireframe(this._segments),this.wireframe&&(this.wireframe.visible=e)}}let F=null,z=null;function ue(){if(F)return F;const h=64,e=new Uint8Array(h*h*4);for(let r=0;r<h*h;r+=1){const o=Math.random()*Math.PI*2;e[r*4+0]=Math.round((Math.cos(o)*.5+.5)*255),e[r*4+1]=Math.round((Math.sin(o)*.5+.5)*255),e[r*4+2]=128,e[r*4+3]=255}return F=new N(e,h,h,k),F.wrapS=W,F.wrapT=W,F.magFilter=B,F.minFilter=B,F.needsUpdate=!0,F}function fe(){if(z)return z;const h=64,e=64,r=new Uint8Array(h*e*4);for(let o=0;o<e;o+=1)for(let a=0;a<h;a+=1){const c=a/(h-1),n=o/(e-1),f=Math.max(0,1-c*1.2),i=Math.max(0,1-n*.92),t=f*i;let l,u,x;if(n<.12){const y=n/.12;l=.5+y*.5,u=.6+y*.4,x=1}else if(n<.35){const y=(n-.12)/.23;l=1,u=1,x=1-y*.85}else if(n<.7){const y=(n-.35)/.35;l=1,u=1-y*.72,x=.15-y*.12}else{const y=(n-.7)/.3;l=1-y*.5,u=.28-y*.28,x=.03}const _=Math.max(0,1-c*1.1),v=(o*h+a)*4;r[v+0]=Math.min(255,Math.round(l*_*255)),r[v+1]=Math.min(255,Math.round(u*_*255)),r[v+2]=Math.min(255,Math.round(x*_*255)),r[v+3]=Math.min(255,Math.round(t*255))}return z=new N(r,h,e,k),z.wrapS=L,z.wrapT=L,z.magFilter=B,z.minFilter=B,z.needsUpdate=!0,z}const pe=5;function me(h){return Array.from({length:h},()=>({pos:new m,scale:new m(1,1,1),rot:new T}))}function he(h,e,r,o,a,c){const n=e/2;for(let f=0;f<h.length;f+=1){const i=f/(h.length-1),t=i*i,l=r*(1-i*.25),u=o*(1-i*.25);h[f].pos.set(a*t,-n+i*e,c*t),h[f].scale.set(l,1,u)}}const G=41;function de({guideGeo:h}){return I.jsx("line",{geometry:h,children:I.jsx("lineBasicMaterial",{color:4500223,transparent:!0,opacity:.7})})}function ge({position:h=[0,0,0],inverted:e=!1,width:r=.35,height:o=1,depth:a=.35,sliceSpacing:c=.05,segments:n=24,bendX:f=0,bendZ:i=0,animated:t=!0,animSpeed:l=.5,showSpline:u=!1,showVolume:x=!1,magnitude:_=1.3,lacunarity:v=2,gain:y=.5,tintColor:p="#ffffff",saturation:g=1,brightness:w=1.5,controlPoints:S=null}){const{camera:P}=K(),s=E.useRef(0),b=E.useRef({x:f,z:i}),M=E.useRef(null);M.current||(M.current=me(pe));const d=E.useMemo(()=>new ce({width:r,height:o,depth:a,sliceSpacing:c,segments:n,camera:P,textureNoise:ue(),textureProfile:fe()}),[P,n]);E.useEffect(()=>{d.material.uniforms.magnitude.value=_,d.material.uniforms.lacunarity.value=v,d.material.uniforms.gain.value=y},[d,_,v,y]),E.useEffect(()=>{d.material.uniforms.colorTint.value.set(p)},[d,p]),E.useEffect(()=>{d.material.uniforms.saturation.value=g,d.material.uniforms.brightness.value=w},[d,g,w]),E.useEffect(()=>{d._sliceSpacing=c},[d,c]),E.useEffect(()=>{d.setShowVolume(x)},[d,x]),E.useEffect(()=>{b.current={x:f,z:i}},[f,i]),E.useEffect(()=>()=>{d.geometry.dispose(),d.material.dispose()},[d]);const R=E.useMemo(()=>{const j=new q;return j.setAttribute("position",new D(new Float32Array(G*3),3)),j},[]);E.useEffect(()=>()=>R.dispose(),[R]),Y(({clock:j},Q)=>{if(S)d.setControlPoints(S);else{let U=b.current.x,A=b.current.z;if(t){s.current+=Q*l;const V=s.current;U+=Math.sin(V*.8)*.14+Math.sin(V*2.1+.5)*.04,A+=Math.cos(V*.65+1.2)*.07+Math.cos(V*1.7)*.03}he(M.current,o,r,a,U,A),d.setControlPoints(M.current)}if(d.update(j.getElapsedTime()),u){const U=d._posCurve;if(U?.points?.length>1){const A=U.getPoints(G-1),V=R.attributes.position;for(let C=0;C<A.length;C+=1)V.setXYZ(C,A[C].x,A[C].y,A[C].z);V.needsUpdate=!0}}});const H=S?0:o/2;return I.jsx("group",{position:h,rotation:e?[Math.PI,0,0]:[0,0,0],children:I.jsxs("group",{position:[0,H,0],children:[I.jsx("primitive",{object:d}),u&&I.jsx(de,{guideGeo:R})]})})}export{ge as V};
