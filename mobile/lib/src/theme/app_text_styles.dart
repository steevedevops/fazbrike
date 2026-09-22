import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fazbrike/src/theme/app_colors.dart';

/// Escala tipográfica do Fazbrike, espelhando as classes `.type-*` de
/// `frontend/src/app/globals.css`:
///
/// | web           | tamanho / altura / peso | slot do Flutter |
/// |---------------|-------------------------|-----------------|
/// | `.type-display` | 34 / 1.15 / 600       | headlineMedium  |
/// | `.type-title`   | 18 / 24 / 600         | titleLarge      |
/// | `.type-body`    | 15 / 24 / 500         | bodyLarge/Medium|
/// | `.type-meta`    | 13 / 20 / 500         | bodySmall       |
class AppTextStyles {
  const AppTextStyles._();

  static TextTheme get light => _scale(ink: AppColors.ink, muted: AppColors.muted);

  static TextTheme get dark => _scale(ink: Colors.white, muted: AppColors.neutral400);

  static TextTheme _scale({required Color ink, required Color muted}) {
    return GoogleFonts.manropeTextTheme().copyWith(
      // .type-display
      headlineMedium: GoogleFonts.manrope(
        fontSize: 34,
        height: 1.15,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.68, // -0.02em
        color: ink,
      ),
      headlineSmall: GoogleFonts.manrope(
        fontSize: 24,
        height: 1.2,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.36,
        color: ink,
      ),
      // .type-title
      titleLarge: GoogleFonts.manrope(
        fontSize: 18,
        height: 24 / 18,
        fontWeight: FontWeight.w600,
        color: ink,
      ),
      titleMedium: GoogleFonts.manrope(
        fontSize: 16,
        height: 24 / 16,
        fontWeight: FontWeight.w600,
        color: ink,
      ),
      titleSmall: GoogleFonts.manrope(
        fontSize: 15,
        height: 24 / 15,
        fontWeight: FontWeight.w600,
        color: ink,
      ),
      // .type-body
      bodyLarge: GoogleFonts.manrope(
        fontSize: 15,
        height: 24 / 15,
        fontWeight: FontWeight.w500,
        color: ink,
      ),
      bodyMedium: GoogleFonts.manrope(
        fontSize: 15,
        height: 24 / 15,
        fontWeight: FontWeight.w500,
        color: ink,
      ),
      // .type-meta
      bodySmall: GoogleFonts.manrope(
        fontSize: 13,
        height: 20 / 13,
        fontWeight: FontWeight.w500,
        color: muted,
      ),
      labelLarge: GoogleFonts.manrope(
        fontSize: 15,
        height: 24 / 15,
        fontWeight: FontWeight.w600,
      ),
      labelMedium: GoogleFonts.manrope(
        fontSize: 13,
        height: 20 / 13,
        fontWeight: FontWeight.w500,
        color: muted,
      ),
    );
  }
}
