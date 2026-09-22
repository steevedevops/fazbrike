---
name: flutter-module-structure
description: Garante consistência na criação de novos módulos em projetos Flutter usando Riverpod 2.x. Use quando criar um módulo novo, adicionar listagem, formulário (POST/PUT/PATCH/DELETE/upload), ou estruturar pastas controllers, models, screens e widgets. Define padrões para StateNotifierProvider (ListProvider, FormProvider) com AsyncValue, models com fromJson/toJson, separação de responsabilidades (API apenas em controllers), extração de widgets (shared/widgets para reutilizáveis; widgets/ do módulo para específicos) e nunca deixar toda a UI no arquivo da screen.
---

# Flutter Module Structure Skill

Padrão obrigatório para criação e manutenção de módulos em projetos Flutter com Riverpod.

## Estrutura de Pastas

Todo módulo deve ter a seguinte estrutura:

```
[nome_modulo]/
├── controllers/
├── models/
├── screens/
└── widgets/
```

- **controllers/**: Lógica de estado, chamadas de API e regras de negócio. Nada de API fora daqui.
- **models/**: Classes de dados com `fromJson`, `toJson` e `fromJsonList`.
- **screens/**: Telas principais do módulo. Apenas orquestração: build enxuto, importando widgets de `widgets/` do módulo ou de `shared/widgets`.
- **widgets/**: Widgets **específicos do módulo** (card da lista do módulo, loading/erro da tela, seções e detalhes do domínio). Não deixar UI no arquivo da screen — extrair para arquivos aqui.

**Pasta shared do projeto** (ex: `lib/src/shared/widgets`): Widgets **reutilizáveis em mais de uma tela ou módulo** (botões, inputs, cards genéricos, loading genérico, app bar, etc.). Sempre que um widget puder ser usado em outro módulo, colocá-lo em **shared/widgets** para evitar duplicação e boilerplate.

## Controllers

**Regra geral:** Todo controller de módulo deve usar **AsyncValue** como estado (loading, data, error). Nunca expor dados da API sem AsyncValue.

Este padrão segue as recomendações do Riverpod para lidar com requisições assíncronas: o provider encapsula cache, loading e erro, e a UI apenas reage às mudanças de estado. Sempre reutilize os providers (em vez de recriar chamadas diretas) para se beneficiar do cache reativo do Riverpod.

### List Provider (sempre que houver listagem)

```dart
final nomeModuloListProvider = StateNotifierProvider<NomeModuloListNotifier, AsyncValue<PaginatorModel<NomeModuloModel>>>((ref) {
  return NomeModuloListNotifier(ref);
});

class NomeModuloListNotifier extends StateNotifier<AsyncValue<PaginatorModel<NomeModuloModel>>> {
  final Ref ref;
  NomeModuloListNotifier(this.ref) : super(const AsyncValue.loading());

  Future<void> list({int? page, bool paginate = false}) async {
    state = const AsyncValue.loading();
    try {
      // Chamada API aqui
      final paginator = PaginatorModel<NomeModuloModel>(...); // montar a partir do result
      state = AsyncValue.data(paginator);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void update(NomeModuloModel item) {
    state.whenData((paginator) {
      state = AsyncValue.data(paginator.copyWith(
        results: paginator.results.map((e) => e.id == item.id ? item : e).toList(),
      ));
    });
  }

  void remove(int id) {
    state.whenData((paginator) {
      state = AsyncValue.data(paginator.copyWith(
        results: paginator.results.where((e) => e.id != id).toList(),
      ));
    });
  }
}
```

**Regras:**
- Nome: `nomeModuloListProvider` (camelCase)
- Estado: `AsyncValue<PaginatorModel<T>>` (obrigatório)
- Inicial: `AsyncValue.loading()` ou `AsyncValue.data(PaginatorModel vazio)`
- Em list(): `state = AsyncValue.loading()` antes da chamada; depois `AsyncValue.data(...)` ou `AsyncValue.error(e, st)`
- Métodos `update` e `remove`: usar `state.whenData((paginator) => ...)` para atualizar a lista

### Form Provider (somente quando existir POST, PUT, PATCH, DELETE ou upload)

Adicione **apenas** se o módulo tiver operações de criação (POST), atualização (PUT/PATCH), exclusão (DELETE) ou upload (ex: foto).

```dart
final nomeModuloFormProvider = StateNotifierProvider<NomeModuloFormNotifier, AsyncValue<String>>((ref) {
  return NomeModuloFormNotifier(ref);
});

class NomeModuloFormNotifier extends StateNotifier<AsyncValue<String>> {
  final Ref ref;
  NomeModuloFormNotifier(this.ref) : super(const AsyncValue.data(''));

  Future<void> create(Map<String, dynamic> body) async {
    // POST
    if (result.isSuccess) {
      ref.read(nomeModuloListProvider.notifier).list();
      state = const AsyncValue.data('');
    } else {
      state = AsyncValue.error('mensagem', StackTrace.current);
    }
  }

  Future<void> update(int id, Map<String, dynamic> body) async {
    // PUT
    if (result.isSuccess) {
      ref.read(nomeModuloListProvider.notifier).update(Model.fromJson(result.data));
      state = const AsyncValue.data('');
    } else {
      state = AsyncValue.error('mensagem', StackTrace.current);
    }
  }

  Future<void> patch(int id, Map<String, dynamic> body) async {
    // PATCH
    if (result.isSuccess) {
      ref.read(nomeModuloListProvider.notifier).update(Model.fromJson(result.data));
      state = const AsyncValue.data('');
    } else {
      state = AsyncValue.error('mensagem', StackTrace.current);
    }
  }

  Future<void> delete(int id) async {
    // DELETE
    if (result.isSuccess) {
      ref.read(nomeModuloListProvider.notifier).remove(id);
      state = const AsyncValue.data('');
    } else {
      state = AsyncValue.error('mensagem', StackTrace.current);
    }
  }

  Future<void> uploadFoto(int id, String imagePath, {bool isCover = false}) async {
    // POST multipart
    if (result.isSuccess) {
      state = const AsyncValue.data('');
    } else {
      state = AsyncValue.error('mensagem', StackTrace.current);
    }
  }
}
```

**Regras:**
- Nome: `nomeModuloFormProvider`
- Estado: `AsyncValue<String>`
- Em sucesso: atualizar list provider (quando aplicável) e `state = AsyncValue.data('')`
- Em erro: `state = AsyncValue.error(msg, StackTrace.current)`
- Não criar FormProvider se não houver POST, PUT, PATCH, DELETE ou upload

### Form State (formulários complexos)

Para formulários com muitos campos (chips, checkboxes, toggles), use uma classe de estado separada:

```dart
class NomeModuloFormState {
  final int? campo1;
  final bool campo2;
  // ...

  const NomeModuloFormState({this.campo1, this.campo2 = false});
  NomeModuloFormState copyWith({...}) => NomeModuloFormState(...);
}

final nomeModuloFormStateProvider = StateNotifierProvider<NomeModuloFormStateNotifier, NomeModuloFormState>(...);
```

Use apenas quando o formulário tiver muitos campos de seleção. Para formulários simples, mantenha os campos nos controllers da tela.

## Models

Padrão obrigatório. Todo model deve ter `fromJson`, `toJson` e `fromJsonList`:

```dart
class NomeModuloModel {
  int? codigo;  // ou id, conforme convenção do projeto
  String? nome;
  // campos...

  NomeModuloModel({this.codigo, this.nome, ...});

  static List<NomeModuloModel> fromJsonList(dynamic jsonList) {
    return jsonList.map<NomeModuloModel>((obj) => NomeModuloModel.fromJson(obj)).toList();
  }

  NomeModuloModel.fromJson(Map<String, dynamic> json) {
    codigo = json['codigo'];
    nome = json['nome'];
    // mapear snake_case da API para camelCase
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['codigo'] = codigo;
    data['nome'] = nome;
    return data;
  }
}
```

**Regras:**
- `fromJson`, `toJson` e `fromJsonList` **obrigatórios** em todo model
- snake_case na API ↔ camelCase no Dart
- Relacionamentos: `json['campo'] != null ? OutroModel.fromJson(json['campo']) : null`

## Widgets

**Regra:** Nunca concentrar a UI toda no arquivo da screen. Extrair para arquivos próprios — e **escolher o lugar certo** conforme o escopo do widget (compartilhado vs específico do módulo).

### Onde colocar cada widget

| Tipo | Onde | Exemplos |
|------|------|----------|
| **Usado em mais de uma tela ou módulo** | **`shared/widgets`** (ex: `lib/src/shared/widgets`) | Botões, inputs, dropdowns, loading genérico, app bar, cards genéricos, snackbars, dialogs reutilizáveis |
| **Específico do módulo** | **`[modulo]/widgets/`** | Card da lista de imóveis, conteúdo da listagem do módulo, tela de erro daquele fluxo, formulário de cadastro do módulo, seções e detalhes do domínio |

- **shared/widgets:** Evita boilerplate e duplicação; um único lugar para componentes reutilizáveis (alinhado a composição e reuso do Flutter). Ao criar um widget, perguntar: "outra tela ou outro módulo vai usar?". Se sim → shared.
- **widgets/ do módulo:** Conteúdo de listagem do módulo, card de item daquele domínio, loading/erro específicos da tela, formulários e detalhes que não serão reutilizados fora do módulo.
- **Screen:** Apenas `Scaffold`, `ref.watch(...).when(...)` e composição dos widgets importados de `widgets/` ou `shared/widgets`.

**Exemplo:** Um `LoadingSpinner` usado em várias telas → `shared/widgets/loading_spinner.dart`. O card de um item da lista "Meus Imóveis" (com foto, preço, status do imóvel) → `proprietario/imoveis/widgets/imovel_card.dart`.

## Screens

- Use `ConsumerWidget` ou `ConsumerStatefulWidget` conforme necessidade de estado local
- Chamar `ref.read(nomeModuloListProvider.notifier).list()` em `initState` ou `addPostFrameCallback`
- Observar estado com `ref.watch(nomeModuloListProvider)` — sempre será **AsyncValue**
- **Manter telas enxutas:** a screen só orquestra; a UI (listas, cards, loading, erro) fica em widgets na pasta **widgets/**, nunca tudo no arquivo da screen

### Uso de AsyncValue na UI (performance e manutenção)

Escolher a abordagem **mais performática, limpa e fácil de manter** conforme o caso:

| Situação | Abordagem recomendada | Motivo |
|----------|------------------------|--------|
| Precisa de UI distinta para loading, data e error (ex: listagem) | **`.when()`** | Um único ponto de decisão; evita null checks; cada estado retorna um widget. |
| Só precisa do dado quando existir; loading/error em outro lugar (ex: overlay, snackbar) | **`.whenData()`** ou **`.value`** | Menos boilerplate; rebuild só quando há data. |
| Só precisa saber se está loading ou exibir conteúdo | **`.when(loading: ..., data: ..., error: ...)`** com widgets extraídos | Mantém o build enxuto e permite `const` nos branches. |

**Regras de ouro:**

1. **`.when()`** — Use quando a tela precisar de três UIs diferentes (loading, conteúdo, erro). **Extrair cada branch para um widget na pasta `widgets/`** (ex: `ListContent`, `LoadingList`, `ListError`) — não definir no mesmo arquivo da screen.
2. **`.whenData()`** — Use quando só precisar renderizar em cima do dado; loading/error podem ser um overlay, um wrapper ou não precisar de widget próprio. Não use se precisar de mensagem de erro visível na tela.
3. **Evitar** `.when()` com árvore de widgets grande inline nos callbacks — **sempre extrair para widgets em arquivos na pasta `widgets/`**.
4. **Performance:** Widgets extraídos + `const` onde possível; não colocar lógica pesada dentro dos callbacks de `when`/`whenData`.
5. **Manutenção:** Um único padrão por tela (só `.when()` ou só `.whenData()` + tratamento externo); nomes claros; sem duplicar tratamento de loading/error em vários lugares.

**Exemplo enxuto (listagem com .when; widgets em `widgets/`):**

```dart
// No arquivo da screen — só orquestração
ref.watch(nomeModuloListProvider).when(
  loading: () => const LoadingList(),
  data: (paginator) => ListContent(paginator: paginator),
  error: (e, _) => ListError(message: e.toString()),
)
// LoadingList, ListContent e ListError definidos em widgets/loading_list.dart, widgets/list_content.dart, widgets/list_error.dart
```

## Princípios

1. **Integração progressiva**: Só crie o que foi solicitado. Se pedir só listagem, não adicione form. Se pedir só form, não adicione listagem completa.
2. **Simplicidade**: Formulário simples não precisa de FormState complexo. Evite over-engineering.
3. **API em controllers**: Toda chamada de API, parsing de resposta e regras de retorno ficam nos controllers. Screens e widgets apenas consomem o estado.
4. **Widgets no lugar certo**: Nunca concentrar a UI no arquivo da screen. Widget **reutilizável em mais de uma tela/módulo** → **shared/widgets**. Widget **específico do módulo** (card da lista, detalhes do domínio) → **widgets/** do próprio módulo. Evita boilerplate e duplicação (composição e reuso).
5. **Código limpo**: Funções curtas, nomes claros, sem duplicação. Fácil de entender e manter.

## Checklist de Criação

**Novo módulo com listagem:**
- [ ] Pastas: controllers, models, screens, widgets
- [ ] Model com fromJson, toJson e fromJsonList (todos obrigatórios)
- [ ] ListProvider com `AsyncValue<PaginatorModel<T>>`
- [ ] Screen enxuta: só orquestração; UI em widgets (reutilizáveis em **shared/widgets**; específicos do módulo em **widgets/**)
- [ ] AsyncValue com `.when()` ou `.whenData()`; cada branch é um widget (em `widgets/` do módulo ou `shared/widgets` conforme escopo)

**Módulo com formulário (POST/PUT/PATCH/DELETE/upload):**
- [ ] FormProvider com AsyncValue<String>
- [ ] Métodos create/update/patch/delete/uploadFoto no FormNotifier (conforme necessidade)
- [ ] FormState opcional (só se formulário complexo)

**Apenas integração de listagem:**
- [ ] Não criar estrutura completa
- [ ] ListProvider + Model + Screen mínima + widgets em `widgets/` do módulo ou `shared/widgets` (reutilizável); nunca toda a UI no arquivo da screen
