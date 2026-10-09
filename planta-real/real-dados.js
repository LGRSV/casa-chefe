/*
 * Planta Real — dados próprios da maquete realista. A planta da casa (paredes, cômodos, aparelhos) vem de
 * ../planta/planta-dados.js, que já foi conferida com ZONES/PLACES/_buildWalls do casa3d-card.js.
 * Aqui ficam só pisos, móveis, carros e vegetação, posicionados como nos room*() do casa3d-card.js.
 * Coordenadas em metros: X → direita, Z → frente (rua), Y → cima.
 */
export { H, T, LOT, POOL, ROOMS, WALLS, OPENING, DEFAULT_ENTITIES, CONTROLS, WEATHER_PT } from '../planta/planta-dados.js';

export const VERSION = '0.1.0';

// Corte da maquete: paredes da casa param aqui (sem telhado); muros ficam um pouco mais baixos
export const CUT = 1.8;
export const CUT_MURO = 1.4;

export const COPING = 0.3; // borda de pedra em volta da piscina

// Pisos: [x, z, w, d, material]. Ordem importa só para leitura
export const FLOORS = [
  [0, 0, 3.6, 4.2, 'wood'],          // quarto casal
  [3.6, 0, 3.2, 4.2, 'wood'],        // quarto
  [6.8, 0, 3.5, 4.2, 'tile'],        // sala / cozinha
  [10.3, 0, 2.2, 4.2, 'tile'],       // balcão
  [0, 4.2, 12.5, 2.0, 'tile'],       // varanda
  [0, 6.2, 2.4, 2.6, 'tileCool'],    // banheiro
  [0, 8.8, 2.4, 1.8, 'tile'],        // dispensa
  [0, 10.6, 3.0, 5.4, 'concrete'],   // garagem
  [2.9, 7.2, 8.0, 5.2, 'stone'],     // deck (a piscina fica por cima)
  [2.4, 12.4, 11.0, 4.2, 'paving'],  // pátio / entrada
  [0, 16.0, 3.0, 0.6, 'paving'],     // soleira do portão da garagem
];

// Caminho de lajotas no jardim: [x, z] (0,5 × 0,8 m)
export const STEPS = [[11.4, 6.6], [11.6, 7.6], [11.5, 8.6], [11.7, 9.6], [11.5, 10.6], [11.6, 11.6]];

// Carros: centro, comprimento, largura, rumo (rad, 0 = frente para +X), cor, tipo
export const CARS = [
  { x: 1.5, z: 13.4, len: 3.6, wid: 1.66, rot: Math.PI / 2, color: 0xf3f3f1, type: 'hatch' },   // up! na garagem
  { x: 5.7, z: 14.15, len: 4.5, wid: 1.86, rot: Math.PI, color: 0x3a3d43, type: 'suv' },         // vaga de visitante
];

// Vegetação (só dentro do lote). palms: [x, z, altura, escala]; shrubs: [x, z, raio, tom]; trees: [x, z, raio]; flowers: [x, z]
// tom: 0 verde-escuro, 1 verde-médio, 2 verde-claro
export const PALMS = [
  [0.45, 4.6, 1.1, 0.5],                           // palmeira em vaso na varanda
  [12.75, 6.7, 2.9, 0.75], [12.8, 11.2, 3.3, 0.8],  // jardim
  [12.75, 16.1, 2.8, 0.75],                         // pátio, canto junto ao muro
];
export const SHRUBS = [
  // faixa de grama entre varanda e deck
  [3.2, 6.7, 0.32, 1], [4.6, 6.75, 0.28, 2], [7.5, 6.75, 0.3, 1], [9.4, 6.7, 0.26, 0], [10.4, 6.75, 0.3, 2],
  [2.65, 8.6, 0.24, 1], [2.65, 10.6, 0.22, 2], [2.65, 11.9, 0.24, 0],
  // jardim, ao longo do muro
  [13.05, 6.5, 0.32, 0], [13.05, 8.0, 0.36, 1], [13.0, 9.2, 0.3, 2], [13.05, 10.3, 0.34, 0], [13.05, 12.1, 0.3, 1],
  [11.2, 12.0, 0.28, 2], [11.1, 7.2, 0.26, 1],
  // muro do fundo (lado externo) e pátio
  [9.0, 16.25, 0.3, 1], [10.2, 16.25, 0.34, 0], [11.4, 16.25, 0.3, 2], [7.2, 16.25, 0.26, 1],
];
export const TREES = [
  [12.0, 9.0, 1.0],                                            // árvore do jardim
];
// Bromélias vermelhas ao longo do muro direito do pátio (como na referência)
export const FLOWERS = [[13.0, 12.8], [13.05, 13.35], [13.0, 13.9], [13.05, 14.45], [13.0, 15.0], [13.05, 15.5]];
