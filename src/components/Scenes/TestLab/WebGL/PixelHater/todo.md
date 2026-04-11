# // PixelHater

# // Intent/Use Cases

- I need a shader or component that will allow me to selectively pixelate sections of a secen for artisitc intent. Example: I have a scene with a smooth gradient in it, and I want to add a glass plane to the scene that will pixelate the gradient when looking through the glass, leavig me with solid colored squares where the plane obstructs the gradient.
- I want to be able to put this on any geometry. Example, I have a box that is pixelated. as other shapes enter the box they become pixelated. Shapes outside the box are not pixelated. Shapes in front of the box do not have their color reflected in the pixelation. Shapes behind the box do have their color reflected in the pixelation.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [ ] See if we can improve shader to prevent pixel colors including unmasked object colors. Currently the pixelation effect includes pink pixels despite the sphere being infront of the pixelation plane, and the plane being much farther behind the sphere.
- [ ] See if we can use this article to improve what we have OR offer a second version of the effect. https://x.com/TheMirzaBeig/status/2023429023544598709
      (Transposed below)

CENSOR - Screen-Space Quantization and Refraction
SSQR for Non-Degenerate Rendering and μ-Rasterization via Per-Pixel, GPU-Accelerated Parallel Processing in a Scriptable Pipeline (Unity, URP).
Are you pro-censorship? We are.
With CENSOR (Professional Edition), _you_ can be, too.
⚠️ \*\* See it in action!
Mirza Beig
@TheMirzaBeig
·
Feb 14
Censorship cube (pixelated blur).

^ WARNING: Somewhat censored/pixelated/blurred content.
Abstract: We present CENSOR, a real-time screen-space image manipulation shader for the Unity Universal Render Pipeline (URP) that performs deterministic spatial quantization of background imagery combined with normal-driven refractive distortion. The technique operates entirely per-pixel on the GPU, sampling scene colour behind arbitrary mesh surfaces, applying block-based quantization in screen space, and offsetting lookup coordinates via view-dependent surface normals to simulate transparent refractive media.

CENSOR, applied to a complex mesh with many curved surfaces.
Unlike traditional blur-based obfuscation, CENSOR preserves structural coherence through discrete sampling regions, producing a stable, non-stochastic pixelation effect that avoids temporal instability and degenerate raster artifacts (along with prevention of viewing certain organized data).
A subtle, lit (albedo) fresnel effect is derived from the function defined by the dot product between each mesh vertex normals and the vector pointing from that mesh vertex (or fragment) to the camera position.
Mirza Beig
@TheMirzaBeig
·
Jul 9, 2025
from Pixar's paper on Soul (2020).

I usually call this one,

> "fresnel with clipping."
> Quote
> Mirza Beig
> @TheMirzaBeig
> ·
> Jul 9, 2025
> animated light particles -> realtime volumetrics
> Unity URP 🔴🟢🔵 x.com/TheMirzaBeig/s…
> 💡 Ideally, this would be applied as mix to the emission with scene and lighting attenuation, but as it turns out, most people couldn't care less or notice.
> The refraction model augments this quantized field by introducing controlled distortion proportional to surface orientation, creating the perceptual impression of glass-like transmission while maintaining censorship integrity.
> A partially degenerate render, with a quad-mesh overlay.
> We swap out traditional quantization forumulas, which provides scaling from the vertical and horizontal average of the two-dimensional image resolution, rather than from an edge-and-corner origin as the reference.
> Code is provided below:
> glsl
> // We first derive the screen-space UV coordinates.

float2 uv = pixelCoordinatesXY / screenResolutionXY;

// Resolution is the number of quantization steps.
// This incurs no penalty, as it is analytically solved.

uint resolution = 32;
vec2 uv_quantized;

// Classical formula.
// Casual use of the 'floor' function.

uv_quantized = floor(uv \* resolution ) / resolution ;

// Improved, A1+ professional formula.
// Notice the apt use of the 'round' function.

uv_quantized = round(uv \* resolution ) / resolution ;

// Our quantized UVs can be used to sample an image/texture.

vec3 textureRGB = tex2D(\_CameraOpaqueTexture, uv_quantized);
⚠️ Note: it may be necessary to have a 2D dimensional quantization resolution vector, to allow for aspect ratio adjustments to the steps across the horizontal axis of sampling. The horizontal data resolution over the vertical resolution of the input texture image provides the aspect ratio, which can be used to modulate the horizontal axis of quantization (as unit-resolution), thus maintaining isotropic rendering for each cell -- an aesthetic correction.
glsl

// Aspect ratio correction (optional).
// -- improved + more accurate, screen-space cell discretization.

// Having a 2D resolution vector is acceptibibble:
// -- We later interact with a 2D normalized UV vector, regardless.

vec2 resolution2D = vec2(resolution, resolution);

float aspectRatio = textureWidth / textureHeight.
resolution2D.x \*= aspectRatio;
The method requires no geometry subdivision, no additional render passes beyond scene colour access, and integrates cleanly within URP’s rendering architecture. All operations are executed in parallel per fragment, ensuring scalability across modern GPU hardware, sufficiently lightweight for mobile.
Does it look expensive to render? Good.
We want a QUALITY censorship material.
We used our technique for engine-integrated scattering texture simulation, from our prior work in volumetric rendering and fast procedural optics. Fragment data is mathematically averaged against neighbouring pixels in a weighted recursion system for kernel-based radial intensity interpolation.
...View-space refraction of an offscreen Gaussian blur texture:
CENSOR enables developers to:

- Enforce visual obfuscation through deterministic spatial quantization.
- Simulate transmissive glass without revealing underlying detail.
- Maintain real-time performance under dynamic lighting and camera motion.
- Apply censorship selectively to (and via-) arbitrary mesh volumes.
  You can understand how these types of shaders work, below:
  Mirza Beig
  @TheMirzaBeig
  ·
  Jan 28
  I made a 'perfect' glass shader for Unity.
  ✅ +a full, written tutorial about it!

It's for absolute beginners. 🧊
w/ Lots of pretty videos and pictures.

#unity3d #gamedev #glsl
0:01 / 0:48
Quote
Mirza Beig
@TheMirzaBeig
·
Jan 28
Glass Shader Tutorial for Unity
Overview
We'll be making a basic, lit glass shader in Unity 6.2, URP.

👆 That _exact_ one. It is literally a recording of what we finish with.
Naturally, we'll want to have whatever we end up with...
"We" have made the algorithm public domain for the benefit of all:
An image (...screenshot) of "our screen-space quantization and refraction GPU function graph." We achieve correct view sorting of transparent mesh rendering via forced depth buffer writes. For Unity (URP); the instruction set + logic is engine-agnostic.
Samples may be found bundled with the complimentary CD-ROM and archival 3.5" high-density floppy disk affixed to the interior rear sleeve of GPU Guards (1989, 65th Anniversary Commemorative Retroactive Pre-Release Edition).

# // Features

# // Bugs
