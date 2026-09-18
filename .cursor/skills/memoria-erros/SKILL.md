---
name: memoria-erros
description: Memória persistente de erros e correções neste repositório NinhoHouse (Flutter mobile, Next.js frontend/dashboard, webpage, Django backend). Obrigatória via @.cursor/rules/memoria-erros-always.mdc (alwaysApply). Usar antes de repetir trabalho numa área que já falhou; quando o utilizador pedir para não repetir ou registrar; após falha em analyze/build/test/lint/CI ou revisão que gerou retrabalho; ao rever código semelhante às entradas. Ler references/memoria-erros.md e acrescentar novas entradas no formato definido.
---

# Memória de erros

**Escopo global neste projeto:** o fluxo está na regra `@.cursor/rules/memoria-erros-always.mdc` (`alwaysApply: true`), válida em qualquer sessão neste workspace.

Objetivo: reduzir retrabalho registando **o que falhou**, **onde** (mobile / frontend / webpage / backend), e **o que passar a fazer** da próxima vez.

## Stacks cobertas

- **Mobile:** `ninhohouse/mobile` — ex.: `dart analyze`, `flutter test`, padrões em `flutter-layout-standards`, `flutter-module-structure`.
- **Frontend (dashboard):** `ninhohouse/frontend` — ex.: `npm run lint`, `npm run build`, skills Next/React do projeto.
- **Site:** `ninhohouse/webpage` — mesmo espírito que frontend (comandos do `package.json` local).
- **Backend:** Django/DRF sob `ninhohouse/` — ex.: `pytest`, migrations, padrões em `django-patterns.mdc`.

## Arquivo da memória

- Caminho fixo: [references/memoria-erros.md](references/memoria-erros.md)

## Antes de implementar

1. Abrir `references/memoria-erros.md`.
2. Procurar por palavras-chave da tarefa atual (nome de pasta, API, comando, tipo de erro).
3. Se existir entrada relevante, aplicar a **regra prática** indicada antes de codificar.

## Quando registrar uma nova entrada

Registrar quando **pelo menos uma** destas condições for verdadeira:

- O utilizador pediu explicitamente para não repetir o erro ou para gravar na memória.
- Houve falha objetiva (`dart analyze`, testes, build, lint, CI) causada pela mudança e já há correção aplicada ou caminho correto definido.
- A mesma classe de erro já apareceu mais de uma vez na conversa.
- Houve **refatoração ou padronização relevante** (tela/fluxo Flutter, componente Next, view Django, página do site): acrescentar entrada com a **regra prática**, mesmo sem falha de build.

Não usar este arquivo como changelog de produto nem como lista genérica de boas práticas — apenas falhas **concretas** e **ações específicas** para não repetir.

## Como acrescentar

1. Copiar o bloco modelo do topo de `references/memoria-erros.md`.
2. Preencher todos os campos; omitir apenas linhas opcionais marcadas como tal.
3. Colar **no final do arquivo**, depois da última entrada (ordem cronológica).
4. Manter entradas curtas (idealmente até ~15 linhas por incidente).

## Conteúdo permitido e proibido

- Permitido: sintomas (mensagem de erro ou comportamento), arquivo ou módulo, causa raiz se clara, comando útil de verificação, **regra prática** em uma frase ou marcadores.
- Proibido: dados sensíveis (tokens, senhas, PII); dumps enormes de log (resumir em uma linha); duplicar entrada anterior na mesma causa — preferir editar a entrada antiga acrescentando data ou refinamento.

## Manutenção

- Se uma entrada ficar obsoleta (código removido ou API mudou), marcar na própria entrada com `(obsoleto — motivo)` ou remover num único commit de limpeza, sem misturar com mudanças de feature.
