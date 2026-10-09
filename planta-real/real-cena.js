// Planta Real — cena, luz do dia, câmera fixa em 3/4, render sob demanda e toque
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
import { buildModel, setHighlight, setGlow, disposeModel, roomAt } from './real-geometria.js';

// Vista 0 = ângulo da referência: pela frente (rua), alto, levemente de lado. Graus
export const VIEWS = [{ az: 8, el: 60 }, { az: 98, el: 60 }, { az: 188, el: 60 }, { az: 278, el: 60 }];
const FOV = 30;

const RAD = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - (1 - t) ** 3;

export class RealScene {
  constructor(host, { onPick } = {}) {
    this._host = host;
    this._onPick = onPick ?? (() => {});
    this._m = buildModel();
    const sc = (this._scene = new THREE.Scene());
    sc.background = new THREE.Color(0x5b8a3a);
    sc.add(this._m.group);

    // Luz de dia quente e suave: céu + sol baixo pela frente-esquerda
    sc.add(new THREE.HemisphereLight(0xfff4e2, 0x7d8a5c, 1.35));
    const sun = (this._sun = new THREE.DirectionalLight(0xffe2bd, 2.6));
    const c = this._m.bounds.getCenter(new THREE.Vector3());
    sun.position.set(c.x - 9, 16, c.z + 7);
    sun.target.position.copy(c);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 50 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    sc.add(sun, sun.target);

    this._cam = new THREE.PerspectiveCamera(FOV, 1, 1, 300);
    const r = (this._r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NeutralToneMapping;
    r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.shadowMap.autoUpdate = false; // sombras calculadas uma vez (a cena é estática)
    r.shadowMap.needsUpdate = true;
    this._cv = r.domElement;
    this._cv.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    host.append(this._cv);

    this._tgt0 = c.clone().setY(0);
    this._ray = new THREE.Raycaster();
    this._ptrs = new Map();
    this._g = null;
    this._pinch = null;
    this._az = VIEWS[0].az;
    this._el = VIEWS[0].el;
    this._vi = 0;
    this._zoom = 1;
    this._px = 0; this._py = 0; // pan em metros no plano da tela
    this._dist = 40;
    this._w = 0; this._h = 0;
    this._raf = 0; this._tw = 0; this._count = 0;

    this._ev = [
      ['pointerdown', (e) => this._down(e)],
      ['pointermove', (e) => this._move(e)],
      ['pointerup', (e) => this._up(e, true)],
      ['pointercancel', (e) => this._up(e, false)],
      ['wheel', (e) => this._wheel(e), { passive: false }],
    ];
    for (const [t, f, o] of this._ev) this._cv.addEventListener(t, f, o);

    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(host);
    this._resize();
  }

  setGlow(map) { setGlow(this._m, map); this.requestRender(); }
  select(roomId) { setHighlight(this._m, roomId ?? null); this.requestRender(); }

  setView(i) {
    const to = VIEWS[i];
    this._vi = i;
    cancelAnimationFrame(this._tw);
    this._tw = 0;
    const az0 = this._az, el0 = this._el;
    const da = ((to.az - az0) % 360 + 540) % 360 - 180; // menor caminho
    const de = to.el - el0;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || (Math.abs(da) < 1e-3 && Math.abs(de) < 1e-3)) {
      this._az = to.az; this._el = to.el;
      this.requestRender();
      return;
    }
    const t0 = performance.now();
    const step = () => {
      const k = ease(Math.min(1, (performance.now() - t0) / 480));
      this._az = az0 + da * k;
      this._el = el0 + de * k;
      this._tw = k < 1 ? requestAnimationFrame(step) : 0;
      this.requestRender();
    };
    this._tw = requestAnimationFrame(step);
  }

  nextView() { this.setView((this._vi + 1) % VIEWS.length); return this._vi; }

  resetView() {
    this._zoom = 1; this._px = 0; this._py = 0;
    this.setView(0);
  }

  get viewIndex() { return this._vi; }
  get renderCount() { return this._count; }

  // Ponto da tela (px CSS, relativo à janela) do centro do piso de um cômodo — usado nos testes
  // u, v = fração do retângulo do cômodo em x e z (0,5 = centro)
  screenOf(roomId, u = 0.5, v0 = 0.5) {
    const room = this._m.rooms[roomId];
    if (!room) return null;
    this._frame();
    const [x, z, w, d] = room.rect;
    const v = new THREE.Vector3(x + w * u, room.center.y, z + d * v0).project(this._cam);
    const r = this._cv.getBoundingClientRect();
    return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
  }

  // Um único rAF coalescido; nunca loop contínuo
  requestRender() {
    if (!this._raf) this._raf = requestAnimationFrame(() => this._draw());
  }

  dispose() {
    this._ro.disconnect();
    for (const [t, f, o] of this._ev) this._cv.removeEventListener(t, f, o);
    cancelAnimationFrame(this._raf);
    cancelAnimationFrame(this._tw);
    disposeModel(this._m);
    this._r.dispose();
    this._cv.remove();
  }

  _draw() {
    this._raf = 0;
    if (!this._w) return;
    this._frame();
    this._r.render(this._scene, this._cam);
    this._count++;
  }

  // Câmera em perspectiva enquadrando o lote (distância mínima que cabe os 8 cantos)
  _frame() {
    const cam = this._cam, b = this._m.bounds;
    const az = this._az * RAD, el = this._el * RAD;
    const back = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const right = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az));
    const up = new THREE.Vector3().crossVectors(back, right);
    const asp = this._w && this._h ? this._w / this._h : 1;
    const tv = Math.tan(FOV * RAD / 2), th = tv * asp;
    let d = 0;
    const v = new THREE.Vector3();
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
      v.set(x, y, z).sub(this._tgt0);
      const cz = v.dot(back);
      d = Math.max(d, cz + Math.abs(v.dot(right)) / th, cz + Math.abs(v.dot(up)) / tv);
    }
    d *= 1.04;
    this._dist = d;
    // Planta desce um pouco para o cabeçalho; pan desloca o alvo no plano da tela
    const tgt = this._tgt0.clone()
      .addScaledVector(up, 0.05 * d * tv + this._py)
      .addScaledVector(right, this._px);
    cam.position.copy(tgt).addScaledVector(back, d / this._zoom);
    cam.up.set(0, 1, 0);
    cam.lookAt(tgt);
    cam.aspect = asp;
    cam.near = Math.max(0.5, d / this._zoom - 40);
    cam.far = d / this._zoom + 80;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }

  _resize() {
    const w = this._host.clientWidth, h = this._host.clientHeight;
    if (!(w > 0 && h > 0)) return;
    this._w = w; this._h = h;
    this._r.setSize(w, h, false);
    this.requestRender();
  }

  _down(e) {
    this._cv.setPointerCapture?.(e.pointerId);
    this._ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this._ptrs.size === 1) {
      this._g = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, multi: false, last: null };
    } else if (this._ptrs.size === 2 && this._g) {
      const [a, b] = this._ptrs.values();
      this._g.multi = true; this._g.moved = true;
      this._pinch = { zoom: this._zoom, d: Math.hypot(a.x - b.x, a.y - b.y) };
    }
  }

  _move(e) {
    const p = this._ptrs.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX; p.y = e.clientY;
    const g = this._g;
    if (this._ptrs.size === 1 && g) {
      if (!g.moved && Math.hypot(p.x - g.x, p.y - g.y) > 6) { g.moved = true; g.last = { x: g.x, y: g.y }; }
      if (!g.moved) return;
      // Pan: metros por pixel no plano do alvo
      const mpp = (2 * Math.tan(FOV * RAD / 2) * this._dist / this._zoom) / this._h;
      const lim = 0.35 * this._dist * Math.tan(FOV * RAD / 2);
      this._px = clamp(this._px - (p.x - g.last.x) * mpp, -lim, lim);
      this._py = clamp(this._py + (p.y - g.last.y) * mpp, -lim, lim);
      g.last = { x: p.x, y: p.y };
      this.requestRender();
    } else if (this._ptrs.size === 2 && this._pinch?.d > 0) {
      const [a, b] = this._ptrs.values();
      this._zoom = clamp(this._pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / this._pinch.d, 1, 3);
      this.requestRender();
    }
  }

  _up(e, tap) {
    if (!this._ptrs.delete(e.pointerId)) return;
    const g = this._g;
    if (this._ptrs.size === 0) {
      if (tap && g && !g.moved && !g.multi && performance.now() - g.t < 600) this._pick(e);
      this._g = null;
      this._pinch = null;
    } else if (this._ptrs.size === 1 && g) {
      const r = this._ptrs.values().next().value;
      g.multi = true; g.moved = true; g.last = { x: r.x, y: r.y };
    }
  }

  _pick(e) {
    this._frame();
    const r = this._cv.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this._ray.setFromCamera(ndc, this._cam);
    // Primeiro ponto visível (parede, móvel, piso, planta) → cômodo cujo retângulo o contém
    const hit = this._ray.intersectObjects(this._m.solid, false)[0];
    let id = hit ? roomAt(hit.point.x, hit.point.z) : null;
    // Fora dos cômodos (muro, faixa de grama): cai na caixa do cômodo mais próxima pelo raio
    if (!id && hit) id = this._ray.intersectObjects(this._m.pick, false)[0]?.object.userData.roomId ?? null;
    this._onPick(id);
  }

  _wheel(e) {
    e.preventDefault();
    this._zoom = clamp(this._zoom * Math.exp(-e.deltaY * 0.0015), 1, 3);
    this.requestRender();
  }
}
