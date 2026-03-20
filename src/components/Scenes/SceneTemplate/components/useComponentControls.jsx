import { useControls } from 'leva';

export default function useComponentControls(controlName) {
  const [controls, setControls] = useControls(
    controlName ?? 'Component Controls',
    {},
    { collapsed: true }
  );

  return [controls, setControls];
}
