import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fazbrike/src/app/auth/controllers/auth_controller.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// "Continuar com Google/Apple" nas abas Entrar e Criar conta.
class SocialLoginButtons extends ConsumerStatefulWidget {
  const SocialLoginButtons({super.key, required this.onError});

  /// Mensagem para o banner de erro do painel.
  final ValueChanged<String> onError;

  @override
  ConsumerState<SocialLoginButtons> createState() => _SocialLoginButtonsState();
}

class _SocialLoginButtonsState extends ConsumerState<SocialLoginButtons> {
  SocialProvider? _busy;

  Future<void> _login(SocialProvider provider) async {
    widget.onError('');
    setState(() => _busy = provider);
    try {
      await ref.read(authFormProvider.notifier).socialLogin(provider);
      if (mounted) context.go('/');
    } on SocialLoginCancelled {
      // Fechou a tela do provedor: nada a mostrar.
    } catch (error) {
      widget.onError(error.toString());
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final disabled = _busy != null;
    final buttonStyle = OutlinedButton.styleFrom(
      minimumSize: const Size.fromHeight(56),
      textStyle: theme.textTheme.titleMedium,
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: AppSpacing.xl),
        Row(children: [
          const Expanded(child: Divider()),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            child: Text('ou', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500)),
          ),
          const Expanded(child: Divider()),
        ]),
        const SizedBox(height: AppSpacing.xl),
        OutlinedButton.icon(
          onPressed: disabled ? null : () => _login(SocialProvider.google),
          icon: const _GoogleMark(),
          label: Text(
            _busy == SocialProvider.google ? 'Conectando...' : 'Continuar com Google',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          style: buttonStyle,
        ),
        const SizedBox(height: AppSpacing.md),
        OutlinedButton.icon(
          onPressed: disabled ? null : () => _login(SocialProvider.apple),
          icon: const Icon(Icons.apple, size: 22),
          label: Text(
            _busy == SocialProvider.apple ? 'Conectando...' : 'Continuar com Apple',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          style: buttonStyle,
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(
          'Ao continuar com Google ou Apple, você concorda com os Termos de uso e a Política de privacidade e declara ter 18 anos ou mais.',
          style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w500, height: 1.45),
        ),
      ],
    );
  }
}

/// "G" do Google nas cores da marca, sem depender de asset.
class _GoogleMark extends StatelessWidget {
  const _GoogleMark();

  @override
  Widget build(BuildContext context) => const SizedBox(
        width: 22,
        height: 22,
        child: Center(
          child: Text(
            'G',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF4285F4), height: 1),
          ),
        ),
      );
}
