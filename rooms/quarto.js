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
