import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/help/models/help_models.dart';
import 'package:fazbrike/src/app/items/controllers/item_controller.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Mesmos motivos de `itemReportReasons` no backend.
const reportReasons = [
  HelpOption('prohibited_item', 'Produto proibido ou ilegal'),
  HelpOption('fraud', 'Suspeita de fraude'),
  HelpOption('misleading', 'Informações enganosas'),
  HelpOption('duplicate', 'Anúncio duplicado'),
  HelpOption('offensive', 'Conteúdo ofensivo'),
  HelpOption('other', 'Outro motivo'),
];

/// Folha de denúncia do anúncio. Fecha devolvendo a mensagem da API.
class ReportItemSheet extends ConsumerStatefulWidget {
  const ReportItemSheet({super.key, required this.itemId});
  final int itemId;

  @override
  ConsumerState<ReportItemSheet> createState() => _ReportItemSheetState();
}

class _ReportItemSheetState extends ConsumerState<ReportItemSheet> {
  final _details = TextEditingController();
  String _reason = 'misleading';
  bool _sending = false;
  String _error = '';

  @override
  void dispose() {
    _details.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_reason == 'other' && _details.text.trim().isEmpty) {
      setState(() => _error = 'Descreva o problema ao selecionar outro motivo.');
      return;
    }
    setState(() {
      _sending = true;
      _error = '';
    });
    try {
      final message = await ref.read(itemFormProvider.notifier).report(widget.itemId, _reason, _details.text);
      if (mounted) Navigator.of(context).pop(message);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, mainAxisSize: MainAxisSize.min, children: [
          Text('Denunciar anúncio', style: theme.textTheme.titleLarge),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'A denúncia será analisada pela equipe e o anunciante não saberá quem denunciou.',
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: AppSpacing.md),
          RadioGroup<String>(
            groupValue: _reason,
            onChanged: (value) => setState(() => _reason = value ?? _reason),
            child: Column(children: [
              for (final option in reportReasons)
                RadioListTile<String>(
                  value: option.value,
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  title: Text(option.label),
                ),
            ]),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _details,
            maxLength: 1000,
            minLines: 3,
            maxLines: 5,
            decoration: InputDecoration(
              labelText: _reason == 'other' ? 'Detalhes (obrigatório)' : 'Detalhes (opcional)',
              hintText: 'Descreva o problema para ajudar na análise',
              alignLabelWithHint: true,
            ),
          ),
          if (_error.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(_error, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.error)),
          ],
          const SizedBox(height: AppSpacing.md),
          FilledButton(
            onPressed: _sending ? null : _submit,
            child: Text(_sending ? 'Enviando...' : 'Enviar denúncia'),
          ),
          TextButton(
            onPressed: () => context.push('/legal/regras-de-publicacao'),
            child: const Text('Ver regras de publicação'),
          ),
        ]),
      ),
    );
  }
}
