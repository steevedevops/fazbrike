import 'package:flutter/material.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Descrição recolhida em 6 linhas, com "Ver mais" quando passa disso.
class ItemDescription extends StatefulWidget {
  const ItemDescription({super.key, required this.text});
  final String text;
  @override
  State<ItemDescription> createState() => _ItemDescriptionState();
}

class _ItemDescriptionState extends State<ItemDescription> {
  static const _collapsedLines = 6;
  bool expanded = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final style = theme.textTheme.bodyMedium;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Descrição', style: theme.textTheme.titleLarge),
        const SizedBox(height: AppSpacing.sm),
        LayoutBuilder(builder: (context, constraints) {
          final painter = TextPainter(
            text: TextSpan(text: widget.text, style: style),
            maxLines: _collapsedLines,
            textDirection: Directionality.of(context),
            textScaler: MediaQuery.textScalerOf(context),
          )..layout(maxWidth: constraints.maxWidth);
          final overflows = painter.didExceedMaxLines;
          painter.dispose();
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.text,
                style: style,
                maxLines: expanded ? null : _collapsedLines,
                overflow: expanded ? TextOverflow.visible : TextOverflow.ellipsis,
              ),
              if (overflows)
                TextButton(
                  onPressed: () => setState(() => expanded = !expanded),
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    foregroundColor: theme.colorScheme.onSurface,
                    textStyle: theme.textTheme.titleSmall?.copyWith(decoration: TextDecoration.underline),
                  ),
                  child: Text(expanded ? 'Ver menos' : 'Ver mais'),
                ),
            ],
          );
        }),
      ],
    );
  }
}
