/* Moderação básica: o JobMatch é só para trabalho profissional.
   Bloqueia texto de perfil, vaga e chat que sugira serviço sexual / encontro / conteúdo adulto.
   É um filtro de primeira linha (lista de termos); em produção a mesma regra roda no banco
   (supabase/schema.sql) e há denúncia + revisão humana. */
(function (g) {
  var norm = function (s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[0-9@$]/g, function (c) { return { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '@': 'a', '$': 's' }[c] || c; })
      .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  };
  var RULES = [
    /\bgarot[ao] de programa\b/, /\bacompanhante\b/, /\bescort\b/, /\bsugar (baby|daddy|mommy)\b/,
    /\bonly ?fans\b/, /\bprivacy\b.*\b(fotos|videos)\b/, /\bnudes?\b/, /\bfotos? intimas?\b/,
    /\bconteudo adulto\b/, /\bmassagem (tantrica|com final feliz|erotica)\b/, /\bsexo\b/, /\bsexy\b/,
    /\bmotel\b/, /\bfaco programa\b/, /\bsem compromisso\b.*\b(encontro|noite)\b/,
    /\bencontro (casual|intimo|discreto)\b/, /\bputaria\b/, /\bsafad[ao]\b/
  ];
  g.Moderation = {
    norm: norm,
    check: function (text) {
      var n = norm(text);
      // profissões legítimas que usam a palavra (acompanhante terapêutico / hospitalar / de idosos)
      if (/\bacompanhante (terapeutic[oa]|hospitalar|de idosos?|de pacientes?|escolar)\b/.test(n)) n = n.replace(/\bacompanhante\b/g, 'cuidador');
      for (var i = 0; i < RULES.length; i++) if (RULES[i].test(n)) return { ok: false, reason: 'conteúdo fora do escopo profissional' };
      return { ok: true };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
