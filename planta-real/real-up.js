// VW up! TSI Pepper branco — carroceria por perfil lateral extrudado, com afinamento (tumblehome) e cantos arredondados.
// criarUp(THREE) → Group; metros, Y para cima, frente em +Z, origem no chão entre as rodas. Lado direito em -X.
export function criarUp(THREE) {
  const g = new THREE.Group();
  g.name = 'up';
  const W = 1.645, EIXO = 1.21, RODA = 0.292, BITOLA = 1.42;

  // ---------- materiais ----------
  const pintura = new THREE.MeshPhysicalMaterial({ color: 0xf4f4f1, roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1 });
  const vidro = new THREE.MeshStandardMaterial({ color: 0x0a0e12, roughness: 0.05, metalness: 0.1, envMapIntensity: 1.4 });
  const preto = new THREE.MeshStandardMaterial({ color: 0x0c0d0e, roughness: 0.25 });
  const pretoFosco = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.8 });
  const cromado = new THREE.MeshStandardMaterial({ color: 0xdfe3e8, metalness: 1, roughness: 0.12 });
  const vermelho = new THREE.MeshPhysicalMaterial({ color: 0xd3121b, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 });
  const lente = new THREE.MeshStandardMaterial({ color: 0x5d666f, metalness: 0.95, roughness: 0.1, envMapIntensity: 1.8 });
  const neblina = new THREE.MeshStandardMaterial({ color: 0xe8edf2, roughness: 0.05, emissive: 0x303030 });
  const lanterna = new THREE.MeshStandardMaterial({ color: 0x8e0b12, roughness: 0.15, emissive: 0x2a0004 });
  const pneu = new THREE.MeshStandardMaterial({ color: 0x18191a, roughness: 0.92 });
  const liga = new THREE.MeshStandardMaterial({ color: 0x3b3e43, metalness: 0.75, roughness: 0.32 });

  // ---------- texturas em canvas: placa, logo VW, PEPPER, grade colmeia ----------
  const tex = (w, h, draw) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  const placaT = tex(512, 160, (x, w, h) => {
    x.fillStyle = '#f6f6f3'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#1f4fa3'; x.fillRect(0, 0, w, 34);
    x.fillStyle = '#fff'; x.font = 'bold 24px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('BRASIL', w / 2, 17);
    x.fillStyle = '#151515'; x.font = 'bold 96px Arial';
    x.fillText('UPT 5I19', w / 2, 100);
    x.strokeStyle = '#222'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6);
  });
  const logoT = tex(256, 256, (x, w) => {
    const c = w / 2;
    x.fillStyle = '#f2f4f6'; x.beginPath(); x.arc(c, c, c - 2, 0, 7); x.fill();
    x.fillStyle = '#5e6670'; x.beginPath(); x.arc(c, c, c - 16, 0, 7); x.fill();
    x.save(); x.beginPath(); x.arc(c, c, c - 16, 0, 7); x.clip();
    x.strokeStyle = '#f2f4f6'; x.lineWidth = 17; x.lineJoin = 'miter'; x.lineCap = 'butt';
    x.beginPath(); x.moveTo(80, 30); x.lineTo(128, 146); x.lineTo(176, 30); x.stroke();                       // V
    x.beginPath(); x.moveTo(30, 92); x.lineTo(86, 222); x.lineTo(128, 140); x.lineTo(170, 222); x.lineTo(226, 92); x.stroke();   // W
    x.restore();
  });
  const pepperT = tex(512, 96, (x, w, h) => {
    x.fillStyle = '#f4f4f1'; x.fillRect(0, 0, w, h);   // fundo na cor da pintura: sem transparência (um sombreador a menos)
    x.fillStyle = '#d3121b'; x.font = 'italic bold 70px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('PEPPER', w / 2 - 24, h / 2);
    x.beginPath(); x.moveTo(w / 2 + 128, 34); x.lineTo(w / 2 + 170, 48); x.lineTo(w / 2 + 128, 62); x.fill();   // a setinha do logo
  });
  const gradeT = tex(256, 128, (x, w, h) => {
    x.fillStyle = '#121314'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#2f3237'; x.lineWidth = 4;
    for (let yy = 0; yy < h + 16; yy += 16) for (let xx = 0; xx < w + 16; xx += 18) {
      const ox = (yy / 16) % 2 ? 9 : 0;
      x.beginPath(); x.moveTo(xx + ox - 9, yy); x.lineTo(xx + ox, yy - 8); x.lineTo(xx + ox + 9, yy); x.lineTo(xx + ox, yy + 8); x.closePath(); x.stroke();
    }
  });
  gradeT.wrapS = gradeT.wrapT = THREE.RepeatWrapping;

  // ---------- auxiliares ----------
  // normais suaves com ângulo de vinco: solda vértices pela posição e média só das faces parecidas
  const suaviza = (geo, ang = 50) => {
    const p = geo.attributes.position, n = p.count, lim = Math.cos(ang * Math.PI / 180);
    const fn = [], a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let i = 0; i < n; i += 3) {
      a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
      const f = c.clone().sub(b).cross(a.clone().sub(b));
      const ar = f.length();
      fn.push(ar > 1e-12 ? f.multiplyScalar(1 / ar) : f.set(0, 0, 0), ar);
    }
    const key = (i) => `${Math.round(p.getX(i) * 1e4)},${Math.round(p.getY(i) * 1e4)},${Math.round(p.getZ(i) * 1e4)}`;
    const mapa = new Map();
    for (let i = 0; i < n; i++) { const k = key(i); if (!mapa.has(k)) mapa.set(k, []); mapa.get(k).push(i); }
    const out = new Float32Array(n * 3), s = new THREE.Vector3();
    for (const idx of mapa.values()) for (const i of idx) {
      const mine = fn[(i / 3 | 0) * 2];
      s.set(0, 0, 0);
      for (const j of idx) { const o = fn[(j / 3 | 0) * 2]; if (o.dot(mine) >= lim) s.addScaledVector(o, fn[(j / 3 | 0) * 2 + 1] + 1e-6); }
      if (s.lengthSq() < 1e-12) s.copy(mine);
      s.normalize();
      out[i * 3] = s.x; out[i * 3 + 1] = s.y; out[i * 3 + 2] = s.z;
    }
    geo.setAttribute('normal', new THREE.BufferAttribute(out, 3));
    return geo;
  };
  // meia-largura da carroceria por altura (afina acima da linha de cintura) e pelo comprimento (pontas arredondadas)
  const meia = (y, z) => {
    let k = 1;
    if (y > 0.93) k *= 1 - 0.19 * Math.min(1, (y - 0.93) / 0.57) ** 1.2;   // tumblehome
    if (y < 0.4) k *= 0.985;
    const zf = z - 1.42, zt = -z - 1.5;
    if (zf > 0) k *= Math.sqrt(Math.max(0.05, 1 - (zf / 0.46) ** 2.4)) * 0.18 + 0.82 * (1 - 0.1 * (zf / 0.4) ** 2);   // frente arredonda em planta
    if (zt > 0) k *= 1 - 0.07 * (zt / 0.3) ** 2;   // traseira quase reta
    return (W / 2) * k;
  };
  // extruda um perfil lateral (u = z do carro, v = y) pela largura e aplica o afinamento
  const lateral = (shape, larg = W, bev = 0.05, molda = true, segs = 24) => {
    const bt = Math.min(bev, larg / 4);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: larg - 2 * bt, bevelEnabled: bev > 0, bevelThickness: bt, bevelSize: bev * 0.7, bevelSegments: 4, curveSegments: segs, steps: 1 });
    const p = geo.attributes.position, d = larg - 2 * bt;
    for (let i = 0; i < p.count; i++) {
      const sx = p.getX(i), sy = p.getY(i), sz = p.getZ(i);
      let x = -(sz - d / 2);
      if (molda) x *= meia(sy, sx) / (W / 2);
      p.setXYZ(i, x, sy, sx);
    }
    geo.computeVertexNormals();
    return suaviza(geo);
  };
  const malha = (geo, mat, sombra = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = sombra; m.receiveShadow = true; g.add(m); return m; };
  // peça encostada na lateral (lado = -1 direito, +1 esquerdo), seguindo a meia-largura
  const naLateral = (geo, mat, z, y, lado, folga = 0.004) => {
    const m = malha(geo, mat, false);
    m.position.set(lado * (meia(y, z) + folga), y, z);
    m.rotation.y = lado * Math.PI / 2;
    return m;
  };

  // ---------- carroceria inferior (até a cintura) com arcos de roda ----------
  const ARCO = 0.34;
  const corpo = new THREE.Shape();
  corpo.moveTo(-1.70, 0.20);
  corpo.lineTo(-EIXO - ARCO - 0.02, 0.20);
  corpo.absarc(-EIXO, RODA + 0.02, ARCO, Math.PI + 0.36, -0.36, true);
  corpo.lineTo(EIXO - ARCO - 0.02, 0.20);
  corpo.absarc(EIXO, RODA + 0.02, ARCO, Math.PI + 0.36, -0.36, true);
  corpo.lineTo(1.66, 0.20);
  corpo.bezierCurveTo(1.76, 0.21, 1.80, 0.30, 1.80, 0.44);   // para-choque dianteiro
  corpo.bezierCurveTo(1.80, 0.62, 1.78, 0.74, 1.72, 0.82);   // nariz
  corpo.bezierCurveTo(1.60, 0.92, 1.30, 0.98, 0.95, 1.00);   // capô curto e alto
  corpo.lineTo(-1.58, 0.99);                                 // cintura
  corpo.bezierCurveTo(-1.70, 0.98, -1.76, 0.90, -1.77, 0.70);  // ombro traseiro
  corpo.bezierCurveTo(-1.79, 0.42, -1.77, 0.24, -1.70, 0.20);  // para-choque traseiro
  const corpoM = malha(lateral(corpo, W, 0.07), pintura);
  corpoM.updateMatrixWorld(true);
  // cola uma peça na superfície do corpo: raio a partir de 'de' na direção 'dir'; frente local +Z vira a normal
  const ray = new THREE.Raycaster(), Z = new THREE.Vector3(0, 0, 1);
  const cola = (obj, de, dir, folga = 0.004) => {
    ray.set(new THREE.Vector3(...de), new THREE.Vector3(...dir).normalize());
    const h = ray.intersectObject(corpoM, false)[0];
    if (!h) return obj;
    const n = h.face.normal.clone().transformDirection(corpoM.matrixWorld);
    obj.position.copy(h.point).addScaledVector(n, folga);
    obj.quaternion.setFromUnitVectors(Z, n);
    if (!obj.parent) g.add(obj);
    return obj;
  };
  const peca = (geo, mat) => new THREE.Mesh(geo, mat);

  // ---------- estufa (vidros) e teto ----------
  const estufa = new THREE.Shape();
  estufa.moveTo(0.95, 0.99);
  estufa.bezierCurveTo(0.62, 1.20, 0.30, 1.40, 0.02, 1.47);    // para-brisa
  estufa.bezierCurveTo(-0.5, 1.50, -1.25, 1.48, -1.52, 1.43);  // teto cai de leve para trás
  estufa.bezierCurveTo(-1.64, 1.40, -1.70, 1.28, -1.72, 1.02); // vigia traseira quase vertical
  estufa.lineTo(-1.58, 0.99);
  estufa.closePath();
  malha(lateral(estufa, W - 0.012, 0.05), vidro);
  // teto branco: casca por cima do topo da estufa (1 cm acima), cobrindo as bordas do vidro
  const teto = new THREE.Shape();
  teto.moveTo(0.16, 1.452);
  teto.bezierCurveTo(-0.25, 1.548, -1.25, 1.525, -1.53, 1.462);
  teto.lineTo(-1.53, 1.41);
  teto.bezierCurveTo(-1.25, 1.45, -0.5, 1.47, 0.16, 1.40);
  teto.closePath();
  malha(lateral(teto, W - 0.002, 0.03), pintura);
  // coluna C larga (cor da carroceria) e coluna A fina, só nas laterais
  for (const lado of [-1, 1]) {
    const cC = new THREE.Shape();
    cC.moveTo(-1.18, 0.99); cC.lineTo(-1.30, 1.42); cC.lineTo(-1.54, 1.41); cC.bezierCurveTo(-1.64, 1.40, -1.67, 1.25, -1.665, 0.99); cC.closePath();
    const gC = lateral(cC, 0.07, 0.015, false);
    const mC = malha(gC, pintura, false);
    mC.position.x = lado * (meia(1.2, -1.4) - 0.022);
    // coluna B preta (moldura entre as portas)
    const cB = new THREE.Shape();
    cB.moveTo(-0.28, 0.99); cB.lineTo(-0.30, 1.43); cB.lineTo(-0.38, 1.43); cB.lineTo(-0.36, 0.99); cB.closePath();
    const mB = malha(lateral(cB, 0.05, 0.008, false), preto, false);
    mB.position.x = lado * (meia(1.2, -0.3) - 0.012);
  }

  // ---------- frente (tudo colado na superfície do nariz) ----------
  const frente = (geo, mat, x, y, folga, rotZ = 0) => { const m = cola(peca(geo, mat), [x, y, 3], [0, 0, -1], folga); m.rotateZ(rotZ); return m; };
  // faixa preta entre os faróis, filete vermelho e logo VW cromado
  frente(new THREE.BoxGeometry(0.66, 0.075, 0.012), preto, 0, 0.80, 0.004);
  frente(new THREE.BoxGeometry(0.66, 0.012, 0.012), vermelho, 0, 0.756, 0.006);
  const logoGeo = new THREE.CylinderGeometry(0.088, 0.088, 0.018, 48).rotateX(Math.PI / 2);
  frente(logoGeo, new THREE.MeshStandardMaterial({ map: logoT, metalness: 0.85, roughness: 0.2 }), 0, 0.79, 0.012);
  // faróis grandes, trapezoidais, abraçando as quinas
  const farol = new THREE.Shape();
  farol.moveTo(-0.17, -0.06); farol.lineTo(0.15, -0.075); farol.bezierCurveTo(0.2, -0.07, 0.21, 0.05, 0.17, 0.075);
  farol.lineTo(-0.15, 0.075); farol.bezierCurveTo(-0.2, 0.07, -0.2, -0.055, -0.17, -0.06);
  const farolGeo = new THREE.ExtrudeGeometry(farol, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3, curveSegments: 10 });
  for (const lado of [-1, 1]) {
    const f = frente(farolGeo, lente, lado * 0.50, 0.80, 0.0);
    if (lado < 0) f.scale.x = -1;
    frente(new THREE.SphereGeometry(0.042, 20, 12).scale(1, 1, 0.35), cromado, lado * 0.57, 0.805, 0.025);   // refletor
    frente(new THREE.SphereGeometry(0.026, 16, 10).scale(1, 1, 0.35), cromado, lado * 0.43, 0.80, 0.025);
    frente(new THREE.BoxGeometry(0.22, 0.01, 0.006), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe4ecff, emissiveIntensity: 0.7 }), lado * 0.50, 0.738, 0.022);   // DRL
  }
  // para-choque: painel preto trapezoidal com colmeia, cantos com faróis de neblina
  const pnl = new THREE.Shape();
  pnl.moveTo(-0.6, -0.13); pnl.lineTo(0.6, -0.13); pnl.bezierCurveTo(0.68, -0.13, 0.70, -0.08, 0.69, -0.02);
  pnl.lineTo(0.64, 0.13); pnl.lineTo(-0.64, 0.13); pnl.lineTo(-0.69, -0.02); pnl.bezierCurveTo(-0.70, -0.08, -0.68, -0.13, -0.6, -0.13);
  frente(new THREE.ExtrudeGeometry(pnl, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.01, bevelSegments: 2, curveSegments: 8 }), pretoFosco, 0, 0.40, 0.0);
  const grade = frente(new THREE.PlaneGeometry(0.98, 0.17), new THREE.MeshStandardMaterial({ map: gradeT, roughness: 0.6 }), 0, 0.39, 0.02);
  grade.material.map.repeat.set(3.5, 0.9);
  for (const lado of [-1, 1]) {
    frente(new THREE.CylinderGeometry(0.048, 0.052, 0.02, 28).rotateX(Math.PI / 2), cromado, lado * 0.58, 0.40, 0.022);
    frente(new THREE.CircleGeometry(0.038, 28), neblina, lado * 0.58, 0.40, 0.034);
  }
  frente(new THREE.PlaneGeometry(0.40, 0.125), new THREE.MeshStandardMaterial({ map: placaT, roughness: 0.4 }), 0, 0.42, 0.03);

  // ---------- traseira: tampa de vidro preto, lanternas, para-choque (colados na traseira) ----------
  const tras = (geo, mat, x, y, folga) => cola(peca(geo, mat), [x, y, -3], [0, 0, 1], folga);
  const tampa = new THREE.Shape();
  tampa.moveTo(-0.6, -0.28); tampa.lineTo(0.6, -0.28); tampa.lineTo(0.58, 0.30); tampa.bezierCurveTo(0.48, 0.36, -0.48, 0.36, -0.58, 0.30); tampa.closePath();
  tras(new THREE.ExtrudeGeometry(tampa, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.012, bevelSegments: 3, curveSegments: 10 }), preto, 0, 0.95, 0.0);
  for (const lado of [-1, 1]) {
    tras(new THREE.BoxGeometry(0.16, 0.24, 0.012), lanterna, lado * 0.53, 0.88, 0.02);
    tras(new THREE.BoxGeometry(0.12, 0.05, 0.014), new THREE.MeshStandardMaterial({ color: 0xe9e9e9, roughness: 0.2 }), lado * 0.53, 0.80, 0.022);   // ré
  }
  tras(new THREE.PlaneGeometry(0.40, 0.125), new THREE.MeshStandardMaterial({ map: placaT, roughness: 0.4 }), 0, 0.76, 0.022);
  tras(new THREE.BoxGeometry(1.3, 0.09, 0.02), pretoFosco, 0, 0.27, 0.004);

  // ---------- laterais: saia preta, vincos das portas, maçanetas, PEPPER, retrovisores ----------
  for (const lado of [-1, 1]) {
    const saia = malha(new THREE.BoxGeometry(0.04, 0.07, 1.62), pretoFosco, false);
    saia.position.set(lado * (meia(0.25, 0) - 0.005), 0.235, 0);
    // vincos das portas (linhas finas escuras)
    for (const z of [0.86, -0.33, -1.16]) {
      const v = naLateral(new THREE.PlaneGeometry(0.004, 0.66), pretoFosco, z, 0.62, lado, 0.003);
      v.rotation.y = lado * Math.PI / 2;
    }
    // maçanetas
    for (const z of [0.2, -0.92]) {
      const h = malha(new THREE.BoxGeometry(0.02, 0.025, 0.13), pintura, false);
      h.position.set(lado * (meia(0.88, z) + 0.008), 0.88, z);
    }
    // PEPPER na porta dianteira
    const pp = naLateral(new THREE.PlaneGeometry(0.30, 0.056), new THREE.MeshStandardMaterial({ map: pepperT, roughness: 0.3 }), 0.48, 0.74, lado, 0.003);
    // retrovisor vermelho com braço preto
    const braco = malha(new THREE.BoxGeometry(0.07, 0.05, 0.1), preto, false);
    braco.position.set(lado * (meia(1.02, 0.84) + 0.02), 1.03, 0.84);
    const cap = malha(new THREE.SphereGeometry(0.1, 24, 14), vermelho);
    cap.scale.set(0.75, 0.55, 0.62);
    cap.position.set(lado * (meia(1.02, 0.84) + 0.1), 1.06, 0.82);
    const esp = malha(new THREE.CircleGeometry(0.055, 20), vidro, false);
    esp.scale.set(1.2, 0.85, 1);
    esp.position.set(lado * (meia(1.02, 0.84) + 0.1), 1.06, 0.758); esp.rotation.y = Math.PI;
  }

  // ---------- rodas: pneu com perfil, liga grafite de 5 raios, caixa preta no arco ----------
  const perfil = [];
  for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + Math.PI * i / 12; perfil.push(new THREE.Vector2(RODA - 0.035 + Math.cos(a) * 0.035, Math.sin(a) * 0.09)); }
  const pneuGeo = new THREE.LatheGeometry([new THREE.Vector2(0.19, -0.09), ...perfil, new THREE.Vector2(0.19, 0.09)], 40).rotateZ(Math.PI / 2);
  const aroGeo = new THREE.CylinderGeometry(0.195, 0.195, 0.03, 40).rotateZ(Math.PI / 2);
  const cuboGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.03, 20).rotateZ(Math.PI / 2);
  const raioGeo = new THREE.BoxGeometry(0.02, 0.16, 0.035);
  for (const z of [EIXO, -EIXO]) for (const lado of [-1, 1]) {
    const rd = new THREE.Group();
    rd.position.set(lado * BITOLA / 2, RODA, z);
    g.add(rd);
    const pn = new THREE.Mesh(pneuGeo, pneu); pn.castShadow = true; rd.add(pn);
    const aro = new THREE.Mesh(aroGeo, pretoFosco); aro.position.x = lado * 0.035; rd.add(aro);
    const cubo = new THREE.Mesh(cuboGeo, cromado); cubo.position.x = lado * 0.06; rd.add(cubo);
    for (let k = 0; k < 10; k++) {   // 5 pares de raios
      const r = new THREE.Mesh(raioGeo, liga);
      const a = Math.floor(k / 2) * Math.PI * 2 / 5 + (k % 2 ? 0.16 : -0.16);
      r.position.set(lado * 0.055, Math.cos(a) * 0.11, Math.sin(a) * 0.11);
      r.rotation.x = -a;
      rd.add(r);
    }
    const borda = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.012, 8, 40).rotateY(Math.PI / 2), liga);
    borda.position.x = lado * 0.05; rd.add(borda);
    // caixa de roda escura (não deixa ver o vão do arco)
    const cx = malha(new THREE.CylinderGeometry(ARCO - 0.01, ARCO - 0.01, W - 0.16, 28, 1, true, Math.PI / 2 - 1.2, 2.4).rotateZ(Math.PI / 2).scale(-1, 1, 1), pretoFosco, false);   // escala negativa vira as faces para dentro (sem DoubleSide)
    cx.position.set(0, RODA + 0.02, z);
  }
  // assoalho escuro (fecha a vista por baixo)
  const piso = malha(new THREE.BoxGeometry(W - 0.2, 0.04, 3.3), pretoFosco, false);
  piso.position.y = 0.2;
  return g;
}
