import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32 } from './utils';

/**
 * FootureX City — процедурный город вокруг стадиона. Все здания — один InstancedMesh,
 * окна рисует шейдер (никаких текстур), поэтому это ~1 draw call.
 */
export function City({ count = 560, animate = true }: { count?: number; animate?: boolean }) {
  const { mesh, beacons } = useMemo(() => {
    const rand = mulberry32(2026);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.translate(0, 0.5, 0);
    const seeds = new Float32Array(count);
    const tops: number[] = [];

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFog: { value: new THREE.Color('#070A12') },
        uWin: { value: new THREE.Color('#2593FA') },
        uWin2: { value: new THREE.Color('#DCE7FF') },
        uEdge: { value: new THREE.Color('#2550FA') },
      },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        varying vec3 vLocal; varying vec3 vScale; varying vec3 vNormal; varying float vSeed; varying float vDist;
        void main() {
          vScale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
          vLocal = position; vNormal = normal; vSeed = aSeed;
          vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vDist = length(w.xyz - cameraPosition);
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec3 uFog; uniform vec3 uWin; uniform vec3 uWin2; uniform vec3 uEdge;
        varying vec3 vLocal; varying vec3 vScale; varying vec3 vNormal; varying float vSeed; varying float vDist;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main() {
          vec3 col = vec3(0.022, 0.034, 0.07);
          if (abs(vNormal.y) < 0.5) {
            vec2 uv = abs(vNormal.x) > 0.5
              ? vec2((vLocal.z + 0.5) * vScale.z, vLocal.y * vScale.y)
              : vec2((vLocal.x + 0.5) * vScale.x, vLocal.y * vScale.y);
            vec2 cellSize = vec2(1.7, 2.3);
            vec2 cell = floor(uv / cellSize);
            vec2 f = fract(uv / cellSize);
            float win = step(0.22, f.x) * step(f.x, 0.78) * step(0.28, f.y) * step(f.y, 0.78);
            float r = hash(cell + vSeed * 91.7);
            float lit = step(0.7, r) * (0.75 + 0.25 * sin(uTime * 0.3 + r * 50.0));
            vec3 wc = mix(uWin, uWin2, step(0.94, r));
            col += win * lit * wc * 0.85;
            // Светящаяся кромка крыши и мягкая подсветка снизу.
            col += uEdge * smoothstep(0.985, 1.0, vLocal.y) * 1.2;
            col += uEdge * 0.08 * (1.0 - vLocal.y);
          } else {
            col += uEdge * 0.25;
          }
          col = mix(col, uFog, smoothstep(140.0, 560.0, vDist));
          gl_FragColor = vec4(col, 1.0);
        }`,
    });

    const im = new THREE.InstancedMesh(geometry, material, count);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    let placed = 0;
    let guard = 0;
    while (placed < count && guard < count * 20) {
      guard++;
      const angle = rand() * Math.PI * 2;
      const radius = 112 + Math.pow(rand(), 0.85) * 240;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Улица-«проспект» на север для световой дороги этапов развития.
      if (Math.abs(x) < 9 && z < -40) continue;
      // Северный кластер — FootureX City: выше и плотнее.
      const north = Math.max(0, -z / radius);
      const cluster = Math.pow(north, 3);
      const near = 1 - THREE.MathUtils.clamp((radius - 112) / 240, 0, 1);
      const height = 5 + rand() * 16 + cluster * (20 + rand() * 55) * (0.4 + near * 0.6);
      const w = 4 + rand() * 7;
      const d = 4 + rand() * 7;
      q.setFromAxisAngle(up, Math.round(rand() * 4) * (Math.PI / 2) + (rand() - 0.5) * 0.1);
      m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(w, height, d));
      im.setMatrixAt(placed, m);
      seeds[placed] = rand();
      if (height > 48) tops.push(x, height + 1.5, z);
      placed++;
    }
    im.count = placed;
    geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
    im.instanceMatrix.needsUpdate = true;
    im.frustumCulled = false;

    // Маяки на крышах высоток.
    const beaconGeometry = new THREE.BufferGeometry();
    beaconGeometry.setAttribute('position', new THREE.Float32BufferAttribute(tops, 3));
    const beaconMaterial = new THREE.PointsMaterial({
      color: '#8EB4FF',
      size: 2.2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const b = new THREE.Points(beaconGeometry, beaconMaterial);
    return { mesh: im, beacons: b };
  }, [count]);

  useFrame((state, delta) => {
    if (!animate) return;
    (mesh.material as THREE.ShaderMaterial).uniforms.uTime.value += Math.min(delta, 0.1);
    (beacons.material as THREE.PointsMaterial).opacity = 0.55 + 0.4 * Math.sin(state.clock.elapsedTime * 1.4);
  });

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      beacons.geometry.dispose();
      (beacons.material as THREE.Material).dispose();
    },
    [mesh, beacons],
  );

  return (
    <>
      <primitive object={mesh} />
      <primitive object={beacons} />
    </>
  );
}
