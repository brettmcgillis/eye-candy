import createExpansiveField from './expansive/field';
import createGrayScottField from './grayScott/field';
import createPhysarumField from './physarum/field';

const BUILDERS = {
  expansive: createExpansiveField,
  grayScott: createGrayScottField,
  physarum: createPhysarumField,
};

// One call for any solver, so a scene switches between them by changing a
// string rather than a code path.
export default function createSolver(kind, options) {
  return (BUILDERS[kind] ?? createExpansiveField)(options);
}
