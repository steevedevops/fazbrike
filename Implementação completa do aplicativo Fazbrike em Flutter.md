# Objetivo

Crie o aplicativo **Fazbrike completo em Flutter**, utilizando como referência principal o frontend web existente em:

`frontend/src/`

O backend do projeto **já está pronto e funcional**. O aplicativo Flutter deve consumir esse backend existente, sem recriar regras de negócio no cliente e sem criar um backend paralelo.

O resultado esperado não é um protótipo, conjunto de telas estáticas ou MVP incompleto. Quero um **aplicativo Flutter completo, funcional e integrado ao backend**, reproduzindo no mobile todas as funcionalidades aplicáveis existentes no frontend web.

## 1. LEITURA OBRIGATÓRIA ANTES DE IMPLEMENTAR

Antes de alterar ou criar qualquer código, leia integralmente e siga as instruções das seguintes skills:

- `.cursor/skills/skill-flutter-module-structure/SKILL.md`
- `.cursor/skills/skill-new-flutter-app-structure/SKILL.md`

Essas skills definem os padrões arquiteturais e estruturais que devem ser utilizados.

Não ignore, simplifique ou substitua esses padrões por uma arquitetura própria.

Depois disso, faça uma análise completa de:

- `frontend/src/`
- estrutura de rotas do frontend;
- páginas;
- componentes;
- layouts;
- modais;
- formulários;
- validações;
- autenticação;
- estados;
- serviços;
- chamadas HTTP/API;
- models/interfaces/types;
- regras de negócio;
- tratamento de erros;
- permissões;
- upload/download de arquivos;
- filtros;
- paginação;
- buscas;
- estados de loading;
- estados vazios;
- feedbacks ao usuário;
- responsividade;
- assets, ícones, cores e tipografia.

Também localize no projeto todas as informações necessárias para integração com o backend.

**Não comece implementando telas antes de entender como o sistema atual funciona.**

## 2. FRONTEND WEB COMO FONTE DE VERDADE

Considere `frontend/src/` como a principal referência funcional e visual do aplicativo.

Mapeie todas as funcionalidades existentes antes da implementação.

Para cada página/fluxo existente no frontend, identifique:

1. finalidade;
2. rota;
3. dados utilizados;
4. endpoints consumidos;
5. parâmetros enviados;
6. resposta esperada;
7. validações;
8. estados possíveis;
9. regras de negócio;
10. ações disponíveis;
11. navegação resultante;
12. tratamento de erro;
13. componentes reutilizados;
14. comportamento responsivo.

Não implemente apenas aquilo que estiver visualmente evidente na página.

Analise também hooks, stores, services, providers, contexts, utilities, types e demais arquivos relacionados para descobrir o comportamento real da funcionalidade.

## 3. PARIDADE FUNCIONAL

O aplicativo Flutter deve possuir **paridade funcional com o frontend web**, considerando tudo que fizer sentido em ambiente mobile.

Isso inclui todos os fluxos existentes, como autenticação, cadastros, consultas, detalhes, edição, exclusão, filtros, buscas, paginação, uploads, configurações e demais funcionalidades encontradas no projeto.

Não invente funcionalidades inexistentes.

Não remova funcionalidades por considerar que são secundárias.

Quando determinada interação web não fizer sentido diretamente no mobile, adapte a experiência para Flutter mantendo a mesma regra de negócio e resultado final.

## 4. LAYOUT E IDENTIDADE VISUAL

Reproduza no Flutter o padrão visual existente em `frontend/src/`.

Analise e reutilize conceitualmente:

- paleta de cores;
- tipografia;
- espaçamentos;
- bordas;
- radius;
- sombras;
- cards;
- botões;
- campos;
- headers;
- menus;
- navegação;
- ícones;
- dialogs;
- modais;
- loaders;
- mensagens;
- estados vazios;
- imagens e demais elementos da identidade visual.

Não quero uma cópia literal de um site desktop dentro de uma tela pequena.

Transforme a interface em uma experiência **mobile nativa e responsiva**, preservando a identidade visual e os fluxos do Fazbrike.

Utilize componentes reutilizáveis sempre que houver padrões repetidos.

## 5. INTEGRAÇÃO COM O BACKEND

O backend existente deve ser utilizado como fonte real dos dados.

Não utilize:

- mocks permanentes;
- dados hardcoded;
- respostas simuladas;
- repositories fake;
- APIs fictícias;
- endpoints inventados.

Identifique os endpoints utilizados pelo frontend e, quando necessário, analise o backend existente para confirmar contratos.

Implemente corretamente:

- cliente HTTP;
- base URL configurável;
- headers;
- autenticação;
- tokens;
- refresh token, caso exista;
- interceptors;
- serialização/deserialização;
- timeouts;
- tratamento de erros HTTP;
- erros de conexão;
- sessão expirada;
- persistência segura das credenciais/tokens;
- upload/download quando existente.

Nunca altere o contrato do backend simplesmente para facilitar o Flutter.

## 6. ARQUITETURA FLUTTER

A estrutura do projeto deve seguir obrigatoriamente:

`.cursor/skills/skill-flutter-module-structure/SKILL.md`

e

`.cursor/skills/skill-new-flutter-app-structure/SKILL.md`

Respeite os padrões definidos nessas skills para:

- módulos/features;
- separação de responsabilidades;
- presentation;
- domain;
- data;
- repositories;
- services;
- models/entities;
- gerenciamento de estado;
- injeção de dependências;
- rotas;
- tema;
- componentes compartilhados;
- tratamento de erros.

Evite arquivos gigantes.

Evite duplicação.

Não concentre regras de negócio dentro dos Widgets.

Crie componentes compartilhados quando houver comportamento ou aparência reutilizável.

## 7. NAVEGAÇÃO

Converta adequadamente a navegação existente no frontend para uma experiência mobile.

Garanta:

- fluxo de autenticação;
- rotas protegidas;
- redirecionamentos;
- navegação entre módulos;
- parâmetros de rota;
- deep links, caso já sejam necessários pelo sistema;
- comportamento correto do botão voltar;
- preservação de estado quando apropriado.

## 8. FORMULÁRIOS

Todos os formulários existentes devem manter as mesmas regras do sistema atual.

Implemente:

- validações;
- máscaras;
- obrigatoriedade;
- limites;
- tipos corretos de teclado;
- mensagens de erro;
- loading durante submissão;
- prevenção de submissões duplicadas;
- feedback de sucesso;
- feedback de erro.

Compare o comportamento diretamente com o frontend existente.

## 9. ESTADOS DE INTERFACE

Nenhuma tela dependente de dados deve considerar somente o cenário de sucesso.

Implemente adequadamente:

- initial;
- loading;
- success;
- empty;
- error;
- offline, quando aplicável;
- retry.

O usuário deve sempre receber feedback adequado.

## 10. QUALIDADE

Durante a implementação:

- execute `flutter analyze`;
- corrija warnings e erros relevantes;
- mantenha código formatado;
- utilize null safety corretamente;
- remova imports não utilizados;
- evite código morto;
- não deixe TODOs de funcionalidades obrigatórias;
- não deixe telas placeholder;
- não deixe botões sem ação;
- não deixe fluxos parcialmente implementados.

Não considere uma funcionalidade concluída apenas porque a interface compila.

Ela precisa funcionar de ponta a ponta.

## 11. TESTES

Teste os principais fluxos depois da implementação.

Priorize testes para:

- autenticação;
- sessão;
- navegação;
- chamadas ao backend;
- parsing de respostas;
- formulários;
- validações;
- fluxos críticos;
- tratamento de erro.

Quando possível, execute o aplicativo e valide o comportamento real.

## 12. PROCESSO DE IMPLEMENTAÇÃO

Trabalhe de forma sistemática.

### Fase 1 — Descoberta

Leia as skills obrigatórias.

Analise `frontend/src/`.

Analise a integração existente com o backend.

Mapeie páginas, funcionalidades, endpoints e regras.

### Fase 2 — Planejamento

Defina o mapeamento:

`Funcionalidade Web → Tela/Fluxo Flutter → Endpoint → Estado → Implementação`

Identifique componentes compartilhados e dependências entre módulos.

### Fase 3 — Estrutura

Prepare a arquitetura Flutter seguindo estritamente as skills fornecidas.

Configure:

- tema;
- ambiente;
- networking;
- autenticação;
- armazenamento;
- navegação;
- tratamento global de erros;
- componentes compartilhados.

### Fase 4 — Implementação

Implemente módulo por módulo.

Para cada módulo:

1. analise completamente a implementação web;
2. identifique APIs e regras;
3. implemente camada de dados;
4. implemente gerenciamento de estado;
5. implemente UI;
6. conecte UI aos dados reais;
7. implemente erros/loading/empty;
8. valide o fluxo;
9. somente então avance.

### Fase 5 — Validação final

Ao terminar, faça novamente uma varredura completa de `frontend/src/`.

Compare tudo que existe no frontend com o aplicativo Flutter.

Procure especificamente por:

- páginas esquecidas;
- ações não implementadas;
- botões sem comportamento;
- endpoints não utilizados;
- formulários incompletos;
- modais ausentes;
- filtros ausentes;
- estados ausentes;
- regras de negócio ignoradas.

Corrija todas as divergências encontradas.

## 13. REGRA CONTRA IMPLEMENTAÇÃO PARCIAL

Não encerre o trabalho após criar apenas:

- estrutura inicial;
- login;
- dashboard;
- algumas telas principais;
- mocks;
- placeholders.

Continue trabalhando até que todas as funcionalidades aplicáveis encontradas em `frontend/src/` estejam implementadas e integradas.

Se encontrar uma funcionalidade cuja implementação dependa de informação realmente inexistente no repositório, documente exatamente:

- qual funcionalidade;
- qual informação está faltando;
- onde você procurou;
- por que isso impede a implementação.

Não invente comportamento para preencher informações desconhecidas.

## 14. NÃO ALTERAR O SISTEMA EXISTENTE DESNECESSARIAMENTE

Evite modificar `frontend/src/` ou o backend.

Eles são referências para construção do aplicativo.

Só altere código fora do Flutter caso seja absolutamente necessário e exista uma justificativa técnica clara.

O objetivo principal é implementar o aplicativo Flutter, não refatorar o sistema existente.

## 15. RESULTADO ESPERADO

Ao final, quero um aplicativo Fazbrike em Flutter:

- completo;
- compilável;
- organizado;
- integrado ao backend real;
- seguindo as duas skills fornecidas;
- visualmente consistente com o frontend;
- adaptado corretamente para mobile;
- com autenticação e sessão funcionando;
- com todas as funcionalidades aplicáveis do frontend;
- sem mocks;
- sem placeholders;
- sem telas vazias;
- sem botões sem implementação;
- sem fluxos críticos incompletos;
- sem erros do `flutter analyze`.

Antes de considerar o trabalho concluído, faça uma **auditoria final de paridade** entre `frontend/src/` e o Flutter e apresente um checklist indicando cada funcionalidade encontrada e seu correspondente no aplicativo.

**Não assuma que o trabalho terminou porque o projeto compila. A conclusão depende da paridade funcional com o sistema existente e da validação dos fluxos de ponta a ponta.**