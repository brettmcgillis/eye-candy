import{cX as f,d6 as Q,bP as ie,bd as le,cL as se,d0 as j,cT as l,a6 as L,u as ee,ax as N,x as K,z as ce,cO as W,cy as I,d7 as me,cu as ve,bO as te,aE as fe,c$ as V,cP as S,cE as _}from"./index-CGUqMB6g.js";import{S as Z}from"./tracks-DQtmcKVK.js";import{s as G}from"./shaderMaterial-BhgMlBg4.js";import{_ as de}from"./extends-CF3RwP-h.js";import{u as he}from"./Fbo-Dw9nwII5.js";import{C as pe}from"./crtStaticMaterial-DBmPKnSd.js";import{B as ge}from"./Bret-CI_-fgU4.js";import{I as Se}from"./Reversal-CA37BhB6.js";import{P as xe}from"./PerspectiveCamera-DNnzLs3x.js";const be=f.forwardRef(({children:e,compute:t,width:u,height:n,samples:s=8,renderPriority:c=0,eventPriority:i=0,frames:o=1/0,stencilBuffer:m=!1,depthBuffer:a=!0,generateMipmaps:r=!1,...p},h)=>{const{size:v,viewport:d}=Q(),g=he((u||v.width)*d.dpr,(n||v.height)*d.dpr,{samples:s,stencilBuffer:m,depthBuffer:a,generateMipmaps:r}),[x]=f.useState(()=>new ie),M=f.useCallback((R,B,C)=>{var T,w;let y=(T=g.texture)==null||(T=T.__r3f.parent)==null?void 0:T.object;for(;y&&!(y instanceof le);){var E;y=(E=y.__r3f.parent)==null?void 0:E.object}if(!y)return!1;C.raycaster.camera||C.events.compute(R,C,(w=C.previousRoot)==null?void 0:w.getState());const[F]=C.raycaster.intersectObject(y);if(!F)return!1;const U=F.uv;if(!U)return!1;B.raycaster.setFromCamera(B.pointer.set(U.x*2-1,U.y*2-1),B.camera)},[]);return f.useImperativeHandle(h,()=>g.texture,[g]),f.createElement(f.Fragment,null,se(f.createElement(Ce,{renderPriority:c,frames:o,fbo:g},e,f.createElement("group",{onPointerOver:()=>null})),x,{events:{compute:t||M,priority:i}}),f.createElement("primitive",de({object:g.texture},p)))});function Ce({frames:e,renderPriority:t,children:u,fbo:n}){let s=0,c,i,o,m;return j(a=>{(e===1/0||s<e)&&(c=a.gl.autoClear,i=a.gl.xr.enabled,o=a.gl.getRenderTarget(),m=a.gl.xr.isPresenting,a.gl.autoClear=!0,a.gl.xr.enabled=!1,a.gl.xr.isPresenting=!1,a.gl.setRenderTarget(n),a.gl.render(a.scene,a.camera),a.gl.setRenderTarget(o),a.gl.autoClear=c,a.gl.xr.enabled=i,a.gl.xr.isPresenting=m,s++)},t),f.createElement(f.Fragment,null,u)}function mt({color:e="#111111",metalness:t=.2,position:u=[0,-.02,0],roughness:n=.92,rotation:s=[-Math.PI/2,0,0],size:c=30}){return l.jsxs("mesh",{position:u,rotation:s,receiveShadow:!0,children:[l.jsx("planeGeometry",{args:[c,c]}),l.jsx("meshStandardMaterial",{color:e,metalness:t,roughness:n})]})}function vt({boardColor:e="#7a5337",boardMetalness:t=.03,boardRoughness:u=.92,panels:n,columns:s=3,panelHeight:c=2,panelWidth:i=2,spacingX:o=3.3,spacingZ:m=2.8}){const a=Math.ceil(n.length/s),r=(s-1)/2,p=(a-1)/2;return l.jsx("group",{children:n.map((h,v)=>{const d=v%s,g=Math.floor(v/s),x=(d-r)*o,M=(g-p)*m,R=(d-r)*.025;return l.jsxs("group",{position:[x,.08,M],rotation:[-Math.PI/2,0,R],children:[l.jsxs("mesh",{castShadow:!0,receiveShadow:!0,children:[l.jsx("boxGeometry",{args:[i+.48,c+.48,.16]}),l.jsx("meshStandardMaterial",{color:e,metalness:t,roughness:u})]}),l.jsxs("mesh",{position:[0,0,.081],children:[l.jsx("planeGeometry",{args:[i,c]}),h.video]})]},h.key)})})}const Te=`
                                                                                                    
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
                                                                                                    
`,ye=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Me=`
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
`,ae=G({uTime:0,uTextTexture:null,uScreenColor:new ce(.05,.18,.85),uNoiseStrength:.08,uGlowStrength:.35,uCurvature:.06,uVignette:.85,uScanlineStrength:.08,uScanlineDensity:900,uRollSpeed:.4,uRollStrength:.4,uChromaOffset:.0025},ye,Me);W({CrtBlueScreenMaterial:ae});function ke(e,t,u,n,s,c){const i=t.split("");let o="";const m=[];return i.forEach(a=>{if(a===`
`)m.push(o),o="";else{const r=o+a;e.measureText(r).width>s&&o?(m.push(o),o=a):o=r}}),o&&m.push(o),m.forEach((a,r)=>{e.fillText(a,u,n+r*c)}),{lines:m,y:n+(m.length-1)*c}}function Re({canvas:e,text:t,font:u,fontSize:n,fontColor:s,showCaret:c,caretMode:i,horizontalPadding:o,verticalPadding:m}){const a=e.getContext("2d");a.clearRect(0,0,e.width,e.height),a.font=u,a.fillStyle=s,a.textBaseline="top";const r=n*1.3,p=e.width-o*2,{lines:h,y:v}=ke(a,t,o,m,p,r);if(c&&h.length){const d=h[h.length-1],g=a.measureText(d),x=o+g.width+4,M=g.actualBoundingBoxAscent+g.actualBoundingBoxDescent||n;i==="underscore"?a.fillRect(x,v+n*1.05,n*.8,3):i==="line"?a.fillRect(x,v+2,Math.max(4,n*.08),M):a.fillRect(x,v+2,n*.6,M)}}function Be(){const e=document.createElement("canvas");e.width=1024,e.height=512;const t=new ee(e);return t.minFilter=N,t.magFilter=N,t.wrapS=K,t.wrapT=K,{canvas:e,texture:t}}const we={screenText:`12:00 FEB. 28, 1986\r
<< REWIND`,fontSize:28,fontName:"Press Start 2P",fontColor:"#FFFFFF",showCaret:!1,caretMode:"block",caretBlinkRate:2,horizontalPadding:48,verticalPadding:40,screenColor:"#0b2fd8",glowStrength:.35,curvature:.06,vignette:1.15,noiseStrength:.08,scanlineStrength:.08,scanlineDensity:900,rollSpeed:.4,rollStrength:0,chromaOffset:.0025},Ae={screenText:`USERNAME: @ruinedpaintings
PASSWORD: ********`,fontSize:28,fontName:"Press Start 2P",fontColor:"#48ff00",showCaret:!0,caretMode:"block",caretBlinkRate:2,horizontalPadding:48,verticalPadding:40,screenColor:"#000000",glowStrength:.35,curvature:.06,vignette:1.15,noiseStrength:.08,scanlineStrength:.08,scanlineDensity:900,rollSpeed:.4,rollStrength:0,chromaOffset:.0025};function H({screenText:e="12:00 FEB. 28, 1986",fontSize:t=28,fontName:u="Press Start 2P",fontColor:n="#FFFFFF",horizontalPadding:s=48,verticalPadding:c=40,showCaret:i=!1,caretMode:o="block",caretBlinkRate:m=2,screenColor:a="#0b2fd8",glowStrength:r=.35,curvature:p=.06,vignette:h=1.15,noiseStrength:v=.08,scanlineStrength:d=.08,scanlineDensity:g=900,rollSpeed:x=.4,rollStrength:M=0,chromaOffset:R=.0025,side:B=L}){const C=f.useRef(),T=f.useRef(0),w=f.useRef(!0),{canvas:y,texture:E}=f.useMemo(Be,[]),F=`${t}px "${u}"`,U=A=>{Re({canvas:y,text:e,font:F,fontSize:t,fontColor:n,showCaret:i&&A,caretMode:o||"block",horizontalPadding:s,verticalPadding:c}),E.needsUpdate=!0};return f.useEffect(()=>{U(!0)},[e,F,n,s,c,i,o]),j((A,P)=>{C.current&&(C.current.uTime+=P,i&&(T.current+=P,T.current>=1/Math.max(m,.001)&&(T.current=0,w.current=!w.current,U(w.current))))}),l.jsx("crtBlueScreenMaterial",{ref:C,side:B,toneMapped:!1,uTextTexture:E,uScreenColor:a,uNoiseStrength:v,uGlowStrength:r,uCurvature:p,uVignette:h,uScanlineStrength:d,uScanlineDensity:g,uRollSpeed:x,uRollStrength:M,uChromaOffset:R},ae.key)}const De=`
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`,Fe=`
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
`,Pe=G({uScene:null,uFeedback:null,uTime:0,uDecay:.85,uZoom:1.01,uWarp:.6,uStaticAmount:.04,uScanlineStrength:.4,uCurvature:.12,uVignette:.85},De,Fe);W({CrtAccumMaterial:Pe});function Ve({resolution:e=1024,decay:t=.85,zoom:u=1.01,warp:n=.6,staticAmount:s=.04,scanlineStrength:c=.4,curvature:i=.12,vignette:o=.85,side:m=L}){const a=f.useRef(),{gl:r,scene:p,camera:h}=Q(),v=f.useMemo(()=>new I(e,e),[e]),d=f.useMemo(()=>new I(e,e),[e]),g=f.useMemo(()=>new I(e,e),[e]),x=f.useRef(!1);return j((M,R)=>{if(!a.current)return;a.current.uTime+=R;const B=r.getRenderTarget();r.setRenderTarget(v),r.clear(),r.render(p,h);const C=x.current?d:g,T=x.current?g:d;a.current.uScene=v.texture,a.current.uFeedback=C.texture,r.setRenderTarget(T),r.clear(),r.render(p,h),r.setRenderTarget(B),x.current=!x.current,a.current.uFeedback=T.texture}),l.jsx("crtAccumMaterial",{ref:a,side:m,uDecay:t,uZoom:u,uWarp:n,uStaticAmount:s,uScanlineStrength:c,uCurvature:i,uVignette:o,toneMapped:!1})}const Ee=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Ue=`
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
`,je=G({uMap:null,uTime:0,uStaticAmount:.1,uStaticScale:600,uStaticSpeed:6,uScanlineStrength:.4,uCurvature:.12,uVignette:.85,uChromaDrift:.25,uBloom:.25},Ee,Ue);W({CrtSceneShaderMaterial:je});function Ne({scene:e,resolution:t=1024,staticAmount:u=.12,staticScale:n=600,staticSpeed:s=6,scanlineStrength:c=.4,curvature:i=.12,vignette:o=.85,chromaDrift:m=.25,bloom:a=.25,side:r=L}){const p=f.useRef();return j((h,v)=>{p.current&&(p.current.uTime+=v)}),l.jsx("crtSceneShaderMaterial",{ref:p,side:r,uStaticAmount:u,uStaticScale:n,uStaticSpeed:s,uScanlineStrength:c,uCurvature:i,uVignette:o,uChromaDrift:m,uBloom:a,toneMapped:!1,children:l.jsx(be,{attach:"uMap",frames:1/0,width:t,height:t,anisotropy:8,children:e})})}const Le=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,We=`
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
`,re=G({uTime:0,uTexture:null,uStaticAmount:0,uStaticScale:0,uStaticSpeed:0,uSnap:0,uGlitchRate:0,uScanlineStrength:0,uColorBleed:0,uCurvature:0,uVignette:0,uMaskStrength:0,uFlyback:0,uConverge:0,uBloom:0,uBreath:0,uRetrace:0,uBeamWidth:0,uChromaDrift:0,uHum:0,uThermalDrift:0,uSpotNoise:0,uMaskMode:0,uBarrelConverge:0,uPadX:0,uPadY:0},Le,We);W({CrtShowMaterial:re});function q({src:e=me("ren_and_stimpy.mp4"),useWebcam:t=!1,padX:u=.06,padY:n=.08,staticAmount:s=.35,staticScale:c=700,staticSpeed:i=9,snap:o=24,glitchRate:m=.18,scanlineStrength:a=.55,colorBleed:r=.14,curvature:p=.12,vignette:h=.75,maskStrength:v=.35,flybackStrength:d=.35,convergenceDrift:g=.4,bloomStrength:x=.25,breathStrength:M=.35,retraceStrength:R=.35,beamWidth:B=.5,chromaDrift:C=.3,humStrength:T=.25,barrelConvergence:w=.6,spotNoise:y=.35,thermalDrift:E=.15,maskMode:F=0,side:U=L}){const A=f.useRef();return f.useEffect(()=>{if(!A.current)return;let P=null,O=!1;const k=document.createElement("video");k.crossOrigin="anonymous",k.loop=!0,k.muted=!0,k.playsInline=!0,k.autoplay=!0;const $=()=>{if(O)return;const b=new ve(k);b.colorSpace=te,b.minFilter=N,b.magFilter=N,b.generateMipmaps=!1,A.current.uTexture=b},z=async()=>{try{k.src=e,await k.play(),$()}catch(b){console.error("[CRTShowMaterial] Video failed to play:",b)}};return t?(async()=>{try{const b=navigator,X=b.mediaDevices?.getUserMedia||b.getUserMedia||b.webkitGetUserMedia||b.mozGetUserMedia;if(!X)throw new Error("getUserMedia not supported on this device");b.mediaDevices?.getUserMedia?P=await b.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!1}):P=await new Promise((oe,ue)=>{X.call(b,{video:!0,audio:!1},oe,ue)}),k.srcObject=P,await k.play(),$()}catch(b){console.warn("[CRTShowMaterial] Webcam failed, falling back to video:",b),z()}})():z(),()=>{O=!0,P&&P.getTracks().forEach(b=>b.stop()),A.current?.uTexture&&A.current.uTexture.dispose(),k.pause(),k.remove()}},[e,t]),j((P,O)=>{A.current&&(A.current.uTime+=O)}),l.jsx("crtShowMaterial",{ref:A,side:U,toneMapped:!1,uPadX:u,uPadY:n,uStaticAmount:s,uStaticScale:c,uStaticSpeed:i,uSnap:o,uGlitchRate:m,uScanlineStrength:a,uColorBleed:r,uCurvature:p,uVignette:h,uMaskStrength:v,uFlyback:d,uConverge:g,uBloom:x,uBreath:M,uRetrace:R,uBeamWidth:B,uChromaDrift:C,uHum:T,uThermalDrift:E,uSpotNoise:y,uMaskMode:F,uBarrelConverge:w},re.key)}const Ge=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Oe=`
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
`,ne=G({uTime:0,uStaticAmount:0,uStaticScale:0,uStaticSpeed:0,uSnap:0,uGlitchRate:0,uScanlineStrength:0,uColorBleed:0,uCurvature:0,uVignette:0,uMaskStrength:0,uFlyback:0,uConverge:0,uBloom:0,uBreath:0,uRetrace:0,uBeamWidth:0,uChromaDrift:0,uHum:0,uThermalDrift:0,uSpotNoise:0,uMaskMode:0,uBarrelConverge:0},Ge,Oe);W({CrtSmtpeStaticMaterial:ne});function Ie({staticAmount:e=.35,staticScale:t=700,staticSpeed:u=9,snap:n=24,glitchRate:s=.18,scanlineStrength:c=.55,colorBleed:i=.14,curvature:o=.12,vignette:m=.75,maskStrength:a=.35,flybackStrength:r=.35,convergenceDrift:p=.4,bloomStrength:h=.25,breathStrength:v=.35,retraceStrength:d=.35,beamWidth:g=.5,chromaDrift:x=.3,humStrength:M=.25,barrelConvergence:R=.6,spotNoise:B=.35,thermalDrift:C=.15,maskMode:T=0,side:w=L}){const y=f.useRef();return j((E,F)=>{y.current&&(y.current.uTime+=F)}),l.jsx("crtSmtpeStaticMaterial",{ref:y,side:w,transparent:!1,depthWrite:!0,toneMapped:!1,uStaticAmount:e,uStaticScale:t,uStaticSpeed:u,uSnap:n,uGlitchRate:s,uScanlineStrength:c,uColorBleed:i,uCurvature:o,uVignette:m,uMaskStrength:a,uFlyback:r,uConverge:p,uBloom:h,uBreath:v,uRetrace:d,uBeamWidth:g,uChromaDrift:x,uHum:M,uThermalDrift:C,uSpotNoise:B,uMaskMode:T,uBarrelConverge:R},ne.key)}function _e({count:e=4,radius:t=2,speed:u=.25}){const n=f.useRef(),s=Math.PI*2/e;return j((c,i)=>{n.current.rotation.y+=i*u}),l.jsx("group",{ref:n,children:Array.from({length:e}).map((c,i)=>{const o=i*s,m=Math.sin(o)*t,a=Math.cos(o)*t;return l.jsx(Se,{position:[m,0,a],rotation:[0,o,0]},i)})})}function He(){return l.jsxs(f.Suspense,{fallback:l.jsx(fe,{}),children:[l.jsx(xe,{makeDefault:!0,position:[0,0,3]}),l.jsx("color",{attach:"background",args:["#646464"]}),l.jsx("ambientLight",{intensity:.3}),l.jsx("directionalLight",{position:[5,6,4],intensity:1.2}),l.jsx(_e,{count:6,radius:1.2,speed:.6}),l.jsx(ge,{scale:1.5,position:[0,.05,0],rotation:[0,0,0]})]})}const Y=["Arial Black","Arial","Verdana","Tahoma","Trebuchet MS","Impact","Courier New","Lucida Console","Monaco","Consolas","Menlo","Orbitron","VT323","Press Start 2P","monospace","sans-serif","serif","terminal"];function Ye(){const e=V("CRT SMPTE RP-219",{staticAmount:{value:.35,min:0,max:1,step:.01},staticScale:{value:700,min:50,max:1400,step:1},staticSpeed:{value:9,min:.1,max:20,step:.1},snap:{value:24,min:1,max:60,step:1},glitchRate:{value:.18,min:0,max:1,step:.01},scanlineStrength:{value:.55,min:0,max:1,step:.01},colorBleed:{value:.14,min:0,max:.5,step:.01},curvature:{value:.12,min:0,max:.4,step:.01},vignette:{value:.75,min:.6,max:.98,step:.01},maskStrength:{value:.35,min:0,max:1,step:.01},flybackStrength:{value:.35,min:0,max:1,step:.01},convergenceDrift:{value:.4,min:0,max:1,step:.01},bloomStrength:{value:.25,min:0,max:1,step:.01},breathStrength:{value:.35,min:0,max:1,step:.01},retraceStrength:{value:.35,min:0,max:1,step:.01},beamWidth:{value:.5,min:0,max:1,step:.01},chromaDrift:{value:.3,min:0,max:1,step:.01},humStrength:{value:.25,min:0,max:1,step:.01},barrelConvergence:{value:.6,min:0,max:2,step:.01},spotNoise:{value:.35,min:0,max:1,step:.01},thermalDrift:{value:.15,min:0,max:1,step:.01},maskMode:{value:0,options:{shadow:0,grille:1}}},{collapsed:!0}),t=V("CRT Static",{snowAmount:{value:1,min:0,max:1},snowScale:{value:180,min:10,max:800},snowSpeed:{value:1,min:0,max:5},snowSize:{value:240,min:40,max:1e3},curvature:{value:.12,min:0,max:.4,step:.01},vignette:{value:.75,min:.6,max:.98,step:.01},bandStrength:{value:.35,min:0,max:1},bandSpeed:{value:.6,min:0,max:3},bandScale:{value:8,min:1,max:40},snap:{value:24,min:1,max:60,step:1},rfStrength:{value:.25,min:0,max:1},rfScale:{value:22,min:2,max:80},rfSpeed:{value:.4,min:0,max:3}},{collapsed:!0}),u=V("No Signal",{Text:S({screenText:{value:`12:00 FEB. 28, 1986\r
INSERT VHS`,rows:!0},fontSize:{value:28,min:0,max:48,step:1},fontName:{value:"Press Start 2P",options:Y},fontColor:{value:"#FFFFFF"},showCaret:{value:!1},caretMode:{value:"block",options:["block","underscore","line"]},caretBlinkRate:{value:2,min:.2,max:5,step:.1},horizontalPadding:{value:100,min:0,max:1e3,step:1},verticalPadding:{value:95,min:0,max:1e3,step:1}},{collapsed:!0}),Look:S({screenColor:{value:"#0b2fd8"},glowStrength:{value:.35,min:0,max:1,step:.01},curvature:{value:.06,min:0,max:.2,step:.001},vignette:{value:1.15,min:.5,max:2,step:.01}},{collapsed:!0}),Noise:S({noiseStrength:{value:.08,min:0,max:.4,step:.001},scanlineStrength:{value:.08,min:0,max:.3,step:.001},scanlineDensity:{value:900,min:200,max:2e3,step:10}},{collapsed:!0}),Roll:S({rollSpeed:{value:.4,min:0,max:2,step:.01},rollStrength:{value:0,min:0,max:2,step:.01}},{collapsed:!0}),Chroma:S({chromaOffset:{value:.0025,min:0,max:.01,step:1e-4}},{collapsed:!0})},{collapsed:!0}),n=V("Terminal",{Text:S({screenText:{value:`a:\\> ||TERMINAL ERROR||\r
      - 0X666420 -\r
      DATA CORRUPTED\r
a:\\> FULL SYSTEM FAILURE
a:\\> INSERT BOOT DISK`,rows:!0},fontSize:{value:26,min:0,max:48,step:1},fontName:{value:"Press Start 2P",options:Y},fontColor:{value:"#48ff00"},showCaret:{value:!0},caretMode:{value:"block",options:["block","underscore","line"]},caretBlinkRate:{value:2,min:.2,max:5,step:.1},horizontalPadding:{value:100,min:0,max:1e3,step:1},verticalPadding:{value:95,min:0,max:1e3,step:1}},{collapsed:!0}),Look:S({screenColor:{value:"#000000"},glowStrength:{value:.35,min:0,max:1,step:.01},curvature:{value:.06,min:0,max:.2,step:.001},vignette:{value:1.15,min:.5,max:2,step:.01}},{collapsed:!0}),Noise:S({noiseStrength:{value:.08,min:0,max:.4,step:.001},scanlineStrength:{value:.08,min:0,max:.3,step:.001},scanlineDensity:{value:900,min:200,max:2e3,step:10}},{collapsed:!0}),Roll:S({rollSpeed:{value:.4,min:0,max:2,step:.01},rollStrength:{value:0,min:0,max:2,step:.01}},{collapsed:!0}),Chroma:S({chromaOffset:{value:.0025,min:0,max:.01,step:1e-4}},{collapsed:!0})},{collapsed:!0}),s=V("Ascii",{Text:S({screenText:{value:Te,rows:!0},fontSize:{value:6,min:0,max:48,step:1},fontName:{value:"Press Start 2P",options:Y},fontColor:{value:"#ff0000"},showCaret:{value:!1},caretMode:{value:"block",options:["block","underscore","line"]},caretBlinkRate:{value:2,min:.2,max:5,step:.1},horizontalPadding:{value:208,min:0,max:1e3,step:1},verticalPadding:{value:0,min:0,max:1e3,step:1}},{collapsed:!0}),Look:S({screenColor:{value:"#000000"},glowStrength:{value:.35,min:0,max:1,step:.01},curvature:{value:.06,min:0,max:.2,step:.001},vignette:{value:1.15,min:.5,max:2,step:.01}},{collapsed:!0}),Noise:S({noiseStrength:{value:.08,min:0,max:.4,step:.001},scanlineStrength:{value:.08,min:0,max:.3,step:.001},scanlineDensity:{value:900,min:200,max:2e3,step:10}},{collapsed:!0}),Roll:S({rollSpeed:{value:.4,min:0,max:2,step:.01},rollStrength:{value:0,min:0,max:2,step:.01}},{collapsed:!0}),Chroma:S({chromaOffset:{value:.0025,min:0,max:.01,step:1e-4}},{collapsed:!0})},{collapsed:!0}),c=V("HomeVideo",{padX:{value:.06,min:0,max:.25,step:.001},padY:{value:.08,min:0,max:.25,step:.001},curvature:{value:.12,min:0,max:.4,step:.001},vignette:{value:.75,min:.3,max:1.2,step:.001},staticAmount:{value:.35,min:0,max:1,step:.001},staticScale:{value:700,min:50,max:2e3,step:1},staticSpeed:{value:9,min:0,max:30,step:.01},snap:{value:24,min:1,max:60,step:1},spotNoise:{value:.35,min:0,max:1,step:.001},thermalDrift:{value:.15,min:0,max:1,step:.001},glitchRate:{value:.18,min:0,max:1,step:.001},flybackStrength:{value:.35,min:0,max:1,step:.001},retraceStrength:{value:.35,min:0,max:1,step:.001},humStrength:{value:.25,min:0,max:1,step:.001},breathStrength:{value:.35,min:0,max:1,step:.001},scanlineStrength:{value:.55,min:0,max:1,step:.001},beamWidth:{value:.5,min:0,max:1,step:.001},bloomStrength:{value:.25,min:0,max:1,step:.001},colorBleed:{value:.14,min:0,max:.5,step:.001},chromaDrift:{value:.3,min:0,max:1,step:.001},convergenceDrift:{value:.4,min:0,max:1,step:.001},barrelConvergence:{value:.6,min:0,max:2,step:.001},maskStrength:{value:.35,min:0,max:1,step:.001},maskMode:{value:0,options:{Triad:0,Aperture:1}}},{collapsed:!0}),i=V("TV",{padX:{value:.06,min:0,max:.25,step:.001},padY:{value:.08,min:0,max:.25,step:.001},curvature:{value:.12,min:0,max:.4,step:.001},vignette:{value:.75,min:.3,max:1.2,step:.001},staticAmount:{value:.35,min:0,max:1,step:.001},staticScale:{value:700,min:50,max:2e3,step:1},staticSpeed:{value:9,min:0,max:30,step:.01},snap:{value:24,min:1,max:60,step:1},spotNoise:{value:.35,min:0,max:1,step:.001},thermalDrift:{value:.15,min:0,max:1,step:.001},glitchRate:{value:.18,min:0,max:1,step:.001},flybackStrength:{value:.35,min:0,max:1,step:.001},retraceStrength:{value:.35,min:0,max:1,step:.001},humStrength:{value:.25,min:0,max:1,step:.001},breathStrength:{value:.35,min:0,max:1,step:.001},scanlineStrength:{value:.55,min:0,max:1,step:.001},beamWidth:{value:.5,min:0,max:1,step:.001},bloomStrength:{value:.25,min:0,max:1,step:.001},colorBleed:{value:.14,min:0,max:.5,step:.001},chromaDrift:{value:.3,min:0,max:1,step:.001},convergenceDrift:{value:.4,min:0,max:1,step:.001},barrelConvergence:{value:.6,min:0,max:2,step:.001},maskStrength:{value:.35,min:0,max:1,step:.001},maskMode:{value:0,options:{Triad:0,Aperture:1}}},{collapsed:!0}),o=V("Scene In Scene",{Render:S({resolution:{value:1024,min:256,max:2048,step:256}},{collapsed:!0}),Static:S({staticAmount:{value:.12,min:0,max:.5,step:.001},staticScale:{value:600,min:50,max:2e3,step:10},staticSpeed:{value:6,min:0,max:20,step:.1}},{collapsed:!0}),CRT:S({scanlineStrength:{value:.4,min:0,max:1,step:.01},curvature:{value:.12,min:0,max:.4,step:.005},vignette:{value:.85,min:.4,max:1.2,step:.005},chromaDrift:{value:.25,min:0,max:1,step:.005}},{collapsed:!0}),Post:S({bloom:{value:.25,min:0,max:2,step:.01}},{collapsed:!0})},{collapsed:!0}),m=V("Picture In Picture",{Render:S({resolution:{value:1024,min:256,max:2048,step:256}},{collapsed:!0}),Feedback:S({decay:{value:.85,min:.7,max:.97,step:.001},zoom:{value:1.01,min:1,max:1.05,step:5e-4},warp:{value:.6,min:0,max:2,step:.01}},{collapsed:!0}),CRT:S({staticAmount:{value:.04,min:0,max:.25,step:.001},scanlineStrength:{value:.4,min:0,max:1,step:.01},curvature:{value:.12,min:0,max:.4,step:.005},vignette:{value:.85,min:.4,max:1.2,step:.005}},{collapsed:!0})},{collapsed:!0});return{smtpe:e,tvStatic:t,noSignal:u,terminal:n,ascii:s,homeVideo:c,tv:i,threeD:o,pip:m}}const $e="700 76px 'VT323', 'Courier New', monospace",ze="600 34px 'Courier New', monospace";function Xe(e,t=.12,u=8){e.save(),e.fillStyle=`rgba(255, 255, 255, ${Math.min(Math.max(t,0),1)*.18})`;for(let n=0;n<e.canvas.height;n+=u)e.fillRect(0,n,e.canvas.width,Math.max(1,u/2));e.restore()}function Ke(e,t=.08){const u=Math.floor(1200+t*4200);e.save();for(let n=0;n<u;n+=1){const s=Math.random()*e.canvas.width,c=Math.random()*e.canvas.height,i=1+Math.random()*3,o=Math.floor(100+Math.random()*155);e.fillStyle=`rgba(${o}, ${o}, ${o}, ${.08+Math.random()*.3})`,e.fillRect(s,c,i,i)}e.restore()}function Ze(e,t="#ffffff"){e.save(),e.strokeStyle=t,e.lineWidth=18,e.strokeRect(22,22,e.canvas.width-44,e.canvas.height-44),e.lineWidth=4,e.strokeRect(46,46,e.canvas.width-92,e.canvas.height-92),e.restore()}function J(e,t){return typeof e!="string"?t:e.split(/\r?\n/).map(n=>n.trim()).find(Boolean)||t}function qe({accentColor:e="#38bdf8",backgroundColor:t="#050505",bars:u,label:n,noiseAmount:s=.04,overlayColor:c="#ffffff",scanlineStrength:i=.12,subLabel:o,variant:m="text"}){const a=document.createElement("canvas");a.width=1024,a.height=1024;const r=a.getContext("2d");r.fillStyle=t,r.fillRect(0,0,a.width,a.height);const p=r.createLinearGradient(0,0,a.width,a.height);if(p.addColorStop(0,"rgba(255, 255, 255, 0.05)"),p.addColorStop(1,"rgba(0, 0, 0, 0.22)"),r.fillStyle=p,r.fillRect(0,0,a.width,a.height),m==="bars"&&Array.isArray(u)&&u.length){const v=a.height*.56,d=a.width/u.length;u.forEach((g,x)=>{r.fillStyle=g,r.fillRect(x*d,88,d+2,v)}),r.fillStyle="#111111",r.fillRect(0,88+v,a.width,a.height-v-88),r.fillStyle="#d4d4d4",r.fillRect(88,a.height-230,180,76)}if(m==="feedback"){r.save(),r.strokeStyle=e,r.lineWidth=10;for(let v=0;v<6;v+=1){const d=120+v*56;r.globalAlpha=.85-v*.12,r.strokeRect(d,d,a.width-d*2,a.height-d*2)}r.restore()}if(m==="radial"){r.save();for(let v=0;v<14;v+=1){const d=.08+v*.03;r.strokeStyle=`rgba(255, 255, 255, ${d})`,r.lineWidth=3+v,r.beginPath(),r.arc(a.width/2,a.height/2,90+v*34,0,Math.PI*2),r.stroke()}r.restore()}Ke(r,s),Xe(r,i),Ze(r,e),r.save(),r.fillStyle=c,r.textAlign="center",r.font=$e,r.fillText(n,a.width/2,a.height*.66),o&&(r.font=ze,r.fillStyle="rgba(255, 255, 255, 0.82)",r.fillText(o,a.width/2,a.height*.76)),r.restore();const h=new ee(a);return h.colorSpace=te,h.generateMipmaps=!1,h.minFilter=N,h.magFilter=N,h.needsUpdate=!0,h}function Je(e){const t=f.useMemo(()=>qe(e),[e]);return f.useEffect(()=>()=>{t.dispose()},[t]),l.jsx("meshBasicMaterial",{map:t,toneMapped:!1})}function Qe(e,t){switch(e){case"static":return{accentColor:"#f5f5f5",backgroundColor:"#050505",label:"STATIC",noiseAmount:t.tvStatic.snowAmount,overlayColor:"#f5f5f5",scanlineStrength:t.tvStatic.bandStrength};case"smtpe":return{accentColor:"#f8fafc",backgroundColor:"#050505",bars:["#f8fafc","#facc15","#22d3ee","#22c55e","#f43f5e","#2563eb"],label:"SMPTE",noiseAmount:t.smtpe.staticAmount*.35,scanlineStrength:t.smtpe.scanlineStrength,subLabel:"webgpu placeholder",variant:"bars"};case"vhs":return{accentColor:t.noSignal.fontColor,backgroundColor:t.noSignal.screenColor,label:"INSERT VHS",noiseAmount:t.noSignal.noiseStrength,overlayColor:t.noSignal.fontColor,scanlineStrength:t.noSignal.scanlineStrength,subLabel:J(t.noSignal.screenText,"no signal")};case"terminal":return{accentColor:t.terminal.fontColor,backgroundColor:t.terminal.screenColor,label:"TERMINAL",noiseAmount:t.terminal.noiseStrength,overlayColor:t.terminal.fontColor,scanlineStrength:t.terminal.scanlineStrength,subLabel:J(t.terminal.screenText,"boot error")};case"ascii":return{accentColor:t.ascii.fontColor,backgroundColor:t.ascii.screenColor,label:"ASCII",noiseAmount:t.ascii.noiseStrength,overlayColor:t.ascii.fontColor,scanlineStrength:t.ascii.scanlineStrength,subLabel:"skull feed"};case"homeVideo":return{accentColor:"#f59e0b",backgroundColor:"#28150f",label:"HOME VIDEO",noiseAmount:t.homeVideo.staticAmount*.6,overlayColor:"#fde68a",scanlineStrength:t.homeVideo.scanlineStrength,subLabel:"webcam placeholder"};case"tv":return{accentColor:"#38bdf8",backgroundColor:"#0f172a",label:"TV FEED",noiseAmount:t.tv.staticAmount*.6,overlayColor:"#e0f2fe",scanlineStrength:t.tv.scanlineStrength,subLabel:"show placeholder"};case"threeD":return{accentColor:"#f472b6",backgroundColor:"#120916",label:"3D TEST",noiseAmount:t.threeD.staticAmount,overlayColor:"#f5d0fe",scanlineStrength:t.threeD.scanlineStrength,subLabel:"scene placeholder",variant:"radial"};default:return{accentColor:"#67e8f9",backgroundColor:"#082f49",label:"PIP",noiseAmount:t.pip.staticAmount,overlayColor:"#cffafe",scanlineStrength:t.pip.scanlineStrength,subLabel:"feedback placeholder",variant:"feedback"}}}function D(e){switch(e){case"static":case"smtpe":return{type:"file",url:_("tv-static.mp3"),loop:!0};case"homeVideo":return{type:"file",url:_("laugh-track.mp3"),loop:!0};case"tv":return{type:"file",url:_("ren-and-stimpy.mp3"),loop:!0};case"threeD":return{type:"strudel",code:Z.threeD};case"pip":return{type:"strudel",code:Z.weirderStuff};default:return null}}function et(){return{key:"off",video:l.jsx("meshStandardMaterial",{color:"#111111",roughness:0,metalness:1},"off"),audio:null}}function ft(){return Ye()}function dt(e){return f.useMemo(()=>[et(),...e],[e])}function ht(e){const{ascii:t,homeVideo:u,noSignal:n,pip:s,smtpe:c,terminal:i,threeD:o,tv:m,tvStatic:a}=e;return f.useMemo(()=>[{key:"static",video:l.jsx(pe,{...a},"static"),audio:D("static")},{key:"smtpe",video:l.jsx(Ie,{...c},"smtpe"),audio:D("smtpe")},{key:"vhs",video:l.jsx(H,{...we,...n,horizontalPadding:100,verticalPadding:95},"vhs"),audio:D("vhs")},{key:"terminal",video:l.jsx(H,{...Ae,...i,horizontalPadding:100,verticalPadding:95},"terminal"),audio:D("terminal")},{key:"ascii",video:l.jsx(H,{...t},"ascii"),audio:D("ascii")},{key:"homeVideo",video:l.jsx(q,{useWebcam:!0,...u},"homeVideo"),audio:D("homeVideo")},{key:"tv",video:l.jsx(q,{...m},"tv"),audio:D("tv")},{key:"threeD",video:l.jsx(Ne,{scene:l.jsx(He,{}),...o},"threeD"),audio:D("threeD")},{key:"pip",video:l.jsx(Ve,{...s},"pip"),audio:D("pip")}],[t,u,n,s,c,i,o,m,a])}function pt(e){return f.useMemo(()=>["static","smtpe","vhs","terminal","ascii","homeVideo","tv","threeD","pip"].map(t=>({key:t,video:l.jsx(Je,{...Qe(t,e)},t),audio:D(t)})),[e])}export{vt as C,mt as a,dt as b,ht as c,pt as d,ft as u};
