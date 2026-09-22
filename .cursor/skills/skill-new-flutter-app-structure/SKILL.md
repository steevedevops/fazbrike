---
name: skill-new-flutter-app-structure
description: Estrutura padrão para novos aplicativos Flutter. Use quando criar um novo app Flutter do zero. Replica a estrutura de pastas lib (config, services, src/app, theme, router) e cria todos os arquivos iniciais com conteúdo completo. Autônoma, sem dependência de projeto externo.
---

# New Flutter App Structure

Ao criar um **novo aplicativo Flutter**, siga esta estrutura exatamente. A skill é autônoma: todo o conteúdo está em [references/lib-structure.md](references/lib-structure.md).

## Placeholders

- `{{APP_NAME}}` = nome do pacote (ex: `meu_app`)
- `{{app_name}}` = snake_case (ex: `meu_app`)
- `{{AppName}}` = PascalCase (ex: `MeuApp`)

## Fluxo Obrigatório

1. Criar projeto: `flutter create {{APP_NAME}}` ou `mcp_dart_create_project`
2. Adicionar dependências, assets e `flutter_launcher_icons` no `pubspec.yaml` (ver [references/pubspec-dependencies.md](references/pubspec-dependencies.md))
3. Criar pastas de assets: `lib/assets/logos/`, `lib/assets/images/` (com `.gitkeep` para versionar)
4. Criar toda a estrutura `lib/` conforme [references/lib-structure.md](references/lib-structure.md)
5. Substituir `{{APP_NAME}}`, `{{app_name}}`, `{{AppName}}` em todos os arquivos
6. Adicionar `app_icon.png` (1024x1024 px) em `lib/assets/logos/` e rodar `dart run flutter_launcher_icons` para gerar ícones Android/iOS

## Estrutura lib/

```
lib/
├── assets/
│   ├── logos/
│   │   ├── .gitkeep
│   │   └── app_icon.png  (1024x1024 - adicionar manualmente)
│   └── images/
│       └── .gitkeep
├── config.dart
├── main.dart
├── services/
│   ├── api_helpers.dart
│   ├── api_services.dart
│   ├── navigator_service.dart
│   ├── middlewares/
│   │   ├── auth_middleware.dart
│   │   ├── cookies.dart
│   │   └── error_middleware.dart
│   └── models/
│       └── api_response_model.dart
└── src/
    ├── router.dart
    ├── app/
    │   ├── {{app_name}}_app.dart
    │   ├── base/screens/base_dash.dart
    │   ├── splash/screens/splash_screen.dart
    │   ├── auth/screens/login_screen.dart
    │   ├── home/screens/
    │   │   ├── home_screen.dart
    │   │   └── home_perfil_screen.dart
    │   ├── imoveis/screens/imoveis_screen.dart
    │   └── perfil/screens/perfil_screen.dart
    ├── shared/utils/
    │   ├── app_utils.dart
    │   └── app_directory.dart
    └── theme/
        ├── theme.dart
        ├── app_colors.dart
        ├── app_spacing.dart
        ├── app_radius.dart
        ├── app_text_styles.dart
        ├── app_theme.dart
        └── theme_provider.dart
```

## Ordem de Criação

1. `lib/assets/logos/` e `lib/assets/images/` (com `.gitkeep`)
2. `config.dart`
3. `services/` (models, api_helpers, api_services, navigator_service, middlewares)
4. `src/shared/utils/`
5. `src/theme/`
6. `src/app/` (app widget, base, splash, auth, home, imoveis, perfil)
7. `src/router.dart`
8. `main.dart`

## Regras

- **Imports**: `package:{{APP_NAME}}/...`
- **Arquivo app**: `{{app_name}}_app.dart` (ex: `meu_app_app.dart`)
- **Config**: Ajustar `APP_NAME`, `PRD_URL`, `DEV_URL` conforme o projeto

## Assets e Ícones

- **Pastas**: `lib/assets/logos/` (ícone do app), `lib/assets/images/` (imagens estáticas)
- **app_icon.png**: 1024x1024 px em `lib/assets/logos/` para gerar ícones
- **Gerar ícones**: `dart run flutter_launcher_icons` após adicionar o ícone

## Referências

- [lib-structure.md](references/lib-structure.md) – Conteúdo completo de todos os arquivos
- [pubspec-dependencies.md](references/pubspec-dependencies.md) – Dependências, assets, flutter_launcher_icons
