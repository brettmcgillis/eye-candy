import{aK as be,ay as xe,X as Ce,v as B,aa as Y,C as A,G as M,W as k,c as N,V as U,A as ye,av as Te,ai as ce,a6 as le,aR as Se,bZ as Me,r as l,e as ee,a as te,bz as _e,b as H,_ as fe,M as we,z as Pe,h as me,k as p,j as c}from"./index-BjAk923F.js";import{r as P,s as $}from"./math-C0Z1meOP.js";import{B as Ee}from"./Bret-C9SA9cOk.js";import{R as Fe}from"./Reversal-DUJzpsc1.js";import{L as Re}from"./LightingRig-Dm0sOCpJ.js";import{P as Be}from"./PerspectiveCamera-CJF5pD1Q.js";import{v as Ie}from"./constants-nxBiaZZb.js";import"./react-spring_three.modern-DwoEWtVu.js";import"./Gltf-DuvxF6ry.js";import"./constants-CkMERDu8.js";import"./Fbo-2WB1Ko_c.js";var ze=Object.defineProperty,Ue=(r,e,t)=>e in r?ze(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,I=(r,e,t)=>(Ue(r,typeof e!="symbol"?e+"":e,t),t);class L{constructor(){I(this,"enabled",!0),I(this,"needsSwap",!0),I(this,"clear",!1),I(this,"renderToScreen",!1)}setSize(e,t){}render(e,t,o,i,s){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}class de{constructor(e){I(this,"camera",new be(-1,1,1,-1,0,1)),I(this,"geometry",new xe(2,2)),I(this,"mesh"),this.mesh=new Ce(this.geometry,e)}get material(){return this.mesh.material}set material(e){this.mesh.material=e}dispose(){this.mesh.geometry.dispose()}render(e){e.render(this.mesh,this.camera)}}var Ae=Object.defineProperty,De=(r,e,t)=>e in r?Ae(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,j=(r,e,t)=>(De(r,typeof e!="symbol"?e+"":e,t),t);class J extends L{constructor(e,t="tDiffuse"){super(),j(this,"textureID"),j(this,"uniforms"),j(this,"material"),j(this,"fsQuad"),this.textureID=t,e instanceof B?(this.uniforms=e.uniforms,this.material=e):(this.uniforms=Y.clone(e.uniforms),this.material=new B({defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this.fsQuad=new de(this.material)}render(e,t,o){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=o.texture),this.fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.fsQuad.dispose(),this.material.dispose()}}const Z={uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`
    varying vec2 vUv;

    void main() {

    	vUv = uv;
    	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }
  `,fragmentShader:`
    uniform float opacity;

    uniform sampler2D tDiffuse;

    varying vec2 vUv;

    void main() {

    	vec4 texel = texture2D( tDiffuse, vUv );
    	gl_FragColor = opacity * texel;

    }
  `},Oe={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new A(0)},defaultOpacity:{value:0}},vertexShader:`
    varying vec2 vUv;

    void main() {

    	vUv = uv;

    	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }
  `,fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform vec3 defaultColor;
    uniform float defaultOpacity;
    uniform float luminosityThreshold;
    uniform float smoothWidth;

    varying vec2 vUv;

    void main() {

    	vec4 texel = texture2D( tDiffuse, vUv );

    	vec3 luma = vec3( 0.299, 0.587, 0.114 );

    	float v = dot( texel.xyz, luma );

    	vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

    	float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

    	gl_FragColor = mix( outputColor, texel, alpha );

    }
  `};var ke=Object.defineProperty,Le=(r,e,t)=>e in r?ke(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,ne=(r,e,t)=>(Le(r,typeof e!="symbol"?e+"":e,t),t);const Ve=(()=>{const r=class extends L{constructor(t,o,i,s){super(),this.strength=o!==void 0?o:1,this.radius=i,this.threshold=s,this.resolution=t!==void 0?new M(t.x,t.y):new M(256,256),this.clearColor=new A(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let a=Math.round(this.resolution.x/2),n=Math.round(this.resolution.y/2);this.renderTargetBright=new k(a,n,{type:N}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let f=0;f<this.nMips;f++){const d=new k(a,n,{type:N});d.texture.name="UnrealBloomPass.h"+f,d.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(d);const T=new k(a,n,{type:N});T.texture.name="UnrealBloomPass.v"+f,T.texture.generateMipmaps=!1,this.renderTargetsVertical.push(T),a=Math.round(a/2),n=Math.round(n/2)}const h=Oe;this.highPassUniforms=Y.clone(h.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new B({uniforms:this.highPassUniforms,vertexShader:h.vertexShader,fragmentShader:h.fragmentShader,defines:{}}),this.separableBlurMaterials=[];const u=[3,5,7,9,11];a=Math.round(this.resolution.x/2),n=Math.round(this.resolution.y/2);for(let f=0;f<this.nMips;f++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(u[f])),this.separableBlurMaterials[f].uniforms.texSize.value=new M(a,n),a=Math.round(a/2),n=Math.round(n/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=o,this.compositeMaterial.uniforms.bloomRadius.value=.1,this.compositeMaterial.needsUpdate=!0;const v=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=v,this.bloomTintColors=[new U(1,1,1),new U(1,1,1),new U(1,1,1),new U(1,1,1),new U(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;const g=Z;this.copyUniforms=Y.clone(g.uniforms),this.copyUniforms.opacity.value=1,this.materialCopy=new B({uniforms:this.copyUniforms,vertexShader:g.vertexShader,fragmentShader:g.fragmentShader,blending:ye,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new A,this.oldClearAlpha=1,this.basic=new Te,this.fsQuad=new de(null)}dispose(){for(let t=0;t<this.renderTargetsHorizontal.length;t++)this.renderTargetsHorizontal[t].dispose();for(let t=0;t<this.renderTargetsVertical.length;t++)this.renderTargetsVertical[t].dispose();this.renderTargetBright.dispose();for(let t=0;t<this.separableBlurMaterials.length;t++)this.separableBlurMaterials[t].dispose();this.compositeMaterial.dispose(),this.materialCopy.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(t,o){let i=Math.round(t/2),s=Math.round(o/2);this.renderTargetBright.setSize(i,s);for(let a=0;a<this.nMips;a++)this.renderTargetsHorizontal[a].setSize(i,s),this.renderTargetsVertical[a].setSize(i,s),this.separableBlurMaterials[a].uniforms.texSize.value=new M(i,s),i=Math.round(i/2),s=Math.round(s/2)}render(t,o,i,s,a){t.getClearColor(this._oldClearColor),this.oldClearAlpha=t.getClearAlpha();const n=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),a&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=i.texture,t.setRenderTarget(null),t.clear(),this.fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=i.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this.fsQuad.render(t);let h=this.renderTargetBright;for(let u=0;u<this.nMips;u++)this.fsQuad.material=this.separableBlurMaterials[u],this.separableBlurMaterials[u].uniforms.colorTexture.value=h.texture,this.separableBlurMaterials[u].uniforms.direction.value=r.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[u]),t.clear(),this.fsQuad.render(t),this.separableBlurMaterials[u].uniforms.colorTexture.value=this.renderTargetsHorizontal[u].texture,this.separableBlurMaterials[u].uniforms.direction.value=r.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[u]),t.clear(),this.fsQuad.render(t),h=this.renderTargetsVertical[u];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this.fsQuad.render(t),this.fsQuad.material=this.materialCopy,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(i),this.fsQuad.render(t)),t.setClearColor(this._oldClearColor,this.oldClearAlpha),t.autoClear=n}getSeperableBlurMaterial(t){return new B({defines:{KERNEL_RADIUS:t,SIGMA:t},uniforms:{colorTexture:{value:null},texSize:{value:new M(.5,.5)},direction:{value:new M(.5,.5)}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 texSize;
				uniform vec2 direction;

				float gaussianPdf(in float x, in float sigma) {
					return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;
				}
				void main() {
					vec2 invSize = 1.0 / texSize;
					float fSigma = float(SIGMA);
					float weightSum = gaussianPdf(0.0, fSigma);
					vec3 diffuseSum = texture2D( colorTexture, vUv).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianPdf(x, fSigma);
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(t){return new B({defines:{NUM_MIPS:t},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}};let e=r;return ne(e,"BlurDirectionX",new M(1,0)),ne(e,"BlurDirectionY",new M(0,1)),e})();var Qe=Object.defineProperty,$e=(r,e,t)=>e in r?Qe(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,X=(r,e,t)=>($e(r,typeof e!="symbol"?e+"":e,t),t);class ue extends L{constructor(e,t){super(),X(this,"scene"),X(this,"camera"),X(this,"inverse"),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,o){const i=e.getContext(),s=e.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let a,n;this.inverse?(a=0,n=1):(a=1,n=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(i.REPLACE,i.REPLACE,i.REPLACE),s.buffers.stencil.setFunc(i.ALWAYS,a,4294967295),s.buffers.stencil.setClear(n),s.buffers.stencil.setLocked(!0),e.setRenderTarget(o),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(i.EQUAL,1,4294967295),s.buffers.stencil.setOp(i.KEEP,i.KEEP,i.KEEP),s.buffers.stencil.setLocked(!0)}}class je extends L{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}var Ne=Object.defineProperty,He=(r,e,t)=>e in r?Ne(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,y=(r,e,t)=>(He(r,typeof e!="symbol"?e+"":e,t),t);class Ge{constructor(e,t){if(y(this,"renderer"),y(this,"_pixelRatio"),y(this,"_width"),y(this,"_height"),y(this,"renderTarget1"),y(this,"renderTarget2"),y(this,"writeBuffer"),y(this,"readBuffer"),y(this,"renderToScreen"),y(this,"passes",[]),y(this,"copyPass"),y(this,"clock"),this.renderer=e,t===void 0){const o={minFilter:le,magFilter:le,format:ce},i=e.getSize(new M);this._pixelRatio=e.getPixelRatio(),this._width=i.width,this._height=i.height,t=new k(this._width*this._pixelRatio,this._height*this._pixelRatio,o),t.texture.name="EffectComposer.rt1"}else this._pixelRatio=1,this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,Z===void 0&&console.error("THREE.EffectComposer relies on CopyShader"),J===void 0&&console.error("THREE.EffectComposer relies on ShaderPass"),this.copyPass=new J(Z),this.copyPass.material.blending=Se,this.clock=new Me}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());const t=this.renderer.getRenderTarget();let o=!1;const i=this.passes.length;for(let s=0;s<i;s++){const a=this.passes[s];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,o),a.needsSwap){if(o){const n=this.renderer.getContext(),h=this.renderer.state.buffers.stencil;h.setFunc(n.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),h.setFunc(n.EQUAL,1,4294967295)}this.swapBuffers()}ue!==void 0&&(a instanceof ue?o=!0:a instanceof je&&(o=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new M);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const o=this._width*this._pixelRatio,i=this._height*this._pixelRatio;this.renderTarget1.setSize(o,i),this.renderTarget2.setSize(o,i);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(o,i)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}var We=Object.defineProperty,Ke=(r,e,t)=>e in r?We(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,R=(r,e,t)=>(Ke(r,typeof e!="symbol"?e+"":e,t),t);class qe extends L{constructor(e,t,o,i,s=0){super(),R(this,"scene"),R(this,"camera"),R(this,"overrideMaterial"),R(this,"clearColor"),R(this,"clearAlpha"),R(this,"clearDepth",!1),R(this,"_oldClearColor",new A),this.scene=e,this.camera=t,this.overrideMaterial=o,this.clearColor=i,this.clearAlpha=s,this.clear=!0,this.needsSwap=!1}render(e,t,o){let i=e.autoClear;e.autoClear=!1;let s,a=null;this.overrideMaterial!==void 0&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor&&(e.getClearColor(this._oldClearColor),s=e.getClearAlpha(),e.setClearColor(this.clearColor,this.clearAlpha)),this.clearDepth&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:o),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor&&e.setClearColor(this._oldClearColor,s),this.overrideMaterial!==void 0&&(this.scene.overrideMaterial=a),e.autoClear=i}}const Xe={uniforms:{tDiffuse:{value:null}},vertexShader:`
    varying vec2 vUv;

    void main() {

    	vUv = uv;
    	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }
  `,fragmentShader:`
    uniform sampler2D tDiffuse;

    varying vec2 vUv;

    void main() {

    	vec4 tex = texture2D( tDiffuse, vUv );

    	#ifdef LinearTosRGB
    		gl_FragColor = LinearTosRGB( tex );
    	#else
    		gl_FragColor = sRGBTransferOETF( tex );
    	#endif

    }
  `},Ye=l.forwardRef(({children:r,multisamping:e=8,renderIndex:t=1,disableRender:o,disableGamma:i,disableRenderPass:s,depthBuffer:a=!0,stencilBuffer:n=!1,anisotropy:h=1,colorSpace:u,type:v,...g},f)=>{l.useMemo(()=>ee({EffectComposer:Ge,RenderPass:qe,ShaderPass:J}),[]);const d=l.useRef(null);l.useImperativeHandle(f,()=>d.current,[]);const{scene:T,camera:E,gl:w,size:S,viewport:_}=te(),[x]=l.useState(()=>{const m=new k(S.width,S.height,{type:v||N,format:ce,depthBuffer:a,stencilBuffer:n,anisotropy:h});return v===_e&&u!=null&&(m.texture.colorSpace=u),m.samples=e,m});l.useEffect(()=>{var m,z;(m=d.current)==null||m.setSize(S.width,S.height),(z=d.current)==null||z.setPixelRatio(_.dpr)},[w,S,_.dpr]),H(()=>{var m;o||(m=d.current)==null||m.render()},t);const C=[];return s||C.push(l.createElement("renderPass",{key:"renderpass",attach:`passes-${C.length}`,args:[T,E]})),i||C.push(l.createElement("shaderPass",{attach:`passes-${C.length}`,key:"gammapass",args:[Xe]})),l.Children.forEach(r,m=>{m&&C.push(l.cloneElement(m,{key:C.length,attach:`passes-${C.length}`}))}),l.createElement("effectComposer",fe({ref:d,args:[w,x]},g),C)});class Je extends B{constructor(){super({uniforms:{time:{value:0},pixelRatio:{value:1}},vertexShader:`
        uniform float pixelRatio;
        uniform float time;
        attribute float size;  
        attribute float speed;  
        attribute float opacity;
        attribute vec3 noise;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          modelPosition.y += sin(time * speed + modelPosition.x * noise.x * 100.0) * 0.2;
          modelPosition.z += cos(time * speed + modelPosition.x * noise.y * 100.0) * 0.2;
          modelPosition.x += cos(time * speed + modelPosition.x * noise.z * 100.0) * 0.2;
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectionPostion = projectionMatrix * viewPosition;
          gl_Position = projectionPostion;
          gl_PointSize = size * 25. * pixelRatio;
          gl_PointSize *= (1.0 / - viewPosition.z);
          vColor = color;
          vOpacity = opacity;
        }
      `,fragmentShader:`
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
          float strength = 0.05 / distanceToCenter - 0.1;
          gl_FragColor = vec4(vColor, strength * vOpacity);
          #include <tonemapping_fragment>
          #include <${Ie>=154?"colorspace_fragment":"encodings_fragment"}>
        }
      `})}get time(){return this.uniforms.time.value}set time(e){this.uniforms.time.value=e}get pixelRatio(){return this.uniforms.pixelRatio.value}set pixelRatio(e){this.uniforms.pixelRatio.value=e}}const pe=r=>r&&r.constructor===Float32Array,Ze=r=>[r.r,r.g,r.b],ve=r=>r instanceof M||r instanceof U||r instanceof Pe,ge=r=>Array.isArray(r)?r:ve(r)?r.toArray():[r,r,r];function O(r,e,t){return l.useMemo(()=>{if(e!==void 0){if(pe(e))return e;if(e instanceof A){const o=Array.from({length:r*3},()=>Ze(e)).flat();return Float32Array.from(o)}else if(ve(e)||Array.isArray(e)){const o=Array.from({length:r*3},()=>ge(e)).flat();return Float32Array.from(o)}return Float32Array.from({length:r},()=>e)}return Float32Array.from({length:r},t)},[e])}const et=l.forwardRef(({noise:r=1,count:e=100,speed:t=1,opacity:o=1,scale:i=1,size:s,color:a,children:n,...h},u)=>{l.useMemo(()=>ee({SparklesImplMaterial:Je}),[]);const v=l.useRef(null),g=te(x=>x.viewport.dpr),f=ge(i),d=l.useMemo(()=>Float32Array.from(Array.from({length:e},()=>f.map(we.randFloatSpread)).flat()),[e,...f]),T=O(e,s,Math.random),E=O(e,o),w=O(e,t),S=O(e*3,r),_=O(a===void 0?e*3:e,pe(a)?a:new A(a),()=>1);return H(x=>{v.current&&v.current.material&&(v.current.material.time=x.clock.elapsedTime)}),l.useImperativeHandle(u,()=>v.current,[]),l.createElement("points",fe({key:`particle-${e}-${JSON.stringify(i)}`},h,{ref:v}),l.createElement("bufferGeometry",null,l.createElement("bufferAttribute",{attach:"attributes-position",args:[d,3]}),l.createElement("bufferAttribute",{attach:"attributes-size",args:[T,1]}),l.createElement("bufferAttribute",{attach:"attributes-opacity",args:[E,1]}),l.createElement("bufferAttribute",{attach:"attributes-speed",args:[w,1]}),l.createElement("bufferAttribute",{attach:"attributes-color",args:[_,3]}),l.createElement("bufferAttribute",{attach:"attributes-noise",args:[S,3]})),n||l.createElement("sparklesImplMaterial",{transparent:!0,pixelRatio:g,depthWrite:!1}))});function tt(){const r=te(e=>e.gl);return l.useEffect(()=>(r.shadowMap.autoUpdate=!1,r.shadowMap.needsUpdate=!0,()=>{r.shadowMap.autoUpdate=r.shadowMap.needsUpdate=!0}),[r.shadowMap]),null}function rt(r,e,t){const o=r%(e+t);return o<e?0:(o-e)/t*2*Math.PI}function st({bretPosition:r={x:0,y:0,z:0},bretRotation:e={x:0,y:0,z:0},bretInnerColor:t="#FF0000",bretInnerColorEmissive:o=!1,bretInnerColorEmissiveIntensity:i=0,bretOuterColor:s="#000000",bretOuterColorEmissive:a=!1,bretOuterColorEmissiveIntensity:n=0,reversalPosition:h={x:.9,y:-.4,z:0},reversalRotation:u={x:0,y:0,z:0},reversalInnerColor:v="#FF0000",reversalInnerColorEmissive:g=!1,reversalInnerColorEmissiveIntensity:f=0,reversalOuterColor:d="#000000",reversalOuterColorEmissive:T=!1,reversalOuterColorEmissiveIntensity:E=0,...w}){const{float:S,floatSpeed:_,floatIntensity:x,flip:C,flipDelay:m,flipDuration:z,spin:G,spinRotation:V,spinSpeed:Q}=me("Logo",{Float:p({float:{label:"Float",value:!0},floatSpeed:{label:"Speed",value:1,min:0,max:10,step:.01},floatIntensity:{label:"Intensity",value:.05,min:0,max:1,step:.01}},{collapsed:!0}),Spin:p({spin:{label:"Spin",value:!0},spinRotation:{label:"Rotation",value:33,min:0,max:360,step:1},spinSpeed:{label:"Speed",value:.4,min:0,max:1,step:.01}},{collapsed:!0}),Flip:p({flip:{label:"Flip",value:!0},flipDuration:{label:"Duration",value:2,min:1,max:2,step:.01},flipDelay:{label:"Delay",value:4,min:0,max:10,step:.01}},{collapsed:!0})},{collapsed:!0}),b=l.useRef(),W=l.useRef(),D=l.useRef();return H(({clock:K})=>{const F=K.getElapsedTime();S?b.current.position.y=$(F,_,x):b.current.position.y!==0&&(b.current.position.y=$(F,_*2,x),Math.abs(b.current.position.y)<.01&&(b.current.position.y=0)),G?b.current.rotation.y=P($(F,Q,V)):b.current.rotation.y!==0&&(b.current.rotation.y=P($(F,Q*2,V)),Math.abs(b.current.rotation.y)<.1&&(b.current.rotation.y=0)),(C||D.current.rotation.x!==0)&&(D.current.rotation.x=rt(F,m,z))}),c.jsx("group",{...w,dispose:null,children:c.jsxs("group",{ref:b,children:[c.jsx("group",{position:[r.x,r.y,r.z],rotation:[P(e.x),P(e.y),P(e.z)],children:c.jsx("group",{ref:W,children:c.jsx(Ee,{innerColor:t,innerColorEmissive:o,innerColorEmissiveIntensity:i,outerColor:s,outerColorEmissive:a,outerColorEmissiveIntensity:n})})}),c.jsx("group",{position:[h.x,h.y,h.z],rotation:[P(u.x),P(u.y),P(u.z)],children:c.jsx("group",{ref:D,children:c.jsx(Fe,{innerColor:v,innerColorEmissive:g,innerColorEmissiveIntensity:f,outerColor:d,outerColorEmissive:T,outerColorEmissiveIntensity:E})})})]})})}ee({UnrealBloomPass:Ve});function he(r,e=8,t=2,o=10){const i=r/1e3,s=Math.random()*t,a=Math.sin(i*2*Math.PI*o),n=e+t*a+s;return Math.max(1,Math.min(10,n))}function pt(){const{backgroundColor:r,fogColor:e,fogNear:t,fogFar:o,bloomThreshold:i,bloomStrength:s,bloomRadius:a,bretPosition:n,bretRotation:h,bretInnerColor:u,bretInnerColorEmissive:v,bretInnerColorEmissiveIntensity:g,bretOuterColor:f,bretOuterColorEmissive:d,bretOuterColorEmissiveIntensity:T,reversalPosition:E,reversalRotation:w,reversalInnerColor:S,reversalInnerColorEmissive:_,reversalInnerColorEmissiveIntensity:x,reversalOuterColor:C,reversalOuterColorEmissive:m,reversalOuterColorEmissiveIntensity:z,sparkleColor:G,sparkleCount:V,sparkleNoise:Q,sparkleOpactity:b,sparkleScale:W,sparkleSize:D,sparkleSpeed:K,enableNeonFlicker:F,neonFlickerIntensity:re,neonFlickerFrequency:se}=me("LoGlow",{Background:p({backgroundColor:{label:"Background Color",value:"#202030"},Fog:p({fogColor:{label:"Fog Color",value:"#202030"},fogNear:{label:"Fog Near",value:10},fogFar:{label:"Fog Far",value:25}},{collapsed:!0})},{collapsed:!0}),Bloom:p({bloomThreshold:{label:"Bloom Threshold",value:.1,min:0,max:10},bloomStrength:{label:"Bloom Strength",value:.2,min:0,max:10},bloomRadius:{label:"Bloom Radius",value:.2,min:0,max:10}},{collapsed:!0}),Logo:p({Bret:p({bretPosition:{label:"Position",value:{x:0,y:0,z:0}},bretRotation:{label:"Rotation",value:{x:0,y:0,z:0}},"Inner Color":p({bretInnerColor:{label:"Color",value:"#FF0000"},bretInnerColorEmissive:{label:"Emissive",value:!0},bretInnerColorEmissiveIntensity:{label:"Emissive Intensity",value:5,min:0,max:10,step:.1}},{collapsed:!0}),"Outer Color":p({bretOuterColor:{label:"Color",value:"#000000"},bretOuterColorEmissive:{label:"Emissive",value:!1},bretOuterColorEmissiveIntensity:{label:"Emissive Intensity",value:0,min:0,max:10,step:.1}},{collapsed:!0})},{collapsed:!0}),Reversal:p({reversalPosition:{label:"Position",value:{x:.9,y:-.4,z:0}},reversalRotation:{label:"Rotation",value:{x:0,y:0,z:0}},"Inner Color":p({reversalInnerColor:{label:"Color",value:"#FF0000"},reversalInnerColorEmissive:{label:"Emissive",value:!0},reversalInnerColorEmissiveIntensity:{label:"Emissive Intensity",value:5,min:0,max:10,step:.1}},{collapsed:!0}),"Outer Color":p({reversalOuterColor:{label:"Color",value:"#000000"},reversalOuterColorEmissive:{label:"Emissive",value:!1},reversalOuterColorEmissiveIntensity:{label:"Emissive Intensity",value:0,min:0,max:10,step:.1}},{collapsed:!0})},{collapsed:!0}),Neon:p({enableNeonFlicker:{label:"Flicker",value:!0},neonFlickerIntensity:{label:"Intensity",value:2,min:.1,max:10},neonFlickerFrequency:{label:"Frequency",value:10,min:.1,max:10}},{collapsed:!0})},{collapsed:!0}),Sparkles:p({sparkleCount:{label:"Count",value:100,min:10,max:500},sparkleSpeed:{label:"Speed",value:.71,min:0,max:10},sparkleOpactity:{label:"Opacity",value:.7,min:0,max:1},sparkleColor:{label:"Color",value:"#FFFFFF"},sparkleSize:{label:"Size",value:.7,min:.1,max:10},sparkleScale:{label:"Scale",value:3.6,min:0,max:10},sparkleNoise:{label:"Noise",value:1,min:0,max:10}},{collapsed:!0})},{collapsed:!0}),[{reversalEmissiveIntensity:ie,bretEmissiveIntensity:q},ae]=l.useState({reversalEmissiveIntensity:0,bretEmissiveIntensity:0});return H(({clock:oe})=>{F?ae({reversalEmissiveIntensity:he(oe.getElapsedTime(),x,re,se),bretEmissiveIntensity:he(oe.getElapsedTime(),g,re,se)}):(ie!==x||q!==g)&&ae({reversalEmissiveIntensity:x,bretEmissiveIntensity:g})}),c.jsxs(c.Fragment,{children:[c.jsx(Re,{}),c.jsx(Be,{makeDefault:!0,position:[0,0,5]}),c.jsx(tt,{}),c.jsx("color",{attach:"background",args:[r]}),c.jsx("fog",{attach:"fog",args:[e,t,o]}),c.jsx(st,{scale:2,bretPosition:n,bretRotation:h,bretInnerColor:u,bretInnerColorEmissive:v,bretInnerColorEmissiveIntensity:q,bretEmissiveIntensity:q,bretOuterColor:f,bretOuterColorEmissive:d,bretOuterColorEmissiveIntensity:T,reversalPosition:E,reversalRotation:w,reversalInnerColor:S,reversalInnerColorEmissive:_,reversalInnerColorEmissiveIntensity:ie,reversalOuterColor:C,reversalOuterColorEmissive:m,reversalOuterColorEmissiveIntensity:z}),c.jsx(et,{count:V,speed:K,opacity:b,color:G,size:D,scale:W,noise:Q}),c.jsx(Ye,{disableGamma:!0,children:c.jsx("unrealBloomPass",{threshold:i,strength:s,radius:a})})]})}export{pt as default};
