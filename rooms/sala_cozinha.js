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
