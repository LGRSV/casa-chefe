# Casa 3D — cartão Lovelace para Home Assistant

Demo: https://lgrsv.github.io/casa-chefe/ · Repositório: https://github.com/LGRSV/casa-chefe

Modelo 3D interativo da sua casa (Three.js) ligado às entidades do Home Assistant:
gira, dá zoom, e cada cômodo acende conforme o interruptor real. Tocar no cômodo ou
na luminária seleciona (2º toque alterna); o bloco do painel alterna direto. Substitui o
`picture-elements` com PNGs da vista "3D" por uma cena de verdade.

## Novidades da v1.5.1 — menos toque sem querer, funções à vista

- **Toque seleciona, 2º toque executa**: tocar num cômodo, luminária ou aparelho na maquete (ou num
  aparelho no modo Pessoa) não liga/desliga mais na hora — realça o alvo e mostra um balão perto do
  dedo ("Sala / Cozinha · apagada" + **Acender**/**Apagar**). Tocar de novo no mesmo alvo em até 5 s,
  ou no botão do balão, executa; tocar em outro lugar ou Esc limpa, e o balão some sozinho em 5 s.
  Os blocos do painel continuam alternando direto.
- **Bonequinho com nome**: o botão mostra **Andar** ao lado do ícone (no celular, só o ícone). No
  primeiro acesso uma dica aponta para ele até ser usado, a Pessoa abrir ou a dica ser fechada. As
  dicas de comandos (maquete e Pessoa) somem no primeiro gesto, não mais por tempo.
- **Clima minimalista**: no título, ao lado do relógio, só ícone + temperatura; cidade, condição,
  sensação, vento e hora da atualização ficam no topo do menu **☰ Opções**.
- **Visão noturna** de dia mostra "só à noite" no item do menu, em vez de só ficar cinza.
- **Cena mais limpa e leve**: sem estrelas, sem rua/calçada; em volta do lote, um chão liso de cor
  chapada que escurece à noite. A Pessoa anda só dentro do lote e começa logo depois do portãozinho.
- Demo: tocar nos blocos de sensor mostra o estado ("Presença: alguém no quarto", "Iluminância:
  18 lx", "Sandro: em casa"); **Conectar ao HA** virou passo a passo, aceita o endereço como vier
  (sem https://, com /lovelace/0…), mostra o link **Criar token no seu HA ↗** e tem **Testar**, que
  diz se o endereço não responde, se o token foi recusado ou quantas entidades encontrou.

## Novidades da v1.5.0 — painel lateral, cômodos reais e menu de opções

- **Painel lateral**: o painel saiu de baixo e virou uma coluna de vidro escuro à direita (abaixo
  dos botões do topo, até o pé do cartão). Recolhe pela seta **→** deslizando para a direita e volta
  pela aba **Painel** presa à borda direita, que mostra quantas luzes estão acesas. Com ele aberto a
  câmera enquadra a casa **à esquerda** da coluna (nada fica escondido atrás dele). No **celular**
  vira uma gaveta que entra pela direita cobrindo quase a tela toda (abaixo do cabeçalho): fecha
  pela seta, **tocando no véu** à esquerda ou **arrastando para a direita** — a gaveta acompanha o
  dedo, e ao soltar decide abrir/fechar pela velocidade do gesto (um arremesso curto já fecha),
  assentando numa mola; dá para agarrar no meio do movimento. Com `prefers-reduced-motion` o
  deslize vira um fade curto.
- **Blocos agrupados pelos cômodos reais da planta**: Quarto · Sala / Cozinha · Balcão ·
  Varanda / Jardim (a luz externa cobre a varanda e as arandelas do muro/jardim) · Banheiro /
  Dispensa · Garagem · Piscina · Casa (pessoa). Os filtros do topo do painel seguem os mesmos
  cômodos, e cada grupo mostra "N de M ativos". Os blocos ficam compactos, em duas colunas.
- **Menu de opções**: os botões do topo viraram um único botão **☰ Opções** com uma lista
  suspensa por seções — **Ambiente** (Auto/Dia/Noite e Visão noturna), **Vista** (Rótulos,
  Telhado, Recentrar), **Navegação** (Pessoa, Ir para…) e **Painel** (mostrar/ocultar). Os
  liga/desliga mostram um interruptor com o estado. Fecha com Esc, clicando fora ou depois de
  Recentrar / Ir para… / Pessoa / Painel; pelo teclado o foco vai ao 1º item e ↑/↓ andam entre eles.
  O **bonequinho** continua fora do menu, ao lado do botão (é arrastado até a maquete), e no modo
  Pessoa o atalho **Ir para…** aparece no topo.
- **Clima** foi para baixo do cartão do título (canto superior esquerdo). Na v1.5.1 encolheu para
  ícone + temperatura no próprio título, com os detalhes no menu.
- Acessibilidade: além de `prefers-reduced-motion`, o cartão respeita
  `prefers-reduced-transparency` (superfícies quase sólidas, sem desfoque) e
  `prefers-contrast: more` (fundo sólido e bordas claras).

## Novidades da v1.4.0 — visão de Pessoa, portas que abrem e painel novo

Trazido da [Igreja 3D](https://github.com/LGRSV/igreja-3d-v1) e adaptado à planta da casa:

- **Pessoa (tipo Street View)**: botão **Pessoa** anda pela casa na altura dos olhos (1,6 m).
  **Clique ou toque num ponto do piso** e a pessoa caminha até lá, desviando das paredes e da
  piscina (anel âmbar mostra o destino). Também dá para andar com **setas/WASD** (Shift corre,
  Q/E giram) ou com o **joystick** na tela; arrastar vira a cabeça. Clicar numa luminária,
  na água (LED) ou na bomba continua ligando/desligando. **Esc** sai.
- **Bonequinho**: arraste o ícone âmbar até um cômodo da maquete e solte para entrar ali
  (o cômodo sob o cursor fica realçado e com o nome). Um toque simples nele, ou o botão
  **Ir para…** no modo Pessoa, abre a lista de cômodos (Casa, Área externa).
- **Portas que abrem andando**: as 6 portas internas abrem sozinhas quando a pessoa chega de
  frente (a maçaneta desce antes de a folha sair do batente), giram para o lado livre e fecham
  2,5 s depois. **Enter/F** ou clicar na folha abre/fecha na hora. Fora do modo Pessoa ficam
  fechadas como sempre.
- **Telhado automático**: ao entrar na Pessoa o Telhado (forro) liga e os rótulos somem; ao sair
  volta como estava (`telhado_pessoa: false` desliga isso).
- **Painel redesenhado**: vidro escuro com cantos maiores, abre/recolhe animado (no celular,
  arrastar a barra das abas para baixo recolhe), abas com ícones (← → trocam), filtros por área
  (Todos · Quarto · Sala / Cozinha · Externa · Piscina · Casa) com "N de M ativos", contador de
  luzes com ícone, brilho na cor do aparelho, barra de brilho no LED e uma folha de controle presa
  ao pé do painel (interruptor, brilho com %, cores, termostato, timer; Esc fecha).
  "Painel ▴" mostra quantas luzes estão acesas.

## Arquivos

| Arquivo | Para quê |
|---|---|
| `casa3d-card.js` | **O cartão.** É o único arquivo que vai para o Home Assistant. |
| `index.html` | Demo standalone com estados simulados — abre direto no navegador (duplo clique). |
| `demo.template.html` + `build.py` | Geram o `index.html` a partir do cartão (`python3 build.py`). |

## Instalação no Home Assistant

### Opção A — pelo GitHub (sem copiar arquivo)
Recurso do Lovelace apontando para o CDN do GitHub (jsDelivr):
`https://cdn.jsdelivr.net/gh/LGRSV/casa-chefe@main/casa3d-card.js` (tipo Módulo JavaScript).
Ou pelo HACS: *HACS → ⋮ → Repositórios personalizados → URL do repositório, categoria Dashboard*,
depois "Baixar" — o `hacs.json` já está no repositório (URL: `https://github.com/LGRSV/casa-chefe`).
A demo fica publicada em `https://lgrsv.github.io/casa-chefe/` (Settings → Pages → branch `main`, pasta `/`).

### Opção B — arquivo local

1. Copie `casa3d-card.js` para `/config/www/casa3d/casa3d-card.js`
   (pelo Samba: `\\homeassistant\config\www\casa3d\`, ou pelo File editor).
2. **Definições → Painéis → ⋮ (canto superior direito) → Recursos → Adicionar recurso**
   - URL: `/local/casa3d/casa3d-card.js?v=6`
   - Tipo: **Módulo JavaScript**
   - Se a opção "Recursos" não aparecer, ative o *Modo avançado* no seu perfil de usuário.
3. No dashboard, crie uma vista do tipo **Painel** (ou edite a vista "3D" que já existe,
   trocando o tipo para Painel) e adicione o cartão em YAML:

   ```yaml
   type: custom:casa3d-card
   title: Casa 3D
   ```
4. Recarregue a página (Ctrl+F5; no app, feche e abra). Sempre que atualizar o arquivo,
   aumente o `?v=` do recurso para furar o cache.

## Configuração completa (tudo opcional)

```yaml
type: custom:casa3d-card
title: Casa 3D
mode: auto            # auto = segue sun.sun | day | night
night_vision: true    # à noite, luz de lua + ambiente frio: a casa inteira fica legível
labels: true          # nomes dos cômodos flutuando
height: calc(100vh - 100px)   # numa vista com seções use algo como 520px
panel: true           # painel lateral aberto ao iniciar (false = recolhido)
roof: false           # começa com o telhado visível (Opções › Telhado alterna)
telhado_pessoa: true  # na visão de Pessoa o Telhado (forro) liga sozinho e volta ao sair
quality: alta         # 'leve' = sombras menores e menos luzes com sombra (~40 MB em vez de ~120 MB de GPU)
weather: true         # clima ao vivo: ícone + temperatura no título, detalhes no menu (Open-Meteo, sem chave)
weather_city: 'Palmas, TO'   # nome mostrado no menu
car_color: '#f3f3f0'  # cor do up! TSI na garagem (branco)
timezone: America/Sao_Paulo      # relógio do cartão (horário de Brasília)
latitude: -10.2                  # posição do sol (o HA fornece a sua via hass.config;
longitude: -48.3                 #  estes valores só valem na demo/fora do HA)
orientation: 180      # para onde a frente da casa (lado da piscina) aponta: 0=N, 90=L, 180=S, 270=O
entities:
  quarto:        switch.quarto_interruptor_1
  led_quarto:    light.0xa4c1387cf3257eb7        # cor real (rgb_color) e brilho
  sala:          light.interruptor_cozinha_left
  balcao:        switch.balcao_interruptor_1
  externa:       light.interruptor_cozinha_center  # varanda + arandelas do muro
  banheiro:      light.interruptor_cozinha_center  # veja "Observações"
  garagem:       switch.garagem_interruptor_1
  led_piscina:   switch.led_piscina_interruptor_1
  bomba_piscina: switch.piscina_interruptor_1    # água "escoa" quando ligada
  ac:            climate.ir_ac_cozinha_ac_cozinha # LED azul quando resfriando
  tv:            media_player.m_s                # tela acende quando tocando
  presenca:      binary_sensor.0xa4c13846f2a0df88_occupancy   # radar mmWave (bloco só leitura)
  lux:           sensor.0xa4c13846f2a0df88_illuminance
  pessoa:        person.sandro
  sun:           sun.sun                         # dia/noite automático
```

Os valores acima já são o padrão do cartão — só precisa do bloco `entities:` se
quiser trocar alguma coisa.

## Como funciona

- **Luz / interruptor**: clique → `homeassistant.toggle` na entidade (resposta otimista,
  o HA confirma em seguida). O chip acende junto.
- **AC e TV**: clique abre o *more-info* da entidade (o painel padrão do HA).
- **Sombras reais**: a luz do quarto não vaza para o quarto ao lado — as paredes
  bloqueiam. Sombras só recalculam quando um estado muda, então o custo em
  repouso é baixo.
- **Dia/noite**: em `auto` segue o `sun.sun`; Dia/Noite (no menu Opções) forçam.
- **Visão noturna**: à noite, uma luz de lua com sombras e um ambiente azulado mantêm a
  casa inteira visível; as luzes acesas continuam se destacando em tom quente. Desligue
  em Opções › Visão noturna (ou `night_vision: false`) para o visual escuro dramático.
- **Água**: shader próprio (ondas animadas, reflexo do céu com Fresnel, brilho do sol,
  cor por profundidade, espuma na borda, cáusticas no fundo). Os LEDs ficam na parede da
  piscina e a luz esmaece pela água.
- **Tempo real**: o cartão mostra data e hora (fuso de `timezone`), o nascer e o pôr do sol
  do dia, e, em `mode: auto`, a
  luz segue o sol de verdade — elevação e azimute vindos do `sun.sun` do HA (ou calculados
  pela data e pela latitude/longitude). O sol gira ao longo do dia, a sombra acompanha,
  amanhecer e entardecer ficam alaranjados, e a noite entra sozinha. `orientation` diz
  para onde a frente da casa aponta, para o sol nascer do lado certo.
- **Telhado**: opção do menu que cobre a casa com telhado de telha cerâmica (e forro), para a vista
  externa; desligado, volta a vista de casinha de boneca.
- **Clima ao vivo**: ícone + temperatura no título, ao lado do relógio; cidade, condição, sensação
  térmica, vento e hora da atualização no topo do menu ☰ Opções ("Clima indisponível" sem rede) — dados reais da [Open-Meteo](https://open-meteo.com/) (gratuita, sem
  chave), atualizados a cada 15 min. Usa `latitude`/`longitude` do YAML (padrão: Palmas-TO).
  Desative com
  `weather: false`, ou troque a cidade mudando as coordenadas + `weather_city`.
  **Não funciona dentro do preview do Claude Artifact** (o sandbox do artifact bloqueia
  requisições de rede a domínios externos) — funciona normalmente no GitHub Pages e no
  Home Assistant, que rodam num navegador comum sem essa restrição.

## Painel lateral (Cômodos · Automações · Atividade)

Coluna à direita do cartão (largura ~34% da tela, entre 300 e 380 px), com o contador de luzes
acesas no topo e as três abas logo abaixo (← → trocam de aba pelo teclado). Recolhe pela seta →
(ou Opções › Painel lateral) e volta pela aba **Painel** na borda direita. A câmera enquadra a casa
na área que sobra à esquerda. No celular é uma gaveta por cima da cena: fecha pela seta, tocando
no véu ou arrastando para a direita. Ao entrar na visão de Pessoa o painel recolhe e volta ao sair.

- **Cômodos**: blocos agrupados pelos cômodos reais (Quarto, Sala / Cozinha, Balcão, Varanda /
  Jardim, Banheiro / Dispensa, Garagem, Piscina, Casa), com filtro por cômodo e "N de M ativos";
  cada bloco mostra o dispositivo, o estado e há quanto tempo mudou; tocar alterna a entidade. O **⋯** abre a faixa de controles: brilho e
  cores do LED do quarto, modo e temperatura do ar-condicionado, tocar/pausar e volume da TV,
  e um **temporizador** ("desligar em 15/30/60 min") para qualquer luz/interruptor (a faixa fica
  presa ao pé da coluna) — ele roda
  no cartão, então só vale enquanto o painel estiver aberto (num tablet de parede, sempre).
  Há blocos só de leitura para o radar de **presença**, a **iluminância** e a **pessoa**
  (em casa/fora); tocar neles abre o painel padrão do HA.
- **Automações**: *rotinas rápidas* do cartão (ações compostas — `SCENES` no topo do arquivo)
  e, abaixo, **todas as automações do seu Home Assistant**, descobertas sozinhas
  (`automation.*`): ativar/desativar, executar agora (▶, `automation.trigger`) e a última
  execução. Não precisa configurar nada.
- **Atividade**: histórico do que ligou/desligou, disparos de automação, presença e chegada/
  saída, com hora e tempo relativo.

## Desempenho

Uso de memória medido no navegador (a cena roda no dispositivo que abre o dashboard, não no
HA nem no GitHub): ~30 MB de JavaScript + ~64 MB de mapas de sombra na GPU + ~15 MB de
texturas/geometria, na qualidade `alta`. Com `quality: leve` os mapas de sombra caem para
~14 MB e o pixel ratio fica em 1,25× — bom para tablets de parede ou notebooks fracos.
No disco o cartão tem 238 KB; nada é armazenado além disso.

- As malhas estáticas (paredes, mobília) são fundidas por material na inicialização:
  ~750 objetos viram ~55 draw calls.
- O pixel ratio é adaptativo (orçamento de ~2,4 Mpx por quadro), então em telas Retina
  grandes ele baixa de 2× para ~1,3–1,7×.
- Só 6 luminárias projetam sombra (as que separam cômodos); as demais têm alcance curto.
- Nada é renderizado parado: só quando a câmera se move, um estado muda ou há
  animação ociosa (água/TV, a 30 fps).
- Ligar/desligar luz não recompila shaders (todas as luzes ficam ativas com
  intensidade zero), então o clique responde na hora.

## Ajustando a planta

Tudo está em metros no topo de `casa3d-card.js` (X → direita, Z → frente):

- `ZONES` — os pisos (cômodos) e qual luz cada um alterna ao clicar.
- `ITEMS` — luminárias: posição `p`, intensidade `i` (cd), alcance `d` (m).
- `POOL`, `DECK`, `LOT` — piscina, deck e muros.
- `_buildWalls()` — paredes com portas (`door`), janelas (`window`), vidro (`glass`),
  vãos (`open`) e portão (`gate`).
- `_buildFurniture()` — objetos ligados a entidades (TV, ar, carro) e chamadas das funções
  de decoração de cada cômodo (`roomQuartoCasal`, `roomSalaCozinha`… no topo do arquivo,
  entre `@rooms-begin` e `@rooms-end`); `furniture()` tem as peças reutilizáveis.
- `integrate_rooms.py` — cola arquivos `rooms/<cômodo>.js` (uma função `room…(ctx)` cada)
  no cartão, caso queira refazer a decoração de um cômodo separadamente.

Depois de editar, `python3 build.py` regenera a demo.

## Observações

- O Three.js é carregado do jsdelivr (`three@0.170.0`). O **dispositivo que abre o
  dashboard** precisa de internet; o HA em si não.
- A geometria é aproximada a partir do render do Sweet Home 3D que estava em
  `www/Casa 3D/` — não é medida real.
- **Banheiro + Dispensa**: o seu `picture-elements` atual liga esse overlay ao mesmo
  interruptor da luz externa (`light.interruptor_cozinha_center`), então o cartão
  reproduz isso. Se o circuito certo for o 3º botão do interruptor da cozinha
  (`light.interruptor_cozinha_right`), troque em `entities.banheiro`.
- Testado em Chrome/Safari desktop e layout de celular (retrato afasta a câmera para
  caber o lote inteiro).
