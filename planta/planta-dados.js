/*
 * Planta — dados do módulo (sem lógica, sem imports).
 * Copiados de ../casa3d-card.js v1.9.1 (DEFAULT_ENTITIES l.39, ITEMS l.64, H/T/ZONES/POOL/DECK/LOT/PLACES l.227–270,
 * _buildWalls l.3623). Não importamos o cartão da Casa: ele traz ~5,8 mil linhas e registra o casa3d-card como efeito colateral.
 * Coordenadas em metros: X → direita, Z → frente (fundo do lote), Y → cima. Origem = canto do quarto do casal.
 */
export const VERSION = '0.1.0';

export const H = 2.8;    // pé-direito
export const T = 0.15;   // espessura das paredes
export const LOT = { w: 13.4, d: 16.6 };
export const POOL = { x0: 3.9, x1: 8.3, zc: 9.8, r: 1.6 };   // reta x0→x1 + meia-lua de raio r centrada em (x1, zc)

// Entidades do HA (sobrescreva no YAML em `entities:`); mesmas chaves da Casa
export const DEFAULT_ENTITIES = {
  quarto: 'switch.quarto_interruptor_1',
  led_quarto: 'light.0xa4c1387cf3257eb7',
  sala: 'light.interruptor_cozinha_left',
  balcao: 'switch.balcao_interruptor_1',
  externa: 'light.interruptor_cozinha_center',
  banheiro: 'light.interruptor_cozinha_center',
  garagem: 'switch.garagem_interruptor_1',
  led_piscina: 'switch.led_piscina_interruptor_1',
  bomba_piscina: 'switch.piscina_interruptor_1',
  ac: 'climate.ir_ac_cozinha_ac_cozinha',
  tv: 'media_player.m_s',
  presenca: 'binary_sensor.0xa4c13846f2a0df88_occupancy',
  lux: 'sensor.0xa4c13846f2a0df88_illuminance',
  pessoa: 'person.sandro',
  clima: 'weather.casa',   // novo: entidade weather do cabeçalho (opcional)
};

// Aparelhos alternáveis. kind: light | switch | climate | media. glow = cor do brilho no piso quando ligado (só light)
export const CONTROLS = {
  quarto:        { label: 'Luz do quarto', kind: 'light',   glow: 0xffb347 },
  led_quarto:    { label: 'LED do quarto', kind: 'light',   glow: 0xffb347 },
  sala:          { label: 'Luz da sala',   kind: 'light',   glow: 0xffb347 },
  balcao:        { label: 'Luz do balcão', kind: 'light',   glow: 0xffb347 },
  externa:       { label: 'Luz externa',   kind: 'light',   glow: 0xffb347 },
  banheiro:      { label: 'Luz do banheiro + dispensa', kind: 'light', glow: 0xffb347 },
  garagem:       { label: 'Luz da garagem', kind: 'light',  glow: 0xffb347 },
  led_piscina:   { label: 'LED da piscina', kind: 'light',  glow: 0x4aa8ff },
  bomba_piscina: { label: 'Bomba da piscina', kind: 'switch' },
  ac:            { label: 'Ar-condicionado', kind: 'climate' },
  tv:            { label: 'TV do quarto',  kind: 'media' },
};

// Cômodos clicáveis. rect = [x, z, w, d] no piso; h = altura do contorno realçado (0 = área externa, só o contorno do piso);
// controls = chaves de CONTROLS mostradas no painel, na ordem
export const ROOMS = [
  { id: 'quarto_casal', label: 'Quarto Casal',   rect: [0, 0, 3.6, 4.2],      h: H, controls: [] },
  { id: 'quarto',       label: 'Quarto',         rect: [3.6, 0, 3.2, 4.2],    h: H, controls: ['quarto', 'led_quarto', 'tv'] },
  { id: 'sala',         label: 'Sala / Cozinha', rect: [6.8, 0, 3.5, 4.2],    h: H, controls: ['sala', 'ac'] },
  { id: 'balcao',       label: 'Balcão',         rect: [10.3, 0, 2.2, 4.2],   h: H, controls: ['balcao'] },
  { id: 'varanda',      label: 'Varanda',        rect: [0, 4.2, 12.5, 2.0],   h: H, controls: ['externa'] },
  { id: 'banheiro',     label: 'Banheiro',       rect: [0, 6.2, 2.4, 2.6],    h: H, controls: ['banheiro'] },
  { id: 'dispensa',     label: 'Dispensa',       rect: [0, 8.8, 2.4, 1.8],    h: H, controls: ['banheiro'] },
  { id: 'garagem',      label: 'Garagem',        rect: [0, 10.6, 3.0, 5.4],   h: H, controls: ['garagem'] },
  { id: 'piscina',      label: 'Piscina',        rect: [2.9, 7.2, 8.0, 5.2],  h: 0, controls: ['led_piscina', 'bomba_piscina'] },
  { id: 'jardim',       label: 'Jardim',         rect: [10.9, 6.2, 2.5, 6.2], h: 0, controls: ['externa'] },
  { id: 'quintal',      label: 'Quintal',        rect: [3.0, 12.4, 10.4, 4.2], h: 0, controls: ['externa'] },
];

// Paredes: axis 'x' = corre ao longo de X em z = c (de a0 a a1); axis 'z' = corre ao longo de Z em x = c.
// ops = aberturas {a, b, t}: door | window | glass | open | gate. muro = muro do lote (estilo mais apagado)
export const WALLS = [
  { axis: 'x', c: 0, a0: 0, a1: 12.5, h: H, ops: [{ a: 1.2, b: 2.4, t: 'window' }, { a: 4.4, b: 5.6, t: 'window' }, { a: 11.0, b: 12.0, t: 'window' }] },
  { axis: 'z', c: 0, a0: 0, a1: 16.0, h: H, ops: [] },
  { axis: 'z', c: 12.5, a0: 0, a1: 6.2, h: H, ops: [] },
  { axis: 'z', c: 3.6, a0: 0, a1: 4.2, h: H, ops: [] },
  { axis: 'z', c: 6.8, a0: 0, a1: 4.2, h: H, ops: [] },
  { axis: 'z', c: 10.3, a0: 0, a1: 2.2, h: H, ops: [] },
  { axis: 'x', c: 4.2, a0: 0, a1: 12.5, h: H, ops: [{ a: 1.0, b: 1.9, t: 'door' }, { a: 2.5, b: 3.3, t: 'window' }, { a: 4.1, b: 5.0, t: 'door' }, { a: 5.5, b: 6.4, t: 'window' }, { a: 7.4, b: 8.3, t: 'door' }, { a: 9.6, b: 12.2, t: 'glass' }] },
  { axis: 'x', c: 6.2, a0: 0, a1: 12.5, h: H, ops: [{ a: 2.9, b: 3.8, t: 'door' }, { a: 4.6, b: 6.6, t: 'window' }, { a: 8.0, b: 12.0, t: 'glass' }] },
  { axis: 'z', c: 2.4, a0: 6.2, a1: 10.6, h: H, ops: [{ a: 7.0, b: 7.9, t: 'door' }, { a: 9.3, b: 10.1, t: 'door' }] },
  { axis: 'x', c: 8.8, a0: 0, a1: 2.4, h: H, ops: [] },
  { axis: 'x', c: 10.6, a0: 0, a1: 3.0, h: H, ops: [] },
  { axis: 'z', c: 3.0, a0: 10.6, a1: 16.0, h: H, ops: [{ a: 11.4, b: 15.4, t: 'open' }] },
  { axis: 'x', c: 16.0, a0: 0, a1: 3.0, h: H, ops: [{ a: 0.3, b: 2.7, t: 'gate' }] },
  { axis: 'z', c: 13.4, a0: 0, a1: 16.6, h: 2.2, muro: true, ops: [] },
  { axis: 'x', c: 16.6, a0: 3.0, a1: 13.4, h: 1.8, muro: true, ops: [{ a: 5.6, b: 6.6, t: 'open' }] },
  { axis: 'x', c: -0.05, a0: -0.2, a1: 13.4, h: 2.2, muro: true, ops: [] },
];
// Alturas das aberturas (m): porta até 2.1; janela de 1.0 a 2.15; vidro do chão até 2.25; portão até 2.25; vão livre até 2.3
export const OPENING = { door: [0, 2.1], window: [1.0, 2.15], glass: [0, 2.25], gate: [0, 2.25], open: [0, 2.3] };

// Móveis só como silhuetas: caixas [x, z, w, d, h] (canto mínimo em x/z, em metros). Aproximados da Casa; não precisam ser exatos.
export const FURNITURE = [
  // Quarto casal: cama, criados, guarda-roupa
  [0.9, 1.6, 1.6, 2.0, 0.55], [0.35, 1.65, 0.45, 0.4, 0.5], [2.6, 1.65, 0.45, 0.4, 0.5], [0.2, 0.15, 2.2, 0.6, 2.0],
  // Quarto: cama, escrivaninha, guarda-roupa, rack da TV
  [4.2, 1.8, 1.4, 2.0, 0.55], [5.9, 0.2, 0.8, 1.3, 0.75], [3.8, 0.15, 1.6, 0.6, 2.0], [6.25, 2.2, 0.4, 1.4, 0.5],
  // Sala / cozinha: sofá, mesa, bancada, geladeira
  [7.1, 2.6, 2.0, 0.85, 0.8], [8.6, 1.0, 1.1, 0.8, 0.75], [7.0, 0.15, 2.4, 0.6, 0.9], [9.6, 0.15, 0.7, 0.7, 1.8],
  // Balcão: bancada e banquetas
  [10.5, 0.8, 1.8, 0.6, 1.05], [10.7, 1.6, 1.4, 0.4, 0.7],
  // Varanda: espreguiçadeiras, mesinha
  [5.0, 4.6, 0.7, 1.3, 0.4], [6.2, 4.6, 0.7, 1.3, 0.4], [8.8, 4.8, 0.8, 0.8, 0.7],
  // Banheiro: vaso, pia, box ; Dispensa: prateleiras
  [0.2, 6.4, 0.4, 0.65, 0.45], [1.6, 6.35, 0.6, 0.45, 0.85], [0.15, 7.9, 0.9, 0.85, 2.0], [0.15, 9.0, 0.45, 1.4, 1.9], [1.8, 9.0, 0.45, 1.4, 1.9],
  // Garagem: carro
  [0.6, 11.7, 1.8, 3.9, 1.45],
  // Quintal: mesa redonda + guarda-sol (como caixas baixas)
  [9.6, 13.4, 1.0, 1.0, 0.75],
];

// Cabeçalho: estados do weather do HA em português
export const WEATHER_PT = {
  'clear-night': 'Céu limpo', cloudy: 'Nublado', exceptional: 'Instável', fog: 'Neblina', hail: 'Granizo', lightning: 'Raios',
  'lightning-rainy': 'Tempestade', partlycloudy: 'Parcialmente nublado', pouring: 'Chuva forte', rainy: 'Chuva', snowy: 'Neve',
  'snowy-rainy': 'Chuva e neve', sunny: 'Ensolarado', windy: 'Ventando', 'windy-variant': 'Ventando',
};
