# // Burning At Both Ends

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

# // Intent/Use Cases

- A tall cylinder candle floating in the void, lit at both ends.
- Slight tilt (~15°) for visual interest.
- Flame shader adapted from example.js — duplicated at top and bottom of candle.
- Flickering point lights at each flame for dynamic illumination.

# // Features

- [x] Scene scaffold: BurningAtBothEnds.jsx with Leva controls hook
- [x] Candle body: tall cylinder geometry (wax material)
- [x] Flame shader: animated vertex/fragment from example, rendered front+back
- [x] Dual flames: top and bottom (bottom flame inverted)
- [x] Candlewick at each end
- [x] Flickering point lights at each flame
- [ ] Should we use CSG to give the ends of the candle a melted look?
- [ ] Should we use a metaballs shader to make dripping wax?
- [ ] Post-processing bloom pass for flame glow

# // Bugs
