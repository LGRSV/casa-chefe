/* JobMatch — "Tinder de vagas". Modo demo: tudo no navegador (localStorage).
   Mecânica: deslizar para curtir/dispensar, super like, desfazer, match só quando os dois lados
   curtem, chat liberado após o match, filtros, denúncia/bloqueio e moderação de texto. */
(function () {
  'use strict';
  var D = window.JMData, MOD = window.Moderation;
  var KEY = 'jobmatch.v1';
  var SUPERS_PER_DAY = 3;
  var THRESHOLD = 110;

  /* ---------- estado ---------- */
  function fresh() {
    return { v: 1, role: null, me: null, myJobs: [], activeJob: null, swipes: {}, history: [], matches: [],
      msgs: {}, filters: { area: '', mode: '', min: 0 }, supers: { day: '', n: 0 }, reports: [] };
  }
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return s; } catch (e) { /* sem storage */ }
    return fresh();
  }
  var S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignora */ } }
  var view = 'deck', chatId = null, busy = false;

  /* ---------- utilidades ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    });
    [].concat(kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function hash100(s) { var x = 2166136261; for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0) % 100; }
  function money(n) { return 'R$ ' + Number(n).toLocaleString('pt-BR') + '/mês'; }
  function today() { return new Date().toISOString().slice(0, 10); }
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function toast(msg) {
    var t = h('div', { class: 'toast', role: 'status', text: msg });
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
  function tagsFrom(s) { return String(s || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 8); }
  function modCheck(fields) {
    for (var i = 0; i < fields.length; i++) { var r = MOD.check(fields[i]); if (!r.ok) return r.reason; }
    return null;
  }
  function hero(area) {
    var hue = D.HUE[area] || 210;
    return h('div', { class: 'hero', style: 'background:linear-gradient(135deg,hsl(' + hue + ' 65% 45%),hsl(' + ((hue + 40) % 360) + ' 65% 32%))', 'aria-hidden': 'true', text: D.EMOJI[area] || '💼' });
  }

  /* ---------- dados derivados ---------- */
  function allJobs() { return D.JOBS.concat(S.myJobs); }
  function jobById(id) { return allJobs().filter(function (j) { return j.id === id; })[0]; }
  function candById(id) { return id === 'me' ? S.me : D.CANDS.filter(function (c) { return c.id === id; })[0]; }
  function swipeKey(item) { return S.role === 'candidate' ? item.id : S.activeJob + ':' + item.id; }

  function deckItems() {
    var f = S.filters, out;
    if (S.role === 'candidate') {
      out = D.JOBS.filter(function (j) {
        return !S.swipes[j.id] && (!f.area || j.area === f.area) && (!f.mode || j.mode === f.mode) && j.salary >= (f.min || 0);
      });
      var me = S.me;
      out.sort(function (a, b) { return score(b) - score(a); });
      function score(j) { return (j.area === me.area ? 4 : 0) + (j.salary >= me.salary ? 2 : 0) + (j.city === me.city ? 1 : 0); }
    } else {
      var job = jobById(S.activeJob);
      if (!job) return [];
      out = D.CANDS.filter(function (c) {
        return !S.swipes[job.id + ':' + c.id] && (!f.area || c.area === f.area) && c.salary >= (f.min || 0);
      });
      out.sort(function (a, b) { return sc(b) - sc(a); });
      function sc(c) { return (c.area === job.area ? 4 : 0) + (c.salary <= job.salary ? 2 : 0) + (c.city === job.city ? 1 : 0); }
    }
    return out;
  }

  function likesBack(jobId, candId, isSuper) { return hash100(jobId + '|' + candId) < (isSuper ? 85 : 55); }

  /* ---------- swipe ---------- */
  function cardEl(item) {
    var isJob = S.role === 'candidate';
    var chips = h('div', { class: 'chips' }, item.tags.map(function (t) { return h('span', { class: 'chip', text: t }); }));
    var body = isJob
      ? [h('h2', { text: item.title }), h('div', { class: 'meta', text: item.company + ' · ' + item.area }),
         h('div', { class: 'meta', text: item.city + ' · ' + item.mode }), h('div', { class: 'salary', text: money(item.salary) }), chips, h('div', { text: item.desc })]
      : [h('h2', { text: item.name }), h('div', { class: 'meta', text: item.headline + ' · ' + item.area }),
         h('div', { class: 'meta', text: item.city }), h('div', { class: 'salary', text: 'Pretensão ' + money(item.salary) }), chips, h('div', { text: item.bio })];
    var c = h('article', { class: 'swipe', 'data-id': item.id, 'aria-label': isJob ? item.title + ' na ' + item.company : item.name + ', ' + item.headline }, [
      h('div', { class: 'herowrap' }, [hero(item.area),
        h('span', { class: 'stamp like', text: 'CURTIR' }), h('span', { class: 'stamp nope', text: 'NÃO' }), h('span', { class: 'stamp sup', text: 'SUPER' })]),
      h('div', { class: 'body' }, body)]);
    return c;
  }

  function attachDrag(card) {
    var sx, sy, dx = 0, dy = 0, on = false;
    var sl = $('.stamp.like', card), sn = $('.stamp.nope', card), ss = $('.stamp.sup', card);
    function paint() {
      card.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + dx / 18 + 'deg)';
      sl.style.opacity = Math.min(1, Math.max(0, dx / THRESHOLD));
      sn.style.opacity = Math.min(1, Math.max(0, -dx / THRESHOLD));
      ss.style.opacity = Math.min(1, Math.max(0, -dy / THRESHOLD)) * (Math.abs(dx) < 80 ? 1 : 0);
    }
    card.addEventListener('pointerdown', function (e) {
      if (busy) return;
      on = true; sx = e.clientX; sy = e.clientY; dx = dy = 0;
      card.classList.add('dragging'); card.classList.remove('snap');
      try { card.setPointerCapture(e.pointerId); } catch (x) { /* ok */ }
    });
    card.addEventListener('pointermove', function (e) { if (!on) return; dx = e.clientX - sx; dy = e.clientY - sy; paint(); });
    function end() {
      if (!on) return; on = false; card.classList.remove('dragging');
      if (dx > THRESHOLD) return decide('like');
      if (dx < -THRESHOLD) return decide('nope');
      if (dy < -THRESHOLD && Math.abs(dx) < 80) return decide('super');
      dx = dy = 0; card.classList.add('snap'); paint(); card.style.transform = '';
    }
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);
  }

  function decide(action) {
    if (busy) return;
    var items = deckItems(), item = items[0];
    if (!item) return;
    var card = $('.swipe:not(.behind)');
    if (action === 'super') {
      if (S.supers.day !== today()) S.supers = { day: today(), n: 0 };
      if (S.supers.n >= SUPERS_PER_DAY) { toast('Seus ' + SUPERS_PER_DAY + ' super likes de hoje acabaram.'); if (card) { card.style.transform = ''; } return; }
    }
    busy = true;
    if (card) {
      card.classList.remove('dragging'); card.classList.add('fly');
      var x = action === 'like' ? 700 : action === 'nope' ? -700 : 0, y = action === 'super' ? -700 : 40;
      card.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + x / 25 + 'deg)'; card.style.opacity = '0';
    }
    setTimeout(function () { commit(item, action); busy = false; render(); }, card ? 260 : 0);
  }

  function commit(item, action) {
    var key = swipeKey(item), entry = { key: key, action: action, matchId: null };
    S.swipes[key] = action;
    if (action === 'super') { if (S.supers.day !== today()) S.supers = { day: today(), n: 0 }; S.supers.n++; }
    var match = null;
    if (action !== 'nope') {
      var jobId = S.role === 'candidate' ? item.id : S.activeJob, candId = S.role === 'candidate' ? 'me' : item.id;
      if (likesBack(jobId, candId, action === 'super')) {
        match = { id: uid('m'), jobId: jobId, candId: candId, ts: Date.now() };
        S.matches.push(match); entry.matchId = match.id;
        S.msgs[match.id] = [{ from: 'sys', text: 'Vocês deram match! Conversem sobre a vaga e mantenham o papo profissional.', ts: Date.now() }];
      }
    }
    S.history.push(entry); save();
    if (match) showMatch(match);
  }

  function undo() {
    var last = S.history[S.history.length - 1];
    if (!last || last.matchId || busy) return;
    S.history.pop(); delete S.swipes[last.key];
    if (last.action === 'super' && S.supers.n > 0) S.supers.n--;
    save(); render();
  }

  function otherName(m) {
    var job = jobById(m.jobId);
    if (S.role === 'candidate') return job ? job.company + ' — ' + job.title : 'Vaga';
    var c = candById(m.candId); return (c ? c.name : 'Candidato') + (job ? ' — ' + job.title : '');
  }
  function otherArea(m) { var j = jobById(m.jobId); return j ? j.area : ''; }

  function showMatch(m) {
    var ov = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Novo match' }, [
      h('div', { class: 'modal' }, [h('h2', { text: 'É um match! 🎉' }), h('div', { text: otherName(m) }),
        h('button', { class: 'btn', id: 'go-chat', text: 'Conversar', onclick: function () { ov.remove(); openChat(m.id); } }),
        h('button', { class: 'btn ghost', id: 'keep', text: 'Continuar deslizando', onclick: function () { ov.remove(); } })])]);
    document.body.appendChild(ov); $('#go-chat', ov).focus();
  }

  /* ---------- telas ---------- */
  function root() { return $('#main'); }
  function render() {
    var m = root(); m.textContent = '';
    renderNav();
    if (!S.role || !S.me) return renderOnboarding(m);
    if (view === 'chat') return renderChat(m);
    if (view === 'matches') return renderMatches(m);
    if (view === 'jobs') return renderJobs(m);
    if (view === 'profile') return renderProfile(m);
    renderDeck(m);
  }

  function renderNav() {
    var nav = $('#nav'); nav.textContent = '';
    if (!S.role || !S.me) return;
    var tabs = [['deck', 'Descobrir'], ['matches', 'Matches']];
    if (S.role === 'company') tabs.push(['jobs', 'Vagas']);
    tabs.push(['profile', 'Perfil']);
    tabs.forEach(function (t) {
      var sel = view === t[0] || (view === 'chat' && t[0] === 'matches');
      var b = h('button', { role: 'tab', 'aria-selected': sel ? 'true' : 'false', 'data-tab': t[0], onclick: function () { view = t[0]; render(); } }, [t[1]]);
      if (t[0] === 'matches' && S.matches.length) b.appendChild(h('span', { class: 'dot', text: String(S.matches.length) }));
      nav.appendChild(b);
    });
  }

  function field(label, input) { return h('label', {}, [label, input]); }
  function areaSelect(val, withAll) {
    var s = h('select', {}, (withAll ? [h('option', { value: '', text: 'Todas as áreas' })] : []).concat(D.AREAS.map(function (a) { return h('option', { value: a, text: a }); })));
    s.value = val || ''; return s;
  }

  function renderOnboarding(m) {
    if (!S.role) {
      m.appendChild(h('div', { class: 'card-form' }, [
        h('h1', { text: 'Bem-vindo ao JobMatch' }),
        h('p', { text: 'Deslize para a direita nas vagas (ou candidatos) que combinam com você. Deu match dos dois lados? A conversa é liberada. Aqui é só trabalho.' }),
        h('div', { class: 'seg' }, [
          h('button', { class: 'btn', id: 'role-cand', text: 'Procuro emprego', onclick: function () { S.role = 'candidate'; save(); render(); } }),
          h('button', { class: 'btn ghost', id: 'role-comp', text: 'Quero contratar', onclick: function () { S.role = 'company'; save(); render(); } })])]));
      return;
    }
    renderProfileForm(m, true);
  }

  function renderProfileForm(m, first) {
    var cand = S.role === 'candidate', me = S.me || {};
    var name = h('input', { id: 'f-name', required: true, maxlength: '60', value: me.name || '' });
    var head = h('input', { id: 'f-head', maxlength: '60', value: me.headline || '', placeholder: 'ex.: Dev Front-end' });
    var area = areaSelect(me.area || D.AREAS[0]); area.id = 'f-area';
    var city = h('input', { id: 'f-city', maxlength: '60', value: me.city || '', placeholder: 'Cidade, UF' });
    var sal = h('input', { id: 'f-sal', type: 'number', min: '0', step: '100', value: me.salary || '' });
    var tags = h('input', { id: 'f-tags', maxlength: '120', value: (me.tags || []).join(', '), placeholder: 'React, SQL, Inglês' });
    var bio = h('textarea', { id: 'f-bio', maxlength: '300' }); bio.value = me.bio || '';
    var err = h('div', { class: 'err', id: 'f-err', role: 'alert' });
    var kids = [h('h1', { text: first ? (cand ? 'Seu perfil profissional' : 'Sua empresa') : 'Perfil' }),
      field(cand ? 'Nome' : 'Nome da empresa', name)];
    if (cand) kids.push(field('Cargo desejado', head));
    kids.push(field('Área', area), field('Cidade', city));
    if (cand) kids.push(field('Pretensão salarial (R$/mês)', sal), field('Habilidades (separe por vírgula)', tags), field('Sobre você', bio));
    kids.push(err, h('button', { class: 'btn', id: 'f-save', text: first ? 'Começar' : 'Salvar', onclick: function () {
      var nm = name.value.trim();
      if (!nm) { err.textContent = 'Informe o nome.'; return; }
      if (cand && !(Number(sal.value) >= 0 && sal.value !== '')) { err.textContent = 'Informe a pretensão salarial.'; return; }
      var bad = modCheck([nm, head.value, city.value, tags.value, bio.value]);
      if (bad) { err.textContent = 'Texto bloqueado: ' + bad + '. O JobMatch é só para trabalho.'; return; }
      S.me = { id: 'me', name: nm, headline: head.value.trim(), area: area.value, city: city.value.trim(), salary: Number(sal.value) || 0, tags: tagsFrom(tags.value), bio: bio.value.trim() };
      save(); view = cand ? 'deck' : (S.myJobs.length ? 'deck' : 'jobs'); render();
    } }));
    m.appendChild(h('form', { class: 'card-form', onsubmit: function (e) { e.preventDefault(); } }, kids));
  }

  function renderDeck(m) {
    var f = S.filters, cand = S.role === 'candidate';
    var fa = areaSelect(f.area, true); fa.id = 'flt-area'; fa.setAttribute('aria-label', 'Filtrar por área');
    fa.onchange = function () { f.area = fa.value; save(); render(); };
    var bar = h('div', { class: 'filters' }, [fa]);
    if (cand) {
      var fm = h('select', { id: 'flt-mode', 'aria-label': 'Filtrar por modalidade' }, [h('option', { value: '', text: 'Qualquer modalidade' })].concat(D.MODS.map(function (x) { return h('option', { value: x, text: x }); })));
      fm.value = f.mode || ''; fm.onchange = function () { f.mode = fm.value; save(); render(); }; bar.appendChild(fm);
    } else if (S.myJobs.length) {
      var js = h('select', { id: 'flt-job', 'aria-label': 'Vaga ativa' }, S.myJobs.map(function (j) { return h('option', { value: j.id, text: j.title }); }));
      js.value = S.activeJob; js.onchange = function () { S.activeJob = js.value; save(); render(); }; bar.insertBefore(js, fa);
    }
    var fmin = h('input', { id: 'flt-min', type: 'number', min: '0', step: '500', placeholder: cand ? 'Salário mín.' : 'Pretensão máx.', 'aria-label': 'Salário', value: f.min || '' });
    fmin.onchange = function () { f.min = Number(fmin.value) || 0; save(); render(); };
    if (cand) bar.appendChild(fmin);
    m.appendChild(bar);

    if (!cand && !S.myJobs.length) {
      m.appendChild(h('div', { class: 'empty' }, [h('h2', { text: 'Publique uma vaga primeiro' }), h('p', { text: 'Para ver candidatos, crie ao menos uma vaga.' }),
        h('button', { class: 'btn', id: 'go-jobs', text: 'Criar vaga', onclick: function () { view = 'jobs'; render(); } })]));
      return;
    }
    var items = deckItems();
    if (!items.length) {
      m.appendChild(h('div', { class: 'empty' }, [h('h2', { text: 'Por hoje é só!' }), h('p', { text: cand ? 'Não há mais vagas com esses filtros.' : 'Não há mais candidatos para esta vaga.' }),
        h('button', { class: 'btn ghost', id: 'clear-flt', text: 'Limpar filtros', onclick: function () { S.filters = { area: '', mode: '', min: 0 }; save(); render(); } }),
        h('button', { class: 'btn', id: 'review-nope', text: 'Rever dispensados', onclick: function () {
          Object.keys(S.swipes).forEach(function (k) { if (S.swipes[k] === 'nope' && (cand || k.indexOf(S.activeJob + ':') === 0)) delete S.swipes[k]; });
          S.history = S.history.filter(function (e) { return S.swipes[e.key]; }); save(); render(); } })]));
      return;
    }
    var deck = h('div', { class: 'deck', id: 'deck', role: 'group', 'aria-label': 'Cartas' });
    if (items[1]) { var b = cardEl(items[1]); b.classList.add('behind'); b.setAttribute('aria-hidden', 'true'); deck.appendChild(b); }
    var top = cardEl(items[0]); deck.appendChild(top); attachDrag(top);
    m.appendChild(deck);
    var last = S.history[S.history.length - 1];
    var supersLeft = SUPERS_PER_DAY - (S.supers.day === today() ? S.supers.n : 0);
    m.appendChild(h('div', { class: 'actions' }, [
      h('button', { class: 'round undo', id: 'btn-undo', 'aria-label': 'Desfazer', title: 'Desfazer', text: '↩', disabled: !last || !!last.matchId, onclick: undo }),
      h('button', { class: 'round nope', id: 'btn-nope', 'aria-label': 'Dispensar', title: 'Dispensar (←)', text: '✕', onclick: function () { decide('nope'); } }),
      h('button', { class: 'round sup', id: 'btn-super', 'aria-label': 'Super like (' + supersLeft + ' restantes)', title: 'Super like (↑) — ' + supersLeft + ' hoje', text: '★', disabled: supersLeft <= 0, onclick: function () { decide('super'); } }),
      h('button', { class: 'round like', id: 'btn-like', 'aria-label': 'Curtir', title: 'Curtir (→)', text: '♥', onclick: function () { decide('like'); } })]));
  }

  function lastMsg(id) { var a = S.msgs[id] || []; var m = a[a.length - 1]; return m ? (m.from === 'me' ? 'Você: ' : '') + m.text : ''; }
  function renderMatches(m) {
    if (!S.matches.length) {
      m.appendChild(h('div', { class: 'empty' }, [h('h2', { text: 'Nenhum match ainda' }), h('p', { text: 'Curta algumas ' + (S.role === 'candidate' ? 'vagas' : 'candidatos') + ' — quando os dois lados curtirem, aparece aqui.' })]));
      return;
    }
    var list = h('div', { class: 'list', id: 'match-list' });
    S.matches.slice().reverse().forEach(function (mt) {
      var hue = D.HUE[otherArea(mt)] || 210;
      list.appendChild(h('button', { class: 'row', 'data-match': mt.id, onclick: function () { openChat(mt.id); } }, [
        h('span', { class: 'avatar', style: 'background:hsl(' + hue + ' 60% 40%)', 'aria-hidden': 'true', text: D.EMOJI[otherArea(mt)] || '💼' }),
        h('span', {}, [h('div', { class: 't', text: otherName(mt) }), h('div', { class: 's', text: lastMsg(mt.id) })])]));
    });
    m.appendChild(list);
  }

  function openChat(id) { chatId = id; view = 'chat'; render(); }
  var REPLIES_COMP = ['Oi! Vimos seu perfil e gostamos muito. Quando você tem um horário para um papo rápido?', 'Que bom ter você por aqui! Pode contar um pouco da sua experiência mais recente?', 'Obrigado pelo interesse! Podemos marcar uma conversa de 20 minutos esta semana?'];
  var REPLIES_CAND = ['Olá! Fiquei muito interessado(a) na vaga. Pode me contar mais sobre o time?', 'Oi! Tenho experiência com isso. Qual é a faixa e o formato de contratação?', 'Obrigado(a) pelo match! Tenho disponibilidade para conversar esta semana.'];

  function renderChat(m) {
    var mt = S.matches.filter(function (x) { return x.id === chatId; })[0];
    if (!mt) { view = 'matches'; return render(); }
    var msgs = h('div', { class: 'msgs', id: 'msgs', role: 'log', 'aria-live': 'polite' });
    function paint() {
      msgs.textContent = '';
      (S.msgs[mt.id] || []).forEach(function (x) { msgs.appendChild(h('div', { class: x.from === 'sys' ? 'sys' : 'msg' + (x.from === 'me' ? ' me' : ''), text: x.text })); });
      msgs.scrollTop = msgs.scrollHeight;
    }
    var input = h('input', { id: 'chat-input', maxlength: '500', placeholder: 'Mensagem profissional…', 'aria-label': 'Mensagem' });
    function send() {
      var t = input.value.trim(); if (!t) return;
      var bad = MOD.check(t);
      if (!bad.ok) { toast('Mensagem bloqueada: ' + bad.reason + '.'); return; }
      S.msgs[mt.id].push({ from: 'me', text: t, ts: Date.now() }); input.value = ''; save(); paint();
      var pool = S.role === 'candidate' ? REPLIES_COMP : REPLIES_CAND, n = S.msgs[mt.id].length;
      setTimeout(function () {
        if (!S.msgs[mt.id] || view !== 'chat' || chatId !== mt.id) { if (S.msgs[mt.id]) { S.msgs[mt.id].push({ from: 'them', text: pool[n % pool.length], ts: Date.now() }); save(); } return; }
        S.msgs[mt.id].push({ from: 'them', text: pool[n % pool.length], ts: Date.now() }); save(); paint();
      }, 900);
    }
    m.appendChild(h('section', { class: 'chat' }, [
      h('div', { class: 'chat-head' }, [h('button', { class: 'btn ghost', id: 'chat-back', 'aria-label': 'Voltar', text: '←', onclick: function () { view = 'matches'; render(); } }),
        h('div', { class: 'grow', text: otherName(mt) }),
        h('button', { class: 'btn ghost', id: 'chat-report', text: 'Denunciar', onclick: function () {
          if (!window.confirm('Denunciar e bloquear? A conversa será encerrada.')) return;
          S.reports.push({ matchId: mt.id, ts: Date.now() }); S.matches = S.matches.filter(function (x) { return x.id !== mt.id; }); delete S.msgs[mt.id];
          save(); view = 'matches'; render(); toast('Denúncia registrada. Match encerrado.'); } })]),
      msgs,
      h('div', { class: 'sys', text: 'Demo: as respostas são simuladas.' }),
      h('form', { class: 'chat-in', onsubmit: function (e) { e.preventDefault(); send(); } }, [input, h('button', { class: 'btn', id: 'chat-send', type: 'submit', text: 'Enviar' })])]));
    paint();
  }

  function renderJobs(m) {
    var title = h('input', { id: 'j-title', maxlength: '80' });
    var area = areaSelect(S.me.area); area.id = 'j-area';
    var mode = h('select', { id: 'j-mode' }, D.MODS.map(function (x) { return h('option', { value: x, text: x }); }));
    var city = h('input', { id: 'j-city', maxlength: '60', value: S.me.city || '' });
    var sal = h('input', { id: 'j-sal', type: 'number', min: '0', step: '100' });
    var tags = h('input', { id: 'j-tags', maxlength: '120', placeholder: 'SQL, Excel' });
    var desc = h('textarea', { id: 'j-desc', maxlength: '400' });
    var err = h('div', { class: 'err', id: 'j-err', role: 'alert' });
    var mine = S.myJobs.map(function (j) {
      return h('div', { class: 'row', style: 'cursor:default' }, [h('span', {}, [h('div', { class: 't', text: j.title }), h('div', { class: 's', text: j.city + ' · ' + j.mode + ' · ' + money(j.salary) })]),
        h('button', { class: 'btn ghost', style: 'margin-left:auto', 'aria-label': 'Remover ' + j.title, text: 'Remover', onclick: function () {
          S.myJobs = S.myJobs.filter(function (x) { return x.id !== j.id; });
          if (S.activeJob === j.id) S.activeJob = S.myJobs[0] ? S.myJobs[0].id : null;
          save(); render(); } })]);
    });
    m.appendChild(h('div', { class: 'list' }, [h('div', { class: 'card-form' }, [h('h1', { text: 'Minhas vagas' }), mine.length ? null : h('p', { text: 'Nenhuma vaga ainda.' })])].concat(mine)));
    m.appendChild(h('form', { class: 'card-form', onsubmit: function (e) { e.preventDefault(); } }, [
      h('h1', { text: 'Publicar vaga', style: 'font-size:20px' }), field('Título da vaga', title), field('Área', area), field('Modalidade', mode), field('Cidade', city),
      field('Salário (R$/mês)', sal), field('Requisitos (vírgula)', tags), field('Descrição', desc), err,
      h('button', { class: 'btn', id: 'j-save', text: 'Publicar', onclick: function () {
        if (!title.value.trim() || !(Number(sal.value) > 0)) { err.textContent = 'Informe título e salário (obrigatório, maior que zero).'; return; }
        var bad = modCheck([title.value, city.value, tags.value, desc.value]);
        if (bad) { err.textContent = 'Texto bloqueado: ' + bad + '. Só publicamos vagas profissionais.'; return; }
        var job = { id: uid('mj'), title: title.value.trim(), company: S.me.name, area: area.value, mode: mode.value, city: city.value.trim(), salary: Number(sal.value), tags: tagsFrom(tags.value), desc: desc.value.trim() };
        S.myJobs.push(job); S.activeJob = S.activeJob || job.id; save(); view = 'deck'; render(); toast('Vaga publicada.'); } })]));
  }

  function renderProfile(m) {
    renderProfileForm(m, false);
    m.appendChild(h('div', { class: 'card-form' }, [
      h('p', { text: 'Modo demo: seus dados ficam só neste navegador.' }),
      h('button', { class: 'btn ghost', id: 'reset', text: 'Apagar tudo e recomeçar', onclick: function () {
        if (!window.confirm('Apagar perfil, matches e conversas deste navegador?')) return;
        S = fresh(); save(); view = 'deck'; render(); } })]));
  }

  /* ---------- teclado ---------- */
  document.addEventListener('keydown', function (e) {
    if (view !== 'deck' || !S.role || document.querySelector('.overlay')) return;
    var t = e.target && e.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); decide('like'); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); decide('nope'); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); decide('super'); }
  });

  window.__jm = { state: function () { return S; }, likesBack: likesBack, reset: function () { S = fresh(); save(); view = 'deck'; render(); } };
  render();
})();
