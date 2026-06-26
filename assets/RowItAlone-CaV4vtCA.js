import{a2 as de,aj as te,V as c,v as le,b4 as T,d1 as Y,Y as pe,bg as re,w as he,aM as ae,y as ve,b3 as me,M as xe,aW as ge,p as U,d2 as x,d3 as M,H as q,an as we,al as z,bu as b,ag as _,m as W,r as E,n as ye,J as ze,U as y,j as D}from"./index-DR3zOQ_r.js";import{aX as l,aY as I,u as i,j as be,r as d,W as B,_ as g,aZ as s,$ as o,a_ as L,a$ as P,b0 as F}from"./three.tsl-DcctBAm2.js";import{P as De}from"./PerspectiveCamera-Ct4ZRosb.js";import{O as Se}from"./OrbitControls-Ab5mnQG9.js";import"./extends-CF3RwP-h.js";import"./Fbo-CB6UfhHe.js";class Be{constructor(e){this.params=e,this.init(e)}destroy(){this.params.group.remove(this.mesh),this.geometry.dispose()}hide(){this.mesh.visible=!1}show(){this.mesh.visible=!0}init(e){this.geometry=new de,this.mesh=new te(this.geometry,e.material);const r=new c(e.offset.x,e.offset.y);r.applyMatrix4(e.transform),this.geometry.boundingSphere=new le(r,e.lod>3?e.width*1.75:e.width*3),this.mesh.castShadow=!1,this.mesh.layers.set(e.layer),this.mesh.receiveShadow=!0,e.group.add(this.mesh)}rebuildMeshFromData(e){this.geometry.setAttribute("position",new T(e.positions,3)),this.geometry.setAttribute("normal",new T(e.normals,3)),this.geometry.setAttribute("vindex",new Y(e.vindices,1)),this.geometry.setAttribute("width",new T(e.width,1)),this.geometry.setAttribute("lod",new Y(e.lod,1)),this.geometry.setIndex(new pe(e.indices,1)),this.geometry.attributes.position.needsUpdate=!0,this.geometry.attributes.normal.needsUpdate=!0,this.geometry.attributes.vindex.needsUpdate=!0,this.geometry.attributes.width.needsUpdate=!0,this.geometry.attributes.lod.needsUpdate=!0}}const S=new c,X=new c,N=new c,Z=new c,p=new c,K=new c;function Ie(t){const e=[];for(let r=0;r<t;r+=1)for(let a=0;a<t;a+=1)e.push(r*(t+1)+a,(r+1)*(t+1)+a+1,r*(t+1)+a+1),e.push((r+1)*(t+1)+a,(r+1)*(t+1)+a+1,r*(t+1)+a);return e}function _e(t,e){const r=new Array(t.length).fill(0);for(let a=0;a<e.length;a+=3){const n=e[a]*3,u=e[a+1]*3,h=e[a+2]*3;X.fromArray(t,n),N.fromArray(t,u),Z.fromArray(t,h),p.subVectors(Z,N),K.subVectors(X,N),p.cross(K),r[n]+=p.x,r[u]+=p.x,r[h]+=p.x,r[n+1]+=p.y,r[u+1]+=p.y,r[h+1]+=p.y,r[n+2]+=p.z,r[u+2]+=p.z,r[h+2]+=p.z}return r}function Le({lod:t,offset:e,resolution:r,width:a,worldMatrix:n}){const u=[],h=[],C=[],f=[],v=a/2;let m=0;for(let A=0;A<=r;A+=1){const ce=a*A/r;for(let O=0;O<=r;O+=1){const ue=a*O/r;S.set(ce-v,ue-v,0),S.add(e),S.applyMatrix4(n),u.push(S.x,S.y,S.z),h.push(m),C.push(a),f.push(t),m+=1}}const w=Ie(r),fe=_e(u,w);return{indices:Uint32Array.from(w),lod:Uint32Array.from(f),normals:Float32Array.from(fe),positions:Float32Array.from(u),vindices:Uint32Array.from(h),width:Float32Array.from(C)}}const Pe=15,ke=36,ie=I("vec3","rowItAloneDisplacedPosition"),se=I("vec3","rowItAloneMorphedPosition"),ne=I("vec3","rowItAloneCascadeScales"),Ce=I("vec2","rowItAloneTexelCoord0"),Re=I("vec2","rowItAloneTexelCoord1"),Ae=I("vec2","rowItAloneTexelCoord2"),Oe=l(`

    fn WGSLPosition(
        displacement0: texture_2d<f32>,
        displacement1: texture_2d<f32>,
        displacement2: texture_2d<f32>,
        cameraPosition: vec3<f32>,
        time: f32,
        position: vec3<f32>,
        vindex: i32,
        minLodRadius: f32,
        gridResolution: f32,
        lod: f32,
        width: f32,
        waveLengths: vec3<f32>,
        ifftResolution: f32,
        lodScale: f32,
        morphBlend: f32
    ) -> vec4<f32> {

        var morphValue: f32 = getMorphValue(cameraPosition, position, minLodRadius, lod) * morphBlend;
        var morphedVertex: vec2<f32> = morphVertex(position, morphValue, f32(vindex), gridResolution, width);
        var morphedPosition: vec3<f32> = vec3<f32>(morphedVertex.x, 0, morphedVertex.y);

        var viewVector = cameraPosition - position;
        var viewDist = max(length(viewVector), 0.0001);

        var lod0 = min(lodScale * waveLengths.x / viewDist, 1.0);
        var lod1 = min(lodScale * waveLengths.y / viewDist, 1.0);
        var lod2 = min(lodScale * waveLengths.z / viewDist, 1.0);

        var localTexelCoord0: vec2<f32> = ifftResolution * morphedPosition.xz / waveLengths.x;
        var localTexelCoord1: vec2<f32> = ifftResolution * morphedPosition.xz / waveLengths.y;
        var localTexelCoord2: vec2<f32> = ifftResolution * morphedPosition.xz / waveLengths.z;

        var displacement_0: vec4<f32> = InterpolateBilinear(displacement0, localTexelCoord0, ifftResolution) * lod0;
        var displacement_1: vec4<f32> = InterpolateBilinear(displacement1, localTexelCoord1, ifftResolution) * lod1;
        var displacement_2: vec4<f32> = InterpolateBilinear(displacement2, localTexelCoord2, ifftResolution) * lod2;

        var displacedPosition: vec3<f32> = morphedPosition + (displacement_0.rgb + displacement_1.rgb + displacement_2.rgb);

        varyings.rowItAloneCascadeScales = vec3<f32>(lod0, lod1, lod2);
        varyings.rowItAloneDisplacedPosition = displacedPosition;
        varyings.rowItAloneMorphedPosition = morphedPosition;
        varyings.rowItAloneTexelCoord0 = localTexelCoord0;
        varyings.rowItAloneTexelCoord1 = localTexelCoord1;
        varyings.rowItAloneTexelCoord2 = localTexelCoord2;

        return vec4<f32>(displacedPosition, 1.0);
    }

    fn InterpolateBilinear(textureInput: texture_2d<f32>, position: vec2<f32>, size: f32) -> vec4<f32> {
        var wrapCoords = fract(position / size) * size;

        var texel00 = vec2<u32>(floor(wrapCoords));
        var texel11 = texel00 + vec2<u32>(1u, 1u);
        var texel01 = vec2<u32>(texel11.x, texel00.y);
        var texel10 = vec2<u32>(texel00.x, texel11.y);

        texel00 = texel00 % u32(size);
        texel01 = texel01 % u32(size);
        texel10 = texel10 % u32(size);
        texel11 = texel11 % u32(size);

        var fractCoords = wrapCoords - vec2<f32>(texel00);

        var value00 = textureLoad(textureInput, texel00, 0);
        var value10 = textureLoad(textureInput, texel01, 0);
        var value01 = textureLoad(textureInput, texel10, 0);
        var value11 = textureLoad(textureInput, texel11, 0);

        var value0 = mix(value00, value10, fractCoords.x);
        var value1 = mix(value01, value11, fractCoords.x);

        return mix(value0, value1, fractCoords.y);
    }

    fn getMorphValue(cameraPosition: vec3<f32>, position: vec3<f32>, minLodRadius: f32, lod: f32) -> f32 {
        var height: f32 = cameraPosition.y - position.y;
        var eyeDist: f32 = distance(position, cameraPosition);
        var phi: f32 = acos(height / max(eyeDist, 0.0001));
        var dist: f32 = sin(phi) * eyeDist;

        var n: f32 = log2(max(eyeDist / minLodRadius, 0.0001));
        var minDist: f32 = 0.0;
        var maxDist: f32 = 0.0;

        if (n <= 0.0) {
            n = 0.0;
            minDist = 0.0;
            maxDist = sin(acos(height / minLodRadius)) * minLodRadius;
        } else {
            n = floor(n);

            if (height <= minLodRadius * pow(2.0, n)) {
                minDist = sin(acos(height / (minLodRadius * pow(2.0, n)))) * minLodRadius * pow(2.0, n);
            }

            maxDist = sin(acos(height / (minLodRadius * pow(2.0, n + 1.0)))) * minLodRadius * pow(2.0, n + 1.0);
            n = n + 1.0;
        }

        var delta: f32 = maxDist - minDist;
        var startpercent: f32 = 0.71;
        var endpercent: f32 = 0.95;

        if (lod == n) {
            return clamp((dist - minDist - delta * startpercent) / ((endpercent - startpercent) * delta), 0.0, 1.0);
        }

        return 1.0;
    }

    fn morphVertex(vertex: vec3<f32>, morphValue: f32, idx: f32, grdRes: f32, width: f32) -> vec2<f32> {
        var rowIdx: f32 = floor(idx / (grdRes + 1.0));
        var colIdx: f32 = idx % (grdRes + 1.0);
        var fractPart = fract(vec2<f32>(rowIdx, colIdx) * 0.5) * 2.0 / vec2<f32>(grdRes) * width;

        if (colIdx != 0.0) {
            return vertex.xz - fractPart * morphValue;
        }

        for (var i: u32 = 0u; f32(i) < grdRes / 2.0; i = i + 1u) {
            if (idx == grdRes + 1.0 + 2.0 * (grdRes + 1.0) * f32(i)) {
                return vertex.xz - vec2<f32>(1.0, 0.0) * width / grdRes * morphValue;
            }
        }

        return vertex.xz;
    }
  `,[ie,se,ne,Ce,Re,Ae]),Te=l(`

    fn WGSLColor(
        cameraPosition: vec3<f32>,
        derivatives0: texture_2d<f32>,
        derivatives1: texture_2d<f32>,
        derivatives2: texture_2d<f32>,
        jacobian0: texture_2d<f32>,
        jacobian1: texture_2d<f32>,
        jacobian2: texture_2d<f32>,
        ifft_sampler0: sampler,
        ifft_sampler1: sampler,
        ifft_sampler2: sampler,
        waveLengths: vec3<f32>,
        foamStrength: f32,
        foamThreshold: f32,
        vMorphedPosition: vec3<f32>,
        vDisplacedPosition: vec3<f32>,
        vCascadeScales: vec3<f32>,
        sunPosition: vec3<f32>,
    ) -> vec4<f32> {

        var vViewVector = vDisplacedPosition - cameraPosition;
        var vViewDist = length(vViewVector);
        var viewDir = normalize(vViewVector);

        var Normal_0: vec4<f32> = textureSample(derivatives0, ifft_sampler0, vMorphedPosition.xz / waveLengths.x) * vCascadeScales.x;
        var Normal_1: vec4<f32> = textureSample(derivatives1, ifft_sampler1, vMorphedPosition.xz / waveLengths.y) * vCascadeScales.y;
        var Normal_2: vec4<f32> = textureSample(derivatives2, ifft_sampler2, vMorphedPosition.xz / waveLengths.z) * vCascadeScales.z;

        var jacobi0: f32 = textureSample(jacobian0, ifft_sampler0, vMorphedPosition.xz / waveLengths.x).x;
        var jacobi1: f32 = textureSample(jacobian1, ifft_sampler1, vMorphedPosition.xz / waveLengths.y).x;
        var jacobi2: f32 = textureSample(jacobian2, ifft_sampler2, vMorphedPosition.xz / waveLengths.z).x;

        var derivatives: vec4<f32> = normalize(Normal_0 + Normal_1 + Normal_2);
        var slope: vec2<f32> = vec2<f32>(derivatives.x / (1.0 + derivatives.z), derivatives.y / (1.0 + derivatives.w));
        var normalOcean: vec3<f32> = normalize(vec3(-slope.x, 1.0, -slope.y));

        var jacobian: f32 = jacobi0 + jacobi1 + jacobi2;
        var foamMixFactor: f32 = min(1.0, max(0.0, (-jacobian + foamThreshold) * foamStrength));

        if (dot(normalOcean, -viewDir) < 0.0) {
            normalOcean *= -1.0;
        }

        var sunDir: vec3<f32> = normalize(sunPosition);
        var fresnel = fresnelSchlick(0.02, normalOcean, -viewDir, 5.0);
        var specular = specularLight2(normalOcean, sunDir, viewDir, 8.0) * 1.3;
        var reflected = reflect(-viewDir, normalOcean);
        var skyMix = clamp(reflected.y * 0.5 + 0.5, 0.0, 1.0);
        var reflectionColor = mix(HORIZONCOLOR, SKYCOLOR, skyMix);
        reflectionColor += pow(max(dot(reflected, sunDir), 0.0), 96.0) * SUNCOLOR * 0.35;
        var refractionColor = SEACOLOR;
        var waterColor = mix(refractionColor, reflectionColor, fresnel);

        var atten: f32 = max(1.0 - vViewDist * vViewDist * 0.001, 0.0);
        waterColor += WAVECOLOR * saturate(vDisplacedPosition.y) * 0.05 * atten;

        var oceanColor = waterColor;
        oceanColor += normalize(vec3<f32>(5.0, 4.5, 4.0)) * specular;
        oceanColor = mix(oceanColor, vec3<f32>(1.0), foamMixFactor);
        oceanColor = mix(SEACOLOR, oceanColor, vCascadeScales.x);

        let fade = smoothstep(500.0, 4000.0, vViewDist);
        let finalColor = mix(oceanColor, vec3<f32>(0.0, 0.1, 0.2), fade);
        return vec4<f32>(finalColor, 1.0);
    }

    const SEACOLOR: vec3<f32> = vec3<f32>(0.004, 0.016, 0.047);
    const HORIZONCOLOR: vec3<f32> = vec3<f32>(0.42, 0.62, 0.82);
    const SKYCOLOR: vec3<f32> = vec3<f32>(0.08, 0.21, 0.39);
    const SUNCOLOR: vec3<f32> = vec3<f32>(1.0, 0.9, 0.72);
    const WAVECOLOR: vec3<f32> = vec3<f32>(0.14, 0.25, 0.18);

    fn saturate(value: f32) -> f32 {
        return max(0.0, min(value, 1.0));
    }

    fn specularLight2(N: vec3<f32>, L: vec3<f32>, V: vec3<f32>, e: f32) -> f32 {
        var half_vector = normalize(V - L);
        return pow(max(dot(N, half_vector), 0.0), e);
    }

    fn fresnelSchlick(F: f32, N: vec3<f32>, V: vec3<f32>, exp: f32) -> f32 {
        return F + (1.0 - F) * pow(saturate(1.0 - dot(N, V)), exp);
    }
`);class Me{constructor(e){const r={time:i(0),cameraPosition:i(new c),minLodRadius:Pe,gridResolution:i(e.gridResolution??ke),position:B("position"),vindex:B("vindex"),width:B("width"),lod:B("lod"),ifftResolution:i(e.ifftResolution),displacement0:d(e.cascades[0].displacement),displacement1:d(e.cascades[1].displacement),displacement2:d(e.cascades[2].displacement),derivatives0:d(e.cascades[0].derivative),derivatives1:d(e.cascades[1].derivative),derivatives2:d(e.cascades[2].derivative),jacobian0:d(e.cascades[0].jacobian),jacobian1:d(e.cascades[1].jacobian),jacobian2:d(e.cascades[2].jacobian),ifft_sampler0:d(e.cascades[0].derivative),ifft_sampler1:d(e.cascades[1].derivative),ifft_sampler2:d(e.cascades[2].derivative),foamStrength:e.foamStrength,foamThreshold:e.foamThreshold,lodScale:e.lodScale,morphBlend:i(e.morphBlend??1),waveLengths:be(e.cascades[0].params.lengthScale,e.cascades[1].params.lengthScale,e.cascades[2].params.lengthScale),sunPosition:i(e.sunPosition),vMorphedPosition:se,vDisplacedPosition:ie,vCascadeScales:ne},a=new re;a.positionNode=Oe(r),a.colorNode=Te(r),a.side=he,a.colorSpace=ae,a.transparent=!1,this.material=a,this.parameters=r}}const We=l(`

    fn fragmentShader(
        normal: vec3<f32>,
        position: vec3<f32>,
        cameraPosition: vec3<f32>,
        sunPosition: vec3<f32>,
        mieDirectionalG: f32,
        rayleigh: f32,
        turbidity: f32,
        mieCoefficient: f32,
        elevation: f32,
        up: vec3<f32>,
    ) -> vec4<f32> {

        var sunDirection: vec3<f32> = normalize(sunPosition);
        const lambda = vec3<f32>(680E-9, 550E-9, 450E-9);
        const K = vec3<f32>(0.686, 0.678, 0.666);

        var sunfade = 1.0 - min(max(1.0 - exp((sunPosition.y / 500000.0)), 0.0), 1.0);
        var rayleighCoefficient = rayleigh - (1.0 * (1.0 - sunfade));

        var sunE = sunIntensity(dot(sunDirection, up));
        var betaR = simplifiedRayleigh() * rayleighCoefficient;
        var betaM = totalMie(lambda, K, turbidity) * mieCoefficient;

        var zenithAngle = acos(max(0.0, dot(up, normalize(position - cameraPosition))));
        var sR = rayleighZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
        var sM = mieZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
        var Fex = exp(-(betaR * sR + betaM * sM));
        var cosTheta = dot(normalize(position - cameraPosition), sunDirection);
        var rPhase = rayleighPhase(cosTheta * 0.5 + 0.5);
        var betaRTheta = betaR * rPhase;
        var mPhase = hgPhase(cosTheta, mieDirectionalG);
        var betaMTheta = betaM * mPhase;

        var Lin = pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex), vec3<f32>(1.5));
        Lin *= mix(vec3(1.0), pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * Fex, vec3<f32>(0.5)), clamp(pow(1.0 - dot(up, sunDirection), 5.0), 0.0, 1.0));

        var direction = normalize(position - cameraPosition);
        var theta = acos(direction.y);
        var phi = atan(direction.z / direction.x);
        var uv = vec2<f32>(phi, theta) / vec2<f32>(2.0 * pi, pi) + vec2<f32>(0.5, 0.0);
        var L0 = vec3<f32>(0.1) * Fex;
        var sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);

        L0 += (sunE * 19000.0 * Fex) * sundisk;

        var texColor = Lin + L0 + vec3<f32>(0.0, 0.001, 0.0025) * 0.3 + uv.xxx * 0.0;
        texColor *= 0.04;

        var exposure: f32 = 0.025;
        var gamma: f32 = 2.0 - elevation / 90.0;
        var color: vec3<f32> = vec3<f32>(1.0) - exp(-texColor * exposure);

        return vec4<f32>(pow(color, vec3<f32>(1.0 / gamma)) * 1.3, 1.0);
    }

    const pi: f32 = 3.141592653589793238462643383279502884197169;
    const n: f32 = 1.0003;
    const N: f32 = 2.545E25;
    const pn: f32 = 0.035;
    const v: f32 = 4.0;
    const rayleighZenithLength: f32 = 8.4E3;
    const mieZenithLength: f32 = 1.25E3;
    const EE: f32 = 1000.0;
    const sunAngularDiameterCos: f32 = 0.9999566769464484;
    const cutoffAngle: f32 = pi / 1.95;
    const steepness: f32 = 1.5;

    fn simplifiedRayleigh() -> vec3<f32> {
        return 0.0005 / vec3<f32>(94.0, 40.0, 18.0);
    }

    fn rayleighPhase(cosTheta: f32) -> f32 {
        return (3.0 / (16.0 * pi)) * (1.0 + pow(cosTheta, 2.0));
    }

    fn totalMie(lambda: vec3<f32>, K: vec3<f32>, T: f32) -> vec3<f32> {
        var c = (0.2 * T) * 10E-18;
        return 0.434 * c * pi * pow((2.0 * pi) / lambda, vec3<f32>(v - 2.0)) * K;
    }

    fn hgPhase(cosTheta: f32, g: f32) -> f32 {
        return (1.0 / (4.0 * pi)) * ((1.0 - pow(g, 2.0)) / pow(1.0 - 2.0 * g * cosTheta + pow(g, 2.0), 1.5));
    }

    fn sunIntensity(zenithAngleCos: f32) -> f32 {
        return EE * max(0.0, 1.0 - exp((-(cutoffAngle - acos(zenithAngleCos)) / steepness)));
    }
`);class Ee extends te{constructor(){const e={position:B("position"),normal:B("normal"),turbidity:i(10),rayleigh:i(3),mieCoefficient:i(.005),mieDirectionalG:i(.7),elevation:i(2),sunPosition:i(new c(0,0,0)),up:i(new c(0,1,0)),cameraPosition:i(new c(0,0,0))},r=new re;r.colorNode=We(e),r.side=ve,r.colorSpace=ae,super(new me(1,1,1),r),this.parameters=e}}const J=new c,$=new c,G=new c,j=new c,Fe=160,oe=192,Ne=2;function Ge(t={}){return{patchResolution:Math.max(Ne,Math.round(t.patchResolution??oe)),patchSize:t.patchSize??Fe}}class je{constructor(e){this.params=e,this.currentConfig=null,this.patch=null,this.patchSignature="",this.patchTransform=new xe().makeRotationX(-Math.PI/2),this.sun=new c}init(){const e=new Me({foamStrength:this.params.waveGenerator.foamStrength,foamThreshold:this.params.waveGenerator.foamThreshold,ifftResolution:this.params.waveGenerator.size,gridResolution:oe,lodScale:this.params.waveGenerator.lodScale,morphBlend:0,cascades:this.params.waveGenerator.cascades,sunPosition:this.sun});this.material=e.material,this.materialParameters=e.parameters,this.group=new ge,this.params.scene.add(this.group),this.sky=new Ee,this.sky.layers.set(2),this.sky.scale.setScalar(5e5),this.params.scene.add(this.sky),this.ensurePatch()}ensurePatch(e){const{patchResolution:r,patchSize:a}=Ge(e),n=`${a}:${r}`;this.patchSignature!==n&&(this.patch?.destroy(),G.set(0,0,0),this.patch=new Be({group:this.group,layer:this.params.layer,lod:0,material:this.material,offset:G.clone(),transform:this.patchTransform,width:a}),this.patch.rebuildMeshFromData(Le({lod:0,offset:G,resolution:r,width:a,worldMatrix:this.patchTransform})),this.patch.show(),this.materialParameters.gridResolution.value=r,this.patchSignature=n)}applyConfig(e){if(this.currentConfig=e,!e)return;this.ensurePatch(e.ocean),this.material.wireframe=e.ocean.wireframe,this.params.waveGenerator.setFoamStrength(e.foam.foamStrength),this.params.waveGenerator.setFoamThreshold(e.foam.foamThreshold),this.params.waveGenerator.setLodScale(e.ocean.lodScale),this.sky.parameters.rayleigh.value=e.sky.rayleigh,this.sky.parameters.turbidity.value=e.sky.turbidity,this.sky.parameters.mieCoefficient.value=e.sky.mieCoefficient,this.sky.parameters.mieDirectionalG.value=e.sky.mieDirectionalG,this.sky.parameters.elevation.value=e.sky.elevation,this.sky.parameters.up.value.fromArray(e.sky.up);const r=U.degToRad(90-e.sky.elevation),a=U.degToRad(e.sky.azimuth);this.sun.setFromSphericalCoords(1,r,a),this.sky.parameters.sunPosition.value.copy(this.sun),typeof e.sky.exposure=="number"&&(this.params.renderer.toneMappingExposure=e.sky.exposure)}update(e=this.params.camera){this.params.camera=e,this.params.camera.getWorldPosition(J),this.params.scene.getWorldPosition($),j.subVectors(J,$),this.sky.parameters.cameraPosition.value.copy(j),this.patch&&(this.patch.show(),this.patch.mesh.material.wireframe=this.currentConfig?.ocean?.wireframe??!1),this.materialParameters.cameraPosition.value.copy(j),this.materialParameters.sunPosition.value.copy(this.sun)}dispose(){this.patch?.destroy(),this.patch=null,this.patchSignature="",this.params.scene.remove(this.group),this.params.scene.remove(this.sky),this.material.dispose(),this.sky.geometry.dispose(),this.sky.material.dispose()}}const He=l(`

    fn computeWGSL(
        butterflyBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        index: u32,
        N: f32,
    ) -> void {

        var logN = log2(N);
        var posX = f32(index) % logN;
        var posY = floor(f32(index) / logN);

        const PI: f32 = 3.1415926;

        var k: f32 = (posY * N / pow(2, posX + 1)) % N;
        var twiddle: vec2<f32> = vec2<f32>(cos(2 * PI * k / N), sin(2 * PI * k / N));

        var butterflyspan = pow(2, f32(posX));
        let idx = u32(posY) * u32(logN) + u32(posX);
        var butterflywing: i32 = select(0, 1, posY % pow(2, posX + 1) < pow(2, posX));
        var uY = u32(posY);

        if (u32(posX) == 0) {
            if (butterflywing == 1) {
                butterflyBuffer[idx] = vec4f(twiddle, reverseBits(uY, N), reverseBits(uY + 1, N));
            } else {
                butterflyBuffer[idx] = vec4f(twiddle, reverseBits(uY - 1, N), reverseBits(uY, N));
            }
        } else {
            if (butterflywing == 1) {
                butterflyBuffer[idx] = vec4f(twiddle, posY, posY + butterflyspan);
            } else {
                butterflyBuffer[idx] = vec4f(twiddle, posY - butterflyspan, posY);
            }
        }
    }

    fn reverseBits(index: u32, N: f32) -> f32 {
        var bitReversedIndex: u32 = 0u;
        var numBits: u32 = u32(log2(N));

        for (var i: u32 = 0u; i < numBits; i = i + 1u) {
            bitReversedIndex = bitReversedIndex | (((index >> i) & 1u) << (numBits - i - 1u));
        }

        return f32(bitReversedIndex);
    }
`),Ve=l(`

    fn computeWGSL(
        spectrumBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        waveDataBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        writeDxDzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
        writeDyDxzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
        writeDyxDyzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
        writeDxxDzzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
        index: u32,
        size: u32,
        time: f32,
    ) -> void {

        var wave = waveDataBuffer[index];
        var h0 = spectrumBuffer[index];

        var phase = wave.w * time;
        var exponent = vec2<f32>(cos(phase), sin(phase));

        var h = complexMult(h0.xy, exponent) + complexMult(h0.zw, vec2<f32>(exponent.x, -exponent.y));
        var ih = vec2<f32>(-h.y, h.x);

        var displacementX = ih * wave.x * wave.y;
        var displacementY = h;
        var displacementZ = ih * wave.z * wave.y;

        var displacementX_dx = -h * wave.x * wave.x * wave.y;
        var displacementY_dx = ih * wave.x;
        var displacementZ_dx = -h * wave.x * wave.z * wave.y;

        var displacementY_dz = ih * wave.z;
        var displacementZ_dz = -h * wave.z * wave.z * wave.y;

        writeDxDzBuffer[index] = vec2<f32>(displacementX.x - displacementZ.y, displacementX.y + displacementZ.x);
        writeDyDxzBuffer[index] = vec2<f32>(displacementY.x - displacementZ_dx.y, displacementY.y + displacementZ_dx.x);
        writeDyxDyzBuffer[index] = vec2<f32>(displacementY_dx.x - displacementY_dz.y, displacementY_dx.y + displacementY_dz.x);
        writeDxxDzzBuffer[index] = vec2<f32>(displacementX_dx.x - displacementZ_dz.y, displacementX_dx.y + displacementZ_dz.x);
    }

    fn complexMult(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
        return vec2<f32>(a.r * b.r - a.g * b.g, a.r * b.g + a.g * b.r);
    }
`),Ye=l(`

    fn computeWGSL(
        butterflyBuffer: ptr<storage, array<vec4<f32>>, read>,
        pingpongBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        initBufferIndex: u32,
        index: u32,
        size: u32,
        step: u32,
        logN: u32,
        pingpong: u32,
        workgroupSize: vec2<u32>,
        workgroupId: vec3<u32>,
        localId: vec3<u32>
    ) -> void {

        let pos = workgroupSize.xy * workgroupId.xy + localId.xy;

        let butterflyIndex = pos.x * logN + step;
        let data = butterflyBuffer[butterflyIndex];

        let bufferIndexEven = pos.y * size + u32(data.z);
        let bufferIndexOdd = pos.y * size + u32(data.w);

        let even = select(pingpongBuffer[bufferIndexEven].xy, pingpongBuffer[bufferIndexEven].zw, pingpong == 0u);
        let odd = select(pingpongBuffer[bufferIndexOdd].xy, pingpongBuffer[bufferIndexOdd].zw, pingpong == 0u);

        let H: vec2<f32> = even + multiplyComplex(data.rg, odd);

        pingpongBuffer[index] = vec4<f32>(
            select(pingpongBuffer[index].xy, H, pingpong == 0u),
            select(H, pingpongBuffer[index].zw, pingpong == 0u)
        );
    }

    fn multiplyComplex(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
        return vec2<f32>(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
    }
`),Ue=l(`

    fn computeWGSL(
        butterflyBuffer: ptr<storage, array<vec4<f32>>, read>,
        pingpongBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        initBufferIndex: u32,
        index: u32,
        size: u32,
        step: u32,
        logN: u32,
        pingpong: u32,
        workgroupSize: vec2<u32>,
        workgroupId: vec3<u32>,
        localId: vec3<u32>,
    ) -> void {

        let pos = workgroupSize.xy * workgroupId.xy + localId.xy;

        let butterflyIndex = pos.y * logN + step;
        let data = butterflyBuffer[butterflyIndex];

        let bufferIndexEven = u32(data.z) * size + pos.x;
        let bufferIndexOdd = u32(data.w) * size + pos.x;

        let even = select(pingpongBuffer[bufferIndexEven].xy, pingpongBuffer[bufferIndexEven].zw, pingpong == 0u);
        let odd = select(pingpongBuffer[bufferIndexOdd].xy, pingpongBuffer[bufferIndexOdd].zw, pingpong == 0u);

        let H: vec2<f32> = even + multiplyComplex(data.rg, odd);

        pingpongBuffer[index] = vec4<f32>(
            select(pingpongBuffer[index].xy, H, pingpong == 0u),
            select(H, pingpongBuffer[index].zw, pingpong == 0u)
        );
    }

    fn multiplyComplex(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
        return vec2<f32>(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
    }
`),qe=l(`

    fn computeWGSL(
        butterflyBuffer: ptr<storage, array<vec4<f32>>, read>,
        pingpongBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        DxDzBuffer: ptr<storage, array<vec2<f32>>, read>,
        DyDxzBuffer: ptr<storage, array<vec2<f32>>, read>,
        DyxDyzBuffer: ptr<storage, array<vec2<f32>>, read>,
        DxxDzzBuffer: ptr<storage, array<vec2<f32>>, read>,
        initBufferIndex: u32,
        index: u32,
        size: u32,
        step: u32,
        logN: u32,
        workgroupSize: vec2<u32>,
        workgroupId: vec3<u32>,
        localId: vec3<u32>
    ) -> void {

        let pos = workgroupSize.xy * workgroupId.xy + localId.xy;

        let butterflyIndex = pos.x * logN + step;
        let data = butterflyBuffer[butterflyIndex];

        let bufferIndex = pos.y * size + u32(data.z);
        let bufferIndexOdd = pos.y * size + u32(data.w);

        var even = select(DxDzBuffer[bufferIndex], DyDxzBuffer[bufferIndex], initBufferIndex == 1u);
        even = select(even, DyxDyzBuffer[bufferIndex], initBufferIndex == 2u);
        even = select(even, DxxDzzBuffer[bufferIndex], initBufferIndex == 3u);

        var odd = select(DxDzBuffer[bufferIndexOdd], DyDxzBuffer[bufferIndexOdd], initBufferIndex == 1u);
        odd = select(odd, DyxDyzBuffer[bufferIndexOdd], initBufferIndex == 2u);
        odd = select(odd, DxxDzzBuffer[bufferIndexOdd], initBufferIndex == 3u);

        var H: vec2<f32> = even + multiplyComplex(vec2<f32>(data.r, -data.g), odd);

        pingpongBuffer[index] = vec4<f32>(0.0, 0.0, H);
    }

    fn multiplyComplex(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
        return vec2<f32>(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
    }
`),Xe=l(`

    fn computeWGSL(
        pingpongBuffer: ptr<storage, array<vec4<f32>>, read>,
        DxDzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
        DyDxzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
        DyxDyzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
        DxxDzzBuffer: ptr<storage, array<vec2<f32>>, read_write>,
        initBufferIndex: u32,
        index: u32,
        size: u32,
        workgroupSize: vec2<u32>,
        workgroupId: vec3<u32>,
        localId: vec3<u32>,
    ) -> void {

        let pos = workgroupSize.xy * workgroupId.xy + localId.xy;

        let input = pingpongBuffer[index].xy;
        let output = input * (1.0 - 2.0 * f32((pos.x + pos.y) % 2u));

        DxDzBuffer[index] = select(DxDzBuffer[index], output, initBufferIndex == 0u);
        DyDxzBuffer[index] = select(DyDxzBuffer[index], output, initBufferIndex == 1u);
        DyxDyzBuffer[index] = select(DyxDyzBuffer[index], output, initBufferIndex == 2u);
        DxxDzzBuffer[index] = select(DxxDzzBuffer[index], output, initBufferIndex == 3u);
    }
`),Ze=l(`

    fn computeWGSL(
        writeDisplacement: texture_storage_2d<rgba16float, write>,
        writeDerivative: texture_storage_2d<rgba16float, write>,
        writeJacobian: texture_storage_2d<rgba32float, write>,
        DxDzBuffer: ptr<storage, array<vec2<f32>>, read>,
        DyDxzBuffer: ptr<storage, array<vec2<f32>>, read>,
        DyxDyzBuffer: ptr<storage, array<vec2<f32>>, read>,
        DxxDzzBuffer: ptr<storage, array<vec2<f32>>, read>,
        turbulenceBuffer: ptr<storage, array<f32>, read_write>,
        index: u32,
        size: u32,
        lambda: f32,
        deltaTime: f32,
        workgroupSize: vec2<u32>,
        workgroupId: vec3<u32>,
        localId: vec3<u32>,
    ) -> void {

        let pos = workgroupSize.xy * workgroupId.xy + localId.xy;
        let bufferIndex = pos.y * size + pos.x;

        var x = DxDzBuffer[bufferIndex];
        var y = DyDxzBuffer[bufferIndex];
        var z = DyxDyzBuffer[bufferIndex];
        var w = DxxDzzBuffer[bufferIndex];

        var jacobian = (1.0 + lambda * w.x) * (1.0 + lambda * w.y) - y.y * y.y * lambda * lambda;

        var turbulence = turbulenceBuffer[bufferIndex] + deltaTime * 0.5 / max(jacobian, 0.5);
        turbulence = min(jacobian, turbulence);

        textureStore(writeDisplacement, pos, vec4f(lambda * x.x, y.x, lambda * x.y, 0));
        textureStore(writeDerivative, pos, vec4f(z.x, z.y, w.x * lambda, w.y * lambda));
        textureStore(writeJacobian, pos, vec4f(turbulence, 0, 0, 0));
        turbulenceBuffer[bufferIndex] = turbulence;
    }
`),Ke=l(`

    fn computeWGSL(
        spectrumBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        waveDataBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        index: u32,
        size: u32,
        waveLength: f32,
        boundaryLow: f32,
        boundaryHigh: f32,
        depth: f32,
        scaleHeight: f32,
        windSpeed: f32,
        windDirection: f32,
        fetch: f32,
        spreadBlend: f32,
        swell: f32,
        peakEnhancement: f32,
        shortWaveFade: f32,
        fadeLimit: f32,
        d_depth: f32,
        d_scaleHeight: f32,
        d_windSpeed: f32,
        d_windDirection: f32,
        d_fetch: f32,
        d_spreadBlend: f32,
        d_swell: f32,
        d_peakEnhancement: f32,
        d_shortWaveFade: f32,
        d_fadeLimit: f32,
    ) -> void {

        var posX = index % size;
        var posY = index / size;
        var xy = vec2<f32>(f32(posX), f32(posY));
        let deltaK = 2.0 * PI / waveLength;
        let nx = f32(posX) - f32(size) / 2.0;
        let nz = f32(posY) - f32(size) / 2.0;
        let k = vec2<f32>(nx, nz) * deltaK;
        let kLength = length(k);

        if (kLength >= boundaryLow && kLength <= boundaryHigh) {
            var kAngle: f32 = atan2(k.y, k.x);
            var alpha = JonswapAlpha(G, fetch, windSpeed);
            var w = frequency(kLength, G, depth);
            var wp = JonswapPeakFrequency(G, fetch, windSpeed);
            var dOmegadk = frequencyDerivative(kLength, G, depth);

            var spectrum: f32 = JONSWAP(w, G, depth, wp, scaleHeight, alpha, peakEnhancement) * directionSpectrum(kAngle, w, wp, swell, windDirection, spreadBlend) * shortWavesFade(kLength, shortWaveFade, fadeLimit);

            if (d_scaleHeight > 0.0) {
                var d_alpha = JonswapAlpha(G, d_fetch, d_windSpeed);
                var d_wp = JonswapPeakFrequency(G, d_fetch, d_windSpeed);

                spectrum = spectrum + JONSWAP(w, G, depth, d_wp, d_scaleHeight, d_alpha, d_peakEnhancement) * directionSpectrum(kAngle, w, d_wp, d_swell, d_windDirection, d_spreadBlend) * shortWavesFade(kLength, d_shortWaveFade, d_fadeLimit);
            }

            var er: f32 = gaussianRandom1(xy);
            var ei: f32 = gaussianRandom2(xy);

            spectrumBuffer[index] = vec4<f32>(vec2<f32>(er, ei) * sqrt(2.0 * spectrum * abs(dOmegadk) / kLength * deltaK * deltaK), 0, 0);
            waveDataBuffer[index] = vec4<f32>(k.x, 1.0 / kLength, k.y, w);
        } else {
            spectrumBuffer[index] = vec4<f32>(0.0);
            waveDataBuffer[index] = vec4<f32>(k.x, 1.0, k.y, 0.0);
        }
    }

    const PI: f32 = 3.141592653589793;
    const G: f32 = 9.81;

    fn JonswapAlpha(g: f32, fetch: f32, windSpeed: f32) -> f32 {
        return 0.076 * pow(g * fetch / pow(windSpeed, 2.0), -0.22);
    }

    fn JonswapPeakFrequency(g: f32, fetch: f32, windSpeed: f32) -> f32 {
        return 22.0 * pow(windSpeed * fetch / pow(g, 2.0), -0.33);
    }

    fn gaussianRandom1(seed: vec2<f32>) -> f32 {
        var nrnd0: f32 = random(seed);
        var nrnd1: f32 = random(seed + 0.1);
        return sqrt(-2.0 * log(max(0.001, nrnd0))) * cos(2.0 * PI * nrnd1);
    }

    fn gaussianRandom2(seed: vec2<f32>) -> f32 {
        var nrnd0: f32 = random(seed);
        var nrnd1: f32 = random(seed + 0.1);
        return sqrt(-2.0 * log(max(0.001, nrnd0))) * sin(2.0 * PI * nrnd1);
    }

    fn random(par: vec2<f32>) -> f32 {
        return fract(sin(dot(par, vec2<f32>(12.9898, 78.233))) * 43758.5453);
    }

    fn frequency(k: f32, g: f32, depth: f32) -> f32 {
        return sqrt(g * k * tanh(min(k * depth, 20.0)));
    }

    fn frequencyDerivative(k: f32, g: f32, depth: f32) -> f32 {
        let th = tanh(min(k * depth, 20.0));
        let ch = cosh(k * depth);
        return g * (depth * k / ch / ch + th) / frequency(k, g, depth) / 2.0;
    }

    fn normalisationFactor(s: f32) -> f32 {
        let s2 = s * s;
        let s3 = s2 * s;
        let s4 = s3 * s;
        if (s < 5.0) {
            return -0.000564 * s4 + 0.00776 * s3 - 0.044 * s2 + 0.192 * s + 0.163;
        }
        return -4.80e-08 * s4 + 1.07e-05 * s3 - 9.53e-04 * s2 + 5.90e-02 * s + 3.93e-01;
    }

    fn cosine2s(theta: f32, s: f32) -> f32 {
        return normalisationFactor(s) * pow(abs(cos(0.5 * theta)), 2.0 * s);
    }

    fn spreadPower(omega: f32, peakOmega: f32) -> f32 {
        if (omega > peakOmega) {
            return 9.77 * pow(abs(omega / peakOmega), -2.5);
        }
        return 6.97 * pow(abs(omega / peakOmega), 5.0);
    }

    fn TMACorrection(omega: f32, g: f32, depth: f32) -> f32 {
        let omegaH = omega * sqrt(depth / g);
        if (omegaH <= 1.0) {
            return 0.5 * omegaH * omegaH;
        }
        if (omegaH < 2.0) {
            return 1.0 - 0.5 * (2.0 - omegaH) * (2.0 - omegaH);
        }
        return 1.0;
    }

    fn directionSpectrum(theta: f32, w: f32, wp: f32, swell: f32, angle: f32, spreadBlend: f32) -> f32 {
        let s = spreadPower(w, wp) + 16.0 * tanh(min(w / wp, 20.0)) * swell * swell;
        return mix(2.0 / PI * cos(theta) * cos(theta), cosine2s(theta - angle, s), spreadBlend);
    }

    fn JONSWAP(w: f32, g: f32, depth: f32, wp: f32, scale: f32, alpha: f32, gamma: f32) -> f32 {
        var sigma: f32 = select(0.07, 0.09, w <= wp);
        var a = exp(-pow(w - wp, 2.0) / (2.0 * pow(sigma * wp, 2.0)));

        return scale * TMACorrection(w, g, depth) * alpha * pow(g, 2.0) * pow(1.0 / w, 5.0) * exp(-1.25 * pow(wp / w, 4.0)) * pow(abs(gamma), a);
    }

    fn shortWavesFade(kLength: f32, shortWaveFade: f32, fadeLimit: f32) -> f32 {
        return (1.0 - fadeLimit) * exp(-pow(shortWaveFade * kLength, 2.0)) + fadeLimit;
    }
`),Je=l(`

    fn computeWGSL(
        spectrumBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        index: u32,
        size: u32,
    ) -> void {

        var idx = ((size - index / size) % size) * size + (size - index % size) % size;

        var spectrumData = spectrumBuffer[index];
        var h0MinusK = spectrumBuffer[idx];

        spectrumBuffer[index] = vec4<f32>(spectrumData.xy, h0MinusK.x, -h0MinusK.y);
    }
`);class $e{constructor(e){this.params=e,this.init(e)}init(e){this.squareSize=e.size**2,this.bufferSize=this.squareSize*4,this.spectrumBuffer=new x(new Float32Array(this.bufferSize),4),this.waveDataBuffer=new x(new Float32Array(this.bufferSize),4),this.initialSpectrum=Ke({spectrumBuffer:s(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),waveDataBuffer:s(this.waveDataBuffer,"vec4",this.waveDataBuffer.count),index:g,size:e.size,waveLength:i(e.lengthScale),boundaryLow:i(e.boundaryLow),boundaryHigh:i(e.boundaryHigh),...e.waveSettings}).compute(this.squareSize),this.initialSpectrumWithInverse=Je({spectrumBuffer:s(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),index:g,size:e.size}).compute(this.squareSize),e.renderer.compute(this.initialSpectrum),e.renderer.compute(this.initialSpectrumWithInverse)}update(){this.params.renderer.compute(this.initialSpectrum),this.params.renderer.compute(this.initialSpectrumWithInverse)}dispose(){this.spectrumBuffer?.dispose?.(),this.waveDataBuffer?.dispose?.()}}const Qe=[16,16,1],et=[250,17,5],tt=[.9,.9,.9],R=Object.freeze({Low:Object.freeze({resolution:128}),Medium:Object.freeze({resolution:256}),High:Object.freeze({resolution:512})}),k="Medium";R[k].resolution;const rt=i(.8),at=i(2.7),it=i(3.7);function st(t=k){return R[t]||R[k]}const H={depth:i(20),scaleHeight:i(1),windSpeed:i(1),windDirection:i(0),fetch:i(1e5),spreadBlend:i(1),swell:i(.198),peakEnhancement:i(3.3),shortWaveFade:i(0),fadeLimit:i(0)},nt={depth:{min:.1,max:100},scaleHeight:{min:0,max:1},windSpeed:{min:.01,max:10},windDirection:{min:0,max:2*Math.PI},fetch:{min:10,max:5e5},spreadBlend:{min:0,max:1},swell:{min:0,max:1},peakEnhancement:{min:1,max:5},shortWaveFade:{min:0,max:5},fadeLimit:{min:0,max:1}},V={d_depth:i(20),d_scaleHeight:i(1),d_windSpeed:i(1),d_windDirection:i(240/360*2*Math.PI),d_fetch:i(3e5),d_spreadBlend:i(1),d_swell:i(.5),d_peakEnhancement:i(3.3),d_shortWaveFade:i(0),d_fadeLimit:i(0)},ot={d_depth:{min:.1,max:100},d_scaleHeight:{min:0,max:1},d_windSpeed:{min:.01,max:10},d_windDirection:{min:0,max:2*Math.PI},d_fetch:{min:10,max:5e5},d_spreadBlend:{min:0,max:1},d_swell:{min:0,max:1},d_peakEnhancement:{min:1,max:5},d_shortWaveFade:{min:0,max:5},d_fadeLimit:{min:0,max:1}};class ft{constructor(e){this.init(e)}init(e){this.params=e,this.logN=Math.log2(e.size),this.squareSize=e.size**2,this.bufferSize=this.squareSize*2,this.initialSpectrum=new $e(e),this.spectrumBuffer=this.initialSpectrum.spectrumBuffer,this.waveDataBuffer=this.initialSpectrum.waveDataBuffer,this.dxDzBuffer=new x(new Float32Array(this.bufferSize),2),this.dyDxzBuffer=new x(new Float32Array(this.bufferSize),2),this.dyxDyzBuffer=new x(new Float32Array(this.bufferSize),2),this.dxxDzzBuffer=new x(new Float32Array(this.bufferSize),2),this.pingpongBuffer=new x(new Float32Array(this.bufferSize*2),4),this.turbulenceBuffer=new x(new Float32Array(this.bufferSize/2),1),this.displacementIndex=i(0),this.ifftStep=i(0),this.pingpong=i(0),this.deltaTime=i(0),this.displacement=new M(e.size,e.size),this.derivative=new M(e.size,e.size),this.jacobian=new M(e.size,e.size),this.displacement.type=q,this.derivative.type=q,this.jacobian.type=we,this.displacement.generateMipmaps=!1,this.derivative.generateMipmaps=!1,this.jacobian.generateMipmaps=!1,this.displacement.magFilter=z,this.derivative.magFilter=z,this.jacobian.magFilter=z,this.displacement.minFilter=z,this.derivative.minFilter=z,this.jacobian.minFilter=z,this.displacement.wrapS=b,this.displacement.wrapT=b,this.derivative.wrapS=b,this.derivative.wrapT=b,this.jacobian.wrapS=b,this.jacobian.wrapT=b,this.workgroupSize=Qe,this.dispatchSize=[e.size/this.workgroupSize[0],e.size/this.workgroupSize[1]],this.computeTimeSpectrum=Ve({writeDxDzBuffer:s(this.dxDzBuffer,"vec2",this.dxDzBuffer.count),writeDyDxzBuffer:s(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count),writeDyxDyzBuffer:s(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count),writeDxxDzzBuffer:s(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count),spectrumBuffer:s(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),waveDataBuffer:s(this.waveDataBuffer,"vec4",this.waveDataBuffer.count),index:g,size:o(e.size),time:i(0)}).computeKernel(this.workgroupSize),this.computeInitialize=qe({size:o(e.size),step:o(this.ifftStep),logN:o(this.logN),butterflyBuffer:s(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),DxDzBuffer:s(this.dxDzBuffer,"vec2",this.dxDzBuffer.count).toReadOnly(),DyDxzBuffer:s(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count).toReadOnly(),DyxDyzBuffer:s(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count).toReadOnly(),DxxDzzBuffer:s(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count).toReadOnly(),pingpongBuffer:s(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:o(this.displacementIndex),index:g,workgroupSize:i(new _().fromArray(this.workgroupSize)),workgroupId:P,localId:L}).computeKernel(this.workgroupSize),this.computeHorizontalPingPong=Ye({size:o(e.size),step:o(this.ifftStep),logN:o(this.logN),butterflyBuffer:s(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),pingpongBuffer:s(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:o(this.displacementIndex),pingpong:o(this.pingpong),index:g,workgroupSize:i(new _().fromArray(this.workgroupSize)),workgroupId:P,localId:L}).computeKernel(this.workgroupSize),this.computeVerticalPingPong=Ue({size:o(e.size),step:o(this.ifftStep),logN:o(this.logN),butterflyBuffer:s(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),pingpongBuffer:s(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:o(this.displacementIndex),pingpong:o(this.pingpong),index:g,workgroupSize:i(new _().fromArray(this.workgroupSize)),workgroupId:P,localId:L}).computeKernel(this.workgroupSize),this.computePermute=Xe({size:o(e.size),pingpongBuffer:s(this.pingpongBuffer,"vec4",this.pingpongBuffer.count).toReadOnly(),DxDzBuffer:s(this.dxDzBuffer,"vec2",this.dxDzBuffer.count),DyDxzBuffer:s(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count),DyxDyzBuffer:s(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count),DxxDzzBuffer:s(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count),initBufferIndex:o(this.displacementIndex),index:g,workgroupSize:i(new _().fromArray(this.workgroupSize)),workgroupId:P,localId:L}).computeKernel(this.workgroupSize),this.computeMergeTextures=Ze({size:o(e.size),index:g,lambda:i(e.lambda),deltaTime:this.deltaTime,DxDzBuffer:s(this.dxDzBuffer,"vec2",this.dxDzBuffer.count).toReadOnly(),DyDxzBuffer:s(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count).toReadOnly(),DyxDyzBuffer:s(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count).toReadOnly(),DxxDzzBuffer:s(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count).toReadOnly(),turbulenceBuffer:s(this.turbulenceBuffer,"float",this.turbulenceBuffer.count),writeDisplacement:F(this.displacement),writeDerivative:F(this.derivative),writeJacobian:F(this.jacobian),workgroupSize:i(new _().fromArray(this.workgroupSize)),workgroupId:P,localId:L}).computeKernel(this.workgroupSize)}update(e){this.computeTimeSpectrum.computeNode.parameters.time.value=performance.now()/1e3,this.params.renderer.compute(this.computeTimeSpectrum,this.dispatchSize),this.ifft(0),this.ifft(1),this.ifft(2),this.ifft(3),this.deltaTime.value=e,this.params.renderer.compute(this.computeMergeTextures,this.dispatchSize)}ifft(e){this.displacementIndex.value=e;let r=!0;this.ifftStep.value=0,this.params.renderer.compute(this.computeInitialize,this.dispatchSize);for(let a=1;a<this.logN;a+=1)r=!r,this.ifftStep.value=a,this.pingpong.value=r?1:0,this.params.renderer.compute(this.computeHorizontalPingPong,this.dispatchSize);for(let a=0;a<this.logN;a+=1)r=!r,this.ifftStep.value=a,this.pingpong.value=r?1:0,this.params.renderer.compute(this.computeVerticalPingPong,this.dispatchSize);this.params.renderer.compute(this.computePermute,this.dispatchSize)}dispose(){this.displacement?.dispose?.(),this.derivative?.dispose?.(),this.jacobian?.dispose?.(),this.initialSpectrum?.dispose?.()}}class ct{constructor(e){this.params=e,this.quality=e.quality??k}init(){this.qualityPreset=st(this.quality),this.size=this.qualityPreset.resolution,this.butterflyBuffer=new x(new Float32Array(Math.log2(this.size)*this.size*4),4),this.butterfly=He({butterflyBuffer:s(this.butterflyBuffer,"vec4",this.butterflyBuffer.count),index:g,N:this.size}).compute(Math.log2(this.size)*this.size),this.params.renderer.compute(this.butterfly),this.waveSettings={...H,...V},this.cascades=[],this.foamStrength=rt,this.foamThreshold=at,this.waveLengths=et,this.lambda=tt,this.lodScale=it,this.initCascades()}initCascades(){this.cascades.length=0;let e=1e-4;for(let r=0;r<this.waveLengths.length;r+=1){const a=r<this.waveLengths.length-1?2*Math.PI/this.waveLengths[r+1]*6:9999;this.cascades.push(new ft({...this.params,...this.getCascadeParams(r,e,a)})),e=a}}getCascadeParams(e,r,a){return{boundaryHigh:a,boundaryLow:r,butterflyBuffer:this.butterflyBuffer,lambda:this.lambda[e],lengthScale:this.waveLengths[e],size:this.size,waveSettings:this.waveSettings}}setFoamStrength(e){this.foamStrength.value=e}setFoamThreshold(e){this.foamThreshold.value=e}setLodScale(e){this.lodScale.value=e}applyWaveSettings(e){if(!e)return;let r=!1;Object.entries(e).forEach(([a,n])=>{Object.prototype.hasOwnProperty.call(this.waveSettings,a)&&this.waveSettings[a].value!==n&&(this.waveSettings[a].value=n,r=!0)}),r&&this.cascades.forEach(a=>{a.initialSpectrum.update()})}update(e){this.cascades.forEach(r=>{r.update(e)})}dispose(){this.cascades.forEach(e=>{e.dispose?.()}),this.cascades=[],this.butterflyBuffer?.dispose?.()}}function ut(t){return 1e3/Math.max(1,t?.performance?.waveUpdateHz??30)}function dt({config:t}){const e=W(f=>f.camera),r=W(f=>f.gl),a=W(f=>f.scene),n=E.useRef(null),u=E.useRef(0),h=t?.performance?.quality,C=t?.performance?.pauseWater??!1;return E.useEffect(()=>{if(!r?.isWebGPURenderer)return;const f=new ct({quality:h,renderer:r});f.init();const v=new je({camera:e,layer:0,renderer:r,scene:a,waveGenerator:f});return v.init(),v.applyConfig(t),n.current={oceanManager:v,waveGenerator:f},()=>{u.current=0,n.current=null,v.dispose(),f.dispose?.()}},[e,r,h,a]),ye((f,v)=>{const m=n.current;if(!m)return;if(m.waveGenerator.applyWaveSettings(t.waveSettings),m.oceanManager.applyConfig(t),C){u.current=0,m.oceanManager.update(f.camera);return}const w=ut(t);for(u.current=Math.min(u.current+v*1e3,w*3);u.current>=w;)m.waveGenerator.update(w),u.current-=w;m.oceanManager.update(f.camera)}),null}function Q(t,e,r){return Object.fromEntries(Object.entries(e).map(([a,n])=>[`${t}${a}`,{label:a,max:r[a].max,min:r[a].min,value:n.value}]))}function ee(t,e,r){return Object.fromEntries(Object.keys(r).map(a=>[a,t[`${e}${a}`]]))}function lt(){const t=ze("Row It Alone WebGPU",{Camera:y({camX:{label:"X",value:30,min:-200,max:200,step:.1},camY:{label:"Y",value:20,min:1,max:200,step:.1},camZ:{label:"Z",value:30,min:-200,max:200,step:.1},targetX:{label:"Target X",value:0,min:-100,max:100,step:.1},targetY:{label:"Target Y",value:0,min:-50,max:50,step:.1},targetZ:{label:"Target Z",value:0,min:-100,max:100,step:.1},fov:{value:50,min:20,max:90,step:1},minDistance:{value:10,min:1,max:200,step:1},maxDistance:{value:1200,min:50,max:1e4,step:10}},{collapsed:!0}),Sky:y({elevation:{value:2,min:0,max:90,step:.1},azimuth:{value:180,min:-180,max:180,step:.1},exposure:{value:1,min:.05,max:2.5,step:.01},rayleigh:{value:3,min:0,max:4,step:.001},turbidity:{value:10,min:1,max:20,step:.1},mieCoefficient:{value:.005,min:0,max:.02,step:1e-4},mieDirectionalG:{value:.7,min:0,max:1,step:.001}},{collapsed:!0}),"First Wave Spectrum":y(Q("first_",H,nt),{collapsed:!0}),"Second Wave Spectrum":y(Q("second_",V,ot),{collapsed:!0}),Foam:y({foamStrength:{value:.8,min:0,max:5,step:.1},foamThreshold:{value:2.7,min:0,max:5,step:.1}},{collapsed:!0}),Ocean:y({patchSize:{value:160,min:20,max:1e3,step:1},patchResolution:{value:192,min:16,max:512,step:1},wireframe:!1,lodScale:{value:3.7,min:0,max:20,step:.1}},{collapsed:!1}),Performance:y({quality:{options:Object.keys(R),value:k},pauseWater:{label:"Pause water",value:!1},waveUpdateHz:{value:30,min:5,max:60,step:1}},{collapsed:!0})});return{camera:{fov:t.fov,maxDistance:t.maxDistance,minDistance:t.minDistance,position:[t.camX,t.camY,t.camZ],target:[t.targetX,t.targetY,t.targetZ]},ocean:{lodScale:t.lodScale,patchResolution:t.patchResolution,patchSize:t.patchSize,wireframe:t.wireframe},foam:{foamStrength:t.foamStrength,foamThreshold:t.foamThreshold},sky:{azimuth:t.azimuth,elevation:t.elevation,exposure:t.exposure,mieCoefficient:t.mieCoefficient,mieDirectionalG:t.mieDirectionalG,rayleigh:t.rayleigh,turbidity:t.turbidity,up:[0,1,0]},performance:{pauseWater:t.pauseWater,quality:t.quality,waveUpdateHz:t.waveUpdateHz},waveSettings:{...ee(t,"first_",H),...ee(t,"second_",V)}}}function wt(){const t=lt();return D.jsxs(D.Fragment,{children:[D.jsx(De,{makeDefault:!0,position:t.camera.position,fov:t.camera.fov,near:.1,far:1e6}),D.jsx(Se,{makeDefault:!0,target:t.camera.target,minDistance:t.camera.minDistance,maxDistance:t.camera.maxDistance,maxPolarAngle:Math.PI*.495}),D.jsx("color",{attach:"background",args:["#87ceeb"]}),D.jsx(dt,{config:t})]})}export{wt as default};
