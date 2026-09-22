# Dependências e Configuração pubspec.yaml

## Exemplo completo (baseado em imobiliario_mobile)

```yaml
name: {{APP_NAME}}
description: "A new Flutter project."
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: ^3.9.2

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  intl: ^0.20.2
  cupertino_icons: ^1.0.8
  go_router: ^14.7.2
  cookie_jar: ^4.0.8
  flutter_riverpod: ^2.1.0
  google_fonts: ^6.2.1
  localstorage: ^5.0.0
  dio: ^5.9.0
  talker_dio_logger: ^4.5.5
  path_provider: ^2.1.0
  toastification: ^3.0.3

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0
  flutter_launcher_icons: ^0.14.4

flutter:
  uses-material-design: true
  assets:
    - lib/assets/logos/
    - lib/assets/images/

flutter_launcher_icons:
  android: true
  ios: true
  image_path: "lib/assets/logos/app_icon.png"
  min_sdk_android: 21
  adaptive_icon_background: "#FFFFFF"
  adaptive_icon_foreground: "lib/assets/logos/app_icon.png"
```

---

## Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  intl: ^0.20.2
  cupertino_icons: ^1.0.8
  go_router: ^14.7.2
  cookie_jar: ^4.0.8
  flutter_riverpod: ^2.1.0
  google_fonts: ^6.2.1
  localstorage: ^5.0.0
  dio: ^5.9.0
  talker_dio_logger: ^4.5.5
  path_provider: ^2.1.0
  toastification: ^3.0.3
```

## Dev Dependencies

```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0
  flutter_launcher_icons: ^0.14.4
```

## Flutter (assets + uses-material-design)

```yaml
flutter:
  uses-material-design: true
  assets:
    - lib/assets/logos/
    - lib/assets/images/
```

## flutter_launcher_icons

Adicione ao final do `pubspec.yaml` (fora da seção `flutter:`):

```yaml
flutter_launcher_icons:
  android: true
  ios: true
  image_path: "lib/assets/logos/app_icon.png"
  min_sdk_android: 21
  adaptive_icon_background: "#FFFFFF"
  adaptive_icon_foreground: "lib/assets/logos/app_icon.png"
```

## Gerar ícones

Após adicionar `app_icon.png` (1024x1024 px) em `lib/assets/logos/`:

```bash
dart run flutter_launcher_icons
```

ou

```bash
flutter pub run flutter_launcher_icons
```
