import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/auth/controllers/auth_controller.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

class VerifyEmailForm extends ConsumerStatefulWidget {
  const VerifyEmailForm({super.key, required this.initialEmail});
  final String initialEmail;
  @override
  ConsumerState<VerifyEmailForm> createState() => _VerifyEmailFormState();
}

class _VerifyEmailFormState extends ConsumerState<VerifyEmailForm> {
  late final TextEditingController _email;
  final _code = TextEditingController();
  Timer? _timer;
  int _seconds = 60;
  String _feedback = '';
  bool _error = false;

  @override
  void initState() {
    super.initState();
    _email = TextEditingController(text: widget.initialEmail);
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_seconds > 0 && mounted) setState(() => _seconds--);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _email.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    if (!RegExp(r'^\d{6}$').hasMatch(_code.text)) {
      setState(() { _feedback = 'Informe o código de 6 dígitos.'; _error = true; });
      return;
    }
    try {
      await ref.read(authFormProvider.notifier).verifyCode(_email.text, _code.text);
      if (mounted) context.go('/');
    } catch (error) {
      if (mounted) setState(() { _feedback = error.toString(); _error = true; });
    }
  }

  Future<void> _resend() async {
    try {
      final message = await ref.read(authFormProvider.notifier).resendCode(_email.text);
      if (mounted) setState(() { _feedback = message; _error = false; _seconds = 60; });
    } catch (error) {
      if (mounted) setState(() { _feedback = error.toString(); _error = true; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final busy = ref.watch(authFormProvider).isLoading;
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        Text('Confirme seu email', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: AppSpacing.sm),
        const Text('Enviamos um código de 6 dígitos para ativar sua conta.'),
        const SizedBox(height: AppSpacing.xl),
        if (_feedback.isNotEmpty) ...[
          Text(_feedback, style: TextStyle(color: _error ? Theme.of(context).colorScheme.error : null)),
          const SizedBox(height: AppSpacing.md),
        ],
        TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email')),
        const SizedBox(height: AppSpacing.md),
        TextField(
          controller: _code,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          decoration: const InputDecoration(labelText: 'Código de verificação', counterText: ''),
        ),
        const SizedBox(height: AppSpacing.lg),
        FilledButton(onPressed: busy ? null : _verify, child: Text(busy ? 'Verificando...' : 'Verificar código')),
        const SizedBox(height: AppSpacing.sm),
        TextButton(
          onPressed: busy || _seconds > 0 ? null : _resend,
          child: Text(_seconds > 0 ? 'Reenviar código em ${_seconds}s' : 'Reenviar código'),
        ),
      ],
    );
  }
}
