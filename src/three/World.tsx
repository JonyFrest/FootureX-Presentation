import { useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SCENES } from '@/data/scenes';
import { usePresentation } from '@/app/store';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useFinePointer } from '@/hooks/useMediaQuery';
import { AdaptiveQuality } from './AdaptiveQuality';
import { CameraRig } from './CameraRig';
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
 * Единое 3D-пространство FootureX: стадион, город, сетка, частицы и объекты сцен.
 * Камера перелетает между ракурсами сцен, сохраняя визуальную непрерывность.
 */
export default function World({ onContextLost }: WorldProps) {
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const deviceDpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const [lowPower] = useState(() => (navigator.hardwareConcurrency ?? 8) <= 4 || window.innerWidth < 700);
  const [initial] = useState(() => SCENES[usePresentation.getState().index].camera);
  const animate = !reducedMotion;

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={deviceDpr}
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
      <AdaptiveQuality maxDpr={deviceDpr} />
      <ContextGuard onContextLost={onContextLost} />
      <CameraRig parallax={finePointer && !reducedMotion} drift={!reducedMotion} />
      <Sky />
      <Ground />
      <Particles count={lowPower ? 700 : 1600} animate={animate} />
      <City count={lowPower ? 360 : 560} animate={animate} />
      <Stadium animate={animate} />
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
