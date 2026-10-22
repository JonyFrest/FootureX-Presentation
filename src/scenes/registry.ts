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
  model: () => import('./Scene05Model'),
  about: () => import('./Scene06About'),
  roadmap: () => import('./Scene07Roadmap'),
  structure: () => import('./Scene08Structure'),
  workforce: () => import('./Scene09Workforce'),
  payroll: () => import('./Scene10Payroll'),
  recruitment: () => import('./Scene11Recruitment'),
  onboarding: () => import('./Scene12Onboarding'),
  kpi: () => import('./Scene13Kpi'),
  retention: () => import('./Scene14Retention'),
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
