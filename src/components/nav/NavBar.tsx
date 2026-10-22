import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SCENE_COUNT, SCENES, pad2 } from '@/data/scenes';
import { usePresentation } from '@/app/store';

/**
 * Плавающая нижняя панель: ← Назад | 07 / 15 | Далее →, с индикатором прогресса.
 * Остаётся на месте при перелёте между сценами.
 */
export function NavBar() {
  const index = usePresentation((s) => s.index);
  const phase = usePresentation((s) => s.phase);
  const menuOpen = usePresentation((s) => s.menuOpen);
  const prev = usePresentation((s) => s.prev);
  const next = usePresentation((s) => s.next);
  const setMenuOpen = usePresentation((s) => s.setMenuOpen);
  const busy = phase !== 'idle';
  const progress = ((index + 1) / SCENE_COUNT) * 100;
  const atStart = index === 0;
  const atEnd = index === SCENE_COUNT - 1;

  return (
    <nav
      aria-label="Навигация по сценам"
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
      style={{ bottom: 'calc(var(--nav-gap) + var(--safe-bottom))' }}
    >
      <div
        className="glass-strong group/nav pointer-events-auto relative flex items-stretch overflow-hidden rounded-full p-1.5 transition-shadow duration-500 hover:shadow-[0_0_0_1px_rgba(37,147,250,0.35),0_18px_50px_-14px_rgba(37,80,250,0.6)]"
        style={{ height: 'var(--nav-h)', borderRadius: 999 }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent"
        />
        <NavButton label="Назад" ariaLabel="Предыдущая сцена" onClick={prev} disabled={atStart} busy={busy}>
          <ChevronLeft className="size-[1.2em]" aria-hidden />
          <span className="hidden sm:inline">Назад</span>
        </NavButton>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-label={`Сцена ${index + 1} из ${SCENE_COUNT}: ${SCENES[index].title}. Открыть список сцен`}
          className="relative mx-1 flex min-w-[clamp(96px,calc(var(--u)*8.6),150px)] cursor-pointer flex-col items-center justify-center rounded-full px-4 transition-colors duration-300 hover:bg-white/5"
        >
          <span className="font-display t-num leading-none" style={{ fontSize: 'clamp(15px, calc(var(--u) * 1.15), 22px)' }}>
            <span className="text-white">{pad2(index + 1)}</span>
            <span className="mx-1.5 text-mute">/</span>
            <span className="text-mute">{pad2(SCENE_COUNT)}</span>
          </span>
          <span className="mt-2 block h-[3px] w-full overflow-hidden rounded-full bg-white/10" aria-hidden>
            <span
              className="block h-full rounded-full bg-gradient-to-r from-secondary to-primary shadow-[0_0_10px_rgba(37,147,250,0.8)] transition-[width] duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </span>
        </button>

        <NavButton label="Далее" ariaLabel="Следующая сцена" onClick={next} disabled={atEnd} busy={busy} primary>
          <span className="hidden sm:inline">Далее</span>
          <ChevronRight className="size-[1.2em]" aria-hidden />
        </NavButton>
      </div>
    </nav>
  );
}

interface NavButtonProps {
  children: React.ReactNode;
  label: string;
  ariaLabel: string;
  onClick: () => void;
  disabled: boolean;
  busy: boolean;
  primary?: boolean;
}

function NavButton({ children, ariaLabel, onClick, disabled, busy, primary }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-busy={busy || undefined}
      className={[
        'relative flex cursor-pointer items-center gap-1.5 rounded-full px-[clamp(14px,calc(var(--u)*1.4),26px)] font-medium transition-all duration-300 ease-out',
        't-small',
        'disabled:cursor-not-allowed disabled:opacity-35',
        primary
          ? 'bg-gradient-to-br from-secondary to-primary text-white shadow-[0_8px_24px_-10px_rgba(37,80,250,0.9)] enabled:hover:shadow-[0_0_0_1px_rgba(142,180,255,0.5),0_10px_30px_-8px_rgba(37,147,250,0.95)] enabled:hover:brightness-110'
          : 'text-ice enabled:hover:bg-white/8 enabled:hover:text-white',
        'enabled:active:scale-[0.97]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
