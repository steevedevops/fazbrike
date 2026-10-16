import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/auth/controllers/auth_controller.dart';
import 'package:fazbrike/src/app/help/controllers/help_controller.dart';
import 'package:fazbrike/src/app/help/models/help_models.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Formulário "Fale com a gente". Visitante informa nome e e-mail; logado,
/// a API usa os dados da conta.
class SupportRequestForm extends ConsumerStatefulWidget {
  const SupportRequestForm({super.key, this.initialTopic = 'conta', this.itemId});
  final String initialTopic;
  final int? itemId;

  @override
  ConsumerState<SupportRequestForm> createState() => _SupportRequestFormState();
}

class _SupportRequestFormState extends ConsumerState<SupportRequestForm> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _subject = TextEditingController();
  final _message = TextEditingController();
  late String _topic = supportTopics.any((option) => option.value == widget.initialTopic)
      ? widget.initialTopic
      : 'conta';
  String _success = '';

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _subject.dispose();
    _message.dispose();
    super.dispose();
  }

  Future<void> _submit(bool authenticated) async {
    if (!_formKey.currentState!.validate()) return;
    try {
      final message = await ref.read(supportFormProvider.notifier).create({
        if (!authenticated) 'name': _name.text.trim(),
        if (!authenticated) 'email': _email.text.trim(),
        'topic': _topic,
        'subject': _subject.text.trim(),
        'message': _message.text.trim(),
        if (widget.itemId != null) 'item_id': widget.itemId,
      }, authenticated: authenticated);
      if (!mounted) return;
      setState(() {
        _success = message;
        _subject.clear();
        _message.clear();
      });
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authSessionProvider).value;
    final authenticated = user != null;
    final busy = ref.watch(supportFormProvider).isLoading;
    final theme = Theme.of(context);

    if (_success.isNotEmpty) {
      return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Icon(Icons.mark_email_read_outlined, size: 44),
        const SizedBox(height: AppSpacing.md),
        Text(_success, style: theme.textTheme.titleMedium, textAlign: TextAlign.center),
        const SizedBox(height: AppSpacing.sm),
        Text(
          authenticated ? 'A resposta aparece em Meus chamados.' : 'Vamos responder no e-mail informado.',
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.xl),
        if (authenticated)
          FilledButton(onPressed: () => context.push('/ajuda/chamados'), child: const Text('Ver meus chamados')),
        const SizedBox(height: AppSpacing.sm),
        OutlinedButton(onPressed: () => setState(() => _success = ''), child: const Text('Abrir outro chamado')),
      ]);
    }

    return Form(
      key: _formKey,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(
          'Não encontrou a resposta? Abra um chamado — respondemos em até 2 dias úteis.',
          style: theme.textTheme.bodyMedium,
        ),
        const SizedBox(height: AppSpacing.lg),
        if (authenticated)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: Text('Enviando como ${user.name} (${user.email}).', style: theme.textTheme.bodySmall),
          )
        else ...[
          TextFormField(
            controller: _name,
            maxLength: 120,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.name],
            decoration: const InputDecoration(labelText: 'Nome', counterText: ''),
            validator: (value) => (value?.trim().length ?? 0) < 2 ? 'Informe seu nome.' : null,
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            controller: _email,
            maxLength: 254,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.email],
            decoration: const InputDecoration(labelText: 'E-mail para resposta', counterText: ''),
            validator: (value) => RegExp(r'^\S+@\S+\.\S+$').hasMatch(value?.trim() ?? '')
                ? null
                : 'Informe um e-mail válido.',
          ),
          const SizedBox(height: AppSpacing.md),
        ],
        DropdownButtonFormField<String>(
          initialValue: _topic,
          isExpanded: true,
          decoration: const InputDecoration(labelText: 'Assunto'),
          items: [
            for (final option in supportTopics)
              DropdownMenuItem(
                value: option.value,
                child: Text(option.label, maxLines: 1, overflow: TextOverflow.ellipsis),
              ),
          ],
          onChanged: (value) => setState(() => _topic = value ?? 'conta'),
        ),
        if (_topic == 'exclusao_conta' && !authenticated)
          Padding(
            padding: const EdgeInsets.only(top: AppSpacing.sm),
            child: Text(
              'Para excluir a conta, entre com ela antes de abrir o chamado — assim confirmamos que o pedido é seu.',
              style: theme.textTheme.bodySmall,
            ),
          ),
        const SizedBox(height: AppSpacing.md),
        TextFormField(
          controller: _subject,
          maxLength: 120,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(labelText: 'Título', hintText: 'Resuma o problema em poucas palavras'),
          validator: (value) => (value?.trim().length ?? 0) < 3 ? 'Escreva um título com pelo menos 3 caracteres.' : null,
        ),
        const SizedBox(height: AppSpacing.sm),
        TextFormField(
          controller: _message,
          maxLength: 3000,
          minLines: 4,
          maxLines: 8,
          decoration: const InputDecoration(
            labelText: 'Mensagem',
            hintText: 'Conte o que aconteceu, com o máximo de detalhes',
            alignLabelWithHint: true,
          ),
          validator: (value) =>
              (value?.trim().length ?? 0) < 10 ? 'Descreva o problema com pelo menos 10 caracteres.' : null,
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Usamos esses dados só para responder ao seu chamado, conforme a Política de privacidade.',
          style: theme.textTheme.bodySmall,
        ),
        const SizedBox(height: AppSpacing.lg),
        FilledButton(
          onPressed: busy ? null : () => _submit(authenticated),
          child: Text(busy ? 'Enviando...' : 'Enviar chamado'),
        ),
      ]),
    );
  }
}
