import{_ as te}from"./extends-CF3RwP-h.js";import{aa as re,o as E,ba as ae,ao as u,W as N,H as Y,ak as W,aX as ie,bb as ne,a8 as oe,U as G,ac as se,aH as le,r as a,q as ue,m as H,z as fe,V as w,ae as X,n as q,a2 as me,am as he,bc as ve,aR as ce,t as de}from"./index-DgiE_hKV.js";import{v as pe}from"./constants-CDonnu7t.js";class xe extends re{constructor(e=new E){super({uniforms:{inputBuffer:new u(null),depthBuffer:new u(null),resolution:new u(new E),texelSize:new u(new E),halfTexelSize:new u(new E),kernel:new u(0),scale:new u(1),cameraNear:new u(0),cameraFar:new u(1),minDepthThreshold:new u(0),maxDepthThreshold:new u(1),depthScale:new u(0),depthToBlurRatioBias:new u(.25)},fragmentShader:`#include <common>
        #include <dithering_pars_fragment>      
        uniform sampler2D inputBuffer;
        uniform sampler2D depthBuffer;
        uniform float cameraNear;
        uniform float cameraFar;
        uniform float minDepthThreshold;
        uniform float maxDepthThreshold;
        uniform float depthScale;
        uniform float depthToBlurRatioBias;
        varying vec2 vUv;
        varying vec2 vUv0;
        varying vec2 vUv1;
        varying vec2 vUv2;
        varying vec2 vUv3;

        void main() {
          float depthFactor = 0.0;
          
          #ifdef USE_DEPTH
            vec4 depth = texture2D(depthBuffer, vUv);
            depthFactor = smoothstep(minDepthThreshold, maxDepthThreshold, 1.0-(depth.r * depth.a));
            depthFactor *= depthScale;
            depthFactor = max(0.0, min(1.0, depthFactor + 0.25));
          #endif
          
          vec4 sum = texture2D(inputBuffer, mix(vUv0, vUv, depthFactor));
          sum += texture2D(inputBuffer, mix(vUv1, vUv, depthFactor));
          sum += texture2D(inputBuffer, mix(vUv2, vUv, depthFactor));
          sum += texture2D(inputBuffer, mix(vUv3, vUv, depthFactor));
          gl_FragColor = sum * 0.25 ;

          #include <dithering_fragment>
          #include <tonemapping_fragment>
          #include <${pe>=154?"colorspace_fragment":"encodings_fragment"}>
        }`,vertexShader:`uniform vec2 texelSize;
        uniform vec2 halfTexelSize;
        uniform float kernel;
        uniform float scale;
        varying vec2 vUv;
        varying vec2 vUv0;
        varying vec2 vUv1;
        varying vec2 vUv2;
        varying vec2 vUv3;

        void main() {
          vec2 uv = position.xy * 0.5 + 0.5;
          vUv = uv;

          vec2 dUv = (texelSize * vec2(kernel) + halfTexelSize) * scale;
          vUv0 = vec2(uv.x - dUv.x, uv.y + dUv.y);
          vUv1 = vec2(uv.x + dUv.x, uv.y + dUv.y);
          vUv2 = vec2(uv.x + dUv.x, uv.y - dUv.y);
          vUv3 = vec2(uv.x - dUv.x, uv.y - dUv.y);

          gl_Position = vec4(position.xy, 1.0, 1.0);
        }`,blending:ae,depthWrite:!1,depthTest:!1}),this.toneMapped=!1,this.setTexelSize(e.x,e.y),this.kernel=new Float32Array([0,1,2,2,3])}setTexelSize(e,t){this.uniforms.texelSize.value.set(e,t),this.uniforms.halfTexelSize.value.set(e,t).multiplyScalar(.5)}setResolution(e){this.uniforms.resolution.value.copy(e)}}class _e{constructor({gl:e,resolution:t,width:s=500,height:h=500,minDepthThreshold:c=0,maxDepthThreshold:d=1,depthScale:p=0,depthToBlurRatioBias:D=.25}){this.renderToScreen=!1,this.renderTargetA=new N(t,t,{minFilter:W,magFilter:W,stencilBuffer:!1,depthBuffer:!1,type:Y}),this.renderTargetB=this.renderTargetA.clone(),this.convolutionMaterial=new xe,this.convolutionMaterial.setTexelSize(1/s,1/h),this.convolutionMaterial.setResolution(new E(s,h)),this.scene=new ie,this.camera=new ne,this.convolutionMaterial.uniforms.minDepthThreshold.value=c,this.convolutionMaterial.uniforms.maxDepthThreshold.value=d,this.convolutionMaterial.uniforms.depthScale.value=p,this.convolutionMaterial.uniforms.depthToBlurRatioBias.value=D,this.convolutionMaterial.defines.USE_DEPTH=p>0;const m=new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),x=new Float32Array([0,0,2,0,0,2]),f=new oe;f.setAttribute("position",new G(m,3)),f.setAttribute("uv",new G(x,2)),this.screen=new se(f,this.convolutionMaterial),this.screen.frustumCulled=!1,this.scene.add(this.screen)}render(e,t,s){const h=this.scene,c=this.camera,d=this.renderTargetA,p=this.renderTargetB;let D=this.convolutionMaterial,m=D.uniforms;m.depthBuffer.value=t.depthTexture;const x=D.kernel;let f=t,T,_,P;for(_=0,P=x.length-1;_<P;++_)T=(_&1)===0?d:p,m.kernel.value=x[_],m.inputBuffer.value=f.texture,e.setRenderTarget(T),e.render(h,c),f=T;m.kernel.value=x[_],m.inputBuffer.value=f.texture,e.setRenderTarget(this.renderToScreen?null:s),e.render(h,c)}}let ge=class extends le{constructor(e={}){super(e),this._tDepth={value:null},this._distortionMap={value:null},this._tDiffuse={value:null},this._tDiffuseBlur={value:null},this._textureMatrix={value:null},this._hasBlur={value:!1},this._mirror={value:0},this._mixBlur={value:0},this._blurStrength={value:.5},this._minDepthThreshold={value:.9},this._maxDepthThreshold={value:1},this._depthScale={value:0},this._depthToBlurRatioBias={value:.25},this._distortion={value:1},this._mixContrast={value:1},this.setValues(e)}onBeforeCompile(e){var t;(t=e.defines)!=null&&t.USE_UV||(e.defines.USE_UV=""),e.uniforms.hasBlur=this._hasBlur,e.uniforms.tDiffuse=this._tDiffuse,e.uniforms.tDepth=this._tDepth,e.uniforms.distortionMap=this._distortionMap,e.uniforms.tDiffuseBlur=this._tDiffuseBlur,e.uniforms.textureMatrix=this._textureMatrix,e.uniforms.mirror=this._mirror,e.uniforms.mixBlur=this._mixBlur,e.uniforms.mixStrength=this._blurStrength,e.uniforms.minDepthThreshold=this._minDepthThreshold,e.uniforms.maxDepthThreshold=this._maxDepthThreshold,e.uniforms.depthScale=this._depthScale,e.uniforms.depthToBlurRatioBias=this._depthToBlurRatioBias,e.uniforms.distortion=this._distortion,e.uniforms.mixContrast=this._mixContrast,e.vertexShader=`
        uniform mat4 textureMatrix;
        varying vec4 my_vUv;
      ${e.vertexShader}`,e.vertexShader=e.vertexShader.replace("#include <project_vertex>",`#include <project_vertex>
        my_vUv = textureMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );`),e.fragmentShader=`
        uniform sampler2D tDiffuse;
        uniform sampler2D tDiffuseBlur;
        uniform sampler2D tDepth;
        uniform sampler2D distortionMap;
        uniform float distortion;
        uniform float cameraNear;
			  uniform float cameraFar;
        uniform bool hasBlur;
        uniform float mixBlur;
        uniform float mirror;
        uniform float mixStrength;
        uniform float minDepthThreshold;
        uniform float maxDepthThreshold;
        uniform float mixContrast;
        uniform float depthScale;
        uniform float depthToBlurRatioBias;
        varying vec4 my_vUv;
        ${e.fragmentShader}`,e.fragmentShader=e.fragmentShader.replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>

      float distortionFactor = 0.0;
      #ifdef USE_DISTORTION
        distortionFactor = texture2D(distortionMap, vUv).r * distortion;
      #endif

      vec4 new_vUv = my_vUv;
      new_vUv.x += distortionFactor;
      new_vUv.y += distortionFactor;

      vec4 base = texture2DProj(tDiffuse, new_vUv);
      vec4 blur = texture2DProj(tDiffuseBlur, new_vUv);

      vec4 merge = base;

      #ifdef USE_NORMALMAP
        vec2 normal_uv = vec2(0.0);
        vec4 normalColor = texture2D(normalMap, vUv * normalScale);
        vec3 my_normal = normalize( vec3( normalColor.r * 2.0 - 1.0, normalColor.b,  normalColor.g * 2.0 - 1.0 ) );
        vec3 coord = new_vUv.xyz / new_vUv.w;
        normal_uv = coord.xy + coord.z * my_normal.xz * 0.05;
        vec4 base_normal = texture2D(tDiffuse, normal_uv);
        vec4 blur_normal = texture2D(tDiffuseBlur, normal_uv);
        merge = base_normal;
        blur = blur_normal;
      #endif

      float depthFactor = 0.0001;
      float blurFactor = 0.0;

      #ifdef USE_DEPTH
        vec4 depth = texture2DProj(tDepth, new_vUv);
        depthFactor = smoothstep(minDepthThreshold, maxDepthThreshold, 1.0-(depth.r * depth.a));
        depthFactor *= depthScale;
        depthFactor = max(0.0001, min(1.0, depthFactor));

        #ifdef USE_BLUR
          blur = blur * min(1.0, depthFactor + depthToBlurRatioBias);
          merge = merge * min(1.0, depthFactor + 0.5);
        #else
          merge = merge * depthFactor;
        #endif

      #endif

      float reflectorRoughnessFactor = roughness;
      #ifdef USE_ROUGHNESSMAP
        vec4 reflectorTexelRoughness = texture2D( roughnessMap, vUv );
        reflectorRoughnessFactor *= reflectorTexelRoughness.g;
      #endif

      #ifdef USE_BLUR
        blurFactor = min(1.0, mixBlur * reflectorRoughnessFactor);
        merge = mix(merge, blur, blurFactor);
      #endif

      vec4 newMerge = vec4(0.0, 0.0, 0.0, 1.0);
      newMerge.r = (merge.r - 0.5) * mixContrast + 0.5;
      newMerge.g = (merge.g - 0.5) * mixContrast + 0.5;
      newMerge.b = (merge.b - 0.5) * mixContrast + 0.5;

      diffuseColor.rgb = diffuseColor.rgb * ((1.0 - min(1.0, mirror)) + newMerge.rgb * mixStrength);
      `)}get tDiffuse(){return this._tDiffuse.value}set tDiffuse(e){this._tDiffuse.value=e}get tDepth(){return this._tDepth.value}set tDepth(e){this._tDepth.value=e}get distortionMap(){return this._distortionMap.value}set distortionMap(e){this._distortionMap.value=e}get tDiffuseBlur(){return this._tDiffuseBlur.value}set tDiffuseBlur(e){this._tDiffuseBlur.value=e}get textureMatrix(){return this._textureMatrix.value}set textureMatrix(e){this._textureMatrix.value=e}get hasBlur(){return this._hasBlur.value}set hasBlur(e){this._hasBlur.value=e}get mirror(){return this._mirror.value}set mirror(e){this._mirror.value=e}get mixBlur(){return this._mixBlur.value}set mixBlur(e){this._mixBlur.value=e}get mixStrength(){return this._blurStrength.value}set mixStrength(e){this._blurStrength.value=e}get minDepthThreshold(){return this._minDepthThreshold.value}set minDepthThreshold(e){this._minDepthThreshold.value=e}get maxDepthThreshold(){return this._maxDepthThreshold.value}set maxDepthThreshold(e){this._maxDepthThreshold.value=e}get depthScale(){return this._depthScale.value}set depthScale(e){this._depthScale.value=e}get depthToBlurRatioBias(){return this._depthToBlurRatioBias.value}set depthToBlurRatioBias(e){this._depthToBlurRatioBias.value=e}get distortion(){return this._distortion.value}set distortion(e){this._distortion.value=e}get mixContrast(){return this._mixContrast.value}set mixContrast(e){this._mixContrast.value=e}};const Me=a.forwardRef(({mixBlur:y=0,mixStrength:e=1,resolution:t=256,blur:s=[0,0],minDepthThreshold:h=.9,maxDepthThreshold:c=1,depthScale:d=0,depthToBlurRatioBias:p=.25,mirror:D=0,distortion:m=1,mixContrast:x=1,distortionMap:f,reflectorOffset:T=0,..._},P)=>{ue({MeshReflectorMaterialImpl:ge});const n=H(({gl:r})=>r),b=H(({camera:r})=>r),J=H(({scene:r})=>r);s=Array.isArray(s)?s:[s,s];const A=s[0]+s[1]>0,L=s[0],O=s[1],U=a.useRef(null);a.useImperativeHandle(P,()=>U.current,[]);const[M]=a.useState(()=>new fe),[g]=a.useState(()=>new w),[S]=a.useState(()=>new w),[I]=a.useState(()=>new w),[R]=a.useState(()=>new X),[z]=a.useState(()=>new w(0,0,-1)),[v]=a.useState(()=>new q),[F]=a.useState(()=>new w),[k]=a.useState(()=>new w),[C]=a.useState(()=>new q),[B]=a.useState(()=>new X),[l]=a.useState(()=>new me),K=a.useCallback(()=>{var r;const i=U.current.parent||((r=U.current)==null||(r=r.__r3f.parent)==null?void 0:r.object);if(!i||(S.setFromMatrixPosition(i.matrixWorld),I.setFromMatrixPosition(b.matrixWorld),R.extractRotation(i.matrixWorld),g.set(0,0,1),g.applyMatrix4(R),S.addScaledVector(g,T),F.subVectors(S,I),F.dot(g)>0))return;F.reflect(g).negate(),F.add(S),R.extractRotation(b.matrixWorld),z.set(0,0,-1),z.applyMatrix4(R),z.add(I),k.subVectors(S,z),k.reflect(g).negate(),k.add(S),l.position.copy(F),l.up.set(0,1,0),l.up.applyMatrix4(R),l.up.reflect(g),l.lookAt(k),l.far=b.far,l.updateMatrixWorld(),l.projectionMatrix.copy(b.projectionMatrix),B.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),B.multiply(l.projectionMatrix),B.multiply(l.matrixWorldInverse),B.multiply(i.matrixWorld),M.setFromNormalAndCoplanarPoint(g,S),M.applyMatrix4(l.matrixWorldInverse),v.set(M.normal.x,M.normal.y,M.normal.z,M.constant);const o=l.projectionMatrix;C.x=(Math.sign(v.x)+o.elements[8])/o.elements[0],C.y=(Math.sign(v.y)+o.elements[9])/o.elements[5],C.z=-1,C.w=(1+o.elements[10])/o.elements[14],v.multiplyScalar(2/v.dot(C)),o.elements[2]=v.x,o.elements[6]=v.y,o.elements[10]=v.z+1,o.elements[14]=v.w},[b,T]),[$,Q,Z,j]=a.useMemo(()=>{const r={minFilter:W,magFilter:W,type:Y},i=new N(t,t,r);i.depthBuffer=!0,i.depthTexture=new he(t,t),i.depthTexture.format=ve,i.depthTexture.type=ce;const o=new N(t,t,r),V=new _e({gl:n,resolution:t,width:L,height:O,minDepthThreshold:h,maxDepthThreshold:c,depthScale:d,depthToBlurRatioBias:p}),ee={mirror:D,textureMatrix:B,mixBlur:y,tDiffuse:i.texture,tDepth:i.depthTexture,tDiffuseBlur:o.texture,hasBlur:A,mixStrength:e,minDepthThreshold:h,maxDepthThreshold:c,depthScale:d,depthToBlurRatioBias:p,distortion:m,distortionMap:f,mixContrast:x,"defines-USE_BLUR":A?"":void 0,"defines-USE_DEPTH":d>0?"":void 0,"defines-USE_DISTORTION":f?"":void 0};return[i,o,V,ee]},[n,L,O,B,t,D,A,y,e,h,c,d,p,m,f,x]);return de(()=>{var r;const i=U.current.parent||((r=U.current)==null||(r=r.__r3f.parent)==null?void 0:r.object);if(!i)return;i.visible=!1;const o=n.xr.enabled,V=n.shadowMap.autoUpdate;K(),n.xr.enabled=!1,n.shadowMap.autoUpdate=!1,n.setRenderTarget($),n.state.buffers.depth.setMask(!0),n.autoClear||n.clear(),n.render(J,l),A&&Z.render(n,$,Q),n.xr.enabled=o,n.shadowMap.autoUpdate=V,i.visible=!0,n.setRenderTarget(null)}),a.createElement("meshReflectorMaterialImpl",te({attach:"material",key:"key"+j["defines-USE_BLUR"]+j["defines-USE_DEPTH"]+j["defines-USE_DISTORTION"],ref:U},j,_))});export{Me as M};
