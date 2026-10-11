# JobMatch — o "Tinder das vagas"

App web (HTML/CSS/JS puro, sem build) para conectar candidatos e empresas por swipe. **Só trabalho**: perfis, vagas e chat passam por moderação que bloqueia conteúdo sexual, acompanhante/"programa" e afins, e há denúncia/bloqueio.

Abrir: `jobmatch/index.html` (ou servir a pasta com qualquer servidor estático).

## Mecânica (inspirada no que é público no Tinder; nada foi extraído do app deles)
- Cartas com **arrastar** (direita = curtir, esquerda = dispensar, cima = super like), botões e teclado (← → ↑).
- **Match só quando os dois lados curtem**; chat liberado depois do match.
- **Super like**: 3 por dia, com mais chance de retorno. **Desfazer** o último swipe (não vale após match).
- **Ranking de relevância** (área, pretensão salarial, cidade) e **filtros** (área, modalidade, salário).
- Dois lados: **candidato** desliza vagas; **empresa** publica vagas e desliza candidatos da vaga ativa.
- **Rever dispensados** quando as cartas acabam.

## Modo demo (o que existe hoje)
Dados em `data.js` (fictícios) e estado no `localStorage`. O "retorno" da outra parte e as respostas do chat são **simulados** (determinísticos). Não há login nem servidor.

## Moderação (`moderation.js`)
Lista de termos normalizada (acentos, leetspeak `s3xo`), aplicada em perfil, vaga e mensagens; exceção para profissões legítimas ("acompanhante terapêutico/hospitalar"). É filtro de primeira linha — em produção precisa de revisão humana e da mesma regra no servidor.

## Próximos passos (não feitos)
Backend real (Supabase: auth, tabelas, RLS, match via trigger), verificação de empresas/candidatos, notificações, moderação no servidor.
