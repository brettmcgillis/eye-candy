import * as THREE from 'three/webgpu';

export const COOKIE_URL = '/textures/circle_c_noise.png';

// The source PNG carries its mask in the **alpha** channel — its RGB is a hard
// white disc with a hard edge. Three multiplies a spot light's map by its RGB
// and ignores alpha (`SpotLightNode`: `lightColor.mul(projected)`), so handing
// it over untouched would project that hard disc and throw away every bit of
// the softness it was drawn for.
//
// So alpha is baked down into luminance here, and the result is opaque. Both
// consumers then read the same thing: three samples RGB for the light, and the
// volumetric samples .r for the beam in the air.
export default function bakeCookie(source, { gain = 1, lift = 0 } = {}) {
  const image = source?.image;
  if (!image?.width) return null;

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);

  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = frame;

  // Normalised against the mask's own peak rather than 255: the source only
  // reaches about two thirds, and scaling by a constant would quietly dim the
  // whole beam whenever the texture was replaced with a different one.
  let peak = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > peak) peak = data[i];
  }
  const scale = peak > 0 ? 255 / peak : 1;

  for (let i = 0; i < data.length; i += 4) {
    const masked = Math.min(255, data[i + 3] * scale * gain);
    const value = lift * 255 + (1 - lift) * masked;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }
  ctx.putImageData(frame, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  // A mask, not a colour: sRGB decoding here would bend the falloff.
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
