import { useEffect } from 'react';
import { usePresentation } from './store';
import { openChannel, type SpeakerMessage } from './speakerChannel';

/** Основное окно: публикует номер сцены и выполняет команды окна докладчика. */
export function useSpeakerBridge(): void {
  useEffect(() => {
    const channel = openChannel();
    if (!channel) return;

    const publish = () => {
      const { index, phase } = usePresentation.getState();
      const msg: SpeakerMessage = { type: 'state', index, transitioning: phase !== 'idle' };
      channel.postMessage(msg);
    };

    channel.onmessage = (event: MessageEvent<SpeakerMessage>) => {
      const msg = event.data;
      const store = usePresentation.getState();
      if (msg.type === 'hello') publish();
      else if (msg.type === 'goto') store.go(msg.index);
      else if (msg.type === 'command') store[msg.action]();
    };

    publish();
    const unsubscribe = usePresentation.subscribe((state, prev) => {
      if (state.index !== prev.index || state.phase !== prev.phase) publish();
    });
    return () => {
      unsubscribe();
      channel.close();
    };
  }, []);
}
