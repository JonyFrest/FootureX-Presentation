/**
 * Минимальный генератор QR-кода (ISO/IEC 18004) без зависимостей: байтовый режим,
 * уровень коррекции M, версии 1–10 (до 213 байт — с запасом для ссылки на пульт).
 * Алгоритм повторяет эталонную реализацию Project Nayuki (MIT).
 * Проверка: node scripts/check-qr.mjs.
 */

/** Кодовых слов коррекции на блок (уровень M), индекс — версия. */
const ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
/** Число блоков коррекции (уровень M), индекс — версия. */
const ECC_BLOCKS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
/** Биты уровня коррекции в строке формата: M = 0b00. */
const ECL_FORMAT_BITS = 0;
export const MAX_VERSION = 10;

export interface QrMatrix {
  size: number;
  version: number;
  mask: number;
  /** modules[y][x] === true — тёмный модуль. */
  modules: boolean[][];
}

const getBit = (value: number, i: number) => ((value >>> i) & 1) !== 0;

/** Число модулей под данные и коррекцию (без служебных узоров), бит. */
export function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

/** Ёмкость данных версии (уровень M), кодовых слов. */
export function dataCodewords(version: number): number {
  return Math.floor(rawDataModules(version) / 8) - ECC_PER_BLOCK[version] * ECC_BLOCKS[version];
}

export function eccLayout(version: number): { blocks: number; eccPerBlock: number } {
  return { blocks: ECC_BLOCKS[version], eccPerBlock: ECC_PER_BLOCK[version] };
}

// --- Поле Галуа GF(2^8) по модулю x^8 + x^4 + x^3 + x^2 + 1 ---

export function gfMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(degree: number): number[] {
  const result: number[] = new Array(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

function rsRemainder(data: readonly number[], divisor: readonly number[]): number[] {
  const result: number[] = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => (result[i] ^= gfMultiply(coef, factor)));
  }
  return result;
}

// --- Кодирование данных ---

function utf8(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

function pickVersion(byteLength: number): number {
  for (let v = 1; v <= MAX_VERSION; v++) {
    const countBits = v <= 9 ? 8 : 16;
    if (4 + countBits + byteLength * 8 <= dataCodewords(v) * 8) return v;
  }
  throw new RangeError(`QR: строка длиннее ${MAX_VERSION}-й версии (${byteLength} байт)`);
}

function encodeData(bytes: readonly number[], version: number): number[] {
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4); // байтовый режим
  push(bytes.length, version <= 9 ? 8 : 16);
  bytes.forEach((b) => push(b, 8));

  const capacity = dataCodewords(version) * 8;
  push(0, Math.min(4, capacity - bits.length)); // терминатор
  push(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) push(pad, 8);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) codewords.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  return codewords;
}

/** Делит данные на блоки, добавляет коррекцию Рида — Соломона и чередует блоки. */
function addEccAndInterleave(data: readonly number[], version: number): number[] {
  const { blocks: numBlocks, eccPerBlock } = eccLayout(version);
  const rawCodewords = Math.floor(rawDataModules(version) / 8);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);
  const divisor = rsDivisor(eccPerBlock);

  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dat = data.slice(k, k + shortBlockLen - eccPerBlock + (i < numShortBlocks ? 0 : 1));
    k += dat.length;
    const ecc = rsRemainder(dat, divisor);
    if (i < numShortBlocks) dat.push(0);
    blocks.push(dat.concat(ecc));
  }

  const result: number[] = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      if (i !== shortBlockLen - eccPerBlock || j >= numShortBlocks) result.push(block[i]);
    });
  }
  return result;
}

// --- Матрица ---

export function alignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const size = version * 4 + 17;
  const numAlign = Math.floor(version / 7) + 2;
  const step = Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result = [6];
  for (let pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
  return result;
}

/** 15 бит строки формата для уровня M и маски (BCH(15,5) + XOR-маска 0x5412). */
export function formatBits(mask: number): number {
  const data = (ECL_FORMAT_BITS << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

/** 18 бит информации о версии (версии 7+), код Голея (18,6). */
export function versionBits(version: number): number {
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  return (version << 12) | rem;
}

export function maskApplies(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (x + y) % 3 === 0;
    case 4:
      return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

class Builder {
  readonly version: number;
  readonly size: number;
  readonly modules: boolean[][];
  readonly isFunction: boolean[][];

  constructor(version: number) {
    this.version = version;
    this.size = version * 4 + 17;
    this.modules = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.isFunction = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
  }

  setFunction(x: number, y: number, dark: boolean) {
    this.modules[y][x] = dark;
    this.isFunction[y][x] = true;
  }

  drawFunctionPatterns() {
    const { size } = this;
    for (let i = 0; i < size; i++) {
      this.setFunction(6, i, i % 2 === 0);
      this.setFunction(i, 6, i % 2 === 0);
    }
    this.drawFinder(3, 3);
    this.drawFinder(size - 4, 3);
    this.drawFinder(3, size - 4);
    const pos = alignmentPositions(this.version);
    const n = pos.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) this.setFunction(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
    this.drawFormat(0); // резервирует место, перезаписывается после выбора маски
    this.drawVersion();
  }

  drawFinder(x: number, y: number) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) this.setFunction(xx, yy, dist !== 2 && dist !== 4);
      }
    }
  }

  drawFormat(mask: number) {
    const bits = formatBits(mask);
    const { size } = this;
    for (let i = 0; i <= 5; i++) this.setFunction(8, i, getBit(bits, i));
    this.setFunction(8, 7, getBit(bits, 6));
    this.setFunction(8, 8, getBit(bits, 7));
    this.setFunction(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i++) this.setFunction(14 - i, 8, getBit(bits, i));
    for (let i = 0; i < 8; i++) this.setFunction(size - 1 - i, 8, getBit(bits, i));
    for (let i = 8; i < 15; i++) this.setFunction(8, size - 15 + i, getBit(bits, i));
    this.setFunction(8, size - 8, true); // тёмный модуль
  }

  drawVersion() {
    if (this.version < 7) return;
    const bits = versionBits(this.version);
    for (let i = 0; i < 18; i++) {
      const bit = getBit(bits, i);
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.setFunction(a, b, bit);
      this.setFunction(b, a, bit);
    }
  }

  drawCodewords(data: readonly number[]) {
    const { size } = this;
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }

  applyMask(mask: number) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (!this.isFunction[y][x] && maskApplies(mask, x, y)) this.modules[y][x] = !this.modules[y][x];
      }
    }
  }

  // --- Штрафные баллы для выбора маски (раздел 7.8.3 стандарта) ---

  penalty(): number {
    const { size, modules } = this;
    let result = 0;
    const lines = (getter: (a: number, b: number) => boolean) => {
      for (let a = 0; a < size; a++) {
        let runColor = false;
        let run = 0;
        const history = [0, 0, 0, 0, 0, 0, 0];
        for (let b = 0; b < size; b++) {
          if (getter(a, b) === runColor) {
            run++;
            if (run === 5) result += 3;
            else if (run > 5) result++;
          } else {
            this.addHistory(run, history);
            if (!runColor) result += this.countFinderLike(history) * 40;
            runColor = getter(a, b);
            run = 1;
          }
        }
        if (runColor) {
          this.addHistory(run, history);
          run = 0;
        }
        this.addHistory(run + size, history);
        result += this.countFinderLike(history) * 40;
      }
    };
    lines((y, x) => modules[y][x]);
    lines((x, y) => modules[y][x]);

    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const c = modules[y][x];
        if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) result += 3;
      }
    }

    const dark = modules.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
    const total = size * size;
    result += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return result;
  }

  addHistory(run: number, history: number[]) {
    if (history[0] === 0) run += this.size; // светлая граница перед первой серией
    history.pop();
    history.unshift(run);
  }

  countFinderLike(h: readonly number[]): number {
    const n = h[1];
    const core = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n;
    return (core && h[0] >= n * 4 && h[6] >= n ? 1 : 0) + (core && h[6] >= n * 4 && h[0] >= n ? 1 : 0);
  }
}

/** Кодирует строку (UTF-8) в QR-матрицу с автоматическим выбором версии и маски. */
export function encodeQr(text: string): QrMatrix {
  const bytes = utf8(text);
  const version = pickVersion(bytes.length);
  const builder = new Builder(version);
  builder.drawFunctionPatterns();
  builder.drawCodewords(addEccAndInterleave(encodeData(bytes, version), version));

  let best = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    builder.applyMask(mask);
    builder.drawFormat(mask);
    const score = builder.penalty();
    if (score < bestScore) {
      best = mask;
      bestScore = score;
    }
    builder.applyMask(mask); // XOR снимает маску
  }
  builder.applyMask(best);
  builder.drawFormat(best);
  return { size: builder.size, version, mask: best, modules: builder.modules };
}

/** SVG-путь тёмных модулей (1 модуль = 1 единица, тихая зона `margin` модулей). */
export function qrPath(qr: QrMatrix, margin = 4): string {
  let d = '';
  qr.modules.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) d += `M${x + margin} ${y + margin}h1v1h-1z`;
    });
  });
  return d;
}
