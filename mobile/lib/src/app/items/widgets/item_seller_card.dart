import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:fazbrike/src/app/items/models/item_model.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Cartão do anunciante com atalho para o perfil público.
class ItemSellerCard extends StatelessWidget {
  const ItemSellerCard({super.key, required this.item});
  final ItemModel item;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final name = (item.user?.name ?? '').trim().isEmpty ? 'Vendedor' : item.user!.name.trim();
    final since = item.user?.createdAt;
    return Card(
      margin: EdgeInsets.zero,
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/usuario/${item.userId}'),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Row(children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: theme.colorScheme.onSurface,
              foregroundColor: theme.colorScheme.surface,
              child: Text(name.characters.first.toUpperCase(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Anunciante', style: theme.textTheme.bodySmall),
                Text(name, style: theme.textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
                if (since != null)
                  Text(
                    'No Fazbrike desde ${DateFormat('MMMM \'de\' yyyy', 'pt_BR').format(since.toLocal())}',
                    style: theme.textTheme.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
              ]),
            ),
            const SizedBox(width: AppSpacing.sm),
            Icon(Icons.chevron_right, semanticLabel: 'Ver perfil', color: theme.textTheme.bodySmall?.color),
          ]),
        ),
      ),
    );
  }
}
