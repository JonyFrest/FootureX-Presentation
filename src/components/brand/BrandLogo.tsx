import { ORIGINAL_LOGO_SRC } from './brand';

interface BrandLogoProps {
  /** Высота знака в CSS-единицах (например, '28px' или 'var(--fs-h1)'). */
  size?: string;
  className?: string;
  /** Подпись под знаком, например «Uzbekistan». */
  tagline?: string;
}

/** Фирменный знак FootureX: оригинальный файл логотипа или шрифтовой знак. */
export function BrandLogo({ size = '22px', className = '', tagline }: BrandLogoProps) {
  if (ORIGINAL_LOGO_SRC) {
    return (
      <img
        src={ORIGINAL_LOGO_SRC}
        alt="FootureX"
        className={className}
        style={{ height: size, width: 'auto' }}
        draggable={false}
      />
    );
  }
  return (
    <span className={`inline-flex flex-col leading-none ${className}`} aria-label="FootureX" role="img">
      <span className="font-display tracking-[0.06em] text-white" style={{ fontSize: size }} aria-hidden>
        FOOTURE<span className="text-brand-gradient">X</span>
      </span>
      {tagline ? (
        <span
          className="mt-[0.45em] font-sans font-medium uppercase tracking-[0.42em] text-highlight"
          style={{ fontSize: `max(11px, calc(${size} * 0.36))` }}
          aria-hidden
        >
          {tagline}
        </span>
      ) : null}
    </span>
  );
}
