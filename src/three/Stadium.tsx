import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BRAND, disposeObject, ellipsePoints, glowMaterial } from './utils';

/** Габариты стадиона (условные метры). */
const PITCH = { w: 44, h: 28 };
const BOWL = { innerA: 29, innerB: 20.5, outerA: 46, outerB: 35, innerY: 1.2, outerY: 17 };

function pitchMarkings(): THREE.LineSegments {
  const hw = PITCH.w / 2;
  const hh = PITCH.h / 2;
  const s: number[] = [];
  const seg = (x1: number, z1: number, x2: number, z2: number) => s.push(x1, 0, z1, x2, 0, z2);
  const rect = (x1: number, z1: number, x2: number, z2: number) => {
    seg(x1, z1, x2, z1);
    seg(x2, z1, x2, z2);
    seg(x2, z2, x1, z2);
    seg(x1, z2, x1, z1);
  };
  rect(-hw, -hh, hw, hh);
  seg(0, -hh, 0, hh);
  const circle = (cx: number, r: number, from = 0, to = Math.PI * 2, n = 48) => {
    for (let i = 0; i < n; i++) {
      const a1 = from + ((to - from) * i) / n;
      const a2 = from + ((to - from) * (i + 1)) / n;
      seg(cx + Math.cos(a1) * r, Math.sin(a1) * r, cx + Math.cos(a2) * r, Math.sin(a2) * r);
    }
  };
  circle(0, 3.9);
  // Штрафные и вратарские площади (пропорции поля 105×68).
  for (const side of [-1, 1]) {
    const x0 = side * hw;
    rect(x0, -8.45, x0 - side * 6.9, 8.45);
    rect(x0, -3.85, x0 - side * 2.3, 3.85);
    circle(x0 - side * 4.6, 3.9, side > 0 ? Math.PI * 0.72 : -Math.PI * 0.28, side > 0 ? Math.PI * 1.28 : Math.PI * 0.28, 16);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(s, 3));
  const material = new THREE.LineBasicMaterial({ color: BRAND.ice, transparent: true, opacity: 0.55, depthWrite: false });
  const lines = new THREE.LineSegments(geometry, material);
  lines.position.y = 0.08;
  return lines;
}

function pitchSurface(): THREE.Mesh {
  const material = new THREE.ShaderMaterial({
    uniforms: { uA: { value: new THREE.Color('#06112a') }, uB: { value: new THREE.Color('#081636') } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uA; uniform vec3 uB; varying vec2 vUv;
      void main() {
        float stripe = step(0.5, fract(vUv.x * 10.0));
        vec3 col = mix(uA, uB, stripe);
        float v = 1.0 - length((vUv - 0.5) * vec2(1.1, 1.4));
        col += vec3(0.08, 0.16, 0.5) * smoothstep(0.1, 0.9, v) * 0.6;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const geometry = new THREE.PlaneGeometry(PITCH.w + 4, PITCH.h + 4);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 0.04;
  return mesh;
}

/** Чаша трибун: процедурная поверхность с ярусами и «огоньками» зрителей. */
function bowl(): THREE.Mesh {
  const segments = 160;
  const rows = 14;
  const positions: number[] = [];
  const tiers: number[] = [];
  const angles: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j <= rows; j++) {
    const t = j / rows;
    const a = THREE.MathUtils.lerp(BOWL.innerA, BOWL.outerA, t);
    const b = THREE.MathUtils.lerp(BOWL.innerB, BOWL.outerB, t);
    const y = THREE.MathUtils.lerp(BOWL.innerY, BOWL.outerY, Math.pow(t, 1.15));
    for (let i = 0; i <= segments; i++) {
      const th = (i / segments) * Math.PI * 2;
      positions.push(Math.cos(th) * a, y, Math.sin(th) * b);
      tiers.push(t);
      angles.push(i / segments);
    }
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < segments; i++) {
      const a = j * (segments + 1) + i;
      const b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aTier', new THREE.Float32BufferAttribute(tiers, 1));
  geometry.setAttribute('aAngle', new THREE.Float32BufferAttribute(angles, 1));
  geometry.setIndex(indices);
  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uBase: { value: new THREE.Color('#081127') },
      uLine: { value: BRAND.secondary.clone() },
      uSeat: { value: BRAND.highlight.clone() },
    },
    vertexShader: /* glsl */ `
      attribute float aTier; attribute float aAngle;
      varying float vTier; varying float vAngle; varying float vDist;
      void main() {
        vTier = aTier; vAngle = aAngle;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vDist = length(w.xyz - cameraPosition);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uBase; uniform vec3 uLine; uniform vec3 uSeat;
      varying float vTier; varying float vAngle; varying float vDist;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        float rowsF = 14.0;
        float r = fract(vTier * rowsF);
        float tierLine = smoothstep(0.08, 0.0, r) + smoothstep(0.92, 1.0, r);
        vec2 grid = vec2(vAngle * 900.0, vTier * rowsF * 4.0);
        vec2 cell = floor(grid);
        vec2 f = fract(grid) - 0.5;
        float h = hash(cell);
        float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + h * 1.4) + h * 40.0);
        float dotMask = 1.0 - smoothstep(0.18, 0.32, length(f));
        float seat = step(0.9, h) * twinkle * dotMask;
        vec3 col = uBase + uBase * vTier * 0.8;
        col += uLine * tierLine * 0.35;
        col += uSeat * seat * 0.55;
        // Верхняя кромка чаши светится.
        col += uLine * smoothstep(0.93, 1.0, vTier) * 0.7;
        col = mix(col, vec3(0.027, 0.039, 0.07), smoothstep(160.0, 520.0, vDist));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  return new THREE.Mesh(geometry, material);
}

function ellipseLine(a: number, b: number, y: number, color: THREE.Color, opacity: number): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints(ellipsePoints(a, b, y, 160));
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
  return new THREE.Line(geometry, material);
}

/** Светящийся «ореол» крыши. */
function roofHalo(): THREE.Mesh {
  const geometry = new THREE.RingGeometry(1, 1.13, 160, 1);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: BRAND.secondary.clone() } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; varying vec2 vUv;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float edge = smoothstep(0.885, 0.9, r) * (1.0 - smoothstep(0.9, 1.0, r));
        float a = 0.08 + edge * 0.5;
        gl_FragColor = vec4(uColor, a);
      }`,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(BOWL.outerA - 1, 1, BOWL.outerB - 1);
  mesh.position.y = BOWL.outerY + 2.2;
  return mesh;
}

/** Светящаяся оболочка фасада: полупрозрачная «кожа» с тонкими световыми линиями. */
function facadeSkin(): THREE.Mesh {
  const segments = 160;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const a = BOWL.outerA + 0.7;
  const b = BOWL.outerB + 0.7;
  const top = BOWL.outerY + 2.2;
  for (let j = 0; j <= 1; j++) {
    for (let i = 0; i <= segments; i++) {
      const th = (i / segments) * Math.PI * 2;
      // Лёгкий наклон наружу кверху — силуэт «чаши».
      const k = 1 + j * 0.035;
      positions.push(Math.cos(th) * a * k, j * top, Math.sin(th) * b * k);
      uvs.push(i / segments, j);
    }
  }
  for (let i = 0; i < segments; i++) {
    const p = i;
    const q = i + segments + 1;
    indices.push(p, q, p + 1, q, q + 1, p + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uLine: { value: BRAND.secondary.clone() }, uBase: { value: new THREE.Color('#0a1634') } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying float vDist;
      void main() {
        vUv = uv;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vDist = length(w.xyz - cameraPosition);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uLine; uniform vec3 uBase; varying vec2 vUv; varying float vDist;
      void main() {
        float cols = 96.0;
        float x = vUv.x * cols;
        // Диагональная сетка фасада (ромбы), толщина линий не зависит от расстояния.
        float d1 = abs(fract(x + vUv.y * 6.0) - 0.5);
        float d2 = abs(fract(x - vUv.y * 6.0) - 0.5);
        float w1 = fwidth(x + vUv.y * 6.0);
        float lines = max(1.0 - smoothstep(0.0, w1 * 1.2, 0.5 - d1), 1.0 - smoothstep(0.0, w1 * 1.2, 0.5 - d2));
        float band = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.9, 1.0, vUv.y));
        vec3 col = uBase * (0.6 + vUv.y * 0.8) + uLine * lines * 0.55 * band;
        col += uLine * smoothstep(0.96, 1.0, vUv.y) * 0.9;
        float alpha = 0.55 + lines * 0.3;
        col = mix(col, vec3(0.027, 0.039, 0.07), smoothstep(200.0, 560.0, vDist));
        gl_FragColor = vec4(col, alpha);
      }`,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 2;
  return mesh;
}

/**
 * Мачты освещения с конусами света. lite (телефон): у конуса рисуются только внешние грани
 * с удвоенной яркостью — при аддитивном смешивании вид тот же, а заливка пикселей вдвое меньше.
 */
function floodlights(lite: boolean): THREE.Group {
  const group = new THREE.Group();
  const corners: [number, number][] = [
    [-39, -29],
    [39, -29],
    [-39, 29],
    [39, 29],
  ];
  const coneMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: lite ? THREE.FrontSide : THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: BRAND.highlight.clone() }, uAlpha: { value: lite ? 0.14 : 0.07 } },
    vertexShader: /* glsl */ `
      varying float vH;
      void main() { vH = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uAlpha; varying float vH;
      void main() { gl_FragColor = vec4(uColor, pow(vH, 2.2) * uAlpha); }`,
  });
  const mastMaterial = new THREE.MeshBasicMaterial({ color: '#1a2b57' });
  const mastGeometry = new THREE.CylinderGeometry(0.25, 0.45, 30, 8);
  mastGeometry.translate(0, 15, 0);
  for (const [x, z] of corners) {
    const mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(x, 0, z);
    group.add(mast);

    const head = new THREE.Vector3(x * 0.98, 30.5, z * 0.98);
    const glow = new THREE.Sprite(glowMaterial('#DCE7FF', 0.95));
    glow.position.copy(head);
    glow.scale.setScalar(9);
    group.add(glow);
    const halo = new THREE.Sprite(glowMaterial('#2593FA', 0.55));
    halo.position.copy(head);
    halo.scale.setScalar(26);
    group.add(halo);

    // Конус света: вершина у прожектора, основание — на поле.
    const target = new THREE.Vector3(x * 0.25, 0, z * 0.25);
    const length = head.distanceTo(target);
    const coneGeometry = new THREE.ConeGeometry(11, length, 32, 1, true);
    coneGeometry.translate(0, -length / 2, 0);
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.copy(head);
    const dir = target.clone().sub(head).normalize();
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
    group.add(cone);
  }
  return group;
}

/** Футуристический стадион FootureX в фирменном синем освещении. lite — облегчённый вариант для телефонов. */
export function Stadium({ animate = true, lite = false }: { animate?: boolean; lite?: boolean }) {
  const { group, bowlMesh } = useMemo(() => {
    const g = new THREE.Group();
    g.add(pitchSurface());
    g.add(pitchMarkings());
    const b = bowl();
    g.add(b);
    g.add(ellipseLine(BOWL.innerA - 0.3, BOWL.innerB - 0.3, BOWL.innerY + 0.1, BRAND.secondary, 0.8));
    g.add(ellipseLine(BOWL.outerA + 0.2, BOWL.outerB + 0.2, BOWL.outerY + 0.05, BRAND.highlight, 0.9));
    g.add(ellipseLine(BOWL.outerA + 0.6, BOWL.outerB + 0.6, BOWL.outerY + 2.2, BRAND.secondary, 0.6));
    g.add(ellipseLine(BOWL.outerA + 0.6, BOWL.outerB + 0.6, 0.15, BRAND.primary, 0.7));
    g.add(roofHalo());
    g.add(facadeSkin());
    g.add(floodlights(lite));
    // Мягкое свечение над полем.
    const haze = new THREE.Sprite(glowMaterial('#2550FA', 0.35));
    haze.position.set(0, 6, 0);
    haze.scale.set(90, 40, 1);
    g.add(haze);
    return { group: g, bowlMesh: b };
  }, [lite]);

  useFrame((_, delta) => {
    if (!animate) return;
    (bowlMesh.material as THREE.ShaderMaterial).uniforms.uTime.value += Math.min(delta, 0.1);
  });
  useEffect(() => () => disposeObject(group), [group]);

  return <primitive object={group} />;
}
