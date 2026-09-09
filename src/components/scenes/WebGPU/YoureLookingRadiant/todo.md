# // You're Looking Radiant

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

- A flat 2D field where the light sources are the particles themselves. Each
  particle spends part of its life emitting and part of it occluding, so the
  same population that lights the field is what casts the shadows across it.
- Built on the same machinery as CrossTalk's radiance preset — a per-light 1D
  radial distance-field shadow map, promoted to `src/modules/radialShadow`
  when this scene became its second consumer (docs/scene-conventions.md §6).
  Despite CrossTalk's preset name, that mechanism is **not** radiance
  cascades.
- A particle's body is one **analytic arc**, concentric with the field centre:
  at a radius assigned once and never changed, with its own rate, direction
  and sweep — 3cKczD's ring loop. **Arc Span** scales every sweep and
  **Arc Spread** how far the outermost ring reaches; zero span is a plain disc.
  **Sweep Pulse** animates each ring's length on its own phase, which is the
  reference's `range = (sin(time + hash) * 0.45 + 0.55) * range` — at 1 an arc
  swings between a tenth of its length and all of it, at 0 it holds still.
  Above zero the scene switches to ring motion: curl drift, the border push and
  separation are all about particles wandering a field and none of them apply
  to a ring.
- Bodies never overlap: **Keep Apart** runs a few relaxation passes each frame
  pushing intersecting particles apart by half their overlap, using their
  actual radii.

### // Extended emitters are approximated, not solved

This mechanism has **no extended light source** — a light is a point, full
stop. 3cKczD's arcs look evenly lit because radiance cascades integrate
radiance over angle, so every point of an emitting surface contributes. Here
an emitting arc is approximated by **Arc Light Samples** point lights spread
along it, sharing its output. Below about ten per arc the beads are visible;
raising Shadow Rays does not help, because the artifact is the number of
sources, not the angular resolution of each one's shadow map.

Only emitting particles get light slots. Half the population is usually
occluding, and giving those a light costs a shadow-map row and a compose
iteration to contribute nothing.

### // How a particle is both roles at once

Every particle occupies one slot, used twice: as a light whose intensity is
how much it is emitting, and as an occluder whose radius is how much it is
not. Mid-transition it is genuinely both, and fixed slots mean nothing pops as
the roles cross over.

Two consequences worth knowing before changing anything here:

- A light sits inside its own occluder, so the shadow march **must** skip the
  marching light's own slot. Without that every ray terminates at `t = 0` and
  the entire frame reads as shadowed. That is why the module's
  `buildShadowMapMaterial` hands the row's light index to `marchFn`.
- An emitter and an occluder are the same shape, so the body albedo has to
  cross from the occluder tint to the particle's own light colour as it lights
  up. Without it every particle renders as the same dark disc whatever it is
  doing.

## // TODO:

- [ ] **A capsule emits from one end.** The shadow map is per-point-light, so
      a long particle's light comes from its head rather than along its
      length. Fine for short dashes, obvious on long ones. Would need either
      several lights per capsule or a line-light term in the compose.
- [ ] **Faint radial hairlines** around thin arc occluders, worst where an arc
      is far from the light. A thin occluder subtends a sub-texel angular
      range in the shadow map, so its shadow edge aliases into streaks. More
      Shadow Rays only helps marginally; Shadow Softness hides more of it. The
      real fix is an angular-extent-aware lookup rather than a point sample.
- [ ] **Arcs are all concentric with one centre.** That is 3cKczD's
      composition and it reads well, but it means a body's curvature is a
      function of where it sits rather than something it owns. Free-floating
      arcs with their own centres would be a small change to `writeScene` and
      worth trying.
- [ ] **Get trustworthy frame costs.** The headless harness times command
      encoding, not GPU work — the same scene measured 2.5ms and 29ms on two
      runs — so it is good for _looking_ at the scene and useless for timing
      it. Shadow Rays and Body Curve are the two knobs that matter; judge them
      against the live frame rate.
- [ ] **Measure the real ceiling on a GPU that is not this one.** `MAX_LIGHTS`
      is 32 and `MAX_SEGMENTS` 192; the presets sit at 10–22 lights and up to
      80 segments. Both SDF loops run to a live count rather than the array
      cap, so cost tracks what is actually on screen — but it is still
      (angle steps x lights x march steps x segments) for the shadow pass.
- [ ] **Shadows are hard-edged.** A 1D shadow map stores one occluder
      distance per angle, so a nearby occluder throws a crisp radial wedge
      where radiance cascades would integrate over the angular interval and
      soften it. Shadow Softness hides some of it. This is the honest
      trade for how cheap the mechanism is.
- [ ] **Separation uses centres, not arcs.** Two long arcs at the same radius
      can still cross. Fine at the spans the presets use; if it ever matters it
      wants arc-vs-arc separation, which is a different problem.
- [ ] **Glass balls.** Port https://www.shadertoy.com/view/t3GcWV — 2D glass
      refraction and reflection with Fresnel bounces and spectral dispersion.
      Out of scope for this mechanism: that shader is a progressive path
      tracer that converges only because its scene is static, and these rays
      are straight and terminate on first hit.

### // Rendering it without a browser

`utils/createPipeline.js` holds every target, uniform and material, with no
React in it, and the hook is thin glue over it. That split is load-bearing: the
headless harness renders through the same factory the scene does, so a wiring
mistake between the two — a node input that never arrives and generates `null`
in the WGSL — shows up in a still. Both times the harness built its own
materials instead, it rendered a correct picture of code the app was not
running.

`webgpu` (Dawn) is a dependency and `scripts/lib/gpuCapture.mjs` shows the
setup — browser-global stubs, a canvas stub, render to a RenderTarget,
`readRenderTargetPixelsAsync`. The scene's materials can be built and rendered
to a PNG in plain Node this way. Worth reaching for before guessing at a black
frame; every bug in this scene's first build was invisible from the code.

## // Presets

- [x] **Dark Neon** — near-black field, saturated emitters throwing coloured
      light, hard occluder silhouettes. The CrossTalk radiance look.
- [x] **Light Paper** — pale field with a high ambient floor, candy-pastel
      emitters, ink-blue occluders. Currently reads more like a lightbox than
      paper; the ambient floor and exposure want tuning against each other.
- [x] **Arcs** — thin concentric arcs sweeping 150 degrees, the 3cKczD
      composition. Emitting arcs glow along their whole length; occluding ones
      read as clean black curves cutting the field.

## // Features

- [x] Curl-noise advection with a soft inward push at the borders, so the
      swarm stays in frame without wrapping a body across the field.
- [x] Separation, so no two particles occupy the same space.
- [x] Analytic arc bodies (**Arc Span**), replacing a chain of capsules that
      followed each particle's path. Enough capsules looked smooth but none of
      them was, and short ones piled up and read as clutter rather than curves.
- [x] **Match Brightness.** Palette colours differ in linear luminance by up
      to 3.6x, so at one Light Output a violet emitter genuinely put out under
      a third of what a cyan one did — it read as "that colour isn't
      emissive". This scales each colour toward the palette's mean luminance
      so intensity means the same thing whatever the hue.
- [x] Colour assignment is round-robin, not random. With a dozen particles
      split four ways a random draw regularly left a colour with two members,
      and if both were mid-cycle that colour vanished from the frame.
- [x] **Arc Light Samples** — how many point lights approximate an emitting
      arc. 4 reads as beads on a string, 10+ as an even line.
- [x] **Shadow Rays** exposes the shadow map's angular resolution — the
      dominant cost knob, since the march runs once per column per light. 256
      looked indistinguishable from 1024 in headless stills of the Snakes
      preset.
- [x] Three emit/occlude modalities in `utils/roleModes.js`, a keyed registry
      so a fourth is one entry plus its controls: - **Age & Respawn** — born emitting, fades to opaque, dies, respawns. - **Slow Oscillation** — per-particle phase and period, cycling forever. - **Travelling Wave** — a front sweeps the field flipping particles,
      alternating polarity on each pass so it never needs a reset.
- [ ] Sweep Pulse is one global rate with per-ring phase, as in the reference.
      Per-ring _rates_ would keep the field from settling into a visible common
      beat over a long sit.
- [ ] More modalities: proximity (particles darken when crowded), audio, and a
      "contagion" mode where occluding spreads to neighbours. A travelling
      wave was tried and removed — it flips every particle to emitting and
      then every particle to occluding, which is the opposite of the premise
      that some emit while others occlude.

## // Interactivity

- [x] The pointer is an attractor with its own strength and reach; negative
      strength repels.
- [ ] Click to drop a persistent light.

## // Bugs

- [x] The scene opened on Light Paper whatever the default preset said.
      `usePresetsFolder` only calls `setControls` on a dropdown change or a
      reset, never on mount — so whatever seeds the Leva schema _is_ what the
      scene opens with, and seeding it from a plain merge of every preset means
      opening on whichever is declared last. The default preset is applied last
      over the merge now.
- [x] Arcs expanded and contracted as they drifted, because a body's radius was
      derived from how far the particle had wandered from the centre. The
      reference does not do that: rings sit at fixed radii and turn. Radius is
      assigned once per particle now and arc mode drives angle only.
- [x] Respawned particles popped in at full size while dying ones faded out.
      `init` gave a respawn a _random_ remaining life, so it usually reappeared
      already past its fade-in. Role modes now distinguish `init` (stagger the
      first fill) from `spawn` (start a full life).

- [x] `renderPipeline_MeshBasicNodeMaterial: unresolved value 'null'` in the
      compose pass. `maxLights` never reached `buildComposeMaterial`, and a
      missing node input does not throw — it lands in the generated WGSL as the
      literal `null`. `buildComposeMaterial` now checks its inputs at
      construction, where the error can name the missing one.
- [x] Everything read as shadowed, with only the bodies' own glow surviving.
      The shadow march excluded the _light row index_ rather than the body that
      light belongs to, so every light sat inside its own arc and hit it at
      t = 0. `lightOwner` maps a row back to its body.

- [x] Emitting arcs read as four glowing beads rather than an even line. The
      arc was approximated by four point lights; it needs ten or more. Raising
      Shadow Rays looked like it should help and did not — wrong axis.
- [x] Every shadow-map row without a light was still paying for a full march:
      the material used `select`, which evaluates both branches. Now guarded
      with `If`. CrossTalk gets the same saving.

- [x] Emitting particles read as flat saturated discs pasted on top of their
      own glow rather than the middle of it. They had a separate emissive term
      added after the albedo multiply. Now an emitter's albedo is the field
      colour and its brightness goes into the same accumulator its halo comes
      from, multiplied by the same albedo — which is how CrossTalk's lights
      blend, and why they looked better.
- [x] Backgrounds read as black rather than CrossTalk's lit grey. Field Colour
      goes through sRGB to linear, so a hex that _looks_ mid-grey lands near
      0.04. CrossTalk shades against a literal 0.4, which is about `#b0b0b0`
      written as sRGB; the presets now sit near there.

- [x] Particles appeared to change colour as a gradient growing from their
      centre. The light's source disc was scaled by emission, so a
      half-emitting particle painted its light colour over only its inner
      half. The disc now covers the whole body and emission drives intensity
      alone, so the crossfade is uniform across the body.

```
#define RESOLUTION  iResolution
#define TIME        iTime
#define MAX_MARCHES 30
#define TOLERANCE   0.0001
#define ROT(a)      mat2(cos(a), sin(a), -sin(a), cos(a))
#define PI          3.141592654
#define TAU         (2.0*PI)

const mat2 rot0 = ROT(0.0);
mat2 g_rot0 = rot0;
mat2 g_rot1 = rot0;


float sRGB(float t) { return mix(1.055*pow(t, 1./2.4) - 0.055, 12.92*t, step(t, 0.0031308)); }

vec3 sRGB(in vec3 c) { return vec3 (sRGB(c.x), sRGB(c.y), sRGB(c.z)); }


const vec4 hsv2rgb_K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + hsv2rgb_K.xyz) * 6.0 - hsv2rgb_K.www);
  return c.z * mix(hsv2rgb_K.xxx, clamp(p - hsv2rgb_K.xxx, 0.0, 1.0), c.y);
}

float apolloian(vec3 p, float s, out float h) {
  float scale = 1.0;
  for(int i=0; i < 5; ++i) {
    p = -1.0 + 2.0*fract(0.5*p+0.5);
    float r2 = dot(p,p);
    float k  = s/r2;
    p       *= k;
    scale   *= k;
  }

  vec3 ap = abs(p/scale);
  float d = length(ap.xy);
  d = min(d, ap.z);

  float hh = 0.0;
  if (d == ap.z){
    hh += 0.5;
  }
  h = hh;
  return d;
}

float df(vec2 p, out float h) {
  const float fz = 1.0-0.0;
  float z = 1.55*fz;
  p /= z;
  vec3 p3 = vec3(p,0.1);
  p3.xz*=g_rot0;
  p3.yz*=g_rot1;
  float d = apolloian(p3, 1.0/fz, h);
  d *= z;
  return d;
}

float shadow(vec2 lp, vec2 ld, float mint, float maxt) {
  const float ds = 1.0-0.4;
  float t = mint;
  float nd = 1E6;
  float h;
  const float soff = 0.05;
  const float smul = 1.5;
  for (int i=0; i < MAX_MARCHES; ++i) {
    vec2 p = lp + ld*t;
    float d = df(p, h);
    if (d < TOLERANCE || t >= maxt) {
      float sd = 1.0-exp(-smul*max(t/maxt-soff, 0.0));
      return t >= maxt ? mix(sd, 1.0, smoothstep(0.0, 0.025, nd)) : sd;
    }
    nd = min(nd, d);
    t += ds*d;
  }
  float sd = 1.0-exp(-smul*max(t/maxt-soff, 0.0));
  return sd;
}

vec3 effect(vec2 p, vec2 q) {
  float aa = 2.0/RESOLUTION.y;
  float a = 0.1*TIME;
  g_rot0 = ROT(0.5*a);
  g_rot1 = ROT(sqrt(0.5)*a);

  vec2  lightPos  = vec2(0.0, 1.0);
  lightPos        *= (g_rot1);
  vec2  lightDiff = lightPos - p;
  float lightD2   = dot(lightDiff,lightDiff);
  float lightLen  = sqrt(lightD2);
  vec2  lightDir  = lightDiff / lightLen;
  vec3  lightPos3 = vec3(lightPos, 0.0);
  vec3  p3        = vec3(p, -1.0);
  float lightLen3 = distance(lightPos3, p3);
  vec3  lightDir3 = normalize(lightPos3-p3);
  vec3  n3        = vec3(0.0, 0.0, 1.0);
  float diff      = max(dot(lightDir3, n3), 0.0);

  float h;
  float d   = df(p, h);
  float ss  = shadow(p,lightDir, 0.005, lightLen);
  vec3 bcol = hsv2rgb(vec3(fract(h-0.2*length(p)+0.25*TIME), 0.666, 1.0));

  vec3 col = vec3(0.0);
  col += mix(0., 1.0, diff)*0.5*mix(0.1, 1.0, ss)/(lightLen3*lightLen3);
  col += exp(-300.0*abs(d))*sqrt(bcol);
  col += exp(-40.0*max(lightLen-0.02, 0.0));

  return col;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 q = fragCoord/RESOLUTION.xy;
  vec2 p = -1. + 2. * q;
  p.x *= RESOLUTION.x/RESOLUTION.y;

  vec3 col = effect(p, q);
  col *= mix(0.0, 1.0, smoothstep(0.0, 4.0, TIME));
  col = sRGB(col);

  fragColor = vec4(col, 1.0);
}

```
