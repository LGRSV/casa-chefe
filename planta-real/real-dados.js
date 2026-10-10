/*
 * Planta Real — dados próprios da maquete realista. A planta da casa (paredes, cômodos, aparelhos) vem de
 * ../planta/planta-dados.js, que já foi conferida com ZONES/PLACES/_buildWalls do casa3d-card.js.
 * Aqui ficam só pisos, o ponto de encaixe do up!, vegetação e lajotas, posicionados como nos room*() do casa3d-card.js.
 * Coordenadas em metros: X → direita, Z → frente (rua), Y → cima.
 */
export { H, T, LOT, POOL, ROOMS, WALLS, OPENING, DEFAULT_ENTITIES, CONTROLS, WEATHER_PT } from '../planta/planta-dados.js';

export const VERSION = '0.1.0';

// Corte da maquete: paredes da casa param aqui (sem telhado); muros ficam um pouco mais baixos
export const CUT = 1.8;
export const CUT_MURO = 1.4;

export const COPING = 0.3; // borda de pedra em volta da piscina

// Pisos: [x, z, w, d, material]. Internos em porcelanato branco (pedido do dono); os tapetes dão o calor
export const FLOORS = [
  [0, 0, 3.6, 4.2, 'tile'],          // quarto casal
  [3.6, 0, 3.2, 4.2, 'tile'],        // quarto
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

// Caminho de lajotas no jardim (0,42 × 0,34): 9 em x=12,0, as duas últimas em 11,88
export const STEPS = Array.from({ length: 9 }, (_, i) => [i < 7 ? 12.0 : 11.88, 6.55 + i * 0.72]);

// Ponto de encaixe do VW up! (real-up.js): centro entre as rodas no chão da garagem.
// y = topo do piso de concreto; ry = π → frente para -Z (de bico para a casa), como o F.upTsi original
export const UP = { x: 1.5, z: 13.6, y: 0.04, ry: Math.PI };

// Vegetação (só dentro do lote). palms: [x, z, altura, escala, vaso]; shrubs: [x, z, raio, tom]; trees: [x, z, raio]; flowers: [x, z]
// tom: 0 verde-escuro, 1 verde-médio, 2 verde-claro
export const PALMS = [
  [0.5, 4.66, 1.1, 0.5, 1],                         // palmeira em vaso na varanda
  [12.95, 7.3, 1.45, 0.55, 0], [12.95, 10.0, 0.95, 0.45, 0], // palmeiras pequenas no canteiro do jardim
];
export const SHRUBS = [
  [4.6, 6.72, 0.26, 1], [7.5, 6.72, 0.26, 2], [2.68, 8.6, 0.24, 1],        // faixa de grama
  [12.9, 6.78, 0.3, 0], [12.95, 8.9, 0.3, 1], [12.9, 11.25, 0.3, 2],       // jardim
];
export const TREES = [
  [12.3, 11.9, 0.75],                                          // árvore do jardim
];
// Bromélias (touceiras com flor) no canteiro do jardim
export const FLOWERS = [[13.0, 7.95], [12.95, 8.45], [12.95, 10.65]];
