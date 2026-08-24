import { useCrtControls, useWebGPUCrtChannels } from '@elements/Crt/channels';

export default function useTvScene() {
  const controls = useCrtControls();
  const channels = useWebGPUCrtChannels(controls);

  return { channels };
}
