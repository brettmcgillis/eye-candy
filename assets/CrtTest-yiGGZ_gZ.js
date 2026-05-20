import{r as t,n as de,aZ as Ee,R as Ie,cM as Ge,o as Y,j as e,t as Q,aO as _e,ag as oe,af as me,p as Oe,m as ee,W as ue,cU as Ne,cV as Le,aG as We,cW as Ke,bZ as $,cX as Ye,cY as He,aJ as pe,aI as X,aK as z,E as K,K as F,cZ as ze}from"./index-DgCstozZ.js";import{S as ve,u as $e}from"./tracks-CL-_oUyv.js";import{s as te}from"./shaderMaterial-C8Ra7DId.js";import{_ as Xe}from"./extends-CF3RwP-h.js";import{u as Ze}from"./Fbo-RuMo30ea.js";import{C as he}from"./crtStaticMaterial-Dha7RJqu.js";import{B as qe}from"./Bret-Cthdu2JD.js";import{I as xe,R as fe}from"./Reversal-IbAG6j14.js";import{P as ge}from"./PerspectiveCamera-zJQA1Nu4.js";import{a as Se}from"./react-spring_three.modern-D8ECXTwb.js";import{u as be}from"./Gltf-BE0cfgKV.js";import{M as Je}from"./Instances-BmhhaK6G.js";import{O as Qe}from"./OrbitControls-uU43kjiE.js";import{E as et}from"./Environment-Cor3VOPm.js";import{M as tt}from"./MeshReflectorMaterial-Dm72SAkg.js";import"./constants-Bd-CkakT.js";import"./deprecated-CtTvmxFP.js";import"./constants-Bn3MWIGv.js";const at=t.forwardRef(({children:r,compute:u,width:p,height:c,samples:s=8,renderPriority:v=0,eventPriority:l=0,frames:i=1/0,stencilBuffer:f=!1,depthBuffer:a=!0,generateMipmaps:m=!1,...b},w)=>{const{size:x,viewport:T}=de(),S=Ze((p||x.width)*T.dpr,(c||x.height)*T.dpr,{samples:s,stencilBuffer:f,depthBuffer:a,generateMipmaps:m}),[d]=t.useState(()=>new Ee),k=t.useCallback((M,y,R)=>{var g,n;let C=(g=S.texture)==null||(g=g.__r3f.parent)==null?void 0:g.object;for(;C&&!(C instanceof Ie);){var h;C=(h=C.__r3f.parent)==null?void 0:h.object}if(!C)return!1;R.raycaster.camera||R.events.compute(M,R,(n=R.previousRoot)==null?void 0:n.getState());const[A]=R.raycaster.intersectObject(C);if(!A)return!1;const V=A.uv;if(!V)return!1;y.raycaster.setFromCamera(y.pointer.set(V.x*2-1,V.y*2-1),y.camera)},[]);return t.useImperativeHandle(w,()=>S.texture,[S]),t.createElement(t.Fragment,null,Ge(t.createElement(rt,{renderPriority:v,frames:i,fbo:S},r,t.createElement("group",{onPointerOver:()=>null})),d,{events:{compute:u||k,priority:l}}),t.createElement("primitive",Xe({object:S.texture},b)))});function rt({frames:r,renderPriority:u,children:p,fbo:c}){let s=0,v,l,i,f;return Y(a=>{(r===1/0||s<r)&&(v=a.gl.autoClear,l=a.gl.xr.enabled,i=a.gl.getRenderTarget(),f=a.gl.xr.isPresenting,a.gl.autoClear=!0,a.gl.xr.enabled=!1,a.gl.xr.isPresenting=!1,a.gl.setRenderTarget(c),a.gl.render(a.scene,a.camera),a.gl.setRenderTarget(i),a.gl.autoClear=v,a.gl.xr.enabled=l,a.gl.xr.isPresenting=f,s++)},u),t.createElement(t.Fragment,null,p)}const nt=`
                                                                                                    
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
                                                                                                    
`,ot=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,it=`
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
`,Ce=te({uTime:0,uTextTexture:null,uScreenColor:new Oe(.05,.18,.85),uNoiseStrength:.08,uGlowStrength:.35,uCurvature:.06,uVignette:.85,uScanlineStrength:.08,uScanlineDensity:900,uRollSpeed:.4,uRollStrength:.4,uChromaOffset:.0025},ot,it);ee({CrtBlueScreenMaterial:Ce});function ut(r,u,p,c,s,v){const l=u.split("");let i="";const f=[];return l.forEach(a=>{if(a===`
`)f.push(i),i="";else{const m=i+a;r.measureText(m).width>s&&i?(f.push(i),i=a):i=m}}),i&&f.push(i),f.forEach((a,m)=>{r.fillText(a,p,c+m*v)}),{lines:f,y:c+(f.length-1)*v}}function st({canvas:r,text:u,font:p,fontSize:c,fontColor:s,showCaret:v,caretMode:l,horizontalPadding:i,verticalPadding:f}){const a=r.getContext("2d");a.clearRect(0,0,r.width,r.height),a.font=p,a.fillStyle=s,a.textBaseline="top";const m=c*1.3,b=r.width-i*2,{lines:w,y:x}=ut(a,u,i,f,b,m);if(v&&w.length){const T=w[w.length-1],S=a.measureText(T),d=i+S.width+4,k=S.actualBoundingBoxAscent+S.actualBoundingBoxDescent||c;l==="underscore"?a.fillRect(d,x+c*1.05,c*.8,3):l==="line"?a.fillRect(d,x+2,Math.max(4,c*.08),k):a.fillRect(d,x+2,c*.6,k)}}function lt(){const r=document.createElement("canvas");r.width=1024,r.height=512;const u=new _e(r);return u.minFilter=oe,u.magFilter=oe,u.wrapS=me,u.wrapT=me,{canvas:r,texture:u}}const ct={screenText:`12:00 FEB. 28, 1986\r
<< REWIND`,fontSize:28,fontName:"Press Start 2P",fontColor:"#FFFFFF",showCaret:!1,caretMode:"block",caretBlinkRate:2,horizontalPadding:48,verticalPadding:40,screenColor:"#0b2fd8",glowStrength:.35,curvature:.06,vignette:1.15,noiseStrength:.08,scanlineStrength:.08,scanlineDensity:900,rollSpeed:.4,rollStrength:0,chromaOffset:.0025},mt={screenText:`USERNAME: @ruinedpaintings
PASSWORD: ********`,fontSize:28,fontName:"Press Start 2P",fontColor:"#48ff00",showCaret:!0,caretMode:"block",caretBlinkRate:2,horizontalPadding:48,verticalPadding:40,screenColor:"#000000",glowStrength:.35,curvature:.06,vignette:1.15,noiseStrength:.08,scanlineStrength:.08,scanlineDensity:900,rollSpeed:.4,rollStrength:0,chromaOffset:.0025};function J({screenText:r="12:00 FEB. 28, 1986",fontSize:u=28,fontName:p="Press Start 2P",fontColor:c="#FFFFFF",horizontalPadding:s=48,verticalPadding:v=40,showCaret:l=!1,caretMode:i="block",caretBlinkRate:f=2,screenColor:a="#0b2fd8",glowStrength:m=.35,curvature:b=.06,vignette:w=1.15,noiseStrength:x=.08,scanlineStrength:T=.08,scanlineDensity:S=900,rollSpeed:d=.4,rollStrength:k=0,chromaOffset:M=.0025,side:y=Q}){const R=t.useRef(),g=t.useRef(0),n=t.useRef(!0),{canvas:C,texture:h}=t.useMemo(lt,[]),A=`${u}px "${p}"`,V=U=>{st({canvas:C,text:r,font:A,fontSize:u,fontColor:c,showCaret:l&&U,caretMode:i||"block",horizontalPadding:s,verticalPadding:v}),h.needsUpdate=!0};return t.useEffect(()=>{V(!0)},[r,A,c,s,v,l,i]),Y((U,E)=>{R.current&&(R.current.uTime+=E,l&&(g.current+=E,g.current>=1/Math.max(f,.001)&&(g.current=0,n.current=!n.current,V(n.current))))}),e.jsx("crtBlueScreenMaterial",{ref:R,side:y,toneMapped:!1,uTextTexture:h,uScreenColor:a,uNoiseStrength:x,uGlowStrength:m,uCurvature:b,uVignette:w,uScanlineStrength:T,uScanlineDensity:S,uRollSpeed:d,uRollStrength:k,uChromaOffset:M},Ce.key)}const vt=`
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`,ft=`
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
`,dt=te({uScene:null,uFeedback:null,uTime:0,uDecay:.85,uZoom:1.01,uWarp:.6,uStaticAmount:.04,uScanlineStrength:.4,uCurvature:.12,uVignette:.85},vt,ft);ee({CrtAccumMaterial:dt});function Te({resolution:r=1024,decay:u=.85,zoom:p=1.01,warp:c=.6,staticAmount:s=.04,scanlineStrength:v=.4,curvature:l=.12,vignette:i=.85,side:f=Q}){const a=t.useRef(),{gl:m,scene:b,camera:w}=de(),x=t.useMemo(()=>new ue(r,r),[r]),T=t.useMemo(()=>new ue(r,r),[r]),S=t.useMemo(()=>new ue(r,r),[r]),d=t.useRef(!1);return Y((k,M)=>{if(!a.current)return;a.current.uTime+=M;const y=m.getRenderTarget();m.setRenderTarget(x),m.clear(),m.render(b,w);const R=d.current?T:S,g=d.current?S:T;a.current.uScene=x.texture,a.current.uFeedback=R.texture,m.setRenderTarget(g),m.clear(),m.render(b,w),m.setRenderTarget(y),d.current=!d.current,a.current.uFeedback=g.texture}),e.jsx("crtAccumMaterial",{ref:a,side:f,uDecay:u,uZoom:p,uWarp:c,uStaticAmount:s,uScanlineStrength:v,uCurvature:l,uVignette:i,toneMapped:!1})}const pt=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,ht=`
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
`,xt=te({uMap:null,uTime:0,uStaticAmount:.1,uStaticScale:600,uStaticSpeed:6,uScanlineStrength:.4,uCurvature:.12,uVignette:.85,uChromaDrift:.25,uBloom:.25},pt,ht);ee({CrtSceneShaderMaterial:xt});function ye({scene:r,resolution:u=1024,staticAmount:p=.12,staticScale:c=600,staticSpeed:s=6,scanlineStrength:v=.4,curvature:l=.12,vignette:i=.85,chromaDrift:f=.25,bloom:a=.25,side:m=Q}){const b=t.useRef();return Y((w,x)=>{b.current&&(b.current.uTime+=x)}),e.jsx("crtSceneShaderMaterial",{ref:b,side:m,uStaticAmount:p,uStaticScale:c,uStaticSpeed:s,uScanlineStrength:v,uCurvature:l,uVignette:i,uChromaDrift:f,uBloom:a,toneMapped:!1,children:e.jsx(at,{attach:"uMap",frames:1/0,width:u,height:u,anisotropy:8,children:r})})}const gt=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,St=`
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
`,ke=te({uTime:0,uTexture:null,uStaticAmount:0,uStaticScale:0,uStaticSpeed:0,uSnap:0,uGlitchRate:0,uScanlineStrength:0,uColorBleed:0,uCurvature:0,uVignette:0,uMaskStrength:0,uFlyback:0,uConverge:0,uBloom:0,uBreath:0,uRetrace:0,uBeamWidth:0,uChromaDrift:0,uHum:0,uThermalDrift:0,uSpotNoise:0,uMaskMode:0,uBarrelConverge:0,uPadX:0,uPadY:0},gt,St);ee({CrtShowMaterial:ke});function ie({src:r=Ne("ren_and_stimpy.mp4"),useWebcam:u=!1,padX:p=.06,padY:c=.08,staticAmount:s=.35,staticScale:v=700,staticSpeed:l=9,snap:i=24,glitchRate:f=.18,scanlineStrength:a=.55,colorBleed:m=.14,curvature:b=.12,vignette:w=.75,maskStrength:x=.35,flybackStrength:T=.35,convergenceDrift:S=.4,bloomStrength:d=.25,breathStrength:k=.35,retraceStrength:M=.35,beamWidth:y=.5,chromaDrift:R=.3,humStrength:g=.25,barrelConvergence:n=.6,spotNoise:C=.35,thermalDrift:h=.15,maskMode:A=0,side:V=Q}){const U=t.useRef();return t.useEffect(()=>{if(!U.current)return;let E=null,G=!1;const B=document.createElement("video");B.crossOrigin="anonymous",B.loop=!0,B.muted=!0,B.playsInline=!0,B.autoplay=!0;const D=()=>{if(G)return;const P=new Le(B);P.colorSpace=We,P.minFilter=oe,P.magFilter=oe,P.generateMipmaps=!1,U.current.uTexture=P},_=async()=>{try{B.src=r,await B.play(),D()}catch(P){console.error("[CRTShowMaterial] Video failed to play:",P)}};return u?(async()=>{try{const P=navigator,ae=P.mediaDevices?.getUserMedia||P.getUserMedia||P.webkitGetUserMedia||P.mozGetUserMedia;if(!ae)throw new Error("getUserMedia not supported on this device");P.mediaDevices?.getUserMedia?E=await P.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!1}):E=await new Promise((Z,re)=>{ae.call(P,{video:!0,audio:!1},Z,re)}),B.srcObject=E,await B.play(),D()}catch(P){console.warn("[CRTShowMaterial] Webcam failed, falling back to video:",P),_()}})():_(),()=>{G=!0,E&&E.getTracks().forEach(P=>P.stop()),U.current?.uTexture&&U.current.uTexture.dispose(),B.pause(),B.remove()}},[r,u]),Y((E,G)=>{U.current&&(U.current.uTime+=G)}),e.jsx("crtShowMaterial",{ref:U,side:V,toneMapped:!1,uPadX:p,uPadY:c,uStaticAmount:s,uStaticScale:v,uStaticSpeed:l,uSnap:i,uGlitchRate:f,uScanlineStrength:a,uColorBleed:m,uCurvature:b,uVignette:w,uMaskStrength:x,uFlyback:T,uConverge:S,uBloom:d,uBreath:k,uRetrace:M,uBeamWidth:y,uChromaDrift:R,uHum:g,uThermalDrift:h,uSpotNoise:C,uMaskMode:A,uBarrelConverge:n},ke.key)}const bt=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Ct=`
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
`,Me=te({uTime:0,uStaticAmount:0,uStaticScale:0,uStaticSpeed:0,uSnap:0,uGlitchRate:0,uScanlineStrength:0,uColorBleed:0,uCurvature:0,uVignette:0,uMaskStrength:0,uFlyback:0,uConverge:0,uBloom:0,uBreath:0,uRetrace:0,uBeamWidth:0,uChromaDrift:0,uHum:0,uThermalDrift:0,uSpotNoise:0,uMaskMode:0,uBarrelConverge:0},bt,Ct);ee({CrtSmtpeStaticMaterial:Me});function Re({staticAmount:r=.35,staticScale:u=700,staticSpeed:p=9,snap:c=24,glitchRate:s=.18,scanlineStrength:v=.55,colorBleed:l=.14,curvature:i=.12,vignette:f=.75,maskStrength:a=.35,flybackStrength:m=.35,convergenceDrift:b=.4,bloomStrength:w=.25,breathStrength:x=.35,retraceStrength:T=.35,beamWidth:S=.5,chromaDrift:d=.3,humStrength:k=.25,barrelConvergence:M=.6,spotNoise:y=.35,thermalDrift:R=.15,maskMode:g=0,side:n=Q}){const C=t.useRef();return Y((h,A)=>{C.current&&(C.current.uTime+=A)}),e.jsx("crtSmtpeStaticMaterial",{ref:C,side:n,transparent:!1,depthWrite:!0,toneMapped:!1,uStaticAmount:r,uStaticScale:u,uStaticSpeed:p,uSnap:c,uGlitchRate:s,uScanlineStrength:v,uColorBleed:l,uCurvature:i,uVignette:f,uMaskStrength:a,uFlyback:m,uConverge:b,uBloom:w,uBreath:x,uRetrace:T,uBeamWidth:S,uChromaDrift:d,uHum:k,uThermalDrift:R,uSpotNoise:y,uMaskMode:g,uBarrelConverge:M},Me.key)}function Tt({count:r=4,radius:u=2,speed:p=.25}){const c=t.useRef(),s=Math.PI*2/r;return Y((v,l)=>{c.current.rotation.y+=l*p}),e.jsx("group",{ref:c,children:Array.from({length:r}).map((v,l)=>{const i=l*s,f=Math.sin(i)*u,a=Math.cos(i)*u;return e.jsx(xe,{position:[f,0,a],rotation:[0,i,0]},l)})})}function we(){return e.jsxs(t.Suspense,{fallback:e.jsx(Ke,{}),children:[e.jsx(ge,{makeDefault:!0,position:[0,0,3]}),e.jsx("color",{attach:"background",args:["#646464"]}),e.jsx("ambientLight",{intensity:.3}),e.jsx("directionalLight",{position:[5,6,4],intensity:1.2}),e.jsx(Tt,{count:6,radius:1.2,speed:.6}),e.jsx(qe,{scale:1.5,position:[0,.05,0],rotation:[0,0,0]})]})}function yt(){return{channels:t.useMemo(()=>[{key:"static",video:e.jsx(he,{}),audio:{type:"file",url:$("tv-static.mp3"),loop:!0}},{key:"smtpe",video:e.jsx(Re,{}),audio:{type:"file",url:$("tv-static.mp3"),loop:!0}},{key:"vhs",video:e.jsx(J,{...ct,horizontalPadding:100,verticalPadding:95}),audio:null},{key:"terminal",video:e.jsx(J,{...mt,horizontalPadding:100,verticalPadding:95}),audio:null},{key:"homeVideo",video:e.jsx(ie,{useWebcam:!0}),audio:{type:"file",url:$("laugh-track.mp3"),loop:!0}},{key:"tv",video:e.jsx(ie,{}),audio:{type:"file",url:$("ren-and-stimpy.mp3"),loop:!0}},{key:"threeD",video:e.jsx(ye,{scene:e.jsx(we,{})}),audio:{type:"strudel",code:ve.threeD}},{key:"pip",video:e.jsx(Te,{}),audio:{type:"strudel",code:ve.weirderStuff}}],[])}}function kt({initialPower:r=!0,defaultChannelKey:u,surfChannels:p=!1,initialMuted:c=!1}={}){const s=t.useRef(null),v=t.useRef(null),l=t.useRef(null),i=t.useRef(null),f=t.useRef(null),[a,m]=t.useState(null),[b,w]=t.useState(!1),[x,T]=t.useState(r),[S,d]=t.useState(p),[k,M]=t.useState(c),{channels:y}=yt(),R=t.useMemo(()=>{const o={};return y.forEach((I,j)=>{o[I.key]=j}),o},[y]),[g,n]=t.useState(()=>u&&u in R?R[u]:0),C=x?y[g]:null;t.useEffect(()=>{console.log("[rca] creating AudioContext…");const o=new AudioContext,I=o.createGain(),j=o.createGain(),O=o.createBiquadFilter(),q=o.createDynamicsCompressor(),N=o.createGain();return O.type="bandpass",O.frequency.value=1800,O.Q.value=.8,j.gain.value=.9,N.gain.value=c?1e-4:.8,I.connect(j).connect(O).connect(q).connect(N).connect(o.destination),s.current=o,v.current=I,l.current=N,m(o),console.log("[rca] AudioContext ready",o),()=>{console.log("[rca] closing AudioContext"),o.close()}},[c]);const h=$e(a?{audioContext:a}:null);t.useEffect(()=>{if(!(!h?.ready||!h.output||!v.current)){if(console.log("[rca] attempting to patch strudel…"),console.log("[rca] RCA ctx:",s.current),console.log("[rca] Strudel ctx:",h.ctx||h.audioContext),h.ctx&&s.current&&h.ctx!==s.current){console.error("[rca] ❌ AUDIO CONTEXT MISMATCH — aborting patch");return}try{h.output.disconnect()}catch(o){console.warn("[rca] strudel output disconnect failed",o)}h.output.connect(v.current),console.log("[rca] ✅ strudel patched into tv bus")}},[h?.ready]),t.useEffect(()=>{if(!l.current||!s.current)return;const o=s.current,I=k?1e-4:.8;l.current.gain.cancelScheduledValues(o.currentTime),l.current.gain.linearRampToValueAtTime(I,o.currentTime+.15)},[k]);const A=async()=>{const o=s.current;!o||o.state==="running"||(console.log("[rca] unlocking audio…"),await o.resume(),await h?.unlock?.(),w(!0),console.log("[rca] audio unlocked"))};function V(o=.3){if(!f.current||!i.current)return;const I=s.current;f.current.gain.linearRampToValueAtTime(1e-4,I.currentTime+o),setTimeout(()=>{try{i.current?.stop?.()}catch(j){console.error("[rca cables] current source stop failed",j)}i.current=null,f.current=null},o*1e3)}async function U(o,I=!0,j=.4){const O=s.current;if(!O||!v.current)return;V(),h?.stop?.();const q=await fetch(o),N=await O.decodeAudioData(await q.arrayBuffer()),W=O.createBufferSource(),ne=O.createGain();W.buffer=N,W.loop=I,ne.gain.value=1e-4,W.connect(ne).connect(v.current),W.start(),ne.gain.linearRampToValueAtTime(1,O.currentTime+j),i.current=W,f.current=ne}t.useEffect(()=>{if(!x||k||!C?.audio){V(.35),h?.stop?.();return}const{audio:o}=C;o.type==="file"&&U(o.url,o.loop),o.type==="strudel"&&h?.ready&&(V(.35),h.play(o.code))},[x,g,k,h?.ready]);const E=()=>{A(),T(!0)},G=()=>{V(.35),h?.stop?.(),T(!1)},B=()=>{T(o=>(o?(V(.35),h?.stop?.()):A(),!o))},D=()=>M(!0),_=()=>M(!1),L=()=>M(o=>!o);function P(){n(o=>(o+1)%y.length)}function ae(o){o in R&&n(R[o])}const Z=t.useRef(0),re=t.useRef(1+Math.random()*.5);Y((o,I)=>{!x||!S||(Z.current+=I,Z.current>=re.current&&(Z.current=0,re.current=.6+Math.random()*.9,n(j=>(j+1)%y.length)))});const je=()=>d(!0),Fe=()=>d(!1),Ae=()=>d(o=>!o);async function ce(o,I=.5){const j=s.current;if(!j)return;j.state!=="running"&&await A();const O=await fetch(o),q=await j.decodeAudioData(await O.arrayBuffer()),N=j.createBufferSource(),W=j.createGain();W.gain.value=I,N.buffer=q,N.connect(W).connect(j.destination),N.start(),N.onended=()=>{N.disconnect(),W.disconnect()}}const Pe=()=>ce($("knob-click.mp3"),.35),Ve=()=>ce($("switch-click.mp3"),.35);function Ue(o){if(!o||!l.current||!s.current)return;const I=new Ye;o.add(I);const j=new He(I);l.current.disconnect(),l.current.connect(j.gain),j.setRefDistance(1.2),j.setRolloffFactor(2),o.add(j)}return{channels:y,activeChannel:C,channelIndex:g,channelKey:C?.key??null,power:x,surfing:S,muted:k,unlocked:b,powerOn:E,powerOff:G,togglePower:B,muteOn:D,muteOff:_,toggleMute:L,nextChannel:P,setChannelByKey:ae,surfOn:je,surfOff:Fe,toggleSurfing:Ae,knobClick:Pe,dialClick:Ve,unlockAudio:A,attachToObject:Ue,strudel:h}}const Be=t.createContext(null);function De({children:r,bodyMaterial:u,dialMaterial:p,knobMaterial:c}){const{nodes:s}=be(pe("retro_tv.glb")),v=t.useMemo(()=>({body:u??new X({color:"#050505",roughness:.65,metalness:.15}),dial:p??new X({color:"#0b0b0b",roughness:.4,metalness:.1}),knob:c??new X({color:"#0b0b0b",roughness:.4,metalness:.1})}),[u,p,c]),l=t.useMemo(()=>{const i=s.retro_tv.clone(),f=s.knob_01.clone(),a=s.knob_02.clone();return i.material=v.body,f.material=v.knob,a.material=v.knob,{Body:i,Knob:f,Knob1:a}},[s,v]);return e.jsx(Je,{meshes:l,children:i=>e.jsx(Be.Provider,{value:{merged:i,nodes:s,screenGeo:s.screen.geometry},children:r})})}be.preload(pe("retro_tv.glb"));function H(r){let u=null;return r.traverse(p=>{p.isMesh&&!u&&(u=p)}),u}function Mt({knob01Step:r=0,stepsPerRotation:u=12,onDial1Click:p,onDial2Click:c,onDial3Click:s,onDial4Click:v,onDial5Click:l,onKnob01Click:i,onKnob02Click:f,screenMaterial:a,power:m,muted:b,channelSurfing:w,channelIndex:x,...T}){const{merged:S,nodes:d,screenGeo:k}=t.useContext(Be),M=t.useRef({}),y=Math.PI*2/u,{knobRotation:R}=z({knobRotation:-(r*y),config:{tension:180,friction:20}}),g=t.useMemo(()=>({d1:H(d.dial_01)?.geometry,d2:H(d.dial_02)?.geometry,d3:H(d.dial_03)?.geometry}),[d]),n=t.useMemo(()=>({power:H(d.dial_01).material.clone(),terminal:H(d.dial_02).material.clone(),vhs:H(d.dial_03).material.clone(),surf:H(d.dial_01).material.clone(),mute:H(d.dial_01).material.clone()}),[d]);t.useEffect(()=>{n.power.emissive.set("#ff1a1a"),n.terminal.emissive.set("#00ff55"),n.vhs.emissive.set("#1a4dff"),n.surf.emissive.set("#d0d0d0"),n.mute.emissive.set("#fb00ff")},[n]);const C=z({glow:m?1:0}),h=z({glow:m&&x===3?1:0}),A=z({glow:m&&x===2?1:0}),V=z({glow:m&&w?1:0}),U=z({glow:m&&b?1:0});Y(()=>{n.power.emissiveIntensity=C.glow.get()*2,n.terminal.emissiveIntensity=h.glow.get()*2,n.vhs.emissiveIntensity=A.glow.get()*2,n.surf.emissiveIntensity=V.glow.get()*2,n.mute.emissiveIntensity=U.glow.get()*2});function E(D,_=.004){const L=M.current[D];L&&(L.position.z+=_)}function G(D,_=.004){const L=M.current[D];L&&(L.position.z-=_)}function B(D,_){return L=>{L.stopPropagation(),E(D),_?.(),setTimeout(()=>G(D),120)}}return e.jsx("group",{...T,children:e.jsxs("group",{rotation:[-Math.PI,-Math.PI,-Math.PI],children:[e.jsx(S.Body,{}),e.jsx("mesh",{geometry:g.d1,material:n.power,scale:.5,position:[.254,.208,.092],ref:D=>{M.current.dial1=D},onPointerDown:B("dial1",p)}),e.jsx("mesh",{geometry:g.d2,material:n.terminal,scale:.5,position:[.272,.208,.092],ref:D=>{M.current.dial2=D},onPointerDown:B("dial2",c)}),e.jsx("mesh",{geometry:g.d3,material:n.vhs,scale:.5,position:[.29,.208,.092],ref:D=>{M.current.dial3=D},onPointerDown:B("dial3",s)}),e.jsx("mesh",{geometry:g.d1,material:n.surf,scale:.5,position:[.308,.208,.092],ref:D=>{M.current.dial4=D},onPointerDown:B("dial4",v)}),e.jsx("mesh",{geometry:g.d1,material:n.mute,scale:.5,position:[.326,.208,.092],ref:D=>{M.current.dial5=D},onPointerDown:B("dial5",l)}),e.jsx(Se.group,{position:[.291,.406,.097],"rotation-z":R,children:e.jsx(S.Knob,{onPointerDown:i})}),e.jsx(S.Knob1,{position:[.291,.289,.097],onPointerDown:f}),e.jsx("mesh",{geometry:k,position:[-.077,.262,.07],rotation:[0,0,-3.13],children:a??e.jsx("meshStandardMaterial",{color:"#111",metalness:1,roughness:0})})]})})}function se({stepsPerRotation:r=12,isTurnedOn:u=!0,defaultChannel:p="snow",isSurfingChannels:c=!1,isOnMute:s=!1,...v}){const l=t.useMemo(()=>({body:new X({color:"#050505",roughness:.75,metalness:.05}),plastic:new X({color:"#0b0b0b",roughness:.4,metalness:.1}),metal:new X({color:"#7d7b7b",roughness:0,metalness:1})}),[]),{activeChannel:i,channelIndex:f,channelKey:a,power:m,surfing:b,muted:w,togglePower:x,toggleMute:T,nextChannel:S,setChannelByKey:d,toggleSurfing:k,knobClick:M,dialClick:y}=kt({initialPower:u,defaultChannelKey:p,surfChannels:c,initialMuted:s}),[R,g]=t.useState(0);t.useEffect(()=>{b&&g(G=>G+1)},[a,g]);function n(){M(),S(),g(G=>G+1)}function C(){y(),x()}function h(){y(),m||x(),b&&k(),d("terminal")}function A(){y(),m||x(),b&&k(),d("vhs")}function V(){y(),k()}function U(){y(),T()}function E(){console.log("knob 2 clicked (reserved)")}return e.jsx(De,{bodyMaterial:l.body,dialMaterial:l.plastic,knobMaterial:l.metal,children:e.jsx(Mt,{...v,stepsPerRotation:r,knob01Step:R,power:m,muted:w,channelSurfing:b,channelIndex:f,screenMaterial:i?.video??null,onDial1Click:C,onDial2Click:h,onDial3Click:A,onDial4Click:V,onDial5Click:U,onKnob01Click:n,onKnob02Click:E})})}const le=["Arial Black","Arial","Verdana","Tahoma","Trebuchet MS","Impact","Courier New","Lucida Console","Monaco","Consolas","Menlo","Orbitron","VT323","Press Start 2P","monospace","sans-serif","serif","terminal"];function Rt(){const r=K("CRT SMPTE RP-219",{staticAmount:{value:.35,min:0,max:1,step:.01},staticScale:{value:700,min:50,max:1400,step:1},staticSpeed:{value:9,min:.1,max:20,step:.1},snap:{value:24,min:1,max:60,step:1},glitchRate:{value:.18,min:0,max:1,step:.01},scanlineStrength:{value:.55,min:0,max:1,step:.01},colorBleed:{value:.14,min:0,max:.5,step:.01},curvature:{value:.12,min:0,max:.4,step:.01},vignette:{value:.75,min:.6,max:.98,step:.01},maskStrength:{value:.35,min:0,max:1,step:.01},flybackStrength:{value:.35,min:0,max:1,step:.01},convergenceDrift:{value:.4,min:0,max:1,step:.01},bloomStrength:{value:.25,min:0,max:1,step:.01},breathStrength:{value:.35,min:0,max:1,step:.01},retraceStrength:{value:.35,min:0,max:1,step:.01},beamWidth:{value:.5,min:0,max:1,step:.01},chromaDrift:{value:.3,min:0,max:1,step:.01},humStrength:{value:.25,min:0,max:1,step:.01},barrelConvergence:{value:.6,min:0,max:2,step:.01},spotNoise:{value:.35,min:0,max:1,step:.01},thermalDrift:{value:.15,min:0,max:1,step:.01},maskMode:{value:0,options:{shadow:0,grille:1}}},{collapsed:!0}),u=K("CRT Static",{snowAmount:{value:1,min:0,max:1},snowScale:{value:180,min:10,max:800},snowSpeed:{value:1,min:0,max:5},snowSize:{value:240,min:40,max:1e3},curvature:{value:.12,min:0,max:.4,step:.01},vignette:{value:.75,min:.6,max:.98,step:.01},bandStrength:{value:.35,min:0,max:1},bandSpeed:{value:.6,min:0,max:3},bandScale:{value:8,min:1,max:40},snap:{value:24,min:1,max:60,step:1},rfStrength:{value:.25,min:0,max:1},rfScale:{value:22,min:2,max:80},rfSpeed:{value:.4,min:0,max:3}},{collapsed:!0}),p=K("No Signal",{Text:F({screenText:{value:`12:00 FEB. 28, 1986\r
INSERT VHS`,rows:!0},fontSize:{value:28,min:0,max:48,step:1},fontName:{value:"Press Start 2P",options:le},fontColor:{value:"#FFFFFF"},showCaret:{value:!1},caretMode:{value:"block",options:["block","underscore","line"]},caretBlinkRate:{value:2,min:.2,max:5,step:.1},horizontalPadding:{value:100,min:0,max:1e3,step:1},verticalPadding:{value:95,min:0,max:1e3,step:1}},{collapsed:!0}),Look:F({screenColor:{value:"#0b2fd8"},glowStrength:{value:.35,min:0,max:1,step:.01},curvature:{value:.06,min:0,max:.2,step:.001},vignette:{value:1.15,min:.5,max:2,step:.01}},{collapsed:!0}),Noise:F({noiseStrength:{value:.08,min:0,max:.4,step:.001},scanlineStrength:{value:.08,min:0,max:.3,step:.001},scanlineDensity:{value:900,min:200,max:2e3,step:10}},{collapsed:!0}),Roll:F({rollSpeed:{value:.4,min:0,max:2,step:.01},rollStrength:{value:0,min:0,max:2,step:.01}},{collapsed:!0}),Chroma:F({chromaOffset:{value:.0025,min:0,max:.01,step:1e-4}},{collapsed:!0})},{collapsed:!0}),c=K("Terminal",{Text:F({screenText:{value:`a:\\> ||TERMINAL ERROR||\r
      - 0X666420 -\r
      DATA CORRUPTED\r
a:\\> FULL SYSTEM FAILURE
a:\\> INSERT BOOT DISK`,rows:!0},fontSize:{value:26,min:0,max:48,step:1},fontName:{value:"Press Start 2P",options:le},fontColor:{value:"#48ff00"},showCaret:{value:!0},caretMode:{value:"block",options:["block","underscore","line"]},caretBlinkRate:{value:2,min:.2,max:5,step:.1},horizontalPadding:{value:100,min:0,max:1e3,step:1},verticalPadding:{value:95,min:0,max:1e3,step:1}},{collapsed:!0}),Look:F({screenColor:{value:"#000000"},glowStrength:{value:.35,min:0,max:1,step:.01},curvature:{value:.06,min:0,max:.2,step:.001},vignette:{value:1.15,min:.5,max:2,step:.01}},{collapsed:!0}),Noise:F({noiseStrength:{value:.08,min:0,max:.4,step:.001},scanlineStrength:{value:.08,min:0,max:.3,step:.001},scanlineDensity:{value:900,min:200,max:2e3,step:10}},{collapsed:!0}),Roll:F({rollSpeed:{value:.4,min:0,max:2,step:.01},rollStrength:{value:0,min:0,max:2,step:.01}},{collapsed:!0}),Chroma:F({chromaOffset:{value:.0025,min:0,max:.01,step:1e-4}},{collapsed:!0})},{collapsed:!0}),s=K("Ascii",{Text:F({screenText:{value:nt,rows:!0},fontSize:{value:6,min:0,max:48,step:1},fontName:{value:"Press Start 2P",options:le},fontColor:{value:"#ff0000"},showCaret:{value:!1},caretMode:{value:"block",options:["block","underscore","line"]},caretBlinkRate:{value:2,min:.2,max:5,step:.1},horizontalPadding:{value:208,min:0,max:1e3,step:1},verticalPadding:{value:0,min:0,max:1e3,step:1}},{collapsed:!0}),Look:F({screenColor:{value:"#000000"},glowStrength:{value:.35,min:0,max:1,step:.01},curvature:{value:.06,min:0,max:.2,step:.001},vignette:{value:1.15,min:.5,max:2,step:.01}},{collapsed:!0}),Noise:F({noiseStrength:{value:.08,min:0,max:.4,step:.001},scanlineStrength:{value:.08,min:0,max:.3,step:.001},scanlineDensity:{value:900,min:200,max:2e3,step:10}},{collapsed:!0}),Roll:F({rollSpeed:{value:.4,min:0,max:2,step:.01},rollStrength:{value:0,min:0,max:2,step:.01}},{collapsed:!0}),Chroma:F({chromaOffset:{value:.0025,min:0,max:.01,step:1e-4}},{collapsed:!0})},{collapsed:!0}),v=K("HomeVideo",{padX:{value:.06,min:0,max:.25,step:.001},padY:{value:.08,min:0,max:.25,step:.001},curvature:{value:.12,min:0,max:.4,step:.001},vignette:{value:.75,min:.3,max:1.2,step:.001},staticAmount:{value:.35,min:0,max:1,step:.001},staticScale:{value:700,min:50,max:2e3,step:1},staticSpeed:{value:9,min:0,max:30,step:.01},snap:{value:24,min:1,max:60,step:1},spotNoise:{value:.35,min:0,max:1,step:.001},thermalDrift:{value:.15,min:0,max:1,step:.001},glitchRate:{value:.18,min:0,max:1,step:.001},flybackStrength:{value:.35,min:0,max:1,step:.001},retraceStrength:{value:.35,min:0,max:1,step:.001},humStrength:{value:.25,min:0,max:1,step:.001},breathStrength:{value:.35,min:0,max:1,step:.001},scanlineStrength:{value:.55,min:0,max:1,step:.001},beamWidth:{value:.5,min:0,max:1,step:.001},bloomStrength:{value:.25,min:0,max:1,step:.001},colorBleed:{value:.14,min:0,max:.5,step:.001},chromaDrift:{value:.3,min:0,max:1,step:.001},convergenceDrift:{value:.4,min:0,max:1,step:.001},barrelConvergence:{value:.6,min:0,max:2,step:.001},maskStrength:{value:.35,min:0,max:1,step:.001},maskMode:{value:0,options:{Triad:0,Aperture:1}}},{collapsed:!0}),l=K("TV",{padX:{value:.06,min:0,max:.25,step:.001},padY:{value:.08,min:0,max:.25,step:.001},curvature:{value:.12,min:0,max:.4,step:.001},vignette:{value:.75,min:.3,max:1.2,step:.001},staticAmount:{value:.35,min:0,max:1,step:.001},staticScale:{value:700,min:50,max:2e3,step:1},staticSpeed:{value:9,min:0,max:30,step:.01},snap:{value:24,min:1,max:60,step:1},spotNoise:{value:.35,min:0,max:1,step:.001},thermalDrift:{value:.15,min:0,max:1,step:.001},glitchRate:{value:.18,min:0,max:1,step:.001},flybackStrength:{value:.35,min:0,max:1,step:.001},retraceStrength:{value:.35,min:0,max:1,step:.001},humStrength:{value:.25,min:0,max:1,step:.001},breathStrength:{value:.35,min:0,max:1,step:.001},scanlineStrength:{value:.55,min:0,max:1,step:.001},beamWidth:{value:.5,min:0,max:1,step:.001},bloomStrength:{value:.25,min:0,max:1,step:.001},colorBleed:{value:.14,min:0,max:.5,step:.001},chromaDrift:{value:.3,min:0,max:1,step:.001},convergenceDrift:{value:.4,min:0,max:1,step:.001},barrelConvergence:{value:.6,min:0,max:2,step:.001},maskStrength:{value:.35,min:0,max:1,step:.001},maskMode:{value:0,options:{Triad:0,Aperture:1}}},{collapsed:!0}),i=K("Scene In Scene",{Render:F({resolution:{value:1024,min:256,max:2048,step:256}},{collapsed:!0}),Static:F({staticAmount:{value:.12,min:0,max:.5,step:.001},staticScale:{value:600,min:50,max:2e3,step:10},staticSpeed:{value:6,min:0,max:20,step:.1}},{collapsed:!0}),CRT:F({scanlineStrength:{value:.4,min:0,max:1,step:.01},curvature:{value:.12,min:0,max:.4,step:.005},vignette:{value:.85,min:.4,max:1.2,step:.005},chromaDrift:{value:.25,min:0,max:1,step:.005}},{collapsed:!0}),Post:F({bloom:{value:.25,min:0,max:2,step:.01}},{collapsed:!0})},{collapsed:!0}),f=K("Picture In Picture",{Render:F({resolution:{value:1024,min:256,max:2048,step:256}},{collapsed:!0}),Feedback:F({decay:{value:.85,min:.7,max:.97,step:.001},zoom:{value:1.01,min:1,max:1.05,step:5e-4},warp:{value:.6,min:0,max:2,step:.01}},{collapsed:!0}),CRT:F({staticAmount:{value:.04,min:0,max:.25,step:.001},scanlineStrength:{value:.4,min:0,max:1,step:.01},curvature:{value:.12,min:0,max:.4,step:.005},vignette:{value:.85,min:.4,max:1.2,step:.005}},{collapsed:!0})},{collapsed:!0});return{smtpe:r,tvStatic:u,noSignal:p,terminal:c,ascii:s,homeVideo:v,tv:l,threeD:i,pip:f}}function wt(){const r=Rt(),{smtpe:u,tvStatic:p,noSignal:c,terminal:s,ascii:v,homeVideo:l,tv:i,threeD:f,pip:a}=r,m=7,b=1,w=Math.PI*.9,x=.2,T=t.useMemo(()=>[e.jsx("meshStandardMaterial",{color:"#111",roughness:0,metalness:1},"std"),e.jsx(he,{...p},"static"),e.jsx(Re,{...u},"smtpe"),e.jsx(J,{...s},"terminal"),e.jsx(J,{...c},"vhs"),e.jsx(J,{...v},"ascii"),e.jsx(ie,{useWebcam:!0,...l},"homeVideo"),e.jsx(ie,{...i},"tv"),e.jsx(ye,{scene:e.jsx(we,{}),...f},"three-d"),e.jsx(Te,{...a},"pip")],[r]),[S,d]=t.useState(0),k=t.useRef(1),M=t.useMemo(()=>T.slice(0,S),[T,S]),y=t.useMemo(()=>{const n=M.length;if(n===0)return[];const C=w,h=T.length,V=C/Math.max(h-1,1)*.95,U=(n-1)/2;return M.map((E,G)=>{const B=(G-U)*V,D=Math.sin(B)*m,_=-(Math.cos(B)*m)+m+x;return{position:[D,b,_],rotation:[0,-B,0],material:E}})},[M,m,b,w,x,T.length]),R=ze(y,{keys:(n,C)=>C,from:{position:[0,-1,3],rotation:[0,0,0],scale:.25},enter:n=>({position:n.position,rotation:n.rotation,scale:1}),update:n=>({position:n.position,rotation:n.rotation,scale:1}),leave:{position:[0,b-.5,2.5],rotation:[0,Math.PI*.15,0],scale:.05},config:{mass:1,tension:220,friction:26}}),g=t.useCallback(()=>{d(n=>n>=T.length?(k.current=-1,n-1):n<=0?(k.current=1,1):n+k.current)},[T.length]);return e.jsxs(e.Fragment,{children:[R((n,C,h,A)=>e.jsxs(Se.mesh,{position:n.position,rotation:n.rotation,scale:n.scale,children:[e.jsx("planeGeometry",{args:[2,2]}),C.material]},`panel-${A}`)),e.jsx(xe,{position:[0,0,1],rotation:[-Math.PI/2,0,0],onClick:g}),e.jsx(fe,{position:[-1,0,2],rotation:[-Math.PI/2,0,0]}),e.jsx(fe,{position:[1,0,2],rotation:[-Math.PI/2,0,0]})]})}function Bt(){return e.jsx("group",{children:e.jsxs(De,{children:[e.jsx(se,{position:[5,1,-3],rotation:[0,-Math.PI/4,0],scale:10,defaultChannel:"vhs"}),e.jsx(se,{position:[0,6.25,-5],rotation:[0,0,0],scale:10,defaultChannel:"threeD",isTurnedOn:!1}),e.jsx(se,{position:[-5,1,-3],rotation:[0,Math.PI/4,0],scale:10,defaultChannel:"terminal",isTurnedOn:!1})]})})}function Dt(){return e.jsxs("mesh",{position:[0,0,2],rotation:[-Math.PI/2,0,-Math.PI/4],children:[e.jsx("planeGeometry",{args:[20,20]}),e.jsx(tt,{blur:[300,100],resolution:2048,mixBlur:1,mixStrength:80,roughness:1,depthScale:1.2,minDepthThreshold:.4,maxDepthThreshold:1.4,color:"#131313",metalness:1})]})}function jt(){return e.jsxs("group",{children:[e.jsx("directionalLight",{position:[0,10,0],intensity:.7,lookAt:[0,0,0]}),e.jsx("directionalLight",{position:[0,10,0],intensity:.7,lookAt:[0,1,-3]}),e.jsxs("mesh",{position:[0,10,5],rotation:[-Math.PI/4,0,0],children:[e.jsx("torusGeometry",{args:[5]}),e.jsx("meshStandardMaterial",{color:"#FFFFFF",emissive:"#FFFFFF",emissiveIntensity:1})]})]})}function Xt(){return e.jsxs(e.Fragment,{children:[e.jsx(ge,{makeDefault:!0,position:[0,7,11],near:1,far:100}),e.jsx(Qe,{makeDefault:!0,minDistance:0}),e.jsx("ambientLight",{intensity:.1}),e.jsx("directionalLight",{position:[5,6,4],intensity:.2,lookAt:[0,0,0]}),e.jsx("directionalLight",{position:[-5,6,-4],intensity:.2,lookAt:[0,0,0]}),e.jsx(Bt,{}),e.jsx(wt,{}),e.jsx(Dt,{}),e.jsx(jt,{}),e.jsx("color",{attach:"background",args:["#000000"]}),e.jsx(et,{preset:"city"})]})}export{Xt as default};
