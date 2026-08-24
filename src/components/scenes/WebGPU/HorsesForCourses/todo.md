# // HorsesForCourses

[Back to main TODO](../../../../../TODO.md)

# // Intent/Use Cases

Horse statue (oxidized bronze via TSL rust texture) physically sliced into N horizontal bands
using three-pinata. Bottom band anchored; upper bands offset by audio frequency energy —
like EQ visualizer bars. Dramatic directional/spot lighting.

# // Audio Sources

- **File upload** — any audio file the user provides
- **Mic** — getUserMedia (good for live performance / room audio)
- **System audio** — getDisplayMedia (captures Spotify, YouTube, etc. playing in Chrome). Chrome only. User shares a tab or "system audio" in the share dialog.

# // Presets

- Default
- Heavy Rust
- Polished Bronze

# // Features

- [ ] Add floor plane (polished marble / reflective surface beneath statue)

# // Bugs

- [ ] three-pinata slicing blocks main thread — consider Web Worker if bandCount is high
