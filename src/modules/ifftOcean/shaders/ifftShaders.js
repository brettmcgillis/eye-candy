import { wgslFn } from 'three/tsl';

export const butterflyWGSL = wgslFn(`

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
`);

export const TimeSpectrumWGSL = wgslFn(`

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
`);

export const ifftHorizontalWGSL = wgslFn(`

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
`);

export const ifftVerticalWGSL = wgslFn(`

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
`);

export const ifftInitWGSL = wgslFn(`

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
`);

export const ifftPermuteWGSL = wgslFn(`

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
`);

export const TexturesMergerWGSL = wgslFn(`

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
`);

export const InitialSpectrumWGSL = wgslFn(`

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
`);

export const InitialSpectrumWithInverseWGSL = wgslFn(`

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
`);
