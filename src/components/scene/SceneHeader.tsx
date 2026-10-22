import type { ReactNode } from 'react';
import { pad2 } from '@/data/scenes';
import { useScene } from './SceneContext';
import { Reveal } from './Reveal';

interface SceneHeaderProps {
  title: ReactNode;
  /** Короткий поясняющий текст под заголовком (1–2 строки). */
  lead?: ReactNode;
  /** Переопределить подпись над заголовком (по умолчанию «07 · Roadmap»). */
  eyebrow?: ReactNode;
  align?: 'left' | 'center';
  size?: 'h1' | 'display';
  className?: string;
}

/** Единый заголовок сцены: номер + латинская подпись, заголовок, лид. */
export function SceneHeader({ title, lead, eyebrow, align = 'left', size = 'h1', className = '' }: SceneHeaderProps) {
  const { meta } = useScene();
  const centered = align === 'center';
  return (
    <header className={`${centered ? 'mx-auto text-center' : ''} max-w-[min(100%,1100px)] ${className}`}>
      <Reveal delay={0} y={10}>
        <p className={`t-eyebrow flex items-center gap-3 ${centered ? 'justify-center' : ''}`}>
          <span className="inline-block h-px w-8 bg-gradient-to-r from-transparent to-secondary" aria-hidden />
          {eyebrow ?? `${pad2(meta.number)} · ${meta.eyebrow}`}
        </p>
      </Reveal>
      <Reveal delay={0.06} y={16}>
        <h1 className={`${size === 'display' ? 't-display' : 't-h1'} mt-[var(--gap-2)] text-balance`}>{title}</h1>
      </Reveal>
      {lead ? (
        <Reveal delay={0.14} y={14}>
          <p
            className={`t-body mt-[var(--gap-2)] text-soft text-pretty ${centered ? 'mx-auto' : ''} max-w-[60ch]`}
          >
            {lead}
          </p>
        </Reveal>
      ) : null}
    </header>
  );
}
