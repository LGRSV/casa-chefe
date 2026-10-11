# JobMatch — painel de contratação

App web (HTML/CSS/JS puro, sem build) para **empresas** publicarem vagas, receberem candidatos ranqueados por compatibilidade e acompanharem cada etapa. **Só trabalho**: perfis, vagas e mensagens passam por moderação que bloqueia conteúdo sexual, acompanhante/"programa" e afins.

Abrir: `jobmatch/index.html` (ou servir a pasta com qualquer servidor estático).

## O que tem
- **Visão geral**: vagas abertas, candidaturas, em entrevista, contratados e funil por etapa.
- **Vagas**: publicar (título, área, modalidade, cidade, salário, requisitos), pausar/encerrar, remover.
- **Candidatos** (por vaga): lista ordenada por **compatibilidade 0–100** — área (40), habilidades em comum (30), salário (20), cidade/remoto (10) — com detalhamento ao abrir o perfil.
- **Funil**: Novo → Triagem → Entrevista → Proposta → Contratado / Descartado; filtro por etapa.
- **Mensagens**: conversa com o candidato (1ª mensagem move Novo → Triagem), denúncia (descarta e encerra).

## Modo demo
Candidatos (`data.js`) e respostas do chat são **fictícios/simulados**; o estado fica no `localStorage`. Não há login nem servidor.

## Moderação (`moderation.js`)
Lista de termos normalizada (acentos, leetspeak `s3xo`), aplicada em empresa, vaga e mensagens; exceção para "acompanhante terapêutico/hospitalar". É filtro de primeira linha — em produção precisa de revisão humana e da mesma regra no servidor.

## Não feito
Backend real (Supabase: auth, tabelas, RLS), candidatos reais se candidatando, notificações, moderação no servidor.
