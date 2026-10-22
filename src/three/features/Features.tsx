import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFeatureFade } from '../useFeatureFade';
import { DELIVERABLES, WORK_PACKAGES } from '@/data/project';
import { BRAND, disposeObject, ellipsePoints, glowMaterial, mulberry32 } from '../utils';

/**
 * Пространственные объекты, привязанные к сценам. Каждый проявляется только на своих
 * сценах (см. features в src/data/scenes.ts) и скрывается целиком, когда не нужен,
 * чтобы не тратить draw calls.
 */

type FadeTarget = { material: THREE.Material & { opacity: number }; base: number };

/** Собирает материалы группы и запоминает их базовую прозрачность. */
function collectFadeTargets(root: THREE.Object3D): FadeTarget[] {
  const list: FadeTarget[] = [];
  root.traverse((obj) => {
    const m = (obj as THREE.Mesh).material as (THREE.Material & { opacity: number }) | undefined;
    if (!m || Array.isArray(m)) return;
    m.transparent = true;
    const shader = m as unknown as THREE.ShaderMaterial;
    const base = shader.uniforms?.uOpacity ? 1 : m.opacity;
    list.push({ material: m, base });
  });
  return list;
}

function applyFade(root: THREE.Object3D, targets: FadeTarget[], fade: number): void {
  root.visible = fade > 0.01;
  if (!root.visible) return;
  for (const t of targets) {
    const shader = t.material as unknown as THREE.ShaderMaterial;
    if (shader.uniforms?.uOpacity) shader.uniforms.uOpacity.value = fade;
    else t.material.opacity = t.base * fade;
  }
}

function useGroup(build: () => THREE.Group) {
  const group = useMemo(build, []); // eslint-disable-line react-hooks/exhaustive-deps
  const targets = useMemo(() => collectFadeTargets(group), [group]);
  useEffect(() => () => disposeObject(group), [group]);
  return { group, targets };
}

const lineMaterial = (color: THREE.Color, opacity: number) =>
  new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });

function fresnelSphere(radius: number, color: THREE.Color, intensity = 1): THREE.Mesh {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: color.clone() }, uOpacity: { value: 1 }, uIntensity: { value: intensity } },
    vertexShader: /* glsl */ `
      varying vec3 vNormal; varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity; uniform float uIntensity;
      varying vec3 vNormal; varying vec3 vView;
      void main() {
        float f = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.2);
        gl_FragColor = vec4(uColor * (0.25 + f * 1.4) * uIntensity, (0.08 + f * 0.85) * uOpacity);
      }`,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), material);
}

function sprite(color: string, scale: number, opacity = 1, position?: [number, number, number]): THREE.Sprite {
  const s = new THREE.Sprite(glowMaterial(color, opacity));
  s.scale.setScalar(scale);
  if (position) s.position.set(...position);
  return s;
}

/* ------------------------------------------------------------------ */
/** Голографический мяч FootureX над центром поля (сцены 06, 08, 15). */
export function HoloBall({ animate }: { animate: boolean }) {
  const fade = useFeatureFade('ball');
  const spin = useRef<THREE.Group>(null!);
  const { group, targets } = useGroup(() => {
    const g = new THREE.Group();
    g.position.set(0, 8, 0);
    const inner = new THREE.Group();
    const ico = new THREE.IcosahedronGeometry(3.2, 1);
    inner.add(new THREE.LineSegments(new THREE.EdgesGeometry(ico), lineMaterial(BRAND.highlight, 0.9)));
    ico.dispose();
    const dual = new THREE.DodecahedronGeometry(2.6, 0);
    inner.add(new THREE.LineSegments(new THREE.EdgesGeometry(dual), lineMaterial(BRAND.secondary, 0.7)));
    dual.dispose();
    inner.add(fresnelSphere(3.05, BRAND.secondary, 0.9));
    g.add(inner);
    for (const [r, tilt] of [
      [5.2, 0.35],
      [6.4, -0.6],
    ] as const) {
      const ring = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(ellipsePoints(r, r, 0, 128).slice(0, -1)),
        lineMaterial(BRAND.secondary, 0.55),
      );
      ring.rotation.set(Math.PI / 2 + tilt, tilt * 0.5, 0);
      g.add(ring);
    }
    g.add(sprite('#2593FA', 18, 0.55));
    g.add(sprite('#DCE7FF', 5, 0.5));
    // Луч света от поля к мячу.
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 2.2, 8, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: BRAND.primary, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    );
    beam.position.y = -4;
    g.add(beam);
    return g;
  });
  useEffect(() => {
    spin.current = group.children[0] as THREE.Group;
  }, [group]);

  useFrame((state, delta) => {
    applyFade(group, targets, fade.current);
    if (!group.visible || !animate) return;
    const d = Math.min(delta, 0.1);
    spin.current.rotation.y += d * 0.35;
    spin.current.rotation.x += d * 0.08;
    group.position.y = 8 + Math.sin(state.clock.elapsedTime * 0.8) * 0.35;
    group.children[1].rotation.z += d * 0.2;
    group.children[2].rotation.z -= d * 0.14;
  });
  return <primitive object={group} />;
}

/* ------------------------------------------------------------------ */
/** Кольцо жизненного цикла проекта: пять групп процессов над стадионом (сцены 04, 14). */
export function LifecycleRing({ animate }: { animate: boolean }) {
  const fade = useFeatureFade('ring');
  const { group, targets } = useGroup(() => {
    const g = new THREE.Group();
    g.position.set(0, 14, 0);
    const r = 17;
    g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ellipsePoints(r, r, 0, 160).slice(0, -1)), lineMaterial(BRAND.secondary, 0.7)));
    g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ellipsePoints(r - 2.2, r - 2.2, 0, 160).slice(0, -1)), lineMaterial(BRAND.primary, 0.35)));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const node = new THREE.Group();
      node.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      node.add(new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 14), new THREE.MeshBasicMaterial({ color: BRAND.ice, transparent: true })));
      node.add(sprite('#2593FA', 7, 0.8));
      g.add(node);
    }
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(r - 2.4, 64),
      new THREE.MeshBasicMaterial({ color: BRAND.primary, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide }),
    );
    disc.rotation.x = -Math.PI / 2;
    g.add(disc);
    return g;
  });
  useFrame((_, delta) => {
    applyFade(group, targets, fade.current);
    if (group.visible && animate) group.rotation.y += Math.min(delta, 0.1) * 0.12;
  });
  return <primitive object={group} />;
}

/* ------------------------------------------------------------------ */
/** Потоки: вход проекта → спринты → результат (сцена 05). */
export function DataFlow({ animate }: { animate: boolean }) {
  const fade = useFeatureFade('flow');
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: BRAND.secondary.clone() }, uHot: { value: BRAND.ice.clone() } },
        vertexShader: /* glsl */ `
          attribute float aT; attribute float aSeed;
          varying float vT; varying float vSeed;
          void main() { vT = aT; vSeed = aSeed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uOpacity; uniform vec3 uColor; uniform vec3 uHot;
          varying float vT; varying float vSeed;
          void main() {
            float pulse = smoothstep(0.86, 1.0, fract(vT * 3.0 - uTime * 0.35 + vSeed));
            vec3 c = mix(uColor, uHot, pulse);
            gl_FragColor = vec4(c, (0.4 + pulse * 1.0) * uOpacity);
          }`,
      }),
    [],
  );
  const { group, targets } = useGroup(() => {
    const g = new THREE.Group();
    const rand = mulberry32(5);
    for (let i = 0; i < 16; i++) {
      const startAngle = (i / 16) * Math.PI * 2;
      const start = new THREE.Vector3(Math.cos(startAngle) * 12, 16, Math.sin(startAngle) * 9);
      const end = new THREE.Vector3((rand() - 0.5) * 120, 30 + rand() * 30, -110 - rand() * 90);
      const mid = start.clone().lerp(end, 0.5);
      mid.y += 28 + rand() * 18;
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const pts = curve.getPoints(120);
      const geometry = new THREE.BufferGeometry().setFromPoints(pts);
      geometry.setAttribute('aT', new THREE.Float32BufferAttribute(pts.map((_, k) => k / (pts.length - 1)), 1));
      geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(pts.map(() => i / 16), 1));
      g.add(new THREE.Line(geometry, material));
    }
    g.add(sprite('#2593FA', 30, 0.5, [0, 16, 0]));
    return g;
  });
  useFrame((_, delta) => {
    applyFade(group, targets, fade.current);
    if (group.visible && animate) material.uniforms.uTime.value += Math.min(delta, 0.1);
  });
  return <primitive object={group} />;
}

/* ------------------------------------------------------------------ */
/** Световая дорога этапов и вех на север, к FootureX City (сцены 07, 11). */
export function LightPath({ animate }: { animate: boolean }) {
  const fade = useFeatureFade('path');
  const roadMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: BRAND.secondary.clone() } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uOpacity; uniform vec3 uColor; varying vec2 vUv;
          void main() {
            float edge = smoothstep(0.08, 0.0, vUv.x) + smoothstep(0.92, 1.0, vUv.x);
            float chevron = smoothstep(0.75, 1.0, fract(vUv.y * 26.0 - abs(vUv.x - 0.5) * 2.0 - uTime * 0.6));
            float center = (1.0 - smoothstep(0.0, 0.18, abs(vUv.x - 0.5))) * chevron;
            float fadeEnds = smoothstep(0.0, 0.05, vUv.y) * (1.0 - smoothstep(0.85, 1.0, vUv.y));
            gl_FragColor = vec4(uColor, (edge * 0.8 + center * 0.6 + 0.05) * fadeEnds * uOpacity);
          }`,
      }),
    [],
  );
  const { group, targets } = useGroup(() => {
    const g = new THREE.Group();
    const length = 190;
    const road = new THREE.Mesh(new THREE.PlaneGeometry(7, length), roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.3, -38 - length / 2);
    g.add(road);
    // Три вехи — три этапа (Game, Academy + FC, Stadium + City).
    [-52, -112, -176].forEach((z, i) => {
      const h = 22 + i * 14;
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 1.6, h, 20, 1, true),
        new THREE.MeshBasicMaterial({ color: i === 0 ? BRAND.ice : BRAND.secondary, transparent: true, opacity: i === 0 ? 0.35 : 0.18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
      );
      beam.position.set(0, h / 2, z);
      g.add(beam);
      const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ellipsePoints(4.5, 4.5, 0.4, 64).slice(0, -1)), lineMaterial(BRAND.highlight, i === 0 ? 0.9 : 0.45));
      ring.position.z = z;
      g.add(ring);
      g.add(sprite(i === 0 ? '#DCE7FF' : '#2593FA', 10, i === 0 ? 0.9 : 0.6, [0, h + 1, z]));
    });
    return g;
  });
  useFrame((_, delta) => {
    applyFade(group, targets, fade.current);
    if (group.visible && animate) roadMaterial.uniforms.uTime.value += Math.min(delta, 0.1);
  });
  return <primitive object={group} />;
}

/* ------------------------------------------------------------------ */
/** Ярусы иерархии: проект → 4 результата → пакеты работ (сцена 10). */
export function WbsTower({ animate }: { animate: boolean }) {
  const fade = useFeatureFade('tower');
  const { group, targets } = useGroup(() => {
    const g = new THREE.Group();
    g.position.set(0, 0, 0);
    const hex = (radius: number, height: number) => {
      const geo = new THREE.CylinderGeometry(radius, radius, height, 6);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMaterial(BRAND.highlight, 0.85));
      const body = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: BRAND.primary, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending }));
      const node = new THREE.Group();
      node.add(body, edges);
      return node;
    };
    const top = hex(2.6, 1.2);
    top.position.set(0, 26, 0);
    g.add(top, sprite('#DCE7FF', 9, 0.8, [0, 26, 0]));
    const links: number[] = [];
    // Проект → результаты WBS → пакеты работ (сколько пакетов у каждого результата).
    const tiers = DELIVERABLES.map((d) => WORK_PACKAGES.filter((p) => p.deliverable === d.id).length);
    tiers.forEach((count, i) => {
      const a = (i / tiers.length) * Math.PI * 2 + Math.PI / 4;
      const p = new THREE.Vector3(Math.cos(a) * 10, 18, Math.sin(a) * 10);
      const n = hex(1.7, 0.8);
      n.position.copy(p);
      g.add(n);
      links.push(0, 25.4, 0, p.x, p.y + 0.4, p.z);
      const spread = Math.min(0.32, 1.3 / count);
      for (let j = 0; j < count; j++) {
        const b = a + (j - (count - 1) / 2) * spread;
        const q = new THREE.Vector3(Math.cos(b) * 17, 10, Math.sin(b) * 17);
        const s = hex(0.9, 0.5);
        s.position.copy(q);
        g.add(s);
        links.push(p.x, p.y - 0.4, p.z, q.x, q.y + 0.25, q.z);
      }
    });
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(links, 3));
    g.add(new THREE.LineSegments(lg, lineMaterial(BRAND.secondary, 0.6)));
    return g;
  });
  useFrame((_, delta) => {
    applyFade(group, targets, fade.current);
    if (group.visible && animate) group.rotation.y += Math.min(delta, 0.1) * 0.08;
  });
  return <primitive object={group} />;
}

/* ------------------------------------------------------------------ */
/** 3D-столбцы данных на поле (сцена 12): «вырастают» при появлении. */
export function DataPillars() {
  const fade = useFeatureFade('pillars', 1.6);
  const { mesh, heights } = useMemo(() => {
    const cols = 8;
    const rows = 4;
    const geometry = new THREE.BoxGeometry(2.6, 1, 2.6);
    geometry.translate(0, 0.5, 0);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uOpacity: { value: 0 }, uLow: { value: BRAND.primary.clone() }, uHigh: { value: BRAND.ice.clone() } },
      vertexShader: /* glsl */ `
        varying float vY; varying vec3 vN;
        void main() { vY = position.y; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uOpacity; uniform vec3 uLow; uniform vec3 uHigh; varying float vY; varying vec3 vN;
        void main() {
          vec3 c = mix(uLow, uHigh, pow(vY, 3.0));
          float top = step(0.5, vN.y);
          gl_FragColor = vec4(c, (0.18 + vY * 0.35 + top * 0.5) * uOpacity);
        }`,
    });
    const im = new THREE.InstancedMesh(geometry, material, cols * rows);
    const rand = mulberry32(14);
    const hs: number[] = [];
    for (let i = 0; i < cols * rows; i++) hs.push(3 + Math.pow(rand(), 1.6) * 16);
    return { mesh: im, heights: hs, cols, rows };
  }, []);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const f = fade.current;
    mesh.visible = f > 0.01;
    (mesh.material as THREE.ShaderMaterial).uniforms.uOpacity.value = f;
    if (!mesh.visible) return;
    const eased = 1 - Math.pow(1 - f, 3);
    for (let i = 0; i < heights.length; i++) {
      const c = i % 8;
      const r = Math.floor(i / 8);
      p.set(-15.75 + c * 4.5, 0.1, -6.75 + r * 4.5);
      const stagger = THREE.MathUtils.clamp(eased * 1.4 - (c + r) * 0.04, 0.02, 1);
      s.set(1, heights[i] * stagger, 1);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  useEffect(() => () => {
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  }, [mesh]);
  return <primitive object={mesh} />;
}

/* ------------------------------------------------------------------ */
/** Кольца-фильтры с частицами: риски проходят через меры реагирования (сцена 13). */
export function RiskFilters({ animate }: { animate: boolean }) {
  const fade = useFeatureFade('funnel');
  const particleMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: BRAND.ice.clone() } },
        vertexShader: /* glsl */ `
          uniform float uTime; attribute float aSeed; varying float vA;
          void main() {
            float t = fract(uTime * 0.08 + aSeed);
            float y = mix(30.0, 6.0, t);
            float r = mix(13.0, 1.2, pow(t, 0.8)) * (0.4 + fract(aSeed * 7.3) * 0.6);
            float a = aSeed * 50.0 + uTime * 0.4;
            vec3 p = vec3(cos(a) * r, y, sin(a) * r);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = 120.0 / -mv.z * 1.6;
            vA = smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.85, 1.0, t)) * (step(0.82, fract(aSeed * 13.1)) * 0.7 + 0.3);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uOpacity; varying float vA;
          void main() { float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vA * uOpacity); }`,
      }),
    [],
  );
  const { group, targets } = useGroup(() => {
    const g = new THREE.Group();
    const radii = [15, 11, 7.8, 5.2, 3.2];
    radii.forEach((r, i) => {
      const y = 31 - i * 6;
      const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ellipsePoints(r, r, y, 96).slice(0, -1)), lineMaterial(i === 4 ? BRAND.ice : BRAND.secondary, 0.85));
      g.add(ring);
      const disc = new THREE.Mesh(
        new THREE.RingGeometry(r * 0.82, r, 64),
        new THREE.MeshBasicMaterial({ color: BRAND.secondary, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = y;
      g.add(disc);
    });
    const count = 260;
    const seeds = new Float32Array(count);
    const rand = mulberry32(11);
    for (let i = 0; i < count; i++) seeds[i] = rand();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    const pts = new THREE.Points(geo, particleMaterial);
    pts.frustumCulled = false;
    g.add(pts);
    g.add(sprite('#DCE7FF', 10, 0.7, [0, 6, 0]));
    return g;
  });
  useFrame((_, delta) => {
    applyFade(group, targets, fade.current);
    if (group.visible && animate) particleMaterial.uniforms.uTime.value += Math.min(delta, 0.1);
  });
  return <primitive object={group} />;
}

/* ------------------------------------------------------------------ */
/** Ядро и четыре орбиты команды проекта (сцена 09). */
export function TeamOrbits({ animate }: { animate: boolean }) {
  const fade = useFeatureFade('orbit');
  const { group, targets } = useGroup(() => {
    const g = new THREE.Group();
    g.position.set(0, 13, 0);
    g.add(fresnelSphere(3, BRAND.secondary, 1.1));
    g.add(sprite('#2593FA', 16, 0.7));
    const tilts: [number, number][] = [
      [0.25, 0],
      [-0.5, 0.6],
      [0.9, -0.4],
      [-1.1, 1.2],
    ];
    tilts.forEach(([tx, tz], i) => {
      const r = 8 + i * 2.6;
      const orbit = new THREE.Group();
      orbit.rotation.set(tx, 0, tz);
      orbit.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ellipsePoints(r, r * 0.9, 0, 128).slice(0, -1)), lineMaterial(BRAND.highlight, 0.8)));
      const sat = new THREE.Group();
      sat.add(new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), new THREE.MeshBasicMaterial({ color: BRAND.ice, transparent: true })));
      sat.add(sprite('#8EB4FF', 5, 0.8));
      sat.position.set(r, 0, 0);
      sat.userData = { r, speed: 0.25 - i * 0.04, phase: i * 1.7 };
      orbit.add(sat);
      g.add(orbit);
    });
    return g;
  });
  useFrame((state) => {
    applyFade(group, targets, fade.current);
    if (!group.visible) return;
    const t = animate ? state.clock.elapsedTime : 0;
    for (let i = 2; i < group.children.length; i++) {
      const sat = group.children[i].children[1];
      const { r, speed, phase } = sat.userData as { r: number; speed: number; phase: number };
      sat.position.set(Math.cos(t * speed + phase) * r, 0, Math.sin(t * speed + phase) * r * 0.9);
    }
  });
  return <primitive object={group} />;
}
