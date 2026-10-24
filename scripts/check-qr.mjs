// Проверка генератора QR (src/app/remote/qr.ts) по таблицам стандарта ISO/IEC 18004
// и обратным чтением: формат → снятие маски → зигзаг → блоки → синдромы Рида — Соломона → данные.
// Читатель ниже написан отдельно от генератора и опирается только на правила стандарта.
// Запуск: node scripts/check-qr.mjs (Node ≥ 22.18 — TypeScript запускается без сборки).
import { encodeQr, formatBits, versionBits, alignmentPositions, dataCodewords, gfMultiply } from '../src/app/remote/qr.ts';

let failed = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

// --- Таблицы стандарта (уровень M) ---
const FORMAT_M = [
  '101010000010010',
  '101000100100101',
  '101111001111100',
  '101101101001011',
  '100010111111001',
  '100000011001110',
  '100111110010111',
  '100101010100000',
];
const VERSION_INFO = { 7: 0x07c94, 8: 0x085bc, 9: 0x09a99, 10: 0x0a4d3 };
const BYTE_CAPACITY_M = [14, 26, 42, 62, 84, 106, 122, 152, 180, 213];
const ALIGNMENT = {
  2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
  7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
};
// Структура блоков (уровень M): [число блоков, кодовых слов данных в блоке], коррекция на блок.
const BLOCKS_M = {
  1: { groups: [[1, 16]], ecc: 10 },
  2: { groups: [[1, 28]], ecc: 16 },
  3: { groups: [[1, 44]], ecc: 26 },
  4: { groups: [[2, 32]], ecc: 18 },
  5: { groups: [[2, 43]], ecc: 24 },
  6: { groups: [[4, 27]], ecc: 16 },
  7: { groups: [[4, 31]], ecc: 18 },
  8: { groups: [[2, 38], [2, 39]], ecc: 22 },
  9: { groups: [[3, 36], [2, 37]], ecc: 22 },
  10: { groups: [[4, 43], [1, 44]], ecc: 26 },
};

FORMAT_M.forEach((expected, mask) =>
  check(`Строка формата M, маска ${mask}`, formatBits(mask).toString(2).padStart(15, '0') === expected),
);
for (const [v, expected] of Object.entries(VERSION_INFO)) check(`Информация о версии ${v}`, versionBits(Number(v)) === expected);
BYTE_CAPACITY_M.forEach((cap, i) => {
  const v = i + 1;
  const countBits = v <= 9 ? 8 : 16;
  check(`Ёмкость версии ${v}: ${cap} байт`, Math.floor((dataCodewords(v) * 8 - 4 - countBits) / 8) === cap);
});
for (const [v, expected] of Object.entries(ALIGNMENT)) {
  check(`Выравнивающие узоры версии ${v}`, JSON.stringify(alignmentPositions(Number(v))) === JSON.stringify(expected));
}

// --- Независимый читатель ---
function functionMask(version) {
  const size = version * 4 + 17;
  const f = Array.from({ length: size }, () => new Array(size).fill(false));
  const mark = (x, y) => x >= 0 && y >= 0 && x < size && y < size && (f[y][x] = true);
  // Поисковые узоры с разделителями (8×8 в трёх углах).
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      mark(i, j);
      mark(size - 1 - i, j);
      mark(i, size - 1 - j);
    }
  }
  for (let i = 0; i < size; i++) {
    mark(6, i);
    mark(i, 6);
  }
  const pos = ALIGNMENT[version] ?? [];
  const inFinder = (x, y) => (x < 8 || x >= size - 8) && (y < 8 || y >= size - 8) && !(x >= size - 8 && y >= size - 8);
  for (const cx of pos) {
    for (const cy of pos) {
      if (inFinder(cx, cy)) continue; // пересекается с поисковым узором
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) mark(cx + dx, cy + dy);
    }
  }
  // Зоны формата и тёмный модуль.
  for (let i = 0; i < 9; i++) {
    mark(8, i);
    mark(i, 8);
  }
  for (let i = 0; i < 8; i++) {
    mark(size - 1 - i, 8);
    mark(8, size - 1 - i);
  }
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        mark(size - 11 + j, i);
        mark(i, size - 11 + j);
      }
    }
  }
  return f;
}

function readFormat(m) {
  const size = m.length;
  const bit = (x, y) => (m[y][x] ? 1 : 0);
  let a = 0;
  // Первая копия: биты 0–5 по столбцу 8 (y = 0..5), затем (8,7), (8,8), (7,8), биты 9–14 по строке 8 (x = 5..0).
  const first = [];
  for (let i = 0; i <= 5; i++) first.push(bit(8, i));
  first.push(bit(8, 7), bit(8, 8), bit(7, 8));
  for (let i = 9; i < 15; i++) first.push(bit(14 - i, 8));
  first.forEach((b, i) => (a |= b << i));
  let b2 = 0;
  for (let i = 0; i < 8; i++) b2 |= bit(size - 1 - i, 8) << i;
  for (let i = 8; i < 15; i++) b2 |= bit(8, size - 15 + i) << i;
  return { first: a, second: b2 };
}

const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function syndromesZero(codewords, ecc) {
  // S_i = c(α^i), i = 0..ecc-1 (порождающий многочлен Γ = Π (x − α^i)).
  let alpha = 1;
  for (let i = 0; i < ecc; i++) {
    let s = 0;
    for (const c of codewords) s = gfMultiply(s, alpha) ^ c;
    if (s !== 0) return false;
    alpha = gfMultiply(alpha, 2);
  }
  return true;
}

function decode(qr) {
  const { modules: m, size } = qr;
  const version = (size - 17) / 4;
  const fmt = readFormat(m);
  if (fmt.first !== fmt.second) throw new Error('копии строки формата различаются');
  const raw = fmt.first ^ 0x5412;
  const ecl = raw >>> 13;
  const mask = (raw >>> 10) & 7;
  if (ecl !== 0) throw new Error(`уровень коррекции ${ecl}, ожидался M (0)`);
  if (formatBits(mask) !== fmt.first) throw new Error('строка формата не проходит BCH');
  if (!m[size - 8][8]) throw new Error('нет тёмного модуля');

  const f = functionMask(version);
  const bits = [];
  let upward = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--;
    for (let k = 0; k < size; k++) {
      const y = upward ? size - 1 - k : k;
      for (const x of [right, right - 1]) {
        if (f[y][x]) continue;
        bits.push(m[y][x] !== MASKS[mask](x, y) ? 1 : 0);
      }
    }
    upward = !upward;
  }
  const codewords = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) codewords.push(parseInt(bits.slice(i, i + 8).join(''), 2));

  const { groups, ecc } = BLOCKS_M[version];
  const dataLens = groups.flatMap(([count, len]) => new Array(count).fill(len));
  const blocks = dataLens.map(() => []);
  let p = 0;
  const maxLen = Math.max(...dataLens);
  for (let i = 0; i < maxLen; i++) dataLens.forEach((len, j) => i < len && blocks[j].push(codewords[p++]));
  for (let i = 0; i < ecc; i++) blocks.forEach((b) => b.push(codewords[p++]));
  blocks.forEach((b, j) => {
    if (!syndromesZero(b, ecc)) throw new Error(`блок ${j}: синдромы Рида — Соломона не равны нулю`);
  });

  const data = blocks.flatMap((b, j) => b.slice(0, dataLens[j]));
  const dataBits = data.flatMap((byte) => byte.toString(2).padStart(8, '0').split('').map(Number));
  const read = (n) => parseInt(dataBits.splice(0, n).join(''), 2);
  if (read(4) !== 0b0100) throw new Error('режим не байтовый');
  const count = read(version <= 9 ? 8 : 16);
  const bytes = Array.from({ length: count }, () => read(8));
  return new TextDecoder().decode(new Uint8Array(bytes));
}

const samples = [
  'https://footurexpptx.vercel.app/?speaker=1&room=482193',
  'http://192.168.1.24:4173/?speaker=1&room=000000',
  'FootureX',
  'Пульт докладчика FootureX — управление проектами',
  ...BYTE_CAPACITY_M.flatMap((cap) => ['x'.repeat(cap), 'y'.repeat(Math.max(1, cap - 1))]),
];
for (const text of samples) {
  try {
    const qr = encodeQr(text);
    const back = decode(qr);
    check(`Обратное чтение (${new TextEncoder().encode(text).length} байт, версия ${qr.version}, маска ${qr.mask})`, back === text);
  } catch (e) {
    check(`Обратное чтение «${text.slice(0, 24)}…»`, false, e.message);
  }
}
let tooLong = false;
try {
  encodeQr('z'.repeat(214));
} catch {
  tooLong = true;
}
check('Слишком длинная строка отклоняется', tooLong);

console.log(failed ? `\n${failed} проверок не пройдено` : '\nВсе проверки пройдены');
process.exit(failed ? 1 : 0);
