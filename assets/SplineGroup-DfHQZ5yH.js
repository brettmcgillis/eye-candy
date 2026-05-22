import{r as u,Q as Me,p as Be,bk as Bt,$ as Qe,a6 as Ke,V as Y,aP as kt,bl as Ne,X as Ge,bm as Dt,am as pt,o as wt,j as oe,aI as It,a4 as Ot,Z as ht,Y as vt,_ as At,aF as _t,U as Vt,a5 as Ut,t as Wt,aG as qt}from"./index-ByL4sTkr.js";import{S as Xt}from"./SmokeParticles-COC23Tog.js";import{u as he,$ as je,f as ft,K as Nt,b as Gt,v as dt,a4 as $t,P as Yt,r as Ht,a5 as jt,G as Zt,q as Kt,d as Qt}from"./three.tsl-BRC4V00C.js";import{V as Jt}from"./VolumetricSmokeParticles-SKjDMwRD.js";import{S as eo}from"./SplineLine-CU57L0Ex.js";import{S as to}from"./SplinePoints-7HEayNGB.js";import{V as oo}from"./VolumetricFire-gAobbI0s.js";const le=512;function so(){const t=document.createElement("canvas");t.width=128,t.height=128;const s=t.getContext("2d");if(!s)return null;const e=s.createRadialGradient(128*.5,128*.5,0,128*.5,128*.5,128*.46);e.addColorStop(0,"rgba(255,255,255,0.72)"),e.addColorStop(.3,"rgba(255,255,255,0.48)"),e.addColorStop(.65,"rgba(255,255,255,0.14)"),e.addColorStop(1,"rgba(255,255,255,0)"),s.fillStyle=e,s.fillRect(0,0,128,128),s.globalCompositeOperation="lighter",[{ox:.2,oy:-.12,r:.24,a:.2},{ox:-.16,oy:.14,r:.21,a:.17},{ox:.02,oy:.22,r:.19,a:.14},{ox:-.19,oy:-.08,r:.18,a:.11},{ox:.1,oy:.18,r:.15,a:.09},{ox:.14,oy:-.2,r:.13,a:.08}].forEach(({ox:m,oy:c,r:E,a:D})=>{const w=128*(.5+m),d=128*(.5+c),j=s.createRadialGradient(w,d,0,w,d,128*E);j.addColorStop(0,`rgba(255,255,255,${D})`),j.addColorStop(1,"rgba(255,255,255,0)"),s.fillStyle=j,s.fillRect(0,0,128,128)});const a=new It(t);return a.needsUpdate=!0,a}const fe=new Y,ke=new Me,$e=new Y;function Pt(n,t,s,e,r){const a=n.length;for(;r.length<a;)r.push(new Me);for(let m=0;m<a;m+=1)r[m].setFromEuler(n[m]??new Ot(0,0,0));for(let m=0;m<t;m+=1){const c=m/(t-1),E=s?a:Math.max(1,a-1),D=Math.min(c*E,E-1e-6),w=Math.floor(D);ke.copy(r[w%a]).slerp(r[(w+1)%a],D-w);const d=m*4;e[d]=ke.x,e[d+1]=ke.y,e[d+2]=ke.z,e[d+3]=ke.w}}function gt(n,t,s,e){const r=n.length;for(let a=0;a<t;a+=1){const m=a/(t-1),c=s?r:Math.max(1,r-1),E=Math.min(m*c,c-1e-6),D=Math.floor(E),w=E-D,d=n[D%r],j=n[(D+1)%r],H=a*3;e[H]=d.x+(j.x-d.x)*w,e[H+1]=d.y+(j.y-d.y)*w,e[H+2]=d.z+(j.z-d.z)*w}}function St(n,t,s,e){const r=(Math.random()-.5)*n,a=(Math.random()-.5)*n,m=(Math.random()-.5)*n;if($e.set(r,a,m),s){const c=e*3;$e.x*=s[c],$e.y*=s[c+1],$e.z*=s[c+2]}if(t){const c=e*4;ke.set(t[c],t[c+1],t[c+2],t[c+3]),$e.applyQuaternion(ke)}return $e}const ao={Normal:Qe,Additive:At,Subtractive:vt,Multiply:ht};function no({points:n,pointRotations:t,pointScales:s,config:e,attractorsRef:r=null}){const a=u.useRef(),m=u.useRef(0),c=u.useRef(null),E=u.useRef(new Float32Array(le*4)),D=u.useRef(new Float32Array(le*3)),w=u.useRef(Array.from({length:32},()=>new Me)),d=u.useRef(new Float32Array(le*3)),[j,H]=u.useState(null),I=u.useMemo(so,[]),U=u.useMemo(()=>({uSize:he(40),uScale:he(400),uGrowth:he(2),uOpacity:he(.042),uFadeExp:he(1.2),uColor:he(new Be("#cac8c5"))}),[]),$=u.useMemo(()=>{const{uSize:i,uScale:C,uGrowth:h,uOpacity:o,uFadeExp:l,uColor:S}=U,G=I,P=je("aAge","float"),A=je("aAlpha","float"),T=je("aRotation","float"),N=i.mul(ft(1).add(P.mul(h))).mul(C).div(Nt.z.negate()),F=Gt().sub(dt(.5,.5)),q=$t(T),x=Yt(T),y=dt(q.mul(F.x).sub(x.mul(F.y)),x.mul(F.x).add(q.mul(F.y))).add(dt(.5,.5)),z=Ht(G,y),g=ft(1).sub(jt(P,l)),O=z.a.mul(o).mul(A).mul(g),v=new Bt({transparent:!0,depthWrite:!1,depthTest:!0,blending:Qe,sizeAttenuation:!1});return v.positionNode=je("aPosition","vec3"),v.sizeNode=N,v.colorNode=S.toVec4(O),v},[U,I]),{particleCount:M}=e;return u.useEffect(()=>{if(n.length<2)return;const i=M,C=c.current,h=d.current;let o,l,S,G,P,A,T;if(C){const O=C.N;o=new Float32Array(i*3),l=new Float32Array(i*3),S=new Float32Array(i),G=new Float32Array(i).fill(1),P=new Float32Array(i),A=new Float32Array(i),T=new Float32Array(i);const v=Math.min(O,i);o.set(C.positions.subarray(0,v*3)),l.set(C.velocities.subarray(0,v*3)),S.set(C.splineT.subarray(0,v)),G.set(C.alphas.subarray(0,v)),P.set(C.phases.subarray(0,v)),C.ages&&A.set(C.ages.subarray(0,v)),C.rotations&&T.set(C.rotations.subarray(0,v));const[B,f,_]=h;for(let p=O;p<i;p+=1)S[p]=-Math.random(),G[p]=0,P[p]=Math.random()*Math.PI*2,T[p]=Math.random()*Math.PI*2,o[p*3]=B,o[p*3+1]=f,o[p*3+2]=_}else{o=new Float32Array(i*3),l=new Float32Array(i*3),S=new Float32Array(i),G=new Float32Array(i).fill(1),A=new Float32Array(i),T=new Float32Array(i),P=new Float32Array(i);for(let V=0;V<i;V+=1)P[V]=Math.random()*Math.PI*2,T[V]=Math.random()*Math.PI*2;const O=new Ke([...n],e.closed,"catmullrom",e.tension);for(let V=0;V<le;V+=1)O.getPoint(V/(le-1),fe),h[V*3]=fe.x,h[V*3+1]=fe.y,h[V*3+2]=fe.z;const v=t&&t.length>=2?E.current:null;v&&Pt(t,le,e.closed,v,w.current);const B=s&&s.length>=2?D.current:null;B&&gt(s,le,e.closed,B);const[f,_,p]=h,Q=e.closed?0:-1,se=e.closed?1:2;for(let V=0;V<i;V+=1){const ie=Q+V/i*se;if(S[V]=ie,ie<0)G[V]=0,o[V*3]=f,o[V*3+1]=_,o[V*3+2]=p;else{O.getPoint(ie,fe);const Le=Math.max(0,Math.min(le-1,Math.floor(ie*(le-1)))),X=St(e.spawnSpread,v,B,Le);o[V*3]=fe.x+X.x,o[V*3+1]=fe.y+X.y,o[V*3+2]=fe.z+X.z}}}c.current={positions:o,velocities:l,splineT:S,alphas:G,phases:P,ages:A,rotations:T,N:i};const N=new kt(1,1),F=new Ne(o,3);F.usage=Ge,N.setAttribute("aPosition",F);const q=new Ne(G,1);q.usage=Ge,N.setAttribute("aAlpha",q);const x=new Ne(A,1);x.usage=Ge,N.setAttribute("aAge",x);const y=new Ne(T,1);y.usage=Ge,N.setAttribute("aRotation",y);const z=new pt,g=new Dt(N,$,i);for(let O=0;O<i;O+=1)g.setMatrixAt(O,z);return g.instanceMatrix.needsUpdate=!0,g.frustumCulled=!1,a.current=N,H(g),()=>N.dispose()},[M,$]),wt(({size:i},C)=>{const h=c.current,o=a.current;if(!h||!o||n.length<2)return;const l=Math.min(C,.05);U.uSize.value=e.particleSize,U.uColor.value.set(e.particleColor),U.uOpacity.value=e.opacity,U.uScale.value=i.height/2,U.uGrowth.value=e.growth,U.uFadeExp.value=e.fadeExponent;const S=ao[e.blendMode]??Qe,G=S===vt||S===ht;($.blending!==S||$.premultipliedAlpha!==G)&&($.blending=S,$.premultipliedAlpha=G,$.needsUpdate=!0);const P=new Ke([...n],e.closed,"catmullrom",e.tension),A=d.current;for(let k=0;k<le;k+=1)P.getPoint(k/(le-1),fe),A[k*3]=fe.x,A[k*3+1]=fe.y,A[k*3+2]=fe.z;const T=t&&t.length>=2?E.current:null;T&&Pt(t,le,e.closed,T,w.current);const N=s&&s.length>=2?D.current:null;N&&gt(s,le,e.closed,N);const{springK:F,flowSpeed:q,damping:x,attractorStrength:y=0,attractorRadius:z=300,maxDrift:g=600,turbulence:O,turbulenceSpeed:v,closed:B,fadeRate:f,spawnSpread:_,buoyancy:p=0,rotSpeed:Q=0}=e,se=r?r.current:null;m.current+=l;const V=m.current,ie=x**l,Le=g*g,{positions:X,velocities:J,splineT:me,alphas:W,phases:ee,ages:de,rotations:Se,N:ot}=h,[st,at,Ie]=A;for(let k=0;k<ot;k+=1){const R=k*3;if(me[k]+=q*l,de[k]=Math.max(0,Math.min(1,me[k])),Se[k]+=Q*(.7+Math.sin(ee[k])*.3)*l,!B&&me[k]<0){W[k]=0,X[R]=st,X[R+1]=at,X[R+2]=Ie;continue}let L=!1;if(B){const b=me[k];if(me[k]=(b%1+1)%1,W[k]=1,b<0){const ve=Math.max(0,Math.min(le-1,Math.floor(me[k]*(le-1)))),ae=St(_,T,N,ve);X[R]=A[ve*3]+ae.x,X[R+1]=A[ve*3+1]+ae.y,X[R+2]=A[ve*3+2]+ae.z,J[R]=0,J[R+1]=0,J[R+2]=0}}else me[k]>1?(W[k]=Math.max(0,1-(me[k]-1)*f),W[k]<=0&&(me[k]=-Math.random(),W[k]=0,J[R]=0,J[R+1]=0,J[R+2]=0,X[R]=st,X[R+1]=at,X[R+2]=Ie,L=!0)):W[k]=1;if(!L){const b=X[R],ve=X[R+1],ae=X[R+2];let Z=J[R],K=J[R+1],ce=J[R+2];const ye=Math.min(me[k],1),ue=Math.max(0,Math.min(le-1,Math.floor(ye*(le-1)))),Je=A[ue*3],be=A[ue*3+1],ge=A[ue*3+2];if(Z+=(Je-b)*F*l,K+=(be-ve)*F*l,ce+=(ge-ae)*F*l,se)for(let ne=0;ne<se.length;ne+=1){const we=se[ne].position,Ve=we[0]-b,Ue=we[1]-ve,We=we[2]-ae,tt=Ve*Ve+Ue*Ue+We*We,qe=Math.sqrt(tt)+.1,re=se[ne].radius??z,xe=re*re,Xe=se[ne].strength??y,Ee=Xe*xe/(tt+xe);Z+=Ve/qe*Ee*l,K+=Ue/qe*Ee*l,ce+=We/qe*Ee*l;const ze=se[ne].direction;if(ze){const Te=Xe*.4*xe/(tt+xe);Z+=ze[0]*Te*l,K+=ze[1]*Te*l,ce+=ze[2]*Te*l}}const Re=ee[k],Fe=V*v;Z+=Math.sin(Fe+Re)*O*l,K+=Math.cos(Fe*.73+Re*1.4)*O*l,ce+=Math.sin(Fe*1.27+Re*2.3)*O*l,K+=p*l,Z*=ie,K*=ie,ce*=ie;const Ae=b+Z*l,nt=ve+K*l,rt=ae+ce*l,lt=Ae-Je,Oe=nt-be,_e=rt-ge;let et=Le;if(N){const ne=ue*3,we=Math.max(N[ne],N[ne+1],N[ne+2]);et=Le*we*we}if(lt*lt+Oe*Oe+_e*_e>et){const ne=St(_,T,N,ue);X[R]=Je+ne.x,X[R+1]=be+ne.y,X[R+2]=ge+ne.z,J[R]=0,J[R+1]=0,J[R+2]=0}else X[R]=Ae,X[R+1]=nt,X[R+2]=rt,J[R]=Z,J[R+1]=K,J[R+2]=ce}}o.attributes.aPosition&&(o.attributes.aPosition.array.set(X),o.attributes.aPosition.needsUpdate=!0),o.attributes.aAlpha&&(o.attributes.aAlpha.array.set(W),o.attributes.aAlpha.needsUpdate=!0),o.attributes.aAge&&(o.attributes.aAge.array.set(de),o.attributes.aAge.needsUpdate=!0),o.attributes.aRotation&&(o.attributes.aRotation.array.set(Se),o.attributes.aRotation.needsUpdate=!0)}),u.useEffect(()=>()=>{I&&I.dispose()},[I]),j?oe.jsx("primitive",{object:j,renderOrder:1}):null}const bt=32;function ro({points:n,pointRotations:t,pointScales:s,tension:e=.5,closed:r=!1,spread:a=120,color:m=4500223,opacity:c=.3}){const E=u.useMemo(()=>{if(!n||n.length<2)return null;const D=new Ke([...n],r,"catmullrom",e),w=s?.length??0,d=w>=2,j=t?.length??0,H=j>=2,I=r?bt:bt+1,U=new Float32Array(I*4*3),$=[],M=new Me,i=new Me,C=new Me,h=new Y,o=new Y;for(let S=0;S<I;S+=1){const G=S/bt;D.getPoint(G,h);let P=1,A=1;if(d){const y=r?w:Math.max(1,w-1),z=Math.min(G*y,y-1e-6),g=Math.floor(z),O=z-g,v=s[g%w],B=s[(g+1)%w];P=v.x+(B.x-v.x)*O,A=v.z+(B.z-v.z)*O}if(H){const y=r?j:Math.max(1,j-1),z=Math.min(G*y,y-1e-6),g=Math.floor(z),O=z-g;i.setFromEuler(t[g%j]),C.setFromEuler(t[(g+1)%j]),M.copy(i).slerp(C,O)}else M.identity();const T=a*.5*P,N=a*.5*A,F=[[-T,0,-N],[T,0,-N],[T,0,N],[-T,0,N]],q=S*4;for(let y=0;y<4;y+=1){o.set(F[y][0],F[y][1],F[y][2]),o.applyQuaternion(M),o.add(h);const z=(q+y)*3;U[z]=o.x,U[z+1]=o.y,U[z+2]=o.z}for(let y=0;y<4;y+=1)$.push(q+y,q+(y+1)%4);const x=(S+1)%I;if(S<I-1||r){const y=x*4;for(let z=0;z<4;z+=1)$.push(q+z,y+z)}}const l=new _t;return l.setAttribute("position",new Vt(U,3)),l.setIndex($),l},[n,t,s,e,r,a]);return u.useEffect(()=>()=>{E&&E.dispose()},[E]),E?oe.jsx("lineSegments",{geometry:E,children:oe.jsx("lineBasicMaterial",{color:m,transparent:!0,opacity:c,depthTest:!1})}):null}const te=512;function lo(n,t,s,e,r){const a=e*r;return Math.sin(.017*n+1.3*a)*Math.cos(.011*s-.7*a)+.5*Math.sin(.031*t-.9*a)*Math.cos(.019*n+1.1*a)+.25*Math.cos(.023*s+.6*a)}function co(n,t,s,e,r){const a=e*r;return Math.cos(.013*t+.8*a)*Math.sin(.023*n-1.2*a)+.5*Math.cos(.027*s-.5*a)*Math.sin(.017*t+.9*a)+.25*Math.sin(.021*n+1.4*a)}function io(n,t,s,e,r){const a=e*r;return Math.sin(.019*s-1.1*a)*Math.sin(.015*t+.6*a)+.5*Math.sin(.025*n+.8*a)*Math.cos(.021*s-1*a)+.25*Math.cos(.029*t-.7*a)}const pe=new Y,De=new Me,Ye=new Y;function Rt(n,t,s,e,r){const a=n.length;for(let m=0;m<a;m+=1)r[m].setFromEuler(n[m]);for(let m=0;m<t;m+=1){const c=m/(t-1),E=s?a:Math.max(1,a-1),D=Math.min(c*E,E-1e-6),w=Math.floor(D);De.copy(r[w%a]).slerp(r[(w+1)%a],D-w);const d=m*4;e[d]=De.x,e[d+1]=De.y,e[d+2]=De.z,e[d+3]=De.w}}function Ft(n,t,s,e){const r=n.length;for(let a=0;a<t;a+=1){const m=a/(t-1),c=s?r:Math.max(1,r-1),E=Math.min(m*c,c-1e-6),D=Math.floor(E),w=E-D,d=n[D%r],j=n[(D+1)%r],H=a*3;e[H]=d.x+(j.x-d.x)*w,e[H+1]=d.y+(j.y-d.y)*w,e[H+2]=d.z+(j.z-d.z)*w}}function ut(n,t,s,e){const r=(Math.random()-.5)*n,a=(Math.random()-.5)*n,m=(Math.random()-.5)*n;if(Ye.set(r,a,m),s){const c=e*3;Ye.x*=s[c],Ye.y*=s[c+1],Ye.z*=s[c+2]}if(t){const c=e*4;De.set(t[c],t[c+1],t[c+2],t[c+3]),Ye.applyQuaternion(De)}return Ye}const uo={Normal:Qe,Additive:At,Subtractive:vt,Multiply:ht},Lt=Math.exp(-2.8),mo=1/(1-Lt);function fo({points:n,pointRotations:t,pointScales:s,config:e,attractorsRef:r}){const a=u.useRef(),m=u.useRef(0),c=u.useRef(null),E=u.useRef(new Float32Array(te*3)),D=u.useRef(new Float32Array(te*4)),w=u.useRef(new Float32Array(te*3)),d=u.useRef(Array.from({length:32},()=>new Me)),[j,H]=u.useState(null),I=u.useMemo(()=>({uSize:he(e.volSize??60),uScale:he(400),uGrowth:he(e.volGrowth??1.5),uOpacity:he(e.volOpacity??.06),uFadeExp:he(e.volFadeExp??1.2),uColor:he(new Be(e.volColor??"#9090a0"))}),[]),U=u.useMemo(()=>{const{uSize:M,uScale:i,uGrowth:C,uOpacity:h,uFadeExp:o,uColor:l}=I,S=je("aAge","float"),G=je("aAlpha","float"),P=M.mul(ft(1).add(S.mul(C))).mul(i).div(Nt.z.negate()),T=Gt().sub(dt(.5,.5)).length().mul(2),N=Zt(T.mul(T).mul(-2.8)).sub(Lt),F=Kt(N.mul(mo),0,1),q=ft(1).sub(jt(S,o)),x=F.mul(h).mul(G).mul(q),y=l.mul(F),z=new Bt({transparent:!0,depthWrite:!1,depthTest:!0,blending:Qe,sizeAttenuation:!1});return z.positionNode=je("aPosition","vec3"),z.sizeNode=P,z.colorNode=Qt(y,x),z},[I]),{volParticleCount:$}=e;return u.useEffect(()=>{if(n.length<2)return;const M=$,i=c.current,C=E.current;let h,o,l,S,G,P;if(i){const y=i.N;h=new Float32Array(M*3),o=new Float32Array(M*3),l=new Float32Array(M),S=new Float32Array(M).fill(1),G=new Float32Array(M),P=new Float32Array(M);const z=Math.min(y,M);h.set(i.positions.subarray(0,z*3)),o.set(i.velocities.subarray(0,z*3)),l.set(i.splineT.subarray(0,z)),S.set(i.alphas.subarray(0,z)),i.ages&&G.set(i.ages.subarray(0,z)),P.set(i.phases.subarray(0,z));const[g,O,v]=C;for(let B=y;B<M;B+=1){P[B]=Math.random()*Math.PI*2;const f=B*3;if(e.closed){const _=Math.random(),p=Math.floor(_*(te-1)),Q=e.volSpread??e.spawnSpread??80;l[B]=_,S[B]=1;const se=ut(Q,t&&t.length>=2?D.current:null,s&&s.length>=2?w.current:null,p);h[f]=C[p*3]+se.x,h[f+1]=C[p*3+1]+se.y,h[f+2]=C[p*3+2]+se.z}else l[B]=-Math.random(),S[B]=0,h[f]=g,h[f+1]=O,h[f+2]=v}}else{h=new Float32Array(M*3),o=new Float32Array(M*3),l=new Float32Array(M),S=new Float32Array(M).fill(1),G=new Float32Array(M),P=new Float32Array(M);for(let f=0;f<M;f+=1)P[f]=Math.random()*Math.PI*2;const y=new Ke([...n],e.closed,"catmullrom",e.tension);for(let f=0;f<te;f+=1)y.getPoint(f/(te-1),pe),C[f*3]=pe.x,C[f*3+1]=pe.y,C[f*3+2]=pe.z;const[z,g,O]=C,v=t&&t.length>=2?D.current:null;v&&Rt(t,te,e.closed,v,d.current);const B=s&&s.length>=2?w.current:null;B&&Ft(s,te,e.closed,B);for(let f=0;f<M;f+=1){const _=f*3;if(e.closed){const p=f/M;l[f]=p,new Ke([...n],!0,"catmullrom",e.tension).getPoint(p,pe);const se=e.volSpread??e.spawnSpread??80,V=Math.max(0,Math.min(te-1,Math.floor(p*(te-1)))),ie=ut(se,v,B,V);h[_]=pe.x+ie.x,h[_+1]=pe.y+ie.y,h[_+2]=pe.z+ie.z}else l[f]=-(f/M)*2,S[f]=0,h[_]=z,h[_+1]=g,h[_+2]=O}}c.current={positions:h,velocities:o,splineT:l,alphas:S,ages:G,phases:P,N:M};const A=new kt(1,1),T=new Ne(h,3);T.usage=Ge,A.setAttribute("aPosition",T);const N=new Ne(new Float32Array(S),1);N.usage=Ge,A.setAttribute("aAlpha",N);const F=new Ne(G,1);F.usage=Ge,A.setAttribute("aAge",F);const q=new pt,x=new Dt(A,U,M);for(let y=0;y<M;y+=1)x.setMatrixAt(y,q);return x.instanceMatrix.needsUpdate=!0,x.frustumCulled=!1,a.current=A,H(x),()=>A.dispose()},[$,U]),wt(({size:M},i)=>{const C=c.current,h=a.current;if(!C||!h||n.length<2)return;const o=Math.min(i,.05);m.current+=o;const l=m.current,S=e.volColor??"#9090a0",G=e.volOpacity??.06,P=e.volSize??60;I.uSize.value=P,I.uColor.value.set(S),I.uOpacity.value=G,I.uScale.value=M.height/2,I.uGrowth.value=e.volGrowth??1.5,I.uFadeExp.value=e.volFadeExp??1.2;const A=uo[e.volBlendMode]??Qe,T=A===vt||A===ht;(U.blending!==A||U.premultipliedAlpha!==T)&&(U.blending=A,U.premultipliedAlpha=T,U.needsUpdate=!0);const N=new Ke([...n],e.closed,"catmullrom",e.tension),F=E.current;for(let L=0;L<te;L+=1)N.getPoint(L/(te-1),pe),F[L*3]=pe.x,F[L*3+1]=pe.y,F[L*3+2]=pe.z;const q=t&&t.length>=2?D.current:null;q&&Rt(t,te,e.closed,q,d.current);const x=s&&s.length>=2?w.current:null;x&&Ft(s,te,e.closed,x);const y=e.volFlowSpeed??e.flowSpeed??.04,{closed:z}=e,g=e.volFadeRate??e.fadeRate??8,O=e.volSpread??e.spawnSpread??80,v=e.volTurbulence??180,B=e.volTurbulenceSpeed??.25,f=e.volNoiseScale??1,_=e.volSpringK??2.5,Q=(e.volDamping??.1)**o,se=(e.volMaxDrift??900)**2,V=e.attractorStrength??300,ie=e.attractorRadius??300,Le=e.volBuoyancy??0,[X,J,me]=F,{positions:W,velocities:ee,splineT:de,alphas:Se,ages:ot,phases:st,N:at}=C;for(let L=0;L<at;L+=1){const b=L*3;if(de[L]+=y*o,ot[L]=Math.max(0,Math.min(1,de[L])),!z&&de[L]<0){Se[L]=0,W[b]=X,W[b+1]=J,W[b+2]=me;continue}let ve=!1;if(z){const ae=de[L];if(de[L]=(ae%1+1)%1,Se[L]=1,ae<0){const Z=Math.max(0,Math.min(te-1,Math.floor(de[L]*(te-1)))),K=ut(O,q,x,Z);W[b]=F[Z*3]+K.x,W[b+1]=F[Z*3+1]+K.y,W[b+2]=F[Z*3+2]+K.z,ee[b]=0,ee[b+1]=0,ee[b+2]=0}}else de[L]>1?(Se[L]=Math.max(0,1-(de[L]-1)*g),Se[L]<=0&&(de[L]=-Math.random(),Se[L]=0,ee[b]=0,ee[b+1]=0,ee[b+2]=0,W[b]=X,W[b+1]=J,W[b+2]=me,ve=!0)):Se[L]=1;if(!ve){const ae=W[b],Z=W[b+1],K=W[b+2];let ce=ee[b],ye=ee[b+1],ue=ee[b+2];const Je=Math.min(de[L],1),be=Math.max(0,Math.min(te-1,Math.floor(Je*(te-1)))),ge=F[be*3],Re=F[be*3+1],Fe=F[be*3+2];ce+=(ge-ae)*_*o,ye+=(Re-Z)*_*o,ue+=(Fe-K)*_*o;const Ae=r?.current??[];for(let re=0;re<Ae.length;re+=1){const xe=Ae[re].position,Xe=xe[0]-ae,Ee=xe[1]-Z,ze=xe[2]-K,Te=Xe*Xe+Ee*Ee+ze*ze,yt=Math.sqrt(Te)+.1,zt=Ae[re].radius??ie,ct=zt*zt,Ct=Ae[re].strength??V,xt=Ct*ct/(Te+ct);ce+=Xe/yt*xt*o,ye+=Ee/yt*xt*o,ue+=ze/yt*xt*o;const it=Ae[re].direction;if(it){const Mt=Ct*.4*ct/(Te+ct);ce+=it[0]*Mt*o,ye+=it[1]*Mt*o,ue+=it[2]*Mt*o}}const nt=lo(ae*f,Z*f,K*f,l,B),rt=co(ae*f,Z*f,K*f,l,B),lt=io(ae*f,Z*f,K*f,l,B);ce+=nt*v*o,ye+=rt*v*o,ue+=lt*v*o;const Oe=st[L],_e=l*B*.5;ce+=Math.sin(_e+Oe)*v*.15*o,ye+=Math.cos(_e*.73+Oe*1.4)*v*.15*o,ue+=Math.sin(_e*1.27+Oe*2.3)*v*.15*o,ye+=Le*o,ce*=Q,ye*=Q,ue*=Q;const et=ae+ce*o,ne=Z+ye*o,we=K+ue*o,Ve=et-ge,Ue=ne-Re,We=we-Fe,tt=Ve*Ve+Ue*Ue+We*We;let qe=se;if(x){const re=be*3,xe=Math.max(x[re],x[re+1],x[re+2]);qe=se*xe*xe}if(tt>qe){const re=ut(O,q,x,be);W[b]=ge+re.x,W[b+1]=Re+re.y,W[b+2]=Fe+re.z,ee[b]=0,ee[b+1]=0,ee[b+2]=0}else W[b]=et,W[b+1]=ne,W[b+2]=we,ee[b]=ce,ee[b+1]=ye,ee[b+2]=ue}}const Ie=h.getAttribute("aPosition"),k=h.getAttribute("aAlpha");Ie&&(Ie.array.set(W),Ie.needsUpdate=!0),k&&(k.array.set(Se),k.needsUpdate=!0);const R=h.getAttribute("aAge");R&&(R.array.set(ot),R.needsUpdate=!0)}),j?oe.jsx("primitive",{object:j,renderOrder:1}):null}const po=`
  varying vec3 vWorldPos;

  void main() {
    vec4 wp   = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,ho=`
  precision highp float;

  // ── Camera & time ──────────────────────────────────────────────────────────
  // cameraPosition is injected automatically by Three.js
  uniform float uTime;

  // ── Flame-space → world transform ──────────────────────────────────────────
  uniform mat4 uInvGroupWorld;   // world → flame-space

  // ── Volume bounds (in flame-space) ─────────────────────────────────────────
  uniform vec3 uBoundsMin;
  uniform vec3 uBoundsMax;

  // ── Fire appearance ────────────────────────────────────────────────────────
  uniform float uMagnitude;
  uniform float uLacunarity;
  uniform float uGain;
  uniform float uSpeed;
  uniform float uDensity;
  uniform float uBrightness;
  uniform float uSaturation;
  uniform vec3  uColorTint;

  // ── Core / border / smoke gradient colours ─────────────────────────────────
  uniform vec3 uCoreColor;
  uniform vec3 uBorderColor;
  uniform vec3 uSmokeColor;

  // ── Ember layer ────────────────────────────────────────────────────────────
  uniform float uEmberDensity;
  uniform float uEmberSize;
  uniform vec3  uEmberColor;

  // ── Control-point spline (up to 8 influence points, in flame-space) ────────
  #define MAX_CP 8
  uniform int   uCPCount;
  uniform vec3  uCPPos[MAX_CP];
  uniform vec3  uCPScale[MAX_CP];

  // ── Ray-march settings ─────────────────────────────────────────────────────
  uniform int   uSteps;
  uniform float uStepSize;

  varying vec3 vWorldPos;

  // ═══════════════════════════════════════════════════════════════════════════
  // Hash helpers
  // ═══════════════════════════════════════════════════════════════════════════
  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  vec3 hash33(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3-D gradient noise
  // ═══════════════════════════════════════════════════════════════════════════
  float gnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(dot(hash33(i + vec3(0,0,0)), f - vec3(0,0,0)),
              dot(hash33(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
          mix(dot(hash33(i + vec3(0,1,0)), f - vec3(0,1,0)),
              dot(hash33(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
      mix(mix(dot(hash33(i + vec3(0,0,1)), f - vec3(0,0,1)),
              dot(hash33(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
          mix(dot(hash33(i + vec3(0,1,1)), f - vec3(0,1,1)),
              dot(hash33(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y),
      u.z);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // fBm turbulence – models the curling / vorticity detail lost in a discrete
  // Navier-Stokes simulation (CS184 §3.1)
  // ═══════════════════════════════════════════════════════════════════════════
  float turbulence(vec3 p) {
    float sum  = 0.0;
    float freq = 1.0;
    float amp  = 1.0;
    for (int i = 0; i < 5; i++) {
      sum  += abs(gnoise(p * freq)) * amp;
      freq *= uLacunarity;
      amp  *= uGain;
    }
    return sum;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Spline envelope – evaluates how deeply a flame-space point sits inside the
  // flame volume defined by the control-point polyline.
  // ═══════════════════════════════════════════════════════════════════════════
  struct EnvResult { float inside; float height; };

  EnvResult sampleEnvelope(vec3 p) {
    EnvResult res;
    res.inside = 0.0;
    res.height = 0.0;

    if (uCPCount < 2) {
      // Fallback: tapered cylinder centred on the bounds
      vec3 c  = (uBoundsMin + uBoundsMax) * 0.5;
      float h = (p.y - uBoundsMin.y) / max(0.001, uBoundsMax.y - uBoundsMin.y);
      float r = length(p.xz - c.xz) / max(0.001, (uBoundsMax.x - uBoundsMin.x) * 0.5);
      float taper = mix(1.0, 0.12, h * h);
      res.height  = clamp(h, 0.0, 1.0);
      res.inside  = smoothstep(1.0, 0.6, r / taper)
                   * smoothstep(-0.05, 0.1, h)
                   * smoothstep(1.1, 0.85, h);
      return res;
    }

    // ── Closest-point-on-polyline search ─────────────────────────────────────
    float bestDist  = 1e10;
    float bestT     = 0.0;
    vec3  bestScale = vec3(1.0);

    // First pass: total arc length
    float totalLen = 0.0;
    for (int i = 0; i < MAX_CP - 1; i++) {
      if (i >= uCPCount - 1) break;
      totalLen += length(uCPPos[i + 1] - uCPPos[i]);
    }
    if (totalLen < 0.001) totalLen = 1.0;

    // Second pass: project onto each segment
    float cumLen = 0.0;
    for (int i = 0; i < MAX_CP - 1; i++) {
      if (i >= uCPCount - 1) break;
      vec3  a      = uCPPos[i];
      vec3  b      = uCPPos[i + 1];
      vec3  ab     = b - a;
      float segLen = length(ab);
      if (segLen < 0.0001) { cumLen += segLen; continue; }

      float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
      float d = length(p - (a + ab * t));

      if (d < bestDist) {
        bestDist  = d;
        bestT     = (cumLen + t * segLen) / totalLen;
        bestScale = mix(uCPScale[i], uCPScale[i + 1], t);
      }
      cumLen += segLen;
    }

    // Envelope radius from the interpolated cross-section scale
    float maxR = max(bestScale.x, bestScale.z) * 0.5;
    if (maxR < 0.001) maxR = 0.5;

    // Taper toward the tip — quadratic falloff gives a natural flame shape
    float taper = mix(1.0, 0.06, bestT * bestT);
    float normR = bestDist / (maxR * taper);

    res.height = clamp(bestT, 0.0, 1.0);
    res.inside = smoothstep(1.0, 0.4, normR)
               * smoothstep(-0.02, 0.08, bestT)
               * smoothstep(1.05, 0.82, bestT);
    return res;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Fire colour from reaction coordinate (CS184 three-zone gradient)
  // ═══════════════════════════════════════════════════════════════════════════
  vec3 fireColor(float rc) {
    if (rc > 0.65) {
      float t = (rc - 0.65) / 0.35;
      return mix(uBorderColor, uCoreColor, t);
    } else if (rc > 0.25) {
      float t = (rc - 0.25) / 0.4;
      return mix(uSmokeColor, uBorderColor, t);
    } else {
      return mix(vec3(0.0), uSmokeColor, rc / 0.25);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Ember particles (CS184 §3.3 — noise-seeded advected sparks)
  // ═══════════════════════════════════════════════════════════════════════════
  float sampleEmbers(vec3 p, float time) {
    if (uEmberDensity < 0.001) return 0.0;
    vec3 ep = p;
    ep.y -= time * uSpeed * 1.8;
    ep *= 3.5 / max(uEmberSize, 0.01);

    vec3  cell  = floor(ep);
    float ember = 0.0;
    for (int dx = -1; dx <= 1; dx++)
    for (int dy = -1; dy <= 1; dy++)
    for (int dz = -1; dz <= 1; dz++) {
      vec3 nb   = cell + vec3(float(dx), float(dy), float(dz));
      float prob = hash13(nb);
      if (prob > uEmberDensity) continue;
      vec3 off   = hash33(nb + 97.0) * 0.5 + 0.5;
      float d    = length(ep - (nb + off));
      ember     += smoothstep(0.28, 0.0, d);
    }
    return clamp(ember, 0.0, 1.0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AABB ray intersection (slab method)
  // ═══════════════════════════════════════════════════════════════════════════
  vec2 boxHit(vec3 ro, vec3 rd, vec3 mn, vec3 mx) {
    vec3 inv  = 1.0 / rd;
    vec3 t0   = (mn - ro) * inv;
    vec3 t1   = (mx - ro) * inv;
    vec3 tMin = min(t0, t1);
    vec3 tMax = max(t0, t1);
    return vec2(max(tMin.x, max(tMin.y, tMin.z)),
                min(tMax.x, min(tMax.y, tMax.z)));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Main — ray-march loop
  // ═══════════════════════════════════════════════════════════════════════════
  void main() {
    // ── Build ray in world space, then convert to flame-space ─────────────
    vec3 wRo = cameraPosition;
    vec3 wRd = normalize(vWorldPos - cameraPosition);

    vec3 fRo = (uInvGroupWorld * vec4(wRo, 1.0)).xyz;
    vec3 fRd = normalize((uInvGroupWorld * vec4(wRd, 0.0)).xyz);

    // ── Intersect the flame-space AABB ───────────────────────────────────
    vec2 hit = boxHit(fRo, fRd, uBoundsMin, uBoundsMax);
    hit.x = max(hit.x, 0.0);
    if (hit.x >= hit.y) discard;

    // ── Adaptive step size ───────────────────────────────────────────────
    float diag   = length(uBoundsMax - uBoundsMin);
    float stepSz = uStepSize * diag / float(uSteps);
    float jitter = hash13(vWorldPos * 743.7 + uTime * 0.1) * stepSz;

    vec4 acc = vec4(0.0);

    for (int i = 0; i < 128; i++) {
      if (i >= uSteps) break;
      float t = hit.x + jitter + float(i) * stepSz;
      if (t > hit.y) break;

      vec3 fp = fRo + fRd * t;          // sample point in flame-space

      // ── Envelope test ──────────────────────────────────────────────────
      EnvResult env = sampleEnvelope(fp);
      if (env.inside < 0.001) continue;

      // ── Turbulence field (buoyancy-advected noise) ─────────────────────
      vec3 np  = fp;
      np.y    -= uTime * uSpeed;
      np      *= vec3(2.0, 1.5, 2.0);
      float tb = turbulence(np) * uMagnitude;

      // ── Reaction coordinate (fuel → colour) ────────────────────────────
      float rc = (1.0 - env.height);
      rc  = rc * rc;                            // sharpen hot core
      rc += tb * 0.15 * (1.0 - env.height);    // noise modulation
      rc *= env.inside;
      rc  = clamp(rc, 0.0, 1.0);

      // ── Density (smoke thickness) ──────────────────────────────────────
      float dn = env.inside;
      dn *= smoothstep(0.0, 0.12, env.height); // fade at very base
      dn *= 1.0 - tb * 0.3 * env.height;       // turbulent wisps at top
      dn  = clamp(dn, 0.0, 1.0) * uDensity * stepSz * 16.0;

      // ── Colour ─────────────────────────────────────────────────────────
      vec3 col = fireColor(rc) * uColorTint * uBrightness;
      float lm = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(lm), col, uSaturation);

      // Core glow boost
      col += uCoreColor * smoothstep(0.55, 1.0, rc) * env.inside * 0.6;

      // ── Embers ─────────────────────────────────────────────────────────
      float em = sampleEmbers(fp, uTime) * smoothstep(0.25, 0.75, env.height);
      col += uEmberColor * em * 2.5;
      dn  += em * 0.4 * uDensity * stepSz;

      // ── Front-to-back compositing ──────────────────────────────────────
      float a = clamp(dn, 0.0, 1.0);
      acc.rgb += col * a * (1.0 - acc.a);
      acc.a   += a * (1.0 - acc.a);
      if (acc.a > 0.97) break;
    }

    if (acc.a < 0.001) discard;
    gl_FragColor = acc;
  }
`,vo=5;function yo(n){return Array.from({length:n},()=>({pos:new Y,scale:new Y(1,1,1),rot:new Me}))}function xo(n,t,s,e,r,a){const m=t/2;for(let c=0;c<n.length;c++){const E=c/(n.length-1),D=E*E,w=s*(1-E*.25),d=e*(1-E*.25);n[c].pos.set(r*D,-m+E*t,a*D),n[c].scale.set(w,1,d)}}const He=new Y,Ze=new Y,Ce=new Y,Pe=new Y,Et=new Y,mt=new Y,Tt=new pt;function Mo({position:n=[0,0,0],inverted:t=!1,width:s=.5,height:e=1.5,depth:r=.5,bendX:a=0,bendZ:m=0,animated:c=!0,animSpeed:E=.5,magnitude:D=1.3,lacunarity:w=2,gain:d=.5,speed:j=.8,density:H=1.2,brightness:I=1.8,saturation:U=1,tintColor:$="#ffffff",coreColor:M="#ffffcc",borderColor:i="#ff6600",smokeColor:C="#330000",emberDensity:h=.15,emberSize:o=.25,emberColor:l="#ff4400",steps:S=64,stepSize:G=1,controlPoints:P=null}){const A=u.useRef(),T=u.useRef(),N=u.useRef(0),F=u.useRef({x:a,z:m}),q=u.useRef(null);q.current||(q.current=yo(vo));const x=u.useMemo(()=>new Ut({vertexShader:po,fragmentShader:ho,uniforms:{uTime:{value:0},uInvGroupWorld:{value:new pt},uBoundsMin:{value:new Y(-.5,-.75,-.5)},uBoundsMax:{value:new Y(.5,.75,.5)},uMagnitude:{value:D},uLacunarity:{value:w},uGain:{value:d},uSpeed:{value:j},uDensity:{value:H},uBrightness:{value:I},uSaturation:{value:U},uColorTint:{value:new Be($)},uCoreColor:{value:new Be(M)},uBorderColor:{value:new Be(i)},uSmokeColor:{value:new Be(C)},uEmberDensity:{value:h},uEmberSize:{value:o},uEmberColor:{value:new Be(l)},uSteps:{value:S},uStepSize:{value:G},uCPCount:{value:0},uCPPos:{value:Array.from({length:8},()=>new Y)},uCPScale:{value:Array.from({length:8},()=>new Y(1,1,1))}},side:Wt,transparent:!0,depthWrite:!1,blending:At}),[]),y=u.useMemo(()=>new qt(1,1,1),[]);u.useEffect(()=>{const g=x.uniforms;g.uMagnitude.value=D,g.uLacunarity.value=w,g.uGain.value=d,g.uSpeed.value=j,g.uDensity.value=H,g.uBrightness.value=I,g.uSaturation.value=U,g.uSteps.value=S,g.uStepSize.value=G,g.uEmberDensity.value=h,g.uEmberSize.value=o},[x,D,w,d,j,H,I,U,S,G,h,o]),u.useEffect(()=>{x.uniforms.uColorTint.value.set($)},[x,$]),u.useEffect(()=>{x.uniforms.uCoreColor.value.set(M)},[x,M]),u.useEffect(()=>{x.uniforms.uBorderColor.value.set(i)},[x,i]),u.useEffect(()=>{x.uniforms.uSmokeColor.value.set(C)},[x,C]),u.useEffect(()=>{x.uniforms.uEmberColor.value.set(l)},[x,l]),u.useEffect(()=>{F.current={x:a,z:m}},[a,m]),u.useEffect(()=>()=>{x.dispose(),y.dispose()},[x,y]),wt(({clock:g},O)=>{const v=x.uniforms;v.uTime.value=g.getElapsedTime();let B;if(P&&P.length>=2)B=P;else{let _=F.current.x,p=F.current.z;if(c){N.current+=O*E;const Q=N.current;_+=Math.sin(Q*.8)*.14+Math.sin(Q*2.1+.5)*.04,p+=Math.cos(Q*.65+1.2)*.07+Math.cos(Q*1.7)*.03}xo(q.current,e,s,r,_,p),B=q.current}const f=Math.min(B.length,8);v.uCPCount.value=f,Ce.set(1/0,1/0,1/0),Pe.set(-1/0,-1/0,-1/0);for(let _=0;_<f;_++){const p=B[_];p.pos instanceof Y?He.copy(p.pos):Array.isArray(p.pos)?He.set(p.pos[0]||0,p.pos[1]||0,p.pos[2]||0):He.set(p.pos.x||0,p.pos.y||0,p.pos.z||0),p.scale instanceof Y?Ze.copy(p.scale):Array.isArray(p.scale)?Ze.set(p.scale[0]||1,p.scale[1]||1,p.scale[2]||1):Ze.set(p.scale.x||1,p.scale.y||1,p.scale.z||1),v.uCPPos.value[_].copy(He),v.uCPScale.value[_].copy(Ze);const Q=Math.max(Ze.x,Ze.z)*.75;Ce.min(He.clone().addScalar(-Q)),Pe.max(He.clone().addScalar(Q))}Ce.y-=.15,Pe.y+=e*.35,Ce.x-=.35,Ce.z-=.35,Pe.x+=.35,Pe.z+=.35,v.uBoundsMin.value.copy(Ce),v.uBoundsMax.value.copy(Pe),A.current&&(Et.addVectors(Ce,Pe).multiplyScalar(.5),mt.subVectors(Pe,Ce),A.current.position.copy(Et),A.current.scale.set(Math.max(mt.x,.01),Math.max(mt.y,.01),Math.max(mt.z,.01))),T.current&&(T.current.updateWorldMatrix(!0,!1),Tt.copy(T.current.matrixWorld).invert(),v.uInvGroupWorld.value.copy(Tt))});const z=P?0:e/2;return oe.jsx("group",{position:n,rotation:t?[Math.PI,0,0]:[0,0,0],children:oe.jsx("group",{ref:T,position:[0,z,0],children:oe.jsx("mesh",{ref:A,geometry:y,material:x,frustumCulled:!1})})})}function So({points:n,config:t,showVolume:s}){const e=u.useMemo(()=>n.map(r=>({pos:r.position.clone(),scale:new Y(t.fireWidth*(r.scale?.x??1),r.scale?.y??1,t.fireDepth*(r.scale?.z??1)),rot:new Me().setFromEuler(r.rotation)})),[n,t.fireWidth,t.fireDepth]);return oe.jsx(oo,{controlPoints:e,sliceSpacing:t.fireSliceSpacing,magnitude:t.fireMagnitude,lacunarity:t.fireLacunarity,gain:t.fireGain,tintColor:t.fireTintColor,saturation:t.fireSaturation,brightness:t.fireBrightness,animated:t.fireAnimated,animSpeed:t.fireAnimSpeed,showVolume:s})}function bo({points:n,config:t}){const s=u.useMemo(()=>n.map(e=>({pos:e.position.clone(),scale:new Y(t.fireWidth*(e.scale?.x??1),e.scale?.y??1,t.fireDepth*(e.scale?.z??1)),rot:new Me().setFromEuler(e.rotation)})),[n,t.fireWidth,t.fireDepth]);return oe.jsx(Mo,{controlPoints:s,magnitude:t.cs184Magnitude,lacunarity:t.cs184Lacunarity,gain:t.cs184Gain,speed:t.cs184Speed,density:t.cs184Density,brightness:t.cs184Brightness,saturation:t.cs184Saturation,tintColor:t.cs184TintColor,coreColor:t.cs184CoreColor,borderColor:t.cs184BorderColor,smokeColor:t.cs184SmokeColor,emberDensity:t.cs184EmberDensity,emberSize:t.cs184EmberSize,emberColor:t.cs184EmberColor,steps:t.cs184Steps,stepSize:t.cs184StepSize,animated:t.cs184Animated,animSpeed:t.cs184AnimSpeed})}function Fo({index:n,points:t,config:s,splineConfig:e,attractorsRef:r,setSplinePoints:a,allowedTypes:m="both",renderer:c="webgl",splineColor:E="#aaaaaa",pointSize:D}){const w=u.useCallback(P=>a(n,P),[n,a]),d=u.useMemo(()=>t.map(P=>P.position),[t]),j=u.useMemo(()=>t.map(P=>P.rotation),[t]),H=u.useMemo(()=>t.map(P=>P.scale),[t]),I=u.useMemo(()=>({...s,...e}),[s,e]),U=e.type==="Particle"||e.type==="Volumetric",$=U?"Smoke":e.type,M=U?e.type:e.smokeType??"Particle",i=e.fireType??"Classic",C=c==="webgpu"?no:Xt,h=c==="webgpu"?fo:Jt;if(!e.visible||m==="smoke"&&$==="Fire"||m==="fire"&&$==="Smoke")return null;const o=$==="Fire",l=$==="Smoke",S=l&&(M==="Particle"||M==="Both"),G=l&&(M==="Volumetric"||M==="Both");return oe.jsxs(oe.Fragment,{children:[oe.jsx(to,{points:t,setPoints:w,visible:e.showHelpers,mode:s.pointMode??"translate",pointSize:D}),oe.jsx(eo,{points:d,tension:e.tension,closed:e.closed,curveType:"catmullrom",color:E,visible:e.showSpline,arcSegments:e.arcSegments}),S&&oe.jsx(C,{points:d,pointRotations:j,pointScales:H,config:I,attractorsRef:r}),G&&oe.jsx(h,{points:d,pointRotations:j,pointScales:H,config:I,attractorsRef:r}),l&&e.showSmokeVolume&&oe.jsx(ro,{points:d,pointRotations:j,pointScales:H,tension:e.tension,closed:e.closed,spread:Math.max(I.spawnSpread??0,I.volSpread??0)||120}),o&&i==="Classic"&&oe.jsx(So,{points:t,config:I,showVolume:e.showFireVolume}),o&&i==="RayMarch"&&oe.jsx(bo,{points:t,config:I})]})}export{Mo as C,Fo as S};
