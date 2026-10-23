import { useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SCENES } from '@/data/scenes';
import { usePresentation } from '@/app/store';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useFinePointer } from '@/hooks/useMediaQuery';
import { LOW_TIER } from '@/app/deviceTier';
import { AdaptiveQuality } from './AdaptiveQuality';
import { CameraRig } from './CameraRig';
import { FrameGovernor } from './FrameGovernor';
import { ShaderWarmup } from './ShaderWarmup';
import { City } from './City';
import { Ground, Particles, Sky } from './Environment';
import { Stadium } from './Stadium';
import { DataFlow, DataPillars, RiskFilters, HoloBall, LifecycleRing, LightPath, WbsTower, TeamOrbits } from './features/Features';

interface WorldProps {
  onContextLost?: () => void;
}

/** Слушает потерю WebGL-контекста и переключает фон на CSS-вариант. */
function ContextGuard({ onContextLost }: WorldProps) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (e: Event) => {
      e.preventDefault();
      onContextLost?.();
    };
    canvas.addEventListener('webglcontextlost', lost);
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onContextLost]);
  return null;
}

const MAX_DPR = 1.75;
/**
 * Телефон (DPR 2–3, слабый GPU): фон под затемнением и стеклом, поэтому потолок плотности
 * пикселей ниже, а адаптивное качество может опускаться ниже 1.
 */
const LOW_MAX_DPR = 1.25;
const LOW_MIN_DPR = 0.75;

/**
 * Единое 3D-пространство FootureX: стадион, город, сетка, частицы и объекты сцен.
 * Камера перелетает между ракурсами сцен, сохраняя визуальную непрерывность.
 */
export default function World({ onContextLost }: WorldProps) {
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const deviceDpr = Math.min(window.devicePixelRatio || 1, LOW_TIER ? LOW_MAX_DPR : MAX_DPR);
  const [lowPower] = useState(() => LOW_TIER || (navigator.hardwareConcurrency ?? 8) <= 4 || window.innerWidth < 700);
  const [initial] = useState(() => SCENES[usePresentation.getState().index].camera);
  const animate = !reducedMotion;

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={deviceDpr}
      // Телефон: кадры дозирует FrameGovernor (в покое 30 кадров/с), иначе — каждый кадр.
      frameloop={LOW_TIER ? 'demand' : 'always'}
      flat
      camera={{ fov: initial.fov ?? 42, near: 0.5, far: 2000, position: [...initial.position] }}
      gl={{ antialias: !lowPower, alpha: false, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl }) => {
        gl.setClearColor('#070A12');
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
      style={{ pointerEvents: 'none' }}
      aria-hidden
    >
      {/* Адаптивное качество: при просадке FPS снижаем плотность пикселей. */}
      <AdaptiveQuality maxDpr={deviceDpr} minDpr={LOW_TIER ? LOW_MIN_DPR : 1} governed={LOW_TIER} />
      {LOW_TIER ? <FrameGovernor /> : null}
      <ContextGuard onContextLost={onContextLost} />
      <ShaderWarmup />
      <CameraRig parallax={finePointer && !reducedMotion} drift={!reducedMotion} />
      <Sky />
      <Ground />
      <Particles count={LOW_TIER ? 480 : lowPower ? 700 : 1600} animate={animate} />
      <City count={LOW_TIER ? 300 : lowPower ? 360 : 560} animate={animate} />
      <Stadium animate={animate} lite={LOW_TIER} />
      <HoloBall animate={animate} />
      <LifecycleRing animate={animate} />
      <DataFlow animate={animate} />
      <LightPath animate={animate} />
      <WbsTower animate={animate} />
      <DataPillars />
      <RiskFilters animate={animate} />
      <TeamOrbits animate={animate} />
    </Canvas>
  );
}
