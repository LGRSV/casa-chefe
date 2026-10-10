// Planta Real — cartão Lovelace: maquete realista sem telhado; tocar num cômodo abre o painel com interruptores
import { VERSION, DEFAULT_ENTITIES, CONTROLS, ROOMS, WEATHER_PT } from './real-dados.js';
import { RealScene } from './real-cena.js';
import { REAL_CSS, buildHeader, buildPanel, buildToolbar } from './real-ui.js';

const HVAC_PT = { off: 'Desligado', cool: 'Frio', heat: 'Quente', heat_cool: 'Auto', auto: 'Auto', fan_only: 'Ventilar', dry: 'Seco' };
const MEDIA_PT = { playing: 'Tocando', paused: 'Pausado', idle: 'Ociosa', off: 'Desligada', standby: 'Standby', on: 'Ligada' };

// Ligado conforme o tipo do aparelho
function isOn(kind, s) {
  if (!s) return false;
  if (kind === 'climate') return !['off', 'unavailable', 'unknown'].includes(s.state);
  if (kind === 'media') return !['off', 'standby', 'unavailable', 'unknown'].includes(s.state);
  return s.state === 'on';
}

export class PlantaRealCard extends HTMLElement {
  constructor() {
    super();
    this._built = false;
    this._config = { title: 'Casa', entities: {}, height: 560 };
    this._hass = null;
    this._sig = null;
    this._prev = {};     // último estado visto por chave (para limpar pending)
    this._pending = {};  // chave → true enquanto o comando não chega
    this._sel = null;    // cômodo aberto no painel
  }

  setConfig(config) {
    if (typeof config !== 'object' || config === null) throw new Error('Configuração inválida');
    this._config = { title: 'Casa', entities: {}, height: 560, ...config };
    if (this._built) {
      this._applyHeight();
      this._sig = null; // entidades podem ter mudado
      this._applyHass();
      this._header.update(this._headerModel());
    }
  }

  set hass(h) {
    this._hass = h;
    this._applyHass();
  }

  getCardSize() {
    const h = this._config.height;
    return typeof h === 'number' ? Math.ceil(h / 50) : 12;
  }

  static getStubConfig() {
    return { title: 'Casa' };
  }

  get renderCount() {
    return this._scene ? this._scene.renderCount : 0;
  }

  connectedCallback() {
    if (this._built) return; // não destrói a cena ao reanexar
    this._built = true;
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = REAL_CSS;
    const planta = document.createElement('div');
    planta.className = 'planta';
    const stage = document.createElement('div');
    stage.className = 'stage';
    planta.append(stage);
    root.append(style, planta);
    this._planta = planta;

    this._header = buildHeader(planta);
    this._panel = buildPanel(planta, {
      onSet: (key, on) => this._set(key, on),
      onClose: () => this._close(),
    });
    buildToolbar(planta, {
      onRotate: () => this._scene.nextView(),
      onReset: () => { this._scene.resetView(); this._close(); },
    });
    this._scene = new RealScene(stage, { onPick: (id) => this._pick(id) });
    // Recortes da maquete: em cima o cabeçalho (largo) ou a barra sob ele (estreito); embaixo 12 px.
    // O painel aberto não muda o enquadramento
    this._insets = () => {
      const pr = planta.getBoundingClientRect();
      if (!pr.height) return;
      const narrow = pr.width <= 520;
      const el = planta.querySelector(narrow ? '.bar' : '.hdr');
      const top = el ? Math.max(0, Math.round(el.getBoundingClientRect().bottom - pr.top)) : 0;
      this._scene.setInsets(top, 12);
    };
    this._insRO = new ResizeObserver(() => this._insets());
    this._insRO.observe(planta);
    for (const el of planta.querySelectorAll('.hdr, .bar')) this._insRO.observe(el);
    this._insets();

    this._applyHeight();
    this._header.update(this._headerModel());
    this._applyHass(); // hass pode ter chegado antes da construção
  }

  entity(key) {
    return { ...DEFAULT_ENTITIES, ...this._config.entities }[key];
  }

  _applyHeight() {
    const h = this._config.height;
    this._planta.style.setProperty('--planta-h', typeof h === 'number' ? `${h}px` : String(h));
  }

  _st(key) {
    return this._hass?.states?.[this.entity(key)];
  }

  _on(key) {
    return isOn(CONTROLS[key].kind, this._st(key));
  }

  _applyHass() {
    const h = this._hass;
    if (!this._built || !h) return;
    const ids = [...new Set(Object.values({ ...DEFAULT_ENTITIES, ...this._config.entities }))];
    const sig = ids.map((id) => {
      const s = h.states?.[id];
      const a = s?.attributes || {};
      return `${s?.state}|${a.brightness}|${a.temperature}|${a.current_temperature}|${a.media_title}`;
    }).join('#');
    if (sig === this._sig) return; // nada mudou: sem render
    this._sig = sig;

    // Estado mudou → comando chegou: tira o pending
    for (const k of Object.keys(CONTROLS)) {
      const cur = this._st(k)?.state;
      if (cur !== this._prev[k]) delete this._pending[k];
      this._prev[k] = cur;
    }

    // Brilho: primeira luz ligada de cada cômodo
    const map = {};
    for (const room of ROOMS) {
      const k = room.controls.find((c) => CONTROLS[c].kind === 'light' && this._on(c));
      map[room.id] = k ? (CONTROLS[k].glow ?? null) : null;
    }
    this._scene.setGlow(map);
    this._scene.setPump(this._on('bomba_piscina'));

    this._header.update(this._headerModel());
    if (this._panel.open && this._sel) this._panel.update(this._model(this._sel));
  }

  _stateText(key) {
    const s = this._st(key);
    if (!s || s.state === 'unavailable') return 'indisponível';
    const a = s.attributes || {};
    const kind = CONTROLS[key].kind;
    const on = isOn(kind, s);
    if (kind === 'light' || kind === 'switch') {
      let t = s.state === 'on' ? 'Ligada' : 'Desligada';
      if (on && a.brightness != null) t += ` · ${Math.round(a.brightness / 2.55)}%`;
      return t;
    }
    if (kind === 'climate') {
      let t = HVAC_PT[s.state] || s.state;
      if (on && a.temperature != null) t += ` · ${a.temperature}°`;
      return t;
    }
    let t = MEDIA_PT[s.state] || s.state;
    if (s.state === 'playing' && a.media_title) t += ` · ${a.media_title}`;
    return t;
  }

  _model(roomId) {
    const room = ROOMS.find((r) => r.id === roomId);
    const controls = room.controls.map((k) => {
      const s = this._st(k);
      return {
        key: k,
        label: CONTROLS[k].label,
        kind: CONTROLS[k].kind,
        on: this._on(k),
        state: this._stateText(k),
        available: !!s && s.state !== 'unavailable',
        pending: !!this._pending[k],
      };
    });
    const n = controls.filter((c) => c.on).length;
    const m = controls.length;
    const summary = m ? `${n} de ${m} ${n === 1 ? 'ligado' : 'ligados'}` : 'Nenhum aparelho';
    return { roomId, title: room.label, summary, controls };
  }

  _headerModel() {
    const h = this._hass;
    const out = { title: this._config.title, weather: '', sensors: [] };
    if (!h) return out;
    const st = (k) => h.states?.[this.entity(k)];

    const w = st('clima');
    const ac = st('ac');
    if (w) {
      const t = w.attributes?.temperature;
      out.weather = `${WEATHER_PT[w.state] || w.state}${t != null ? ` · ${Math.round(t)}°` : ''}`;
    } else if (ac?.attributes?.current_temperature != null) {
      out.weather = `Dentro ${ac.attributes.current_temperature}°`;
    }

    const pres = st('presenca');
    if (pres) out.sensors.push(pres.state === 'on' ? 'Alguém no quarto' : 'Ninguém no quarto');
    const lux = st('lux');
    if (lux) out.sensors.push(`${lux.state} lx`);
    const pessoa = st('pessoa');
    if (pessoa) out.sensors.push(`${pessoa.attributes?.friendly_name || 'Pessoa'} ${pessoa.state === 'home' ? 'em casa' : 'fora'}`);

    // Luzes acesas: conta entity_ids distintos
    const ids = new Set(Object.keys(CONTROLS)
      .filter((k) => CONTROLS[k].kind === 'light' && this._on(k))
      .map((k) => this.entity(k)));
    const n = ids.size;
    out.sensors.push(n === 0 ? 'Luzes apagadas' : n === 1 ? '1 luz acesa' : `${n} luzes acesas`);
    return out;
  }

  _pick(id) {
    if (!id || id === this._sel) return this._close();
    this._sel = id;
    this._scene.select(id);
    this._panel.show(this._model(id));
  }

  _close() {
    this._sel = null;
    this._scene.select(null);
    this._panel.hide();
  }

  _set(key, on) {
    const id = this.entity(key);
    const h = this._hass;
    if (CONTROLS[key].kind === 'climate') {
      h.callService('climate', 'set_hvac_mode', { entity_id: id, hvac_mode: on ? 'cool' : 'off' });
    } else {
      h.callService(id.split('.')[0], on ? 'turn_on' : 'turn_off', { entity_id: id });
    }
    this._pending[key] = true;
    this._refreshPanel();
    setTimeout(() => {
      if (!this._pending[key]) return;
      delete this._pending[key];
      this._refreshPanel();
    }, 5000);
  }

  _refreshPanel() {
    if (this._sel) this._panel.update(this._model(this._sel));
  }
}

if (!customElements.get('planta-real-card')) customElements.define('planta-real-card', PlantaRealCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === 'planta-real-card')) {
  window.customCards.push({
    type: 'planta-real-card',
    name: 'Planta Real',
    description: 'Maquete realista da casa sem telhado; toque num cômodo para ligar e desligar.',
    preview: false,
  });
}
console.info(`%c PLANTA-REAL-CARD %c v${VERSION} `,
  'background:#f7f5f1;color:#1d1d1f;font-weight:700',
  'background:#5b8a3a;color:#fff;font-weight:700');
