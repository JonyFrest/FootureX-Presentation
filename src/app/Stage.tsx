import { Suspense, startTransition, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent, type MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import gsap from 'gsap';
import { SCENES } from '@/data/scenes';
import { TRANSITION, TRANSITION_LITE, EASE, TRANSITION_TOTAL } from '@/animations/timing';
import { SceneContext, type SceneContextValue } from '@/components/scene/SceneContext';
import { getSceneComponent, preloadScenes } from '@/scenes/registry';
import { useReducedMotion, prefersReducedMotion } from '@/hooks/useReducedMotion';
import { useFinePointer, useIsCompact } from '@/hooks/useMediaQuery';
import { usePresentation } from './store';
import { LOW_TIER } from './deviceTier';
import { hasTextSelection, isInteractiveTarget } from './interactive';

/** Максимальный наклон контентного слоя от курсора, градусы. */
const TILT_X = 1.6;
const TILT_Y = 2.4;

function SceneLayer({ index, current }: { index: number; current: boolean }) {
  const meta = SCENES[index];
  const Component = getSceneComponent(meta.id);
  const ready = usePresentation((s) => s.ready && current);
  const instant = usePresentation((s) => s.instant);
  const reducedMotion = useReducedMotion();
  // Телефон: новую сцену React строит «нарезкой» (startTransition, без блокировки потока), пока
  // уходит прежняя и летит камера, — вместо одной длинной задачи в первом кадре перехода.
  const [mounted, setMounted] = useState(() => !LOW_TIER || usePresentation.getState().transitionId === 0);
  useEffect(() => {
    if (!mounted) startTransition(() => setMounted(true));
  }, [mounted]);

  const value = useMemo<SceneContextValue>(
    () => ({
      meta,
      active: current,
      ready,
      enterDelay: instant || reducedMotion ? 0.05 : (LOW_TIER ? TRANSITION_LITE.inDelay : TRANSITION.inDelay) * 0.85,
      reducedMotion,
    }),
    [meta, current, ready, instant, reducedMotion],
  );

  return (
    <SceneContext.Provider value={value}>
      <Suspense fallback={null}>{mounted ? <Component /> : null}</Suspense>
    </SceneContext.Provider>
  );
}

/**
 * Слой контента: держит текущую и уходящую сцены и проигрывает переход
 * «текущая уходит в глубину → следующая появляется из глубины» синхронно с камерой.
 */
export function Stage() {
  const index = usePresentation((s) => s.index);
  const from = usePresentation((s) => s.from);
  const transitionId = usePresentation((s) => s.transitionId);
  const menuOpen = usePresentation((s) => s.menuOpen);
  const layers = useRef(new Map<number, HTMLDivElement>());
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const compact = useIsCompact();

  // Предзагрузка: соседние сцены сразу, остальные — когда браузер свободен.
  useEffect(() => {
    const ids = [index - 1, index + 1].filter((i) => i >= 0 && i < SCENES.length).map((i) => SCENES[i].id);
    preloadScenes(ids);
  }, [index]);
  useEffect(() => {
    const all = SCENES.map((s) => s.id);
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    idle(() => preloadScenes(all));
  }, []);

  useLayoutEffect(() => {
    const { from: outgoingIndex, index: incomingIndex, direction, instant, completeTransition } =
      usePresentation.getState();
    const id = transitionId;
    const incoming = layers.current.get(incomingIndex);
    const outgoing = outgoingIndex !== null ? layers.current.get(outgoingIndex) : undefined;
    if (!incoming) return;

    const reduced = prefersReducedMotion();
    // Телефон: will-change — только на время анимации: слой заранее выносится на композитор
    // (кадры перехода без перерастеризации), а после перехода не держит лишнюю GPU-память.
    const animated = outgoing ? [incoming, outgoing] : [incoming];
    const releaseLayers = () => animated.forEach((el) => (el.style.willChange = ''));
    if (LOW_TIER) animated.forEach((el) => (el.style.willChange = 'transform, opacity'));
    const tl = gsap.timeline({
      onComplete: () => {
        releaseLayers();
        completeTransition(id);
      },
    });

    if (id === 0) {
      // Первое появление презентации.
      tl.fromTo(
        incoming,
        { autoAlpha: 0, scale: reduced || LOW_TIER ? 1 : 0.96 },
        { autoAlpha: 1, scale: 1, duration: reduced ? TRANSITION.reduced : 1.1, ease: EASE.in, delay: 0.15 },
      );
    } else if (instant || reduced) {
      if (outgoing) tl.to(outgoing, { autoAlpha: 0, duration: TRANSITION.reduced * 0.6, ease: 'none' }, 0);
      tl.fromTo(
        incoming,
        { autoAlpha: 0, scale: 1, xPercent: 0 },
        { autoAlpha: 1, duration: TRANSITION.reduced, ease: 'none' },
        TRANSITION.reduced * 0.4,
      );
    } else if (LOW_TIER) {
      // Телефон: только сдвиг и прозрачность (композитор, без перерастеризации), короче.
      const { out, inDelay, in: inDuration, shift } = TRANSITION_LITE;
      if (outgoing) tl.to(outgoing, { autoAlpha: 0, xPercent: -direction * shift, duration: out, ease: EASE.out }, 0);
      tl.fromTo(
        incoming,
        { autoAlpha: 0, xPercent: direction * shift },
        { autoAlpha: 1, xPercent: 0, duration: inDuration, ease: EASE.in },
        inDelay,
      );
    } else {
      if (outgoing) {
        tl.to(
          outgoing,
          {
            autoAlpha: 0,
            scale: 0.88,
            xPercent: -direction * 5,
            yPercent: 1.5,
            duration: TRANSITION.out,
            ease: EASE.out,
          },
          0,
        );
      }
      tl.fromTo(
        incoming,
        { autoAlpha: 0, scale: 0.9, xPercent: direction * 6, yPercent: -1 },
        { autoAlpha: 1, scale: 1, xPercent: 0, yPercent: 0, duration: TRANSITION.in, ease: EASE.in },
        TRANSITION.inDelay,
      );
    }

    // Страховка: если вкладка была скрыта и rAF стоял, переход всё равно завершится.
    const safety = window.setTimeout(() => tl.progress(1), (TRANSITION_TOTAL + 1.5) * 1000);
    return () => {
      window.clearTimeout(safety);
      tl.kill();
      releaseLayers();
    };
  }, [transitionId]);

  // --- Параллакс от курсора: лёгкий наклон слоя, не более ~2.5° ---
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 60, damping: 18, mass: 0.6 });
  const rotateY = useTransform(sx, (v) => v * TILT_Y);
  const rotateX = useTransform(sy, (v) => -v * TILT_X);
  const parallax = finePointer && !reducedMotion && !compact;

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!parallax || e.pointerType !== 'mouse') return;
    px.set((e.clientX / window.innerWidth) * 2 - 1);
    py.set((e.clientY / window.innerHeight) * 2 - 1);
  };
  const onPointerLeave = () => {
    px.set(0);
    py.set(0);
  };
  useEffect(() => {
    if (!parallax) {
      px.set(0);
      py.set(0);
    }
  }, [parallax, px, py]);

  // --- Клик по свободной области и свайп ---
  const swipe = useRef<{ x: number; y: number; t: number; id: number } | null>(null);
  const swiped = useRef(false);
  // Нажатие началось на интерактивном элементе: даже если раскладка сдвинулась
  // и отпускание пришлось на пустое место, клик не должен листать сцену.
  const downOnInteractive = useRef(false);

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    if (menuOpen || e.button !== 0 || e.detail > 1) return;
    if (downOnInteractive.current) {
      downOnInteractive.current = false;
      return;
    }
    if (isInteractiveTarget(e.target) || hasTextSelection()) return;
    usePresentation.getState().next();
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    downOnInteractive.current = isInteractiveTarget(e.target);
    if (e.pointerType === 'mouse') return;
    swipe.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || start.id !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const fast = performance.now() - start.t < 700;
    if (fast && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      swiped.current = true;
      window.setTimeout(() => (swiped.current = false), 400);
      const store = usePresentation.getState();
      if (dx < 0) store.next();
      else store.prev();
    }
  };

  const visible = from !== null && from !== index ? [from, index] : [index];

  return (
    <div
      className="absolute inset-0 z-10 select-text"
      style={{ perspective: 1600 }}
      onClick={onClick}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      data-stage
    >
      <motion.div className="absolute inset-0" style={parallax ? { rotateX, rotateY } : undefined}>
        {visible.map((i) => (
          <div
            key={SCENES[i].id}
            ref={(node) => {
              if (node) layers.current.set(i, node);
              else layers.current.delete(i);
            }}
            className="absolute inset-0"
            style={{ visibility: 'hidden', pointerEvents: i === index ? 'auto' : 'none' }}
            aria-hidden={i !== index}
            data-scene-layer={SCENES[i].id}
            data-current={i === index ? 'true' : 'false'}
          >
            <SceneLayer index={i} current={i === index} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
