import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Реестр компонентов сцен (ленивая загрузка + предзагрузка соседних сцен).
 * Порядок и метаданные — в src/data/scenes.ts.
 */
type SceneModule = { default: ComponentType };

const loaders: Record<string, () => Promise<SceneModule>> = {
  opening: () => import('./Scene01Opening'),
  goals: () => import('./Scene02Goals'),
  relevance: () => import('./Scene03Relevance'),
  lifecycle: () => import('./Scene04Lifecycle'),
  method: () => import('./Scene05Method'),
  about: () => import('./Scene06About'),
  roadmap: () => import('./Scene07Roadmap'),
  charter: () => import('./Scene08Charter'),
  team: () => import('./Scene09Team'),
  wbs: () => import('./Scene10Wbs'),
  schedule: () => import('./Scene11Schedule'),
  budget: () => import('./Scene12Budget'),
  risks: () => import('./Scene13Risks'),
  control: () => import('./Scene14Control'),
  final: () => import('./Scene15Final'),
};

const cache = new Map<string, LazyExoticComponent<ComponentType>>();

export function getSceneComponent(id: string): LazyExoticComponent<ComponentType> {
  let component = cache.get(id);
  if (!component) {
    const loader = loaders[id];
    if (!loader) throw new Error(`Неизвестная сцена: ${id}`);
    component = lazy(loader);
    cache.set(id, component);
  }
  return component;
}

/** Загружает код сцен заранее, чтобы переход не ждал сети. */
export function preloadScenes(ids: string[]): void {
  for (const id of ids) void loaders[id]?.();
}
