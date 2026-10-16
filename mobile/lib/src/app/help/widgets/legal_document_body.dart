import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/help/models/help_models.dart';
import 'package:fazbrike/src/shared/utils/app_utils.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Texto do documento legal renderizado a partir dos blocos (sem HTML).
class LegalDocumentBody extends StatelessWidget {
  const LegalDocumentBody({super.key, required this.document});
  final LegalDocumentModel document;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final meta = [
      if (document.version.isNotEmpty) 'Versão ${document.version}',
      if (document.updatedAt != null) 'Atualizado em ${formatDate(document.updatedAt!)}',
    ].join(' · ');

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        Text(document.title, style: theme.textTheme.headlineSmall),
        if (document.summary.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sm),
          Text(document.summary, style: theme.textTheme.bodyMedium),
        ],
        if (meta.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sm),
          Text(meta, style: theme.textTheme.bodySmall),
        ],
        const Divider(height: AppSpacing.xxl),
        for (final block in document.blocks) _block(theme, block),
        const SizedBox(height: AppSpacing.xl),
        OutlinedButton.icon(
          onPressed: () => context.push('/ajuda/contato'),
          icon: const Icon(Icons.support_agent_outlined),
          label: const Text('Dúvidas? Fale com a gente'),
        ),
      ],
    );
  }

  Widget _block(ThemeData theme, LegalBlock block) => switch (block.kind) {
        LegalBlockKind.heading => Padding(
            padding: const EdgeInsets.only(top: AppSpacing.lg, bottom: AppSpacing.sm),
            child: Text(block.text, style: theme.textTheme.titleMedium),
          ),
        LegalBlockKind.list => Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final item in block.items)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('•  ', style: theme.textTheme.bodyMedium),
                      Expanded(child: Text(item, style: theme.textTheme.bodyMedium)),
                    ]),
                  ),
              ],
            ),
          ),
        LegalBlockKind.paragraph => Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: Text(block.text, style: theme.textTheme.bodyMedium?.copyWith(height: 1.5)),
          ),
      };
}
