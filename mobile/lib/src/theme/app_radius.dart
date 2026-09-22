/// Raios do Fazbrike Design System v1, espelhando as variáveis `--radius-*`
/// de `frontend/src/app/globals.css`.
class AppRadius {
  const AppRadius._();

  /// `--radius-chip` — chips e filtros.
  static const double chip = 11;

  /// `--radius-control` — inputs, botões e demais controles.
  static const double control = 12;

  /// `--radius-card` — cards, painéis e caixas de conteúdo.
  static const double card = 12;

  /// `--radius-pill` — avatares, badges e círculos de ícone.
  static const double pill = 999;

  /// Raio menor, para thumbnails dentro de um card já arredondado.
  static const double thumb = 8;
}
