/** Проверка поддержки WebGL. Без WebGL показывается CSS-фон (FallbackBackdrop). */
export function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null;
    const ok = Boolean(gl);
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

/** ?lite=1 принудительно отключает WebGL (слабый проектор/ноутбук). */
export function liteModeRequested(): boolean {
  return new URLSearchParams(window.location.search).has('lite');
}
