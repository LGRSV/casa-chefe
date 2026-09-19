# Casa 3D — cartão Lovelace para Home Assistant

Demo: https://lgrsv.github.io/casa-chefe/ · Repositório: https://github.com/LGRSV/casa-chefe

Modelo 3D interativo da sua casa (Three.js) ligado às entidades do Home Assistant:
gira, dá zoom, e cada cômodo acende conforme o interruptor real. Clicar no cômodo,
na luminária ou no chip alterna a entidade. Substitui o `picture-elements` com PNGs
da vista "3D" por uma cena de verdade.

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
   - URL: `/local/casa3d/casa3d-card.js?v=5`
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
panel: true           # painel inferior aberto ao iniciar (false = recolhido)
roof: false           # começa com o telhado visível (botão "Telhado" alterna)
quality: alta         # 'leve' = sombras menores e menos luzes com sombra (~40 MB em vez de ~120 MB de GPU)
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
- **Dia/noite**: em `auto` segue o `sun.sun`; os botões Dia/Noite forçam.
- **Visão noturna**: à noite, uma luz de lua com sombras e um ambiente azulado mantêm a
  casa inteira visível; as luzes acesas continuam se destacando em tom quente. Desligue
  no botão (ou `night_vision: false`) para o visual escuro dramático.
- **Água**: shader próprio (ondas animadas, reflexo do céu com Fresnel, brilho do sol,
  cor por profundidade, espuma na borda, cáusticas no fundo). Os LEDs ficam na parede da
  piscina e a luz esmaece pela água.
- **Tempo real**: o cartão mostra data e hora (fuso de `timezone`), o nascer e o pôr do sol
  do dia, e, em `mode: auto`, a
  luz segue o sol de verdade — elevação e azimute vindos do `sun.sun` do HA (ou calculados
  pela data e pela latitude/longitude). O sol gira ao longo do dia, a sombra acompanha,
  amanhecer e entardecer ficam alaranjados, e a noite entra sozinha. `orientation` diz
  para onde a frente da casa aponta, para o sol nascer do lado certo.
- **Telhado**: botão que cobre a casa com telhado de telha cerâmica (e forro), para a vista
  externa; desligado, volta a vista de casinha de boneca.
- **Rua**: calçada, meio-fio e asfalto na frente do lote, só para dar contexto.

## Painel inferior (Cômodos · Automações · Atividade)

Barra na parte de baixo do cartão (recolhe pelo ˅ e volta pelo botão "Painel"). A câmera
enquadra a casa na área que sobra acima dela.

- **Cômodos**: grade de blocos quadrados, cada um com o cômodo, o dispositivo, o estado e há
  quanto tempo mudou; tocar alterna a entidade. O **⋯** abre a faixa de controles: brilho e
  cores do LED do quarto, modo e temperatura do ar-condicionado, tocar/pausar e volume da TV,
  e um **temporizador** ("desligar em 15/30/60 min") para qualquer luz/interruptor — ele roda
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
