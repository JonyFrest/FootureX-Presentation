import type { HTMLAttributes, ReactNode } from 'react';

interface GlassProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Более плотная подложка — для таблиц и плотных данных. */
  strong?: boolean;
  /** Подъём и синяя подсветка при наведении/фокусе. */
  hover?: boolean;
  /** Подсветить как выбранный элемент. */
  selected?: boolean;
}

/** Стеклянная панель FootureX (glassmorphism). */
export function Glass({ children, strong, hover, selected, className = '', ...rest }: GlassProps) {
  return (
    <div
      {...rest}
      data-active={selected ? 'true' : undefined}
      className={`${strong ? 'glass-strong' : 'glass'} ${hover ? 'glass-hover' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
