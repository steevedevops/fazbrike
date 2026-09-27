import 'package:flutter/material.dart';
import 'package:fazbrike/src/theme/app_colors.dart';

/// Marca do Fazbrike para a AppBar: quadrado terracota com o "F" e o wordmark.
///
/// Desenhada em vez de usar `lib/assets/logos/fazbrike_logo.png` porque o
/// arquivo tem fundo creme fixo — ele apareceria como um bloco sobre a
/// superfície branca da AppBar e sobre o tema escuro. Aqui a cor do wordmark
/// acompanha o tema.
class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.markSize = 28, this.showWordmark = true});

  final double markSize;
  final bool showWordmark;

  @override
  Widget build(BuildContext context) {
    final mark = Container(
      width: markSize,
      height: markSize,
      decoration: BoxDecoration(
        color: AppColors.brand500,
        borderRadius: BorderRadius.circular(markSize * .28),
      ),
      alignment: Alignment.center,
      child: Text(
        'F',
        style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: Colors.white,
              fontSize: markSize * .62,
              fontWeight: FontWeight.w800,
              height: 1,
            ),
      ),
    );

    if (!showWordmark) return Semantics(label: 'Fazbrike', child: mark);

    return Semantics(
      label: 'Fazbrike',
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          mark,
          const SizedBox(width: 8),
          Text(
            'fazbrike',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.6,
                ),
          ),
        ],
      ),
    );
  }
}
