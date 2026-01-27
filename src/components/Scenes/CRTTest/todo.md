**Completed Tasks**

- [x] remove telemetry
- [x] create a new shader material for an always-on static, no smtpe bars, just black and white static. perhaps by layering noise.
- [x] create a new shader material to resemble old vhs player static: All blue screen with rolling scanlines of static. Potentially include the date in a retro white font in the top corner.
- [x] create a new shader material that combines the webcam output with some glitching and static effects
- [x] create a new shader material that combines a gif with some glitching and static effects
- [x] update my existing crt static material with defaults that resemble my existing scene.
- [x] Refactor my crt television to expose a variation prop. Uses channel key.
- [x] Add channelSurf prop, auto rotate channels
- [x] Use dial instances to provide 4th dial, emissive white, channelSurf indicator.
- [x] Wire up dial, knob sounds
- [x] Add a Strudel thing. added hook, and test panel to app.
- [x] Fix knob rotation during channel surf
- [x] Rename CRTStaticMaterial -> CRTSmtpeStaticMaterial
- [x] Rename CRTSnowMaterial -> CRTStaticMaterial
- [x] Move Materials
- [x] Move TV components

**CRT Shaders**

- [ ] Test CRT Shader settings.
- [ ] Fix vignette in CRTSmtpeStaticMaterial, CRTStaticMaterial
- [ ] Add default background to CRTShowMaterial when webcam disabled. R&S fallback sucsk
- [ ] Fix camera bug on Scene material. Could the test scene take a ref that is used by the render tex?
- [ ] Fix invalid op on CRTSceneInSceneMaterial. see console. Could we possible just paint the previous webcam frame?
- [ ] Combine materials to cohesive set of props
- [ ] Update default input props based on final scene
- [ ] Can we preload (suspense) fonts? to prevent VHS looking shit on first render?
- [ ] SideQuest - Could we put strudel visuals on a shader and pair that w/ strudel audio?

**TV**

- [ ] Need disabled prop(s) to disallow knob/dial interactions. powerDisabled, knobsDisabled, dialsDisabled
- [x] Fix dial click handling
- [ ] Fix dial z-depth issue on clicks. should be quick in out, probably not setTimeout based
- [ ] Wire up settings scan on knob2

**Audio**

- [x] MP3 & Strudel Audio not working? Strudel works if we click at the right time during very early during first render. Fixed, Make sure to use appropriate file paths to assets
- [ ] Fix strudel/mp3 play on first render. Cant due to gesture requirement from chrome, so maybe info modal onclose can hit play? Or tv default off & press play button?
- [ ] fix multple audio playing on 1 tv.
- [ ] Nice to have: support multiple audio on 2 tvs
- [ ] Wire up sounds for all channels
- [ ] Fix audio drop out when switching mp3s
- [ ] Can we preload (suspense) all the required audio assets?
- [ ] Wire up positional audio?

**Other**

- [ ] Click to add decals?
- [ ] Update Test Panels to use InteractiveReversal to push materials into a collection, Pop when all are used, so we can demo each one & the collection w/ TV off.
- [ ] Test Mobile - Webcam Only works HTTPS. Strudel only works w/ silent off?
- [ ] Add helper modal. use HTML to get a billboard. useState for visibility. include dial & knob instructions. include audio instructions. include mobile details, include toggle for tv sound on. Power on tv on dismiss.

**Final Steps**

- [ ] 'Making Of' reel + side quest reels.
- [ ] Reel of page running channel surf.
- [ ] Push to ghpages
- [ ] Post Reel w/ link
- [ ] Share Reel Post in stories
- [ ] Update link in bio
