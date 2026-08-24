# // QuinnsDice

# // TODO:

[Back to main TODO](../../../../../TODO.md)

# // Intent/Use Cases

- Provide a showcase for Quinn's 3d models, that can be demo'ed on low-powered and mobile devices during artist showcases at school or job interviews.
- Provide an interactive experience using physics and the mouse/touch pointer, as well as media pipe vision for hand control
- Provide an additional surprise interactive element when the user gestures by rolling a dice.
- Camera should have a default position focused on the center of gravity and the center of the collection of dice.
- Camera should have a second modality where it follows the die being rolled, and returns home after timeout elapses.
- Should be very, very performant due to point # 1.

# // Presets

- [x] Default
- [ ] High Performance - Simplified colliders
- [ ] Low Performance - Simplified colliders for mobile

# // Features

- [x] custom and trimesh colliders for each dice.
- [x] controls to roll a specific or random dice
- [x] fix dice materials on d8
- [x] hand controls and mode control.
- [x] Consider adding a mesh where the pointer is for more obvious interaction on startup.
- [x] Try to default the bounds of the room to the device viewport size/dimesions
- [ ] Add presets for use on high/low perf machines. Use simplified colliders for low perf machines

- [x] Add an 'Auto' pointer mode, where the glass ball continuously moves in a figure 8 crossing the center point

- [ ] Add a die roll overlay button like we did in DumpsterFire with clear trash

# // Interactivity

- [x] Die/Cursor interaction
- [x] Die/Cursor/Hands interaction
- [x] Die roll interaction
- [ ] Overlay button click die roll interaction

# // Bugs

- [x] Improve performance, too few fps right now, very slow.
- [ ] Can we improve perf by removing the hull colliders and adding the appropriate colliders for the given die geometry?
