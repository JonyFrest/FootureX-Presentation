import type { ParsedTarget } from './kpi';

interface TargetValueProps {
  target: ParsedTarget;
  size: 'lg' | 'md' | 'sm';
  className?: string;
}

/** Целевое значение: знак сравнения, число (Zen Dots), единица. */
export function TargetValue({ target, size, className = '' }: TargetValueProps) {
  const numClass = size === 'lg' ? 't-h1' : size === 'md' ? 't-h2' : 't-h3 font-display';
  const sideClass = size === 'sm' ? 't-micro' : 't-small';
  return (
    <span className={`inline-flex items-baseline gap-1 whitespace-nowrap ${className}`}>
      {target.cmp ? <span className={`${sideClass} font-medium text-highlight`}>{target.cmp}</span> : null}
      <span className={`${numClass} leading-none text-white`}>{target.num}</span>
      {target.unit ? <span className={`${sideClass} font-medium text-soft`}>{target.unit}</span> : null}
    </span>
  );
}
