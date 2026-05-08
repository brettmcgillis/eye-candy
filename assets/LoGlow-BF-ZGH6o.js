import{ar as je,be as Le,aA as ke,ay as B,aN as q,a0 as O,$ as P,a4 as L,a6 as N,Z as A,am as Ve,bl as $e,aG as ae,aI as re,by as Qe,cE as Ne,S as l,a1 as te,Y as W,ch as He,a2 as k,a3 as Ge,_ as We,aX as H,ap as G,a_ as oe,j as u,aY as le,aZ as Ye,ad as Ke,ag as x}from"./index-BnEdaNJi.js";import{r as F,s as $}from"./math-C0Z1meOP.js";import{a as ne}from"./react-spring_three.modern-_b0ee3kx.js";import{u as ue}from"./Gltf-CSpc80XO.js";import{P as Xe}from"./PerspectiveCamera-BaA1ZILh.js";import{_ as he}from"./extends-CF3RwP-h.js";import{v as Ze}from"./constants-BOBXA0R7.js";import"./constants-cD_MYstD.js";import"./Fbo-BumDy1H5.js";var qe=Object.defineProperty,Je=(r,e,t)=>e in r?qe(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,I=(r,e,t)=>(Je(r,typeof e!="symbol"?e+"":e,t),t);class V{constructor(){I(this,"enabled",!0),I(this,"needsSwap",!0),I(this,"clear",!1),I(this,"renderToScreen",!1)}setSize(e,t){}render(e,t,o,a,s){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}class ce{constructor(e){I(this,"camera",new je(-1,1,1,-1,0,1)),I(this,"geometry",new Le(2,2)),I(this,"mesh"),this.mesh=new ke(this.geometry,e)}get material(){return this.mesh.material}set material(e){this.mesh.material=e}dispose(){this.mesh.geometry.dispose()}render(e){e.render(this.mesh,this.camera)}}var et=Object.defineProperty,tt=(r,e,t)=>e in r?et(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,Q=(r,e,t)=>(tt(r,typeof e!="symbol"?e+"":e,t),t);class J extends V{constructor(e,t="tDiffuse"){super(),Q(this,"textureID"),Q(this,"uniforms"),Q(this,"material"),Q(this,"fsQuad"),this.textureID=t,e instanceof B?(this.uniforms=e.uniforms,this.material=e):(this.uniforms=q.clone(e.uniforms),this.material=new B({defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this.fsQuad=new ce(this.material)}render(e,t,o){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=o.texture),this.fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.fsQuad.dispose(),this.material.dispose()}}const ee={uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`
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
  `},rt={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new O(0)},defaultOpacity:{value:0}},vertexShader:`
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
  `};var st=Object.defineProperty,it=(r,e,t)=>e in r?st(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,se=(r,e,t)=>(it(r,typeof e!="symbol"?e+"":e,t),t);const at=(()=>{const r=class extends V{constructor(t,o,a,s){super(),this.strength=o!==void 0?o:1,this.radius=a,this.threshold=s,this.resolution=t!==void 0?new P(t.x,t.y):new P(256,256),this.clearColor=new O(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let i=Math.round(this.resolution.x/2),n=Math.round(this.resolution.y/2);this.renderTargetBright=new L(i,n,{type:N}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let c=0;c<this.nMips;c++){const m=new L(i,n,{type:N});m.texture.name="UnrealBloomPass.h"+c,m.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(m);const y=new L(i,n,{type:N});y.texture.name="UnrealBloomPass.v"+c,y.texture.generateMipmaps=!1,this.renderTargetsVertical.push(y),i=Math.round(i/2),n=Math.round(n/2)}const d=rt;this.highPassUniforms=q.clone(d.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new B({uniforms:this.highPassUniforms,vertexShader:d.vertexShader,fragmentShader:d.fragmentShader,defines:{}}),this.separableBlurMaterials=[];const h=[3,5,7,9,11];i=Math.round(this.resolution.x/2),n=Math.round(this.resolution.y/2);for(let c=0;c<this.nMips;c++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(h[c])),this.separableBlurMaterials[c].uniforms.texSize.value=new P(i,n),i=Math.round(i/2),n=Math.round(n/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=o,this.compositeMaterial.uniforms.bloomRadius.value=.1,this.compositeMaterial.needsUpdate=!0;const v=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=v,this.bloomTintColors=[new A(1,1,1),new A(1,1,1),new A(1,1,1),new A(1,1,1),new A(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;const g=ee;this.copyUniforms=q.clone(g.uniforms),this.copyUniforms.opacity.value=1,this.materialCopy=new B({uniforms:this.copyUniforms,vertexShader:g.vertexShader,fragmentShader:g.fragmentShader,blending:Ve,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new O,this.oldClearAlpha=1,this.basic=new $e,this.fsQuad=new ce(null)}dispose(){for(let t=0;t<this.renderTargetsHorizontal.length;t++)this.renderTargetsHorizontal[t].dispose();for(let t=0;t<this.renderTargetsVertical.length;t++)this.renderTargetsVertical[t].dispose();this.renderTargetBright.dispose();for(let t=0;t<this.separableBlurMaterials.length;t++)this.separableBlurMaterials[t].dispose();this.compositeMaterial.dispose(),this.materialCopy.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(t,o){let a=Math.round(t/2),s=Math.round(o/2);this.renderTargetBright.setSize(a,s);for(let i=0;i<this.nMips;i++)this.renderTargetsHorizontal[i].setSize(a,s),this.renderTargetsVertical[i].setSize(a,s),this.separableBlurMaterials[i].uniforms.texSize.value=new P(a,s),a=Math.round(a/2),s=Math.round(s/2)}render(t,o,a,s,i){t.getClearColor(this._oldClearColor),this.oldClearAlpha=t.getClearAlpha();const n=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),i&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=a.texture,t.setRenderTarget(null),t.clear(),this.fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=a.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this.fsQuad.render(t);let d=this.renderTargetBright;for(let h=0;h<this.nMips;h++)this.fsQuad.material=this.separableBlurMaterials[h],this.separableBlurMaterials[h].uniforms.colorTexture.value=d.texture,this.separableBlurMaterials[h].uniforms.direction.value=r.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[h]),t.clear(),this.fsQuad.render(t),this.separableBlurMaterials[h].uniforms.colorTexture.value=this.renderTargetsHorizontal[h].texture,this.separableBlurMaterials[h].uniforms.direction.value=r.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[h]),t.clear(),this.fsQuad.render(t),d=this.renderTargetsVertical[h];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this.fsQuad.render(t),this.fsQuad.material=this.materialCopy,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,i&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(a),this.fsQuad.render(t)),t.setClearColor(this._oldClearColor,this.oldClearAlpha),t.autoClear=n}getSeperableBlurMaterial(t){return new B({defines:{KERNEL_RADIUS:t,SIGMA:t},uniforms:{colorTexture:{value:null},texSize:{value:new P(.5,.5)},direction:{value:new P(.5,.5)}},vertexShader:`varying vec2 vUv;
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
				}`})}};let e=r;return se(e,"BlurDirectionX",new P(1,0)),se(e,"BlurDirectionY",new P(0,1)),e})();var ot=Object.defineProperty,lt=(r,e,t)=>e in r?ot(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,Z=(r,e,t)=>(lt(r,typeof e!="symbol"?e+"":e,t),t);class ie extends V{constructor(e,t){super(),Z(this,"scene"),Z(this,"camera"),Z(this,"inverse"),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,o){const a=e.getContext(),s=e.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let i,n;this.inverse?(i=0,n=1):(i=1,n=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(a.REPLACE,a.REPLACE,a.REPLACE),s.buffers.stencil.setFunc(a.ALWAYS,i,4294967295),s.buffers.stencil.setClear(n),s.buffers.stencil.setLocked(!0),e.setRenderTarget(o),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(a.EQUAL,1,4294967295),s.buffers.stencil.setOp(a.KEEP,a.KEEP,a.KEEP),s.buffers.stencil.setLocked(!0)}}class nt extends V{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}var ut=Object.defineProperty,ht=(r,e,t)=>e in r?ut(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,w=(r,e,t)=>(ht(r,typeof e!="symbol"?e+"":e,t),t);class ct{constructor(e,t){if(w(this,"renderer"),w(this,"_pixelRatio"),w(this,"_width"),w(this,"_height"),w(this,"renderTarget1"),w(this,"renderTarget2"),w(this,"writeBuffer"),w(this,"readBuffer"),w(this,"renderToScreen"),w(this,"passes",[]),w(this,"copyPass"),w(this,"clock"),this.renderer=e,t===void 0){const o={minFilter:re,magFilter:re,format:ae},a=e.getSize(new P);this._pixelRatio=e.getPixelRatio(),this._width=a.width,this._height=a.height,t=new L(this._width*this._pixelRatio,this._height*this._pixelRatio,o),t.texture.name="EffectComposer.rt1"}else this._pixelRatio=1,this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,ee===void 0&&console.error("THREE.EffectComposer relies on CopyShader"),J===void 0&&console.error("THREE.EffectComposer relies on ShaderPass"),this.copyPass=new J(ee),this.copyPass.material.blending=Qe,this.clock=new Ne}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());const t=this.renderer.getRenderTarget();let o=!1;const a=this.passes.length;for(let s=0;s<a;s++){const i=this.passes[s];if(i.enabled!==!1){if(i.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),i.render(this.renderer,this.writeBuffer,this.readBuffer,e,o),i.needsSwap){if(o){const n=this.renderer.getContext(),d=this.renderer.state.buffers.stencil;d.setFunc(n.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),d.setFunc(n.EQUAL,1,4294967295)}this.swapBuffers()}ie!==void 0&&(i instanceof ie?o=!0:i instanceof nt&&(o=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new P);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const o=this._width*this._pixelRatio,a=this._height*this._pixelRatio;this.renderTarget1.setSize(o,a),this.renderTarget2.setSize(o,a);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(o,a)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}var ft=Object.defineProperty,mt=(r,e,t)=>e in r?ft(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,z=(r,e,t)=>(mt(r,typeof e!="symbol"?e+"":e,t),t);class dt extends V{constructor(e,t,o,a,s=0){super(),z(this,"scene"),z(this,"camera"),z(this,"overrideMaterial"),z(this,"clearColor"),z(this,"clearAlpha"),z(this,"clearDepth",!1),z(this,"_oldClearColor",new O),this.scene=e,this.camera=t,this.overrideMaterial=o,this.clearColor=a,this.clearAlpha=s,this.clear=!0,this.needsSwap=!1}render(e,t,o){let a=e.autoClear;e.autoClear=!1;let s,i=null;this.overrideMaterial!==void 0&&(i=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor&&(e.getClearColor(this._oldClearColor),s=e.getClearAlpha(),e.setClearColor(this.clearColor,this.clearAlpha)),this.clearDepth&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:o),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor&&e.setClearColor(this._oldClearColor,s),this.overrideMaterial!==void 0&&(this.scene.overrideMaterial=i),e.autoClear=a}}const pt={uniforms:{tDiffuse:{value:null}},vertexShader:`
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
  `},vt=l.forwardRef(({children:r,multisamping:e=8,renderIndex:t=1,disableRender:o,disableGamma:a,disableRenderPass:s,depthBuffer:i=!0,stencilBuffer:n=!1,anisotropy:d=1,colorSpace:h,type:v,...g},c)=>{l.useMemo(()=>te({EffectComposer:ct,RenderPass:dt,ShaderPass:J}),[]);const m=l.useRef(null);l.useImperativeHandle(c,()=>m.current,[]);const{scene:y,camera:M,gl:C,size:f,viewport:p}=W(),[_]=l.useState(()=>{const b=new L(f.width,f.height,{type:v||N,format:ae,depthBuffer:i,stencilBuffer:n,anisotropy:d});return v===He&&h!=null&&(b.texture.colorSpace=h),b.samples=e,b});l.useEffect(()=>{var b,D;(b=m.current)==null||b.setSize(f.width,f.height),(D=m.current)==null||D.setPixelRatio(p.dpr)},[C,f,p.dpr]),k(()=>{var b;o||(b=m.current)==null||b.render()},t);const T=[];return s||T.push(l.createElement("renderPass",{key:"renderpass",attach:`passes-${T.length}`,args:[y,M]})),a||T.push(l.createElement("shaderPass",{attach:`passes-${T.length}`,key:"gammapass",args:[pt]})),l.Children.forEach(r,b=>{b&&T.push(l.cloneElement(b,{key:T.length,attach:`passes-${T.length}`}))}),l.createElement("effectComposer",he({ref:m,args:[C,_]},g),T)});class gt extends B{constructor(){super({uniforms:{time:{value:0},pixelRatio:{value:1}},vertexShader:`
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
          #include <${Ze>=154?"colorspace_fragment":"encodings_fragment"}>
        }
      `})}get time(){return this.uniforms.time.value}set time(e){this.uniforms.time.value=e}get pixelRatio(){return this.uniforms.pixelRatio.value}set pixelRatio(e){this.uniforms.pixelRatio.value=e}}const fe=r=>r&&r.constructor===Float32Array,xt=r=>[r.r,r.g,r.b],me=r=>r instanceof P||r instanceof A||r instanceof We,de=r=>Array.isArray(r)?r:me(r)?r.toArray():[r,r,r];function j(r,e,t){return l.useMemo(()=>{if(e!==void 0){if(fe(e))return e;if(e instanceof O){const o=Array.from({length:r*3},()=>xt(e)).flat();return Float32Array.from(o)}else if(me(e)||Array.isArray(e)){const o=Array.from({length:r*3},()=>de(e)).flat();return Float32Array.from(o)}return Float32Array.from({length:r},()=>e)}return Float32Array.from({length:r},t)},[e])}const bt=l.forwardRef(({noise:r=1,count:e=100,speed:t=1,opacity:o=1,scale:a=1,size:s,color:i,children:n,...d},h)=>{l.useMemo(()=>te({SparklesImplMaterial:gt}),[]);const v=l.useRef(null),g=W(_=>_.viewport.dpr),c=de(a),m=l.useMemo(()=>Float32Array.from(Array.from({length:e},()=>c.map(Ge.randFloatSpread)).flat()),[e,...c]),y=j(e,s,Math.random),M=j(e,o),C=j(e,t),f=j(e*3,r),p=j(i===void 0?e*3:e,fe(i)?i:new O(i),()=>1);return k(_=>{v.current&&v.current.material&&(v.current.material.time=_.clock.elapsedTime)}),l.useImperativeHandle(h,()=>v.current,[]),l.createElement("points",he({key:`particle-${e}-${JSON.stringify(a)}`},d,{ref:v}),l.createElement("bufferGeometry",null,l.createElement("bufferAttribute",{attach:"attributes-position",args:[m,3]}),l.createElement("bufferAttribute",{attach:"attributes-size",args:[y,1]}),l.createElement("bufferAttribute",{attach:"attributes-opacity",args:[M,1]}),l.createElement("bufferAttribute",{attach:"attributes-speed",args:[C,1]}),l.createElement("bufferAttribute",{attach:"attributes-color",args:[p,3]}),l.createElement("bufferAttribute",{attach:"attributes-noise",args:[f,3]})),n||l.createElement("sparklesImplMaterial",{transparent:!0,pixelRatio:g,depthWrite:!1}))});function yt(){const r=W(e=>e.gl);return l.useEffect(()=>(r.shadowMap.autoUpdate=!1,r.shadowMap.needsUpdate=!0,()=>{r.shadowMap.autoUpdate=r.shadowMap.needsUpdate=!0}),[r.shadowMap]),null}function pe(r,e=8,t=2,o=10){const a=r/1e3,s=Math.random()*t,i=Math.sin(a*2*Math.PI*o),n=e+t*i+s;return Math.max(1,Math.min(10,n))}function Ct({innerMaterial:r,outerMaterial:e,innerProps:t,outerProps:o,...a}){const{nodes:s}=ue(le("Bret.glb"));return u.jsx("group",{...a,dispose:null,children:u.jsxs("group",{rotation:[Math.PI/2,0,0],children:[u.jsx(ne.mesh,{castShadow:!0,receiveShadow:!0,geometry:s["bret-in"].geometry,material:r,scale:[10,.524,10],...t}),u.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:s["bret-out"].geometry,material:e,scale:[10,.524,10],...o})]})})}function St({pressDepth:r=.012,emissiveIntensity:e=2.5,enableNeonFlicker:t=!0,neonFlickerIntensity:o=2,neonFlickerFrequency:a=10,innerColor:s="#ff0000",outerColor:i="#000000",onClick:n,...d}){const[h,v]=l.useState(!0),[g,c]=l.useState(!1),m=l.useMemo(()=>new H({color:s,emissive:s,emissiveIntensity:0,side:G}),[s]),y=l.useMemo(()=>new H({color:i,side:G}),[i]),{pressY:M}=oe({pressY:g?-r:0,config:{mass:.6,tension:320,friction:16}});k(({clock:f})=>{if(!m)return;let p=0;h&&t?p=pe(f.getElapsedTime(),e,o,a):h&&(p=e),m.emissiveIntensity=p});const C={onPointerDown:f=>{f.stopPropagation(),c(!0)},onPointerUp:f=>{f.stopPropagation(),c(!1),v(p=>!p),n?.()},onPointerLeave:()=>c(!1)};return u.jsx(Ct,{...d,innerMaterial:m,outerMaterial:y,innerProps:{"position-y":M,...C},outerProps:C})}function Tt({innerMaterial:r,outerMaterial:e,innerProps:t={},outerProps:o={},...a}){const{nodes:s}=ue(le("Reversal.glb")),i=n=>Ye.isValidElement(n);return u.jsx("group",{...a,dispose:null,children:u.jsxs("group",{rotation:[Math.PI/2,0,0],children:[r&&u.jsx(ne.mesh,{castShadow:!0,receiveShadow:!0,geometry:s["reversal-in"].geometry,scale:[10,1.018,10],...t,children:i(r)?r:u.jsx("primitive",{attach:"material",object:r})}),e&&u.jsx("mesh",{castShadow:!0,receiveShadow:!0,geometry:s["reversal-out"].geometry,scale:[10,1.018,10],...o,children:i(e)?e:u.jsx("primitive",{attach:"material",object:e})})]})})}function wt({pressDepth:r=.015,emissiveIntensity:e=2.5,enableNeonFlicker:t=!0,neonFlickerIntensity:o=2,neonFlickerFrequency:a=10,innerColor:s="#ff0000",outerColor:i="#000000",onClick:n,...d}){const[h,v]=l.useState(!0),[g,c]=l.useState(!1),m=l.useMemo(()=>new H({color:s,emissive:s,emissiveIntensity:0,side:G}),[s]),y=l.useMemo(()=>new H({color:i,side:G}),[i]),{pressY:M}=oe({pressY:g?-r:0,config:{mass:.6,tension:300,friction:14}});k(({clock:f})=>{if(!m)return;let p=0;h&&t?p=pe(f.getElapsedTime(),e,o,a):h&&(p=e),m.emissiveIntensity=p});const C={onPointerDown:f=>{f.stopPropagation(),n?.(),c(!0)},onPointerUp:f=>{f.stopPropagation(),c(!1),v(p=>!p)},onPointerLeave:()=>c(!1)};return u.jsx(Tt,{...d,innerMaterial:m,outerMaterial:y,outerProps:C,innerProps:{"position-y":M,...C}})}function Mt(r,e,t){const o=r%(e+t);return o<e?0:(o-e)/t*2*Math.PI}function Pt({bretPosition:r={x:0,y:0,z:0},bretRotation:e={x:0,y:0,z:0},bretInnerColor:t="#FF0000",bretInnerColorEmissiveIntensity:o=0,bretOuterColor:a="#000000",reversalPosition:s={x:.9,y:-.4,z:0},reversalRotation:i={x:0,y:0,z:0},reversalInnerColor:n="#FF0000",reversalInnerColorEmissiveIntensity:d=0,reversalOuterColor:h="#000000",float:v=!0,floatSpeed:g=1,floatIntensity:c=.05,flip:m=!0,flipDelay:y=4,flipDuration:M=2,spin:C=!0,spinRotation:f=33,spinSpeed:p=.4,enableNeonFlicker:_=!0,neonFlickerIntensity:T=2,neonFlickerFrequency:b=10,bretPressDepth:D=.012,reversalPressDepth:Y=.015,...K}){const S=l.useRef(),U=l.useRef(),R=l.useMemo(()=>({x:(r.x+s.x)/2,y:(r.y+s.y)/2,z:(r.z+s.z)/2}),[r.x,r.y,r.z,s.x,s.y,s.z]);return k(({clock:X})=>{const E=X.getElapsedTime();!S.current||!U.current||(v?S.current.position.y=$(E,g,c):S.current.position.y!==0&&(S.current.position.y=$(E,g*2,c),Math.abs(S.current.position.y)<.01&&(S.current.position.y=0)),C?S.current.rotation.y=F($(E,p,f)):S.current.rotation.y!==0&&(S.current.rotation.y=F($(E,p*2,f)),Math.abs(S.current.rotation.y)<.1&&(S.current.rotation.y=0)),(m||U.current.rotation.x!==0)&&(U.current.rotation.x=Mt(E,y,M)))}),u.jsx("group",{...K,dispose:null,children:u.jsxs("group",{ref:S,children:[u.jsx("group",{position:[r.x-R.x,r.y-R.y,r.z-R.z],rotation:[F(e.x),F(e.y),F(e.z)],children:u.jsx(St,{pressDepth:D,emissiveIntensity:o,enableNeonFlicker:_,neonFlickerIntensity:T,neonFlickerFrequency:b,innerColor:t,outerColor:a})}),u.jsx("group",{position:[s.x-R.x,s.y-R.y,s.z-R.z],rotation:[F(i.x),F(i.y),F(i.z)],children:u.jsx("group",{ref:U,children:u.jsx(wt,{pressDepth:Y,emissiveIntensity:d,enableNeonFlicker:_,neonFlickerIntensity:T,neonFlickerFrequency:b,innerColor:n,outerColor:h})})})]})})}function _t(){return Ke("LoGlow",{Background:x({backgroundColor:{label:"Color",value:"#202030"},Fog:x({fogColor:{label:"Color",value:"#202030"},fogNear:{label:"Near",value:10},fogFar:{label:"Far",value:25}},{collapsed:!0})},{collapsed:!0}),Lighting:x({Ambient:x({ambientColor:{label:"Color",value:"#ffffff"},ambientIntensity:{label:"Intensity",value:.35,min:0,max:3}},{collapsed:!0}),Key:x({keyColor:{label:"Key Color",value:"#ffffff"},keyIntensity:{label:"Key Intensity",value:1.1,min:0,max:5},keyPosition:{label:"Position",value:{x:2.5,y:2,z:4}}},{collapsed:!0})},{collapsed:!0}),Bloom:x({bloomThreshold:{label:"Threshold",value:.1,min:0,max:10},bloomStrength:{label:"Strength",value:.2,min:0,max:10},bloomRadius:{label:"Radius",value:.2,min:0,max:10}},{collapsed:!0}),Sparkles:x({sparkleCount:{label:"Count",value:100,min:10,max:500},sparkleSpeed:{label:"Speed",value:.71,min:0,max:10},sparkleOpactity:{label:"Opacity",value:.7,min:0,max:1},sparkleColor:{label:"Color",value:"#FFFFFF"},sparkleSize:{label:"Size",value:.7,min:.1,max:10},sparkleScale:{label:"Scale",value:3.6,min:0,max:10},sparkleNoise:{label:"Noise",value:1,min:0,max:10}},{collapsed:!0}),Logo:x({Bret:x({bretPosition:{label:"Position",value:{x:0,y:0,z:0}},bretRotation:{label:"Rotation",value:{x:0,y:0,z:0}},bretPressDepth:{label:"Depth",value:.012,min:0,max:.1,step:.001},"Inner Color":x({bretInnerColor:{label:"Color",value:"#FF0000"},bretInnerColorEmissive:{label:"Emissive",value:!0},bretInnerColorEmissiveIntensity:{label:"Intensity",value:5,min:0,max:10,step:.1}},{collapsed:!0}),"Outer Color":x({bretOuterColor:{label:"Color",value:"#000000"},bretOuterColorEmissive:{label:"Emissive",value:!1},bretOuterColorEmissiveIntensity:{label:"Intensity",value:0,min:0,max:10,step:.1}},{collapsed:!0})},{collapsed:!0}),Reversal:x({reversalPosition:{label:"Position",value:{x:.9,y:-.4,z:0}},reversalRotation:{label:"Rotation",value:{x:0,y:0,z:0}},reversalPressDepth:{label:"Depth",value:.015,min:0,max:.1,step:.001},"Inner Color":x({reversalInnerColor:{label:"Color",value:"#FF0000"},reversalInnerColorEmissive:{label:"Emissive",value:!0},reversalInnerColorEmissiveIntensity:{label:"Intensity",value:5,min:0,max:10,step:.1}},{collapsed:!0}),"Outer Color":x({reversalOuterColor:{label:"Color",value:"#000000"},reversalOuterColorEmissive:{label:"Emissive",value:!1},reversalOuterColorEmissiveIntensity:{label:"Intensity",value:0,min:0,max:10,step:.1}},{collapsed:!0})},{collapsed:!0}),Neon:x({enableNeonFlicker:{label:"Flicker",value:!0},neonFlickerIntensity:{label:"Intensity",value:2,min:.1,max:10},neonFlickerFrequency:{label:"Frequency",value:10,min:.1,max:10}},{collapsed:!0}),Flip:x({flip:{label:"Enabled",value:!0},flipDuration:{label:"Duration",value:2,min:1,max:2,step:.01},flipDelay:{label:"Delay",value:4,min:0,max:10,step:.01}},{collapsed:!0}),Float:x({float:{label:"Enabled",value:!0},floatSpeed:{label:"Speed",value:1,min:0,max:10,step:.01},floatIntensity:{label:"Intensity",value:.05,min:0,max:1,step:.01}},{collapsed:!0}),Spin:x({spin:{label:"Enabled",value:!0},spinRotation:{label:"Rotation",value:33,min:0,max:360,step:1},spinSpeed:{label:"Speed",value:.4,min:0,max:1,step:.01}},{collapsed:!0})},{collapsed:!0})},{collapsed:!0})}te({UnrealBloomPass:at});function Ot(){const{size:r}=W(),e=r.width<=768?6.5:5,t=r.width<=768?0:-.2,{backgroundColor:o,fogColor:a,fogNear:s,fogFar:i,ambientColor:n,ambientIntensity:d,keyColor:h,keyIntensity:v,keyPosition:g,bloomThreshold:c,bloomStrength:m,bloomRadius:y,bretPosition:M,bretRotation:C,bretInnerColor:f,bretInnerColorEmissive:p,bretInnerColorEmissiveIntensity:_,bretOuterColor:T,bretOuterColorEmissive:b,bretOuterColorEmissiveIntensity:D,reversalPosition:Y,reversalRotation:K,reversalInnerColor:S,reversalInnerColorEmissive:U,reversalInnerColorEmissiveIntensity:R,reversalOuterColor:X,reversalOuterColorEmissive:E,reversalOuterColorEmissiveIntensity:ve,bretPressDepth:ge,reversalPressDepth:xe,flip:be,flipDelay:ye,flipDuration:Ce,float:Se,floatSpeed:Te,floatIntensity:we,spin:Me,spinRotation:Pe,spinSpeed:_e,sparkleColor:Re,sparkleCount:Fe,sparkleNoise:Ee,sparkleOpactity:ze,sparkleScale:Be,sparkleSize:Ie,sparkleSpeed:De,enableNeonFlicker:Ue,neonFlickerIntensity:Ae,neonFlickerFrequency:Oe}=_t();return u.jsxs(u.Fragment,{children:[u.jsx("ambientLight",{color:n,intensity:d}),u.jsx("directionalLight",{color:h,intensity:v,position:[g.x,g.y,g.z]}),u.jsx(Xe,{makeDefault:!0,position:[0,0,e]}),u.jsx(yt,{}),u.jsx("color",{attach:"background",args:[o]}),u.jsx("fog",{attach:"fog",args:[a,s,i]}),u.jsx(Pt,{scale:2,position:[0,t,0],bretPosition:M,bretRotation:C,bretInnerColor:f,bretInnerColorEmissive:p,bretInnerColorEmissiveIntensity:_,bretOuterColor:T,bretOuterColorEmissive:b,bretOuterColorEmissiveIntensity:D,reversalPosition:Y,reversalRotation:K,reversalInnerColor:S,reversalInnerColorEmissive:U,reversalInnerColorEmissiveIntensity:R,reversalOuterColor:X,reversalOuterColorEmissive:E,reversalOuterColorEmissiveIntensity:ve,enableNeonFlicker:Ue,neonFlickerIntensity:Ae,neonFlickerFrequency:Oe,bretPressDepth:ge,reversalPressDepth:xe,flip:be,flipDelay:ye,flipDuration:Ce,float:Se,floatSpeed:Te,floatIntensity:we,spin:Me,spinRotation:Pe,spinSpeed:_e}),u.jsx(bt,{count:Fe,speed:De,opacity:ze,color:Re,size:Ie,scale:Be,noise:Ee}),u.jsx(vt,{disableGamma:!0,children:u.jsx("unrealBloomPass",{threshold:c,strength:m,radius:y})})]})}export{Ot as default};
