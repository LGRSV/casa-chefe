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
