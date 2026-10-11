/* Dados de exemplo (modo demo). Nomes e empresas são fictícios. */
(function (g) {
  var AREAS = ['Tecnologia', 'Design', 'Marketing', 'Vendas', 'Finanças', 'Saúde', 'Educação', 'Operações'];
  var EMOJI = { Tecnologia: '💻', Design: '🎨', Marketing: '📣', Vendas: '🤝', Finanças: '📊', Saúde: '🩺', Educação: '📚', Operações: '🚚' };
  var HUE = { Tecnologia: 215, Design: 285, Marketing: 335, Vendas: 25, Finanças: 150, Saúde: 175, Educação: 45, Operações: 100 };
  var MODS = ['Remoto', 'Híbrido', 'Presencial'];

  var JOBS = [
    ['Dev Front-end Pleno', 'Nuvem Azul', 'Tecnologia', 'Remoto', 'São Paulo, SP', 9000, ['React', 'TypeScript', 'CSS'], 'Construa interfaces rápidas para um app de pagamentos usado por milhares de lojas.'],
    ['Engenheiro(a) de Dados', 'Rio Dados', 'Tecnologia', 'Híbrido', 'Rio de Janeiro, RJ', 12000, ['Python', 'SQL', 'Airflow'], 'Monte pipelines confiáveis e o catálogo de dados da empresa.'],
    ['Analista de QA', 'Vértice Soft', 'Tecnologia', 'Remoto', 'Belo Horizonte, MG', 6500, ['Cypress', 'API', 'Agile'], 'Garanta a qualidade das entregas com testes automatizados e exploratórios.'],
    ['Dev Back-end Sênior', 'Porto Digital', 'Tecnologia', 'Híbrido', 'Recife, PE', 15000, ['Node', 'Postgres', 'AWS'], 'Projete APIs escaláveis e lidere decisões técnicas do time de plataforma.'],
    ['Product Designer', 'Casulo Studio', 'Design', 'Remoto', 'Curitiba, PR', 8500, ['Figma', 'Pesquisa', 'Design System'], 'Desenhe fluxos de ponta a ponta e cuide do design system.'],
    ['Designer Gráfico', 'Tinta Viva', 'Design', 'Presencial', 'Porto Alegre, RS', 4800, ['Illustrator', 'Branding'], 'Crie identidades visuais e peças para clientes de varejo.'],
    ['Analista de Marketing de Performance', 'Alvo Digital', 'Marketing', 'Híbrido', 'São Paulo, SP', 7000, ['Google Ads', 'Meta Ads', 'GA4'], 'Gerencie campanhas pagas e otimize o custo por aquisição.'],
    ['Redator(a) de Conteúdo', 'Pauta Certa', 'Marketing', 'Remoto', 'Florianópolis, SC', 4200, ['SEO', 'Copywriting'], 'Escreva artigos e newsletters para marcas B2B.'],
    ['Executivo(a) de Contas', 'Cesta Forte', 'Vendas', 'Presencial', 'Goiânia, GO', 5500, ['Negociação', 'CRM'], 'Prospecte e feche contratos com redes de supermercados.'],
    ['SDR Inbound', 'Nuvem Azul', 'Vendas', 'Remoto', 'São Paulo, SP', 3800, ['Prospecção', 'HubSpot'], 'Qualifique leads e agende reuniões para o time comercial.'],
    ['Analista Financeiro', 'Moeda Clara', 'Finanças', 'Híbrido', 'Brasília, DF', 7800, ['Excel', 'FP&A', 'Power BI'], 'Acompanhe orçamento, fluxo de caixa e indicadores mensais.'],
    ['Contador(a)', 'Escritório Prisma', 'Finanças', 'Presencial', 'Campinas, SP', 6000, ['Fiscal', 'Folha', 'SPED'], 'Cuide da escrituração e das obrigações fiscais de clientes PME.'],
    ['Enfermeiro(a)', 'Clínica Bem Viver', 'Saúde', 'Presencial', 'Salvador, BA', 5200, ['COREN', 'UTI', 'Triagem'], 'Atue na assistência e no acompanhamento de pacientes internados.'],
    ['Nutricionista Clínico(a)', 'Vida Plena', 'Saúde', 'Híbrido', 'Fortaleza, CE', 5000, ['Dietoterapia', 'Prontuário'], 'Monte planos alimentares e acompanhe a evolução dos pacientes.'],
    ['Professor(a) de Matemática', 'Colégio Horizonte', 'Educação', 'Presencial', 'Manaus, AM', 4600, ['Licenciatura', 'Ensino Médio'], 'Lecione para o ensino médio e apoie projetos de olimpíadas.'],
    ['Designer Instrucional', 'Aprende Mais', 'Educação', 'Remoto', 'Belo Horizonte, MG', 6200, ['EAD', 'Storyline', 'Moodle'], 'Transforme conteúdos em cursos online envolventes.'],
    ['Analista de Logística', 'Rota Sul', 'Operações', 'Presencial', 'Joinville, SC', 5400, ['WMS', 'Transporte', 'KPIs'], 'Otimize rotas e a operação do centro de distribuição.'],
    ['Coordenador(a) de Operações', 'Entrega Já', 'Operações', 'Híbrido', 'São Paulo, SP', 9500, ['Gestão de equipe', 'SLA', 'Lean'], 'Lidere a operação de última milha em três cidades.'],
    ['Analista de Customer Success', 'Vértice Soft', 'Vendas', 'Remoto', 'Belo Horizonte, MG', 6000, ['Onboarding', 'Retenção', 'SaaS'], 'Acompanhe clientes B2B e reduza o churn.'],
    ['Dev Mobile (Flutter)', 'Porto Digital', 'Tecnologia', 'Remoto', 'Recife, PE', 10000, ['Flutter', 'Dart', 'Firebase'], 'Evolua o app de entregas usado em todo o Nordeste.'],
    ['UX Researcher', 'Casulo Studio', 'Design', 'Híbrido', 'Curitiba, PR', 8000, ['Entrevistas', 'Testes de usabilidade'], 'Conduza pesquisas e transforme insights em decisões de produto.'],
    ['Social Media', 'Pauta Certa', 'Marketing', 'Remoto', 'Florianópolis, SC', 3600, ['Instagram', 'Calendário editorial'], 'Planeje e publique conteúdo para marcas de moda e gastronomia.'],
    ['Auxiliar Administrativo', 'Escritório Prisma', 'Operações', 'Presencial', 'Campinas, SP', 2600, ['Excel', 'Atendimento'], 'Apoie rotinas administrativas e atendimento a clientes.'],
    ['Gerente de Contas', 'Moeda Clara', 'Vendas', 'Híbrido', 'Brasília, DF', 11000, ['Carteira', 'Crédito PJ'], 'Cuide de uma carteira de empresas médias e expanda a relação.']
  ].map(function (r, i) {
    return { id: 'j' + (i + 1), title: r[0], company: r[1], area: r[2], mode: r[3], city: r[4], salary: r[5], tags: r[6], desc: r[7], seed: true };
  });

  var CANDS = [
    ['Marina Souza', 'Dev Front-end', 'Tecnologia', 'São Paulo, SP', 8500, ['React', 'Vue', 'Acessibilidade'], '5 anos construindo interfaces; gosto de performance e design system.'],
    ['Rafael Lima', 'Engenheiro de Dados', 'Tecnologia', 'Rio de Janeiro, RJ', 11000, ['Python', 'Spark', 'SQL'], 'Pipelines em produção e foco em qualidade de dados.'],
    ['Beatriz Alves', 'Product Designer', 'Design', 'Curitiba, PR', 8000, ['Figma', 'Pesquisa', 'Prototipagem'], 'Design de produto B2B, do discovery à entrega.'],
    ['Thiago Mendes', 'Analista de Marketing', 'Marketing', 'São Paulo, SP', 6500, ['Google Ads', 'GA4', 'SEO'], 'Performance com foco em CAC e LTV.'],
    ['Camila Ferreira', 'Executiva de Contas', 'Vendas', 'Goiânia, GO', 5000, ['Negociação', 'CRM', 'Varejo'], 'Histórico de batimento de meta em 3 anos seguidos.'],
    ['Lucas Pereira', 'Analista Financeiro', 'Finanças', 'Brasília, DF', 7500, ['Excel', 'Power BI', 'FP&A'], 'Planejamento, orçamento e análise de indicadores.'],
    ['Juliana Rocha', 'Enfermeira', 'Saúde', 'Salvador, BA', 5000, ['UTI', 'Triagem', 'Protocolos'], 'Experiência em hospital de médio porte.'],
    ['Gustavo Nunes', 'Professor de Matemática', 'Educação', 'Manaus, AM', 4500, ['Ensino Médio', 'Olimpíadas'], 'Aprovações consistentes em vestibulares.'],
    ['Patrícia Gomes', 'Analista de Logística', 'Operações', 'Joinville, SC', 5200, ['WMS', 'Transporte', 'KPIs'], 'Redução de custo de frete com roteirização.'],
    ['André Barros', 'Dev Back-end', 'Tecnologia', 'Recife, PE', 14000, ['Node', 'Go', 'AWS'], 'APIs de alto volume e arquitetura de serviços.'],
    ['Larissa Martins', 'Redatora', 'Marketing', 'Florianópolis, SC', 4000, ['SEO', 'Copywriting', 'Edição'], 'Conteúdo B2B que gera leads qualificados.'],
    ['Felipe Araújo', 'QA Engineer', 'Tecnologia', 'Belo Horizonte, MG', 6800, ['Cypress', 'Playwright', 'API'], 'Automação de testes e cultura de qualidade.'],
    ['Renata Dias', 'Designer Instrucional', 'Educação', 'Belo Horizonte, MG', 6000, ['EAD', 'Storyline', 'Moodle'], 'Cursos corporativos com alta taxa de conclusão.'],
    ['Diego Castro', 'Customer Success', 'Vendas', 'São Paulo, SP', 6200, ['SaaS', 'Onboarding', 'Retenção'], 'Carteira enterprise com churn abaixo de 2%.'],
    ['Aline Teixeira', 'Contadora', 'Finanças', 'Campinas, SP', 6200, ['Fiscal', 'Folha', 'SPED'], 'Atendimento a PMEs do Simples ao Lucro Real.'],
    ['Bruno Carvalho', 'Dev Mobile', 'Tecnologia', 'Recife, PE', 9500, ['Flutter', 'Kotlin', 'Firebase'], 'Apps publicados com milhões de downloads.']
  ].map(function (r, i) {
    return { id: 'c' + (i + 1), name: r[0], headline: r[1], area: r[2], city: r[3], salary: r[4], tags: r[5], bio: r[6], seed: true };
  });

  g.JMData = { AREAS: AREAS, EMOJI: EMOJI, HUE: HUE, MODS: MODS, JOBS: JOBS, CANDS: CANDS };
})(window);
