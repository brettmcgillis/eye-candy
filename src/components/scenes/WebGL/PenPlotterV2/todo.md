# // PenPlotterV2

[Back to main TODO](../../../../../TODO.md)

## // Intent / Use Cases

I recently found the three-edge-projection project in github. This code does much of we are trying to do in PenPlotter: Capture a 3d scene and render as 2d svg. The code is faster, and better than ours. It allows for canvas interaction while generating the output and does not cause browser locking.
We need to take a quick review of PenPlotter and its features: Dual panel view. Scene on left, generated scene on right. ability to switch scene on left. Abillity to save output to svg for later feeding to a pen plotter.
Then we need to review the eye-candy/referenceMaterials/three-edge-detection. This is a clone of the repository, as i could not figure out how to install via npm.
Acceptable solutions: Install dep via npm. Fork code into our repo.
Finally, once we undertsand scope of the project we need to build webGL and webGPU versions of the scene so i have the flexibility to "plot" any scene i desire.


## // TODO:

## // Presets

## // Features

## // Bugs
