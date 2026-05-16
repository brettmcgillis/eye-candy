import{V as S,a5 as q,B as L,al as G,a8 as V,aJ as H,r as m,aE as I,t as U,p as X,o as k,j as o,E as Z,K as A,M as E,aQ as Q,aF as Y,a4 as K,Q as $}from"./index-ztHVU0OX.js";import{P as J,R as F}from"./react-three-rapier.esm-B39xfN7S.js";import{P as ee}from"./PerspectiveCamera-Dq1GF1ou.js";import{_ as te}from"./extends-CF3RwP-h.js";import{v as ae}from"./constants-DR7AhV3F.js";import{u as oe}from"./Gltf-Bk5HaZTX.js";import"./Fbo-C-CMAAit.js";var re=Object.defineProperty,se=(e,t,a)=>t in e?re(e,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):e[t]=a,N=(e,t,a)=>(se(e,typeof t!="symbol"?t+"":t,a),a);const ne=(()=>{const e={uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new S},up:{value:new S(0,1,0)}},vertexShader:`
      uniform vec3 sunPosition;
      uniform float rayleigh;
      uniform float turbidity;
      uniform float mieCoefficient;
      uniform vec3 up;

      varying vec3 vWorldPosition;
      varying vec3 vSunDirection;
      varying float vSunfade;
      varying vec3 vBetaR;
      varying vec3 vBetaM;
      varying float vSunE;

      // constants for atmospheric scattering
      const float e = 2.71828182845904523536028747135266249775724709369995957;
      const float pi = 3.141592653589793238462643383279502884197169;

      // wavelength of used primaries, according to preetham
      const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
      // this pre-calcuation replaces older TotalRayleigh(vec3 lambda) function:
      // (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
      const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

      // mie stuff
      // K coefficient for the primaries
      const float v = 4.0;
      const vec3 K = vec3( 0.686, 0.678, 0.666 );
      // MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
      const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

      // earth shadow hack
      // cutoffAngle = pi / 1.95;
      const float cutoffAngle = 1.6110731556870734;
      const float steepness = 1.5;
      const float EE = 1000.0;

      float sunIntensity( float zenithAngleCos ) {
        zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
        return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
      }

      vec3 totalMie( float T ) {
        float c = ( 0.2 * T ) * 10E-18;
        return 0.434 * c * MieConst;
      }

      void main() {

        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;

        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        gl_Position.z = gl_Position.w; // set z to camera.far

        vSunDirection = normalize( sunPosition );

        vSunE = sunIntensity( dot( vSunDirection, up ) );

        vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );

        float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );

      // extinction (absorbtion + out scattering)
      // rayleigh coefficients
        vBetaR = totalRayleigh * rayleighCoefficient;

      // mie coefficients
        vBetaM = totalMie( turbidity ) * mieCoefficient;

      }
    `,fragmentShader:`
      varying vec3 vWorldPosition;
      varying vec3 vSunDirection;
      varying float vSunfade;
      varying vec3 vBetaR;
      varying vec3 vBetaM;
      varying float vSunE;

      uniform float mieDirectionalG;
      uniform vec3 up;

      const vec3 cameraPos = vec3( 0.0, 0.0, 0.0 );

      // constants for atmospheric scattering
      const float pi = 3.141592653589793238462643383279502884197169;

      const float n = 1.0003; // refractive index of air
      const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)

      // optical length at zenith for molecules
      const float rayleighZenithLength = 8.4E3;
      const float mieZenithLength = 1.25E3;
      // 66 arc seconds -> degrees, and the cosine of that
      const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

      // 3.0 / ( 16.0 * pi )
      const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
      // 1.0 / ( 4.0 * pi )
      const float ONE_OVER_FOURPI = 0.07957747154594767;

      float rayleighPhase( float cosTheta ) {
        return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
      }

      float hgPhase( float cosTheta, float g ) {
        float g2 = pow( g, 2.0 );
        float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
        return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
      }

      void main() {

        vec3 direction = normalize( vWorldPosition - cameraPos );

      // optical length
      // cutoff angle at 90 to avoid singularity in next formula.
        float zenithAngle = acos( max( 0.0, dot( up, direction ) ) );
        float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
        float sR = rayleighZenithLength * inverse;
        float sM = mieZenithLength * inverse;

      // combined extinction factor
        vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

      // in scattering
        float cosTheta = dot( direction, vSunDirection );

        float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
        vec3 betaRTheta = vBetaR * rPhase;

        float mPhase = hgPhase( cosTheta, mieDirectionalG );
        vec3 betaMTheta = vBetaM * mPhase;

        vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
        Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );

      // nightsky
        float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
        float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
        vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
        vec3 L0 = vec3( 0.1 ) * Fex;

      // composition + solar disc
        float sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
        L0 += ( vSunE * 19000.0 * Fex ) * sundisk;

        vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

        vec3 retColor = pow( texColor, vec3( 1.0 / ( 1.2 + ( 1.2 * vSunfade ) ) ) );

        gl_FragColor = vec4( retColor, 1.0 );

      #include <tonemapping_fragment>
      #include <${ae>=154?"colorspace_fragment":"encodings_fragment"}>

      }
    `},t=new q({name:"SkyShader",fragmentShader:e.fragmentShader,vertexShader:e.vertexShader,uniforms:G.clone(e.uniforms),side:L,depthWrite:!1});class a extends V{constructor(){super(new H(1,1,1),t)}}return N(a,"SkyShader",e),N(a,"material",t),a})();function ie(e,t,a=new S){const r=Math.PI*(e-.5),s=2*Math.PI*(t-.5);return a.x=Math.cos(s),a.y=Math.sin(r),a.z=Math.sin(s),a}const le=m.forwardRef(({inclination:e=.6,azimuth:t=.1,distance:a=1e3,mieCoefficient:r=.005,mieDirectionalG:s=.8,rayleigh:u=.5,turbidity:n=10,sunPosition:i=ie(e,t),...l},h)=>{const c=m.useMemo(()=>new S().setScalar(a),[a]),[p]=m.useState(()=>new ne);return m.createElement("primitive",te({object:p,ref:h,"material-uniforms-mieCoefficient-value":r,"material-uniforms-mieDirectionalG-value":s,"material-uniforms-rayleigh-value":u,"material-uniforms-sunPosition-value":i,"material-uniforms-turbidity-value":n,scale:c},l))}),ce=`
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uWaveChoppiness;
  uniform float uWaveSpeed;

  // 4 Gerstner wave layers (direction.xy, frequency, amplitude)
  const int WAVE_COUNT = 4;
  vec4 waves[4];

  void initWaves() {
    waves[0] = vec4( 0.6,  0.8, 1.2, 1.0);   // long rolling swell
    waves[1] = vec4(-0.4,  0.9, 2.5, 0.4);   // cross-wind chop
    waves[2] = vec4( 0.9, -0.3, 3.8, 0.2);   // short ripple
    waves[3] = vec4(-0.7, -0.6, 5.0, 0.1);   // micro detail
  }

  // Returns vec3: (displacementX, height, displacementZ)
  vec3 gerstnerWave(vec3 pos) {
    vec3 result = vec3(0.0);
    for (int i = 0; i < WAVE_COUNT; i++) {
      vec2 dir  = normalize(waves[i].xy);
      float freq = waves[i].z;
      float amp  = waves[i].w * uWaveHeight;
      float Q    = uWaveChoppiness / (freq * amp * float(WAVE_COUNT));

      float phase = uWaveSpeed * freq;
      float theta = dot(dir, pos.xz) * freq + uTime * phase;
      float s = sin(theta);
      float c = cos(theta);

      result.x -= Q * amp * dir.x * s;
      result.z -= Q * amp * dir.y * s;
      result.y += amp * c;
    }
    return result;
  }

  // Compute normal from Gerstner wave partial derivatives
  vec3 gerstnerNormal(vec3 pos) {
    vec3 n = vec3(0.0, 1.0, 0.0);
    for (int i = 0; i < WAVE_COUNT; i++) {
      vec2 dir  = normalize(waves[i].xy);
      float freq = waves[i].z;
      float amp  = waves[i].w * uWaveHeight;
      float Q    = uWaveChoppiness / (freq * amp * float(WAVE_COUNT));

      float phase = uWaveSpeed * freq;
      float theta = dot(dir, pos.xz) * freq + uTime * phase;
      float s = sin(theta);
      float c = cos(theta);
      float WA = freq * amp;

      n.x -= dir.x * WA * s;
      n.z -= dir.y * WA * s;
      n.y -= Q * WA * c;
    }
    return normalize(n);
  }
`,me=`
  #include <common>
  ${ce}
`,ue=`
  initWaves();
  vec3 gNorm = gerstnerNormal(position);
  vec3 objectNormal = gNorm;
  #ifdef USE_TANGENT
    vec3 objectTangent = vec3(tangent.xyz);
  #endif
`,he=`
  initWaves();
  vec3 waveDisp = gerstnerWave(position);
  vec3 transformed = position + waveDisp;
  #ifdef USE_ALPHAHASH
    vPosition = vec3(position);
  #endif
`,b={uTime:{value:0},uWaveHeight:{value:.15},uWaveChoppiness:{value:.7},uWaveSpeed:{value:.8}};function ve({config:e}){const t=m.useMemo(()=>{const a=new I({color:new X(e.waterColor),metalness:e.waterMetalness,roughness:e.waterRoughness,transparent:!0,opacity:e.waterOpacity,side:U,envMapIntensity:1.2});return a.onBeforeCompile=r=>{const s=r;Object.entries(b).forEach(([u,n])=>{s.uniforms[u]=n}),s.vertexShader=s.vertexShader.replace("#include <common>",me),s.vertexShader=s.vertexShader.replace("#include <beginnormal_vertex>",ue),s.vertexShader=s.vertexShader.replace("#include <begin_vertex>",he)},a},[e.waterColor,e.waterMetalness,e.waterRoughness,e.waterOpacity]);return k((a,r)=>{b.uTime.value+=r,b.uWaveHeight.value=e.waveHeight,b.uWaveChoppiness.value=e.waveChoppiness,b.uWaveSpeed.value=e.waveSpeed}),o.jsx("primitive",{object:t,attach:"material"})}const pe=[{dx:.6,dz:.8,freq:1.2,amp:1},{dx:-.4,dz:.9,freq:2.5,amp:.4},{dx:.9,dz:-.3,freq:3.8,amp:.2},{dx:-.7,dz:-.6,freq:5,amp:.1}],C=pe.map(e=>{const t=Math.sqrt(e.dx*e.dx+e.dz*e.dz);return{dx:e.dx/t,dz:e.dz/t,freq:e.freq,amp:e.amp}});function O(e,t,a,r,s){const u=b.uTime.value;let n=0;for(let i=0;i<C.length;i+=1){const{dx:l,dz:h,freq:c,amp:p}=C[i],g=p*a,v=s*c,f=(l*e+h*t)*c+u*v;n+=g*Math.cos(f)}return n}function D(e,t,a,r,s){const u=b.uTime.value;let n=0,i=1,l=0;for(let c=0;c<C.length;c+=1){const{dx:p,dz:g,freq:v,amp:f}=C[c],y=f*a,w=r/(v*y*C.length),_=s*v,d=(p*e+g*t)*v+u*_,x=Math.sin(d),M=Math.cos(d),R=v*y;n-=p*R*x,l-=g*R*x,i-=w*R*M}const h=Math.sqrt(n*n+i*i+l*l);return{x:n/h,y:i/h,z:l/h}}function fe(){return Z("Row It Alone",{Water:A({waterColor:{label:"Color",value:"#1a4a5e"},waterMetalness:{label:"Metalness",value:.9,min:0,max:1,step:.01},waterRoughness:{label:"Roughness",value:.15,min:0,max:1,step:.01},waterOpacity:{label:"Opacity",value:.88,min:0,max:1,step:.01},waveHeight:{label:"Wave Height",value:.15,min:0,max:.6,step:.01},waveChoppiness:{label:"Choppiness",value:.7,min:0,max:2,step:.01},waveSpeed:{label:"Speed",value:.8,min:0,max:3,step:.01}},{collapsed:!0}),Sky:A({skyElevation:{label:"Sun Elevation",value:8,min:0,max:90,step:.5},skyAzimuth:{label:"Sun Azimuth",value:160,min:-180,max:180,step:1},skyTurbidity:{label:"Turbidity",value:8,min:0,max:20,step:.1},skyRayleigh:{label:"Rayleigh",value:1.5,min:0,max:4,step:.01},skyMieCoefficient:{label:"Mie Coefficient",value:.005,min:0,max:.1,step:.001},skyMieDirectionalG:{label:"Mie Directional",value:.8,min:0,max:1,step:.01}},{collapsed:!0}),Boat:A({boatX:{label:"X",value:0,min:-10,max:10,step:.1},boatZ:{label:"Z",value:0,min:-10,max:10,step:.1},boatScale:{label:"Scale",value:.4,min:.1,max:2,step:.01},boatRotY:{label:"Rotation Y (°)",value:-20,min:-180,max:180,step:1},boatBobSmooth:{label:"Bob Smoothing",value:.03,min:.005,max:.15,step:.005},boatTiltAmount:{label:"Tilt Amount",value:.6,min:0,max:2,step:.05}},{collapsed:!0}),Fog:A({fogColor:{label:"Color",value:"#8fa4a8"},fogNear:{label:"Near",value:15,min:1,max:100,step:1},fogFar:{label:"Far",value:80,min:10,max:300,step:1}},{collapsed:!0})})}const z=new K,P=new $,W=new S;function de({config:e}){const t=m.useMemo(()=>new Q(120,120,200,200),[]);return o.jsx("mesh",{geometry:t,rotation:[-Math.PI/2,0,0],receiveShadow:!0,children:o.jsx(ve,{config:e})})}function ge({config:e,nodes:t,materials:a}){const r=m.useRef(),s=m.useRef(0),u=m.useRef(0),n=m.useRef(0),i=E.degToRad(e.boatRotY);k(()=>{const h=r.current;if(!h)return;const{boatX:c,boatZ:p,waveHeight:g,waveChoppiness:v,waveSpeed:f,boatBobSmooth:y,boatTiltAmount:w}=e,_=O(c,p,g,v,f),d=D(c,p,g,v,f),x=y;s.current+=(_-s.current)*x,u.current+=(-Math.atan2(d.z,d.y)*w-u.current)*x,n.current+=(Math.atan2(d.x,d.y)*w-n.current)*x,W.set(c,s.current,p),h.setNextKinematicTranslation(W),z.set(u.current,i,n.current,"YXZ"),P.setFromEuler(z),h.setNextKinematicRotation(P)});const l=e.boatScale;return o.jsxs(F,{ref:r,type:"kinematicPosition",colliders:"hull",position:[e.boatX,0,e.boatZ],scale:[l,l,l],rotation:[0,i,0],children:[o.jsx("mesh",{name:"hull_mesh",castShadow:!0,receiveShadow:!0,geometry:t.hull_mesh.geometry,material:a.rowboat_1}),o.jsx("mesh",{name:"front_bench_mesh",castShadow:!0,receiveShadow:!0,geometry:t.front_bench_mesh.geometry,material:a.rowboat_2}),o.jsx("mesh",{name:"middle_bench_mesh",castShadow:!0,receiveShadow:!0,geometry:t.middle_bench_mesh.geometry,material:a.rowboat_2}),o.jsx("mesh",{name:"rear_bench_mesh",castShadow:!0,receiveShadow:!0,geometry:t.rear_bench_mesh.geometry,material:a.rowboat_2}),o.jsx("mesh",{name:"horizontal_support_strips_mesh",castShadow:!0,receiveShadow:!0,geometry:t.horizontal_support_strips_mesh.geometry,material:a.rowboat_1}),o.jsx("mesh",{name:"support_strips_mesh",castShadow:!0,receiveShadow:!0,geometry:t.support_strips_mesh.geometry,material:a.rowboat_1}),o.jsx("mesh",{name:"upper_edge_mesh",castShadow:!0,receiveShadow:!0,geometry:t.upper_edge_mesh.geometry,material:a.rowboat_2})]})}function B({config:e,oarGeometry:t,lockGeometry:a,oarMaterial:r,side:s}){const u=m.useRef(),n=m.useRef(0),i=m.useRef(0),l=m.useRef(0),h=E.degToRad(e.boatRotY);k(()=>{const v=u.current;if(!v)return;const{boatX:f,boatZ:y,waveHeight:w,waveChoppiness:_,waveSpeed:d,boatBobSmooth:x,boatTiltAmount:M}=e,R=O(f,y,w,_,d),T=D(f,y,w,_,d),j=x;n.current+=(R-n.current)*j,i.current+=(-Math.atan2(T.z,T.y)*M-i.current)*j,l.current+=(Math.atan2(T.x,T.y)*M-l.current)*j,W.set(f,n.current,y),v.setNextKinematicTranslation(W),z.set(i.current,h,l.current,"YXZ"),P.setFromEuler(z),v.setNextKinematicRotation(P)});const c=e.boatScale,p=`${s}_oar_mesh`,g=`${s}_oar_lock_mesh`;return o.jsxs(F,{ref:u,type:"kinematicPosition",colliders:"hull",position:[e.boatX,0,e.boatZ],scale:[c,c,c],rotation:[0,h,0],children:[o.jsx("mesh",{name:p,castShadow:!0,receiveShadow:!0,geometry:t,material:r}),o.jsx("mesh",{name:g,castShadow:!0,receiveShadow:!0,geometry:a,material:r})]})}function ye({config:e}){const{nodes:t,materials:a}=oe(Y("/rowboat.glb"));return o.jsxs(o.Fragment,{children:[o.jsx(ge,{config:e,nodes:t,materials:a}),o.jsx(B,{config:e,oarGeometry:t.left_oar_mesh.geometry,lockGeometry:t.left_oar_lock_mesh.geometry,oarMaterial:a.rowboat_2,side:"left"}),o.jsx(B,{config:e,oarGeometry:t.right_oar_mesh.geometry,lockGeometry:t.right_oar_lock_mesh.geometry,oarMaterial:a.rowboat_2,side:"right"})]})}function xe({config:e}){const t=E.degToRad(90-e.skyElevation),a=E.degToRad(e.skyAzimuth),r=new S().setFromSphericalCoords(1,t,a);return o.jsx("directionalLight",{color:"#ffe8c0",intensity:3,position:[r.x*30,r.y*30,r.z*30],castShadow:!0,"shadow-mapSize-width":1024,"shadow-mapSize-height":1024,"shadow-camera-near":.5,"shadow-camera-far":80,"shadow-camera-left":-10,"shadow-camera-right":10,"shadow-camera-top":10,"shadow-camera-bottom":-10})}function we({config:e}){const t=m.useMemo(()=>{const a=E.degToRad(90-e.skyElevation),r=E.degToRad(e.skyAzimuth);return new S().setFromSphericalCoords(1,a,r)},[e.skyElevation,e.skyAzimuth]);return o.jsxs(o.Fragment,{children:[o.jsx("color",{attach:"background",args:[e.fogColor]}),o.jsx("fog",{attach:"fog",args:[e.fogColor,e.fogNear,e.fogFar]}),o.jsx(ee,{makeDefault:!0,position:[4,1.8,8],fov:50,near:.1,far:500,onUpdate:a=>a.lookAt(0,.2,0)}),o.jsx("ambientLight",{intensity:.4,color:"#b0c4de"}),o.jsx(xe,{config:e}),o.jsx(le,{distance:45e4,sunPosition:t,turbidity:e.skyTurbidity,rayleigh:e.skyRayleigh,mieCoefficient:e.skyMieCoefficient,mieDirectionalG:e.skyMieDirectionalG,inclination:void 0,azimuth:void 0}),o.jsx(de,{config:e}),o.jsx(ye,{config:e})]})}function Te(){const e=fe();return o.jsx(J,{gravity:[0,-9.81,0],children:o.jsx(we,{config:e})})}export{Te as default};
