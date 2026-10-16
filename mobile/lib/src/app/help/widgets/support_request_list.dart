import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/help/models/help_models.dart';
import 'package:fazbrike/src/app/help/widgets/support_request_tile.dart';
import 'package:fazbrike/src/shared/widgets/empty_view.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class SupportRequestList extends StatelessWidget {
  const SupportRequestList({super.key, required this.requests});
  final List<SupportRequestModel> requests;

  @override
  Widget build(BuildContext context) {
    if (requests.isEmpty) {
      // ListView para o pull-to-refresh continuar funcionando com a lista vazia.
      return ListView(children: [
        SizedBox(
          height: 420,
          child: EmptyView(
            title: 'Você ainda não abriu chamados',
            description: 'Se precisar de ajuda, confira as perguntas frequentes ou fale com a equipe.',
            action: FilledButton(onPressed: () => context.push('/ajuda'), child: const Text('Ir para a central de ajuda')),
          ),
        ),
      ]);
    }
    return ListView.builder(
      padding: const EdgeInsets.all(AppSpacing.lg),
      itemCount: requests.length,
      itemBuilder: (_, index) => SupportRequestTile(request: requests[index]),
    );
  }
}
