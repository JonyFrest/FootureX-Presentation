/**
 * Синхронизация основной презентации и окна докладчика через BroadcastChannel
 * (оба окна открыты в одном браузере, сервер не нужен).
 */
export const SPEAKER_CHANNEL = 'footurex-presentation-os';

export type SpeakerMessage =
  | { type: 'state'; index: number; transitioning: boolean }
  | { type: 'hello' }
  | { type: 'command'; action: 'next' | 'prev' | 'first' | 'last' }
  | { type: 'goto'; index: number };

export function openChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(SPEAKER_CHANNEL);
}

/** Открывает окно докладчика (отдельное окно, текст не попадает на основной экран). */
export function openSpeakerWindow(): void {
  const url = new URL(window.location.href);
  url.search = '?speaker=1';
  url.hash = '';
  window.open(url.toString(), 'footurex-speaker', 'popup=yes,width=1100,height=760');
}
