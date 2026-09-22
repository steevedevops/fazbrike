import 'package:flutter/material.dart';

/// Tokens de cor do Fazbrike Design System v1 — terracota / carvão / creme.
///
/// Os valores espelham as variáveis `--color-*` de
/// `frontend/src/app/globals.css`. Ao mudar um token no site, mude o mesmo
/// token aqui para o app e a web continuarem com a mesma identidade.
class AppColors {
  const AppColors._();

  // Marca (terracota) — cor das ações primárias, igual ao `btnPrimaryClass`.
  static const brand50 = Color(0xFFF8E8DE);
  static const brand500 = Color(0xFFC45C26);
  static const brand600 = Color(0xFFA3481C);

  // Base
  static const ink = Color(0xFF1C1917);
  static const muted = Color(0xFF78716C);
  static const canvas = Color(0xFFFAF8F5);
  static const surface = Color(0xFFFFFFFF);
  static const subtle = Color(0xFFF3EFE8);
  static const border = Color(0xFFE7E0D6);

  // Semânticas
  static const sage = Color(0xFF6B8F71);
  static const success = Color(0xFF3F7D4E);
  static const danger = Color(0xFFB42318);
  static const warning = Color(0xFF7A5A16);

  // Escala neutra (--color-neutral-*)
  static const neutral50 = Color(0xFFFAF8F5);
  static const neutral100 = Color(0xFFF3EFE8);
  static const neutral200 = Color(0xFFE7E0D6);
  static const neutral300 = Color(0xFFD6CEC2);
  static const neutral400 = Color(0xFFA8A29E);
  static const neutral500 = Color(0xFF78716C);
  static const neutral600 = Color(0xFF57534E);
  static const neutral700 = Color(0xFF44403C);
  static const neutral800 = Color(0xFF292524);
  static const neutral900 = Color(0xFF1C1917);

  // Superfícies do tema escuro. A web não tem modo escuro, então estes não têm
  // token equivalente lá: são derivados da escala neutra da marca.
  static const darkCanvas = Color(0xFF16130F);
  static const darkSurface = Color(0xFF221E1A);
  static const darkSubtle = Color(0xFF2E2923);
  static const darkBorder = Color(0xFF3D362E);
}
