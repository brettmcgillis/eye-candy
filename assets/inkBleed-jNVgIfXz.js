import{N as se,u,G as ct,E as Z,f,C as gt,h as F,ad as C,V as Ae,B as V,ag as Ut,c as L,l as oe,F as B,J as ot,k as _,x as j,ao as ne,j as y,m as $,v as R,A as et,au as I,a6 as A,M as H,aD as jt,av as it,H as zt,bu as Le,bb as st,be as Ue,L as E,I as D,bi as ze,s as Y,K as Ve,a4 as Be,ak as Ee,a3 as ae,W as Fe,Z as $e,bk as Ie,bl as kt,bv as Oe,aw as We,aN as ie,bw as He,D as je,z,bx as q,e as ke,r as Ge,p as qe,a7 as re,d as dt,n as Bt,o as Et,by as nt,al as Qe,b as rt}from"./three.tsl-CRkVmweJ.js";import{aj as ut,I as J,ak as ht,al as W,m as O,am as at,an as mt,b as le,V as U,H as de,d2 as Ze,ah as Ye,C as Je,aa as Ke}from"./index-DdjF1jp2.js";const _t=new O,vt=new at;let wt;const Tt=B(([e])=>{const t=et(y(e.x,e.y,e.x).mul(.1031)).toVar();return t.addAssign(I(t,t.yzx.add(33.33))),et(t.x.add(t.y).mul(t.z))});function Xe(e,t,s){const o=t.mul(s),n=o.sub(.5).floor().add(.5),a=o.sub(n),r=a.mul(f(-.5).add(a.mul(f(1).sub(a.mul(.5))))),i=f(1).add(a.mul(a).mul(f(-2.5).add(a.mul(1.5)))),l=a.mul(f(.5).add(a.mul(f(2).sub(a.mul(1.5))))),h=a.mul(a).mul(f(-.5).add(a.mul(.5))),m=i.add(l),c=l.div(m),d=n.sub(1).div(s),g=n.add(2).div(s),p=n.add(c).div(s),x=(K,pt)=>e.sample(_(K,pt)),w=x(d.x,d.y).mul(r.x.mul(r.y)).add(x(p.x,d.y).mul(m.x.mul(r.y))).add(x(g.x,d.y).mul(h.x.mul(r.y))).add(x(d.x,p.y).mul(r.x.mul(m.y))).add(x(p.x,p.y).mul(m.x.mul(m.y))).add(x(g.x,p.y).mul(h.x.mul(m.y))).add(x(d.x,g.y).mul(r.x.mul(h.y))).add(x(p.x,g.y).mul(m.x.mul(h.y))).add(x(g.x,g.y).mul(h.x.mul(h.y))),N=n.div(s),v=n.add(1).div(s),b=x(N.x,N.y),S=x(v.x,N.y),T=x(N.x,v.y),M=x(v.x,v.y),P=A(A(b,S),A(T,M)),k=V(V(b,S),V(T,M));return w.clamp(P,k)}function Gt(e,t,s){const o=H(e.sample(t).rgb),n=H(e.sample(t.add(_(s.x,0))).rgb).add(H(e.sample(t.sub(_(s.x,0))).rgb)).add(H(e.sample(t.add(_(0,s.y))).rgb)).add(H(e.sample(t.sub(_(0,s.y))).rgb)).mul(.25);return o.sub(n)}class ts extends ut{static get type(){return"DatamoshNode"}constructor(t,s){super("vec4"),this.textureNode=t,this.velocityNode=s,this.corruption=u(0),this.displace=u(1),this.blockSize=u(16),this.residual=u(1),this.residualQuant=u(0),this.mvPrecision=u(0),this.skipThreshold=u(0),this.wrongVectors=u(0),this.lostLayers=u(0),this.lostCell=u(64),this.lostLife=u(.4),this.lostChance=u(0),this._compRT=new J(1,1,{depthBuffer:!1}),this._compRT.texture.name="DatamoshNode.comp",this._oldRT=new J(1,1,{depthBuffer:!1}),this._oldRT.texture.name="DatamoshNode.old",this._textureNode=ct(this,this._compRT.texture),this._textureNodeOld=Z(this._oldRT.texture),this._materialComposed=null,this.updateBeforeType=ht.FRAME}getTextureNode(){return this._textureNode}setSize(t,s){this._compRT.setSize(t,s),this._oldRT.setSize(t,s)}updateBefore(t){const{renderer:s}=t;wt=W.resetRendererState(s,wt);const o=this.textureNode.value;this._compRT.texture.type=o.type,this._oldRT.texture.type=o.type,s.getDrawingBufferSize(_t),this.setSize(_t.x,_t.y),this._textureNode.value=this._compRT.texture,this._textureNodeOld.value=this._oldRT.texture,vt.material=this._materialComposed,vt.name="Datamosh",s.setRenderTarget(this._compRT),vt.render(s);const n=this._oldRT;this._oldRT=this._compRT,this._compRT=n,W.restoreRendererState(s,wt)}_packetLoss(t){const s=f(0).toVar();for(let o=0;o<3;o+=1){const n=gt(f(o+1),this.lostLayers),a=this.lostCell.max(2).mul(2**o),r=F(t.mul(C).div(a)),i=Tt(r.add(o*37.1+3.7)),l=F(Ae.div(this.lostLife.max(.01)).add(i)),h=Tt(r.mul(1.37).add(l.mul(7.77)).add(o*23.1));s.assign(V(s,gt(h,this.lostChance).mul(n)))}return s}_motion(t){const s=this.blockSize.max(1),o=F(t.mul(C).div(s)),n=gt(Tt(o.add(11.3)),this.wrongVectors),a=o.add(n).add(.5).mul(s).div(C),i=this.velocityNode.sample(a).xy.mul(this.displace).mul(C).toVar(),l=this.mvPrecision;i.assign(l.greaterThan(0).select(Ut(i.mul(l)).div(l.max(.001)),i));const h=this.skipThreshold.max(.001),c=L(h.mul(.5),h,oe(i)).mul(this._packetLoss(t).oneMinus());return i.mul(c).div(C).clamp(-.25,.25)}setup(t){const{textureNode:s}=this,o=this._textureNodeOld,n=B(()=>{const r=ot(),i=_(1).div(C),l=this._motion(r).toVar(),h=r.sub(l),m=s.sample(r),c=Xe(o,h,C),d=Gt(s,r,i),g=Gt(o,h,i),p=V(j(d).sub(j(g)),0).mul(ne(d)),x=this.residualQuant,w=x.greaterThan(0).select(Ut(p.mul(x)).div(x.max(.001)),p),N=c.rgb.add(y(w.mul(this.residual)));return $(m,R(N,c.a),this.corruption)}),a=this._materialComposed||(this._materialComposed=new mt);return a.name="Datamosh",a.fragmentNode=n(),t.getNodeProperties(this).textureNode=s,this._textureNode}dispose(){this._compRT.dispose(),this._oldRT.dispose(),this._materialComposed!==null&&this._materialComposed.dispose()}}const Rs=(e,t)=>new ts(se(e),t),yt=new at,es=new O,tt=[new U(1,0,0),new U(-1,0,0),new U(0,1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1)],ss=tt.map(()=>new Ye),X=new U,os=new U,qt=new le,Qt=new Ze;let bt;class ns extends ut{static get type(){return"GodraysNode"}constructor(t,s,o){super("vec4"),this.depthNode=t,this.raymarchSteps=u(jt(60)),this.density=u(f(.7)),this.maxDensity=u(f(.5)),this.distanceAttenuation=u(f(2)),this.resolutionScale=.5,this.updateBeforeType=ht.FRAME,this._cameraMatrixWorld=u(s.matrixWorld),this._cameraProjectionMatrixInverse=u(s.projectionMatrixInverse),this._premultipliedLightCameraMatrix=u(new le),this._cameraPosition=u(new U),this._cameraNear=it("near","float",s),this._cameraFar=it("far","float",s),this._shadowCameraNear=it("near","float",o.shadow.camera),this._shadowCameraFar=it("far","float",o.shadow.camera),this._fNormals=zt(tt.map(()=>new U)),this._fConstants=zt(tt.map(()=>0)),this._spotDirection=u(new U(0,-1,0)),this._spotCosOuter=u(f(-1)),this._spotCosInner=u(f(-1)),this._light=o,this._camera=s,this._godraysRenderTarget=new J(1,1,{depthBuffer:!1,type:de}),this._godraysRenderTarget.texture.name="Godrays",this._material=new mt,this._material.name="Godrays",this._textureNode=ct(this,this._godraysRenderTarget.texture)}getTextureNode(){return this._textureNode}setSize(t,s){t=Math.round(this.resolutionScale*t),s=Math.round(this.resolutionScale*s),this._godraysRenderTarget.setSize(t,s)}updateBefore(t){const{renderer:s}=t;bt=W.resetRendererState(s,bt);const o=s.getDrawingBufferSize(es);this.setSize(o.width,o.height),yt.material=this._material,yt.name="Godrays",this._updateLightParams(),this._cameraPosition.value.setFromMatrixPosition(this._camera.matrixWorld),s.setClearColor(16777215,1),s.setRenderTarget(this._godraysRenderTarget),yt.render(s),W.restoreRendererState(s,bt)}_updateLightParams(){const t=this._light,s=t.shadow.camera;if(t.isSpotLight){t.updateMatrixWorld(),t.target.updateMatrixWorld(),X.setFromMatrixPosition(t.target.matrixWorld).sub(os.setFromMatrixPosition(t.matrixWorld)).normalize(),this._spotDirection.value.copy(X);const o=Math.cos(t.angle);this._spotCosOuter.value=o,this._spotCosInner.value=Math.max(Math.cos(t.angle*(1-(t.penumbra??0))),o+.001)}if(this._premultipliedLightCameraMatrix.value.multiplyMatrices(s.projectionMatrix,s.matrixWorldInverse),t.isPointLight)for(let o=0;o<tt.length;o++){const n=tt[o],a=ss[o];X.copy(t.position),X.addScaledVector(n,s.far),a.setFromNormalAndCoplanarPoint(n,X),this._fNormals.array[o].copy(a.normal),this._fConstants.array[o]=a.constant}else if(t.isDirectionalLight||t.isSpotLight){qt.multiplyMatrices(s.projectionMatrix,s.matrixWorldInverse),Qt.setFromProjectionMatrix(qt);for(let o=0;o<6;o++){const n=Qt.planes[o];this._fNormals.array[o].copy(n.normal).multiplyScalar(-1),this._fConstants.array[o]=n.constant*-1}}}setup(t){const s=ot(),o=Le(this._light),n=m=>{const c=this.depthNode.sample(m).r;if(t.renderer.logarithmicDepthBuffer===!0){const d=Ie(c,this._cameraNear,this._cameraFar);return kt(d,this._cameraNear,this._cameraFar)}return c},a=(m,c,d)=>I(m,c).add(d),r=(m,c,d,g)=>{const p=I(d,c);return a(m,d,g).div(p).negate()},i=m=>{const c=He(this._light).mul(m),d=c.xyz.div(c.w);return y(d.x,d.y.oneMinus(),d.z)},l=m=>{const c=this._light.shadow&&this._light.shadow.map;if(!c||!c.depthTexture)return _(1,0);if(this._light.isPointLight){const d=m.sub(o).toConst(),g=d.abs().toConst(),p=g.x.max(g.y).max(g.z).negate(),x=kt(p,this._shadowCameraNear,this._shadowCameraFar),w=Oe(this._light.shadow.map.depthTexture,d).compare(x).r;return _(w.oneMinus().add(.005),p.negate())}if(this._light.isDirectionalLight||this._light.isSpotLight){const d=i(m).toConst(),g=d.x.greaterThanEqual(0).and(d.x.lessThanEqual(1)).and(d.y.greaterThanEqual(0)).and(d.y.lessThanEqual(1)).and(d.z.greaterThanEqual(0)).and(d.z.lessThanEqual(1)),p=_(1,0);return D(g.equal(!0),()=>{const x=Z(this._light.shadow.map.depthTexture,d.xy).compare(d.z).r,w=We(d.z,this._shadowCameraNear,this._shadowCameraFar);p.assign(_(x.oneMinus(),w.negate()))}),p}throw new Error("GodraysNode: Unsupported light type.")},h=B(()=>{const m=R(0,0,0,1).toVar(),c=st(!1),d=n(s).toConst(),g=Ue(s,d,this._cameraProjectionMatrixInverse).toConst(),p=this._cameraMatrixWorld.mul(g),x=f(-1e4).toVar();E(6,({i:v})=>{x.assign(V(x,a(this._cameraPosition,this._fNormals.element(v),this._fConstants.element(v))))});const w=this._cameraPosition.toVar();D(x.lessThan(0),()=>{E(6,({i:v})=>{D(a(p,this._fNormals.element(v),this._fConstants.element(v)).greaterThan(0),()=>{const b=p.sub(this._cameraPosition).toConst(),S=r(this._cameraPosition,b,this._fNormals.element(v),this._fConstants.element(v));p.assign(this._cameraPosition.add(S.mul(b)))})})}).Else(()=>{const v=p.sub(this._cameraPosition).toConst(),b=f(1e4).toVar();E(6,({i:S})=>{const T=r(this._cameraPosition,v,this._fNormals.element(S),this._fConstants.element(S));D(T.lessThan(b).and(T.greaterThan(0)),()=>{b.assign(T)})}),D(b.equal(1e4),()=>{c.assign(!0)}).Else(()=>{w.assign(this._cameraPosition.add(b.add(.001).mul(v)));const S=f(-1e4).toVar();E(6,({i:T})=>{S.assign(V(S,a(p,this._fNormals.element(T),this._fConstants.element(T))))}),D(S.greaterThanEqual(0),()=>{const T=f(1e4).toVar();E(6,({i:M})=>{D(a(p,this._fNormals.element(M),this._fConstants.element(M)).greaterThan(0),()=>{const P=r(w,v,this._fNormals.element(M),this._fConstants.element(M));D(P.lessThan(T).and(P.greaterThan(0)),()=>{T.assign(P)})})}),D(T.lessThan(p.distance(w)),()=>{p.assign(w.add(T.mul(v)))})})})});const N=v=>{if(!this._light.isSpotLight)return f(1);const b=ie(v.sub(o));return L(this._spotCosOuter,this._spotCosInner,I(b,this._spotDirection))};return D(c.equal(!1),()=>{const v=f(0).toVar(),b=ze(Y).toConst(),S=Ut(Ve(this.raymarchSteps,Be(this.raymarchSteps.div(8).add(2),b))).toConst(),T=jt(S).toConst();E(T,({i:M})=>{const P=$(w,p,f(M).div(S)).toConst(),k=l(P),K=k.x.oneMinus().mul(N(P)).toConst();v.addAssign(K.mul(Ee(w,p).mul(this.density.div(100))).mul(ae(k.y.div(this._shadowCameraFar).oneMinus(),this.distanceAttenuation)))}),v.divAssign(S),m.assign(R(y(Fe($e(v.negate()).oneMinus(),0,this.maxDensity)),d))}),m});return this._material.fragmentNode=h().context(t.getSharedContext()),this._material.needsUpdate=!0,this._textureNode}dispose(){this._godraysRenderTarget.dispose(),this._material.dispose()}}const Ns=(e,t,s)=>new ns(e,t,s),Q=new at,St=new O;let Mt;const ce=y(.299,.587,.114),as=[[-1,-1,1],[0,-1,2],[1,-1,1],[-.5,-.5,4],[.5,-.5,4],[-1,0,2],[0,0,4],[1,0,2],[-.5,.5,4],[.5,.5,4],[-1,1,1],[0,1,2],[1,1,1]],is=[[-1,-1,1],[0,-1,2],[1,-1,1],[-1,0,2],[0,0,4],[1,0,2],[-1,1,1],[0,1,2],[1,1,1]],ue=e=>V(j(e.x.sub(.5)),j(e.y.sub(.5))).lessThan(.5);function Zt(e,t,s){let o=R(0);return as.forEach(([n,a,r])=>{const i=t.sub(s.mul(_(n,a))),l=e.sample(i).rgb,h=R(l,I(ce,l).mul(.5).add(1));o=o.add(z(ue(i),h,R(0)).mul(r))}),z(o.w.greaterThan(.001),o.rgb.div(o.w),y(0))}function Ct(e,t,s){let o=R(0);return is.forEach(([n,a,r])=>{const i=t.sub(s.mul(_(n,a)));o=o.add(z(ue(i),e.sample(i),R(0)).mul(r/16))}),o}class rs extends ut{static get type(){return"MipBloomNode"}constructor(t,{levels:s=6,strength:o=1,threshold:n=1}={}){super("vec4"),this.inputNode=t,this.levels=s,this.strength=u(o),this.threshold=u(n),this.updateBeforeType=ht.FRAME;const a=()=>new J(1,1,{depthBuffer:!1,type:de});this.down=Array.from({length:s+1},a),this.up=Array.from({length:s},a),this.texels={down:this.down.map(()=>u(new O)),input:u(new O),up:this.up.map(()=>u(new O))},this.downMaterials=[],this.upMaterials=[]}setSize(t,s){this.texels.input.value.set(1/t,1/s),this.down.forEach((o,n)=>{const a=Math.max(1,Math.floor(t/2**(n+1))),r=Math.max(1,Math.floor(s/2**(n+1)));o.setSize(a,r),this.texels.down[n].value.set(1/a,1/r),this.up[n]&&(this.up[n].setSize(a,r),this.texels.up[n].value.set(1/a,1/r))})}updateBefore(t){const{renderer:s}=t;Mt=W.resetRendererState(s,Mt),s.getDrawingBufferSize(St),this.setSize(St.width,St.height),this.down.forEach((o,n)=>{s.setRenderTarget(o),Q.material=this.downMaterials[n],Q.name=`MipBloom [ Down ${n} ]`,Q.render(s)});for(let o=this.up.length-1;o>=0;o-=1)s.setRenderTarget(this.up[o]),Q.material=this.upMaterials[o],Q.name=`MipBloom [ Up ${o} ]`,Q.render(s);W.restoreRendererState(s,Mt)}setup(t){const s=t.getSharedContext(),o=ot(),n=(r,i)=>{const l=new mt;return l.fragmentNode=r.context(s),l.name=i,l};this.downMaterials=this.down.map((r,i)=>{if(i===0){const l=Zt(this.inputNode,o,this.texels.input),h=I(ce,l),m=z(h.lessThan(1e-4),y(h),l.div(h));return n(R(V(h.sub(this.threshold),0).mul(m),1),"MipBloom_down0")}return n(R(Zt(Z(this.down[i-1].texture),o,this.texels.down[i-1]),1),`MipBloom_down${i}`)}),this.upMaterials=this.up.map((r,i)=>{let l=Ct(Z(this.down[i+1].texture),o,this.texels.down[i+1]);return i<this.up.length-1&&(l=l.add(Ct(Z(this.up[i+1].texture),o,this.texels.up[i+1]))),n(R(l.rgb,1),`MipBloom_up${i}`)});const a=Ct(ct(this,this.up[0].texture),o,this.texels.up[0]);return R(a.rgb.mul(this.strength),f(1))}dispose(){[...this.down,...this.up].forEach(t=>t.dispose()),[...this.downMaterials,...this.upMaterials].forEach(t=>t.dispose())}}const Ps=(e,t)=>je(new rs(se(e),t)),Ds=B(([e])=>{const t=f(.1),s=y(t,0,0),o=y(0,t,0),n=y(0,0,t),a=q(e.sub(s)),r=q(e.add(s)),i=q(e.sub(o)),l=q(e.add(o)),h=q(e.sub(n)),m=q(e.add(n)),c=l.z.sub(i.z).sub(m.y).add(h.y),d=m.x.sub(h.x).sub(r.z).add(a.z),g=r.y.sub(a.y).sub(l.x).add(i.x);return y(c,d,g).div(t.mul(2))}),{PI:Rt}=Math,Nt=.5451,ls=B(([e,t,s,o])=>{const n=e.dFdx(),r=e.dFdy().cross(t),i=t.cross(n),l=n.dot(r),h=ne(l).mul(s.mul(r).add(o.mul(i)));return ie(j(l).mul(t).sub(h))});function Yt(e){return et(dt(e.mul(12.9898)).mul(43758.5453))}function Jt(e,{threadsU:t,threadsV:s,slub:o}){const n=_(e.x.mul(t),e.y.mul(s)),a=F(n),r=n.sub(a),i=re(n.x.add(n.y).mul(Rt)).mul(.5).add(.5),l=Yt(a.x).mul(o).add(f(1).sub(o.mul(.5))),h=Yt(a.y.add(7.3)).mul(o).add(f(1).sub(o.mul(.5))),m=dt(r.x.mul(Rt)).mul(i).mul(l),c=dt(r.y.mul(Rt)).mul(f(1).sub(i)).mul(h);return V(m,c)}function Kt(e,t,s){const o=A(e.x,e.x.oneMinus()).mul(t),n=A(e.y,e.y.oneMinus()).mul(s);return A(o,n)}function As({uvNode:e=ot(),amount:t,threadsU:s,threadsV:o,depth:n,slub:a,aspectU:r=f(1),aspectV:i=f(1),panelWidth:l=f(1),weaveShade:h,weaveRoughness:m,hemWidth:c,hemDepth:d,stitchPitch:g,wearScale:p,wearAmount:x}){const w={threadsU:s,threadsV:o,slub:a},N=_(e.x.mul(s),e.y.mul(o)),v=oe(ke(N)),b=L(.35,1.1,v).oneMinus(),S=Kt(e,r,i),T=c.mul(.12).add(5e-4),M=L(c.sub(T),c.add(T),S).oneMinus(),P=A(e.y,e.y.oneMinus()).lessThan(A(e.x,e.x.oneMinus())),k=P.select(e.x,e.y),K=j(S.sub(c.mul(.55))),pt=L(c.mul(.06),c.mul(.14),K).oneMinus(),fe=L(.42,.5,et(k.mul(g))),xe=pt.mul(fe).mul(M),$t=Ge(e.mul(p),3,2,.5).mul(.5).add(.5).clamp(0,1),ge=n.mul(l).div(s.max(1)),It=d.mul(l).mul(.001),ft=G=>{const Ce=Jt(G,w).mul(b).mul(ge),Wt=Kt(G,r,i),Ht=L(c.sub(T),c.add(T),Wt).oneMinus(),Re=j(Wt.sub(c.mul(.55))),Ne=L(c.mul(.06),c.mul(.14),Re).oneMinus(),Pe=P.select(G.x,G.y),De=L(.42,.5,et(Pe.mul(g)));return Ce.add(Ht.mul(It)).add(Ne.mul(De).mul(Ht).mul(It.mul(.6)))},xt=ft(e),_e=ft(e.add(e.dFdx())).sub(xt),ve=ft(e.add(e.dFdy())).sub(xt),we=_e.mul(t),Te=ve.mul(t),Ot=$(f(Nt),Jt(e,w),b).sub(Nt).div(Nt),ye=$t.sub(.5).mul(x).mul(.5),be=Ot.mul(h).add(1).add(ye).sub(xe.mul(.2)).clamp(0,1.6),Se=$(f(1),be,t),Me=Ot.negate().mul(m).add($t.sub(.5).mul(x).mul(.25)).mul(t);return{normalNode:G=>ls(qe,G,we,Te),shadeNode:Se,roughnessDelta:Me,heightNode:xt}}function Ls(e={}){return{cellSize:u(e.cellSize??12),levels:u(Bt(e.levels??3)),threshold:u(e.threshold??.55),varianceThreshold:u(e.varianceThreshold??.12),noiseScale:u(e.noiseScale??1.5),seed:u(e.seed??0),jitterAmount:u(e.jitterAmount??.12),outlineWidth:u(e.outlineWidth??.08),outlineStrength:u(e.outlineStrength??.5),pointerUV:u(e.pointerUV??new O(-1,-1)),pointerRadius:u(e.pointerRadius??.25),pointerStrength:u(e.pointerStrength??0)}}function Us(e,t){t.cellSize!==void 0&&(e.cellSize.value=t.cellSize),t.levels!==void 0&&(e.levels.value=t.levels),t.threshold!==void 0&&(e.threshold.value=t.threshold),t.varianceThreshold!==void 0&&(e.varianceThreshold.value=t.varianceThreshold),t.noiseScale!==void 0&&(e.noiseScale.value=t.noiseScale),t.seed!==void 0&&(e.seed.value=t.seed),t.jitterAmount!==void 0&&(e.jitterAmount.value=t.jitterAmount),t.outlineWidth!==void 0&&(e.outlineWidth.value=t.outlineWidth),t.outlineStrength!==void 0&&(e.outlineStrength.value=t.outlineStrength),t.pointerUV!==void 0&&e.pointerUV.value.set(t.pointerUV.x,t.pointerUV.y),t.pointerRadius!==void 0&&(e.pointerRadius.value=t.pointerRadius),t.pointerStrength!==void 0&&(e.pointerStrength.value=t.pointerStrength)}function ds(e,t){const s=C.x.div(C.y),o=e.sub(t.pointerUV);return _(o.x.mul(s),o.y).length()}function he(e,t,s){const o=s.pointerRadius.div(ae(2,f(t))),n=ds(e,s).lessThan(o);return z(s.pointerStrength.lessThan(0),n.not(),n)}function me(e,t){return Et(e.add(_(91.7,47.3))).mul(2).sub(1).mul(t.jitterAmount).add(1)}function pe(e,t){return L(0,t.outlineWidth,e).oneMinus().mul(t.outlineStrength).oneMinus()}const cs=y(.299,.587,.114);function us(e,t,s){return Et(e.mul(s.noiseScale).add(_(f(t).mul(13.7),s.seed))).greaterThan(s.threshold)}function hs(e,t,s,o){const n=t.div(2),a=e.mul(t),r=g=>I(s(a.add(n.mul(g)).div(C)).rgb,cs),i=r(_(.5,.5)),l=r(_(1.5,.5)),h=r(_(.5,1.5)),m=r(_(1.5,1.5)),c=i.max(l).max(h).max(m),d=i.min(l).min(h).min(m);return c.sub(d).greaterThan(o.varianceThreshold)}function zs(e,t,{driver:s}){return B(()=>{const o=t.cellSize.toVar(),n=st(!0).toVar();E({start:Bt(0),end:t.levels,type:"int",condition:"<"},({i:g})=>{const p=F(Y.xy.div(o));let x;if(s==="pointer"){const w=p.add(.5).mul(o).div(C);x=he(w,g,t)}else s==="variance"?x=hs(p,o,e,t):x=us(p,g,t);D(n.and(x),()=>{o.assign(o.div(2))}).Else(()=>{n.assign(st(!1))})});const a=F(Y.xy.div(o)),i=a.add(.5).mul(o).div(C),l=e(i),h=me(a,t),m=Y.xy.div(o).sub(a),c=A(m,m.oneMinus()),d=A(c.x,c.y);return R(l.rgb.mul(h).mul(pe(d,t)),l.a)})()}const ms=y(.299,.587,.114),ps=.5773502692,fs=1.1547005384,xs=.8660254038;function Xt(e,t){return _(e.x.sub(e.y.mul(ps)),e.y.mul(fs)).div(t)}function Vt(e,t){return _(e.x.add(e.y.mul(.5)),e.y.mul(xs)).mul(t)}function gs(e,t){const s=z(t,e.add(_(1,0)),e),o=z(t,e.add(_(0,1)),e.add(_(1,0))),n=z(t,e.add(_(1,1)),e.add(_(0,1)));return[s,o,n]}function te(e,t){return z(t,e.add(_(2/3,2/3)),e.add(_(1/3,1/3)))}function _s(e,t,s,o){const n=z(t,f(1),f(0));return Et(e.mul(o.noiseScale).add(_(f(s).mul(13.7),o.seed)).add(_(n.mul(3.1),n.mul(7.3)))).greaterThan(o.threshold)}function vs(e,t,s,o,n){const[a,r,i]=gs(e,t),l=p=>I(o(Vt(p,s).div(C)).rgb,ms),h=l(a),m=l(r),c=l(i),d=h.max(m).max(c),g=h.min(m).min(c);return d.sub(g).greaterThan(n.varianceThreshold)}function Vs(e,t,{driver:s}){return B(()=>{const o=t.cellSize.toVar(),n=st(!0).toVar();E({start:Bt(0),end:t.levels,type:"int",condition:"<"},({i:w})=>{const N=Xt(Y.xy,o),v=F(N),b=N.sub(v),T=f(1).sub(b.x).sub(b.y).lessThan(0);let M;if(s==="pointer"){const P=Vt(te(v,T),o).div(C);M=he(P,w,t)}else s==="variance"?M=vs(v,T,o,e,t):M=_s(v,T,w,t);D(n.and(M),()=>{o.assign(o.div(2))}).Else(()=>{n.assign(st(!1))})});const a=Xt(Y.xy,o),r=F(a),i=a.sub(r),l=f(1).sub(i.x).sub(i.y),h=l.lessThan(0),m=te(r,h),c=Vt(m,o).div(C),d=e(c),g=z(h,f(1),f(0)),p=me(r.add(_(g.mul(3.1),g.mul(7.3))),t),x=A(i.x,A(i.y,l.abs()));return R(d.rgb.mul(p).mul(pe(x,t)),d.a)})()}y(.2126,.7152,.0722);y(.2126,.7152,.0722);const Pt=" .,:-=+*%#$";nt(`
  fn asciiAtlasMotion(
    asciiTexture: texture_2d<f32>,
    inputUv: vec2f,
    grid: vec2f,
    value: f32
  ) -> f32 {
    let cellUv = fract(inputUv * grid);
    let characterIndex = clamp(
      floor(clamp(value, 0.0, 1.0) * f32(${Pt.length-1})),
      0.0,
      f32(${Pt.length-1})
    );
    let atlasUv = vec2f(
      (characterIndex + cellUv.x) / f32(${Pt.length}),
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
`);y(0,.5,2);y(1,.35,.5);y(.299,.587,.114);nt(`
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
`);const ws=`
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
      let difference = abs(currentLuminance - previousState.r);`,Ft=e=>`
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
${ws}`;nt(`${Ft("computeMotionMask")}
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
`);nt(`${Ft("computeBlobMotion")}
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
`);const lt=(e,t)=>`
      let ${e}Coord = clamp(
        vec2i(coord) ${t},
        vec2i(0),
        vec2i(dimensions) - vec2i(1)
      );
      let ${e}Match = abs(
        currentLuminance - textureLoad(stateReadTexture, ${e}Coord, 0).r
      );`;nt(`${Ft("computeFlow")}
      var motion = 0.0;

      if (hasPreviousFrame) {
        motion = smoothstep(
          motionThreshold,
          motionThreshold * 10.0,
          difference
        ) * 10.0;
      }
${lt("left","- vec2i(1, 0)")}
${lt("right","+ vec2i(1, 0)")}
${lt("up","- vec2i(0, 1)")}
${lt("down","+ vec2i(0, 1)")}
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
`);const Bs={fast:{taps:8,exponential:!0},full:{taps:32,exponential:!1}};function Es(){return{reach:u(.9),strength:u(.89),angle:u(90),offsetR:u(6),offsetG:u(1),offsetB:u(.17),highlights:u(0),tintColor:u(new Je("#ffffff")),tintAmount:u(0),smear:u(0)}}function Ts(e,t){return t?2**e-1:e}function ys(e,t,{taps:s,exponential:o}){return B(()=>{const n=Qe(t.angle),a=_(re(n),dt(n)).mul(t.reach).div(C),r=[a.mul(t.offsetR),a.mul(t.offsetG),a.mul(t.offsetB)],i=e.sample(rt).toVar("bleedBase"),l=y(0).toVar("bleedAcc"),h=f(0).toVar("bleedWeight");for(let p=0;p<s;p+=1){const x=Ts(p,o),w=t.strength.pow(x);l.addAssign(y(e.sample(rt.sub(r[0].mul(x))).r,e.sample(rt.sub(r[1].mul(x))).g,e.sample(rt.sub(r[2].mul(x))).b).mul(w)),h.addAssign(w)}const m=l.div(h.max(1e-5)),c=$(f(1),L(.2,.9,H(i.rgb)),t.highlights),d=$(i.rgb,m,c),g=$(d,H(d).mul(t.tintColor),t.tintAmount);return R(g,i.a)})()}const Dt=new O,At=new at;let Lt;class Fs extends ut{static get type(){return"PixelBleedNode"}constructor(t,s,o){super("vec4"),this.textureNode=t,this.uniforms=s,this.quality=o,this._compRT=new J(1,1,{depthBuffer:!1}),this._compRT.texture.name="PixelBleedNode.comp",this._oldRT=new J(1,1,{depthBuffer:!1}),this._oldRT.texture.name="PixelBleedNode.old",this._textureNode=ct(this,this._compRT.texture),this._textureNodeOld=Z(this._oldRT.texture),this._materialComposed=null,this.updateBeforeType=ht.FRAME}getTextureNode(){return this._textureNode}setSize(t,s){this._compRT.setSize(t,s),this._oldRT.setSize(t,s)}updateBefore(t){const{renderer:s}=t;Lt=W.resetRendererState(s,Lt);const{type:o}=this.textureNode.value;this._compRT.texture.type=o,this._oldRT.texture.type=o,s.getDrawingBufferSize(Dt),this.setSize(Dt.x,Dt.y),this._textureNode.value=this._compRT.texture,this._textureNodeOld.value=this._oldRT.texture,At.material=this._materialComposed,At.name="PixelBleed",s.setRenderTarget(this._compRT),At.render(s);const n=this._oldRT;this._oldRT=this._compRT,this._compRT=n,W.restoreRendererState(s,Lt)}setup(t){const s=B(()=>{const n=ys(this.textureNode,this.uniforms,this.quality),a=this._textureNodeOld.sample(ot());return $(n,a,this.uniforms.smear.min(.99))}),o=this._materialComposed||(this._materialComposed=new mt);return o.name="PixelBleed",o.fragmentNode=s(),t.getNodeProperties(this).textureNode=this.textureNode,this._textureNode}dispose(){this._compRT.dispose(),this._oldRT.dispose(),this._materialComposed!==null&&this._materialComposed.dispose()}}y(.299,.587,.114);new at;const ee=64,bs=2.39996323;zt(Array.from({length:ee},(e,t)=>{const s=Math.sqrt((t+.5)/ee),o=t*bs;return new Ke(Math.cos(o),Math.sin(o),s,Math.exp(-s*s*2.2))}),"vec4");export{Bs as B,Fs as P,Ls as a,Vs as b,Ds as c,zs as d,Es as e,As as f,Ns as g,Rs as h,ys as i,Ps as m,Us as u};
