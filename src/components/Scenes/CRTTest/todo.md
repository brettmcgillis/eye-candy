- [x] remove telemetry
- [x] create a new shader material for an always-on static, no smtpe bars, just black and white static. perhaps by layering noise.
- [x] create a new shader material to resemble old vhs player static: All blue screen with rolling scanlines of static. Potentially include the date in a retro white font in the top corner.
- [x] create a new shader material that combines the webcam output with some glitching and static effects
- [x] create a new shader material that combines a gif with some glitching and static effects
- [x] update my existing crt static material with defaults that resemble my existing scene.
- [ ] Refactor my crt television to expose a variation prop. with the following options.
      off -> default model material.
      white glow -> a bright white emissive material.
      smtpe static -> our existing crt static material.
      vhs -> our new vhs shader material,
      static -> our always on static shader.
      video -> the glitchy webcam shader.
- [ ] Fix vignette in CRTStaticMaterial, CRTSnowMat
- [ ] Rename CRTStaticMaterial -> SmtpeStaticMaterial
- [ ] Rename CRTSnowMaterial -> CRTStaticMaterial
- [ ] Add channelSurf prop, auto rotate channels
- [ ] Test Mobile
- [ ] Wire up sounds
- [ ] Fix camera bug - Scene material. Could the test scene take a ref that is used by the render tex?
- [ ] Use dial instances to provide 4th dial, emissive white, channelSurf indicator.
