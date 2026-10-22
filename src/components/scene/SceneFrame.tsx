import type { ReactNode } from 'react';

interface SceneFrameProps {
  children: ReactNode;
  /** Вертикальное выравнивание содержимого в кадре. */
  justify?: 'center' | 'start' | 'between';
  className?: string;
  /** Максимальная ширина контента (по умолчанию 1680px). */
  maxWidth?: number;
}

/**
 * Безопасная область сцены: учитывает верхнюю панель, нижнюю навигацию, safe-area.
 * На телефонах и невысоких экранах содержимое прокручивается внутри сцены.
 */
export function SceneFrame({ children, justify = 'center', className = '', maxWidth = 1680 }: SceneFrameProps) {
  // safe center: если контент выше кадра (телефон), он не обрезается сверху, а прокручивается.
  const justifyClass =
    justify === 'center'
      ? '[justify-content:safe_center]'
      : justify === 'between'
        ? 'justify-between'
        : 'justify-start';
  return (
    <div className="scene-frame" data-scene-frame>
      <div
        className={`relative mx-auto flex w-full min-h-full shrink-0 flex-col ${justifyClass} ${className}`}
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  );
}
