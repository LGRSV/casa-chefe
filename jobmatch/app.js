/* JobMatch — painel de contratação para empresas. Modo demo: tudo no navegador (localStorage).
   Fluxo: publicar vaga → receber candidaturas ranqueadas por compatibilidade → mover no funil →
   conversar. Conteúdo passa por moderação (só trabalho). */
(function () {
  'use strict';
  var D = window.JMData, MOD = window.Moderation;
  var KEY = 'jobmatch.v2';
  var STAGES = [['novo', 'Novo'], ['triagem', 'Triagem'], ['entrevista', 'Entrevista'], ['proposta', 'Proposta'], ['contratado', 'Contratado'], ['descartado', 'Descartado']];
  var STATUS = [['aberta', 'Aberta'], ['pausada', 'Pausada'], ['encerrada', 'Encerrada']];

  /* ---------- estado ---------- */
  function fresh() { return { v: 2, company: null, jobs: [], stages: {}, msgs: {}, reports: [], candJob: null, stageFilter: '' }; }
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 2) return s; } catch (e) { /* sem storage */ } return fresh(); }
  var S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignora */ } }
  var view = 'overview', openThread = null, expanded = {};

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
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function norm(s) { return MOD.norm(s); }
  function toast(msg) { var t = h('div', { class: 'toast', role: 'status', text: msg }); document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600); }
  function tagsFrom(s) { return String(s || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 8); }
  function modCheck(fields) { for (var i = 0; i < fields.length; i++) { var r = MOD.check(fields[i]); if (!r.ok) return r.reason; } return null; }
  function field(label, input) { return h('label', {}, [label, input]); }
  function sel(options, val, id) { var s = h('select', { id: id }, options.map(function (o) { return h('option', { value: o[0], text: o[1] }); })); s.value = val; return s; }
  function labelOf(list, k) { return (list.filter(function (x) { return x[0] === k; })[0] || [k, k])[1]; }

  /* ---------- domínio ---------- */
  function jobById(id) { return S.jobs.filter(function (j) { return j.id === id; })[0]; }
  function candById(id) { return D.CANDS.filter(function (c) { return c.id === id; })[0]; }
  function stageKey(job, cand) { return job.id + ':' + cand.id; }
  function stageOf(job, cand) { return S.stages[stageKey(job, cand)] || 'novo'; }

  /* candidaturas simuladas: mesma área da vaga, ou algumas de outras áreas (determinístico) */
  function applicants(job) { return D.CANDS.filter(function (c) { return c.area === job.area || hash100(job.id + c.id) < 25; }); }

  /* compatibilidade 0–100: área 40, habilidades 30, salário 20, cidade 10 */
  function compat(job, c) {
    var jt = job.tags.map(norm), ct = c.tags.map(norm);
    var hit = jt.filter(function (t) { return ct.indexOf(t) >= 0; });
    var area = c.area === job.area ? 40 : 0;
    var skills = jt.length ? Math.round(30 * hit.length / jt.length) : 15;
    var salary = c.salary <= job.salary ? 20 : c.salary <= job.salary * 1.15 ? 10 : 0;
    var city = c.city === job.city ? 10 : (job.mode === 'Remoto' ? 6 : 0);
    return { total: area + skills + salary + city, area: area, skills: skills, salary: salary, city: city, hit: hit };
  }
  function ranked(job) {
    return applicants(job).map(function (c) { return { c: c, s: compat(job, c) }; }).sort(function (a, b) { return b.s.total - a.s.total || a.c.name.localeCompare(b.c.name); });
  }

  /* ---------- telas ---------- */
  function render() {
    var m = $('#main'); m.textContent = '';
    var nav = $('#nav'); nav.textContent = '';
    if (!S.company) return renderOnboarding(m);
    [['overview', 'Visão geral'], ['jobs', 'Vagas'], ['cands', 'Candidatos'], ['msgs', 'Mensagens'], ['profile', 'Empresa']].forEach(function (t) {
      nav.appendChild(h('button', { role: 'tab', 'data-tab': t[0], 'aria-selected': view === t[0] ? 'true' : 'false', onclick: function () { view = t[0]; openThread = null; render(); }, text: t[1] }));
    });
    ({ overview: renderOverview, jobs: renderJobs, cands: renderCands, msgs: renderMsgs, profile: renderProfile }[view])(m);
  }

  function renderOnboarding(m) { renderCompanyForm(m, true); }

  function renderCompanyForm(m, first) {
    var c = S.company || {};
    var name = h('input', { id: 'f-name', maxlength: '60', value: c.name || '' });
    var area = sel(D.AREAS.map(function (a) { return [a, a]; }), c.area || D.AREAS[0], 'f-area');
    var city = h('input', { id: 'f-city', maxlength: '60', value: c.city || '', placeholder: 'Cidade, UF' });
    var err = h('div', { class: 'err', id: 'f-err', role: 'alert' });
    m.appendChild(h('form', { class: 'card-form', onsubmit: function (e) { e.preventDefault(); } }, [
      h('h1', { text: first ? 'Painel de contratação' : 'Sua empresa' }),
      first ? h('p', { text: 'Publique vagas, receba candidatos ranqueados por compatibilidade e acompanhe cada etapa. Aqui é só trabalho.' }) : null,
      field('Nome da empresa', name), field('Área principal', area), field('Cidade', city), err,
      h('button', { class: 'btn', id: 'f-save', text: first ? 'Começar' : 'Salvar', onclick: function () {
        if (!name.value.trim()) { err.textContent = 'Informe o nome da empresa.'; return; }
        var bad = modCheck([name.value, city.value]);
        if (bad) { err.textContent = 'Texto bloqueado: ' + bad + '. O JobMatch é só para trabalho.'; return; }
        S.company = { name: name.value.trim(), area: area.value, city: city.value.trim() }; save();
        if (first) view = S.jobs.length ? 'overview' : 'jobs'; render();
      } })]));
  }

  function renderOverview(m) {
    var open = S.jobs.filter(function (j) { return j.status === 'aberta'; }).length, total = 0, counts = {};
    STAGES.forEach(function (s) { counts[s[0]] = 0; });
    S.jobs.forEach(function (j) { applicants(j).forEach(function (c) { total++; counts[stageOf(j, c)]++; }); });
    var kpi = function (id, v, l) { return h('div', { class: 'kpi', id: id }, [h('div', { class: 'v', text: String(v) }), h('div', { class: 'l', text: l })]); };
    m.appendChild(h('div', { class: 'page' }, [
      h('h1', { text: 'Olá, ' + S.company.name }),
      h('div', { class: 'kpis' }, [kpi('k-open', open, 'Vagas abertas'), kpi('k-total', total, 'Candidaturas'), kpi('k-int', counts.entrevista, 'Em entrevista'), kpi('k-hired', counts.contratado, 'Contratados')]),
      h('h2', { text: 'Funil' }),
      total ? h('div', { class: 'funnel', id: 'funnel' }, STAGES.map(function (s) {
        return h('div', { class: 'frow' }, [h('span', { class: 'fl', text: s[1] }),
          h('span', { class: 'fbar' }, [h('span', { style: 'width:' + Math.round(100 * counts[s[0]] / total) + '%' })]), h('span', { class: 'fn', text: String(counts[s[0]]) })]);
      })) : h('p', { class: 'meta', text: 'Publique uma vaga para começar a receber candidaturas.' }),
      S.jobs.length ? null : h('button', { class: 'btn', id: 'go-jobs', text: 'Publicar primeira vaga', onclick: function () { view = 'jobs'; render(); } })]));
  }

  function renderJobs(m) {
    var title = h('input', { id: 'j-title', maxlength: '80' });
    var area = sel(D.AREAS.map(function (a) { return [a, a]; }), S.company.area, 'j-area');
    var mode = sel(D.MODS.map(function (x) { return [x, x]; }), D.MODS[0], 'j-mode');
    var city = h('input', { id: 'j-city', maxlength: '60', value: S.company.city || '' });
    var sal = h('input', { id: 'j-sal', type: 'number', min: '1', step: '100' });
    var tags = h('input', { id: 'j-tags', maxlength: '120', placeholder: 'React, SQL, Inglês' });
    var desc = h('textarea', { id: 'j-desc', maxlength: '400' });
    var err = h('div', { class: 'err', id: 'j-err', role: 'alert' });
    var list = S.jobs.map(function (j) {
      var st = h('select', { 'aria-label': 'Status de ' + j.title, 'data-status': j.id }, STATUS.map(function (x) { return h('option', { value: x[0], text: x[1] }); }));
      st.value = j.status; st.onchange = function () { j.status = st.value; save(); render(); };
      return h('div', { class: 'row jobrow', 'data-job': j.id }, [
        h('span', { class: 'grow' }, [h('div', { class: 't', text: j.title }), h('div', { class: 's', text: [j.city, j.mode, money(j.salary), applicants(j).length + ' candidaturas'].join(' · ') })]),
        st, h('button', { class: 'btn ghost', text: 'Candidatos', onclick: function () { S.candJob = j.id; view = 'cands'; save(); render(); } }),
        h('button', { class: 'btn ghost', 'aria-label': 'Remover ' + j.title, text: 'Remover', onclick: function () {
          if (!window.confirm('Remover a vaga "' + j.title + '" e seu histórico?')) return;
          S.jobs = S.jobs.filter(function (x) { return x.id !== j.id; });
          Object.keys(S.stages).forEach(function (k) { if (k.indexOf(j.id + ':') === 0) delete S.stages[k]; });
          Object.keys(S.msgs).forEach(function (k) { if (k.indexOf(j.id + ':') === 0) delete S.msgs[k]; });
          if (S.candJob === j.id) S.candJob = null; save(); render(); } })]);
    });
    m.appendChild(h('div', { class: 'page' }, [
      h('h1', { text: 'Vagas' }),
      S.jobs.length ? h('div', { class: 'list', id: 'job-list' }, list) : h('p', { class: 'meta', text: 'Nenhuma vaga ainda.' }),
      h('form', { class: 'card-form flat', onsubmit: function (e) { e.preventDefault(); } }, [
        h('h2', { text: 'Publicar vaga' }), field('Título da vaga', title), field('Área', area), field('Modalidade', mode), field('Cidade', city),
        field('Salário (R$/mês)', sal), field('Requisitos (separe por vírgula)', tags), field('Descrição', desc), err,
        h('button', { class: 'btn', id: 'j-save', text: 'Publicar', onclick: function () {
          if (!title.value.trim() || !(Number(sal.value) > 0)) { err.textContent = 'Informe o título e o salário (maior que zero).'; return; }
          var bad = modCheck([title.value, city.value, tags.value, desc.value]);
          if (bad) { err.textContent = 'Texto bloqueado: ' + bad + '. Só publicamos vagas profissionais.'; return; }
          var job = { id: uid('j'), title: title.value.trim(), area: area.value, mode: mode.value, city: city.value.trim(), salary: Number(sal.value), tags: tagsFrom(tags.value), desc: desc.value.trim(), status: 'aberta', ts: Date.now() };
          S.jobs.push(job); S.candJob = S.candJob || job.id; save(); toast('Vaga publicada.'); view = 'cands'; S.candJob = job.id; save(); render(); } })])]));
  }

  function renderCands(m) {
    if (!S.jobs.length) { m.appendChild(h('div', { class: 'empty' }, [h('h2', { text: 'Sem vagas' }), h('p', { text: 'Publique uma vaga para ver candidatos.' }), h('button', { class: 'btn', id: 'go-jobs', text: 'Criar vaga', onclick: function () { view = 'jobs'; render(); } })])); return; }
    var job = jobById(S.candJob) || S.jobs[0]; S.candJob = job.id;
    var js = sel(S.jobs.map(function (j) { return [j.id, j.title + (j.status !== 'aberta' ? ' (' + labelOf(STATUS, j.status).toLowerCase() + ')' : '')]; }), job.id, 'c-job');
    js.onchange = function () { S.candJob = js.value; save(); render(); };
    var sf = sel([['', 'Todas as etapas']].concat(STAGES), S.stageFilter || '', 'c-stage');
    sf.onchange = function () { S.stageFilter = sf.value; save(); render(); };
    var rows = ranked(job).filter(function (r) { return !S.stageFilter || stageOf(job, r.c) === S.stageFilter; });
    var cards = rows.map(function (r) { return candCard(job, r.c, r.s); });
    m.appendChild(h('div', { class: 'page' }, [h('h1', { text: 'Candidatos' }),
      h('div', { class: 'bar' }, [js, sf]),
      cards.length ? h('div', { class: 'list', id: 'cand-list' }, cards) : h('p', { class: 'meta', id: 'cand-empty', text: 'Nenhum candidato nesta etapa.' })]));
  }

  function candCard(job, c, s) {
    var stage = stageOf(job, c), open = !!expanded[stageKey(job, c)];
    var st = sel(STAGES, stage, null); st.setAttribute('aria-label', 'Etapa de ' + c.name); st.setAttribute('data-cand', c.id);
    st.onchange = function () { S.stages[stageKey(job, c)] = st.value; save(); render(); };
    var level = s.total >= 75 ? 'alta' : s.total >= 50 ? 'media' : 'baixa';
    var detail = open ? h('div', { class: 'detail' }, [
      h('p', { text: c.bio }),
      h('div', { class: 'chips' }, c.tags.map(function (t) { return h('span', { class: 'chip' + (s.hit.indexOf(norm(t)) >= 0 ? ' hit' : ''), text: t }); })),
      h('p', { class: 'meta', text: 'Pretensão ' + money(c.salary) + ' · vaga ' + money(job.salary) }),
      h('ul', { class: 'break' }, [['Área', s.area, 40], ['Habilidades', s.skills, 30], ['Salário', s.salary, 20], ['Local', s.city, 10]].map(function (x) { return h('li', { text: x[0] + ': ' + x[1] + '/' + x[2] }); }))]) : null;
    return h('article', { class: 'row cand', 'data-cand': c.id, style: 'flex-wrap:wrap' }, [
      h('span', { class: 'score ' + level, 'aria-label': 'Compatibilidade ' + s.total + ' de 100', text: String(s.total) }),
      h('span', { class: 'grow' }, [h('div', { class: 't', text: c.name }), h('div', { class: 's', text: c.headline + ' · ' + c.city })]),
      st,
      h('button', { class: 'btn ghost', 'data-act': 'toggle', text: open ? 'Ocultar' : 'Perfil', 'aria-expanded': open ? 'true' : 'false', onclick: function () { expanded[stageKey(job, c)] = !open; render(); } }),
      h('button', { class: 'btn', 'data-act': 'msg', text: 'Mensagem', onclick: function () { startThread(job, c); } }),
      detail]);
  }

  /* ---------- mensagens ---------- */
  function threadId(job, c) { return job.id + ':' + c.id; }
  function startThread(job, c) {
    var id = threadId(job, c);
    if (!S.msgs[id]) S.msgs[id] = [{ from: 'sys', text: 'Conversa sobre a vaga "' + job.title + '". Mantenha o papo profissional.', ts: Date.now() }];
    if (stageOf(job, c) === 'novo') S.stages[stageKey(job, c)] = 'triagem';
    save(); view = 'msgs'; openThread = id; render();
  }
  function threadInfo(id) { var p = id.split(':'); var job = jobById(p[0]), c = candById(p[1]); return job && c ? { job: job, c: c } : null; }
  var REPLIES = ['Olá! Obrigado pelo contato, tenho muito interesse na vaga.', 'Oi! Tenho disponibilidade para conversar ainda esta semana.', 'Obrigado(a)! Pode me passar mais detalhes sobre o time e o formato de contratação?'];

  function renderMsgs(m) {
    var ids = Object.keys(S.msgs).filter(threadInfo);
    if (openThread && threadInfo(openThread)) return renderChat(m);
    if (!ids.length) { m.appendChild(h('div', { class: 'empty' }, [h('h2', { text: 'Nenhuma conversa' }), h('p', { text: 'Abra um candidato e use "Mensagem" para começar.' })])); return; }
    var list = h('div', { class: 'list', id: 'thread-list' }, ids.map(function (id) {
      var i = threadInfo(id), a = S.msgs[id], last = a[a.length - 1];
      return h('button', { class: 'row', 'data-thread': id, onclick: function () { openThread = id; render(); } }, [
        h('span', { class: 'avatar', 'aria-hidden': 'true', text: D.EMOJI[i.c.area] || '💼' }),
        h('span', { class: 'grow' }, [h('div', { class: 't', text: i.c.name + ' — ' + i.job.title }), h('div', { class: 's', text: last ? (last.from === 'me' ? 'Você: ' : '') + last.text : '' })])]);
    }));
    m.appendChild(h('div', { class: 'page' }, [h('h1', { text: 'Mensagens' }), list]));
  }

  function renderChat(m) {
    var id = openThread, info = threadInfo(id);
    var box = h('div', { class: 'msgs', id: 'msgs', role: 'log', 'aria-live': 'polite' });
    function paint() {
      box.textContent = '';
      (S.msgs[id] || []).forEach(function (x) { box.appendChild(h('div', { class: x.from === 'sys' ? 'sys' : 'msg' + (x.from === 'me' ? ' me' : ''), text: x.text })); });
      box.scrollTop = box.scrollHeight;
    }
    var input = h('input', { id: 'chat-input', maxlength: '500', placeholder: 'Mensagem profissional…', 'aria-label': 'Mensagem' });
    function send() {
      var t = input.value.trim(); if (!t) return;
      var r = MOD.check(t);
      if (!r.ok) { toast('Mensagem bloqueada: ' + r.reason + '.'); return; }
      S.msgs[id].push({ from: 'me', text: t, ts: Date.now() }); input.value = ''; save(); paint();
      var n = S.msgs[id].length;
      setTimeout(function () {
        if (!S.msgs[id]) return;
        S.msgs[id].push({ from: 'them', text: REPLIES[n % REPLIES.length], ts: Date.now() }); save();
        if (openThread === id && view === 'msgs') paint();
      }, 900);
    }
    m.appendChild(h('section', { class: 'chat page' }, [
      h('div', { class: 'chat-head' }, [h('button', { class: 'btn ghost', id: 'chat-back', 'aria-label': 'Voltar', text: '←', onclick: function () { openThread = null; render(); } }),
        h('div', { class: 'grow', text: info.c.name + ' — ' + info.job.title }),
        h('button', { class: 'btn ghost', id: 'chat-report', text: 'Denunciar', onclick: function () {
          if (!window.confirm('Denunciar este candidato? A conversa será encerrada e ele irá para Descartado.')) return;
          S.reports.push({ thread: id, ts: Date.now() }); S.stages[stageKey(info.job, info.c)] = 'descartado'; delete S.msgs[id];
          openThread = null; save(); render(); toast('Denúncia registrada.'); } })]),
      box, h('div', { class: 'sys', text: 'Demo: as respostas são simuladas.' }),
      h('form', { class: 'chat-in', onsubmit: function (e) { e.preventDefault(); send(); } }, [input, h('button', { class: 'btn', id: 'chat-send', type: 'submit', text: 'Enviar' })])]));
    paint();
  }

  function renderProfile(m) {
    renderCompanyForm(m, false);
    m.appendChild(h('div', { class: 'card-form' }, [h('p', { text: 'Modo demo: os dados ficam só neste navegador.' }),
      h('button', { class: 'btn ghost', id: 'reset', text: 'Apagar tudo e recomeçar', onclick: function () {
        if (!window.confirm('Apagar empresa, vagas e conversas deste navegador?')) return;
        S = fresh(); save(); view = 'overview'; render(); } })]));
  }

  window.__jm = { state: function () { return S; }, compat: compat, applicants: applicants, reset: function () { S = fresh(); save(); view = 'overview'; render(); } };
  render();
})();
