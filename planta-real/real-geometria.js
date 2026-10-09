// Planta Real — maquete realista sem telhado: pisos, paredes cortadas, piscina, móveis, carros e vegetação
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
import {
  T, LOT, POOL, ROOMS, WALLS, OPENING, CUT, CUT_MURO, COPING,
  FLOORS, STEPS, CARS, PALMS, SHRUBS, TREES, FLOWERS,
} from './real-dados.js';

// Paleta (luz de dia quente; tudo claro como na referência)
const MAT = {
  wall: 0xf4f1ec, muro: 0xefece6, frame: 0x2b2c2e, glass: 0xbfe0ea,
  white: 0xf8f7f4, linen: 0xe7e0d4, cushion: 0xd9cdb6, pillow: 0xfbfaf6, throw: 0xc8b28e, rug: 0xddd5c6, rug2: 0xcbbfa8,
  wood: 0xc29467, woodDark: 0x80593a, woodLight: 0xdcc09a, stoneTop: 0xeeebe5, black: 0x2a2a2c, steel: 0xb7bbc0,
  chrome: 0xd9dde1, screen: 0x15171a, brick: 0xd8cfc2, rubber: 0x3b3b3d, yellow: 0xe8c040, fabricBlue: 0x6c829c,
  carGlass: 0x1b2128, tire: 0x1d1d1f, lightW: 0xfff6dc, lightR: 0xc0262b, umbrella: 0xf1eadb, pot: 0xf3f1ec, soil: 0x6b5a45,
  bookA: 0x8a5a44, bookB: 0x5f7a8a, bookC: 0xc9a25a, plant: 0x5d8a3e, coping: 0xebe5d9, poolEdge: 0x1f7fb2,
  wallCap: 0xe0dad0, muroCap: 0xdcd6cb, base: 0xd4cec4, rim: 0xc9ccd0,
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
    grain(g, s, seed + 1, 6000, 0.035, [140, 130, 120]);
  });
}

function textures() {
  const T_ = {};
  T_.tile = { map: tiles(0xeeebe5, '#cfc8bd', 2, 2, 3, 0.035, 3), tile: 1.8 };   // porcelanato 90 × 90
  T_.tileCool = { map: tiles(0xe7ebed, '#bcc5ca', 4, 4, 5, 0.04, 1), tile: 1.6 };
  T_.stone = { map: tiles(0xeae4d8, '#cdc3b3', 2, 4, 7, 0.07), tile: 2.0 };       // pedra clara do deck
  T_.paving = { map: tiles(0xb5b0a8, '#85817a', 4, 8, 9, 0.1), tile: 2.4 };       // piso intertravado do pátio
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
      geo: (k, g, cx = 0, cy = 0, cz = 0) => put(k, g, cx, cy, cz),
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
  k.cone('umbrella', 0, 2.38, 0, r, 0.36, 16);
  k.cyl('black', 0, 0.04, 0, 0.25, 0.08, 10);
}
function plantPot(B, x, z, r = 0.22, h = 0.5) {
  const k = B.at(x, z);
  k.cyl('pot', 0, h / 2, 0, r * 0.8, h, 12, r);
  k.sph('plant', 0, h + r * 0.7, 0, r * 1.3, 0.9);
}
// Perfil lateral (u = comprimento, v = altura) extrudado na largura, com quinas arredondadas
function sideExtrude(pts, wid, bev = 0.05) {
  const sh = new THREE.Shape();
  pts.forEach(([u, v], i) => (i ? sh.lineTo(u, v) : sh.moveTo(u, v)));
  sh.closePath();
  return sideExtrudeShape(sh, wid, bev);
}
function sideExtrudeShape(sh, wid, bev) {
  const g = new THREE.ExtrudeGeometry(sh, { depth: wid - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.8, bevelSegments: 2, curveSegments: 10 });
  g.rotateY(-Math.PI / 2);                     // u → z local, extrusão → -x
  g.translate((wid - 2 * bev) / 2, 0, 0);
  return g;
}
// Carro: carroceria com caixas de roda, vidros escuros inclinados, teto, rodas com aro
function car(B, c) {
  const k = B.at(c.x, c.z, -c.rot + Math.PI / 2); // local: comprimento em z (frente em +z)
  const L = c.len, W = c.wid, suv = c.type === 'suv';
  const body = 'car' + (suv ? 'B' : 'A');
  const hb = suv ? 0.98 : 0.84, roof = suv ? 1.66 : 1.42, hood = suv ? 1.15 : 0.92;
  const fw = L / 2 - 0.72, rw = -L / 2 + 0.68, R = 0.34, y0 = 0.26;
  // Carroceria: base com recortes das rodas
  const sh = new THREE.Shape();
  sh.moveTo(L / 2, y0 + 0.04);
  sh.lineTo(fw + R, y0);
  sh.absarc(fw, 0.32, R, 0, Math.PI, false);
  sh.lineTo(rw + R, y0);
  sh.absarc(rw, 0.32, R, 0, Math.PI, false);
  sh.lineTo(-L / 2 + 0.02, y0 + 0.04);
  sh.lineTo(-L / 2, hb - 0.12);
  sh.lineTo(-L / 2 + 0.08, hb);
  sh.lineTo(L / 2 - hood, hb + 0.02);
  sh.lineTo(L / 2 - 0.12, hb - 0.1);
  sh.lineTo(L / 2, hb - 0.24);
  sh.closePath();
  k.geo(body, sideExtrudeShape(sh, W, 0.07));
  // Vidros (estufa) e teto
  const rs = suv ? 0.14 : 0.3, ws = suv ? 0.6 : 0.62;
  const gr = [[-L / 2 + 0.1, hb - 0.01], [L / 2 - hood + 0.02, hb], [L / 2 - hood - ws, roof - 0.03], [-L / 2 + 0.1 + rs, roof - 0.04]];
  k.geo('carGlass', sideExtrude(gr, W - 0.16, 0.04));
  const rf = [[-L / 2 + 0.12 + rs, roof - 0.06], [L / 2 - hood - ws - 0.02, roof - 0.05], [L / 2 - hood - ws - 0.06, roof + 0.01], [-L / 2 + 0.16 + rs, roof]];
  k.geo(body, sideExtrude(rf, W - 0.2, 0.04));
  // Colunas B e C na cor da carroceria
  const bz = (L / 2 - hood - ws + -L / 2 + rs) / 2 + 0.05;
  for (const s of [-1, 1]) k.box(body, s * (W / 2 - 0.1), (hb + roof) / 2, bz, 0.05, roof - hb, 0.1);
  if (suv) { for (const s of [-1, 1]) k.box('black', s * (W / 2 - 0.25), roof + 0.04, -0.2, 0.04, 0.04, 1.6); }
  for (const s of [-1, 1]) {
    k.box(body, s * (W / 2 + 0.05), hb + 0.1, L / 2 - hood - 0.12, 0.12, 0.1, 0.08);   // retrovisores
    k.box('lightW', s * (W / 2 - 0.24), hb - 0.2, L / 2 - 0.02, 0.34, 0.08, 0.06);      // faróis
    k.box('lightR', s * (W / 2 - 0.18), hb - 0.16, -L / 2 + 0.01, 0.26, 0.12, 0.04);    // lanternas
    for (const f of [fw, rw]) {
      const t = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 20).rotateZ(Math.PI / 2);
      k.geo('tire', t, s * (W / 2 - 0.13), 0.32, f);
      const rim = new THREE.CylinderGeometry(0.2, 0.2, 0.226, 16).rotateZ(Math.PI / 2);
      k.geo('rim', rim, s * (W / 2 - 0.13), 0.32, f);
    }
  }
  k.box('black', 0, hb - 0.42, L / 2 - 0.02, W - 0.5, 0.16, 0.06);                      // grade
  k.box('black', 0, 0.36, L / 2 - 0.04, W - 0.1, 0.1, 0.06);                           // para-choques
  k.box('black', 0, 0.36, -L / 2 + 0.04, W - 0.1, 0.1, 0.06);
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

  for (const [x, z, h, s] of PALMS) {
    const pot = h < 2;
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
    if (/^car|^tire|^rim/.test(f.key)) continue;
    const wall = f.key === 'wall' || f.key === 'muro';
    const a = wall ? 0.42 : Math.min(0.5, 0.22 + f.h * 0.25);
    rect(f.x0, f.z0, f.x1, f.z1, a, wall ? 16 : 7 + f.h * 6);
  }
  for (const c of CARS) {                                       // sombra densa sob o carro
    const ax = Math.abs(Math.cos(c.rot)) > 0.5, hl = c.len / 2 - 0.15, hw = c.wid / 2 - 0.1;
    const [dx, dz] = ax ? [hl, hw] : [hw, hl];
    rect(c.x - dx, c.z - dz, c.x + dx, c.z + dz, 0.6, 14);
  }
  for (const [x, z, rad] of SHRUBS) disc(x, z, rad * 0.9, 0.3, 8);
  for (const [x, z, rad] of TREES) disc(x, z, rad * 0.3, 0.25, 10);
  for (const [x, z, h] of PALMS) disc(x, z, h < 2 ? 0.22 : 0.15, 0.3, 6);
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
  const pad = 1.6, w = BASE.x1 - BASE.x0 + pad * 2, d = BASE.z1 - BASE.z0 + pad * 2;
  const cv = document.createElement('canvas'), P = 24, OFF = 20000;
  cv.width = Math.round(w * P); cv.height = Math.round(d * P);
  const g = cv.getContext('2d');
  g.shadowOffsetX = OFF;
  // larga e clara + estreita e escura (penumbra de luz de estúdio)
  for (const [a, blur, grow] of [[0.22, 40, 0.25], [0.45, 10, 0.02]]) {
    g.shadowColor = `rgba(0,0,0,${a})`;
    g.shadowBlur = blur;
    g.fillRect((pad - grow + 0.06) * P - OFF, (pad - grow - 0.04) * P, (w - pad * 2 + grow * 2) * P, (d - pad * 2 + grow * 2) * P);
  }
  const t = new THREE.CanvasTexture(cv);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2).translate(BASE.x0 - pad + w / 2, -BASE.h - 0.001, BASE.z0 - pad + d / 2),
    new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }),
  );
  return mesh;
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
  for (const [k, c] of Object.entries(MAT)) {
    const [roughness, metalness] = ROUGH[k] ?? [0.85, 0];
    mats[k] = new THREE.MeshStandardMaterial({ color: c, roughness, metalness });
  }
  mats.glass = new THREE.MeshStandardMaterial({ color: MAT.glass, roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false });
  mats.carA = new THREE.MeshStandardMaterial({ color: CARS[0].color, roughness: 0.22, metalness: 0.05 });
  mats.carB = new THREE.MeshStandardMaterial({ color: CARS[1].color, roughness: 0.25, metalness: 0.3 });
  mats.carGlass = new THREE.MeshStandardMaterial({ color: MAT.carGlass, roughness: 0.06, metalness: 0.2 });
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

  // Cômodos: realce, brilho e caixa de toque
  const tex = radialTex();
  const pick = [], rooms = {};
  const hlMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, toneMapped: false });
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
    bounds: new THREE.Box3(new THREE.Vector3(BASE.x0 - 0.3, -BASE.h, BASE.z0 - 0.2), new THREE.Vector3(BASE.x1 + 0.5, CUT, BASE.z1 + 0.4)),
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
