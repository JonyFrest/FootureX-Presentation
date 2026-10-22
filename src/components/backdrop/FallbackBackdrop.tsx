import { usePresentation } from '@/app/store';
import { SCENE_COUNT } from '@/data/scenes';

/**
 * Фон без WebGL: градиентное «небо», перспективная сетка и силуэт стадиона.
 * Слой мягко смещается от сцены к сцене, сохраняя ощущение движения камеры.
 */
export function FallbackBackdrop() {
  const index = usePresentation((s) => s.index);
  const t = index / (SCENE_COUNT - 1);
  return (
    <div className="absolute inset-0 overflow-hidden bg-deep" aria-hidden>
      <div
        className="absolute inset-[-10%] transition-transform duration-[1300ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
        style={{ transform: `translate3d(${(t - 0.5) * -8}%, ${Math.sin(t * Math.PI) * -3}%, 0) scale(${1 + Math.sin(t * Math.PI) * 0.06})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_70%,rgba(37,80,250,0.35),transparent_55%),radial-gradient(ellipse_at_20%_10%,rgba(37,147,250,0.18),transparent_45%),radial-gradient(ellipse_at_85%_20%,rgba(142,180,255,0.12),transparent_40%)]" />
        <div
          className="absolute inset-x-0 bottom-0 h-[55%] opacity-50"
          style={{
            backgroundImage:
              'linear-gradient(rgba(37,147,250,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(37,147,250,0.35) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            transform: 'perspective(600px) rotateX(62deg)',
            transformOrigin: '50% 0%',
            maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
          }}
        />
        <svg className="absolute left-1/2 top-[58%] w-[70%] max-w-[1200px] -translate-x-1/2 -translate-y-1/2" viewBox="0 0 1200 400" fill="none">
          <defs>
            <linearGradient id="fb-stroke" x1="0" x2="1">
              <stop offset="0" stopColor="#2593FA" stopOpacity="0" />
              <stop offset="0.5" stopColor="#8EB4FF" stopOpacity="0.9" />
              <stop offset="1" stopColor="#2593FA" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="fb-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#2550FA" stopOpacity="0.55" />
              <stop offset="1" stopColor="#2550FA" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="600" cy="250" rx="560" ry="150" fill="url(#fb-glow)" />
          <ellipse cx="600" cy="250" rx="520" ry="120" stroke="url(#fb-stroke)" strokeWidth="3" />
          <ellipse cx="600" cy="230" rx="440" ry="96" stroke="url(#fb-stroke)" strokeWidth="2" opacity="0.7" />
          <ellipse cx="600" cy="262" rx="300" ry="58" stroke="#2593FA" strokeOpacity="0.5" strokeWidth="1.5" />
          <line x1="600" y1="204" x2="600" y2="320" stroke="#2593FA" strokeOpacity="0.4" />
          {[140, 360, 840, 1060].map((x) => (
            <g key={x}>
              <line x1={x} y1="60" x2={x} y2="230" stroke="#8EB4FF" strokeOpacity="0.5" strokeWidth="2" />
              <circle cx={x} cy="56" r="10" fill="#DCE7FF" />
              <circle cx={x} cy="56" r="34" fill="url(#fb-glow)" />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
