# // Thats All Folks!

# // Intent / Use Cases

- This should be a small, but fully formed composition with no presets.
- The scene features our 44 magnum model, standing with it's butt on the ground, smoke flowing from the barrel.
- The scene includes a spline/attractor/particle system to manage the flowing smoke.
- The spline in the composition spells out "Thats All Folks!" in cursive
- The scene has a compelling, mostly fixed camera position showing off the smoke moreso than the gun.
- The scene will include some compelling post processing that works well with the smoke and possibly the chrome of the gun.
- The scene includes nice shadows from the lighting, casting the shadow of the gun and the smoke on the floor of the sceen

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- [x] Build 'Thats all folks cursive' writing spline(s) based on the text in the jpg.
- [ ] Build the spline/attractor/particle system(s) to flow the smoke. Smoke test is not fully complete yet though.
- [ ] Make the splines 3d
- [ ] Finalize particle settings for each spline.
- [ ] Finalize physics setting for composition
- [ ] fix gun/smoke positioning. currently clipping floor plane cuasing shadow to intersect model
- [ ] fix smoke shadows?
- [ ] fix background/background color
- [ ] Starts to look pretty good with a shitload of particles. Might need to scale up the smoke and space the words out a bit more.
- [ ] Fix particle system init. they seem to start distributed around the spline, need to get spawned in from start pos. Might be fixed if we reuse SmokeTest components

- [ ] Tune up the smoke

# // Features

- [ ] Cursor/smoke interaction.

# // Bugs

- [ ] Scene is creating its own spline line and smoke. We should reuse the results of the smoketest lab, by breaking it down into reusable components in components/elements

- [x] Scene locks when adjusting particle counts
- [ ] Smoke is currently broken/not visible.
