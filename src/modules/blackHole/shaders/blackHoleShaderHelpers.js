import {
  Fn,
  asin,
  atan,
  clamp,
  cos,
  dot,
  float,
  floor,
  fract,
  length,
  max,
  mix,
  sin,
  smoothstep,
  sqrt,
  step,
  vec2,
  vec3,
} from 'three/tsl';

const hash21 = Fn(([point]) => {
  const noise = sin(dot(point, vec2(127.1, 311.7))).mul(43758.5453);
  return fract(noise);
});

const hash31 = Fn(([point]) => {
  const noise = sin(dot(point, vec3(127.1, 311.7, 74.7))).mul(43758.5453);
  return fract(noise);
});

const hash22 = Fn(([point]) => {
  const px = fract(sin(dot(point, vec2(127.1, 311.7))).mul(43758.5453));
  const py = fract(sin(dot(point, vec2(269.5, 183.3))).mul(43758.5453));
  return vec2(px, py);
});

const noise3D = Fn(([point]) => {
  const cell = floor(point);
  const local = fract(point);
  const blend = local.mul(local).mul(float(3).sub(local.mul(2)));

  const a = hash31(cell);
  const b = hash31(cell.add(vec3(1, 0, 0)));
  const c = hash31(cell.add(vec3(0, 1, 0)));
  const d = hash31(cell.add(vec3(1, 1, 0)));
  const e = hash31(cell.add(vec3(0, 0, 1)));
  const f = hash31(cell.add(vec3(1, 0, 1)));
  const g = hash31(cell.add(vec3(0, 1, 1)));
  const h = hash31(cell.add(vec3(1, 1, 1)));

  return mix(
    mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y),
    mix(mix(e, f, blend.x), mix(g, h, blend.x), blend.y),
    blend.z
  );
});

export const fbm = Fn(([point, lacunarity, persistence]) => {
  const value = float(0).toVar();
  const amplitude = float(0.5).toVar();
  const pos = point.toVar();

  value.addAssign(noise3D(pos).mul(amplitude));
  pos.mulAssign(lacunarity);
  amplitude.mulAssign(persistence);

  value.addAssign(noise3D(pos).mul(amplitude));
  pos.mulAssign(lacunarity);
  amplitude.mulAssign(persistence);

  value.addAssign(noise3D(pos).mul(amplitude));
  pos.mulAssign(lacunarity);
  amplitude.mulAssign(persistence);

  value.addAssign(noise3D(pos).mul(amplitude));

  return value;
});

const BLACKBODY_COLORS = {
  1000: [1, 0.0337, 0],
  1100: [1, 0.0592, 0],
  1200: [1, 0.0846, 0],
  1300: [1, 0.1096, 0],
  1400: [1, 0.1341, 0],
  1500: [1, 0.1578, 0],
  1600: [1, 0.1806, 0],
  1700: [1, 0.2025, 0],
  1800: [1, 0.2235, 0],
  1900: [1, 0.2434, 0],
  2000: [1, 0.2647, 0.0033],
  2100: [1, 0.2889, 0.012],
  2200: [1, 0.3126, 0.0219],
  2300: [1, 0.336, 0.0331],
  2400: [1, 0.3589, 0.0454],
  2500: [1, 0.3814, 0.0588],
  2600: [1, 0.4034, 0.0734],
  2700: [1, 0.425, 0.0889],
  2800: [1, 0.4461, 0.1054],
  2900: [1, 0.4668, 0.1229],
  3000: [1, 0.487, 0.1411],
  3100: [1, 0.5067, 0.1602],
  3200: [1, 0.5259, 0.18],
  3300: [1, 0.5447, 0.2005],
  3400: [1, 0.563, 0.2216],
  3500: [1, 0.5809, 0.2433],
  3600: [1, 0.5983, 0.2655],
  3700: [1, 0.6153, 0.2881],
  3800: [1, 0.6318, 0.3112],
  3900: [1, 0.648, 0.3346],
  4000: [1, 0.6636, 0.3583],
  4100: [1, 0.6789, 0.3823],
  4200: [1, 0.6938, 0.4066],
  4300: [1, 0.7083, 0.431],
  4400: [1, 0.7223, 0.4556],
  4500: [1, 0.736, 0.4803],
  4600: [1, 0.7494, 0.5051],
  4700: [1, 0.7623, 0.5299],
  4800: [1, 0.775, 0.5548],
  4900: [1, 0.7872, 0.5797],
  5000: [1, 0.7992, 0.6045],
  5100: [1, 0.8108, 0.6293],
  5200: [1, 0.8221, 0.6541],
  5300: [1, 0.833, 0.6787],
  5400: [1, 0.8437, 0.7032],
  5500: [1, 0.8541, 0.7277],
  5600: [1, 0.8642, 0.7519],
  5700: [1, 0.874, 0.776],
  5800: [1, 0.8836, 0.8],
  5900: [1, 0.8929, 0.8238],
  6000: [1, 0.9019, 0.8473],
  6100: [1, 0.9107, 0.8707],
  6200: [1, 0.9193, 0.8939],
  6300: [1, 0.9276, 0.9168],
  6400: [1, 0.9357, 0.9396],
  6500: [1, 0.9436, 0.9621],
  6600: [1, 0.9513, 0.9844],
  6700: [0.9937, 0.9526, 1],
  6800: [0.9726, 0.9395, 1],
  6900: [0.9526, 0.927, 1],
  7000: [0.9337, 0.915, 1],
  7100: [0.9157, 0.9035, 1],
  7200: [0.8986, 0.8925, 1],
  7300: [0.8823, 0.8819, 1],
  7400: [0.8668, 0.8718, 1],
  7500: [0.852, 0.8621, 1],
  7600: [0.8379, 0.8527, 1],
  7700: [0.8244, 0.8437, 1],
  7800: [0.8115, 0.8351, 1],
  7900: [0.7992, 0.8268, 1],
  8000: [0.7874, 0.8187, 1],
  8100: [0.7761, 0.811, 1],
  8200: [0.7652, 0.8035, 1],
  8300: [0.7548, 0.7963, 1],
  8400: [0.7449, 0.7894, 1],
  8500: [0.7353, 0.7827, 1],
  8600: [0.726, 0.7762, 1],
  8700: [0.7172, 0.7699, 1],
  8800: [0.7086, 0.7638, 1],
  8900: [0.7004, 0.7579, 1],
  9000: [0.6925, 0.7522, 1],
  9100: [0.6848, 0.7467, 1],
  9200: [0.6774, 0.7414, 1],
  9300: [0.6703, 0.7362, 1],
  9400: [0.6635, 0.7311, 1],
  9500: [0.6568, 0.7263, 1],
  9600: [0.6504, 0.7215, 1],
  9700: [0.6442, 0.7169, 1],
  9800: [0.6382, 0.7124, 1],
  9900: [0.6324, 0.7081, 1],
  10000: [0.6268, 0.7039, 1],
  11000: [0.5791, 0.6674, 1],
  12000: [0.5431, 0.6389, 1],
  13000: [0.5152, 0.6162, 1],
  14000: [0.493, 0.5978, 1],
  15000: [0.4749, 0.5824, 1],
  16000: [0.4599, 0.5696, 1],
  17000: [0.4474, 0.5586, 1],
  18000: [0.4367, 0.5492, 1],
  19000: [0.4275, 0.541, 1],
  20000: [0.4196, 0.5339, 1],
  25000: [0.3917, 0.5083, 1],
  30000: [0.3751, 0.4926, 1],
  35000: [0.3641, 0.4821, 1],
  40000: [0.3563, 0.4745, 1],
};

function getBlackbodyColor(temperatureKelvin) {
  const temperatures = Object.keys(BLACKBODY_COLORS)
    .map(Number)
    .sort((a, b) => a - b);
  const clamped = Math.max(1000, Math.min(40000, temperatureKelvin));

  let low = temperatures[0];
  let high = temperatures[0];

  for (let index = 0; index < temperatures.length - 1; index += 1) {
    if (clamped >= temperatures[index] && clamped <= temperatures[index + 1]) {
      low = temperatures[index];
      high = temperatures[index + 1];
      break;
    }
  }

  const t = high === low ? 0 : (clamped - low) / (high - low);
  const lowColor = BLACKBODY_COLORS[low];
  const highColor = BLACKBODY_COLORS[high];

  return [
    lowColor[0] + (highColor[0] - lowColor[0]) * t,
    lowColor[1] + (highColor[1] - lowColor[1]) * t,
    lowColor[2] + (highColor[2] - lowColor[2]) * t,
  ];
}

const BLACKBODY_TEMPERATURES = [];
const BLACKBODY_RED = [];
const BLACKBODY_GREEN = [];
const BLACKBODY_BLUE = [];

for (let temperature = 1000; temperature <= 10000; temperature += 100) {
  const color = getBlackbodyColor(temperature);
  BLACKBODY_TEMPERATURES.push(temperature);
  BLACKBODY_RED.push(color[0]);
  BLACKBODY_GREEN.push(color[1]);
  BLACKBODY_BLUE.push(color[2]);
}

for (let temperature = 11000; temperature <= 40000; temperature += 1000) {
  const color = getBlackbodyColor(temperature);
  BLACKBODY_TEMPERATURES.push(temperature);
  BLACKBODY_RED.push(color[0]);
  BLACKBODY_GREEN.push(color[1]);
  BLACKBODY_BLUE.push(color[2]);
}

export const blackbodyColor = Fn(([temperatureKelvin]) => {
  const temperature = clamp(temperatureKelvin, float(1000), float(40000));
  const red = float(0).toVar();
  const green = float(0).toVar();
  const blue = float(0).toVar();

  for (let index = 0; index < BLACKBODY_TEMPERATURES.length - 1; index += 1) {
    const low = float(BLACKBODY_TEMPERATURES[index]);
    const high = float(BLACKBODY_TEMPERATURES[index + 1]);
    const inRange = step(low, temperature).mul(step(temperature, high));
    const t = temperature.sub(low).div(high.sub(low));

    red.addAssign(
      mix(float(BLACKBODY_RED[index]), float(BLACKBODY_RED[index + 1]), t).mul(
        inRange
      )
    );
    green.addAssign(
      mix(
        float(BLACKBODY_GREEN[index]),
        float(BLACKBODY_GREEN[index + 1]),
        t
      ).mul(inRange)
    );
    blue.addAssign(
      mix(
        float(BLACKBODY_BLUE[index]),
        float(BLACKBODY_BLUE[index + 1]),
        t
      ).mul(inRange)
    );
  }

  return vec3(red, green, blue);
});

export const applyRadiusTint = Fn(
  ([baseColor, innerColor, outerColor, radiusRatio, tintStrength]) => {
    const tint = mix(
      innerColor,
      outerColor,
      clamp(radiusRatio, float(0), float(1))
    );
    const luminance = max(
      dot(baseColor, vec3(0.2126, 0.7152, 0.0722)),
      float(0.0001)
    );
    return mix(baseColor, tint.mul(luminance), tintStrength);
  }
);

export const createStarField = (uniforms) =>
  Fn(([rayDir]) => {
    const theta = atan(rayDir.z, rayDir.x);
    const phi = asin(clamp(rayDir.y, float(-1), float(1)));
    const gridScale = float(60).div(uniforms.starSize);
    const scaledCoord = vec2(theta, phi).mul(gridScale);
    const cell = floor(scaledCoord);
    const cellUv = fract(scaledCoord);
    const cellHash = hash21(cell);
    const starProbability = step(float(1).sub(uniforms.starDensity), cellHash);
    const starPosition = hash22(cell.add(42)).mul(0.8).add(0.1);
    const distanceToStar = length(cellUv.sub(starPosition));
    const baseSize = hash21(cell.add(100)).mul(0.03).add(0.01);
    const finalSize = baseSize.mul(uniforms.starSize);
    const core = smoothstep(finalSize, float(0), distanceToStar);
    const glow = smoothstep(finalSize.mul(3), float(0), distanceToStar).mul(
      0.3
    );
    const intensity = core.add(glow).mul(starProbability);
    const colorTemperature = hash21(cell.add(200));
    const starColor = mix(
      vec3(0.8, 0.9, 1),
      vec3(1, 0.95, 0.8),
      colorTemperature
    );

    return starColor.mul(intensity).mul(uniforms.starBrightness);
  });

export const createNebulaField = (uniforms) =>
  Fn(([rayDir]) => {
    const layer1Noise = fbm(
      rayDir.mul(uniforms.nebula1Scale),
      float(2),
      float(0.5)
    )
      .mul(2)
      .sub(1);
    const layer1 = clamp(
      layer1Noise.add(uniforms.nebula1Density),
      float(0),
      float(1)
    );
    const layer1Color = uniforms.nebula1Color
      .mul(layer1)
      .mul(uniforms.nebula1Brightness);

    const layer2Noise = fbm(
      rayDir.mul(uniforms.nebula2Scale),
      float(2),
      float(0.5)
    )
      .mul(2)
      .sub(1);
    const layer2 = clamp(
      layer2Noise.add(uniforms.nebula2Density),
      float(0),
      float(1)
    );
    const layer2Color = uniforms.nebula2Color
      .mul(layer2)
      .mul(uniforms.nebula2Brightness);

    return layer1Color.add(layer2Color);
  });

export const keplerianVelocity = Fn(
  ([radius, minimumRadius, angle, rotationSign]) => {
    const safeRadius = max(radius, minimumRadius.add(0.0001));
    const magnitude = float(1).div(
      sqrt(safeRadius.div(max(minimumRadius, float(0.01))))
    );
    return vec3(
      sin(angle).negate().mul(rotationSign).mul(magnitude),
      float(0),
      cos(angle).mul(rotationSign).mul(magnitude)
    );
  }
);
