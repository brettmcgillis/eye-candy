import {
  useCrtControls,
  useWebGPUCrtChannels,
} from '../../../../shared/crt/channels';

export default function useTvScene() {
  const controls = useCrtControls();
  const channels = useWebGPUCrtChannels(controls);

  return { channels };
}
