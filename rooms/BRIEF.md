# Brief — decoração detalhada por cômodo (Casa 3D, Three.js r170)

Você vai escrever UMA função JavaScript que decora um cômodo de uma casa modelada em Three.js
(cartão Lovelace do Home Assistant). O arquivo-fonte é `/Users/macbook/Public/casa-3d/casa3d-card.js`
(leia as partes relevantes: `ZONES`, `_buildWalls()` para portas/janelas, `furniture()` para as
peças prontas e `_buildFurniture()` para a colocação atual — que você vai SUBSTITUIR para o seu cômodo).

## Sistema de coordenadas (metros)
- X cresce para a direita, Z cresce para a frente (em direção à piscina/rua), Y para cima. Piso em y = 0.
- Paredes têm 0,15 m de espessura centradas nas linhas indicadas; pé-direito 2,8 m; NÃO há teto
  (vista de cima, estilo casinha de boneca). Luminárias pendentes ficam a y ≈ 2,55.
- Mantenha móveis a ≥ 0,08 m das paredes e fora do vão das portas (largura da porta + 0,9 m para abrir).

## Planta
- Quarto casal: x 0–3,6 · z 0–4,2. Janela na parede do fundo (z=0) x 1,2–2,4. Porta para a varanda (z=4,2) x 1,0–1,9; janela x 2,5–3,3.
- Quarto/escritório: x 3,6–6,8 · z 0–4,2. Janela fundo x 4,4–5,6. Porta (z=4,2) x 4,1–5,0; janela x 5,5–6,4. TV na parede x=6,8 (z 1,6–2,6, y 1,1–1,8) — é um objeto do cartão, NÃO recrie.
- Sala/cozinha: x 6,8–10,3 · z 0–4,2. Porta (z=4,2) x 7,4–8,3. Ar-condicionado em (7,6, 2,35, 0,2) — objeto do cartão, NÃO recrie. Meia-parede em x=10,3 (z 0–2,2) separa do balcão.
- Balcão (cozinha): x 10,3–12,5 · z 0–4,2. Janela fundo x 11,0–12,0. Vidro para a varanda (z=4,2) x 9,6–12,2.
- Varanda: x 0–12,5 · z 4,2–6,2 (coberta, aberta para a piscina por: porta x 2,9–3,8, janela x 4,6–6,6 e vidro x 8,0–12,0 na parede z=6,2).
- Banheiro: x 0–2,4 · z 6,2–8,8. Porta na parede x=2,4, z 7,0–7,9.
- Dispensa: x 0–2,4 · z 8,8–10,6. Porta na parede x=2,4, z 9,3–10,1.
- Garagem: x 0–3,0 · z 10,6–16,0. Vão aberto para o quintal na parede x=3,0 (z 11,4–15,4). Portão na parede z=16 (x 0,3–2,7). O carro (VW up! branco) fica centrado em (1,5, 13,6) — NÃO recrie, deixe o espaço.
- Deck da piscina: x 2,9–10,9 · z 7,2–12,4. Piscina: reta x 3,9–8,3 + meia-lua até x 9,9; z 8,2–11,4. A bomba (caixa em 11,35, 12,9) é objeto do cartão.
- Jardim (grama): x 10,9–13,4 · z 6,2–12,4; muro em x=13,4 com duas arandelas (y 2,0) em z 8,4 e 11,4. Pátio (asfalto): x 2,4–13,4 · z 12,4–16,6. Muro frontal z=16,6 com portão x 5,6–6,6.

## API disponível no `ctx` (não importe nada; não use globais)
- `ctx.THREE` — namespace do Three.js r170 (Shape, ExtrudeGeometry, TorusGeometry, LatheGeometry, Group, Mesh, MeshStandardMaterial, Color…).
- `ctx.box(w, h, d, mat, x, y, z, opts?)` → Mesh caixa centrada em (x, y, z). `opts.cast=false` / `opts.receive=false` desligam sombra.
- `ctx.cyl(rTop, rBottom, h, mat, x, y, z, seg=16, open=false)` → cilindro/cone centrado.
- `ctx.sph(r, mat, x, y, z)` → esfera.
- `ctx.place(group, x, z, ry=0, y=0)` → posiciona um Group (origem no centro da base) e adiciona à cena. Devolve o group.
- `ctx.add(mesh)` → adiciona um Mesh solto à cena (equivale a scene.add). NUNCA faça `ctx.add(x).rotation = …` — `add` devolve a cena.
- `ctx.std({ color, roughness, metalness, emissive, emissiveIntensity, transparent, opacity })` → novo MeshStandardMaterial.
- `ctx.rnd()` → aleatório determinístico (0–1), já semeado para o seu cômodo.
- `ctx.M` — materiais prontos: wall, lowWall, deck, basin, door, glass (vidro translúcido), wood, woodLite, woodDark, white, steel, chrome, dark, mattress, red, blue, navy, tan, chair, cushion, plant, leaf2, pot, trunk, soil, car, tire, mirror, screenOff, lightRed, lightWhite, book (array de 6 cores).
- `ctx.F` — peças prontas (cada uma devolve um Group com origem no centro da base; use com `ctx.place`):
  bed(w, l, blanketMat) [cabeceira em -z] · nightstand(lamp=true) · wardrobe(w, h=2, d=0.6, doors=2) · desk(w, d, withMonitor=true) ·
  officeChair() · bookshelf(w, h, d=0.3, levels=4, seed=1) · sofa(w, d, fabricMat) [encosto em -z] · diningTable(rx, rz) · chair(fabricMat) [encosto em -z] ·
  fridge() · stove() · hood() · cabinet(w, h, d, doors, mat?) · sink(w=0.5, d=0.4) · toilet() [caixa em -z] · shower(s) [vidro em +x e +z] · washbasin() [espelho em -z] ·
  shelves(w, h, d, levels, seed) · plant(size=1, seed=1) · tree() · ladder() · lounger(fabricMat) · parasol() · roundTable(r=0.45) · rug(w, d, colorHex).

## Regras
1. Escreva APENAS a função `function room<Nome>(ctx) { … }` no arquivo indicado (sem import/export, sem código fora da função, sem `console.log`). ES2020 válido.
2. Só primitivas e materiais; nada de texturas externas, nada de fetch, nada de luzes (PointLight/SpotLight etc. — o cartão já cuida da iluminação).
3. Orçamento: até ~150 meshes no cômodo. Prefira criar builders locais (funções dentro da sua função) para peças repetidas.
4. Sombras: os helpers já ligam cast/receive. Vidro/objetos finos: `{ cast: false }`.
5. Objetos do cartão (TV, ar-condicionado, bomba, carro, luminárias) NÃO devem ser recriados nem cobertos.
6. Verifique a sintaxe antes de terminar: `osascript -l JavaScript /caminho/do/arquivo.js` (deve sair sem erro; JavaScriptCore).
7. Capriche em detalhe realista e coerente com uma casa brasileira de classe média (ex.: churrasqueira na varanda, rede, tanque na área de serviço, etc.), mas com bom gosto: paleta discreta (madeira, branco, cinza, um acento de cor por cômodo).
8. No fim, responda com: (a) o caminho do arquivo, (b) lista curta do que você colocou, (c) qualquer dúvida/limitação.
