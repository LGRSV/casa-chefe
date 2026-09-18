#!/usr/bin/env python3
"""Gera index.html embutindo casa3d-card.js no demo.template.html.
Assim a demo funciona abrindo o arquivo direto (file://) e também como artifact."""
from pathlib import Path
here = Path(__file__).parent
card = (here / 'casa3d-card.js').read_text(encoding='utf-8')
tpl = (here / 'demo.template.html').read_text(encoding='utf-8')
out = tpl.replace('/*__CARD_MODULE__*/', card)
(here / 'index.html').write_text(out, encoding='utf-8')
print(f'index.html gerado ({len(out):,} bytes)')
