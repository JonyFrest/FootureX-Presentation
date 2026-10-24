import { LayoutGrid, Maximize, Minimize, MonitorPlay, Smartphone } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { usePresentation } from '@/app/store';
import { useFullscreen } from '@/hooks/useFullscreen';
import { openSpeakerWindow } from '@/app/speakerChannel';
import { useRemote } from '@/app/remote/presenterRemote';
import { SCENES } from '@/data/scenes';

/** Верхняя панель: знак FootureX, тема и служебные кнопки. */
export function TopBar() {
  const index = usePresentation((s) => s.index);
  const menuOpen = usePresentation((s) => s.menuOpen);
  const setMenuOpen = usePresentation((s) => s.setMenuOpen);
  const { isFullscreen, toggle, supported } = useFullscreen();
  const remoteOpen = useRemote((s) => s.dialogOpen);
  const setRemoteOpen = useRemote((s) => s.setDialogOpen);
  const remoteStatus = useRemote((s) => s.status);
  const phoneOnline = useRemote((s) => s.phoneOnline);
  const remoteDot = remoteStatus === 'off' || remoteStatus === 'unavailable' ? null : phoneOnline ? 'bg-[#6ee7a8]' : 'bg-[#ffc46b]';
  const hideBrand = SCENES[index].id === 'opening' || SCENES[index].id === 'final';

  return (
    <header
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between"
      style={{
        height: 'calc(var(--topbar-h) + var(--safe-top))',
        paddingTop: 'var(--safe-top)',
        paddingLeft: 'calc(var(--stage-x) + var(--safe-left))',
        paddingRight: 'calc(var(--stage-x) + var(--safe-right))',
      }}
    >
      <div
        className={`pointer-events-auto flex items-center gap-4 transition-opacity duration-700 ${hideBrand ? 'opacity-0' : 'opacity-100'}`}
        aria-hidden={hideBrand}
      >
        <BrandLogo size="clamp(15px, calc(var(--u) * 1.15), 21px)" />
        <span className="hidden h-5 w-px bg-white/15 md:block" aria-hidden />
        <span className="t-micro hidden text-soft md:block">Управление проектами · TIUE 2026</span>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        <IconButton label="Список сцен (M)" onClick={() => setMenuOpen(!menuOpen)} active={menuOpen}>
          <LayoutGrid className="size-[18px]" aria-hidden />
        </IconButton>
        <IconButton
          label={phoneOnline ? 'Пульт на телефоне: подключён (P)' : 'Пульт на телефоне (P)'}
          onClick={() => setRemoteOpen(!remoteOpen)}
          active={remoteOpen}
          className="relative"
        >
          <Smartphone className="size-[18px]" aria-hidden />
          {remoteDot ? (
            <span className={`absolute top-[18%] right-[18%] size-2 rounded-full ring-2 ring-deep ${remoteDot}`} aria-hidden data-remote-dot />
          ) : null}
        </IconButton>
        <IconButton label="Режим докладчика (S)" onClick={openSpeakerWindow} className="hidden sm:flex">
          <MonitorPlay className="size-[18px]" aria-hidden />
        </IconButton>
        {supported ? (
          <IconButton label={isFullscreen ? 'Выйти из полноэкранного режима (F / Esc)' : 'Полный экран (F)'} onClick={toggle} active={isFullscreen}>
            {isFullscreen ? <Minimize className="size-[18px]" aria-hidden /> : <Maximize className="size-[18px]" aria-hidden />}
          </IconButton>
        ) : null}
      </div>
    </header>
  );
}

interface IconButtonProps {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
}

function IconButton({ children, label, onClick, active, className = '' }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`glass flex size-[clamp(38px,calc(var(--u)*2.7),46px)] cursor-pointer items-center justify-center rounded-full! text-ice transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/60 hover:text-white hover:shadow-[0_0_0_1px_rgba(37,147,250,0.3),0_10px_30px_-12px_rgba(37,80,250,0.8)] ${active ? 'border-secondary/70! text-white' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
