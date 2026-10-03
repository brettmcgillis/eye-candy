import{r as w,d as se,U as Ct,n as Ht,aT as Mt,a as W,j as C,F as Y,aP as We,a1 as Q,ap as ae,C as xe,e as Z,W as ke,b4 as $t,b5 as Yt,as as kt,d4 as Kt,o as Xt,$ as Jt,a0 as L,ab as Zt,aC as qt,an as Qt,d5 as re,L as le,Y as Te,I as Re,aq as er,a9 as K,aJ as O,cp as Fe}from"./index-DdjF1jp2.js";import{s as ce}from"./shaderMaterial-CPU9E2po.js";import{_ as tr}from"./extends-CF3RwP-h.js";import{u as rr}from"./Fbo-DAq2qKtT.js";import{o as nr,s as He}from"./openWebcam-DlS3rqvp.js";import{C as ar}from"./crtStaticMaterial-S2MXNwne.js";import{u as M,E as J,J as oe,$ as ie,B as $e,a6 as Ye,W as Be,K as q,af as Ee,e as je,c as de,m as X,a4 as fe,ab as Ke,F as me,k as I,f as Ve,C as $,j as H,a as or}from"./three.tsl-CRkVmweJ.js";import{c as Ce,h as Se,v as Me,s as Le,m as ir,a as ur,f as Xe,b as sr,C as Je}from"./crtShowMaterial-D9JULHWy.js";import{S as Ze}from"./tracks-DQtmcKVK.js";import{B as lr}from"./Bret-BRBCp5xT.js";import{I as cr}from"./Reversal-ZNr333nd.js";import{P as mr}from"./PerspectiveCamera-DaTJcTry.js";import{w as fr}from"./webcamFacingControl-Db7XAo9R.js";const vr=w.forwardRef(({children:e,compute:t,width:r,height:n,samples:a=8,renderPriority:o=0,eventPriority:u=0,frames:s=1/0,stencilBuffer:l=!1,depthBuffer:i=!0,generateMipmaps:c=!1,...f},m)=>{const{size:h,viewport:v}=se(),d=rr((r||h.width)*v.dpr,(n||h.height)*v.dpr,{samples:a,stencilBuffer:l,depthBuffer:i,generateMipmaps:c}),[p]=w.useState(()=>new Ct),x=w.useCallback((S,R,y)=>{var T,k;let g=(T=d.texture)==null||(T=T.__r3f.parent)==null?void 0:T.object;for(;g&&!(g instanceof Ht);){var b;g=(b=g.__r3f.parent)==null?void 0:b.object}if(!g)return!1;y.raycaster.camera||y.events.compute(S,y,(k=y.previousRoot)==null?void 0:k.getState());const[F]=y.raycaster.intersectObject(g);if(!F)return!1;const E=F.uv;if(!E)return!1;R.raycaster.setFromCamera(R.pointer.set(E.x*2-1,E.y*2-1),R.camera)},[]);return w.useImperativeHandle(m,()=>d.texture,[d]),w.createElement(w.Fragment,null,Mt(w.createElement(hr,{renderPriority:o,frames:s,fbo:d},e,w.createElement("group",{onPointerOver:()=>null})),p,{events:{compute:t||x,priority:u}}),w.createElement("primitive",tr({object:d.texture},f)))});function hr({frames:e,renderPriority:t,children:r,fbo:n}){let a=0,o,u,s,l;return W(i=>{(e===1/0||a<e)&&(o=i.gl.autoClear,u=i.gl.xr.enabled,s=i.gl.getRenderTarget(),l=i.gl.xr.isPresenting,i.gl.autoClear=!0,i.gl.xr.enabled=!1,i.gl.xr.isPresenting=!1,i.gl.setRenderTarget(n),i.gl.render(i.scene,i.camera),i.gl.setRenderTarget(s),i.gl.autoClear=o,i.gl.xr.enabled=u,i.gl.xr.isPresenting=l,a++)},t),w.createElement(w.Fragment,null,r)}function Wn({color:e="#111111",metalness:t=.2,position:r=[0,-.02,0],roughness:n=.92,rotation:a=[-Math.PI/2,0,0],size:o=30}){return C.jsxs("mesh",{position:r,rotation:a,receiveShadow:!0,children:[C.jsx("planeGeometry",{args:[o,o]}),C.jsx("meshStandardMaterial",{color:e,metalness:t,roughness:n})]})}function Vn({boardColor:e="#7a5337",boardMetalness:t=.03,boardRoughness:r=.92,panels:n,columns:a=3,panelHeight:o=2,panelWidth:u=2,spacingX:s=3.3,spacingZ:l=2.8}){const i=Math.ceil(n.length/a),c=(a-1)/2,f=(i-1)/2;return C.jsx("group",{children:n.map((m,h)=>{const v=h%a,d=Math.floor(h/a),p=(v-c)*s,x=(d-f)*l,S=(v-c)*.025;return C.jsxs("group",{position:[p,.08,x],rotation:[-Math.PI/2,0,S],children:[C.jsxs("mesh",{castShadow:!0,receiveShadow:!0,children:[C.jsx("boxGeometry",{args:[u+.48,o+.48,.16]}),C.jsx("meshStandardMaterial",{color:e,metalness:t,roughness:r})]}),C.jsxs("mesh",{position:[0,0,.081],children:[C.jsx("planeGeometry",{args:[u,o]}),m.video]})]},m.key)})})}const dr=`
                                                                                                    
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
                                                                                                    
`,pr=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,gr=`
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
`,Rt=ce({uTime:0,uTextTexture:null,uScreenColor:new xe(.05,.18,.85),uNoiseStrength:.08,uGlowStrength:.35,uCurvature:.06,uVignette:.85,uScanlineStrength:.08,uScanlineDensity:900,uRollSpeed:.4,uRollStrength:.4,uChromaOffset:.0025},pr,gr);Z({CrtBlueScreenMaterial:Rt});function xr(e,t,r,n,a,o){const u=t.split("");let s="";const l=[];return u.forEach(i=>{if(i===`
`)l.push(s),s="";else{const c=s+i;e.measureText(c).width>a&&s?(l.push(s),s=i):s=c}}),s&&l.push(s),l.forEach((i,c)=>{e.fillText(i,r,n+c*o)}),{lines:l,y:n+(l.length-1)*o}}function Sr({canvas:e,text:t,font:r,fontSize:n,fontColor:a,showCaret:o,caretMode:u,horizontalPadding:s,verticalPadding:l}){const i=e.getContext("2d");i.clearRect(0,0,e.width,e.height),i.font=r,i.fillStyle=a,i.textBaseline="top";const c=n*1.3,f=e.width-s*2,{lines:m,y:h}=xr(i,t,s,l,f,c);if(o&&m.length){const v=m[m.length-1],d=i.measureText(v),p=s+d.width+4,x=d.actualBoundingBoxAscent+d.actualBoundingBoxDescent||n;u==="underscore"?i.fillRect(p,h+n*1.05,n*.8,3):u==="line"?i.fillRect(p,h+2,Math.max(4,n*.08),x):i.fillRect(p,h+2,n*.6,x)}}function br(){const e=document.createElement("canvas");e.width=1024,e.height=512;const t=new We(e);return t.minFilter=Q,t.magFilter=Q,t.wrapS=ae,t.wrapT=ae,{canvas:e,texture:t}}const Ft={screenText:`12:00 FEB. 28, 1986\r
<< REWIND`,fontSize:28,fontName:"Press Start 2P",fontColor:"#FFFFFF",showCaret:!1,caretMode:"block",caretBlinkRate:2,horizontalPadding:48,verticalPadding:40,screenColor:"#0b2fd8",glowStrength:.35,curvature:.06,vignette:1.15,noiseStrength:.08,scanlineStrength:.08,scanlineDensity:900,rollSpeed:.4,rollStrength:0,chromaOffset:.0025},Bt={screenText:`USERNAME: @ruinedpaintings
PASSWORD: ********`,fontSize:28,fontName:"Press Start 2P",fontColor:"#48ff00",showCaret:!0,caretMode:"block",caretBlinkRate:2,horizontalPadding:48,verticalPadding:40,screenColor:"#000000",glowStrength:.35,curvature:.06,vignette:1.15,noiseStrength:.08,scanlineStrength:.08,scanlineDensity:900,rollSpeed:.4,rollStrength:0,chromaOffset:.0025};function Pe({screenText:e="12:00 FEB. 28, 1986",fontSize:t=28,fontName:r="Press Start 2P",fontColor:n="#FFFFFF",horizontalPadding:a=48,verticalPadding:o=40,showCaret:u=!1,caretMode:s="block",caretBlinkRate:l=2,screenColor:i="#0b2fd8",glowStrength:c=.35,curvature:f=.06,vignette:m=1.15,noiseStrength:h=.08,scanlineStrength:v=.08,scanlineDensity:d=900,rollSpeed:p=.4,rollStrength:x=0,chromaOffset:S=.0025,side:R=Y}){const y=w.useRef(),T=w.useRef(0),k=w.useRef(!0),{canvas:g,texture:b}=w.useMemo(br,[]),F=`${t}px "${r}"`,E=A=>{Sr({canvas:g,text:e,font:F,fontSize:t,fontColor:n,showCaret:u&&A,caretMode:s||"block",horizontalPadding:a,verticalPadding:o}),b.needsUpdate=!0};return w.useEffect(()=>{E(!0)},[e,F,n,a,o,u,s]),W((A,B)=>{y.current&&(y.current.uTime+=B,u&&(T.current+=B,T.current>=1/Math.max(l,.001)&&(T.current=0,k.current=!k.current,E(k.current))))}),C.jsx("crtBlueScreenMaterial",{ref:y,side:R,toneMapped:!1,uTextTexture:b,uScreenColor:i,uNoiseStrength:h,uGlowStrength:c,uCurvature:f,uVignette:m,uScanlineStrength:v,uScanlineDensity:d,uRollSpeed:p,uRollStrength:x,uChromaOffset:S},Rt.key)}const yr=`
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`,wr=`
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
`,Tr=ce({uScene:null,uFeedback:null,uTime:0,uDecay:.85,uZoom:1.01,uWarp:.6,uStaticAmount:.04,uScanlineStrength:.4,uCurvature:.12,uVignette:.85},yr,wr);Z({CrtAccumMaterial:Tr});function Cr({resolution:e=1024,decay:t=.85,zoom:r=1.01,warp:n=.6,staticAmount:a=.04,scanlineStrength:o=.4,curvature:u=.12,vignette:s=.85,side:l=Y}){const i=w.useRef(),{gl:c,scene:f,camera:m}=se(),h=w.useMemo(()=>new ke(e,e),[e]),v=w.useMemo(()=>new ke(e,e),[e]),d=w.useMemo(()=>new ke(e,e),[e]),p=w.useRef(!1);return W((x,S)=>{if(!i.current)return;i.current.uTime+=S;const R=c.getRenderTarget();c.setRenderTarget(h),c.clear(),c.render(f,m);const y=p.current?v:d,T=p.current?d:v;i.current.uScene=h.texture,i.current.uFeedback=y.texture,c.setRenderTarget(T),c.clear(),c.render(f,m),c.setRenderTarget(R),p.current=!p.current,i.current.uFeedback=T.texture}),C.jsx("crtAccumMaterial",{ref:i,side:l,uDecay:t,uZoom:r,uWarp:n,uStaticAmount:a,uScanlineStrength:o,uCurvature:u,uVignette:s,toneMapped:!1})}const Mr=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,kr=`
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
`,Rr=ce({uMap:null,uTime:0,uStaticAmount:.1,uStaticScale:600,uStaticSpeed:6,uScanlineStrength:.4,uCurvature:.12,uVignette:.85,uChromaDrift:.25,uBloom:.25},Mr,kr);Z({CrtSceneShaderMaterial:Rr});function Fr({scene:e,resolution:t=1024,staticAmount:r=.12,staticScale:n=600,staticSpeed:a=6,scanlineStrength:o=.4,curvature:u=.12,vignette:s=.85,chromaDrift:l=.25,bloom:i=.25,side:c=Y}){const f=w.useRef();return W((m,h)=>{f.current&&(f.current.uTime+=h)}),C.jsx("crtSceneShaderMaterial",{ref:f,side:c,uStaticAmount:r,uStaticScale:n,uStaticSpeed:a,uScanlineStrength:o,uCurvature:u,uVignette:s,uChromaDrift:l,uBloom:i,toneMapped:!1,children:C.jsx(vr,{attach:"uMap",frames:1/0,width:t,height:t,anisotropy:8,children:e})})}const Br=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Er=`
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
`,Et=ce({uTime:0,uTexture:null,uStaticAmount:0,uStaticScale:0,uStaticSpeed:0,uSnap:0,uGlitchRate:0,uScanlineStrength:0,uColorBleed:0,uCurvature:0,uVignette:0,uMaskStrength:0,uFlyback:0,uConverge:0,uBloom:0,uBreath:0,uRetrace:0,uBeamWidth:0,uChromaDrift:0,uHum:0,uThermalDrift:0,uSpotNoise:0,uMaskMode:0,uBarrelConverge:0,uPadX:0,uPadY:0},Br,Er);Z({CrtShowMaterial:Et});function qe({src:e=$t("ren_and_stimpy.mp4"),useWebcam:t=!1,webcamFacing:r="front",padX:n=.06,padY:a=.08,staticAmount:o=.35,staticScale:u=700,staticSpeed:s=9,snap:l=24,glitchRate:i=.18,scanlineStrength:c=.55,colorBleed:f=.14,curvature:m=.12,vignette:h=.75,maskStrength:v=.35,flybackStrength:d=.35,convergenceDrift:p=.4,bloomStrength:x=.25,breathStrength:S=.35,retraceStrength:R=.35,beamWidth:y=.5,chromaDrift:T=.3,humStrength:k=.25,barrelConvergence:g=.6,spotNoise:b=.35,thermalDrift:F=.15,maskMode:E=0,side:A=Y}){const B=w.useRef();return w.useEffect(()=>{if(!B.current)return;let G=null,P=!1;const j=document.createElement("video");j.crossOrigin="anonymous",j.loop=!0,j.muted=!0,j.playsInline=!0,j.autoplay=!0;const U=()=>{if(P)return;const V=new Yt(j);V.colorSpace=kt,V.minFilter=Q,V.magFilter=Q,V.generateMipmaps=!1,B.current.uTexture=V},_=async()=>{try{j.src=e,await j.play(),U()}catch(V){console.error("[CRTShowMaterial] Video failed to play:",V)}};return t?(async()=>{try{if(G=await nr({facing:r}),P){He(G);return}j.srcObject=G,await j.play(),U()}catch(V){console.warn("[CRTShowMaterial] Webcam failed, falling back to video:",V),_()}})():_(),()=>{P=!0,He(G),B.current?.uTexture&&B.current.uTexture.dispose(),j.pause(),j.remove()}},[e,t,r]),W((G,P)=>{B.current&&(B.current.uTime+=P)}),C.jsx("crtShowMaterial",{ref:B,side:A,toneMapped:!1,uPadX:n,uPadY:a,uStaticAmount:o,uStaticScale:u,uStaticSpeed:s,uSnap:l,uGlitchRate:i,uScanlineStrength:c,uColorBleed:f,uCurvature:m,uVignette:h,uMaskStrength:v,uFlyback:d,uConverge:p,uBloom:x,uBreath:S,uRetrace:R,uBeamWidth:y,uChromaDrift:T,uHum:k,uThermalDrift:F,uSpotNoise:b,uMaskMode:E,uBarrelConverge:g},Et.key)}const jr=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Pr=`
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
`,jt=ce({uTime:0,uStaticAmount:0,uStaticScale:0,uStaticSpeed:0,uSnap:0,uGlitchRate:0,uScanlineStrength:0,uColorBleed:0,uCurvature:0,uVignette:0,uMaskStrength:0,uFlyback:0,uConverge:0,uBloom:0,uBreath:0,uRetrace:0,uBeamWidth:0,uChromaDrift:0,uHum:0,uThermalDrift:0,uSpotNoise:0,uMaskMode:0,uBarrelConverge:0},jr,Pr);Z({CrtSmtpeStaticMaterial:jt});function Or({staticAmount:e=.35,staticScale:t=700,staticSpeed:r=9,snap:n=24,glitchRate:a=.18,scanlineStrength:o=.55,colorBleed:u=.14,curvature:s=.12,vignette:l=.75,maskStrength:i=.35,flybackStrength:c=.35,convergenceDrift:f=.4,bloomStrength:m=.25,breathStrength:h=.35,retraceStrength:v=.35,beamWidth:d=.5,chromaDrift:p=.3,humStrength:x=.25,barrelConvergence:S=.6,spotNoise:R=.35,thermalDrift:y=.15,maskMode:T=0,side:k=Y}){const g=w.useRef();return W((b,F)=>{g.current&&(g.current.uTime+=F)}),C.jsx("crtSmtpeStaticMaterial",{ref:g,side:k,transparent:!1,depthWrite:!0,toneMapped:!1,uStaticAmount:e,uStaticScale:t,uStaticSpeed:r,uSnap:n,uGlitchRate:a,uScanlineStrength:o,uColorBleed:u,uCurvature:s,uVignette:l,uMaskStrength:i,uFlyback:c,uConverge:f,uBloom:m,uBreath:h,uRetrace:v,uBeamWidth:d,uChromaDrift:p,uHum:x,uThermalDrift:y,uSpotNoise:R,uMaskMode:T,uBarrelConverge:S},jt.key)}class Ar{constructor(t){this.isFont=!0,this.type="Font",this.data=t}generateShapes(t,r=100,n="ltr"){const a=[],o=_r(t,r,this.data,n);for(let u=0,s=o.length;u<s;u++)a.push(...o[u].toShapes());return a}}function _r(e,t,r,n){const a=Array.from(e),o=t/r.resolution,u=(r.boundingBox.yMax-r.boundingBox.yMin+r.underlineThickness)*o,s=[];let l=0,i=0;(n=="rtl"||n=="tb")&&a.reverse();for(let c=0;c<a.length;c++){const f=a[c];if(f===`
`)l=0,i-=u;else{const m=Dr(f,o,l,i,r);n=="tb"?(l=0,i+=r.ascender*o):l+=m.offsetX,s.push(m.path)}}return s}function Dr(e,t,r,n,a){const o=a.glyphs[e]||a.glyphs["?"];if(!o){console.error('THREE.Font: character "'+e+'" does not exists in font family '+a.familyName+".");return}const u=new Kt;let s,l,i,c,f,m,h,v;if(o.o){const d=o._cachedOutline||(o._cachedOutline=o.o.split(" "));for(let p=0,x=d.length;p<x;)switch(d[p++]){case"m":s=d[p++]*t+r,l=d[p++]*t+n,u.moveTo(s,l);break;case"l":s=d[p++]*t+r,l=d[p++]*t+n,u.lineTo(s,l);break;case"q":i=d[p++]*t+r,c=d[p++]*t+n,f=d[p++]*t+r,m=d[p++]*t+n,u.quadraticCurveTo(f,m,i,c);break;case"b":i=d[p++]*t+r,c=d[p++]*t+n,f=d[p++]*t+r,m=d[p++]*t+n,h=d[p++]*t+r,v=d[p++]*t+n,u.bezierCurveTo(f,m,h,v,i,c);break}}return{offsetX:o.ha*t,path:u}}function Qe(e,t,r,n,a,o,u){try{var s=e[o](u),l=s.value}catch(i){return void r(i)}s.done?t(l):Promise.resolve(l).then(n,a)}function Pt(e,t,r){return t=be(t),(function(n,a){if(a&&(typeof a=="object"||typeof a=="function"))return a;if(a!==void 0)throw new TypeError("Derived constructors may only return object or undefined");return(function(o){if(o===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return o})(n)})(e,At()?Reflect.construct(t,[],be(e).constructor):t.apply(e,r))}function Ge(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function ze(e,t,r){return t&&(function(n,a){for(var o=0;o<a.length;o++){var u=a[o];u.enumerable=u.enumerable||!1,u.configurable=!0,"value"in u&&(u.writable=!0),Object.defineProperty(n,_t(u.key),u)}})(e.prototype,t),Object.defineProperty(e,"prototype",{writable:!1}),e}function Ur(e,t,r){return(t=_t(t))in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function be(e){return be=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},be(e)}function Ot(e,t){if(typeof t!="function"&&t!==null)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&Ne(e,t)}function At(){try{var e=!Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){}))}catch{}return(At=function(){return!!e})()}function et(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter(function(a){return Object.getOwnPropertyDescriptor(e,a).enumerable})),r.push.apply(r,n)}return r}function tt(e){for(var t=1;t<arguments.length;t++){var r=arguments[t]!=null?arguments[t]:{};t%2?et(Object(r),!0).forEach(function(n){Ur(e,n,r[n])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):et(Object(r)).forEach(function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(r,n))})}return e}function Ue(){var e,t,r=typeof Symbol=="function"?Symbol:{},n=r.iterator||"@@iterator",a=r.toStringTag||"@@toStringTag";function o(h,v,d,p){var x=v&&v.prototype instanceof s?v:s,S=Object.create(x.prototype);return z(S,"_invoke",(function(R,y,T){var k,g,b,F=0,E=T||[],A=!1,B={p:0,n:0,v:e,a:G,f:G.bind(e,4),d:function(P,j){return k=P,g=0,b=e,B.n=j,u}};function G(P,j){for(g=P,b=j,t=0;!A&&F&&!U&&t<E.length;t++){var U,_=E[t],te=B.p,V=_[2];P>3?(U=V===j)&&(b=_[(g=_[4])?5:(g=3,3)],_[4]=_[5]=e):_[0]<=te&&((U=P<2&&te<_[1])?(g=0,B.v=j,B.n=_[1]):te<V&&(U=P<3||_[0]>j||j>V)&&(_[4]=P,_[5]=j,B.n=V,g=0))}if(U||P>1)return u;throw A=!0,j}return function(P,j,U){if(F>1)throw TypeError("Generator is already running");for(A&&j===1&&G(j,U),g=j,b=U;(t=g<2?e:b)||!A;){k||(g?g<3?(g>1&&(B.n=-1),G(g,b)):B.n=b:B.v=b);try{if(F=2,k){if(g||(P="next"),t=k[P]){if(!(t=t.call(k,b)))throw TypeError("iterator result is not an object");if(!t.done)return t;b=t.value,g<2&&(g=0)}else g===1&&(t=k.return)&&t.call(k),g<2&&(b=TypeError("The iterator does not provide a '"+P+"' method"),g=1);k=e}else if((t=(A=B.n<0)?b:R.call(y,B))!==u)break}catch(_){k=e,g=1,b=_}finally{F=1}}return{value:t,done:A}}})(h,d,p),!0),S}var u={};function s(){}function l(){}function i(){}t=Object.getPrototypeOf;var c=[][n]?t(t([][n]())):(z(t={},n,function(){return this}),t),f=i.prototype=s.prototype=Object.create(c);function m(h){return Object.setPrototypeOf?Object.setPrototypeOf(h,i):(h.__proto__=i,z(h,a,"GeneratorFunction")),h.prototype=Object.create(f),h}return l.prototype=i,z(f,"constructor",i),z(i,"constructor",l),l.displayName="GeneratorFunction",z(i,a,"GeneratorFunction"),z(f),z(f,a,"Generator"),z(f,n,function(){return this}),z(f,"toString",function(){return"[object Generator]"}),(Ue=function(){return{w:o,m}})()}function z(e,t,r,n){var a=Object.defineProperty;try{a({},"",{})}catch{a=0}z=function(o,u,s,l){function i(c,f){z(o,c,function(m){return this._invoke(c,f,m)})}u?a?a(o,u,{value:s,enumerable:!l,configurable:!l,writable:!l}):o[u]=s:(i("next",0),i("throw",1),i("return",2))},z(e,t,r,n)}function Ne(e,t){return Ne=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(r,n){return r.__proto__=n,r},Ne(e,t)}function _t(e){var t=(function(r,n){if(typeof r!="object"||!r)return r;var a=r[Symbol.toPrimitive];if(a!==void 0){var o=a.call(r,n);if(typeof o!="object")return o;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(r)})(e,"string");return typeof t=="symbol"?t:t+""}function Dt(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var rt,nt={exports:{}},Nr=Dt((rt||(rt=1,(function(e){var t=/\n/,r=`
`,n=/\s/;function a(s,l,i,c){var f=s.indexOf(l,i);return f===-1||f>c?c:f}function o(s){return n.test(s)}function u(s,l,i,c){return{start:l,end:l+Math.min(c,i-l)}}e.exports=function(s,l){return e.exports.lines(s,l).map(function(i){return s.substring(i.start,i.end)}).join(`
`)},e.exports.lines=function(s,l){if((l=l||{}).width===0&&l.mode!=="nowrap")return[];s=s||"";var i=typeof l.width=="number"?l.width:Number.MAX_VALUE,c=Math.max(0,l.start||0),f=typeof l.end=="number"?l.end:s.length,m=l.mode,h=l.measure||u;return m==="pre"?(function(v,d,p,x,S){for(var R=[],y=p,T=p;T<x&&T<d.length;T++){var k=d.charAt(T),g=t.test(k);if(g||T===x-1){var b=v(d,y,g?T:T+1,S);R.push(b),y=T+1}}return R})(h,s,c,f,i):(function(v,d,p,x,S,R){var y=[],T=S;for(R==="nowrap"&&(T=Number.MAX_VALUE);p<x&&p<d.length;){for(var k=a(d,r,p,x);p<k&&o(d.charAt(p));)p++;var g=v(d,p,k,T),b=p+(g.end-g.start),F=b+1;if(b<k){for(;b>p&&!o(d.charAt(b));)b--;if(b===p)F>p+1&&F--,b=F;else for(F=b;b>p&&o(d.charAt(b-1));)b--}if(b>=p){var E=v(d,p,b,T);y.push(E)}p=F}return y})(h,s,c,f,i,m)}})(nt)),nt.exports)),at=["x","e","a","o","n","s","r","c","u","m","v","w","z"],ot=["m","w"],it=["H","I","N","E","F","K","L","T","U","V","W","X","Y","Z"],ut=9,ue=32,Ir=(function(){return ze(function e(){var t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};Ge(this,e),this.glyphs=[],this._measure=this.computeMetrics.bind(this),this.update(t)},[{key:"width",get:function(){return this._width}},{key:"height",get:function(){return this._height}},{key:"descender",get:function(){return this._descender}},{key:"ascender",get:function(){return this._ascender}},{key:"xHeight",get:function(){return this._xHeight}},{key:"baseline",get:function(){return this._baseline}},{key:"capHeight",get:function(){return this._capHeight}},{key:"lineHeight",get:function(){return this._lineHeight}},{key:"linesTotal",get:function(){return this._linesTotal}},{key:"lettersTotal",get:function(){return this._lettersTotal}},{key:"wordsTotal",get:function(){return this._wordsTotal}},{key:"update",value:function(e){var t=this;if(e=Object.assign({measure:this._measure},e),this._options=e,this._options.tabSize=ct(this._options.tabSize,4),!e.font)throw new Error("must provide a valid bitmap font");var r=this.glyphs,n=e.text||"",a=e.font;this._setupSpaceGlyphs(a);var o=Nr.lines(n,e),u=e.width||0,s=n.split(" ").filter(function(y){return y!==`
`}).length,l=n.split("").filter(function(y){return y!==`
`&&y!==" "}).length;r.length=0;var i=o.reduce(function(y,T){return Math.max(y,T.width,u)},0),c=0,f=0,m=ct(e.lineHeight,a.common.lineHeight),h=a.common.base,v=m-h,d=e.letterSpacing||0,p=m*o.length-v,x=(function(y){return y==="center"?1:y==="right"?2:0})(this._options.align);f-=p,this._width=i,this._height=p,this._descender=m-h,this._baseline=h,this._xHeight=(function(y){for(var T=0;T<at.length;T++){var k=at[T].charCodeAt(0),g=pe(y.chars,k);if(g>=0)return y.chars[g].height}return 0})(a),this._capHeight=(function(y){for(var T=0;T<it.length;T++){var k=it[T].charCodeAt(0),g=pe(y.chars,k);if(g>=0)return y.chars[g].height}return 0})(a),this._lineHeight=m,this._ascender=m-v-this._xHeight;var S=0,R=0;o.forEach(function(y,T){for(var k,g=y.start,b=y.end,F=y.width,E=n.slice(g,b).split(" ").filter(function(te){return te!==""}).length,A=n.slice(g,b).split(" ").join("").length,B=0,G=0,P=g;P<b;P++){var j=n.charCodeAt(P),U=t.getGlyph(a,j);if(U){k&&(c+=lt(a,k.id,U.id));var _=c;x===1?_+=(i-F)/2:x===2&&(_+=i-F),r.push({position:[_,f],data:U,index:P,linesTotal:o.length,lineIndex:T,lineLettersTotal:A,lineLetterIndex:B,lineWordsTotal:E,lineWordIndex:G,wordsTotal:s,wordIndex:S,lettersTotal:l,letterIndex:R}),U.id===ue&&k.id!==ue&&(G++,S++),U.id!==ue&&(B++,R++),c+=U.xadvance+d,k=U}}f+=m,c=0}),this._lettersTotal=l,this._wordsTotal=s,this._linesTotal=o.length}},{key:"getGlyph",value:function(e,t){var r=st(e,t);return r||(t===ut?this._fallbackTabGlyph:t===ue?this._fallbackSpaceGlyph:null)}},{key:"computeMetrics",value:function(e,t,r,n){var a,o,u=this._options.letterSpacing||0,s=this._options.font,l=0,i=0,c=0;if(!s.chars||s.chars.length===0)return{start:t,end:t,width:0};r=Math.min(e.length,r);for(var f=t;f<r;f++){var m=e.charCodeAt(f);if(a=this.getGlyph(s,m)){a.char=e[f],a.xoffset;var h=(l+=o?lt(s,o.id,a.id):0)+a.xadvance+u,v=l+a.width;if(v>=n||h>=n)break;l=h,i=v,o=a}c++}return o&&(i+=o.xoffset),{start:t,end:t+c,width:i}}},{key:"_setupSpaceGlyphs",value:function(e){if(this._fallbackSpaceGlyph=null,this._fallbackTabGlyph=null,e.chars&&e.chars.length!==0){var t=st(e,ue)||(function(a){for(var o=0;o<ot.length;o++){var u=ot[o].charCodeAt(0),s=pe(a.chars,u);if(s>=0)return a.chars[s]}return 0})(e)||e.chars[0],r=this._options.tabSize*t.xadvance;this._fallbackSpaceGlyph=t;var n=Object.assign({},t);this._fallbackTabGlyph=Object.assign(n,{x:0,y:0,xadvance:r,id:ut,xoffset:0,yoffset:0,width:0,height:0})}}}])})();function st(e,t){if(!e.chars||e.chars.length===0)return null;var r=pe(e.chars,t);return r>=0?e.chars[r]:null}function lt(e,t,r){if(!e.kernings||e.kernings.length===0)return 0;for(var n=e.kernings,a=0;a<n.length;a++){var o=n[a];if(o.first===t&&o.second===r)return o.amount}return 0}function pe(e,t,r){for(var n=r=r||0;n<e.length;n++)if(e[n].id===t)return n;return-1}function ct(e,t){return typeof e=="number"?e:typeof t=="number"?t:0}var D={min:[0,0],max:[0,0]};function mt(e){var t=e.length/2;D.min[0]=e[0],D.min[1]=e[1],D.max[0]=e[0],D.max[1]=e[1];for(var r=0;r<t;r++){var n=e[2*r+0],a=e[2*r+1];D.min[0]=Math.min(n,D.min[0]),D.min[1]=Math.min(a,D.min[1]),D.max[0]=Math.max(n,D.max[0]),D.max[1]=Math.max(a,D.max[1])}}var ft={computeBox:function(e,t){return mt(e),t.min.set(D.min[0],D.min[1],0),t.max.set(D.max[0],D.max[1],0),t},computeSphere:function(e,t){mt(e);var r=D.min[0],n=D.min[1],a=D.max[0]-r,o=D.max[1]-n,u=Math.sqrt(a*a+o*o);t.center.set(r+a/2,n+o/2,0),t.radius=u/2}},vt,ht,dt,pt,gt,xt,St,bt,Oe={pages:function(e){var t=new Float32Array(4*e.length*1),r=0;return e.forEach(function(n){var a=n.data.page||0;t[r++]=a,t[r++]=a,t[r++]=a,t[r++]=a}),t},attributes:function(e,t,r,n,a){var o=new Float32Array(4*e.length*2),u=new Float32Array(4*e.length*2),s=new Float32Array(4*e.length*2),l=new Float32Array(4*e.length*2),i=new Float32Array(4*e.length*2),c=new Float32Array(4*e.length*2),f=0,m=0,h=0,v=0,d=0,p=0;return e.forEach(function(x){var S=x.data,R=S.x+S.width,y=S.y+S.height,T=S.x/t,k=S.y/r,g=R/t,b=y/r;n&&(k=(r-S.y)/r,b=(r-y)/r),o[f++]=T,o[f++]=k,o[f++]=T,o[f++]=b,o[f++]=g,o[f++]=b,o[f++]=g,o[f++]=k,u[v++]=x.position[0]/a.width,u[v++]=(x.position[1]+a.height)/a.height,u[v++]=x.position[0]/a.width,u[v++]=(x.position[1]+a.height+S.height)/a.height,u[v++]=(x.position[0]+S.width)/a.width,u[v++]=(x.position[1]+a.height+S.height)/a.height,u[v++]=(x.position[0]+S.width)/a.width,u[v++]=(x.position[1]+a.height)/a.height,s[d++]=0,s[d++]=1,s[d++]=0,s[d++]=0,s[d++]=1,s[d++]=0,s[d++]=1,s[d++]=1,l[p++]=S.width,l[p++]=S.height,l[p++]=S.width,l[p++]=S.height,l[p++]=S.width,l[p++]=S.height,l[p++]=S.width,l[p++]=S.height;var F=x.position[0]+S.xoffset,E=x.position[1]+S.yoffset,A=S.width,B=S.height;i[m++]=F,i[m++]=E,i[m++]=F,i[m++]=E+B,i[m++]=F+A,i[m++]=E+B,i[m++]=F+A,i[m++]=E,c[h++]=F+A/2,c[h++]=E+B/2,c[h++]=F+A/2,c[h++]=E+B/2,c[h++]=F+A/2,c[h++]=E+B/2,c[h++]=F+A/2,c[h++]=E+B/2}),{uvs:o,layoutUvs:u,positions:i,centers:c,glyphUvs:s,glyphResolution:l}},infos:function(e,t){for(var r=new Float32Array(4*e.length),n=new Float32Array(4*e.length),a=new Float32Array(4*e.length),o=new Float32Array(4*e.length),u=new Float32Array(4*e.length),s=new Float32Array(4*e.length),l=new Float32Array(4*e.length),i=new Float32Array(4*e.length),c=new Float32Array(4*e.length),f=new Float32Array(4*e.length),m=0,h=0,v=0,d=0,p=0,x=0,S=0,R=0,y=0,T=0,k=0;k<e.length;k++){var g=e[k];r[m++]=g.linesTotal,r[m++]=g.linesTotal,r[m++]=g.linesTotal,r[m++]=g.linesTotal,n[h++]=g.lineIndex,n[h++]=g.lineIndex,n[h++]=g.lineIndex,n[h++]=g.lineIndex,a[v++]=g.lineLettersTotal,a[v++]=g.lineLettersTotal,a[v++]=g.lineLettersTotal,a[v++]=g.lineLettersTotal,o[d++]=g.lineLetterIndex,o[d++]=g.lineLetterIndex,o[d++]=g.lineLetterIndex,o[d++]=g.lineLetterIndex,u[p++]=g.lineWordsTotal,u[p++]=g.lineWordsTotal,u[p++]=g.lineWordsTotal,u[p++]=g.lineWordsTotal,s[x++]=g.lineWordIndex,s[x++]=g.lineWordIndex,s[x++]=g.lineWordIndex,s[x++]=g.lineWordIndex,l[S++]=g.wordsTotal,l[S++]=g.wordsTotal,l[S++]=g.wordsTotal,l[S++]=g.wordsTotal,i[R++]=g.wordIndex,i[R++]=g.wordIndex,i[R++]=g.wordIndex,i[R++]=g.wordIndex,c[y++]=g.lettersTotal,c[y++]=g.lettersTotal,c[y++]=g.lettersTotal,c[y++]=g.lettersTotal,f[T++]=g.letterIndex,f[T++]=g.letterIndex,f[T++]=g.letterIndex,f[T++]=g.letterIndex}return{linesTotal:r,lineIndex:n,lineLettersTotal:a,lineLetterIndex:o,lineWordsTotal:u,lineWordIndex:s,wordsTotal:l,wordIndex:i,lettersTotal:c,letterIndex:f}}};function Wr(){return ht?vt:(ht=1,vt=function(e){switch(e){case"int8":return Int8Array;case"int16":return Int16Array;case"int32":return Int32Array;case"uint8":return Uint8Array;case"uint16":return Uint16Array;case"uint32":return Uint32Array;case"float32":return Float32Array;case"float64":return Float64Array;case"array":return Array;case"uint8_clamped":return Uint8ClampedArray}})}function Vr(){if(xt)return gt;function e(t){return!!t.constructor&&typeof t.constructor.isBuffer=="function"&&t.constructor.isBuffer(t)}return xt=1,gt=function(t){return t!=null&&(e(t)||(function(r){return typeof r.readFloatLE=="function"&&typeof r.slice=="function"&&e(r.slice(0,0))})(t)||!!t._isBuffer)}}var Lr=(function(){if(bt)return St;bt=1;var e=Wr(),t=(function(){if(pt)return dt;pt=1;var o=Object.prototype.toString;return dt=function(u){return u.BYTES_PER_ELEMENT&&o.call(u.buffer)==="[object ArrayBuffer]"||Array.isArray(u)}})(),r=Vr(),n=[0,2,3],a=[2,1,3];return St=function(o,u){o&&(t(o)||r(o))||(u=o||{},o=null);for(var s=typeof(u=typeof u=="number"?{count:u}:u||{}).type=="string"?u.type:"uint16",l=typeof u.count=="number"?u.count:1,i=u.start||0,c=u.clockwise!==!1?n:a,f=c[0],m=c[1],h=c[2],v=6*l,d=o||new(e(s))(v),p=0,x=0;p<v;p+=6,x+=4){var S=p+i;d[S+0]=x+0,d[S+1]=x+1,d[S+2]=x+2,d[S+3]=x+f,d[S+4]=x+m,d[S+5]=x+h}return d}})(),Gr=Dt(Lr),zr=(function(){function e(t){var r;return Ge(this,e),typeof t=="string"&&(t={text:t}),(r=Pt(this,e))._options=Object.assign({},t),r._layout=null,r._visibleGlyphs=[],r.update(r._options),r}return Ot(e,Jt),ze(e,[{key:"layout",get:function(){return this._layout}},{key:"visibleGlyphs",get:function(){return this._visibleGlyphs}},{key:"update",value:function(t){if(t=this._validateOptions(t)){this._layout=(function(f){return new Ir(f)})(t);var r=t.flipY!==!1,n=t.font,a=n.common.scaleW,o=n.common.scaleH,u=this._layout.glyphs.filter(function(f){var m=f.data;return m.width*m.height>0});this._visibleGlyphs=u;var s=Oe.attributes(u,a,o,r,this._layout),l=Oe.infos(u,this._layout),i=Gr([],{clockwise:!0,type:"uint16",count:u.length});if(this.setIndex(i),this.setAttribute("position",new L(s.positions,2)),this.setAttribute("center",new L(s.centers,2)),this.setAttribute("uv",new L(s.uvs,2)),this.setAttribute("layoutUv",new L(s.layoutUvs,2)),this.setAttribute("glyphUv",new L(s.glyphUvs,2)),this.setAttribute("glyphResolution",new L(s.glyphResolution,2)),this.setAttribute("lineIndex",new L(l.lineIndex,1)),this.setAttribute("lineLettersTotal",new L(l.lineLettersTotal,1)),this.setAttribute("lineLetterIndex",new L(l.lineLetterIndex,1)),this.setAttribute("lineWordsTotal",new L(l.lineWordsTotal,1)),this.setAttribute("lineWordIndex",new L(l.lineWordIndex,1)),this.setAttribute("wordIndex",new L(l.wordIndex,1)),this.setAttribute("letterIndex",new L(l.letterIndex,1)),!t.multipage&&"page"in this.attributes)this.deleteAttribute("page");else if(t.multipage){var c=Oe.pages(u);this.setAttribute("page",new L(c,1))}}}},{key:"computeBoundingSphere",value:function(){this.boundingSphere===null&&(this.boundingSphere=new Zt);var t=this.attributes.position.array,r=this.attributes.position.itemSize;if(!t||!r||t.length<2)return this.boundingSphere.radius=0,void this.boundingSphere.center.set(0,0,0);ft.computeSphere(t,this.boundingSphere),isNaN(this.boundingSphere.radius)&&console.error('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.')}},{key:"computeBoundingBox",value:function(){this.boundingBox===null&&(this.boundingBox=new qt);var t=this.boundingBox,r=this.attributes.position.array,n=this.attributes.position.itemSize;if(r&&n&&!(r.length<2))return ft.computeBox(r,t);t.makeEmpty()}},{key:"_validateOptions",value:function(t){if(typeof t=="string"&&(t={text:t}),!(t=Object.assign({},this._options,t)).font)throw new TypeError("must specify a { font } in options");return t}}])})(),Hr={transparent:!0,opacity:1,alphaTest:.01,threshold:.2,color:"#ffffff",strokeColor:"#000000",strokeOutsetWidth:0,strokeInsetWidth:.3,isSmooth:0},$r=(function(){function e(){var t,r=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};Ge(this,e),r=Object.assign(JSON.parse(JSON.stringify(Hr)),r),(t=Pt(this,e)).transparent=r.transparent,t.alphaTest=r.alphaTest,t.opacity=M(r.opacity),t.color=M(new xe(r.color)),t.map=r.map,t.isSmooth=M(r.isSmooth),t.threshold=M(r.threshold),t.strokeColor=M(new xe(r.strokeColor)),t.strokeOutsetWidth=M(r.strokeOutsetWidth),t.strokeInsetWidth=M(r.strokeInsetWidth);var n,a,o,u=.7071067811865476,s=J(t.map,oe()),l=ie((n=s.r,a=s.g,o=s.b,$e(Ye(n,a),Ye($e(n,a),o))),.5),i=Be(q(Ee(l,je(l)),.5),0,1),c=de(ie(t.threshold,u),q(t.threshold,u),l);i=X(i,c,t.isSmooth);var f=q(l,fe(t.strokeOutsetWidth,.5)),m=ie(l,fe(t.strokeOutsetWidth,.5)),h=Be(q(Ee(f,je(f)),.5),0,1),v=Ke(Be(q(Ee(m,je(m)),.5),0,1)),d=de(ie(t.threshold,u),q(t.threshold,u),f),p=Ke(de(ie(t.threshold,u),q(t.threshold,u),m));h=X(h,d,t.isSmooth),v=X(v,p,t.isSmooth);var x=fe(h,v);return t.colorNode=X(t.color,t.strokeColor,x),t.opacityNode=fe(t.opacity,q(i,x)),t}return Ot(e,Qt),ze(e)})();const Ut=Symbol("Comlink.proxy"),Yr=Symbol("Comlink.endpoint"),Kr=Symbol("Comlink.releaseProxy"),Ae=Symbol("Comlink.finalizer"),ge=Symbol("Comlink.thrown"),yt=e=>typeof e=="object"&&e!==null||typeof e=="function",Nt=new Map([["proxy",{canHandle:e=>yt(e)&&e[Ut],serialize(e){const{port1:t,port2:r}=new MessageChannel;return It(e,t),[r,[r]]},deserialize:e=>(e.start(),Vt(e))}],["throw",{canHandle:e=>yt(e)&&ge in e,serialize({value:e}){let t;return t=e instanceof Error?{isError:!0,value:{message:e.message,name:e.name,stack:e.stack}}:{isError:!1,value:e},[t,[]]},deserialize(e){throw e.isError?Object.assign(new Error(e.value.message),e.value):e.value}}]]);function It(e,t=globalThis,r=["*"]){t.addEventListener("message",function n(a){if(!a||!a.data)return;if(!(function(c,f){for(const m of c)if(f===m||m==="*"||m instanceof RegExp&&m.test(f))return!0;return!1})(r,a.origin))return void console.warn(`Invalid origin '${a.origin}' for comlink proxy`);const{id:o,type:u,path:s}=Object.assign({path:[]},a.data),l=(a.data.argumentList||[]).map(ee);let i;try{const c=s.slice(0,-1).reduce((m,h)=>m[h],e),f=s.reduce((m,h)=>m[h],e);switch(u){case"GET":i=f;break;case"SET":c[s.slice(-1)[0]]=ee(a.data.value),i=!0;break;case"APPLY":i=f.apply(c,l);break;case"CONSTRUCT":i=(function(m){return Object.assign(m,{[Ut]:!0})})(new f(...l));break;case"ENDPOINT":{const{port1:m,port2:h}=new MessageChannel;It(e,h),i=(function(v,d){return Gt.set(v,d),v})(m,[m])}break;case"RELEASE":i=void 0;break;default:return}}catch(c){i={value:c,[ge]:0}}Promise.resolve(i).catch(c=>({value:c,[ge]:0})).then(c=>{const[f,m]=we(c);t.postMessage(Object.assign(Object.assign({},f),{id:o}),m),u==="RELEASE"&&(t.removeEventListener("message",n),Wt(t),Ae in e&&typeof e[Ae]=="function"&&e[Ae]())}).catch(c=>{const[f,m]=we({value:new TypeError("Unserializable return value"),[ge]:0});t.postMessage(Object.assign(Object.assign({},f),{id:o}),m)})}),t.start&&t.start()}function Wt(e){(function(t){return t.constructor.name==="MessagePort"})(e)&&e.close()}function Vt(e,t){const r=new Map;return e.addEventListener("message",function(n){const{data:a}=n;if(!a||!a.id)return;const o=r.get(a.id);if(o)try{o(a)}finally{r.delete(a.id)}}),Ie(e,r,[],t)}function ve(e){if(e)throw new Error("Proxy has been released and is not useable")}function Lt(e){return ne(e,new Map,{type:"RELEASE"}).then(()=>{Wt(e)})}const ye=new WeakMap,he="FinalizationRegistry"in globalThis&&new FinalizationRegistry(e=>{const t=(ye.get(e)||0)-1;ye.set(e,t),t===0&&Lt(e)});function Ie(e,t,r=[],n=function(){}){let a=!1;const o=new Proxy(n,{get(u,s){if(ve(a),s===Kr)return()=>{(function(l){he&&he.unregister(l)})(o),Lt(e),t.clear(),a=!0};if(s==="then"){if(r.length===0)return{then:()=>o};const l=ne(e,t,{type:"GET",path:r.map(i=>i.toString())}).then(ee);return l.then.bind(l)}return Ie(e,t,[...r,s])},set(u,s,l){ve(a);const[i,c]=we(l);return ne(e,t,{type:"SET",path:[...r,s].map(f=>f.toString()),value:i},c).then(ee)},apply(u,s,l){ve(a);const i=r[r.length-1];if(i===Yr)return ne(e,t,{type:"ENDPOINT"}).then(ee);if(i==="bind")return Ie(e,t,r.slice(0,-1));const[c,f]=wt(l);return ne(e,t,{type:"APPLY",path:r.map(m=>m.toString()),argumentList:c},f).then(ee)},construct(u,s){ve(a);const[l,i]=wt(s);return ne(e,t,{type:"CONSTRUCT",path:r.map(c=>c.toString()),argumentList:l},i).then(ee)}});return(function(u,s){const l=(ye.get(s)||0)+1;ye.set(s,l),he&&he.register(u,s,u)})(o,e),o}function wt(e){const t=e.map(we);return[t.map(n=>n[0]),(r=t.map(n=>n[1]),Array.prototype.concat.apply([],r))];var r}const Gt=new WeakMap;function we(e){for(const[t,r]of Nt)if(r.canHandle(e)){const[n,a]=r.serialize(e);return[{type:"HANDLER",name:t,value:n},a]}return[{type:"RAW",value:e},Gt.get(e)||[]]}function ee(e){switch(e.type){case"HANDLER":return Nt.get(e.name).deserialize(e.value);case"RAW":return e.value}}function ne(e,t,r,n){return new Promise(a=>{const o=new Array(4).fill(0).map(()=>Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(16)).join("-");t.set(o,a),e.start&&e.start(),e.postMessage(Object.assign({id:o},r),n)})}var Xr=class{worker;api;initPromise;constructor(e,t){this.worker=new Worker(e,{type:"module"}),this.api=Vt(this.worker),this.initPromise=this.api.initialize(t)}initialize=()=>this.initPromise;loadFont=async e=>(await this.initPromise,this.api.loadFont(e));generateAtlas=e=>this.api.generateAtlas(e);exportJSON=e=>this.api.exportJSON(e);dispose=()=>this.api.dispose();generateMSDFAtlas=e=>this.api.generateMSDFAtlas(e);generateMSDFFont=e=>this.api.generateMSDFFont(e);terminate=()=>this.worker.terminate()},Jr=class{static Encoder=new TextEncoder;client=null;workerUrl;wasmUrl;initialized=!1;constructor(e={}){this.workerUrl=e.workerUrl||new URL("./worker.js",import.meta.url).href,this.wasmUrl=e.wasmUrl}async initialize(){this.initialized||(this.client=new Xr(this.workerUrl,this.wasmUrl),await this.client.initialize(),this.initialized=!0)}async generate(e){if(!this.client||!this.initialized)throw new Error("MSDF not initialized. Call initialize() first.");return e.fonts?this.generateMultiple(e):this.generateSingle(e)}async generateSingle(e){const{onProgress:t,...r}=e;await this.client.loadFont(r.font);const n=await this.client.generateAtlas(r),a=await this.client.exportJSON({atlas:n,fontSize:e.fontSize||48}),o=await this.atlasToBlob(n),u={...a,pages:[`data:image/png;base64,${await this.blobToBase64(o)}`]};return t?.(100,1,1),this.toFontFamily(u,n.info.name||"font",n.info.weight||400)}async generateMultiple(e){const{fonts:t,onProgress:r,...n}=e;if(!t||t.length===0)throw new Error("No fonts provided");const a={};let o=0;const u=t.length;for(const s of t){const{font:l,...i}=s,c={...n,...i,font:l,charset:i.charset??n.charset??""};if(!c.charset)throw new Error("charset is required globally or per-font");const f=await this.generateSingle(c);for(const[m,h]of Object.entries(f))for(const[v,d]of Object.entries(h)){const p=Number(v);a[m]?.[p]&&console.warn(`Duplicate font: ${m} (${p}). Overwriting.`),a[m]||(a[m]={}),a[m][p]=d}o++,r?.(Math.round(o/u*100),o,u)}return a}async generateAtlas(e){if(!this.client||!this.initialized)throw new Error("MSDF not initialized. Call initialize() first.");const{onProgress:t,...r}=e;return await this.client.loadFont(r.font),await this.client.generateAtlas(r)}async dispose(){this.client&&(await this.client.dispose(),this.client.terminate(),this.client=null,this.initialized=!1)}async toFontFamily(e,t,r){return{[t]:{[r]:e}}}atlasToBlob(e){const t=document.createElement("canvas");return t.width=e.textureSize[0],t.height=e.textureSize[1],t.getContext("2d").putImageData(e.texture,0,0),new Promise((r,n)=>{t.toBlob(a=>a?r(a):n(new Error("Failed to create blob")),"image/png")})}blobToBase64(e){return new Promise((t,r)=>{const n=new FileReader;n.onloadend=()=>t(n.result.split(",")[1]),n.onerror=r,n.readAsDataURL(e)})}},Zr={charset:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ",fontSize:48,textureSize:[512,512],fieldRange:4,fixOverlaps:!0,onProgress:function(){}},qr=(function(){var e,t=(e=Ue().m(function r(n){var a,o,u,s,l,i,c,f,m,h,v,d,p=arguments;return Ue().w(function(x){for(;;)switch(x.n){case 0:return a=p.length>1&&p[1]!==void 0?p[1]:{},o=tt(tt({},Zr),a),u=new Jr({workerUrl:o.workerUrl,wasmUrl:o.wasmUrl}),x.n=1,u.initialize();case 1:return x.n=2,fetch(n);case 2:return s=x.v,x.n=3,s.arrayBuffer();case 3:return l=x.v,i=new Uint8Array(l),x.n=4,u.generate({font:i,charset:o.charset,fontSize:o.fontSize,textureSize:o.textureSize,fieldRange:o.fieldRange,fixOverlaps:o.fixOverlaps,onProgress:o.onProgress});case 4:return c=x.v,x.n=5,u.dispose();case 5:return f=Object.keys(c)[0],m=Object.keys(c[f])[0],h=c[f][m],v=h.pages[0],x.n=6,new Promise(function(S,R){var y=new Image;y.onload=function(){var T=new Xt(y);T.needsUpdate=!0,S(T)},y.onerror=R,y.src=v});case 6:return d=x.v,x.a(2,{font:new Ar(h),atlas:d})}},r)}),function(){var r=this,n=arguments;return new Promise(function(a,o){var u=e.apply(r,n);function s(i){Qe(u,a,o,s,l,"next",i)}function l(i){Qe(u,a,o,s,l,"throw",i)}s(void 0)})});return function(r){return t.apply(this,arguments)}})();const Qr=[1024,1024],en=64,tn=4,rn=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?;:\\/:()[]{}<>+-=_*#%$@&|~\`"'
\r	░▒▓█▄▀■□◼◻`,Tt={"Press Start 2P":re("PressStart2P-Regular.ttf"),VT323:re("VT323-Regular.ttf"),Orbitron:re("Orbitron-wght.ttf"),"Roboto Mono":re("RobotoMono-wght.ttf"),Roboto:re("Roboto-wdth-wght.ttf"),"Muro Slant":re("Muroslant.ttf")},nn={"Arial Black":"Roboto",Arial:"Roboto",Verdana:"Roboto",Tahoma:"Roboto","Trebuchet MS":"Roboto",Impact:"Roboto","Courier New":"Roboto Mono","Lucida Console":"Roboto Mono",Monaco:"Roboto Mono",Consolas:"Roboto Mono",Menlo:"Roboto Mono",monospace:"Roboto Mono","sans-serif":"Roboto",serif:"Roboto",terminal:"Roboto Mono"};function an(e){return nn[e]||e||"Roboto Mono"}function on(e){const t=an(e);return Tt[t]||Tt["Roboto Mono"]}Z(Te);const un="/msdfgen/worker.bundled.js",sn="/msdfgen/msdfgen.wasm";function ln(e){return me(()=>{const t=oe(),r=t.sub(I(.5)),n=Ve(1).sub(r.length().mul(e.vignette).smoothstep(.55,.95)),a=$(.5,t.y.mul(900).fract()),o=t.x.mul(812).add(t.y.mul(431)).add(e.time.mul(60)).sin().mul(.04).add(.96);return H(e.screenColor).mul(n).mul(o).sub(a.mul(e.scanlineStrength.mul(.08)))})}function cn({fontName:e,screenText:t,showCaret:r,caretMode:n,caretBlinkRate:a}){const[o,u]=w.useState(null),s=w.useRef(0),l=w.useRef(!0);w.useEffect(()=>{let c=!1;async function f(){const{font:m,atlas:h}=await qr(on(e),{workerUrl:un,wasmUrl:sn,charset:rn,fontSize:en,textureSize:Qr,fieldRange:tn});if(c){h.dispose();return}u({font:m,atlas:h})}return f(),()=>{c=!0}},[e]),W((c,f)=>{!r||!o||(s.current+=f,s.current>=1/Math.max(a,.001)&&(s.current=0,l.current=!l.current))});const i=w.useMemo(()=>r?n==="underscore"?`${t}${l.current?"_":" "}`:n==="line"?`${t}${l.current?"|":" "}`:`${t}${l.current?"█":" "}`:t,[n,t,r]);return{assets:o,resolvedText:i}}function mn({assets:e,resolvedText:t,fontColor:r}){const n=w.useRef(),a=w.useMemo(()=>e?new zr({text:t,font:e.font.data,align:"center",width:1500,lineHeight:70,letterSpacing:0}):null,[e,t]),o=w.useMemo(()=>e?new $r({map:e.atlas,color:r,transparent:!0,opacity:1,isSmooth:1,threshold:.5}):null,[e,r]);return w.useEffect(()=>()=>{a?.dispose(),o?.dispose()},[a,o]),W(()=>{!n.current||!a||(n.current.geometry=a)}),!e||!a||!o?null:C.jsxs("mesh",{ref:n,position:[0,0,.003],scale:[.0025,.0025,.0025],children:[C.jsx("primitive",{attach:"geometry",object:a}),C.jsx("primitive",{attach:"material",object:o})]})}function fn({canvas:e,text:t,fontName:r,fontSize:n,fontColor:a,horizontalPadding:o,verticalPadding:u,showCaret:s,caretMode:l}){const i=e.getContext("2d");if(!i)return;i.clearRect(0,0,e.width,e.height),i.font=`${n}px "${r}"`,i.fillStyle=a,i.textBaseline="top";const c=n*1.3,f=e.width-o*2,m=t.split("");let h="";const v=[];if(m.forEach(y=>{if(y===`
`){v.push(h),h="";return}const T=h+y;if(i.measureText(T).width>f&&h){v.push(h),h=y;return}h=T}),h&&v.push(h),v.forEach((y,T)=>{i.fillText(y,o,u+T*c)}),!s||v.length===0)return;const d=v[v.length-1],p=i.measureText(d),x=o+p.width+4,S=u+(v.length-1)*c,R=p.actualBoundingBoxAscent+p.actualBoundingBoxDescent||n;l==="underscore"?i.fillRect(x,S+n*1.05,n*.8,3):l==="line"?i.fillRect(x,S+2,Math.max(3,n*.08),R):i.fillRect(x,S+2,n*.6,R)}function vn({text:e,fontName:t,fontSize:r,fontColor:n,horizontalPadding:a,verticalPadding:o,showCaret:u,caretMode:s,caretBlinkRate:l}){const i=w.useRef(null),c=w.useRef(null),f=w.useRef(0),m=w.useRef(!0);if(!i.current||!c.current){const v=document.createElement("canvas");v.width=1024,v.height=512,c.current=v;const d=new We(v);d.minFilter=Q,d.magFilter=Q,d.wrapS=ae,d.wrapT=ae,i.current=d}const h=v=>{fn({canvas:c.current,text:e,fontName:t,fontSize:r,fontColor:n,horizontalPadding:a,verticalPadding:o,showCaret:u&&v,caretMode:s}),i.current.needsUpdate=!0};return w.useEffect(()=>{h(!0)},[s,n,t,r,a,u,e,o]),W((v,d)=>{u&&(f.current+=d,f.current>=1/Math.max(l,.001)&&(f.current=0,m.current=!m.current,h(m.current)))}),w.useEffect(()=>()=>{i.current?.dispose?.()},[]),C.jsxs("mesh",{position:[0,0,.002],children:[C.jsx("planeGeometry",{args:[2,2]}),C.jsx("meshBasicMaterial",{transparent:!0,toneMapped:!1,map:i.current})]})}function _e({screenText:e="12:00 FEB. 28, 1986",fontName:t="Press Start 2P",fontColor:r="#FFFFFF",showCaret:n=!1,caretMode:a="block",caretBlinkRate:o=2,screenColor:u="#0b2fd8",vignette:s=1.15,scanlineStrength:l=.08,side:i=Y,...c}){const{fontSize:f=28,horizontalPadding:m=48,verticalPadding:h=40,glowStrength:v=.35,curvature:d=.06,noiseStrength:p=.08,scanlineDensity:x=900,rollSpeed:S=.4,rollStrength:R=0,chromaOffset:y=.0025}=c,T=w.useMemo(()=>({time:M(0),screenColor:M(new xe(u)),vignette:M(s),scanlineStrength:M(l)}),[]);w.useEffect(()=>{T.screenColor.value.set(u),T.vignette.value=s,T.scanlineStrength.value=l},[u,l,T,s]);const k=w.useMemo(()=>{const F=new le({side:i,toneMapped:!1});return F.colorNode=ln(T)(),F},[i,T]);w.useEffect(()=>{k.userData.legacyProps={fontSize:f,horizontalPadding:m,verticalPadding:h,glowStrength:v,curvature:d,noiseStrength:p,scanlineDensity:x,rollSpeed:S,rollStrength:R,chromaOffset:y}},[k,y,d,f,v,m,p,S,R,x,h]),W(({clock:F})=>{T.time.value=F.getElapsedTime()});const{assets:g,resolvedText:b}=cn({fontName:t,screenText:e,showCaret:n,caretMode:a,caretBlinkRate:o});return C.jsxs(C.Fragment,{children:[C.jsx("primitive",{attach:"material",object:k}),C.jsx(mn,{assets:g,resolvedText:b,fontColor:r}),C.jsx(vn,{text:e,fontName:t,fontSize:f,fontColor:r,horizontalPadding:m,verticalPadding:h,showCaret:n,caretMode:a,caretBlinkRate:o})]})}Z(Te);function hn(e,t,r){return me(()=>{const n=oe(),a=I(n.x,n.y.oneMinus()),u=n.sub(I(.5)).div(e.zoom).add(I(.5)).add(I(n.y,n.x).mul(6).add(e.time.mul(.4)).sin().mul(.003).mul(e.warp)),s=Ce(u,e.curvature),l=I(s.x,s.y.oneMinus()),i=J(t,a).rgb,c=J(r,l).rgb,f=X(i,c,e.decay),m=n.y.mul(900).sin().mul(.04).mul(e.scanlineStrength);return X(f.sub(H(m)),H(Se(n.mul(600).add(I(e.time,e.time)))),e.staticAmount).mul(Me(n,e.vignette))})}function dn({resolution:e=1024,decay:t=.85,zoom:r=1.01,warp:n=.6,staticAmount:a=.04,scanlineStrength:o=.4,curvature:u=.12,vignette:s=.85,side:l=Y}){const{gl:i,scene:c,camera:f}=se(),m=w.useMemo(()=>new Re(e,e,{depthBuffer:!0}),[e]),h=w.useMemo(()=>new Re(e,e,{depthBuffer:!0}),[e]),v=w.useMemo(()=>new Re(e,e,{depthBuffer:!0}),[e]),d=w.useRef(!1),p=w.useRef(!1),x=w.useMemo(()=>({time:M(0),decay:M(t),zoom:M(r),warp:M(n),staticAmount:M(a),scanlineStrength:M(o),curvature:M(u),vignette:M(s)}),[u,t,o,a,s,n,r]),S=w.useMemo(()=>new er(h.texture),[h.texture]);w.useEffect(()=>()=>{m.dispose(),h.dispose(),v.dispose()},[h,v,m]),w.useEffect(()=>{x.decay.value=t,x.zoom.value=r,x.warp.value=n,x.staticAmount.value=a,x.scanlineStrength.value=o,x.curvature.value=u,x.vignette.value=s},[u,t,o,a,x,s,n,r]);const R=w.useMemo(()=>{const y=new le({side:l,toneMapped:!1});return y.colorNode=hn(x,m.texture,S)(),y},[S,m.texture,l,x]);return w.useEffect(()=>()=>{R.dispose()},[R]),W(({clock:y})=>{x.time.value=y.getElapsedTime();const T=i.getRenderTarget?.()||null,k=[];c.traverse(g=>{const b=g;if(!b?.isMesh||b.visible===!1)return;const F=b.material;(Array.isArray(F)?F.includes(R):F===R)&&(k.push(b),b.visible=!1)});try{i.setRenderTarget(m),i.clear(),i.render(c,f);for(let F=0;F<k.length;F+=1)k[F].visible=!0;const g=d.current?h:v,b=d.current?v:h;S.value=p.current?g.texture:m.texture,i.setRenderTarget(b),i.clear(),i.render(c,f),p.current=!0,S.value=b.texture}finally{for(let g=0;g<k.length;g+=1)k[g].visible=!0;d.current=!d.current,i.setRenderTarget(T)}}),C.jsx("primitive",{object:R,attach:"material"})}function pn({onCamera:e}){const{camera:t}=se();return w.useEffect(()=>{e(t)},[t,e]),null}function gn(e,t){return me(()=>{const r=Ce(oe(),e.curvature),n=I(r.x,Ve(1).sub(r.y)),a=r.x.step(0).mul(r.x.oneMinus().step(0)).mul(r.y.step(0)).mul(r.y.oneMinus().step(0)),o=e.time.mul(.6).add(r.y.mul(4)).sin().mul(.002).mul(e.chromaDrift),u=J(t,n.add(I(o,0))).r,s=J(t,n).g,l=J(t,n.sub(I(o,0))).b,i=H(u,s,l),c=Le(r,e.time,e.staticScale,e.staticSpeed),f=r.y.mul(900).sin().mul(.04).mul(e.scanlineStrength),m=X(i,H(c),e.staticAmount).sub(H(f)),h=m.dot(H(.299,.587,.114)),v=de(.6,1,h).mul(e.bloom);return m.add(m.mul(v)).mul(Me(r,e.vignette)).mul(a)})}function xn({scene:e,resolution:t=1024,staticAmount:r=.12,staticScale:n=600,staticSpeed:a=6,scanlineStrength:o=.4,curvature:u=.12,vignette:s=.85,chromaDrift:l=.25,bloom:i=.25,side:c=Y}){const{camera:f}=se(),m=w.useMemo(()=>new Ct,[]),[h,v]=w.useState(null),d=w.useMemo(()=>Mt(C.jsxs(C.Fragment,{children:[C.jsx(pn,{onCamera:v}),e]}),m),[m,e]),p=h||f,x=w.useMemo(()=>or(m,p),[p,m]),S=w.useMemo(()=>({time:M(0),staticAmount:M(r),staticScale:M(n),staticSpeed:M(a),scanlineStrength:M(o),curvature:M(u),vignette:M(s),chromaDrift:M(l),bloom:M(i)}),[]);w.useEffect(()=>{S.staticAmount.value=r,S.staticScale.value=n,S.staticSpeed.value=a,S.scanlineStrength.value=o,S.curvature.value=u,S.vignette.value=s,S.chromaDrift.value=l,S.bloom.value=i},[i,l,u,o,r,n,a,S,s]);const R=w.useMemo(()=>{const y=new le({side:c,toneMapped:!1});return y.colorNode=gn(S,x.getTextureNode("output"))(),y.userData.resolution=t,y},[t,x,c,S]);return W(({clock:y})=>{S.time.value=y.getElapsedTime()}),w.useEffect(()=>()=>{R.dispose()},[R]),C.jsxs(C.Fragment,{children:[d,C.jsx("primitive",{object:R,attach:"material"})]})}Z(Te);function Sn(e,t){return me(()=>{const r=Ce(oe(),e.curvature),n=$(0,r.x).mul($(r.x,1)).mul($(0,r.y)).mul($(r.y,1)),a=Le(r,e.time,e.staticScale,e.staticSpeed),o=e.time.mul(.6).sin().mul(.002).mul(e.convergenceDrift),u=J(t,r.add(I(o,0))).rgb,s=J(t,r).rgb,l=J(t,r.sub(I(o,0))).rgb,i=H(u.r,s.g,l.b).mul(ir(r,e.maskMode,e.maskStrength)),c=ur(r,900,e.scanlineStrength),f=$(Ve(1).sub(e.glitchRate),Se(I(e.time.mul(10).floor(),0))),m=i.sub(c).add(H(Se(r.mul(60).add(e.time.mul(.4)))).mul(.02));return X(m.mul(Me(r,e.vignette)),H(a),f.mul(e.staticAmount)).mul(n)})}function bn(){const e=document.createElement("canvas");e.width=1024,e.height=512;const t=e.getContext("2d");if(!t)return null;const r=(a,o,u)=>{const s=e.width,l=e.height;u.forEach((i,c)=>{const f=Math.floor(c/u.length*s),m=Math.floor((c+1)/u.length*s);t.fillStyle=i,t.fillRect(f,Math.floor(a*l),m-f,Math.floor((o-a)*l))})};r(0,.62,["#ffffff","#ffff00","#00ffff","#00ff00","#ff00ff","#ff0000","#0000ff"]),r(.62,.7,["#0000ff","#000000","#ff00ff","#000000","#00ffff","#000000","#666666"]),r(.7,1,["#000066","#ffffff","#1a1a1a","#000000","#666666","#000000"]);const n=new We(e);return n.minFilter=Q,n.magFilter=Q,n.wrapS=ae,n.wrapT=ae,n.colorSpace=kt,n}function yn({staticAmount:e=.35,staticScale:t=700,staticSpeed:r=9,snap:n=24,glitchRate:a=.18,scanlineStrength:o=.55,colorBleed:u=.14,curvature:s=.12,vignette:l=.75,maskStrength:i=.35,flybackStrength:c=.35,convergenceDrift:f=.4,bloomStrength:m=.25,breathStrength:h=.35,retraceStrength:v=.35,beamWidth:d=.5,chromaDrift:p=.3,humStrength:x=.25,barrelConvergence:S=.6,spotNoise:R=.35,thermalDrift:y=.15,maskMode:T=0,side:k=Y}){const g=w.useRef(null);g.current||(g.current=bn());const b=w.useMemo(()=>({time:M(0),staticAmount:M(e),staticScale:M(t),staticSpeed:M(r),snap:M(n),glitchRate:M(a),scanlineStrength:M(o),colorBleed:M(u),curvature:M(s),vignette:M(l),maskStrength:M(i),flybackStrength:M(c),convergenceDrift:M(f),bloomStrength:M(m),breathStrength:M(h),retraceStrength:M(v),beamWidth:M(d),chromaDrift:M(p),humStrength:M(x),thermalDrift:M(y),spotNoise:M(R),maskMode:M(T),barrelConvergence:M(S)}),[]);w.useEffect(()=>{b.staticAmount.value=e,b.staticScale.value=t,b.staticSpeed.value=r,b.snap.value=n,b.glitchRate.value=a,b.scanlineStrength.value=o,b.colorBleed.value=u,b.curvature.value=s,b.vignette.value=l,b.maskStrength.value=i,b.flybackStrength.value=c,b.convergenceDrift.value=f,b.bloomStrength.value=m,b.breathStrength.value=h,b.retraceStrength.value=v,b.beamWidth.value=d,b.chromaDrift.value=p,b.humStrength.value=x,b.thermalDrift.value=y,b.spotNoise.value=R,b.maskMode.value=T,b.barrelConvergence.value=S},[S,d,m,h,p,u,f,s,c,a,x,T,i,v,o,n,R,e,t,r,y,b,l]);const F=w.useMemo(()=>{const E=new le({side:k,toneMapped:!1});return E.colorNode=Sn(b,g.current)(),E},[k,b]);return w.useEffect(()=>()=>{g.current?.dispose?.()},[]),W(({clock:E})=>{b.time.value=E.getElapsedTime()}),C.jsx("primitive",{object:F,attach:"material"})}Z(Te);function wn(e){return me(()=>{const t=Ce(oe(),e.curvature),r=$(0,t.x).mul($(t.x,1)).mul($(0,t.y)).mul($(t.y,1)),n=e.time.mul(e.snowSpeed).mul(e.snap).floor().div(e.snap),a=t.mul(e.snowSize).floor().div(e.snowSize),o=Xe(a.mul(e.snowScale).add(I(n.mul(1.2),n.mul(-.7)))).mul(.5).add(.5),u=Le(t,e.time,e.bandScale,e.bandSpeed),s=Xe(I(t.y.mul(e.rfScale),e.time.mul(e.rfSpeed))).abs(),l=sr(o.add(u.mul(e.bandStrength)).add(s.mul(e.rfStrength)).add(Se(t.mul(500).add(e.time.mul(60))).mul(.1))),i=H(l).mul(Me(t,e.vignette));return X(H(0),i,e.snowAmount).mul(r)})}function Tn({snowAmount:e=1,snowScale:t=180,snowSpeed:r=1,snowSize:n=240,curvature:a=.12,vignette:o=.75,bandStrength:u=.35,bandSpeed:s=.6,bandScale:l=8,snap:i=24,rfStrength:c=.25,rfScale:f=22,rfSpeed:m=.4,side:h=Y}){const v=w.useMemo(()=>({time:M(0),snowAmount:M(e),snowScale:M(t),snowSpeed:M(r),snowSize:M(n),snap:M(i),bandStrength:M(u),bandSpeed:M(s),bandScale:M(l),rfStrength:M(c),rfScale:M(f),rfSpeed:M(m),curvature:M(a),vignette:M(o)}),[]);w.useEffect(()=>{v.snowAmount.value=e,v.snowScale.value=t,v.snowSpeed.value=r,v.snowSize.value=n,v.snap.value=i,v.bandStrength.value=u,v.bandSpeed.value=s,v.bandScale.value=l,v.rfStrength.value=c,v.rfScale.value=f,v.rfSpeed.value=m,v.curvature.value=a,v.vignette.value=o},[l,s,u,a,f,m,c,e,t,n,r,i,v,o]);const d=w.useMemo(()=>{const p=new le({side:h,toneMapped:!1});return p.colorNode=wn(v)(),p},[h,v]);return W(({clock:p})=>{v.time.value=p.getElapsedTime()}),C.jsx("primitive",{object:d,attach:"material"})}function Cn({count:e=4,radius:t=2,speed:r=.25}){const n=w.useRef(),a=Math.PI*2/e;return W((o,u)=>{n.current.rotation.y+=u*r}),C.jsx("group",{ref:n,children:Array.from({length:e}).map((o,u)=>{const s=u*a,l=Math.sin(s)*t,i=Math.cos(s)*t;return C.jsx(cr,{position:[l,0,i],rotation:[0,s,0]},u)})})}function zt({fallback:e=null}){return C.jsxs(w.Suspense,{fallback:e,children:[C.jsx(mr,{makeDefault:!0,position:[0,0,3]}),C.jsx("color",{attach:"background",args:["#646464"]}),C.jsx("ambientLight",{intensity:.3}),C.jsx("directionalLight",{position:[5,6,4],intensity:1.2}),C.jsx(Cn,{count:6,radius:1.2,speed:.6}),C.jsx(lr,{scale:1.5,position:[0,.05,0],rotation:[0,0,0]})]})}const De=["Arial Black","Arial","Verdana","Tahoma","Trebuchet MS","Impact","Courier New","Lucida Console","Monaco","Consolas","Menlo","Orbitron","VT323","Press Start 2P","monospace","sans-serif","serif","terminal"];function Mn(){const e=K("CRT SMPTE RP-219",{staticAmount:{value:.35,min:0,max:1,step:.01},staticScale:{value:700,min:50,max:1400,step:1},staticSpeed:{value:9,min:.1,max:20,step:.1},snap:{value:24,min:1,max:60,step:1},glitchRate:{value:.18,min:0,max:1,step:.01},scanlineStrength:{value:.55,min:0,max:1,step:.01},colorBleed:{value:.14,min:0,max:.5,step:.01},curvature:{value:.12,min:0,max:.4,step:.01},vignette:{value:.75,min:.6,max:.98,step:.01},maskStrength:{value:.35,min:0,max:1,step:.01},flybackStrength:{value:.35,min:0,max:1,step:.01},convergenceDrift:{value:.4,min:0,max:1,step:.01},bloomStrength:{value:.25,min:0,max:1,step:.01},breathStrength:{value:.35,min:0,max:1,step:.01},retraceStrength:{value:.35,min:0,max:1,step:.01},beamWidth:{value:.5,min:0,max:1,step:.01},chromaDrift:{value:.3,min:0,max:1,step:.01},humStrength:{value:.25,min:0,max:1,step:.01},barrelConvergence:{value:.6,min:0,max:2,step:.01},spotNoise:{value:.35,min:0,max:1,step:.01},thermalDrift:{value:.15,min:0,max:1,step:.01},maskMode:{value:0,options:{shadow:0,grille:1}}},{collapsed:!0}),t=K("CRT Static",{snowAmount:{value:1,min:0,max:1},snowScale:{value:180,min:10,max:800},snowSpeed:{value:1,min:0,max:5},snowSize:{value:240,min:40,max:1e3},curvature:{value:.12,min:0,max:.4,step:.01},vignette:{value:.75,min:.6,max:.98,step:.01},bandStrength:{value:.35,min:0,max:1},bandSpeed:{value:.6,min:0,max:3},bandScale:{value:8,min:1,max:40},snap:{value:24,min:1,max:60,step:1},rfStrength:{value:.25,min:0,max:1},rfScale:{value:22,min:2,max:80},rfSpeed:{value:.4,min:0,max:3}},{collapsed:!0}),r=K("No Signal",{Text:O({screenText:{value:`12:00 FEB. 28, 1986\r
INSERT VHS`,rows:!0},fontSize:{value:28,min:0,max:48,step:1},fontName:{value:"Press Start 2P",options:De},fontColor:{value:"#FFFFFF"},showCaret:{value:!1},caretMode:{value:"block",options:["block","underscore","line"]},caretBlinkRate:{value:2,min:.2,max:5,step:.1},horizontalPadding:{value:100,min:0,max:1e3,step:1},verticalPadding:{value:95,min:0,max:1e3,step:1}},{collapsed:!0}),Look:O({screenColor:{value:"#0b2fd8"},glowStrength:{value:.35,min:0,max:1,step:.01},curvature:{value:.06,min:0,max:.2,step:.001},vignette:{value:1.15,min:.5,max:2,step:.01}},{collapsed:!0}),Noise:O({noiseStrength:{value:.08,min:0,max:.4,step:.001},scanlineStrength:{value:.08,min:0,max:.3,step:.001},scanlineDensity:{value:900,min:200,max:2e3,step:10}},{collapsed:!0}),Roll:O({rollSpeed:{value:.4,min:0,max:2,step:.01},rollStrength:{value:0,min:0,max:2,step:.01}},{collapsed:!0}),Chroma:O({chromaOffset:{value:.0025,min:0,max:.01,step:1e-4}},{collapsed:!0})},{collapsed:!0}),n=K("Terminal",{Text:O({screenText:{value:`a:\\> ||TERMINAL ERROR||\r
      - 0X666420 -\r
      DATA CORRUPTED\r
a:\\> FULL SYSTEM FAILURE
a:\\> INSERT BOOT DISK`,rows:!0},fontSize:{value:26,min:0,max:48,step:1},fontName:{value:"Press Start 2P",options:De},fontColor:{value:"#48ff00"},showCaret:{value:!0},caretMode:{value:"block",options:["block","underscore","line"]},caretBlinkRate:{value:2,min:.2,max:5,step:.1},horizontalPadding:{value:100,min:0,max:1e3,step:1},verticalPadding:{value:95,min:0,max:1e3,step:1}},{collapsed:!0}),Look:O({screenColor:{value:"#000000"},glowStrength:{value:.35,min:0,max:1,step:.01},curvature:{value:.06,min:0,max:.2,step:.001},vignette:{value:1.15,min:.5,max:2,step:.01}},{collapsed:!0}),Noise:O({noiseStrength:{value:.08,min:0,max:.4,step:.001},scanlineStrength:{value:.08,min:0,max:.3,step:.001},scanlineDensity:{value:900,min:200,max:2e3,step:10}},{collapsed:!0}),Roll:O({rollSpeed:{value:.4,min:0,max:2,step:.01},rollStrength:{value:0,min:0,max:2,step:.01}},{collapsed:!0}),Chroma:O({chromaOffset:{value:.0025,min:0,max:.01,step:1e-4}},{collapsed:!0})},{collapsed:!0}),a=K("Ascii",{Text:O({screenText:{value:dr,rows:!0},fontSize:{value:6,min:0,max:48,step:1},fontName:{value:"Press Start 2P",options:De},fontColor:{value:"#ff0000"},showCaret:{value:!1},caretMode:{value:"block",options:["block","underscore","line"]},caretBlinkRate:{value:2,min:.2,max:5,step:.1},horizontalPadding:{value:208,min:0,max:1e3,step:1},verticalPadding:{value:0,min:0,max:1e3,step:1}},{collapsed:!0}),Look:O({screenColor:{value:"#000000"},glowStrength:{value:.35,min:0,max:1,step:.01},curvature:{value:.06,min:0,max:.2,step:.001},vignette:{value:1.15,min:.5,max:2,step:.01}},{collapsed:!0}),Noise:O({noiseStrength:{value:.08,min:0,max:.4,step:.001},scanlineStrength:{value:.08,min:0,max:.3,step:.001},scanlineDensity:{value:900,min:200,max:2e3,step:10}},{collapsed:!0}),Roll:O({rollSpeed:{value:.4,min:0,max:2,step:.01},rollStrength:{value:0,min:0,max:2,step:.01}},{collapsed:!0}),Chroma:O({chromaOffset:{value:.0025,min:0,max:.01,step:1e-4}},{collapsed:!0})},{collapsed:!0}),o=K("HomeVideo",{webcamFacing:fr(),padX:{value:.06,min:0,max:.25,step:.001},padY:{value:.08,min:0,max:.25,step:.001},curvature:{value:.12,min:0,max:.4,step:.001},vignette:{value:.75,min:.3,max:1.2,step:.001},staticAmount:{value:.35,min:0,max:1,step:.001},staticScale:{value:700,min:50,max:2e3,step:1},staticSpeed:{value:9,min:0,max:30,step:.01},snap:{value:24,min:1,max:60,step:1},spotNoise:{value:.35,min:0,max:1,step:.001},thermalDrift:{value:.15,min:0,max:1,step:.001},glitchRate:{value:.18,min:0,max:1,step:.001},flybackStrength:{value:.35,min:0,max:1,step:.001},retraceStrength:{value:.35,min:0,max:1,step:.001},humStrength:{value:.25,min:0,max:1,step:.001},breathStrength:{value:.35,min:0,max:1,step:.001},scanlineStrength:{value:.55,min:0,max:1,step:.001},beamWidth:{value:.5,min:0,max:1,step:.001},bloomStrength:{value:.25,min:0,max:1,step:.001},colorBleed:{value:.14,min:0,max:.5,step:.001},chromaDrift:{value:.3,min:0,max:1,step:.001},convergenceDrift:{value:.4,min:0,max:1,step:.001},barrelConvergence:{value:.6,min:0,max:2,step:.001},maskStrength:{value:.35,min:0,max:1,step:.001},maskMode:{value:0,options:{Triad:0,Aperture:1}}},{collapsed:!0}),u=K("TV",{padX:{value:.06,min:0,max:.25,step:.001},padY:{value:.08,min:0,max:.25,step:.001},curvature:{value:.12,min:0,max:.4,step:.001},vignette:{value:.75,min:.3,max:1.2,step:.001},staticAmount:{value:.35,min:0,max:1,step:.001},staticScale:{value:700,min:50,max:2e3,step:1},staticSpeed:{value:9,min:0,max:30,step:.01},snap:{value:24,min:1,max:60,step:1},spotNoise:{value:.35,min:0,max:1,step:.001},thermalDrift:{value:.15,min:0,max:1,step:.001},glitchRate:{value:.18,min:0,max:1,step:.001},flybackStrength:{value:.35,min:0,max:1,step:.001},retraceStrength:{value:.35,min:0,max:1,step:.001},humStrength:{value:.25,min:0,max:1,step:.001},breathStrength:{value:.35,min:0,max:1,step:.001},scanlineStrength:{value:.55,min:0,max:1,step:.001},beamWidth:{value:.5,min:0,max:1,step:.001},bloomStrength:{value:.25,min:0,max:1,step:.001},colorBleed:{value:.14,min:0,max:.5,step:.001},chromaDrift:{value:.3,min:0,max:1,step:.001},convergenceDrift:{value:.4,min:0,max:1,step:.001},barrelConvergence:{value:.6,min:0,max:2,step:.001},maskStrength:{value:.35,min:0,max:1,step:.001},maskMode:{value:0,options:{Triad:0,Aperture:1}}},{collapsed:!0}),s=K("Scene In Scene",{Render:O({resolution:{value:1024,min:256,max:2048,step:256}},{collapsed:!0}),Static:O({staticAmount:{value:.12,min:0,max:.5,step:.001},staticScale:{value:600,min:50,max:2e3,step:10},staticSpeed:{value:6,min:0,max:20,step:.1}},{collapsed:!0}),CRT:O({scanlineStrength:{value:.4,min:0,max:1,step:.01},curvature:{value:.12,min:0,max:.4,step:.005},vignette:{value:.85,min:.4,max:1.2,step:.005},chromaDrift:{value:.25,min:0,max:1,step:.005}},{collapsed:!0}),Post:O({bloom:{value:.25,min:0,max:2,step:.01}},{collapsed:!0})},{collapsed:!0}),l=K("Picture In Picture",{Render:O({resolution:{value:1024,min:256,max:2048,step:256}},{collapsed:!0}),Feedback:O({decay:{value:.85,min:.7,max:.97,step:.001},zoom:{value:1.01,min:1,max:1.05,step:5e-4},warp:{value:.6,min:0,max:2,step:.01}},{collapsed:!0}),CRT:O({staticAmount:{value:.04,min:0,max:.25,step:.001},scanlineStrength:{value:.4,min:0,max:1,step:.01},curvature:{value:.12,min:0,max:.4,step:.005},vignette:{value:.85,min:.4,max:1.2,step:.005}},{collapsed:!0})},{collapsed:!0});return{smtpe:e,tvStatic:t,noSignal:r,terminal:n,ascii:a,homeVideo:o,tv:u,threeD:s,pip:l}}function N(e){switch(e){case"static":case"smtpe":return{type:"file",url:Fe("tv-static.mp3"),loop:!0};case"homeVideo":return{type:"file",url:Fe("laugh-track.mp3"),loop:!0};case"tv":return{type:"file",url:Fe("ren-and-stimpy.mp3"),loop:!0};case"threeD":return{type:"strudel",code:Ze.threeD};case"pip":return{type:"strudel",code:Ze.weirderStuff};default:return null}}function kn(){return{key:"off",video:C.jsx("meshStandardMaterial",{color:"#111111",roughness:0,metalness:1},"off"),audio:null}}function Ln(){return Mn()}function Gn(e){return w.useMemo(()=>[kn(),...e],[e])}function zn(e){const{ascii:t,homeVideo:r,noSignal:n,pip:a,smtpe:o,terminal:u,threeD:s,tv:l,tvStatic:i}=e;return w.useMemo(()=>[{key:"static",video:C.jsx(ar,{...i},"static"),audio:N("static")},{key:"smtpe",video:C.jsx(Or,{...o},"smtpe"),audio:N("smtpe")},{key:"vhs",video:C.jsx(Pe,{...Ft,...n,horizontalPadding:100,verticalPadding:95},"vhs"),audio:N("vhs")},{key:"terminal",video:C.jsx(Pe,{...Bt,...u,horizontalPadding:100,verticalPadding:95},"terminal"),audio:N("terminal")},{key:"ascii",video:C.jsx(Pe,{...t},"ascii"),audio:N("ascii")},{key:"homeVideo",video:C.jsx(qe,{useWebcam:!0,...r},"homeVideo"),audio:N("homeVideo")},{key:"tv",video:C.jsx(qe,{...l},"tv"),audio:N("tv")},{key:"threeD",video:C.jsx(Fr,{scene:C.jsx(zt,{}),...s},"threeD"),audio:N("threeD")},{key:"pip",video:C.jsx(Cr,{...a},"pip"),audio:N("pip")}],[t,r,n,a,o,u,s,l,i])}function Hn(e){const{ascii:t,homeVideo:r,noSignal:n,pip:a,smtpe:o,terminal:u,threeD:s,tv:l,tvStatic:i}=e;return w.useMemo(()=>[{key:"static",video:C.jsx(Tn,{...i},"static"),audio:N("static")},{key:"smtpe",video:C.jsx(yn,{...o},"smtpe"),audio:N("smtpe")},{key:"vhs",video:C.jsx(_e,{...Ft,...n,horizontalPadding:100,verticalPadding:95},"vhs"),audio:N("vhs")},{key:"terminal",video:C.jsx(_e,{...Bt,...u,horizontalPadding:100,verticalPadding:95},"terminal"),audio:N("terminal")},{key:"ascii",video:C.jsx(_e,{...t},"ascii"),audio:N("ascii")},{key:"homeVideo",video:C.jsx(Je,{useWebcam:!0,...r},"homeVideo"),audio:N("homeVideo")},{key:"tv",video:C.jsx(Je,{...l},"tv"),audio:N("tv")},{key:"threeD",video:C.jsx(xn,{scene:C.jsx(zt,{}),...s},"threeD"),audio:N("threeD")},{key:"pip",video:C.jsx(dn,{...a},"pip"),audio:N("pip")}],[t,r,n,a,o,u,s,l,i])}export{Wn as C,zn as a,Gn as b,Vn as c,Hn as d,Ln as u};
