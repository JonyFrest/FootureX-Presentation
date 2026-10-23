import { useEffect } from 'react';
import { usePresentation } from './store';
import { toggleFullscreen } from '@/hooks/useFullscreen';
import { openSpeakerWindow } from './speakerChannel';
import { toggleRemoteDialog, useRemote } from './remote/presenterRemote';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

function isActivatable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest('button, a, [role="button"], [role="tab"], [role="menuitem"]') !== null;
}

/**
 * Клавиатура: → / Space / PageDown — далее; ← / PageUp — назад; Home / End;
 * F — полный экран; M — список сцен; S — окно докладчика; P — пульт на телефоне; Esc — закрыть меню
 * (выход из полноэкранного режима по Esc выполняет браузер).
 */
export function useKeyboardNav(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTypingTarget(event.target)) return;
      const store = usePresentation.getState();
      // Окно пульта обрабатывает клавиши само (Esc, Tab).
      if (useRemote.getState().dialogOpen) return;

      if (event.key === 'Escape') {
        if (store.menuOpen) {
          event.preventDefault();
          store.setMenuOpen(false);
        }
        return;
      }
      // Пока открыт список сцен, стрелки и пробел принадлежат ему.
      if (store.menuOpen) return;
      // Удержание клавиши не должно пролистывать презентацию.
      if (event.repeat) {
        if (['ArrowRight', 'ArrowLeft', ' ', 'PageDown', 'PageUp'].includes(event.key)) event.preventDefault();
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'PageDown':
          event.preventDefault();
          store.next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault();
          store.prev();
          break;
        case ' ':
        case 'Spacebar':
          // Пробел на кнопке нажимает кнопку, а не листает дальше.
          if (isActivatable(event.target)) return;
          event.preventDefault();
          store.next();
          break;
        case 'Home':
          event.preventDefault();
          store.first();
          break;
        case 'End':
          event.preventDefault();
          store.last();
          break;
        case 'f':
        case 'F':
        case 'а':
        case 'А':
          event.preventDefault();
          void toggleFullscreen();
          break;
        case 'm':
        case 'M':
        case 'ь':
        case 'Ь':
          event.preventDefault();
          store.setMenuOpen(true);
          break;
        case 's':
        case 'S':
        case 'ы':
        case 'Ы':
          event.preventDefault();
          openSpeakerWindow();
          break;
        case 'p':
        case 'P':
        case 'з':
        case 'З':
          event.preventDefault();
          toggleRemoteDialog();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
