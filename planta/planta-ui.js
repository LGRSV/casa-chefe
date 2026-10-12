// Planta — CSS, cabeçalho, painel flutuante e barra (spec §3)

export const PLANTA_CSS = `
:host {
  display: block;
  --pl-text: #eaf2ff;
  --pl-text-2: #b8cff7;
  --pl-amber: #ffb347;
  --pl-amber-ink: #1a1206;
  --pl-glass: rgba(14,38,98,.72);
  --pl-glass-solid: rgba(14,38,98,.96);
  --pl-glass-line: rgba(160,200,255,.28);
  --pl-chip: rgba(255,255,255,.16);
  --pl-ease: cubic-bezier(.2,.8,.2,1);
  --pl-font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
}
[hidden] { display: none !important; }
.planta {
  position: relative;
  overflow: hidden;
  height: var(--planta-h, 560px);
  border-radius: var(--ha-card-border-radius, 16px);
  background: radial-gradient(120% 90% at 60% 45%, #0d3388 0%, #061a4d 55%, #030d2b 100%);
  color: var(--pl-text);
  font-family: var(--pl-font);
  container-type: inline-size;
  -webkit-tap-highlight-color: transparent;
}
.stage { position: absolute; inset: 0; }

/* cabeçalho */
.hdr {
  position: absolute;
  top: 16px;
  left: 20px;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0,0,0,.5);
}
.t { font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }
.w { font-size: 15px; font-weight: 500; margin-left: 10px; }
.w::before { content: '·'; color: var(--pl-text-2); margin-right: 10px; }
.l2 { font-size: 12px; font-weight: 500; color: var(--pl-text-2); letter-spacing: .01em; margin-top: 4px; }

/* painel flutuante */
.panel {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 288px;
  max-width: calc(100% - 32px);
  max-height: calc(100% - 32px);
  overflow: auto;
  box-sizing: border-box;
  border-radius: 18px;
  background: var(--pl-glass);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid var(--pl-glass-line);
  box-shadow: 0 12px 32px rgba(0,8,40,.45);
  padding: 14px;
  opacity: 0;
  transform: translateY(-6px) scale(.98);
  visibility: hidden;
  pointer-events: none;
  transition: opacity 220ms var(--pl-ease), transform 220ms var(--pl-ease), visibility 0s linear 220ms;
}
.panel.open {
  opacity: 1;
  transform: none;
  visibility: visible;
  pointer-events: auto;
  transition-delay: 0s;
}
.ph { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.pt { font-size: 17px; font-weight: 600; margin: 0; }
.ps { font-size: 12px; color: var(--pl-text-2); margin: 2px 0 0; }
.x {
  position: relative;
  flex: none;
  width: 32px;
  height: 32px;
  margin: -6px -6px 0 0;
  padding: 0;
  border-radius: 50%;
  border: 0;
  background: var(--pl-chip);
  color: var(--pl-text);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.x::after { content: ''; position: absolute; inset: -6px; }
.rows { list-style: none; margin: 8px 0 0; padding: 0; }
.row { padding: 10px 0; }
.row + .row { border-top: 1px solid var(--pl-glass-line); }
.n { font-size: 14px; font-weight: 500; display: block; }
.s { font-size: 12px; color: var(--pl-text-2); display: block; margin-top: 2px; }
.seg { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; }
.seg button {
  min-height: 44px;
  border-radius: 12px;
  font: 600 14px var(--pl-font);
  border: 1px solid var(--pl-glass-line);
  background: transparent;
  color: var(--pl-text-2);
  cursor: pointer;
  transition: transform 100ms var(--pl-ease), background-color 160ms;
}
.seg .on[aria-pressed=true] { background: var(--pl-amber); color: var(--pl-amber-ink); border-color: transparent; }
.seg .off[aria-pressed=true] { background: var(--pl-chip); color: var(--pl-text); }
.row.pending .seg { opacity: .6; }
.empty { font-size: 13px; color: var(--pl-text-2); margin: 10px 0 2px; }

/* barra de vista */
.bar {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  gap: 6px;
  padding: 4px;
  border-radius: 22px;
  background: var(--pl-glass);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid var(--pl-glass-line);
}
.bar button {
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 18px;
  background: transparent;
  color: var(--pl-text);
  font: 600 13px var(--pl-font);
  cursor: pointer;
}
.bar button:hover, .bar button:active { background: var(--pl-chip); }

button:active { transform: scale(.97); transition: transform 100ms; }
button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
button:disabled { opacity: .45; cursor: default; }

/* telas estreitas: painel vira folha embaixo */
@container (max-width: 520px) {
  .panel { top: auto; left: 12px; right: 12px; bottom: 12px; width: auto; max-height: 60%; }
  .bar { top: 64px; bottom: auto; left: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .panel, .panel.open { transform: none; transition: opacity 120ms linear, visibility 0s linear 120ms; }
  .panel.open { transition-delay: 0s; }
  button { transition: none; }
  button:active { transform: none; }
}
@media (prefers-reduced-transparency: reduce) {
  :host { --pl-glass: var(--pl-glass-solid); }
  .panel, .bar { -webkit-backdrop-filter: none; backdrop-filter: none; }
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
  const hdr = el('header', 'hdr');
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

export function buildPanel(parent, { onSet, onClose } = {}) {
  const panel = el('aside', 'panel');
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

  let cur = null; // model atual

  const renderHead = () => {
    h.textContent = cur.title;
    s.textContent = cur.summary || '';
    panel.setAttribute('aria-label', cur.title);
  };

  const makeRow = (c) => {
    const li = el('li', 'row');
    li.dataset.key = c.key;
    const lab = el('div', 'lab');
    lab.append(el('span', 'n', c.label), el('span', 's', c.state));
    const off = el('button', 'off', 'Desligar');
    const on = el('button', 'on', 'Ligar');
    off.type = on.type = 'button';
    off.setAttribute('aria-pressed', String(!c.on));
    on.setAttribute('aria-pressed', String(c.on));
    off.disabled = on.disabled = !c.available;
    li.classList.toggle('pending', !!c.pending);
    if (c.pending) li.setAttribute('aria-busy', 'true');
    else li.removeAttribute('aria-busy');
    const seg = el('div', 'seg');
    seg.append(off, on);
    li.append(lab, seg);
    return li;
  };

  // Re-renderiza as linhas e devolve o foco ao mesmo botão (key + classe)
  const renderRows = () => {
    const act = panel.getRootNode().activeElement;
    const li0 = act && panel.contains(act) ? act.closest('li[data-key]') : null;
    const focus = li0 ? [li0.dataset.key, act.className] : null;
    ul.replaceChildren(...cur.controls.map(makeRow));
    empty.hidden = cur.controls.length > 0;
    if (focus) {
      const b = ul.querySelector(`li[data-key="${focus[0]}"] button.${focus[1]}`);
      if (b && !b.disabled) b.focus();
    }
  };

  ul.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    const li = btn && btn.closest('li[data-key]');
    const c = li && cur && cur.controls.find((k) => k.key === li.dataset.key);
    if (!c || c.pending) return;
    if (btn.classList.contains('on') && !c.on) onSet?.(c.key, true);
    else if (btn.classList.contains('off') && c.on) onSet?.(c.key, false);
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
  const nav = el('nav', 'bar');
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
