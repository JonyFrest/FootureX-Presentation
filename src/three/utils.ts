import * as THREE from 'three';

/** Детерминированный генератор случайных чисел — мир одинаков при каждой загрузке. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let glowTexture: THREE.Texture | null = null;

/** Мягкое радиальное свечение для спрайтов (создаётся один раз). */
export function getGlowTexture(): THREE.Texture {
  if (glowTexture) return glowTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(220,231,255,0.85)');
  g.addColorStop(0.45, 'rgba(37,147,250,0.32)');
  g.addColorStop(1, 'rgba(37,80,250,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  glowTexture = new THREE.CanvasTexture(canvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  return glowTexture;
}

export function glowMaterial(color: THREE.ColorRepresentation = '#8EB4FF', opacity = 1): THREE.SpriteMaterial {
  return new THREE.SpriteMaterial({
    map: getGlowTexture(),
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
}

/** Точки эллипса в плоскости XZ на высоте y. */
export function ellipsePoints(a: number, b: number, y: number, segments = 128): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * a, y, Math.sin(t) * b));
  }
  return pts;
}

/** Освобождает GPU-ресурсы объекта и всех его потомков. */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) material.forEach((m) => m.dispose());
    else material?.dispose?.();
  });
}

export const BRAND = {
  deep: new THREE.Color('#070A12'),
  primary: new THREE.Color('#2550FA'),
  secondary: new THREE.Color('#2593FA'),
  highlight: new THREE.Color('#8EB4FF'),
  ice: new THREE.Color('#DCE7FF'),
};
