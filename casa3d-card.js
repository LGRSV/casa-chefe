/*
 * Casa 3D — cartão Lovelace para Home Assistant (+ demo standalone)
 * Modelo 3D da casa em Three.js. As luzes acendem conforme o estado das
 * entidades do HA; clicar num cômodo (ou num chip) alterna o interruptor.
 *
 * Instalação: veja o README.md ao lado deste arquivo.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

export const VERSION = '1.3.1';

// Única fonte de verdade para as opções do cartão — usada tanto no construtor (antes de
// qualquer setConfig, caso do próprio elemento já presente no HTML ao carregar o módulo)
// quanto em setConfig(). Evita que os dois fiquem dessincronizados (foi assim que o
// widget de clima nascia ausente: só existia no default do setConfig, não no do construtor).
const DEFAULT_CONFIG = {
  title: 'Casa 3D', labels: true, mode: 'auto', night_vision: true, panel: true, roof: false,
  quality: 'alta', car_color: '#f3f3f0', entities: {},
  latitude: -10.2, longitude: -48.3, timezone: 'America/Sao_Paulo', orientation: 180,
  weather: true, weather_city: 'Palmas, TO',
};

// ---------------------------------------------------------------------------
// Entidades (sobrescreva no YAML do cartão em `entities:`)
// ---------------------------------------------------------------------------
export const DEFAULT_ENTITIES = {
  quarto:        'switch.quarto_interruptor_1',
  led_quarto:    'light.0xa4c1387cf3257eb7',
  sala:          'light.interruptor_cozinha_left',
  balcao:        'switch.balcao_interruptor_1',
  externa:       'light.interruptor_cozinha_center',
  // Hoje o seu dashboard liga o overlay "Banheiro+dispensa" ao mesmo
  // interruptor da luz externa. Troque para light.interruptor_cozinha_right
  // (o 3º botão do interruptor da cozinha) se for esse o circuito.
  banheiro:      'light.interruptor_cozinha_center',
  garagem:       'switch.garagem_interruptor_1',
  led_piscina:   'switch.led_piscina_interruptor_1',
  bomba_piscina: 'switch.piscina_interruptor_1',
  ac:            'climate.ir_ac_cozinha_ac_cozinha',
  tv:            'media_player.m_s',
  presenca:      'binary_sensor.0xa4c13846f2a0df88_occupancy',   // radar mmWave
  lux:           'sensor.0xa4c13846f2a0df88_illuminance',
  pessoa:        'person.sandro',
  sun:           'sun.sun',
};

// ---------------------------------------------------------------------------
// Itens controláveis: luminárias (posição em metros, X→direita, Z→frente)
// i = intensidade (cd), d = alcance (m), shadow = projeta sombra nas paredes
// ---------------------------------------------------------------------------
export const ITEMS = [
  { key: 'quarto', label: 'Quarto', kind: 'light', icon: 'bulb', color: 0xffd9ab,
    fixtures: [{ p: [5.2, 2.55, 2.1], i: 30, d: 6.5, shadow: true }] },
  { key: 'led_quarto', label: 'LED Quarto', kind: 'light', icon: 'led', rgb: true, color: 0xffb070,
    fixtures: [{ p: [4.15, 1.0, 0.5], i: 7, d: 4.5, lamp: true }] },
  { key: 'sala', label: 'Sala / Cozinha', kind: 'light', icon: 'bulb', color: 0xfff1dc,
    fixtures: [{ p: [8.45, 2.55, 2.1], i: 42, d: 7.5, shadow: true }] },
  { key: 'balcao', label: 'Balcão', kind: 'light', icon: 'bulb', color: 0xfff5e4,
    fixtures: [{ p: [11.4, 2.55, 1.7], i: 20, d: 4.5 }] },
  { key: 'externa', label: 'Externa', kind: 'light', icon: 'bulb', color: 0xffe7c2,
    fixtures: [
      { p: [2.1, 2.5, 5.2], i: 14, d: 5.5, shadow: true },
      { p: [6.3, 2.5, 5.2], i: 14, d: 5.5, shadow: true },
      { p: [10.4, 2.5, 5.2], i: 14, d: 5.5, shadow: true },
      { p: [13.2, 2.0, 8.4], i: 12, d: 7, sconce: true },
      { p: [13.2, 2.0, 11.4], i: 12, d: 7, sconce: true },
    ] },
  { key: 'banheiro', label: 'Banheiro + Dispensa', kind: 'light', icon: 'bulb', color: 0xfff7ea,
    fixtures: [
      { p: [1.2, 2.5, 7.5], i: 12, d: 3.8 },
      { p: [1.2, 2.5, 9.7], i: 8, d: 3.2 },
    ] },
  { key: 'garagem', label: 'Garagem', kind: 'light', icon: 'bulb', color: 0xfff1dc,
    fixtures: [{ p: [1.5, 2.5, 13.3], i: 18, d: 6.5, shadow: true }] },
  { key: 'led_piscina', label: 'LED Piscina', kind: 'light', icon: 'pool', color: 0x2f9dff,
    fixtures: [
      { p: [4.7, -0.55, 8.34], i: 9, d: 4.5, under: true },
      { p: [6.5, -0.55, 8.34], i: 9, d: 4.5, under: true },
      { p: [8.3, -0.55, 8.34], i: 9, d: 4.5, under: true },
    ] },
  { key: 'bomba_piscina', label: 'Bomba Piscina', kind: 'switch', icon: 'pump' },
  { key: 'ac', label: 'AC Cozinha', kind: 'climate', icon: 'ac' },
  { key: 'tv', label: 'TV Quarto', kind: 'media', icon: 'tv' },
  { key: 'presenca', label: 'Presença', kind: 'sensor', icon: 'motion' },
  { key: 'lux', label: 'Iluminância', kind: 'sensor', icon: 'lux' },
  { key: 'pessoa', label: 'Sandro', kind: 'sensor', icon: 'person' },
];

// Ícones dos chips (SVG inline, 16px, traço)
const ICONS = {
  bulb: '<path d="M8 1.6a4.4 4.4 0 0 0-2.5 8c.4.3.6.7.6 1.2v.9h3.8v-.9c0-.5.2-.9.6-1.2a4.4 4.4 0 0 0-2.5-8z"/><path d="M6.4 13.6h3.2M7 15.2h2"/>',
  led:  '<rect x="1.5" y="5.5" width="13" height="5" rx="2.5"/><circle cx="4.5" cy="8" r=".9" fill="currentColor" stroke="none"/><circle cx="8" cy="8" r=".9" fill="currentColor" stroke="none"/><circle cx="11.5" cy="8" r=".9" fill="currentColor" stroke="none"/>',
  pool: '<path d="M1.5 6.3c2 0 2 1.6 4 1.6s2-1.6 4-1.6 2 1.6 4 1.6M1.5 10.6c2 0 2 1.6 4 1.6s2-1.6 4-1.6 2 1.6 4 1.6"/><path d="M5 6V3.2a1.2 1.2 0 0 1 2.4 0M9.5 6V3.2a1.2 1.2 0 0 1 2.4 0"/>',
  pump: '<circle cx="6.8" cy="9.2" r="4"/><path d="M10.8 9.2h3.6M6.8 2.4v2.8M5.2 9.2h3.2"/>',
  ac:   '<rect x="1.5" y="3.2" width="13" height="6" rx="1.4"/><path d="M4 6.2h8M4.2 12v1.6M8 12v2.6M11.8 12v1.6"/>',
  tv:   '<rect x="1.5" y="2.6" width="13" height="8.8" rx="1.2"/><path d="M5.6 14h4.8M8 11.4V14"/>',
  home: '<path d="M2.5 8.2 8 3.2l5.5 5M4 7v6.3h8V7"/>',
  moon: '<path d="M13 9.6A5.2 5.2 0 0 1 6.4 3a5.4 5.4 0 1 0 6.6 6.6z"/>',
  film: '<rect x="2" y="3" width="12" height="10" rx="1.2"/><path d="M5 3v10M11 3v10M2 6h3M2 10h3M11 6h3M11 10h3"/>',
  power: '<path d="M8 2.5v5.5"/><path d="M4.6 4.6a4.8 4.8 0 1 0 6.8 0"/>',
  panel: '<rect x="1.5" y="2.5" width="13" height="11" rx="1.4"/><path d="M9.5 2.5v11M11 6h2M11 8.5h2"/>',
  play: '<path d="M5 3.5v9l7-4.5z" fill="currentColor" stroke="none"/>',
  motion: '<circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none"/><path d="M4.6 4.6a4.8 4.8 0 0 0 0 6.8M11.4 4.6a4.8 4.8 0 0 1 0 6.8M2.4 2.4a8 8 0 0 0 0 11.2M13.6 2.4a8 8 0 0 1 0 11.2"/>',
  lux: '<circle cx="8" cy="8" r="2.6"/><path d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.4 3.4l1.3 1.3M11.3 11.3l1.3 1.3M3.4 12.6l1.3-1.3M11.3 4.7l1.3-1.3"/>',
  person: '<circle cx="8" cy="5" r="2.6"/><path d="M2.8 14a5.2 5.2 0 0 1 10.4 0"/>',
  auto: '<path d="M8.8 1.8 4.2 9h3.4l-.9 5.2L11.8 7H8.4z"/>',
  timer: '<circle cx="8" cy="9" r="5"/><path d="M8 6.5V9l1.8 1.2M6 1.8h4"/>',
  pause: '<path d="M5.5 3.5v9M10.5 3.5v9" stroke-width="2"/>',
  sun: '<circle cx="8" cy="8" r="3"/><path d="M8 1.6v1.6M8 12.8v1.6M1.6 8h1.6M12.8 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/>',
  moon: '<path d="M13 9.6A5.2 5.2 0 0 1 6.4 3a5.4 5.4 0 1 0 6.6 6.6z"/>',
  cloudsun: '<circle cx="4.6" cy="4.6" r="2" /><path d="M4.6 1v1M4.6 8.2v1M1 4.6h1M8.2 4.6h1M1.9 1.9l.8.8M6.5 6.5l.8.8M1.9 7.3l.8-.8"/><path d="M5.6 13.4h5.9a2.5 2.5 0 0 0 .5-4.95 3.4 3.4 0 0 0-6.3-1.6A2.7 2.7 0 0 0 3 9.2a2.5 2.5 0 0 0 .3 5.0h.1"/>',
  cloud: '<path d="M4.4 13h7.3a2.6 2.6 0 0 0 .5-5.15 3.5 3.5 0 0 0-6.6-1.5A2.8 2.8 0 0 0 2 9.1 2.7 2.7 0 0 0 4.4 13z"/>',
  fog: '<path d="M4 6.6h7.3a2.4 2.4 0 0 0 .5-4.75A3.2 3.2 0 0 0 5.7 .95 2.6 2.6 0 0 0 1.9 3.3 2.5 2.5 0 0 0 4 6.6z"/><path d="M2 9.4h12M2 12h12"/>',
  rain: '<path d="M4.4 8.3h7.3a2.6 2.6 0 0 0 .5-5.15 3.5 3.5 0 0 0-6.6-1.5A2.8 2.8 0 0 0 2 4.4a2.7 2.7 0 0 0 2.4 3.9z"/><path d="M4.6 10.4 3.6 13M8 10.4 7 13M11.4 10.4l-1 2.6"/>',
  storm: '<path d="M4.4 7.3h7.3a2.6 2.6 0 0 0 .5-5.15 3.5 3.5 0 0 0-6.6-1.5A2.8 2.8 0 0 0 2 3.4a2.7 2.7 0 0 0 2.4 3.9z"/><path d="M8.6 9.2 6.4 12.4h2.3L7 15"/>',
  snow: '<path d="M4.4 8.3h7.3a2.6 2.6 0 0 0 .5-5.15 3.5 3.5 0 0 0-6.6-1.5A2.8 2.8 0 0 0 2 4.4a2.7 2.7 0 0 0 2.4 3.9z"/><path d="M5 10.6v3M3.6 12.1h2.8M10.6 10.6v3M9.2 12.1h2.8"/>',
};

// Códigos WMO (Open-Meteo) → ícone + descrição em pt-BR
const WEATHER_CODE = {
  0: ['sun', 'Céu limpo'], 1: ['cloudsun', 'Poucas nuvens'], 2: ['cloudsun', 'Parcialmente nublado'], 3: ['cloud', 'Nublado'],
  45: ['fog', 'Neblina'], 48: ['fog', 'Neblina com geada'],
  51: ['rain', 'Garoa fraca'], 53: ['rain', 'Garoa'], 55: ['rain', 'Garoa forte'],
  56: ['rain', 'Garoa congelante'], 57: ['rain', 'Garoa congelante forte'],
  61: ['rain', 'Chuva fraca'], 63: ['rain', 'Chuva'], 65: ['rain', 'Chuva forte'],
  66: ['rain', 'Chuva congelante'], 67: ['rain', 'Chuva congelante forte'],
  71: ['snow', 'Neve fraca'], 73: ['snow', 'Neve'], 75: ['snow', 'Neve forte'], 77: ['snow', 'Grãos de neve'],
  80: ['rain', 'Pancadas fracas'], 81: ['rain', 'Pancadas de chuva'], 82: ['rain', 'Pancadas fortes'],
  85: ['snow', 'Pancadas de neve fracas'], 86: ['snow', 'Pancadas de neve fortes'],
  95: ['storm', 'Trovoada'], 96: ['storm', 'Trovoada com granizo'], 99: ['storm', 'Trovoada forte com granizo'],
};

// Cenas: ações compostas disparadas pelo cartão (não precisam existir no HA)
const SCENES = [
  { id: 'chegando', icon: 'home', name: 'Chegando em casa', desc: 'Acende garagem e área externa',
    run: (c) => [c.on('garagem'), c.on('externa')] },
  { id: 'piscina', icon: 'pool', name: 'Noite na piscina', desc: 'LED da piscina e luz externa; bomba desligada',
    run: (c) => [c.on('led_piscina'), c.on('externa'), c.off('bomba_piscina')] },
  { id: 'cinema', icon: 'film', name: 'Modo cinema', desc: 'TV ligada, luz do quarto apagada, LED roxo suave',
    run: (c) => [c.call('media_player', 'turn_on', c.e('tv')), c.off('quarto'), c.call('light', 'turn_on', c.e('led_quarto'), { rgb_color: [120, 60, 220], brightness_pct: 25 })] },
  { id: 'boanoite', icon: 'moon', name: 'Boa noite', desc: 'Apaga todas as luzes e desliga a TV',
    run: (c) => ['quarto', 'led_quarto', 'sala', 'balcao', 'externa', 'banheiro', 'garagem', 'led_piscina'].map((k) => c.off(k)).concat([c.call('media_player', 'turn_off', c.e('tv'))]) },
  { id: 'tudo', icon: 'power', name: 'Tudo desligado', desc: 'Luzes, TV, ar-condicionado e bomba',
    run: (c) => ['quarto', 'led_quarto', 'sala', 'balcao', 'externa', 'banheiro', 'garagem', 'led_piscina', 'bomba_piscina'].map((k) => c.off(k)).concat([c.call('media_player', 'turn_off', c.e('tv')), c.call('climate', 'set_hvac_mode', c.e('ac'), { hvac_mode: 'off' })]) },
];
const LED_PRESETS = [['Quente', [255, 180, 110]], ['Branco', [255, 244, 229]], ['Vermelho', [255, 40, 40]], ['Azul', [40, 110, 255]], ['Verde', [40, 200, 90]], ['Roxo', [140, 60, 230]]];
const HVAC_PT = { off: 'Desligado', cool: 'Frio', heat: 'Quente', heat_cool: 'Auto', auto: 'Auto', fan_only: 'Ventilar', dry: 'Seco' };
const MEDIA_PT = { playing: 'Tocando', paused: 'Pausado', idle: 'Ociosa', off: 'Desligada', standby: 'Standby', on: 'Ligada', unavailable: 'indisponível', unknown: '—' };
// Elevação/azimute do sol para uma data e um ponto (graus). Azimute: 0 = norte, 90 = leste.
function solarPosition(date, lat, lon) {
  const rad = Math.PI / 180;
  const d = date.getTime() / 86400000 - 10957.5;
  const g = ((357.529 + 0.98560028 * d) % 360) * rad;
  const q = (280.459 + 0.98564736 * d) % 360;
  const L = ((q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) % 360) * rad;
  const e = (23.439 - 0.00000036 * d) * rad;
  const RA = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / rad;
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24;
  let H = ((gmst * 15 + lon - RA) % 360 + 540) % 360 - 180;
  const Hr = H * rad, la = lat * rad;
  const alt = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(Hr));
  const az = Math.atan2(-Math.sin(Hr), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(Hr));
  return { elevation: alt / rad, azimuth: (az / rad + 360) % 360 };
}
function fmtClock(ts) { try { return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch (_) { return ''; } }
function fmtRel(ts, now = Date.now()) {
  const d = Math.max(0, (now - new Date(ts).getTime()) / 1000);
  if (d < 45) return 'agora'; if (d < 3600) return `há ${Math.round(d / 60)} min`; if (d < 86400) return `há ${Math.round(d / 3600)} h`;
  const days = Math.round(d / 86400); return days === 1 ? 'ontem' : `há ${days} d`;
}
const iconSvg = (k) => `<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ICONS.bulb}</svg>`;

// ---------------------------------------------------------------------------
// Planta (metros). Aproximada a partir do render do Sweet Home 3D.
// Cada zona = piso clicável; `item` = qual luz o clique alterna.
// ---------------------------------------------------------------------------
const H = 2.8;      // pé-direito
const T = 0.15;     // espessura das paredes

const ZONES = {
  quarto_casal: { x: 0,    z: 0,    w: 3.6,  d: 4.2, color: 0xb18b5f, label: 'Quarto Casal', lp: [1.8, 2.1] },
  quarto:       { x: 3.6,  z: 0,    w: 3.2,  d: 4.2, color: 0xb18b5f, label: 'Quarto',        lp: [5.2, 2.1], item: 'quarto' },
  sala:         { x: 6.8,  z: 0,    w: 3.5,  d: 4.2, color: 0xd8d3c6, label: 'Sala / Cozinha', lp: [8.5, 2.9], item: 'sala' },
  balcao:       { x: 10.3, z: 0,    w: 2.2,  d: 4.2, color: 0xd8d3c6, label: 'Balcão',        lp: [11.4, 3.2], item: 'balcao' },
  varanda:      { x: 0,    z: 4.2,  w: 12.5, d: 2.0, color: 0xc6bda8, label: 'Varanda',       lp: [6.25, 5.2], item: 'externa' },
  banheiro:     { x: 0,    z: 6.2,  w: 2.4,  d: 2.6, color: 0xcfd7da, label: 'Banheiro',      lp: [1.2, 7.5], item: 'banheiro' },
  dispensa:     { x: 0,    z: 8.8,  w: 2.4,  d: 1.8, color: 0xcbc4b6, label: 'Dispensa',      lp: [1.2, 9.7], item: 'banheiro' },
  garagem:      { x: 0,    z: 10.6, w: 3.0,  d: 5.4, color: 0x7e7e7a, label: 'Garagem',       lp: [1.5, 13.3], item: 'garagem' },
  jardim:       { x: 10.9, z: 6.2,  w: 2.5,  d: 6.2, color: 0x41603a, label: 'Jardim',        lp: [12.15, 9.4], item: 'externa' },
  patio:        { x: 2.4,  z: 12.4, w: 11.0, d: 4.2, color: 0x66655f, label: null,            item: 'externa' },
};
const POOL  = { x0: 3.9, x1: 8.3, zc: 9.8, r: 1.6, depth: 1.4 };   // reta de x0→x1 + meia-lua de raio r
const DECK  = { x: 2.9, z: 7.2, w: 8.0, d: 5.2 };
const LOT   = { w: 13.4, d: 16.6 };

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const clamp = THREE.MathUtils.clamp;
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Texturas procedurais (canvas) — nada externo para baixar
// ---------------------------------------------------------------------------
function makeTex(size, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function grain(g, size, seed, count, alpha, tint = [255, 255, 255]) {
  const rnd = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const v = rnd(); const c = tint.map((x) => Math.floor(x * (0.5 + v)));
    g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(rnd() * alpha).toFixed(3)})`;
    g.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2.5, 1 + rnd() * 2.5);
  }
}
function shade(hex, v) {
  const r = (hex >> 16) & 255, gg = (hex >> 8) & 255, b = hex & 255;
  return `rgb(${Math.min(255, r * v) | 0},${Math.min(255, gg * v) | 0},${Math.min(255, b * v) | 0})`;
}
const TEX = {};
function textures() {
  if (TEX.wood) return TEX;
  // Tábuas de madeira (6 por bloco de 2,4 m)
  TEX.wood = makeTex(512, (g, s) => {
    const rnd = mulberry32(5), ph = s / 6;
    for (let r = 0; r < 6; r++) {
      const y = r * ph, v = 0.86 + rnd() * 0.26;
      g.fillStyle = shade(0xb98d5c, v); g.fillRect(0, y, s, ph);
      g.strokeStyle = 'rgba(70,40,15,0.16)'; g.lineWidth = 1;
      for (let k = 0; k < 26; k++) {
        const yy = y + rnd() * ph; g.beginPath(); g.moveTo(0, yy);
        for (let x = 0; x <= s; x += 24) g.lineTo(x, yy + Math.sin(x / 60 + k) * 1.6 + (rnd() - 0.5));
        g.stroke();
      }
      g.fillStyle = 'rgba(45,28,12,0.6)'; g.fillRect(0, y, s, 2);
      g.fillRect(((r % 2) * s / 2 + rnd() * 60) % s, y, 2, ph);
    }
    grain(g, s, 9, 5000, 0.08, [120, 80, 40]);
  });
  const tiles = (base, grout, n, seed) => makeTex(256, (g, s) => {
    g.fillStyle = grout; g.fillRect(0, 0, s, s);
    const rnd = mulberry32(seed), t = s / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = shade(base, 0.93 + rnd() * 0.1); g.fillRect(i * t + 1.5, j * t + 1.5, t - 3, t - 3); }
    grain(g, s, seed + 1, 2500, 0.05);
  });
  TEX.tileWarm = tiles(0xe0dacc, '#b8b09f', 4, 2);   // porcelanato bege (sala/cozinha)
  TEX.tileCool = tiles(0xd7e0e3, '#9fadb3', 6, 3);   // banheiro
  TEX.tileTerra = tiles(0xc9b191, '#9d8664', 3, 4);  // varanda
  TEX.concrete = makeTex(256, (g, s) => { g.fillStyle = '#818079'; g.fillRect(0, 0, s, s); grain(g, s, 6, 22000, 0.22, [90, 90, 88]); grain(g, s, 7, 3000, 0.12, [200, 200, 196]); });
  TEX.asphalt = makeTex(256, (g, s) => { g.fillStyle = '#66655d'; g.fillRect(0, 0, s, s); grain(g, s, 8, 22000, 0.25, [60, 60, 56]); });
  TEX.grass = makeTex(256, (g, s) => {
    g.fillStyle = '#3c5c2f'; g.fillRect(0, 0, s, s);
    const rnd = mulberry32(12);
    for (let i = 0; i < 9000; i++) { const v = 0.75 + rnd() * 0.6; g.fillStyle = shade(0x4a7038, v); g.fillRect(rnd() * s, rnd() * s, 1, 2 + rnd() * 3); }
    grain(g, s, 13, 2000, 0.1, [30, 50, 20]);
  });
  TEX.pavers = makeTex(256, (g, s) => {
    g.fillStyle = '#a89373'; g.fillRect(0, 0, s, s);
    const rnd = mulberry32(21), w = s / 2, h = s / 4;
    for (let r = 0; r < 4; r++) for (let c = -1; c < 3; c++) { const x = c * w + (r % 2) * w / 2; g.fillStyle = shade(0xd2bc93, 0.92 + rnd() * 0.14); g.fillRect(x + 2, r * h + 2, w - 4, h - 4); }
    grain(g, s, 22, 4000, 0.08, [120, 100, 70]);
  });
  TEX.plaster = makeTex(256, (g, s) => { g.fillStyle = '#e8e2d6'; g.fillRect(0, 0, s, s); grain(g, s, 31, 9000, 0.07, [120, 110, 100]); }, [2, 1]);
  // Normal map de ondulação (senos com frequências inteiras → azulejável)
  TEX.waterNormal = (() => {
    const s = 512, c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d');
    const img = g.createImageData(s, s);
    const W = [[3, 1, 0.5, 0.0], [1, -4, 0.35, 1.3], [6, 6, 0.16, 0.7], [-5, 7, 0.14, 2.1], [9, -2, 0.09, 0.4], [2, 11, 0.07, 3.0], [-12, 5, 0.05, 1.9], [14, 13, 0.035, 0.9]];
    const hgt = (x, y) => { const u = (x / s) * Math.PI * 2, v = (y / s) * Math.PI * 2; let h = 0; for (const [a, b, amp, ph] of W) h += Math.sin(u * a + v * b + ph) * amp; return h; };
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const dx = hgt(x + 1, y) - hgt(x - 1, y), dy = hgt(x, y + 1) - hgt(x, y - 1);
      const nx = -dx * 7, ny = -dy * 7, nz = 1, l = Math.hypot(nx, ny, nz), i = (y * s + x) * 4;
      img.data[i] = (nx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[i + 2] = (nz / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; return t;
  })();
  // Cáusticas (traçado claro sobre fundo neutro) para o fundo/paredes da piscina
  TEX.caustics = makeTex(256, (g, s) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2.2; g.lineJoin = 'round';
    const rnd = mulberry32(19);
    for (let i = 0; i < 30; i++) {
      const cx = rnd() * s, cy = rnd() * s, r = 9 + rnd() * 24, k = 2 + Math.floor(rnd() * 3), ph = rnd() * 6;
      for (const ox of [-s, 0, s]) for (const oy of [-s, 0, s]) {
        g.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.2) { const rr = r * (0.78 + 0.28 * Math.sin(a * k + ph)); const x = cx + ox + Math.cos(a) * rr, y = cy + oy + Math.sin(a) * rr; a === 0 ? g.moveTo(x, y) : g.lineTo(x, y); }
        g.stroke();
      }
    }
  });
  TEX.glow = makeTex(128, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,0.55)'); r.addColorStop(0.6, 'rgba(255,255,255,0.12)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, s, s);
  });
  TEX.glow.wrapS = TEX.glow.wrapT = THREE.ClampToEdgeWrapping;
  TEX.skyDay = makeTex(256, (g, s) => { const r = g.createLinearGradient(0, s, 0, 0); r.addColorStop(0, '#e6eef6'); r.addColorStop(0.18, '#b7d3ee'); r.addColorStop(0.6, '#5f9bdc'); r.addColorStop(1, '#3f7fc9'); g.fillStyle = r; g.fillRect(0, 0, s, s); });
  TEX.skyDusk = makeTex(256, (g, s) => { const r = g.createLinearGradient(0, s, 0, 0); r.addColorStop(0, '#ffb070'); r.addColorStop(0.12, '#f0805a'); r.addColorStop(0.3, '#8a5a8c'); r.addColorStop(0.6, '#2c3a70'); r.addColorStop(1, '#121a3a'); g.fillStyle = r; g.fillRect(0, 0, s, s); });
  TEX.skyNight = makeTex(256, (g, s) => { const r = g.createLinearGradient(0, s, 0, 0); r.addColorStop(0, '#18213a'); r.addColorStop(0.2, '#0f1629'); r.addColorStop(0.6, '#070b17'); r.addColorStop(1, '#03050c'); g.fillStyle = r; g.fillRect(0, 0, s, s); });
  for (const k of ['skyDay', 'skyNight', 'skyDusk']) { TEX[k].wrapS = TEX[k].wrapT = THREE.ClampToEdgeWrapping; }
  return TEX;
}

const MAT = {};
function materials() {
  if (MAT.wall) return MAT;
  const T = textures();
  const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.9, metalness: 0 }, o));
  MAT.wall     = std({ color: 0xf0eadf, map: T.plaster, roughness: 0.95 });
  MAT.lowWall  = std({ color: 0xd6ccb8, map: T.plaster, roughness: 0.95 });
  MAT.ground   = std({ color: 0x9fb08c, map: T.grass, roughness: 1 });
  MAT.ground.map = T.grass.clone(); MAT.ground.map.repeat.set(1 / 2.2, 1 / 2.2);
  MAT.deck     = std({ color: 0xf2e6cf, map: T.pavers, roughness: 0.95 });
  MAT.deck.map = T.pavers.clone(); MAT.deck.map.repeat.set(1 / 1.6, 1 / 1.6);
  MAT.basin    = std({ color: 0xa9d3ea, roughness: 0.55, emissive: 0x9fd8ff, emissiveMap: T.caustics.clone(), emissiveIntensity: 0.12 });
  MAT.basin.emissiveMap.repeat.set(0.6, 0.6);
  MAT.door     = std({ color: 0x6e4b33, roughness: 0.75 });
  MAT.doorPanel = std({ color: 0x5a3b28, roughness: 0.75 });
  MAT.baseboard = std({ color: 0xf4f1ea, roughness: 0.7 });
  MAT.glass    = new THREE.MeshPhysicalMaterial({ color: 0xe6f3ff, transparent: true, opacity: 0.16, roughness: 0.02, metalness: 0, envMapIntensity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  MAT.wood     = std({ color: 0xa5692a, roughness: 0.7 });
  MAT.woodLite = std({ color: 0x8a6a3f, roughness: 0.7 });
  MAT.white    = std({ color: 0xe9ebee, roughness: 0.6 });
  MAT.steel    = std({ color: 0xcfd4d8, roughness: 0.35, metalness: 0.6 });
  MAT.dark     = std({ color: 0x262626, roughness: 0.6 });
  MAT.mattress = std({ color: 0xd9d5cf });
  MAT.red      = std({ color: 0x8b2f2f });
  MAT.blue     = std({ color: 0x7ea6c9 });
  MAT.tan      = std({ color: 0xb0a080 });
  MAT.chair    = std({ color: 0x5a4a3a });
  MAT.plant    = std({ color: 0x2f6b34, roughness: 1 });
  MAT.pot      = std({ color: 0x7a5236 });
  MAT.car      = std({ color: 0x3b4a6b, roughness: 0.4, metalness: 0.3 });
  MAT.tire     = std({ color: 0x151515 });
  MAT.fixture  = std({ color: 0xf2efe8, roughness: 0.5 });
  MAT.pump     = std({ color: 0x6b7280, roughness: 0.6, metalness: 0.2 });
  MAT.woodDark = std({ color: 0x5a3f2c, roughness: 0.7 });
  MAT.frame    = std({ color: 0xf7f4ee, roughness: 0.6 });
  MAT.wallCap  = std({ color: 0xd4cdbf, roughness: 0.9 });
  MAT.cushion  = std({ color: 0xe6dfd3, roughness: 0.95 });
  MAT.navy     = std({ color: 0x3b4a6b, roughness: 0.9 });
  MAT.leaf2    = std({ color: 0x3f7d3a, roughness: 1 });
  MAT.trunk    = std({ color: 0x6b4a2f, roughness: 1 });
  MAT.soil     = std({ color: 0x3d2b1c, roughness: 1 });
  MAT.chrome   = std({ color: 0xdfe3e8, roughness: 0.25, metalness: 0.9 });
  MAT.glassDark = new THREE.MeshPhysicalMaterial({ color: 0x2a3a4a, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.2 });
  MAT.mirror   = std({ color: 0xdfe6ee, roughness: 0.05, metalness: 1 });
  MAT.screenOff = std({ color: 0x0b0b0b, emissive: 0x1d3350, emissiveIntensity: 0.35, roughness: 0.3 });
  MAT.lightRed = std({ color: 0xff3b3b, emissive: 0xff2a2a, emissiveIntensity: 0.6 });
  MAT.lightWhite = std({ color: 0xfff6dd, emissive: 0xfff2cc, emissiveIntensity: 0.5 });
  MAT.book     = [0x8b2f2f, 0x2f5f8b, 0x3f7d3a, 0xc9a24a, 0x6b4a2f, 0xe6dfd3].map((c) => std({ color: c, roughness: 0.9 }));
  return MAT;
}

function box(w, h, d, mat, x, y, z, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = opts.cast !== false;
  m.receiveShadow = opts.receive !== false;
  return m;
}

// ---------------------------------------------------------------------------
// Água da piscina: shader próprio (ondas animadas, Fresnel, brilho do sol,
// cor por profundidade, espuma na borda). Uma malha, três texturas — leve.
// ---------------------------------------------------------------------------
const WATER_VERT = `
  varying vec3 vWorld;
  #include <fog_pars_vertex>
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const WATER_FRAG = `
  uniform float time;
  uniform sampler2D normalMap;
  uniform sampler2D caustic;
  uniform vec3 sunDir; uniform vec3 sunColor; uniform float sunIntensity;
  uniform vec3 skyTop; uniform vec3 skyHorizon;
  uniform vec3 deepColor; uniform vec3 shallowColor;
  uniform vec3 ledColor; uniform float ledIntensity;
  uniform vec4 pool; // x0, x1, zc, r
  uniform vec2 led1; uniform vec2 led2; uniform vec2 led3;
  varying vec3 vWorld;
  #include <fog_pars_fragment>
  float sdfPool(vec2 p) {
    if (p.x < pool.y) return max(abs(p.y - pool.z) - pool.w, pool.x - p.x);
    return length(p - vec2(pool.y, pool.z)) - pool.w;
  }
  void main() {
    vec2 p = vWorld.xz;
    vec3 n1 = texture2D(normalMap, p * 0.42 + vec2(time * 0.030, time * 0.018)).xyz * 2.0 - 1.0;
    vec3 n2 = texture2D(normalMap, p * 0.95 + vec2(-time * 0.022, time * 0.034)).xyz * 2.0 - 1.0;
    vec3 n3 = texture2D(normalMap, p * 1.9 + vec2(time * 0.05, -time * 0.041)).xyz * 2.0 - 1.0;
    vec3 n = normalize(vec3((n1.x + n2.x * 0.6 + n3.x * 0.25) * 0.42, 1.0, (n1.y + n2.y * 0.6 + n3.y * 0.25) * 0.42));
    vec3 V = normalize(cameraPosition - vWorld);
    float NdV = max(dot(n, V), 0.0);
    float F = 0.03 + 0.97 * pow(1.0 - NdV, 5.0);
    vec3 R = reflect(-V, n);
    vec3 sky = mix(skyHorizon, skyTop, pow(clamp(R.y, 0.0, 1.0), 0.6));
    vec3 H = normalize(normalize(sunDir) + V);
    float NdH = max(dot(n, H), 0.0);
    vec3 spec = sunColor * sunIntensity * (pow(NdH, 140.0) * 1.1 + pow(NdH, 900.0) * 2.5 + pow(NdH, 18.0) * 0.05);
    float d = sdfPool(p);
    float shallow = smoothstep(-1.1, 0.05, d);
    float c1 = texture2D(caustic, p * 0.55 + vec2(time * 0.012, -time * 0.009)).r;
    float c2 = texture2D(caustic, p * 0.35 - vec2(time * 0.008, time * 0.011)).r;
    float caus = c1 * c2 * 1.6 + c1 * 0.25;
    vec3 body = mix(deepColor, shallowColor, shallow);
    body += vec3(0.55, 0.85, 1.0) * caus * 0.055;
    float lf = 1.0 / (1.0 + 1.1 * dot(p - led1, p - led1)) + 1.0 / (1.0 + 1.1 * dot(p - led2, p - led2)) + 1.0 / (1.0 + 1.1 * dot(p - led3, p - led3));
    body += ledColor * ledIntensity * lf * (0.45 + 0.8 * caus);
    float foam = smoothstep(-0.16, 0.0, d) * (0.35 + 0.65 * c1);
    body = mix(body, vec3(0.92, 0.97, 1.0), foam * 0.45);
    vec3 col = mix(body, sky, F) + spec;
    float alpha = mix(0.9, 0.66, shallow);
    alpha = clamp(alpha + F * 0.6 + foam * 0.3, 0.0, 0.96);
    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }`;

// ---------------------------------------------------------------------------
// Mobiliário procedural: cada função devolve um Group com origem no centro da
// base (x → largura, z → profundidade, y → altura). Tudo feito de primitivas.
// ---------------------------------------------------------------------------
function cyl(rt, rb, h, mat, x, y, z, seg = 16, open = false) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
function sph(r, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
function furniture(M) {
  const G = () => new THREE.Group();
  const F = {
    bed(w, l, blanket) {
      const g = G();
      g.add(box(w, 0.22, l, M.woodDark, 0, 0.16, 0));
      g.add(box(w - 0.08, 0.2, l - 0.08, M.mattress, 0, 0.37, 0));
      g.add(box(w - 0.12, 0.07, l * 0.6, blanket, 0, 0.5, l * 0.18));
      if (w >= 1.2) { g.add(box(w * 0.4, 0.1, 0.4, M.white, -w * 0.24, 0.52, -l / 2 + 0.35)); g.add(box(w * 0.4, 0.1, 0.4, M.white, w * 0.24, 0.52, -l / 2 + 0.35)); }
      else g.add(box(w * 0.6, 0.1, 0.4, M.white, 0, 0.52, -l / 2 + 0.35));
      g.add(box(w + 0.06, 0.9, 0.07, M.woodDark, 0, 0.5, -l / 2 - 0.03));
      return g;
    },
    nightstand(lamp = true) {
      const g = G();
      g.add(box(0.45, 0.5, 0.42, M.woodDark, 0, 0.25, 0));
      g.add(box(0.14, 0.02, 0.02, M.chrome, 0, 0.32, 0.22));
      if (lamp) { g.add(cyl(0.02, 0.03, 0.22, M.chrome, 0, 0.61, 0, 8)); g.add(cyl(0.07, 0.12, 0.14, M.cushion, 0, 0.78, 0, 12, true)); }
      return g;
    },
    wardrobe(w, h = 2.0, d = 0.6, doors = 2) {
      const g = G();
      g.add(box(w, h, d, M.wood, 0, h / 2, 0));
      g.add(box(w + 0.02, 0.04, d + 0.02, M.woodDark, 0, h + 0.02, 0));
      for (let i = 1; i < doors; i++) g.add(box(0.01, h - 0.1, 0.01, M.woodDark, -w / 2 + (i * w) / doors, h / 2, d / 2));
      for (let i = 0; i < doors; i++) { const cx = -w / 2 + ((i + 0.5) * w) / doors + (i < doors / 2 ? 0.06 : -0.06); g.add(cyl(0.008, 0.008, 0.14, M.chrome, cx, h * 0.5, d / 2 + 0.015, 6)); }
      return g;
    },
    desk(w, d, withMonitor = true) {
      const g = G();
      g.add(box(w, 0.04, d, M.woodLite, 0, 0.74, 0));
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.025, 0.025, 0.72, M.dark, sx * (w / 2 - 0.06), 0.36, sz * (d / 2 - 0.06), 8));
      if (withMonitor) {
        g.add(box(0.6, 0.36, 0.03, M.dark, 0, 1.02, -d / 2 + 0.14));
        const scr = box(0.55, 0.31, 0.006, M.screenOff, 0, 1.02, -d / 2 + 0.16); scr.castShadow = false; g.add(scr);
        g.add(cyl(0.02, 0.02, 0.1, M.dark, 0, 0.8, -d / 2 + 0.14, 8)); g.add(cyl(0.1, 0.11, 0.015, M.dark, 0, 0.765, -d / 2 + 0.14, 16));
        g.add(box(0.42, 0.02, 0.14, M.dark, 0, 0.77, 0.06)); g.add(box(0.06, 0.02, 0.1, M.dark, 0.32, 0.77, 0.06));
      }
      return g;
    },
    officeChair() {
      const g = G();
      g.add(box(0.48, 0.08, 0.46, M.dark, 0, 0.47, 0));
      g.add(box(0.46, 0.5, 0.06, M.dark, 0, 0.78, -0.22));
      g.add(box(0.05, 0.03, 0.3, M.dark, -0.24, 0.66, 0)); g.add(box(0.05, 0.03, 0.3, M.dark, 0.24, 0.66, 0));
      g.add(cyl(0.025, 0.025, 0.4, M.chrome, 0, 0.23, 0, 8));
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const sp = box(0.3, 0.03, 0.04, M.dark, Math.cos(a) * 0.15, 0.04, Math.sin(a) * 0.15); sp.rotation.y = -a; g.add(sp); g.add(sph(0.03, M.dark, Math.cos(a) * 0.3, 0.03, Math.sin(a) * 0.3)); }
      return g;
    },
    bookshelf(w, h, d = 0.3, levels = 4, seed = 1) {
      const g = G(); const rnd = mulberry32(seed);
      g.add(box(0.03, h, d, M.woodLite, -w / 2, h / 2, 0)); g.add(box(0.03, h, d, M.woodLite, w / 2, h / 2, 0));
      g.add(box(w, 0.02, d, M.woodLite, 0, h, 0)); g.add(box(w, h, 0.02, M.woodLite, 0, h / 2, -d / 2));
      for (let i = 0; i < levels; i++) {
        const y = (i * h) / levels + 0.02; g.add(box(w, 0.025, d, M.woodLite, 0, y, 0));
        let x = -w / 2 + 0.06;
        while (x < w / 2 - 0.1) { const bw = 0.03 + rnd() * 0.04, bh = 0.16 + rnd() * 0.1; if (rnd() < 0.85) g.add(box(bw, bh, d * 0.7, M.book[Math.floor(rnd() * M.book.length)], x + bw / 2, y + bh / 2 + 0.012, 0)); x += bw + 0.005; }
      }
      return g;
    },
    sofa(w, d, fabric) {
      const g = G();
      g.add(box(w, 0.38, d, fabric, 0, 0.19, 0));
      g.add(box(w, 0.42, 0.2, fabric, 0, 0.59, -d / 2 + 0.1));
      g.add(box(0.18, 0.56, d, fabric, -w / 2 + 0.09, 0.28, 0)); g.add(box(0.18, 0.56, d, fabric, w / 2 - 0.09, 0.28, 0));
      const n = Math.max(1, Math.round((w - 0.36) / 0.7)), cw = (w - 0.36) / n;
      for (let i = 0; i < n; i++) g.add(box(cw - 0.05, 0.12, d - 0.32, M.cushion, -w / 2 + 0.18 + cw * (i + 0.5), 0.44, 0.08));
      return g;
    },
    diningTable(rx, rz) {
      const g = G();
      const top = cyl(1, 1, 0.05, M.tan, 0, 0.75, 0, 36); top.scale.set(rx, 1, rz); g.add(top);
      g.add(cyl(0.08, 0.08, 0.7, M.woodDark, 0, 0.36, 0, 12));
      const base = cyl(0.45, 0.5, 0.04, M.woodDark, 0, 0.02, 0, 24); base.scale.set(rx / rz, 1, 1); g.add(base);
      return g;
    },
    chair(fabric) {
      const g = G();
      g.add(box(0.42, 0.05, 0.42, M.woodLite, 0, 0.45, 0)); g.add(box(0.38, 0.04, 0.38, fabric, 0, 0.495, 0));
      g.add(box(0.03, 0.45, 0.03, M.woodLite, -0.18, 0.7, -0.19)); g.add(box(0.03, 0.45, 0.03, M.woodLite, 0.18, 0.7, -0.19));
      g.add(box(0.4, 0.16, 0.03, M.woodLite, 0, 0.84, -0.19));
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.02, 0.02, 0.44, M.woodLite, sx * 0.18, 0.22, sz * 0.18, 8));
      return g;
    },
    fridge() {
      const g = G();
      g.add(box(0.75, 1.85, 0.7, M.steel, 0, 0.925, 0));
      g.add(box(0.73, 0.012, 0.01, M.dark, 0, 1.25, 0.352));
      g.add(box(0.02, 0.4, 0.025, M.chrome, 0.28, 1.5, 0.37)); g.add(box(0.02, 0.7, 0.025, M.chrome, 0.28, 0.75, 0.37));
      return g;
    },
    stove() {
      const g = G();
      g.add(box(0.6, 0.88, 0.6, M.white, 0, 0.44, 0)); g.add(box(0.6, 0.02, 0.6, M.dark, 0, 0.89, 0));
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.08, 0.08, 0.012, M.chrome, sx * 0.14, 0.905, sz * 0.14, 16));
      g.add(box(0.52, 0.4, 0.012, M.steel, 0, 0.4, 0.305)); g.add(box(0.36, 0.14, 0.006, M.dark, 0, 0.42, 0.313));
      g.add(box(0.5, 0.02, 0.025, M.chrome, 0, 0.64, 0.32));
      for (let i = 0; i < 4; i++) g.add(cyl(0.015, 0.015, 0.03, M.chrome, -0.2 + i * 0.13, 0.78, 0.31, 8));
      return g;
    },
    hood() {
      const g = G();
      g.add(box(0.7, 0.08, 0.5, M.steel, 0, 0.04, 0)); g.add(box(0.3, 0.6, 0.3, M.steel, 0, 0.38, -0.1));
      return g;
    },
    cabinet(w, h, d, doors, mat) {
      const g = G(); mat = mat || M.wood;
      g.add(box(w, h, d, mat, 0, h / 2, 0));
      g.add(box(w + 0.02, 0.03, d + 0.02, M.woodDark, 0, h + 0.015, 0));
      for (let i = 1; i < doors; i++) g.add(box(0.008, h - 0.08, 0.01, M.woodDark, -w / 2 + (i * w) / doors, h / 2, d / 2));
      for (let i = 0; i < doors; i++) g.add(cyl(0.007, 0.007, 0.1, M.chrome, -w / 2 + ((i + 0.5) * w) / doors, h * 0.55, d / 2 + 0.012, 6));
      return g;
    },
    sink(w = 0.5, d = 0.4) {
      const g = G();
      g.add(box(w, 0.03, d, M.steel, 0, 0.0, 0)); g.add(box(w - 0.08, 0.02, d - 0.08, M.dark, 0, 0.005, 0));
      g.add(cyl(0.014, 0.014, 0.22, M.chrome, 0, 0.11, -d / 2 + 0.05, 8)); g.add(box(0.025, 0.025, 0.16, M.chrome, 0, 0.22, -d / 2 + 0.12));
      return g;
    },
    toilet() {
      const g = G();
      g.add(box(0.38, 0.38, 0.17, M.white, 0, 0.58, -0.2)); g.add(box(0.34, 0.02, 0.1, M.chrome, 0, 0.78, -0.2));
      const bowl = cyl(0.19, 0.14, 0.38, M.white, 0, 0.19, 0.05, 16); bowl.scale.set(1, 1, 1.25); g.add(bowl);
      const seat = cyl(0.2, 0.2, 0.04, M.white, 0, 0.4, 0.05, 16); seat.scale.set(1, 1, 1.25); g.add(seat);
      return g;
    },
    shower(s) {
      const g = G();
      g.add(box(s, 0.06, s, M.white, 0, 0.03, 0)); g.add(cyl(0.04, 0.04, 0.005, M.chrome, 0, 0.065, 0, 12));
      const p1 = box(0.02, 2.0, s, M.glass, s / 2, 1.0, 0, { cast: false, receive: false }); const p2 = box(s, 2.0, 0.02, M.glass, 0, 1.0, s / 2, { cast: false, receive: false }); g.add(p1, p2);
      g.add(box(0.03, 2.0, 0.03, M.chrome, s / 2, 1.0, s / 2)); g.add(box(0.03, 0.03, s, M.chrome, s / 2, 2.0, 0)); g.add(box(s, 0.03, 0.03, M.chrome, 0, 2.0, s / 2));
      g.add(cyl(0.015, 0.015, 1.9, M.chrome, -s / 2 + 0.06, 0.98, -s / 2 + 0.06, 8)); g.add(box(0.02, 0.02, 0.3, M.chrome, -s / 2 + 0.06, 1.95, -s / 2 + 0.2)); g.add(cyl(0.08, 0.08, 0.02, M.chrome, -s / 2 + 0.06, 1.95, -s / 2 + 0.35, 12));
      return g;
    },
    washbasin() {
      const g = G();
      g.add(box(0.6, 0.78, 0.45, M.white, 0, 0.39, 0)); g.add(box(0.64, 0.04, 0.48, M.steel, 0, 0.8, 0));
      g.add(cyl(0.17, 0.13, 0.1, M.white, 0, 0.86, 0.02, 16)); g.add(cyl(0.012, 0.012, 0.18, M.chrome, 0, 0.9, -0.16, 8)); g.add(box(0.02, 0.02, 0.12, M.chrome, 0, 0.99, -0.1));
      g.add(box(0.5, 0.6, 0.02, M.mirror, 0, 1.5, -0.235));
      return g;
    },
    shelves(w, h, d, levels, seed = 3) {
      const g = G(); const rnd = mulberry32(seed);
      g.add(box(0.03, h, d, M.woodLite, -w / 2, h / 2, 0)); g.add(box(0.03, h, d, M.woodLite, w / 2, h / 2, 0));
      for (let i = 0; i <= levels; i++) {
        const y = 0.1 + (i * (h - 0.1)) / levels; g.add(box(w, 0.025, d, M.woodLite, 0, y, 0));
        if (i < levels) { let x = -w / 2 + 0.08; while (x < w / 2 - 0.12) { const iw = 0.08 + rnd() * 0.1, ih = 0.1 + rnd() * 0.16; if (rnd() < 0.5) g.add(cyl(iw / 2, iw / 2, ih, M.book[Math.floor(rnd() * 6)], x + iw / 2, y + ih / 2 + 0.012, 0, 10)); else g.add(box(iw, ih, iw, M.book[Math.floor(rnd() * 6)], x + iw / 2, y + ih / 2 + 0.012, 0)); x += iw + 0.04 + rnd() * 0.06; } }
      }
      return g;
    },
    car() {
      const g = G();
      g.add(box(1.7, 0.5, 4.1, M.car, 0, 0.55, 0));
      g.add(box(1.5, 0.42, 1.9, M.dark, 0, 1.01, -0.15));
      const glass = box(1.56, 0.44, 1.96, M.glassDark, 0, 1.01, -0.15, { cast: false, receive: false }); g.add(glass);
      g.add(box(1.5, 0.03, 1.9, M.car, 0, 1.24, -0.15));
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const wh = cyl(0.33, 0.33, 0.24, M.tire, sx * 0.8, 0.33, sz * 1.35, 18); wh.rotation.z = Math.PI / 2; g.add(wh); const hub = cyl(0.14, 0.14, 0.26, M.chrome, sx * 0.8, 0.33, sz * 1.35, 12); hub.rotation.z = Math.PI / 2; g.add(hub); }
      g.add(box(1.72, 0.14, 0.1, M.dark, 0, 0.38, -2.06)); g.add(box(1.72, 0.14, 0.1, M.dark, 0, 0.38, 2.06));
      g.add(box(0.32, 0.12, 0.03, M.lightWhite, -0.6, 0.62, -2.06)); g.add(box(0.32, 0.12, 0.03, M.lightWhite, 0.6, 0.62, -2.06));
      g.add(box(0.32, 0.1, 0.03, M.lightRed, -0.6, 0.62, 2.06)); g.add(box(0.32, 0.1, 0.03, M.lightRed, 0.6, 0.62, 2.06));
      g.add(box(0.12, 0.08, 0.16, M.car, -0.9, 0.95, -0.9)); g.add(box(0.12, 0.08, 0.16, M.car, 0.9, 0.95, -0.9));
      return g;
    },
    // Volkswagen up! TSI — hatch compacto (3,60 m × 1,64 m × 1,50 m), frente em -z
    upTsi(paint) {
      const g = G();
      const body = new THREE.MeshStandardMaterial({ color: paint, roughness: 0.35, metalness: 0.45 });
      const trim = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.8 });
      // silhueta lateral (x = comprimento, y = altura), extrudada na largura
      const pr = new THREE.Shape();
      const pts = [[-1.8, 0.34], [-1.8, 0.6], [-1.74, 0.74], [-1.45, 0.8], [-0.95, 0.86], [-0.55, 1.28], [-0.3, 1.44], [0.2, 1.5], [1.1, 1.5], [1.42, 1.42], [1.72, 1.0], [1.8, 0.66], [1.8, 0.34]];
      pr.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) pr.lineTo(x, y); pr.closePath();
      const bodyGeo = new THREE.ExtrudeGeometry(pr, { depth: 1.56, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3 });
      const bm = new THREE.Mesh(bodyGeo, body); bm.rotation.y = -Math.PI / 2; bm.position.x = 0.78; bm.castShadow = true; bm.receiveShadow = true; g.add(bm);
      // vidros: para-brisa, vigia traseira e janelas laterais (com colunas entre elas)
      const glass = new THREE.MeshPhysicalMaterial({ color: 0x1f2a36, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.85 });
      const pane = (w, h, x, y, z, rx = 0) => { const m = box(w, h, 0.03, glass, x, y, z, { cast: false }); m.rotation.x = rx; g.add(m); };
      pane(1.42, 0.62, 0, 1.16, -0.68, 0.72);
      pane(1.3, 0.5, 0, 1.2, 1.6, 2.5);
      for (const sx of [-1, 1]) {
        const side = (h, y, z, l) => { const m = box(0.03, h, l, glass, sx * 0.83, y, z, { cast: false }); g.add(m); };
        side(0.42, 1.16, -0.05, 0.78); side(0.4, 1.16, 0.85, 0.72);
        g.add(box(0.02, 0.5, 0.06, trim, sx * 0.83, 1.15, 0.43));                         // coluna B
        g.add(box(0.14, 0.09, 0.18, body, sx * 0.9, 1.0, -0.32)); g.add(box(0.08, 0.03, 0.05, trim, sx * 0.84, 0.98, -0.32)); // retrovisores
        g.add(box(0.012, 0.42, 0.012, trim, sx * 0.83, 0.62, 0.42));                       // vinco das portas
        g.add(box(0.012, 0.42, 0.012, trim, sx * 0.83, 0.62, -0.62));
        g.add(box(0.03, 0.02, 0.1, M.chrome, sx * 0.84, 0.86, 0.05)); g.add(box(0.03, 0.02, 0.1, M.chrome, sx * 0.84, 0.86, 0.85)); // maçanetas
      }
      // rodas aro 15 (185/55 R15)
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const wh = cyl(0.29, 0.29, 0.19, M.tire, sx * 0.72, 0.29, sz * 1.21, 20); wh.rotation.z = Math.PI / 2; g.add(wh);
        const rim = cyl(0.19, 0.19, 0.2, M.chrome, sx * 0.72, 0.29, sz * 1.21, 10); rim.rotation.z = Math.PI / 2; g.add(rim);
        const cap = cyl(0.05, 0.05, 0.22, trim, sx * 0.72, 0.29, sz * 1.21, 8); cap.rotation.z = Math.PI / 2; g.add(cap);
      }
      // para-choques, grade, faróis redondos, lanternas verticais, placa
      g.add(box(1.5, 0.14, 0.08, trim, 0, 0.44, -1.82)); g.add(box(1.5, 0.14, 0.08, trim, 0, 0.44, 1.82));
      g.add(box(0.7, 0.08, 0.02, trim, 0, 0.7, -1.79)); g.add(box(0.28, 0.06, 0.02, M.chrome, 0, 0.7, -1.8));
      for (const sx of [-1, 1]) {
        const hl = sph(0.11, M.lightWhite, sx * 0.55, 0.76, -1.76); hl.scale.set(1, 0.75, 0.5); g.add(hl);
        g.add(box(0.12, 0.34, 0.03, M.lightRed, sx * 0.7, 1.0, 1.81));
      }
      g.add(box(0.4, 0.13, 0.02, M.white, 0, 0.6, 1.82)); g.add(box(0.4, 0.13, 0.02, M.white, 0, 0.56, -1.82));
      return g;
    },
    plant(size = 1, seed = 1) {
      const g = G(); const rnd = mulberry32(seed);
      g.add(cyl(0.2, 0.15, 0.32, M.pot, 0, 0.16, 0, 12)); g.add(cyl(0.18, 0.18, 0.02, M.soil, 0, 0.32, 0, 12));
      g.add(cyl(0.03, 0.045, 0.5, M.trunk, 0, 0.56, 0, 8));
      for (let i = 0; i < 6; i++) { const a = rnd() * Math.PI * 2, r = 0.1 + rnd() * 0.16; g.add(sph(0.2 + rnd() * 0.1, i % 2 ? M.plant : M.leaf2, Math.cos(a) * r, 0.9 + rnd() * 0.25, Math.sin(a) * r)); }
      g.scale.setScalar(size); return g;
    },
    tree() {
      const g = G();
      g.add(cyl(0.09, 0.13, 2.0, M.trunk, 0, 1.0, 0, 10));
      const rnd = mulberry32(8);
      for (let i = 0; i < 7; i++) { const a = rnd() * Math.PI * 2, r = 0.15 + rnd() * 0.4; g.add(sph(0.5 + rnd() * 0.25, i % 2 ? M.plant : M.leaf2, Math.cos(a) * r, 2.2 + rnd() * 0.5, Math.sin(a) * r)); }
      return g;
    },
    ladder() {
      const g = G();
      for (const x of [-0.2, 0.2]) {
        g.add(cyl(0.02, 0.02, 1.5, M.chrome, x, 0.25, 0, 8));
        const bend = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.02, 8, 12, Math.PI / 2), M.chrome); bend.position.set(x, 1.0, -0.25); bend.rotation.y = Math.PI / 2; bend.castShadow = true; g.add(bend);
        const arm = cyl(0.02, 0.02, 0.35, M.chrome, x, 1.25, -0.42, 8); arm.rotation.x = Math.PI / 2; g.add(arm);
      }
      for (const y of [-0.35, -0.05, 0.25, 0.55]) g.add(box(0.4, 0.025, 0.05, M.chrome, 0, y, 0));
      return g;
    },
    lounger(fabric) {
      const g = G();
      g.add(box(0.65, 0.04, 1.9, M.white, 0, 0.34, 0));
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.04, 0.32, 0.04, M.white, sx * 0.29, 0.16, sz * 0.85));
      g.add(box(0.6, 0.08, 1.15, fabric, 0, 0.4, 0.33));
      const back = box(0.6, 0.08, 0.75, fabric, 0, 0.6, -0.6); back.rotation.x = -0.75; g.add(back);
      return g;
    },
    parasol() {
      const g = G();
      g.add(cyl(0.02, 0.02, 2.3, M.chrome, 0, 1.15, 0, 8)); g.add(cyl(0.22, 0.25, 0.06, M.dark, 0, 0.03, 0, 12));
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.34, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0xf1e3c8, roughness: 0.95, side: THREE.DoubleSide })); c.position.y = 2.28; c.castShadow = true; g.add(c);
      return g;
    },
    roundTable(r = 0.45) {
      const g = G();
      g.add(cyl(r, r, 0.04, M.woodLite, 0, 0.72, 0, 24)); g.add(cyl(0.04, 0.04, 0.7, M.chrome, 0, 0.36, 0, 8)); g.add(cyl(0.25, 0.28, 0.03, M.chrome, 0, 0.015, 0, 16));
      return g;
    },
    rug(w, d, color) {
      const g = G(); const m = new THREE.MeshStandardMaterial({ color, roughness: 1 });
      const dark = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.7), roughness: 1 });
      g.add(box(w + 0.16, 0.01, d + 0.16, dark, 0, 0.005, 0, { cast: false })); g.add(box(w, 0.012, d, m, 0, 0.012, 0, { cast: false }));
      return g;
    },
  };
  return F;
}

// ---------------------------------------------------------------------------
// Desempenho: funde as malhas estáticas por material (um draw call por material)
// ---------------------------------------------------------------------------
function mergeStatic(scene) {
  scene.updateMatrixWorld(true);
  const groups = new Map();
  scene.traverse((o) => {
    if (!o.isMesh || o.isSprite || o.userData.item || o.userData.zone || o.userData.keep) return;
    for (let q = o.parent; q; q = q.parent) if (q.userData && q.userData.keep) return;
    const g = o.geometry, m = o.material;
    if (Array.isArray(m) || !g.attributes.position || !g.attributes.normal || !g.attributes.uv) return;
    const key = m.uuid + (o.castShadow ? ':c' : ':n') + (o.receiveShadow ? 'r' : '');
    if (!groups.has(key)) groups.set(key, { mat: m, meshes: [] });
    groups.get(key).meshes.push(o);
  });
  let before = 0, after = 0;
  for (const { mat, meshes } of groups.values()) {
    before += meshes.length;
    if (meshes.length < 2) { after += meshes.length; continue; }
    const parts = []; let total = 0;
    for (const o of meshes) {
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      g.applyMatrix4(o.matrixWorld); parts.push(g); total += g.attributes.position.count;
    }
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
    let off = 0;
    for (const g of parts) {
      const n = g.attributes.position.count;
      pos.set(g.attributes.position.array, off * 3); nor.set(g.attributes.normal.array, off * 3); uv.set(g.attributes.uv.array, off * 2);
      off += n; g.dispose();
    }
    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    merged.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = meshes[0].castShadow; mesh.receiveShadow = meshes[0].receiveShadow; mesh.matrixAutoUpdate = false;
    for (const o of meshes) { o.parent.remove(o); o.geometry.dispose(); }
    scene.add(mesh); after += 1;
  }
  return { before, after };
}

// ---------------------------------------------------------------------------
// Controle de órbita (mínimo, sem dependências): arrastar gira, roda/pinça
// aproxima, botão direito / dois dedos / Shift arrasta o alvo.
// ---------------------------------------------------------------------------
class Orbit {
  constructor(camera, dom, target) {
    this.camera = camera; this.dom = dom;
    this.target = target.clone(); this.targetGoal = target.clone();
    this.sph = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
    this.goal = this.sph.clone();
    this.minDist = 5; this.maxDist = 64; this.minPolar = 0.12; this.maxPolar = 1.45;
    this.pointers = new Map(); this.moved = 0; this.pinch = 0; this.touched = false;
    this.onClick = null; this.onHover = null;
    this._down = (e) => this.down(e); this._move = (e) => this.move(e);
    this._up = (e) => this.up(e); this._wheel = (e) => this.wheel(e);
    dom.addEventListener('pointerdown', this._down);
    dom.addEventListener('pointermove', this._move);
    dom.addEventListener('pointerup', this._up);
    dom.addEventListener('pointercancel', this._up);
    dom.addEventListener('wheel', this._wheel, { passive: false });
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
    this.dirty = true;
  }
  dispose() {
    const d = this.dom;
    d.removeEventListener('pointerdown', this._down); d.removeEventListener('pointermove', this._move);
    d.removeEventListener('pointerup', this._up); d.removeEventListener('pointercancel', this._up);
    d.removeEventListener('wheel', this._wheel);
  }
  down(e) {
    this.dom.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, b: e.button, shift: e.shiftKey });
    if (this.pointers.size === 2) this.pinch = this._dist();
    this.moved = 0;
  }
  _dist() {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  move(e) {
    const p = this.pointers.get(e.pointerId);
    if (!p) { if (this.onHover) this.onHover(e); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY; this.touched = true;
    this.moved += Math.abs(dx) + Math.abs(dy);
    if (this.pointers.size === 2) {
      const d = this._dist();
      if (this.pinch) this.zoomBy(this.pinch / d);
      this.pinch = d;
      this.pan(dx * 0.5, dy * 0.5);
    } else if (p.b === 2 || p.b === 1 || p.shift) {
      this.pan(dx, dy);
    } else {
      this.goal.theta -= dx * 0.0055;
      this.goal.phi = clamp(this.goal.phi - dy * 0.0055, this.minPolar, this.maxPolar);
    }
    this.dirty = true;
  }
  up(e) {
    const p = this.pointers.get(e.pointerId);
    this.pointers.delete(e.pointerId);
    try { this.dom.releasePointerCapture(e.pointerId); } catch (_) {}
    if (p && this.moved < 6 && p.b === 0 && this.onClick) this.onClick(e);
    this.pinch = 0;
  }
  wheel(e) { e.preventDefault(); this.touched = true; this.zoomBy(Math.exp(e.deltaY * 0.0012)); this.dirty = true; }
  zoomBy(f) { this.goal.radius = clamp(this.goal.radius * f, this.minDist, this.maxDist); }
  pan(dx, dy) {
    const k = this.goal.radius * 0.0016;
    const fwd = new THREE.Vector3(); this.camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    this.targetGoal.addScaledVector(right, -dx * k).addScaledVector(fwd, dy * k);
    this.targetGoal.x = clamp(this.targetGoal.x, -4, LOT.w + 4);
    this.targetGoal.z = clamp(this.targetGoal.z, -4, LOT.d + 4);
  }
  reset(pos, target) {
    this.goal.setFromVector3(pos.clone().sub(target)); this.targetGoal.copy(target); this.dirty = true;
  }
  update(dt) {
    const k = 1 - Math.exp(-dt * 9);
    const s = this.sph;
    s.theta += (this.goal.theta - s.theta) * k;
    s.phi += (this.goal.phi - s.phi) * k;
    s.radius += (this.goal.radius - s.radius) * k;
    this.target.lerp(this.targetGoal, k);
    const moving = Math.abs(this.goal.theta - s.theta) + Math.abs(this.goal.phi - s.phi) + Math.abs(this.goal.radius - s.radius) + this.target.distanceTo(this.targetGoal) > 1e-4;
    this.camera.position.setFromSpherical(s).add(this.target);
    this.camera.lookAt(this.target);
    const wasDirty = this.dirty; this.dirty = moving;
    return wasDirty || moving;
  }
}

// @rooms-begin
function roomQuartoCasal(ctx) {
  // QUARTO CASAL — x 0–3,6 · z 0–4,2. Faces internas: x 0,075/3,525 · z 0,075/4,125.
  // Janela fundo (z=0) x 1,2–2,4 · porta (z=4,2) x 1,0–1,9 (abre p/ dentro, dobradiça em x=1,0) · janela frente x 2,5–3,3.
  // Layout: cama centrada na janela do fundo, criados dos dois lados, banco ao pé, guarda-roupa na parede
  // esquerda (x=0), cômoda + espelho na parede direita (x=3,6), planta no canto da janela da frente.
  const { THREE, M, box, cyl, sph, place, add, std, rnd } = ctx;
  const G = () => new THREE.Group();
  const put = (m, x, y, z, rx = 0, ry = 0, rz = 0) => { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); return m; };

  // ---------------- paleta: madeira escura + linho + acento vinho/terracota ----------------
  const walnut    = std({ color: 0x5e4330, roughness: 0.62 });
  const walnutDk  = std({ color: 0x3b2a1e, roughness: 0.6 });
  const offWhite  = std({ color: 0xe6dfd3, roughness: 0.55 });
  const trim      = std({ color: 0xf4f0e8, roughness: 0.6 });
  const linen     = std({ color: 0xe2dacd, roughness: 0.95 });
  const linenLt   = std({ color: 0xf2ede4, roughness: 0.95 });
  const greige    = std({ color: 0xc6b7a3, roughness: 0.95 });
  const rugField  = std({ color: 0xb8ac9e, roughness: 1 });
  const vinho     = std({ color: 0x6b2a33, roughness: 0.95 });
  const vinhoDk   = std({ color: 0x4b2129, roughness: 1 });
  const terracota = std({ color: 0xb5623f, roughness: 0.9 });
  const rose      = std({ color: 0xc79b8e, roughness: 0.95 });
  const sand      = std({ color: 0xd8cab4, roughness: 0.95 });
  const brass     = std({ color: 0xc2a15c, roughness: 0.35, metalness: 0.75 });
  const ceramic   = std({ color: 0xb6705a, roughness: 0.4 });
  const wicker    = std({ color: 0xc2a06a, roughness: 1 });
  const potMat    = std({ color: 0xe6e0d4, roughness: 0.6 });
  const amber     = std({ color: 0xc98a3c, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.75 });
  const artA      = std({ color: 0xb5623f, roughness: 0.9 });
  const artB      = std({ color: 0x7c4a52, roughness: 0.9 });
  const artC      = std({ color: 0xd9cfbf, roughness: 0.9 });
  const shadeMat  = new THREE.MeshStandardMaterial({ color: 0xf1e8d8, roughness: 0.9, side: THREE.DoubleSide });
  const sheerMat  = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false });

  // ---------------- builders locais ----------------
  // "puff": bloco w×h×d com todas as arestas arredondadas (raio r) — colchão, edredom, travesseiros, almofadas…
  const puff = (w, h, d, mat, r = 0.03) => {
    r = Math.min(r, w * 0.45, h * 0.45, d * 0.45);
    const sw = w - 2 * r, sd = d - 2 * r, c = Math.min(r, sw / 2, sd / 2);
    const s = new THREE.Shape();
    s.moveTo(-sw / 2 + c, -sd / 2);
    s.lineTo(sw / 2 - c, -sd / 2);  s.absarc(sw / 2 - c, -sd / 2 + c, c, -Math.PI / 2, 0, false);
    s.lineTo(sw / 2, sd / 2 - c);   s.absarc(sw / 2 - c, sd / 2 - c, c, 0, Math.PI / 2, false);
    s.lineTo(-sw / 2 + c, sd / 2);  s.absarc(-sw / 2 + c, sd / 2 - c, c, Math.PI / 2, Math.PI, false);
    s.lineTo(-sw / 2, -sd / 2 + c); s.absarc(-sw / 2 + c, -sd / 2 + c, c, Math.PI, Math.PI * 1.5, false);
    const g = new THREE.ExtrudeGeometry(s, { depth: h - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelOffset: 0, bevelSegments: 3, curveSegments: 5, steps: 1 });
    g.translate(0, 0, -(h - 2 * r) / 2); g.rotateX(-Math.PI / 2);   // eixo da extrusão → +y; origem no centro
    const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
  };
  // painel de cortina pregueado: fita ondulada (plano XZ) extrudada na altura; origem na base, centro em x
  const curtain = (w, h, mat) => {
    const waves = Math.max(2, Math.round(w / 0.11)), A = 0.028, t = 0.022, n = waves * 8;
    const wave = (i) => A * Math.sin((i / n) * Math.PI * 2 * waves);
    const s = new THREE.Shape();
    s.moveTo(0, wave(0));
    for (let i = 1; i <= n; i++) s.lineTo((i / n) * w, wave(i));
    for (let i = n; i >= 0; i--) s.lineTo((i / n) * w, wave(i) + t);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, steps: 1 });
    g.translate(-w / 2, -t / 2, 0); g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
  };
  const rod = (x0, x1, y, z) => {          // varão de cortina em latão com ponteiras
    const r = cyl(0.012, 0.012, x1 - x0, brass, (x0 + x1) / 2, y, z, 10); r.rotation.z = Math.PI / 2; add(r);
    add(sph(0.024, brass, x0 - 0.02, y, z)); add(sph(0.024, brass, x1 + 0.02, y, z));
  };
  const picture = (w, h, art) => {         // quadro: moldura escura + tela; face para +z local
    const g = G();
    g.add(box(w, h, 0.03, walnutDk, 0, 0, 0));
    g.add(box(w - 0.06, h - 0.06, 0.01, art, 0, 0, 0.015, { cast: false }));
    return g;
  };
  const feet = (g, w, d, h, inset, s) => { // 4 pés quadrados de madeira escura
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(s, h, s, walnutDk, sx * (w / 2 - inset), h / 2, sz * (d / 2 - inset)));
  };

  // Cama de casal (origem no centro da base do colchão; cabeceira em -z)
  const bed = (w, l) => {
    const g = G();
    feet(g, w, l, 0.10, 0.10, 0.06);
    g.add(box(w, 0.22, l, walnut, 0, 0.21, 0));                                    // box / estrado
    g.add(put(puff(w - 0.04, 0.22, l - 0.04, M.mattress, 0.05), 0, 0.43, 0));     // colchão
    g.add(box(w + 0.10, 0.98, 0.08, walnut, 0, 0.49, -l / 2 - 0.06));            // moldura da cabeceira
    for (let i = -1; i <= 1; i++) g.add(put(puff(0.50, 0.42, 0.05, greige, 0.02), i * 0.53, 0.72, -l / 2 + 0.005)); // painéis estofados
    g.add(put(puff(w + 0.10, 0.09, l - 0.60, linen, 0.04), 0, 0.585, 0.30));      // edredom
    g.add(put(puff(w + 0.10, 0.07, 0.34, linenLt, 0.03), 0, 0.635, -l / 2 + 0.77)); // dobra virada (avesso claro)
    g.add(box(w + 0.10, 0.30, 0.04, linen, 0, 0.45, l / 2 + 0.02));               // caída do edredom no pé
    g.add(put(puff(w + 0.14, 0.06, 0.48, vinho, 0.025), 0, 0.655, l / 2 - 0.32));  // manta vinho dobrada
    for (const sx of [-1, 1]) g.add(put(puff(0.68, 0.15, 0.42, linenLt, 0.05), sx * 0.40, 0.64, -l / 2 + 0.25, 0.20, sx * 0.03)); // travesseiros
    for (const sx of [-1, 1]) g.add(put(puff(0.44, 0.12, 0.44, vinho, 0.05), sx * 0.36, 0.76, -l / 2 + 0.40, 1.15));            // almofadas encostadas
    g.add(put(puff(0.55, 0.11, 0.28, terracota, 0.045), 0, 0.66, -l / 2 + 0.52, 0.95));                                          // almofada lombar
    return g;
  };
  // Criado-mudo 0,50×0,55×0,42: pés, gaveta em cima (frente clara + puxador latão) e nicho aberto embaixo
  const nightstand = () => {
    const g = G(), w = 0.5, d = 0.42;
    feet(g, w, d, 0.12, 0.04, 0.035);
    g.add(box(w, 0.20, d, walnut, 0, 0.42, 0));                       // corpo da gaveta
    for (const sx of [-1, 1]) g.add(box(0.02, 0.20, d, walnut, sx * (w / 2 - 0.01), 0.22, 0)); // laterais do nicho
    g.add(box(w, 0.02, d, walnut, 0, 0.13, 0));                       // fundo do nicho
    g.add(box(w + 0.04, 0.03, d + 0.04, walnutDk, 0, 0.535, 0));      // tampo
    g.add(box(w - 0.06, 0.15, 0.015, offWhite, 0, 0.42, d / 2 + 0.0075));
    g.add(box(0.12, 0.012, 0.02, brass, 0, 0.42, d / 2 + 0.025));
    return g;
  };
  const lamp = (x, z) => {                 // abajur sobre o criado (tampo em y 0,55)
    add(cyl(0.05, 0.075, 0.16, ceramic, x, 0.63, z, 14));
    add(cyl(0.008, 0.008, 0.14, brass, x, 0.78, z, 8));
    add(cyl(0.09, 0.135, 0.17, shadeMat, x, 0.915, z, 18, true));
  };
  const slipper = (x, z, ry, y0) => {      // chinelo: sola + tira
    const g = G();
    g.add(box(0.10, 0.02, 0.26, M.tan, 0, 0.01, 0));
    g.add(box(0.10, 0.045, 0.05, vinho, 0, 0.04, -0.05));
    place(g, x, z, ry, y0);
  };
  const bench = () => {                    // banco estofado ao pé da cama + manta dobrada
    const g = G(), w = 1.2, d = 0.42;
    feet(g, w, d, 0.33, 0.06, 0.04);
    g.add(box(w, 0.05, d, walnut, 0, 0.355, 0));
    g.add(put(puff(w - 0.02, 0.09, d - 0.02, greige, 0.035), 0, 0.425, 0));
    g.add(put(puff(0.40, 0.07, 0.30, terracota, 0.03), 0.32, 0.505, 0, 0, 0.08));
    return g;
  };
  // Guarda-roupa 3 portas (portas em +z local): carcaça nogueira, portas off-white, porta central espelhada
  const wardrobe = (w, h, d) => {
    const g = G();
    g.add(box(w - 0.06, 0.08, d - 0.06, walnutDk, 0, 0.04, 0));          // rodapé recuado
    g.add(box(w, h - 0.08, d, walnut, 0, 0.08 + (h - 0.08) / 2, 0));
    g.add(box(w + 0.03, 0.03, d + 0.03, walnutDk, 0, h + 0.015, 0));     // tampo saliente
    const dw = w / 3 - 0.02, dh = h - 0.2;
    for (let i = 0; i < 3; i++) {
      const cx = -w / 2 + ((i + 0.5) * w) / 3;
      g.add(box(dw, dh, 0.02, i === 1 ? M.mirror : offWhite, cx, 0.1 + dh / 2, d / 2 + 0.01, i === 1 ? { cast: false } : {}));
      g.add(box(0.014, 0.28, 0.02, brass, cx + (i === 0 ? dw / 2 - 0.05 : -dw / 2 + 0.05), 1.05, d / 2 + 0.03));
    }
    return g;
  };
  // Cômoda 1,00×0,85×0,45 com 3 gavetas (frente em +z local)
  const dresser = () => {
    const g = G(), w = 1.0, d = 0.45;
    feet(g, w, d, 0.14, 0.04, 0.035);
    g.add(box(w, 0.68, d, walnut, 0, 0.48, 0));
    g.add(box(w + 0.04, 0.03, d + 0.04, walnutDk, 0, 0.835, 0));
    for (let i = 0; i < 3; i++) {
      const y = 0.2625 + i * 0.2175;
      g.add(box(w - 0.08, 0.19, 0.015, offWhite, 0, y, d / 2 + 0.0075));
      g.add(box(0.24, 0.012, 0.02, brass, 0, y, d / 2 + 0.025));
    }
    return g;
  };
  const plant = () => {                    // pacová em vaso cerâmico claro: folhas = esferas achatadas
    const g = G();
    g.add(cyl(0.14, 0.11, 0.30, potMat, 0, 0.15, 0, 16));
    g.add(cyl(0.125, 0.125, 0.02, M.soil, 0, 0.30, 0, 14));
    g.add(cyl(0.012, 0.018, 0.75, M.trunk, 0, 0.675, 0, 8));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + rnd() * 0.5, r = 0.08 + rnd() * 0.02;
      const leaf = sph(0.14, i % 2 ? M.plant : M.leaf2, Math.cos(a) * r, 0.74 + i * 0.09 + rnd() * 0.04, Math.sin(a) * r);
      leaf.scale.set(1, 0.16, 0.6); leaf.rotation.set(0, -a, 0.25 + rnd() * 0.3);
      g.add(leaf);
    }
    return g;
  };
  const rug = () => {                      // tapete grande: borda vinho escura, campo greige, 2 listras terracota por lado
    const g = G();
    g.add(box(2.0, 0.010, 2.2, vinhoDk, 0, 0.005, 0, { cast: false }));
    g.add(box(1.84, 0.012, 2.04, rugField, 0, 0.011, 0, { cast: false }));
    for (const sx of [-0.80, -0.70, 0.70, 0.80]) g.add(box(0.04, 0.004, 2.04, terracota, sx, 0.019, 0, { cast: false }));
    return g;
  };

  // ---------------- rodapé (4 paredes, pulando o vão da porta) ----------------
  const base = (w, d, x, z) => add(box(w, 0.08, d, trim, x, 0.04, z, { cast: false }));
  base(3.45, 0.015, 1.8, 0.0825);      // fundo
  base(0.015, 4.05, 0.0825, 2.1);      // esquerda
  base(0.015, 4.05, 3.5175, 2.1);      // direita
  base(0.925, 0.015, 0.5375, 4.1175);  // frente, à esquerda da porta
  base(1.625, 0.015, 2.7125, 4.1175);  // frente, à direita da porta

  // ---------------- tapete + cama + criados + abajures + objetos ----------------
  place(rug(), 1.8, 2.10);                                   // x 0,8–2,8 · z 1,0–3,2 (livre do giro da porta)
  place(bed(1.6, 1.9), 1.8, 1.32);                           // cabeceira encostada em z 0,27; colchão z 0,39–2,25
  place(nightstand(), 0.66, 0.35); place(nightstand(), 2.94, 0.35);
  lamp(0.66, 0.27); lamp(2.94, 0.27);
  // criado esquerdo: dois livros e celular
  add(box(0.15, 0.028, 0.21, M.book[1], 0.55, 0.564, 0.46));
  add(put(box(0.13, 0.02, 0.19, M.book[3], 0, 0, 0), 0.555, 0.588, 0.465, 0, 0.12));
  add(put(box(0.07, 0.008, 0.15, M.dark, 0, 0, 0), 0.82, 0.554, 0.45, 0, 0.35));
  // criado direito: copo d'água e despertador digital
  const glassCup = cyl(0.034, 0.03, 0.09, M.glass, 3.07, 0.595, 0.47, 12); glassCup.castShadow = false; add(glassCup);
  add(box(0.09, 0.07, 0.035, M.dark, 2.80, 0.585, 0.45));
  add(box(0.07, 0.045, 0.004, M.screenOff, 2.80, 0.585, 0.4695, { cast: false }));
  // chinelos nos dois lados da cama (sobre o tapete)
  slipper(0.86, 1.50, 0.12, 0.017); slipper(0.97, 1.53, -0.08, 0.017);
  slipper(2.63, 1.22, -0.10, 0.017); slipper(2.74, 1.25, 0.06, 0.017);
  place(bench(), 1.8, 2.59);                                 // z 2,38–2,80, ao pé da cama

  // ---------------- guarda-roupa (parede esquerda) + cesto de roupa ----------------
  place(wardrobe(1.7, 2.1, 0.6), 0.455, 3.15, Math.PI / 2);  // x 0,155–0,775 · z 2,30–4,00; portas para +x
  add(cyl(0.17, 0.15, 0.50, wicker, 0.33, 0.25, 2.0, 14));
  add(cyl(0.185, 0.185, 0.03, wicker, 0.33, 0.515, 2.0, 14));

  // ---------------- cômoda com espelho redondo (parede direita) + objetos ----------------
  place(dresser(), 3.22, 2.95, -Math.PI / 2);                // x 2,995–3,445 · z 2,45–3,45; frente para -x
  const mirrorFrame = cyl(0.29, 0.29, 0.02, walnutDk, 3.514, 1.45, 2.95, 28); mirrorFrame.rotation.z = Math.PI / 2; add(mirrorFrame);
  const mirrorGlass = cyl(0.26, 0.26, 0.006, M.mirror, 3.501, 1.45, 2.95, 28); mirrorGlass.rotation.z = Math.PI / 2; mirrorGlass.castShadow = false; add(mirrorGlass);
  add(box(0.30, 0.015, 0.20, brass, 3.28, 0.8575, 2.70));                 // bandeja
  add(box(0.05, 0.10, 0.03, amber, 3.24, 0.915, 2.66));                   // perfumes
  add(box(0.04, 0.13, 0.04, amber, 3.33, 0.93, 2.73));
  add(put(box(0.012, 0.15, 0.12, walnutDk, 0, 0, 0), 3.30, 0.925, 3.15, 0, 0, -0.12)); // porta-retrato inclinado
  add(cyl(0.035, 0.035, 0.06, linenLt, 3.25, 0.88, 3.32, 12));            // vela
  place(plant(), 3.20, 3.74);                                              // canto junto à janela da frente

  // ---------------- janela do fundo: persiana rolô (meio aberta) + cortinas de linho ----------------
  const roller = cyl(0.03, 0.03, 1.18, linenLt, 1.8, 2.21, 0.115, 12); roller.rotation.z = Math.PI / 2; add(roller);
  add(box(1.16, 0.62, 0.008, linenLt, 1.8, 1.90, 0.115, { cast: false }));
  add(box(1.18, 0.025, 0.02, walnutDk, 1.8, 1.585, 0.115));
  rod(0.94, 2.66, 2.37, 0.20);
  add(put(curtain(0.32, 2.31, sand), 1.12, 0.03, 0.20));
  add(put(curtain(0.32, 2.31, sand), 2.48, 0.03, 0.20));

  // ---------------- janela da frente: voil + cortinas de linho ----------------
  rod(2.32, 3.48, 2.37, 4.04);
  add(put(curtain(0.32, 2.31, sand), 2.50, 0.03, 4.04));
  add(put(curtain(0.32, 2.31, sand), 3.34, 0.03, 4.04));
  add(box(0.80, 1.26, 0.008, sheerMat, 2.90, 1.69, 4.085, { cast: false, receive: false }));

  // ---------------- quadros ----------------
  place(picture(0.38, 0.50, artA), 0.09, 1.05, Math.PI / 2, 1.55);      // parede esquerda, par de quadros
  place(picture(0.38, 0.50, artB), 0.09, 1.55, Math.PI / 2, 1.55);
  place(picture(0.75, 0.50, artC), 3.51, 1.45, -Math.PI / 2, 1.55);     // parede direita, quadro largo
  const sun = cyl(0.11, 0.11, 0.006, terracota, 3.487, 1.58, 1.30, 20); sun.rotation.z = Math.PI / 2; sun.castShadow = false; add(sun);

  // ---------------- parede da frente: cabideiro com roupão, interruptor ----------------
  add(box(0.40, 0.06, 0.02, walnutDk, 2.20, 1.78, 4.115));
  for (const hx of [2.11, 2.29]) { const hook = cyl(0.009, 0.009, 0.06, brass, hx, 1.76, 4.08, 8); hook.rotation.x = Math.PI / 2; add(hook); }
  add(put(puff(0.28, 0.95, 0.09, rose, 0.04), 2.18, 1.235, 4.05));
  add(box(0.30, 0.03, 0.10, sand, 2.18, 1.02, 4.05));                      // cinto do roupão
  add(box(0.08, 0.12, 0.012, M.white, 1.98, 1.15, 4.119, { cast: false })); // interruptor ao lado da porta
}

// Quarto / escritório (x 3,6–6,8 · z 0–4,2) — quarto de jovem adulto que também é home office.
// Paleta: madeira clara + azul-petróleo; branco, cinza e grafite nos eletrônicos.
// Layout: escrivaninha no fundo sob a janela (luminária de mesa do cartão em 4,15/0,5 fica livre),
// cadeira gamer, estante na parede x=3,6, guarda-roupa e rack sob a TV na parede x=6,8,
// cama de solteiro ao longo da parede direita com a cabeceira sob a janela da frente
// (fora do giro da porta x 4,1–5,0), criado ao lado, tapete no meio, planta e violão no canto esquerdo.
function roomQuarto(ctx) {
  const { THREE, box, cyl, sph, place, add, std, rnd, M } = ctx;
  const G = () => new THREE.Group();

  // ---- materiais do cômodo -------------------------------------------------
  const woodL   = std({ color: 0xd9bb90, roughness: 0.65 });   // madeira clara (tampos, cama, estante)
  const woodM   = std({ color: 0xc19a6b, roughness: 0.7 });    // madeira clara, tom médio (bordas, braço do violão)
  const petrol  = std({ color: 0x1f5c66, roughness: 0.85 });   // azul-petróleo (acento)
  const petrolD = std({ color: 0x163f47, roughness: 0.85 });
  const fabric  = std({ color: 0x2c3034, roughness: 0.95 });   // tecido da cadeira gamer
  const keys    = std({ color: 0x4a5057, roughness: 0.8 });
  const grey    = std({ color: 0xb4bbbf, roughness: 0.9 });
  const linen   = std({ color: 0xe9e3d7, roughness: 0.95 });
  const blind   = std({ color: 0xd9d7d0, roughness: 0.95 });
  const spruce  = std({ color: 0xe3c893, roughness: 0.6 });    // tampo do violão
  const ceramic = std({ color: 0xf1efe9, roughness: 0.5 });
  const rugMat  = std({ color: 0xcfd5d7, roughness: 1 });
  const glow    = std({ color: 0x1f5c66, emissive: 0x3fd3e6, emissiveIntensity: 1.0 });
  const bookMats = M.book.concat([petrol, petrolD, woodM]);
  const torus = (r, t, arc, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 18, arc), mat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
  };

  // ---- escrivaninha 1,6 × 0,7 encostada no fundo (tampo em y = 0,75) -------
  {
    const g = G();
    g.add(box(1.6, 0.04, 0.7, woodL, 0, 0.73, 0));                                // tampo
    g.add(box(0.04, 0.71, 0.64, woodM, -0.78, 0.355, 0));                         // lateral esquerda
    g.add(box(0.04, 0.71, 0.64, woodM, 0.78, 0.355, 0));                          // lateral direita
    g.add(box(1.52, 0.24, 0.03, woodM, 0, 0.59, -0.315));                         // travessa traseira
    g.add(box(0.4, 0.58, 0.5, M.white, 0.55, 0.29, 0.02));                        // gaveteiro
    for (let i = 0; i < 3; i++) g.add(box(0.36, 0.165, 0.012, woodL, 0.55, 0.11 + i * 0.185, 0.276)); // frentes das gavetas
    g.add(box(0.2, 0.42, 0.45, M.dark, -0.62, 0.21, 0.02));                       // gabinete do PC
    g.add(box(0.2, 0.012, 0.012, glow, -0.62, 0.415, 0.25, { cast: false }));     // fita RGB do gabinete
    g.add(box(1.3, 0.012, 0.012, glow, 0.1, 0.765, -0.335, { cast: false }));     // fita LED atrás do monitor
    place(g, 4.5, 0.55);
  }

  // ---- monitor 27" em pedestal ---------------------------------------------
  {
    const g = G();
    g.add(box(0.26, 0.014, 0.17, M.dark, 0, 0.007, 0));
    g.add(box(0.05, 0.28, 0.025, M.dark, 0, 0.15, -0.04));
    g.add(box(0.62, 0.37, 0.025, M.dark, 0, 0.31, -0.02));
    g.add(box(0.6, 0.35, 0.006, M.screenOff, 0, 0.31, -0.005, { cast: false }));
    place(g, 4.64, 0.33, 0, 0.75);
  }

  // ---- notebook aberto, virado para quem senta ------------------------------
  {
    const g = G();
    g.add(box(0.32, 0.016, 0.22, M.steel, 0, 0.008, 0));
    g.add(box(0.26, 0.004, 0.1, keys, 0, 0.018, -0.02));
    const lid = box(0.32, 0.215, 0.012, M.steel, 0, 0.12, -0.137); lid.rotation.x = -0.25; g.add(lid);
    const scr = box(0.29, 0.185, 0.004, M.screenOff, 0, 0.122, -0.13, { cast: false }); scr.rotation.x = -0.25; g.add(scr);
    place(g, 5.1, 0.52, -0.35, 0.757);
  }

  // ---- periféricos: mousepad, teclado, mouse, caneca, headset no suporte ----
  add(box(0.8, 0.006, 0.32, petrolD, 4.72, 0.753, 0.72, { cast: false }));        // desk mat
  add(box(0.44, 0.022, 0.14, M.dark, 4.6, 0.767, 0.72));                          // teclado
  add(box(0.41, 0.006, 0.11, keys, 4.6, 0.781, 0.72, { cast: false }));           // teclas
  const mouse = sph(0.032, M.dark, 4.98, 0.775, 0.74); mouse.scale.set(1, 0.6, 1.4); add(mouse);
  add(cyl(0.04, 0.035, 0.09, ceramic, 5.19, 0.795, 0.82, 14));                    // caneca
  add(cyl(0.05, 0.05, 0.01, M.dark, 5.2, 0.755, 0.26, 12));                       // suporte do headset
  add(cyl(0.008, 0.008, 0.24, M.dark, 5.2, 0.875, 0.26, 8));
  add(box(0.08, 0.02, 0.04, M.dark, 5.2, 1.0, 0.26));
  add(torus(0.075, 0.012, Math.PI, M.dark, 5.2, 0.915, 0.26));                    // arco do headset
  for (const s of [-1, 1]) { const c = cyl(0.04, 0.04, 0.025, petrol, 5.2 + s * 0.075, 0.915, 0.26, 12); c.rotation.z = Math.PI / 2; add(c); } // conchas

  // ---- cadeira gamer de encosto alto (virada para a mesa) -------------------
  {
    const g = G();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const sp = box(0.3, 0.03, 0.045, M.dark, Math.cos(a) * 0.15, 0.045, Math.sin(a) * 0.15); sp.rotation.y = -a; g.add(sp);
      g.add(sph(0.03, M.dark, Math.cos(a) * 0.29, 0.03, Math.sin(a) * 0.29));       // rodízios
    }
    g.add(cyl(0.03, 0.03, 0.36, M.chrome, 0, 0.24, 0, 10));                          // pistão
    g.add(box(0.52, 0.11, 0.52, fabric, 0, 0.47, 0.02));                             // assento
    g.add(box(0.2, 0.114, 0.3, petrol, 0, 0.47, 0.07));                              // faixa central
    const back = box(0.5, 0.86, 0.09, fabric, 0, 0.98, -0.26); back.rotation.x = -0.1; g.add(back);       // encosto alto
    const stripe = box(0.16, 0.7, 0.094, petrol, 0, 0.98, -0.26); stripe.rotation.x = -0.1; g.add(stripe);
    const head = box(0.26, 0.11, 0.07, petrolD, 0, 1.31, -0.21); head.rotation.x = -0.1; g.add(head);     // almofada da cabeça
    const lumbar = box(0.3, 0.14, 0.06, petrolD, 0, 0.72, -0.16); lumbar.rotation.x = -0.1; g.add(lumbar); // lombar
    for (const s of [-1, 1]) { g.add(box(0.05, 0.22, 0.05, M.dark, s * 0.29, 0.6, 0)); g.add(box(0.08, 0.03, 0.26, M.dark, s * 0.29, 0.725, 0)); } // braços
    place(g, 4.5, 1.3, Math.PI);
  }

  // ---- estante 1,4 × 1,9 na parede x = 3,6 com livros e objetos -------------
  {
    const g = G(); const w = 1.4, d = 0.3, h = 1.9;
    g.add(box(0.03, h, d, woodL, -w / 2 + 0.015, h / 2, 0)); g.add(box(0.03, h, d, woodL, w / 2 - 0.015, h / 2, 0));
    g.add(box(w, 0.03, d, woodL, 0, h - 0.015, 0));
    g.add(box(w, h, 0.012, M.white, 0, h / 2, -d / 2 + 0.006));                       // fundo branco
    for (const y of [0.05, 0.52, 0.99, 1.46]) g.add(box(w - 0.06, 0.025, d - 0.02, woodL, 0, y, 0.01));
    // fileira de livros a partir de x0 na prateleira y (no máximo n)
    const books = (y, x0, x1, n) => {
      let x = x0, k = 0;
      while (x < x1 - 0.04 && k < n) {
        const bw = 0.035 + rnd() * 0.05, bh = 0.17 + rnd() * 0.1, bd = 0.18 + rnd() * 0.05;
        g.add(box(bw, bh, bd, bookMats[Math.floor(rnd() * bookMats.length)], x + bw / 2, y + 0.0125 + bh / 2, 0.01));
        x += bw + 0.004; k++;
      }
      return x;
    };
    g.add(box(0.3, 0.26, 0.26, petrol, -0.5, 0.1925, 0)); g.add(box(0.3, 0.26, 0.26, grey, -0.17, 0.1925, 0)); // caixas organizadoras
    books(0.05, 0.02, 0.62, 4);
    books(0.52, -0.62, 0.62, 8);
    const xe = books(0.99, -0.62, 0.05, 5);
    g.add(cyl(0.05, 0.04, 0.09, ceramic, xe + 0.12, 1.0475, 0, 10)); g.add(sph(0.08, M.leaf2, xe + 0.12, 1.15, 0)); // vasinho
    g.add(box(0.13, 0.16, 0.012, woodM, 0.45, 1.0825, -0.02));                        // porta-retrato
    const xt = books(1.46, -0.62, -0.2, 3);
    g.add(box(0.28, 0.05, 0.2, M.book[1], xt + 0.16, 1.4975, 0));                     // pilha deitada
    g.add(box(0.26, 0.04, 0.19, M.book[3], xt + 0.16, 1.5425, 0));
    g.add(cyl(0.05, 0.05, 0.16, M.dark, 0.25, 1.5525, 0, 12));                        // caixa de som
    g.add(cyl(0.04, 0.045, 0.02, M.dark, 0.52, 1.4825, 0, 10)); g.add(sph(0.075, M.blue, 0.52, 1.5775, 0)); // globo
    place(g, 3.83, 2.4, Math.PI / 2);
  }

  // ---- cama de solteiro 1,0 × 1,9 na parede direita, cabeceira sob a janela da frente
  {
    const g = G();
    g.add(box(0.9, 0.08, 1.8, woodM, 0, 0.04, 0));                                    // rodapé recuado
    g.add(box(1.0, 0.2, 1.9, woodL, 0, 0.18, 0));                                     // estrado
    g.add(box(0.94, 0.18, 1.84, M.mattress, 0, 0.37, 0));                             // colchão
    g.add(box(0.98, 0.09, 1.34, petrol, 0, 0.5, 0.28));                               // edredom
    for (const s of [-1, 1]) g.add(box(0.03, 0.2, 1.34, petrol, s * 0.49, 0.42, 0.28)); // caídas laterais
    g.add(box(0.98, 0.025, 0.2, linen, 0, 0.557, -0.29));                             // virada do lençol
    g.add(box(0.6, 0.1, 0.38, M.white, 0, 0.51, -0.68));                              // travesseiro
    const cush = box(0.34, 0.26, 0.04, petrolD, 0.14, 0.67, -0.86); cush.rotation.x = -0.35; g.add(cush); // almofada na cabeceira
    g.add(box(1.04, 0.85, 0.06, woodL, 0, 0.5, -0.98));                               // cabeceira
    g.add(box(0.9, 0.42, 0.03, petrolD, 0, 0.6, -0.945));                             // painel estofado
    place(g, 6.14, 3.1, Math.PI);
  }

  // ---- criado-mudo pequeno junto à cabeceira --------------------------------
  {
    const g = G();
    g.add(box(0.38, 0.48, 0.38, M.white, 0, 0.26, 0));
    g.add(box(0.4, 0.03, 0.4, woodL, 0, 0.515, 0));
    g.add(box(0.32, 0.16, 0.012, woodL, 0, 0.36, 0.19));                              // frente da gaveta
    g.add(box(0.1, 0.012, 0.01, M.chrome, 0, 0.36, 0.2));
    g.add(box(0.1, 0.05, 0.04, M.dark, -0.08, 0.555, 0.04));                          // despertador
    g.add(box(0.07, 0.008, 0.15, M.dark, 0.09, 0.534, 0));                            // celular
    place(g, 5.4, 3.9, Math.PI);
  }
  for (const s of [0, 1]) { const sl = box(0.1, 0.03, 0.26, grey, 5.42 + s * 0.12, 0.015, 3.2); sl.rotation.y = 0.15; add(sl); } // chinelos

  // ---- guarda-roupa 2 portas na parede direita (antes da TV) ----------------
  {
    const g = G();
    g.add(box(1.2, 1.94, 0.55, M.white, 0, 1.03, 0));
    g.add(box(1.16, 0.06, 0.5, woodM, 0, 0.03, -0.02));                              // rodapé
    g.add(box(1.22, 0.04, 0.57, woodL, 0, 2.02, 0));                                 // tampo
    g.add(box(0.008, 1.88, 0.012, woodM, 0, 1.03, 0.278));                           // frincha entre portas
    for (const s of [-1, 1]) g.add(cyl(0.008, 0.008, 0.3, M.chrome, s * 0.06, 1.05, 0.29, 6)); // puxadores
    place(g, 6.395, 0.85, -Math.PI / 2);
  }

  // ---- rack baixo sob a TV (x=6,8 · z 1,6–2,6), ao lado do pé da cama -------
  add(box(0.26, 0.4, 0.5, woodL, 6.57, 0.25, 1.86));
  add(box(0.2, 0.05, 0.28, M.dark, 6.57, 0.475, 1.86));                              // console de jogos

  // ---- persiana rolô meio abaixada na janela do fundo (sobre a mesa) --------
  add(box(1.32, 0.07, 0.07, M.white, 5.0, 2.2, 0.115));                              // cassete
  add(box(1.24, 0.62, 0.008, blind, 5.0, 1.86, 0.12, { cast: false }));              // tecido
  add(box(1.24, 0.02, 0.014, M.steel, 5.0, 1.545, 0.12));                            // barra inferior

  // ---- cortina azul-petróleo na janela da frente (sobre a cabeceira) --------
  const rod = cyl(0.012, 0.012, 1.34, M.chrome, 5.95, 2.3, 4.05, 8); rod.rotation.z = Math.PI / 2; add(rod);
  for (const s of [-1, 1]) {
    add(sph(0.025, M.chrome, 5.95 + s * 0.67, 2.3, 4.05));                           // ponteiras
    add(box(0.32, 1.32, 0.05, petrol, 5.95 + s * 0.5, 1.64, 4.06));                  // painéis abertos
  }

  // ---- quadros: poster sobre a mesa e quadro sobre a cama -------------------
  add(box(0.5, 0.7, 0.025, M.dark, 4.0, 1.72, 0.0875));
  add(box(0.45, 0.65, 0.006, petrol, 4.0, 1.72, 0.103, { cast: false }));
  add(box(0.025, 0.5, 0.7, M.dark, 6.7125, 1.55, 3.15));
  add(box(0.006, 0.45, 0.65, linen, 6.697, 1.55, 3.15, { cast: false }));
  const disc = cyl(0.14, 0.14, 0.004, petrol, 6.692, 1.55, 3.15, 24); disc.rotation.z = Math.PI / 2; add(disc);

  // ---- tapete entre a mesa e a cama ----------------------------------------
  add(box(1.3, 0.012, 1.0, rugMat, 4.95, 0.006, 2.55, { cast: false }));
  for (const s of [-1, 1]) add(box(1.3, 0.004, 0.05, petrol, 4.95, 0.014, 2.55 + s * 0.4, { cast: false }));

  // ---- planta de chão no canto esquerdo, ao lado da porta -------------------
  add(cyl(0.12, 0.09, 0.28, ceramic, 3.895, 0.14, 3.8, 14));
  add(cyl(0.11, 0.11, 0.02, M.soil, 3.895, 0.285, 3.8, 12));
  add(cyl(0.012, 0.018, 0.5, M.trunk, 3.895, 0.53, 3.8, 6));
  for (let i = 0; i < 4; i++) {
    const a = 0.8 + i * 1.57;
    const leaf = sph(0.13, i % 2 ? M.plant : M.leaf2, 3.895 + Math.cos(a) * 0.05, 0.72 + i * 0.05, 3.8 + Math.sin(a) * 0.05);
    leaf.scale.set(1.15, 0.45, 1); leaf.rotation.y = -a; add(leaf);
  }

  // ---- violão encostado na parede esquerda, entre a estante e a planta ------
  {
    const g = G();
    const b1 = cyl(0.19, 0.19, 0.09, spruce, 0, 0.19, 0, 24); b1.rotation.z = Math.PI / 2; g.add(b1);   // bojo inferior
    const b2 = cyl(0.15, 0.15, 0.09, spruce, 0, 0.45, 0, 24); b2.rotation.z = Math.PI / 2; g.add(b2);   // bojo superior
    const hole = cyl(0.045, 0.045, 0.006, M.dark, 0.047, 0.37, 0, 16); hole.rotation.z = Math.PI / 2; g.add(hole); // boca
    g.add(box(0.008, 0.03, 0.12, M.dark, 0.048, 0.2, 0));                             // cavalete
    g.add(box(0.03, 0.5, 0.05, woodM, 0.015, 0.86, 0));                               // braço
    g.add(box(0.006, 0.5, 0.045, M.dark, 0.033, 0.86, 0));                            // escala
    g.add(box(0.02, 0.16, 0.07, woodM, 0.02, 1.19, 0));                               // mão
    g.add(box(0.002, 0.95, 0.03, M.chrome, 0.052, 0.66, 0, { cast: false }));         // cordas
    const gt = place(g, 3.85, 3.36); gt.rotation.z = 0.12;                            // inclinado contra a parede
  }

  // ---- mochila encostada na parede do fundo, entre a mesa e o guarda-roupa --
  {
    const g = G();
    g.add(box(0.3, 0.42, 0.16, petrolD, 0, 0.21, 0));
    g.add(box(0.22, 0.16, 0.05, petrol, 0, 0.13, 0.1));                               // bolso frontal
    g.add(torus(0.04, 0.008, Math.PI, M.dark, 0, 0.42, -0.02));                        // alça de mão
    const bp = place(g, 5.55, 0.28); bp.rotation.x = -0.12;
  }
}

function roomSalaCozinha(ctx) {
  // ---------------------------------------------------------------------------
  // SALA / COZINHA (x 6,8–10,3) + BALCÃO (x 10,3–12,5) · z 0–4,2
  // Paleta: madeira média + branco / cinza quente; acento verde-oliva com um
  // toque de mostarda (almofadas, banquetas, jogo americano, faixa do azulejo).
  // Objetos do cartão (ar-condicionado, pendentes) NÃO são recriados.
  // ---------------------------------------------------------------------------
  const THREE = ctx.THREE, M = ctx.M, F = ctx.F;
  const box = (...a) => ctx.box(...a), cyl = (...a) => ctx.cyl(...a), sph = (...a) => ctx.sph(...a);
  const place = (...a) => ctx.place(...a), std = (o) => ctx.std(o), rnd = () => ctx.rnd();
  const put = (m) => { ctx.add(m); return m; };
  const G = () => new THREE.Group();
  const rot = (m, x = 0, y = 0, z = 0) => { m.rotation.set(x, y, z); return m; };
  const mesh = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };

  // Materiais locais
  const woodMed  = std({ color: 0x9a6b3c, roughness: 0.65 });
  const woodBack = std({ color: 0x9a6b3c, roughness: 0.65 }); woodBack.side = THREE.DoubleSide;
  const olive    = std({ color: 0x6b7040, roughness: 0.9 });
  const oliveLt  = std({ color: 0x8c905e, roughness: 0.9 });
  const mustard  = std({ color: 0xc9a24a, roughness: 0.9 });
  const linen    = std({ color: 0xb3ac9e, roughness: 0.95 });
  const drape    = std({ color: 0xe8e2d5, roughness: 1 });
  const sheer    = std({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.3 });
  const glassy   = std({ color: 0xa9bcc4, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.55 });
  const granite  = std({ color: 0x2e3934, roughness: 0.3, metalness: 0.05 });   // granito verde-ubatuba
  const tile     = std({ color: 0xf2f1ea, roughness: 0.45 });
  const ceramic  = std({ color: 0xf4f0e8, roughness: 0.5 });
  const wicker   = std({ color: 0xb9925a, roughness: 0.95 });
  const black    = std({ color: 0x161616, roughness: 0.5 });
  const paper    = std({ color: 0xfbfaf5, roughness: 0.9 });
  const fruit    = [std({ color: 0xe08a2e, roughness: 0.7 }), std({ color: 0x9ab84a, roughness: 0.7 }), std({ color: 0xb8392e, roughness: 0.7 }), std({ color: 0xe6c84a, roughness: 0.8 })];

  // ======================= BUILDERS (origem no centro da base) =======================
  // Rack de madeira 1,6 m: duas gavetas em cima, nicho aberto embaixo, pés torneados
  const rack = () => {
    const g = G();
    g.add(box(1.6, 0.42, 0.42, woodMed, 0, 0.33, 0));
    g.add(box(1.64, 0.03, 0.46, M.woodDark, 0, 0.555, 0));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.018, 0.024, 0.12, M.woodDark, sx * 0.74, 0.06, sz * 0.17, 8));
    for (const sx of [-1, 1]) {
      g.add(box(0.74, 0.16, 0.015, M.woodDark, sx * 0.39, 0.45, 0.215));
      g.add(box(0.14, 0.012, 0.02, M.chrome, sx * 0.39, 0.45, 0.23));
    }
    g.add(box(1.5, 0.17, 0.012, black, 0, 0.245, 0.215, { cast: false }));
    return g;
  };
  // TV 32" com pé central (tela para +z)
  const tv = () => {
    const g = G();
    g.add(box(0.3, 0.015, 0.16, black, 0, 0.0075, 0));
    g.add(box(0.06, 0.09, 0.03, black, 0, 0.055, 0));
    g.add(box(0.74, 0.44, 0.03, black, 0, 0.32, 0));
    g.add(box(0.7, 0.4, 0.006, M.screenOff, 0, 0.32, 0.018, { cast: false }));
    return g;
  };
  // Sofá 2 lugares em linho (encosto em -z), almofadas oliva + mostarda
  const sofa = () => {
    const g = G();
    g.add(box(1.3, 0.08, 0.7, M.woodDark, 0, 0.04, 0));
    g.add(box(1.4, 0.32, 0.82, linen, 0, 0.24, 0));
    g.add(box(1.4, 0.46, 0.2, linen, 0, 0.63, -0.31));
    for (const sx of [-1, 1]) {
      g.add(box(0.16, 0.24, 0.82, linen, sx * 0.62, 0.52, 0));
      g.add(box(0.5, 0.12, 0.56, linen, sx * 0.27, 0.46, 0.06));
      g.add(rot(box(0.5, 0.34, 0.12, linen, sx * 0.27, 0.66, -0.16), -0.15));
    }
    g.add(rot(box(0.38, 0.38, 0.1, olive, -0.36, 0.7, -0.1), -0.1, 0.25));
    g.add(rot(box(0.34, 0.34, 0.1, mustard, 0.38, 0.68, -0.1), -0.1, -0.2));
    return g;
  };
  // Cadeira de jantar: assento de madeira com almofada, pernas torneadas, encosto curvo (encosto em -z)
  const chair = () => {
    const g = G();
    g.add(box(0.44, 0.035, 0.44, woodMed, 0, 0.445, 0));
    g.add(box(0.4, 0.035, 0.4, M.cushion, 0, 0.48, 0.01));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.015, 0.022, 0.43, woodMed, sx * 0.19, 0.215, sz * 0.19, 8));
    g.add(mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.4, 14, 1, true, Math.PI - 0.62, 1.24), woodBack, 0, 0.665, 0.12));
    return g;
  };
  // Mesa oval 1,5 × 0,95 com saia e 4 pernas
  const table = () => {
    const g = G();
    const top = cyl(1, 1, 0.04, woodMed, 0, 0.76, 0, 40); top.scale.set(0.75, 1, 0.475); g.add(top);
    g.add(box(1.1, 0.07, 0.6, M.woodDark, 0, 0.705, 0));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.03, 0.022, 0.68, M.woodDark, sx * 0.5, 0.34, sz * 0.25, 10));
    return g;
  };
  // Jogo americano (6) + fruteira de cerâmica com frutas (posicionar a y = tampo)
  const tableTop = () => {
    const g = G();
    for (const sx of [-1, 1]) {
      g.add(box(0.26, 0.005, 0.36, olive, sx * 0.55, 0.0025, 0, { cast: false }));
      for (const sz of [-1, 1]) g.add(box(0.36, 0.005, 0.26, olive, sx * 0.22, 0.0025, sz * 0.27, { cast: false }));
    }
    g.add(cyl(0.14, 0.1, 0.06, ceramic, 0, 0.03, 0, 20));
    g.add(sph(0.04, fruit[0], -0.045, 0.075, 0.02)); g.add(sph(0.04, fruit[1], 0.05, 0.075, -0.03)); g.add(sph(0.038, fruit[2], 0.005, 0.11, 0));
    return g;
  };
  // Banqueta alta: assento oliva, 3 pernas de metal preto
  const stool = () => {
    const g = G();
    g.add(cyl(0.17, 0.17, 0.06, olive, 0, 0.7, 0, 20));
    for (let i = 0; i < 3; i++) { const a = (i * Math.PI * 2) / 3 + Math.PI / 6; g.add(cyl(0.013, 0.013, 0.67, black, Math.cos(a) * 0.11, 0.335, Math.sin(a) * 0.11, 6)); }
    return g;
  };
  // Geladeira inox duplex (frente em +z): rodapé, divisão do freezer, puxadores, ímãs e bilhete
  const fridge = () => {
    const g = G();
    g.add(box(0.72, 0.08, 0.66, black, 0, 0.04, 0));
    g.add(box(0.75, 1.77, 0.7, M.steel, 0, 0.965, 0));
    g.add(box(0.73, 0.012, 0.01, black, 0, 1.3, 0.352));
    g.add(box(0.025, 0.4, 0.03, M.chrome, -0.28, 1.56, 0.365));
    g.add(box(0.025, 0.7, 0.03, M.chrome, -0.28, 0.85, 0.365));
    g.add(box(0.09, 0.11, 0.004, paper, 0.02, 1.5, 0.353, { cast: false }));
    g.add(box(0.04, 0.05, 0.006, mustard, 0.02, 1.565, 0.357, { cast: false }));
    g.add(box(0.035, 0.035, 0.006, olive, 0.2, 1.46, 0.354, { cast: false }));
    return g;
  };
  // Planta alta em vaso de cerâmica (≈1,3 m)
  const plantTall = () => {
    const g = G();
    g.add(cyl(0.16, 0.12, 0.34, ceramic, 0, 0.17, 0, 14));
    g.add(cyl(0.15, 0.15, 0.02, M.soil, 0, 0.34, 0, 14));
    g.add(cyl(0.02, 0.03, 0.7, M.trunk, 0, 0.68, 0, 8));
    for (let i = 0; i < 4; i++) { const a = i * 1.7 + 0.4, r = 0.08 + (i % 2) * 0.08; g.add(sph(0.18 + (i % 2) * 0.04, i % 2 ? M.leaf2 : M.plant, Math.cos(a) * r, 0.95 + i * 0.13, Math.sin(a) * r)); }
    return g;
  };
  // Fogão 4 bocas com forno (frente em +z)
  const stove = () => {
    const g = G();
    g.add(box(0.5, 0.05, 0.5, black, 0, 0.025, 0));
    g.add(box(0.58, 0.81, 0.58, M.white, 0, 0.455, 0));
    g.add(box(0.6, 0.02, 0.6, black, 0, 0.87, 0));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.065, 0.065, 0.012, M.chrome, sx * 0.14, 0.886, sz * 0.14, 12));
    g.add(box(0.5, 0.34, 0.015, M.steel, 0, 0.35, 0.295));
    g.add(box(0.34, 0.13, 0.008, black, 0, 0.37, 0.306, { cast: false }));
    g.add(box(0.46, 0.02, 0.025, M.chrome, 0, 0.55, 0.31));
    g.add(box(0.5, 0.07, 0.01, M.steel, 0, 0.73, 0.295));
    for (let i = 0; i < 4; i++) g.add(rot(cyl(0.012, 0.012, 0.02, black, -0.18 + i * 0.12, 0.73, 0.305, 8), Math.PI / 2));
    return g;
  };
  // Quadro com moldura escura na parede do fundo (z = 0)
  const frame = (w, h, x, y, art) => {
    put(box(w, h, 0.03, M.woodDark, x, y, 0.09));
    put(box(w - 0.06, h - 0.06, 0.012, art, x, y, 0.108, { cast: false }));
  };

  // ======================= SALA (x 6,8–10,3) =======================
  // Rack com TV pequena e objetos, quadros acima (AC do cartão fica mais alto, y 2,2–2,5)
  place(rack(), 7.76, 0.31);
  place(tv(), 7.76, 0.31, 0, 0.57);
  put(cyl(0.05, 0.035, 0.22, oliveLt, 7.13, 0.68, 0.31, 12));                                   // vaso de cerâmica
  put(rot(cyl(0.004, 0.004, 0.4, M.trunk, 7.1, 0.96, 0.3, 5), 0.12, 0, 0.22));                  // ramos secos
  put(rot(cyl(0.004, 0.004, 0.36, M.trunk, 7.16, 0.94, 0.33, 5), -0.1, 0, -0.18));
  put(box(0.2, 0.03, 0.15, M.book[1], 8.36, 0.585, 0.31));                                        // livros
  put(rot(box(0.18, 0.03, 0.14, M.book[3], 8.36, 0.615, 0.31), 0, 0.15, 0));
  put(rot(box(0.12, 0.15, 0.01, M.woodDark, 8.36, 0.645, 0.2), -0.15, 0, 0));                    // porta-retrato
  frame(0.5, 0.4, 7.4, 1.55, oliveLt); frame(0.36, 0.46, 7.98, 1.6, mustard); frame(0.26, 0.26, 8.4, 1.5, linen);
  // Relógio de parede (parede esquerda, x = 6,8)
  put(rot(cyl(0.15, 0.15, 0.02, black, 6.886, 1.95, 1.2, 24), 0, 0, Math.PI / 2));
  put(rot(cyl(0.135, 0.135, 0.012, paper, 6.902, 1.95, 1.2, 24), 0, 0, Math.PI / 2));
  put(box(0.01, 0.1, 0.006, black, 6.911, 2.0, 1.2, { cast: false }));
  put(rot(box(0.01, 0.07, 0.006, black, 6.911, 1.969, 1.229, { cast: false }), 1.0, 0, 0));
  // Geladeira no canto junto da meia-parede + planta alta entre rack e geladeira
  place(fridge(), 9.8, 0.45);
  place(plantTall(), 9.0, 0.42);
  // Sofá 2 lugares virado para a TV (costas para a mesa de jantar)
  place(sofa(), 7.68, 1.75, Math.PI);
  // Sala de jantar: tapete de juta, mesa oval, 6 cadeiras, jogo americano + fruteira
  place(F.rug(1.6, 1.4, 0xc2ad86), 9.2, 2.98);
  place(table(), 9.08, 3.0);
  place(tableTop(), 9.08, 3.0, 0, 0.78);
  for (const [cx, cz, ry] of [[8.1, 3.0, Math.PI / 2], [10.06, 3.0, -Math.PI / 2], [8.74, 2.28, 0], [9.42, 2.28, 0], [8.74, 3.72, Math.PI], [9.42, 3.72, Math.PI]]) {
    place(chair(), cx, cz, ry + (rnd() - 0.5) * 0.12);
  }
  // Balcão americano: bancada de madeira na meia-parede (lado da sala) com 2 banquetas
  put(box(0.34, 0.035, 1.25, woodMed, 10.055, 1.0, 1.55));
  for (const z of [1.05, 2.05]) put(rot(box(0.37, 0.03, 0.03, black, 10.055, 0.88, z), 0, 0, -0.552));   // mãos-francesas
  place(stool(), 9.98, 1.24, rnd() * 0.5); place(stool(), 9.98, 1.86, rnd() * 0.5);
  // Cortina no vidro da varanda (x 9,6–12,2): varão, voil e painéis de linho recolhidos nas laterais
  put(rot(cyl(0.012, 0.012, 2.8, black, 10.9, 2.4, 4.0, 8), 0, 0, Math.PI / 2));
  put(box(2.5, 2.3, 0.01, sheer, 10.9, 1.19, 4.075, { cast: false, receive: false }));
  for (const x0 of [9.66, 11.78]) {
    put(box(0.2, 2.34, 0.06, drape, x0 + 0.1, 1.21, 4.015, { cast: false }));
    put(box(0.18, 2.34, 0.09, drape, x0 + 0.3, 1.21, 4.015, { cast: false }));
  }

  // ======================= BALCÃO / COZINHA (x 10,3–12,5) =======================
  // Fogão no canto esquerdo do fundo (fora da janela x 11–12), panelas, pano de prato, coifa com duto
  place(stove(), 10.73, 0.39);
  put(cyl(0.1, 0.09, 0.1, M.steel, 10.59, 0.94, 0.25, 16));                                     // panela com tampa
  put(cyl(0.105, 0.105, 0.012, M.steel, 10.59, 0.996, 0.25, 16));
  put(sph(0.014, black, 10.59, 1.01, 0.25));
  put(cyl(0.11, 0.1, 0.035, black, 10.87, 0.91, 0.53, 16));                                      // frigideira
  put(box(0.025, 0.014, 0.18, black, 10.87, 0.92, 0.73));
  put(box(0.14, 0.2, 0.012, olive, 10.82, 0.45, 0.719, { cast: false }));                        // pano de prato no puxador
  put(box(0.6, 0.06, 0.48, M.steel, 10.73, 1.65, 0.35));                                         // coifa
  put(box(0.26, 1.1, 0.26, M.steel, 10.73, 2.23, 0.24));
  // Armários baixos brancos em L com tampo de granito e rodapé preto
  put(box(1.395, 0.8, 0.56, M.white, 11.7275, 0.46, 0.365));                                     // fundo (sob a janela)
  put(box(1.395, 0.06, 0.5, black, 11.7275, 0.03, 0.335, { cast: false }));
  put(box(1.395, 0.04, 0.62, granite, 11.7275, 0.88, 0.385));
  put(box(0.006, 0.7, 0.012, black, 11.725, 0.46, 0.65, { cast: false }));
  for (const x of [11.38, 12.07]) put(box(0.12, 0.012, 0.024, M.chrome, x, 0.78, 0.657));
  put(box(0.56, 0.8, 2.5, M.white, 12.145, 0.46, 1.95));                                         // parede direita (2,5 m)
  put(box(0.5, 0.06, 2.5, black, 12.175, 0.03, 1.95, { cast: false }));
  put(box(0.62, 0.04, 2.505, granite, 12.115, 0.88, 1.9475));
  for (let i = 1; i < 4; i++) put(box(0.012, 0.7, 0.006, black, 11.86, 0.46, 0.7 + i * 0.625, { cast: false }));
  for (let i = 0; i < 4; i++) put(box(0.024, 0.012, 0.12, M.chrome, 11.853, 0.78, 1.0125 + i * 0.625));
  // Azulejo (faixa de 55 cm) atrás das bancadas + filete decorativo oliva
  const bandX = (w, h, x, y, mat) => put(box(w, h, 0.012, mat, x, y, 0.081, { cast: false }));        // na parede do fundo (z = 0)
  const bandZ = (l, h, z, y, mat) => put(box(0.012, h, l, mat, 12.419, y, z, { cast: false }));      // na parede direita (x = 12,5)
  bandX(0.595, 0.55, 10.6725, 1.175, tile); bandX(0.595, 0.05, 10.6725, 1.475, olive);              // atrás do fogão
  bandX(0.395, 0.55, 12.2275, 1.175, tile); bandX(0.395, 0.05, 12.2275, 1.475, olive);              // à direita da janela
  bandX(1.06, 0.08, 11.5, 0.94, tile);                                                               // filete sob o peitoril
  bandZ(3.175, 0.55, 1.6625, 1.175, tile); bandZ(3.175, 0.05, 1.6625, 1.475, olive);
  // Armários superiores (2,4 m, 4 portas) na parede direita, acima da pia
  put(box(0.35, 0.7, 2.4, M.white, 12.25, 1.9, 1.7));
  for (const z of [1.1, 1.7, 2.3]) put(box(0.006, 0.62, 0.006, black, 12.072, 1.9, z, { cast: false }));
  for (const z of [0.8, 1.4, 2.0, 2.6]) put(box(0.024, 0.1, 0.012, M.chrome, 12.065, 1.66, z));
  // Pia inox com torneira, detergente e esponja
  put(box(0.46, 0.014, 0.52, M.steel, 12.13, 0.907, 1.65));
  put(box(0.4, 0.01, 0.46, black, 12.13, 0.912, 1.65, { cast: false }));
  put(cyl(0.012, 0.012, 0.24, M.chrome, 12.38, 1.02, 1.65, 8));
  put(box(0.17, 0.02, 0.02, M.chrome, 12.295, 1.14, 1.65));
  put(cyl(0.02, 0.024, 0.15, oliveLt, 12.37, 0.975, 1.42, 8));
  put(box(0.06, 0.025, 0.04, mustard, 12.36, 0.912, 1.88));
  // Escorredor de louça: 3 pratos em pé + 2 canecas
  put(box(0.36, 0.02, 0.4, M.steel, 12.14, 0.91, 2.25));
  for (let i = 0; i < 3; i++) put(rot(cyl(0.1, 0.1, 0.008, ceramic, 12.14, 1.02, 2.13 + i * 0.07, 16), Math.PI / 2));
  for (const x of [12.06, 12.2]) put(cyl(0.035, 0.03, 0.08, ceramic, x, 0.96, 2.4, 10));
  // Micro-ondas inox no canto (porta virada para a cozinha)
  put(box(0.35, 0.3, 0.5, M.steel, 12.235, 1.05, 1.0));
  put(box(0.008, 0.24, 0.32, black, 12.056, 1.05, 0.92, { cast: false }));
  put(box(0.008, 0.24, 0.1, M.white, 12.056, 1.05, 1.15, { cast: false }));
  // Cafeteira e liquidificador na bancada do fundo
  put(box(0.14, 0.3, 0.09, black, 11.25, 1.05, 0.445));
  put(box(0.14, 0.11, 0.22, black, 11.25, 1.145, 0.5));
  put(cyl(0.05, 0.045, 0.14, glassy, 11.25, 0.97, 0.55, 12));
  put(box(0.13, 0.13, 0.13, black, 11.65, 0.965, 0.5));
  put(cyl(0.06, 0.045, 0.2, glassy, 11.65, 1.13, 0.5, 10));
  put(cyl(0.062, 0.062, 0.02, black, 11.65, 1.24, 0.5, 10));
  // Cesto de frutas (vime) no canto da bancada
  put(cyl(0.14, 0.11, 0.09, wicker, 12.16, 0.945, 0.4, 12));
  put(sph(0.04, fruit[1], 12.12, 1.0, 0.37)); put(sph(0.04, fruit[0], 12.2, 1.0, 0.43)); put(sph(0.038, fruit[3], 12.15, 1.035, 0.44));
  // Temperos em vasinhos de barro em frente à janela (x 11–12)
  put(cyl(0.045, 0.035, 0.09, M.pot, 11.2, 0.945, 0.23, 10)); put(sph(0.065, M.plant, 11.2, 1.04, 0.23));
  put(cyl(0.045, 0.035, 0.09, M.pot, 11.5, 0.945, 0.23, 10)); put(cyl(0.0, 0.05, 0.14, M.leaf2, 11.5, 1.06, 0.23, 8));
  put(cyl(0.045, 0.035, 0.09, M.pot, 11.8, 0.945, 0.23, 10)); put(sph(0.06, M.leaf2, 11.8, 1.03, 0.23));
  // Tábua de corte, rolo de papel-toalha, lixeira inox, tapete de cozinha
  put(box(0.3, 0.015, 0.2, M.woodLite, 12.16, 0.9075, 2.85));
  put(cyl(0.055, 0.055, 0.24, paper, 12.3, 1.02, 3.1, 12));
  put(cyl(0.13, 0.12, 0.5, M.steel, 12.15, 0.25, 3.55, 14));
  put(cyl(0.135, 0.135, 0.03, black, 12.15, 0.515, 3.55, 14));
  place(F.rug(0.55, 1.6, 0x7f8256), 11.42, 1.9);
  // Prateleira de temperos na meia-parede (lado da cozinha)
  put(box(0.16, 0.02, 0.6, woodMed, 10.455, 1.5, 1.3));
  for (const z of [1.1, 1.3, 1.5]) put(cyl(0.035, 0.035, 0.1, glassy, 10.46, 1.56, z, 8));
}

function roomVarandaPiscina(ctx) {
  // VARANDA coberta — x 0–12,5 · z 4,2–6,2 (faces internas: x 0,075/12,425 · z 4,275/6,125).
  //   Parede da casa (z=4,2): porta casal x 1,0–1,9 · janela x 2,5–3,3 · porta quarto x 4,1–5,0 · janela x 5,5–6,4 ·
  //   porta sala x 7,4–8,3 · vidro do balcão x 9,6–12,2. Parede externa (z=6,2): porta p/ deck x 2,9–3,8 ·
  //   janela x 4,6–6,6 · vidro x 8,0–12,0. Pendentes em (2,1/6,3/10,4 · 2,5 · 5,2) — objetos do cartão.
  // DECK — x 2,9–10,9 · z 7,2–12,4; borda de pedra da piscina x 3,6–10,2 · z 7,9–11,7 (meia-lua centro 8,3/9,8 r 1,9).
  // Faixas de grama: z 6,2–7,2 (entre varanda e deck) e x 2,4–2,9 (à esquerda do deck).
  // Layout: toda a mobília da varanda encostada na parede da casa, corredor livre ≥ 1 m ao longo de z ≈ 5,2
  //   (de x 0 até 10,7); rede no canto esquerdo (junto à parede externa cega x 0–2,9); sofá centrado na janela
  //   x 4,6–6,6; churrasqueira + cervejeira entre a porta da sala e o vidro do balcão; mesa de madeira com bancos
  //   no fundo direito (x > 10,7, sem passagem necessária). Deck: escadas nas posições originais, espreguiçadeiras na
  //   faixa sul, mesa redonda + 4 cadeiras no canto NE, guarda-sol + cadeiras de piscina no canto SE, ducha e
  //   tochas na faixa oeste, boias na água.
  const { THREE, M, box, cyl, sph, place, add, std, rnd } = ctx;
  const G = () => new THREE.Group();
  const put = (m, x, y, z, rx = 0, ry = 0, rz = 0) => { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); return m; };
  // cilindro entre dois pontos (a → b), raio ra em a e rb em b
  const rod = (mat, ra, rb, ax, ay, az, bx, by, bz, seg = 8) => {
    const dir = new THREE.Vector3(bx - ax, by - ay, bz - az), len = dir.length();
    const m = cyl(rb, ra, len, mat, (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, seg);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
  };
  // cone/folha inclinado: base em (x,y,z), inclinação `tilt` da vertical, apontando para o azimute `a`
  const leaf = (mat, r, len, x, y, z, tilt, a, flat = 0.3, seg = 5) => {
    const m = cyl(0, r, len, mat, 0, 0, 0, seg);
    m.scale.z = flat; m.rotation.order = 'YXZ'; m.rotation.set(tilt, a, 0);
    m.position.set(x + Math.sin(a) * Math.sin(tilt) * len / 2, y + Math.cos(tilt) * len / 2, z + Math.cos(a) * Math.sin(tilt) * len / 2);
    return m;
  };

  // ---------------- paleta: azul-marinho + branco + madeira natural ----------------
  const navy    = std({ color: 0x1f3a5f, roughness: 0.85 });
  const fibra   = std({ color: 0x223247, roughness: 0.95 });          // fibra sintética trançada (marinho)
  const linen   = std({ color: 0xf4f1ea, roughness: 0.95 });          // tecido/almofadas
  const teak    = std({ color: 0x9a6b3c, roughness: 0.65 });          // madeira natural (teca)
  const bamboo  = std({ color: 0xc8a86b, roughness: 0.8 });
  const plaster = std({ color: 0xf1ece2, roughness: 0.95 });          // alvenaria rebocada
  const brick   = std({ color: 0x9c5a3c, roughness: 0.95 });          // tijolo refratário
  const granite = std({ color: 0x2e2f33, roughness: 0.35, metalness: 0.1 });
  const ceramic = std({ color: 0xe8e4dc, roughness: 0.5 });           // vasos brancos
  const stone   = std({ color: 0xd8d0be, roughness: 0.95 });          // pisantes de concreto
  const coir    = std({ color: 0x8a6d3b, roughness: 1 });             // capacho
  const agave   = std({ color: 0x6f8f6a, roughness: 0.9 });
  const green   = std({ color: 0x2f6f3e, roughness: 0.3 });           // garrafas
  const amber   = std({ color: 0x8a4b12, roughness: 0.3 });
  const lime    = std({ color: 0xc9e36b, roughness: 0.2, transparent: true, opacity: 0.75 });
  const ember   = std({ color: 0xff6a1a, emissive: 0xff4500, emissiveIntensity: 1.3 });
  const flame   = std({ color: 0xffb347, emissive: 0xff8a1a, emissiveIntensity: 1.8 });
  const lampOn  = std({ color: 0xfff3d6, emissive: 0xffd08a, emissiveIntensity: 1.0 });
  const ledCool = std({ color: 0xeaf6ff, emissive: 0xcfe9ff, emissiveIntensity: 1.2 });
  const canopy  = new THREE.MeshStandardMaterial({ color: 0x1f3a5f, roughness: 0.9, side: THREE.DoubleSide });
  const canopyW = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.9, side: THREE.DoubleSide });

  // =====================================================================================
  // VARANDA
  // =====================================================================================

  // ---- canto esquerdo (x 0–1): palmeira em vaso branco grande ----
  {
    const g = G();
    g.add(cyl(0.27, 0.2, 0.55, ceramic, 0, 0.275, 0, 16));
    g.add(cyl(0.24, 0.24, 0.02, M.soil, 0, 0.56, 0, 12));
    g.add(cyl(0.035, 0.05, 0.5, M.trunk, 0, 0.8, 0, 8));
    for (let i = 0; i < 5; i++) {
      // frondes apontando para longe da porta do casal (evita o vão x 1,0–1,9)
      const a = -1.2 + (i / 4) * 2.4 + (rnd() - 0.5) * 0.3, tilt = 0.55 + rnd() * 0.3, len = 0.85 + rnd() * 0.2;
      g.add(leaf(i % 2 ? M.plant : M.leaf2, 0.13, len, 0, 1.05, 0, tilt, a));
    }
    place(g, 0.5, 4.66);
  }

  // ---- rede (hammock) armada entre gancho na parede x=0 e coluna de madeira, ao longo da parede externa ----
  {
    const zc = 5.72, x0 = 0.62, x1 = 2.2, yEnd = 1.42, sag = 0.62;
    // corpo: malha listrada marinho/branco (cores por vértice), catenária com bordas erguidas
    const NU = 18, stripes = 7, pos = [], col = [], uv = [], idx = [];
    const cNavy = new THREE.Color(0x24406a), cWhite = new THREE.Color(0xf2efe6);
    let vi = 0;
    for (let j = 0; j < stripes; j++) {
      const c = j % 2 ? cWhite : cNavy;
      for (const v of [-1 + (2 * j) / stripes, -1 + (2 * (j + 1)) / stripes]) {
        for (let i = 0; i <= NU; i++) {
          const u = i / NU, s = Math.sin(Math.PI * u), hw = 0.06 + 0.26 * s;
          pos.push(x0 + u * (x1 - x0), yEnd - sag * s + 0.16 * v * v * s, zc + v * hw);
          col.push(c.r, c.g, c.b); uv.push(u, (v + 1) / 2);
        }
      }
      const a = vi, b = vi + NU + 1;
      for (let i = 0; i < NU; i++) idx.push(a + i, b + i, a + i + 1, b + i, b + i + 1, a + i + 1);
      vi += 2 * (NU + 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const body = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }));
    body.castShadow = true; body.receiveShadow = true; body.userData.keep = true; add(body);
    // punhos (leque de cordas) até os ganchos
    add(rod(linen, 0.05, 0.012, x0, yEnd, zc, 0.1, 1.9, zc));
    add(rod(linen, 0.05, 0.012, x1, yEnd, zc, 2.64, 1.9, zc));
    add(box(0.02, 0.1, 0.1, M.chrome, 0.085, 1.9, zc));                    // chapa do gancho na parede x=0
    add(box(0.14, 2.8, 0.14, M.woodDark, 2.72, 1.4, zc));                   // coluna de madeira da cobertura
    add(sph(0.022, M.chrome, 2.64, 1.9, zc));                              // gancho na coluna
    add(box(0.42, 0.1, 0.26, navy, (x0 + x1) / 2, yEnd - sag + 0.06, zc)); // almofada
  }

  // ---- capacho na porta para o deck (x 2,9–3,8) + vaso entre a janela e a porta do quarto ----
  add(box(0.72, 0.015, 0.45, coir, 3.35, 0.02, 5.88, { cast: false }));
  place(ctx.F.plant(0.9, 5), 3.66, 4.6);

  // ---- sofá de fibra marinho com almofadas de linho, centrado na janela da varanda (x 4,6–6,6) ----
  {
    const g = G(), w = 1.9, d = 0.75;
    g.add(box(w - 0.1, 0.08, d - 0.1, M.dark, 0, 0.04, 0));                // base/pés
    g.add(box(w, 0.3, d, fibra, 0, 0.23, 0));
    g.add(box(0.14, 0.55, d, fibra, -w / 2 + 0.07, 0.355, 0)); g.add(box(0.14, 0.55, d, fibra, w / 2 - 0.07, 0.355, 0));
    g.add(box(w - 0.28, 0.45, 0.14, fibra, 0, 0.605, -d / 2 + 0.07));
    const cw = (w - 0.28) / 3;
    for (let i = 0; i < 3; i++) {
      const cx = -w / 2 + 0.14 + cw * (i + 0.5);
      g.add(box(cw - 0.04, 0.12, d - 0.3, linen, cx, 0.44, 0.06));
      g.add(put(box(cw - 0.06, 0.34, 0.1, linen, 0, 0, 0), cx, 0.65, -d / 2 + 0.2, -0.14));
    }
    g.add(put(box(0.38, 0.38, 0.1, navy, 0, 0, 0), -w / 2 + 0.4, 0.68, -d / 2 + 0.28, -0.2, 0, 0.35));
    g.add(put(box(0.38, 0.38, 0.1, M.white, 0, 0, 0), w / 2 - 0.4, 0.68, -d / 2 + 0.28, -0.2, 0, -0.3));
    place(g, 6.3, 4.73);   // z 4,355–5,105 → corredor 5,105–6,125 (1,02 m)
  }

  // ---- churrasqueira de alvenaria com coifa e chaminé (x 8,42–9,58, entre a porta da sala e o vidro do balcão) ----
  {
    const g = G(), w = 1.16, d = 0.62;
    g.add(box(w, 0.86, d - 0.02, plaster, 0, 0.43, -0.01));                      // corpo rebocado
    g.add(box(0.5, 0.42, 0.03, M.dark, -0.27, 0.3, d / 2 - 0.015));                // nicho da lenha
    for (const [lx, ly] of [[-0.36, 0.15], [-0.18, 0.15]]) g.add(put(cyl(0.06, 0.06, 0.5, M.trunk, 0, 0, 0, 8), lx, ly, d / 2 - 0.2, Math.PI / 2));
    g.add(box(0.46, 0.6, 0.03, M.woodDark, 0.3, 0.4, d / 2 - 0.005));              // porta do armário
    g.add(cyl(0.01, 0.01, 0.12, M.chrome, 0.48, 0.42, d / 2 + 0.015, 6));          // puxador
    g.add(box(w + 0.02, 0.05, d + 0.04, granite, 0, 0.885, 0));                     // bancada de granito
    g.add(box(w - 0.3, 0.05, d - 0.16, ember, 0, 0.935, 0.02));                     // brasas
    g.add(box(0.14, 0.87, d, brick, -w / 2 + 0.07, 1.345, 0));                      // laterais de tijolo (y 0,91–1,78)
    g.add(box(0.14, 0.87, d, brick, w / 2 - 0.07, 1.345, 0));
    g.add(box(w - 0.28, 0.5, 0.1, brick, 0, 1.16, -d / 2 + 0.06));                  // fundo do fogo
    g.add(box(w - 0.28, 0.012, d - 0.18, M.steel, 0, 1.08, 0.02));                  // grelha
    g.add(box(w - 0.28, 0.37, 0.36, plaster, 0, 1.595, -d / 2 + 0.18));             // coifa (bloco junto à parede)
    g.add(put(box(w - 0.28, 0.45, 0.03, plaster, 0, 0, 0), 0, 1.595, 0.18, -0.613)); // frente inclinada da coifa
    g.add(box(0.4, 1.12, 0.34, plaster, 0, 2.34, -d / 2 + 0.18));                   // chaminé (y 1,78–2,90)
    g.add(box(0.52, 0.05, 0.46, granite, 0, 2.925, -d / 2 + 0.18));                 // tampa
    for (const sx of [-0.2, 0.15]) g.add(put(cyl(0.006, 0.006, 0.8, M.chrome, 0, 0, 0, 6), sx, 1.1, 0.02, Math.PI / 2)); // espetos
    g.add(box(0.1, 0.06, 0.2, M.red, -0.2, 1.12, -0.02));                            // carne no espeto
    place(g, 9.0, 4.595);   // fundo a 0,01 m da parede
  }

  // ---- cervejeira (geladeira de bebidas com porta de vidro) + caixinha de som ----
  {
    const g = G();
    g.add(box(0.56, 0.86, 0.5, M.dark, 0, 0.43, -0.03));
    g.add(box(0.56, 0.08, 0.1, M.dark, 0, 0.04, 0.24));                              // rodapé/piso interno
    g.add(box(0.5, 0.02, 0.07, ledCool, 0, 0.82, 0.255, { cast: false }));           // LED interno
    g.add(box(0.48, 0.015, 0.07, M.white, 0, 0.45, 0.255));                          // prateleira
    for (let i = 0; i < 2; i++) g.add(cyl(0.028, 0.028, 0.23, i ? amber : green, -0.1 + i * 0.2, 0.575, 0.255, 8));
    for (let i = 0; i < 2; i++) g.add(cyl(0.028, 0.028, 0.23, i ? green : amber, -0.08 + i * 0.16, 0.205, 0.255, 8));
    g.add(box(0.54, 0.78, 0.02, M.glass, 0, 0.47, 0.3, { cast: false, receive: false })); // porta de vidro
    g.add(cyl(0.01, 0.01, 0.5, M.chrome, 0.23, 0.5, 0.33, 6));                        // puxador
    g.add(box(0.16, 0.06, 0.07, navy, -0.1, 0.89, -0.05));                            // caixinha de som
    place(g, 9.98, 4.64);
  }

  // ---- mesa de madeira maciça com dois bancos (meio encaixados), no fundo direito: x 10,72–12,32 ----
  {
    const tx = 11.52, tz = 5.21;
    add(box(1.6, 0.05, 0.66, teak, tx, 0.755, tz));
    for (const dx of [-0.62, 0.62]) add(box(0.08, 0.71, 0.5, M.woodDark, tx + dx, 0.365, tz));
    add(box(1.2, 0.08, 0.08, M.woodDark, tx, 0.24, tz));
    for (const bz of [4.56, 5.86]) {
      add(box(1.4, 0.05, 0.3, teak, tx, 0.455, bz));
      for (const dx of [-0.55, 0.55]) add(box(0.06, 0.43, 0.24, M.woodDark, tx + dx, 0.215, bz));
    }
    add(cyl(0.16, 0.1, 0.09, M.white, tx, 0.825, tz, 16));                            // fruteira
    add(sph(0.05, M.red, tx - 0.05, 0.9, tz - 0.03)); add(sph(0.05, M.leaf2, tx + 0.06, 0.9, tz + 0.03));
    add(cyl(0.012, 0.035, 0.32, green, tx - 0.37, 0.94, tz - 0.16, 10));              // garrafa
    add(cyl(0.032, 0.026, 0.11, M.glass, tx + 0.33, 0.835, tz - 0.16, 10));
    add(cyl(0.032, 0.026, 0.11, M.glass, tx + 0.38, 0.835, tz + 0.17, 10));
  }

  // =====================================================================================
  // FAIXA DE GRAMA entre a varanda e o deck (z 6,2–7,2) e à esquerda do deck (x 2,4–2,9)
  // =====================================================================================
  for (const z of [6.5, 6.92]) add(box(0.55, 0.03, 0.4, stone, 3.35, 0.015, z));     // pisantes da porta ao deck
  for (const x of [5.9, 9.3]) {                                                        // balizadores de jardim
    add(cyl(0.04, 0.04, 0.5, M.dark, x, 0.25, 6.7, 10));
    add(cyl(0.055, 0.055, 0.1, lampOn, x, 0.55, 6.7, 10));
  }
  for (const [x, z] of [[4.6, 6.72], [7.5, 6.72], [2.68, 8.6]]) {      // arbustos baixos
    const s = sph(0.26 + rnd() * 0.06, rnd() < 0.5 ? M.plant : M.leaf2, x, 0.2, z); s.scale.y = 0.75; add(s);
  }

  // =====================================================================================
  // DECK DA PISCINA
  // =====================================================================================
  const POOL = ctx.POOL || { x0: 3.9, x1: 8.3, zc: 9.8, r: 1.6 };

  // ---- escadas de inox (corrimão curvo + 3 degraus) nas posições originais ----
  const ladder = () => {
    const g = G();
    for (const x of [-0.2, 0.2]) {
      g.add(cyl(0.02, 0.02, 1.5, M.chrome, x, 0.25, 0, 8));
      const bend = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.02, 8, 12, Math.PI / 2), M.chrome);
      bend.position.set(x, 1.0, -0.25); bend.rotation.set(0, Math.PI / 2, Math.PI / 2); bend.castShadow = true; g.add(bend);
    }
    for (const y of [-0.35, -0.05, 0.25]) g.add(box(0.4, 0.025, 0.06, M.chrome, 0, y, 0));
    return g;
  };

  // ---- espreguiçadeiras brancas com toalhas listradas, faixa sul do deck (z 11,7–12,4), viradas uma p/ outra ----
  const lounger = (fabric, towelA, towelB) => {
    const g = G();
    g.add(box(0.62, 0.04, 1.9, M.white, 0, 0.33, 0));
    for (const z of [-0.78, 0.78]) g.add(box(0.62, 0.3, 0.04, M.white, 0, 0.16, z));
    g.add(box(0.56, 0.07, 1.15, fabric, 0, 0.385, 0.33));
    g.add(put(box(0.56, 0.07, 0.72, fabric, 0, 0, 0), 0, 0.6, -0.6, 0.72));         // encosto reclinado (topo em -z)
    g.add(box(0.5, 0.02, 1.05, towelA, 0, 0.43, 0.3));                               // toalha estendida
    g.add(box(0.5, 0.024, 0.16, towelB, 0, 0.43, 0.55));                             // listra
    return g;
  };
  place(lounger(navy, M.white, navy), 4.75, 12.05, Math.PI / 2);
  place(lounger(navy, navy, M.white), 7.3, 12.05, -Math.PI / 2);
  // mesinha entre as espreguiçadeiras: toalha enrolada + protetor solar
  add(cyl(0.22, 0.22, 0.03, teak, 6.03, 0.45, 12.05, 20)); add(cyl(0.03, 0.03, 0.42, M.white, 6.03, 0.225, 12.05, 8)); add(cyl(0.16, 0.18, 0.02, M.white, 6.03, 0.01, 12.05, 16));
  add(put(cyl(0.06, 0.06, 0.28, navy, 0, 0, 0, 12), 6.03, 0.525, 12.0, 0, 0, Math.PI / 2));
  add(cyl(0.025, 0.025, 0.14, M.white, 6.14, 0.535, 12.15, 8));

  // ---- canto SE: guarda-sol marinho/branco com mesinha no mastro, 2 caipirinhas, 2 cadeiras de piscina, cooler ----
  {
    const x = 10.05, z = 12.05;
    add(cyl(0.3, 0.32, 0.05, M.dark, x, 0.025, z, 20));                               // base
    add(cyl(0.022, 0.022, 2.4, M.dark, x, 1.2, z, 8));                                // mastro
    const c = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.34, 12, 1, true), canopy); c.position.set(x, 2.28, z); c.castShadow = true; add(c);
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.14, 12, 1, true), canopyW); c2.position.set(x, 2.5, z); c2.castShadow = true; add(c2);
    add(sph(0.03, M.chrome, x, 2.6, z));
    add(cyl(0.32, 0.32, 0.03, teak, x, 0.55, z, 20));                                 // mesinha no mastro
    add(cyl(0.032, 0.032, 0.12, lime, x - 0.15, 0.625, z + 0.08, 10));
    add(cyl(0.032, 0.032, 0.12, lime, x + 0.17, 0.625, z - 0.06, 10));
    const poolChair = () => {                                                           // cadeira de piscina (tela marinho, tubo branco)
      const g = G();
      g.add(put(box(0.5, 0.03, 0.5, navy, 0, 0, 0), 0, 0.3, 0, -0.2));
      g.add(put(box(0.5, 0.03, 0.62, navy, 0, 0, 0), 0, 0.55, -0.3, 1.2));
      for (const sx of [-0.24, 0.24]) {
        g.add(rod(M.white, 0.012, 0.012, sx, 0, 0.24, sx, 0.32, 0.22));
        g.add(rod(M.white, 0.012, 0.012, sx, 0, -0.3, sx, 0.86, -0.42));
      }
      return g;
    };
    place(poolChair(), 9.4, 12.0, Math.PI);   // viradas para a piscina (-z)
    place(poolChair(), 10.65, 12.0, Math.PI);
    add(box(0.5, 0.4, 0.36, navy, 8.65, 0.2, 12.15)); add(box(0.52, 0.06, 0.38, M.white, 8.65, 0.43, 12.15)); // cooler
  }

  // ---- canto NE: mesa redonda de teca com 4 cadeiras de fibra (cubo) + lanterna ----
  {
    const tx = 9.95, tz = 7.75;
    add(cyl(0.5, 0.5, 0.04, teak, tx, 0.74, tz, 28)); add(cyl(0.05, 0.05, 0.7, M.dark, tx, 0.36, tz, 10)); add(cyl(0.3, 0.32, 0.03, M.dark, tx, 0.015, tz, 20));
    add(box(0.12, 0.18, 0.12, M.glass, tx, 0.85, tz, { cast: false })); add(box(0.13, 0.02, 0.13, M.dark, tx, 0.95, tz)); add(sph(0.035, lampOn, tx, 0.8, tz)); // lanterna com vela
    const fibraChair = () => {
      const g = G();
      g.add(box(0.5, 0.38, 0.5, fibra, 0, 0.19, 0));
      g.add(box(0.46, 0.08, 0.46, linen, 0, 0.42, 0.02));
      g.add(box(0.5, 0.42, 0.08, fibra, 0, 0.59, -0.21));
      return g;
    };
    for (const [cx, cz, ry] of [[tx, tz - 0.75, 0], [tx, tz + 0.75, Math.PI], [tx - 0.75, tz, Math.PI / 2], [tx + 0.75, tz, -Math.PI / 2]]) place(fibraChair(), cx, cz, ry);
  }

  // ---- faixa oeste: ducha de piscina (chuveirão) sobre estrado de madeira, vaso grande, tocha ----
  {
    const x = 3.14, z = 9.55;
    add(box(0.6, 0.05, 0.6, teak, 3.28, 0.025, z));                                   // estrado
    add(cyl(0.025, 0.025, 2.2, M.chrome, x, 1.1, z, 10));                             // coluna
    add(box(0.3, 0.02, 0.02, M.chrome, x + 0.15, 2.15, z));                           // braço
    add(cyl(0.1, 0.1, 0.02, M.chrome, x + 0.28, 2.13, z, 16));                        // crivo
    add(put(cyl(0.03, 0.03, 0.04, M.chrome, 0, 0, 0, 10), x + 0.05, 1.0, z, 0, 0, Math.PI / 2)); // registro
  }
  const agavePot = (x, z) => {
    add(cyl(0.25, 0.19, 0.5, ceramic, x, 0.25, z, 16)); add(cyl(0.22, 0.22, 0.02, M.soil, x, 0.5, z, 12));
    for (let i = 0; i < 4; i++) add(leaf(agave, 0.07, 1.0 + rnd() * 0.2, x, 0.5, z, 0.3 + rnd() * 0.15, (i / 4) * Math.PI * 2 + rnd() * 0.5, 0.35, 4));
  };
  const spherePot = (x, z) => {
    add(cyl(0.25, 0.19, 0.5, ceramic, x, 0.25, z, 16)); add(cyl(0.22, 0.22, 0.02, M.soil, x, 0.5, z, 12));
    add(sph(0.32, M.plant, x, 0.8, z)); add(sph(0.24, M.leaf2, x + 0.12, 0.98, z - 0.1));
  };
  spherePot(3.28, 8.45);
  agavePot(10.6, 10.9);
  const torch = (x, z) => {
    add(cyl(0.028, 0.032, 1.5, bamboo, x, 0.75, z, 8));
    add(cyl(0.07, 0.045, 0.16, M.dark, x, 1.58, z, 10));
    add(cyl(0, 0.05, 0.18, flame, x, 1.75, z, 8));
  };
  torch(3.25, 10.35); torch(3.35, 12.1); torch(7.0, 7.42);

  // ---- boias na água (superfície em y = -0,16) ----
  {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.13, 10, 24), navy);
    ring.position.set(5.2, -0.14, 9.1); ring.rotation.x = Math.PI / 2; ring.castShadow = true; add(ring);
    add(put(box(1.75, 0.12, 0.72, M.white, 0, 0, 0), 7.0, -0.12, 10.5, 0, 0.4));       // colchão inflável
    add(put(box(0.7, 0.08, 0.26, navy, 0, 0, 0), 6.34, -0.09, 10.78, 0, 0.4));         // travesseiro do colchão
    add(sph(0.15, M.white, 4.4, -0.06, 10.8));                                          // bola
  }
}

function roomBanheiroDispensa(ctx) {
  const { THREE, box, cyl, sph, place, add, std, rnd, M, F } = ctx;
  const PI = Math.PI;
  const G = () => new THREE.Group();
  // cilindro deitado: axis 'x' ou 'z' (padrão 'y' = em pé)
  const rod = (r, len, mat, x, y, z, axis = 'y', seg = 8) => {
    const m = cyl(r, r, len, mat, x, y, z, seg);
    if (axis === 'x') m.rotation.z = PI / 2; else if (axis === 'z') m.rotation.x = PI / 2;
    return m;
  };
  // faixa fina colada numa parede. axis 'x': parede ao longo de X (z fixo = c), de a até b; axis 'z': parede ao longo de Z (x fixo = c)
  const strip = (axis, c, a, b, y, h, mat, t = 0.012) =>
    add(axis === 'x' ? box(b - a, h, t, mat, (a + b) / 2, y, c, { cast: false }) : box(t, h, b - a, mat, c, y, (a + b) / 2, { cast: false }));

  // ---- materiais: branco, cinza claro, azulejo azul-claro discreto ----
  const ceramic = std({ color: 0xf6f8f9, roughness: 0.22 });   // louça sanitária
  const plastic = std({ color: 0xf1f3f4, roughness: 0.45 });   // plástico/eletro branco
  const grey    = std({ color: 0xc8ccd0, roughness: 0.6 });
  const greyDk  = std({ color: 0x8d949a, roughness: 0.55 });
  const tile    = std({ color: 0xbfd7e3, roughness: 0.28 });   // azulejo azul-claro
  const tileDk  = std({ color: 0x7ba4ba, roughness: 0.28 });   // friso azul
  const tileWh  = std({ color: 0xf3f6f7, roughness: 0.28 });   // azulejo branco
  const granite = std({ color: 0xb6babd, roughness: 0.35 });   // bancada granito cinza
  const towelW  = std({ color: 0xf2f2ee, roughness: 1 });
  const towelB  = std({ color: 0x9fc0d4, roughness: 1 });
  const towelG  = std({ color: 0xb7bec4, roughness: 1 });
  const soapB   = std({ color: 0x8db7d3, roughness: 0.5 });
  const soapG   = std({ color: 0x9cc3a6, roughness: 0.5 });
  const rubber  = std({ color: 0x3a3a3a, roughness: 0.9 });
  const gasMat  = std({ color: 0x6d8fb1, roughness: 0.5, metalness: 0.3 });
  const bristle = std({ color: 0x5f7f57, roughness: 1 });
  const cream   = M.cushion;

  // =====================================================================
  // BANHEIRO — x 0–2,4 · z 6,2–8,8 · porta em x=2,4 (z 7,0–7,9) abrindo p/ dentro
  // faces internas: x 0,075–2,325 · z 6,275–8,725 · vão livre da porta: x > 1,5, z 6,9–8,0
  // =====================================================================
  const bx0 = 0.075, bx1 = 2.325, bz0 = 6.275, bz1 = 8.725;

  // Azulejo: área do box revestida até 2,0 m; nas outras paredes só a barra a meia altura + friso
  strip('z', bx0 + 0.006, bz0, 7.21, 1.0, 2.0, tile);
  strip('x', bz0 + 0.006, bx0, 1.01, 1.0, 2.0, tile);
  const band = (axis, c, a, b) => { strip(axis, c, a, b, 1.22, 0.12, tile); strip(axis, c, a, b, 1.29, 0.018, tileDk, 0.013); };
  band('z', bx0 + 0.006, 7.21, bz1);   // parede x=0, depois do box
  band('x', bz0 + 0.006, 1.01, bx1);   // parede z=6,2, depois do box
  band('z', bx1 - 0.006, bz0, 7.0);    // parede x=2,4, antes da porta
  band('z', bx1 - 0.006, 7.9, bz1);    // parede x=2,4, depois da porta
  band('x', bz1 - 0.006, bx0, bx1);    // parede z=8,8

  // ---- Box 0,9×0,9 no canto (x 0,1–1,0 · z 6,3–7,2), vidro para +x (porta de correr) e +z ----
  const shower = (() => {
    const g = G(); const s = 0.9, h = 1.9;
    g.add(box(s, 0.05, s, ceramic, 0, 0.025, 0));                                   // bandeja
    g.add(box(s - 0.1, 0.012, s - 0.1, grey, 0, 0.05, 0));                          // piso do box
    g.add(box(0.12, 0.006, 0.12, M.chrome, -0.22, 0.056, -0.22));                   // ralo: moldura
    g.add(box(0.09, 0.005, 0.09, M.dark, -0.22, 0.06, -0.22));                      // ralo: fundo escuro
    g.add(box(0.09, 0.004, 0.01, M.chrome, -0.22, 0.063, -0.245));                  // ralo: barras da grelha
    g.add(box(0.09, 0.004, 0.01, M.chrome, -0.22, 0.063, -0.195));
    g.add(box(0.01, h, s / 2 - 0.02, M.glass, s / 2, h / 2 + 0.05, -s / 4, { cast: false, receive: false }));            // vidro fixo (+x)
    g.add(box(0.01, h, s / 2 - 0.02, M.glass, s / 2 + 0.025, h / 2 + 0.05, s / 4 - 0.01, { cast: false, receive: false })); // porta de correr (+x)
    g.add(box(s - 0.02, h, 0.01, M.glass, 0, h / 2 + 0.05, s / 2, { cast: false, receive: false }));                    // vidro fixo (+z)
    g.add(box(0.03, h + 0.04, 0.03, M.chrome, s / 2, h / 2 + 0.05, s / 2));                    // montante do canto
    g.add(box(0.03, h + 0.04, 0.03, M.chrome, s / 2, h / 2 + 0.05, -s / 2 + 0.015));           // montante junto à parede z
    g.add(box(0.03, h + 0.04, 0.03, M.chrome, -s / 2 + 0.015, h / 2 + 0.05, s / 2));           // montante junto à parede x
    g.add(box(0.05, 0.035, s, M.chrome, s / 2 + 0.01, h + 0.07, 0));                           // trilho superior +x
    g.add(box(s, 0.035, 0.03, M.chrome, 0, h + 0.07, s / 2));                                  // trilho superior +z
    g.add(box(0.05, 0.02, s, M.chrome, s / 2 + 0.01, 0.06, 0));                                // trilho inferior +x
    g.add(box(s, 0.02, 0.03, M.chrome, 0, 0.06, s / 2));                                       // trilho inferior +z
    g.add(box(0.03, 0.14, 0.02, M.chrome, s / 2 + 0.045, 1.05, 0.1));                          // puxador da porta
    return g;
  })();
  place(shower, 0.55, 6.75);

  // ---- Nicho com xampus (na parede z=6,2, dentro do box, a 1,25–1,59 m) ----
  const nicho = (() => {
    const g = G();
    g.add(box(0.4, 0.02, 0.1, tileWh, 0, -0.16, 0)); g.add(box(0.4, 0.02, 0.1, tileWh, 0, 0.16, 0));
    g.add(box(0.02, 0.34, 0.1, tileWh, -0.19, 0, 0)); g.add(box(0.02, 0.34, 0.1, tileWh, 0.19, 0, 0));
    g.add(box(0.36, 0.3, 0.01, tileDk, 0, 0, -0.045, { cast: false }));                // fundo azul
    const frasco = (r, h, mat, cap, x, z) => {
      g.add(cyl(r, r * 0.9, h, mat, x, -0.15 + h / 2, z, 10));
      g.add(cyl(r * 0.45, r * 0.45, 0.025, cap, x, -0.15 + h + 0.012, z, 8));
    };
    frasco(0.03, 0.2, soapB, M.white, -0.12, 0.01);      // xampu
    frasco(0.028, 0.17, M.white, soapB, -0.03, 0);       // condicionador
    frasco(0.026, 0.13, soapG, M.dark, 0.06, 0.01);      // sabonete líquido
    g.add(box(0.07, 0.025, 0.045, cream, 0.14, -0.137, 0.01));                         // sabonete em barra
    return g;
  })();
  place(nicho, 0.55, 6.34, 0, 1.42);

  // ---- Chuveiro elétrico com haste + registro (parede x=0, dentro do box) ----
  const chuveiro = (() => {
    const g = G();  // origem: face da parede x=0 na altura do registro
    g.add(rod(0.03, 0.03, M.chrome, 0.015, 0, 0, 'x', 12));                            // canopla
    g.add(rod(0.012, 0.08, M.chrome, 0.06, 0, 0, 'x', 8));                             // eixo do registro
    g.add(box(0.012, 0.1, 0.012, M.chrome, 0.1, 0, 0)); g.add(box(0.012, 0.012, 0.1, M.chrome, 0.1, 0, 0)); // volante em cruz
    g.add(rod(0.011, 0.86, M.chrome, 0.03, 0.47, 0, 'y'));                             // haste (tubo vertical)
    g.add(sph(0.017, M.chrome, 0.03, 0.9, 0));                                         // cotovelo
    g.add(rod(0.011, 0.32, M.chrome, 0.19, 0.9, 0, 'x'));                              // braço
    g.add(cyl(0.05, 0.07, 0.09, plastic, 0.35, 0.845, 0, 16));                         // corpo (chuveiro elétrico branco)
    g.add(cyl(0.064, 0.064, 0.012, M.chrome, 0.35, 0.795, 0, 16));                     // espalhador
    g.add(cyl(0.022, 0.022, 0.035, M.dark, 0.35, 0.905, 0, 8));                        // conexão
    const fio = rod(0.004, 0.72, M.dark, 0.35, 1.28, 0, 'y', 5); fio.castShadow = false; g.add(fio); // fio até o teto
    return g;
  })();
  place(chuveiro, bx0, 6.75, 0, 1.15);

  // ---- Vaso com caixa acoplada (caixa na parede x=0, virado para +x) ----
  const toilet = (() => {
    const g = G();  // caixa em -z, frente em +z
    g.add(box(0.3, 0.46, 0.34, ceramic, 0, 0.23, -0.1));                               // base/pedestal
    g.add(box(0.36, 0.34, 0.16, ceramic, 0, 0.62, -0.19));                             // caixa acoplada
    g.add(box(0.38, 0.03, 0.18, ceramic, 0, 0.805, -0.19));                            // tampa da caixa
    g.add(cyl(0.02, 0.02, 0.008, M.chrome, 0, 0.824, -0.19, 12));                      // botão de descarga
    const bowl = cyl(0.18, 0.13, 0.38, ceramic, 0, 0.21, 0.08, 16); bowl.scale.set(1, 1, 1.3); g.add(bowl);   // bacia
    const seat = cyl(0.19, 0.19, 0.03, plastic, 0, 0.415, 0.08, 16); seat.scale.set(1, 1, 1.3); g.add(seat);  // assento
    const lid = cyl(0.19, 0.19, 0.02, plastic, 0, 0.44, 0.08, 16); lid.scale.set(1, 1, 1.3); g.add(lid);      // tampa
    g.add(cyl(0.055, 0.055, 0.1, towelW, 0.1, 0.87, -0.19, 12));                       // rolo reserva sobre a caixa
    return g;
  })();
  place(toilet, 0.42, 8.3, PI / 2);

  // ---- Papeleira (parede z=8,8), escova sanitária e lixeira com pedal ----
  add(box(0.03, 0.04, 0.06, M.chrome, 0.85, 0.72, 8.7));                                // suporte
  add(rod(0.055, 0.1, towelW, 0.85, 0.7, 8.66, 'x', 12));                              // rolo
  add(box(0.09, 0.1, 0.004, towelW, 0.85, 0.6, 8.6, { cast: false }));                 // ponta do papel
  add(cyl(0.045, 0.04, 0.12, plastic, 0.95, 0.06, 8.64, 10));                          // escova: suporte
  add(rod(0.008, 0.3, M.chrome, 0.95, 0.27, 8.64, 'y', 6));                            // escova: cabo
  add(cyl(0.015, 0.015, 0.03, M.dark, 0.95, 0.43, 8.64, 8));                           // escova: punho
  add(cyl(0.1, 0.09, 0.28, M.steel, 1.28, 0.15, 8.6, 14));                             // lixeira: corpo
  add(cyl(0.105, 0.105, 0.02, M.steel, 1.28, 0.3, 8.6, 14));                           // lixeira: tampa
  add(box(0.06, 0.015, 0.05, M.dark, 1.28, 0.02, 8.47));                               // lixeira: pedal

  // ---- Pia: gabinete branco, bancada de granito, cuba de apoio, torneira, armário espelhado ----
  const basin = (() => {
    const g = G();  // costas em -z (parede), frente em +z
    g.add(box(0.54, 0.06, 0.38, greyDk, 0, 0.03, -0.02));                              // rodapé recuado
    g.add(box(0.6, 0.72, 0.44, plastic, 0, 0.42, 0));                                  // gabinete
    g.add(box(0.006, 0.6, 0.008, greyDk, 0, 0.42, 0.222));                             // divisão das portas
    g.add(rod(0.006, 0.1, M.chrome, -0.08, 0.5, 0.235, 'y', 6)); g.add(rod(0.006, 0.1, M.chrome, 0.08, 0.5, 0.235, 'y', 6)); // puxadores
    g.add(box(0.66, 0.03, 0.48, granite, 0, 0.795, 0.01));                             // bancada
    g.add(box(0.66, 0.08, 0.02, granite, 0, 0.85, -0.23));                             // rodabanca
    const cuba = cyl(0.17, 0.12, 0.11, ceramic, 0, 0.865, 0.03, 18); cuba.scale.set(1, 1, 0.8); g.add(cuba);           // cuba de apoio oval
    const agua = cyl(0.135, 0.135, 0.004, greyDk, 0, 0.918, 0.03, 18); agua.scale.set(1, 1, 0.8); agua.castShadow = false; g.add(agua); // interior da cuba
    g.add(rod(0.014, 0.14, M.chrome, 0, 0.88, -0.17, 'y', 10));                        // torneira: corpo
    g.add(rod(0.011, 0.12, M.chrome, 0, 0.95, -0.11, 'z', 8));                         // torneira: bica
    g.add(box(0.05, 0.012, 0.012, M.chrome, 0, 0.96, -0.17));                          // torneira: alavanca
    g.add(cyl(0.03, 0.03, 0.12, soapB, 0.22, 0.87, -0.1, 10)); g.add(rod(0.008, 0.05, M.chrome, 0.22, 0.95, -0.1, 'y', 6));   // saboneteira com bomba
    g.add(cyl(0.032, 0.028, 0.09, tileWh, -0.22, 0.855, -0.08, 10));                   // copo
    g.add(rod(0.006, 0.17, soapG, -0.23, 0.92, -0.08, 'y', 6)); g.add(rod(0.006, 0.17, M.blue, -0.21, 0.92, -0.07, 'y', 6)); // escovas de dente
    g.add(box(0.6, 0.66, 0.13, plastic, 0, 1.55, -0.155));                             // armário espelhado: corpo
    g.add(box(0.56, 0.62, 0.006, M.mirror, 0, 1.55, -0.087, { cast: false }));         // armário espelhado: espelho
    g.add(box(0.1, 0.01, 0.012, M.chrome, 0.2, 1.27, -0.08));                          // puxador do armário
    return g;
  })();
  place(basin, 1.95, 8.485, PI);
  add(box(0.02, 0.05, 0.03, M.chrome, 1.45, 1.12, 8.71));                               // gancho
  add(box(0.16, 0.34, 0.025, towelB, 1.45, 0.94, 8.69));                                // toalha de rosto pendurada

  // ---- Toalheiro (parede z=6,2): barra com toalhas penduradas + prateleira com toalhas dobradas ----
  add(rod(0.012, 0.6, M.chrome, 1.65, 1.2, 6.34, 'x', 8));                              // barra
  add(box(0.025, 0.025, 0.07, M.chrome, 1.38, 1.2, 6.31)); add(box(0.025, 0.025, 0.07, M.chrome, 1.92, 1.2, 6.31)); // suportes
  add(box(0.24, 0.6, 0.05, towelW, 1.52, 0.92, 6.345));                                 // toalha branca dobrada sobre a barra
  add(box(0.24, 0.55, 0.05, towelB, 1.79, 0.945, 6.345));                               // toalha azul
  add(box(0.6, 0.02, 0.26, M.chrome, 1.65, 1.95, 6.41));                                // prateleira cromada
  add(box(0.02, 0.1, 0.2, M.chrome, 1.38, 1.9, 6.38)); add(box(0.02, 0.1, 0.2, M.chrome, 1.92, 1.9, 6.38)); // mãos-francesas
  add(box(0.34, 0.06, 0.22, towelW, 1.65, 1.99, 6.41));                                 // pilha de toalhas dobradas
  add(box(0.34, 0.06, 0.22, towelB, 1.65, 2.05, 6.41));
  add(box(0.34, 0.06, 0.22, towelG, 1.65, 2.11, 6.41));

  // ---- Tapete de banheiro e ralo do piso ----
  place(F.rug(0.6, 0.4, 0x9fc0d4), 1.1, 7.55);
  add(box(0.1, 0.006, 0.1, M.chrome, 0.5, 0.017, 7.65, { cast: false }));
  add(box(0.07, 0.004, 0.07, M.dark, 0.5, 0.021, 7.65, { cast: false }));

  // =====================================================================
  // DISPENSA / ÁREA DE SERVIÇO — x 0–2,4 · z 8,8–10,6 · porta em x=2,4 (z 9,3–10,1)
  // faces internas: x 0,075–2,325 · z 8,875–10,525 · vão livre da porta: x > 1,55, z 9,2–10,15
  // =====================================================================
  const dx0 = 0.075, dz0 = 8.875;
  strip('x', dz0 + 0.005, dx0, 1.6, 0.75, 1.5, tileWh, 0.01);                          // azulejo branco atrás do tanque/máquina

  // ---- Máquina de lavar (abertura superior) branca — x 0,15–0,75 · z 8,95–9,55 ----
  const washer = (() => {
    const g = G();  // costas em -z
    g.add(box(0.56, 0.05, 0.56, greyDk, 0, 0.025, 0));                                 // base/pés
    g.add(box(0.6, 0.9, 0.6, plastic, 0, 0.5, 0));                                     // gabinete
    g.add(box(0.6, 0.02, 0.6, grey, 0, 0.96, 0));                                      // tampo
    g.add(box(0.5, 0.015, 0.4, plastic, 0, 0.977, 0.07));                              // tampa
    g.add(box(0.44, 0.006, 0.34, M.glassDark, 0, 0.987, 0.07, { cast: false }));       // visor da tampa
    g.add(box(0.6, 0.14, 0.12, plastic, 0, 1.03, -0.24));                              // painel traseiro
    g.add(box(0.14, 0.05, 0.006, M.screenOff, -0.16, 1.05, -0.177, { cast: false }));  // display
    g.add(rod(0.03, 0.02, M.dark, 0.12, 1.04, -0.17, 'z', 12));                        // seletor de programa
    g.add(rod(0.02, 0.02, greyDk, 0.2, 1.04, -0.17, 'z', 10));                         // botão liga
    g.add(rod(0.012, 0.5, greyDk, -0.2, 0.75, -0.32, 'y', 6));                         // mangueira de entrada (atrás)
    g.add(rod(0.014, 0.4, rubber, 0.22, 0.2, -0.32, 'y', 6));                          // mangueira de saída
    return g;
  })();
  place(washer, 0.45, 9.25);

  // ---- Tanque de lavar roupa com coluna, esfregador, sabão, bucha e torneira de parede ----
  const tank = (() => {
    const g = G();  // costas em -z (z -0,25 = face da parede)
    g.add(box(0.36, 0.62, 0.34, ceramic, 0, 0.31, -0.02));                             // coluna
    g.add(box(0.55, 0.28, 0.5, ceramic, 0, 0.76, 0));                                  // cuba
    g.add(box(0.47, 0.01, 0.42, grey, 0, 0.9, 0));                                     // fundo interno
    const board = box(0.3, 0.012, 0.22, ceramic, -0.08, 0.915, 0.06); board.rotation.x = -0.3; g.add(board); // esfregador inclinado
    g.add(box(0.07, 0.03, 0.045, cream, 0.2, 0.915, -0.2));                            // sabão em barra
    g.add(box(0.1, 0.035, 0.07, soapG, 0.19, 0.918, 0.17));                            // bucha
    g.add(rod(0.012, 0.17, M.chrome, 0, 1.12, -0.165, 'z', 8));                        // cano saindo da parede
    g.add(rod(0.011, 0.12, M.chrome, 0, 1.07, -0.09, 'y', 8));                         // bica
    g.add(box(0.05, 0.012, 0.012, M.chrome, 0, 1.135, -0.2));                          // manípulo
    return g;
  })();
  place(tank, 1.12, 9.125);

  // ---- Prateleira de parede acima (z=8,8, y 1,55) com produtos de limpeza ----
  add(box(1.2, 0.025, 0.22, M.white, 0.8, 1.55, 8.985));
  add(box(0.02, 0.12, 0.18, M.white, 0.3, 1.48, 8.97)); add(box(0.02, 0.12, 0.18, M.white, 1.3, 1.48, 8.97)); // mãos-francesas
  add(box(0.16, 0.22, 0.09, soapB, 0.32, 1.673, 8.98));                                 // sabão em pó (caixa)
  add(cyl(0.05, 0.045, 0.24, M.blue, 0.56, 1.683, 8.98, 10)); add(cyl(0.02, 0.02, 0.03, M.white, 0.56, 1.818, 8.98, 8));   // amaciante
  add(cyl(0.045, 0.04, 0.26, tileWh, 0.72, 1.693, 8.98, 10)); add(cyl(0.02, 0.02, 0.03, soapG, 0.72, 1.838, 8.98, 8));   // água sanitária
  add(cyl(0.03, 0.028, 0.16, soapG, 0.86, 1.643, 8.98, 10));                            // detergente
  add(box(0.12, 0.1, 0.1, cream, 1.02, 1.6125, 8.98));                                  // caixa (esponjas)
  add(cyl(0.035, 0.035, 0.14, towelW, 1.2, 1.633, 8.98, 10));                           // pote de pregadores

  // ---- Varal de teto (pendurado a 2,15 m sobre tanque/máquina) com roupas ----
  const varal = (() => {
    const g = G();  // laterais ao longo de z em x ±0,55; varetas ao longo de x
    for (const sx of [-1, 1]) g.add(box(0.03, 0.03, 0.5, M.steel, sx * 0.55, 0, 0));
    for (let i = 0; i < 5; i++) g.add(rod(0.007, 1.1, M.steel, 0, 0, -0.22 + i * 0.11, 'x', 6));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const c = rod(0.003, 0.65, M.dark, sx * 0.55, 0.325, sz * 0.24, 'y', 4); c.castShadow = false; g.add(c); } // cordas até o teto
    g.add(box(0.36, 0.55, 0.03, towelW, -0.25, -0.27, 0.22));                          // toalha
    g.add(box(0.4, 0.45, 0.02, towelG, 0.25, -0.22, 0.11));                            // camiseta
    g.add(box(0.26, 0.6, 0.025, M.navy, 0.15, -0.3, 0.22));                            // calça jeans
    return g;
  })();
  place(varal, 0.8, 9.2, 0, 2.15);

  // ---- Estante metálica (parede x=0, z 9,63–10,47) com potes, mantimentos e produtos ----
  const rack = (() => {
    const g = G(); const w = 0.84, d = 0.32, h = 1.75;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.03, h, 0.03, greyDk, sx * (w / 2 - 0.015), h / 2, sz * (d / 2 - 0.015)));
    const ys = [0.1, 0.52, 0.94, 1.36, 1.75];
    for (const y of ys) g.add(box(w, 0.025, d, M.white, 0, y, 0));
    const top = (i) => ys[i] + 0.0125;
    const jar = (x, r, hh, content, y) => {                                            // pote de vidro com mantimento
      g.add(cyl(r - 0.01, r - 0.01, hh - 0.04, content, x, y + (hh - 0.04) / 2, 0, 12));
      const gl = cyl(r, r, hh, M.glass, x, y + hh / 2, 0, 12); gl.castShadow = false; g.add(gl);
      g.add(cyl(r + 0.004, r + 0.004, 0.02, M.dark, x, y + hh + 0.01, 0, 12));
    };
    const pot = (x, r, hh, lid, y) => {                                                // pote plástico com tampa colorida
      g.add(cyl(r, r * 0.92, hh, plastic, x, y + hh / 2, 0, 12));
      g.add(cyl(r + 0.004, r + 0.004, 0.02, lid, x, y + hh + 0.01, 0, 12));
    };
    const bottle = (x, r, hh, mat, cap, y) => {
      g.add(cyl(r, r * 0.95, hh, mat, x, y + hh / 2, 0, 10));
      g.add(cyl(r * 0.4, r * 0.4, 0.03, cap, x, y + hh + 0.015, 0, 8));
    };
    let y = top(0);                                                                    // nível 0: balde e caixa
    g.add(cyl(0.115, 0.095, 0.27, grey, -0.24, y + 0.135, 0, 14));
    g.add(box(0.3, 0.22, 0.24, M.tan, 0.13, y + 0.11, 0));
    y = top(1);                                                                        // nível 1: potes de vidro (feijão, arroz) e potes plásticos
    jar(-0.29, 0.06, 0.22 + rnd() * 0.03, M.woodDark, y); jar(-0.14, 0.055, 0.18 + rnd() * 0.03, cream, y);
    pot(0.02, 0.06, 0.15, soapB, y); pot(0.18, 0.05, 0.12, soapG, y);
    y = top(2);                                                                        // nível 2: produtos de limpeza
    bottle(-0.3, 0.045, 0.26, soapB, M.white, y); bottle(-0.18, 0.03, 0.2, cream, M.dark, y);
    g.add(cyl(0.03, 0.03, 0.2, tileWh, -0.07, y + 0.1, 0, 10)); g.add(box(0.025, 0.06, 0.07, soapG, -0.07, y + 0.22, 0.01)); // multiuso spray
    g.add(box(0.24, 0.2, 0.12, M.white, 0.2, y + 0.1, 0));                             // pacote de papel higiênico
    y = top(3);                                                                        // nível 3: papel-toalha, pote grande, sabão em pó
    g.add(cyl(0.055, 0.055, 0.23, towelW, -0.3, y + 0.115, 0, 12));
    pot(-0.13, 0.07, 0.18, M.dark, y);
    g.add(box(0.15, 0.2, 0.08, soapB, 0.1, y + 0.1, 0));
    y = top(4);                                                                        // topo: panos dobrados
    g.add(box(0.3, 0.05, 0.22, towelG, -0.2, y + 0.025, 0)); g.add(box(0.3, 0.05, 0.22, towelW, 0.15, y + 0.025, 0));
    return g;
  })();
  place(rack, dx0 + 0.17, 10.05, PI / 2);

  // ---- Botijão de gás reserva (P13) no canto z=10,6 ----
  const gas = (() => {
    const g = G();
    g.add(cyl(0.155, 0.17, 0.03, gasMat, 0, 0.015, 0, 20));                            // saia/base
    g.add(cyl(0.17, 0.17, 0.42, gasMat, 0, 0.24, 0, 20));                              // corpo
    g.add(cyl(0.09, 0.17, 0.07, gasMat, 0, 0.485, 0, 20));                             // ombro
    g.add(cyl(0.085, 0.085, 0.08, gasMat, 0, 0.56, 0, 12, true));                      // colar/alça
    g.add(rod(0.02, 0.05, M.chrome, 0, 0.545, 0, 'y', 8));                             // válvula
    return g;
  })();
  place(gas, 0.62, 10.33);

  // ---- Cesto de roupa suja (vime) ----
  const basket = (() => {
    const g = G();
    g.add(cyl(0.19, 0.16, 0.5, M.tan, 0, 0.25, 0, 14));                                // corpo
    g.add(cyl(0.2, 0.2, 0.025, cream, 0, 0.5125, 0, 14));                              // borda
    g.add(cyl(0.17, 0.17, 0.02, towelG, 0, 0.53, 0, 12));                              // roupas dentro
    g.add(box(0.02, 0.22, 0.14, towelB, 0.205, 0.42, 0));                              // toalha caindo pela borda
    return g;
  })();
  place(basket, 1.45, 10.33);

  // ---- Vassoura e rodo encostados na parede z=10,6 (pé afastado, topo apoiado na parede) ----
  const stick = (len, x, z, lean, headFn) => {
    const g = G(); g.add(rod(0.012, len, M.woodLite, 0, len / 2 + 0.1, 0, 'y', 6)); headFn(g);
    place(g, x, z); g.rotation.x = lean; return g;
  };
  stick(1.3, 2.16, 10.24, 0.2, (g) => { g.add(box(0.27, 0.03, 0.06, M.wood, 0, 0.1, 0)); g.add(box(0.26, 0.09, 0.05, bristle, 0, 0.045, 0)); });          // vassoura
  stick(1.35, 1.84, 10.22, 0.2, (g) => { g.add(box(0.38, 0.03, 0.03, M.wood, 0, 0.06, 0)); g.add(box(0.38, 0.05, 0.014, rubber, 0, 0.025, 0.012)); }); // rodo

  // ---- Tábua de passar dobrada, encostada na parede x=2,4 antes da porta (z 8,93–9,27) ----
  const tabua = (() => {
    const g = G();  // em pé, origem no pé
    g.add(box(0.03, 1.25, 0.34, cream, 0, 0.64, 0));                                   // tábua com capa
    g.add(rod(0.008, 1.1, greyDk, -0.03, 0.6, -0.1, 'y', 6)); g.add(rod(0.008, 1.1, greyDk, -0.03, 0.6, 0.1, 'y', 6)); // pernas dobradas
    return g;
  })();
  place(tabua, 2.17, 9.1); tabua.rotation.z = -0.1;
}

function roomGaragemJardim(ctx) {
  const { THREE, M, box, cyl, sph, place, add, std, rnd } = ctx;
  const G = () => new THREE.Group();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const j = (k) => (rnd() - 0.5) * 2 * k;                      // jitter determinístico ±k
  const flat = (m) => { m.castShadow = false; return m; };     // peças rasteiras não projetam sombra

  // Paleta local: verdes variados, cinza-pedra, madeira; amarelo-segurança como acento da garagem
  const P = {
    stone: std({ color: 0x8f8b82, roughness: 0.95 }), stone2: std({ color: 0xa39e93, roughness: 0.95 }), stoneDk: std({ color: 0x6e6b64, roughness: 0.95 }),
    gravel: std({ color: 0xb8b2a5, roughness: 1 }), iron: std({ color: 0x3c3f42, roughness: 0.7, metalness: 0.4 }), ironLt: std({ color: 0x5f6368, roughness: 0.6, metalness: 0.4 }),
    rubber: std({ color: 0x2a2a2a, roughness: 1 }), yellow: std({ color: 0xd9b83a, roughness: 0.8 }), paintWhite: std({ color: 0xe4e4dc, roughness: 0.9 }),
    peg: std({ color: 0xd8d0bc, roughness: 0.9 }), cardboard: std({ color: 0xb08c5a, roughness: 1 }), crate: std({ color: 0x3f6390, roughness: 0.8 }),
    binGreen: std({ color: 0x4a5d48, roughness: 0.8 }), binGreenDk: std({ color: 0x38473a, roughness: 0.8 }), binBlue: std({ color: 0x3f5670, roughness: 0.8 }), binBlueDk: std({ color: 0x2e4050, roughness: 0.8 }),
    bike: std({ color: 0x2f5d4b, roughness: 0.5, metalness: 0.3 }), hose: std({ color: 0x3e7a3f, roughness: 0.8 }), drill: std({ color: 0x2d6e5a, roughness: 0.7 }),
    redTool: std({ color: 0x9b3b2e, roughness: 0.7 }), ceramic: std({ color: 0xc8b9a4, roughness: 0.85 }), plastic: std({ color: 0x6c7a86, roughness: 0.7 }),
    leafDk: std({ color: 0x24512a, roughness: 1 }), leafLt: std({ color: 0x6b9a3e, roughness: 1 }), palm: std({ color: 0x4d8a3c, roughness: 0.9 }), silver: std({ color: 0x7d9d7a, roughness: 1 }),
    pink: std({ color: 0xd4788c, roughness: 0.9 }), lilac: std({ color: 0x9a86c4, roughness: 0.9 }), cream: std({ color: 0xf1ead8, roughness: 0.9 }), lampGlass: std({ color: 0xe9e2cf, roughness: 0.5 }),
  };

  // ---- builders locais ------------------------------------------------------------------------
  // cilindro entre dois pontos (tubos de bicicleta, galhos, mangueira)
  const tube = (g, a, b, r, mat, seg = 8) => {
    const A = V(...a), B = V(...b), d = B.clone().sub(A);
    const m = cyl(r, r, d.length(), mat, 0, 0, 0, seg);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    g.add(m); return m;
  };
  // toro (rodas, anéis de mangueira, cabeça de chave)
  const torus = (r, t, mat, x, y, z, rx = 0, ry = 0, seg = 20) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, seg), mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.castShadow = true; m.receiveShadow = true; return m;
  };
  // folha comprida saindo de (cx,cy,cz): ângulo `a` no plano, inclinação `t` (positivo = caindo)
  const frond = (g, cx, cy, cz, len, w, a, t, mat) => {
    const m = box(len, 0.02, w, mat, 0, 0, 0), L = len / 2, ct = Math.cos(t);
    m.position.set(cx + L * ct * Math.cos(a), cy - L * Math.sin(t), cz - L * ct * Math.sin(a));
    m.rotation.set(0, a, -t);
    g.add(m); return m;
  };
  const loose = G();                                          // tubos soltos no nível da cena

  // =============================== GARAGEM (x 0–3 · z 10,6–16) ===============================
  // Vaga: tapete de borracha + faixas amarelas (o up! do cartão fica em cima, centrado em (1,5, 13,6))
  add(box(1.8, 0.012, 3.8, P.rubber, 1.5, 0.02, 13.6, { cast: false }));
  for (const x of [0.52, 2.48]) add(box(0.08, 0.008, 4.0, P.yellow, x, 0.02, 13.6, { cast: false }));
  add(box(2.04, 0.008, 0.08, P.yellow, 1.5, 0.02, 11.62, { cast: false }));

  // Armário de ferramentas (aço, tampo de madeira, 2 portas + 2 gavetas, maleta e lata em cima)
  const toolCabinet = () => {
    const g = G();
    g.add(box(0.86, 0.05, 0.36, M.dark, 0, 0.025, 0));                       // rodapé
    g.add(box(0.9, 0.85, 0.4, M.steel, 0, 0.475, 0));                        // corpo (y 0,05–0,90)
    g.add(box(0.96, 0.05, 0.46, M.wood, 0, 0.925, 0));                       // tampo
    g.add(box(0.01, 0.55, 0.01, M.dark, 0, 0.34, 0.2));                      // frincha entre as portas
    for (const sx of [-1, 1]) {
      g.add(cyl(0.007, 0.007, 0.1, M.chrome, sx * 0.06, 0.4, 0.212, 6));    // puxadores das portas
      g.add(box(0.42, 0.22, 0.012, P.ironLt, sx * 0.22, 0.76, 0.206));       // frentes das gavetas
      g.add(box(0.2, 0.015, 0.02, M.chrome, sx * 0.22, 0.76, 0.222));        // puxadores das gavetas
    }
    g.add(box(0.4, 0.16, 0.2, P.redTool, -0.2, 1.03, 0));                    // maleta de ferramentas
    g.add(box(0.16, 0.02, 0.025, M.dark, -0.2, 1.12, 0));                    // alça
    g.add(cyl(0.075, 0.075, 0.16, M.white, 0.25, 1.03, -0.06, 14));           // lata de tinta
    return g;
  };
  place(toolCabinet(), 0.55, 10.95);

  // Painel de ferramentas (pegboard) na parede do fundo (z=10,6), acima do armário
  add(box(1.5, 0.75, 0.02, P.peg, 0.9, 1.55, 10.686));
  const zt = 10.712;                                                         // plano das ferramentas
  add(box(0.03, 0.3, 0.025, M.wood, 0.35, 1.45, zt)); add(box(0.12, 0.05, 0.04, M.dark, 0.35, 1.62, zt));           // martelo
  add(box(0.03, 0.26, 0.02, M.chrome, 0.62, 1.5, zt)); add(torus(0.035, 0.012, M.chrome, 0.62, 1.66, zt));            // chave fixa
  add(box(0.2, 0.08, 0.06, P.drill, 1.35, 1.64, zt + 0.02)); add(box(0.05, 0.14, 0.05, M.dark, 1.31, 1.52, zt + 0.02)); // furadeira
  const chuck = cyl(0.02, 0.02, 0.06, M.chrome, 1.48, 1.64, zt + 0.02, 8); chuck.rotation.z = Math.PI / 2; add(chuck);   // mandril
  add(box(0.34, 0.09, 0.006, M.steel, 1.0, 1.3, zt)); add(box(0.1, 0.1, 0.02, M.wood, 1.22, 1.3, zt));             // serrote
  add(box(0.4, 0.04, 0.025, P.yellow, 0.5, 1.28, zt));                                                             // nível

  // Prateleira alta com caixas (parede do fundo, y 2,2)
  add(box(2.7, 0.03, 0.35, M.woodLite, 1.45, 2.2, 10.86));
  for (const x of [0.4, 2.5]) add(box(0.03, 0.26, 0.3, P.ironLt, x, 2.06, 10.85));
  add(box(0.5, 0.36, 0.32, P.cardboard, 0.45, 2.395, 10.86));
  add(box(0.4, 0.28, 0.3, P.cardboard, 1.05, 2.355, 10.86));
  add(box(0.45, 0.3, 0.32, P.crate, 1.6, 2.365, 10.86));
  add(box(0.34, 0.24, 0.28, P.cardboard, 2.25, 2.335, 10.86));

  // Bicicleta encostada na parede x=0 (frente em -z; rodas = toros, quadro = tubos)
  const bicycle = () => {
    const g = G(), R = [0, 0.355, 0.52], F = [0, 0.355, -0.52], BB = [0, 0.3, 0.08], S = [0, 0.86, 0.25], Hb = [0, 0.7, -0.4], H = [0, 0.86, -0.35];
    for (const w of [R, F]) g.add(torus(0.33, 0.025, M.tire, w[0], w[1], w[2], 0, Math.PI / 2, 24));
    for (const [a, b] of [[BB, S], [BB, Hb], [S, H], [BB, R], [S, R], [Hb, F], [Hb, H]]) tube(g, a, b, 0.016, P.bike);
    tube(g, S, [0, 0.98, 0.28], 0.012, M.chrome);                             // canote
    g.add(box(0.12, 0.05, 0.26, M.dark, 0, 1.0, 0.3));                       // selim
    const bar = cyl(0.012, 0.012, 0.48, M.dark, 0, 0.95, -0.4, 8); bar.rotation.z = Math.PI / 2; g.add(bar);   // guidão
    return g;
  };
  const bike = place(bicycle(), 0.42, 12.7); bike.rotation.z = 0.07;         // leve inclinação contra a parede

  // Mangueira enrolada pendurada num gancho (parede x=0, perto do portão)
  add(box(0.08, 0.03, 0.1, P.ironLt, 0.115, 1.0, 15.2));
  add(torus(0.2, 0.03, P.hose, 0.17, 0.8, 15.2, 0, Math.PI / 2, 24));
  add(cyl(0.015, 0.015, 0.14, P.hose, 0.2, 0.52, 15.1, 8));

  // Lixeiras no canto do fundo, balde, quadro de luz junto ao portão
  add(cyl(0.2, 0.18, 0.62, P.binGreen, 2.62, 0.31, 10.95, 14)); add(cyl(0.22, 0.2, 0.05, P.binGreenDk, 2.62, 0.645, 10.95, 14));
  add(cyl(0.18, 0.16, 0.55, P.binBlue, 2.18, 0.275, 10.95, 14)); add(cyl(0.2, 0.18, 0.05, P.binBlueDk, 2.18, 0.575, 10.95, 14));
  add(cyl(0.14, 0.12, 0.28, P.plastic, 1.4, 0.14, 10.92, 12));
  add(box(0.06, 0.32, 0.24, P.paintWhite, 0.105, 1.6, 15.55));

  // ============================ JARDIM (grama x 10,9–13,4 · z 6,2–12,4) ============================
  // Canteiro ao longo do muro (x=13,4): terra + borda de pedra em segmentos irregulares
  add(box(0.7, 0.05, 5.3, M.soil, 12.94, 0.03, 9.07, { cast: false }));
  for (let i = 0; i < 4; i++) {
    const h = 0.1 + rnd() * 0.05, s = box(0.14, h, 1.31, i % 2 ? P.stone2 : P.stone, 12.55 + j(0.01), h / 2, 7.07 + i * 1.335);
    s.rotation.y = j(0.03); add(s);
  }
  for (const z of [6.4, 11.75]) add(box(0.77, 0.12, 0.14, P.stone, 12.935, 0.06, z));
  // Pedriscos: faixa entre o caminho e o canteiro + roda em volta da árvore
  add(box(0.25, 0.012, 5.1, P.gravel, 12.375, 0.018, 9.05, { cast: false }));
  add(flat(cyl(0.5, 0.5, 0.014, P.gravel, 12.3, 0.02, 11.9, 20)));

  // Árvore (tronco afunilado, 3 galhos, copa em três verdes; copa puxada para o lado do deck, longe da arandela)
  const tree = () => {
    const g = G();
    g.add(cyl(0.1, 0.15, 2.1, M.trunk, 0, 1.05, 0, 10));
    tube(g, [0, 1.85, 0], [-0.5, 2.5, 0.25], 0.05, M.trunk); tube(g, [0, 1.95, 0], [0.3, 2.55, -0.35], 0.045, M.trunk); tube(g, [0, 2.05, 0], [-0.15, 2.75, -0.4], 0.04, M.trunk);
    const balls = [[-0.45, 2.6, 0.25, 0.6], [0.3, 2.65, -0.35, 0.55], [-0.15, 2.95, -0.35, 0.55], [0.35, 2.45, 0.3, 0.5], [-0.6, 2.3, -0.15, 0.48], [0.05, 3.2, 0.05, 0.5]];
    balls.forEach(([x, y, z, r], i) => g.add(sph(r + j(0.03), [M.plant, M.leaf2, P.leafDk][i % 3], x + j(0.05), y, z + j(0.05))));
    return g;
  };
  place(tree(), 12.3, 11.9);

  // Palmeiras pequenas: tronco em anéis + folhas caídas em leque (abrem para o lado do jardim, não para o muro)
  const palm = (h, n, len, w, segs) => {
    const g = G(); const sh = h / segs;
    for (let i = 0; i < segs; i++) g.add(cyl(0.06 - i * 0.008, 0.075 - i * 0.008, sh, i % 2 ? M.trunk : M.woodDark, 0, sh * (i + 0.5), 0, 8));
    for (let i = 0; i < n; i++) { const a = Math.PI + (i - (n - 1) / 2) * (3.6 / (n - 1)); frond(g, 0, h, 0, len, w, a + j(0.08), 0.35 + rnd() * 0.4, i % 2 ? P.palm : M.leaf2); }
    g.add(sph(0.07, P.leafLt, 0, h + 0.03, 0));
    return g;
  };
  place(palm(1.45, 6, 1.0, 0.18, 2), 12.95, 7.3);
  place(palm(0.95, 5, 0.75, 0.15, 1), 12.95, 10.0);

  // Arbustos (3 esferas em verdes diferentes) e touceiras com flores discretas
  const shrub = (x, z, s, m1, m2) => {
    add(sph(0.32 * s, m1, x, 0.28 * s, z)); add(sph(0.25 * s, m2, x - 0.18 * s, 0.26 * s, z + 0.15 * s)); add(sph(0.22 * s, P.leafLt, x + 0.13 * s, 0.32 * s, z - 0.17 * s));
  };
  shrub(12.9, 6.78, 1.0, P.leafDk, M.leaf2); shrub(12.95, 8.9, 0.85, M.plant, P.silver); shrub(12.9, 11.25, 0.95, P.leafDk, M.plant);
  const flowers = (x, z, bloom, r = 0.05, tall = 1) => {
    add(sph(0.2, M.leaf2, x, 0.16, z));
    for (let i = 0; i < 2; i++) { const a = rnd() * Math.PI * 2, d = 0.06 + rnd() * 0.1; const b = sph(r, bloom, x + Math.cos(a) * d, 0.3 + rnd() * 0.05, z + Math.sin(a) * d); b.scale.y = tall; add(b); }
  };
  flowers(13.0, 7.95, P.pink); flowers(12.95, 8.45, P.cream, 0.04); flowers(12.95, 10.65, P.lilac, 0.035, 2.4);

  // Vaso de cerâmica com dracena junto ao vidro da varanda
  add(cyl(0.24, 0.19, 0.42, P.ceramic, 11.3, 0.21, 6.65, 14)); add(cyl(0.21, 0.21, 0.02, M.soil, 11.3, 0.42, 6.65, 14));
  const gp = G(); for (let i = 0; i < 4; i++) frond(gp, 0, 0.42, 0, 0.6, 0.09, i * 1.571 + j(0.15), -1.05 + rnd() * 0.25, i % 2 ? P.leafLt : P.palm); place(gp, 11.3, 6.65);

  // Caminho de lajotas: pátio → jardim → varanda (desvia do tronco), e da varanda ao deck (porta e vidro)
  const stone = (x, z, i) => { const s = box(0.42, 0.03, 0.34, [P.stone, P.stone2, P.stoneDk][i % 3], x + j(0.04), 0.03, z, { cast: false }); s.rotation.y = j(0.12); add(s); };
  for (let i = 0; i < 9; i++) { const z = 6.55 + i * 0.72; stone(12.0 - 0.12 * Math.min(1, Math.max(0, (z - 10.8) / 1.2)), z, i); }
  [[3.35, 6.5], [3.35, 6.9], [10.0, 6.5], [10.0, 6.9]].forEach(([x, z], i) => stone(x, z, i));

  // Luminárias baixas de jardim (postes de 0,5 m — só a forma, sem luz)
  for (const z of [7.0, 9.2, 11.25]) {
    add(cyl(0.018, 0.022, 0.4, M.dark, 12.34, 0.2, z, 8)); add(cyl(0.04, 0.04, 0.09, P.lampGlass, 12.34, 0.445, z, 10)); add(cyl(0.02, 0.09, 0.05, M.dark, 12.34, 0.515, z, 10));
  }

  // Torneira de jardim no muro (perto da bomba) + mangueira enrolada na grama
  add(cyl(0.012, 0.012, 0.62, M.chrome, 13.3, 0.31, 12.2, 8));
  const tapBody = cyl(0.02, 0.02, 0.1, M.chrome, 13.25, 0.62, 12.2, 8); tapBody.rotation.z = Math.PI / 2; add(tapBody);
  add(box(0.05, 0.012, 0.012, P.redTool, 13.2, 0.66, 12.2)); add(cyl(0.01, 0.01, 0.08, M.chrome, 13.2, 0.57, 12.2, 8));
  add(torus(0.22, 0.022, P.hose, 12.85, 0.03, 12.15, Math.PI / 2, 0, 24));
  tube(loose, [13.2, 0.53, 12.2], [12.98, 0.05, 12.34], 0.013, P.hose);

  // ======================= PÁTIO / ENTRADA (asfalto x 2,4–13,4 · z 12,4–16,6) =======================
  // Vaga de visitante pintada no asfalto, em frente ao vão da garagem (x 3,4–8,0 · z 12,95–15,35) + calço de roda
  for (const z of [12.95, 15.35]) add(box(4.6, 0.006, 0.1, P.paintWhite, 5.7, 0.018, z, { cast: false }));
  add(box(0.1, 0.006, 2.5, P.paintWhite, 8.0, 0.018, 14.15, { cast: false }));
  add(box(0.15, 0.1, 0.55, P.yellow, 7.6, 0.05, 14.15));

  // Caixa de correio na face interna do muro, ao lado do portão de pedestre (x 5,6–6,6)
  add(box(0.3, 0.22, 0.14, M.white, 5.25, 1.35, 16.455)); add(box(0.22, 0.02, 0.012, M.dark, 5.25, 1.42, 16.38)); add(box(0.02, 0.1, 0.04, P.redTool, 5.42, 1.42, 16.44));

  // Lixeira com rodas, banco de pedra e vaso grande com buxinho junto ao portão
  add(box(0.5, 0.85, 0.55, P.binGreen, 4.6, 0.5, 16.2)); add(box(0.54, 0.06, 0.59, P.binGreenDk, 4.6, 0.955, 16.2));
  for (const sx of [-1, 1]) { const w = cyl(0.09, 0.09, 0.05, M.dark, 4.6 + sx * 0.27, 0.09, 16.42, 12); w.rotation.z = Math.PI / 2; add(w); }
  add(box(1.4, 0.07, 0.42, P.stone2, 9.6, 0.445, 16.25)); for (const sx of [-1, 1]) add(box(0.14, 0.41, 0.36, P.stone, 9.6 + sx * 0.55, 0.205, 16.25));
  add(cyl(0.3, 0.24, 0.55, P.ceramic, 7.1, 0.275, 16.2, 16)); add(cyl(0.27, 0.27, 0.02, M.soil, 7.1, 0.55, 16.2, 16));
  add(sph(0.34, P.leafDk, 7.1, 0.9, 16.2)); add(sph(0.2, M.leaf2, 7.25, 1.05, 16.1));

  // Tampa de bueiro redonda no meio do pátio e grelha de escoamento junto ao muro
  add(flat(cyl(0.3, 0.3, 0.02, P.iron, 10.3, 0.022, 14.6, 20))); add(flat(cyl(0.24, 0.24, 0.008, P.ironLt, 10.3, 0.036, 14.6, 20)));
  add(box(0.4, 0.02, 0.3, P.iron, 4.0, 0.02, 15.95, { cast: false })); for (let i = 0; i < 3; i++) add(box(0.03, 0.012, 0.28, P.ironLt, 3.9 + i * 0.1, 0.034, 15.95, { cast: false }));

  place(loose, 0, 0);
}
// @rooms-end

// ---------------------------------------------------------------------------
// O cartão
// ---------------------------------------------------------------------------
const CSS = `
:host { display: block; position: relative; height: var(--casa3d-height, calc(100vh - 100px)); min-height: 360px;
  border-radius: var(--ha-card-border-radius, 12px); overflow: hidden; background: #0a0f1e;
  font: 13px/1.35 var(--primary-font-family, -apple-system, BlinkMacSystemFont, Roboto, "Segoe UI", sans-serif); color: #e6edf7; }
.wrap { position: absolute; inset: 0; }
canvas { display: block; width: 100%; height: 100%; touch-action: none; outline: none; cursor: grab; }
canvas.pick { cursor: pointer; }
canvas:active { cursor: grabbing; }
.hud { position: absolute; left: 0; right: 0; display: flex; gap: 8px; padding: 10px; pointer-events: none; box-sizing: border-box; }
.hud > * { pointer-events: auto; }
.hud.top { top: 0; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; }
.panel { background: rgba(10, 14, 26, .72); border: 1px solid rgba(255, 255, 255, .09); border-radius: 10px;
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.title { padding: 8px 12px; display: flex; flex-direction: column; gap: 2px; }
.title b { font-size: 15px; font-weight: 700; letter-spacing: .01em; }
.title .sub { color: #9aa6bd; font-size: 12px; font-variant-numeric: tabular-nums; }
.title .clock { color: #e6edf7; font-size: 12.5px; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: .01em; }
.title .clock .per { color: #ffd48a; font-weight: 700; }
.title .clock .suntimes { color: #9aa6bd; font-weight: 500; }
.btns { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.seg { display: inline-flex; padding: 3px; gap: 2px; }
button { appearance: none; border: 0; background: transparent; color: #d5dcea; font: inherit; font-weight: 600; font-size: 12px;
  padding: 6px 10px; border-radius: 7px; cursor: pointer; letter-spacing: .01em; }
button:hover { background: rgba(255, 255, 255, .08); }
button:focus-visible { outline: 2px solid #ffc46b; outline-offset: 1px; }
button[aria-pressed="true"] { background: rgba(255, 196, 107, .18); color: #ffd48a; }
.btn { padding: 9px 12px; }
.wrap::before, .wrap::after { content: ""; position: absolute; left: 0; right: 0; height: 120px; pointer-events: none; }
.wrap::before { top: 0; background: linear-gradient(rgba(6, 9, 18, .55), transparent); }
.wrap::after { bottom: 0; background: linear-gradient(transparent, rgba(6, 9, 18, .6)); }
.hint { color: #8f9bb3; font-size: 11px; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; transition: opacity .6s; }
.hint.hide { opacity: 0; }
.err { position: absolute; inset: 0; display: grid; place-items: center; padding: 24px; text-align: center; color: #ffb4b4; background: #0a0f1e; }
/* Painel inferior (dock) */
.dock { position: absolute; left: 10px; right: 10px; bottom: 10px; max-height: min(48%, 372px); display: flex; flex-direction: column; overflow: hidden; z-index: 3; }
.dock[hidden] { display: none; }
.tabs { display: flex; gap: 2px; padding: 6px 6px 6px 8px; border-bottom: 1px solid rgba(255, 255, 255, .08); flex: none; align-items: center; }
.tabs button[role="tab"] { padding: 7px 12px; font-size: 12px; }
.tabs button[aria-selected="true"] { background: rgba(255, 196, 107, .16); color: #ffd48a; }
.tabs .spacer { flex: 1; }
.tabs .count { color: #8f9bb3; font-size: 11px; font-variant-numeric: tabular-nums; padding: 0 8px; white-space: nowrap; }
.tabs .collapse { width: 30px; height: 28px; padding: 0; display: grid; place-items: center; }
.pane { overflow: auto; padding: 10px; display: none; overscroll-behavior: contain; }
.pane.active { display: block; }
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(126px, 1fr)); gap: 8px; }
.tile .top { display: flex; align-items: center; justify-content: space-between; }
.tile .eyebrow { display: block; font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase; color: #8f9bb3; font-weight: 700; margin-bottom: 3px; }
.tile.on .eyebrow { color: #c9b48a; }
.tile { aspect-ratio: 1 / 1; min-height: 112px; border-radius: 14px; background: rgba(255, 255, 255, .05); border: 1px solid rgba(255, 255, 255, .08); color: #d5dcea;
  display: flex; flex-direction: column; justify-content: space-between; align-items: stretch; padding: 10px; text-align: left; position: relative; transition: background .2s, border-color .2s, transform .1s; }
.tile:hover { background: rgba(255, 255, 255, .09); }
.tile:active { transform: scale(.98); }
.tile .ico { width: 22px; height: 22px; color: #6b768f; display: flex; transition: color .25s, filter .25s; }
.tile .ico svg { width: 22px; height: 22px; }
.tile b { display: block; font-size: 13px; font-weight: 700; line-height: 1.2; color: #eef2f8; }
.tile small { display: block; color: #8f9bb3; font-size: 11px; margin-top: 2px; line-height: 1.25; }
.tile.on { background: rgba(255, 196, 107, .15); border-color: rgba(255, 196, 107, .45); }
.tile.on .ico { color: var(--dot, #ffc46b); filter: drop-shadow(0 0 6px var(--dot, #ffc46b)); }
.tile.on small { color: #dfe6f3; }
.tile.unavailable { opacity: .45; }
.tile.flash { box-shadow: 0 0 0 2px #ffd48a inset; }
.tile .more { width: 26px; height: 22px; padding: 0; border-radius: 7px; background: rgba(255, 255, 255, .08); color: #c9d2e3; font-size: 14px; line-height: 22px; text-align: center; letter-spacing: .05em; cursor: pointer; }
.tile .more:hover { background: rgba(255, 255, 255, .18); }
.tile.routine { aspect-ratio: auto; min-height: 96px; justify-content: flex-start; gap: 8px; }
.tile.routine .ico { width: 30px; height: 30px; border-radius: 9px; background: rgba(255, 196, 107, .12); color: #ffd48a; display: grid; place-items: center; }
.tile.routine .ico svg { width: 18px; height: 18px; }
.tile.routine:hover { background: rgba(255, 196, 107, .1); border-color: rgba(255, 196, 107, .3); }
.detail { grid-column: 1 / -1; box-sizing: border-box; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; padding: 10px 12px; border-radius: 12px; background: rgba(255, 255, 255, .05); border: 1px solid rgba(255, 196, 107, .3); }
.detail[hidden] { display: none; }
.detail .dtitle { display: flex; align-items: center; gap: 8px; margin-right: auto; }
.detail .dtitle .ico { color: var(--dot, #ffc46b); display: flex; }
.detail .dtitle b { font-size: 13px; } .detail .dtitle small { color: #8f9bb3; font-size: 11px; display: block; }
.detail .close { width: 26px; height: 26px; padding: 0; border-radius: 7px; background: rgba(255, 255, 255, .08); }
.sw { width: 40px; height: 22px; border-radius: 999px; background: #2b3245; position: relative; padding: 0; border: 1px solid rgba(255, 255, 255, .1); transition: background .2s; flex: none; }
.sw::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #aab3c5; transition: transform .2s, background .2s; }
.sw[aria-checked="true"] { background: #ffb85a; border-color: #ffb85a; } .sw[aria-checked="true"]::after { transform: translateX(18px); background: #1a1200; }
.seg2 { display: inline-flex; gap: 2px; padding: 2px; background: rgba(255, 255, 255, .05); border-radius: 8px; }
.seg2 button { padding: 5px 8px; font-size: 11px; }
.timerseg .tlab { display: inline-flex; align-items: center; gap: 4px; padding: 0 6px 0 4px; font-size: 11px; color: #8f9bb3; }
.step { display: inline-flex; align-items: center; gap: 4px; }
.step button { width: 28px; height: 28px; padding: 0; border-radius: 7px; background: rgba(255, 255, 255, .06); font-size: 16px; line-height: 1; }
.step output { min-width: 40px; text-align: center; font-variant-numeric: tabular-nums; font-weight: 700; font-size: 13px; }
.mbtn { width: 32px; height: 28px; padding: 0; border-radius: 7px; background: rgba(255, 255, 255, .06); display: inline-grid; place-items: center; font-size: 15px; }
input[type="range"] { flex: 1; min-width: 110px; accent-color: #ffc46b; }
.swatches { display: flex; gap: 6px; } .swatch { width: 22px; height: 22px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, .18); padding: 0; }
.swatch:hover { transform: scale(1.12); }
.sect { margin: 4px 2px 8px; font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: #8f9bb3; font-weight: 700; display: flex; justify-content: space-between; align-items: baseline; }
.sect small { text-transform: none; letter-spacing: 0; font-weight: 500; font-size: 11px; }
.tiles + .sect { margin-top: 14px; }
.autos { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 6px 10px; }
.auto { display: grid; grid-template-columns: 22px 1fr auto auto; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 10px; background: rgba(255, 255, 255, .04); border: 1px solid rgba(255, 255, 255, .07); }
.auto .ico { color: #6b768f; display: flex; } .auto.on .ico { color: #ffd48a; filter: drop-shadow(0 0 5px #ffd48a); }
.auto b { display: block; font-size: 12.5px; font-weight: 600; } .auto small { color: #8f9bb3; font-size: 11px; }
.auto.off b { color: #9aa6bd; }
.auto .run { width: 30px; height: 26px; padding: 0; border-radius: 7px; background: rgba(255, 255, 255, .07); display: inline-grid; place-items: center; }
.autos .empty { color: #8f9bb3; font-size: 12px; padding: 6px 2px; }
.feed { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0 18px; }
.feed li { display: grid; grid-template-columns: 10px 1fr auto; gap: 10px; align-items: center; padding: 7px 4px; border-bottom: 1px solid rgba(255, 255, 255, .05); font-size: 12px; }
.feed .d { width: 8px; height: 8px; border-radius: 50%; background: #4b5468; } .feed li.on .d { background: var(--dot, #ffc46b); box-shadow: 0 0 6px var(--dot, #ffc46b); }
.feed b { font-weight: 600; } .feed time { color: #8f9bb3; font-variant-numeric: tabular-nums; font-size: 11px; text-align: right; }
.feed .empty { color: #8f9bb3; padding: 12px 4px; font-size: 12px; }
.reopen { position: absolute; left: 50%; bottom: 12px; transform: translateX(-50%); padding: 8px 14px; z-index: 3; }
.reopen[hidden] { display: none; }
/* Clima ao vivo — canto inferior direito, some quando o painel de automações abre por cima */
.weather { position: absolute; right: 10px; bottom: 10px; width: 168px; box-sizing: border-box; padding: 10px 12px; z-index: 3;
  display: flex; flex-direction: column; gap: 4px; transition: opacity .25s, transform .25s; }
.weather[hidden] { display: none; }
.weather.out { opacity: 0; transform: translateY(6px); pointer-events: none; }
.weather .wtop { display: flex; align-items: center; gap: 8px; }
.weather .wicon { width: 30px; height: 30px; color: #ffc46b; flex: none; display: flex; }
.weather .wicon svg { width: 30px; height: 30px; }
.weather .wtemp { font-size: 26px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
.weather .wtemp sup { font-size: 15px; font-weight: 600; opacity: .8; }
.weather .wcond { font-size: 12px; color: #c9d2e3; line-height: 1.25; }
.weather .wcity { font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; color: #8f9bb3; font-weight: 700; }
.weather .wmeta { display: flex; justify-content: space-between; font-size: 11px; color: #9aa6bd; font-variant-numeric: tabular-nums; margin-top: 2px; }
.weather .wupd { font-size: 10px; color: #6b768f; text-align: right; }
@media (max-width: 640px) {
  .weather { width: 140px; padding: 8px 10px; }
  .weather .wtemp { font-size: 22px; } .weather .wicon, .weather .wicon svg { width: 24px; height: 24px; }
}
@media (max-width: 640px) {
  .dock { height: 50%; left: 6px; right: 6px; bottom: 6px; }
  .tiles { grid-template-columns: repeat(auto-fill, minmax(98px, 1fr)); gap: 6px; }
  .tile { min-height: 96px; padding: 8px; border-radius: 12px; } .tile b { font-size: 12px; } .tile small { font-size: 10.5px; } .tile .eyebrow { font-size: 9px; }
  .tile.routine { grid-column: span 2; }
  .tabs button[role="tab"] { padding: 7px 8px; } .tabs .count { display: none; }
  .hud.top { flex-direction: column; align-items: stretch; gap: 6px; }

  .title { flex-direction: row; align-items: baseline; gap: 10px; padding: 6px 10px; }
  .title b { font-size: 14px; }
  .btns { flex-wrap: nowrap; justify-content: flex-start; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
  .btns::-webkit-scrollbar { display: none; }
  .btns > * { flex: none; }
  .btn { padding: 7px 10px; }
  .hint { display: none; }
}
@media (prefers-reduced-motion: reduce) { .tile, .tile .ico, .sw, .sw::after { transition: none; } }
`;

export class Casa3DCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = Object.assign({}, DEFAULT_CONFIG);
    this._lite = this._config.quality === 'leve';
    this._nightVision = true;
    this._state = {};          // key -> { on, state, attrs }
    this._lastChanged = {};    // key -> ISO da última mudança (do HA)
    this._activity = [];       // histórico: { key, state, ts }
    this._autos = []; this._autoLast = {};   // automações do HA
    this._panelOpen = false;
    this._items = new Map();   // key -> runtime (lights, meshes, chip)
    this._built = false;
    this._raf = 0;
    this._lastSig = '';
    this._mode = 'auto';
    this._night = true;
    this._clock = new THREE.Clock(false);
    this._hoverObj = null;
    this._reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ---- API Lovelace ----
  static getStubConfig() { return { title: 'Casa 3D' }; }
  getCardSize() { return 12; }
  getLayoutOptions() { return { grid_columns: 'full', grid_rows: 8, grid_min_rows: 5 }; }

  setConfig(config) {
    this._config = Object.assign({}, DEFAULT_CONFIG, config || {});
    this._lite = this._config.quality === 'leve';   // no HA a posição real vem de hass.config
    this._mode = ['auto', 'day', 'night'].includes(this._config.mode) ? this._config.mode : 'auto';
    this._nightVision = this._config.night_vision !== false;
    if (this._config.height) this.style.setProperty('--casa3d-height', String(this._config.height));
    if (this._built) {
      this._titleEl.textContent = this._config.title || 'Casa 3D';
      this._setLabels(!!this._config.labels);
      this._applyMode();
      this._lastSig = ''; if (this._hass) this._syncFromHass();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (this._built) this._syncFromHass();
  }
  get hass() { return this._hass; }

  entity(key) {
    const e = this._config.entities || {};
    return e[key] || DEFAULT_ENTITIES[key];
  }

  connectedCallback() {
    if (!this._built) this._build();
    this._start();
  }
  disconnectedCallback() { this._stop(); if (this._weatherTimer) clearInterval(this._weatherTimer); }

  // ---- Construção do DOM ----
  _build() {
    const root = this.shadowRoot;
    root.innerHTML = '';
    const style = document.createElement('style'); style.textContent = CSS; root.appendChild(style);
    const wrap = document.createElement('div'); wrap.className = 'wrap'; root.appendChild(wrap);
    const canvas = document.createElement('canvas'); canvas.tabIndex = 0; canvas.setAttribute('aria-label', 'Modelo 3D da casa'); wrap.appendChild(canvas);
    this._canvas = canvas;

    const top = document.createElement('div'); top.className = 'hud top'; wrap.appendChild(top);
    const title = document.createElement('div'); title.className = 'panel title';
    this._titleEl = document.createElement('b'); this._titleEl.textContent = this._config.title || 'Casa 3D';
    this._clockEl = document.createElement('span'); this._clockEl.className = 'clock'; this._clockEl.textContent = '—';
    this._subEl = document.createElement('span'); this._subEl.className = 'sub'; this._subEl.textContent = '—';
    title.append(this._titleEl, this._clockEl, this._subEl); top.appendChild(title);

    const btns = document.createElement('div'); btns.className = 'btns'; top.appendChild(btns);
    const seg = document.createElement('div'); seg.className = 'panel seg'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Iluminação ambiente');
    this._modeBtns = {};
    for (const [m, lbl] of [['auto', 'Auto'], ['day', 'Dia'], ['night', 'Noite']]) {
      const b = document.createElement('button'); b.textContent = lbl; b.dataset.mode = m;
      b.addEventListener('click', () => { this._mode = m; this._applyMode(); });
      seg.appendChild(b); this._modeBtns[m] = b;
    }
    btns.appendChild(seg);
    this._nvBtn = document.createElement('button'); this._nvBtn.className = 'panel btn'; this._nvBtn.textContent = 'Visão noturna';
    this._nvBtn.title = 'À noite, deixa a casa inteira visível (luz de lua)';
    this._nvBtn.addEventListener('click', () => { this._nightVision = !this._nightVision; this._applyMode(); });
    btns.appendChild(this._nvBtn);
    this._labelsBtn = document.createElement('button'); this._labelsBtn.className = 'panel btn'; this._labelsBtn.textContent = 'Rótulos';
    this._labelsBtn.addEventListener('click', () => this._setLabels(!this._labelsOn));
    btns.appendChild(this._labelsBtn);
    const reset = document.createElement('button'); reset.className = 'panel btn'; reset.textContent = 'Recentrar';
    reset.addEventListener('click', () => this._resetView());
    btns.appendChild(reset);
    this._roofBtn = document.createElement('button'); this._roofBtn.className = 'panel btn'; this._roofBtn.textContent = 'Telhado';
    this._roofBtn.addEventListener('click', () => this._setRoof(!this._roofOn));
    btns.appendChild(this._roofBtn);
    this._panelBtn = document.createElement('button'); this._panelBtn.className = 'panel btn'; this._panelBtn.textContent = 'Painel';
    this._panelBtn.addEventListener('click', () => this._setPanel(!this._panelOpen));
    btns.appendChild(this._panelBtn);

    this._hint = document.createElement('div'); this._hint.className = 'hint';
    this._hint.textContent = 'Arraste para girar · roda/pinça para zoom · clique num cômodo para acender';
    title.appendChild(this._hint);
    setTimeout(() => { if (!this._hint) return; this._hint.classList.add('hide'); setTimeout(() => { this._hint.hidden = true; }, 700); }, 9000);

    try {
      this._build3D(canvas);
    } catch (err) {
      const e = document.createElement('div'); e.className = 'err';
      e.textContent = 'Não foi possível iniciar o WebGL: ' + (err && err.message || err);
      wrap.appendChild(e);
      console.error('[casa3d-card]', err);
      return;
    }

    this._buildPanel(wrap);
    if (this._ro) this._ro.observe(this._dock);
    this._built = true;
    this._setLabels(!!this._config.labels);
    this._applyMode();
    this._setPanel(this._config.panel !== false);
    this._setRoof(!!this._config.roof);
    if (this._hass) this._syncFromHass();
    else this._applyDemoDefaults();
  }

  // ---- Cena 3D ----
  _build3D(canvas) {
    const M = materials();
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = this._lite ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;   // cena estática: sombras só recalculam quando algo muda
    this._renderer = renderer;

    const scene = new THREE.Scene();
    this._scene = scene;
    renderer.setClearColor(0x0a0f1e, 1);
    scene.fog = new THREE.Fog(0x0a0f1e, 45, 150);
    this._buildSky(scene, renderer);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    this._camera = camera;
    this._home = this._homeFor(1.6);
    camera.position.copy(this._home.pos); camera.lookAt(this._home.target);
    this._orbit = new Orbit(camera, canvas, this._home.target);
    this._orbit.onClick = (e) => this._onClick(e);
    this._orbit.onHover = (e) => this._onHover(e);

    // Luz ambiente (dia/noite). Um único direcional faz de sol (dia) e de lua (noite).
    this._hemi = new THREE.HemisphereLight(0xbfd8ff, 0x8a8070, 1.6); scene.add(this._hemi);
    this._amb = new THREE.AmbientLight(0x4a5a80, 0.25); scene.add(this._amb);
    this._sun = new THREE.DirectionalLight(0xfff0d2, 3.2);
    this._sunPos = new THREE.Vector3(-9, 22, 7); this._moonPos = new THREE.Vector3(11, 20, -9);
    this._sunCol = new THREE.Color(0xfff0d2); this._moonCol = new THREE.Color(0x8fa6d8);
    this._sun.position.copy(this._sunPos); this._sun.target.position.set(6.7, 0, 8.2);
    this._sun.castShadow = true;
    this._sun.shadow.mapSize.set(this._lite ? 1024 : 2048, this._lite ? 1024 : 2048);
    const sc = this._sun.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 70;
    this._sun.shadow.bias = -0.0005; this._sun.shadow.normalBias = 0.025;
    scene.add(this._sun); scene.add(this._sun.target);

    // Terreno (com o recorte da piscina)
    const gsh = new THREE.Shape();
    gsh.moveTo(-40, 40); gsh.lineTo(53, 40); gsh.lineTo(53, -56); gsh.lineTo(-40, -56); gsh.closePath();
    gsh.holes.push(this._poolShape());
    const ground = new THREE.Mesh(new THREE.ShapeGeometry(gsh), M.ground);
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

    this._clickables = []; this._labels = [];
    // Pisos (zonas)
    const TX = textures();
    const FLOOR = { quarto_casal: ['wood', 2.4], quarto: ['wood', 2.4], sala: ['tileWarm', 2.4], balcao: ['tileWarm', 2.4], varanda: ['tileTerra', 1.8],
      banheiro: ['tileCool', 1.8], dispensa: ['tileWarm', 1.8], garagem: ['concrete', 3], jardim: ['grass', 2.2], patio: ['asphalt', 3] };
    for (const [id, z] of Object.entries(ZONES)) {
      const [tk, tile] = FLOOR[id] || ['concrete', 3];
      const map = TX[tk].clone(); map.repeat.set(z.w / tile, z.d / tile);
      const tint = ['wood', 'tileWarm', 'tileCool', 'tileTerra', 'pavers'].includes(tk) ? 0xffffff : 0xdedede;
      const ao = this._makeAO(z.w, z.d);
      const mat = new THREE.MeshStandardMaterial({ color: tint, map, roughness: 0.9, bumpMap: map, bumpScale: 0.6, aoMap: ao, aoMapIntensity: 1.0 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(z.w, z.d), mat);
      m.rotation.x = -Math.PI / 2; m.position.set(z.x + z.w / 2, 0.004, z.z + z.d / 2); m.receiveShadow = true;   // pisos a 4 mm: tapetes (≥ 5 mm) ficam por cima sem z-fighting
      m.userData = { item: z.item || null, zone: id }; scene.add(m);
      if (z.item) this._clickables.push(m);
      if (z.label) { const s = this._makeLabel(z.label); s.position.set(z.lp[0], 3.35, z.lp[1]); scene.add(s); this._labels.push(s); }
    }
    this._buildWalls(scene, M);
    // Rodapés nas zonas internas
    for (const id of ['quarto_casal', 'quarto', 'sala', 'balcao', 'varanda', 'banheiro', 'dispensa']) {
      const z = ZONES[id], i = T / 2 + 0.012, hb = 0.09;
      scene.add(box(z.w - 2 * i, hb, 0.02, M.baseboard, z.x + z.w / 2, hb / 2, z.z + i, { cast: false }));
      scene.add(box(z.w - 2 * i, hb, 0.02, M.baseboard, z.x + z.w / 2, hb / 2, z.z + z.d - i, { cast: false }));
      scene.add(box(0.02, hb, z.d - 2 * i, M.baseboard, z.x + i, hb / 2, z.z + z.d / 2, { cast: false }));
      scene.add(box(0.02, hb, z.d - 2 * i, M.baseboard, z.x + z.w - i, hb / 2, z.z + z.d / 2, { cast: false }));
    }
    this._buildStreet(scene, M);
    this._buildPool(scene, M);
    this._buildFurniture(scene, M);

    // Luminárias + luzes
    for (const it of ITEMS) {
      const rt = this._items.get(it.key) || {}; this._items.set(it.key, rt);
      rt.lights = []; rt.fixtures = []; rt.target = 0; rt.level = 0; rt.color = new THREE.Color(it.color || 0xffffff);
      if (!it.fixtures) continue;
      for (const f of it.fixtures) {
        const L = new THREE.PointLight(rt.color, 0, f.d, 2);
        L.position.set(f.p[0], f.p[1], f.p[2]);
        if (f.shadow && !(this._lite && !['quarto', 'sala', 'garagem'].includes(it.key))) {
          L.castShadow = true; L.shadow.mapSize.set(this._lite ? 256 : 512, this._lite ? 256 : 512);
          L.shadow.bias = -0.004; L.shadow.normalBias = 0.03;
          L.shadow.camera.near = 0.15; L.shadow.camera.far = f.d + 1;
        }
        scene.add(L); rt.lights.push({ L, i: f.i });
        let mesh;
        if (f.under) {
          // refletor de parede: disco no lado interno da parede da piscina
          mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16), new THREE.MeshStandardMaterial({ color: 0xcfe6ff, emissive: 0x2f9dff, emissiveIntensity: 0 }));
          mesh.rotation.x = Math.PI / 2; mesh.position.set(f.p[0], f.p[1], f.p[2] - 0.12); mesh.castShadow = false;
        } else if (f.lamp) {
          mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), new THREE.MeshStandardMaterial({ color: 0xf6efe4, emissive: rt.color, emissiveIntensity: 0 }));
          mesh.position.set(f.p[0], f.p[1], f.p[2]);
          const base = box(0.18, 0.22, 0.18, M.dark, f.p[0], f.p[1] - 0.2, f.p[2]); scene.add(base);
        } else if (f.sconce) {
          mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.16), new THREE.MeshStandardMaterial({ color: 0xf2efe8, emissive: rt.color, emissiveIntensity: 0 }));
          mesh.position.set(f.p[0], f.p[1], f.p[2]);
        } else {
          // pendente: cabo + cúpula aberta + lâmpada
          mesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshStandardMaterial({ color: 0xfff6e6, emissive: rt.color, emissiveIntensity: 0 }));
          mesh.position.set(f.p[0], f.p[1], f.p[2]);
          const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.2, 0.17, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.6, side: THREE.DoubleSide }));
          shade.position.set(f.p[0], f.p[1] + 0.09, f.p[2]); shade.castShadow = false; shade.userData = { item: it.key }; scene.add(shade); this._clickables.push(shade);
          const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 6), M.dark); rod.position.set(f.p[0], f.p[1] + 0.3, f.p[2]); rod.castShadow = false; scene.add(rod);
        }
        mesh.userData = { item: it.key }; mesh.castShadow = false; scene.add(mesh);
        rt.fixtures.push(mesh); this._clickables.push(mesh);
        // Halo (bloom barato) na luminária
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: textures().glow, color: rt.color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        const gs = f.under ? 1.3 : f.lamp ? 0.9 : f.sconce ? 1.1 : 1.5;
        glow.scale.set(gs, gs, 1);
        if (f.under) glow.position.set(f.p[0], -0.1, f.p[2] + 0.25); else glow.position.copy(mesh.position);
        scene.add(glow); rt.glows = rt.glows || []; rt.glows.push({ sp: glow, base: f.under ? 0.3 : f.lamp ? 0.7 : 0.8 });
      }
    }

    this._buildRoof(scene, M);
    const stats = mergeStatic(scene);
    console.info(`[casa3d-card] malhas estáticas: ${stats.before} → ${stats.after} draw calls`);

    this._raycaster = new THREE.Raycaster();
    this._ndc = new THREE.Vector2();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(this);
    if (this._dock) this._ro.observe(this._dock);
    this._resize();
    renderer.shadowMap.needsUpdate = true;
  }

  // Domo de céu (dia/noite com crossfade), estrelas e mapa de ambiente para reflexos
  _buildSky(scene, renderer) {
    const T = textures();
    const geo = new THREE.SphereGeometry(130, 32, 16);
    this._skyNight = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: T.skyNight, side: THREE.BackSide, fog: false, depthWrite: false }));
    this._skyDay = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: T.skyDay, side: THREE.BackSide, fog: false, depthWrite: false, transparent: true, opacity: 0 }));
    this._skyDusk = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: T.skyDusk, side: THREE.BackSide, fog: false, depthWrite: false, transparent: true, opacity: 0 }));
    this._skyNight.renderOrder = -3; this._skyDusk.renderOrder = -2; this._skyDay.renderOrder = -1;
    this._skyNight.position.set(LOT.w / 2, 0, LOT.d / 2); this._skyDay.position.copy(this._skyNight.position); this._skyDusk.position.copy(this._skyNight.position);
    scene.add(this._skyNight, this._skyDusk, this._skyDay);
    const rnd = mulberry32(77), n = 700, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = rnd() * Math.PI * 2, ph = Math.acos(1 - rnd() * 0.9), r = 120;
      pos[i * 3] = LOT.w / 2 + r * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = r * Math.cos(ph); pos[i * 3 + 2] = LOT.d / 2 + r * Math.sin(ph) * Math.sin(th);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this._stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 0.55, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    scene.add(this._stars);
    // Ambiente (PMREM) a partir do próprio céu: reflexos na água/metais e luz difusa
    try {
      const pm = new THREE.PMREMGenerator(renderer);
      const envScene = new THREE.Scene();
      const dome = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: T.skyDay, side: THREE.BackSide }));
      const sun = new THREE.Mesh(new THREE.SphereGeometry(6, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      sun.position.set(-45, 90, 35); envScene.add(dome, sun);
      this._envDay = pm.fromScene(envScene, 0.04).texture;
      dome.material.map = T.skyNight; sun.visible = false;
      this._envNight = pm.fromScene(envScene, 0.04).texture;
      pm.dispose();
      scene.environment = this._envNight; scene.environmentIntensity = 0.35;
    } catch (e) { console.warn('[casa3d-card] sem environment map', e); }
  }

  // Rua e calçada na frente do lote
  _buildStreet(scene, M) {
    const TX = textures();
    const walk = new THREE.MeshStandardMaterial({ color: 0xbdbab2, map: TX.concrete.clone(), roughness: 1 }); walk.map.repeat.set(12, 1);
    scene.add(box(34, 0.12, 1.8, walk, LOT.w / 2, 0.06, LOT.d + 0.95, { cast: false }));
    scene.add(box(34, 0.14, 0.14, M.dark, LOT.w / 2, 0.07, LOT.d + 1.9, { cast: false }));
    const road = new THREE.MeshStandardMaterial({ color: 0x8d8c86, map: TX.asphalt.clone(), roughness: 1 }); road.map.repeat.set(14, 3);
    scene.add(box(46, 0.02, 7, road, LOT.w / 2, 0.005, LOT.d + 5.5, { cast: false }));
    for (let x = -12; x < 32; x += 3.2) scene.add(box(1.6, 0.012, 0.12, M.white, x, 0.02, LOT.d + 5.5, { cast: false }));
    for (const sx of [0.3, LOT.w - 0.3]) scene.add(box(0.06, 0.12, 0.6, M.dark, sx, 0.13, LOT.d + 0.95, { cast: false }));
  }

  // Telhado de telha cerâmica + forro (ligado pelo botão "Telhado")
  _buildRoof(scene, M) {
    const g = new THREE.Group(); g.visible = false; g.userData.keep = true; this._roof = g; scene.add(g);
    const tile = makeTex(256, (gc, s) => {
      gc.fillStyle = '#a4502c'; gc.fillRect(0, 0, s, s);
      const rnd = mulberry32(41), rows = 6, cols = 6, rh = s / rows, cw = s / cols;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = c * cw + (r % 2) * cw / 2, y = r * rh;
        gc.fillStyle = shade(0xb85f38, 0.86 + rnd() * 0.24); gc.beginPath(); gc.ellipse(x % s, y + rh * 0.55, cw * 0.48, rh * 0.5, 0, Math.PI, 0); gc.fill();
        gc.fillStyle = 'rgba(60,20,10,0.35)'; gc.fillRect(0, y, s, 2);
      }
      grain(gc, s, 42, 3000, 0.1, [90, 40, 20]);
    }); tile.repeat.set(2.2, 2.2);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tile, roughness: 0.9, bumpMap: tile, bumpScale: 0.4 });
    const slab = (za, zb, ridgeZ, y0, rise, xa, xb) => {
      // perfil no plano (z, y) extrudado ao longo de X, com espessura
      const sh = new THREE.Shape();
      const t = 0.14, pts = [[za, y0], [ridgeZ, y0 + rise], [zb, y0], [zb, y0 - t], [ridgeZ, y0 + rise - t], [za, y0 - t]];
      sh.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) sh.lineTo(x, y); sh.closePath();
      const geo = new THREE.ExtrudeGeometry(sh, { depth: xb - xa, bevelEnabled: false });
      const m = new THREE.Mesh(geo, roofMat); m.rotation.y = -Math.PI / 2; m.position.x = xb; m.castShadow = true; m.receiveShadow = true; g.add(m);
      const ridge = box(xb - xa, 0.1, 0.22, M.doorPanel, (xa + xb) / 2, y0 + rise + 0.02, ridgeZ); g.add(ridge);
      // oitões (triângulos nas pontas)
      for (const x of [xa + 0.4, xb - 0.4]) {
        const tri = new THREE.Shape(); tri.moveTo(-(za + 0.4), y0 - t); tri.lineTo(-ridgeZ, y0 + rise - t); tri.lineTo(-(zb - 0.4), y0 - t); tri.closePath();
        const tm = new THREE.Mesh(new THREE.ShapeGeometry(tri), M.wall); tm.rotation.y = Math.PI / 2; tm.position.x = x; tm.castShadow = true; g.add(tm);
      }
    };
    slab(-0.45, 6.65, 3.1, H, 1.55, -0.45, 12.95);
    // ala esquerda e garagem: cumeeira ao longo de Z (extrusão ao longo de Z)
    const slabZ = (xa, xb, ridgeX, y0, rise, za, zb) => {
      const sh = new THREE.Shape(); const t = 0.14;
      const pts = [[xa, y0], [ridgeX, y0 + rise], [xb, y0], [xb, y0 - t], [ridgeX, y0 + rise - t], [xa, y0 - t]];
      sh.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) sh.lineTo(x, y); sh.closePath();
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: zb - za, bevelEnabled: false }), roofMat); m.position.z = za; m.castShadow = true; m.receiveShadow = true; g.add(m);
      g.add(box(0.22, 0.1, zb - za, M.doorPanel, ridgeX, y0 + rise + 0.02, (za + zb) / 2));
      for (const z of [za + 0.4, zb - 0.4]) {
        const tri = new THREE.Shape(); tri.moveTo(xa + 0.4, y0 - t); tri.lineTo(ridgeX, y0 + rise - t); tri.lineTo(xb - 0.4, y0 - t); tri.closePath();
        const tm = new THREE.Mesh(new THREE.ShapeGeometry(tri), M.wall); tm.position.z = z; tm.castShadow = true; g.add(tm);
      }
    };
    slabZ(-0.45, 2.85, 1.2, H, 0.9, 6.35, 10.75);
    slabZ(-0.45, 3.45, 1.5, H, 0.95, 10.45, 16.45);
    // forro (teto) nas zonas internas
    for (const id of ['quarto_casal', 'quarto', 'sala', 'balcao', 'varanda', 'banheiro', 'dispensa', 'garagem']) {
      const z = ZONES[id]; const c = new THREE.Mesh(new THREE.PlaneGeometry(z.w, z.d), M.white);
      c.rotation.x = Math.PI / 2; c.position.set(z.x + z.w / 2, H - 0.02, z.z + z.d / 2); c.receiveShadow = true; g.add(c);
    }
  }

  _buildWalls(scene, M) {
    const wallX = (z, xa, xb, ops = [], h = H, mat = M.wall) => this._wallSeg(scene, M, 'x', z, xa, xb, ops, h, mat);
    const wallZ = (x, za, zb, ops = [], h = H, mat = M.wall) => this._wallSeg(scene, M, 'z', x, za, zb, ops, h, mat);
    // Bloco principal
    wallX(0, 0, 12.5, [{ a: 1.2, b: 2.4, t: 'window' }, { a: 4.4, b: 5.6, t: 'window' }, { a: 11.0, b: 12.0, t: 'window' }]);
    wallZ(0, 0, 16.0);
    wallZ(12.5, 0, 6.2);
    wallZ(3.6, 0, 4.2);
    wallZ(6.8, 0, 4.2);
    wallZ(10.3, 0, 2.2);
    wallX(4.2, 0, 12.5, [{ a: 1.0, b: 1.9, t: 'door' }, { a: 2.5, b: 3.3, t: 'window' }, { a: 4.1, b: 5.0, t: 'door' }, { a: 5.5, b: 6.4, t: 'window' }, { a: 7.4, b: 8.3, t: 'door' }, { a: 9.6, b: 12.2, t: 'glass' }]);
    // Varanda (parede externa com aberturas para a piscina)
    wallX(6.2, 0, 12.5, [{ a: 2.9, b: 3.8, t: 'door' }, { a: 4.6, b: 6.6, t: 'window' }, { a: 8.0, b: 12.0, t: 'glass' }]);
    // Ala esquerda: banheiro, dispensa
    wallZ(2.4, 6.2, 10.6, [{ a: 7.0, b: 7.9, t: 'door' }, { a: 9.3, b: 10.1, t: 'door' }]);
    wallX(8.8, 0, 2.4);
    wallX(10.6, 0, 3.0);
    // Garagem (aberta para o quintal, portão para a rua)
    wallZ(3.0, 10.6, 16.0, [{ a: 11.4, b: 15.4, t: 'open' }]);
    wallX(16.0, 0, 3.0, [{ a: 0.3, b: 2.7, t: 'gate' }]);
    // Muros do lote
    wallZ(LOT.w, 0, LOT.d, [], 2.2, M.lowWall);
    wallX(LOT.d, 3.0, LOT.w, [{ a: 5.6, b: 6.6, t: 'open' }], 1.8, M.lowWall);
    wallX(-0.05, -0.2, LOT.w, [], 2.2, M.lowWall);
  }

  // Segmento de parede ao longo de X (z fixo) ou Z (x fixo) com aberturas
  _wallSeg(scene, M, axis, c, a0, a1, ops, h, mat) {
    const put = (len, hh, thick, m, mid, y, opts) => {
      const mesh = axis === 'x' ? box(len, hh, thick, m, mid, y, c, opts) : box(thick, hh, len, m, c, y, mid, opts);
      scene.add(mesh); return mesh;
    };
    const seg = (a, b, y0, y1, m) => {
      if (b - a <= 0.001 || y1 - y0 <= 0.001) return;
      put(b - a, y1 - y0, T, m, (a + b) / 2, (y0 + y1) / 2);
      // tampa ligeiramente acima do topo (e com altura diferente por eixo) → sem faces coplanares
      if (Math.abs(y1 - h) < 0.001) put(b - a, 0.03, T + 0.03, M.wallCap, (a + b) / 2, h + (axis === 'x' ? 0.02 : 0.018), { cast: false });
    };
    const pane = (a, b, y0, y1) => put(b - a, y1 - y0, 0.02, M.glass, (a + b) / 2, (y0 + y1) / 2, { cast: false, receive: false });
    // batente: ombreiras + verga (e peitoril se y0 > 0)
    const frame = (a, b, y0, y1) => {
      put(0.06, y1 - y0, T + 0.06, M.frame, a + 0.03, (y0 + y1) / 2); put(0.06, y1 - y0, T + 0.06, M.frame, b - 0.03, (y0 + y1) / 2);
      put(b - a, 0.06, T + 0.06, M.frame, (a + b) / 2, y1 - 0.03);
      if (y0 > 0.01) put(b - a + 0.12, 0.04, T + 0.16, M.frame, (a + b) / 2, y0 + 0.02);
    };
    const mullion = (a, b, y0, y1) => put(0.04, y1 - y0, T + 0.02, M.frame, (a + b) / 2, (y0 + y1) / 2);
    let cur = a0;
    const sorted = [...ops].sort((p, q) => p.a - q.a);
    for (const o of sorted) {
      seg(cur, o.a, 0, h, mat);
      if (o.t === 'door') {
        seg(o.a, o.b, 2.1, h, mat); frame(o.a, o.b, 0, 2.1);
        put(o.b - o.a - 0.12, 2.02, 0.05, M.door, (o.a + o.b) / 2, 1.01);
        // almofadas da porta (dos dois lados)
        for (const side of [-1, 1]) for (const [py, ph] of [[1.5, 0.7], [0.62, 0.8]]) {
          const pm = put(o.b - o.a - 0.3, ph, 0.012, M.doorPanel, (o.a + o.b) / 2, py, { cast: false });
          if (axis === 'x') pm.position.z += side * 0.028; else pm.position.x += side * 0.028;
        }
        const hx = o.b - 0.2;
        const handle = axis === 'x' ? cyl(0.01, 0.01, 0.12, M.chrome, hx, 1.02, c + 0.05, 6) : cyl(0.01, 0.01, 0.12, M.chrome, c + 0.05, 1.02, hx, 6);
        handle.rotation.x = Math.PI / 2; handle.rotation.y = axis === 'x' ? 0 : Math.PI / 2; scene.add(handle);
      } else if (o.t === 'gate') {
        seg(o.a, o.b, 2.25, h, mat); frame(o.a, o.b, 0, 2.25);
        for (let y = 0.2; y < 2.15; y += 0.24) put(o.b - o.a - 0.12, 0.14, 0.04, M.steel, (o.a + o.b) / 2, y + 0.07, { cast: false });
      } else if (o.t === 'window') {
        seg(o.a, o.b, 0, 1.0, mat); seg(o.a, o.b, 2.15, h, mat); frame(o.a, o.b, 1.0, 2.15); pane(o.a, o.b, 1.0, 2.15); mullion(o.a, o.b, 1.0, 2.15);
      } else if (o.t === 'glass') {
        seg(o.a, o.b, 2.25, h, mat); frame(o.a, o.b, 0, 2.25); pane(o.a, o.b, 0, 2.25);
        const n = Math.max(1, Math.round((o.b - o.a) / 1.0)); for (let i = 1; i < n; i++) mullion(o.a + ((o.b - o.a) * i) / n - 0.02, o.a + ((o.b - o.a) * i) / n + 0.02, 0, 2.25);
      } else if (o.t === 'open') {
        seg(o.a, o.b, Math.min(h - 0.35, 2.3), h, mat);
      }
      cur = o.b;
    }
    seg(cur, a1, 0, h, mat);
  }

  // Contorno da piscina no plano XY da forma (y = -z); `grow` alarga o contorno
  _poolShape(grow = 0) {
    const r = POOL.r + grow, x0 = POOL.x0 - grow;
    const sh = new THREE.Shape();
    sh.moveTo(x0, -(POOL.zc - r));
    sh.lineTo(POOL.x1, -(POOL.zc - r));
    sh.absarc(POOL.x1, -POOL.zc, r, Math.PI / 2, -Math.PI / 2, true);
    sh.lineTo(x0, -(POOL.zc + r));
    sh.closePath();
    return sh;
  }

  _buildPool(scene, M) {
    // Deck com o recorte da piscina (forma no plano XY; y = -z)
    const pool = this._poolShape();
    const deck = new THREE.Shape();
    deck.moveTo(DECK.x, -DECK.z); deck.lineTo(DECK.x + DECK.w, -DECK.z);
    deck.lineTo(DECK.x + DECK.w, -(DECK.z + DECK.d)); deck.lineTo(DECK.x, -(DECK.z + DECK.d)); deck.closePath();
    deck.holes.push(pool);
    const deckMesh = new THREE.Mesh(new THREE.ShapeGeometry(deck), M.deck);
    deckMesh.rotation.x = -Math.PI / 2; deckMesh.position.y = 0.02; deckMesh.receiveShadow = true; scene.add(deckMesh);
    // Borda (anel de pedra clara em volta da água)
    const ring = this._poolShape(0.3); ring.holes.push(this._poolShape());
    const rim = new THREE.Mesh(new THREE.ShapeGeometry(ring), M.white);
    rim.rotation.x = -Math.PI / 2; rim.position.y = 0.035; rim.receiveShadow = true; rim.castShadow = false; scene.add(rim);
    // Bacia
    const basin = new THREE.Mesh(new THREE.ExtrudeGeometry(pool, { depth: POOL.depth, bevelEnabled: false }), [new THREE.MeshBasicMaterial({ visible: false }), M.basin]);
    basin.rotation.x = -Math.PI / 2; basin.position.y = -POOL.depth; basin.receiveShadow = true; basin.castShadow = false; scene.add(basin);
    const bottom = new THREE.Mesh(new THREE.ShapeGeometry(pool), M.basin);
    bottom.rotation.x = -Math.PI / 2; bottom.position.y = -POOL.depth + 0.01; bottom.receiveShadow = true; scene.add(bottom);
    // Água
    this._waterU = {
      time: { value: 0 }, normalMap: { value: textures().waterNormal }, caustic: { value: textures().caustics },
      sunDir: { value: new THREE.Vector3(0.3, 0.8, 0.5) }, sunColor: { value: new THREE.Color(0xfff0d2) }, sunIntensity: { value: 1 },
      skyTop: { value: new THREE.Color(0x5f9bdc) }, skyHorizon: { value: new THREE.Color(0xe6eef6) },
      deepColor: { value: new THREE.Color(0x0b3f78) }, shallowColor: { value: new THREE.Color(0x2a9bc0) },
      ledColor: { value: new THREE.Color(0x2a8cff) }, ledIntensity: { value: 0 },
      pool: { value: new THREE.Vector4(POOL.x0, POOL.x1, POOL.zc, POOL.r) },
      led1: { value: new THREE.Vector2(4.7, 8.34) }, led2: { value: new THREE.Vector2(6.5, 8.34) }, led3: { value: new THREE.Vector2(8.3, 8.34) },
    };
    this._waterMat = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, this._waterU]), vertexShader: WATER_VERT, fragmentShader: WATER_FRAG,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true });
    this._waterU = this._waterMat.uniforms;
    const water = new THREE.Mesh(new THREE.ShapeGeometry(pool), this._waterMat);
    water.rotation.x = -Math.PI / 2; water.position.y = -0.16; water.receiveShadow = true; water.castShadow = false;
    water.userData = { item: 'led_piscina' }; scene.add(water); this._clickables.push(water);
    // Escadas
    for (const x of [POOL.x0 + 0.3, POOL.x1 + 0.6]) {
      const rail = box(0.05, 0.6, 0.5, M.steel, x, 0.3, POOL.zc - POOL.r + 0.05); rail.castShadow = false; scene.add(rail);
    }
    // Casa de máquinas / bomba
    const pumpRt = this._items.get('bomba_piscina') || {}; this._items.set('bomba_piscina', pumpRt);
    const pump = box(0.6, 0.5, 0.45, M.pump, 11.35, 0.25, 12.9); pump.userData = { item: 'bomba_piscina' }; scene.add(pump); this._clickables.push(pump);
    const pipe = box(0.08, 0.08, 1.2, M.steel, 11.1, 0.12, 12.1); pipe.castShadow = false; scene.add(pipe);
    pumpRt.led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshStandardMaterial({ color: 0x1b3d2a, emissive: 0x22c55e, emissiveIntensity: 0 }));
    pumpRt.led.position.set(11.35, 0.52, 12.72); pumpRt.led.castShadow = false; scene.add(pumpRt.led);
    pumpRt.fixtures = [pump];
  }

  _buildFurniture(scene, M) {
    const F = furniture(M);
    const place = (g, x, z, ry = 0, y = 0) => { g.position.set(x, y, z); g.rotation.y = ry; scene.add(g); return g; };
    // materiais iguais (mesmas opções) viram o mesmo objeto → menos draw calls depois do mergeStatic
    const matCache = new Map();
    const std = (o) => {
      const opts = Object.assign({ roughness: 0.9, metalness: 0 }, o || {});
      let key = null; try { key = JSON.stringify(opts, (k, v) => (v && v.isColor) ? '#' + v.getHexString() : v); } catch (_) { key = null; }
      if (key && matCache.has(key)) return matCache.get(key);
      const m = new THREE.MeshStandardMaterial(opts); if (key) matCache.set(key, m); return m;
    };
    const Fx = Object.assign({}, F, { ladder: () => new THREE.Group() });   // sem escadas na piscina
    const ctx = (seed) => ({ THREE, M, F: Fx, box, cyl, sph, std, place, add: (m) => scene.add(m), rnd: mulberry32(seed), POOL, DECK, LOT, ZONES, H, T });
    // Objetos ligados a entidades ficam fora da decoração dos cômodos
    // TV na parede do quarto (entidade media_player)
    const tvRt = this._items.get('tv') || {}; this._items.set('tv', tvRt);
    scene.add(box(0.05, 0.64, 1.08, M.dark, 6.7, 1.45, 2.1));
    tvRt.screenMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, emissive: 0x9db6ff, emissiveIntensity: 0, roughness: 0.3 });
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.56, 1.0), tvRt.screenMat); screen.position.set(6.66, 1.45, 2.1); screen.castShadow = false;
    screen.userData = { item: 'tv' }; scene.add(screen); this._clickables.push(screen); tvRt.fixtures = [screen];
    tvRt.light = new THREE.PointLight(0x9db6ff, 0, 3.5, 2); tvRt.light.position.set(6.4, 1.45, 2.1); scene.add(tvRt.light);
    // Ar-condicionado (entidade climate)
    const acRt = this._items.get('ac') || {}; this._items.set('ac', acRt);
    const ac = box(0.95, 0.3, 0.22, M.white, 7.6, 2.35, 0.2); ac.userData = { item: 'ac' }; scene.add(ac); this._clickables.push(ac); acRt.fixtures = [ac];
    scene.add(box(0.85, 0.05, 0.02, M.steel, 7.6, 2.24, 0.315));
    acRt.ledMat = new THREE.MeshStandardMaterial({ color: 0x0a2a3a, emissive: 0x67d3ff, emissiveIntensity: 0 });
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.02), acRt.ledMat); led.position.set(7.9, 2.31, 0.32); led.castShadow = false; scene.add(led);
    // Carro na garagem (cor em `car_color`)
    place(F.upTsi(new THREE.Color(this._config.car_color || '#f3f3f0')), 1.5, 13.6);

    // Decoração por cômodo (funções room*, no topo do arquivo)
    // @room quarto_casal
    roomQuartoCasal(ctx(11));
    // @endroom
    // @room quarto
    roomQuarto(ctx(12));
    // @endroom
    // @room sala_cozinha
    roomSalaCozinha(ctx(13));
    // @endroom
    // @room varanda_piscina
    roomVarandaPiscina(ctx(14));
    // @endroom
    // @room banheiro_dispensa
    roomBanheiroDispensa(ctx(15));
    // @endroom
    // @room garagem_jardim
    roomGaragemJardim(ctx(16));
    // @endroom
  }

  // Sombra suave junto às paredes (AO falsa): textura branca com bordas escurecidas
  _makeAO(w, d) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128);
    const fx = Math.min(0.45, 0.55 / w) * 128, fz = Math.min(0.45, 0.55 / d) * 128;
    const strip = (x0, y0, x1, y1, gx0, gy0, gx1, gy1) => { const gr = g.createLinearGradient(gx0, gy0, gx1, gy1); gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0); };
    strip(0, 0, fx, 128, 0, 0, fx, 0); strip(128 - fx, 0, 128, 128, 128, 0, 128 - fx, 0);
    strip(0, 0, 128, fz, 0, 0, 0, fz); strip(0, 128 - fz, 128, 128, 0, 128, 0, 128 - fz);
    const t = new THREE.CanvasTexture(c); t.channel = 0; return t;
  }

  _makeWaterTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#2b6fb6'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(200,232,255,0.55)'; g.lineWidth = 2.4; g.lineJoin = 'round';
    const rnd = mulberry32(11);
    for (let i = 0; i < 26; i++) {
      const cx = rnd() * 256, cy = rnd() * 256, r = 10 + rnd() * 26, k = 2 + Math.floor(rnd() * 3), ph = rnd() * 6;
      for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) {
        g.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.2) {
          const rr = r * (0.78 + 0.28 * Math.sin(a * k + ph));
          const x = cx + ox + Math.cos(a) * rr, y = cy + oy + Math.sin(a) * rr;
          a === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.stroke();
      }
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.4, 1.3); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  _makeLabel(text) {
    const c = document.createElement('canvas'); const s = 2; c.width = 320 * s; c.height = 72 * s;
    const g = c.getContext('2d'); g.scale(s, s);
    g.font = '600 24px -apple-system, BlinkMacSystemFont, Roboto, "Segoe UI", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.lineWidth = 7; g.strokeStyle = 'rgba(6,10,20,.9)'; g.strokeText(text, 160, 36);
    g.fillStyle = '#ffffff'; g.fillText(text, 160, 36);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false }));
    sp.scale.set(3.0, 0.675, 1); sp.renderOrder = 20;
    return sp;
  }

  // ---- Estado ----
  _applyDemoDefaults() {
    for (const it of ITEMS) this._setItemState(it.key, { state: 'off', attrs: {} });
    this._refreshSub(); this._renderPanel();
  }

  _syncFromHass() {
    const hass = this._hass; if (!hass || !hass.states) return;
    const sig = ITEMS.map((it) => { const s = hass.states[this.entity(it.key)]; return s ? s.state + '|' + JSON.stringify(s.attributes && (s.attributes.rgb_color || s.attributes.current_temperature || s.attributes.temperature || s.attributes.hvac_action) || '') : 'x'; }).join(';')
      + '|' + (hass.states[this.entity('sun')] || {}).state;
    if (sig === this._lastSig) return;
    this._lastSig = sig;
    const seeded = !!this._activitySeeded;
    for (const it of ITEMS) {
      const s = hass.states[this.entity(it.key)];
      const prev = this._state[it.key];
      const next = s ? { state: s.state, attrs: s.attributes || {} } : { state: 'unavailable', attrs: {} };
      if (seeded && prev && prev.state !== next.state && next.state !== 'unavailable') this._pushActivity(it.key, next.state, Date.now());
      this._setItemState(it.key, next);
      if (s && s.last_changed) this._lastChanged[it.key] = s.last_changed;
    }
    // Automações do HA: descobertas pelo domínio; disparos entram na atividade
    const autos = [];
    for (const st of Object.values(hass.states)) {
      if (!st.entity_id || !st.entity_id.startsWith('automation.')) continue;
      const a = st.attributes || {}; const last = a.last_triggered ? new Date(a.last_triggered).getTime() : 0;
      autos.push({ id: st.entity_id, name: a.friendly_name || st.entity_id.slice(11), on: st.state === 'on', last });
      const prevLast = this._autoLast[st.entity_id];
      if (seeded && prevLast !== undefined && last && last !== prevLast) this._pushActivity(st.entity_id, 'triggered', last);
      this._autoLast[st.entity_id] = last;
    }
    autos.sort((x, y) => y.last - x.last);
    this._autos = autos;
    if (!seeded) {
      for (const a of autos) if (a.last) this._pushActivity(a.id, 'triggered', a.last, true);
      // Semente do histórico: última mudança de cada entidade, conforme o HA reporta
      for (const it of ITEMS) { const st = this._state[it.key]; if (st && !st.unavailable && this._lastChanged[it.key]) this._pushActivity(it.key, st.state, new Date(this._lastChanged[it.key]).getTime(), true); }
      this._activitySeeded = true;
    }
    this._renderPanel();
    this._timeAt = 0;
    this._applyMode();
    this._refreshSub();
  }

  _setItemState(key, { state, attrs }) {
    const it = ITEMS.find((i) => i.key === key); const rt = this._items.get(key); if (!it || !rt) return;
    const unavailable = state === 'unavailable' || state === 'unknown';
    let on = false, val = '';
    if (it.kind === 'light' || it.kind === 'switch') on = state === 'on';
    else if (it.kind === 'climate') {
      on = !unavailable && state !== 'off';
      const mode = { cool: 'Frio', heat: 'Quente', heat_cool: 'Auto', fan_only: 'Ventilar', dry: 'Seco', auto: 'Auto', off: 'Desligado' }[state] || state;
      const t = attrs.temperature, cur = attrs.current_temperature;
      val = unavailable ? 'indisponível' : (on ? `${mode}${t != null ? ' · ' + t + '°' : ''}` : 'Desligado') + (cur != null ? ` · ${cur}° atual` : '');
    } else if (it.kind === 'media') {
      on = state === 'playing' || state === 'on' || state === 'paused';
      val = unavailable ? 'indisponível' : ({ playing: 'Tocando', paused: 'Pausado', idle: 'Ociosa', off: 'Desligada', standby: 'Standby', on: 'Ligada' }[state] || state);
      if (state === 'playing' && attrs.media_title) val = attrs.media_title;
    } else if (it.kind === 'sensor') {
      if (it.key === 'presenca') { on = state === 'on'; val = unavailable ? 'indisponível' : on ? 'alguém no quarto' : 'ninguém'; }
      else if (it.key === 'pessoa') { on = state === 'home'; val = unavailable ? 'indisponível' : state === 'home' ? 'em casa' : state === 'not_home' ? 'fora' : state; }
      else { on = !unavailable && +state > 5; val = unavailable ? 'indisponível' : `${Math.round(+state)} lx`; }
    }
    if ((it.kind === 'light' || it.kind === 'switch') && unavailable) val = 'indisponível';
    this._state[key] = { on, state, attrs, unavailable };
    rt.target = on ? 1 : 0;
    if (it.rgb) {
      const rgb = attrs.rgb_color;
      const c = rgb ? new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255) : new THREE.Color(it.color);
      const bright = attrs.brightness != null ? clamp(attrs.brightness / 255, 0.15, 1) : 1;
      rt.color.copy(c); rt.brightScale = bright;
      for (const f of rt.fixtures || []) f.material.emissive.copy(c);
    }
    if (it.kind === 'climate') { rt.hvac = state; rt.on = on; }
    this._state[key].text = val;
    this._needShadow = true;
  }

  _refreshSub() {
    const lights = ITEMS.filter((i) => i.kind === 'light');
    const n = lights.filter((i) => this._state[i.key] && this._state[i.key].on).length;
    const hasHass = !!this._hass;
    this._subEl.textContent = `${n} de ${lights.length} luzes acesas` + (hasHass ? '' : ' · demo');
    this._renderPanel();
  }

  // Relógio + sol: hora local (ou simulada), elevação/azimute (do HA quando houver)
  _updateTime(force = false) {
    const now = Date.now();
    if (!force && this._timeAt && now - this._timeAt < 1000) return;
    this._timeAt = now;
    const cfg = this._config, hc = this._hass && this._hass.config;
    const lat = hc && hc.latitude != null ? hc.latitude : cfg.latitude, lon = hc && hc.longitude != null ? hc.longitude : cfg.longitude;
    const tz = (hc && hc.time_zone) || cfg.timezone;
    const date = this._simTime ? new Date(this._simTime) : new Date(now);
    let sun = null;
    const hs = this._hass && this._hass.states && this._hass.states[this.entity('sun')];
    if (!this._simTime && hs && hs.attributes && hs.attributes.elevation != null) sun = { elevation: +hs.attributes.elevation, azimuth: +hs.attributes.azimuth };
    else sun = solarPosition(date, lat, lon);
    this._sunInfo = sun;
    let per; const el = sun.elevation;
    let hour = date.getHours();
    try { hour = +new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(date); } catch (_) {}
    if (el > 6) per = hour < 12 ? 'Manhã' : 'Tarde'; else if (el > -4) per = hour < 12 ? 'Amanhecer' : 'Entardecer'; else per = hour < 5 || hour >= 22 ? 'Noite' : hour < 12 ? 'Madrugada' : 'Noite';
    let txt = '';
    try { txt = new Intl.DateTimeFormat('pt-BR', { timeZone: tz, weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date); } catch (_) { txt = date.toLocaleString('pt-BR'); }
    txt = txt.replace(/\.,?/g, '').replace(/, /g, ' · ');
    // nascer/pôr do sol do dia (varredura de 5 em 5 min; recalcula uma vez por dia)
    const dayKey = Math.floor((date.getTime() - 3 * 3600000) / 86400000);
    if (this._sunDay !== dayKey) {
      this._sunDay = dayKey; let rise = null, set = null, prev = null;
      const d0 = new Date(date); d0.setHours(0, 0, 0, 0);
      for (let m = 0; m <= 1440; m += 5) { const el2 = solarPosition(new Date(d0.getTime() + m * 60000), lat, lon).elevation; if (prev !== null) { if (prev < -0.83 && el2 >= -0.83) rise = d0.getTime() + m * 60000; if (prev >= -0.83 && el2 < -0.83) set = d0.getTime() + m * 60000; } prev = el2; }
      this._sunTimes = { rise, set };
    }
    const stt = this._sunTimes || {};
    const sunTxt = stt.rise && stt.set ? ` · ☀ ${fmtClock(stt.rise)}–${fmtClock(stt.set)}` : '';
    if (this._clockEl) this._clockEl.innerHTML = `${txt} · <span class="per">${per}${this._simTime ? ' · simulado' : ''}</span><span class="suntimes">${sunTxt}</span>`;
  }
  setSimTime(date) { this._simTime = date ? new Date(date).getTime() : null; this._updateTime(true); this._orbit.dirty = true; }
  _applyMode() {
    this._updateTime(true);
    const el = this._sunInfo ? this._sunInfo.elevation : -20;
    const night = this._mode === 'night' ? true : this._mode === 'day' ? false : el < 1;
    this._night = night;
    for (const [m, b] of Object.entries(this._modeBtns)) b.setAttribute('aria-pressed', m === this._mode ? 'true' : 'false');
    this._nvBtn.setAttribute('aria-pressed', this._nightVision ? 'true' : 'false');
    this._nvBtn.disabled = !night; this._nvBtn.style.opacity = night ? '' : '.55';
    this._needShadow = true;
  }

  _setLabels(on) {
    this._labelsOn = on;
    for (const s of this._labels || []) s.visible = on;
    this._labelsBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  // Posição inicial da câmera: em telas estreitas (retrato) afasta para caber o lote inteiro
  _homeFor(aspect) {
    const target = new THREE.Vector3(6.7, 0, 8.6);
    const dir = new THREE.Vector3(1.8, 17.5, 14.3).normalize();
    const k = aspect >= 1.25 ? 1 : Math.pow(1.25 / Math.max(aspect, 0.3), 0.8);
    return { pos: target.clone().addScaledVector(dir, 22.7 * k), target };
  }
  _setRoof(on) {
    this._roofOn = !!on;
    if (this._roof) this._roof.visible = this._roofOn;
    this._roofBtn.setAttribute('aria-pressed', this._roofOn ? 'true' : 'false');
    this._needShadow = true; this._orbit.dirty = true;
  }
  _resetView() { this._home = this._homeFor(this._camera.aspect); this._orbit.reset(this._home.pos, this._home.target); this._orbit.touched = false; }

  // ---- Ações ----
  _activate(key) {
    const it = ITEMS.find((i) => i.key === key); if (!it) return;
    const eid = this.entity(key);
    const hass = this._hass;
    if (it.kind === 'light' || it.kind === 'switch') {
      // Otimista: acende já, o HA confirma em seguida
      const st = this._state[key] || { on: false, attrs: {} };
      if (!st.unavailable) this._setItemState(key, { state: st.on ? 'off' : 'on', attrs: st.attrs });
      this._refreshSub(); this._renderPanel();
      if (hass && hass.callService) hass.callService('homeassistant', 'toggle', { entity_id: eid });
    } else {
      this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: eid }, bubbles: true, composed: true }));
    }
    this._lastSig = '';
  }

  _pick(e) {
    const r = this._canvas.getBoundingClientRect();
    this._ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this._raycaster.setFromCamera(this._ndc, this._camera);
    const hits = this._raycaster.intersectObjects(this._clickables, false);
    return hits.length ? hits[0].object : null;
  }
  _onClick(e) { const o = this._pick(e); if (o && o.userData.item) { this._activate(o.userData.item); this._flashRow(o.userData.item); } }
  _onHover(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const o = this._pick(e);
    this._canvas.classList.toggle('pick', !!o);
    if (o !== this._hoverObj) {
      if (this._hoverObj && this._hoverObj.userData.zone) this._hoverObj.material.emissive.setHex(0x000000);
      if (o && o.userData.zone) o.material.emissive.setHex(0x1a1a1a);
      this._hoverObj = o; this._orbit.dirty = true;
    }
  }

  // ---- Painel inferior: cômodos (blocos), rotinas, atividade ----
  _svc(domain, service, entity, data) {
    const payload = Object.assign({ entity_id: entity }, data || {});
    if (this._hass && this._hass.callService) this._hass.callService(domain, service, payload);
    this._lastSig = '';
  }
  _sceneCtx() {
    return { e: (k) => this.entity(k), on: (k) => this._svc('homeassistant', 'turn_on', this.entity(k)), off: (k) => this._svc('homeassistant', 'turn_off', this.entity(k)), call: (d, sv, e, data) => this._svc(d, sv, e, data) };
  }
  _dotColor(key) { return { led_piscina: '#5b9bff', bomba_piscina: '#4ade80', ac: '#67d3ff', tv: '#c4b5fd', presenca: '#f472b6', lux: '#fde68a', pessoa: '#86efac' }[key] || '#ffc46b'; }
  // Temporizador local: desliga a entidade depois de N minutos (enquanto o cartão estiver aberto)
  _setTimer(key, minutes) {
    const cur = this._timers[key]; if (cur) { clearTimeout(cur.handle); delete this._timers[key]; }
    if (minutes > 0) {
      const at = Date.now() + minutes * 60000;
      const handle = setTimeout(() => { delete this._timers[key]; this._svc('homeassistant', 'turn_off', this.entity(key)); this._pushActivity(key, 'off', Date.now()); this._renderPanel(); }, minutes * 60000);
      this._timers[key] = { at, handle };
    }
    this._renderPanel();
  }
  _timerText(key, now = Date.now()) {
    const t = this._timers[key]; if (!t) return '';
    const m = Math.max(1, Math.round((t.at - now) / 60000)); return ` · desliga em ${m} min`;
  }
  _setPanel(open) {
    this._panelOpen = !!open;
    this._dock.hidden = !open; this._reopen.hidden = !!open;
    if (this._weatherEl) this._weatherEl.classList.toggle('out', !!open);
    this._panelBtn.setAttribute('aria-pressed', open ? 'true' : 'false');
    if (open) this._renderPanel();
    requestAnimationFrame(() => this._resize());
  }
  _buildPanel(wrap) {
    this._wrap = wrap;
    const dock = document.createElement('div'); dock.className = 'panel dock'; dock.hidden = true; wrap.appendChild(dock); this._dock = dock;
    const tabs = document.createElement('div'); tabs.className = 'tabs'; tabs.setAttribute('role', 'tablist'); dock.appendChild(tabs);
    this._panes = {};
    const panes = [];
    for (const [id, label] of [['ctl', 'Cômodos'], ['scn', 'Automações'], ['act', 'Atividade']]) {
      const b = document.createElement('button'); b.textContent = label; b.setAttribute('role', 'tab'); b.dataset.tab = id;
      b.addEventListener('click', () => this._showTab(id)); tabs.appendChild(b);
      const pane = document.createElement('div'); pane.className = 'pane'; pane.dataset.pane = id; panes.push(pane);
      this._panes[id] = { btn: b, pane };
    }
    const spacer = document.createElement('div'); spacer.className = 'spacer'; tabs.appendChild(spacer);
    this._countEl = document.createElement('span'); this._countEl.className = 'count'; tabs.appendChild(this._countEl);
    const col = document.createElement('button'); col.className = 'collapse'; col.title = 'Recolher painel'; col.setAttribute('aria-label', 'Recolher painel');
    col.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l5 5 5-5"/></svg>';
    col.addEventListener('click', () => this._setPanel(false)); tabs.appendChild(col);
    for (const pane of panes) dock.appendChild(pane);
    this._reopen = document.createElement('button'); this._reopen.className = 'panel btn reopen'; this._reopen.textContent = 'Painel ▴'; this._reopen.hidden = true;
    this._reopen.addEventListener('click', () => this._setPanel(true)); wrap.appendChild(this._reopen);
    this._buildWeather(wrap);

    // Cômodos: blocos quadrados agrupados por ambiente
    this._tiles = {};
    const grid = document.createElement('div'); grid.className = 'tiles'; this._panes.ctl.pane.appendChild(grid); this._grid = grid;
    this._detail = document.createElement('div'); this._detail.className = 'detail'; this._detail.hidden = true; grid.appendChild(this._detail);
    const ROOMS = [['Quarto', ['quarto', 'led_quarto', 'tv', 'presenca', 'lux']], ['Sala / Cozinha', ['sala', 'balcao', 'ac']], ['Externa', ['externa', 'banheiro', 'garagem']], ['Piscina', ['led_piscina', 'bomba_piscina']], ['Casa', ['pessoa']]];
    for (const [title, keys] of ROOMS) for (const k of keys) grid.appendChild(this._makeTile(ITEMS.find((i) => i.key === k), title));
    this._timers = {};
    // Automações: rotinas rápidas do cartão + automações do HA (descobertas sozinhas)
    const h1 = document.createElement('div'); h1.className = 'sect'; h1.textContent = 'Rotinas rápidas'; this._panes.scn.pane.appendChild(h1);
    const rgrid = document.createElement('div'); rgrid.className = 'tiles'; this._panes.scn.pane.appendChild(rgrid);
    const h2 = document.createElement('div'); h2.className = 'sect'; h2.innerHTML = 'Automações do Home Assistant <small>ligar/desligar · executar agora</small>'; this._panes.scn.pane.appendChild(h2);
    this._autoList = document.createElement('div'); this._autoList.className = 'autos'; this._panes.scn.pane.appendChild(this._autoList);
    for (const sc of SCENES) {
      const b = document.createElement('button'); b.className = 'tile routine';
      b.innerHTML = `<span class="ico">${iconSvg(sc.icon)}</span><span><b>${sc.name}</b><small>${sc.desc}</small></span>`;
      b.addEventListener('click', () => { sc.run(this._sceneCtx()); b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 700); });
      rgrid.appendChild(b);
    }
    // Atividade
    this._feed = document.createElement('ul'); this._feed.className = 'feed'; this._panes.act.pane.appendChild(this._feed);
    this._showTab('ctl');
    this._feedTimer = setInterval(() => { if (this._panelOpen) this._renderPanel(); this._updateTime(true); }, 30000);
  }
  // Clima ao vivo (Open-Meteo, sem chave) — atualiza a cada 15 min
  _buildWeather(wrap) {
    if (!this._config.weather) return;
    const w = document.createElement('div'); w.className = 'panel weather'; wrap.appendChild(w); this._weatherEl = w;
    const top = document.createElement('div'); top.className = 'wtop';
    const ico = document.createElement('span'); ico.className = 'wicon'; ico.innerHTML = iconSvg('cloudsun');
    const temp = document.createElement('span'); temp.className = 'wtemp'; temp.textContent = '—';
    top.append(ico, temp); w.appendChild(top);
    const city = document.createElement('div'); city.className = 'wcity'; city.textContent = this._config.weather_city || 'Local';
    const cond = document.createElement('div'); cond.className = 'wcond'; cond.textContent = 'Carregando…';
    const meta = document.createElement('div'); meta.className = 'wmeta';
    const upd = document.createElement('div'); upd.className = 'wupd'; upd.textContent = '';
    w.append(city, cond, meta, upd);
    this._weatherUI = { ico, temp, cond, meta, upd };
    this._fetchWeather();
    this._weatherTimer = setInterval(() => this._fetchWeather(), 15 * 60000);
  }
  async _fetchWeather() {
    const ui = this._weatherUI; if (!ui) return;
    const lat = this._config.latitude, lon = this._config.longitude;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&timezone=auto`;
    try {
      const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, { signal: ctrl.signal }); clearTimeout(to);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json(); const c = j.current; if (!c) throw new Error('sem dados');
      const [iconKey, desc] = WEATHER_CODE[c.weather_code] || ['cloud', '—'];
      const icon = !c.is_day && iconKey === 'sun' ? 'moon' : !c.is_day && iconKey === 'cloudsun' ? 'cloud' : iconKey;
      ui.ico.innerHTML = iconSvg(icon);
      ui.temp.innerHTML = `${Math.round(c.temperature_2m)}<sup>°C</sup>`;
      ui.cond.textContent = desc;
      ui.meta.innerHTML = `<span>sensação ${Math.round(c.apparent_temperature)}°</span><span>${Math.round(c.wind_speed_10m)} km/h</span>`;
      ui.upd.textContent = `atualizado ${fmtClock(Date.now())}`;
      this._weatherOk = true;
    } catch (err) {
      if (!this._weatherOk) { ui.cond.textContent = 'Indisponível'; ui.upd.textContent = 'sem conexão'; }
      console.warn('[casa3d-card] clima indisponível:', err && err.message);
    }
  }
  _showTab(id) {
    for (const [k, t] of Object.entries(this._panes)) { t.btn.setAttribute('aria-selected', k === id ? 'true' : 'false'); t.pane.classList.toggle('active', k === id); }
  }
  _hasDetail(it) { return it.kind !== 'sensor'; }
  _makeTile(it, room) {
    const tile = document.createElement('button'); tile.className = 'tile'; tile.dataset.key = it.key; tile.setAttribute('aria-pressed', 'false');
    const top = document.createElement('span'); top.className = 'top';
    const ico = document.createElement('span'); ico.className = 'ico'; ico.innerHTML = iconSvg(it.icon); top.appendChild(ico);
    const txt = document.createElement('span');
    const eye = document.createElement('span'); eye.className = 'eyebrow'; eye.textContent = room || '';
    const b = document.createElement('b'); b.textContent = it.label; const small = document.createElement('small'); txt.append(eye, b, small);
    tile.append(top, txt);
    tile.style.setProperty('--dot', this._dotColor(it.key));
    const t = { tile, small, it };
    if (this._hasDetail(it)) {
      const more = document.createElement('span'); more.className = 'more'; more.textContent = '⋯'; more.title = 'Mais controles'; more.setAttribute('role', 'button'); more.tabIndex = 0;
      more.addEventListener('click', (e) => { e.stopPropagation(); this._openDetail(it.key); });
      more.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); this._openDetail(it.key); } });
      top.appendChild(more);
    }
    tile.addEventListener('click', () => {
      if (it.kind === 'sensor') { this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: this.entity(it.key) }, bubbles: true, composed: true })); return; }
      if (it.kind === 'light' || it.kind === 'switch') this._activate(it.key);
      else if (it.kind === 'climate') this._svc('climate', 'set_hvac_mode', this.entity(it.key), { hvac_mode: this._state[it.key] && this._state[it.key].on ? 'off' : 'cool' });
      else if (it.kind === 'media') this._svc('media_player', this._state[it.key] && this._state[it.key].on ? 'turn_off' : 'turn_on', this.entity(it.key));
    });
    this._tiles[it.key] = t; return tile;
  }
  // Faixa de detalhes (brilho/cor do LED, modo/temperatura do ar, controles da TV)
  _openDetail(key) {
    const it = ITEMS.find((i) => i.key === key); if (!it) return;
    const d = this._detail; d.innerHTML = ''; d.hidden = false; d.dataset.key = key; this._detailKey = key;
    this._dSw = this._dSmall = this._dModes = this._dOut = this._dPP = this._dVol = this._dTimer = null;
    const title = document.createElement('div'); title.className = 'dtitle'; title.style.setProperty('--dot', this._dotColor(key));
    title.innerHTML = `<span class="ico">${iconSvg(it.icon)}</span><span><b>${it.label}</b><small></small></span>`;
    d.appendChild(title); this._dSmall = title.querySelector('small');
    const sw = document.createElement('button'); sw.className = 'sw'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-checked', 'false'); sw.setAttribute('aria-label', `${it.label} ligado`);
    d.appendChild(sw); this._dSw = sw;
    if (it.rgb) {
      sw.addEventListener('click', () => this._activate(key));
      const range = document.createElement('input'); range.type = 'range'; range.min = 1; range.max = 100; range.setAttribute('aria-label', 'Brilho');
      const st = this._state[key]; range.value = st && st.attrs && st.attrs.brightness != null ? Math.round(st.attrs.brightness / 2.55) : 100;
      range.addEventListener('change', () => this._svc('light', 'turn_on', this.entity(key), { brightness_pct: +range.value }));
      const sws = document.createElement('div'); sws.className = 'swatches';
      for (const [name, rgb] of LED_PRESETS) { const c = document.createElement('button'); c.className = 'swatch'; c.title = name; c.setAttribute('aria-label', name); c.style.background = `rgb(${rgb.join(',')})`; c.addEventListener('click', () => this._svc('light', 'turn_on', this.entity(key), { rgb_color: rgb })); sws.appendChild(c); }
      d.append(range, sws);
    } else if (it.kind === 'climate') {
      sw.addEventListener('click', () => this._svc('climate', 'set_hvac_mode', this.entity(key), { hvac_mode: this._state[key] && this._state[key].on ? 'off' : 'cool' }));
      const seg = document.createElement('div'); seg.className = 'seg2'; this._dModes = {};
      for (const m of ['cool', 'fan_only', 'dry', 'heat_cool']) { const mb = document.createElement('button'); mb.textContent = HVAC_PT[m]; mb.addEventListener('click', () => this._svc('climate', 'set_hvac_mode', this.entity(key), { hvac_mode: m })); seg.appendChild(mb); this._dModes[m] = mb; }
      const step = document.createElement('div'); step.className = 'step';
      const minus = document.createElement('button'); minus.textContent = '−'; minus.setAttribute('aria-label', 'Diminuir temperatura');
      const out = document.createElement('output'); out.textContent = '—';
      const plus = document.createElement('button'); plus.textContent = '+'; plus.setAttribute('aria-label', 'Aumentar temperatura');
      const bump = (dd) => { const st = this._state[key]; const a = (st && st.attrs) || {}; const cur = a.temperature != null ? a.temperature : 23; const tt = clamp(cur + dd, a.min_temp || 16, a.max_temp || 31); out.textContent = `${tt}°`; this._svc('climate', 'set_temperature', this.entity(key), { temperature: tt }); };
      minus.addEventListener('click', () => bump(-1)); plus.addEventListener('click', () => bump(1));
      step.append(minus, out, plus); d.append(seg, step); this._dOut = out;
    } else if (it.kind === 'media') {
      sw.addEventListener('click', () => this._svc('media_player', this._state[key] && this._state[key].on ? 'turn_off' : 'turn_on', this.entity(key)));
      const mk = (html, label, fn) => { const x = document.createElement('button'); x.className = 'mbtn'; x.innerHTML = html; x.setAttribute('aria-label', label); x.addEventListener('click', fn); d.appendChild(x); return x; };
      this._dPP = mk(iconSvg('play'), 'Tocar / pausar', () => this._svc('media_player', 'media_play_pause', this.entity(key)));
      mk('−', 'Volume −', () => this._svc('media_player', 'volume_down', this.entity(key)));
      mk('+', 'Volume +', () => this._svc('media_player', 'volume_up', this.entity(key)));
      const vol = document.createElement('small'); d.appendChild(vol); this._dVol = vol;
    }
    if (it.kind === 'light' || it.kind === 'switch') {
      if (!it.rgb) sw.addEventListener('click', () => this._activate(key));
      const tm = document.createElement('div'); tm.className = 'seg2 timerseg'; tm.setAttribute('aria-label', 'Desligar em');
      const lab = document.createElement('span'); lab.className = 'tlab'; lab.innerHTML = `${iconSvg('timer')} desligar em`; tm.appendChild(lab);
      for (const m of [15, 30, 60]) { const b = document.createElement('button'); b.textContent = `${m} min`; b.addEventListener('click', () => this._setTimer(key, m)); tm.appendChild(b); }
      const cancel = document.createElement('button'); cancel.textContent = 'cancelar'; cancel.addEventListener('click', () => this._setTimer(key, 0)); tm.appendChild(cancel);
      d.appendChild(tm); this._dTimer = tm;
    }
    const close = document.createElement('button'); close.className = 'close'; close.textContent = '×'; close.setAttribute('aria-label', 'Fechar');
    close.addEventListener('click', () => { d.hidden = true; this._detailKey = null; }); d.appendChild(close);
    this._showTab('ctl'); this._renderPanel();
    d.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  _stateText(it, st) {
    if (!st || st.unavailable) return 'indisponível';
    const a = st.attrs || {};
    if (it.kind === 'climate') return st.on ? `${HVAC_PT[st.state] || st.state}${a.temperature != null ? ` · ${a.temperature}°` : ''}${a.current_temperature != null ? ` · ${a.current_temperature}° atual` : ''}` : `Desligado${a.current_temperature != null ? ` · ${a.current_temperature}° atual` : ''}`;
    if (it.kind === 'media') return st.state === 'playing' && a.media_title ? `${a.media_title}` : (MEDIA_PT[st.state] || st.state);
    if (it.kind === 'sensor') return st.text || st.state;
    return st.on ? (it.key === 'bomba_piscina' ? 'ligada' : 'acesa') : (it.key === 'bomba_piscina' ? 'desligada' : 'apagada');
  }
  _renderPanel() {
    if (!this._tiles) return;
    const now = Date.now();
    for (const [k, t] of Object.entries(this._tiles)) {
      const st = this._state[k]; const on = !!(st && st.on);
      t.tile.classList.toggle('on', on); t.tile.classList.toggle('unavailable', !!(st && st.unavailable));
      t.tile.setAttribute('aria-pressed', on ? 'true' : 'false');
      const lc = this._lastChanged[k];
      t.small.textContent = this._stateText(t.it, st) + (lc ? ` · ${fmtRel(lc, now)}` : '') + this._timerText(k, now);
      if (t.it.rgb && st && st.attrs && st.attrs.rgb_color) t.tile.style.setProperty('--dot', `rgb(${st.attrs.rgb_color.join(',')})`);
    }
    const lights = ITEMS.filter((i) => i.kind === 'light');
    const n = lights.filter((i) => this._state[i.key] && this._state[i.key].on).length;
    if (this._countEl) this._countEl.textContent = `${n} de ${lights.length} luzes acesas`;
    const key = this._detailKey;
    if (key && this._detail && !this._detail.hidden) {
      const st = this._state[key]; const on = !!(st && st.on); const it = ITEMS.find((i) => i.key === key);
      if (this._dSw) this._dSw.setAttribute('aria-checked', on ? 'true' : 'false');
      if (this._dSmall) this._dSmall.textContent = this._stateText(it, st) + this._timerText(key, now);
      if (this._dTimer) for (const b of this._dTimer.querySelectorAll('button')) b.setAttribute('aria-pressed', this._timers[key] && b.textContent === `${Math.round((this._timers[key].at - (this._timers[key].at - 0)) / 60000)} min` ? 'true' : 'false');
      if (this._dModes) for (const [m, mb] of Object.entries(this._dModes)) mb.setAttribute('aria-pressed', st && st.state === m ? 'true' : 'false');
      if (this._dOut && st && st.attrs && st.attrs.temperature != null) this._dOut.textContent = `${st.attrs.temperature}°`;
      if (this._dPP) this._dPP.innerHTML = iconSvg(st && st.state === 'playing' ? 'pause' : 'play');
      if (this._dVol && st && st.attrs) this._dVol.textContent = st.attrs.volume_level != null ? `vol ${Math.round(st.attrs.volume_level * 100)}%` : '';
    }
    this._renderFeed(now);
  }
  _pushActivity(key, state, ts, seed = false) {
    this._activity.push({ key, state, ts, seed });
    this._activity.sort((a, b) => b.ts - a.ts);
    if (this._activity.length > 40) this._activity.length = 40;
  }
  _renderAutos(now = Date.now()) {
    const el = this._autoList; if (!el) return;
    el.innerHTML = '';
    if (!this._autos.length) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = this._hass ? 'Nenhuma automação encontrada no Home Assistant.' : 'As automações do HA aparecem aqui quando o cartão está no Home Assistant.'; el.appendChild(e); return; }
    for (const a of this._autos) {
      const row = document.createElement('div'); row.className = 'auto ' + (a.on ? 'on' : 'off');
      row.innerHTML = `<span class="ico">${iconSvg('auto')}</span><span><b>${a.name}</b><small>${a.last ? `última execução ${fmtClock(a.last)} · ${fmtRel(a.last, now)}` : 'nunca executou'}${a.on ? '' : ' · desativada'}</small></span>`;
      const sw = document.createElement('button'); sw.className = 'sw'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-checked', a.on ? 'true' : 'false'); sw.setAttribute('aria-label', `${a.name} ativa`);
      sw.addEventListener('click', () => { a.on = !a.on; this._svc('automation', a.on ? 'turn_on' : 'turn_off', a.id); this._renderAutos(); });
      const run = document.createElement('button'); run.className = 'run'; run.innerHTML = iconSvg('play'); run.title = 'Executar agora'; run.setAttribute('aria-label', `Executar ${a.name}`);
      run.addEventListener('click', () => { this._svc('automation', 'trigger', a.id, { skip_condition: true }); row.classList.add('flash'); setTimeout(() => row.classList.remove('flash'), 600); });
      row.append(sw, run); el.appendChild(row);
    }
  }
  _renderFeed(now = Date.now()) {
    if (!this._feed) return;
    this._renderAutos(now);
    this._feed.innerHTML = '';
    if (!this._activity.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Nenhuma atividade ainda.'; this._feed.appendChild(li); return; }
    for (const ev of this._activity.slice(0, 30)) {
      if (ev.state === 'triggered') {
        const a = this._autos.find((x) => x.id === ev.key); const li = document.createElement('li'); li.classList.add('on'); li.style.setProperty('--dot', '#ffd48a');
        li.innerHTML = `<i class="d"></i><span><b>${a ? a.name : ev.key}</b> disparou</span><time>${fmtClock(ev.ts)} · ${fmtRel(ev.ts, now)}</time>`;
        this._feed.appendChild(li); continue;
      }
      const it = ITEMS.find((i) => i.key === ev.key); if (!it) continue;
      const li = document.createElement('li');
      const on = it.kind === 'climate' ? ev.state !== 'off' : it.kind === 'media' ? (ev.state === 'playing' || ev.state === 'on' || ev.state === 'paused') : ev.state === 'on';
      li.classList.toggle('on', on); li.style.setProperty('--dot', this._dotColor(it.key));
      let what;
      if (it.kind === 'climate') what = ev.state === 'off' ? 'desligado' : `→ ${HVAC_PT[ev.state] || ev.state}`;
      else if (it.kind === 'media') what = `→ ${MEDIA_PT[ev.state] || ev.state}`;
      else if (it.kind === 'sensor') what = it.key === 'presenca' ? (ev.state === 'on' ? '→ alguém no quarto' : '→ ninguém') : it.key === 'pessoa' ? (ev.state === 'home' ? '→ chegou em casa' : '→ saiu') : `→ ${Math.round(+ev.state)} lx`;
      else what = ev.state === 'on' ? (it.key === 'bomba_piscina' ? 'ligada' : 'acesa') : (it.key === 'bomba_piscina' ? 'desligada' : 'apagada');
      li.innerHTML = `<i class="d"></i><span><b>${it.label}</b> ${what}</span><time datetime="${new Date(ev.ts).toISOString()}">${fmtClock(ev.ts)} · ${fmtRel(ev.ts, now)}</time>`;
      this._feed.appendChild(li);
    }
  }
  _flashRow(key) {
    const t = this._tiles && this._tiles[key]; if (!t || !this._panelOpen) return;
    this._showTab('ctl'); t.tile.classList.add('flash'); t.tile.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    setTimeout(() => t.tile.classList.remove('flash'), 900);
  }

  // ---- Loop ----
  _resize() {
    if (!this._renderer) return;
    const w = Math.max(1, this.clientWidth), h = Math.max(1, this.clientHeight);
    // Orçamento de ~2,4 Mpx por quadro: em telas Retina grandes baixa o pixel ratio
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, this._lite ? 1.25 : 2, Math.sqrt((this._lite ? 1.4e6 : 2.4e6) / (w * h))));
    this._renderer.setPixelRatio(dpr);
    this._renderer.setSize(w, h, false);
    // Com o painel aberto, a cena é enquadrada na área visível acima dele
    const P = this._panelOpen && this._dock && !this._dock.hidden ? Math.min(this._dock.offsetHeight + 12, h * 0.6) : 0;
    const vh = Math.max(120, h - P);
    this._camera.aspect = w / vh;
    if (P > 0) this._camera.setViewOffset(w, vh, 0, 0, w, h); else this._camera.clearViewOffset();
    this._camera.updateProjectionMatrix();
    if (!this._orbit.touched) this._resetView();
    this._orbit.dirty = true;
  }
  _start() {
    if (this._raf || !this._renderer) return;
    this._clock.start();
    const tick = () => { this._raf = requestAnimationFrame(tick); this._frame(); };
    this._raf = requestAnimationFrame(tick);
  }
  _stop() { if (this._raf) cancelAnimationFrame(this._raf); this._raf = 0; this._clock.stop(); }

  _frame() {
    const dt = Math.min(this._clock.getDelta(), 0.1);
    const t = this._clock.elapsedTime;
    let dirty = this._orbit.update(dt);
    const k = 1 - Math.exp(-dt * 7);
    // Ambiente dia/noite — em "auto" segue a elevação do sol (transição suave no crepúsculo)
    this._updateTime();
    const elev = this._sunInfo ? this._sunInfo.elevation : -20;
    const nightGoal = this._mode === 'night' ? 1 : this._mode === 'day' ? 0 : clamp((6 - elev) / 10, 0, 1);
    if (this._mode === 'auto' && this._night !== (nightGoal > 0.5)) { this._night = nightGoal > 0.5; this._nvBtn.disabled = !this._night; this._nvBtn.style.opacity = this._night ? '' : '.55'; }
    if (this._nightLevel === undefined) this._nightLevel = nightGoal;
    if (Math.abs(this._nightLevel - nightGoal) > 0.002) { this._nightLevel += (nightGoal - this._nightLevel) * k; dirty = true; this._needShadow = true; }
    else if (this._nightLevel !== nightGoal) { this._nightLevel = nightGoal; dirty = true; this._needShadow = true; }
    const nl = this._nightLevel;
    // Visão noturna: à noite, luz de lua mais forte + ambiente frio para a casa inteira ficar legível
    const nvGoal = this._nightVision ? 1 : 0;
    if (this._nvLevel === undefined) this._nvLevel = nvGoal;
    if (Math.abs(this._nvLevel - nvGoal) > 0.002) { this._nvLevel += (nvGoal - this._nvLevel) * k; dirty = true; this._needShadow = true; }
    else if (this._nvLevel !== nvGoal) { this._nvLevel = nvGoal; dirty = true; this._needShadow = true; }
    const nv = this._nvLevel, L = THREE.MathUtils.lerp;
    this._hemi.intensity = L(1.1, L(0.22, 0.8, nv), nl);
    this._hemi.color.setHex(0xe4ecf5).lerp(new THREE.Color(0x4a5f92), nl);
    this._hemi.groundColor.setHex(0xa08c70).lerp(new THREE.Color(0x1c2130), nl);
    this._amb.intensity = L(0.35, L(0.14, 0.42, nv), nl);
    this._amb.color.setHex(0xdde4ee).lerp(new THREE.Color(0x6b7aa8), nl);
    // sol: posição pelo azimute/elevação reais (no dia); cor esquenta perto do horizonte
    const az = ((this._sunInfo ? this._sunInfo.azimuth : 90) - (this._config.orientation - 180)) * Math.PI / 180;
    const elr = Math.max(elev, 4) * Math.PI / 180;
    const sunDir = new THREE.Vector3(Math.sin(az) * Math.cos(elr), Math.sin(elr), -Math.cos(az) * Math.cos(elr));
    if (this._mode === 'day') sunDir.copy(this._sunPos).normalize();
    const sunPos = this._sun.target.position.clone().addScaledVector(sunDir, 30);
    const warm = clamp(1 - elev / 14, 0, 1);
    const dayCol = this._sunCol.clone().lerp(new THREE.Color(0xff9848), warm * 0.85);
    const dayInt = 3.2 * clamp(0.25 + Math.sin(Math.max(elev, 0) * Math.PI / 180) * 1.5, 0.25, 1);
    this._sun.intensity = L(dayInt, L(0.5, 1.15, nv), nl);
    this._sun.position.lerpVectors(sunPos, this._moonPos, nl);
    this._sun.color.copy(dayCol).lerp(this._moonCol, nl);
    if (!this._lastSunPos || this._lastSunPos.distanceToSquared(this._sun.position) > 0.01) { this._lastSunPos = this._sun.position.clone(); this._needShadow = true; dirty = true; }
    const dusk = this._mode === 'auto' ? clamp(1 - Math.abs(elev) / 9, 0, 1) * 0.95 : 0;
    this._skyDusk.material.opacity = dusk;
    this._skyDay.material.opacity = (1 - nl) * (1 - dusk * 0.85); this._stars.material.opacity = nl * 0.9;
    this._hemi.color.lerp(new THREE.Color(0xffb27a), dusk * 0.5 * (1 - nl));
    this._scene.fog.color.setHex(0xd6e4f2).lerp(new THREE.Color(0xf0a070), dusk * 0.6).lerp(new THREE.Color(0x0a0f1e), nl);
    if (this._envDay) {
      const env = nl > 0.5 ? this._envNight : this._envDay;
      if (this._scene.environment !== env) this._scene.environment = env;
      this._scene.environmentIntensity = L(0.55, L(0.35, 0.7, nv), nl);
    }
    // Luzes (fade) e materiais emissivos
    let ambient = false;   // animação ociosa (TV pulsando, água escoando)
    for (const it of ITEMS) {
      const rt = this._items.get(it.key); if (!rt) continue;
      const goal = rt.target * (rt.brightScale || 1);
      if (Math.abs(rt.level - goal) > 0.003) { rt.level += (goal - rt.level) * k; dirty = true; }
      else if (rt.level !== goal) { rt.level = goal; dirty = true; }
      const lv = rt.level;
      // luz de dia: as lâmpadas pesam menos na cena
      const dayScale = THREE.MathUtils.lerp(0.45, 1, nl);
      for (const { L: pl, i } of rt.lights || []) { pl.intensity = i * lv * dayScale; pl.color.copy(rt.color); }
      for (const f of rt.fixtures || []) if (f.material && f.material.emissive && it.kind === 'light') f.material.emissiveIntensity = lv * 1.6;
      for (const { sp, base } of rt.glows || []) { sp.material.opacity = lv * base; sp.material.color.copy(rt.color); sp.visible = lv > 0.01; }
      if (it.key === 'led_piscina') { this._waterU.ledIntensity.value = lv * 0.75; materials().basin.emissiveIntensity = 0.12 + lv * 0.35; }
      if (it.key === 'bomba_piscina' && rt.led) rt.led.material.emissiveIntensity = lv * 2.5;
      if (it.key === 'tv') {
        const pulse = (this._reduced ? 1 : 0.85 + 0.15 * Math.sin(t * 2.1)) * lv;
        rt.screenMat.emissiveIntensity = pulse * 1.4;
        rt.light.intensity = pulse * 2.5;
        if (lv > 0.01 && !this._reduced) ambient = true;
      }
      if (it.kind === 'climate' && rt.ledMat) {
        const c = rt.hvac === 'cool' ? 0x67d3ff : rt.hvac === 'heat' ? 0xff8a5b : 0x8ef0b0;
        rt.ledMat.emissive.setHex(c); rt.ledMat.emissiveIntensity = lv * 2.2;
      }
    }
    // Água: ondula sempre (devagar); com a bomba ligada, mais rápido
    const pump = this._items.get('bomba_piscina');
    if (!this._reduced) {
      const sp = 1 + (pump ? pump.level * 1.6 : 0);
      this._waterTime = (this._waterTime || 0) + dt * sp;
      const U = this._waterU; U.time.value = this._waterTime;
      const bm = materials().basin.emissiveMap; bm.offset.x += dt * 0.014 * sp; bm.offset.y -= dt * 0.009 * sp;
      // luz e céu do momento (dia/entardecer/noite) refletidos na água
      U.sunDir.value.copy(this._sun.position).sub(this._sun.target.position).normalize();
      U.sunColor.value.copy(this._sun.color); U.sunIntensity.value = clamp(this._sun.intensity / 3.2, 0.12, 1) * (0.55 + 0.45 * (1 - nl));
      U.skyTop.value.setHex(0x4f8fd6).lerp(new THREE.Color(0xd08a70), dusk * 0.5).lerp(new THREE.Color(0x0b1226), nl);
      U.skyHorizon.value.setHex(0xe6eef6).lerp(new THREE.Color(0xffa070), dusk * 0.8).lerp(new THREE.Color(0x1a2340), nl);
      U.deepColor.value.setHex(0x0b3f78).lerp(new THREE.Color(0x061b36), nl * 0.85);
      U.shallowColor.value.setHex(0x2a9bc0).lerp(new THREE.Color(0x0f3a58), nl * 0.85);
      ambient = true; this._waterFast = sp > 1.5;
    }
    if (this._needShadow) { this._renderer.shadowMap.needsUpdate = true; this._needShadow = false; dirty = true; }
    // Só animação ociosa (água/TV) rodando: renderiza em metade dos frames
    this._tick = (this._tick || 0) + 1;
    if (dirty || (ambient && this._tick % (this._waterFast ? 2 : 3) === 0)) this._renderer.render(this._scene, this._camera);
  }
}

if (!customElements.get('casa3d-card')) customElements.define('casa3d-card', Casa3DCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === 'casa3d-card')) {
  window.customCards.push({ type: 'casa3d-card', name: 'Casa 3D', description: 'Planta 3D interativa da casa; luzes ligadas às entidades do Home Assistant.', preview: false });
}
console.info(`%c CASA3D-CARD %c v${VERSION} `, 'background:#0a0f1e;color:#ffc46b;font-weight:700', 'background:#ffc46b;color:#0a0f1e;font-weight:700');
