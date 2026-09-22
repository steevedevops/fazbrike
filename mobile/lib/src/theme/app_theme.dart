import 'package:flutter/material.dart';
import 'package:fazbrike/src/theme/app_colors.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_text_styles.dart';

/// Tema do app espelhando os utilitários de `frontend/src/lib/ui-classes.ts`:
/// `fieldClass` (inputs), `btnPrimaryClass`/`btnSecondaryClass` (botões),
/// `panelClass` (cards) e `chipClass` (chips).
class AppTheme {
  const AppTheme._();

  /// Altura mínima dos controles. A web usa `min-h-11` (44px); no mobile
  /// subimos para 48 por ser o alvo de toque mínimo recomendado no Material.
  static const double _controlHeight = 48;

  static ThemeData get lightTheme => _build(
        brightness: Brightness.light,
        canvas: AppColors.canvas,
        surface: AppColors.surface,
        subtle: AppColors.subtle,
        border: AppColors.border,
        ink: AppColors.ink,
        muted: AppColors.muted,
        textTheme: AppTextStyles.light,
      );

  static ThemeData get darkTheme => _build(
        brightness: Brightness.dark,
        canvas: AppColors.darkCanvas,
        surface: AppColors.darkSurface,
        subtle: AppColors.darkSubtle,
        border: AppColors.darkBorder,
        ink: Colors.white,
        muted: AppColors.neutral400,
        textTheme: AppTextStyles.dark,
      );

  static ThemeData _build({
    required Brightness brightness,
    required Color canvas,
    required Color surface,
    required Color subtle,
    required Color border,
    required Color ink,
    required Color muted,
    required TextTheme textTheme,
  }) {
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.brand500,
      brightness: brightness,
      primary: AppColors.brand500,
      onPrimary: Colors.white,
      secondary: AppColors.sage,
      onSecondary: Colors.white,
      surface: surface,
      onSurface: ink,
      error: AppColors.danger,
      onError: Colors.white,
      outline: border,
    );

    OutlineInputBorder fieldBorder(Color color, [double width = 1]) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.control),
          borderSide: BorderSide(color: color, width: width),
        );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: canvas,
      canvasColor: canvas,
      textTheme: textTheme,

      appBarTheme: AppBarTheme(
        backgroundColor: surface,
        foregroundColor: ink,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: textTheme.titleLarge,
        shape: Border(bottom: BorderSide(color: border)),
      ),

      // panelClass: bg-surface + border + rounded-card + shadow-card
      cardTheme: CardThemeData(
        color: surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.card),
          side: BorderSide(color: border),
        ),
      ),

      // fieldClass: bg-subtle + border + rounded-control + type-body
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: subtle,
        constraints: const BoxConstraints(minHeight: _controlHeight),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        hintStyle: textTheme.bodyLarge?.copyWith(color: muted),
        labelStyle: textTheme.bodySmall?.copyWith(color: muted),
        floatingLabelStyle: textTheme.bodySmall?.copyWith(color: ink),
        helperStyle: textTheme.bodySmall,
        errorStyle: textTheme.bodySmall?.copyWith(color: AppColors.danger),
        prefixIconColor: muted,
        suffixIconColor: muted,
        border: fieldBorder(border),
        enabledBorder: fieldBorder(border),
        // A web marca o foco com um anel de 2px na cor ink.
        focusedBorder: fieldBorder(ink, 2),
        errorBorder: fieldBorder(AppColors.danger),
        focusedErrorBorder: fieldBorder(AppColors.danger, 2),
        disabledBorder: fieldBorder(border),
      ),

      // btnPrimaryClass: bg-brand-500 text-white
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.brand500,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.brand500.withValues(alpha: .5),
          disabledForegroundColor: Colors.white.withValues(alpha: .9),
          minimumSize: const Size(0, _controlHeight),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          textStyle: textTheme.labelLarge,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.control),
          ),
        ),
      ),

      // btnSecondaryClass: bg-surface + text-ink + border
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          backgroundColor: surface,
          foregroundColor: ink,
          minimumSize: const Size(0, _controlHeight),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          textStyle: textTheme.labelLarge,
          side: BorderSide(color: border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.control),
          ),
        ),
      ),

      // btnGhostClass: transparente, texto ink
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: ink,
          minimumSize: const Size(0, _controlHeight),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          textStyle: textTheme.labelLarge,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.control),
          ),
        ),
      ),

      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(foregroundColor: muted),
      ),

      // chipClass: rounded-pill + bg-surface + border + type-meta
      chipTheme: ChipThemeData(
        backgroundColor: surface,
        selectedColor: ink,
        checkmarkColor: Colors.white,
        side: BorderSide(color: border),
        labelStyle: textTheme.bodySmall?.copyWith(color: ink),
        secondaryLabelStyle: textTheme.bodySmall?.copyWith(color: Colors.white),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        shape: const StadiumBorder(),
      ),

      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        indicatorColor: AppColors.brand50,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        labelTextStyle: WidgetStatePropertyAll(textTheme.bodySmall),
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            color: states.contains(WidgetState.selected) ? AppColors.brand600 : muted,
          ),
        ),
      ),

      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.card)),
        ),
      ),

      dialogTheme: DialogThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.card),
        ),
      ),

      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.ink,
        contentTextStyle: textTheme.bodyMedium?.copyWith(color: Colors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.control),
        ),
      ),

      dividerTheme: DividerThemeData(color: border, space: 1, thickness: 1),

      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.brand500,
      ),
    );
  }
}
