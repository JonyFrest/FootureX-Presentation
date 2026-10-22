import { createContext, useContext } from 'react';
import type { SceneMeta } from '@/data/scenes';

export interface SceneContextValue {
  meta: SceneMeta;
  /** Сцена текущая (true с момента начала перехода к ней). */
  active: boolean;
  /** Камера остановилась, контент полностью читаем — время запускать графики. */
  ready: boolean;
  /** Задержка (с) перед появлением контента: сцена ещё «вылетает из глубины». */
  enterDelay: number;
  reducedMotion: boolean;
}

export const SceneContext = createContext<SceneContextValue | null>(null);

/** Состояние сцены для её компонентов: active / ready / reducedMotion. */
export function useScene(): SceneContextValue {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error('useScene() должен вызываться внутри сцены');
  return ctx;
}
