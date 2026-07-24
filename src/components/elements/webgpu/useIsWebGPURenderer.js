import { useThree } from '@react-three/fiber';

export default function useIsWebGPURenderer() {
  const gl = useThree((state) => state.gl);
  return gl?.isWebGPURenderer === true;
}
