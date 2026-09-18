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
