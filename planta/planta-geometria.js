// Planta — geometria e estilo raio-x (spec: /tmp/claude-0/design/planta/spec.md §1)
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
import { H, T, LOT, POOL, ROOMS, WALLS, OPENING, FURNITURE } from './planta-dados.js';

// Cores e opacidades do raio-x azul
export const XRAY = {
  lote:         { color: 0x0a2c7a, opacity: 0.55 },
  piso:         { color: 0x10398f, opacity: 0.75 },
  pisoExt:      { color: 0x0c3080, opacity: 0.50 },
  agua:         { color: 0x1f6fe0, opacity: 0.50 },
  contorno:     { color: 0x8fd0ff, opacity: 0.90 },
  parede:       { color: 0x2f6bff, opacity: 0.16 },
  arestaParede: { color: 0x8cc0ff, opacity: 0.70 },
  muro:         { color: 0x2f6bff, opacity: 0.08 },
  arestaMuro:   { color: 0x5f8fe0, opacity: 0.40 },
  caixilho:     { color: 0xcfe3ff, opacity: 0.80 },
  movel:        { color: 0x1a4fc4, opacity: 0.35 },
  arestaMovel:  { color: 0x6fa8ff, opacity: 0.45 },
  realce:       { color: 0xffffff, opacity: 1.0 },
  veu:          { color: 0x3d7bff, opacity: 0.35 },
  brilho:       { color: 0xffb347, opacity: 0.85 },
};

const meshMat = (k, extra) => new THREE.MeshBasicMaterial({ color: XRAY[k].color, opacity: XRAY[k].opacity, transparent: true, depthWrite: false, ...extra });
const lineMat = (k) => new THREE.LineBasicMaterial({ color: XRAY[k].color, opacity: XRAY[k].opacity, transparent: true });
const geo = (arr) => new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));

// Vértices de uma caixa centrada em (cx, cy, cz) com tamanho (sx, sy, sz)
function corners(cx, cy, cz, sx, sy, sz) {
  const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
  return [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
}
const QUADS = [[3, 7, 6, 2], [0, 1, 5, 4], [1, 2, 6, 5], [0, 4, 7, 3], [4, 5, 6, 7], [0, 3, 2, 1]];   // faces, anti-horário vistas de fora
const EDGES = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];

function addBox(arr, ...s) {
  const p = corners(...s);
  for (const [a, b, c, d] of QUADS) for (const i of [a, b, c, a, c, d]) arr.push(...p[i]);
}
function addBoxEdges(arr, ...s) {
  const p = corners(...s);
  for (const [a, b] of EDGES) arr.push(...p[a], ...p[b]);
}
// Retângulo plano em y, virado para cima
function addRect(arr, x, z, w, d, y) {
  const q = [[x, z], [x, z + d], [x + w, z + d], [x + w, z]];
  for (const i of [0, 1, 2, 0, 2, 3]) arr.push(q[i][0], y, q[i][1]);
}
function addRectEdges(arr, x, z, w, d, y) {
  const q = [[x, z], [x + w, z], [x + w, z + d], [x, z + d]];
  for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4]; arr.push(a[0], y, a[1], b[0], y, b[1]); }
}

// Caixas da parede com os vãos recortados (igual à Casa)
function wallBoxes(w) {
  const esp = w.muro ? 0.12 : T;
  const out = [];
  const box = (a, b, y0, y1) => {
    if (b - a <= 0.001 || y1 - y0 <= 0.001) return;
    const m = (a + b) / 2, cy = (y0 + y1) / 2;
    out.push(w.axis === 'x' ? [m, cy, w.c, b - a, y1 - y0, esp] : [w.c, cy, m, esp, y1 - y0, b - a]);
  };
  let cur = w.a0;
  for (const o of [...w.ops].sort((p, q) => p.a - q.a)) {
    box(cur, o.a, 0, w.h);
    const [y0, y1] = OPENING[o.t];
    if (y0 > 0) box(o.a, o.b, 0, y0);      // peitoril
    if (y1 < w.h) box(o.a, o.b, y1, w.h);  // verga
    cur = o.b;
  }
  box(cur, w.a1, 0, w.h);
  return out;
}

// Gradeado dos vãos de janela/vidro/portão: linhas a cada 0.30 m e travessas
function addMuntins(arr, w) {
  const pt = (u, y) => (w.axis === 'x' ? [u, y, w.c] : [w.c, y, u]);
  for (const o of w.ops) {
    if (o.t === 'door' || o.t === 'open') continue;
    const [y0, y1] = OPENING[o.t];
    for (let u = o.a; u <= o.b + 1e-6; u += 0.3) arr.push(...pt(u, y0), ...pt(u, y1));
    arr.push(...pt(o.a, y0), ...pt(o.b, y0), ...pt(o.a, y1), ...pt(o.b, y1));
  }
}

// Brilho de luz: gradiente radial branco, compartilhado pelo plano
function radialTex() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.45, 'rgba(255,255,255,.7)'); // miolo mais largo: brilho visível no piso
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}

export function buildPlan() {
  const group = new THREE.Group();
  const tex = radialTex();
  group.userData.tex = tex;
  const obj = (o, ro) => { o.renderOrder = ro; group.add(o); return o; };

  // Lote e piso
  const loteMesh = obj(new THREE.Mesh(new THREE.PlaneGeometry(LOT.w, LOT.d), meshMat('lote')), 0);
  loteMesh.rotation.x = -Math.PI / 2;
  loteMesh.position.set(LOT.w / 2, -0.01, LOT.d / 2);

  const piso = [], pisoExt = [];
  for (const r of ROOMS) {
    const [x, z, w, d] = r.rect;
    if (r.h > 0) addRect(piso, x, z, w, d, 0);
    else addRect(pisoExt, x, z, w, d, 0.002);
  }
  obj(new THREE.Mesh(geo(piso), meshMat('piso')), 0);
  obj(new THREE.Mesh(geo(pisoExt), meshMat('pisoExt')), 0);

  // Piscina: forma em (x, -z) para girar -90° em X sem espelhar
  const pool = new THREE.Shape();
  const { x0, x1, zc, r } = POOL;
  pool.moveTo(x0, -(zc - r));
  pool.lineTo(x1, -(zc - r));
  pool.absarc(x1, -zc, r, Math.PI / 2, -Math.PI / 2, true);
  pool.lineTo(x0, -(zc + r));
  const poolGeo = new THREE.ShapeGeometry(pool);
  poolGeo.rotateX(-Math.PI / 2);
  poolGeo.translate(0, 0.006, 0);
  // DoubleSide: o espelhamento em y=-z inverte a face da forma
  obj(new THREE.Mesh(poolGeo, meshMat('agua', { side: THREE.DoubleSide })), 0);
  const ring = [];
  for (const p of pool.getPoints(24)) ring.push(p.x, 0.01, -p.y);
  obj(new THREE.LineLoop(geo(ring), lineMat('contorno')), 4);

  // Paredes e muros
  const parede = [], arP = [], muro = [], arM = [], cx = [];
  for (const w of WALLS) {
    const [fill, edge] = w.muro ? [muro, arM] : [parede, arP];
    for (const b of wallBoxes(w)) { addBox(fill, ...b); addBoxEdges(edge, ...b); }
    addMuntins(cx, w);
  }
  obj(new THREE.Mesh(geo(parede), meshMat('parede', { side: THREE.DoubleSide })), 3);
  obj(new THREE.LineSegments(geo(arP), lineMat('arestaParede')), 4);
  obj(new THREE.Mesh(geo(muro), meshMat('muro')), 3);
  obj(new THREE.LineSegments(geo(arM), lineMat('arestaMuro')), 4);
  obj(new THREE.LineSegments(geo(cx), lineMat('caixilho')), 4);

  // Móveis: só silhuetas
  const mov = [], arMov = [];
  for (const [x, z, w, d, h] of FURNITURE) {
    const s = [x + w / 2, h / 2, z + d / 2, w, h, d];
    addBox(mov, ...s);
    addBoxEdges(arMov, ...s);
  }
  obj(new THREE.Mesh(geo(mov), meshMat('movel')), 2);
  obj(new THREE.LineSegments(geo(arMov), lineMat('arestaMovel')), 4);

  // Cômodos: realce, brilho e caixa de toque
  const pick = [], rooms = {};
  for (const room of ROOMS) {
    const [x, z, w, d] = room.rect;
    const hl = new THREE.Group();
    hl.visible = false;
    const ed = [];
    if (room.h > 0) addBoxEdges(ed, x + w / 2, (room.h + 0.02) / 2, z + d / 2, w, room.h + 0.02, d);
    else addRectEdges(ed, x, z, w, d, 0.03);
    const edges = new THREE.LineSegments(geo(ed), lineMat('realce'));
    edges.renderOrder = 6;
    const veu = [];
    addRect(veu, x, z, w, d, 0.015);
    const veil = new THREE.Mesh(geo(veu), meshMat('veu'));
    veil.renderOrder = 5;
    hl.add(edges);
    hl.add(veil);

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(w - 0.2, d - 0.2),
      new THREE.MeshBasicMaterial({ map: tex, color: XRAY.brilho.color, opacity: XRAY.brilho.opacity, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(x + w / 2, 0.02, z + d / 2);
    glow.renderOrder = 1;
    glow.visible = false;

    const ph = Math.max(room.h, 0.4);
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, ph, d), new THREE.MeshBasicMaterial({ visible: false }));
    p.position.set(x + w / 2, ph / 2, z + d / 2);
    p.userData.roomId = room.id;
    pick.push(p);

    group.add(hl, glow, p);
    rooms[room.id] = { highlight: hl, glow, center: new THREE.Vector3(x + w / 2, 0, z + d / 2) };
  }

  return {
    group,
    pick,
    rooms,
    bounds: new THREE.Box3(new THREE.Vector3(-0.3, 0, -0.3), new THREE.Vector3(LOT.w + 0.1, H, LOT.d + 0.1)),
  };
}

// Mostra só o realce do cômodo (null oculta todos)
export function setHighlight(plan, roomId) {
  for (const id in plan.rooms) plan.rooms[id].highlight.visible = id === roomId;
}

// Brilho âmbar/azul no piso: map = { [roomId]: hex | null }
export function setGlow(plan, map) {
  for (const id in plan.rooms) {
    const { glow } = plan.rooms[id];
    const c = map[id];
    glow.visible = c != null;
    if (c != null) glow.material.color.setHex(c);
  }
}

export function disposePlan(plan) {
  plan.group.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  plan.group.userData.tex?.dispose();
}
