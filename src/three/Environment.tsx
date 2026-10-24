import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32 } from './utils';

const FOG = new THREE.Color('#070A12');

/** Небо: тёмно-синий купол с мягким свечением у горизонта. Один draw call. */
export function Sky() {
  const mesh = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: new THREE.Color('#03050b') },
        uHorizon: { value: new THREE.Color('#0b1638') },
        uGlow: { value: new THREE.Color('#2550FA') },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uGlow;
        varying vec3 vDir;
        void main() {
          float h = vDir.y;
          vec3 col = mix(uHorizon, uTop, smoothstep(-0.02, 0.55, h));
          col += uGlow * 0.22 * exp(-abs(h - 0.02) * 14.0);
          // Более яркое зарево в стороне «FootureX City» (север, -Z).
          float north = max(0.0, -vDir.z);
          col += uGlow * 0.12 * north * exp(-abs(h) * 6.0);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    return new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), material);
  }, []);
  useEffect(() => () => {
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  }, [mesh]);
  return <primitive object={mesh} />;
}

/** Бесконечная сетка-пол с затуханием по дальности и свечением вокруг стадиона. */
export function Ground() {
  const mesh = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      fog: false,
      uniforms: {
        uLine: { value: new THREE.Color('#2593FA') },
        uBase: { value: new THREE.Color('#05070d') },
        uGlow: { value: new THREE.Color('#2550FA') },
        uFog: { value: FOG },
      },
      vertexShader: /* glsl */ `
        varying vec3 vWorld;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vWorld = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uLine; uniform vec3 uBase; uniform vec3 uGlow; uniform vec3 uFog;
        varying vec3 vWorld;
        float grid(vec2 p, float size, float width) {
          vec2 c = p / size;
          vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
          return 1.0 - min(min(g.x, g.y) / width, 1.0);
        }
        void main() {
          float camDist = length(vWorld - cameraPosition);
          float minor = grid(vWorld.xz, 8.0, 1.0);
          float major = grid(vWorld.xz, 40.0, 1.2);
          float near = 1.0 - smoothstep(60.0, 380.0, camDist);
          float d = length(vWorld.xz);
          vec3 col = uBase;
          col += uLine * (minor * 0.10 + major * 0.28) * near;
          col += uGlow * 0.30 * exp(-(d * d) / (2.0 * 70.0 * 70.0));
          col = mix(col, uFog, smoothstep(220.0, 620.0, camDist));
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const geometry = new THREE.PlaneGeometry(1600, 1600, 1, 1);
    geometry.rotateX(-Math.PI / 2);
    return new THREE.Mesh(geometry, material);
  }, []);
  useEffect(() => () => {
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  }, [mesh]);
  return <primitive object={mesh} />;
}

/** Медленно дрейфующая «пыль света» — глубина пространства. Анимация целиком в шейдере. */
export function Particles({ count = 1600, animate = true }: { count?: number; animate?: boolean }) {
  const points = useMemo(() => {
    const rand = mulberry32(7);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * 420;
      positions[i * 3 + 1] = 2 + rand() * 110;
      positions[i * 3 + 2] = (rand() - 0.5) * 420;
      seeds[i] = rand();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.75) },
        uColor: { value: new THREE.Color('#8EB4FF') },
      },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uPixelRatio;
        attribute float aSeed;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.y = mod(p.y + uTime * (0.6 + aSeed * 1.2), 112.0) + 2.0;
          p.x += sin(uTime * 0.2 + aSeed * 40.0) * 1.5;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float size = (0.6 + aSeed * 1.4) * uPixelRatio;
          gl_PointSize = size * (120.0 / -mv.z);
          vAlpha = (0.25 + 0.75 * fract(aSeed * 13.7)) * (1.0 - smoothstep(120.0, 360.0, -mv.z));
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * vAlpha;
          gl_FragColor = vec4(uColor, a * 0.55);
        }`,
    });
    const p = new THREE.Points(geometry, material);
    p.frustumCulled = false;
    return p;
  }, [count]);

  useFrame((state, delta) => {
    const uniforms = (points.material as THREE.ShaderMaterial).uniforms;
    // Размер точек — по текущей плотности пикселей (её меняет AdaptiveQuality).
    uniforms.uPixelRatio.value = state.viewport.dpr;
    if (!animate) return;
    uniforms.uTime.value += Math.min(delta, 0.1);
  });
  useEffect(() => () => {
    points.geometry.dispose();
    (points.material as THREE.Material).dispose();
  }, [points]);
  return <primitive object={points} />;
}
