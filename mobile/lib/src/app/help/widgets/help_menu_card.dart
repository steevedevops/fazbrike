import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/help/models/help_models.dart';

/// Atalhos de ajuda e políticas: usados na central de ajuda e no perfil.
class HelpMenuCard extends StatelessWidget {
  const HelpMenuCard({super.key, this.showHelpCenter = true, this.showMyRequests = true});

  /// No perfil o card abre a central; dentro da central o atalho é redundante.
  final bool showHelpCenter;
  final bool showMyRequests;

  @override
  Widget build(BuildContext context) => Card(
        margin: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
        child: Column(children: [
          if (showHelpCenter)
            _tile(context, Icons.help_outline, 'Central de ajuda', '/ajuda'),
          _tile(context, Icons.support_agent_outlined, 'Fale com a gente', '/ajuda/contato'),
          if (showMyRequests)
            _tile(context, Icons.inbox_outlined, 'Meus chamados', '/ajuda/chamados'),
          const Divider(height: 1),
          for (final document in legalDocuments)
            _tile(context, Icons.description_outlined, document.label, '/legal/${document.value}'),
        ]),
      );

  Widget _tile(BuildContext context, IconData icon, String label, String route) => ListTile(
        leading: Icon(icon),
        title: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.push(route),
      );
}
