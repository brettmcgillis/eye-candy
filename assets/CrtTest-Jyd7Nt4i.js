import{dl as _e,r as a,b3 as Ge,dm as Oe,a6 as he,bt as Le,ar as Ne,d8 as We,ac as K,j as e,ak as Q,bj as He,aS as ie,aR as ve,aa as Ke,ab as ee,ae as le,dn as Ye,dp as ze,bN as $e,dq as Xe,dd as $,dr as qe,ds as Ze,be as xe,bd as X,bg as z,an as H,aq as P,dt as Je}from"./index-fWJAS7dd.js";import{I as ge,R as fe}from"./Reversal-D7akVriw.js";import{S as de,u as Qe}from"./tracks-CpqfhR6o.js";import{s as te}from"./shaderMaterial-CW7u5dyR.js";import{_ as et}from"./extends-CF3RwP-h.js";import{u as tt}from"./Fbo-k_eYDN8C.js";import{C as Se}from"./crtStaticMaterial-ZYem8m3B.js";import{B as at}from"./Bret-BHxv_lhq.js";import{P as be}from"./PerspectiveCamera-Cn1h3QZ3.js";import{a as Ce}from"./react-spring_three.modern-B29Ytxbh.js";import{u as ye}from"./Gltf-B3R5Zmez.js";import{M as nt}from"./Instances-BsWhXgEr.js";import{O as rt}from"./OrbitControls-CMPugbKV.js";import{E as ot}from"./Environment-Cu8NuqBA.js";import{M as it}from"./MeshReflectorMaterial-SOlw_vK4.js";import"./constants-Bs6avUAn.js";import"./deprecated-CtTvmxFP.js";import"./constants-p3HtcmN-.js";var oe={exports:{}},ut=oe.exports,pe;function lt(){return pe||(pe=1,(function(r,l){(function(h,n){r.exports=n()})(ut,function(){var h=function(){function n(f){return u.appendChild(f.dom),f}function o(f){for(var x=0;x<u.children.length;x++)u.children[x].style.display=x===f?"block":"none";s=f}var s=0,u=document.createElement("div");u.style.cssText="position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000",u.addEventListener("click",function(f){f.preventDefault(),o(++s%u.children.length)},!1);var i=(performance||Date).now(),c=i,t=0,p=n(new h.Panel("FPS","#0ff","#002")),b=n(new h.Panel("MS","#0f0","#020"));if(self.performance&&self.performance.memory)var R=n(new h.Panel("MB","#f08","#201"));return o(0),{REVISION:16,dom:u,addPanel:n,showPanel:o,begin:function(){i=(performance||Date).now()},end:function(){t++;var f=(performance||Date).now();if(b.update(f-i,200),f>c+1e3&&(p.update(1e3*t/(f-c),100),c=f,t=0,R)){var x=performance.memory;R.update(x.usedJSHeapSize/1048576,x.jsHeapSizeLimit/1048576)}return f},update:function(){i=this.end()},domElement:u,setMode:o}};return h.Panel=function(n,o,s){var u=1/0,i=0,c=Math.round,t=c(window.devicePixelRatio||1),p=80*t,b=48*t,R=3*t,f=2*t,x=3*t,S=15*t,g=74*t,C=30*t,y=document.createElement("canvas");y.width=p,y.height=b,y.style.cssText="width:80px;height:48px";var d=y.getContext("2d");return d.font="bold "+9*t+"px Helvetica,Arial,sans-serif",d.textBaseline="top",d.fillStyle=s,d.fillRect(0,0,p,b),d.fillStyle=o,d.fillText(n,R,f),d.fillRect(x,S,g,C),d.fillStyle=s,d.globalAlpha=.9,d.fillRect(x,S,g,C),{dom:y,update:function(M,k){u=Math.min(u,M),i=Math.max(i,M),d.fillStyle=s,d.globalAlpha=1,d.fillRect(0,0,p,S),d.fillStyle=o,d.fillText(c(M)+" "+n+" ("+c(u)+"-"+c(i)+")",R,f),d.drawImage(y,x+t,S,g-t,C,x,S,g-t,C),d.fillRect(x+g-t,S,t,C),d.fillStyle=s,d.globalAlpha=.9,d.fillRect(x+g-t,S,t,c((1-M/k)*C))}}},h})})(oe)),oe.exports}var st=lt();const ct=_e(st);function mt(r,l=[],h){const[n,o]=a.useState();return a.useLayoutEffect(()=>{const s=r();return o(s),()=>void 0},l),n}function vt({showPanel:r=0,className:l,parent:h}){const n=mt(()=>new ct,[]);return a.useEffect(()=>{if(n){const o=h&&h.current||document.body;n.showPanel(r),o?.appendChild(n.dom);const s=(l??"").split(" ").filter(c=>c);s.length&&n.dom.classList.add(...s);const u=Ge(()=>n.begin()),i=Oe(()=>n.end());return()=>{s.length&&n.dom.classList.remove(...s),o?.removeChild(n.dom),u(),i()}}},[h,n,l,r]),null}const ft=a.forwardRef(({children:r,compute:l,width:h,height:n,samples:o=8,renderPriority:s=0,eventPriority:u=0,frames:i=1/0,stencilBuffer:c=!1,depthBuffer:t=!0,generateMipmaps:p=!1,...b},R)=>{const{size:f,viewport:x}=he(),S=tt((h||f.width)*x.dpr,(n||f.height)*x.dpr,{samples:o,stencilBuffer:c,depthBuffer:t,generateMipmaps:p}),[g]=a.useState(()=>new Le),C=a.useCallback((y,d,M)=>{var k,m;let w=(k=S.texture)==null||(k=k.__r3f.parent)==null?void 0:k.object;for(;w&&!(w instanceof Ne);){var T;w=(T=w.__r3f.parent)==null?void 0:T.object}if(!w)return!1;M.raycaster.camera||M.events.compute(y,M,(m=M.previousRoot)==null?void 0:m.getState());const[A]=M.raycaster.intersectObject(w);if(!A)return!1;const E=A.uv;if(!E)return!1;d.raycaster.setFromCamera(d.pointer.set(E.x*2-1,E.y*2-1),d.camera)},[]);return a.useImperativeHandle(R,()=>S.texture,[S]),a.createElement(a.Fragment,null,We(a.createElement(dt,{renderPriority:s,frames:i,fbo:S},r,a.createElement("group",{onPointerOver:()=>null})),g,{events:{compute:l||C,priority:u}}),a.createElement("primitive",et({object:S.texture},b)))});function dt({frames:r,renderPriority:l,children:h,fbo:n}){let o=0,s,u,i,c;return K(t=>{(r===1/0||o<r)&&(s=t.gl.autoClear,u=t.gl.xr.enabled,i=t.gl.getRenderTarget(),c=t.gl.xr.isPresenting,t.gl.autoClear=!0,t.gl.xr.enabled=!1,t.gl.xr.isPresenting=!1,t.gl.setRenderTarget(n),t.gl.render(t.scene,t.camera),t.gl.setRenderTarget(i),t.gl.autoClear=s,t.gl.xr.enabled=u,t.gl.xr.isPresenting=c,o++)},l),a.createElement(a.Fragment,null,h)}const pt=`
                                                                                                    
                                               ░░▒▒▒▒▒░░                                            
                                        ░░▒▒▒▒▒▒▒▒▓▓▒▓▓▓▓▓▓▒░                                       
                                   ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▒░░                                 
                               ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒░                             
                            ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░                          
                         ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░                       
                      ░▒▒▒▒▒▒▒▒▒░▒░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒                     
                    ░▒▒▒▒▒▒▒░▒▒▒░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░                  
                 ░▒▒▒▒▒▒▒░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓▓▓▓░                
                ▒▒▒▒▒░░░░▒░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓███▓██████▓░              
              ░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓             
            ▒▒▒░▒░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██████▓████▓            
           ░▒░▒▒░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓████████▓████▓           
          ░▒▒░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓█████████▓████▒          
          ▒▒░░░░░░░░░░░▒░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓█████████████░         
         ░▒░░░░░░░▒░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒░░▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓████████▓██▓         
         ░▒▒░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓████████████░        
         ▒▒▒░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▒▓▓▓▓▓▓▓▓▓▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓████████▓██▒        
        ░▒░▒░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓█████▓▓█▓        
        ░▒▒▒░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓█▓▓▓▓▓▓█▓▓█▓        
        ░▒▒░▒░░░░░░░░░░░░░░░░▒░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓████▓▓▓██▓░       
        ░▒▒░▒▒░░░░▒░░▒▒▒▒░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓█████████▓▓▓█░       
        ░▒░░▒░░░░░▒░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓█████████████▓▓▓▒       
       ░▒▒░░░▒░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓███████████████▓▒       
        ▒▒▒░░▒▒░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓███████████▓▓▓▓█▒       
        ▒▒▒░░░▒▒░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓▓▓▓▓█████▓▓█▒       
        ▒▒▒░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▒▒▓▓▒▒▒▓▓▓▓▓▓▓▓▓▓▓██▓█▓▓██████▓▓██▒       
        ░▒▒▒░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓█████▓▓▓███▓▓▓███▒       
        ░▒▒▒░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓█▓█▓▓▓███▓▓▓███░       
        ░▒▒▒▒░░░░░░▒▒▒▒▒░▒▒▒▒▒▒▒░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▒▒▒▒▓▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓▓▓██▓        
         ░▒▒▒▒░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒░░░░▒▒▒▒▒▒▒▒▒▒▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓███░        
          ▒▒▒▒▒░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓█████▒         
          ▒▒▒▒▒▒░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓████▓░         
          ▒▒▒▒▒▒▒░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓          
          ▒▒▒▒▒▒░░░▒░░▒▒▒▒▒▒░░░░░░    ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▒░░░░░░░░░▒▒▒▓▓▓▓▓▓█▓          
          ░▒▒▒▒▒░░░░░░▒░░░░░░░░         ░▒▒▒▒▒▒▒▒▒▒▒▒░▒▒▒▒▒▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░▒▒▓▓▓▓░          
            ░░░░░░░▒░░░░░░░░░░░░         ░▒▒▒▒▒▒▒▒▒▒░░▒▒▒▒▓▓▓▓▓▓▓▒░░░░░░░░░░░░░░░░░░░▒▓▓▒           
            ░░░▒░░░░░░░░░░░░░░░░░         ░░▒▒▒▒▒░░░░░░░▒▒▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░▒▓█▒          
           ░░░░░▒▒▒▒░░░░░░░░░░░░░░        ░░░░░░░░░▒▒▒▒▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░▒▓▓▓▓░         
          ░░░░░▒░▒▒▒▒░░░░░░░░░░░░       ░░░░░░░░░░░░▒▒▓▓▓▓▒▒▓▒▒░▒▒░░░░░░▒░░░░░░░░░░░▒▒▓▓▓█▓░        
         ░░░░░▒▒▒▒▒▒▒▒░░░░░░░░░░      ░░░░  ░░░░░░░░▒▒▒▓▓▓▓▓▓░░░▒▒▒▒▒░░░░▒░░░▒▒▒░░░░▒▒▓▓█▓▒▓▒       
        ░░░ ░░░▒▒▒▒▒▒▒▒░░░░ ░░░   ░░░░░░░░░░░░░░░░░░▒▒▒▓▓▓▓▓▓  ▒▒▓▒▒▒▒▒░░░░░░░░░░░░░▒▓▓▓▓▓▒▓█▒      
        ░░░░░░░░▒▒▒▒▒▒▒░░░░ ░     ░░░░░░ ░░░░░░░░░▒░░▒▒▒▓▓▓▓▓░ ░▒▒▒▒▒▒░░░░▒▒░░░░░░░░▒▓▓▓▓█▓▓█░      
        ░▒░░ ░░░▒▒▒▒▒▒░░░░░    ░░░░░░░░░ ░░ ░░░░▒░  ░░▒░ ░▓▓▓▓░░▒▒▒▒▒▒▒▒▒░ ░░░░░░░░▒▓▓▓▓▓███▓       
         ░░▒░░░▒▒▒▒▒▒▒▒░░░ ░ ░░░░░░░░░░░░░░░░░░░░   ░▒▒░  ░▓▓▓▓▓▒▓▒▒▒▒▒▒░░▒░░░░░░▒▒▓▓▓█▓▓███▒       
         ░▒▒▒░░░░▒▒▒▒▒▒▒░░░░░░░░░░░░░░░░░░░░░░▒▒░    ▒▒   ░▒▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒░░▒▒▒▓▓▓▓█████▓        
          ░▒▒░░░▒▒▒▒▒▒▒▒░░░░░░░░░░░░▒▒▒▒▒▒░▒▒▒▒▒▒         ░▒▓▓▓▓▓▓▓▓▓▓▓▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓████▓░        
           ▒▒▒░░░░░▒▒▒▒▒▒▒▒▒▒▒▒░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░         ░░▓▓▓▓▓▓▓▓▓▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓███▒         
            ░▒▒░░░▒▒▒▒▒▒▒▒▒▒▒▒▒░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒           ░▓▓▓▓▓▓▓▓▓▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░         
             ▒▒▒░▒▒▒▒▒▒▒░▒▒▒▒▒▒▒▒▒░░▒▒▒▒▒▒▒▒▒▒▒░░          ░▓▓▓▓▓▓▓▓▓▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░          
              ░▒▒▒▒▒░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░           ▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░           
              ░▒▒▒▒░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░      ░░░     ░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒░             
                ░▒▒▒░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░     ░▒░░     ░▓▓▓▓▓▓▓▓▓▓▓▒░    ░▒▒▓▓░                
                  ░░▒▒▒▒▒░ ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒    ░▒▒▒    ░▓▓▓▓▓▓▓▓▓▓▓                             
                     ░░        ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░  ░▒▒▒▒░░▒▓▓▓▓▓█▓▓▓▓▓▓░                            
                                ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▒▓▓▓▓▓▓██▓▓▓▓▓░                            
                                ░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓███▓▓▓░                             
                                ░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓████▓▓▒                             
                                ░▒░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓███▓▓▓░                             
                                  ░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▒▓▓▓▓▓▓▓▓▓█▓▒                                 
                                       ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓░                                  
                                        ░▒▒ ░▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▒▒▓█░                                  
                                             ▒▒▒░▒▓▓░       ░                                       
                                                 ░▒▒                                                
                                                                                                    
`,ht=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,xt=`
uniform float uTime;
uniform sampler2D uTextTexture;

uniform vec3  uScreenColor;
uniform float uNoiseStrength;
uniform float uGlowStrength;
uniform float uCurvature;
uniform float uVignette;

uniform float uScanlineStrength;
uniform float uScanlineDensity;
uniform float uRollSpeed;
uniform float uRollStrength;

uniform float uChromaOffset;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
}

vec2 curve(vec2 uv, float k) {
  uv = uv * 2.0 - 1.0;
  uv *= 1.0 + k * pow(abs(uv.yx), vec2(2.0));
  return uv * 0.5 + 0.5;
}

void main() {

  vec2 uv = curve(vUv, uCurvature);

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float roll = sin(uv.y * 8.0 + uTime * uRollSpeed) * 0.003 * uRollStrength;
  uv.y = fract(uv.y + roll + uTime * 0.02 * uRollStrength);

  vec3 color = uScreenColor;

  float n = hash(uv * 800.0 + uTime * 60.0);
  color += (n - 0.5) * uNoiseStrength;

  float scan = sin(uv.y * uScanlineDensity);
  color -= scan * uScanlineStrength;

  float off = uChromaOffset;
  vec4 tr = texture2D(uTextTexture, uv + vec2(off, 0.0));
  vec4 tg = texture2D(uTextTexture, uv);
  vec4 tb = texture2D(uTextTexture, uv - vec2(off, 0.0));

  vec3 textRGB = vec3(tr.r, tg.g, tb.b);
  float textA = max(tr.a, max(tg.a, tb.a));

  color = mix(color, textRGB, textA);
  color += textRGB * uGlowStrength * textA;

  float d = distance(uv, vec2(0.5));
  float vig = smoothstep(uVignette, 0.45, d);
  color *= mix(1.0, vig, 0.6);

  gl_FragColor = vec4(clamp(color, 0.0, 1.5), 1.0);
}
`,Te=te({uTime:0,uTextTexture:null,uScreenColor:new Ke(.05,.18,.85),uNoiseStrength:.08,uGlowStrength:.35,uCurvature:.06,uVignette:.85,uScanlineStrength:.08,uScanlineDensity:900,uRollSpeed:.4,uRollStrength:.4,uChromaOffset:.0025},ht,xt);ee({CrtBlueScreenMaterial:Te});function gt(r,l,h,n,o,s){const u=l.split("");let i="";const c=[];return u.forEach(t=>{if(t===`
`)c.push(i),i="";else{const p=i+t;r.measureText(p).width>o&&i?(c.push(i),i=t):i=p}}),i&&c.push(i),c.forEach((t,p)=>{r.fillText(t,h,n+p*s)}),{lines:c,y:n+(c.length-1)*s}}function St({canvas:r,text:l,font:h,fontSize:n,fontColor:o,showCaret:s,caretMode:u,horizontalPadding:i,verticalPadding:c}){const t=r.getContext("2d");t.clearRect(0,0,r.width,r.height),t.font=h,t.fillStyle=o,t.textBaseline="top";const p=n*1.3,b=r.width-i*2,{lines:R,y:f}=gt(t,l,i,c,b,p);if(s&&R.length){const x=R[R.length-1],S=t.measureText(x),g=i+S.width+4,C=S.actualBoundingBoxAscent+S.actualBoundingBoxDescent||n;u==="underscore"?t.fillRect(g,f+n*1.05,n*.8,3):u==="line"?t.fillRect(g,f+2,Math.max(4,n*.08),C):t.fillRect(g,f+2,n*.6,C)}}function bt(){const r=document.createElement("canvas");r.width=1024,r.height=512;const l=new He(r);return l.minFilter=ie,l.magFilter=ie,l.wrapS=ve,l.wrapT=ve,{canvas:r,texture:l}}const Ct={screenText:`12:00 FEB. 28, 1986\r
<< REWIND`,fontSize:28,fontName:"Press Start 2P",fontColor:"#FFFFFF",showCaret:!1,caretMode:"block",caretBlinkRate:2,horizontalPadding:48,verticalPadding:40,screenColor:"#0b2fd8",glowStrength:.35,curvature:.06,vignette:1.15,noiseStrength:.08,scanlineStrength:.08,scanlineDensity:900,rollSpeed:.4,rollStrength:0,chromaOffset:.0025},yt={screenText:`USERNAME: @ruinedpaintings
PASSWORD: ********`,fontSize:28,fontName:"Press Start 2P",fontColor:"#48ff00",showCaret:!0,caretMode:"block",caretBlinkRate:2,horizontalPadding:48,verticalPadding:40,screenColor:"#000000",glowStrength:.35,curvature:.06,vignette:1.15,noiseStrength:.08,scanlineStrength:.08,scanlineDensity:900,rollSpeed:.4,rollStrength:0,chromaOffset:.0025};function J({screenText:r="12:00 FEB. 28, 1986",fontSize:l=28,fontName:h="Press Start 2P",fontColor:n="#FFFFFF",horizontalPadding:o=48,verticalPadding:s=40,showCaret:u=!1,caretMode:i="block",caretBlinkRate:c=2,screenColor:t="#0b2fd8",glowStrength:p=.35,curvature:b=.06,vignette:R=1.15,noiseStrength:f=.08,scanlineStrength:x=.08,scanlineDensity:S=900,rollSpeed:g=.4,rollStrength:C=0,chromaOffset:y=.0025,side:d=Q}){const M=a.useRef(),k=a.useRef(0),m=a.useRef(!0),{canvas:w,texture:T}=a.useMemo(bt,[]),A=`${l}px "${h}"`,E=V=>{St({canvas:w,text:r,font:A,fontSize:l,fontColor:n,showCaret:u&&V,caretMode:i||"block",horizontalPadding:o,verticalPadding:s}),T.needsUpdate=!0};return a.useEffect(()=>{E(!0)},[r,A,n,o,s,u,i]),K((V,U)=>{M.current&&(M.current.uTime+=U,u&&(k.current+=U,k.current>=1/Math.max(c,.001)&&(k.current=0,m.current=!m.current,E(m.current))))}),e.jsx("crtBlueScreenMaterial",{ref:M,side:d,toneMapped:!1,uTextTexture:T,uScreenColor:t,uNoiseStrength:f,uGlowStrength:p,uCurvature:b,uVignette:R,uScanlineStrength:x,uScanlineDensity:S,uRollSpeed:g,uRollStrength:C,uChromaOffset:y},Te.key)}const Tt=`
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`,kt=`
uniform sampler2D uScene;
uniform sampler2D uFeedback;
uniform float uTime;

uniform float uDecay;
uniform float uZoom;
uniform float uWarp;

uniform float uStaticAmount;
uniform float uScanlineStrength;
uniform float uCurvature;
uniform float uVignette;

varying vec2 vUv;

float hash(vec2 p){
  return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453123);
}

vec2 curve(vec2 uv,float k){
  uv = uv*2.0-1.0;
  uv *= 1.0 + k * pow(abs(uv.yx),vec2(2.0));
  return uv*0.5+0.5;
}

void main(){
  vec2 uv = vUv;

  // warp feedback inward (recursion illusion)
  vec2 fUV = (uv - 0.5) / uZoom + 0.5;
  fUV += sin(vec2(uv.y, uv.x) * 6.0 + uTime*0.4) * 0.003 * uWarp;
  fUV = curve(fUV, uCurvature);

  vec3 sceneCol = texture2D(uScene, uv).rgb;
  vec3 feedbackCol = texture2D(uFeedback, fUV).rgb;

  vec3 col = mix(sceneCol, feedbackCol, uDecay);

  col -= sin(uv.y*900.0)*0.04*uScanlineStrength;
  col = mix(col, vec3(hash(uv*600.0+uTime)), uStaticAmount);

  float d = distance(uv,vec2(0.5));
  col *= 1.0-smoothstep(0.6,uVignette,d);

  gl_FragColor = vec4(col,1.0);
}
`,Mt=te({uScene:null,uFeedback:null,uTime:0,uDecay:.85,uZoom:1.01,uWarp:.6,uStaticAmount:.04,uScanlineStrength:.4,uCurvature:.12,uVignette:.85},Tt,kt);ee({CrtAccumMaterial:Mt});function ke({resolution:r=1024,decay:l=.85,zoom:h=1.01,warp:n=.6,staticAmount:o=.04,scanlineStrength:s=.4,curvature:u=.12,vignette:i=.85,side:c=Q}){const t=a.useRef(),{gl:p,scene:b,camera:R}=he(),f=a.useMemo(()=>new le(r,r),[r]),x=a.useMemo(()=>new le(r,r),[r]),S=a.useMemo(()=>new le(r,r),[r]),g=a.useRef(!1);return K((C,y)=>{if(!t.current)return;t.current.uTime+=y;const d=p.getRenderTarget();p.setRenderTarget(f),p.clear(),p.render(b,R);const M=g.current?x:S,k=g.current?S:x;t.current.uScene=f.texture,t.current.uFeedback=M.texture,p.setRenderTarget(k),p.clear(),p.render(b,R),p.setRenderTarget(d),g.current=!g.current,t.current.uFeedback=k.texture}),e.jsx("crtAccumMaterial",{ref:t,side:c,uDecay:l,uZoom:h,uWarp:n,uStaticAmount:o,uScanlineStrength:s,uCurvature:u,uVignette:i,toneMapped:!1})}const Rt=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,wt=`
uniform sampler2D uMap;
uniform float uTime;

uniform float uStaticAmount;
uniform float uStaticScale;
uniform float uStaticSpeed;

uniform float uScanlineStrength;
uniform float uCurvature;
uniform float uVignette;
uniform float uChromaDrift;
uniform float uBloom;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
}

vec2 curve(vec2 uv, float k) {
  uv = uv * 2.0 - 1.0;
  uv *= 1.0 + k * pow(abs(uv.yx), vec2(2.0));
  return uv * 0.5 + 0.5;
}

void main() {
  vec2 uv = curve(vUv, uCurvature);

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float drift = sin(uTime * 0.6 + uv.y * 4.0) * 0.002 * uChromaDrift;

  vec3 col;
  col.r = texture2D(uMap, uv + vec2(drift, 0.0)).r;
  col.g = texture2D(uMap, uv).g;
  col.b = texture2D(uMap, uv - vec2(drift, 0.0)).b;

  float t = floor(uTime * uStaticSpeed);
  float noise =
    hash(uv * uStaticScale + t) * 0.6 +
    hash(uv * uStaticScale * 1.7 - t) * 0.4;

  col = mix(col, vec3(noise), uStaticAmount);

  float scan = sin(uv.y * 900.0) * 0.04 * uScanlineStrength;
  col -= scan;

  float luma = dot(col, vec3(0.299,0.587,0.114));
  col += col * smoothstep(0.6, 1.0, luma) * uBloom;

  float d = distance(uv, vec2(0.5));
  col *= 1.0 - smoothstep(0.6, uVignette, d);

  gl_FragColor = vec4(col, 1.0);
}
`,Bt=te({uMap:null,uTime:0,uStaticAmount:.1,uStaticScale:600,uStaticSpeed:6,uScanlineStrength:.4,uCurvature:.12,uVignette:.85,uChromaDrift:.25,uBloom:.25},Rt,wt);ee({CrtSceneShaderMaterial:Bt});function Me({scene:r,resolution:l=1024,staticAmount:h=.12,staticScale:n=600,staticSpeed:o=6,scanlineStrength:s=.4,curvature:u=.12,vignette:i=.85,chromaDrift:c=.25,bloom:t=.25,side:p=Q}){const b=a.useRef();return K((R,f)=>{b.current&&(b.current.uTime+=f)}),e.jsx("crtSceneShaderMaterial",{ref:b,side:p,uStaticAmount:h,uStaticScale:n,uStaticSpeed:o,uScanlineStrength:s,uCurvature:u,uVignette:i,uChromaDrift:c,uBloom:t,toneMapped:!1,children:e.jsx(ft,{attach:"uMap",frames:1/0,width:l,height:l,anisotropy:8,children:r})})}const Dt=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,jt=`
uniform float uTime;
uniform sampler2D uTexture;

uniform float uStaticAmount;
uniform float uStaticScale;
uniform float uStaticSpeed;
uniform float uSnap;

uniform float uGlitchRate;
uniform float uScanlineStrength;
uniform float uColorBleed;

uniform float uCurvature;
uniform float uVignette;
uniform float uMaskStrength;

uniform float uFlyback;
uniform float uConverge;
uniform float uBloom;
uniform float uBreath;

uniform float uRetrace;
uniform float uBeamWidth;
uniform float uChromaDrift;
uniform float uHum;

uniform float uThermalDrift;
uniform float uSpotNoise;
uniform float uMaskMode;
uniform float uBarrelConverge;

uniform float uPadX;
uniform float uPadY;

varying vec2 vUv;

/* ----------------- Utils ----------------- */

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
}

vec2 curve(vec2 uv, float k) {
  uv = uv * 2.0 - 1.0;
  uv *= 1.0 + k * pow(abs(uv.yx), vec2(2.0));
  return uv * 0.5 + 0.5;
}

/* ----------------- Main ----------------- */

void main() {

  vec2 uv = vUv;

  uv = (uv - 0.5) * vec2(1.0 - uPadX, 1.0 - uPadY) + 0.5;

  float t = floor(uTime * uStaticSpeed * uSnap) / uSnap;

  float staticField =
    hash(uv * uStaticScale + vec2(t, -t)) * 0.6 +
    hash(uv * uStaticScale * 1.7 + vec2(-t * 2.0, t)) * 0.4;

  float thermalTime = uTime * 0.02;
  vec2 thermalWarp = vec2(
    sin(thermalTime * 0.7 + uv.y * 2.0),
    cos(thermalTime * 0.5 + uv.x * 2.0)
  ) * 0.004 * uThermalDrift;

  uv += thermalWarp;

  float breathe = sin(uTime * 0.35) * 0.003 * uBreath;
  uv += vec2(sin(uv.y * 3.0 + uTime * 0.4), cos(uv.x * 2.0 + uTime * 0.3)) * breathe;

  uv.x += sin(uTime * 0.12 + uv.y * 3.0) * 0.002 * uChromaDrift;
  uv.y += sin(uTime * 40.0 + uv.y * 800.0) * 0.0015 * uFlyback;
  uv.y += sin(uTime * 3.0) * 0.002 * uFlyback;

  uv = curve(uv, uCurvature);

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec2 centered = uv * 2.0 - 1.0;
  float barrel = dot(centered, centered);

  float drift =
    sin(uTime * 0.6) *
    0.002 *
    uConverge *
    mix(0.3, 1.5, barrel * uBarrelConverge);

  vec2 rUV = uv + vec2(drift, 0.0);
  vec2 bUV = uv - vec2(drift, 0.0);

  vec3 col = texture2D(uTexture, uv).rgb;
  vec3 rCol = texture2D(uTexture, rUV).rgb;
  vec3 bCol = texture2D(uTexture, bUV).rgb;

  col.r = rCol.r;
  col.b = bCol.b;

  col.r += hash(uv + uTime) * uColorBleed;
  col.b -= hash(uv - uTime) * uColorBleed;

  float luma = dot(col, vec3(0.299,0.587,0.114));
  float beam = mix(900.0, 700.0, smoothstep(0.4,1.0,luma) * uBeamWidth);
  beam += staticField * 120.0 * uSpotNoise;

  float scan = sin(uv.y * beam) * 0.05 * uScanlineStrength;
  col -= scan;

  vec3 triad = vec3(
    sin(uv.x * 900.0),
    sin(uv.x * 900.0 + 2.1),
    sin(uv.x * 900.0 + 4.2)
  ) * 0.5 + 0.5;

  float grille = sin(uv.x * 1400.0) * 0.5 + 0.5;
  vec3 aperture = vec3(grille);

  vec3 mask = mix(triad, aperture, step(0.5, uMaskMode));
  col *= mix(vec3(1.0), mask, uMaskStrength);

  col += col * smoothstep(0.65, 1.0, luma) * uBloom;

  float retrace = smoothstep(0.0, 0.04, abs(fract(uTime * 0.8) - uv.y));
  col *= mix(1.0, 0.55, retrace * uRetrace);

  float hum = sin((uv.y + uTime * 0.15) * 6.2831) * 0.04 * uHum;
  col -= hum;

  float d = distance(uv, vec2(0.5));
  float vig = 1.0 - smoothstep(0.75, uVignette, d);
  col *= vig;

  vec3 staticColor = vec3(staticField);
  float glitch = step(1.0 - uGlitchRate, hash(vec2(floor(uTime * 10.0), 0.0)));
  vec3 finalColor = mix(col, staticColor, glitch * uStaticAmount);

  gl_FragColor = vec4(finalColor, 1.0);
}
`,Re=te({uTime:0,uTexture:null,uStaticAmount:0,uStaticScale:0,uStaticSpeed:0,uSnap:0,uGlitchRate:0,uScanlineStrength:0,uColorBleed:0,uCurvature:0,uVignette:0,uMaskStrength:0,uFlyback:0,uConverge:0,uBloom:0,uBreath:0,uRetrace:0,uBeamWidth:0,uChromaDrift:0,uHum:0,uThermalDrift:0,uSpotNoise:0,uMaskMode:0,uBarrelConverge:0,uPadX:0,uPadY:0},Dt,jt);ee({CrtShowMaterial:Re});function ue({src:r=Ye("ren_and_stimpy.mp4"),useWebcam:l=!1,padX:h=.06,padY:n=.08,staticAmount:o=.35,staticScale:s=700,staticSpeed:u=9,snap:i=24,glitchRate:c=.18,scanlineStrength:t=.55,colorBleed:p=.14,curvature:b=.12,vignette:R=.75,maskStrength:f=.35,flybackStrength:x=.35,convergenceDrift:S=.4,bloomStrength:g=.25,breathStrength:C=.35,retraceStrength:y=.35,beamWidth:d=.5,chromaDrift:M=.3,humStrength:k=.25,barrelConvergence:m=.6,spotNoise:w=.35,thermalDrift:T=.15,maskMode:A=0,side:E=Q}){const V=a.useRef();return a.useEffect(()=>{if(!V.current)return;let U=null,_=!1;const B=document.createElement("video");B.crossOrigin="anonymous",B.loop=!0,B.muted=!0,B.playsInline=!0,B.autoplay=!0;const D=()=>{if(_)return;const F=new ze(B);F.colorSpace=$e,F.minFilter=ie,F.magFilter=ie,F.generateMipmaps=!1,V.current.uTexture=F},G=async()=>{try{B.src=r,await B.play(),D()}catch(F){console.error("[CRTShowMaterial] Video failed to play:",F)}};return l?(async()=>{try{const F=navigator,ae=F.mediaDevices?.getUserMedia||F.getUserMedia||F.webkitGetUserMedia||F.mozGetUserMedia;if(!ae)throw new Error("getUserMedia not supported on this device");F.mediaDevices?.getUserMedia?U=await F.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!1}):U=await new Promise((q,ne)=>{ae.call(F,{video:!0,audio:!1},q,ne)}),B.srcObject=U,await B.play(),D()}catch(F){console.warn("[CRTShowMaterial] Webcam failed, falling back to video:",F),G()}})():G(),()=>{_=!0,U&&U.getTracks().forEach(F=>F.stop()),V.current?.uTexture&&V.current.uTexture.dispose(),B.pause(),B.remove()}},[r,l]),K((U,_)=>{V.current&&(V.current.uTime+=_)}),e.jsx("crtShowMaterial",{ref:V,side:E,toneMapped:!1,uPadX:h,uPadY:n,uStaticAmount:o,uStaticScale:s,uStaticSpeed:u,uSnap:i,uGlitchRate:c,uScanlineStrength:t,uColorBleed:p,uCurvature:b,uVignette:R,uMaskStrength:f,uFlyback:x,uConverge:S,uBloom:g,uBreath:C,uRetrace:y,uBeamWidth:d,uChromaDrift:M,uHum:k,uThermalDrift:T,uSpotNoise:w,uMaskMode:A,uBarrelConverge:m},Re.key)}const Pt=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,At=`
uniform float uTime;

uniform float uStaticAmount;
uniform float uStaticScale;
uniform float uStaticSpeed;
uniform float uSnap;

uniform float uGlitchRate;
uniform float uScanlineStrength;
uniform float uColorBleed;

uniform float uCurvature;
uniform float uVignette;
uniform float uMaskStrength;

uniform float uFlyback;
uniform float uConverge;
uniform float uBloom;
uniform float uBreath;

/* --- next tier --- */
uniform float uRetrace;
uniform float uBeamWidth;
uniform float uChromaDrift;
uniform float uHum;

uniform float uThermalDrift;
uniform float uSpotNoise;
uniform float uMaskMode;
uniform float uBarrelConverge;

varying vec2 vUv;

/* ----------------- Utils ----------------- */

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
}

vec2 curve(vec2 uv, float k) {
  uv = uv * 2.0 - 1.0;
  uv *= 1.0 + k * pow(abs(uv.yx), vec2(2.0));
  return uv * 0.5 + 0.5;
}

/* ----------------- Colors ----------------- */

vec3 WHITE   = vec3(1.0);
vec3 YELLOW  = vec3(1.0,1.0,0.0);
vec3 CYAN    = vec3(0.0,1.0,1.0);
vec3 GREEN   = vec3(0.0,1.0,0.0);
vec3 MAGENTA = vec3(1.0,0.0,1.0);
vec3 RED     = vec3(1.0,0.0,0.0);
vec3 BLUE    = vec3(0.0,0.0,1.0);
vec3 BLACK   = vec3(0.0);
vec3 GRAY    = vec3(0.4);
vec3 NAVY    = vec3(0.0,0.0,0.4);

/* ----------------- RP-219 Layout ----------------- */

vec3 topBars(float x) {
  if (x < 1.0/7.0) return WHITE;
  if (x < 2.0/7.0) return YELLOW;
  if (x < 3.0/7.0) return CYAN;
  if (x < 4.0/7.0) return GREEN;
  if (x < 5.0/7.0) return MAGENTA;
  if (x < 6.0/7.0) return RED;
  return BLUE;
}

vec3 midBars(float x) {
  if (x < 0.14) return BLUE;
  if (x < 0.28) return BLACK;
  if (x < 0.42) return MAGENTA;
  if (x < 0.56) return BLACK;
  if (x < 0.70) return CYAN;
  if (x < 0.84) return BLACK;
  return GRAY;
}

vec3 bottomBars(float x) {
  if (x < 0.18) return NAVY;
  if (x < 0.36) return WHITE;
  if (x < 0.54) return vec3(0.1);
  if (x < 0.72) return BLACK;
  if (x < 0.86) return GRAY;
  return BLACK;
}

/* ----------------- Main ----------------- */

void main() {

  vec2 uv = vUv;

  float t = floor(uTime * uStaticSpeed * uSnap) / uSnap;

  float staticField =
    hash(uv * uStaticScale + vec2(t, -t)) * 0.6 +
    hash(uv * uStaticScale * 1.7 + vec2(-t * 2.0, t)) * 0.4;

  float thermalTime = uTime * 0.02;
  vec2 thermalWarp = vec2(
    sin(thermalTime * 0.7 + uv.y * 2.0),
    cos(thermalTime * 0.5 + uv.x * 2.0)
  ) * 0.004 * uThermalDrift;

  uv += thermalWarp;

  float breathe = sin(uTime * 0.35) * 0.003 * uBreath;
  uv += vec2(sin(uv.y * 3.0 + uTime * 0.4), cos(uv.x * 2.0 + uTime * 0.3)) * breathe;

  uv.x += sin(uTime * 0.12 + uv.y * 3.0) * 0.002 * uChromaDrift;

  uv.y += sin(uTime * 40.0 + uv.y * 800.0) * 0.0015 * uFlyback;
  uv.y += sin(uTime * 3.0) * 0.002 * uFlyback;

  uv = curve(uv, uCurvature);

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  vec2 centered = uv * 2.0 - 1.0;
  float barrel = dot(centered, centered);

  float drift =
    sin(uTime * 0.6) *
    0.002 *
    uConverge *
    mix(0.3, 1.5, barrel * uBarrelConverge);

  vec2 rUV = uv + vec2(drift, 0.0);
  vec2 bUV = uv - vec2(drift, 0.0);

  vec3 bars;

  if (uv.y > 0.38) bars = topBars(uv.x);
  else if (uv.y > 0.30) bars = midBars(uv.x);
  else bars = bottomBars(uv.x);

  vec3 rBars = bars;
  vec3 bBars = bars;

  if (rUV.y > 0.38) rBars = topBars(rUV.x);
  else if (rUV.y > 0.30) rBars = midBars(rUV.x);
  else rBars = bottomBars(rUV.x);

  if (bUV.y > 0.38) bBars = topBars(bUV.x);
  else if (bUV.y > 0.30) bBars = midBars(bUV.x);
  else bBars = bottomBars(bUV.x);

  bars.r = rBars.r;
  bars.b = bBars.b;

  bars.r += hash(uv + uTime) * uColorBleed;
  bars.b -= hash(uv - uTime) * uColorBleed;

  bars += hash(uv * 60.0 + uTime * 0.4) * 0.02;

  float luma = dot(bars, vec3(0.299,0.587,0.114));
  float beam = mix(900.0, 700.0, smoothstep(0.4,1.0,luma) * uBeamWidth);
  beam += staticField * 120.0 * uSpotNoise;

  float scan = sin(uv.y * beam) * 0.05 * uScanlineStrength;
  bars -= scan;

  vec3 triad = vec3(
    sin(uv.x * 900.0),
    sin(uv.x * 900.0 + 2.1),
    sin(uv.x * 900.0 + 4.2)
  ) * 0.5 + 0.5;

  float grille = sin(uv.x * 1400.0) * 0.5 + 0.5;
  vec3 aperture = vec3(grille);

  vec3 mask = mix(triad, aperture, step(0.5, uMaskMode));
  bars *= mix(vec3(1.0), mask, uMaskStrength);

  bars += bars * smoothstep(0.65, 1.0, luma) * uBloom;

  float retrace = smoothstep(0.0, 0.04, abs(fract(uTime * 0.8) - uv.y));
  bars *= mix(1.0, 0.55, retrace * uRetrace);

  float hum = sin((uv.y + uTime * 0.15) * 6.2831) * 0.04 * uHum;
  bars -= hum;

  float d = distance(uv, vec2(0.5));
  float vig = 1.0 - smoothstep(0.75, uVignette, d);
  bars *= vig;

  float spot =
    hash(uv * uStaticScale * 0.8 + uTime) *
    staticField *
    0.15 *
    uSpotNoise;

  bars += spot;

  vec3 staticColor = vec3(staticField);
  float glitch = step(1.0 - uGlitchRate, hash(vec2(floor(uTime * 10.0), 0.0)));
  vec3 finalColor = mix(bars, staticColor, glitch * uStaticAmount);

  gl_FragColor = vec4(finalColor, 1.0);
}
`,we=te({uTime:0,uStaticAmount:0,uStaticScale:0,uStaticSpeed:0,uSnap:0,uGlitchRate:0,uScanlineStrength:0,uColorBleed:0,uCurvature:0,uVignette:0,uMaskStrength:0,uFlyback:0,uConverge:0,uBloom:0,uBreath:0,uRetrace:0,uBeamWidth:0,uChromaDrift:0,uHum:0,uThermalDrift:0,uSpotNoise:0,uMaskMode:0,uBarrelConverge:0},Pt,At);ee({CrtSmtpeStaticMaterial:we});function Be({staticAmount:r=.35,staticScale:l=700,staticSpeed:h=9,snap:n=24,glitchRate:o=.18,scanlineStrength:s=.55,colorBleed:u=.14,curvature:i=.12,vignette:c=.75,maskStrength:t=.35,flybackStrength:p=.35,convergenceDrift:b=.4,bloomStrength:R=.25,breathStrength:f=.35,retraceStrength:x=.35,beamWidth:S=.5,chromaDrift:g=.3,humStrength:C=.25,barrelConvergence:y=.6,spotNoise:d=.35,thermalDrift:M=.15,maskMode:k=0,side:m=Q}){const w=a.useRef();return K((T,A)=>{w.current&&(w.current.uTime+=A)}),e.jsx("crtSmtpeStaticMaterial",{ref:w,side:m,transparent:!1,depthWrite:!0,toneMapped:!1,uStaticAmount:r,uStaticScale:l,uStaticSpeed:h,uSnap:n,uGlitchRate:o,uScanlineStrength:s,uColorBleed:u,uCurvature:i,uVignette:c,uMaskStrength:t,uFlyback:p,uConverge:b,uBloom:R,uBreath:f,uRetrace:x,uBeamWidth:S,uChromaDrift:g,uHum:C,uThermalDrift:M,uSpotNoise:d,uMaskMode:k,uBarrelConverge:y},we.key)}function Ft({count:r=4,radius:l=2,speed:h=.25}){const n=a.useRef(),o=Math.PI*2/r;return K((s,u)=>{n.current.rotation.y+=u*h}),e.jsx("group",{ref:n,children:Array.from({length:r}).map((s,u)=>{const i=u*o,c=Math.sin(i)*l,t=Math.cos(i)*l;return e.jsx(ge,{position:[c,0,t],rotation:[0,i,0]},u)})})}function De(){return e.jsxs(a.Suspense,{fallback:e.jsx(Xe,{}),children:[e.jsx(be,{makeDefault:!0,position:[0,0,3]}),e.jsx("color",{attach:"background",args:["#646464"]}),e.jsx("ambientLight",{intensity:.3}),e.jsx("directionalLight",{position:[5,6,4],intensity:1.2}),e.jsx(Ft,{count:6,radius:1.2,speed:.6}),e.jsx(at,{scale:1.5,position:[0,.05,0],rotation:[0,0,0]})]})}function Et(){return{channels:a.useMemo(()=>[{key:"static",video:e.jsx(Se,{}),audio:{type:"file",url:$("tv-static.mp3"),loop:!0}},{key:"smtpe",video:e.jsx(Be,{}),audio:{type:"file",url:$("tv-static.mp3"),loop:!0}},{key:"vhs",video:e.jsx(J,{...Ct,horizontalPadding:100,verticalPadding:95}),audio:null},{key:"terminal",video:e.jsx(J,{...yt,horizontalPadding:100,verticalPadding:95}),audio:null},{key:"homeVideo",video:e.jsx(ue,{useWebcam:!0}),audio:{type:"file",url:$("laugh-track.mp3"),loop:!0}},{key:"tv",video:e.jsx(ue,{}),audio:{type:"file",url:$("ren-and-stimpy.mp3"),loop:!0}},{key:"threeD",video:e.jsx(Me,{scene:e.jsx(De,{})}),audio:{type:"strudel",code:de.threeD}},{key:"pip",video:e.jsx(ke,{}),audio:{type:"strudel",code:de.weirderStuff}}],[])}}function Vt({initialPower:r=!0,defaultChannelKey:l,surfChannels:h=!1,initialMuted:n=!1}={}){const o=a.useRef(null),s=a.useRef(null),u=a.useRef(null),i=a.useRef(null),c=a.useRef(null),[t,p]=a.useState(null),[b,R]=a.useState(!1),[f,x]=a.useState(r),[S,g]=a.useState(h),[C,y]=a.useState(n),{channels:d}=Et(),M=a.useMemo(()=>{const v={};return d.forEach((I,j)=>{v[I.key]=j}),v},[d]),[k,m]=a.useState(()=>l&&l in M?M[l]:0),w=f?d[k]:null;a.useEffect(()=>{console.log("[rca] creating AudioContext…");const v=new AudioContext,I=v.createGain(),j=v.createGain(),O=v.createBiquadFilter(),Z=v.createDynamicsCompressor(),L=v.createGain();return O.type="bandpass",O.frequency.value=1800,O.Q.value=.8,j.gain.value=.9,L.gain.value=n?1e-4:.8,I.connect(j).connect(O).connect(Z).connect(L).connect(v.destination),o.current=v,s.current=I,u.current=L,p(v),console.log("[rca] AudioContext ready",v),()=>{console.log("[rca] closing AudioContext"),v.close()}},[n]);const T=Qe(t?{audioContext:t}:null);a.useEffect(()=>{if(!(!T?.ready||!T.output||!s.current)){if(console.log("[rca] attempting to patch strudel…"),console.log("[rca] RCA ctx:",o.current),console.log("[rca] Strudel ctx:",T.ctx||T.audioContext),T.ctx&&o.current&&T.ctx!==o.current){console.error("[rca] ❌ AUDIO CONTEXT MISMATCH — aborting patch");return}try{T.output.disconnect()}catch(v){console.warn("[rca] strudel output disconnect failed",v)}T.output.connect(s.current),console.log("[rca] ✅ strudel patched into tv bus")}},[T?.ready]),a.useEffect(()=>{if(!u.current||!o.current)return;const v=o.current,I=C?1e-4:.8;u.current.gain.cancelScheduledValues(v.currentTime),u.current.gain.linearRampToValueAtTime(I,v.currentTime+.15)},[C]);const A=async()=>{const v=o.current;!v||v.state==="running"||(console.log("[rca] unlocking audio…"),await v.resume(),await T?.unlock?.(),R(!0),console.log("[rca] audio unlocked"))};function E(v=.3){if(!c.current||!i.current)return;const I=o.current;c.current.gain.linearRampToValueAtTime(1e-4,I.currentTime+v),setTimeout(()=>{try{i.current?.stop?.()}catch(j){console.error("[rca cables] current source stop failed",j)}i.current=null,c.current=null},v*1e3)}async function V(v,I=!0,j=.4){const O=o.current;if(!O||!s.current)return;E(),T?.stop?.();const Z=await fetch(v),L=await O.decodeAudioData(await Z.arrayBuffer()),W=O.createBufferSource(),re=O.createGain();W.buffer=L,W.loop=I,re.gain.value=1e-4,W.connect(re).connect(s.current),W.start(),re.gain.linearRampToValueAtTime(1,O.currentTime+j),i.current=W,c.current=re}a.useEffect(()=>{if(!f||C||!w?.audio){E(.35),T?.stop?.();return}const{audio:v}=w;v.type==="file"&&V(v.url,v.loop),v.type==="strudel"&&T?.ready&&(E(.35),T.play(v.code))},[f,k,C,T?.ready]);const U=()=>{A(),x(!0)},_=()=>{E(.35),T?.stop?.(),x(!1)},B=()=>{x(v=>(v?(E(.35),T?.stop?.()):A(),!v))},D=()=>y(!0),G=()=>y(!1),N=()=>y(v=>!v);function F(){m(v=>(v+1)%d.length)}function ae(v){v in M&&m(M[v])}const q=a.useRef(0),ne=a.useRef(1+Math.random()*.5);K((v,I)=>{!f||!S||(q.current+=I,q.current>=ne.current&&(q.current=0,ne.current=.6+Math.random()*.9,m(j=>(j+1)%d.length)))});const Ae=()=>g(!0),Fe=()=>g(!1),Ee=()=>g(v=>!v);async function me(v,I=.5){const j=o.current;if(!j)return;j.state!=="running"&&await A();const O=await fetch(v),Z=await j.decodeAudioData(await O.arrayBuffer()),L=j.createBufferSource(),W=j.createGain();W.gain.value=I,L.buffer=Z,L.connect(W).connect(j.destination),L.start(),L.onended=()=>{L.disconnect(),W.disconnect()}}const Ve=()=>me($("knob-click.mp3"),.35),Ue=()=>me($("switch-click.mp3"),.35);function Ie(v){if(!v||!u.current||!o.current)return;const I=new qe;v.add(I);const j=new Ze(I);u.current.disconnect(),u.current.connect(j.gain),j.setRefDistance(1.2),j.setRolloffFactor(2),v.add(j)}return{channels:d,activeChannel:w,channelIndex:k,channelKey:w?.key??null,power:f,surfing:S,muted:C,unlocked:b,powerOn:U,powerOff:_,togglePower:B,muteOn:D,muteOff:G,toggleMute:N,nextChannel:F,setChannelByKey:ae,surfOn:Ae,surfOff:Fe,toggleSurfing:Ee,knobClick:Ve,dialClick:Ue,unlockAudio:A,attachToObject:Ie,strudel:T}}const je=a.createContext(null);function Pe({children:r,bodyMaterial:l,dialMaterial:h,knobMaterial:n}){const{nodes:o}=ye(xe("retro_tv.glb")),s=a.useMemo(()=>({body:l??new X({color:"#050505",roughness:.65,metalness:.15}),dial:h??new X({color:"#0b0b0b",roughness:.4,metalness:.1}),knob:n??new X({color:"#0b0b0b",roughness:.4,metalness:.1})}),[l,h,n]),u=a.useMemo(()=>{const i=o.retro_tv.clone(),c=o.knob_01.clone(),t=o.knob_02.clone();return i.material=s.body,c.material=s.knob,t.material=s.knob,{Body:i,Knob:c,Knob1:t}},[o,s]);return e.jsx(nt,{meshes:u,children:i=>e.jsx(je.Provider,{value:{merged:i,nodes:o,screenGeo:o.screen.geometry},children:r})})}ye.preload(xe("retro_tv.glb"));function Y(r){let l=null;return r.traverse(h=>{h.isMesh&&!l&&(l=h)}),l}function Ut({knob01Step:r=0,stepsPerRotation:l=12,onDial1Click:h,onDial2Click:n,onDial3Click:o,onDial4Click:s,onDial5Click:u,onKnob01Click:i,onKnob02Click:c,screenMaterial:t,power:p,muted:b,channelSurfing:R,channelIndex:f,...x}){const{merged:S,nodes:g,screenGeo:C}=a.useContext(je),y=a.useRef({}),d=Math.PI*2/l,{knobRotation:M}=z({knobRotation:-(r*d),config:{tension:180,friction:20}}),k=a.useMemo(()=>({d1:Y(g.dial_01)?.geometry,d2:Y(g.dial_02)?.geometry,d3:Y(g.dial_03)?.geometry}),[g]),m=a.useMemo(()=>({power:Y(g.dial_01).material.clone(),terminal:Y(g.dial_02).material.clone(),vhs:Y(g.dial_03).material.clone(),surf:Y(g.dial_01).material.clone(),mute:Y(g.dial_01).material.clone()}),[g]);a.useEffect(()=>{m.power.emissive.set("#ff1a1a"),m.terminal.emissive.set("#00ff55"),m.vhs.emissive.set("#1a4dff"),m.surf.emissive.set("#d0d0d0"),m.mute.emissive.set("#fb00ff")},[m]);const w=z({glow:p?1:0}),T=z({glow:p&&f===3?1:0}),A=z({glow:p&&f===2?1:0}),E=z({glow:p&&R?1:0}),V=z({glow:p&&b?1:0});K(()=>{m.power.emissiveIntensity=w.glow.get()*2,m.terminal.emissiveIntensity=T.glow.get()*2,m.vhs.emissiveIntensity=A.glow.get()*2,m.surf.emissiveIntensity=E.glow.get()*2,m.mute.emissiveIntensity=V.glow.get()*2});function U(D,G=.004){const N=y.current[D];N&&(N.position.z+=G)}function _(D,G=.004){const N=y.current[D];N&&(N.position.z-=G)}function B(D,G){return N=>{N.stopPropagation(),U(D),G?.(),setTimeout(()=>_(D),120)}}return e.jsx("group",{...x,children:e.jsxs("group",{rotation:[-Math.PI,-Math.PI,-Math.PI],children:[e.jsx(S.Body,{}),e.jsx("mesh",{geometry:k.d1,material:m.power,scale:.5,position:[.254,.208,.092],ref:D=>{y.current.dial1=D},onPointerDown:B("dial1",h)}),e.jsx("mesh",{geometry:k.d2,material:m.terminal,scale:.5,position:[.272,.208,.092],ref:D=>{y.current.dial2=D},onPointerDown:B("dial2",n)}),e.jsx("mesh",{geometry:k.d3,material:m.vhs,scale:.5,position:[.29,.208,.092],ref:D=>{y.current.dial3=D},onPointerDown:B("dial3",o)}),e.jsx("mesh",{geometry:k.d1,material:m.surf,scale:.5,position:[.308,.208,.092],ref:D=>{y.current.dial4=D},onPointerDown:B("dial4",s)}),e.jsx("mesh",{geometry:k.d1,material:m.mute,scale:.5,position:[.326,.208,.092],ref:D=>{y.current.dial5=D},onPointerDown:B("dial5",u)}),e.jsx(Ce.group,{position:[.291,.406,.097],"rotation-z":M,children:e.jsx(S.Knob,{onPointerDown:i})}),e.jsx(S.Knob1,{position:[.291,.289,.097],onPointerDown:c}),e.jsx("mesh",{geometry:C,position:[-.077,.262,.07],rotation:[0,0,-3.13],children:t??e.jsx("meshStandardMaterial",{color:"#111",metalness:1,roughness:0})})]})})}function se({stepsPerRotation:r=12,isTurnedOn:l=!0,defaultChannel:h="snow",isSurfingChannels:n=!1,isOnMute:o=!1,...s}){const u=a.useMemo(()=>({body:new X({color:"#050505",roughness:.75,metalness:.05}),plastic:new X({color:"#0b0b0b",roughness:.4,metalness:.1}),metal:new X({color:"#7d7b7b",roughness:0,metalness:1})}),[]),{activeChannel:i,channelIndex:c,channelKey:t,power:p,surfing:b,muted:R,togglePower:f,toggleMute:x,nextChannel:S,setChannelByKey:g,toggleSurfing:C,knobClick:y,dialClick:d}=Vt({initialPower:l,defaultChannelKey:h,surfChannels:n,initialMuted:o}),[M,k]=a.useState(0);a.useEffect(()=>{b&&k(_=>_+1)},[t,k]);function m(){y(),S(),k(_=>_+1)}function w(){d(),f()}function T(){d(),p||f(),b&&C(),g("terminal")}function A(){d(),p||f(),b&&C(),g("vhs")}function E(){d(),C()}function V(){d(),x()}function U(){console.log("knob 2 clicked (reserved)")}return e.jsx(Pe,{bodyMaterial:u.body,dialMaterial:u.plastic,knobMaterial:u.metal,children:e.jsx(Ut,{...s,stepsPerRotation:r,knob01Step:M,power:p,muted:R,channelSurfing:b,channelIndex:c,screenMaterial:i?.video??null,onDial1Click:w,onDial2Click:T,onDial3Click:A,onDial4Click:E,onDial5Click:V,onKnob01Click:m,onKnob02Click:U})})}const ce=["Arial Black","Arial","Verdana","Tahoma","Trebuchet MS","Impact","Courier New","Lucida Console","Monaco","Consolas","Menlo","Orbitron","VT323","Press Start 2P","monospace","sans-serif","serif","terminal"];function It(){const r=H("CRT SMPTE RP-219",{staticAmount:{value:.35,min:0,max:1,step:.01},staticScale:{value:700,min:50,max:1400,step:1},staticSpeed:{value:9,min:.1,max:20,step:.1},snap:{value:24,min:1,max:60,step:1},glitchRate:{value:.18,min:0,max:1,step:.01},scanlineStrength:{value:.55,min:0,max:1,step:.01},colorBleed:{value:.14,min:0,max:.5,step:.01},curvature:{value:.12,min:0,max:.4,step:.01},vignette:{value:.75,min:.6,max:.98,step:.01},maskStrength:{value:.35,min:0,max:1,step:.01},flybackStrength:{value:.35,min:0,max:1,step:.01},convergenceDrift:{value:.4,min:0,max:1,step:.01},bloomStrength:{value:.25,min:0,max:1,step:.01},breathStrength:{value:.35,min:0,max:1,step:.01},retraceStrength:{value:.35,min:0,max:1,step:.01},beamWidth:{value:.5,min:0,max:1,step:.01},chromaDrift:{value:.3,min:0,max:1,step:.01},humStrength:{value:.25,min:0,max:1,step:.01},barrelConvergence:{value:.6,min:0,max:2,step:.01},spotNoise:{value:.35,min:0,max:1,step:.01},thermalDrift:{value:.15,min:0,max:1,step:.01},maskMode:{value:0,options:{shadow:0,grille:1}}},{collapsed:!0}),l=H("CRT Static",{snowAmount:{value:1,min:0,max:1},snowScale:{value:180,min:10,max:800},snowSpeed:{value:1,min:0,max:5},snowSize:{value:240,min:40,max:1e3},curvature:{value:.12,min:0,max:.4,step:.01},vignette:{value:.75,min:.6,max:.98,step:.01},bandStrength:{value:.35,min:0,max:1},bandSpeed:{value:.6,min:0,max:3},bandScale:{value:8,min:1,max:40},snap:{value:24,min:1,max:60,step:1},rfStrength:{value:.25,min:0,max:1},rfScale:{value:22,min:2,max:80},rfSpeed:{value:.4,min:0,max:3}},{collapsed:!0}),h=H("No Signal",{Text:P({screenText:{value:`12:00 FEB. 28, 1986\r
INSERT VHS`,rows:!0},fontSize:{value:28,min:0,max:48,step:1},fontName:{value:"Press Start 2P",options:ce},fontColor:{value:"#FFFFFF"},showCaret:{value:!1},caretMode:{value:"block",options:["block","underscore","line"]},caretBlinkRate:{value:2,min:.2,max:5,step:.1},horizontalPadding:{value:100,min:0,max:1e3,step:1},verticalPadding:{value:95,min:0,max:1e3,step:1}},{collapsed:!0}),Look:P({screenColor:{value:"#0b2fd8"},glowStrength:{value:.35,min:0,max:1,step:.01},curvature:{value:.06,min:0,max:.2,step:.001},vignette:{value:1.15,min:.5,max:2,step:.01}},{collapsed:!0}),Noise:P({noiseStrength:{value:.08,min:0,max:.4,step:.001},scanlineStrength:{value:.08,min:0,max:.3,step:.001},scanlineDensity:{value:900,min:200,max:2e3,step:10}},{collapsed:!0}),Roll:P({rollSpeed:{value:.4,min:0,max:2,step:.01},rollStrength:{value:0,min:0,max:2,step:.01}},{collapsed:!0}),Chroma:P({chromaOffset:{value:.0025,min:0,max:.01,step:1e-4}},{collapsed:!0})},{collapsed:!0}),n=H("Terminal",{Text:P({screenText:{value:`a:\\> ||TERMINAL ERROR||\r
      - 0X666420 -\r
      DATA CORRUPTED\r
a:\\> FULL SYSTEM FAILURE
a:\\> INSERT BOOT DISK`,rows:!0},fontSize:{value:26,min:0,max:48,step:1},fontName:{value:"Press Start 2P",options:ce},fontColor:{value:"#48ff00"},showCaret:{value:!0},caretMode:{value:"block",options:["block","underscore","line"]},caretBlinkRate:{value:2,min:.2,max:5,step:.1},horizontalPadding:{value:100,min:0,max:1e3,step:1},verticalPadding:{value:95,min:0,max:1e3,step:1}},{collapsed:!0}),Look:P({screenColor:{value:"#000000"},glowStrength:{value:.35,min:0,max:1,step:.01},curvature:{value:.06,min:0,max:.2,step:.001},vignette:{value:1.15,min:.5,max:2,step:.01}},{collapsed:!0}),Noise:P({noiseStrength:{value:.08,min:0,max:.4,step:.001},scanlineStrength:{value:.08,min:0,max:.3,step:.001},scanlineDensity:{value:900,min:200,max:2e3,step:10}},{collapsed:!0}),Roll:P({rollSpeed:{value:.4,min:0,max:2,step:.01},rollStrength:{value:0,min:0,max:2,step:.01}},{collapsed:!0}),Chroma:P({chromaOffset:{value:.0025,min:0,max:.01,step:1e-4}},{collapsed:!0})},{collapsed:!0}),o=H("Ascii",{Text:P({screenText:{value:pt,rows:!0},fontSize:{value:6,min:0,max:48,step:1},fontName:{value:"Press Start 2P",options:ce},fontColor:{value:"#ff0000"},showCaret:{value:!1},caretMode:{value:"block",options:["block","underscore","line"]},caretBlinkRate:{value:2,min:.2,max:5,step:.1},horizontalPadding:{value:208,min:0,max:1e3,step:1},verticalPadding:{value:0,min:0,max:1e3,step:1}},{collapsed:!0}),Look:P({screenColor:{value:"#000000"},glowStrength:{value:.35,min:0,max:1,step:.01},curvature:{value:.06,min:0,max:.2,step:.001},vignette:{value:1.15,min:.5,max:2,step:.01}},{collapsed:!0}),Noise:P({noiseStrength:{value:.08,min:0,max:.4,step:.001},scanlineStrength:{value:.08,min:0,max:.3,step:.001},scanlineDensity:{value:900,min:200,max:2e3,step:10}},{collapsed:!0}),Roll:P({rollSpeed:{value:.4,min:0,max:2,step:.01},rollStrength:{value:0,min:0,max:2,step:.01}},{collapsed:!0}),Chroma:P({chromaOffset:{value:.0025,min:0,max:.01,step:1e-4}},{collapsed:!0})},{collapsed:!0}),s=H("HomeVideo",{padX:{value:.06,min:0,max:.25,step:.001},padY:{value:.08,min:0,max:.25,step:.001},curvature:{value:.12,min:0,max:.4,step:.001},vignette:{value:.75,min:.3,max:1.2,step:.001},staticAmount:{value:.35,min:0,max:1,step:.001},staticScale:{value:700,min:50,max:2e3,step:1},staticSpeed:{value:9,min:0,max:30,step:.01},snap:{value:24,min:1,max:60,step:1},spotNoise:{value:.35,min:0,max:1,step:.001},thermalDrift:{value:.15,min:0,max:1,step:.001},glitchRate:{value:.18,min:0,max:1,step:.001},flybackStrength:{value:.35,min:0,max:1,step:.001},retraceStrength:{value:.35,min:0,max:1,step:.001},humStrength:{value:.25,min:0,max:1,step:.001},breathStrength:{value:.35,min:0,max:1,step:.001},scanlineStrength:{value:.55,min:0,max:1,step:.001},beamWidth:{value:.5,min:0,max:1,step:.001},bloomStrength:{value:.25,min:0,max:1,step:.001},colorBleed:{value:.14,min:0,max:.5,step:.001},chromaDrift:{value:.3,min:0,max:1,step:.001},convergenceDrift:{value:.4,min:0,max:1,step:.001},barrelConvergence:{value:.6,min:0,max:2,step:.001},maskStrength:{value:.35,min:0,max:1,step:.001},maskMode:{value:0,options:{Triad:0,Aperture:1}}},{collapsed:!0}),u=H("TV",{padX:{value:.06,min:0,max:.25,step:.001},padY:{value:.08,min:0,max:.25,step:.001},curvature:{value:.12,min:0,max:.4,step:.001},vignette:{value:.75,min:.3,max:1.2,step:.001},staticAmount:{value:.35,min:0,max:1,step:.001},staticScale:{value:700,min:50,max:2e3,step:1},staticSpeed:{value:9,min:0,max:30,step:.01},snap:{value:24,min:1,max:60,step:1},spotNoise:{value:.35,min:0,max:1,step:.001},thermalDrift:{value:.15,min:0,max:1,step:.001},glitchRate:{value:.18,min:0,max:1,step:.001},flybackStrength:{value:.35,min:0,max:1,step:.001},retraceStrength:{value:.35,min:0,max:1,step:.001},humStrength:{value:.25,min:0,max:1,step:.001},breathStrength:{value:.35,min:0,max:1,step:.001},scanlineStrength:{value:.55,min:0,max:1,step:.001},beamWidth:{value:.5,min:0,max:1,step:.001},bloomStrength:{value:.25,min:0,max:1,step:.001},colorBleed:{value:.14,min:0,max:.5,step:.001},chromaDrift:{value:.3,min:0,max:1,step:.001},convergenceDrift:{value:.4,min:0,max:1,step:.001},barrelConvergence:{value:.6,min:0,max:2,step:.001},maskStrength:{value:.35,min:0,max:1,step:.001},maskMode:{value:0,options:{Triad:0,Aperture:1}}},{collapsed:!0}),i=H("Scene In Scene",{Render:P({resolution:{value:1024,min:256,max:2048,step:256}},{collapsed:!0}),Static:P({staticAmount:{value:.12,min:0,max:.5,step:.001},staticScale:{value:600,min:50,max:2e3,step:10},staticSpeed:{value:6,min:0,max:20,step:.1}},{collapsed:!0}),CRT:P({scanlineStrength:{value:.4,min:0,max:1,step:.01},curvature:{value:.12,min:0,max:.4,step:.005},vignette:{value:.85,min:.4,max:1.2,step:.005},chromaDrift:{value:.25,min:0,max:1,step:.005}},{collapsed:!0}),Post:P({bloom:{value:.25,min:0,max:2,step:.01}},{collapsed:!0})},{collapsed:!0}),c=H("Picture In Picture",{Render:P({resolution:{value:1024,min:256,max:2048,step:256}},{collapsed:!0}),Feedback:P({decay:{value:.85,min:.7,max:.97,step:.001},zoom:{value:1.01,min:1,max:1.05,step:5e-4},warp:{value:.6,min:0,max:2,step:.01}},{collapsed:!0}),CRT:P({staticAmount:{value:.04,min:0,max:.25,step:.001},scanlineStrength:{value:.4,min:0,max:1,step:.01},curvature:{value:.12,min:0,max:.4,step:.005},vignette:{value:.85,min:.4,max:1.2,step:.005}},{collapsed:!0})},{collapsed:!0});return{smtpe:r,tvStatic:l,noSignal:h,terminal:n,ascii:o,homeVideo:s,tv:u,threeD:i,pip:c}}function _t(){const r=It(),{smtpe:l,tvStatic:h,noSignal:n,terminal:o,ascii:s,homeVideo:u,tv:i,threeD:c,pip:t}=r,p=7,b=1,R=Math.PI*.9,f=.2,x=a.useMemo(()=>[e.jsx("meshStandardMaterial",{color:"#111",roughness:0,metalness:1},"std"),e.jsx(Se,{...h},"static"),e.jsx(Be,{...l},"smtpe"),e.jsx(J,{...o},"terminal"),e.jsx(J,{...n},"vhs"),e.jsx(J,{...s},"ascii"),e.jsx(ue,{useWebcam:!0,...u},"homeVideo"),e.jsx(ue,{...i},"tv"),e.jsx(Me,{scene:e.jsx(De,{}),...c},"three-d"),e.jsx(ke,{...t},"pip")],[r]),[S,g]=a.useState(0),C=a.useRef(1),y=a.useMemo(()=>x.slice(0,S),[x,S]),d=a.useMemo(()=>{const m=y.length;if(m===0)return[];const w=R,T=x.length,E=w/Math.max(T-1,1)*.95,V=(m-1)/2;return y.map((U,_)=>{const B=(_-V)*E,D=Math.sin(B)*p,G=-(Math.cos(B)*p)+p+f;return{position:[D,b,G],rotation:[0,-B,0],material:U}})},[y,p,b,R,f,x.length]),M=Je(d,{keys:(m,w)=>w,from:{position:[0,-1,3],rotation:[0,0,0],scale:.25},enter:m=>({position:m.position,rotation:m.rotation,scale:1}),update:m=>({position:m.position,rotation:m.rotation,scale:1}),leave:{position:[0,b-.5,2.5],rotation:[0,Math.PI*.15,0],scale:.05},config:{mass:1,tension:220,friction:26}}),k=a.useCallback(()=>{g(m=>m>=x.length?(C.current=-1,m-1):m<=0?(C.current=1,1):m+C.current)},[x.length]);return e.jsxs(e.Fragment,{children:[M((m,w,T,A)=>e.jsxs(Ce.mesh,{position:m.position,rotation:m.rotation,scale:m.scale,children:[e.jsx("planeGeometry",{args:[2,2]}),w.material]},`panel-${A}`)),e.jsx(ge,{position:[0,0,1],rotation:[-Math.PI/2,0,0],onClick:k}),e.jsx(fe,{position:[-1,0,2],rotation:[-Math.PI/2,0,0]}),e.jsx(fe,{position:[1,0,2],rotation:[-Math.PI/2,0,0]})]})}function ia(){return e.jsxs(e.Fragment,{children:[e.jsx(be,{makeDefault:!0,position:[0,7,11],near:1,far:100}),e.jsx(rt,{makeDefault:!0,minDistance:0}),e.jsx("ambientLight",{intensity:.1}),e.jsx("directionalLight",{position:[5,6,4],intensity:.2,lookAt:[0,0,0]}),e.jsx("directionalLight",{position:[-5,6,-4],intensity:.2,lookAt:[0,0,0]}),e.jsx(vt,{}),e.jsx(Gt,{}),e.jsx(_t,{}),e.jsx(Ot,{}),e.jsx(Lt,{}),e.jsx("color",{attach:"background",args:["#000000"]}),e.jsx(ot,{preset:"city"})]})}function Gt(){return e.jsx("group",{children:e.jsxs(Pe,{children:[e.jsx(se,{position:[5,1,-3],rotation:[0,-Math.PI/4,0],scale:10,defaultChannel:"vhs"}),e.jsx(se,{position:[0,6.25,-5],rotation:[0,0,0],scale:10,defaultChannel:"threeD",isTurnedOn:!1}),e.jsx(se,{position:[-5,1,-3],rotation:[0,Math.PI/4,0],scale:10,defaultChannel:"terminal",isTurnedOn:!1})]})})}function Ot(){return e.jsxs("mesh",{position:[0,0,2],rotation:[-Math.PI/2,0,-Math.PI/4],children:[e.jsx("planeGeometry",{args:[20,20]}),e.jsx(it,{blur:[300,100],resolution:2048,mixBlur:1,mixStrength:80,roughness:1,depthScale:1.2,minDepthThreshold:.4,maxDepthThreshold:1.4,color:"#131313",metalness:1})]})}function Lt(){return e.jsxs("group",{children:[e.jsx("directionalLight",{position:[0,10,0],intensity:.7,lookAt:[0,0,0]}),e.jsx("directionalLight",{position:[0,10,0],intensity:.7,lookAt:[0,1,-3]}),e.jsxs("mesh",{position:[0,10,5],rotation:[-Math.PI/4,0,0],children:[e.jsx("torusGeometry",{args:[5]}),e.jsx("meshStandardMaterial",{color:"#FFFFFF",emissive:"#FFFFFF",emissiveIntensity:1})]})]})}export{ia as default};
