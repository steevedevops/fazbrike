# Memória de erros — NinhoHouse

Este arquivo é **append-only por convenção**: novas entradas no **final**. A IA deve **ler antes** de tarefas similares e **escrever depois** de correções ou de **mudanças relevantes** de tela/fluxo/padrão em qualquer stack (mobile Flutter, dashboard Next.js, site webpage, backend Django) — não só após erro de build.

Persistência entre sessões: o ficheiro está no repositório; **commit/push** propagam a memória. A obrigatoriedade está em `@.cursor/rules/memoria-erros-always.mdc`.

**Escopo por pasta:** `ninhohouse/mobile/` · `ninhohouse/frontend/` · `ninhohouse/webpage/` · Django (`app/`, views API, etc.).

---

## Modelo de entrada (copiar abaixo da linha `---` da última entrada)

```
### YYYY-MM-DD — título curto do incidente

- **Contexto:** (stack, ficheiro ou fluxo — uma linha)
- **Sintoma:** (mensagem ou comportamento)
- **Causa:** (se conhecida; senão: "desconhecida")
- **Correção / regra prática:** (o que fazer da próxima vez — marcadores ok)
- **Verificação:** (comando ou passo opcional)
```

---

<!-- Entradas abaixo desta linha (mais recentes por último) -->

### 2026-04-29 — Mobile: diálogo aceitar cobrança mostra repasse do proprietário

- **Contexto:** Flutter `gerenciar_reserva_aceite_cobranca_dialog.dart` (fluxo proprietário aceitar reserva e gerar cobrança).
- **Sintoma:** No confirmar, faltava no próprio modal o detalhe explícito da taxa e do valor estimado que o proprietário recebe (“sobra”), alinhado ao card da tela.
- **Causa:** Prévia da taxa no dialog era parcial (sem base, sem “você recebe estimado” quando taxa não repassada; com repasse, só “hóspede pagará”).
- **Correção / regra prática:** No modal final, espelhar o resumo do card: valor base (se vier da API), taxa estimada (e % se existir), total ao hóspede quando `repassar_taxa_inquilino`, sempre **Você recebe estimado** com `proprietario_recebe_estimado`; usar `AppUtils.parseMoneyBr` nos campos da API; conteúdo rolável (`maxHeight` ~88% da tela) para muitos itens.
- **Verificação:** `dart analyze lib/src/app/proprietario/locacao/widgets/gerenciar_reserva/gerenciar_reserva_aceite_cobranca_dialog.dart`

### 2026-04-29 — Política: memória multi-stack e quando alimentar

- **Contexto:** Monorepo NinhoHouse — Flutter (`ninhohouse/mobile`), dashboard (`ninhohouse/frontend`), site (`ninhohouse/webpage`), API Django.
- **Sintoma:** Decisões de correção ou padronização esquecidas em chats seguintes; repetir o mesmo erro entre camadas (ex.: contrato API vs modelo Dart).
- **Causa:** Memória só atualizada quando há “erro” objetivo, ou só numa stack.
- **Correção / regra prática:** Ao fechar correção ou decisão que deva evitar retrabalho: **entrada datada** no final deste ficheiro com **stack**, **regra prática** e **verificação** (ex.: `dart analyze` em `mobile/lib/...`; `npm run lint` em `frontend/`; `pytest` ou testes Django para `app/tests_*.py`). Para integração API + app: uma entrada pode referenciar serializer/view **e** modelo/cliente Dart. Preferir **mesmo commit/PR** que o código quando possível.
- **Verificação:** `git log --oneline -- .cursor/skills/memoria-erros/references/memoria-erros.md`

### 2026-04-29 — Dashboard: detalhe da visita centralizado + contato + consulta crédito Asaas

- **Contexto:** Next.js `frontend/src/app/dashboard/agendamentos/[id]/page.tsx`; `frontend/src/app/dashboard/mensagens/page.tsx` (deep link); Django `view_agendamento.py` + `urls_dash.py` (`POST …/agendamento-visita/<pk>/consulta-credito/`).
- **Sintoma:** Conteúdo em largura total (PageContainer); telefone ilegível; CTA de conversa não deve ir para WhatsApp — usar **chat NinhoHouse** no mesmo produto.
- **Causa:** Falta de contraste no link `tel:`; WhatsApp como atalho externo em vez da sala já modelada (`sala-conversa`).
- **Correção / regra prática:** Shell como detalhe da reserva (`min-h-full bg-slate-100`, coluna central `max-w-lg … lg:max-w-3xl`, header sticky). **Telefone:** `font-semibold`, `text-slate-900`, sublinhado suave. **Conversa:** link `/dashboard/mensagens?imovel=<codigo Imovel>&usuario=<User.id>`; em Mensagens, `useEffect` busca sala direta no imóvel ou `chatService.criarSala({ imovel, usuarios: [id], tipo: 'direto' })`, depois `router.replace` sem query. **Consulta crédito:** `Asaas.serasa_consulta`; CPF/CNPJ 11/14 dígitos ou `asaascustomerid`; modal JSON.
- **Verificação:** `npx eslint src/app/dashboard/agendamentos/[id]/page.tsx src/app/dashboard/mensagens/page.tsx`; `python3 -m py_compile …/view_agendamento.py`.

### 2026-04-29 — Dashboard imóveis: no máximo 6 cartões de status

- **Contexto:** Next.js listagem `frontend/src/app/dashboard/imoveis/page.tsx` (`StatusPinGrid`); formulários novo/editar imóvel e `NovoImovelModal.tsx`; componente `frontend/src/components/imoveis/ImovelStatusPicker.tsx`.
- **Sintoma:** Muitos pins na listagem ou select único com todos os status sem limite visual de “cartões”.
- **Correção / regra prática:** Na listagem de imóveis, **no máximo 6** itens no `StatusPinGrid`; status extras só no select de filtro. Nos formulários, **6 botões** (rápidos) + select **“Demais status…”** (`mode: 'novo' | 'editar'` com conjuntos `QUICK_*` / `OVERFLOW_*`). Labels centralizados em `imovelStatusLabel()` quando precisar de texto (ex.: toast no editar).
- **Verificação:** `npx eslint src/components/imoveis/ImovelStatusPicker.tsx src/app/dashboard/imoveis/page.tsx`

### 2026-04-29 — API dash: listagem de agendamentos — “últimos” = pedido mais recente

- **Contexto:** Django `app/view_dash/view_agendamento.py` (listagem paginada); opcionalmente `view_visita.py`; modelo `AgendamentoVisita` (`Meta.ordering`).
- **Sintoma:** Tabela parecia mostrar ordem estranha para “últimos agendamentos”; ordenação por **data da visita** não coincide com **último pedido registrado**.
- **Causa:** `order_by('-data_visita', '-hora_inicio')` prioriza calendário da visita, não o momento da solicitação.
- **Correção / regra prática:** Para listagens administrativas “últimos primeiro”, usar **`order_by('-data_solicitacao', '-codigo')`** (e alinhar `Meta.ordering`). Na página Next `agendamentos/page.tsx`, enviar `orderby: 'data_solicitacao', order: 'desc'` se documentar intenção na API (mesmo que a view imponha ordem).
- **Verificação:** `python3 -m py_compile …/view_agendamento.py …/view_visita.py`; conferir primeira página da listagem após criar novo agendamento.

### 2026-04-29 — Dashboard Next.js: listagens e módulos — layout canónico = listagem de Reservas

- **Contexto:** `ninhohouse/frontend/src/app/dashboard/**` — páginas de lista e “hub” de cada módulo (tabelas, pins de métricas, filtros).
- **Sintoma:** Telas com `Layout` + `div` branca + `h1`/`px-6` próprios, ou toolbar inconsistente (sem `PageSection`, refresh como botão texto largo, sem `flex-wrap`), fugindo da hierarquia do painel.
- **Causa:** Formulários foram padronizados (`ReservaForm`); listagens cresceram soltas sem copiar o molde da primeira referência do produto.
- **Correção / regra prática:** Tratar **`src/app/dashboard/reservas/page.tsx`** como **fonte de verdade do layout de listagem**:
  - **`Layout`** → **`PageContainer`** (coluna `bg-white` full-bleed com `flex h-full min-h-0 flex-1 flex-col`).
  - **`PageHeader`**: `title`, `description`, `actions` (CTA primário à direita, ex. “Nova …”, mesmas classes que em Reservas).
  - Opcional — métricas / atalhos: **`PageSection className="pb-0"`** + **`StatusPinGrid`** (ou bloco equivalente) quando o módulo tiver contadores.
  - Barra de busca / filtros: **`PageSection className="space-y-4 pb-3"`** com **`flex flex-wrap items-center justify-between gap-3`**: à esquerda `form` + **`SearchInput`** (`min-w-[12rem] max-w-md flex-1`); cluster secundário (tabs “Todas / Proprietário / NinhoHouse”, etc.) ao lado quando existir; à direita **`flex flex-shrink-0 items-center gap-3`** com `<select>` de status completo quando necessário, botão **`Filter`** (`variant="outline"` `p-2` …) se houver painel extra, **`RefreshCw`** como botão ícone (`p-2`, `title="Atualizar listagem"`), igual Reservas.
  - Tabela: **`PageSection className="flex flex-1 min-h-0 flex-col pt-0"`** envolvendo **`DataTable`** **ou** lista custom dentro de um único bloco scrollável — importante **`min-h-0`** para o scroll não quebrar o shell.
  - Cada alteração de URL / filtro / página deve **disparar o mesmo `fetch` que popula a lista** (evitar só `router.push` sem recarregar dados).
  - Formulários multietapa do painel continuam espelhando **`ReservaForm`** / **`LocacaoForm`** (já documentado na skill `frontend-dashboard-design`).
- **Verificação:** Comparar nova listagem lado a lado com Reservas; `npx eslint src/app/dashboard/<modulo>/page.tsx`. Nesta data foram realinhadas ao molde: **`visitantes/page.tsx`**, **`visitas/page.tsx`** (inclui chamadas a `fetchVisitas` em busca/filtro/página), **`chaves/page.tsx`**, toolbar de **`proprietarios/page.tsx`** (e correção de busca/paginação com `fetchProprietarios`).

### 2026-04-29 — Dashboard imóveis: status no formulário alinhado ao `StatusDropdown` da Reserva

- **Contexto:** Next.js cabeçalhos `frontend/src/app/dashboard/imoveis/novo/page.tsx`, `imoveis/[id]/editar/page.tsx`, `components/imoveis/NovoImovelModal.tsx`; `ImovelStatusPicker`; nova `lib/imovelStatusChoices.ts`.
- **Sintoma:** Grid de botões + select “Demais status…” diferia do padrão da edição de reserva (`ReservaForm`: `StatusDropdown` compacto nas ações).
- **Correção / regra prática:** `ImovelStatusPicker` passa a usar **`StatusDropdown`** com **`IMOVEL_STATUS_CONFIG`** e **`compact`** no header como na reserva; opções em **`imovelStatusDropdownOptions('novo' | 'editar')`** — em **`novo`** omitir **`pendente`** (comportamento anterior). **`imovelStatusLabel`** definido na lib e re-exportado pelo picker.
- **Verificação:** `npx eslint src/lib/imovelStatusChoices.ts src/components/imoveis/ImovelStatusPicker.tsx`

### 2026-04-29 — Dashboard Locação: garantia fixa em seguro fiança

- **Contexto:** Next.js `frontend/src/components/forms/LocacaoForm.tsx` (nova locação e edição).
- **Sintoma:** Operador podia escolher tipo de garantia (nenhuma, caução, título); produto passou a usar **sempre seguro fiança**.
- **Correção / regra prática:** Defaults **`tipo_garantia: 'seguro_fianca'`**, **`possui_seguro_fianca: true`**, **`possui_caucao: false`**; **`aplicarGarantiaSeguroFianca()`** ao carregar **`initialData`**, ao escolher imóvel (e ao limpar imóvel), e antes de **`onSubmit`** (`handleFormSubmit` / **`handleSaveInEditMode`**). UI: cartão informativo em vez do grid de opções; removido campo **Valor Caução** no passo Valores.
- **Verificação:** `npx eslint src/components/forms/LocacaoForm.tsx` (avisos pré-existentes podem permanecer).

### 2026-04-29 — Dashboard Locação: observação do histórico junto ao status

- **Contexto:** `frontend/src/components/forms/LocacaoForm.tsx` — campo **`descricao_mudanca`** (PUT locação).
- **Sintoma:** Textarea “Observação no histórico…” numa faixa entre cabeçalho e formulário parecia ligada ao passo **Observações** ou ficava semanticamente longe do **status**.
- **Correção / regra prática:** Remover **`statusHistoricoBanner`**; renderizar label + textarea **no mesmo bloco das ações do topo**, logo abaixo do **`StatusDropdown`**, ao lado de Histórico/Salvar (`headerActions`). Label curta **“Observação no histórico (opcional)”** + placeholder que menciona mudança de status.
- **Verificação:** Fluxo edição `/dashboard/locacoes/[id]/editar` — campo só na edição (`locacaoId`), não na faixa cinza entre steps.

### 2026-04-29 — Dashboard Locação: observação do histórico dentro do passo Observações

- **Contexto:** `LocacaoForm.tsx` — **`descricao_mudanca`** não deve ficar no cabeçalho nem na faixa acima do formulário.
- **Sintoma:** Campo acoplado ao **`StatusDropdown`** no **`PageHeader`** polui ações e não é “dentro” do formulário.
- **Correção / regra prática:** Cabeçalho volta a ter só status + histórico + salvar; textarea no **passo “Observações”** (edição apenas), **primeiro bloco** num cartão **“Nota para o histórico da locação”**, texto explicando vínculo com mudança de status + salvar, antes de observações gerais/cláusulas.
- **Verificação:** Editar locação → etapa Observações → bloco cinza no topo do step.

### 2026-05-04 — Telegram: ParametroEmpresa + lib + API pública sem segredos

- **Contexto:** Django `ParametroEmpresa`, `ninhohouse/ninhohouse/libs/telegram.py`, serializer, `view_parametro_empresa` PUT, dashboard **Configurações → Tokens**.
- **Sintoma:** (feature) alertas via Telegram.
- **Correção / regra prática:** Campos na empresa: **`telegram_bot_token`**, **`telegram_chat_id`** apenas. Lib: **`enviar_mensagem_telegram`** / **`enviar_mensagem_telegram_empresa`**. API pública: **`context['public']=True`** → não serializa token nem chat. Migração **`0102_parametroempresa_telegram`** (+ **`0103`** removeu tópico da empresa; ver entrada seguinte).
- **Verificação:** `python3 -m py_compile …/telegram.py …/models.py`; `migrate`.

### 2026-05-04 — Telegram: tópico de fórum só no código (sem campo na empresa)

- **Contexto:** Vários `message_thread_id` por funcionalidade no mesmo supergrupo.
- **Sintoma:** Campo único na empresa não cobre vários fios; operador não precisa configurar tópico no painel.
- **Correção / regra prática:** Remover **`telegram_message_thread_id`** de `ParametroEmpresa`; migração **`0103_remove_…`**. **`enviar_mensagem_telegram_empresa(text, message_thread_id=…)`** só envia tópico quando o chamador passa o ID; senão vai ao chat principal. Token + chat continuam na empresa.
- **Verificação:** `migrate`; usos da lib passam `message_thread_id` por fluxo quando necessário.

### 2026-05-04 — Mobile cadastro: Telegram tópico 4 (nova conta + ativada)

- **Contexto:** `app/view_mobile/view_auth.py` (`CriarContaMobileView`, `VerificarCodigoMobileView`); `ninhohouse.libs.telegram` (`TELEGRAM_MESSAGE_THREAD_CONTAS_APP = 4`).
- **Sintoma:** Operador quer ver criação de conta (perfil ativo / objetivo) e confirmação quando o e-mail foi verificado.
- **Correção / regra prática:** Thread em background chama **`notificar_telegram_cadastro_conta_mobile`** após criar conta (estado “aguardando ativação”) e **`notificar_telegram_conta_ativada_mobile`** após código OK (`is_active` + perfil verificado). Ambos usam **`message_thread_id=4`** via constante. Falha do Telegram só loga; não quebra API.
- **Verificação:** `python3 -m py_compile …/view_auth.py …/telegram.py`; fluxo criar conta → verificar código e conferir duas mensagens no fio 4.

### 2026-05-04 — Mobile remoção de conta: Telegram fio 9

- **Contexto:** `app/view_mobile/view_remocao_conta.py` após `SolicitacaoRemocaoConta.objects.create`; `telegram.TELEGRAM_MESSAGE_THREAD_REMOCAO_CONTA_APP = 9`.
- **Correção / regra prática:** Thread chama **`notificar_telegram_solicitacao_remocao_conta_mobile`** (código da solicitação, user id, e-mail, nome, perfil ativo, motivo). **`message_thread_id=9`** (inteiro na API). Falha só em log.
- **Verificação:** `python3 -m py_compile …/view_remocao_conta.py …/telegram.py`; POST solicitar remoção e conferir mensagem no tópico 9.

### 2026-05-04 — Mobile novo imóvel (proprietário): Telegram fio 12

- **Contexto:** `app/view_mobile/imovel/cadastro.py` após `notificar_cadastro_imovel_app_pendente`; `telegram.TELEGRAM_MESSAGE_THREAD_NOVO_IMOVEL_APP = 12`.
- **Correção / regra prática:** Thread chama **`notificar_telegram_novo_imovel_cadastro_app`** (código/nome/status/cidade do imóvel + dados do user proprietário). Só quando **`cadastro_proprietario`** e **`ProprietarioImovel`** estão preenchidos (fluxo app).
- **Verificação:** `python3 -m py_compile …/cadastro.py …/telegram.py`; cadastrar imóvel pelo app e conferir tópico 12.

### 2026-05-04 — Mobile nova visita: Telegram fio 17

- **Contexto:** `app/view_mobile/view_agendamento.py` (`AgendarVisitaImovelMobileView` após `notificar_visita_solicitada`); `telegram.TELEGRAM_MESSAGE_THREAD_NOVA_VISITA_APP = 17`.
- **Correção / regra prática:** Thread chama **`notificar_telegram_nova_visita_solicitada_app`** (código agendamento, data/hora, imóvel, visitante, perfil ativo, mensagem). **`message_thread_id=17`**.
- **Verificação:** `python3 -m py_compile …/view_agendamento.py …/telegram.py`; solicitar visita pelo app e conferir tópico 17.

### 2026-05-04 — Mobile nova reserva: Telegram fio 18

- **Contexto:** `app/view_mobile/view_reserva.py` (`MinhasReservasMobileView.post` após `notificar_reserva_criada`); `telegram.TELEGRAM_MESSAGE_THREAD_NOVA_RESERVA_APP = 18`.
- **Correção / regra prática:** Thread chama **`notificar_telegram_nova_reserva_app`** (código, identificador, status, datas, valor, imóvel, hóspede, perfil ativo, origem). **`message_thread_id=18`**.
- **Verificação:** `python3 -m py_compile …/view_reserva.py …/telegram.py`; criar reserva pelo app e conferir tópico 18.

### 2026-05-04 — Webpage: logo some em produção (ok no local)

- **Contexto:** Next.js `webpage/` — `Header`, `Footer`, `SitePublicGate` com `next/image` e `logoSrcOrDefault` / `resolveBackendMediaUrl` (`src/lib/utils.ts`).
- **Sintoma:** Logo não aparece no deploy; local funciona.
- **Causa:** Combinação provável: (1) `next/image` com SVG/default público ou host remoto e otimizador `/_next/image`; (2) em Docker/produção, `NEXT_PUBLIC_API_URL` ou resposta da API com host **privado/loopback** gera `src` que o navegador não consegue carregar (ex.: `http://servico-interno:8005/media/...`).
- **Correção / regra prática:** Logos da marca: **`unoptimized`** no `<Image>` (caminho direto, sem otimizador). Em **`resolveBackendMediaUrl`**, em `NODE_ENV === 'production'`, se o origin da API ou URL absoluta for loopback/rede privada, montar mídia em **`https://api.ninhohouse.com.br`** + pathname (fallback explícito do produto). Manter dev sem reescrita.
- **Verificação:** `npm run build` em `ninhohouse/webpage/`; inspecionar `src` da logo no HTML em produção.

### 2026-05-04 — Webpage detalhe imóvel: locação sem “mensal” nem “/mês”

- **Contexto:** `webpage/src/app/imoveis/[id]/page.tsx` (card lateral + `getPrice`); badge de preço em `ImageGallery.tsx`.
- **Correção / regra prática:** Para **`price.type === 'locacao'`**: título **“Aluguel”** (não “Aluguel Mensal”); valor principal **sem** sufixo `/mês`; condomínio **sem** `/mês`. Venda mantém `/mês` no condomínio. Só renderizar `price.label` quando não vazio (evitar espaço no badge da galeria).
- **Verificação:** `npm run build` em `webpage/`; abrir imóvel só locação e conferir card + overlay da galeria.

### 2026-05-04 — Webpage detalhe imóvel: galeria alinhada ao corpo + hero grid

- **Contexto:** `webpage/src/components/properties/ImageGallery.tsx`; detalhe `imoveis/[id]/page.tsx` passa `referenciaCodigo={imovel.codigo}`.
- **Correção / regra prática:** Galeria dentro de **`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`** (igual ao conteúdo) + `pt-28`. **≥5 fotos:** meia largura foto principal + meia com grelha 2×2, última célula com blur e **“Ver todas”** (abre lightbox). **4 fotos:** 2×2 com terceira fila **col-span-2** para a 4.ª imagem (sem repetir miniatura). **3 / 2 / 1:** layouts compactos. Badges **Ref:** e **N Fotos** na principal; ações (coração/partilhar) **canto inferior direito**; preço opcional inferior esquerdo. Lightbox mantém setas e fila de miniaturas.
- **Verificação:** `npm run build` em `webpage/`; testar imóvel com 1, 2, 3, 4 e ≥5 imagens.

### 2026-05-04 — Webpage: header legível fora da home + breadcrumb no detalhe do imóvel

- **Contexto:** `webpage/src/components/layout/Header.tsx` (transparente + texto branco pensado para hero da `/`); `webpage/src/app/imoveis/[id]/page.tsx`; `ImageGallery` sem `pt-` no topo.
- **Sintoma:** Em páginas claras (ex. detalhe do imóvel), links do header pareciam “sumidos”; botão fixo **Voltar** desalinhado.
- **Correção / regra prática:** **`usePathname`**: `solidNav = pathname !== '/' || isScrolled` — fundo branco e texto escuro em **todas as rotas exceto a home no topo da página**; `useEffect(..., [pathname])` chama `handleScroll()` ao mudar de rota. Detalhe do imóvel: **remover** Voltar fixo; **breadcrumb** (`Início` → `Imóveis` → nome) no mesmo `max-w-7xl` com **`pt-24 lg:pt-28`**; galeria só **`pb-6`** (sem `pt-28` duplicado).
- **Verificação:** `npm run build` em `webpage/`; abrir `/` (header transparente) e `/imoveis/[id]` (breadcrumb + header legível).

### 2026-05-04 — Webpage: `gerenciado_direto_proprietario` alinhado ao mobile

- **Contexto:** API pública `ImovelPublicoSerializerModel` (`gerenciado_direto_proprietario`, `proprietario_nome`, `proprietario_foto`); app mobile `detalhe_imovel_body.dart` (secções **Direto com o proprietário** vs **Tem interesse?**).
- **Correção / regra prática:** Tipos `Imovel` em `webpage/src/types/index.ts` com esses campos. Detalhe `imoveis/[id]/page.tsx`: secção principal espelha textos do mobile; CTAs para **`/app`** (chat não existe no site). Sidebar: se **gestão direta**, aviso âmbar + rodapé do card a apontar para app (sem telefone genérico da equipe); se **Não**, `empresaService.getParametros()` para **Fale conosco** com `tel:` real. Listagem: chip **“Com proprietário”** em `PropertyCard.tsx` quando `gerenciado_direto_proprietario === true`.
- **Verificação:** `npm run build` em `webpage/`; comparar imóvel com flag true/false na API.

### 2026-05-04 — Webpage detalhe: mesmo edifício + relacionados

- **Contexto:** `webpage/src/app/imoveis/[id]/page.tsx`; `webpage/src/lib/imovelService.ts`; Django `ImovelPublicoSerializerModel` + `ImovelRelacionadosView` (`view_mobile/imovel/publico.py`).
- **Correção / regra prática:** Serializer público inclui **`edificio`** (`codigo`, `nome`, `edificio_id`). **`GET …/imovel/<pk>/relacionados/?mesmo_edificio=1`** devolve só unidades do mesmo **`Edificio_id`** (exclui o próprio). Front: `getRelacionados(id, { limit, mesmoEdificio: true })` em paralelo com relacionados geral; **deduplicar** códigos na lista “relacionados”. Secções com scroll horizontal e `PropertyCard` **`compact`**. Tipo `ImovelEdificioResumo` + `Imovel.edificio` no TS.
- **Verificação:** `python3 -m py_compile …/serializers.py …/publico.py`; `npm run build` em `webpage/`; imóvel com e sem `Edificio`.

### 2026-05-04 — Site público e API mobile: detalhe/relacionados por `identificador` na URL

- **Contexto:** `urls_mobile.py` (`imovel/<str:ref>/`, `…/relacionados/`); `view_mobile/imovel/publico.py` (`get_imovel_publico_por_ref`); webpage `src/app/imoveis/[ref]/page.tsx`; `imovelService.ts` (`imovelApiRef`, `imovelPublicUrlRef`, `getById`/`getRelacionados` com segmento codificado); links em `PropertyCard.tsx` / `PropertyMap.tsx`.
- **Correção / regra prática:** Resolver **`ref`** por `identificador__iexact` primeiro; se `ref.isdigit()`, fallback **`pk`** (links antigos com código). Front: rota Next **`/imoveis/[ref]`**; listagens usam **`imovelPublicUrlRef`** no `href`; chamadas API usam valor bruto **`imovelApiRef(imovel)`** + `encodeURIComponent` só dentro do serviço (evitar dupla codificação). `decodeURIComponent` no segmento da página antes do `getById`.
- **Verificação:** `GET /api/mobile/imovel/NH0001/` e `…/42/`; `npm run build` em `webpage/` quando o ambiente estiver ok.

### 2026-05-04 — Links oficiais App Store e Google Play

- **Contexto:** Site `webpage` (`src/lib/appLinks.ts`, footer, `/app`, secção download); e-mails Django (`ninhohouse/libs/email_templates.py` placeholders `APPSTORE_LINK` / `PLAYSTORE_LINK`).
- **Correção / regra prática:** URLs canónicas: **Play** `https://play.google.com/store/apps/details?id=com.app.ninhohouse`; **App Store** `https://apps.apple.com/us/app/ninhohouse/id6761779667`. No Next, defaults em `appLinks.ts`; `NEXT_PUBLIC_*` continua a poder substituir. Nos e-mails, defaults no `DEFAULT_PLACEHOLDERS` em vez de `#`.
- **Verificação:** Abrir `/app` e links do footer sem `.env`; HTML de e-mail com placeholders substituídos.

### 2026-05-04 — Webpage: detalhe por identificador com API antiga (só `<int:pk>`)

- **Contexto:** `webpage/src/lib/imovelService.ts` — produção ainda sem rota `imovel/<str:ref>/`; `GET …/imovel/NH0001/` → **404**.
- **Correção / regra prática:** Em **404** com ref **não só dígitos**: `GET /imovel/?search=…&limit=40&page=1`, escolher item com `identificador` **igual** (case-insensitive), depois `GET /imovel/<codigo>/` (e o mesmo fallback em **relacionados**). Ref numérica mantém 404 real.
- **Verificação:** Detalhe `/imoveis/NH0001` contra API só com `<int:pk>`; após deploy do `str:ref`, o primeiro `GET` já funciona (fallback não dispara).

### 2026-05-04 — Next.js 15 build: `useSearchParams` sem Suspense

- **Contexto:** `frontend/src/app/dashboard/mensagens/page.tsx` — `npm run build` / prerender de `/dashboard/mensagens`.
- **Sintoma:** `useSearchParams() should be wrapped in a suspense boundary`; worker exit 1.
- **Correção / regra prática:** Export default da página: `<Suspense fallback={…}><ComponenteQueUsaUseSearchParams /></Suspense>`. Tipagem: `searchParams?.get(...)` se o hook puder ser `null`.
- **Verificação:** `npm run build` em `ninhohouse/frontend/`.

### 2026-05-04 — Mobile proprietário: aceitar reserva e gerar cobrança (403 no `/dash`)

- **Contexto:** `gerenciar_reserva_proprietario_screen.dart` chama `apiDashAuthServices` (`pagamento-sugestao/`, `POST pagamento/`, `gerar-cobranca/`). Views em `view_dash/view_pagamentos.py` usavam só `CustomDjangoModelPermissions` (ex.: `app.view_pagamentos`).
- **Sintoma:** Proprietário comum (app) sem permissão Django em Pagamentos recebia **403**; fluxo “Aceitar e liberar pagamento” falhava logo na sugestão ou na criação da cobrança.
- **Correção / regra prática:** `app/helpers/permission_pagamento_proprietario_reserva.py` — `DashPagamentoOuProprietarioReservaPermission`: mantém utilizadores com permissões do painel; para **reserva** permite GET sugestão (`reserva_id`), GET lista/detalhe pagamento (`reserva_id` ou `pk` do pagamento ligado à reserva), POST pagamento (body com `Reserva` da qual o utilizador é proprietário), POST gerar cobrança (pagamento com `Reserva` sua). No app, após `aceitar`, `refreshDetail` explícito antes do gate `aguardando_pagamento`; `status` no `ReservaModel.fromJson` normalizado com `?.toString().trim()`. **UX:** `proprietarioAcao` liberta `reservaProprietarioFormProvider` antes de `list()` (lista em `unawaited`) para não deixar botões presos em loading; fluxo de aceite com `_fluxoAceiteCobrancaBusy` + `useRootNavigator: true` nos diálogos; `onAceitar` como `Future` com tratamento de erro no `GerenciarReservaDecisaoStep`.
- **Verificação:** `python3 -m py_compile …/permission_pagamento_proprietario_reserva.py …/view_pagamentos.py`; `dart analyze` nos ficheiros alterados; aceitar reserva pelo app como proprietário e confirmar cobrança gerada.

### 2026-05-05 — Mobile: temporada, Taxa NinhoHouse prévia e antecedência (paths + APIs)

- **Contexto:** Flutter em `ninhohouse/ninhohouse/mobile/lib/`; cadastro só temporada; calendário de solicitar reserva; backend `ParametroEmpresa` + estimativa de taxas.
- **Correção / regra prática:** O Dart do app não fica em `ninhohouse/mobile` na raiz do clone — usar `ninhohouse/ninhohouse/mobile`. Antecedência mínima vem de `GET /mobile/parametro-empresa/` (`reserva_temporada_antecedencia_minima_dias`) e é reforçada no `POST /mobile/minhas-reservas/` (`code: reserva_antecedencia_minima`). Prévia no cadastro: `GET /mobile/estimativa-taxas-reserva/?valor_total=&repassar_taxa_servico_inquilino=` (autenticado); resposta usa `metodos` (PIX, Boleto, CC 1x) e `mostrar_taxa_ninhohouse`. Imóvel existente continua com `GET /mobile/imovel/<pk>/estimativa-taxas-reserva/`.
- **Verificação:** `dart analyze` nos ficheiros tocados; `python manage.py test app.tests_taxas` (ambiente com deps Django).

### 2026-05-08 — Taxas repasse: percentual NH = 0

- **Contexto:** `app/helpers/taxas_repasse_fixo_plataforma.py` (`taxa_ninhohouse_percent_empresa`), testes com `_empresa('0')`.
- **Sintoma:** `getattr(..., None) or 5` trata `Decimal('0')` como falsy e devolve **5%**, quebrando gross-up e cenários sem comissão.
- **Correção / regra prática:** Para percentuais vindos do modelo, não usar `or default` sobre `Decimal`; só substituir quando o valor for `None`.
- **Verificação:** `pytest app.tests_taxas`; mock de `resolver_linha_taxa` nos testes de `calcular_resumo`: patch em `app.helpers.taxas_repasse_fixo_plataforma.resolver_linha_taxa`.

### 2026-05-12 — Mobile: cadastro imóvel novo sem gate de conta de recebimentos (temporário)

- **Contexto:** Flutter `navegarParaCadastroImovelNovo` (`subconta_publicar_imovel_nav.dart`) e `_substituirPorFluxoSubcontaSeNecessario` (`cadastro_imovel_screen.dart`); flag `lib/src/config/mobile_feature_flags.dart`.
- **Sintoma:** Utilizador era enviado à tela Asaas/subconta antes de abrir cadastro de imóvel novo se a subconta não estivesse aprovada.
- **Correção / regra prática:** Gate controlado por **`exigeSubcontaAsaasAprovadaParaCadastroImovelNovo`** (hoje `false`). Para voltar a obrigar recebimentos aprovados antes de anunciar/cadastrar novo imóvel no app: pôr a constante a **`true`** e validar fluxo FAB + empty state + deep link `/cadastro-imovel`.
- **Verificação:** `dart analyze lib/src/config/mobile_feature_flags.dart lib/src/app/perfil/utils/subconta_publicar_imovel_nav.dart lib/src/app/proprietario/imoveis/screens/cadastro_imovel_screen.dart`

### 2026-05-12 — API mobile cadastro imóvel: gate Asaas no POST (desligado por predefinição)

- **Contexto:** Django `app/view_mobile/imovel/cadastro.py` (`ImovelCadastroView.post`); `ninhohouse/settings.py`.
- **Sintoma:** Ao salvar novo imóvel pelo app, **403** com `asaas_subconta_nao_aprovada` se `perfil_elegivel_asaas_subconta` e status ≠ `aprovada`.
- **Correção / regra prática:** Gate condicionado a **`EXIGE_ASAAS_APROVADA_CADASTRO_IMOVEL_MOBILE`** (lido de env; predefinição **desligada**). Para reativar em deploy: `EXIGE_ASAAS_APROVADA_CADASTRO_IMOVEL_MOBILE=1` (ou `true`). Alinhar com Flutter `exigeSubcontaAsaasAprovadaParaCadastroImovelNovo` em `mobile_feature_flags.dart` quando voltar a política completa.
- **Verificação:** `python3 -m py_compile ninhohouse/app/view_mobile/imovel/cadastro.py ninhohouse/ninhohouse/settings.py`

### 2026-05-12 — Gate Asaas cadastro imóvel app: ParametroEmpresa + dashboard (substitui flags/env)

- **Contexto:** Django `ParametroEmpresa.exige_asaas_aprovada_cadastro_imovel_app` (migração `0106_*`); `ImovelCadastroView.post`; `view_parametro_empresa` PUT; Flutter `parametro_empresa_public_provider` + `subconta_publicar_imovel_nav` + `cadastro_imovel_screen`; Next `configuracoes/page.tsx` (tab App e filtros).
- **Correção / regra prática:** A política fica na **primeira** `ParametroEmpresa` (default `false` na migração). Com **`true`**, POST mobile cadastro imóvel mantém 403 `asaas_subconta_nao_aprovada` para elegíveis sem `aprovada`; o app lê o mesmo campo em `GET …/parametro-empresa/`. Removidos gate por constante Dart e `EXIGE_ASAAS_*` em `settings.py`. Após alterar no painel, o app pode precisar de **reabrir** sessão para o `FutureProvider` voltar a buscar.
- **Verificação:** `python manage.py migrate`; `dart analyze` nos Dart tocados; `npx eslint` na página de configurações (avisos legados possíveis).

### 2026-05-15 — Webpage: fotos de imóvel (capa/galeria) não apareciam

- **Contexto:** Next.js `ninhohouse/webpage` — `next/image`, API `GET …/mobile/imovel/` (`ImovelPublicoSerializerModel`).
- **Sintoma:** Cards e detalhe sem imagem ou “Sem imagem”, embora a API devolvesse `foto_capa` / `fotos`.
- **Causa:** (1) `remotePatterns` só tinha `s3.us-east-005.backblazeb2.com`; URLs B2 em estilo virtual-hosted usam subdomínio tipo `bucket.s3.….backblazeb2.com`, bloqueadas pelo otimizador. (2) Detalhe passava `imovel.imagens` à galeria; o serializer público expõe **`fotos`** com `url`, não `imagens`.
- **Correção / regra prática:** Incluir `hostname: '**.backblazeb2.com'` (https) em `webpage/next.config.ts`. Mapear `fotos` → formato esperado pela galeria (`imovelGalleryImagesForWeb` em `imovelService.ts`). Opcional: `resolveBackendMediaUrl` nos `src` de mídia relativa / API em Docker.
- **Verificação:** `npm run build` em `ninhohouse/webpage/` (valida `next.config`); smoke na listagem e `/imoveis/[ref]`.

### 2026-05-15 — Mobile: troca inquilino → proprietário pedia “completar cadastro” de novo

- **Contexto:** `BaseDash` + `PerfilEdicaoObrigatoria.deveForcarCompletar`; POST `mobile/trocar-perfil/` (`TrocarPerfilMobileView`).
- **Sintoma:** Após já ter concluído dados e ativado proprietário, ao voltar a locatário e de novo a proprietário o app redirecionava para “Complete seu cadastro” (`EditarPerfilScreen` com `forceCompleto`).
- **Causa:** Regra no Flutter **não** respeitava `perfil_completo` nem o mesmo critério de `listar_requisitos_ativar_proprietario` (ex.: `perfil_completo` desatualizado no servidor após troca de perfil sem `recalcular_perfil_completo`).
- **Correção / regra prática:** Em `perfil_edicao_obrigatoria.dart`, não forçar se `perfilCompleto` **ou** (proprietário no grupo e `listarRequisitosAtivarProprietario` vazio). No Django, após `perfil_ativo = tipo_perfil`, chamar **`recalcular_perfil_completo(perfil_db)`** antes do `save()` em `TrocarPerfilMobileView`.
- **Verificação:** `dart analyze lib/src/app/perfil/helpers/perfil_edicao_obrigatoria.dart`; `python3 -m py_compile …/view_mobile/view_perfil.py`; fluxo manual locatário ↔ proprietário.

### 2026-05-15 — Mobile: cadastro de imóvel — documentação (prefeitura + matrícula)

- **Contexto:** Flutter `step_basico.dart`, `cadastro_imovel_screen.dart` (`_coletarDadosImovel`), `ImovelModel`; API `ImovelSerializerModel` / modelo `Imovel.registroprefeitura`, `Imovel.matricula`.
- **Sintoma:** App enviava `registroprefeitura` e `matricula` sempre `null` no payload; utilizador não preenchia documentação do imóvel no fluxo.
- **Correção / regra prática:** Secção “Documentação do imóvel” no 1.º passo com campos obrigatórios (limites 200 / 70 caracteres alinhados ao Django); preencher no modo edição a partir do JSON; enviar `registroprefeitura` e `matricula` no mapa do cadastro/PUT. **API:** incluir os dois campos em `ImovelPublicoSerializerModel.fields`; em `MeuImovelDetailMobileView.put` persistir `registroprefeitura`/`matricula`; duplicar imóvel copia os mesmos campos.
- **Verificação:** `dart analyze` nos três ficheiros Dart tocados; `python3 -m py_compile` em `serializers.py` e `proprietario.py`; POST/PUT imóvel com payload preenchido.

### 2026-05-15 — Next.js (webpage + frontend): `npm audit`, axios e PostCSS aninhado

- **Contexto:** `ninhohouse/webpage/package.json` + `package-lock.json`; `ninhohouse/frontend/package.json` + lockfile.
- **Sintoma:** `npm audit` com **high** em axios e Next; **moderate** em postcss; `npm audit fix --force` sugeria **rebaixar** Next (quebrar app) só para satisfazer audit.
- **Causa:** Next declara dependência direta `postcss@8.4.31` (abaixo de 8.5.10 do advisory GHSA-qx2v-qp2m-jg93); axios anterior a 1.16 com vários GHSA; frontend em Next 15.5.12 abaixo do intervalo corrigido na linha 15.5.x.
- **Correção / regra prática:** **Nunca** usar `audit fix --force` cegamente se propor downgrade major. Usar **`overrides`** no `package.json` raiz do pacote: `"overrides": { "postcss": "8.5.14" }` para forçar PostCSS seguro em toda a árvore (compatível com Next). Subir **axios** a `^1.16.1`; **webpage** Next `^16.2.6` + `eslint-config-next` alinhado; **frontend** Next **`15.5.18`** + `eslint-config-next` igual. Manter **`package-lock.json` no git**; correr `npm audit` após `npm install` em CI ou antes de release. Reduz risco explorável por pentesters em cadeias conhecidas (não substitui revisão de código nem CSP).
- **Verificação:** `npm audit` (0 vulnerabilidades) em `webpage/` e `frontend/`; `npm run build` em ambos.

### 2026-05-15 — Backup dashboard: pg_dump vs servidor PostgreSQL (mismatch de versão)

- **Contexto:** Dashboard Configurações → gerar backup ZIP; Django `app/view_dash/view_backup.py` (`subprocess` + `pg_dump`); imagem `docker/backend/Dockerfile` (Debian bookworm).
- **Sintoma:** `Erro ao gerar dump do banco: pg_dump: error: aborting because of server version mismatch` (servidor 18.x, `pg_dump` 15.x).
- **Causa:** O **major** do cliente `pg_dump` tem de ser **≥** ao do servidor; `postgresql-client` do Bookworm traz pg_dump 15.
- **Correção / regra prática:** No container/host do Django, instalar **`postgresql-client-18`** (repositório PGDG em bookworm) ou binário da mesma major do servidor. Override opcional: env **`PG_DUMP_BIN`** (caminho absoluto, ex. `/usr/lib/postgresql/18/bin/pg_dump`). Rebuild da imagem backend após alterar Dockerfile.
- **Verificação:** `pg_dump --version` no mesmo ambiente que roda o Gunicorn/uWSGI; gerar backup na UI; `python3 -m py_compile …/view_backup.py`.

### 2026-05-19 — Dashboard imóveis: upload de fotos duplicava imagens

- **Contexto:** Next.js cadastro (`imoveis/novo/page.tsx`) e edição (`ImovelFotosManager`); API `POST /imagens-imovel/<imovel>/`; Django `view_imovel_imagens.py`.
- **Sintoma:** Ao selecionar várias fotos, a galeria mostrava a mesma imagem repetida ou entradas duplicadas em vez de uma foto nova por arquivo.
- **Causa:** (1) `Content-Type: multipart/form-data` **sem boundary** no `api.post` (o interceptor do axios só remove o header padrão JSON se não for sobrescrito na chamada). (2) `onChange` do `<input type="file">` sem `input.value = ''` e sem trava de upload concorrente. (3) Backend gravava com `arq.name` — nomes iguais (ex. `IMG_1234.jpg`) sobrescreviam o mesmo path no S3.
- **Correção / regra prática:** Centralizar em `frontend/src/lib/imovelImageUpload.ts`: `dedupeImageFiles`, `uploadImovelImages` (um arquivo por POST, **sem** header `Content-Type` manual). No input: limpar valor após seleção; `uploadInProgressRef` no manager. No Django: nome único com `Util.generateCode()` + extensão; `capa` só no primeiro arquivo do lote; `ordem` incrementada quando vários `files` no mesmo POST.
- **Verificação:** Selecionar 3 fotos distintas no cadastro e na edição; conferir 3 URLs diferentes na galeria; `npx eslint src/lib/imovelImageUpload.ts src/components/imoveis/ImovelFotosManager.tsx`.

### 2026-05-19 — Webpage produção: fotos de imóveis não carregavam (B2 + next/image)

- **Contexto:** Site `ninhohouse/webpage` em produção; API `GET …/mobile/imovel/` devolve `foto_capa` / `fotos[].url` como URLs pré-assinadas `https://s3.us-east-005.backblazeb2.com/ninhohouse-prod/...?X-Amz-...`.
- **Sintoma:** Listagem e detalhe sem imagem (“Sem imagem”), embora a API retorne URLs válidas (GET direto no browser → 200).
- **Causa:** `next/image` passa pelo otimizador `/_next/image`, que falha com URLs B2 assinadas (ex.: HEAD 403, URL muito longa). Mesma classe de problema já corrigida para logos (`unoptimized`).
- **Correção / regra prática:** Componente **`PropertyImage`** (`unoptimized` sempre) em `ImageGallery` e `PropertyCard`. Manter `remotePatterns` com `s3.us-east-005.backblazeb2.com` em `next.config.ts` como fallback. `imovelGalleryImagesForWeb` aplica `resolveBackendMediaUrl` em cada `foto.url`. **Rebuild/deploy** da imagem Docker `webpage` após alteração.
- **Verificação:** `npm run build` em `webpage/`; em produção, inspecionar `src` da foto — deve ser URL B2 direta, não `/_next/image?url=...`.

### 2026-05-21 — Termos plataforma: DOCX + selfie + PDF assinado (app + dash)

- **Contexto:** Django `ModelosDocumentos` + `AceiteTermoPlataforma`; mobile `termos_plataforma/`; dashboard Configurações → Modelos; gates em `imovel/cadastro.py` e `view_reserva.py` POST.
- **Regra prática:** Dois modelos DOCX em Configurações com flags **`termo_proprietario`** / **`termo_hospede`** (um ativo por tipo; upload desativa o anterior). Placeholders Jinja: ver `extras/docs/termos-plataforma-variaveis-docx.md`. App: GET `/mobile/termo-plataforma/<tipo>/` → `pdf_previa_url`; POST `/aceitar/` com selfie frontal → gera `documento_assinado_pdf`. Prévia/assinado exigem **`soffice`** no servidor (igual contratos). Flutter: `pdfx` + `TermoAceiteScreen`; `navegarAceiteTermoSeNecessario` antes de cadastro imóvel (`proprietario`) e solicitar reserva (`hospede`). API 403 `termo_nao_aceito` se gate sem aceite da versão ativa.
- **Verificação:** `python manage.py check`; `dart analyze lib/src/app/termos_plataforma`; Postman `extras/postmans/postman_termo_plataforma.json`.

### 2026-05-21 — Dash termo-plataforma/aceites: filtro ORM por flag

- **Contexto:** `view_dash/view_termo_plataforma.py` — listagem quando não há modelo ativo.
- **Sintoma:** `NameError: name 'ModeloDocumentos__' is not defined` em `qs.filter(ModeloDocumentos__**{flag: True})`.
- **Correção / regra prática:** Lookup dinâmico no Django: `qs.filter(**{'ModeloDocumentos__%s' % flag: True})` com `flag` ∈ `termo_proprietario` | `termo_hospede`.
- **Verificação:** `GET /dash/termo-plataforma/aceites/?tipo=proprietario` → 200.

### 2026-05-21 — Mobile: termo proprietário ao abrir cadastro de imóvel

- **Contexto:** Flutter `navegarParaCadastroImovelNovo`, `cadastro_imovel_screen`, `termo_plataforma_nav`.
- **Sintoma:** Após upload do DOCX no painel, ao tocar em **Cadastrar imóvel** o app abria o wizard sem pedir aceite do termo.
- **Causa:** `navegarAceiteTermoSeNecessario` só rodava em `_finalizarCadastro` (último passo); entrada via FAB/lista ia direto para `CadastroImovelScreen`. Se `GET /termo-plataforma/proprietario/` falhava (modelo sem flag `termo_proprietario` ou inativo), `meta == null` abria a tela de aceite e fechava em seguida sem mensagem clara na navegação.
- **Correção / regra prática:** Exigir termo em `navegarParaCadastroImovelNovo` / `_abrirCadastroImovelNovoComTermo` **antes** do `push` do cadastro; repetir no `initState` do cadastro novo (deep link); `AsaasSubcontaScreen._continuarCadastro` → `navegarParaCadastroImovelNovo`. Em `navegarAceiteTermoSeNecessario`, se `meta == null`, snackbar com erro da API e `return false`. No dashboard, marcar **Termo proprietário** no upload do DOCX.
- **Verificação:** `dart analyze lib/src/app/perfil/utils/subconta_publicar_imovel_nav.dart lib/src/app/termos_plataforma/utils/termo_plataforma_nav.dart`; fluxo: Meus imóveis → Cadastrar → tela de termo antes do wizard.

### 2026-05-21 — Aceite termo: upload selfie sem path_to_upload

- **Contexto:** Django `AceiteTermoPlataforma`; `upload_path` global em `models.py`; POST `TermoPlataformaMobileView`.
- **Sintoma:** `AttributeError: 'AceiteTermoPlataforma' object has no attribute 'path_to_upload'` ao `aceite.selfie.save(...)`.
- **Causa:** FileFields usam `upload_to=upload_path`, que chama `instance.path_to_upload()` — método presente em outros modelos, mas não em `AceiteTermoPlataforma`.
- **Correção / regra prática:** Em todo model com `ImageField`/`FileField` + `upload_path`, implementar `path_to_upload()` (ex.: `termo_plataforma/aceite/<perfil_id>/<modelo_id>/<code>`).
- **Verificação:** POST `/mobile/termo-plataforma/proprietario/aceitar/` com selfie → 200 e arquivo no storage.

### 2026-05-21 — Termo aceite POST: S3 sem `.path` (selfie + modelo DOCX)

- **Contexto:** `view_termo_plataforma.py` POST; `termo_plataforma_render.py`; storage `S3Boto3Storage` em produção.
- **Sintoma:** `NotImplementedError: This backend doesn't support absolute paths.` em `aceite.selfie.path` (e o modelo DOCX falharia no render com o mesmo padrão).
- **Causa:** `FileField.path` só funciona com storage local; docxtpl `InlineImage` e `DocxTemplate` precisam de path no disco.
- **Correção / regra prática:** `uploaded_file_to_local_path` na selfie do request antes do render; `_modelo_docx_local_path` baixa o DOCX do S3 para temp; `remove_local_file` no `finally` do POST. Nunca usar `.path` em FileField remoto para termo/selfie.
- **Verificação:** POST aceitar termo em prod/staging com B2/S3 → 201 e PDF assinado gerado.

### 2026-05-21 — Site público: formulário de contato → Telegram + painel

- **Contexto:** `webpage` `/contato`; Django `ContatoSite`, `view_mobile/view_contato_site.py`, `view_dash/view_contato_site.py`; `telegram.TELEGRAM_MESSAGE_THREAD_CONTATO_SITE = 21`; dashboard Configurações → aba Empresa.
- **Sintoma:** Formulário simulava envio; equipe não recebia alerta nem histórico no painel.
- **Correção / regra prática:** `POST /mobile/contato-site/` (público) grava `ContatoSite` e dispara `notificar_telegram_contato_site` em thread (fio **21** no supergrupo com tópicos). Dashboard: `GET/PATCH /dash/contato-site/`; listagem na aba **Empresa** em Configurações. Rodar migração `0109_contato_site`. Postman: `extras/postmans/postman_contato_site.json`.
- **Verificação:** `python manage.py migrate`; enviar formulário no site; conferir Telegram (token + chat_id em ParametroEmpresa) e lista em Configurações → Empresa.

### 2026-05-21 — Webpage: endereço do site via ParametroEmpresa

- **Contexto:** `webpage` Sobre/Contato/Footer; `ParametroEmpresa`; aba Configurações → Dados de endereço.
- **Sintoma:** Textos fixos (“Rua Exemplo…”) e campos camelCase (`empresa.cidade`) que a API não devolve; cidade do CEP não era salva.
- **Correção / regra prática:** Campo `cidade_uf` no modelo + migração `0110`; salvar no PUT de endereço e no FormData geral. Site: `lib/empresaFormat.ts` (`buildEmpresaEndereco`, `buildContatoInfoCards`) e `empresaService` alinhado ao snake_case da API (`endereco`, `numero`, `bairro`, `cep`, `cidade_uf`, `telefone_para_contato`, `seodescricao` como slogan).
- **Verificação:** `npx tsc --noEmit` em `webpage/`; preencher endereço no painel e conferir `/sobre`, `/contato` e rodapé.

### 2026-05-21 — Webpage: mapa com latitude/longitude de ParametroEmpresa

- **Contexto:** `ParametroEmpresa.latitude` / `longitude` (painel, busca CEP); `/sobre` e `/contato`.
- **Sintoma:** Link genérico para Google Maps sem mapa interativo; coords do parâmetro pouco usadas no site.
- **Correção / regra prática:** `parseEmpresaGeolocalizacao` em `empresaFormat.ts`; `EmpresaLocationMap` + `EmpresaMapaPanel` (Leaflet, mesmo padrão do imóvel). Com coords válidas: mapa no painel; senão fallback para link por endereço. `empresaMapsUrl` prioriza `lat,lng` do parâmetro.
- **Verificação:** Salvar endereço com CEP no painel (preenche lat/lng) → mapa em `/contato` e `/sobre`.

### 2026-05-21 — Mobile: UI Asaas do proprietário ligada a `exige_asaas_aprovada_cadastro_imovel_app`

- **Contexto:** Flutter perfil proprietário (`home_perfil_proprietario_content.dart`); saldo (`AsaasContaRecebimentosScreen`); repasse (`RepasseAReceberScreen`); `parametroEmpresaPublicProvider`.
- **Sintoma:** Com a opção da empresa desativada no app, ainda apareciam “Recebimentos Asaas”, saldo/subconta e CTAs Asaas na tela “A receber”.
- **Correção / regra prática:** Usar `proprietarioFinanceAsaasUiHabilitado(pe)` (= `pe.exigeAsaasAprovadaCadastroImovelApp`). Se **false**: perfil só “A receber” → `RepasseAReceberScreen`; `/recebimentos-saldo` renderiza repasse; `AsaasSubcontaScreen` dá `pop`; em repasse ocultar split/subconta e textos Asaas. Se **true**: manter Recebimentos Asaas + Saldo e extrato. Remover duplicata financeira em Configurações.
- **Verificação:** `dart analyze lib/src/app/perfil/widgets/home_perfil_proprietario_content.dart lib/src/app/proprietario/finance/`

### 2026-05-21 — Webpage: SEO Google + indexação para IAs (llms.txt, sitemap, JSON-LD)

- **Contexto:** Site público `ninhohouse/webpage` (Next.js App Router).
- **Sintoma:** Metadados mínimos; sem sitemap/robots dedicados; IAs sem texto canónico para recomendar a marca.
- **Correção / regra prática:** Centralizar em `lib/siteSeo.ts` + `lib/siteConfig.ts` (`NEXT_PUBLIC_SITE_URL`, default `https://ninhohouse.com.br`). `buildPageMetadata` usa `seodescricao`/`seokeywords` do painel + keywords de aluguel/locação. Rotas: `app/robots.ts` (permite GPTBot, ClaudeBot, PerplexityBot), `app/sitemap.ts` (estáticas + até 3000 imóveis), `app/llms.txt/route.ts`, `SiteJsonLd` no layout, `ImovelJsonLd` em `imoveis/[ref]/layout.tsx`. Manutenção/lançamento → `noindex` via `isSiteIndexable`.
- **Verificação:** `npx tsc --noEmit` em `webpage/`; após deploy: `/robots.txt`, `/sitemap.xml`, `/llms.txt`; preencher SEO no painel (Configurações → empresa).

### 2026-05-21 — Webpage: títulos únicos + índice IA (llms.txt, ai.txt, meta por página)

- **Contexto:** SEO Seobility (meta title duplicado); indexação para assistentes de IA.
- **Sintoma:** Várias URLs com o mesmo `<title>`; meta `ai-description` genérica em todas as páginas.
- **Correção / regra prática:** `siteSeo.ts`: `title.template` no layout + `buildPageMetadata` com segmento por página; listagem `/imoveis` com `generateMetadata({ searchParams })`; imóvel com `· {ref}` no título. `siteAiIndex.ts`: `buildAiMetaTags` por URL (`ai-page-role`, `ai-recommendation`); rotas `/llms.txt`, `/ai.txt`, `/.well-known/llms.txt`; `robots.ts` com `AI_CRAWLER_AGENTS`; catálogo de páginas no llms.txt. Termos/privacidade: `aiRecommend: false`.
- **Verificação:** `npx tsc --noEmit` em `webpage/`; conferir `<title>` e meta `ai-description` em `/`, `/imoveis?finalidade=locacao`, `/llms.txt`, `/ai.txt`.

### 2026-05-25 — Scripts de importação externa de imóveis

- **Contexto:** `extras/scripts/importar_lancamentos_site.py` — crawler/carga manual de imóveis de terceiros para o dashboard NinhoHouse.
- **Correção / regra prática:** Para cargas externas, usar API do dashboard via `--ninhohouse-url .../dash`, token por parâmetro/env (`NINHOHOUSE_TOKEN`), `import_state.json` para idempotência, fotos baixadas em `extras/data/...` antes do upload e tags funcionais criadas por API antes de associar ao imóvel. Nunca hardcodar token, proprietário nem marca da origem no que será gravado no NinhoHouse; também não enviar `identificador` para imóveis, deixando o cadastro automático do model gerar.
- **Complemento:** Se a origem não expõe CEP por imóvel, não inventar valor no payload; aceitar `--default-cep` explícito para fallback operacional e normalizar para `99999-999`.
- **Verificação:** `python3 -m py_compile extras/scripts/importar_lancamentos_site.py`; `python3 extras/scripts/importar_lancamentos_site.py --crawl-only --source-url "URL_DA_LISTAGEM" --max-items 1 --max-photos-per-imovel 1`; `--dry-run --source-url "URL_DA_LISTAGEM" --proprietario-id 1 --cidade-id 1 --tipo-imovel-id 1 --max-items 1`.

### 2026-05-25 — Webpage: imóveis em lançamento na API pública

- **Contexto:** Site `webpage` usa `GET /api/mobile/imovel/`; Django `app/view_mobile/imovel/publico.py`.
- **Sintoma:** Imóveis com `Imovel.status = lancamento` não apareciam na home/listagem/detalhe público.
- **Causa:** Query pública filtrava só `status='disponivel'` na listagem, resolução por ref e relacionados.
- **Correção / regra prática:** Centralizar status públicos em `IMOVEL_PUBLICO_STATUS = ('disponivel', 'lancamento')` e usar `status__in` em todos os querysets públicos do fluxo `/mobile/imovel/`.
- **Verificação:** `python3 -m py_compile ninhohouse/app/view_mobile/imovel/publico.py`; smoke em `/api/mobile/imovel/?tipo_preco=venda` com imóvel `lancamento`.

### 2026-05-25 — Webpage: badges de lançamento e construção nos cards

- **Contexto:** `webpage/src/components/properties/PropertyCard.tsx`; payload público `ImovelPublicoSerializerModel.tags`.
- **Sintoma:** Imóveis em lançamento apareciam visualmente iguais aos demais na listagem do site.
- **Correção / regra prática:** Cards públicos devem destacar `status='lancamento'` ou tag de lançamento com chip forte “Lançamento”; tags cujo nome/slug indicam construção (`construcao`, `construção`, `em-construcao`) ganham chip “Em construção”. Manter `Imovel.tags` tipado em `webpage/src/types/index.ts`.
- **Verificação:** `npx tsc --noEmit`; `npx eslint src/components/properties/PropertyCard.tsx src/types/index.ts`.

### 2026-06-10 — Mobile: tela cinza após solicitar reserva (Meu Lar)

- **Contexto:** Flutter `meu_lar_reservas_tab.dart` embute `ReservaProcessoScreen` inline após `context.go(MeuLarScreen.path)` em `solicitar_reserva_screen.dart`.
- **Sintoma:** Após agendar reserva, usuário via tela cinza vazia em vez do acompanhamento do processo.
- **Causa:** `ReservaProcessoScreen` usava `Scaffold` próprio com `Column`+`Expanded` dentro do `Scaffold` do Meu Lar (nested scaffold sem altura definida). `fetchDetail` no init também forçava estado `loading` e ocultava o conteúdo mesmo com `widget.reserva` disponível.
- **Correção / regra prática:** Telas embutidas no Meu Lar (`ReservaProcessoScreen`, `ReservaAtivaScreen`) **não** devem ter `Scaffold` — só o conteúdo; rota `/reserva/processo` envolve com `Scaffold`+`AppAppBar` no `router.dart`. Com reserva já passada, usar `refreshDetail` (não `fetchDetail`) e em `loading`/erro fazer fallback para `widget.reserva`. Após POST de reserva, `await list()` no controller antes de navegar.
- **Verificação:** `dart analyze lib/src/app/ocupantes/reservas/screens/reserva_processo_screen.dart lib/src/router.dart`

### 2026-06-11 — Cadastro de imóvel pelo app já aprovado no painel

- **Contexto:** Django `app/view_mobile/imovel/cadastro.py` (`ImovelCadastroView.post`).
- **Sintoma:** Imóvel cadastrado pelo app ficava com `status='pendente'` e exigia aprovação manual no painel antes de aparecer na busca pública.
- **Correção / regra prática:** No cadastro mobile, definir **`status='disponivel'`** (aprovado/publicável) e chamar **`notificar_imovel_aprovado`** em vez de `notificar_cadastro_imovel_app_pendente`. Fluxo manual pendente → em_analise → disponível continua só para alterações feitas no painel.
- **Verificação:** `python3 -m py_compile ninhohouse/app/view_mobile/imovel/cadastro.py`; cadastrar imóvel no app e conferir status no dashboard e na listagem pública.

### 2026-06-12 — Backend: cancelamento boleto reserva após vencimento (Asaas)

- **Contexto:** Django `PagamentoGerarCobrancaView` + `app/helpers/asaas_platform.py` (aceite proprietário → `gerar-cobranca/`).
- **Sintoma:** Cobranças de reserva em boleto não enviavam prazo de cancelamento do registro após vencimento; boleto podia permanecer pagável além do desejado.
- **Correção / regra prática:** Cobranças com `pagamento.Reserva_id` e `billingType=BOLETO` devem incluir `daysAfterDueDateToRegistrationCancellation: 2` no payload Asaas (helper `aplicar_cancelamento_boleto_apos_vencimento`). Não aplicar a locação, renovação, PIX ou cartão. Registrar no `cobranca_split_snapshot` como `days_after_due_date_to_registration_cancellation`.
- **Verificação:** `python manage.py test app.tests_asaas_platform`; aceitar reserva no app com boleto e conferir campo no payload/log.

### 2026-06-21 — Mobile iOS: ITMS-90683 NSLocationWhenInUseUsageDescription

- **Contexto:** Flutter `ninhohouse/mobile/ios/Runner/Info.plist`; plugins `google_maps_flutter_ios` e `permission_handler_apple`.
- **Sintoma:** App Store Connect avisa ITMS-90683 após upload — falta descrição de finalidade para localização no Info.plist.
- **Causa:** SDKs referenciam APIs de localização mesmo que o app não peça permissão em runtime; Apple exige `NSLocationWhenInUseUsageDescription` com texto voltado ao usuário.
- **Correção / regra prática:** Incluir `NSLocationWhenInUseUsageDescription` no Info.plist (mesmo tom das chaves de câmera/galeria), explicando uso no mapa/busca por região. Reenviar build iOS após alteração.
- **Verificação:** Conferir chave em `ios/Runner/Info.plist`; novo upload no App Store Connect sem aviso ITMS-90683.

### 2026-07-17 — Mobile: compartilhar imóvel no detalhe não fazia nada

- **Contexto:** Flutter `detalhe_imovel_body.dart` (ícone share no `SliverAppBar`); URL pública do site webpage `/imoveis/{ref}`.
- **Sintoma:** Toque em compartilhar não abria sheet nem copiava link.
- **Causa:** `onPressed: () {}` vazio; sem integração de share.
- **Correção / regra prática:** Usar `share_plus` (`SharePlus.instance.share(ShareParams(...))`) com URL `Config.publicSiteUrlProduction/imoveis/{Uri.encodeComponent(identificador || codigo)}` via `imovelPublicShareUrl` em `imovel_helpers.dart` (mesmo critério do site `imovelPublicUrlRef`). Em links compartilháveis, sempre domínio de produção — não `127.0.0.1`. Passar `sharePositionOrigin` do botão (Builder) para iPad.
- **Verificação:** `dart analyze lib/src/app/explorar/screens/detalhe_imovel_body.dart lib/src/shared/utils/imovel_helpers.dart`

### 2026-07-17 — Mobile: app deslogava sozinho em 401/403

- **Contexto:** Flutter `AuthMiddlewareRequired` em `auth_middleware.dart` (interceptor de `apiAuthServices` / `apiDashServices`).
- **Sintoma:** Usuário era deslogado sem tocar em “Sair” (perfil voltava a “Entrar”).
- **Causa:** Em qualquer resposta 401 **ou 403**, o middleware fazia `localStorage.removeItem('token')` + `routeNotifier.notify()`. Muitos 403 são regra de negócio (permissão, Asaas, etc.), não sessão inválida.
- **Correção / regra prática:** **Nunca** apagar o token em interceptor de erro. Sessão só termina em `AuthNotifier.logout()` (ação explícita). `isUnauthorized` = só **401** (não 403/407). Em erros de API, manter token e tratar mensagem na tela.
- **Verificação:** `dart analyze lib/services/middlewares/auth_middleware.dart lib/src/app/auth/controllers/auth_controller.dart`

### 2026-07-19 — Mobile: recuperar senha 404 em `/recuperar-senha/`

- **Contexto:** Flutter `auth_controller` + `recuperar_senha_screen`; backend `urls_mobile.py` / `view_recuperacao.py`.
- **Sintoma:** POST `…/mobile/recuperar-senha/` → HTML 404 Not Found.
- **Causa:** App chamava rota inexistente. API real é em 3 passos: `/recuperar-senha/solicitar/`, `/validar/`, `/confirmar/` (código por e-mail, não link).
- **Correção / regra prática:** Usar essas três rotas no controller; UI em etapas e-mail → Pinput 6 dígitos → nova senha (`nova_senha`). Reenviar = novo POST em `solicitar/`.
- **Verificação:** `dart analyze lib/src/app/auth/controllers/auth_controller.dart lib/src/app/auth/screens/recuperar_senha_screen.dart`

### 2026-07-21 — Backend: e-mail BeSoft → Mailgun (padrão Plago)

- **Contexto:** Django `ninhohouse/libs/mailgun_email_api.py`, `configuracao.py`; removido `besoft_email_api.py`; model `Configuracao`
- **Sintoma:** Envio via BeSoft Email API (legado); chaves em `ParametroEmpresa.sendgridkey`
- **Causa:** Migração para o mesmo padrão do plago_backend (Mailgun HTTP API)
- **Correção / regra prática:**
  - lib `MailgunEmail` / `enviar_email` — POST `https://api.mailgun.net/v3/{domain}/messages` com `auth=('api', api_key)`
  - chaves em `Configuracao`: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` (`mg.ninhohouse.com.br`), `MAILGUN_EMAIL_DE`, `MAILGUN_EMAIL_DE_NOME`, `MAILGUN_EMAIL_RESPONDER_PARA`, `MAILGUN_EMAIL_RESPONDER_PARA_NOME`
  - seed: `python manage.py seed_config_email [--api-key ...] [--domain ...] [--force]` ou SQL `extras/sql/insert_configuracao_mailgun.sql`
  - callers legados ainda usam `SendEmail` (wrapper Mailgun + `html=`); código novo: `from ninhohouse.libs.mailgun_email_api import MailgunEmail`
- **Verificação:** `python manage.py migrate`; `python manage.py seed_config_email`; preencher `MAILGUN_API_KEY` no admin

### 2026-07-21 — Backend: dois asaas.py (órfão removido)

- **Contexto:** Django libs Asaas
- **Sintoma:** Dois arquivos `asaas.py` — um em `ninhohouse/libs/` (órfão) e outro em `ninhohouse/ninhohouse/libs/`
- **Causa:** Cópia antiga fora do pacote Python; imports reais usam `from ninhohouse.libs.asaas import Asaas`
- **Correção / regra prática:** Manter só `ninhohouse/ninhohouse/libs/asaas.py` (versão com subconta/`criar_subconta`). Nunca criar `ninhohouse/libs/` paralelo ao pacote.
- **Verificação:** `rg "from ninhohouse.libs.asaas" ninhohouse/`

### 2026-07-27 — Mobile locação: cobranças/boleto no detalhe do contrato

- **Contexto:** Flutter `meu_lar` + API mobile `locacao/<pk>/`
- **Sintoma:** Detalhe do contrato não exibia PIX, linha digitável nem link de boleto; `BoletosScreen` usava dados fake.
- **Causa:** `LocacaoDetailMobileView` serializava só `LocacaoSerializerModel` (sem `parcelas_pendentes` / `cobrancas`); reserva já tinha o padrão em `ReservaMobileSerializer`.
- **Correção / regra prática:** Backend: `LocacaoMobileSerializer` + `PagamentoLocacaoMobileSerializer` (prefetch `parcelas` + `itens` no detail). Flutter: `PagamentoLocacaoModel`, seção `ContratoCobrancasPendentesSection`, tela `DetalheCobrancaLocacaoScreen`, `BoletosScreen` consome API via `locacaoDetailProvider`. Abrir boleto/PIX: `launchReservaContratoUrl`; datas com `AppUtils.tryParseIsoDateOnly`.
- **Verificação:** `dart analyze lib/src/app/ocupantes/meu_lar`; GET `locacao/{id}/` retorna `parcelas_pendentes` e `cobrancas`.

### 2026-08-04 — Mobile: token expirado travava na splash (welcome)

- **Contexto:** Flutter `splash.dart` + `GET /mobile/perfil/` via `apiAuthServices`; política anterior (2026-07-17) não deslogava em 401.
- **Sintoma:** Com token expirado no `localStorage`, app ficava na tela de welcome/splash; `getPerfil` retornava 401 sem feedback nem encerramento de sessão.
- **Causa:** Token ainda presente → `isLoggedIn()` true, mas perfil falhava; não havia fluxo de sessão expirada (só logout explícito).
- **Correção / regra prática:** `SessionExpiredHandler` + `SessionExpiredInterceptor` em `apiAuthServices`: **401 com token** → limpar storage/Firebase, `AppDialog` “Sessão expirada”, ir para `/home-explore`. **403 continua sem deslogar.** Splash: após `getPerfil`, se `!isLoggedIn()` navegar para explore; usar `ref.read` (não `watch`) no callback async. `PerfilNotifier.resetSession()` para reset seguro do estado.
- **Verificação:** `dart analyze lib/services/session_expired_handler.dart lib/src/app/base/screens/splash.dart`

### 2026-08-17 — Mobile: tap em push, share do imóvel e detalhe da locação (proprietário)

- **Contexto:** Flutter push (`firebase_push_service` / `FcmNavigationHandler`), detalhe do imóvel, locação do proprietário
- **Sintoma:** Toque na notificação só atualizava listas; compartilhar podia falhar em silêncio; card de locação não abria detalhe
- **Causa:** Sem `getInitialMessage` / callback de tap local; FCM sem `destino`/`acao_url`; locação sem tela de acompanhamento
- **Correção / regra prática:**
  - Navegar push via `FcmNavigationHandler` + `navegarPorNotificacaoRouter` (fila até o splash `markReady`)
  - Incluir `destino` e `acao_url` no `data` FCM (`_enviar_push_notificacao`)
  - Share: `share_plus` + URL de produção; se URL for só o site, snackbar; try/catch
  - Detalhe da locação do dono: `/proprietario/locacao/gerenciar` só leitura (`locacao/<pk>/cobrancas/` e `documentos/`); não gerar cobrança
  - Alias `LocacaoDocumentosSerializerModel = ContratoLocacaoSerializerModel`
- **Verificação:** `dart analyze` nos arquivos de push, `notificacao_nav.dart` e `proprietario/locacao/`

### 2026-09-01 — Boleto Asaas: sem texto de comissão NinhoHouse para o cliente

- **Contexto:** Django `app/helpers/asaas_platform.py` + `app/view_dash/view_pagamentos.py` (gerar cobrança locação/reserva)
- **Sintoma:** Boleto do cliente mostrava `Comissão NinhoHouse: X% sobre o valor base da cobrança; repasse contratual estimado ao proprietário: R$ Y.`
- **Causa:** `description` enviada ao Asaas concatenava nota interna de comissão/repasse.
- **Correção / regra prática:** `description` do Asaas = só itens + observações (`montar_descricao_cobranca_cliente`). Texto de comissão só no snapshot (`nota_comissao_interna` / `montar_nota_comissao_interna`) para gestão. `taxa_ninhohouse_descricao` no resumo de taxas continua para o painel.
- **Verificação:** `python manage.py test app.tests_asaas_platform.MontarDescricaoCobrancaTest`

### 2026-09-06 — Mobile proprietário: detalhe da locação (documentos/cobranças/valores)

- **Contexto:** Django `view_mobile/view_locacao.py` + Flutter `proprietario/locacao/widgets/gerenciar_locacao/`
- **Sintoma:** Card de documentos com `cannot import name 'LocacaoDocumentosSerializerModel'`; cobranças com “Não foi possível completar sua consulta.”; total mensal sem linhas de seguro/taxa.
- **Causa:** Import de alias inexistente em produção + `locacao.documentos` (related_name real é `contratos`). Extra endpoints falhavam sem fallback do detalhe.
- **Correção / regra prática:** Documentos = `locacao.contratos` + `ContratoLocacaoSerializerModel`. App: se `cobrancas/` ou `documentos/` falhar, usar payload do detalhe (`cobrancas`/`documentos`). Exibir seguro fiança/incêndio e taxa administrativa no card Valores. Não mostrar traceback da API na UI.
- **Verificação:** `dart analyze lib/src/app/proprietario/locacao/`

### 2026-09-08 — Docker: build com git clone + PAT e cron bullseye expirado

- **Contexto:** `docker/backend/Dockerfile`, `docker/frontend/Dockerfile`, `docker/cron/Dockerfile`, `docker/docker-compose.yml`
- **Sintoma:** `make build` falhava no cron (`Release file for bullseye-security is expired`) e o frontend clonava o repo com PAT no Dockerfile (credencial visível no log do build).
- **Causa:** Imagens backend/frontend faziam `git clone` com token; cron usava `debian:bullseye-slim` (security repo expirado) e `apt-get update` em camada isolada.
- **Correção / regra prática:** Padrão Plago: no servidor `git pull` + `COPY` do checkout. Backend `context: ..`; frontend `context: ninhohouse/frontend`. Sem clone e sem token na imagem. Cron em `debian:bookworm-slim` com `apt-get update` + install no mesmo `RUN`.
- **Verificação:** `cd docker && docker compose -f docker-compose.yml config` (não pode restar `git clone` nem `ghp_` nos Dockerfiles)
