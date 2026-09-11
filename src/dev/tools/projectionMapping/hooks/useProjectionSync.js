import { useEffect, useRef, useState } from 'react';

const CHANNEL_PREFIX = 'eyeCandy:projectionMapping:';

export default function useProjectionSync({ isOutput, project, setProject }) {
  const revisionRef = useRef(0);
  const [outputConnected, setOutputConnected] = useState(false);

  useEffect(() => {
    if (!project?.id) return undefined;

    const channel = new BroadcastChannel(`${CHANNEL_PREFIX}${project.id}`);
    const handleMessage = (event) => {
      const message = event.data;
      if (message?.type === 'presence' && !isOutput) {
        setOutputConnected(true);
      }
      if (
        message?.type === 'project' &&
        isOutput &&
        message.revision > revisionRef.current
      ) {
        revisionRef.current = message.revision;
        setProject(message.project);
      }
    };

    channel.addEventListener('message', handleMessage);
    if (isOutput) channel.postMessage({ type: 'presence' });

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [isOutput, project?.id, setProject]);

  useEffect(() => {
    if (isOutput || !project?.id) return undefined;
    const channel = new BroadcastChannel(`${CHANNEL_PREFIX}${project.id}`);
    revisionRef.current += 1;
    channel.postMessage({
      project,
      revision: revisionRef.current,
      type: 'project',
    });
    channel.close();
    return undefined;
  }, [isOutput, project]);

  return { outputConnected };
}
