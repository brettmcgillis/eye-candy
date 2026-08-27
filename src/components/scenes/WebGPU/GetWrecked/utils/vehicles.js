// Every entry here has to be a single-mesh, single-material GLTF: the glitch
// pipeline bakes its attributes onto one geometry and builds one material from
// one source. abandoned_car.glb (15 meshes) and burned_police_cars.glb (2) are
// deliberately absent for that reason — they'd need a per-mesh uniform set each.
const VEHICLES = [
  {
    id: 'Car',
    label: 'Destroyed Car',
    file: 'destroyed_car.glb',
    targetLength: 3.4,
  },
  {
    id: 'Van',
    label: 'Abandoned Van',
    file: 'abandoned_van.glb',
    targetLength: 4.6,
  },
  // dirty_car is authored with its length along Z rather than X, which is why
  // the scale below is taken from whichever horizontal extent is larger.
  {
    id: 'Sedan',
    label: 'Dirty Car',
    file: 'dirty_car.glb',
    targetLength: 3.8,
  },
];

export default VEHICLES;
