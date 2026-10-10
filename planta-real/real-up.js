// VW up! TSI Pepper branco — vencedor da disputa (up-8) com arcos e saias revisados.
// criarUp(THREE) → Group; metros, Y para cima, frente em +Z, origem no chão entre as rodas.
// Lado direito em -X. Vidros escurecidos, teto branco com colunas largas, tampa de vidro preto.
export function criarUp(THREE) {
  const g = new THREE.Group();
  g.name = 'up';

  // ---------- materiais (Standard/Physical apenas, ~15 no total) ----------
  const pintura = new THREE.MeshPhysicalMaterial({ color: 0xf3f3f0, roughness: 0.3, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.25, sheenColor: 0xfff6ea, envMapIntensity: 0.9 });
  // vidro escurecido: quase preto, reflexo de céu forte (envMap), sem transparência
  const vidro = new THREE.MeshPhysicalMaterial({ color: 0x0d1217, roughness: 0.04, metalness: 0, envMapIntensity: 1.2 });
  const pretoBrilho = new THREE.MeshStandardMaterial({ color: 0x0b0c0d, roughness: 0.15 });
  const pretoFosco = new THREE.MeshStandardMaterial({ color: 0x1a1b1c, roughness: 0.75 });
  const decal = new THREE.MeshStandardMaterial({ color: 0x161718, roughness: 0.6 });
  const cromado = new THREE.MeshStandardMaterial({ color: 0xd9dde2, metalness: 1, roughness: 0.15 });
  const farol = new THREE.MeshStandardMaterial({ color: 0xeef2f5, roughness: 0.05, emissive: 0x202020 });
  const lanterna = new THREE.MeshStandardMaterial({ color: 0x9c0f14, roughness: 0.2 });
  const vermelho = new THREE.MeshPhysicalMaterial({ color: 0xd0141c, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
  const pneu = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const liga = new THREE.MeshStandardMaterial({ color: 0x3a3d42, metalness: 0.7, roughness: 0.35 });

  // ---------- uma textura de canvas (atlas 512 × 256): placa, grade e PEPPER ----------
  // Um só upload e nenhum alphaTest: o primeiro render não ganha programa de sombreador novo
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 256;
  const x = cv.getContext('2d');
  // placa Mercosul genérica (não é a placa real): faixa y 0–128
  x.fillStyle = '#f5f5f2'; x.fillRect(0, 0, 512, 128);
  x.fillStyle = '#1d4fa0'; x.fillRect(0, 0, 512, 26);
  x.fillStyle = '#ffffff'; x.font = 'bold 20px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('BRASIL', 256, 13);
  x.fillStyle = '#111111'; x.font = 'bold 74px Arial';
  x.fillText('BRA2E19', 256, 70);
  x.strokeStyle = '#222222'; x.lineWidth = 6; x.strokeRect(3, 3, 506, 122);
  // grade colmeia: x 0–256, y 128–256
  x.save(); x.beginPath(); x.rect(0, 128, 256, 128); x.clip();
  x.fillStyle = '#16181a'; x.fillRect(0, 128, 256, 128);
  x.strokeStyle = '#3b3f44'; x.lineWidth = 6;
  for (let i = -128; i < 384; i += 28) {
    x.beginPath(); x.moveTo(i, 128); x.lineTo(i + 128, 256); x.stroke();
    x.beginPath(); x.moveTo(i + 128, 128); x.lineTo(i, 256); x.stroke();
  }
  x.restore();
  // adesivo PEPPER vermelho sobre o branco da pintura: x 256–512, y 128–192
  x.fillStyle = '#f3f3f0'; x.fillRect(256, 128, 256, 64);
  x.fillStyle = '#d0141c'; x.font = 'italic bold 46px Arial'; x.textAlign = 'left';
  x.fillText('PEPPER', 262, 162);
  const atlas = new THREE.CanvasTexture(cv);
  atlas.colorSpace = THREE.SRGBColorSpace;
  // recorte do atlas (u0, v0, du, dv em fração; v a partir de baixo); clones dividem a mesma imagem
  const recorte = (u0, v0, du, dv) => {
    const t = atlas.clone();
    t.offset.set(u0, v0); t.repeat.set(du, dv);
    return t;
  };
  const gradeMat = new THREE.MeshStandardMaterial({ map: recorte(0, 0, 0.5, 0.5), roughness: 0.6 });
  const placaMat = new THREE.MeshStandardMaterial({ map: recorte(0, 0.5, 1, 0.5), roughness: 0.5 });
  const pepperMat = new THREE.MeshStandardMaterial({ map: recorte(0.5, 0.25, 0.5, 0.25), roughness: 0.25, metalness: 0.05 });

  // ---------- helpers ----------
  const add = (geo, mat, x = 0, y = 0, z = 0, sombra = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = sombra;
    m.receiveShadow = sombra;
    g.add(m);
    return m;
  };
  // UV 0..1 na caixa do proprio contorno
  const uvCaixa = (geo) => {
    const p = geo.attributes.position;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < p.count; i++) {
      x0 = Math.min(x0, p.getX(i)); x1 = Math.max(x1, p.getX(i));
      y0 = Math.min(y0, p.getY(i)); y1 = Math.max(y1, p.getY(i));
    }
    const sx = x1 - x0 || 1, sy = y1 - y0 || 1;
    const uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x0) / sx, (p.getY(i) - y0) / sy);
    uv.needsUpdate = true;
    return geo;
  };
  // retangulos arredondados no plano XY, virados para +Z
  const faixaGeo = (rects, r) => {
    const shapes = rects.map(([x0, y0, x1, y1]) => {
      const s = new THREE.Shape();
      s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r);
      s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1);
      s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r);
      s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
      return s;
    });
    return uvCaixa(new THREE.ShapeGeometry(shapes, 4));
  };
  // prisma de perfil lateral (z, y) estendido em X com `larg`; quinas biseladas por dentro
  const prisma = (pts, larg, bev) => {
    const s = new THREE.Shape();
    pts.forEach(([z, y], i) => (i ? s.lineTo(z, y) : s.moveTo(z, y)));
    s.closePath();
    const prof = larg - 2 * bev;
    const geo = new THREE.ExtrudeGeometry(s, { depth: prof, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelOffset: -bev, bevelSegments: 3, curveSegments: 4 });
    geo.translate(0, 0, -prof / 2);
    geo.rotateY(-Math.PI / 2); // shape x -> z, extrusao -> X
    return geo;
  };
  // planos no lado do carro (lado -1 = direito, -X; +1 = esquerdo, +X), normal para fora
  const plano = (listaPts, lado, xf, mat, sombra = true, uv = false) => {
    const shapes = listaPts.map((pts) => {
      const s = new THREE.Shape();
      pts.forEach(([z, y], i) => { const u = lado < 0 ? z : -z; if (i) s.lineTo(u, y); else s.moveTo(u, y); });
      return s;
    });
    let geo = new THREE.ShapeGeometry(shapes, 4);
    if (uv) uvCaixa(geo);
    geo.rotateY(lado < 0 ? -Math.PI / 2 : Math.PI / 2);
    geo.translate(lado * xf, 0, 0);
    return add(geo, mat, 0, 0, 0, sombra);
  };
  const rect = (z0, y0, z1, y1) => [[z0, y0], [z1, y0], [z1, y1], [z0, y1]];
  // arco da caixa de roda: centro (zw, 0.305), raio 0.36, de y=0.20 (esq.) por cima ate y=0.20 (dir.)
  const arco = (zw) => {
    const pts = [], a0 = 3.4383, a1 = -0.2967;
    for (let i = 0; i <= 16; i++) {
      const a = a0 + (a1 - a0) * i / 16;
      pts.push([zw + 0.36 * Math.cos(a), 0.305 + 0.36 * Math.sin(a)]);
    }
    return pts;
  };
  // arredonda cantos marcados (c = true) de um poligono (z, y, c)
  const arred = (P, r) => {
    const out = [], n = P.length;
    for (let i = 0; i < n; i++) {
      const [x1, y1, c] = P[i];
      if (!c) { out.push([x1, y1]); continue; }
      const [x0, yy0] = P[(i - 1 + n) % n], [x2, y2] = P[(i + 1) % n];
      const d1 = Math.hypot(x0 - x1, yy0 - y1), d2 = Math.hypot(x2 - x1, y2 - y1);
      const rr = Math.min(r, d1 / 2, d2 / 2);
      const ax = x1 + (x0 - x1) * rr / d1, ay = y1 + (yy0 - y1) * rr / d1;
      const bx = x1 + (x2 - x1) * rr / d2, by = y1 + (y2 - y1) * rr / d2;
      for (let k = 0; k <= 2; k++) {
        const t = k / 2, s = 1 - t;
        out.push([s * s * ax + 2 * s * t * x1 + t * t * bx, s * s * ay + 2 * s * t * y1 + t * t * by]);
      }
    }
    return out;
  };

  // ---------- carroceria: perfil lateral baixo (capo curto, para-choque, caixas de roda) ----------
  const corpo = [];
  const C = (z, y) => corpo.push([z, y, true]);
  const B = (z, y) => corpo.push([z, y, false]);
  C(-1.76, 0.20);
  for (const [z, y] of arco(-1.21)) B(z, y);
  for (const [z, y] of arco(1.21)) B(z, y);
  C(1.76, 0.20);
  C(1.84, 0.27);                // nariz arredondada embaixo
  B(1.86, 0.34); B(1.86, 0.76); // frente quase reta (faixa e moldura apoiam aqui)
  C(1.80, 0.85);
  C(1.05, 0.955);               // capo curto e baixo
  C(-1.70, 0.955);
  C(-1.76, 0.88);
  C(-1.76, 0.30);
  add(prisma(arred(corpo, 0.07), 1.64, 0.035), pintura);

  // habitaculo: teto branco reto e longo, para-brisa deitado, coluna C larga
  const cab = [[-1.72, 0.90, 1], [-1.76, 1.10, 1], [-1.76, 1.26, 1], [-1.73, 1.40, 1], [-1.64, 1.49, 1], [-1.52, 1.50, 1], [0.02, 1.50, 1], [0.80, 1.00, 1], [0.92, 0.90, 1]]
    .map(([z, y, c]) => [z, y, !!c]);
  add(prisma(arred(cab, 0.07), 1.50, 0.06), pintura);

  // para-brisa: placa fina no plano inclinado do habitaculo (deslocada 8 mm para fora)
  add(prisma([[0.0243, 1.5067], [0.8043, 1.0067], [0.80, 1.00], [0.02, 1.50]], 1.44, 0), vidro, 0, 0, 0, false);

  // vidros laterais escurecidos: dianteiro e traseiro, pilar B de 8 cm e coluna C larga
  const vidrosLat = [
    [[-0.10, 1.00], [-0.10, 1.43], [0.00, 1.45], [0.66, 1.03], [0.62, 1.00]],
    [[-0.18, 1.00], [-0.18, 1.43], [-1.50, 1.43], [-1.60, 1.30], [-1.60, 1.00]],
  ];
  plano(vidrosLat, -1, 0.7535, vidro, false);
  plano(vidrosLat, 1, 0.7535, vidro, false);

  // tampa traseira de vidro preto inteira, com lanternas nos cantos superiores
  add(faixaGeo([[-0.66, 0.40, 0.66, 1.21]], 0.10).rotateY(Math.PI).translate(0, 0, -1.766), vidro, 0, 0, 0, false);
  add(faixaGeo([[0.42, 1.05, 0.64, 1.17], [-0.64, 1.05, -0.42, 1.17], [-0.14, 1.14, 0.14, 1.17]], 0.03).rotateY(Math.PI).translate(0, 0, -1.772), lanterna, 0, 0, 0, false);
  add(faixaGeo([[-0.72, 0.22, 0.72, 0.36]], 0.04).rotateY(Math.PI).translate(0, 0, -1.772), pretoFosco);
  // antena barbatana (shark fin) preta, na traseira do teto
  add(prisma([[-1.36, 1.499], [-1.16, 1.499], [-1.21, 1.535], [-1.29, 1.575], [-1.33, 1.545]], 0.006, 0), pretoBrilho, 0, 0, 0, false);

  // ---------- frente ----------
  // faixa preta brilhante ligando os farois, filete vermelho embaixo, logo VW no centro
  add(faixaGeo([[-0.56, 0.69, 0.56, 0.79]], 0.02).translate(0, 0, 1.866), pretoBrilho);
  add(faixaGeo([[-0.56, 0.672, 0.56, 0.686]], 0.004).translate(0, 0, 1.868), vermelho);
  // emblema VW 3D cromado: anel (torus) + V e W como traços finos, fundidos em uma malha
  {
    const traco = (pts, w) => pts.slice(1).map((p, i) => {
      const [x0, y0] = pts[i], [x1, y1] = p;
      const len = Math.hypot(x1 - x0, y1 - y0);
      return new THREE.BoxGeometry(len + w, w, 0.010)
        .rotateZ(Math.atan2(y1 - y0, x1 - x0))
        .translate((x0 + x1) / 2, (y0 + y1) / 2, 0);
    });
    const partes = [new THREE.TorusGeometry(0.052, 0.0072, 8, 30)];
    partes.push(...traco([[-0.030, 0.030], [0, -0.004], [0.030, 0.030]], 0.0105));
    partes.push(...traco([[-0.030, -0.012], [-0.015, -0.034], [0, -0.012], [0.015, -0.034], [0.030, -0.012]], 0.0105));
    const pos = [], nor = [];
    for (const geo of partes) {
      const g = geo.index ? geo.toNonIndexed() : geo;
      pos.push(...g.attributes.position.array);
      nor.push(...g.attributes.normal.array);
    }
    const logo = new THREE.BufferGeometry();
    logo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    logo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    add(logo, cromado, 0, 0.74, 1.884);
  }
  // para-choque: moldura preta larga com grade, placa generica no centro
  add(faixaGeo([[-0.72, 0.27, 0.72, 0.56]], 0.07).translate(0, 0, 1.862), gradeMat);
  add(faixaGeo([[-0.18, 0.355, 0.18, 0.445]], 0.01).translate(0, 0, 1.874), placaMat, 0, 0, 0, false);
  // farois: mascara escura + refletor claro (dois por lado)
  const farolShape = (cx, cy, k) => {
    const pts = [[-0.15, -0.05], [0.13, -0.06], [0.16, 0.02], [0.10, 0.065], [-0.13, 0.06], [-0.16, 0.0]];
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => (i ? s.lineTo(cx + x * k, cy + y * k) : s.moveTo(cx + x * k, cy + y * k)));
    return s;
  };
  for (const cx of [-0.62, 0.62]) {
    add(new THREE.ShapeGeometry(farolShape(cx, 0.80, 1.2), 4).translate(0, 0, 1.871), pretoFosco);
    add(new THREE.ShapeGeometry(farolShape(cx, 0.80, 0.94), 4).translate(0, 0, 1.876), farol, 0, 0, 0, false);
  }
  // farois de neblina redondos nos cantos da moldura: aro cromado e lente clara
  for (const L of [-1, 1]) {
    add(new THREE.CylinderGeometry(0.055, 0.055, 0.012, 20).rotateX(Math.PI / 2), cromado, L * 0.60, 0.40, 1.868);
    add(new THREE.CylinderGeometry(0.040, 0.040, 0.014, 20).rotateX(Math.PI / 2), farol, L * 0.60, 0.40, 1.876, false);
  }

  // ---------- laterais ----------
  for (const L of [-1, 1]) {
    // saia preta ao longo da base, interrompida pelas caixas de roda
    plano([rect(-0.85, 0.20, 0.85, 0.30)], L, 0.8238, pretoFosco);
    // frestas das portas (pilar B, junta da porta dianteira e traseira) e linha da soleira
    plano([rect(-0.20, 0.32, -0.18, 0.95), rect(0.82, 0.30, 0.84, 0.95), rect(-1.62, 0.30, -1.60, 0.95), rect(-1.60, 0.31, 0.84, 0.33)], L, 0.8238, decal, false);
    // macanetas horizontais
    plano([rect(0.02, 0.78, 0.14, 0.80), rect(-1.46, 0.78, -1.34, 0.80)], L, 0.8238, decal, false);
    // adesivo PEPPER atras da roda dianteira
    plano([rect(0.44, 0.65, 0.70, 0.735)], L, 0.8238, pepperMat, false, true);
    // retrovisor: base preta e capa vermelha
    // retrovisor no pe do pilar A (z ~0,74): haste preta, capa vermelha em gota, aro preto
    add(new THREE.BoxGeometry(0.07, 0.05, 0.08), pretoFosco, L * 0.80, 0.975, 0.74);
    const capa = add(new THREE.SphereGeometry(0.058, 14, 10), vermelho, L * 0.88, 1.0, 0.74);
    capa.scale.set(1.3, 0.9, 1.6);
    add(new THREE.BoxGeometry(0.03, 0.02, 0.10), pretoFosco, L * 0.84, 0.99, 0.74);
    // maçaneta da porta traseira/dianteira: cromo fino
    add(new THREE.BoxGeometry(0.012, 0.012, 0.12), cromado, L * 0.8265, 0.79, 0.08, false);
    add(new THREE.BoxGeometry(0.012, 0.012, 0.12), cromado, L * 0.8265, 0.79, -1.40, false);
  }

  // ---------- rodas: pneu 185/55 R15 (raio 0,305, largura 0,185), aro de 15" (raio 0,19) ----------
  const pneuGeo = new THREE.LatheGeometry([
    [0.20, -0.092], [0.262, -0.092], [0.29, -0.088], [0.302, -0.075], [0.305, -0.05],
    [0.305, 0.05], [0.302, 0.075], [0.29, 0.088], [0.262, 0.092], [0.20, 0.092],
  ].map(([r, y]) => new THREE.Vector2(r, y)), 32).rotateZ(Math.PI / 2);

  // liga grafite com 5 raios (janelas entre os raios), eixo alinhado a X
  const rimGeo = (() => {
    const s = new THREE.Shape();
    s.absarc(0, 0, 0.19, 0, Math.PI * 2, false);
    const n = 5;
    for (let k = 0; k < n; k++) {
      const c = k * 2 * Math.PI / n + Math.PI / n;
      const h = 0.30;
      const buraco = new THREE.Path();
      for (let i = 0; i <= 3; i++) { const a = c - h + (2 * h) * i / 3; const r = 0.07; i ? buraco.lineTo(r * Math.cos(a), r * Math.sin(a)) : buraco.moveTo(r * Math.cos(a), r * Math.sin(a)); }
      for (let i = 0; i <= 3; i++) { const a = c + h - (2 * h) * i / 3; buraco.lineTo(0.165 * Math.cos(a), 0.165 * Math.sin(a)); }
      s.holes.push(buraco);
    }
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.024, bevelEnabled: false, curveSegments: 8 });
    geo.translate(0, 0, -0.012);
    geo.rotateY(Math.PI / 2);
    return geo;
  })();
  const hubGeo = new THREE.CircleGeometry(0.045, 20);

  for (const L of [-1, 1]) {
    for (const zw of [1.21, -1.21]) {
      const x0 = L * 0.71;
      add(pneuGeo, pneu, x0, 0.305, zw);
      add(rimGeo, liga, x0 + L * 0.075, 0.305, zw);
      const hub = add(hubGeo, cromado, x0 + L * 0.105, 0.305, zw, false);
      hub.rotation.y = L * Math.PI / 2;
    }
  }

  return g;
}
