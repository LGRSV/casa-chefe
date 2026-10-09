// Planta — cena, câmera fixa, render sob demanda e toque (spec §2)
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
import { buildPlan, setHighlight, setGlow, disposePlan } from './planta-geometria.js';

export const VIEWS = [{ az: 40, el: 42 }, { az: -40, el: 42 }, { az: 220, el: 42 }, { az: 140, el: 42 }]; // graus

const RAD = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - (1 - t) ** 3;

export class PlantaScene {
  constructor(host, { onPick } = {}) {
    this._host = host;
    this._onPick = onPick ?? (() => {});
    this._plan = buildPlan();
    this._scene = new THREE.Scene();
    this._scene.add(this._plan.group);
    this._cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    this._r = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    this._r.setClearColor(0x000000, 0);
    this._r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._cv = this._r.domElement;
    this._cv.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    host.append(this._cv);

    // Alvo: centro da planta no chão
    this._tgt = this._plan.bounds.getCenter(new THREE.Vector3());
    this._tgt.y = 0;
    this._ray = new THREE.Raycaster();
    this._ptrs = new Map();
    this._g = null;      // gesto atual
    this._pinch = null;  // zoom inicial da pinça
    this._az = VIEWS[0].az;
    this._el = VIEWS[0].el;
    this._vi = 0;
    this._zoom = 1;
    this._px = 0; this._py = 0; // pan em unidades de tela
    this._hw = 1; this._hh = 1; // meia-largura/altura do enquadramento base
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
    this._frame();
    this._resize();
  }

  setGlow(map) { setGlow(this._plan, map); this.requestRender(); }
  select(roomId) { setHighlight(this._plan, roomId ?? null); this.requestRender(); }

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
      const k = ease(Math.min(1, (performance.now() - t0) / 420));
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

  // Um único rAF coalescido; nunca loop contínuo
  requestRender() {
    if (!this._raf) this._raf = requestAnimationFrame(() => this._draw());
  }

  dispose() {
    this._ro.disconnect();
    for (const [t, f, o] of this._ev) this._cv.removeEventListener(t, f, o);
    cancelAnimationFrame(this._raf);
    cancelAnimationFrame(this._tw);
    disposePlan(this._plan);
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

  // Posiciona a câmera e enquadra a planta no host
  _frame() {
    const cam = this._cam, b = this._plan.bounds;
    const az = this._az * RAD, el = this._el * RAD;
    cam.position.set(
      this._tgt.x + 40 * Math.sin(az) * Math.cos(el),
      this._tgt.y + 40 * Math.sin(el),
      this._tgt.z + 40 * Math.cos(az) * Math.cos(el),
    );
    cam.up.set(0, 1, 0);
    cam.lookAt(this._tgt);
    cam.updateMatrixWorld();

    // Envoltório dos 8 cantos no espaço da câmera
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const v = new THREE.Vector3();
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
      v.set(x, y, z).applyMatrix4(cam.matrixWorldInverse);
      x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x);
      y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
    }
    let hw = (x1 - x0) / 2 * 1.08, hh = (y1 - y0) / 2 * 1.08;
    const asp = this._w && this._h ? this._w / this._h : 1;
    if (hw / hh < asp) hw = hh * asp; else hh = hw / asp;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + 0.06 * hh; // planta desce 6 %
    this._hw = hw; this._hh = hh;

    // Pan = deslocamento do recorte (equivale a mover o alvo no plano da tela)
    cam.left = cx - hw + this._px;
    cam.right = cx + hw + this._px;
    cam.top = cy + hh + this._py;
    cam.bottom = cy - hh + this._py;
    cam.zoom = this._zoom;
    cam.updateProjectionMatrix();
  }

  _resize() {
    const w = this._host.clientWidth, h = this._host.clientHeight;
    if (!(w > 0 && h > 0)) return;
    this._w = w; this._h = h;
    this._r.setSize(w, h, false);
    this._frame();
    this.requestRender();
  }

  _down(e) {
    this._cv.setPointerCapture(e.pointerId);
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
      // Pan: arrastar para a direita move a planta para a direita
      const wpp = (2 * this._hw) / this._zoom / this._w;
      this._px = clamp(this._px - (p.x - g.last.x) * wpp, -0.4 * this._hw, 0.4 * this._hw);
      this._py = clamp(this._py + (p.y - g.last.y) * wpp, -0.4 * this._hh, 0.4 * this._hh);
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
      if (tap && g && !g.moved && !g.multi && performance.now() - g.t < 500) this._pick(e);
      this._g = null;
      this._pinch = null;
    } else if (this._ptrs.size === 1 && g) {
      // Sobrou um dedo após pinça: segue em pan sem tocar
      const r = this._ptrs.values().next().value;
      g.multi = true; g.moved = true; g.last = { x: r.x, y: r.y };
    }
  }

  _pick(e) {
    this._frame();
    const r = this._cv.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this._ray.setFromCamera(ndc, this._cam);
    const hits = this._ray.intersectObjects(this._plan.pick, false);
    this._onPick(hits[0]?.object.userData.roomId ?? null);
  }

  _wheel(e) {
    e.preventDefault();
    this._zoom = clamp(this._zoom * Math.exp(-e.deltaY * 0.0015), 1, 3);
    this.requestRender();
  }
}
