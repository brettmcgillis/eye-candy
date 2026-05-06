# // Burning At Both Ends

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

# // Intent/Use Cases

- A tall cylinder candle floating in the void, lit at both ends.
- Slight tilt (~15°) for visual interest.
- Flame shader adapted from example.js — duplicated at top and bottom of candle.
- Flickering point lights at each flame for dynamic illumination.
- Intent is to strike a balance between realism and surrealism. The candle, wick and flame should try to get to as real as we can. the inverted candle should be surrel, in that it is like a mirror image of the top candle; there is still a crater at the wick and excess wax flows up the candle stick in symmetry to the wax flowing down.
- Candle is symmetrical in the same manner as the suicide king in a deck of cards

# // Presets

- [x] Enlightened - Lit candle, volumetric flame
- [x] Extinguished - Unlit candle, smoke rising

# // Features

- [x] Scene scaffold: BurningAtBothEnds.jsx with Leva controls hook
- [x] Candle body: tall cylinder geometry (wax material)
- [x] Flame shader: animated vertex/fragment from example, rendered front+back
- [x] Dual flames: top and bottom (bottom flame inverted)
- [x] Candlewick at each end
- [x] Flickering point lights at each flame
- [x] Use CSG to give the ends of the candle a melted look (mirrored top and bottom craters)
- [x] Add extra wax buildup rims near each crater, preserving top/bottom surreal symmetry
- [x] Post-processing bloom pass for flame glow
- [x] Should be able to scale the flame like we do with candle.
- [x] Add a mode for candle off. show candle smoke instead of flame.
- [x] Wick should support hot (current ember) and cold mode (all black, with some grey char) to better suport candle off mode.
- [x] When lit mode changes we should lerp the flame down to nothing then lerp the smoke up to it's size.
- [x] Move flame and smoke materials to components/materials folder as reusable materials.
- [x] Rename CandleSmoke to 2DSmoke
- [x] Move 2DSmoke, flame to components/elements as generic reusable compoents.
- [x] Replace the scenes current VolumetricSmoke with our reusable VolumetricSmokeParticles

- [ ] Tune Smoke + fire
- [ ] Design and add scene controls
- [ ] Should we use a metaballs shader to make dripping wax droplets?

# // Bugs

- [x] default camera position is farther back and higher up, looking toward candle center
- [x] shorten wicks and relax curve; add subtle frayed fibers near the tip
- [x] move flame further down toward the wick
- [x] soften sharp points on melt crater and wax buildup
- [x] blinking point light moved inside flame volume near wick (no visible hovering source)
- [x] Cleanup controls, all the candle,wax,drip,flame, smoke, related controls should be in the candle folder. update folder names with proper labels, update control names with concise labels. Make sure controls are nested properly
  - Burning at both ends
    - Scene
      - BG
      - Amblient light intensity
      - post processing
    - Candle
      - Lit
      - Height
      - Radius
      - Tilt
      - Flame
        - Type
        - shader flame controls
        - volume flame controls
      - Smoke
        - Type
        - color
        - 2d smoke controls
        - volume smoke controls
      - Wick
        - Hot
      - Wax
        - current wax controls
- [x] Update the hook for useCandleControls. Should it just return a leva folder, so it can be composed within the scene folder?
- [x] The drip metaballs are getting clipped if they go too far off the face of the cylinder.

- [x] improve default smoke appearance, 3.0 height. its also 2d so can we make it always face camera?
- [x] can we use a volumetric flame and animated spline(s) to make a second smoke type?
- [x] fix bottom wick smoke, going in wrong dir

- [ ] Default camera position needs to be back far enough, and up high enough to see the reflection on the floor plane
- [ ] Fix metaballs. wax buildup and drips have hard edges where they meet due to being discrete collections.
- [ ] Fix wax melt to candle connection and see if we can fix hard edges.
