// Planta Real — maquete realista sem telhado: pisos, paredes cortadas, piscina, móveis, vegetação e o up! (real-up.js)
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
import {
  T, LOT, POOL, ROOMS, WALLS, OPENING, CUT, CUT_MURO, COPING,
  FLOORS, STEPS, UP, PALMS, SHRUBS, TREES, FLOWERS,
} from './real-dados.js';
import { criarUp } from './real-up.js';

// Paleta (branco limpo como na referência; o calor vem dos tapetes e da madeira)
const MAT = {
  wall: 0xf7f7f5, muro: 0xf3f3f0, frame: 0x2b2c2e, glass: 0xbfe0ea,
  white: 0xfafaf9, linen: 0xe7e0d4, cushion: 0xd9cdb6, pillow: 0xfbfaf6, throw: 0xc8b28e, rug: 0xddd5c6, rug2: 0xcbbfa8,
  wood: 0xc29467, woodDark: 0x80593a, woodLight: 0xdcc09a, stoneTop: 0xeeebe5, black: 0x2a2a2c, steel: 0xb7bbc0,
  chrome: 0xd9dde1, screen: 0x15171a, brick: 0xd8cfc2, rubber: 0x3b3b3d, yellow: 0xe8c040, fabricBlue: 0x6c829c,
  jute: 0xc8b48c, wicker: 0x9a7a55, navy: 0x26354f, binGreen: 0x3e6b3a, gasBlue: 0x2f5f9a, grey: 0x8d8f91,
  gravel: 0xcfcac0, ledG: 0x2f6b34, tire: 0x1d1d1f, lightW: 0xfff6dc, lightR: 0xc0262b, umbrella: 0xf1eadb, pot: 0xf3f1ec, soil: 0x6b5a45,
  bookA: 0x8a5a44, bookB: 0x5f7a8a, bookC: 0xc9a25a, plant: 0x5d8a3e, coping: 0xefefec, poolEdge: 0x1f7fb2,
  wallCap: 0xfcfcfb, muroCap: 0xdededa, base: 0xdcdbd7, rim: 0xc9ccd0,
};
// Aspereza / metal por material (o resto é fosco)
const ROUGH = {
  chrome: [0.25, 0.8], steel: [0.4, 0.6], rim: [0.3, 0.7], screen: [0.15, 0], black: [0.5, 0], frame: [0.45, 0.3],
  white: [0.6, 0], stoneTop: [0.35, 0], woodLight: [0.6, 0], wood: [0.6, 0], lightW: [0.2, 0], lightR: [0.3, 0],
};
const FLOOR_ROUGH = { tile: 0.32, tileCool: 0.28, wood: 0.5, stone: 0.75, paving: 0.9, concrete: 0.85, grass: 1, water: 0.06 };

// Texturas de canvas, geradas uma vez. tile = metros que uma repetição cobre
function makeTex(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Granulado leve (paleta pequena de tons: bem mais rápido que um estilo por ponto)
function grain(g, s, seed, n, alpha, rgb) {
  const r = rng(seed);
  const pal = Array.from({ length: 12 }, (_, i) => `rgba(${rgb[0] + i * 3.3 | 0},${rgb[1] + i * 3.3 | 0},${rgb[2] + i * 3.3 | 0},${(alpha * ((i * 7) % 12 + 1) / 12).toFixed(3)})`);
  for (let k = 0; k < pal.length; k++) {
    g.fillStyle = pal[k];
    for (let i = 0; i < n / pal.length; i++) g.fillRect(r() * s, r() * s, 1 + r() * 2, 1 + r() * 2);
  }
}
// Manchas grandes e suaves (variação de tom de baixa frequência), repetidas nas bordas
function blotches(g, s, seed, n, rgb, alpha, rmin, rmax) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * s, y = r() * s, rad = s * (rmin + r() * (rmax - rmin)), a = alpha * r();
    for (const dx of [-s, 0, s]) for (const dy of [-s, 0, s]) {
      if (x + dx + rad < 0 || x + dx - rad > s || y + dy + rad < 0 || y + dy - rad > s) continue;
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
      gr.addColorStop(0, `rgba(${rgb},${a})`);
      gr.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = gr;
      g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
    }
  }
}
// Placas com rejunte fino: nx × ny placas por textura; veins = veios de mármore leves
function tiles(base, grout, nx, ny, seed, vary = 0.04, veins = 0) {
  return makeTex(512, (g, s) => {
    g.fillStyle = grout; g.fillRect(0, 0, s, s);
    const r = rng(seed), w = s / nx, h = s / ny;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const k = 1 - vary / 2 + r() * vary;
      const c = new THREE.Color(base).multiplyScalar(k), c2 = c.clone().multiplyScalar(0.975);
      const gr = g.createLinearGradient(i * w, j * h, (i + r()) * w, (j + 1) * h);
      gr.addColorStop(0, `#${c.getHexString()}`);
      gr.addColorStop(1, `#${c2.getHexString()}`);
      g.fillStyle = gr;
      g.fillRect(i * w + 1.5, j * h + 1.5, w - 3, h - 3);
      for (let v = 0; v < veins; v++) {
        g.strokeStyle = `rgba(150,140,128,${0.05 + r() * 0.07})`;
        g.lineWidth = 0.6 + r() * 1.2;
        g.beginPath();
        let x = i * w + r() * w, y = j * h;
        g.moveTo(x, y);
        for (let t = 1; t <= 6; t++) { x += (r() - 0.5) * w * 0.35; y = j * h + (h * t) / 6; g.lineTo(Math.min(Math.max(x, i * w + 2), (i + 1) * w - 2), y - 2); }
        g.stroke();
      }
      // leve brilho na borda de cima de cada placa (bisotê)
      g.fillStyle = 'rgba(255,255,255,.18)';
      g.fillRect(i * w + 1.5, j * h + 1.5, w - 3, 1);
    }
    grain(g, s, seed + 1, 6000, 0.03, [132, 132, 130]);
  });
}

function textures() {
  const T_ = {};
  T_.tile = { map: tiles(0xf6f6f4, '#e3e3df', 2, 2, 3, 0.015, 0), tile: 1.8 };   // porcelanato branco 90 × 90
  T_.tileCool = { map: tiles(0xf4f6f7, '#dfe4e7', 4, 4, 5, 0.015), tile: 1.6 };
  T_.stone = { map: tiles(0xeae4d8, '#cdc3b3', 2, 4, 7, 0.07), tile: 2.0 };       // pedra clara do deck
  T_.paving = { map: tiles(0xa6a6a2, '#8a8a86', 4, 8, 9, 0.08), tile: 2.4 };      // intertravado cinza (perto do asfalto original)
  T_.concrete = {
    map: makeTex(512, (g, s) => {
      g.fillStyle = '#a9a8a2'; g.fillRect(0, 0, s, s);
      blotches(g, s, 10, 40, '90,88,84', 0.12, 0.05, 0.22);
      blotches(g, s, 12, 25, '200,198,192', 0.1, 0.05, 0.2);
      grain(g, s, 11, 22000, 0.1, [110, 110, 106]);
    }),
    tile: 3,
  };
  T_.wood = {
    map: makeTex(512, (g, s) => {
      const r = rng(13), n = 8, h = s / n;
      for (let j = 0; j < n; j++) {
        let x0 = -r() * s / 2;
        while (x0 < s) {                                                   // tábuas de comprimentos variados
          const len = s * (0.45 + r() * 0.5);
          const c = new THREE.Color(0xcfa77c).multiplyScalar(0.86 + r() * 0.2);
          g.fillStyle = `#${c.getHexString()}`;
          g.fillRect(x0, j * h, len, h);
          for (let v = 0; v < 7; v++) {                                     // veios
            g.strokeStyle = `rgba(${r() < 0.5 ? '110,72,40' : '235,205,165'},${0.08 + r() * 0.12})`;
            g.lineWidth = 0.6 + r() * 1.4;
            g.beginPath();
            const y = j * h + 3 + r() * (h - 6), a = 1 + r() * 3, f = 0.01 + r() * 0.02, ph = r() * 6;
            for (let x = x0; x <= x0 + len; x += 6) g.lineTo(x, y + Math.sin(x * f + ph) * a);
            g.stroke();
          }
          g.fillStyle = 'rgba(90,60,35,.45)'; g.fillRect(x0, j * h, 1.2, h);
          x0 += len;
        }
        g.fillStyle = 'rgba(90,60,35,.5)'; g.fillRect(0, j * h, s, 1.5);
      }
      grain(g, s, 14, 6000, 0.05, [120, 90, 60]);
    }),
    tile: 1.6,
  };
  T_.grass = {
    map: makeTex(512, (g, s) => {
      g.fillStyle = '#5f8f3c'; g.fillRect(0, 0, s, s);
      blotches(g, s, 16, 30, '70,105,40', 0.35, 0.06, 0.2);
      blotches(g, s, 18, 22, '140,170,80', 0.22, 0.05, 0.16);
      const r = rng(17);
      const pal = Array.from({ length: 10 }, (_, i) => `#${new THREE.Color(i % 4 ? 0x5d903a : 0x8bb35a).multiplyScalar(0.7 + i * 0.05).getHexString()}`);
      for (const c of pal) {
        g.fillStyle = c;
        for (let i = 0; i < 2400; i++) g.fillRect(r() * s, r() * s, 1, 1.5 + r() * 2.5);
      }
    }),
    tile: 2.5,
  };
  T_.water = {
    // Cáusticas: soma de ondas com frequências inteiras (repete sem emenda), linhas claras onde |soma| ≈ 0
    map: makeTex(256, (g, s) => {
      const im = g.createImageData(s, s), d = im.data, TAU = Math.PI * 2 / s;
      const W = [[3, 1, 0], [-1, 4, 1.3], [2, -3, 2.1], [5, 2, 0.7], [-4, -2, 2.9]];
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        let v = 0;
        for (const [fx, fy, ph] of W) v += Math.cos((fx * x + fy * y) * TAU + ph);
        const c = Math.pow(1 - Math.min(1, Math.abs(v) / 2.2), 5);
        const lo = 0.5 + 0.5 * Math.cos((2 * x - y) * TAU + 1);              // variação lenta de fundo
        const i = (y * s + x) * 4;
        d[i] = 22 + lo * 14 + c * 150; d[i + 1] = 140 + lo * 20 + c * 95; d[i + 2] = 200 + lo * 15 + c * 50; d[i + 3] = 255;
      }
      g.putImageData(im, 0, 0);
    }),
    tile: 2.6,
  };
  return T_;
}

// Caixa arredondada (porte do RoundedBoxGeometry do three r170, sem addons), não indexada.
// Cache por medida: cada forma é gerada uma vez e clonada
const RB = new Map();
function roundedBox(w, h, d, r, seg = 2) {
  const key = `${w}|${h}|${d}|${r}|${seg}`;
  let g = RB.get(key);
  if (!g) {
    const n = seg * 2 + 1;
    r = Math.min(w / 2, h / 2, d / 2, r);
    g = new THREE.BoxGeometry(1, 1, 1, n, n, n).toNonIndexed();
    const pa = g.attributes.position.array, na = g.attributes.normal.array;
    const p = new THREE.Vector3(), nm = new THREE.Vector3(), half = 0.5 / n;
    const bx = w / 2 - r, by = h / 2 - r, bz = d / 2 - r;
    for (let i = 0; i < pa.length; i += 3) {
      p.fromArray(pa, i);
      nm.set(p.x - Math.sign(p.x) * half, p.y - Math.sign(p.y) * half, p.z - Math.sign(p.z) * half).normalize();
      pa[i] = bx * Math.sign(p.x) + nm.x * r;
      pa[i + 1] = by * Math.sign(p.y) + nm.y * r;
      pa[i + 2] = bz * Math.sign(p.z) + nm.z * r;
      na[i] = nm.x; na[i + 1] = nm.y; na[i + 2] = nm.z;
    }
    RB.set(key, g);
  }
  return g.clone();
}
// Raio macio (estofado, colchão) e duro (madeira, pedra, armário)
const rSoft = (a, b, c) => Math.min(0.06, 0.45 * Math.min(a, b, c));
const rHard = (a, b, c) => Math.min(0.02, 0.3 * Math.min(a, b, c));

// Geometrias mescladas por material: uma malha por material no fim (poucas draw calls)
const NO_AO = new Set(['glass', 'frame', 'rug', 'rug2', 'yellow', 'coping', 'poolEdge', 'wallCap', 'muroCap']);
class Batch {
  constructor() { this.parts = {}; this.foot = []; }
  add(key, g, m) {
    const src = g.index ? g.toNonIndexed() : g;
    if (m) src.applyMatrix4(m);
    // Pegada no chão (para a oclusão de ambiente pintada): só o que encosta no piso
    if (!key.startsWith('f_') && !NO_AO.has(key)) {
      src.computeBoundingBox();
      const bb = src.boundingBox;
      if (bb.min.y < 0.2 && bb.max.y > 0.1) this.foot.push({ key, x0: bb.min.x, x1: bb.max.x, z0: bb.min.z, z1: bb.max.z, h: bb.max.y });
    }
    // Guarda os blocos (sem espalhar em arrays JS); junta tudo no build
    const p = (this.parts[key] ||= { pos: [], nor: [], uv: [], n: 0, nuv: 0 });
    p.pos.push(src.attributes.position.array);
    p.nor.push(src.attributes.normal.array);
    p.n += src.attributes.position.count;
    if (src.attributes.uv) { p.uv.push(src.attributes.uv.array); p.nuv += src.attributes.uv.count; }
    if (src !== g) src.dispose();
    g.dispose();
  }
  static cat(list, len) {
    const out = new Float32Array(len);
    let o = 0;
    for (const a of list) { out.set(a, o); o += a.length; }
    return out;
  }
  // Peças posicionadas num referencial local (origem x/z, giro ry)
  at(x, z, ry = 0) {
    const base = new THREE.Matrix4().makeRotationY(ry).setPosition(x, 0, z);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
    const put = (k, g, cx, cy, cz, rx = 0, rz = 0) => {
      m.compose(new THREE.Vector3(cx, cy, cz), q.setFromEuler(e.set(rx, 0, rz)), one).premultiply(base);
      this.add(k, g, m);
    };
    return {
      box: (k, cx, cy, cz, sx, sy, sz, rx = 0) => put(k, new THREE.BoxGeometry(sx, sy, sz), cx, cy, cz, rx),
      rbox: (k, cx, cy, cz, sx, sy, sz, r, rx = 0) => put(k, roundedBox(sx, sy, sz, r), cx, cy, cz, rx),
      // atalhos: macio (s) e duro (h)
      rs: (k, cx, cy, cz, sx, sy, sz, rx = 0) => put(k, roundedBox(sx, sy, sz, rSoft(sx, sy, sz)), cx, cy, cz, rx),
      rh: (k, cx, cy, cz, sx, sy, sz, rx = 0) => put(k, roundedBox(sx, sy, sz, rHard(sx, sy, sz), 1), cx, cy, cz, rx),
      cyl: (k, cx, cy, cz, r, h, seg = 12, r2 = r) => put(k, new THREE.CylinderGeometry(r2, r, h, seg), cx, cy, cz),
      sph: (k, cx, cy, cz, r, sy = 1) => {
        const g = new THREE.SphereGeometry(r, 10, 6);
        g.scale(1, sy, 1);
        put(k, g, cx, cy, cz);
      },
      cone: (k, cx, cy, cz, r, h, seg = 8) => put(k, new THREE.ConeGeometry(r, h, seg), cx, cy, cz),
      geo: (k, g, cx = 0, cy = 0, cz = 0, rx = 0, rz = 0) => put(k, g, cx, cy, cz, rx, rz),
      // Tronco de pirâmide: base sx × sz, topo encolhido por t (faces chapadas)
      frustum: (k, cx, cy, cz, sx, sy, sz, t) => {
        const g = new THREE.CylinderGeometry(Math.SQRT1_2 * t, Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4).toNonIndexed();
        g.scale(sx, sy, sz);
        g.computeVertexNormals();
        put(k, g, cx, cy, cz);
      },
    };
  }
  build(mats, group, { cast = true, receive = true } = {}) {
    const out = [];
    for (const [k, p] of Object.entries(this.parts)) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(Batch.cat(p.pos, p.n * 3), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(Batch.cat(p.nor, p.n * 3), 3));
      if (p.nuv === p.n) g.setAttribute('uv', new THREE.BufferAttribute(Batch.cat(p.uv, p.n * 2), 2));
      const mesh = new THREE.Mesh(g, mats[k]);
      mesh.castShadow = cast && !mats[k].transparent;
      mesh.receiveShadow = receive;
      mesh.name = k;
      group.add(mesh);
      out.push(mesh);
    }
    return out;
  }
}

// UV em metros do mundo: topo usa (x, z); laterais usam (x + z, y)
function worldUV(g, tile) {
  const p = g.attributes.position, n = g.attributes.normal, uv = [];
  for (let i = 0; i < p.count; i++) {
    const up = Math.abs(n.getY(i)) > 0.5;
    uv.push((up ? p.getX(i) : p.getX(i) + p.getZ(i)) / tile, (up ? -p.getZ(i) : p.getY(i)) / tile);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
// Laje de piso [x, z, w, d] com topo em y
function slab(x, z, w, d, y, tile) {
  const g = new THREE.BoxGeometry(w, y, d).toNonIndexed();
  g.translate(x + w / 2, y / 2, z + d / 2);
  return worldUV(g, tile);
}
const FLOOR_Y = { wood: 0.06, tile: 0.06, tileCool: 0.06, concrete: 0.04, stone: 0.04, paving: 0.03 };

// Forma da piscina (reta + meia-lua), crescida de g; em (x, -z) para girar -90° em X
function poolShape(g = 0) {
  const s = new THREE.Shape(), { x0, x1, zc, r } = POOL, rr = r + g;
  s.moveTo(x0 - g, -(zc - rr));
  s.lineTo(x1, -(zc - rr));
  s.absarc(x1, -zc, rr, Math.PI / 2, -Math.PI / 2, true);
  s.lineTo(x0 - g, -(zc + rr));
  s.closePath();
  return s;
}
function flatShape(shape, y, tile) {
  const g = new THREE.ShapeGeometry(shape, 24);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return worldUV(g.toNonIndexed(), tile);
}

// ----------------------------------------------------------------------------------------------
// Paredes: caixas com os vãos recortados, cortadas na altura da maquete
function addWalls(B) {
  for (const w of WALLS) {
    const esp = w.muro ? 0.14 : T;
    const top = Math.min(w.h, w.muro ? CUT_MURO : CUT);
    const ext = w.muro ? 0 : T / 2; // fecha os cantos
    const key = w.muro ? 'muro' : 'wall';
    const box = (a, b, y0, y1, k = key, th = esp) => {
      if (b - a <= 0.001 || y1 - y0 <= 0.001) return;
      const m = (a + b) / 2, cy = (y0 + y1) / 2;
      const g = w.axis === 'x' ? new THREE.BoxGeometry(b - a, y1 - y0, th) : new THREE.BoxGeometry(th, y1 - y0, b - a);
      g.translate(w.axis === 'x' ? m : w.c, cy, w.axis === 'x' ? w.c : m);
      B.add(k, g);
      // Tampa do corte: um pouco mais escura e 5 mm mais larga, marca a seção como em maquete
      if (k === key && y1 >= top - 1e-3) {
        const t = th + 0.01, cap = w.axis === 'x' ? new THREE.BoxGeometry(b - a + 0.004, 0.012, t) : new THREE.BoxGeometry(t, 0.012, b - a + 0.004);
        cap.translate(w.axis === 'x' ? m : w.c, y1 + 0.006, w.axis === 'x' ? w.c : m);
        B.add(key + 'Cap', cap);
      }
    };
    let cur = w.a0 - ext;
    for (const o of [...w.ops].sort((p, q) => p.a - q.a)) {
      box(cur, o.a, 0, top);
      const [y0, y1r] = OPENING[o.t];
      const y1 = Math.min(y1r, top);
      if (y0 > 0) box(o.a, o.b, 0, y0);
      if (top - y1 > 0.12) box(o.a, o.b, y1, top);
      if (o.t === 'window' || o.t === 'glass') {
        box(o.a, o.b, y0, y1, 'glass', 0.02);
        const f = 0.045;
        box(o.a, o.b, y0, y0 + f, 'frame', 0.07);                         // travessa de baixo
        box(o.a, o.b, y1 - f, y1, 'frame', 0.07);                         // de cima (no corte)
        const n = Math.max(1, Math.round((o.b - o.a) / 1.0));
        for (let i = 0; i <= n; i++) {                                     // montantes
          const u = o.a + (o.b - o.a) * i / n;
          box(u - f / 2, u + f / 2, y0, y1, 'frame', 0.07);
        }
      } else if (o.t === 'gate') {
        for (let u = o.a + 0.06; u < o.b; u += 0.12) box(u - 0.015, u + 0.015, 0, y1, 'frame', 0.04);
        box(o.a, o.b, y1 - 0.05, y1, 'frame', 0.06);
        box(o.a, o.b, 0.9, 0.95, 'frame', 0.05);
      }
      cur = o.b;
    }
    box(cur, w.a1 + ext, 0, top);
  }
}

// ----------------------------------------------------------------------------------------------
// Móveis (referencial local: frente em +z, costas em -z). Cantos arredondados: rs = macio, rh = duro
function bed(B, x, z, ry, w, l) {
  const k = B.at(x, z, ry);
  k.rh('woodDark', 0, 0.14, 0, w + 0.06, 0.26, l);                     // base
  k.rh('wood', 0, 0.55, -l / 2 - 0.03, w + 0.2, 1.0, 0.06);             // cabeceira
  k.rs('pillow', 0, 0.38, 0.01, w - 0.04, 0.22, l - 0.08);             // colchão
  const n = w > 1.2 ? 2 : 1, pw = (w - 0.2) / n;
  for (let i = 0; i < n; i++) k.rs('white', -w / 2 + 0.1 + pw * (i + 0.5), 0.55, -l / 2 + 0.28, pw - 0.06, 0.13, 0.38);
  k.rs('throw', 0, 0.5, l / 2 - 0.42, w + 0.02, 0.05, 0.7);            // manta nos pés
}
function nightstand(B, x, z, s = 1) {
  const k = B.at(x, z);
  k.rh('wood', 0, 0.25 * s, 0, 0.45 * s, 0.5 * s, 0.4 * s);
  k.cyl('white', 0, 0.5 * s + 0.12, 0, 0.1, 0.24, 10, 0.07);             // abajur
}
function sofa(B, x, z, ry, w, d = 0.9, mat = 'linen') {
  const k = B.at(x, z, ry);
  k.rs(mat, 0, 0.21, 0.02, w, 0.42, d - 0.04);
  k.rs(mat, 0, 0.5, -d / 2 + 0.11, w, 0.6, 0.22);                      // encosto
  for (const s of [-1, 1]) k.rs(mat, s * (w / 2 - 0.09), 0.32, 0.02, 0.18, 0.64, d - 0.04); // braços
  const n = w > 1.6 ? 3 : 2, cw = (w - 0.36) / n;
  for (let i = 0; i < n; i++) k.rs('cushion', -w / 2 + 0.18 + cw * (i + 0.5), 0.47, 0.08, cw - 0.03, 0.1, d - 0.32);
  k.rs('fabricBlue', -w / 2 + 0.38, 0.62, -d / 2 + 0.3, 0.36, 0.3, 0.12, -0.25);
  k.rs('pillow', w / 2 - 0.38, 0.62, -d / 2 + 0.3, 0.36, 0.3, 0.12, -0.25);
}
function table(B, x, z, ry, w, d, h = 0.75, top = 'wood') {
  const k = B.at(x, z, ry);
  k.rh(top, 0, h - 0.02, 0, w, 0.04, d);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box('black', sx * (w / 2 - 0.06), (h - 0.04) / 2, sz * (d / 2 - 0.06), 0.04, h - 0.04, 0.04);
}
function roundTable(B, x, z, r, h = 0.74, top = 'white') {
  const k = B.at(x, z);
  k.cyl(top, 0, h - 0.02, 0, r, 0.04, 24);
  k.cyl('black', 0, h / 2, 0, 0.04, h - 0.04, 8);
  k.cyl('black', 0, 0.02, 0, r * 0.45, 0.04, 14);
}
function chair(B, x, z, ry, mat = 'white') {
  const k = B.at(x, z, ry);
  k.rh(mat, 0, 0.45, 0, 0.44, 0.06, 0.44);
  k.rh(mat, 0, 0.7, -0.2, 0.44, 0.45, 0.05);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box('black', sx * 0.19, 0.21, sz * 0.19, 0.03, 0.42, 0.03);
}
// Cadeira-cubo estofada (mesa do deck)
function cubeChair(B, x, z, ry) {
  const k = B.at(x, z, ry);
  k.rs('navy', 0, 0.22, 0, 0.5, 0.44, 0.5);
  k.rs('navy', 0, 0.55, -0.2, 0.5, 0.3, 0.1);
  k.rs('linen', 0, 0.47, 0.04, 0.42, 0.06, 0.38);
}
function stool(B, x, z, h = 0.7) {
  const k = B.at(x, z);
  k.cyl('woodLight', 0, h, 0, 0.17, 0.05, 14);
  k.cyl('black', 0, h / 2, 0, 0.025, h, 6);
  k.cyl('black', 0, 0.01, 0, 0.16, 0.02, 12);
}
function rug(B, x, z, ry, w, d, mat = 'rug', y = 0.07) {
  B.at(x, z, ry).box(mat, 0, y, 0, w, 0.015, d);
}
function wardrobe(B, x, z, ry, w, d = 0.6, h = 1.75) {
  const k = B.at(x, z, ry);
  k.rh('woodLight', 0, h / 2, 0, w, h, d);
  const n = Math.max(2, Math.round(w / 0.5));
  for (let i = 1; i < n; i++) k.box('wood', -w / 2 + w * i / n, h / 2, d / 2 + 0.003, 0.01, h - 0.08, 0.01);
}
// Cômoda baixa com gavetas
function dresser(B, x, z, ry, w, d, h) {
  const k = B.at(x, z, ry);
  k.rh('woodLight', 0, h / 2, 0, w, h, d);
  for (let i = 1; i < 3; i++) k.box('wood', 0, h * i / 3, d / 2 + 0.003, w - 0.06, 0.008, 0.01);
}
function counter(B, x, z, ry, w, d = 0.62, opts = {}) {
  const k = B.at(x, z, ry);
  k.rh(opts.base || 'white', 0, 0.44, 0.02, w, 0.88, d - 0.04);
  k.rh(opts.top || 'stoneTop', 0, 0.9, 0, w + 0.02, 0.04, d);
  if (opts.sink != null) { k.rh('chrome', opts.sink, 0.918, 0, 0.6, 0.012, 0.4); k.rh('steel', opts.sink, 0.924, 0, 0.5, 0.008, 0.32); }
}
// Rack com TV 32" baixa sobre pé
function tvRack(B, x, z, ry, w) {
  const k = B.at(x, z, ry);
  k.rh('wood', 0, 0.22, 0, w, 0.44, 0.4);
  k.box('black', 0, 0.47, -0.08, 0.2, 0.05, 0.14);
  k.rh('screen', 0, 0.8, -0.1, 0.72, 0.42, 0.04);
}
function shelf(B, x, z, ry, w, d = 0.35, h = 1.6) {
  const k = B.at(x, z, ry);
  k.rh('wood', 0, h / 2, 0, w, h, d);
  const r = rng(Math.round(x * 100 + z));
  for (let u = -w / 2 + 0.08; u < w / 2 - 0.08; u += 0.12) k.box(['bookA', 'bookB', 'bookC', 'white'][Math.floor(r() * 4)], u, h + 0.03, 0, 0.1, 0.06, d - 0.08);
}
function lounger(B, x, z, ry) {
  const k = B.at(x, z, ry);
  k.rh('white', 0, 0.2, 0.15, 0.68, 0.12, 1.45);
  k.rs('pillow', 0, 0.28, 0.15, 0.6, 0.06, 1.35);
  k.rs('white', 0, 0.42, -0.78, 0.68, 0.08, 0.62, -0.75);
  k.box('fabricBlue', 0, 0.32, 0.35, 0.55, 0.02, 0.5);              // toalha
}
function umbrella(B, x, z, r = 1.25) {
  const k = B.at(x, z);
  k.cyl('woodDark', 0, 1.15, 0, 0.03, 2.3, 6);
  k.cone('umbrella', 0, 2.38, 0, r, 0.36, 16);
  k.cyl('black', 0, 0.04, 0, 0.25, 0.08, 10);
}
function plantPot(B, x, z, r = 0.22, h = 0.5) {
  const k = B.at(x, z);
  k.cyl('pot', 0, h / 2, 0, r * 0.8, h, 12, r);
  k.sph('plant', 0, h + r * 0.7, 0, r * 1.3, 0.9);
}
// Planta alta (dracena / costela): vaso + 3 tufos subindo
function tallPlant(B, x, z, r = 0.22, top = 1.5) {
  const k = B.at(x, z);
  k.cyl('pot', 0, 0.22, 0, r * 0.8, 0.44, 12, r);
  k.cyl('woodDark', 0, (0.44 + top) / 2, 0, 0.015, top - 0.44, 5);
  for (const [dy, s, dx] of [[0.25, 1.0, 0.05], [0.55, 0.85, -0.06], [0.85, 0.7, 0.03]]) k.sph('plant', dx, 0.44 + (top - 0.44) * dy + 0.1, 0, r * s, 1.1);
}
function balizador(B, x, z) {
  const k = B.at(x, z);
  k.cyl('black', 0, 0.25, 0, 0.04, 0.5, 8);
  k.cyl('lightW', 0, 0.51, 0, 0.042, 0.03, 8);
}
function tocha(B, x, z) {
  const k = B.at(x, z);
  k.cyl('woodDark', 0, 0.7, 0, 0.018, 1.4, 5);
  k.cyl('black', 0, 1.44, 0, 0.045, 0.12, 8, 0.035);
}
// Tubo reto de a até b (pontos locais [x, y, z]); só no plano local XY quando dz = 0
function tube(k, mat, a, b, r = 0.015) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz);
  const g = new THREE.CylinderGeometry(r, r, len, 5);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize()));
  k.geo(mat, g, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
}

function addFurniture(B) {
  // Quarto casal: cama na janela do fundo, criados, banco ao pé, guarda-roupa (x=0), cômoda (x=3,6) virada para -X
  rug(B, 1.8, 2.1, 0, 2.0, 2.2, 'rug2');
  bed(B, 1.8, 1.32, 0, 1.6, 1.9);
  nightstand(B, 0.66, 0.35); nightstand(B, 2.94, 0.35);
  B.at(1.8, 2.59).rs('linen', 0, 0.22, 0, 1.2, 0.44, 0.42);
  wardrobe(B, 0.455, 3.15, Math.PI / 2, 1.7, 0.6);
  B.at(0.33, 2.0).cyl('wicker', 0, 0.25, 0, 0.15, 0.5, 14, 0.17);         // cesto de roupa
  dresser(B, 3.22, 2.95, -Math.PI / 2, 1.0, 0.45, 0.85);
  plantPot(B, 3.2, 3.74, 0.17);
  // Quarto: escrivaninha sob a janela, monitor, cadeira gamer, estante (x=3,6), cama de solteiro com a cabeceira na janela da frente,
  // guarda-roupa e rack baixo (x=6,8), TV na parede
  table(B, 4.5, 0.55, 0, 1.6, 0.7, 0.75, 'woodLight');
  { const k = B.at(4.64, 0.33); k.rh('screen', 0, 1.02, 0, 0.6, 0.36, 0.03); k.box('black', 0, 0.82, 0.03, 0.05, 0.12, 0.05); }
  B.at(5.1, 0.62).rh('steel', 0, 0.765, 0, 0.34, 0.02, 0.24);             // notebook
  chair(B, 4.5, 1.3, Math.PI, 'black');
  shelf(B, 3.83, 2.4, Math.PI / 2, 1.4);
  rug(B, 4.95, 2.55, 0, 1.3, 1.0);
  bed(B, 6.14, 3.1, Math.PI, 1.0, 1.9);
  nightstand(B, 5.4, 3.9, 0.8);
  wardrobe(B, 6.395, 0.85, -Math.PI / 2, 1.4, 0.58);
  { const k = B.at(6.57, 1.86); k.rh('wood', 0, 0.2, 0, 0.26, 0.4, 0.5); k.rh('white', 0, 0.44, 0, 0.2, 0.06, 0.3); }
  B.at(6.7, 2.1).box('screen', 0, 1.45, 0, 0.05, 0.64, 1.08);              // TV na parede
  plantPot(B, 3.895, 3.8, 0.17);
  // Sala: rack com TV 32" no fundo, sofá de 2 lugares virado para ela, planta alta, geladeira, jantar oval com 6 cadeiras
  tvRack(B, 7.76, 0.31, 0, 1.6);
  tallPlant(B, 9.0, 0.42, 0.22, 1.55);
  B.at(9.8, 0.45).rh('steel', 0, 0.885, 0, 0.75, 1.77, 0.7);
  sofa(B, 7.68, 1.75, Math.PI, 1.4, 0.82);
  rug(B, 9.2, 2.98, 0, 1.6, 1.4, 'jute');
  {
    const k = B.at(9.08, 3.0);
    k.geo('woodLight', new THREE.CylinderGeometry(0.75, 0.75, 0.04, 32).scale(1, 1, 0.95 / 1.5), 0, 0.73, 0);  // tampo oval
    k.cyl('black', 0, 0.37, 0, 0.05, 0.7, 8);
    k.geo('black', new THREE.CylinderGeometry(0.4, 0.4, 0.03, 20).scale(1, 1, 0.6), 0, 0.015, 0);
  }
  for (const [cx, cz, r] of [[8.1, 3.0, Math.PI / 2], [10.06, 3.0, -Math.PI / 2], [8.74, 2.28, 0], [9.42, 2.28, 0], [8.74, 3.72, Math.PI], [9.42, 3.72, Math.PI]]) chair(B, cx, cz, r, 'woodLight');
  // Balcão americano preso à meia-parede x=10,3 (lado da sala), 2 banquetas
  B.at(10.055, 1.55).rh('wood', 0, 1.0, 0, 0.34, 0.035, 1.25);
  stool(B, 9.98, 1.24, 0.7); stool(B, 9.98, 1.86, 0.7);
  // Cozinha: fogão de piso, armário do fundo sob a janela, armário em L na parede direita com a pia, micro-ondas, lixeira
  {
    const k = B.at(10.73, 0.39);
    k.rh('white', 0, 0.435, 0, 0.6, 0.87, 0.6);
    k.rh('black', 0, 0.875, 0, 0.58, 0.012, 0.56);
    for (const [a, b] of [[-0.14, -0.12], [0.14, -0.12], [-0.14, 0.12], [0.14, 0.12]]) k.cyl('rubber', a, 0.885, b, 0.07, 0.01, 12);
    k.rh('screen', 0, 0.42, 0.3, 0.46, 0.34, 0.02);                       // porta do forno
  }
  counter(B, 11.7275, 0.385, 0, 1.395, 0.62);
  counter(B, 12.115, 1.95, -Math.PI / 2, 2.5, 0.62, { sink: -0.3 });
  B.at(12.235, 1.0).rh('steel', 0, 1.05, 0, 0.35, 0.3, 0.5);               // micro-ondas
  B.at(12.15, 3.55).cyl('chrome', 0, 0.25, 0, 0.13, 0.5, 14);              // lixeira inox
  rug(B, 11.42, 1.9, 0, 0.55, 1.6);
  // Varanda: rede entre a parede e a coluna, capacho, vaso, sofá de fibra, churrasqueira, cervejeira, mesa com bancos
  {
    const k = B.at(0, 5.72), n = 8, x0 = 0.62, x1 = 2.2;
    const y = (t) => 0.62 + 0.45 * (2 * t - 1) ** 2;                         // curva da rede: ponta 1,07, fundo 0,62
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      tube(k, 'throw', [x0 + (x1 - x0) * t0, y(t0), 0], [x0 + (x1 - x0) * t1, y(t1), 0], 0.012);
      const a = Math.atan2(y(t1) - y(t0), (x1 - x0) / n);
      k.geo('throw', new THREE.BoxGeometry((x1 - x0) / n + 0.02, 0.02, 0.62), x0 + (x1 - x0) * (t0 + t1) / 2, (y(t0) + y(t1)) / 2, 0, 0, a);
    }
    tube(k, 'linen', [0.08, 1.6, 0], [x0, y(0), 0], 0.01);
    tube(k, 'linen', [2.65, 1.6, 0], [x1, y(1), 0], 0.01);
    k.rh('woodDark', 2.72, 0.9, 0, 0.14, 1.8, 0.14);                         // coluna de madeira
  }
  rug(B, 3.35, 5.88, 0, 0.72, 0.45, 'jute');
  plantPot(B, 3.66, 4.6, 0.2, 0.45);
  sofa(B, 6.3, 4.73, 0, 1.9, 0.75, 'wicker');
  { const k = B.at(9.0, 4.595); k.rh('brick', 0, 0.45, 0, 1.16, 0.9, 0.6); k.rh('black', 0, 0.91, 0.05, 0.8, 0.02, 0.4); k.rh('brick', 0, 1.3, -0.12, 0.8, 0.8, 0.3); }
  { const k = B.at(9.98, 4.64); k.rh('black', 0, 0.43, 0, 0.56, 0.86, 0.5); k.box('glass', 0, 0.45, 0.252, 0.44, 0.6, 0.01); }
  table(B, 11.52, 5.21, 0, 1.6, 0.66, 0.76, 'wood');
  for (const bz of [4.59, 5.83]) { const k = B.at(11.52, bz); k.rh('wood', 0, 0.43, 0, 1.4, 0.05, 0.3); for (const s of [-1, 1]) k.rh('wood', s * 0.6, 0.2, 0, 0.06, 0.4, 0.24); }
  // Banheiro: box de vidro, vaso (caixa na parede x=0, virado para +X), gabinete na parede z=8,8, tapete
  { const k = B.at(0.55, 6.75); k.box('glass', 0.47, 0.85, 0, 0.02, 1.7, 0.9); k.box('glass', 0, 0.85, 0.47, 0.9, 1.7, 0.02); k.rh('white', 0, 0.03, 0, 0.86, 0.04, 0.86); }
  {
    const k = B.at(0.42, 8.3);
    k.rh('white', -0.2, 0.62, 0, 0.18, 0.4, 0.42);                          // caixa
    k.geo('white', new THREE.CylinderGeometry(0.19, 0.15, 0.4, 16).scale(1.2, 1, 1), 0.06, 0.2, 0);  // bacia
    k.geo('pillow', new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16).scale(1.2, 1, 1), 0.06, 0.415, 0);
  }
  counter(B, 1.95, 8.485, Math.PI, 0.9, 0.46, { base: 'woodLight', sink: 0 });
  rug(B, 1.1, 7.55, 0, 0.6, 0.4);
  // Dispensa: máquina e tanque lado a lado, estante metálica (x=0), botijão, cesto, tábua de passar
  { const k = B.at(0.45, 9.25); k.rh('white', 0, 0.45, 0, 0.6, 0.9, 0.6); k.cyl('steel', 0, 0.91, 0.05, 0.2, 0.02, 14); }
  { const k = B.at(1.12, 9.125); k.rh('white', 0, 0.45, 0, 0.6, 0.9, 0.55); k.rh('steel', 0, 0.905, 0.04, 0.44, 0.012, 0.36); }
  {
    const k = B.at(0.25, 10.05, Math.PI / 2);                                // 0,84 × 0,35, 1,6 de altura
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box('steel', sx * 0.4, 0.8, sz * 0.155, 0.03, 1.6, 0.03);
    for (const y of [0.1, 0.5, 0.9, 1.3, 1.58]) k.box('steel', 0, y, 0, 0.84, 0.02, 0.35);
    const r = rng(77);
    for (const y of [0.52, 0.92, 1.32]) for (let u = -0.32; u < 0.34; u += 0.16) if (r() > 0.25) k.rh(['white', 'bookC', 'fabricBlue', 'pot'][Math.floor(r() * 4)], u, y + 0.1, 0, 0.12, 0.18, 0.22);
  }
  B.at(0.62, 10.33).cyl('gasBlue', 0, 0.3, 0, 0.16, 0.6, 14);
  B.at(1.45, 10.33).cyl('wicker', 0, 0.25, 0, 0.15, 0.5, 14, 0.17);
  B.at(2.17, 9.1).rh('white', 0, 0.62, 0, 0.03, 1.2, 0.36, 0.05);         // tábua de passar encostada
  // Garagem: tapete de borracha, faixas da vaga, armário de ferramentas, bicicleta na parede x=0, 2 lixeiras
  B.at(UP.x, UP.z).box('rubber', 0, 0.045, 0, 1.8, 0.01, 3.8);
  for (const x of [0.52, 2.48]) B.at(x, 13.6).box('yellow', 0, 0.046, 0, 0.08, 0.012, 4.0);
  B.at(1.5, 11.62).box('yellow', 0, 0.046, 0, 2.04, 0.012, 0.08);
  { const k = B.at(0.55, 10.95); k.rh('grey', 0, 0.45, 0, 0.86, 0.9, 0.36); k.box('black', 0, 0.45, 0.181, 0.01, 0.84, 0.005); }
  {
    const k = B.at(0.42, 12.7, Math.PI / 2);                                 // local x = -z do mundo
    for (const u of [-0.52, 0.52]) k.geo('tire', new THREE.TorusGeometry(0.31, 0.022, 5, 22), u, 0.33, 0);
    const P = { r: [-0.52, 0.33, 0], f: [0.52, 0.33, 0], s: [-0.18, 0.78, 0], h: [0.4, 0.86, 0], b: [-0.08, 0.32, 0] };
    tube(k, 'lightR', P.b, P.s, 0.018); tube(k, 'lightR', P.s, P.h, 0.018); tube(k, 'lightR', P.b, P.h, 0.02);
    tube(k, 'lightR', P.r, P.s, 0.012); tube(k, 'lightR', P.r, P.b, 0.012); tube(k, 'black', P.h, P.f, 0.014);
    k.rh('black', -0.2, 0.82, 0, 0.22, 0.04, 0.1);
    k.box('black', 0.42, 0.92, 0, 0.04, 0.03, 0.5);
  }
  for (const z of [10.9, 11.33]) { const k = B.at(2.68, z); k.cyl('binGreen', 0, 0.38, 0, 0.18, 0.76, 14, 0.2); k.cyl('black', 0, 0.78, 0, 0.21, 0.04, 14); }
  // Deck: espreguiçadeiras viradas uma para a outra com mesinha, mesa NE com 4 cadeiras-cubo, guarda-sol SE, cooler
  lounger(B, 4.75, 12.05, Math.PI / 2); lounger(B, 7.3, 12.05, -Math.PI / 2);
  roundTable(B, 6.03, 12.05, 0.22, 0.45);
  roundTable(B, 9.95, 7.75, 0.5, 0.74, 'wood');
  cubeChair(B, 9.95, 7.0, 0); cubeChair(B, 9.95, 8.5, Math.PI); cubeChair(B, 9.2, 7.75, Math.PI / 2); cubeChair(B, 10.7, 7.75, -Math.PI / 2);
  umbrella(B, 10.05, 12.05, 1.0);
  chair(B, 9.4, 12.0, Math.PI, 'white'); chair(B, 10.65, 12.0, Math.PI, 'white');
  { const k = B.at(8.65, 12.15); k.rh('fabricBlue', 0, 0.2, 0, 0.5, 0.4, 0.36); k.rh('white', 0, 0.41, 0, 0.52, 0.04, 0.38); }
  // Ducha sobre estrado, vasos, tochas
  { const k = B.at(3.28, 9.55); for (let i = -2; i <= 2; i++) k.rh('wood', 0, 0.06, i * 0.12, 0.6, 0.03, 0.1); }
  { const k = B.at(3.14, 9.55); k.cyl('chrome', 0, 1.1, 0, 0.025, 2.2, 8); k.box('chrome', 0.15, 2.18, 0, 0.3, 0.025, 0.025); k.cyl('chrome', 0.3, 2.15, 0, 0.08, 0.02, 12); }
  plantPot(B, 3.28, 8.45, 0.2, 0.45);
  { const k = B.at(10.6, 10.9); k.cyl('pot', 0, 0.2, 0, 0.18, 0.4, 12, 0.22); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; k.geo('plant', new THREE.ConeGeometry(0.035, 0.45, 4), Math.cos(a) * 0.1, 0.55, Math.sin(a) * 0.1, Math.sin(a) * 0.5, -Math.cos(a) * 0.5); } }
  for (const [x, z] of [[3.25, 10.35], [3.35, 12.1], [7.0, 7.42]]) tocha(B, x, z);
  // Piscina: escadas de inox (corrimão curvo), casa de máquinas (o LED é malha à parte), boias
  for (const x of [4.2, 8.9]) {
    const k = B.at(x, 8.25);
    for (const s of [-0.2, 0.2]) {
      k.cyl('chrome', s, 0.4, 0.22, 0.02, 0.8, 8);
      k.geo('chrome', new THREE.TorusGeometry(0.22, 0.02, 6, 10, Math.PI).rotateY(Math.PI / 2), s, 0.8, 0);
      k.cyl('chrome', s, 0.45, -0.22, 0.02, 0.7, 8);
    }
  }
  { const k = B.at(11.35, 12.9); k.rh('grey', 0, 0.25, 0, 0.6, 0.5, 0.45); k.rh('steel', 0, 0.51, 0, 0.62, 0.02, 0.47); }
  tube(B.at(0, 0), 'grey', [11.1, 0.06, 12.65], [11.1, 0.06, 12.1], 0.03);
  B.at(5.2, 9.1).geo('navy', new THREE.TorusGeometry(0.4, 0.13, 8, 20).rotateX(Math.PI / 2), 0, 0.07, 0);
  B.at(7.0, 10.5, 0.4).rs('white', 0, 0.08, 0, 1.75, 0.12, 0.72);
  B.at(4.4, 10.8).sph('lightR', 0, 0.1, 0, 0.12);
  // Faixa de grama: pisantes de pedra e balizadores
  for (const [x, z] of [[3.35, 6.5], [3.35, 6.9], [10.0, 6.5], [10.0, 6.9]]) B.at(x, z).rh('stoneTop', 0, 0.015, 0, 0.42, 0.03, 0.34);
  balizador(B, 5.9, 6.7); balizador(B, 9.3, 6.7);
  // Jardim: canteiro de terra com borda de pedra, faixa de pedrisco, lajotas, balizadores, roda de pedrisco da árvore, dracena
  B.at(12.94, 9.07).box('soil', 0, 0.015, 0, 0.7, 0.03, 5.3);
  B.at(12.55, 9.07).rh('stoneTop', 0, 0.04, 0, 0.14, 0.08, 5.3);
  B.at(12.375, 9.07).box('gravel', 0, 0.012, 0, 0.25, 0.024, 5.1);
  for (const [sx, sz] of STEPS) B.at(sx, sz).rh('stoneTop', 0, 0.015, 0, 0.42, 0.03, 0.34);
  for (const z of [7.0, 9.2, 11.25]) balizador(B, 12.34, z);
  B.at(12.3, 11.9).cyl('gravel', 0, 0.012, 0, 0.5, 0.024, 20);
  tallPlant(B, 11.3, 6.65, 0.2, 1.3);
  // Pátio: vaga de visitante pintada, calço, bueiro, grelha; junto ao muro: lixeira verde, caixa de correio, buxinho, banco
  for (const z of [12.95, 15.35]) B.at(5.7, z).box('white', 0, 0.035, 0, 4.6, 0.006, 0.1);
  B.at(8.0, 14.15).box('white', 0, 0.035, 0, 0.1, 0.006, 2.5);
  B.at(7.6, 14.15).rh('yellow', 0, 0.08, 0, 0.15, 0.1, 0.55);
  B.at(10.3, 14.6).cyl('rubber', 0, 0.035, 0, 0.3, 0.02, 20);
  B.at(4.0, 15.95).box('black', 0, 0.035, 0, 0.4, 0.008, 0.3);
  { const k = B.at(4.6, 16.2); k.rh('binGreen', 0, 0.47, 0, 0.5, 0.85, 0.55); k.rh('binGreen', 0, 0.91, -0.02, 0.54, 0.05, 0.6); for (const s of [-1, 1]) k.geo('tire', new THREE.CylinderGeometry(0.08, 0.08, 0.05, 10).rotateZ(Math.PI / 2), s * 0.22, 0.08, 0.22); }
  B.at(5.25, 16.455).rh('steel', 0, 1.1, 0, 0.3, 0.22, 0.14);
  plantPot(B, 7.1, 16.2, 0.28, 0.6);
  B.at(9.6, 16.25).rh('stoneTop', 0, 0.225, 0, 1.4, 0.45, 0.42);
}

// ----------------------------------------------------------------------------------------------
// Vegetação instanciada (troncos, folhas e copas), sombreado suave
// Folha de palmeira: tira que arqueia para baixo, com dobra em V no meio
function frondGeo() {
  const pos = [], idx = [], n = 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n, z = t, y = 0.12 * Math.sin(t * Math.PI * 0.8) - 0.32 * t * t, w = 0.2 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 0.01;
    pos.push(-w, y - 0.03, z, 0, y + 0.02, z, w, y - 0.03, z);
    if (i) { const a = (i - 1) * 3, b2 = i * 3; idx.push(a, b2, a + 1, a + 1, b2, b2 + 1, a + 1, b2 + 1, a + 2, a + 2, b2 + 1, b2 + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
// Copa: icosaedro subdividido com relevo irregular (parece maço de folhas, não bola)
function blobGeo() {
  const g = new THREE.IcosahedronGeometry(1, 3);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = 1 + 0.09 * Math.sin(v.x * 7.1 + v.y * 3.3) * Math.cos(v.z * 6.7 - v.y * 2.1) + 0.06 * Math.sin(v.x * 13 + v.z * 11);
    p.setXYZ(i, v.x * n, v.y * n, v.z * n);
  }
  g.deleteAttribute('uv');
  const m = mergeVerts(g);
  m.computeVertexNormals();
  return m;
}
// Funde vértices repetidos (normais contínuas) sem depender dos addons
function mergeVerts(g) {
  const p = g.attributes.position, map = new Map(), pos = [], idx = [];
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`;
    let j = map.get(key);
    if (j === undefined) { j = pos.length / 3; map.set(key, j); pos.push(p.getX(i), p.getY(i), p.getZ(i)); }
    idx.push(j);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setIndex(idx);
  g.dispose();
  return out;
}
function addVegetation(group) {
  const trunks = [], fronds = [], blobs = [], flowers = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), r = rng(31);
  const GREENS = [0x3b6628, 0x52823a, 0x6f9f45];
  const M = (x, y, z, rx, ry, rz, sx, sy, sz) => m.compose(new THREE.Vector3(x, y, z), q.setFromEuler(e.set(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz)).clone();
  const jit = (c, k = 0.12) => new THREE.Color(c).multiplyScalar(1 - k / 2 + r() * k);

  for (const [x, z, h, s, pot] of PALMS) {
    const y0 = pot ? 0.55 : 0;
    trunks.push({ m: M(x, y0, z, 0, 0, (r() - 0.5) * 0.08, 0.1 * s, h, 0.1 * s), c: 0x8b7358 });
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.3, up = i % 2 ? 0.35 : -0.05;
      fronds.push({ m: M(x, y0 + h, z, up - r() * 0.3, a, (r() - 0.5) * 0.3, 0.7 * s, 1.2 * s, 1.35 * s * (0.85 + r() * 0.25)), c: jit(GREENS[i % 3]) });
    }
    blobs.push({ m: M(x, y0 + h, z, 0, 0, 0, 0.13 * s, 0.11 * s, 0.13 * s), c: 0x6b5a3e });
    if (pot) blobs.push({ m: M(x, 0.27, z, 0, 0, 0, 0.24, 0.28, 0.24), c: MAT.pot });
  }
  for (const [x, z, rad, tone] of SHRUBS) {
    for (let i = 0; i < 5; i++) {
      const a = r() * Math.PI * 2, d = i ? rad * 0.5 : 0;
      const s = rad * (i ? 0.5 + r() * 0.25 : 0.75);
      blobs.push({ m: M(x + Math.cos(a) * d, s * 0.75 + (i ? 0 : rad * 0.2), z + Math.sin(a) * d, 0, r() * 3, 0, s, s * 0.85, s), c: jit(GREENS[(tone + i) % 3]) });
    }
  }
  for (const [x, z, rad] of TREES) {
    trunks.push({ m: M(x, 0, z, 0, 0, 0, 0.14 * rad, 1.7 * rad, 0.14 * rad), c: 0x6e573f });
    for (let i = 0; i < 9; i++) {
      const a = (i / 8) * Math.PI * 2 + r(), d = i === 8 ? 0 : rad * (0.45 + r() * 0.15);
      const s = rad * (i === 8 ? 0.75 : 0.42 + r() * 0.15);
      blobs.push({ m: M(x + Math.cos(a) * d, 1.6 * rad + (i === 8 ? 0.4 * rad : (r() - 0.3) * 0.4 * rad), z + Math.sin(a) * d, 0, r() * 3, 0, s, s * 0.8, s), c: jit(GREENS[i % 2]) });
    }
  }
  for (const [x, z] of FLOWERS) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + r() * 0.5;
      flowers.push({ m: M(x, 0.03, z, -0.6 - r() * 0.5, a, 0, 0.45, 1.0, 0.42), c: jit(i % 3 ? 0xc8344f : 0x9e2340, 0.15) });
    }
  }

  const trunkGeo = new THREE.CylinderGeometry(0.6, 1, 1, 9).translate(0, 0.5, 0);
  const out = [];
  for (const [list, geo, side, rough] of [[trunks, trunkGeo, THREE.FrontSide, 0.95], [fronds, frondGeo(), THREE.DoubleSide, 0.7], [flowers, frondGeo(), THREE.DoubleSide, 0.6], [blobs, blobGeo(), THREE.FrontSide, 0.85]]) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, side, roughness: rough });
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((it, i) => { im.setMatrixAt(i, it.m); im.setColorAt(i, new THREE.Color(it.c)); });
    im.castShadow = true;
    im.receiveShadow = true;
    group.add(im);
    out.push(im);
  }
  return out;
}

// ----------------------------------------------------------------------------------------------
// Oclusão de ambiente pintada: escurece o piso junto às paredes, móveis, carros e plantas.
// Uma textura só, sobre o lote inteiro, gerada uma vez.
const AO = { x0: -0.4, z0: -0.4, w: 14.2, d: 17.4, ppm: 48, y: 0.0615 };
function aoOverlay(foot) {
  const cv = document.createElement('canvas');
  cv.width = Math.round(AO.w * AO.ppm); cv.height = Math.round(AO.d * AO.ppm);
  const g = cv.getContext('2d'), P = AO.ppm, OFF = 20000;
  // Sombra deslocada: desenha fora da tela e só a sombra borrada cai no lugar (funciona no Safari)
  g.shadowOffsetX = OFF;
  const rect = (x0, z0, x1, z1, a, blur) => {
    g.shadowColor = `rgba(0,0,0,${a})`;
    g.shadowBlur = blur;
    g.fillRect((x0 - AO.x0) * P - OFF, (z0 - AO.z0) * P, (x1 - x0) * P, (z1 - z0) * P);
  };
  const disc = (x, z, rad, a, blur) => {
    g.shadowColor = `rgba(0,0,0,${a})`;
    g.shadowBlur = blur;
    g.beginPath();
    g.arc((x - AO.x0) * P - OFF, (z - AO.z0) * P, rad * P, 0, Math.PI * 2);
    g.fill();
  };
  for (const f of foot) {
    const wall = f.key === 'wall' || f.key === 'muro';
    const a = wall ? 0.28 : Math.min(0.4, 0.2 + f.h * 0.22);
    rect(f.x0, f.z0, f.x1, f.z1, a, wall ? 12 : 7 + f.h * 6);
  }
  rect(UP.x - 0.72, UP.z - 1.7, UP.x + 0.72, UP.z + 1.7, 0.55, 14); // sombra densa sob o up!
  for (const [x, z, rad] of SHRUBS) disc(x, z, rad * 0.9, 0.3, 8);
  for (const [x, z, rad] of TREES) disc(x, z, rad * 0.3, 0.25, 10);
  for (const [x, z, , , pot] of PALMS) disc(x, z, pot ? 0.22 : 0.15, 0.3, 6);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(AO.w, AO.d).rotateX(-Math.PI / 2).translate(AO.x0 + AO.w / 2, AO.y, AO.z0 + AO.d / 2),
    new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }),
  );
  mesh.renderOrder = 1;
  return mesh;
}

// Base da maquete (lote) e sombra de contato embaixo dela
const BASE = { x0: -0.22, z0: -0.22, x1: LOT.w + 0.14, z1: LOT.d + 0.16, h: 0.4 };
function contactShadow() {
  const pad = 2.6, w = BASE.x1 - BASE.x0 + pad * 2, d = BASE.z1 - BASE.z0 + pad * 2;
  const cv = document.createElement('canvas'), P = 24, OFF = 20000;
  cv.width = Math.round(w * P); cv.height = Math.round(d * P);
  const g = cv.getContext('2d');
  g.shadowOffsetX = OFF;
  // larga e clara + estreita e escura (os dois lados) + reforço à esquerda/frente (dx −0,10 m)
  for (const [a, blur, grow, dx] of [[0.26, 44, 0.3, 0], [0.5, 10, 0.03, 0], [0.22, 16, 0.03, -0.1]]) {
    g.shadowColor = `rgba(0,0,0,${a})`;
    g.shadowBlur = blur;
    g.fillRect((pad - grow + dx) * P - OFF, (pad - grow + 0.06) * P, (w - pad * 2 + grow * 2) * P, (d - pad * 2 + grow * 2) * P);
  }
  const t = new THREE.CanvasTexture(cv);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2).translate(BASE.x0 - pad + w / 2, -BASE.h - 0.001, BASE.z0 - pad + d / 2),
    new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }),
  );
  return mesh;
}

// ----------------------------------------------------------------------------------------------
// Realce, luz acesa e caixas de toque
// Poça de luz: retângulo arredondado de borda suave (centro 1 → borda 0,25), cobre o cômodo inteiro
function poolTex() {
  const n = 128, cv = document.createElement('canvas');
  cv.width = cv.height = n;
  const g = cv.getContext('2d'), im = g.createImageData(n, n);
  const sm = (t) => { t = Math.min(1, Math.max(0, t / 0.32)); return t * t * (3 - 2 * t); };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, v = (j + 0.5) / n;
    const a = 0.25 + 0.75 * sm(Math.min(u, 1 - u)) * sm(Math.min(v, 1 - v));
    const k = (j * n + i) * 4;
    im.data[k] = im.data[k + 1] = im.data[k + 2] = 255;
    im.data[k + 3] = Math.round(a * 255);
  }
  g.putImageData(im, 0, 0);
  return new THREE.CanvasTexture(cv);
}
// Lavagem nas paredes: alfa 0,35 embaixo → 0,12 no topo
function washTex() {
  const cv = document.createElement('canvas');
  cv.width = 4; cv.height = 64;
  const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64);
  gr.addColorStop(0, 'rgba(255,255,255,.12)');
  gr.addColorStop(1, 'rgba(255,255,255,.35)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 4, 64);
  return new THREE.CanvasTexture(cv);
}
// Moldura retangular de fitas (largura wd) em y
function frameGeo(x, z, w, d, y, wd) {
  const parts = [[x + w / 2, z, w + wd, wd], [x + w / 2, z + d, w + wd, wd], [x, z + d / 2, wd, d], [x + w, z + d / 2, wd, d]];
  const B = new Batch();
  for (const [cx, cz, sx, sz] of parts) B.add('f', new THREE.BoxGeometry(sx, 0.012, sz).translate(cx, y, cz));
  const p = B.parts.f, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(Batch.cat(p.pos, p.n * 3), 3));
  return g;
}
const floorTop = (room) => (room.h > 0 ? 0.06 : 0.04);
// Há parede da casa cobrindo a maior parte deste lado do cômodo?
function hasWall(axis, c, a0, a1) {
  return WALLS.some((w) => !w.muro && w.axis === axis && Math.abs(w.c - c) < 0.01 && Math.min(w.a1, a1) - Math.max(w.a0, a0) > (a1 - a0) * 0.6);
}

export const HL = { wall: 0xffd79a, floor: 0xffc46b, veil: 0xfff3dc };
// Cor da luz acesa. Creme quente claro: puxa o vermelho sobre o azul sem escurecer o piso branco
export const LIGHT = { pool: 0xfff0a0, wash: 0xffd27a, cap: 0xffcf73, lamp: 0xfff0c4, led: 0x4aa8ff };
// Luminárias (ITEMS do card): ponto de luz no teto cortado
const LAMPS = {
  quarto: [[5.2, 2.1]], sala: [[8.45, 2.1]], balcao: [[11.4, 1.7]], garagem: [[1.5, 13.3]],
  banheiro: [[1.2, 7.5]], dispensa: [[1.2, 9.7]], varanda: [[2.1, 5.2], [6.3, 5.2], [10.4, 5.2]],
};

export function buildModel() {
  const group = new THREE.Group();
  const TX = textures();
  const mats = {};
  for (const [k, c] of Object.entries(MAT)) {
    const [roughness, metalness] = ROUGH[k] ?? [0.85, 0];
    mats[k] = new THREE.MeshStandardMaterial({ color: c, roughness, metalness });
  }
  mats.glass = new THREE.MeshStandardMaterial({ color: MAT.glass, roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false });
  mats.lightW.emissive = new THREE.Color(0x665e44);
  for (const [k, t] of Object.entries(TX)) mats['f_' + k] = new THREE.MeshStandardMaterial({ map: t.map, roughness: FLOOR_ROUGH[k] ?? 0.85 });
  mats.f_water.emissive = new THREE.Color(0x021c2c);

  // Base da maquete: topo de grama, laterais lisas (sem nada fora do lote)
  const bw = BASE.x1 - BASE.x0, bd = BASE.z1 - BASE.z0;
  const ground = new THREE.Mesh(
    worldUV(new THREE.BoxGeometry(bw, BASE.h, bd).translate(BASE.x0 + bw / 2, -BASE.h / 2, BASE.z0 + bd / 2), TX.grass.tile),
    [mats.base, mats.base, mats.f_grass, mats.base, mats.base, mats.base],
  );
  ground.receiveShadow = true;
  ground.castShadow = true;
  group.add(ground, contactShadow());

  const B = new Batch();
  for (const [x, z, w, d, k] of FLOORS) B.add('f_' + k, slab(x, z, w, d, FLOOR_Y[k], TX[k].tile));
  // Piscina: borda de pedra, faixa escura da parede interna e água
  const cop = poolShape(COPING);
  cop.holes.push(poolShape(0));
  B.add('coping', flatShape(cop, 0.055, 1));
  const edge = poolShape(0);
  edge.holes.push(poolShape(-0.12));
  B.add('poolEdge', flatShape(edge, 0.05, 1));
  B.add('f_water', flatShape(poolShape(-0.12), 0.048, TX.water.tile));
  addWalls(B);
  addFurniture(B);
  const solid = [ground, ...B.build(mats, group)];
  group.add(aoOverlay(B.foot));
  const veg = addVegetation(group);
  solid.push(...veg);

  // VW up! na garagem (módulo à parte, materiais próprios; não entra no Batch)
  const up = criarUp(THREE);
  up.position.set(UP.x, UP.y, UP.z);
  up.rotation.y = UP.ry;
  // MeshPhysical (clearcoat/transmissão) vira Standard: um programa a menos e ~200 ms a menos no primeiro render
  const conv = new Map();
  const toStd = (m) => {
    if (!m.isMeshPhysicalMaterial) return m;
    if (!conv.has(m)) {
      const n = new THREE.MeshStandardMaterial();
      for (const k of ['color', 'emissive']) n[k].copy(m[k]);
      for (const k of ['name', 'roughness', 'metalness', 'map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'emissiveIntensity', 'envMapIntensity', 'opacity', 'transparent', 'side', 'depthWrite', 'alphaMap', 'aoMap', 'vertexColors', 'flatShading', 'polygonOffset', 'polygonOffsetFactor', 'polygonOffsetUnits']) n[k] = m[k];
      if (m.clearcoat > 0) n.roughness = Math.min(n.roughness, 0.25);   // brilho do verniz
      conv.set(m, n);
      m.dispose();
    }
    return conv.get(m);
  };
  // funde as peças por material (e por sombra): ~50 malhas viram ~14 desenhos
  const lots = new Map();
  up.updateMatrixWorld(true);
  const inv = up.matrixWorld.clone().invert();
  up.traverse((o) => {
    if (!o.isMesh) return;
    const mat = toStd(o.material);
    const key = mat.uuid + (o.castShadow ? 's' : '');
    if (!lots.has(key)) lots.set(key, { mat, cast: o.castShadow, geos: [] });
    const gg = o.geometry.clone().applyMatrix4(inv.clone().multiply(o.matrixWorld));
    lots.get(key).geos.push(gg.index ? gg.toNonIndexed() : gg);
  });
  up.clear();
  for (const { mat, cast, geos } of lots.values()) {
    const cat = (name, n) => {
      const out = new Float32Array(geos.reduce((a, g) => a + g.attributes.position.count * n, 0));
      let o = 0;
      for (const g of geos) {
        const a = g.attributes[name];
        if (a) out.set(a.array, o);   // sem uv → zeros
        o += g.attributes.position.count * n;
      }
      return new THREE.BufferAttribute(out, n);
    };
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', cat('position', 3));
    geo.setAttribute('normal', cat('normal', 3));
    geo.setAttribute('uv', cat('uv', 2));
    geos.forEach((g) => g.dispose());
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cast; m.receiveShadow = true;   // decalques do módulo seguem sem projetar sombra
    up.add(m);
    solid.push(m);
  }
  group.add(up);

  // LED verde da casa de máquinas: acende com a bomba
  const pumpLed = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 6), new THREE.MeshStandardMaterial({ color: 0x2f6b34, roughness: 0.3 }));
  pumpLed.position.set(11.35, 0.52, 12.72);
  group.add(pumpLed);
  solid.push(pumpLed);

  // Cômodos: realce, luz acesa e caixa de toque
  const tex = poolTex(), wtex = washTex();
  const pick = [], rooms = {};
  const hlMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, toneMapped: false });
  const lampMat = hlMat(LIGHT.lamp, 1);
  const lampGeo = new THREE.CircleGeometry(0.12, 18).rotateX(-Math.PI / 2);
  for (const room of ROOMS) {
    const [x, z, w, d] = room.rect;
    const y = floorTop(room);
    const hl = new THREE.Group();
    hl.visible = false;
    const fl = new THREE.Mesh(frameGeo(x + 0.14, z + 0.14, w - 0.28, d - 0.28, y + 0.02, 0.07), hlMat(HL.floor, 0.95));
    fl.renderOrder = 6;
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.2, d - 0.2).rotateX(-Math.PI / 2).translate(x + w / 2, y + 0.015, z + d / 2), hlMat(HL.veil, 0.22));
    veil.renderOrder = 5;
    hl.add(veil, fl);
    if (room.h > 0) {
      const top = new THREE.Mesh(frameGeo(x, z, w, d, CUT + 0.022, 0.17), hlMat(HL.wall, 1));
      top.renderOrder = 6;
      hl.add(top);
    }

    // Luz acesa: poça no piso + lavagem nas paredes + tampa âmbar + ponto de luz (sem PointLight: não recompila shaders)
    const glow = new THREE.Group();
    glow.visible = false;
    const ext = room.h === 0;
    let poolMesh;
    if (room.id === 'piscina') {
      poolMesh = new THREE.Mesh(flatShape(poolShape(-0.12), 0.0525, 1), hlMat(LIGHT.led, 0.45));
    } else {
      const m = hlMat(LIGHT.pool, ext ? 0.22 : 0.5);
      m.map = tex;
      // Cômodo coberto: o plano fica logo abaixo do corte e cobre a abertura das paredes, então tinge tudo o que se vê
      // dentro (piso, tapetes, móveis, carro). Área externa: rente ao piso
      const py = ext ? y + 0.013 : CUT - 0.02, ins = ext ? 0.08 : T / 2 + 0.005;
      poolMesh = new THREE.Mesh(new THREE.PlaneGeometry(w - 2 * ins, d - 2 * ins).rotateX(-Math.PI / 2).translate(x + w / 2, py, z + d / 2), m);
    }
    poolMesh.renderOrder = 4;
    glow.add(poolMesh);
    if (!ext) {
      const e = T / 2 + 0.004, hgt = CUT - 0.07, cy = 0.07 + hgt / 2;
      const wm = hlMat(LIGHT.wash, 0.9);
      wm.map = wtex;
      const faces = [
        ['x', z, x, x + w, [x + w / 2, cy, z + e], 0, w],
        ['x', z + d, x, x + w, [x + w / 2, cy, z + d - e], Math.PI, w],
        ['z', x, z, z + d, [x + e, cy, z + d / 2], Math.PI / 2, d],
        ['z', x + w, z, z + d, [x + w - e, cy, z + d / 2], -Math.PI / 2, d],
      ];
      for (const [ax, c, a0, a1, p, ry, len] of faces) {
        if (!hasWall(ax, c, a0, a1)) continue;
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(len - 2 * e, hgt).rotateY(ry).translate(...p), wm);
        pl.renderOrder = 4;
        glow.add(pl);
      }
      const cap = new THREE.Mesh(frameGeo(x, z, w, d, CUT + 0.0135, 0.17), hlMat(LIGHT.cap, 0.38));
      cap.renderOrder = 4;
      glow.add(cap);
    }
    for (const [lx, lz] of LAMPS[room.id] ?? []) {
      const lp = new THREE.Mesh(lampGeo, lampMat);
      lp.position.set(lx, CUT - 0.05, lz);
      lp.renderOrder = 4;
      glow.add(lp);
    }

    const ph = room.h > 0 ? CUT : 0.4;
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, ph, d), new THREE.MeshBasicMaterial({ visible: false }));
    p.position.set(x + w / 2, ph / 2, z + d / 2);
    p.userData.roomId = room.id;
    pick.push(p);
    group.add(hl, glow, p);
    rooms[room.id] = { highlight: hl, glow, rect: room.rect, center: new THREE.Vector3(x + w / 2, y, z + d / 2) };
  }

  return {
    group,
    pick,
    solid,
    rooms,
    veg,
    up,
    pumpLed,
    tex,
    wtex,
    textures: TX,
    bounds: new THREE.Box3(new THREE.Vector3(BASE.x0 - 0.3, -BASE.h, BASE.z0 - 0.2), new THREE.Vector3(BASE.x1 + 0.5, CUT, BASE.z1 + 0.4)),
    lotCx: LOT.w / 2,
    // Pegada real do lote (enquadramento da câmera)
    foot: new THREE.Box3(new THREE.Vector3(BASE.x0, -BASE.h, BASE.z0), new THREE.Vector3(BASE.x1, CUT, BASE.z1)),
  };
}

// Cômodo que contém o ponto (x, z) do piso; null fora de todos
export function roomAt(x, z) {
  const r = ROOMS.find(({ rect: [rx, rz, w, d] }) => x >= rx - 0.02 && x <= rx + w + 0.02 && z >= rz - 0.02 && z <= rz + d + 0.02);
  return r ? r.id : null;
}

export function setHighlight(model, roomId) {
  for (const id in model.rooms) model.rooms[id].highlight.visible = id === roomId;
}

// Luz acesa por cômodo: map = { [roomId]: hex | null } (a cor fica fixa por cômodo)
export function setGlow(model, map) {
  for (const id in model.rooms) model.rooms[id].glow.visible = map[id] != null;
}

// LED verde da bomba da piscina
export function setPump(model, on) {
  const m = model.pumpLed.material;
  m.emissive.setHex(on ? 0x3dff6a : 0x000000);
  m.emissiveIntensity = on ? 1.6 : 0;
}

export function disposeModel(model) {
  model.group.traverse((o) => {
    o.geometry?.dispose();
    if (o.material) for (const m of [].concat(o.material)) { m.map?.dispose(); m.dispose(); }
  });
  model.tex.dispose();
  model.wtex.dispose();
}
