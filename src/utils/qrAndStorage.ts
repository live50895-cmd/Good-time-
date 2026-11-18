import { ProfileId } from '../types/health';

export function pKey(base: string, profile: ProfileId): string {
  return `${base}_${profile}`;
}

export function compressImageFile(
  file: File,
  maxDim: number,
  quality: number,
  cb: (dataUrl: string) => void
): void {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const result = String(ev.target?.result || '');
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => cb(result);
    img.src = result;
  };
  reader.readAsDataURL(file);
}

// REAL SCANNABLE QR CODE MATRIX (VERSION 3-L, 29x29, PURE JS GF256 REED-SOLOMON)
export function drawRealQrCode(
  ctx: CanvasRenderingContext2D,
  text: string,
  ox: number,
  oy: number,
  boxPx: number
): void {
  const N = 29;
  const m: Array<Array<number | null>> = Array.from({ length: N }, () => Array(N).fill(null));
  const placeFinder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = r0 + r;
        const cc = c0 + c;
        if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
        const inB = r === 0 || r === 6 || c === 0 || c === 6;
        const inC = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        const out = r < 0 || r > 6 || c < 0 || c > 6;
        m[rr][cc] = out ? 0 : inB || inC ? 1 : 0;
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, N - 7);
  placeFinder(N - 7, 0);
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      m[22 + r][22 + c] =
        Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0) ? 1 : 0;
    }
  }
  for (let i = 8; i < N - 8; i++) {
    m[6][i] = i % 2 === 0 ? 1 : 0;
    m[i][6] = i % 2 === 0 ? 1 : 0;
  }
  m[N - 8][8] = 1;
  const resv = (r: number, c: number) => {
    if (m[r][c] === null) m[r][c] = 0;
  };
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      resv(8, i);
      resv(i, 8);
    }
    if (i < 8) resv(8, N - 1 - i);
    if (i < 7) resv(N - 1 - i, 8);
  }

  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(text).slice(0, 52);
  const bits: number[] = [0, 1, 0, 0];
  for (let i = 7; i >= 0; i--) bits.push((rawBytes.length >> i) & 1);
  for (let i = 0; i < rawBytes.length; i++) {
    const ch = rawBytes[i];
    for (let b = 7; b >= 0; b--) bits.push((ch >> b) & 1);
  }
  for (let i = 0; i < 4 && bits.length < 440; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);
  const dc: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let b = 0; b < 8; b++) v = (v << 1) | bits[i + b];
    dc.push(v);
  }
  let pad = 0;
  while (dc.length < 55) {
    dc.push(pad % 2 === 0 ? 0xec : 0x11);
    pad++;
  }

  const exp = new Array<number>(512);
  const log = new Array<number>(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = x;
    exp[i + 255] = x;
    log[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
  const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : exp[log[a] + log[b]]);
  let gen = [1];
  for (let i = 0; i < 15; i++) {
    const ng = new Array<number>(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      ng[j] ^= gen[j];
      ng[j + 1] ^= mul(gen[j], exp[i]);
    }
    gen = ng;
  }
  const rem = dc.concat(new Array<number>(15).fill(0));
  for (let i = 0; i < 55; i++) {
    const f = rem[i];
    if (f !== 0) for (let j = 0; j < 16; j++) rem[i + j] ^= mul(gen[j], f);
  }
  const allCw = dc.concat(rem.slice(55));
  const stream: number[] = [];
  allCw.forEach((cw) => {
    for (let b = 7; b >= 0; b--) stream.push((cw >> b) & 1);
  });
  for (let i = 0; i < 7; i++) stream.push(0);

  const isFunc = (r: number, c: number) =>
    (r <= 8 && c <= 8) ||
    (r <= 8 && c >= N - 8) ||
    (r >= N - 8 && c <= 8) ||
    r === 6 ||
    c === 6 ||
    (r >= 20 && r <= 24 && c >= 20 && c <= 24);
  let si = 0;
  let up = true;
  for (let col = N - 1; col >= 1; col -= 2) {
    if (col === 6) col--;
    for (let k = 0; k < N; k++) {
      const r = up ? N - 1 - k : k;
      for (let d = 0; d < 2; d++) {
        const c = col - d;
        if (!isFunc(r, c)) {
          const bit = si < stream.length ? stream[si++] : 0;
          m[r][c] = bit ^ ((r + c) % 2 === 0 ? 1 : 0);
        }
      }
    }
    up = !up;
  }
  const fmt = 0x77c4;
  const c1 = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  const c2 = [
    [N - 1, 8], [N - 2, 8], [N - 3, 8], [N - 4, 8], [N - 5, 8], [N - 6, 8], [N - 7, 8],
    [8, N - 8], [8, N - 7], [8, N - 6], [8, N - 5], [8, N - 4], [8, N - 3], [8, N - 2], [8, N - 1],
  ];
  for (let i = 0; i < 15; i++) {
    const bit = (fmt >> (14 - i)) & 1;
    m[c1[i][0]][c1[i][1]] = bit;
    m[c2[i][0]][c2[i][1]] = bit;
  }

  const cell = boxPx / (N + 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(ox, oy, boxPx, boxPx);
  ctx.fillStyle = '#020617';
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (m[r][c] === 1) {
        ctx.fillRect(
          Math.floor(ox + (c + 2) * cell),
          Math.floor(oy + (r + 2) * cell),
          Math.ceil(cell),
          Math.ceil(cell)
        );
      }
    }
  }
}

export function readStorageJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorageJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}
