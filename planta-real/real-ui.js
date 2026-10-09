// Planta Real — CSS claro (vidro estilo Apple), cabeçalho, painel com interruptor e barra de vista

export const REAL_CSS = `
:host {
  display: block;
  --pr-text: #1d1d1f;
  --pr-text-2: #4a4a4f;
  --pr-glass: rgba(255,255,255,.86);
  --pr-glass-solid: #fbfbfd;
  --pr-line: rgba(0,0,0,.10);
  --pr-chip: rgba(0,0,0,.06);
  --pr-on: #1f8a3c;
  --pr-off: #d6d6db;
  --pr-ease: cubic-bezier(.2,.8,.2,1);
  --pr-font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
}
[hidden] { display: none !important; }
.planta {
  position: relative;
  overflow: hidden;
  height: var(--planta-h, 560px);
  border-radius: var(--ha-card-border-radius, 16px);
  /* fundo neutro de estúdio: a maquete fica sozinha, com sombra de contato */
  background: radial-gradient(120% 90% at 50% 38%, #fbfaf8 0%, #efede9 55%, #dddad4 100%);
  color: var(--pr-text);
  font-family: var(--pr-font);
  container-type: inline-size;
  -webkit-tap-highlight-color: transparent;
}
.stage { position: absolute; inset: 0; }
.glass {
  background: var(--pr-glass);
  -webkit-backdrop-filter: blur(22px) saturate(170%);
  backdrop-filter: blur(22px) saturate(170%);
  border: 1px solid rgba(255,255,255,.6);
  box-shadow: 0 6px 24px rgba(30,40,20,.18);
}

/* cabeçalho */
.hdr {
  position: absolute;
  top: 12px;
  left: 12px;
  max-width: calc(100% - 24px);
  box-sizing: border-box;
  padding: 9px 14px 10px;
  border-radius: 16px;
  pointer-events: none;
}
.t { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }
.w { font-size: 14px; font-weight: 500; margin-left: 8px; color: var(--pr-text); }
.w::before { content: '·'; color: var(--pr-text-2); margin-right: 8px; }
.l2 { font-size: 12px; font-weight: 500; color: var(--pr-text-2); margin-top: 3px; }

/* painel flutuante */
.panel {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 300px;
  max-width: calc(100% - 24px);
  max-height: calc(100% - 24px);
  overflow: auto;
  box-sizing: border-box;
  border-radius: 20px;
  padding: 14px 16px 8px;
  opacity: 0;
  transform: translateY(-6px) scale(.98);
  visibility: hidden;
  pointer-events: none;
  transition: opacity 220ms var(--pr-ease), transform 220ms var(--pr-ease), visibility 0s linear 220ms;
}
.panel.open { opacity: 1; transform: none; visibility: visible; pointer-events: auto; transition-delay: 0s; }
.ph { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.pt { font-size: 17px; font-weight: 600; margin: 0; letter-spacing: -0.01em; }
.ps { font-size: 13px; color: var(--pr-text-2); margin: 2px 0 0; }
.x {
  position: relative;
  flex: none;
  width: 30px;
  height: 30px;
  margin: -4px -6px 0 0;
  padding: 0;
  border-radius: 50%;
  border: 0;
  background: var(--pr-chip);
  color: var(--pr-text-2);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.x::after { content: ''; position: absolute; inset: -7px; }
.rows { list-style: none; margin: 6px 0 0; padding: 0; }
.row { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 6px 0; }
.row + .row { border-top: 1px solid var(--pr-line); }
.lab { flex: 1; min-width: 0; }
.n { font-size: 15px; font-weight: 500; display: block; }
.s { font-size: 13px; color: var(--pr-text-2); display: block; margin-top: 1px; }
.sw {
  position: relative;
  flex: none;
  width: 51px;
  height: 31px;
  padding: 0;
  border: 0;
  border-radius: 16px;
  background: var(--pr-off);
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.08);
  cursor: pointer;
  transition: background-color 200ms var(--pr-ease);
}
.sw::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 27px;
  height: 27px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,.22), 0 0 0 .5px rgba(0,0,0,.06);
  transition: transform 200ms var(--pr-ease);
}
.sw::after { content: ''; position: absolute; inset: -7px -4px; }
.sw[aria-checked=true] { background: var(--pr-on); }
.sw[aria-checked=true]::before { transform: translateX(20px); }
.row.pending .sw { opacity: .55; }
.empty { font-size: 13px; color: var(--pr-text-2); margin: 10px 0 8px; }

/* barra de vista */
.bar {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 22px;
}
.bar button {
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 18px;
  background: transparent;
  color: var(--pr-text);
  font: 600 13px var(--pr-font);
  cursor: pointer;
}
.bar button:hover, .bar button:active { background: var(--pr-chip); }

button:focus-visible { outline: 2px solid #0a64d8; outline-offset: 2px; }
button:disabled { opacity: .45; cursor: default; }
.x:active, .bar button:active { transform: scale(.97); }

/* telas estreitas: painel vira folha embaixo, barra sob o cabeçalho */
@container (max-width: 520px) {
  .panel { top: auto; left: 10px; right: 10px; bottom: 10px; width: auto; max-width: none; max-height: 60%; }
  .bar { top: 82px; bottom: auto; left: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .panel, .panel.open { transform: none; transition: opacity 120ms linear, visibility 0s linear 120ms; }
  .panel.open { transition-delay: 0s; }
  .sw, .sw::before { transition: none; }
  .x:active, .bar button:active { transform: none; }
}
@media (prefers-reduced-transparency: reduce) {
  :host { --pr-glass: var(--pr-glass-solid); }
  .glass { -webkit-backdrop-filter: none; backdrop-filter: none; }
}
`;

// Cria elemento com classe e texto (textContent, nunca innerHTML)
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

export function buildHeader(parent) {
  const t = el('span', 't');
  const w = el('span', 'w');
  const l1 = el('div', 'l1');
  const l2 = el('div', 'l2');
  l1.append(t, w);
  const hdr = el('header', 'hdr glass');
  hdr.append(l1, l2);
  parent.append(hdr);
  return {
    el: hdr,
    update({ title = '', weather = '', sensors = [] } = {}) {
      t.textContent = title;
      w.textContent = weather;
      w.hidden = !weather;
      l1.hidden = !title && !weather;
      l2.textContent = sensors.join(' · ');
      l2.hidden = !sensors.length;
    },
  };
}

// Painel do cômodo: cada aparelho com um interruptor (role=switch)
export function buildPanel(parent, { onSet, onClose } = {}) {
  const panel = el('aside', 'panel glass');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-hidden', 'true');

  const h = el('h2', 'pt');
  const s = el('p', 'ps');
  const head = el('div');
  head.append(h, s);
  const x = el('button', 'x', '×');
  x.type = 'button';
  x.setAttribute('aria-label', 'Fechar');
  const ph = el('div', 'ph');
  ph.append(head, x);
  const ul = el('ul', 'rows');
  const empty = el('p', 'empty', 'Nenhum aparelho neste cômodo');
  panel.append(ph, ul, empty);
  parent.append(panel);

  let cur = null;

  const renderHead = () => {
    h.textContent = cur.title;
    s.textContent = cur.summary || '';
    panel.setAttribute('aria-label', cur.title);
  };

  const makeRow = (c) => {
    const li = el('li', 'row');
    li.dataset.key = c.key;
    const lab = el('div', 'lab');
    const n = el('span', 'n', c.label);
    n.id = `pr-n-${c.key}`;
    lab.append(n, el('span', 's', c.state));
    const sw = el('button', 'sw');
    sw.type = 'button';
    sw.setAttribute('role', 'switch');
    sw.setAttribute('aria-checked', String(c.on));
    sw.setAttribute('aria-labelledby', n.id);
    sw.disabled = !c.available;
    li.classList.toggle('pending', !!c.pending);
    if (c.pending) li.setAttribute('aria-busy', 'true');
    li.append(lab, sw);
    return li;
  };

  // Re-renderiza e devolve o foco ao mesmo interruptor
  const renderRows = () => {
    const act = panel.getRootNode().activeElement;
    const li0 = act && panel.contains(act) ? act.closest('li[data-key]') : null;
    const focusKey = li0 ? li0.dataset.key : null;
    ul.replaceChildren(...cur.controls.map(makeRow));
    empty.hidden = cur.controls.length > 0;
    if (focusKey) {
      const b = ul.querySelector(`li[data-key="${focusKey}"] .sw`);
      if (b && !b.disabled) b.focus();
    }
  };

  ul.addEventListener('click', (e) => {
    const sw = e.target.closest('.sw');
    const li = sw && sw.closest('li[data-key]');
    const c = li && cur && cur.controls.find((k) => k.key === li.dataset.key);
    if (!c || c.pending) return;
    sw.setAttribute('aria-checked', String(!c.on)); // resposta imediata; o estado real chega pelo hass
    onSet?.(c.key, !c.on);
  });

  x.addEventListener('click', () => onClose?.());
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') onClose?.();
  });

  return {
    el: panel,
    show(model) {
      cur = model;
      renderHead();
      renderRows();
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
    },
    update(model) {
      if (!panel.classList.contains('open') || !cur || model.roomId !== cur.roomId) return;
      cur = model;
      renderHead();
      renderRows();
    },
    hide() {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      cur = null;
    },
    get open() {
      return panel.classList.contains('open');
    },
  };
}

export function buildToolbar(parent, { onRotate, onReset } = {}) {
  const nav = el('nav', 'bar glass');
  nav.setAttribute('aria-label', 'Vista');
  const rot = el('button', 'rot', 'Girar vista');
  const ctr = el('button', 'ctr', 'Centralizar');
  rot.type = ctr.type = 'button';
  rot.addEventListener('click', () => onRotate?.());
  ctr.addEventListener('click', () => onReset?.());
  nav.append(rot, ctr);
  parent.append(nav);
  return { el: nav };
}
