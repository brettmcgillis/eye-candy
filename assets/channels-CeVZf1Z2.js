import{r as y,m as pe,bh as Pt,E as tr,bd as Ot,n as G,j as C,Y as K,aY as Ke,K as Q,y as me,q as Ee,o as ee,W as Ae,dg as At,dh as _t,J as Ze,di as rr,au as ze,a7 as nr,a8 as H,v as ar,B as or,aO as ir,dj as ue,bg as fe,aW as ge,aK as _e,w as ur,dk as sr,a0 as te,aX as N,cy as De}from"./index-9kczwZ3h.js";import{S as et}from"./tracks-DQtmcKVK.js";import{s as xe}from"./shaderMaterial-ClvqP3t9.js";import{_ as lr}from"./extends-CF3RwP-h.js";import{u as cr}from"./Fbo-BZ-L4Eba.js";import{C as mr}from"./crtStaticMaterial-CLaKW948.js";import{u as M,e as X,k as ie,ax as ve,w as tt,I as rt,d as Ce,z as ne,aG as Ue,U as Ne,s as de,m as Y,H as ye,a1 as nt,F as W,v as A,f as re,D as J,a as V,$ as fr,A as vr,X as hr,T as le,C as dr,a7 as ce,g as pr,r as gr}from"./three.tsl-CYo1OdCl.js";import{B as xr}from"./Bret-C59Giz-U.js";import{I as Sr}from"./Reversal-LzwZu2v7.js";import{P as br}from"./PerspectiveCamera-BnxR8e3M.js";const yr=y.forwardRef(({children:e,compute:t,width:r,height:n,samples:a=8,renderPriority:o=0,eventPriority:u=0,frames:s=1/0,stencilBuffer:l=!1,depthBuffer:i=!0,generateMipmaps:c=!1,...f},m)=>{const{size:h,viewport:v}=pe(),d=cr((r||h.width)*v.dpr,(n||h.height)*v.dpr,{samples:a,stencilBuffer:l,depthBuffer:i,generateMipmaps:c}),[p]=y.useState(()=>new Pt),x=y.useCallback((S,R,w)=>{var T,k;let g=(T=d.texture)==null||(T=T.__r3f.parent)==null?void 0:T.object;for(;g&&!(g instanceof tr);){var b;g=(b=g.__r3f.parent)==null?void 0:b.object}if(!g)return!1;w.raycaster.camera||w.events.compute(S,w,(k=w.previousRoot)==null?void 0:k.getState());const[E]=w.raycaster.intersectObject(g);if(!E)return!1;const B=E.uv;if(!B)return!1;R.raycaster.setFromCamera(R.pointer.set(B.x*2-1,B.y*2-1),R.camera)},[]);return y.useImperativeHandle(m,()=>d.texture,[d]),y.createElement(y.Fragment,null,Ot(y.createElement(wr,{renderPriority:o,frames:s,fbo:d},e,y.createElement("group",{onPointerOver:()=>null})),p,{events:{compute:t||x,priority:u}}),y.createElement("primitive",lr({object:d.texture},f)))});function wr({frames:e,renderPriority:t,children:r,fbo:n}){let a=0,o,u,s,l;return G(i=>{(e===1/0||a<e)&&(o=i.gl.autoClear,u=i.gl.xr.enabled,s=i.gl.getRenderTarget(),l=i.gl.xr.isPresenting,i.gl.autoClear=!0,i.gl.xr.enabled=!1,i.gl.xr.isPresenting=!1,i.gl.setRenderTarget(n),i.gl.render(i.scene,i.camera),i.gl.setRenderTarget(s),i.gl.autoClear=o,i.gl.xr.enabled=u,i.gl.xr.isPresenting=l,a++)},t),y.createElement(y.Fragment,null,r)}function Kn({color:e="#111111",metalness:t=.2,position:r=[0,-.02,0],roughness:n=.92,rotation:a=[-Math.PI/2,0,0],size:o=30}){return C.jsxs("mesh",{position:r,rotation:a,receiveShadow:!0,children:[C.jsx("planeGeometry",{args:[o,o]}),C.jsx("meshStandardMaterial",{color:e,metalness:t,roughness:n})]})}function Zn({boardColor:e="#7a5337",boardMetalness:t=.03,boardRoughness:r=.92,panels:n,columns:a=3,panelHeight:o=2,panelWidth:u=2,spacingX:s=3.3,spacingZ:l=2.8}){const i=Math.ceil(n.length/a),c=(a-1)/2,f=(i-1)/2;return C.jsx("group",{children:n.map((m,h)=>{const v=h%a,d=Math.floor(h/a),p=(v-c)*s,x=(d-f)*l,S=(v-c)*.025;return C.jsxs("group",{position:[p,.08,x],rotation:[-Math.PI/2,0,S],children:[C.jsxs("mesh",{castShadow:!0,receiveShadow:!0,children:[C.jsx("boxGeometry",{args:[u+.48,o+.48,.16]}),C.jsx("meshStandardMaterial",{color:e,metalness:t,roughness:r})]}),C.jsxs("mesh",{position:[0,0,.081],children:[C.jsx("planeGeometry",{args:[u,o]}),m.video]})]},m.key)})})}const Tr=`
                                                                                                    
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
                                                                                                    
`,Mr=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Cr=`
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
`,Dt=xe({uTime:0,uTextTexture:null,uScreenColor:new Ee(.05,.18,.85),uNoiseStrength:.08,uGlowStrength:.35,uCurvature:.06,uVignette:.85,uScanlineStrength:.08,uScanlineDensity:900,uRollSpeed:.4,uRollStrength:.4,uChromaOffset:.0025},Mr,Cr);ee({CrtBlueScreenMaterial:Dt});function kr(e,t,r,n,a,o){const u=t.split("");let s="";const l=[];return u.forEach(i=>{if(i===`
`)l.push(s),s="";else{const c=s+i;e.measureText(c).width>a&&s?(l.push(s),s=i):s=c}}),s&&l.push(s),l.forEach((i,c)=>{e.fillText(i,r,n+c*o)}),{lines:l,y:n+(l.length-1)*o}}function Rr({canvas:e,text:t,font:r,fontSize:n,fontColor:a,showCaret:o,caretMode:u,horizontalPadding:s,verticalPadding:l}){const i=e.getContext("2d");i.clearRect(0,0,e.width,e.height),i.font=r,i.fillStyle=a,i.textBaseline="top";const c=n*1.3,f=e.width-s*2,{lines:m,y:h}=kr(i,t,s,l,f,c);if(o&&m.length){const v=m[m.length-1],d=i.measureText(v),p=s+d.width+4,x=d.actualBoundingBoxAscent+d.actualBoundingBoxDescent||n;u==="underscore"?i.fillRect(p,h+n*1.05,n*.8,3):u==="line"?i.fillRect(p,h+2,Math.max(4,n*.08),x):i.fillRect(p,h+2,n*.6,x)}}function Er(){const e=document.createElement("canvas");e.width=1024,e.height=512;const t=new Ke(e);return t.minFilter=Q,t.magFilter=Q,t.wrapS=me,t.wrapT=me,{canvas:e,texture:t}}const Ut={screenText:`12:00 FEB. 28, 1986\r
<< REWIND`,fontSize:28,fontName:"Press Start 2P",fontColor:"#FFFFFF",showCaret:!1,caretMode:"block",caretBlinkRate:2,horizontalPadding:48,verticalPadding:40,screenColor:"#0b2fd8",glowStrength:.35,curvature:.06,vignette:1.15,noiseStrength:.08,scanlineStrength:.08,scanlineDensity:900,rollSpeed:.4,rollStrength:0,chromaOffset:.0025},Nt={screenText:`USERNAME: @ruinedpaintings
PASSWORD: ********`,fontSize:28,fontName:"Press Start 2P",fontColor:"#48ff00",showCaret:!0,caretMode:"block",caretBlinkRate:2,horizontalPadding:48,verticalPadding:40,screenColor:"#000000",glowStrength:.35,curvature:.06,vignette:1.15,noiseStrength:.08,scanlineStrength:.08,scanlineDensity:900,rollSpeed:.4,rollStrength:0,chromaOffset:.0025};function Ie({screenText:e="12:00 FEB. 28, 1986",fontSize:t=28,fontName:r="Press Start 2P",fontColor:n="#FFFFFF",horizontalPadding:a=48,verticalPadding:o=40,showCaret:u=!1,caretMode:s="block",caretBlinkRate:l=2,screenColor:i="#0b2fd8",glowStrength:c=.35,curvature:f=.06,vignette:m=1.15,noiseStrength:h=.08,scanlineStrength:v=.08,scanlineDensity:d=900,rollSpeed:p=.4,rollStrength:x=0,chromaOffset:S=.0025,side:R=K}){const w=y.useRef(),T=y.useRef(0),k=y.useRef(!0),{canvas:g,texture:b}=y.useMemo(Er,[]),E=`${t}px "${r}"`,B=D=>{Rr({canvas:g,text:e,font:E,fontSize:t,fontColor:n,showCaret:u&&D,caretMode:s||"block",horizontalPadding:a,verticalPadding:o}),b.needsUpdate=!0};return y.useEffect(()=>{B(!0)},[e,E,n,a,o,u,s]),G((D,j)=>{w.current&&(w.current.uTime+=j,u&&(T.current+=j,T.current>=1/Math.max(l,.001)&&(T.current=0,k.current=!k.current,B(k.current))))}),C.jsx("crtBlueScreenMaterial",{ref:w,side:R,toneMapped:!1,uTextTexture:b,uScreenColor:i,uNoiseStrength:h,uGlowStrength:c,uCurvature:f,uVignette:m,uScanlineStrength:v,uScanlineDensity:d,uRollSpeed:p,uRollStrength:x,uChromaOffset:S},Dt.key)}const Fr=`
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`,Br=`
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
`,jr=xe({uScene:null,uFeedback:null,uTime:0,uDecay:.85,uZoom:1.01,uWarp:.6,uStaticAmount:.04,uScanlineStrength:.4,uCurvature:.12,uVignette:.85},Fr,Br);ee({CrtAccumMaterial:jr});function Pr({resolution:e=1024,decay:t=.85,zoom:r=1.01,warp:n=.6,staticAmount:a=.04,scanlineStrength:o=.4,curvature:u=.12,vignette:s=.85,side:l=K}){const i=y.useRef(),{gl:c,scene:f,camera:m}=pe(),h=y.useMemo(()=>new Ae(e,e),[e]),v=y.useMemo(()=>new Ae(e,e),[e]),d=y.useMemo(()=>new Ae(e,e),[e]),p=y.useRef(!1);return G((x,S)=>{if(!i.current)return;i.current.uTime+=S;const R=c.getRenderTarget();c.setRenderTarget(h),c.clear(),c.render(f,m);const w=p.current?v:d,T=p.current?d:v;i.current.uScene=h.texture,i.current.uFeedback=w.texture,c.setRenderTarget(T),c.clear(),c.render(f,m),c.setRenderTarget(R),p.current=!p.current,i.current.uFeedback=T.texture}),C.jsx("crtAccumMaterial",{ref:i,side:l,uDecay:t,uZoom:r,uWarp:n,uStaticAmount:a,uScanlineStrength:o,uCurvature:u,uVignette:s,toneMapped:!1})}const Or=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Ar=`
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
`,_r=xe({uMap:null,uTime:0,uStaticAmount:.1,uStaticScale:600,uStaticSpeed:6,uScanlineStrength:.4,uCurvature:.12,uVignette:.85,uChromaDrift:.25,uBloom:.25},Or,Ar);ee({CrtSceneShaderMaterial:_r});function Dr({scene:e,resolution:t=1024,staticAmount:r=.12,staticScale:n=600,staticSpeed:a=6,scanlineStrength:o=.4,curvature:u=.12,vignette:s=.85,chromaDrift:l=.25,bloom:i=.25,side:c=K}){const f=y.useRef();return G((m,h)=>{f.current&&(f.current.uTime+=h)}),C.jsx("crtSceneShaderMaterial",{ref:f,side:c,uStaticAmount:r,uStaticScale:n,uStaticSpeed:a,uScanlineStrength:o,uCurvature:u,uVignette:s,uChromaDrift:l,uBloom:i,toneMapped:!1,children:C.jsx(yr,{attach:"uMap",frames:1/0,width:t,height:t,anisotropy:8,children:e})})}const Ur=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Nr=`
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
`,It=xe({uTime:0,uTexture:null,uStaticAmount:0,uStaticScale:0,uStaticSpeed:0,uSnap:0,uGlitchRate:0,uScanlineStrength:0,uColorBleed:0,uCurvature:0,uVignette:0,uMaskStrength:0,uFlyback:0,uConverge:0,uBloom:0,uBreath:0,uRetrace:0,uBeamWidth:0,uChromaDrift:0,uHum:0,uThermalDrift:0,uSpotNoise:0,uMaskMode:0,uBarrelConverge:0,uPadX:0,uPadY:0},Ur,Nr);ee({CrtShowMaterial:It});function at({src:e=At("ren_and_stimpy.mp4"),useWebcam:t=!1,padX:r=.06,padY:n=.08,staticAmount:a=.35,staticScale:o=700,staticSpeed:u=9,snap:s=24,glitchRate:l=.18,scanlineStrength:i=.55,colorBleed:c=.14,curvature:f=.12,vignette:m=.75,maskStrength:h=.35,flybackStrength:v=.35,convergenceDrift:d=.4,bloomStrength:p=.25,breathStrength:x=.35,retraceStrength:S=.35,beamWidth:R=.5,chromaDrift:w=.3,humStrength:T=.25,barrelConvergence:k=.6,spotNoise:g=.35,thermalDrift:b=.15,maskMode:E=0,side:B=K}){const D=y.useRef();return y.useEffect(()=>{if(!D.current)return;let j=null,z=!1;const P=document.createElement("video");P.crossOrigin="anonymous",P.loop=!0,P.muted=!0,P.playsInline=!0,P.autoplay=!0;const O=()=>{if(z)return;const _=new _t(P);_.colorSpace=Ze,_.minFilter=Q,_.magFilter=Q,_.generateMipmaps=!1,D.current.uTexture=_},U=async()=>{try{P.src=e,await P.play(),O()}catch(_){console.error("[CRTShowMaterial] Video failed to play:",_)}};return t?(async()=>{try{const _=navigator,Z=_.mediaDevices?.getUserMedia||_.getUserMedia||_.webkitGetUserMedia||_.mozGetUserMedia;if(!Z)throw new Error("getUserMedia not supported on this device");_.mediaDevices?.getUserMedia?j=await _.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!1}):j=await new Promise((Oe,q)=>{Z.call(_,{video:!0,audio:!1},Oe,q)}),P.srcObject=j,await P.play(),O()}catch(_){console.warn("[CRTShowMaterial] Webcam failed, falling back to video:",_),U()}})():U(),()=>{z=!0,j&&j.getTracks().forEach(_=>_.stop()),D.current?.uTexture&&D.current.uTexture.dispose(),P.pause(),P.remove()}},[e,t]),G((j,z)=>{D.current&&(D.current.uTime+=z)}),C.jsx("crtShowMaterial",{ref:D,side:B,toneMapped:!1,uPadX:r,uPadY:n,uStaticAmount:a,uStaticScale:o,uStaticSpeed:u,uSnap:s,uGlitchRate:l,uScanlineStrength:i,uColorBleed:c,uCurvature:f,uVignette:m,uMaskStrength:h,uFlyback:v,uConverge:d,uBloom:p,uBreath:x,uRetrace:S,uBeamWidth:R,uChromaDrift:w,uHum:T,uThermalDrift:b,uSpotNoise:g,uMaskMode:E,uBarrelConverge:k},It.key)}const Ir=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Vr=`
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
`,Vt=xe({uTime:0,uStaticAmount:0,uStaticScale:0,uStaticSpeed:0,uSnap:0,uGlitchRate:0,uScanlineStrength:0,uColorBleed:0,uCurvature:0,uVignette:0,uMaskStrength:0,uFlyback:0,uConverge:0,uBloom:0,uBreath:0,uRetrace:0,uBeamWidth:0,uChromaDrift:0,uHum:0,uThermalDrift:0,uSpotNoise:0,uMaskMode:0,uBarrelConverge:0},Ir,Vr);ee({CrtSmtpeStaticMaterial:Vt});function Lr({staticAmount:e=.35,staticScale:t=700,staticSpeed:r=9,snap:n=24,glitchRate:a=.18,scanlineStrength:o=.55,colorBleed:u=.14,curvature:s=.12,vignette:l=.75,maskStrength:i=.35,flybackStrength:c=.35,convergenceDrift:f=.4,bloomStrength:m=.25,breathStrength:h=.35,retraceStrength:v=.35,beamWidth:d=.5,chromaDrift:p=.3,humStrength:x=.25,barrelConvergence:S=.6,spotNoise:R=.35,thermalDrift:w=.15,maskMode:T=0,side:k=K}){const g=y.useRef();return G((b,E)=>{g.current&&(g.current.uTime+=E)}),C.jsx("crtSmtpeStaticMaterial",{ref:g,side:k,transparent:!1,depthWrite:!0,toneMapped:!1,uStaticAmount:e,uStaticScale:t,uStaticSpeed:r,uSnap:n,uGlitchRate:a,uScanlineStrength:o,uColorBleed:u,uCurvature:s,uVignette:l,uMaskStrength:i,uFlyback:c,uConverge:f,uBloom:m,uBreath:h,uRetrace:v,uBeamWidth:d,uChromaDrift:p,uHum:x,uThermalDrift:w,uSpotNoise:R,uMaskMode:T,uBarrelConverge:S},Vt.key)}class Wr{constructor(t){this.isFont=!0,this.type="Font",this.data=t}generateShapes(t,r=100,n="ltr"){const a=[],o=Gr(t,r,this.data,n);for(let u=0,s=o.length;u<s;u++)a.push(...o[u].toShapes());return a}}function Gr(e,t,r,n){const a=Array.from(e),o=t/r.resolution,u=(r.boundingBox.yMax-r.boundingBox.yMin+r.underlineThickness)*o,s=[];let l=0,i=0;(n=="rtl"||n=="tb")&&a.reverse();for(let c=0;c<a.length;c++){const f=a[c];if(f===`
`)l=0,i-=u;else{const m=zr(f,o,l,i,r);n=="tb"?(l=0,i+=r.ascender*o):l+=m.offsetX,s.push(m.path)}}return s}function zr(e,t,r,n,a){const o=a.glyphs[e]||a.glyphs["?"];if(!o){console.error('THREE.Font: character "'+e+'" does not exists in font family '+a.familyName+".");return}const u=new rr;let s,l,i,c,f,m,h,v;if(o.o){const d=o._cachedOutline||(o._cachedOutline=o.o.split(" "));for(let p=0,x=d.length;p<x;)switch(d[p++]){case"m":s=d[p++]*t+r,l=d[p++]*t+n,u.moveTo(s,l);break;case"l":s=d[p++]*t+r,l=d[p++]*t+n,u.lineTo(s,l);break;case"q":i=d[p++]*t+r,c=d[p++]*t+n,f=d[p++]*t+r,m=d[p++]*t+n,u.quadraticCurveTo(f,m,i,c);break;case"b":i=d[p++]*t+r,c=d[p++]*t+n,f=d[p++]*t+r,m=d[p++]*t+n,h=d[p++]*t+r,v=d[p++]*t+n,u.bezierCurveTo(f,m,h,v,i,c);break}}return{offsetX:o.ha*t,path:u}}function ot(e,t,r,n,a,o,u){try{var s=e[o](u),l=s.value}catch(i){return void r(i)}s.done?t(l):Promise.resolve(l).then(n,a)}function Lt(e,t,r){return t=Fe(t),(function(n,a){if(a&&(typeof a=="object"||typeof a=="function"))return a;if(a!==void 0)throw new TypeError("Derived constructors may only return object or undefined");return(function(o){if(o===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return o})(n)})(e,Gt()?Reflect.construct(t,[],Fe(e).constructor):t.apply(e,r))}function qe(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function Je(e,t,r){return t&&(function(n,a){for(var o=0;o<a.length;o++){var u=a[o];u.enumerable=u.enumerable||!1,u.configurable=!0,"value"in u&&(u.writable=!0),Object.defineProperty(n,zt(u.key),u)}})(e.prototype,t),Object.defineProperty(e,"prototype",{writable:!1}),e}function Hr(e,t,r){return(t=zt(t))in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function Fe(e){return Fe=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},Fe(e)}function Wt(e,t){if(typeof t!="function"&&t!==null)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&$e(e,t)}function Gt(){try{var e=!Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){}))}catch{}return(Gt=function(){return!!e})()}function it(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter(function(a){return Object.getOwnPropertyDescriptor(e,a).enumerable})),r.push.apply(r,n)}return r}function ut(e){for(var t=1;t<arguments.length;t++){var r=arguments[t]!=null?arguments[t]:{};t%2?it(Object(r),!0).forEach(function(n){Hr(e,n,r[n])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):it(Object(r)).forEach(function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(r,n))})}return e}function He(){var e,t,r=typeof Symbol=="function"?Symbol:{},n=r.iterator||"@@iterator",a=r.toStringTag||"@@toStringTag";function o(h,v,d,p){var x=v&&v.prototype instanceof s?v:s,S=Object.create(x.prototype);return $(S,"_invoke",(function(R,w,T){var k,g,b,E=0,B=T||[],D=!1,j={p:0,n:0,v:e,a:z,f:z.bind(e,4),d:function(P,O){return k=P,g=0,b=e,j.n=O,u}};function z(P,O){for(g=P,b=O,t=0;!D&&E&&!U&&t<B.length;t++){var U,F=B[t],_=j.p,Z=F[2];P>3?(U=Z===O)&&(b=F[(g=F[4])?5:(g=3,3)],F[4]=F[5]=e):F[0]<=_&&((U=P<2&&_<F[1])?(g=0,j.v=O,j.n=F[1]):_<Z&&(U=P<3||F[0]>O||O>Z)&&(F[4]=P,F[5]=O,j.n=Z,g=0))}if(U||P>1)return u;throw D=!0,O}return function(P,O,U){if(E>1)throw TypeError("Generator is already running");for(D&&O===1&&z(O,U),g=O,b=U;(t=g<2?e:b)||!D;){k||(g?g<3?(g>1&&(j.n=-1),z(g,b)):j.n=b:j.v=b);try{if(E=2,k){if(g||(P="next"),t=k[P]){if(!(t=t.call(k,b)))throw TypeError("iterator result is not an object");if(!t.done)return t;b=t.value,g<2&&(g=0)}else g===1&&(t=k.return)&&t.call(k),g<2&&(b=TypeError("The iterator does not provide a '"+P+"' method"),g=1);k=e}else if((t=(D=j.n<0)?b:R.call(w,j))!==u)break}catch(F){k=e,g=1,b=F}finally{E=1}}return{value:t,done:D}}})(h,d,p),!0),S}var u={};function s(){}function l(){}function i(){}t=Object.getPrototypeOf;var c=[][n]?t(t([][n]())):($(t={},n,function(){return this}),t),f=i.prototype=s.prototype=Object.create(c);function m(h){return Object.setPrototypeOf?Object.setPrototypeOf(h,i):(h.__proto__=i,$(h,a,"GeneratorFunction")),h.prototype=Object.create(f),h}return l.prototype=i,$(f,"constructor",i),$(i,"constructor",l),l.displayName="GeneratorFunction",$(i,a,"GeneratorFunction"),$(f),$(f,a,"Generator"),$(f,n,function(){return this}),$(f,"toString",function(){return"[object Generator]"}),(He=function(){return{w:o,m}})()}function $(e,t,r,n){var a=Object.defineProperty;try{a({},"",{})}catch{a=0}$=function(o,u,s,l){function i(c,f){$(o,c,function(m){return this._invoke(c,f,m)})}u?a?a(o,u,{value:s,enumerable:!l,configurable:!l,writable:!l}):o[u]=s:(i("next",0),i("throw",1),i("return",2))},$(e,t,r,n)}function $e(e,t){return $e=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(r,n){return r.__proto__=n,r},$e(e,t)}function zt(e){var t=(function(r,n){if(typeof r!="object"||!r)return r;var a=r[Symbol.toPrimitive];if(a!==void 0){var o=a.call(r,n);if(typeof o!="object")return o;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(r)})(e,"string");return typeof t=="symbol"?t:t+""}function Ht(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var st,lt={exports:{}},$r=Ht((st||(st=1,(function(e){var t=/\n/,r=`
`,n=/\s/;function a(s,l,i,c){var f=s.indexOf(l,i);return f===-1||f>c?c:f}function o(s){return n.test(s)}function u(s,l,i,c){return{start:l,end:l+Math.min(c,i-l)}}e.exports=function(s,l){return e.exports.lines(s,l).map(function(i){return s.substring(i.start,i.end)}).join(`
`)},e.exports.lines=function(s,l){if((l=l||{}).width===0&&l.mode!=="nowrap")return[];s=s||"";var i=typeof l.width=="number"?l.width:Number.MAX_VALUE,c=Math.max(0,l.start||0),f=typeof l.end=="number"?l.end:s.length,m=l.mode,h=l.measure||u;return m==="pre"?(function(v,d,p,x,S){for(var R=[],w=p,T=p;T<x&&T<d.length;T++){var k=d.charAt(T),g=t.test(k);if(g||T===x-1){var b=v(d,w,g?T:T+1,S);R.push(b),w=T+1}}return R})(h,s,c,f,i):(function(v,d,p,x,S,R){var w=[],T=S;for(R==="nowrap"&&(T=Number.MAX_VALUE);p<x&&p<d.length;){for(var k=a(d,r,p,x);p<k&&o(d.charAt(p));)p++;var g=v(d,p,k,T),b=p+(g.end-g.start),E=b+1;if(b<k){for(;b>p&&!o(d.charAt(b));)b--;if(b===p)E>p+1&&E--,b=E;else for(E=b;b>p&&o(d.charAt(b-1));)b--}if(b>=p){var B=v(d,p,b,T);w.push(B)}p=E}return w})(h,s,c,f,i,m)}})(lt)),lt.exports)),ct=["x","e","a","o","n","s","r","c","u","m","v","w","z"],mt=["m","w"],ft=["H","I","N","E","F","K","L","T","U","V","W","X","Y","Z"],vt=9,he=32,Yr=(function(){return Je(function e(){var t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};qe(this,e),this.glyphs=[],this._measure=this.computeMetrics.bind(this),this.update(t)},[{key:"width",get:function(){return this._width}},{key:"height",get:function(){return this._height}},{key:"descender",get:function(){return this._descender}},{key:"ascender",get:function(){return this._ascender}},{key:"xHeight",get:function(){return this._xHeight}},{key:"baseline",get:function(){return this._baseline}},{key:"capHeight",get:function(){return this._capHeight}},{key:"lineHeight",get:function(){return this._lineHeight}},{key:"linesTotal",get:function(){return this._linesTotal}},{key:"lettersTotal",get:function(){return this._lettersTotal}},{key:"wordsTotal",get:function(){return this._wordsTotal}},{key:"update",value:function(e){var t=this;if(e=Object.assign({measure:this._measure},e),this._options=e,this._options.tabSize=pt(this._options.tabSize,4),!e.font)throw new Error("must provide a valid bitmap font");var r=this.glyphs,n=e.text||"",a=e.font;this._setupSpaceGlyphs(a);var o=$r.lines(n,e),u=e.width||0,s=n.split(" ").filter(function(w){return w!==`
`}).length,l=n.split("").filter(function(w){return w!==`
`&&w!==" "}).length;r.length=0;var i=o.reduce(function(w,T){return Math.max(w,T.width,u)},0),c=0,f=0,m=pt(e.lineHeight,a.common.lineHeight),h=a.common.base,v=m-h,d=e.letterSpacing||0,p=m*o.length-v,x=(function(w){return w==="center"?1:w==="right"?2:0})(this._options.align);f-=p,this._width=i,this._height=p,this._descender=m-h,this._baseline=h,this._xHeight=(function(w){for(var T=0;T<ct.length;T++){var k=ct[T].charCodeAt(0),g=ke(w.chars,k);if(g>=0)return w.chars[g].height}return 0})(a),this._capHeight=(function(w){for(var T=0;T<ft.length;T++){var k=ft[T].charCodeAt(0),g=ke(w.chars,k);if(g>=0)return w.chars[g].height}return 0})(a),this._lineHeight=m,this._ascender=m-v-this._xHeight;var S=0,R=0;o.forEach(function(w,T){for(var k,g=w.start,b=w.end,E=w.width,B=n.slice(g,b).split(" ").filter(function(_){return _!==""}).length,D=n.slice(g,b).split(" ").join("").length,j=0,z=0,P=g;P<b;P++){var O=n.charCodeAt(P),U=t.getGlyph(a,O);if(U){k&&(c+=dt(a,k.id,U.id));var F=c;x===1?F+=(i-E)/2:x===2&&(F+=i-E),r.push({position:[F,f],data:U,index:P,linesTotal:o.length,lineIndex:T,lineLettersTotal:D,lineLetterIndex:j,lineWordsTotal:B,lineWordIndex:z,wordsTotal:s,wordIndex:S,lettersTotal:l,letterIndex:R}),U.id===he&&k.id!==he&&(z++,S++),U.id!==he&&(j++,R++),c+=U.xadvance+d,k=U}}f+=m,c=0}),this._lettersTotal=l,this._wordsTotal=s,this._linesTotal=o.length}},{key:"getGlyph",value:function(e,t){var r=ht(e,t);return r||(t===vt?this._fallbackTabGlyph:t===he?this._fallbackSpaceGlyph:null)}},{key:"computeMetrics",value:function(e,t,r,n){var a,o,u=this._options.letterSpacing||0,s=this._options.font,l=0,i=0,c=0;if(!s.chars||s.chars.length===0)return{start:t,end:t,width:0};r=Math.min(e.length,r);for(var f=t;f<r;f++){var m=e.charCodeAt(f);if(a=this.getGlyph(s,m)){a.char=e[f],a.xoffset;var h=(l+=o?dt(s,o.id,a.id):0)+a.xadvance+u,v=l+a.width;if(v>=n||h>=n)break;l=h,i=v,o=a}c++}return o&&(i+=o.xoffset),{start:t,end:t+c,width:i}}},{key:"_setupSpaceGlyphs",value:function(e){if(this._fallbackSpaceGlyph=null,this._fallbackTabGlyph=null,e.chars&&e.chars.length!==0){var t=ht(e,he)||(function(a){for(var o=0;o<mt.length;o++){var u=mt[o].charCodeAt(0),s=ke(a.chars,u);if(s>=0)return a.chars[s]}return 0})(e)||e.chars[0],r=this._options.tabSize*t.xadvance;this._fallbackSpaceGlyph=t;var n=Object.assign({},t);this._fallbackTabGlyph=Object.assign(n,{x:0,y:0,xadvance:r,id:vt,xoffset:0,yoffset:0,width:0,height:0})}}}])})();function ht(e,t){if(!e.chars||e.chars.length===0)return null;var r=ke(e.chars,t);return r>=0?e.chars[r]:null}function dt(e,t,r){if(!e.kernings||e.kernings.length===0)return 0;for(var n=e.kernings,a=0;a<n.length;a++){var o=n[a];if(o.first===t&&o.second===r)return o.amount}return 0}function ke(e,t,r){for(var n=r=r||0;n<e.length;n++)if(e[n].id===t)return n;return-1}function pt(e,t){return typeof e=="number"?e:typeof t=="number"?t:0}var I={min:[0,0],max:[0,0]};function gt(e){var t=e.length/2;I.min[0]=e[0],I.min[1]=e[1],I.max[0]=e[0],I.max[1]=e[1];for(var r=0;r<t;r++){var n=e[2*r+0],a=e[2*r+1];I.min[0]=Math.min(n,I.min[0]),I.min[1]=Math.min(a,I.min[1]),I.max[0]=Math.max(n,I.max[0]),I.max[1]=Math.max(a,I.max[1])}}var xt={computeBox:function(e,t){return gt(e),t.min.set(I.min[0],I.min[1],0),t.max.set(I.max[0],I.max[1],0),t},computeSphere:function(e,t){gt(e);var r=I.min[0],n=I.min[1],a=I.max[0]-r,o=I.max[1]-n,u=Math.sqrt(a*a+o*o);t.center.set(r+a/2,n+o/2,0),t.radius=u/2}},St,bt,yt,wt,Tt,Mt,Ct,kt,Ve={pages:function(e){var t=new Float32Array(4*e.length*1),r=0;return e.forEach(function(n){var a=n.data.page||0;t[r++]=a,t[r++]=a,t[r++]=a,t[r++]=a}),t},attributes:function(e,t,r,n,a){var o=new Float32Array(4*e.length*2),u=new Float32Array(4*e.length*2),s=new Float32Array(4*e.length*2),l=new Float32Array(4*e.length*2),i=new Float32Array(4*e.length*2),c=new Float32Array(4*e.length*2),f=0,m=0,h=0,v=0,d=0,p=0;return e.forEach(function(x){var S=x.data,R=S.x+S.width,w=S.y+S.height,T=S.x/t,k=S.y/r,g=R/t,b=w/r;n&&(k=(r-S.y)/r,b=(r-w)/r),o[f++]=T,o[f++]=k,o[f++]=T,o[f++]=b,o[f++]=g,o[f++]=b,o[f++]=g,o[f++]=k,u[v++]=x.position[0]/a.width,u[v++]=(x.position[1]+a.height)/a.height,u[v++]=x.position[0]/a.width,u[v++]=(x.position[1]+a.height+S.height)/a.height,u[v++]=(x.position[0]+S.width)/a.width,u[v++]=(x.position[1]+a.height+S.height)/a.height,u[v++]=(x.position[0]+S.width)/a.width,u[v++]=(x.position[1]+a.height)/a.height,s[d++]=0,s[d++]=1,s[d++]=0,s[d++]=0,s[d++]=1,s[d++]=0,s[d++]=1,s[d++]=1,l[p++]=S.width,l[p++]=S.height,l[p++]=S.width,l[p++]=S.height,l[p++]=S.width,l[p++]=S.height,l[p++]=S.width,l[p++]=S.height;var E=x.position[0]+S.xoffset,B=x.position[1]+S.yoffset,D=S.width,j=S.height;i[m++]=E,i[m++]=B,i[m++]=E,i[m++]=B+j,i[m++]=E+D,i[m++]=B+j,i[m++]=E+D,i[m++]=B,c[h++]=E+D/2,c[h++]=B+j/2,c[h++]=E+D/2,c[h++]=B+j/2,c[h++]=E+D/2,c[h++]=B+j/2,c[h++]=E+D/2,c[h++]=B+j/2}),{uvs:o,layoutUvs:u,positions:i,centers:c,glyphUvs:s,glyphResolution:l}},infos:function(e,t){for(var r=new Float32Array(4*e.length),n=new Float32Array(4*e.length),a=new Float32Array(4*e.length),o=new Float32Array(4*e.length),u=new Float32Array(4*e.length),s=new Float32Array(4*e.length),l=new Float32Array(4*e.length),i=new Float32Array(4*e.length),c=new Float32Array(4*e.length),f=new Float32Array(4*e.length),m=0,h=0,v=0,d=0,p=0,x=0,S=0,R=0,w=0,T=0,k=0;k<e.length;k++){var g=e[k];r[m++]=g.linesTotal,r[m++]=g.linesTotal,r[m++]=g.linesTotal,r[m++]=g.linesTotal,n[h++]=g.lineIndex,n[h++]=g.lineIndex,n[h++]=g.lineIndex,n[h++]=g.lineIndex,a[v++]=g.lineLettersTotal,a[v++]=g.lineLettersTotal,a[v++]=g.lineLettersTotal,a[v++]=g.lineLettersTotal,o[d++]=g.lineLetterIndex,o[d++]=g.lineLetterIndex,o[d++]=g.lineLetterIndex,o[d++]=g.lineLetterIndex,u[p++]=g.lineWordsTotal,u[p++]=g.lineWordsTotal,u[p++]=g.lineWordsTotal,u[p++]=g.lineWordsTotal,s[x++]=g.lineWordIndex,s[x++]=g.lineWordIndex,s[x++]=g.lineWordIndex,s[x++]=g.lineWordIndex,l[S++]=g.wordsTotal,l[S++]=g.wordsTotal,l[S++]=g.wordsTotal,l[S++]=g.wordsTotal,i[R++]=g.wordIndex,i[R++]=g.wordIndex,i[R++]=g.wordIndex,i[R++]=g.wordIndex,c[w++]=g.lettersTotal,c[w++]=g.lettersTotal,c[w++]=g.lettersTotal,c[w++]=g.lettersTotal,f[T++]=g.letterIndex,f[T++]=g.letterIndex,f[T++]=g.letterIndex,f[T++]=g.letterIndex}return{linesTotal:r,lineIndex:n,lineLettersTotal:a,lineLetterIndex:o,lineWordsTotal:u,lineWordIndex:s,wordsTotal:l,wordIndex:i,lettersTotal:c,letterIndex:f}}};function Xr(){return bt?St:(bt=1,St=function(e){switch(e){case"int8":return Int8Array;case"int16":return Int16Array;case"int32":return Int32Array;case"uint8":return Uint8Array;case"uint16":return Uint16Array;case"uint32":return Uint32Array;case"float32":return Float32Array;case"float64":return Float64Array;case"array":return Array;case"uint8_clamped":return Uint8ClampedArray}})}function Kr(){if(Mt)return Tt;function e(t){return!!t.constructor&&typeof t.constructor.isBuffer=="function"&&t.constructor.isBuffer(t)}return Mt=1,Tt=function(t){return t!=null&&(e(t)||(function(r){return typeof r.readFloatLE=="function"&&typeof r.slice=="function"&&e(r.slice(0,0))})(t)||!!t._isBuffer)}}var Zr=(function(){if(kt)return Ct;kt=1;var e=Xr(),t=(function(){if(wt)return yt;wt=1;var o=Object.prototype.toString;return yt=function(u){return u.BYTES_PER_ELEMENT&&o.call(u.buffer)==="[object ArrayBuffer]"||Array.isArray(u)}})(),r=Kr(),n=[0,2,3],a=[2,1,3];return Ct=function(o,u){o&&(t(o)||r(o))||(u=o||{},o=null);for(var s=typeof(u=typeof u=="number"?{count:u}:u||{}).type=="string"?u.type:"uint16",l=typeof u.count=="number"?u.count:1,i=u.start||0,c=u.clockwise!==!1?n:a,f=c[0],m=c[1],h=c[2],v=6*l,d=o||new(e(s))(v),p=0,x=0;p<v;p+=6,x+=4){var S=p+i;d[S+0]=x+0,d[S+1]=x+1,d[S+2]=x+2,d[S+3]=x+f,d[S+4]=x+m,d[S+5]=x+h}return d}})(),qr=Ht(Zr),Jr=(function(){function e(t){var r;return qe(this,e),typeof t=="string"&&(t={text:t}),(r=Lt(this,e))._options=Object.assign({},t),r._layout=null,r._visibleGlyphs=[],r.update(r._options),r}return Wt(e,nr),Je(e,[{key:"layout",get:function(){return this._layout}},{key:"visibleGlyphs",get:function(){return this._visibleGlyphs}},{key:"update",value:function(t){if(t=this._validateOptions(t)){this._layout=(function(f){return new Yr(f)})(t);var r=t.flipY!==!1,n=t.font,a=n.common.scaleW,o=n.common.scaleH,u=this._layout.glyphs.filter(function(f){var m=f.data;return m.width*m.height>0});this._visibleGlyphs=u;var s=Ve.attributes(u,a,o,r,this._layout),l=Ve.infos(u,this._layout),i=qr([],{clockwise:!0,type:"uint16",count:u.length});if(this.setIndex(i),this.setAttribute("position",new H(s.positions,2)),this.setAttribute("center",new H(s.centers,2)),this.setAttribute("uv",new H(s.uvs,2)),this.setAttribute("layoutUv",new H(s.layoutUvs,2)),this.setAttribute("glyphUv",new H(s.glyphUvs,2)),this.setAttribute("glyphResolution",new H(s.glyphResolution,2)),this.setAttribute("lineIndex",new H(l.lineIndex,1)),this.setAttribute("lineLettersTotal",new H(l.lineLettersTotal,1)),this.setAttribute("lineLetterIndex",new H(l.lineLetterIndex,1)),this.setAttribute("lineWordsTotal",new H(l.lineWordsTotal,1)),this.setAttribute("lineWordIndex",new H(l.lineWordIndex,1)),this.setAttribute("wordIndex",new H(l.wordIndex,1)),this.setAttribute("letterIndex",new H(l.letterIndex,1)),!t.multipage&&"page"in this.attributes)this.deleteAttribute("page");else if(t.multipage){var c=Ve.pages(u);this.setAttribute("page",new H(c,1))}}}},{key:"computeBoundingSphere",value:function(){this.boundingSphere===null&&(this.boundingSphere=new ar);var t=this.attributes.position.array,r=this.attributes.position.itemSize;if(!t||!r||t.length<2)return this.boundingSphere.radius=0,void this.boundingSphere.center.set(0,0,0);xt.computeSphere(t,this.boundingSphere),isNaN(this.boundingSphere.radius)&&console.error('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.')}},{key:"computeBoundingBox",value:function(){this.boundingBox===null&&(this.boundingBox=new or);var t=this.boundingBox,r=this.attributes.position.array,n=this.attributes.position.itemSize;if(r&&n&&!(r.length<2))return xt.computeBox(r,t);t.makeEmpty()}},{key:"_validateOptions",value:function(t){if(typeof t=="string"&&(t={text:t}),!(t=Object.assign({},this._options,t)).font)throw new TypeError("must specify a { font } in options");return t}}])})(),Qr={transparent:!0,opacity:1,alphaTest:.01,threshold:.2,color:"#ffffff",strokeColor:"#000000",strokeOutsetWidth:0,strokeInsetWidth:.3,isSmooth:0},en=(function(){function e(){var t,r=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};qe(this,e),r=Object.assign(JSON.parse(JSON.stringify(Qr)),r),(t=Lt(this,e)).transparent=r.transparent,t.alphaTest=r.alphaTest,t.opacity=M(r.opacity),t.color=M(new Ee(r.color)),t.map=r.map,t.isSmooth=M(r.isSmooth),t.threshold=M(r.threshold),t.strokeColor=M(new Ee(r.strokeColor)),t.strokeOutsetWidth=M(r.strokeOutsetWidth),t.strokeInsetWidth=M(r.strokeInsetWidth);var n,a,o,u=.7071067811865476,s=X(t.map,ie()),l=ve((n=s.r,a=s.g,o=s.b,tt(rt(n,a),rt(tt(n,a),o))),.5),i=Ce(ne(Ue(l,Ne(l)),.5),0,1),c=de(ve(t.threshold,u),ne(t.threshold,u),l);i=Y(i,c,t.isSmooth);var f=ne(l,ye(t.strokeOutsetWidth,.5)),m=ve(l,ye(t.strokeOutsetWidth,.5)),h=Ce(ne(Ue(f,Ne(f)),.5),0,1),v=nt(Ce(ne(Ue(m,Ne(m)),.5),0,1)),d=de(ve(t.threshold,u),ne(t.threshold,u),f),p=nt(de(ve(t.threshold,u),ne(t.threshold,u),m));h=Y(h,d,t.isSmooth),v=Y(v,p,t.isSmooth);var x=ye(h,v);return t.colorNode=Y(t.color,t.strokeColor,x),t.opacityNode=ye(t.opacity,ne(i,x)),t}return Wt(e,ir),Je(e)})();const $t=Symbol("Comlink.proxy"),tn=Symbol("Comlink.endpoint"),rn=Symbol("Comlink.releaseProxy"),Le=Symbol("Comlink.finalizer"),Re=Symbol("Comlink.thrown"),Rt=e=>typeof e=="object"&&e!==null||typeof e=="function",Yt=new Map([["proxy",{canHandle:e=>Rt(e)&&e[$t],serialize(e){const{port1:t,port2:r}=new MessageChannel;return Xt(e,t),[r,[r]]},deserialize:e=>(e.start(),Zt(e))}],["throw",{canHandle:e=>Rt(e)&&Re in e,serialize({value:e}){let t;return t=e instanceof Error?{isError:!0,value:{message:e.message,name:e.name,stack:e.stack}}:{isError:!1,value:e},[t,[]]},deserialize(e){throw e.isError?Object.assign(new Error(e.value.message),e.value):e.value}}]]);function Xt(e,t=globalThis,r=["*"]){t.addEventListener("message",function n(a){if(!a||!a.data)return;if(!(function(c,f){for(const m of c)if(f===m||m==="*"||m instanceof RegExp&&m.test(f))return!0;return!1})(r,a.origin))return void console.warn(`Invalid origin '${a.origin}' for comlink proxy`);const{id:o,type:u,path:s}=Object.assign({path:[]},a.data),l=(a.data.argumentList||[]).map(ae);let i;try{const c=s.slice(0,-1).reduce((m,h)=>m[h],e),f=s.reduce((m,h)=>m[h],e);switch(u){case"GET":i=f;break;case"SET":c[s.slice(-1)[0]]=ae(a.data.value),i=!0;break;case"APPLY":i=f.apply(c,l);break;case"CONSTRUCT":i=(function(m){return Object.assign(m,{[$t]:!0})})(new f(...l));break;case"ENDPOINT":{const{port1:m,port2:h}=new MessageChannel;Xt(e,h),i=(function(v,d){return Jt.set(v,d),v})(m,[m])}break;case"RELEASE":i=void 0;break;default:return}}catch(c){i={value:c,[Re]:0}}Promise.resolve(i).catch(c=>({value:c,[Re]:0})).then(c=>{const[f,m]=je(c);t.postMessage(Object.assign(Object.assign({},f),{id:o}),m),u==="RELEASE"&&(t.removeEventListener("message",n),Kt(t),Le in e&&typeof e[Le]=="function"&&e[Le]())}).catch(c=>{const[f,m]=je({value:new TypeError("Unserializable return value"),[Re]:0});t.postMessage(Object.assign(Object.assign({},f),{id:o}),m)})}),t.start&&t.start()}function Kt(e){(function(t){return t.constructor.name==="MessagePort"})(e)&&e.close()}function Zt(e,t){const r=new Map;return e.addEventListener("message",function(n){const{data:a}=n;if(!a||!a.id)return;const o=r.get(a.id);if(o)try{o(a)}finally{r.delete(a.id)}}),Ye(e,r,[],t)}function we(e){if(e)throw new Error("Proxy has been released and is not useable")}function qt(e){return se(e,new Map,{type:"RELEASE"}).then(()=>{Kt(e)})}const Be=new WeakMap,Te="FinalizationRegistry"in globalThis&&new FinalizationRegistry(e=>{const t=(Be.get(e)||0)-1;Be.set(e,t),t===0&&qt(e)});function Ye(e,t,r=[],n=function(){}){let a=!1;const o=new Proxy(n,{get(u,s){if(we(a),s===rn)return()=>{(function(l){Te&&Te.unregister(l)})(o),qt(e),t.clear(),a=!0};if(s==="then"){if(r.length===0)return{then:()=>o};const l=se(e,t,{type:"GET",path:r.map(i=>i.toString())}).then(ae);return l.then.bind(l)}return Ye(e,t,[...r,s])},set(u,s,l){we(a);const[i,c]=je(l);return se(e,t,{type:"SET",path:[...r,s].map(f=>f.toString()),value:i},c).then(ae)},apply(u,s,l){we(a);const i=r[r.length-1];if(i===tn)return se(e,t,{type:"ENDPOINT"}).then(ae);if(i==="bind")return Ye(e,t,r.slice(0,-1));const[c,f]=Et(l);return se(e,t,{type:"APPLY",path:r.map(m=>m.toString()),argumentList:c},f).then(ae)},construct(u,s){we(a);const[l,i]=Et(s);return se(e,t,{type:"CONSTRUCT",path:r.map(c=>c.toString()),argumentList:l},i).then(ae)}});return(function(u,s){const l=(Be.get(s)||0)+1;Be.set(s,l),Te&&Te.register(u,s,u)})(o,e),o}function Et(e){const t=e.map(je);return[t.map(n=>n[0]),(r=t.map(n=>n[1]),Array.prototype.concat.apply([],r))];var r}const Jt=new WeakMap;function je(e){for(const[t,r]of Yt)if(r.canHandle(e)){const[n,a]=r.serialize(e);return[{type:"HANDLER",name:t,value:n},a]}return[{type:"RAW",value:e},Jt.get(e)||[]]}function ae(e){switch(e.type){case"HANDLER":return Yt.get(e.name).deserialize(e.value);case"RAW":return e.value}}function se(e,t,r,n){return new Promise(a=>{const o=new Array(4).fill(0).map(()=>Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(16)).join("-");t.set(o,a),e.start&&e.start(),e.postMessage(Object.assign({id:o},r),n)})}var nn=class{worker;api;initPromise;constructor(e,t){this.worker=new Worker(e,{type:"module"}),this.api=Zt(this.worker),this.initPromise=this.api.initialize(t)}initialize=()=>this.initPromise;loadFont=async e=>(await this.initPromise,this.api.loadFont(e));generateAtlas=e=>this.api.generateAtlas(e);exportJSON=e=>this.api.exportJSON(e);dispose=()=>this.api.dispose();generateMSDFAtlas=e=>this.api.generateMSDFAtlas(e);generateMSDFFont=e=>this.api.generateMSDFFont(e);terminate=()=>this.worker.terminate()},an=class{static Encoder=new TextEncoder;client=null;workerUrl;wasmUrl;initialized=!1;constructor(e={}){this.workerUrl=e.workerUrl||new URL("./worker.js",import.meta.url).href,this.wasmUrl=e.wasmUrl}async initialize(){this.initialized||(this.client=new nn(this.workerUrl,this.wasmUrl),await this.client.initialize(),this.initialized=!0)}async generate(e){if(!this.client||!this.initialized)throw new Error("MSDF not initialized. Call initialize() first.");return e.fonts?this.generateMultiple(e):this.generateSingle(e)}async generateSingle(e){const{onProgress:t,...r}=e;await this.client.loadFont(r.font);const n=await this.client.generateAtlas(r),a=await this.client.exportJSON({atlas:n,fontSize:e.fontSize||48}),o=await this.atlasToBlob(n),u={...a,pages:[`data:image/png;base64,${await this.blobToBase64(o)}`]};return t?.(100,1,1),this.toFontFamily(u,n.info.name||"font",n.info.weight||400)}async generateMultiple(e){const{fonts:t,onProgress:r,...n}=e;if(!t||t.length===0)throw new Error("No fonts provided");const a={};let o=0;const u=t.length;for(const s of t){const{font:l,...i}=s,c={...n,...i,font:l,charset:i.charset??n.charset??""};if(!c.charset)throw new Error("charset is required globally or per-font");const f=await this.generateSingle(c);for(const[m,h]of Object.entries(f))for(const[v,d]of Object.entries(h)){const p=Number(v);a[m]?.[p]&&console.warn(`Duplicate font: ${m} (${p}). Overwriting.`),a[m]||(a[m]={}),a[m][p]=d}o++,r?.(Math.round(o/u*100),o,u)}return a}async generateAtlas(e){if(!this.client||!this.initialized)throw new Error("MSDF not initialized. Call initialize() first.");const{onProgress:t,...r}=e;return await this.client.loadFont(r.font),await this.client.generateAtlas(r)}async dispose(){this.client&&(await this.client.dispose(),this.client.terminate(),this.client=null,this.initialized=!1)}async toFontFamily(e,t,r){return{[t]:{[r]:e}}}atlasToBlob(e){const t=document.createElement("canvas");return t.width=e.textureSize[0],t.height=e.textureSize[1],t.getContext("2d").putImageData(e.texture,0,0),new Promise((r,n)=>{t.toBlob(a=>a?r(a):n(new Error("Failed to create blob")),"image/png")})}blobToBase64(e){return new Promise((t,r)=>{const n=new FileReader;n.onloadend=()=>t(n.result.split(",")[1]),n.onerror=r,n.readAsDataURL(e)})}},on={charset:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ",fontSize:48,textureSize:[512,512],fieldRange:4,fixOverlaps:!0,onProgress:function(){}},un=(function(){var e,t=(e=He().m(function r(n){var a,o,u,s,l,i,c,f,m,h,v,d,p=arguments;return He().w(function(x){for(;;)switch(x.n){case 0:return a=p.length>1&&p[1]!==void 0?p[1]:{},o=ut(ut({},on),a),u=new an({workerUrl:o.workerUrl,wasmUrl:o.wasmUrl}),x.n=1,u.initialize();case 1:return x.n=2,fetch(n);case 2:return s=x.v,x.n=3,s.arrayBuffer();case 3:return l=x.v,i=new Uint8Array(l),x.n=4,u.generate({font:i,charset:o.charset,fontSize:o.fontSize,textureSize:o.textureSize,fieldRange:o.fieldRange,fixOverlaps:o.fixOverlaps,onProgress:o.onProgress});case 4:return c=x.v,x.n=5,u.dispose();case 5:return f=Object.keys(c)[0],m=Object.keys(c[f])[0],h=c[f][m],v=h.pages[0],x.n=6,new Promise(function(S,R){var w=new Image;w.onload=function(){var T=new ze(w);T.needsUpdate=!0,S(T)},w.onerror=R,w.src=v});case 6:return d=x.v,x.a(2,{font:new Wr(h),atlas:d})}},r)}),function(){var r=this,n=arguments;return new Promise(function(a,o){var u=e.apply(r,n);function s(i){ot(u,a,o,s,l,"next",i)}function l(i){ot(u,a,o,s,l,"throw",i)}s(void 0)})});return function(r){return t.apply(this,arguments)}})();const sn=[1024,1024],ln=64,cn=4,mn=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?;:\\/:()[]{}<>+-=_*#%$@&|~\`"'
\r	░▒▓█▄▀■□◼◻`,Ft={"Press Start 2P":ue("PressStart2P-Regular.ttf"),VT323:ue("VT323-Regular.ttf"),Orbitron:ue("Orbitron-wght.ttf"),"Roboto Mono":ue("RobotoMono-wght.ttf"),Roboto:ue("Roboto-wdth-wght.ttf"),"Muro Slant":ue("Muroslant.ttf")},fn={"Arial Black":"Roboto",Arial:"Roboto",Verdana:"Roboto",Tahoma:"Roboto","Trebuchet MS":"Roboto",Impact:"Roboto","Courier New":"Roboto Mono","Lucida Console":"Roboto Mono",Monaco:"Roboto Mono",Consolas:"Roboto Mono",Menlo:"Roboto Mono",monospace:"Roboto Mono","sans-serif":"Roboto",serif:"Roboto",terminal:"Roboto Mono"};function vn(e){return fn[e]||e||"Roboto Mono"}function hn(e){const t=vn(e);return Ft[t]||Ft["Roboto Mono"]}ee(ge);const dn="/msdfgen/worker.bundled.js",pn="/msdfgen/msdfgen.wasm";function gn(e){return W(()=>{const t=ie(),r=t.sub(A(.5)),n=re(1).sub(r.length().mul(e.vignette).smoothstep(.55,.95)),a=J(.5,t.y.mul(900).fract()),o=t.x.mul(812).add(t.y.mul(431)).add(e.time.mul(60)).sin().mul(.04).add(.96);return V(e.screenColor).mul(n).mul(o).sub(a.mul(e.scanlineStrength.mul(.08)))})}function xn({fontName:e,screenText:t,showCaret:r,caretMode:n,caretBlinkRate:a}){const[o,u]=y.useState(null),s=y.useRef(0),l=y.useRef(!0);y.useEffect(()=>{let c=!1;async function f(){const{font:m,atlas:h}=await un(hn(e),{workerUrl:dn,wasmUrl:pn,charset:mn,fontSize:ln,textureSize:sn,fieldRange:cn});if(c){h.dispose();return}u({font:m,atlas:h})}return f(),()=>{c=!0}},[e]),G((c,f)=>{!r||!o||(s.current+=f,s.current>=1/Math.max(a,.001)&&(s.current=0,l.current=!l.current))});const i=y.useMemo(()=>r?n==="underscore"?`${t}${l.current?"_":" "}`:n==="line"?`${t}${l.current?"|":" "}`:`${t}${l.current?"█":" "}`:t,[n,t,r]);return{assets:o,resolvedText:i}}function Sn({assets:e,resolvedText:t,fontColor:r}){const n=y.useRef(),a=y.useMemo(()=>e?new Jr({text:t,font:e.font.data,align:"center",width:1500,lineHeight:70,letterSpacing:0}):null,[e,t]),o=y.useMemo(()=>e?new en({map:e.atlas,color:r,transparent:!0,opacity:1,isSmooth:1,threshold:.5}):null,[e,r]);return y.useEffect(()=>()=>{a?.dispose(),o?.dispose()},[a,o]),G(()=>{!n.current||!a||(n.current.geometry=a)}),!e||!a||!o?null:C.jsxs("mesh",{ref:n,position:[0,0,.003],scale:[.0025,.0025,.0025],children:[C.jsx("primitive",{attach:"geometry",object:a}),C.jsx("primitive",{attach:"material",object:o})]})}function bn({canvas:e,text:t,fontName:r,fontSize:n,fontColor:a,horizontalPadding:o,verticalPadding:u,showCaret:s,caretMode:l}){const i=e.getContext("2d");if(!i)return;i.clearRect(0,0,e.width,e.height),i.font=`${n}px "${r}"`,i.fillStyle=a,i.textBaseline="top";const c=n*1.3,f=e.width-o*2,m=t.split("");let h="";const v=[];if(m.forEach(w=>{if(w===`
`){v.push(h),h="";return}const T=h+w;if(i.measureText(T).width>f&&h){v.push(h),h=w;return}h=T}),h&&v.push(h),v.forEach((w,T)=>{i.fillText(w,o,u+T*c)}),!s||v.length===0)return;const d=v[v.length-1],p=i.measureText(d),x=o+p.width+4,S=u+(v.length-1)*c,R=p.actualBoundingBoxAscent+p.actualBoundingBoxDescent||n;l==="underscore"?i.fillRect(x,S+n*1.05,n*.8,3):l==="line"?i.fillRect(x,S+2,Math.max(3,n*.08),R):i.fillRect(x,S+2,n*.6,R)}function yn({text:e,fontName:t,fontSize:r,fontColor:n,horizontalPadding:a,verticalPadding:o,showCaret:u,caretMode:s,caretBlinkRate:l}){const i=y.useRef(null),c=y.useRef(null),f=y.useRef(0),m=y.useRef(!0);if(!i.current||!c.current){const v=document.createElement("canvas");v.width=1024,v.height=512,c.current=v;const d=new Ke(v);d.minFilter=Q,d.magFilter=Q,d.wrapS=me,d.wrapT=me,i.current=d}const h=v=>{bn({canvas:c.current,text:e,fontName:t,fontSize:r,fontColor:n,horizontalPadding:a,verticalPadding:o,showCaret:u&&v,caretMode:s}),i.current.needsUpdate=!0};return y.useEffect(()=>{h(!0)},[s,n,t,r,a,u,e,o]),G((v,d)=>{u&&(f.current+=d,f.current>=1/Math.max(l,.001)&&(f.current=0,m.current=!m.current,h(m.current)))}),y.useEffect(()=>()=>{i.current?.dispose?.()},[]),C.jsxs("mesh",{position:[0,0,.002],children:[C.jsx("planeGeometry",{args:[2,2]}),C.jsx("meshBasicMaterial",{transparent:!0,toneMapped:!1,map:i.current})]})}function We({screenText:e="12:00 FEB. 28, 1986",fontName:t="Press Start 2P",fontColor:r="#FFFFFF",showCaret:n=!1,caretMode:a="block",caretBlinkRate:o=2,screenColor:u="#0b2fd8",vignette:s=1.15,scanlineStrength:l=.08,side:i=K,...c}){const{fontSize:f=28,horizontalPadding:m=48,verticalPadding:h=40,glowStrength:v=.35,curvature:d=.06,noiseStrength:p=.08,scanlineDensity:x=900,rollSpeed:S=.4,rollStrength:R=0,chromaOffset:w=.0025}=c,T=y.useMemo(()=>({time:M(0),screenColor:M(new Ee(u)),vignette:M(s),scanlineStrength:M(l)}),[]);y.useEffect(()=>{T.screenColor.value.set(u),T.vignette.value=s,T.scanlineStrength.value=l},[u,l,T,s]);const k=y.useMemo(()=>{const E=new fe({side:i,toneMapped:!1});return E.colorNode=gn(T)(),E},[i,T]);y.useEffect(()=>{k.userData.legacyProps={fontSize:f,horizontalPadding:m,verticalPadding:h,glowStrength:v,curvature:d,noiseStrength:p,scanlineDensity:x,rollSpeed:S,rollStrength:R,chromaOffset:w}},[k,w,d,f,v,m,p,S,R,x,h]),G(({clock:E})=>{T.time.value=E.getElapsedTime()});const{assets:g,resolvedText:b}=xn({fontName:t,screenText:e,showCaret:n,caretMode:a,caretBlinkRate:o});return C.jsxs(C.Fragment,{children:[C.jsx("primitive",{attach:"material",object:k}),C.jsx(Sn,{assets:g,resolvedText:b,fontColor:r}),C.jsx(yn,{text:e,fontName:t,fontSize:f,fontColor:r,horizontalPadding:m,verticalPadding:h,showCaret:n,caretMode:a,caretBlinkRate:o})]})}function Xe(e){return pr(le(ce(e,A(127.1,311.7))).mul(43758.5453123))}const oe=W(([e])=>Xe(e)),Me=W(([e])=>{const t=Xe(e),r=Xe(e.add(A(17,59.4)));return A(t,r).mul(2).sub(1)}),wn=W(([e])=>{const t=e.floor(),r=e.fract(),n=r.mul(r).mul(re(3).sub(r.mul(2))),a=ce(Me(t.add(A(0,0))),r.sub(A(0,0))),o=ce(Me(t.add(A(1,0))),r.sub(A(1,0))),u=ce(Me(t.add(A(0,1))),r.sub(A(0,1))),s=ce(Me(t.add(A(1,1))),r.sub(A(1,1)));return Y(Y(a,o,n.x),Y(u,s,n.x),n.y)}),Bt=W(([e])=>{let t=re(0),r=re(.5),n=e;for(let a=0;a<4;a+=1)t=t.add(wn(n).mul(r)),n=n.mul(2),r=r.mul(.5);return t}),Se=W(([e,t])=>{const r=e.mul(2).sub(1),n=re(1).add(t.mul(fr(vr(r.yx),A(2))));return r.mul(n).mul(.5).add(.5)}),be=W(([e,t])=>{const r=hr(e.sub(A(.5)));return re(1).sub(de(re(.75),t,r))}),Tn=W(([e,t,r])=>le(e.y.mul(t)).mul(r)),Pe=W(([e,t,r,n])=>{const a=t.mul(n).floor(),o=oe(e.mul(r).add(A(a,a.negate()))),u=oe(e.mul(r.mul(1.7)).add(A(a.mul(-2),a)));return o.mul(.6).add(u.mul(.4))});W(([e,t,r])=>{const n=X(e,t.add(A(r,0))).r,a=X(e,t).g,o=X(e,t.sub(A(r,0))).b;return V(n,a,o)});W(([e])=>ce(e,V(.299,.587,.114)));const Qt=W(([e,t,r])=>{const n=V(le(e.x.mul(900)),le(e.x.mul(900).add(2.1)),le(e.x.mul(900).add(4.2))).mul(.5).add(.5),a=V(le(e.x.mul(1400)).mul(.5).add(.5)),o=dr(t.greaterThanEqual(.5),a,n);return Y(V(1),o,r)}),Mn=W(([e])=>Ce(e,0,1));ee(ge);function Cn(e,t,r){return W(()=>{const n=ie(),a=A(n.x,n.y.oneMinus()),u=n.sub(A(.5)).div(e.zoom).add(A(.5)).add(A(n.y,n.x).mul(6).add(e.time.mul(.4)).sin().mul(.003).mul(e.warp)),s=Se(u,e.curvature),l=A(s.x,s.y.oneMinus()),i=X(t,a).rgb,c=X(r,l).rgb,f=Y(i,c,e.decay),m=n.y.mul(900).sin().mul(.04).mul(e.scanlineStrength);return Y(f.sub(V(m)),V(oe(n.mul(600).add(A(e.time,e.time)))),e.staticAmount).mul(be(n,e.vignette))})}function kn({resolution:e=1024,decay:t=.85,zoom:r=1.01,warp:n=.6,staticAmount:a=.04,scanlineStrength:o=.4,curvature:u=.12,vignette:s=.85,side:l=K}){const{gl:i,scene:c,camera:f}=pe(),m=y.useMemo(()=>new _e(e,e,{depthBuffer:!0}),[e]),h=y.useMemo(()=>new _e(e,e,{depthBuffer:!0}),[e]),v=y.useMemo(()=>new _e(e,e,{depthBuffer:!0}),[e]),d=y.useRef(!1),p=y.useRef(!1),x=y.useMemo(()=>({time:M(0),decay:M(t),zoom:M(r),warp:M(n),staticAmount:M(a),scanlineStrength:M(o),curvature:M(u),vignette:M(s)}),[u,t,o,a,s,n,r]),S=y.useMemo(()=>new ur(h.texture),[h.texture]);y.useEffect(()=>()=>{m.dispose(),h.dispose(),v.dispose()},[h,v,m]),y.useEffect(()=>{x.decay.value=t,x.zoom.value=r,x.warp.value=n,x.staticAmount.value=a,x.scanlineStrength.value=o,x.curvature.value=u,x.vignette.value=s},[u,t,o,a,x,s,n,r]);const R=y.useMemo(()=>{const w=new fe({side:l,toneMapped:!1});return w.colorNode=Cn(x,m.texture,S)(),w},[S,m.texture,l,x]);return y.useEffect(()=>()=>{R.dispose()},[R]),G(({clock:w})=>{x.time.value=w.getElapsedTime();const T=i.getRenderTarget?.()||null,k=[];c.traverse(g=>{const b=g;if(!b?.isMesh||b.visible===!1)return;const E=b.material;(Array.isArray(E)?E.includes(R):E===R)&&(k.push(b),b.visible=!1)});try{i.setRenderTarget(m),i.clear(),i.render(c,f);for(let E=0;E<k.length;E+=1)k[E].visible=!0;const g=d.current?h:v,b=d.current?v:h;S.value=p.current?g.texture:m.texture,i.setRenderTarget(b),i.clear(),i.render(c,f),p.current=!0,S.value=b.texture}finally{for(let g=0;g<k.length;g+=1)k[g].visible=!0;d.current=!d.current,i.setRenderTarget(T)}}),C.jsx("primitive",{object:R,attach:"material"})}function Rn({onCamera:e}){const{camera:t}=pe();return y.useEffect(()=>{e(t)},[t,e]),null}function En(e,t){return W(()=>{const r=Se(ie(),e.curvature),n=A(r.x,re(1).sub(r.y)),a=r.x.step(0).mul(r.x.oneMinus().step(0)).mul(r.y.step(0)).mul(r.y.oneMinus().step(0)),o=e.time.mul(.6).add(r.y.mul(4)).sin().mul(.002).mul(e.chromaDrift),u=X(t,n.add(A(o,0))).r,s=X(t,n).g,l=X(t,n.sub(A(o,0))).b,i=V(u,s,l),c=Pe(r,e.time,e.staticScale,e.staticSpeed),f=r.y.mul(900).sin().mul(.04).mul(e.scanlineStrength),m=Y(i,V(c),e.staticAmount).sub(V(f)),h=m.dot(V(.299,.587,.114)),v=de(.6,1,h).mul(e.bloom);return m.add(m.mul(v)).mul(be(r,e.vignette)).mul(a)})}function Fn({scene:e,resolution:t=1024,staticAmount:r=.12,staticScale:n=600,staticSpeed:a=6,scanlineStrength:o=.4,curvature:u=.12,vignette:s=.85,chromaDrift:l=.25,bloom:i=.25,side:c=K}){const{camera:f}=pe(),m=y.useMemo(()=>new Pt,[]),[h,v]=y.useState(null),d=y.useMemo(()=>Ot(C.jsxs(C.Fragment,{children:[C.jsx(Rn,{onCamera:v}),e]}),m),[m,e]),p=h||f,x=y.useMemo(()=>gr(m,p),[p,m]),S=y.useMemo(()=>({time:M(0),staticAmount:M(r),staticScale:M(n),staticSpeed:M(a),scanlineStrength:M(o),curvature:M(u),vignette:M(s),chromaDrift:M(l),bloom:M(i)}),[]);y.useEffect(()=>{S.staticAmount.value=r,S.staticScale.value=n,S.staticSpeed.value=a,S.scanlineStrength.value=o,S.curvature.value=u,S.vignette.value=s,S.chromaDrift.value=l,S.bloom.value=i},[i,l,u,o,r,n,a,S,s]);const R=y.useMemo(()=>{const w=new fe({side:c,toneMapped:!1});return w.colorNode=En(S,x.getTextureNode("output"))(),w.userData.resolution=t,w},[t,x,c,S]);return G(({clock:w})=>{S.time.value=w.getElapsedTime()}),y.useEffect(()=>()=>{R.dispose()},[R]),C.jsxs(C.Fragment,{children:[d,C.jsx("primitive",{object:R,attach:"material"})]})}ee(ge);function Bn(e,t){return W(()=>{const r=Se(ie(),e.curvature),n=r.x.step(0).mul(r.x.oneMinus().step(0)).mul(r.y.step(0)).mul(r.y.oneMinus().step(0)),a=X(t,r),o=Pe(r,e.time,e.staticScale,e.staticSpeed);return a.rgb.mul(Qt(r,e.maskMode,e.maskStrength)).add(V(o).mul(e.staticAmount.mul(.45))).sub(V(oe(r.mul(600).add(e.time.mul(60)))).mul(e.colorBleed.mul(.15))).mul(be(r,e.vignette)).mul(n)})}function jt({src:e=At("ren_and_stimpy.mp4"),useWebcam:t=!1,staticAmount:r=.35,staticScale:n=700,staticSpeed:a=9,scanlineStrength:o=.55,colorBleed:u=.14,curvature:s=.12,vignette:l=.75,maskStrength:i=.35,maskMode:c=0,side:f=K,...m}){const{padX:h=.06,padY:v=.08,snap:d=24,glitchRate:p=.18,flybackStrength:x=.35,convergenceDrift:S=.4,bloomStrength:R=.25,breathStrength:w=.35,retraceStrength:T=.35,beamWidth:k=.5,chromaDrift:g=.3,humStrength:b=.25,barrelConvergence:E=.6,spotNoise:B=.35,thermalDrift:D=.15}=m,j=y.useRef(null),[z,P]=y.useState(()=>new ze),O=y.useMemo(()=>({time:M(0),staticAmount:M(r),staticScale:M(n),staticSpeed:M(a),scanlineStrength:M(o),colorBleed:M(u),curvature:M(s),vignette:M(l),maskStrength:M(i),maskMode:M(c)}),[]);y.useEffect(()=>{const F=document.createElement("video");F.crossOrigin="anonymous",F.loop=!0,F.muted=!0,F.playsInline=!0,F.autoplay=!0,j.current=F;let _=null,Z=!1;async function Oe(){const q=new _t(F);if(q.colorSpace=Ze,q.minFilter=Q,q.magFilter=Q,P(q),t)try{if(_=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!1}),Z){_.getTracks().forEach(Qe=>Qe.stop());return}F.srcObject=_}catch{}F.src=e,await F.play()}return Oe(),()=>{Z=!0,P(q=>(q?.dispose?.(),new ze)),_&&_.getTracks().forEach(q=>q.stop()),F.pause(),F.remove(),j.current=null}},[e,t]),y.useEffect(()=>{O.staticAmount.value=r,O.staticScale.value=n,O.staticSpeed.value=a,O.scanlineStrength.value=o,O.colorBleed.value=u,O.curvature.value=s,O.vignette.value=l,O.maskStrength.value=i,O.maskMode.value=c},[u,s,c,i,o,r,n,a,O,l]);const U=y.useMemo(()=>{const F=new fe({side:f,toneMapped:!1});return F.colorNode=Bn(O,z)(),F},[f,z,O]);return y.useEffect(()=>{U.userData.legacyProps={padX:h,padY:v,snap:d,glitchRate:p,flybackStrength:x,convergenceDrift:S,bloomStrength:R,breathStrength:w,retraceStrength:T,beamWidth:k,chromaDrift:g,humStrength:b,barrelConvergence:E,spotNoise:B,thermalDrift:D}},[E,k,R,w,g,S,x,p,b,U,h,v,T,d,B,D]),G(({clock:F})=>{O.time.value=F.getElapsedTime()}),C.jsx("primitive",{object:U,attach:"material"})}ee(ge);function jn(e,t){return W(()=>{const r=Se(ie(),e.curvature),n=J(0,r.x).mul(J(r.x,1)).mul(J(0,r.y)).mul(J(r.y,1)),a=Pe(r,e.time,e.staticScale,e.staticSpeed),o=e.time.mul(.6).sin().mul(.002).mul(e.convergenceDrift),u=X(t,r.add(A(o,0))).rgb,s=X(t,r).rgb,l=X(t,r.sub(A(o,0))).rgb,i=V(u.r,s.g,l.b).mul(Qt(r,e.maskMode,e.maskStrength)),c=Tn(r,900,e.scanlineStrength),f=J(re(1).sub(e.glitchRate),oe(A(e.time.mul(10).floor(),0))),m=i.sub(c).add(V(oe(r.mul(60).add(e.time.mul(.4)))).mul(.02));return Y(m.mul(be(r,e.vignette)),V(a),f.mul(e.staticAmount)).mul(n)})}function Pn(){const e=document.createElement("canvas");e.width=1024,e.height=512;const t=e.getContext("2d");if(!t)return null;const r=(a,o,u)=>{const s=e.width,l=e.height;u.forEach((i,c)=>{const f=Math.floor(c/u.length*s),m=Math.floor((c+1)/u.length*s);t.fillStyle=i,t.fillRect(f,Math.floor(a*l),m-f,Math.floor((o-a)*l))})};r(0,.62,["#ffffff","#ffff00","#00ffff","#00ff00","#ff00ff","#ff0000","#0000ff"]),r(.62,.7,["#0000ff","#000000","#ff00ff","#000000","#00ffff","#000000","#666666"]),r(.7,1,["#000066","#ffffff","#1a1a1a","#000000","#666666","#000000"]);const n=new Ke(e);return n.minFilter=Q,n.magFilter=Q,n.wrapS=me,n.wrapT=me,n.colorSpace=Ze,n}function On({staticAmount:e=.35,staticScale:t=700,staticSpeed:r=9,snap:n=24,glitchRate:a=.18,scanlineStrength:o=.55,colorBleed:u=.14,curvature:s=.12,vignette:l=.75,maskStrength:i=.35,flybackStrength:c=.35,convergenceDrift:f=.4,bloomStrength:m=.25,breathStrength:h=.35,retraceStrength:v=.35,beamWidth:d=.5,chromaDrift:p=.3,humStrength:x=.25,barrelConvergence:S=.6,spotNoise:R=.35,thermalDrift:w=.15,maskMode:T=0,side:k=K}){const g=y.useRef(null);g.current||(g.current=Pn());const b=y.useMemo(()=>({time:M(0),staticAmount:M(e),staticScale:M(t),staticSpeed:M(r),snap:M(n),glitchRate:M(a),scanlineStrength:M(o),colorBleed:M(u),curvature:M(s),vignette:M(l),maskStrength:M(i),flybackStrength:M(c),convergenceDrift:M(f),bloomStrength:M(m),breathStrength:M(h),retraceStrength:M(v),beamWidth:M(d),chromaDrift:M(p),humStrength:M(x),thermalDrift:M(w),spotNoise:M(R),maskMode:M(T),barrelConvergence:M(S)}),[]);y.useEffect(()=>{b.staticAmount.value=e,b.staticScale.value=t,b.staticSpeed.value=r,b.snap.value=n,b.glitchRate.value=a,b.scanlineStrength.value=o,b.colorBleed.value=u,b.curvature.value=s,b.vignette.value=l,b.maskStrength.value=i,b.flybackStrength.value=c,b.convergenceDrift.value=f,b.bloomStrength.value=m,b.breathStrength.value=h,b.retraceStrength.value=v,b.beamWidth.value=d,b.chromaDrift.value=p,b.humStrength.value=x,b.thermalDrift.value=w,b.spotNoise.value=R,b.maskMode.value=T,b.barrelConvergence.value=S},[S,d,m,h,p,u,f,s,c,a,x,T,i,v,o,n,R,e,t,r,w,b,l]);const E=y.useMemo(()=>{const B=new fe({side:k,toneMapped:!1});return B.colorNode=jn(b,g.current)(),B},[k,b]);return y.useEffect(()=>()=>{g.current?.dispose?.()},[]),G(({clock:B})=>{b.time.value=B.getElapsedTime()}),C.jsx("primitive",{object:E,attach:"material"})}ee(ge);function An(e){return W(()=>{const t=Se(ie(),e.curvature),r=J(0,t.x).mul(J(t.x,1)).mul(J(0,t.y)).mul(J(t.y,1)),n=e.time.mul(e.snowSpeed).mul(e.snap).floor().div(e.snap),a=t.mul(e.snowSize).floor().div(e.snowSize),o=Bt(a.mul(e.snowScale).add(A(n.mul(1.2),n.mul(-.7)))).mul(.5).add(.5),u=Pe(t,e.time,e.bandScale,e.bandSpeed),s=Bt(A(t.y.mul(e.rfScale),e.time.mul(e.rfSpeed))).abs(),l=Mn(o.add(u.mul(e.bandStrength)).add(s.mul(e.rfStrength)).add(oe(t.mul(500).add(e.time.mul(60))).mul(.1))),i=V(l).mul(be(t,e.vignette));return Y(V(0),i,e.snowAmount).mul(r)})}function _n({snowAmount:e=1,snowScale:t=180,snowSpeed:r=1,snowSize:n=240,curvature:a=.12,vignette:o=.75,bandStrength:u=.35,bandSpeed:s=.6,bandScale:l=8,snap:i=24,rfStrength:c=.25,rfScale:f=22,rfSpeed:m=.4,side:h=K}){const v=y.useMemo(()=>({time:M(0),snowAmount:M(e),snowScale:M(t),snowSpeed:M(r),snowSize:M(n),snap:M(i),bandStrength:M(u),bandSpeed:M(s),bandScale:M(l),rfStrength:M(c),rfScale:M(f),rfSpeed:M(m),curvature:M(a),vignette:M(o)}),[]);y.useEffect(()=>{v.snowAmount.value=e,v.snowScale.value=t,v.snowSpeed.value=r,v.snowSize.value=n,v.snap.value=i,v.bandStrength.value=u,v.bandSpeed.value=s,v.bandScale.value=l,v.rfStrength.value=c,v.rfScale.value=f,v.rfSpeed.value=m,v.curvature.value=a,v.vignette.value=o},[l,s,u,a,f,m,c,e,t,n,r,i,v,o]);const d=y.useMemo(()=>{const p=new fe({side:h,toneMapped:!1});return p.colorNode=An(v)(),p},[h,v]);return G(({clock:p})=>{v.time.value=p.getElapsedTime()}),C.jsx("primitive",{object:d,attach:"material"})}function Dn({count:e=4,radius:t=2,speed:r=.25}){const n=y.useRef(),a=Math.PI*2/e;return G((o,u)=>{n.current.rotation.y+=u*r}),C.jsx("group",{ref:n,children:Array.from({length:e}).map((o,u)=>{const s=u*a,l=Math.sin(s)*t,i=Math.cos(s)*t;return C.jsx(Sr,{position:[l,0,i],rotation:[0,s,0]},u)})})}function er(){return C.jsxs(y.Suspense,{fallback:C.jsx(sr,{}),children:[C.jsx(br,{makeDefault:!0,position:[0,0,3]}),C.jsx("color",{attach:"background",args:["#646464"]}),C.jsx("ambientLight",{intensity:.3}),C.jsx("directionalLight",{position:[5,6,4],intensity:1.2}),C.jsx(Dn,{count:6,radius:1.2,speed:.6}),C.jsx(xr,{scale:1.5,position:[0,.05,0],rotation:[0,0,0]})]})}const Ge=["Arial Black","Arial","Verdana","Tahoma","Trebuchet MS","Impact","Courier New","Lucida Console","Monaco","Consolas","Menlo","Orbitron","VT323","Press Start 2P","monospace","sans-serif","serif","terminal"];function Un(){const e=te("CRT SMPTE RP-219",{staticAmount:{value:.35,min:0,max:1,step:.01},staticScale:{value:700,min:50,max:1400,step:1},staticSpeed:{value:9,min:.1,max:20,step:.1},snap:{value:24,min:1,max:60,step:1},glitchRate:{value:.18,min:0,max:1,step:.01},scanlineStrength:{value:.55,min:0,max:1,step:.01},colorBleed:{value:.14,min:0,max:.5,step:.01},curvature:{value:.12,min:0,max:.4,step:.01},vignette:{value:.75,min:.6,max:.98,step:.01},maskStrength:{value:.35,min:0,max:1,step:.01},flybackStrength:{value:.35,min:0,max:1,step:.01},convergenceDrift:{value:.4,min:0,max:1,step:.01},bloomStrength:{value:.25,min:0,max:1,step:.01},breathStrength:{value:.35,min:0,max:1,step:.01},retraceStrength:{value:.35,min:0,max:1,step:.01},beamWidth:{value:.5,min:0,max:1,step:.01},chromaDrift:{value:.3,min:0,max:1,step:.01},humStrength:{value:.25,min:0,max:1,step:.01},barrelConvergence:{value:.6,min:0,max:2,step:.01},spotNoise:{value:.35,min:0,max:1,step:.01},thermalDrift:{value:.15,min:0,max:1,step:.01},maskMode:{value:0,options:{shadow:0,grille:1}}},{collapsed:!0}),t=te("CRT Static",{snowAmount:{value:1,min:0,max:1},snowScale:{value:180,min:10,max:800},snowSpeed:{value:1,min:0,max:5},snowSize:{value:240,min:40,max:1e3},curvature:{value:.12,min:0,max:.4,step:.01},vignette:{value:.75,min:.6,max:.98,step:.01},bandStrength:{value:.35,min:0,max:1},bandSpeed:{value:.6,min:0,max:3},bandScale:{value:8,min:1,max:40},snap:{value:24,min:1,max:60,step:1},rfStrength:{value:.25,min:0,max:1},rfScale:{value:22,min:2,max:80},rfSpeed:{value:.4,min:0,max:3}},{collapsed:!0}),r=te("No Signal",{Text:N({screenText:{value:`12:00 FEB. 28, 1986\r
INSERT VHS`,rows:!0},fontSize:{value:28,min:0,max:48,step:1},fontName:{value:"Press Start 2P",options:Ge},fontColor:{value:"#FFFFFF"},showCaret:{value:!1},caretMode:{value:"block",options:["block","underscore","line"]},caretBlinkRate:{value:2,min:.2,max:5,step:.1},horizontalPadding:{value:100,min:0,max:1e3,step:1},verticalPadding:{value:95,min:0,max:1e3,step:1}},{collapsed:!0}),Look:N({screenColor:{value:"#0b2fd8"},glowStrength:{value:.35,min:0,max:1,step:.01},curvature:{value:.06,min:0,max:.2,step:.001},vignette:{value:1.15,min:.5,max:2,step:.01}},{collapsed:!0}),Noise:N({noiseStrength:{value:.08,min:0,max:.4,step:.001},scanlineStrength:{value:.08,min:0,max:.3,step:.001},scanlineDensity:{value:900,min:200,max:2e3,step:10}},{collapsed:!0}),Roll:N({rollSpeed:{value:.4,min:0,max:2,step:.01},rollStrength:{value:0,min:0,max:2,step:.01}},{collapsed:!0}),Chroma:N({chromaOffset:{value:.0025,min:0,max:.01,step:1e-4}},{collapsed:!0})},{collapsed:!0}),n=te("Terminal",{Text:N({screenText:{value:`a:\\> ||TERMINAL ERROR||\r
      - 0X666420 -\r
      DATA CORRUPTED\r
a:\\> FULL SYSTEM FAILURE
a:\\> INSERT BOOT DISK`,rows:!0},fontSize:{value:26,min:0,max:48,step:1},fontName:{value:"Press Start 2P",options:Ge},fontColor:{value:"#48ff00"},showCaret:{value:!0},caretMode:{value:"block",options:["block","underscore","line"]},caretBlinkRate:{value:2,min:.2,max:5,step:.1},horizontalPadding:{value:100,min:0,max:1e3,step:1},verticalPadding:{value:95,min:0,max:1e3,step:1}},{collapsed:!0}),Look:N({screenColor:{value:"#000000"},glowStrength:{value:.35,min:0,max:1,step:.01},curvature:{value:.06,min:0,max:.2,step:.001},vignette:{value:1.15,min:.5,max:2,step:.01}},{collapsed:!0}),Noise:N({noiseStrength:{value:.08,min:0,max:.4,step:.001},scanlineStrength:{value:.08,min:0,max:.3,step:.001},scanlineDensity:{value:900,min:200,max:2e3,step:10}},{collapsed:!0}),Roll:N({rollSpeed:{value:.4,min:0,max:2,step:.01},rollStrength:{value:0,min:0,max:2,step:.01}},{collapsed:!0}),Chroma:N({chromaOffset:{value:.0025,min:0,max:.01,step:1e-4}},{collapsed:!0})},{collapsed:!0}),a=te("Ascii",{Text:N({screenText:{value:Tr,rows:!0},fontSize:{value:6,min:0,max:48,step:1},fontName:{value:"Press Start 2P",options:Ge},fontColor:{value:"#ff0000"},showCaret:{value:!1},caretMode:{value:"block",options:["block","underscore","line"]},caretBlinkRate:{value:2,min:.2,max:5,step:.1},horizontalPadding:{value:208,min:0,max:1e3,step:1},verticalPadding:{value:0,min:0,max:1e3,step:1}},{collapsed:!0}),Look:N({screenColor:{value:"#000000"},glowStrength:{value:.35,min:0,max:1,step:.01},curvature:{value:.06,min:0,max:.2,step:.001},vignette:{value:1.15,min:.5,max:2,step:.01}},{collapsed:!0}),Noise:N({noiseStrength:{value:.08,min:0,max:.4,step:.001},scanlineStrength:{value:.08,min:0,max:.3,step:.001},scanlineDensity:{value:900,min:200,max:2e3,step:10}},{collapsed:!0}),Roll:N({rollSpeed:{value:.4,min:0,max:2,step:.01},rollStrength:{value:0,min:0,max:2,step:.01}},{collapsed:!0}),Chroma:N({chromaOffset:{value:.0025,min:0,max:.01,step:1e-4}},{collapsed:!0})},{collapsed:!0}),o=te("HomeVideo",{padX:{value:.06,min:0,max:.25,step:.001},padY:{value:.08,min:0,max:.25,step:.001},curvature:{value:.12,min:0,max:.4,step:.001},vignette:{value:.75,min:.3,max:1.2,step:.001},staticAmount:{value:.35,min:0,max:1,step:.001},staticScale:{value:700,min:50,max:2e3,step:1},staticSpeed:{value:9,min:0,max:30,step:.01},snap:{value:24,min:1,max:60,step:1},spotNoise:{value:.35,min:0,max:1,step:.001},thermalDrift:{value:.15,min:0,max:1,step:.001},glitchRate:{value:.18,min:0,max:1,step:.001},flybackStrength:{value:.35,min:0,max:1,step:.001},retraceStrength:{value:.35,min:0,max:1,step:.001},humStrength:{value:.25,min:0,max:1,step:.001},breathStrength:{value:.35,min:0,max:1,step:.001},scanlineStrength:{value:.55,min:0,max:1,step:.001},beamWidth:{value:.5,min:0,max:1,step:.001},bloomStrength:{value:.25,min:0,max:1,step:.001},colorBleed:{value:.14,min:0,max:.5,step:.001},chromaDrift:{value:.3,min:0,max:1,step:.001},convergenceDrift:{value:.4,min:0,max:1,step:.001},barrelConvergence:{value:.6,min:0,max:2,step:.001},maskStrength:{value:.35,min:0,max:1,step:.001},maskMode:{value:0,options:{Triad:0,Aperture:1}}},{collapsed:!0}),u=te("TV",{padX:{value:.06,min:0,max:.25,step:.001},padY:{value:.08,min:0,max:.25,step:.001},curvature:{value:.12,min:0,max:.4,step:.001},vignette:{value:.75,min:.3,max:1.2,step:.001},staticAmount:{value:.35,min:0,max:1,step:.001},staticScale:{value:700,min:50,max:2e3,step:1},staticSpeed:{value:9,min:0,max:30,step:.01},snap:{value:24,min:1,max:60,step:1},spotNoise:{value:.35,min:0,max:1,step:.001},thermalDrift:{value:.15,min:0,max:1,step:.001},glitchRate:{value:.18,min:0,max:1,step:.001},flybackStrength:{value:.35,min:0,max:1,step:.001},retraceStrength:{value:.35,min:0,max:1,step:.001},humStrength:{value:.25,min:0,max:1,step:.001},breathStrength:{value:.35,min:0,max:1,step:.001},scanlineStrength:{value:.55,min:0,max:1,step:.001},beamWidth:{value:.5,min:0,max:1,step:.001},bloomStrength:{value:.25,min:0,max:1,step:.001},colorBleed:{value:.14,min:0,max:.5,step:.001},chromaDrift:{value:.3,min:0,max:1,step:.001},convergenceDrift:{value:.4,min:0,max:1,step:.001},barrelConvergence:{value:.6,min:0,max:2,step:.001},maskStrength:{value:.35,min:0,max:1,step:.001},maskMode:{value:0,options:{Triad:0,Aperture:1}}},{collapsed:!0}),s=te("Scene In Scene",{Render:N({resolution:{value:1024,min:256,max:2048,step:256}},{collapsed:!0}),Static:N({staticAmount:{value:.12,min:0,max:.5,step:.001},staticScale:{value:600,min:50,max:2e3,step:10},staticSpeed:{value:6,min:0,max:20,step:.1}},{collapsed:!0}),CRT:N({scanlineStrength:{value:.4,min:0,max:1,step:.01},curvature:{value:.12,min:0,max:.4,step:.005},vignette:{value:.85,min:.4,max:1.2,step:.005},chromaDrift:{value:.25,min:0,max:1,step:.005}},{collapsed:!0}),Post:N({bloom:{value:.25,min:0,max:2,step:.01}},{collapsed:!0})},{collapsed:!0}),l=te("Picture In Picture",{Render:N({resolution:{value:1024,min:256,max:2048,step:256}},{collapsed:!0}),Feedback:N({decay:{value:.85,min:.7,max:.97,step:.001},zoom:{value:1.01,min:1,max:1.05,step:5e-4},warp:{value:.6,min:0,max:2,step:.01}},{collapsed:!0}),CRT:N({staticAmount:{value:.04,min:0,max:.25,step:.001},scanlineStrength:{value:.4,min:0,max:1,step:.01},curvature:{value:.12,min:0,max:.4,step:.005},vignette:{value:.85,min:.4,max:1.2,step:.005}},{collapsed:!0})},{collapsed:!0});return{smtpe:e,tvStatic:t,noSignal:r,terminal:n,ascii:a,homeVideo:o,tv:u,threeD:s,pip:l}}function L(e){switch(e){case"static":case"smtpe":return{type:"file",url:De("tv-static.mp3"),loop:!0};case"homeVideo":return{type:"file",url:De("laugh-track.mp3"),loop:!0};case"tv":return{type:"file",url:De("ren-and-stimpy.mp3"),loop:!0};case"threeD":return{type:"strudel",code:et.threeD};case"pip":return{type:"strudel",code:et.weirderStuff};default:return null}}function Nn(){return{key:"off",video:C.jsx("meshStandardMaterial",{color:"#111111",roughness:0,metalness:1},"off"),audio:null}}function qn(){return Un()}function Jn(e){return y.useMemo(()=>[Nn(),...e],[e])}function Qn(e){const{ascii:t,homeVideo:r,noSignal:n,pip:a,smtpe:o,terminal:u,threeD:s,tv:l,tvStatic:i}=e;return y.useMemo(()=>[{key:"static",video:C.jsx(mr,{...i},"static"),audio:L("static")},{key:"smtpe",video:C.jsx(Lr,{...o},"smtpe"),audio:L("smtpe")},{key:"vhs",video:C.jsx(Ie,{...Ut,...n,horizontalPadding:100,verticalPadding:95},"vhs"),audio:L("vhs")},{key:"terminal",video:C.jsx(Ie,{...Nt,...u,horizontalPadding:100,verticalPadding:95},"terminal"),audio:L("terminal")},{key:"ascii",video:C.jsx(Ie,{...t},"ascii"),audio:L("ascii")},{key:"homeVideo",video:C.jsx(at,{useWebcam:!0,...r},"homeVideo"),audio:L("homeVideo")},{key:"tv",video:C.jsx(at,{...l},"tv"),audio:L("tv")},{key:"threeD",video:C.jsx(Dr,{scene:C.jsx(er,{}),...s},"threeD"),audio:L("threeD")},{key:"pip",video:C.jsx(Pr,{...a},"pip"),audio:L("pip")}],[t,r,n,a,o,u,s,l,i])}function ea(e){const{ascii:t,homeVideo:r,noSignal:n,pip:a,smtpe:o,terminal:u,threeD:s,tv:l,tvStatic:i}=e;return y.useMemo(()=>[{key:"static",video:C.jsx(_n,{...i},"static"),audio:L("static")},{key:"smtpe",video:C.jsx(On,{...o},"smtpe"),audio:L("smtpe")},{key:"vhs",video:C.jsx(We,{...Ut,...n,horizontalPadding:100,verticalPadding:95},"vhs"),audio:L("vhs")},{key:"terminal",video:C.jsx(We,{...Nt,...u,horizontalPadding:100,verticalPadding:95},"terminal"),audio:L("terminal")},{key:"ascii",video:C.jsx(We,{...t},"ascii"),audio:L("ascii")},{key:"homeVideo",video:C.jsx(jt,{useWebcam:!0,...r},"homeVideo"),audio:L("homeVideo")},{key:"tv",video:C.jsx(jt,{...l},"tv"),audio:L("tv")},{key:"threeD",video:C.jsx(Fn,{scene:C.jsx(er,{}),...s},"threeD"),audio:L("threeD")},{key:"pip",video:C.jsx(kn,{...a},"pip"),audio:L("pip")}],[t,r,n,a,o,u,s,l,i])}export{Kn as C,Qn as a,Jn as b,Zn as c,ea as d,qn as u};
