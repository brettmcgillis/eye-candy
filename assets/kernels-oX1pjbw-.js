import{N as Xt,u as m,G as Ct,E as Y,f as p,C as dt,h as E,ad as C,V as Me,B as V,ag as bt,c as z,l as Yt,F as H,J as it,k as v,x as $,ao as Kt,j as S,m as nt,v as R,A as K,au as B,a6 as U,M as Z,aD as It,av as st,H as $t,b0 as Ce,b1 as tt,b2 as Re,L as F,I as P,b3 as De,s as G,K as Ne,a4 as Pe,ak as Ue,a3 as te,W as Le,Z as Ae,b4 as ze,b5 as Ht,b6 as Ve,aw as Fe,aN as ee,b7 as Ee,D as Be,z as A,b8 as j,e as Ie,r as $e,p as He,a7 as We,d as St,n as Rt,o as Dt,b9 as et}from"./three.tsl-BCn1EJLR.js";import{an as Nt,I as at,ao as Pt,ap as q,m as I,aq as Ut,ar as Lt,b as se,V as L,H as oe,cX as Oe,al as je}from"./index-CZrCenUx.js";const ut=new I,ht=new Ut;let mt;const pt=H(([e])=>{const t=K(S(e.x,e.y,e.x).mul(.1031)).toVar();return t.addAssign(B(t,t.yzx.add(33.33))),K(t.x.add(t.y).mul(t.z))});function ke(e,t,o){const s=t.mul(o),n=s.sub(.5).floor().add(.5),a=s.sub(n),r=a.mul(p(-.5).add(a.mul(p(1).sub(a.mul(.5))))),i=p(1).add(a.mul(a).mul(p(-2.5).add(a.mul(1.5)))),l=a.mul(p(.5).add(a.mul(p(2).sub(a.mul(1.5))))),h=a.mul(a).mul(p(-.5).add(a.mul(.5))),u=i.add(l),d=l.div(u),c=n.sub(1).div(o),g=n.add(2).div(o),f=n.add(d).div(o),x=(Q,rt)=>e.sample(v(Q,rt)),y=x(c.x,c.y).mul(r.x.mul(r.y)).add(x(f.x,c.y).mul(u.x.mul(r.y))).add(x(g.x,c.y).mul(h.x.mul(r.y))).add(x(c.x,f.y).mul(r.x.mul(u.y))).add(x(f.x,f.y).mul(u.x.mul(u.y))).add(x(g.x,f.y).mul(h.x.mul(u.y))).add(x(c.x,g.y).mul(r.x.mul(h.y))).add(x(f.x,g.y).mul(u.x.mul(h.y))).add(x(g.x,g.y).mul(h.x.mul(h.y))),D=n.div(o),_=n.add(1).div(o),T=x(D.x,D.y),b=x(_.x,D.y),w=x(D.x,_.y),M=x(_.x,_.y),N=U(U(T,b),U(w,M)),W=V(V(T,b),V(w,M));return y.clamp(N,W)}function Wt(e,t,o){const s=Z(e.sample(t).rgb),n=Z(e.sample(t.add(v(o.x,0))).rgb).add(Z(e.sample(t.sub(v(o.x,0))).rgb)).add(Z(e.sample(t.add(v(0,o.y))).rgb)).add(Z(e.sample(t.sub(v(0,o.y))).rgb)).mul(.25);return s.sub(n)}class Ge extends Nt{static get type(){return"DatamoshNode"}constructor(t,o){super("vec4"),this.textureNode=t,this.velocityNode=o,this.corruption=m(0),this.displace=m(1),this.blockSize=m(16),this.residual=m(1),this.residualQuant=m(0),this.mvPrecision=m(0),this.skipThreshold=m(0),this.wrongVectors=m(0),this.lostLayers=m(0),this.lostCell=m(64),this.lostLife=m(.4),this.lostChance=m(0),this._compRT=new at(1,1,{depthBuffer:!1}),this._compRT.texture.name="DatamoshNode.comp",this._oldRT=new at(1,1,{depthBuffer:!1}),this._oldRT.texture.name="DatamoshNode.old",this._textureNode=Ct(this,this._compRT.texture),this._textureNodeOld=Y(this._oldRT.texture),this._materialComposed=null,this.updateBeforeType=Pt.FRAME}getTextureNode(){return this._textureNode}setSize(t,o){this._compRT.setSize(t,o),this._oldRT.setSize(t,o)}updateBefore(t){const{renderer:o}=t;mt=q.resetRendererState(o,mt);const s=this.textureNode.value;this._compRT.texture.type=s.type,this._oldRT.texture.type=s.type,o.getDrawingBufferSize(ut),this.setSize(ut.x,ut.y),this._textureNode.value=this._compRT.texture,this._textureNodeOld.value=this._oldRT.texture,ht.material=this._materialComposed,ht.name="Datamosh",o.setRenderTarget(this._compRT),ht.render(o);const n=this._oldRT;this._oldRT=this._compRT,this._compRT=n,q.restoreRendererState(o,mt)}_packetLoss(t){const o=p(0).toVar();for(let s=0;s<3;s+=1){const n=dt(p(s+1),this.lostLayers),a=this.lostCell.max(2).mul(2**s),r=E(t.mul(C).div(a)),i=pt(r.add(s*37.1+3.7)),l=E(Me.div(this.lostLife.max(.01)).add(i)),h=pt(r.mul(1.37).add(l.mul(7.77)).add(s*23.1));o.assign(V(o,dt(h,this.lostChance).mul(n)))}return o}_motion(t){const o=this.blockSize.max(1),s=E(t.mul(C).div(o)),n=dt(pt(s.add(11.3)),this.wrongVectors),a=s.add(n).add(.5).mul(o).div(C),i=this.velocityNode.sample(a).xy.mul(this.displace).mul(C).toVar(),l=this.mvPrecision;i.assign(l.greaterThan(0).select(bt(i.mul(l)).div(l.max(.001)),i));const h=this.skipThreshold.max(.001),d=z(h.mul(.5),h,Yt(i)).mul(this._packetLoss(t).oneMinus());return i.mul(d).div(C).clamp(-.25,.25)}setup(t){const{textureNode:o}=this,s=this._textureNodeOld,n=H(()=>{const r=it(),i=v(1).div(C),l=this._motion(r).toVar(),h=r.sub(l),u=o.sample(r),d=ke(s,h,C),c=Wt(o,r,i),g=Wt(s,h,i),f=V($(c).sub($(g)),0).mul(Kt(c)),x=this.residualQuant,y=x.greaterThan(0).select(bt(f.mul(x)).div(x.max(.001)),f),D=d.rgb.add(S(y.mul(this.residual)));return nt(u,R(D,d.a),this.corruption)}),a=this._materialComposed||(this._materialComposed=new Lt);return a.name="Datamosh",a.fragmentNode=n(),t.getNodeProperties(this).textureNode=o,this._textureNode}dispose(){this._compRT.dispose(),this._oldRT.dispose(),this._materialComposed!==null&&this._materialComposed.dispose()}}const xs=(e,t)=>new Ge(Xt(e),t),ft=new Ut,qe=new I,X=[new L(1,0,0),new L(-1,0,0),new L(0,1,0),new L(0,-1,0),new L(0,0,1),new L(0,0,-1)],Qe=X.map(()=>new je),J=new L,Ze=new L,Ot=new se,jt=new Oe;let xt;class Je extends Nt{static get type(){return"GodraysNode"}constructor(t,o,s){super("vec4"),this.depthNode=t,this.raymarchSteps=m(It(60)),this.density=m(p(.7)),this.maxDensity=m(p(.5)),this.distanceAttenuation=m(p(2)),this.resolutionScale=.5,this.updateBeforeType=Pt.FRAME,this._cameraMatrixWorld=m(o.matrixWorld),this._cameraProjectionMatrixInverse=m(o.projectionMatrixInverse),this._premultipliedLightCameraMatrix=m(new se),this._cameraPosition=m(new L),this._cameraNear=st("near","float",o),this._cameraFar=st("far","float",o),this._shadowCameraNear=st("near","float",s.shadow.camera),this._shadowCameraFar=st("far","float",s.shadow.camera),this._fNormals=$t(X.map(()=>new L)),this._fConstants=$t(X.map(()=>0)),this._spotDirection=m(new L(0,-1,0)),this._spotCosOuter=m(p(-1)),this._spotCosInner=m(p(-1)),this._light=s,this._camera=o,this._godraysRenderTarget=new at(1,1,{depthBuffer:!1,type:oe}),this._godraysRenderTarget.texture.name="Godrays",this._material=new Lt,this._material.name="Godrays",this._textureNode=Ct(this,this._godraysRenderTarget.texture)}getTextureNode(){return this._textureNode}setSize(t,o){t=Math.round(this.resolutionScale*t),o=Math.round(this.resolutionScale*o),this._godraysRenderTarget.setSize(t,o)}updateBefore(t){const{renderer:o}=t;xt=q.resetRendererState(o,xt);const s=o.getDrawingBufferSize(qe);this.setSize(s.width,s.height),ft.material=this._material,ft.name="Godrays",this._updateLightParams(),this._cameraPosition.value.setFromMatrixPosition(this._camera.matrixWorld),o.setClearColor(16777215,1),o.setRenderTarget(this._godraysRenderTarget),ft.render(o),q.restoreRendererState(o,xt)}_updateLightParams(){const t=this._light,o=t.shadow.camera;if(t.isSpotLight){t.updateMatrixWorld(),t.target.updateMatrixWorld(),J.setFromMatrixPosition(t.target.matrixWorld).sub(Ze.setFromMatrixPosition(t.matrixWorld)).normalize(),this._spotDirection.value.copy(J);const s=Math.cos(t.angle);this._spotCosOuter.value=s,this._spotCosInner.value=Math.max(Math.cos(t.angle*(1-(t.penumbra??0))),s+.001)}if(this._premultipliedLightCameraMatrix.value.multiplyMatrices(o.projectionMatrix,o.matrixWorldInverse),t.isPointLight)for(let s=0;s<X.length;s++){const n=X[s],a=Qe[s];J.copy(t.position),J.addScaledVector(n,o.far),a.setFromNormalAndCoplanarPoint(n,J),this._fNormals.array[s].copy(a.normal),this._fConstants.array[s]=a.constant}else if(t.isDirectionalLight||t.isSpotLight){Ot.multiplyMatrices(o.projectionMatrix,o.matrixWorldInverse),jt.setFromProjectionMatrix(Ot);for(let s=0;s<6;s++){const n=jt.planes[s];this._fNormals.array[s].copy(n.normal).multiplyScalar(-1),this._fConstants.array[s]=n.constant*-1}}}setup(t){const o=it(),s=Ce(this._light),n=u=>{const d=this.depthNode.sample(u).r;if(t.renderer.logarithmicDepthBuffer===!0){const c=ze(d,this._cameraNear,this._cameraFar);return Ht(c,this._cameraNear,this._cameraFar)}return d},a=(u,d,c)=>B(u,d).add(c),r=(u,d,c,g)=>{const f=B(c,d);return a(u,c,g).div(f).negate()},i=u=>{const d=Ee(this._light).mul(u),c=d.xyz.div(d.w);return S(c.x,c.y.oneMinus(),c.z)},l=u=>{const d=this._light.shadow&&this._light.shadow.map;if(!d||!d.depthTexture)return v(1,0);if(this._light.isPointLight){const c=u.sub(s).toConst(),g=c.abs().toConst(),f=g.x.max(g.y).max(g.z).negate(),x=Ht(f,this._shadowCameraNear,this._shadowCameraFar),y=Ve(this._light.shadow.map.depthTexture,c).compare(x).r;return v(y.oneMinus().add(.005),f.negate())}if(this._light.isDirectionalLight||this._light.isSpotLight){const c=i(u).toConst(),g=c.x.greaterThanEqual(0).and(c.x.lessThanEqual(1)).and(c.y.greaterThanEqual(0)).and(c.y.lessThanEqual(1)).and(c.z.greaterThanEqual(0)).and(c.z.lessThanEqual(1)),f=v(1,0);return P(g.equal(!0),()=>{const x=Y(this._light.shadow.map.depthTexture,c.xy).compare(c.z).r,y=Fe(c.z,this._shadowCameraNear,this._shadowCameraFar);f.assign(v(x.oneMinus(),y.negate()))}),f}throw new Error("GodraysNode: Unsupported light type.")},h=H(()=>{const u=R(0,0,0,1).toVar(),d=tt(!1),c=n(o).toConst(),g=Re(o,c,this._cameraProjectionMatrixInverse).toConst(),f=this._cameraMatrixWorld.mul(g),x=p(-1e4).toVar();F(6,({i:_})=>{x.assign(V(x,a(this._cameraPosition,this._fNormals.element(_),this._fConstants.element(_))))});const y=this._cameraPosition.toVar();P(x.lessThan(0),()=>{F(6,({i:_})=>{P(a(f,this._fNormals.element(_),this._fConstants.element(_)).greaterThan(0),()=>{const T=f.sub(this._cameraPosition).toConst(),b=r(this._cameraPosition,T,this._fNormals.element(_),this._fConstants.element(_));f.assign(this._cameraPosition.add(b.mul(T)))})})}).Else(()=>{const _=f.sub(this._cameraPosition).toConst(),T=p(1e4).toVar();F(6,({i:b})=>{const w=r(this._cameraPosition,_,this._fNormals.element(b),this._fConstants.element(b));P(w.lessThan(T).and(w.greaterThan(0)),()=>{T.assign(w)})}),P(T.equal(1e4),()=>{d.assign(!0)}).Else(()=>{y.assign(this._cameraPosition.add(T.add(.001).mul(_)));const b=p(-1e4).toVar();F(6,({i:w})=>{b.assign(V(b,a(f,this._fNormals.element(w),this._fConstants.element(w))))}),P(b.greaterThanEqual(0),()=>{const w=p(1e4).toVar();F(6,({i:M})=>{P(a(f,this._fNormals.element(M),this._fConstants.element(M)).greaterThan(0),()=>{const N=r(y,_,this._fNormals.element(M),this._fConstants.element(M));P(N.lessThan(w).and(N.greaterThan(0)),()=>{w.assign(N)})})}),P(w.lessThan(f.distance(y)),()=>{f.assign(y.add(w.mul(_)))})})})});const D=_=>{if(!this._light.isSpotLight)return p(1);const T=ee(_.sub(s));return z(this._spotCosOuter,this._spotCosInner,B(T,this._spotDirection))};return P(d.equal(!1),()=>{const _=p(0).toVar(),T=De(G).toConst(),b=bt(Ne(this.raymarchSteps,Pe(this.raymarchSteps.div(8).add(2),T))).toConst(),w=It(b).toConst();F(w,({i:M})=>{const N=nt(y,f,p(M).div(b)).toConst(),W=l(N),Q=W.x.oneMinus().mul(D(N)).toConst();_.addAssign(Q.mul(Ue(y,f).mul(this.density.div(100))).mul(te(W.y.div(this._shadowCameraFar).oneMinus(),this.distanceAttenuation)))}),_.divAssign(b),u.assign(R(S(Le(Ae(_.negate()).oneMinus(),0,this.maxDensity)),c))}),u});return this._material.fragmentNode=h().context(t.getSharedContext()),this._material.needsUpdate=!0,this._textureNode}dispose(){this._godraysRenderTarget.dispose(),this._material.dispose()}}const gs=(e,t,o)=>new Je(e,t,o),k=new Ut,gt=new I;let vt;const ne=S(.299,.587,.114),Xe=[[-1,-1,1],[0,-1,2],[1,-1,1],[-.5,-.5,4],[.5,-.5,4],[-1,0,2],[0,0,4],[1,0,2],[-.5,.5,4],[.5,.5,4],[-1,1,1],[0,1,2],[1,1,1]],Ye=[[-1,-1,1],[0,-1,2],[1,-1,1],[-1,0,2],[0,0,4],[1,0,2],[-1,1,1],[0,1,2],[1,1,1]],ae=e=>V($(e.x.sub(.5)),$(e.y.sub(.5))).lessThan(.5);function kt(e,t,o){let s=R(0);return Xe.forEach(([n,a,r])=>{const i=t.sub(o.mul(v(n,a))),l=e.sample(i).rgb,h=R(l,B(ne,l).mul(.5).add(1));s=s.add(A(ae(i),h,R(0)).mul(r))}),A(s.w.greaterThan(.001),s.rgb.div(s.w),S(0))}function _t(e,t,o){let s=R(0);return Ye.forEach(([n,a,r])=>{const i=t.sub(o.mul(v(n,a)));s=s.add(A(ae(i),e.sample(i),R(0)).mul(r/16))}),s}class Ke extends Nt{static get type(){return"MipBloomNode"}constructor(t,{levels:o=6,strength:s=1,threshold:n=1}={}){super("vec4"),this.inputNode=t,this.levels=o,this.strength=m(s),this.threshold=m(n),this.updateBeforeType=Pt.FRAME;const a=()=>new at(1,1,{depthBuffer:!1,type:oe});this.down=Array.from({length:o+1},a),this.up=Array.from({length:o},a),this.texels={down:this.down.map(()=>m(new I)),input:m(new I),up:this.up.map(()=>m(new I))},this.downMaterials=[],this.upMaterials=[]}setSize(t,o){this.texels.input.value.set(1/t,1/o),this.down.forEach((s,n)=>{const a=Math.max(1,Math.floor(t/2**(n+1))),r=Math.max(1,Math.floor(o/2**(n+1)));s.setSize(a,r),this.texels.down[n].value.set(1/a,1/r),this.up[n]&&(this.up[n].setSize(a,r),this.texels.up[n].value.set(1/a,1/r))})}updateBefore(t){const{renderer:o}=t;vt=q.resetRendererState(o,vt),o.getDrawingBufferSize(gt),this.setSize(gt.width,gt.height),this.down.forEach((s,n)=>{o.setRenderTarget(s),k.material=this.downMaterials[n],k.name=`MipBloom [ Down ${n} ]`,k.render(o)});for(let s=this.up.length-1;s>=0;s-=1)o.setRenderTarget(this.up[s]),k.material=this.upMaterials[s],k.name=`MipBloom [ Up ${s} ]`,k.render(o);q.restoreRendererState(o,vt)}setup(t){const o=t.getSharedContext(),s=it(),n=(r,i)=>{const l=new Lt;return l.fragmentNode=r.context(o),l.name=i,l};this.downMaterials=this.down.map((r,i)=>{if(i===0){const l=kt(this.inputNode,s,this.texels.input),h=B(ne,l),u=A(h.lessThan(1e-4),S(h),l.div(h));return n(R(V(h.sub(this.threshold),0).mul(u),1),"MipBloom_down0")}return n(R(kt(Y(this.down[i-1].texture),s,this.texels.down[i-1]),1),`MipBloom_down${i}`)}),this.upMaterials=this.up.map((r,i)=>{let l=_t(Y(this.down[i+1].texture),s,this.texels.down[i+1]);return i<this.up.length-1&&(l=l.add(_t(Y(this.up[i+1].texture),s,this.texels.up[i+1]))),n(R(l.rgb,1),`MipBloom_up${i}`)});const a=_t(Ct(this,this.up[0].texture),s,this.texels.up[0]);return R(a.rgb.mul(this.strength),p(1))}dispose(){[...this.down,...this.up].forEach(t=>t.dispose()),[...this.downMaterials,...this.upMaterials].forEach(t=>t.dispose())}}const vs=(e,t)=>Be(new Ke(Xt(e),t)),_s=H(([e])=>{const t=p(.1),o=S(t,0,0),s=S(0,t,0),n=S(0,0,t),a=j(e.sub(o)),r=j(e.add(o)),i=j(e.sub(s)),l=j(e.add(s)),h=j(e.sub(n)),u=j(e.add(n)),d=l.z.sub(i.z).sub(u.y).add(h.y),c=u.x.sub(h.x).sub(r.z).add(a.z),g=r.y.sub(a.y).sub(l.x).add(i.x);return S(d,c,g).div(t.mul(2))}),{PI:wt}=Math,yt=.5451,ts=H(([e,t,o,s])=>{const n=e.dFdx(),r=e.dFdy().cross(t),i=t.cross(n),l=n.dot(r),h=Kt(l).mul(o.mul(r).add(s.mul(i)));return ee($(l).mul(t).sub(h))});function Gt(e){return K(St(e.mul(12.9898)).mul(43758.5453))}function qt(e,{threadsU:t,threadsV:o,slub:s}){const n=v(e.x.mul(t),e.y.mul(o)),a=E(n),r=n.sub(a),i=We(n.x.add(n.y).mul(wt)).mul(.5).add(.5),l=Gt(a.x).mul(s).add(p(1).sub(s.mul(.5))),h=Gt(a.y.add(7.3)).mul(s).add(p(1).sub(s.mul(.5))),u=St(r.x.mul(wt)).mul(i).mul(l),d=St(r.y.mul(wt)).mul(p(1).sub(i)).mul(h);return V(u,d)}function Qt(e,t,o){const s=U(e.x,e.x.oneMinus()).mul(t),n=U(e.y,e.y.oneMinus()).mul(o);return U(s,n)}function ws({uvNode:e=it(),amount:t,threadsU:o,threadsV:s,depth:n,slub:a,aspectU:r=p(1),aspectV:i=p(1),panelWidth:l=p(1),weaveShade:h,weaveRoughness:u,hemWidth:d,hemDepth:c,stitchPitch:g,wearScale:f,wearAmount:x}){const y={threadsU:o,threadsV:s,slub:a},D=v(e.x.mul(o),e.y.mul(s)),_=Yt(Ie(D)),T=z(.35,1.1,_).oneMinus(),b=Qt(e,r,i),w=d.mul(.12).add(5e-4),M=z(d.sub(w),d.add(w),b).oneMinus(),N=U(e.y,e.y.oneMinus()).lessThan(U(e.x,e.x.oneMinus())),W=N.select(e.x,e.y),Q=$(b.sub(d.mul(.55))),rt=z(d.mul(.06),d.mul(.14),Q).oneMinus(),ce=z(.42,.5,K(W.mul(g))),de=rt.mul(ce).mul(M),zt=$e(e.mul(f),3,2,.5).mul(.5).add(.5).clamp(0,1),ue=n.mul(l).div(o.max(1)),Vt=c.mul(l).mul(.001),lt=O=>{const we=qt(O,y).mul(T).mul(ue),Et=Qt(O,r,i),Bt=z(d.sub(w),d.add(w),Et).oneMinus(),ye=$(Et.sub(d.mul(.55))),Te=z(d.mul(.06),d.mul(.14),ye).oneMinus(),be=N.select(O.x,O.y),Se=z(.42,.5,K(be.mul(g)));return we.add(Bt.mul(Vt)).add(Te.mul(Se).mul(Bt).mul(Vt.mul(.6)))},ct=lt(e),he=lt(e.add(e.dFdx())).sub(ct),me=lt(e.add(e.dFdy())).sub(ct),pe=he.mul(t),fe=me.mul(t),Ft=nt(p(yt),qt(e,y),T).sub(yt).div(yt),xe=zt.sub(.5).mul(x).mul(.5),ge=Ft.mul(h).add(1).add(xe).sub(de.mul(.2)).clamp(0,1.6),ve=nt(p(1),ge,t),_e=Ft.negate().mul(u).add(zt.sub(.5).mul(x).mul(.25)).mul(t);return{normalNode:O=>ts(He,O,pe,fe),shadeNode:ve,roughnessDelta:_e,heightNode:ct}}function ys(e={}){return{cellSize:m(e.cellSize??12),levels:m(Rt(e.levels??3)),threshold:m(e.threshold??.55),varianceThreshold:m(e.varianceThreshold??.12),noiseScale:m(e.noiseScale??1.5),seed:m(e.seed??0),jitterAmount:m(e.jitterAmount??.12),outlineWidth:m(e.outlineWidth??.08),outlineStrength:m(e.outlineStrength??.5),pointerUV:m(e.pointerUV??new I(-1,-1)),pointerRadius:m(e.pointerRadius??.25),pointerStrength:m(e.pointerStrength??0)}}function Ts(e,t){t.cellSize!==void 0&&(e.cellSize.value=t.cellSize),t.levels!==void 0&&(e.levels.value=t.levels),t.threshold!==void 0&&(e.threshold.value=t.threshold),t.varianceThreshold!==void 0&&(e.varianceThreshold.value=t.varianceThreshold),t.noiseScale!==void 0&&(e.noiseScale.value=t.noiseScale),t.seed!==void 0&&(e.seed.value=t.seed),t.jitterAmount!==void 0&&(e.jitterAmount.value=t.jitterAmount),t.outlineWidth!==void 0&&(e.outlineWidth.value=t.outlineWidth),t.outlineStrength!==void 0&&(e.outlineStrength.value=t.outlineStrength),t.pointerUV!==void 0&&e.pointerUV.value.set(t.pointerUV.x,t.pointerUV.y),t.pointerRadius!==void 0&&(e.pointerRadius.value=t.pointerRadius),t.pointerStrength!==void 0&&(e.pointerStrength.value=t.pointerStrength)}function es(e,t){const o=C.x.div(C.y),s=e.sub(t.pointerUV);return v(s.x.mul(o),s.y).length()}function ie(e,t,o){const s=o.pointerRadius.div(te(2,p(t))),n=es(e,o).lessThan(s);return A(o.pointerStrength.lessThan(0),n.not(),n)}function re(e,t){return Dt(e.add(v(91.7,47.3))).mul(2).sub(1).mul(t.jitterAmount).add(1)}function le(e,t){return z(0,t.outlineWidth,e).oneMinus().mul(t.outlineStrength).oneMinus()}const ss=S(.299,.587,.114);function os(e,t,o){return Dt(e.mul(o.noiseScale).add(v(p(t).mul(13.7),o.seed))).greaterThan(o.threshold)}function ns(e,t,o,s){const n=t.div(2),a=e.mul(t),r=g=>B(o(a.add(n.mul(g)).div(C)).rgb,ss),i=r(v(.5,.5)),l=r(v(1.5,.5)),h=r(v(.5,1.5)),u=r(v(1.5,1.5)),d=i.max(l).max(h).max(u),c=i.min(l).min(h).min(u);return d.sub(c).greaterThan(s.varianceThreshold)}function bs(e,t,{driver:o}){return H(()=>{const s=t.cellSize.toVar(),n=tt(!0).toVar();F({start:Rt(0),end:t.levels,type:"int",condition:"<"},({i:g})=>{const f=E(G.xy.div(s));let x;if(o==="pointer"){const y=f.add(.5).mul(s).div(C);x=ie(y,g,t)}else o==="variance"?x=ns(f,s,e,t):x=os(f,g,t);P(n.and(x),()=>{s.assign(s.div(2))}).Else(()=>{n.assign(tt(!1))})});const a=E(G.xy.div(s)),i=a.add(.5).mul(s).div(C),l=e(i),h=re(a,t),u=G.xy.div(s).sub(a),d=U(u,u.oneMinus()),c=U(d.x,d.y);return R(l.rgb.mul(h).mul(le(c,t)),l.a)})()}const as=S(.299,.587,.114),is=.5773502692,rs=1.1547005384,ls=.8660254038;function Zt(e,t){return v(e.x.sub(e.y.mul(is)),e.y.mul(rs)).div(t)}function Mt(e,t){return v(e.x.add(e.y.mul(.5)),e.y.mul(ls)).mul(t)}function cs(e,t){const o=A(t,e.add(v(1,0)),e),s=A(t,e.add(v(0,1)),e.add(v(1,0))),n=A(t,e.add(v(1,1)),e.add(v(0,1)));return[o,s,n]}function Jt(e,t){return A(t,e.add(v(2/3,2/3)),e.add(v(1/3,1/3)))}function ds(e,t,o,s){const n=A(t,p(1),p(0));return Dt(e.mul(s.noiseScale).add(v(p(o).mul(13.7),s.seed)).add(v(n.mul(3.1),n.mul(7.3)))).greaterThan(s.threshold)}function us(e,t,o,s,n){const[a,r,i]=cs(e,t),l=f=>B(s(Mt(f,o).div(C)).rgb,as),h=l(a),u=l(r),d=l(i),c=h.max(u).max(d),g=h.min(u).min(d);return c.sub(g).greaterThan(n.varianceThreshold)}function Ss(e,t,{driver:o}){return H(()=>{const s=t.cellSize.toVar(),n=tt(!0).toVar();F({start:Rt(0),end:t.levels,type:"int",condition:"<"},({i:y})=>{const D=Zt(G.xy,s),_=E(D),T=D.sub(_),w=p(1).sub(T.x).sub(T.y).lessThan(0);let M;if(o==="pointer"){const N=Mt(Jt(_,w),s).div(C);M=ie(N,y,t)}else o==="variance"?M=us(_,w,s,e,t):M=ds(_,w,y,t);P(n.and(M),()=>{s.assign(s.div(2))}).Else(()=>{n.assign(tt(!1))})});const a=Zt(G.xy,s),r=E(a),i=a.sub(r),l=p(1).sub(i.x).sub(i.y),h=l.lessThan(0),u=Jt(r,h),d=Mt(u,s).div(C),c=e(d),g=A(h,p(1),p(0)),f=re(r.add(v(g.mul(3.1),g.mul(7.3))),t),x=U(i.x,U(i.y,l.abs()));return R(c.rgb.mul(f).mul(le(x,t)),c.a)})()}S(.2126,.7152,.0722);S(.2126,.7152,.0722);const Tt=" .,:-=+*%#$";et(`
  fn asciiAtlasMotion(
    asciiTexture: texture_2d<f32>,
    inputUv: vec2f,
    grid: vec2f,
    value: f32
  ) -> f32 {
    let cellUv = fract(inputUv * grid);
    let characterIndex = clamp(
      floor(clamp(value, 0.0, 1.0) * f32(${Tt.length-1})),
      0.0,
      f32(${Tt.length-1})
    );
    let atlasUv = vec2f(
      (characterIndex + cellUv.x) / f32(${Tt.length}),
      cellUv.y
    );
    let atlasDimensions = textureDimensions(asciiTexture);
    let atlasCoord = clamp(
      vec2i(atlasUv * vec2f(atlasDimensions)),
      vec2i(0),
      vec2i(atlasDimensions) - vec2i(1)
    );

    return textureLoad(asciiTexture, atlasCoord, 0).r;
  }
`);S(0,.5,2);S(1,.35,.5);S(.299,.587,.114);et(`
  fn arrowVectorMotion(
    stateTexture: texture_2d<f32>,
    inputUv: vec2f,
    snappedUv: vec2f,
    grid: vec2f
  ) -> f32 {
    let cellUv = ((inputUv - snappedUv) * grid + vec2f(0.5)) * 2.0 - 1.0;
    let state = textureLoad(
      stateTexture,
      clamp(
        vec2i(snappedUv * vec2f(textureDimensions(stateTexture))),
        vec2i(0),
        vec2i(textureDimensions(stateTexture)) - vec2i(1)
      ),
      0
    );
    let motion = smoothstep(0.04, 0.18, state.a);
    let flow = state.gb * 2.0 - 1.0;
    let flowLength = length(flow);

    if (motion <= 0.0 || flowLength <= 0.001) {
      return 0.0;
    }

    let direction = flow / flowLength;
    let normal = vec2f(-direction.y, direction.x);
    let arrowUv = vec2f(dot(cellUv, direction), dot(cellUv, normal));
    let directionConfidence = smoothstep(0.08, 0.65, flowLength);
    let motionConfidence = smoothstep(0.04, 0.3, state.a);
    let scale = mix(0.45, 1.0, directionConfidence * motionConfidence);
    let arrowTail = -0.58;
    let arrowTip = 0.66;
    let shaftEnd = 0.1;
    let shaftHalfWidth = 0.065;
    let headStart = -0.20;
    let headBaseWidth = 0.42;
    let shaft = select(0.0, 1.0, arrowUv.x >= arrowTail * scale) *
      select(0.0, 1.0, arrowUv.x <= shaftEnd * scale) *
      select(0.0, 1.0, abs(arrowUv.y) <= shaftHalfWidth * scale);
    let headHalfWidth = max(
      (arrowTip * scale - arrowUv.x) * headBaseWidth,
      0.0
    );
    let head = select(0.0, 1.0, arrowUv.x >= headStart * scale) *
      select(0.0, 1.0, arrowUv.x <= arrowTip * scale) *
      select(0.0, 1.0, abs(arrowUv.y) <= headHalfWidth);

    return max(shaft, head) * motion;
  }
`);const hs=`
      let coord = vec2u(index % dimensions.x, index / dimensions.x);
      let sceneDimensions = textureDimensions(sceneTexture);
      let sceneUv = (vec2f(coord) + vec2f(0.5)) / vec2f(dimensions);
      let sceneCoord = clamp(
        vec2i(sceneUv * vec2f(sceneDimensions)),
        vec2i(0),
        vec2i(sceneDimensions) - vec2i(1)
      );
      let sceneColor = textureLoad(sceneTexture, sceneCoord, 0).rgb;
      let currentLuminance = dot(sceneColor, vec3f(0.299, 0.587, 0.114));
      let previousState = textureLoad(stateReadTexture, vec2i(coord), 0);
      let difference = abs(currentLuminance - previousState.r);`,At=e=>`
    fn ${e}(
      sceneTexture: texture_2d<f32>,
      stateReadTexture: texture_2d<f32>,
      stateWriteTexture: texture_storage_2d<rgba8unorm, write>,
      hasPreviousFrame: bool,
      motionThreshold: f32,
      trailDecay: f32,
      index: u32
    ) -> void {
      let dimensions = textureDimensions(stateWriteTexture);
      let pixelCount = dimensions.x * dimensions.y;

      if (index >= pixelCount) {
        return;
      }
${hs}`;et(`${At("computeMotionMask")}
      var motionAmount = 0.0;

      if (hasPreviousFrame) {
        let thresholdedMotion = smoothstep(
          motionThreshold,
          motionThreshold * 4.0,
          difference
        );

        motionAmount = pow(thresholdedMotion, 0.5);
      }

      let decayedTrail = max(previousState.g * trailDecay - 0.025, 0.0);
      let motionTrail = max(decayedTrail, motionAmount);

      textureStore(
        stateWriteTexture,
        vec2i(coord),
        vec4f(currentLuminance, motionTrail, 0.0, 1.0)
      );
    }
`);et(`${At("computeBlobMotion")}
      var motion = 0.0;

      if (hasPreviousFrame) {
        motion = smoothstep(
          motionThreshold,
          motionThreshold * 20.0,
          difference
        ) * 20.0;
      }

      let trail = max(previousState.a * trailDecay, motion);

      textureStore(
        stateWriteTexture,
        vec2i(coord),
        vec4f(currentLuminance, motion, 0.0, trail)
      );
    }
`);const ot=(e,t)=>`
      let ${e}Coord = clamp(
        vec2i(coord) ${t},
        vec2i(0),
        vec2i(dimensions) - vec2i(1)
      );
      let ${e}Match = abs(
        currentLuminance - textureLoad(stateReadTexture, ${e}Coord, 0).r
      );`;et(`${At("computeFlow")}
      var motion = 0.0;

      if (hasPreviousFrame) {
        motion = smoothstep(
          motionThreshold,
          motionThreshold * 10.0,
          difference
        ) * 10.0;
      }
${ot("left","- vec2i(1, 0)")}
${ot("right","+ vec2i(1, 0)")}
${ot("up","- vec2i(0, 1)")}
${ot("down","+ vec2i(0, 1)")}
      let rawFlow = vec2f(
        rightMatch - leftMatch,
        downMatch - upMatch
      );
      let flowLength = length(rawFlow);
      var flowDirection = vec2f(0.0);

      if (flowLength > 0.001 && motion > 0.0) {
        flowDirection = rawFlow / flowLength;
      }

      let previousFlow = previousState.gb * 2.0 - 1.0;
      let trailFlow = mix(
        previousFlow * trailDecay,
        flowDirection,
        clamp(motion, 0.0, 1.0)
      );
      let encodedTrailFlow = trailFlow * 0.5 + 0.5;
      let trailAlpha = max(previousState.a * trailDecay, motion);

      textureStore(
        stateWriteTexture,
        vec2i(coord),
        vec4f(currentLuminance, encodedTrailFlow, trailAlpha)
      );
    }
`);export{ys as a,Ss as b,_s as c,bs as d,xs as e,ws as f,gs as g,vs as m,Ts as u};
