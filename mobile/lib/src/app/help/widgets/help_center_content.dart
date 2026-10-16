import 'package:flutter/material.dart';
import 'package:fazbrike/src/app/help/models/help_models.dart';
import 'package:fazbrike/src/app/help/widgets/help_article_list.dart';
import 'package:fazbrike/src/app/help/widgets/help_menu_card.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Corpo da central: perguntas frequentes seguidas de atalhos e políticas.
class HelpCenterContent extends StatelessWidget {
  const HelpCenterContent({super.key, required this.articles});
  final List<HelpArticleModel> articles;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        Text('Como podemos ajudar?', style: theme.textTheme.titleLarge),
        const SizedBox(height: AppSpacing.md),
        HelpArticleList(articles: articles),
        const SizedBox(height: AppSpacing.lg),
        Text('Ainda precisa de ajuda?', style: theme.textTheme.titleMedium),
        const SizedBox(height: AppSpacing.sm),
        const HelpMenuCard(showHelpCenter: false),
        const SizedBox(height: AppSpacing.lg),
        Text(
          'Para denunciar um anúncio, abra a página dele e toque no ícone de bandeira.',
          style: theme.textTheme.bodySmall,
        ),
      ],
    );
  }
}
