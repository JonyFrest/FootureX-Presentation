import { useEffect, useRef, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { SCENES, pad2 } from '@/data/scenes';
import { usePresentation } from '@/app/store';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/** Компактный список 15 сцен для быстрого перехода. */
export function SceneMenu() {
  const open = usePresentation((s) => s.menuOpen);
  const index = usePresentation((s) => s.index);
  const setMenuOpen = usePresentation((s) => s.setMenuOpen);
  const go = usePresentation((s) => s.go);
  const reduced = useReducedMotion();
  const listRef = useRef<HTMLOListElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      restoreFocus.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => {
        listRef.current?.querySelector<HTMLButtonElement>(`[data-index="${index}"]`)?.focus();
      });
    } else if (restoreFocus.current) {
      restoreFocus.current.focus?.();
      restoreFocus.current = null;
    }
  }, [open, index]);

  const choose = (i: number) => {
    setMenuOpen(false);
    if (i !== usePresentation.getState().index) go(i);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('button[data-index]') ?? []);
    const pos = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const cols = window.matchMedia('(min-width: 1024px)').matches ? 3 : window.matchMedia('(min-width: 640px)').matches ? 2 : 1;
    let nextPos = pos;
    if (e.key === 'ArrowDown') nextPos = pos + cols;
    else if (e.key === 'ArrowUp') nextPos = pos - cols;
    else if (e.key === 'ArrowRight') nextPos = pos + 1;
    else if (e.key === 'ArrowLeft') nextPos = pos - 1;
    else if (e.key === 'Home') nextPos = 0;
    else if (e.key === 'End') nextPos = buttons.length - 1;
    else if (e.key === 'Tab') {
      // Удерживаем фокус внутри диалога.
      const focusables = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button'));
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    } else return;
    e.preventDefault();
    buttons[Math.max(0, Math.min(buttons.length - 1, nextPos))]?.focus();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="scene-menu"
          className="fixed inset-0 z-50 flex items-end justify-center bg-deep/55 px-4 backdrop-blur-sm"
          style={{ paddingBottom: 'calc(var(--nav-h) + var(--nav-gap) * 2 + var(--safe-bottom))', paddingTop: 'calc(var(--topbar-h) + var(--safe-top))' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.1 : 0.25 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setMenuOpen(false);
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Список сцен"
            className="glass-strong max-h-full w-full max-w-[1040px] overflow-y-auto rounded-[var(--radius-lg)] p-[var(--gap-3)] no-scrollbar"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: reduced ? 0.1 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            onKeyDown={onKeyDown}
          >
            <div className="mb-[var(--gap-2)] flex items-center justify-between gap-4">
              <p className="t-eyebrow">Сцены презентации</p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex size-9 cursor-pointer items-center justify-center rounded-full text-soft transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Закрыть список сцен (Esc)"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <ol ref={listRef} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SCENES.map((scene, i) => {
                const current = i === index;
                return (
                  <li key={scene.id}>
                    <button
                      type="button"
                      data-index={i}
                      onClick={() => choose(i)}
                      aria-current={current ? 'step' : undefined}
                      className={`group flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-2.5 text-left transition-all duration-300 ${
                        current
                          ? 'border-secondary/70 bg-primary/20 shadow-[0_0_0_1px_rgba(37,147,250,0.25)]'
                          : 'border-white/5 bg-white/[0.02] hover:-translate-y-0.5 hover:border-secondary/40 hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className={`font-display t-num t-small ${current ? 'text-white' : 'text-highlight'}`}>{pad2(i + 1)}</span>
                      <span className="t-small leading-snug text-ice group-hover:text-white">{scene.title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="t-micro mt-[var(--gap-2)] text-mute">
              Клавиши: ← → пробел — листать · Home / End — начало и конец · F — полный экран · S — окно докладчика · Esc — закрыть
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
