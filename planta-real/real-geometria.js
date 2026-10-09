// Planta Real — maquete realista sem telhado: pisos, paredes cortadas, piscina, móveis, carros e vegetação
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
import {
  T, LOT, POOL, ROOMS, WALLS, OPENING, CUT, CUT_MURO, COPING,
  FLOORS, STEPS, CARS, PALMS, SHRUBS, TREES, FLOWERS,
} from './real-dados.js';

// Paleta (luz de dia quente; tudo claro como na referência)
const MAT = {
  wall: 0xf7f5f1, muro: 0xf2f0eb, frame: 0x2b2c2e, glass: 0xbfe0ea,
  white: 0xf8f7f4, linen: 0xe7e0d4, cushion: 0xd9cdb6, pillow: 0xfbfaf6, throw: 0xc8b28e, rug: 0xddd5c6, rug2: 0xcbbfa8,
  wood: 0xc29467, woodDark: 0x80593a, woodLight: 0xdcc09a, stoneTop: 0xeeebe5, black: 0x2a2a2c, steel: 0xb7bbc0,
  chrome: 0xd9dde1, screen: 0x15171a, brick: 0xd8cfc2, rubber: 0x3b3b3d, yellow: 0xe8c040, fabricBlue: 0x6c829c,
  carGlass: 0x1b2128, tire: 0x1d1d1f, lightW: 0xfff6dc, lightR: 0xc0262b, umbrella: 0xf1eadb, pot: 0xf3f1ec, soil: 0x6b5a45,
  bookA: 0x8a5a44, bookB: 0x5f7a8a, bookC: 0xc9a25a, plant: 0x5d8a3e, coping: 0xebe5d9, poolEdge: 0x2289bd,
};

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
// Granulado leve
function grain(g, s, seed, n, alpha, rgb) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const v = r();
    g.fillStyle = `rgba(${rgb[0] + v * 40 | 0},${rgb[1] + v * 40 | 0},${rgb[2] + v * 40 | 0},${alpha * r()})`;
    g.fillRect(r() * s, r() * s, 1 + r() * 2, 1 + r() * 2);
  }
}
// Placas com rejunte: nx × ny placas por textura
function tiles(base, grout, nx, ny, seed, vary = 0.04) {
  return makeTex(256, (g, s) => {
    g.fillStyle = grout; g.fillRect(0, 0, s, s);
    const r = rng(seed), w = s / nx, h = s / ny;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const k = 1 - vary / 2 + r() * vary;
      const c = new THREE.Color(base).multiplyScalar(k);
      g.fillStyle = `#${c.getHexString()}`;
      g.fillRect(i * w + 1, j * h + 1, w - 2, h - 2);
    }
    grain(g, s, seed + 1, 2500, 0.05, [140, 130, 120]);
  });
}

function textures() {
  const T_ = {};
  T_.tile = { map: tiles(0xedeae4, '#d6d0c6', 2, 2, 3), tile: 1.8 };        // porcelanato 90 × 90
  T_.tileCool = { map: tiles(0xe6eaec, '#c3cbcf', 4, 4, 5), tile: 1.6 };
  T_.stone = { map: tiles(0xe9e3d7, '#d3cabb', 2, 4, 7, 0.06), tile: 2.0 };  // pedra clara do deck
  T_.paving = { map: tiles(0xb3afa8, '#8f8b84', 4, 8, 9, 0.08), tile: 2.4 }; // piso intertravado do pátio
  T_.concrete = { map: makeTex(256, (g, s) => { g.fillStyle = '#a4a39e'; g.fillRect(0, 0, s, s); grain(g, s, 11, 9000, 0.12, [120, 120, 116]); }), tile: 3 };
  T_.wood = {
    map: makeTex(256, (g, s) => {
      const r = rng(13), n = 8, h = s / n;
      for (let j = 0; j < n; j++) {
        const off = r() * s;
        for (let k = 0; k < 2; k++) {
          const c = new THREE.Color(0xd2b089).multiplyScalar(0.92 + r() * 0.14);
          g.fillStyle = `#${c.getHexString()}`;
          g.fillRect((off + k * s / 2) % s - s / 2, j * h, s / 2, h);
          g.fillRect((off + k * s / 2) % s + s / 2, j * h, s / 2, h);
        }
        g.fillStyle = 'rgba(110,80,50,.35)'; g.fillRect(0, j * h, s, 1);
      }
      grain(g, s, 14, 3000, 0.06, [120, 90, 60]);
    }),
    tile: 1.6,
  };
  T_.grass = {
    map: makeTex(256, (g, s) => {
      g.fillStyle = '#5b8a3a'; g.fillRect(0, 0, s, s);
      const r = rng(17);
      for (let i = 0; i < 9000; i++) {
        const c = new THREE.Color(0x67983f).multiplyScalar(0.78 + r() * 0.42);
        g.fillStyle = `#${c.getHexString()}`;
        g.fillRect(r() * s, r() * s, 1, 2 + r() * 2);
      }
    }),
    tile: 2.5,
  };
  T_.water = {
    map: makeTex(256, (g, s) => {
      g.fillStyle = '#3cb4e6'; g.fillRect(0, 0, s, s);
      const r = rng(19);
      g.lineWidth = 2;
      for (let i = 0; i < 26; i++) {
        g.strokeStyle = `rgba(200,240,255,${0.18 + r() * 0.2})`;
        g.beginPath();
        const y = r() * s, a = 4 + r() * 6, f = 1 + Math.floor(r() * 3);
        for (let x = -4; x <= s + 4; x += 8) g.lineTo(x, y + Math.sin((x / s) * Math.PI * 2 * f + i) * a);
        g.stroke();
      }
    }),
    tile: 2.2,
  };
  return T_;
}

// Geometrias mescladas por material: uma malha por material no fim (poucas draw calls)
class Batch {
  constructor() { this.parts = {}; }
  add(key, g, m) {
    const src = g.index ? g.toNonIndexed() : g;
    if (m) src.applyMatrix4(m);
    const p = (this.parts[key] ||= { pos: [], nor: [], uv: [] });
    p.pos.push(...src.attributes.position.array);
    p.nor.push(...src.attributes.normal.array);
    if (src.attributes.uv) p.uv.push(...src.attributes.uv.array);
    if (src !== g) src.dispose();
    g.dispose();
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
      cyl: (k, cx, cy, cz, r, h, seg = 12, r2 = r) => put(k, new THREE.CylinderGeometry(r2, r, h, seg), cx, cy, cz),
      sph: (k, cx, cy, cz, r, sy = 1) => {
        const g = new THREE.SphereGeometry(r, 10, 6);
        g.scale(1, sy, 1);
        put(k, g, cx, cy, cz);
      },
      cone: (k, cx, cy, cz, r, h, seg = 8) => put(k, new THREE.ConeGeometry(r, h, seg), cx, cy, cz),
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
      g.setAttribute('position', new THREE.Float32BufferAttribute(p.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(p.nor, 3));
      if (p.uv.length === p.pos.length / 3 * 2) g.setAttribute('uv', new THREE.Float32BufferAttribute(p.uv, 2));
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
// Móveis (referencial local: frente em +z, costas em -z)
function bed(B, x, z, ry, w, l) {
  const k = B.at(x, z, ry);
  k.box('woodDark', 0, 0.14, 0, w + 0.06, 0.26, l);                    // base
  k.box('wood', 0, 0.55, -l / 2 - 0.03, w + 0.2, 1.0, 0.06);            // cabeceira
  k.box('pillow', 0, 0.38, 0.01, w - 0.04, 0.22, l - 0.08);            // colchão
  const n = w > 1.2 ? 2 : 1, pw = (w - 0.2) / n;
  for (let i = 0; i < n; i++) k.box('white', -w / 2 + 0.1 + pw * (i + 0.5), 0.55, -l / 2 + 0.28, pw - 0.06, 0.13, 0.38);
  k.box('throw', 0, 0.5, l / 2 - 0.42, w + 0.02, 0.04, 0.7);           // manta nos pés
}
function nightstand(B, x, z) {
  const k = B.at(x, z);
  k.box('wood', 0, 0.25, 0, 0.45, 0.5, 0.4);
  k.cyl('white', 0, 0.62, 0, 0.1, 0.24, 10, 0.07);                     // abajur
}
function sofa(B, x, z, ry, w, d = 0.9, mat = 'linen') {
  const k = B.at(x, z, ry);
  k.box(mat, 0, 0.21, 0.02, w, 0.42, d - 0.04);
  k.box(mat, 0, 0.5, -d / 2 + 0.11, w, 0.6, 0.22);                    // encosto
  for (const s of [-1, 1]) k.box(mat, s * (w / 2 - 0.09), 0.32, 0.02, 0.18, 0.64, d - 0.04); // braços
  const n = w > 1.6 ? 3 : 2, cw = (w - 0.36) / n;
  for (let i = 0; i < n; i++) k.box('cushion', -w / 2 + 0.18 + cw * (i + 0.5), 0.47, 0.08, cw - 0.03, 0.1, d - 0.32);
  k.box('fabricBlue', -w / 2 + 0.38, 0.62, -d / 2 + 0.3, 0.36, 0.3, 0.12, -0.25);
  k.box('pillow', w / 2 - 0.38, 0.62, -d / 2 + 0.3, 0.36, 0.3, 0.12, -0.25);
}
function table(B, x, z, ry, w, d, h = 0.75, top = 'wood') {
  const k = B.at(x, z, ry);
  k.box(top, 0, h - 0.02, 0, w, 0.04, d);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box('black', sx * (w / 2 - 0.06), (h - 0.04) / 2, sz * (d / 2 - 0.06), 0.04, h - 0.04, 0.04);
}
function roundTable(B, x, z, r, h = 0.74, top = 'white') {
  const k = B.at(x, z);
  k.cyl(top, 0, h - 0.02, 0, r, 0.04, 20);
  k.cyl('black', 0, h / 2, 0, 0.04, h - 0.04, 8);
  k.cyl('black', 0, 0.02, 0, r * 0.45, 0.04, 12);
}
function chair(B, x, z, ry, mat = 'white') {
  const k = B.at(x, z, ry);
  k.box(mat, 0, 0.45, 0, 0.44, 0.06, 0.44);
  k.box(mat, 0, 0.7, -0.2, 0.44, 0.45, 0.05);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box('black', sx * 0.19, 0.21, sz * 0.19, 0.03, 0.42, 0.03);
}
function armchair(B, x, z, ry) {
  const k = B.at(x, z, ry);
  k.box('white', 0, 0.22, 0, 0.62, 0.44, 0.62);
  k.box('white', 0, 0.48, -0.25, 0.62, 0.5, 0.12);
  k.box('cushion', 0, 0.47, 0.05, 0.46, 0.08, 0.48);
}
function stool(B, x, z, h = 0.7) {
  const k = B.at(x, z);
  k.cyl('woodLight', 0, h, 0, 0.17, 0.05, 14);
  k.cyl('black', 0, h / 2, 0, 0.025, h, 6);
  k.cyl('black', 0, 0.01, 0, 0.16, 0.02, 12);
}
function rug(B, x, z, ry, w, d, mat = 'rug') {
  B.at(x, z, ry).box(mat, 0, 0.07, 0, w, 0.015, d);
}
function wardrobe(B, x, z, ry, w, d = 0.6, h = 1.75) {
  const k = B.at(x, z, ry);
  k.box('woodLight', 0, h / 2, 0, w, h, d);
  const n = Math.max(2, Math.round(w / 0.5));
  for (let i = 1; i < n; i++) k.box('wood', -w / 2 + w * i / n, h / 2, d / 2 + 0.003, 0.01, h - 0.08, 0.01);
}
function counter(B, x, z, ry, w, d = 0.62, opts = {}) {
  const k = B.at(x, z, ry);
  k.box(opts.base || 'white', 0, 0.44, 0.02, w, 0.88, d - 0.04);
  k.box(opts.top || 'stoneTop', 0, 0.9, 0, w + 0.02, 0.04, d);
  if (opts.sink != null) { k.box('chrome', opts.sink, 0.915, 0, 0.6, 0.01, 0.4); k.box('steel', opts.sink, 0.92, 0, 0.5, 0.01, 0.32); }
  if (opts.cook != null) {
    k.box('black', opts.cook, 0.92, 0, 0.6, 0.012, 0.5);
    for (const [a, b] of [[-0.14, -0.12], [0.14, -0.12], [-0.14, 0.12], [0.14, 0.12]]) k.cyl('rubber', opts.cook + a, 0.93, b, 0.07, 0.01, 12);
  }
}
function tvRack(B, x, z, ry, w) {
  const k = B.at(x, z, ry);
  k.box('wood', 0, 0.22, 0, w, 0.44, 0.4);
  k.box('screen', 0, 1.05, -0.17, Math.min(1.3, w - 0.1), 0.72, 0.04);
}
function shelf(B, x, z, ry, w, d = 0.35, h = 1.6) {
  const k = B.at(x, z, ry);
  k.box('wood', 0, h / 2, 0, w, h, d);
  const r = rng(Math.round(x * 100 + z));
  for (let u = -w / 2 + 0.08; u < w / 2 - 0.08; u += 0.12) k.box(['bookA', 'bookB', 'bookC', 'white'][Math.floor(r() * 4)], u, h + 0.03, 0, 0.1, 0.06, d - 0.08);
}
function lounger(B, x, z, ry) {
  const k = B.at(x, z, ry);
  k.box('white', 0, 0.2, 0.15, 0.68, 0.12, 1.45);
  k.box('pillow', 0, 0.28, 0.15, 0.6, 0.06, 1.35);
  k.box('white', 0, 0.42, -0.78, 0.68, 0.08, 0.62, -0.75);
  k.box('fabricBlue', 0, 0.33, 0.35, 0.55, 0.02, 0.5);              // toalha
}
function umbrella(B, x, z, r = 1.25) {
  const k = B.at(x, z);
  k.cyl('woodDark', 0, 1.15, 0, 0.03, 2.3, 6);
  k.cone('umbrella', 0, 2.38, 0, r, 0.36, 10);
  k.cyl('black', 0, 0.04, 0, 0.25, 0.08, 10);
}
function plantPot(B, x, z, r = 0.22, h = 0.5) {
  const k = B.at(x, z);
  k.cyl('pot', 0, h / 2, 0, r * 0.8, h, 12, r);
  k.sph('plant', 0, h + r * 0.7, 0, r * 1.3, 0.9);
}
function car(B, c) {
  const k = B.at(c.x, c.z, -c.rot + Math.PI / 2); // local: comprimento em z (frente em +z)
  const L = c.len, W = c.wid, suv = c.type === 'suv';
  const body = 'car' + (suv ? 'B' : 'A');
  const hb = suv ? 0.95 : 0.85;
  k.box(body, 0, 0.3 + (hb - 0.3) / 2, 0, W, hb - 0.3, L);                   // carroceria
  k.frustum(body, 0, hb + 0.03, L * 0.3, W - 0.04, 0.08, L * 0.3, 0.92);      // capô
  const cab = suv ? L * 0.56 : L * 0.5, cz = suv ? -L * 0.08 : -L * 0.06;
  k.frustum('carGlass', 0, hb + 0.25, cz, W - 0.1, 0.5, cab, 0.8);         // vidros inclinados
  k.box(body, 0, hb + 0.52, cz - 0.03, (W - 0.1) * 0.8 - 0.04, 0.05, cab * 0.8 - 0.3); // teto
  if (suv) { for (const s of [-1, 1]) k.box('black', s * (W / 2 - 0.25), hb + 0.57, cz - 0.05, 0.04, 0.04, cab - 0.7); }
  for (const s of [-1, 1]) {
    k.box(body, s * (W / 2 + 0.06), hb + 0.12, cz + cab / 2 - 0.1, 0.12, 0.1, 0.08);  // retrovisores
    k.box('lightW', s * (W / 2 - 0.22), hb - 0.12, L / 2 + 0.002, 0.3, 0.08, 0.02);  // faróis
    k.box('lightR', s * (W / 2 - 0.18), hb - 0.1, -L / 2 - 0.002, 0.26, 0.1, 0.02);  // lanternas
    for (const f of [L / 2 - 0.72, -L / 2 + 0.68]) {
      const g = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 14);
      g.rotateZ(Math.PI / 2);
      g.translate(s * (W / 2 - 0.1), 0.32, f);
      B.add('tire', g, new THREE.Matrix4().makeRotationY(-c.rot + Math.PI / 2).setPosition(c.x, 0, c.z));
    }
  }
  k.box('black', 0, 0.36, L / 2 - 0.01, W - 0.2, 0.16, 0.04);               // grade
}

function addFurniture(B) {
  // Quarto casal: cama na janela do fundo, criados, banco, guarda-roupa (x=0), cômoda (x=3,6), tapete
  rug(B, 1.8, 1.6, 0, 2.4, 2.4, 'rug2');
  bed(B, 1.8, 1.15, 0, 1.6, 2.0);
  nightstand(B, 0.72, 0.32); nightstand(B, 2.88, 0.32);
  B.at(1.8, 2.42).box('wood', 0, 0.22, 0, 1.3, 0.44, 0.36);
  wardrobe(B, 0.38, 2.75, Math.PI / 2, 1.9);
  B.at(3.28, 1.8).box('woodLight', 0, 0.42, 0, 0.45, 0.84, 1.1);
  plantPot(B, 3.25, 3.85, 0.18);
  // Quarto: escrivaninha sob a janela, cadeira, estante (x=3,6), cama de solteiro, guarda-roupa e rack (x=6,8)
  table(B, 5.0, 0.42, 0, 1.4, 0.65, 0.75, 'woodLight');
  B.at(5.0, 0.3).box('screen', 0, 1.0, 0, 0.6, 0.36, 0.03);
  chair(B, 5.0, 1.15, Math.PI, 'black');
  shelf(B, 3.86, 2.1, Math.PI / 2, 1.4);
  rug(B, 5.0, 2.6, 0, 1.4, 1.8);
  bed(B, 6.22, 3.2, Math.PI, 1.0, 1.85);
  wardrobe(B, 6.43, 0.85, -Math.PI / 2, 1.4, 0.58);
  tvRack(B, 6.58, 1.9, -Math.PI / 2, 0.7);
  plantPot(B, 3.95, 3.85, 0.17);
  // Sala: rack + TV (x=6,8), sofá virado para a TV, mesa de jantar oval com 6 cadeiras, geladeira
  rug(B, 7.9, 1.7, 0, 1.6, 2.0, 'rug2');
  tvRack(B, 7.05, 1.7, Math.PI / 2, 1.6);
  sofa(B, 8.35, 1.7, -Math.PI / 2, 1.9);
  table(B, 9.3, 3.2, Math.PI / 2, 1.35, 0.9, 0.75, 'woodLight');
  for (const [cx, cz, r] of [[8.75, 2.75, Math.PI / 2], [8.75, 3.65, Math.PI / 2], [9.85, 2.75, -Math.PI / 2], [9.85, 3.65, -Math.PI / 2], [9.3, 2.25, 0], [9.3, 4.0, Math.PI]]) chair(B, cx, cz, r, 'woodLight');
  B.at(9.9, 0.42).box('steel', 0, 0.85, 0, 0.7, 1.7, 0.68);
  plantPot(B, 9.35, 0.35, 0.18, 0.4);
  // Balcão / cozinha: bancada do fundo com fogão e pia, bancada lateral, ilha de madeira com 2 banquetas
  counter(B, 11.4, 0.39, 0, 2.0, 0.62, { cook: -0.55, sink: 0.35 });
  counter(B, 12.12, 2.0, -Math.PI / 2, 2.0, 0.6);
  counter(B, 10.9, 3.15, Math.PI / 2, 1.3, 0.7, { base: 'wood', top: 'woodLight' });
  stool(B, 11.55, 2.85); stool(B, 11.55, 3.45);
  // Varanda: palmeira em vaso (vegetação), rede, sofá na janela, churrasqueira, mesa de madeira com bancos
  { const k = B.at(1.55, 5.75); k.box('fabricBlue', 0, 0.55, 0, 2.2, 0.06, 0.75); k.box('woodDark', 1.2, 0.9, 0, 0.12, 1.8, 0.12); }
  sofa(B, 5.6, 4.72, 0, 2.0, 0.85);
  B.at(5.6, 5.45).box('woodLight', 0, 0.2, 0, 0.9, 0.4, 0.45);
  { const k = B.at(9.0, 4.62); k.box('brick', 0, 0.45, 0, 1.16, 0.9, 0.6); k.box('black', 0, 0.91, 0.05, 0.8, 0.02, 0.4); k.box('brick', 0, 1.3, -0.12, 0.8, 0.8, 0.3); }
  table(B, 11.52, 5.05, 0, 1.6, 0.8, 0.76, 'wood');
  for (const dz of [-0.62, 0.62]) B.at(11.52, 5.05 + dz).box('wood', 0, 0.22, 0, 1.4, 0.05, 0.3);
  plantPot(B, 6.9, 4.5, 0.2, 0.45);
  // Banheiro: box de vidro, vaso, pia com bancada
  { const k = B.at(0.55, 6.75); k.box('glass', 0.47, 0.85, 0, 0.02, 1.7, 0.9); k.box('glass', 0, 0.85, 0.47, 0.9, 1.7, 0.02); k.box('white', 0, 0.03, 0, 0.86, 0.04, 0.86); }
  { const k = B.at(0.4, 8.1); k.box('white', -0.2, 0.42, 0, 0.18, 0.4, 0.42); k.box('white', 0.05, 0.2, 0, 0.42, 0.4, 0.36); k.box('pillow', 0.07, 0.41, 0, 0.38, 0.03, 0.32); }
  counter(B, 1.7, 8.5, Math.PI, 0.9, 0.46, { base: 'woodLight', sink: 0 });
  // Dispensa: máquina de lavar, tanque, prateleiras
  { const k = B.at(0.45, 9.25); k.box('white', 0, 0.45, 0, 0.6, 0.9, 0.6); k.cyl('steel', 0, 0.91, 0.05, 0.2, 0.02, 14); }
  { const k = B.at(0.45, 10.0); k.box('white', 0, 0.45, 0, 0.6, 0.9, 0.55); k.box('steel', 0, 0.905, 0.04, 0.44, 0.01, 0.36); }
  shelf(B, 1.6, 10.33, Math.PI, 1.2, 0.35, 1.5);
  // Garagem: faixas da vaga, armário de ferramentas
  for (const dx of [-1.05, 1.05]) B.at(1.5 + dx, 13.4).box('yellow', 0, 0.045, 0, 0.08, 0.01, 4.6);
  { const k = B.at(0.85, 10.95); k.box('steel', 0, 0.45, 0, 1.2, 0.9, 0.5); k.box('woodLight', 0, 0.91, 0, 1.22, 0.03, 0.52); }
  // Deck: espreguiçadeiras na faixa sul, mesa redonda com 4 cadeiras (canto NE), guarda-sol (canto SE)
  lounger(B, 4.95, 12.05, Math.PI / 2); lounger(B, 6.85, 12.05, Math.PI / 2);
  roundTable(B, 10.1, 7.95, 0.38);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; chair(B, 10.1 + Math.sin(a) * 0.62, 7.95 + Math.cos(a) * 0.62, a + Math.PI, 'white'); }
  umbrella(B, 10.25, 11.6, 1.1);
  armchair(B, 9.9, 12.0, Math.PI); armchair(B, 10.55, 11.2, -Math.PI / 2);
  // Pátio: banco de pedra e vaso junto ao portão de pedestre, lixeira
  B.at(4.7, 16.3).box('stoneTop', 0, 0.22, 0, 1.2, 0.44, 0.4);
  plantPot(B, 7.0, 16.25, 0.28, 0.6);
  B.at(8.0, 16.3).box('rubber', 0, 0.5, 0, 0.6, 1.0, 0.6);
  // Jardim: lajotas
  for (const [sx, sz] of STEPS) B.at(sx, sz, 0.1).box('stoneTop', 0, 0.02, 0, 0.5, 0.04, 0.8);
  for (const c of CARS) car(B, c);
}

// ----------------------------------------------------------------------------------------------
// Vegetação low-poly instanciada (troncos, folhas e copas)
function frondGeo() {
  const v = [0, 0, 0, -0.16, 0.06, 0.38, 0, 0.1, 0.45, 0.16, 0.06, 0.38, 0, -0.22, 1];
  const idx = [0, 1, 2, 0, 2, 3, 1, 4, 2, 2, 4, 3];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function addVegetation(group) {
  const trunks = [], fronds = [], blobs = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), r = rng(31);
  const GREENS = [0x3f6b2c, 0x55863a, 0x76a64a];
  const M = (x, y, z, rx, ry, rz, sx, sy, sz) => m.compose(new THREE.Vector3(x, y, z), q.setFromEuler(e.set(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz)).clone();

  for (const [x, z, h, s] of PALMS) {
    const pot = h < 2;
    const y0 = pot ? 0.55 : 0;
    trunks.push({ m: M(x, y0, z, 0, 0, (r() - 0.5) * 0.08, 0.1 * s, h, 0.1 * s), c: 0x8b7358 });
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.35;
      fronds.push({ m: M(x, y0 + h, z, 0.05 - r() * 0.35, a, 0, 0.75 * s, 1.1 * s, 1.35 * s), c: GREENS[i % 3] });
    }
    blobs.push({ m: M(x, y0 + h, z, 0, 0, 0, 0.14 * s, 0.12 * s, 0.14 * s), c: 0x6b5a3e });
    if (pot) blobs.push({ m: M(x, 0.27, z, 0, 0, 0, 0.24, 0.28, 0.24), c: MAT.pot });
  }
  for (const [x, z, rad, tone] of SHRUBS) {
    for (let i = 0; i < 3; i++) {
      const a = r() * Math.PI * 2, d = rad * 0.45;
      const s = rad * (0.65 + r() * 0.35);
      blobs.push({ m: M(x + Math.cos(a) * d, s * 0.7, z + Math.sin(a) * d, 0, r() * 3, 0, s, s * 0.85, s), c: GREENS[(tone + i) % 3] });
    }
  }
  for (const [x, z, rad] of TREES) {
    trunks.push({ m: M(x, 0, z, 0, 0, 0, 0.16 * rad, 1.6 * rad, 0.16 * rad), c: 0x6e573f });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + r(), d = i === 4 ? 0 : rad * 0.5;
      const s = rad * (i === 4 ? 0.85 : 0.6 + r() * 0.15);
      blobs.push({ m: M(x + Math.cos(a) * d, 1.6 * rad + (i === 4 ? 0.35 * rad : 0), z + Math.sin(a) * d, 0, r() * 3, 0, s, s * 0.8, s), c: GREENS[i % 2] });
    }
  }
  for (const [x, z] of FLOWERS) {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + r() * 0.5;
      fronds.push({ m: M(x, 0.04, z, -0.9 - r() * 0.4, a, 0, 0.55, 0.55, 0.5), c: i % 3 ? 0xc8344f : 0x9e2340 });
    }
  }

  const trunkGeo = new THREE.CylinderGeometry(0.6, 1, 1, 7).translate(0, 0.5, 0);
  const blobGeo = new THREE.IcosahedronGeometry(1, 1);
  const out = [];
  for (const [list, geo, side] of [[trunks, trunkGeo, THREE.FrontSide], [fronds, frondGeo(), THREE.DoubleSide], [blobs, blobGeo, THREE.FrontSide]]) {
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, side, flatShading: true });
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
// Realce, brilho e caixas de toque
function radialTex() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.5, 'rgba(255,255,255,.65)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}
// Moldura retangular de fitas (largura wd) em y
function frameGeo(x, z, w, d, y, wd) {
  const parts = [[x + w / 2, z, w + wd, wd], [x + w / 2, z + d, w + wd, wd], [x, z + d / 2, wd, d], [x + w, z + d / 2, wd, d]];
  const B = new Batch();
  for (const [cx, cz, sx, sz] of parts) B.add('f', new THREE.BoxGeometry(sx, 0.012, sz).translate(cx, y, cz));
  const p = B.parts.f, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p.pos, 3));
  return g;
}
const floorTop = (room) => (room.h > 0 ? 0.06 : 0.04);

export const HL = { wall: 0xffd79a, floor: 0xffc46b, veil: 0xfff3dc, glow: 0xffa53a };

export function buildModel() {
  const group = new THREE.Group();
  const TX = textures();
  const mats = {};
  for (const [k, c] of Object.entries(MAT)) mats[k] = new THREE.MeshLambertMaterial({ color: c });
  mats.glass = new THREE.MeshLambertMaterial({ color: MAT.glass, transparent: true, opacity: 0.35, depthWrite: false });
  mats.carA = new THREE.MeshStandardMaterial({ color: CARS[0].color, roughness: 0.4, metalness: 0 });
  mats.carB = new THREE.MeshStandardMaterial({ color: CARS[1].color, roughness: 0.35, metalness: 0 });
  mats.carGlass = new THREE.MeshStandardMaterial({ color: MAT.carGlass, roughness: 0.2, metalness: 0 });
  mats.lightW.emissive = new THREE.Color(0x665e44);
  for (const [k, t] of Object.entries(TX)) mats['f_' + k] = new THREE.MeshLambertMaterial({ map: t.map });
  mats.f_water.emissive = new THREE.Color(0x0b3a52);

  // Chão: gramado grande em volta do lote + calçada na frente
  const ground = new THREE.Mesh(worldUV(new THREE.PlaneGeometry(90, 90).rotateX(-Math.PI / 2).translate(LOT.w / 2, 0, LOT.d / 2), TX.grass.tile), mats.f_grass);
  ground.receiveShadow = true;
  group.add(ground);

  const B = new Batch();
  B.add('f_concrete', slab(-3, 16.75, LOT.w + 6, 1.6, 0.03, TX.concrete.tile));
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
  const veg = addVegetation(group);
  solid.push(...veg);

  // Cômodos: realce, brilho e caixa de toque
  const tex = radialTex();
  const pick = [], rooms = {};
  const hlMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false });
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
      const top = new THREE.Mesh(frameGeo(x, z, w, d, CUT + 0.01, 0.17), hlMat(HL.wall, 1));
      top.renderOrder = 6;
      hl.add(top);
    }
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.95, d * 0.95).rotateX(-Math.PI / 2).translate(x + w / 2, y + 0.012, z + d / 2),
      new THREE.MeshBasicMaterial({ map: tex, color: HL.glow, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    glow.renderOrder = 4;
    glow.visible = false;

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
    tex,
    textures: TX,
    bounds: new THREE.Box3(new THREE.Vector3(-0.4, 0, -0.3), new THREE.Vector3(LOT.w + 0.2, CUT, LOT.d + 0.4)),
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

// Brilho quente no piso: map = { [roomId]: hex | null }
export function setGlow(model, map) {
  for (const id in model.rooms) {
    const { glow } = model.rooms[id];
    const c = map[id];
    glow.visible = c != null;
    if (c != null) glow.material.color.setHex(c === 0xffb347 ? HL.glow : c);
  }
}

export function disposeModel(model) {
  model.group.traverse((o) => {
    o.geometry?.dispose();
    if (o.material) for (const m of [].concat(o.material)) { m.map?.dispose(); m.dispose(); }
  });
  model.tex.dispose();
}
