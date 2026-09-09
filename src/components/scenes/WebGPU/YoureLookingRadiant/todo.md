# // You're Looking Radiant

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

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
- [ ] ensure particles only stay within the bounds of the screen, even bouncing off.

## // Presets

## // Features

## // Interactivity

## // Bugs
