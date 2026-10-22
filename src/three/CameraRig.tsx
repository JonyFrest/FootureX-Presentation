import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { SCENES, type CameraPose } from '@/data/scenes';
import { TRANSITION, EASE } from '@/animations/timing';
import { usePresentation } from '@/app/store';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';

const DEFAULT_FOV = 42;

interface Pose {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

function toPose(p: CameraPose): Pose {
  return {
    position: new THREE.Vector3(...p.position),
    target: new THREE.Vector3(...p.target),
    fov: p.fov ?? DEFAULT_FOV,
  };
}

function clonePose(p: Pose): Pose {
  return { position: p.position.clone(), target: p.target.clone(), fov: p.fov };
}

/**
 * Перелёт по дуге вокруг стадиона: интерполяция в цилиндрических координатах
 * (угол, радиус, высота) + мягкий подъём в середине пути. Камера никогда не
 * проходит сквозь стадион и не делает резких разворотов.
 */
function interpolate(from: Pose, to: Pose, t: number, out: Pose): void {
  const r0 = Math.hypot(from.position.x, from.position.z);
  const r1 = Math.hypot(to.position.x, to.position.z);
  const a0 = Math.atan2(from.position.z, from.position.x);
  let da = Math.atan2(to.position.z, to.position.x) - a0;
  da = Math.atan2(Math.sin(da), Math.cos(da));
  const travel = from.position.distanceTo(to.position);
  const lift = Math.min(22, travel * 0.14) * Math.sin(Math.PI * t);
  const r = THREE.MathUtils.lerp(r0, r1, t) + Math.sin(Math.PI * t) * Math.min(18, travel * 0.08);
  const a = a0 + da * t;
  out.position.set(Math.cos(a) * r, THREE.MathUtils.lerp(from.position.y, to.position.y, t) + lift, Math.sin(a) * r);
  out.target.lerpVectors(from.target, to.target, t);
  out.fov = THREE.MathUtils.lerp(from.fov, to.fov, t);
}

/** Виртуальная камера презентации: синхронна с переходами слоя контента. */
export function CameraRig({ parallax = true, drift = true }: { parallax?: boolean; drift?: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  // Холст лежит под слоем контента, поэтому курсор отслеживаем по всему окну.
  const pointer = useRef(new THREE.Vector2());
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    const onLeave = () => pointer.current.set(0, 0);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);
  const zero = useRef(new THREE.Vector2());

  const start = toPose(SCENES[usePresentation.getState().index].camera);
  const from = useRef<Pose>(clonePose(start));
  const to = useRef<Pose>(clonePose(start));
  const current = useRef<Pose>(clonePose(start));
  const progress = useRef({ t: 1 });
  const smoothPointer = useRef(new THREE.Vector2());
  const tmp = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());

  useEffect(() => {
    const reduced = prefersReducedMotion();
    // Вступительный наезд камеры при первой загрузке.
    if (!reduced) {
      const intro = clonePose(to.current);
      intro.position.multiplyScalar(1.45);
      intro.position.y += 26;
      from.current = intro;
      progress.current.t = 0;
      gsap.to(progress.current, { t: 1, duration: 2.4, ease: 'power3.out' });
    }

    let tween: gsap.core.Tween | null = null;
    const unsubscribe = usePresentation.subscribe((state, prev) => {
      if (state.index === prev.index) return;
      tween?.kill();
      from.current = clonePose(current.current);
      to.current = toPose(SCENES[state.index].camera);
      progress.current.t = 0;
      const fast = prefersReducedMotion() || state.instant;
      tween = gsap.to(progress.current, {
        t: 1,
        duration: fast ? TRANSITION.reduced : TRANSITION.camera,
        ease: fast ? 'power1.out' : EASE.camera,
      });
    });
    return () => {
      unsubscribe();
      tween?.kill();
    };
  }, []);

  useFrame((state, delta) => {
    interpolate(from.current, to.current, progress.current.t, current.current);
    const pose = current.current;

    // Параллакс от курсора: смещение камеры в пределах ~1–1.5 единиц.
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 2.5);
    smoothPointer.current.lerp(parallax ? pointer.current : zero.current, k);

    const offset = tmp.current;
    forward.current.subVectors(pose.target, pose.position).normalize();
    right.current.crossVectors(forward.current, camera.up).normalize();
    offset.copy(right.current).multiplyScalar(smoothPointer.current.x * 1.6);
    offset.y += smoothPointer.current.y * 0.9;

    // Едва заметное «дыхание» камеры в покое.
    if (drift) {
      const time = state.clock.elapsedTime;
      offset.x += Math.sin(time * 0.17) * 0.45;
      offset.y += Math.sin(time * 0.23) * 0.3;
    }

    camera.position.copy(pose.position).add(offset);
    camera.lookAt(pose.target);
    if (Math.abs(camera.fov - pose.fov) > 0.01) {
      camera.fov = pose.fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
