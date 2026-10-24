import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type * as THREE from 'three';

/** Когда прогревать: после вступительного наезда камеры (2.4 с). */
const WARMUP_DELAY_MS = 2600;

/**
 * Прогрев шейдеров. Объекты сцен (мяч, кольцо, потоки, дорога, столбцы, фильтры) скрыты до
 * «своих» сцен, и без прогрева их программы компилировались бы в первом кадре показа — посреди
 * перехода: на телефоне это рывок в сотни миллисекунд. Поэтому, когда браузер свободен:
 * 1) все материалы сцены, включая скрытые, компилируются асинхронно (KHR_parallel_shader_compile);
 * 2) затем все объекты один раз рисуются в один пиксель (scissor) прямо перед обычным кадром —
 *    драйвер доводит программы до готовности, а на экран попадает обычный кадр.
 */
export function ShaderWarmup() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const drawPending = useRef(false);

  useEffect(() => {
    let idleId = 0;
    let alive = true;
    const timer = window.setTimeout(() => {
      const run = () =>
        void gl.compileAsync(scene, camera).then(() => {
          if (alive) drawPending.current = true;
        });
      if (window.requestIdleCallback) idleId = window.requestIdleCallback(run, { timeout: 2000 });
      else run();
    }, WARMUP_DELAY_MS);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      if (idleId) window.cancelIdleCallback(idleId);
    };
  }, [gl, scene, camera]);

  useFrame(() => {
    if (!drawPending.current) return;
    drawPending.current = false;
    // Всё, включая скрытое и не попадающее в кадр нынешней камеры.
    const hidden: THREE.Object3D[] = [];
    const culled: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (!obj.visible) {
        obj.visible = true;
        hidden.push(obj);
      }
      if (obj.frustumCulled) {
        obj.frustumCulled = false;
        culled.push(obj);
      }
    });
    gl.setScissorTest(true);
    gl.setScissor(0, 0, 1, 1);
    gl.render(scene, camera);
    gl.setScissorTest(false);
    for (const obj of hidden) obj.visible = false;
    for (const obj of culled) obj.frustumCulled = true;
  });

  return null;
}
