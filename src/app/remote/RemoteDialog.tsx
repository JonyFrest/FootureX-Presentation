import { useEffect, useRef, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Loader2, MonitorPlay, RefreshCw, Smartphone, WifiOff, X } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { openSpeakerWindow } from '@/app/speakerChannel';
import { QrCode } from './QrCode';
import { disableRemote, enableRemote, useRemote } from './presenterRemote';
import { formatRoom, isLoopbackHost, speakerLink } from './relay';

/** Окно «Пульт на телефоне»: QR-код и код комнаты, статус подключения телефона. */
export function RemoteDialog() {
  const open = useRemote((s) => s.dialogOpen);
  const setOpen = useRemote((s) => s.setDialogOpen);
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      restoreFocus.current = document.activeElement as HTMLElement | null;
      if (useRemote.getState().status === 'off') void enableRemote();
      requestAnimationFrame(() => closeRef.current?.focus());
    } else if (restoreFocus.current) {
      restoreFocus.current.focus?.();
      restoreFocus.current = null;
    }
  }, [open]);

  // Телефон подключился — показываем подтверждение и убираем окно с проектора.
  const phoneOnline = useRemote((s) => s.phoneOnline);
  const wasOnline = useRef(phoneOnline);
  useEffect(() => {
    const appeared = phoneOnline && !wasOnline.current;
    wasOnline.current = phoneOnline;
    if (!open || !appeared) return;
    const id = window.setTimeout(() => setOpen(false), 1800);
    return () => window.clearTimeout(id);
  }, [phoneOnline, open, setOpen]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' || (['p', 'P', 'з', 'З'].includes(e.key) && !e.altKey && !e.ctrlKey && !e.metaKey)) {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key !== 'Tab') return;
    // Удерживаем фокус внутри диалога.
    const focusables = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button, a[href]'));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="remote-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-deep/75 px-4"
          style={{ paddingTop: 'calc(var(--topbar-h) + var(--safe-top))', paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.1 : 0.25 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remote-title"
            className="glass-strong no-scrollbar max-h-full w-full max-w-[820px] overflow-y-auto rounded-[var(--radius-lg)] p-[var(--gap-4)]"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: reduced ? 0.1 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            onKeyDown={onKeyDown}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="t-eyebrow">Пульт докладчика</p>
                <h2 id="remote-title" className="t-h2 mt-[var(--gap-1)]">
                  Текст выступления и управление — на телефоне
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-soft transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Закрыть (Esc)"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <RemoteBody />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function RemoteBody() {
  const room = useRemote((s) => s.room);
  const status = useRemote((s) => s.status);
  const store = useRemote((s) => s.store);
  const phoneOnline = useRemote((s) => s.phoneOnline);

  if (status === 'unavailable') {
    return (
      <div className="mt-[var(--gap-3)] space-y-[var(--gap-2)]">
        <StatusLine tone="warn" icon={<AlertTriangle className="size-5" aria-hidden />}>
          На этом хостинге нет сервера синхронизации, поэтому телефон не сможет подключиться.
        </StatusLine>
        <p className="t-small text-soft">
          Пульт работает на Vercel (функция <code className="text-highlight">api/remote</code>) и при локальном запуске{' '}
          <code className="text-highlight">npm run preview -- --host</code>, когда ноутбук и телефон в одной Wi-Fi-сети. На этом
          ноутбуке можно открыть окно докладчика.
        </p>
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={() => void enableRemote({ room: room ?? undefined })} icon={<RefreshCw className="size-4" aria-hidden />}>
            Проверить ещё раз
          </ActionButton>
          <ActionButton onClick={openSpeakerWindow} icon={<MonitorPlay className="size-4" aria-hidden />}>
            Окно докладчика на ноутбуке
          </ActionButton>
        </div>
      </div>
    );
  }

  const link = room ? speakerLink(room) : '';
  const shortLink = link.replace(/^https?:\/\//, '').replace(/&room=\d+$/, '');

  return (
    <div className="mt-[var(--gap-3)] grid items-center gap-[var(--gap-4)] sm:grid-cols-[auto_minmax(0,1fr)]">
      <div className="mx-auto w-[clamp(168px,30vh,260px)] rounded-[var(--radius-md)] bg-white p-2 shadow-[0_20px_60px_-25px_rgba(37,147,250,0.8)]">
        {room ? (
          <QrCode value={link} size="100%" label={`QR-код пульта: ${link}`} />
        ) : (
          <div className="flex aspect-square items-center justify-center text-deep">
            <Loader2 className="size-8 animate-spin" aria-hidden />
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-[var(--gap-2)]">
        <ol className="t-small space-y-1.5 text-soft">
          <li>
            <span className="font-display text-highlight">1</span>&nbsp; Наведите камеру телефона на QR-код.
          </li>
          <li>
            <span className="font-display text-highlight">2</span>&nbsp; Или откройте <span className="break-all text-ice">{shortLink}</span> и
            введите код:
          </li>
        </ol>
        <p className="font-display t-num leading-none tracking-[0.12em] text-white" style={{ fontSize: 'clamp(30px, calc(var(--u) * 3.2), 52px)' }} data-room-code>
          {room ? formatRoom(room) : '··· ···'}
        </p>

        {status === 'checking' || status === 'connecting' ? (
          <StatusLine tone="muted" icon={<Loader2 className="size-5 animate-spin" aria-hidden />}>
            Подключаемся к серверу синхронизации…
          </StatusLine>
        ) : status === 'error' ? (
          <StatusLine tone="warn" icon={<WifiOff className="size-5" aria-hidden />}>
            Нет связи с сервером синхронизации — пробуем снова.
          </StatusLine>
        ) : phoneOnline ? (
          <StatusLine tone="ok" icon={<CheckCircle2 className="size-5" aria-hidden />}>
            Телефон подключён. Листайте и читайте текст выступления на телефоне.
          </StatusLine>
        ) : (
          <StatusLine tone="muted" icon={<Smartphone className="size-5 animate-pulse" aria-hidden />}>
            Ждём телефон…
          </StatusLine>
        )}

        {isLoopbackHost() ? (
          <p className="t-micro text-highlight">
            Телефон не откроет адрес localhost: откройте презентацию на ноутбуке по сетевому адресу (его печатает{' '}
            <code>npm run dev -- --host</code>), тогда QR-код укажет на него.
          </p>
        ) : null}
        {store === 'memory' && !isLoopbackHost() ? (
          <p className="t-micro text-mute">
            Временный режим без базы данных: если связь прерывается, подключите бесплатный Upstash Redis к проекту Vercel (см. README).
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          <ActionButton onClick={() => void enableRemote({ fresh: true })} icon={<RefreshCw className="size-4" aria-hidden />}>
            Новый код
          </ActionButton>
          <ActionButton onClick={disableRemote} icon={<X className="size-4" aria-hidden />}>
            Отключить пульт
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function StatusLine({ tone, icon, children }: { tone: 'ok' | 'warn' | 'muted'; icon: React.ReactNode; children: React.ReactNode }) {
  const color = tone === 'ok' ? 'text-[#6ee7a8]' : tone === 'warn' ? 'text-[#ffc46b]' : 'text-soft';
  return (
    <p className={`t-small flex items-start gap-2 ${color}`} role="status" aria-live="polite">
      <span className="mt-[0.1em] shrink-0">{icon}</span>
      <span>{children}</span>
    </p>
  );
}

function ActionButton({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="t-small flex cursor-pointer items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-ice transition-colors hover:border-secondary/60 hover:text-white"
    >
      {icon}
      {children}
    </button>
  );
}
