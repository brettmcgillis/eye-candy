# Surrender

# // Intent / Use Cases

- The scene contains a flag pole with a single flag on it
- The scene uses a cloth simulation on the flag
- The scene includes wind gently blowing the flag
- The scene includes an interactive aspect. The scene includes an invisible sphere where the user's cursor is, at the same z-index as the flag cloth, allowing the user to interact with the wind-blown flag.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [x] Finalize camera angle, position. Toggle orbit on off, off by default
- [ ] Finalize bg color, lighting.
- [ ] Organize scene controls
- [ ] Improve cursor interaction, feels a little unpredictable

# // Presets

- [ ] Surrender - White flag
- [ ] Surrender Now - Black flag, turbo flex

# // Features

- [x] Wind blown flag.
- [x] Cursor-flag interaction.
- [x] Add cloth params for things like edge tatters, holes.
- [x] Cloth should be able to display a texture.
- [ ] Maybe add mode for "cutting" the wireframe of the cloth

# // Bugs

- [x] try to prevent the cloth from crashing.
- [x] rotating flag pole does not effect flag cloth appropriately, we got that wrong.
