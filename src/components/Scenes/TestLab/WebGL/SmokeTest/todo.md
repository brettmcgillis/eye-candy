# // SmokeTest

# // TODO:

[Back to main TODO](../../../../../../TODO.md)

# // Intent/UseCases

- I want to build a few scenes that contain flowing smoke. The work we did in ParticleLab makes me think that we could build amazing flowing smoke using a main spline, or splines, for particles to follow with small attractors located along the way to draw the smoke into compelling visual patterns.
- Once the scene is complete and working we will move the scene to toolbox and use it to build and export particle/spline/attractor systems
- Start with a simple 3d spline loop for particles to follow. We will try more complex splines later
- scene should allow for moving spline points
- scene should allow for adding/removing points to simplify.complexify spline
- scene should include a few attractors to pull particles off the spline
- scene should allow for moving attractors.
- scene should allow for rotating attractors.
- scene should allow for adding/removing attractors to simplify/complexify system
- scene should contain a white background with grey/black particles
- scene should be inside of a cube with a grid material applied to the inside of the mesh so we can use the grid for spatial orientation.
- the scene should be a combination of SplineEditor AND ParticleLab's Gravity Attractors.

# // Features

# // Bugs

- the scene is reusing too much of SplineEditor which tells me its time to make some of the base components more generic and more easily shared. They should get moved into components/elements
