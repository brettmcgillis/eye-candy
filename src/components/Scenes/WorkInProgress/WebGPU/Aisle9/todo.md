# // Aisle 9

# // Intent / Use Cases

- This scene includes a raymarched blackhole in the center of a convenience store, with several store items orbiting it.
- The scene contains several camera positions that could be used to tell the story of a convenience store clerk who notices an anomaly in the middle of a shift.
- The scene contains several fixed security cam views of the scene, with post processing overlay to resemble cctv
- The scene contains a close up orbit view of the black hole so users can focus in on it,
- The scene contains a camera spline path that allows the user to feel like they are walking through the store.

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

- prevent interior orbit cam from going outside.
- build a cohesive experience. should we use overlay buttons for for enter/exit store, check the cameras? imEnter, imExit, PiSecurityCameraDuotone,
  - what should it be? I think we want the flow to be: start outside night, then enter store, loop store, check cams, black hole starts, loop the store, check out the anomaly, back to cams, black hole disappears, exit store, outside day time.
  - should we somehow force or guide this flow?
  - should the user just get to switch between the camera options, outside, inside orbit, inside loop, security cams, and then the black hole randomly spawns in/out?
  - how do we handle the transition from inside to outside? should we put the inside of the store below the ground of the outside to enable quick switching? do we need some transition animation?

- set default blackhole to a lighter less intensive variation: legacy port, ribbon variation, 16 rings, pulse speed 0.02, disk brightnes 1.67

# // Presets

- [x] Store
- [x] Guided Tour
- [x] Surveillance 1
- [x] Surveillance 2
- [x] Surveillance 3
- [x] Parking lot
- [x] Parking lot cam
- [x] Back Alley
- [x] Stock room

# // Features

# // Bugs

# // Presets for shots

This list may not be correct or complete.

- [x] Exterior Day - Operator Cam → Exterior - Day
- [x] Exterior Night - Operator Cam → Exterior - Night

- [x] Cam 1 - Day → Cam 1 - Day
- [x] Cam 1 - Night - No BH → Cam 1 - Night
- [x] Cam 1 - Night - BH → Cam 1 - BH
- [x] Cam 1 - Night - Med BH → Cam 1 - Med BH
- [x] Cam 1 - Night - LG BH → Cam 1 - LG BH

- [x] Cam 2 - Day → Cam 2 - Day
- [x] Cam 2 - Night - No BH → Cam 2 - Night
- [x] Cam 2 - Night - BH → Cam 2 - BH
- [x] Cam 2 - Night - Med BH → Cam 2 - Med BH
- [x] Cam 2 - Night - LG BH → Cam 2 - LG BH

- [x] Cam 3 - Day → Cam 3 - Day
- [x] Cam 3 - Night - No BH → Cam 3 - Night
- [x] Cam 3 - Night - BH → Cam 3 - BH
- [x] Cam 3 - Night - Med BH → Cam 3 - Med BH
- [x] Cam 3 - Night - LG BH → Cam 3 - LG BH

- [x] Guided Tour - Day → Guided Tour - Day (orientationMode: forward, dawn sky)
- [x] Guided Tour - Night - No BH → Guided Tour - Night - No BH (orientationMode: forward)
- [x] Guided Tour - Night - BH → Guided Tour - BH (orientationMode: target)

- [x] Parking lot cam - Day → Parking Lot Cam - Day
- [x] Parking lot cam - Night → Parking Lot Cam (existing)

- [x] Back Alley - Day → Back Alley - Day
- [x] Back Alley - Night → Back Alley (existing)

- [x] Interior Day - Operator Cam → Interior - Day
- [x] Interior Night - Operator Cam → Interior - Night
- [x] Interior Night - Orbit Cam → Store - BH - Lensing / Store - BH - CA

# // Shots

// Get to work

- [ ] Exterior store front
- [ ] Exterior building side
- [ ] Exterior street lights
- [ ] Exterior operator lead into store

// Things seem fine

- [ ] Cam1 - no bh
- [ ] Cam2 - no bh
- [ ] Cam3 - no bh
- [ ] Parking Lot Cam
- [ ] Stock room
- [ ] Back Alley
- [ ] Guided tour - no bh - camera forward

// BH always shows up around 2-3am
// Consider using different variations of bh within each of these sections

- [ ] Cam1 - bh - standard size
- [ ] Cam2 - bh - standard size
- [ ] Cam3 - bh - standard size
- [ ] Guided tour - bh - standard size - camera lookAt bh
- [ ] Store - bh - standard size - examine lensing
- [ ] Store - bh - standard size - CA enabled

// things get intense

- [ ] Cam1 - bh - med size - more bodies
- [ ] Cam2 - bh - med size - more bodies
- [ ] Cam3 - bh - med size - more bodies
- [ ] Store - operator - bh - med size - more bodies - CA enabled

// I worry the store will be consumed

- [ ] Cam1 - bh - large size - most bodies
- [ ] Cam2 - bh - large size - most bodies
- [ ] Cam3 - bh - large size - most bodies
- [ ] Store - operator - bh - large size - most bodies - CA enabled

// but things are always fine by dawn

- [ ] Exterior store front - day time
- [ ] Cam1 - no bh - day time
- [ ] Cam2 - no bh - day time
- [ ] Cam3 - no bh - day time
- [ ] Guided tour - day time
- [ ] Parking Lot Cam - day time
- [ ] Stock room - day time
- [ ] Back Alley - day time

# // Video Narrative

Aisle 9

“Looking for a black hole to casually collapse though? Try aisle 9 by the cat food” - Aesop Rock, Cat Food

Hey guys sorry I haven’t been posting much lately, been pretty busy. I had to pick up a second job down at the Aisle 9 working overnighters make ends meet.

It’s not great but at least it’s quiet.

It was going pretty smoothly until a few weeks ago. I got there a bit after midnight, made my usual rounds and that’s when I noticed it on the security cameras.

It always shows up between 3 and 4.

It looks different every time.

I took a closer look once but it almost pulled me in. Now I keep a safe distance.

Sometimes I wonder if it will swallow the whole store…

But then it’s always gone by morning.
