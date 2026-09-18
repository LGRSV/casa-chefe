#!/usr/bin/env python3
"""Integra as funções room*(ctx) (arquivos rooms/*.js) no casa3d-card.js.
Uso: python3 integrate_rooms.py <pasta-com-os-arquivos>"""
import re, sys
from pathlib import Path
ROOMS = {  # arquivo -> (nome da função, seed)
    'quarto_casal': ('roomQuartoCasal', 11), 'quarto': ('roomQuarto', 12), 'sala_cozinha': ('roomSalaCozinha', 13),
    'varanda_piscina': ('roomVarandaPiscina', 14), 'banheiro_dispensa': ('roomBanheiroDispensa', 15), 'garagem_jardim': ('roomGaragemJardim', 16),
}
src_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent / 'rooms'
card = Path(__file__).parent / 'casa3d-card.js'
s = card.read_text(encoding='utf-8')
funcs, done = [], []
for key, (fn, seed) in ROOMS.items():
    f = src_dir / f'{key}.js'
    if not f.exists(): continue
    code = f.read_text(encoding='utf-8').strip()
    if f'function {fn}(' not in code: print(f'!! {f.name}: não define {fn}'); continue
    funcs.append(code)
    pat = re.compile(r'(    // @room ' + key + r'\n)(.*?)(    // @endroom\n)', re.S)
    s, n = pat.subn(lambda m: m.group(1) + f'    {fn}(ctx({seed}));\n' + m.group(3), s)
    if n: done.append(key)
block = '// @rooms-begin\n' + '\n\n'.join(funcs) + '\n// @rooms-end'
s = re.sub(r'// @rooms-begin\n.*?// @rooms-end', lambda m: block, s, flags=re.S)
card.write_text(s, encoding='utf-8')
print('integrados:', ', '.join(done) or 'nenhum')
