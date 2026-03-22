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

# // Features

- [x] Scene scaffold: BurningAtBothEnds.jsx with Leva controls hook
- [x] Candle body: tall cylinder geometry (wax material)
- [x] Flame shader: animated vertex/fragment from example, rendered front+back
- [x] Dual flames: top and bottom (bottom flame inverted)
- [x] Candlewick at each end
- [x] Flickering point lights at each flame
- [x] Use CSG to give the ends of the candle a melted look (mirrored top and bottom craters)
- [x] Add extra wax buildup rims near each crater, preserving top/bottom surreal symmetry
- [ ] Should we use a metaballs shader to make dripping wax?
- [x] Post-processing bloom pass for flame glow
- [ ] Should be able to scale the flame like we do with candle.
- [ ] Animate candle shrinking over time. flame shrinking once candle is at min.

# // Bugs

- [x] default camera position is farther back and higher up, looking toward candle center
- [x] shorten wicks and relax curve; add subtle frayed fibers near the tip
- [x] move flame further down toward the wick
- [x] soften sharp points on melt crater and wax buildup
- [x] blinking point light moved inside flame volume near wick (no visible hovering source)
