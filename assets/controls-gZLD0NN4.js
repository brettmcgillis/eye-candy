import{$ as ge,y as oe,V as m,ab as we,aX as N,cY as Z,a0 as ye,b as fe,m as A,L as ce,F as ze,av as ue,C as be,B as De,aT as Be,G as Se,f as J,cT as S,ar as W,H as $,K as _e,a1 as I,aC as k,d as G,r as C,aL as Ce,a as Ie}from"./index-DkmarHC4.js";import{bg as z,aL as R,u as s,j as ke,E as y,aA as T,F as Le,v as Pe,B as Q,f as L,z as Ae,U as _,aW as l,aD as p,bh as M,bi as O,S as H}from"./three.tsl-CkD-u0ek.js";class Te{constructor(e){this.params=e,this.init(e)}destroy(){this.params.group.remove(this.mesh),this.geometry.dispose()}hide(){this.mesh.visible=!1}show(){this.mesh.visible=!0}init(e){this.geometry=new ge,this.mesh=new oe(this.geometry,e.material);const t=new m(e.offset.x,e.offset.y);t.applyMatrix4(e.transform),this.geometry.boundingSphere=new we(t,e.lod>3?e.width*1.75:e.width*3),this.mesh.castShadow=!1,this.mesh.layers.set(e.layer),this.mesh.receiveShadow=!0,e.group.add(this.mesh)}rebuildMeshFromData(e){this.geometry.setAttribute("position",new N(e.positions,3)),this.geometry.setAttribute("normal",new N(e.normals,3)),this.geometry.setAttribute("vindex",new Z(e.vindices,1)),this.geometry.setAttribute("width",new N(e.width,1)),this.geometry.setAttribute("lod",new Z(e.lod,1)),this.geometry.setIndex(new ye(e.indices,1)),this.geometry.attributes.position.needsUpdate=!0,this.geometry.attributes.normal.needsUpdate=!0,this.geometry.attributes.vindex.needsUpdate=!0,this.geometry.attributes.width.needsUpdate=!0,this.geometry.attributes.lod.needsUpdate=!0}}const P=new m,ee=new m,V=new m,te=new m,D=new m,re=new m;function Re(i){const e=[];for(let t=0;t<i;t+=1)for(let r=0;r<i;r+=1)e.push(t*(i+1)+r,(t+1)*(i+1)+r+1,t*(i+1)+r+1),e.push((t+1)*(i+1)+r,(t+1)*(i+1)+r+1,t*(i+1)+r);return e}function Me(i,e){const t=new Array(i.length).fill(0);for(let r=0;r<e.length;r+=3){const a=e[r]*3,f=e[r+1]*3,o=e[r+2]*3;ee.fromArray(i,a),V.fromArray(i,f),te.fromArray(i,o),D.subVectors(te,V),re.subVectors(ee,V),D.cross(re),t[a]+=D.x,t[f]+=D.x,t[o]+=D.x,t[a+1]+=D.y,t[f+1]+=D.y,t[o+1]+=D.y,t[a+2]+=D.z,t[f+2]+=D.z,t[o+2]+=D.z}return t}function Oe({lod:i,offset:e,resolution:t,width:r,worldMatrix:a}){const f=[],o=[],n=[],c=[],u=r/2;let h=0;for(let w=0;w<=t;w+=1){const v=r*w/t;for(let x=0;x<=t;x+=1){const d=r*x/t;P.set(v-u,d-u,0),P.add(e),P.applyMatrix4(a),f.push(P.x,P.y,P.z),o.push(h),n.push(r),c.push(i),h+=1}}const g=Re(t),B=Me(f,g);return{indices:Uint32Array.from(g),lod:Uint32Array.from(c),normals:Float32Array.from(B),positions:Float32Array.from(f),vindices:Uint32Array.from(o),width:Float32Array.from(n)}}const Ee=15,Fe=36,U=R("vec3","ifftOceanDisplacedPosition"),le=R("vec3","ifftOceanMorphedPosition"),de=R("vec3","ifftOceanCascadeScales"),Ne=R("vec2","ifftOceanTexelCoord0"),We=R("vec2","ifftOceanTexelCoord1"),Ge=R("vec2","ifftOceanTexelCoord2"),He=z(`

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

        varyings.ifftOceanCascadeScales = vec3<f32>(lod0, lod1, lod2);
        varyings.ifftOceanDisplacedPosition = displacedPosition;
        varyings.ifftOceanMorphedPosition = morphedPosition;
        varyings.ifftOceanTexelCoord0 = localTexelCoord0;
        varyings.ifftOceanTexelCoord1 = localTexelCoord1;
        varyings.ifftOceanTexelCoord2 = localTexelCoord2;

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
  `,[U,le,de,Ne,We,Ge]),Ve=z(`

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
        seaColor: vec3<f32>,
        horizonColor: vec3<f32>,
        skyColor: vec3<f32>,
        sunColor: vec3<f32>,
        waveColor: vec3<f32>,
        fadeColor: vec3<f32>,
        specularColor: vec3<f32>,
        foamColor: vec3<f32>,
        specularStrength: f32,
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
        var specular = specularLight2(normalOcean, sunDir, viewDir, 8.0) * 1.3 * specularStrength;
        var reflected = reflect(-viewDir, normalOcean);
        var skyMix = clamp(reflected.y * 0.5 + 0.5, 0.0, 1.0);
        var reflectionColor = mix(horizonColor, skyColor, skyMix);
        reflectionColor += pow(max(dot(reflected, sunDir), 0.0), 96.0) * sunColor * 0.35 * specularStrength;
        var refractionColor = seaColor;
        var waterColor = mix(refractionColor, reflectionColor, fresnel);

        var atten: f32 = max(1.0 - vViewDist * vViewDist * 0.001, 0.0);
        waterColor += waveColor * saturate(vDisplacedPosition.y) * 0.05 * atten;

        var oceanColor = waterColor;
        oceanColor += specularColor * specular;
        oceanColor = mix(oceanColor, foamColor, foamMixFactor);
        oceanColor = mix(seaColor, oceanColor, vCascadeScales.x);

        let fade = smoothstep(500.0, 4000.0, vViewDist);
        let finalColor = mix(oceanColor, fadeColor, fade);
        return vec4<f32>(finalColor, 1.0);
    }

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
`),he=["seaColor","horizonColor","skyColor","sunColor","waveColor","fadeColor","specularColor","foamColor"],pe={seaColor:[.004,.016,.047],horizonColor:[.42,.62,.82],skyColor:[.08,.21,.39],sunColor:[1,.9,.72],waveColor:[.14,.25,.18],fadeColor:[0,.1,.2],specularColor:new m(5,4.5,4).normalize().toArray(),foamColor:[1,1,1]},E=new be;function je(){return Object.fromEntries(he.map(i=>[i,s(new m(...pe[i]))]))}function Ye(i,e){he.forEach(r=>{const a=e?.[r];a?(E.set(a),i[r].value.set(E.r,E.g,E.b)):i[r].value.fromArray(pe[r])});const{specularStrength:t}=i;t.value=e?.specularStrength??1}class Ue{constructor(e){const t={time:s(0),cameraPosition:s(new m),minLodRadius:Ee,gridResolution:s(e.gridResolution??Fe),position:T("position"),vindex:T("vindex"),width:T("width"),lod:T("lod"),ifftResolution:s(e.ifftResolution),displacement0:y(e.cascades[0].displacement),displacement1:y(e.cascades[1].displacement),displacement2:y(e.cascades[2].displacement),derivatives0:y(e.cascades[0].derivative),derivatives1:y(e.cascades[1].derivative),derivatives2:y(e.cascades[2].derivative),jacobian0:y(e.cascades[0].jacobian),jacobian1:y(e.cascades[1].jacobian),jacobian2:y(e.cascades[2].jacobian),ifft_sampler0:y(e.cascades[0].derivative),ifft_sampler1:y(e.cascades[1].derivative),ifft_sampler2:y(e.cascades[2].derivative),foamStrength:e.foamStrength,foamThreshold:e.foamThreshold,lodScale:e.lodScale,morphBlend:s(e.morphBlend??1),waveLengths:ke(e.cascades[0].params.lengthScale,e.cascades[1].params.lengthScale,e.cascades[2].params.lengthScale),sunPosition:s(e.sunPosition),...je(),specularStrength:s(1),vMorphedPosition:le,vDisplacedPosition:U,vCascadeScales:de},r=s(new fe),a=s(new A(0,0)),f=s(0),o=new ce;o.positionNode=He(t),o.colorNode=Ve(t),o.opacityNode=Le(()=>{const n=r.mul(Pe(U,1)).xyz,c=n.x.div(Q(a.x,L(1e-4))),u=n.z.div(Q(a.y,L(1e-4))),h=c.mul(c).add(u.mul(u)).lessThan(L(1)).and(f.greaterThan(L(.5)));return Ae(h,L(0),L(1))})(),o.alphaTest=.5,o.side=ze,o.colorSpace=ue,o.transparent=!1,this.material=o,this.parameters=t,this.hullMask={enabled:f,extents:a,inverse:r}}}const qe=z(`

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
`);class Ke extends oe{constructor(){const e={position:T("position"),normal:T("normal"),turbidity:s(10),rayleigh:s(3),mieCoefficient:s(.005),mieDirectionalG:s(.7),elevation:s(2),sunPosition:s(new m(0,0,0)),up:s(new m(0,1,0)),cameraPosition:s(new m(0,0,0))},t=new ce;t.colorNode=qe(e),t.side=De,t.colorSpace=ue,super(new Be(1,1,1),t),this.parameters=e}}const ae=new m,ie=new m,j=new m,Y=new m,Xe=160,me=192,Ze=2;function Je(i={}){return{patchResolution:Math.max(Ze,Math.round(i.patchResolution??me)),patchSize:i.patchSize??Xe}}class $e{constructor(e){this.params=e,this.currentConfig=null,this.patch=null,this.patchSignature="",this.patchTransform=new fe().makeRotationX(-Math.PI/2),this.sun=new m}init(){const e=new Ue({foamStrength:this.params.waveGenerator.foamStrength,foamThreshold:this.params.waveGenerator.foamThreshold,ifftResolution:this.params.waveGenerator.size,gridResolution:me,lodScale:this.params.waveGenerator.lodScale,morphBlend:0,cascades:this.params.waveGenerator.cascades,sunPosition:this.sun});this.material=e.material,this.materialParameters=e.parameters,this.hullMask=e.hullMask,this.group=new Se,this.params.scene.add(this.group),this.sky=new Ke,this.sky.layers.set(2),this.sky.scale.setScalar(5e5),this.params.scene.add(this.sky),this.ensurePatch()}ensurePatch(e){const{patchResolution:t,patchSize:r}=Je(e),a=`${r}:${t}`;this.patchSignature!==a&&(this.patch?.destroy(),j.set(0,0,0),this.patch=new Te({group:this.group,layer:this.params.layer,lod:0,material:this.material,offset:j.clone(),transform:this.patchTransform,width:r}),this.patch.rebuildMeshFromData(Oe({lod:0,offset:j,resolution:t,width:r,worldMatrix:this.patchTransform})),this.patch.show(),this.materialParameters.gridResolution.value=t,this.patchSignature=a)}applyConfig(e){if(this.currentConfig=e,!e)return;this.ensurePatch(e.ocean),this.material.wireframe=e.ocean.wireframe,this.appliedColors!==e.oceanColors&&(Ye(this.materialParameters,e.oceanColors),this.appliedColors=e.oceanColors),this.sky.visible=e.sky.visible??!0,this.params.waveGenerator.setFoamStrength(e.foam.foamStrength),this.params.waveGenerator.setFoamThreshold(e.foam.foamThreshold),this.params.waveGenerator.setLodScale(e.ocean.lodScale),this.sky.parameters.rayleigh.value=e.sky.rayleigh,this.sky.parameters.turbidity.value=e.sky.turbidity,this.sky.parameters.mieCoefficient.value=e.sky.mieCoefficient,this.sky.parameters.mieDirectionalG.value=e.sky.mieDirectionalG,this.sky.parameters.elevation.value=e.sky.elevation,this.sky.parameters.up.value.fromArray(e.sky.up);const t=J.degToRad(90-e.sky.elevation),r=J.degToRad(e.sky.azimuth);this.sun.setFromSphericalCoords(1,t,r),this.sky.parameters.sunPosition.value.copy(this.sun),typeof e.sky.exposure=="number"&&(this.initialExposure??=this.params.renderer.toneMappingExposure,this.params.renderer.toneMappingExposure=e.sky.exposure)}update(e=this.params.camera){this.params.camera=e,this.params.camera.getWorldPosition(ae),this.params.scene.getWorldPosition(ie),Y.subVectors(ae,ie),this.sky.parameters.cameraPosition.value.copy(Y),this.patch&&(this.patch.show(),this.patch.mesh.material.wireframe=this.currentConfig?.ocean?.wireframe??!1),this.materialParameters.cameraPosition.value.copy(Y),this.materialParameters.sunPosition.value.copy(this.sun)}dispose(){this.patch?.destroy(),this.patch=null,this.patchSignature="",this.initialExposure!==void 0&&(this.params.renderer.toneMappingExposure=this.initialExposure),this.params.scene.remove(this.group),this.params.scene.remove(this.sky),this.material.dispose(),this.sky.geometry.dispose(),this.sky.material.dispose()}}const Qe=192;class se{constructor({modeCount:e=Qe}={}){this.modeCount=e,this.ready=!1,this.time=0,this.lambda=1,this.count=0}async load({cascade:e,renderer:t}){const r=new Float32Array(await t.getArrayBufferAsync(e.spectrumBuffer)),a=new Float32Array(await t.getArrayBufferAsync(e.waveDataBuffer)),f=Math.min(r.length,a.length)/4,o=[];for(let c=0;c<f;c+=1){const u=c*4,h=a[u+3],g=r[u],B=r[u+1],w=r[u+2],v=r[u+3],x=g*g+B*B+w*w+v*v;h!==0&&x>0&&o.push({energy:x,index:c})}o.sort((c,u)=>u.energy-c.energy);const n=Math.min(this.modeCount,o.length);this.count=n,this.kx=new Float32Array(n),this.kz=new Float32Array(n),this.invK=new Float32Array(n),this.omega=new Float32Array(n),this.h0pr=new Float32Array(n),this.h0pi=new Float32Array(n),this.h0mr=new Float32Array(n),this.h0mi=new Float32Array(n),this.hr=new Float32Array(n),this.hi=new Float32Array(n);for(let c=0;c<n;c+=1){const u=o[c].index*4;this.kx[c]=a[u],this.invK[c]=a[u+1],this.kz[c]=a[u+2],this.omega[c]=a[u+3],this.h0pr[c]=r[u],this.h0pi[c]=r[u+1],this.h0mr[c]=r[u+2],this.h0mi[c]=r[u+3]}return this.lambda=e.params.lambda,this.ready=!0,this.setTime(this.time),this}setTime(e){if(this.time=e,!!this.ready)for(let t=0;t<this.count;t+=1){const r=this.omega[t]*e,a=Math.cos(r),f=Math.sin(r);this.hr[t]=this.h0pr[t]*a-this.h0pi[t]*f+this.h0mr[t]*a+this.h0mi[t]*f,this.hi[t]=this.h0pr[t]*f+this.h0pi[t]*a-this.h0mr[t]*f+this.h0mi[t]*a}}sampleHeight(e,t){if(!this.ready)return 0;let r=0;for(let a=0;a<this.count;a+=1){const f=this.kx[a]*e+this.kz[a]*t;r+=this.hr[a]*Math.cos(f)-this.hi[a]*Math.sin(f)}return r}sampleDisplacement(e,t,r){if(!this.ready)return r.set(0,0,0);let a=0,f=0,o=0;for(let n=0;n<this.count;n+=1){const c=this.kx[n]*e+this.kz[n]*t,u=Math.cos(c),h=Math.sin(c),g=this.hr[n]*u-this.hi[n]*h,w=-(this.hr[n]*h+this.hi[n]*u)*this.invK[n];a+=w*this.kx[n],f+=g,o+=w*this.kz[n]}return r.set(a*this.lambda,f,o*this.lambda)}sampleNormal(e,t,r,a=.35){const f=this.sampleHeight(e-a,t),o=this.sampleHeight(e+a,t),n=this.sampleHeight(e,t-a),c=this.sampleHeight(e,t+a);return r.set(f-o,a*2,n-c).normalize()}sampleSurfaceHeight(e,t,r,a=2){if(!this.ready)return 0;let f=e,o=t;for(let n=0;n<a;n+=1)this.sampleDisplacement(f,o,r),f=e-r.x,o=t-r.z;return this.sampleDisplacement(f,o,r),r.y}dispose(){this.ready=!1,this.count=0}}const et=z(`

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
`),tt=z(`

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
`),rt=z(`

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
`),at=z(`

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
`),it=z(`

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
`),st=z(`

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
`),nt=z(`

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
`),ot=z(`

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
`),ft=z(`

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
`);class ct{constructor(e){this.params=e,this.init(e)}init(e){this.squareSize=e.size**2,this.bufferSize=this.squareSize*4,this.spectrumBuffer=new S(new Float32Array(this.bufferSize),4),this.waveDataBuffer=new S(new Float32Array(this.bufferSize),4),this.initialSpectrum=ot({spectrumBuffer:l(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),waveDataBuffer:l(this.waveDataBuffer,"vec4",this.waveDataBuffer.count),index:_,size:e.size,waveLength:s(e.lengthScale),boundaryLow:s(e.boundaryLow),boundaryHigh:s(e.boundaryHigh),...e.waveSettings}).compute(this.squareSize),this.initialSpectrumWithInverse=ft({spectrumBuffer:l(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),index:_,size:e.size}).compute(this.squareSize),e.renderer.compute(this.initialSpectrum),e.renderer.compute(this.initialSpectrumWithInverse)}update(){this.params.renderer.compute(this.initialSpectrum),this.params.renderer.compute(this.initialSpectrumWithInverse)}dispose(){this.spectrumBuffer?.dispose?.(),this.waveDataBuffer?.dispose?.()}}const ut=[16,16,1],lt=[250,17,5],dt=[.9,.9,.9],q=Object.freeze({Low:Object.freeze({resolution:128}),Medium:Object.freeze({resolution:256}),High:Object.freeze({resolution:512})}),F="Medium";q[F].resolution;const ht=s(.8),pt=s(2.7),mt=s(3.7);function vt(i=F){return q[i]||q[F]}const K={depth:s(20),scaleHeight:s(1),windSpeed:s(1),windDirection:s(0),fetch:s(1e5),spreadBlend:s(1),swell:s(.198),peakEnhancement:s(3.3),shortWaveFade:s(0),fadeLimit:s(0)},xt={depth:{min:.1,max:100},scaleHeight:{min:0,max:1},windSpeed:{min:.01,max:10},windDirection:{min:0,max:2*Math.PI},fetch:{min:10,max:5e5},spreadBlend:{min:0,max:1},swell:{min:0,max:1},peakEnhancement:{min:1,max:5},shortWaveFade:{min:0,max:5},fadeLimit:{min:0,max:1}},X={d_depth:s(20),d_scaleHeight:s(1),d_windSpeed:s(1),d_windDirection:s(240/360*2*Math.PI),d_fetch:s(3e5),d_spreadBlend:s(1),d_swell:s(.5),d_peakEnhancement:s(3.3),d_shortWaveFade:s(0),d_fadeLimit:s(0)},gt={d_depth:{min:.1,max:100},d_scaleHeight:{min:0,max:1},d_windSpeed:{min:.01,max:10},d_windDirection:{min:0,max:2*Math.PI},d_fetch:{min:10,max:5e5},d_spreadBlend:{min:0,max:1},d_swell:{min:0,max:1},d_peakEnhancement:{min:1,max:5},d_shortWaveFade:{min:0,max:5},d_fadeLimit:{min:0,max:1}};class wt{constructor(e){this.init(e)}init(e){this.params=e,this.logN=Math.log2(e.size),this.squareSize=e.size**2,this.bufferSize=this.squareSize*2,this.initialSpectrum=new ct(e),this.spectrumBuffer=this.initialSpectrum.spectrumBuffer,this.waveDataBuffer=this.initialSpectrum.waveDataBuffer,this.dxDzBuffer=new S(new Float32Array(this.bufferSize),2),this.dyDxzBuffer=new S(new Float32Array(this.bufferSize),2),this.dyxDyzBuffer=new S(new Float32Array(this.bufferSize),2),this.dxxDzzBuffer=new S(new Float32Array(this.bufferSize),2),this.pingpongBuffer=new S(new Float32Array(this.bufferSize*2),4),this.turbulenceBuffer=new S(new Float32Array(this.bufferSize/2),1),this.displacementIndex=s(0),this.ifftStep=s(0),this.pingpong=s(0),this.deltaTime=s(0),this.displacement=new W(e.size,e.size),this.derivative=new W(e.size,e.size),this.jacobian=new W(e.size,e.size),this.displacement.type=$,this.derivative.type=$,this.jacobian.type=_e,this.displacement.generateMipmaps=!1,this.derivative.generateMipmaps=!1,this.jacobian.generateMipmaps=!1,this.displacement.magFilter=I,this.derivative.magFilter=I,this.jacobian.magFilter=I,this.displacement.minFilter=I,this.derivative.minFilter=I,this.jacobian.minFilter=I,this.displacement.wrapS=k,this.displacement.wrapT=k,this.derivative.wrapS=k,this.derivative.wrapT=k,this.jacobian.wrapS=k,this.jacobian.wrapT=k,this.workgroupSize=ut,this.dispatchSize=[e.size/this.workgroupSize[0],e.size/this.workgroupSize[1]],this.computeTimeSpectrum=tt({writeDxDzBuffer:l(this.dxDzBuffer,"vec2",this.dxDzBuffer.count),writeDyDxzBuffer:l(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count),writeDyxDyzBuffer:l(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count),writeDxxDzzBuffer:l(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count),spectrumBuffer:l(this.spectrumBuffer,"vec4",this.spectrumBuffer.count),waveDataBuffer:l(this.waveDataBuffer,"vec4",this.waveDataBuffer.count),index:_,size:p(e.size),time:s(0)}).computeKernel(this.workgroupSize),this.computeInitialize=it({size:p(e.size),step:p(this.ifftStep),logN:p(this.logN),butterflyBuffer:l(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),DxDzBuffer:l(this.dxDzBuffer,"vec2",this.dxDzBuffer.count).toReadOnly(),DyDxzBuffer:l(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count).toReadOnly(),DyxDyzBuffer:l(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count).toReadOnly(),DxxDzzBuffer:l(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count).toReadOnly(),pingpongBuffer:l(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:p(this.displacementIndex),index:_,workgroupSize:s(new A().fromArray(this.workgroupSize)),workgroupId:O,localId:M}).computeKernel(this.workgroupSize),this.computeHorizontalPingPong=rt({size:p(e.size),step:p(this.ifftStep),logN:p(this.logN),butterflyBuffer:l(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),pingpongBuffer:l(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:p(this.displacementIndex),pingpong:p(this.pingpong),index:_,workgroupSize:s(new A().fromArray(this.workgroupSize)),workgroupId:O,localId:M}).computeKernel(this.workgroupSize),this.computeVerticalPingPong=at({size:p(e.size),step:p(this.ifftStep),logN:p(this.logN),butterflyBuffer:l(e.butterflyBuffer,"vec4",e.butterflyBuffer.count).toReadOnly(),pingpongBuffer:l(this.pingpongBuffer,"vec4",this.pingpongBuffer.count),initBufferIndex:p(this.displacementIndex),pingpong:p(this.pingpong),index:_,workgroupSize:s(new A().fromArray(this.workgroupSize)),workgroupId:O,localId:M}).computeKernel(this.workgroupSize),this.computePermute=st({size:p(e.size),pingpongBuffer:l(this.pingpongBuffer,"vec4",this.pingpongBuffer.count).toReadOnly(),DxDzBuffer:l(this.dxDzBuffer,"vec2",this.dxDzBuffer.count),DyDxzBuffer:l(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count),DyxDyzBuffer:l(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count),DxxDzzBuffer:l(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count),initBufferIndex:p(this.displacementIndex),index:_,workgroupSize:s(new A().fromArray(this.workgroupSize)),workgroupId:O,localId:M}).computeKernel(this.workgroupSize),this.computeMergeTextures=nt({size:p(e.size),index:_,lambda:s(e.lambda),deltaTime:this.deltaTime,DxDzBuffer:l(this.dxDzBuffer,"vec2",this.dxDzBuffer.count).toReadOnly(),DyDxzBuffer:l(this.dyDxzBuffer,"vec2",this.dyDxzBuffer.count).toReadOnly(),DyxDyzBuffer:l(this.dyxDyzBuffer,"vec2",this.dyxDyzBuffer.count).toReadOnly(),DxxDzzBuffer:l(this.dxxDzzBuffer,"vec2",this.dxxDzzBuffer.count).toReadOnly(),turbulenceBuffer:l(this.turbulenceBuffer,"float",this.turbulenceBuffer.count),writeDisplacement:H(this.displacement),writeDerivative:H(this.derivative),writeJacobian:H(this.jacobian),workgroupSize:s(new A().fromArray(this.workgroupSize)),workgroupId:O,localId:M}).computeKernel(this.workgroupSize)}update(e){this.waveTime=performance.now()/1e3,this.computeTimeSpectrum.computeNode.parameters.time.value=this.waveTime,this.params.renderer.compute(this.computeTimeSpectrum,this.dispatchSize),this.ifft(0),this.ifft(1),this.ifft(2),this.ifft(3),this.deltaTime.value=e,this.params.renderer.compute(this.computeMergeTextures,this.dispatchSize)}ifft(e){this.displacementIndex.value=e;let t=!0;this.ifftStep.value=0,this.params.renderer.compute(this.computeInitialize,this.dispatchSize);for(let r=1;r<this.logN;r+=1)t=!t,this.ifftStep.value=r,this.pingpong.value=t?1:0,this.params.renderer.compute(this.computeHorizontalPingPong,this.dispatchSize);for(let r=0;r<this.logN;r+=1)t=!t,this.ifftStep.value=r,this.pingpong.value=t?1:0,this.params.renderer.compute(this.computeVerticalPingPong,this.dispatchSize);this.params.renderer.compute(this.computePermute,this.dispatchSize)}dispose(){this.displacement?.dispose?.(),this.derivative?.dispose?.(),this.jacobian?.dispose?.(),this.initialSpectrum?.dispose?.()}}class yt{constructor(e){this.params=e,this.quality=e.quality??F}init(){this.qualityPreset=vt(this.quality),this.size=this.qualityPreset.resolution,this.butterflyBuffer=new S(new Float32Array(Math.log2(this.size)*this.size*4),4),this.butterfly=et({butterflyBuffer:l(this.butterflyBuffer,"vec4",this.butterflyBuffer.count),index:_,N:this.size}).compute(Math.log2(this.size)*this.size),this.params.renderer.compute(this.butterfly),this.waveSettings={...K,...X},this.cascades=[],this.foamStrength=ht,this.foamThreshold=pt,this.waveLengths=lt,this.lambda=dt,this.lodScale=mt,this.initCascades()}initCascades(){this.cascades.length=0;let e=1e-4;for(let t=0;t<this.waveLengths.length;t+=1){const r=t<this.waveLengths.length-1?2*Math.PI/this.waveLengths[t+1]*6:9999;this.cascades.push(new wt({...this.params,...this.getCascadeParams(t,e,r)})),e=r}}getCascadeParams(e,t,r){return{boundaryHigh:r,boundaryLow:t,butterflyBuffer:this.butterflyBuffer,lambda:this.lambda[e],lengthScale:this.waveLengths[e],size:this.size,waveSettings:this.waveSettings}}setFoamStrength(e){this.foamStrength.value=e}setFoamThreshold(e){this.foamThreshold.value=e}setLodScale(e){this.lodScale.value=e}applyWaveSettings(e){if(!e)return!1;let t=!1;return Object.entries(e).forEach(([r,a])=>{Object.prototype.hasOwnProperty.call(this.waveSettings,r)&&this.waveSettings[r].value!==a&&(this.waveSettings[r].value=a,t=!0)}),t&&this.cascades.forEach(r=>{r.initialSpectrum.update()}),t}update(e){this.cascades.forEach(t=>{t.update(e)})}dispose(){this.cascades.forEach(e=>{e.dispose?.()}),this.cascades=[],this.butterflyBuffer?.dispose?.()}}async function zt({cascade:i,renderer:e,sampler:t}){const r=new Float32Array(await e.getArrayBufferAsync(i.dyDxzBuffer)),{size:a}=i.params,{lengthScale:f}=i.params,o=Math.max(1,Math.floor(a/16));let n=0,c=0,u=0;t.setTime(i.waveTime??0);for(let h=0;h<a;h+=o)for(let g=0;g<a;g+=o){const B=r[(h*a+g)*2],w=t.sampleHeight(g*f/a,h*f/a);n=Math.max(n,Math.abs(B)),c=Math.max(c,Math.abs(B-w)),u+=1}return{maxAbsolute:n,maxError:c,modeCount:t.count,relativeError:n>0?c/n:0,sampleCount:u}}const bt=250;function Dt(i){return 1e3/Math.max(1,i?.performance?.waveUpdateHz??30)}function It(i){const e=G(v=>v.camera),t=G(v=>v.gl),r=G(v=>v.scene),a=C.useRef(null),f=C.useRef(i),o=C.useRef(0),n=C.useRef(null),c=C.useRef(new se),[u,h]=C.useState(null),g=i?.performance?.quality,B=i?.performance?.pauseWater??!1,w=i?.buoyancy?.modeCount??192;return f.current=i,C.useEffect(()=>{if(!t?.isWebGPURenderer)return;let v=!1;const x=new yt({quality:g,renderer:t});x.init(),x.applyWaveSettings(f.current?.waveSettings);const d=new $e({camera:e,layer:0,renderer:t,scene:r,waveGenerator:x});d.init(),d.applyConfig(i);const b=new se({modeCount:w});return c.current=b,a.current={oceanManager:d,sampler:b,waveGenerator:x},b.load({cascade:x.cascades[0],renderer:t}).then(()=>{v||(h(b),Ce()&&typeof window<"u"&&(window.ifftOceanWaveCheck=()=>zt({cascade:x.cascades[0],renderer:t,sampler:b})))}).catch(()=>{v||h(null)}),()=>{v=!0,o.current=0,n.current=null,a.current=null,h(null),b.dispose(),d.dispose(),x.dispose?.()}},[w,e,t,g,r]),Ie((v,x)=>{const d=a.current;if(!d)return;if(d.waveGenerator.applyWaveSettings(i.waveSettings)&&(n.current=performance.now()+bt),n.current!==null&&performance.now()>=n.current&&(n.current=null,d.sampler.load({cascade:d.waveGenerator.cascades[0],renderer:t}).catch(()=>{})),d.oceanManager.applyConfig(i),B){o.current=0,d.oceanManager.update(v.camera),d.sampler.setTime(d.waveGenerator.cascades[0].waveTime??0);return}const b=Dt(i);for(o.current=Math.min(o.current+x*1e3,b*3);o.current>=b;)d.waveGenerator.update(b),o.current-=b;d.oceanManager.update(v.camera),d.sampler.setTime(d.waveGenerator.cascades[0].waveTime??0)}),{runtimeRef:a,sampler:u,samplerRef:c}}const ve=i=>Object.fromEntries(Object.entries(i).map(([e,t])=>[e,t.value])),Bt=ve(K),St=ve(X);function xe(i,e,t,r={}){return Object.fromEntries(Object.entries(e).map(([a,f])=>[`${i}${a}`,{label:a,max:t[a].max,min:t[a].min,value:r[`${i}${a}`]??f}]))}function ne(i,e,t){return Object.fromEntries(Object.keys(t).map(r=>[r,i[`${e}${r}`]]))}function kt({prefix:i="first_",snapshot:e}={}){return xe(i,Bt,xt,e)}function Lt({prefix:i="second_",snapshot:e}={}){return xe(i,St,gt,e)}function Pt(i,e="first_",t="second_"){return{...ne(i,e,K),...ne(i,t,X)}}export{F as D,q as W,kt as a,Lt as b,Pt as r,It as u};
