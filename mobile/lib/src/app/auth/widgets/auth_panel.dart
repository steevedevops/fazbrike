import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fazbrike/services/models/api_exception.dart';
import 'package:fazbrike/src/app/auth/controllers/auth_controller.dart';
import 'package:fazbrike/src/app/auth/widgets/auth_brand_header.dart';
import 'package:fazbrike/src/app/auth/widgets/auth_field.dart';
import 'package:fazbrike/src/app/auth/widgets/auth_mode_tabs.dart';
import 'package:fazbrike/src/app/auth/widgets/password_strength_bar.dart';
import 'package:fazbrike/src/theme/app_colors.dart';
import 'package:fazbrike/src/theme/app_radius.dart';
import 'package:fazbrike/src/theme/app_spacing.dart';

/// Senha mínima aceita pelo `POST /api/auth/register`.
const _minPasswordLength = 8;

class AuthPanel extends ConsumerStatefulWidget {
  const AuthPanel({super.key});
  @override
  ConsumerState<AuthPanel> createState() => _AuthPanelState();
}

class _AuthPanelState extends ConsumerState<AuthPanel> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _register = false;
  bool _remember = false;
  bool _obscure = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    SharedPreferences.getInstance().then((prefs) {
      final remembered = prefs.getString('fazbrike_remember');
      if (remembered != null && mounted) setState(() { _email.text = remembered; _remember = true; });
    });
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _error = '');
    try {
      final form = ref.read(authFormProvider.notifier);
      if (_register) {
        final email = await form.register(_name.text, _email.text, _password.text);
        if (mounted) context.go('/verificar-email?email=${Uri.encodeQueryComponent(email)}');
      } else {
        await form.login(_email.text, _password.text);
        final prefs = await SharedPreferences.getInstance();
        if (_remember) {
          await prefs.setString('fazbrike_remember', _email.text.trim());
        } else {
          await prefs.remove('fazbrike_remember');
        }
        if (mounted) context.go('/');
      }
    } catch (error) {
      if (!mounted) return;
      final apiError = error is ApiException ? error : null;
      if (!_register && apiError?.details is Map && apiError!.details['email_verified'] == false) {
        context.go('/verificar-email?email=${Uri.encodeQueryComponent(_email.text.trim())}');
      } else {
        setState(() => _error = error.toString());
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final busy = ref.watch(authFormProvider).isLoading;

    return ListView(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, AppSpacing.xxl),
      children: [
        const AuthBrandHeader(),
        const SizedBox(height: AppSpacing.xl),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AuthModeTabs(
                  isRegister: _register,
                  onChanged: busy
                      ? null
                      : (value) => setState(() {
                            _register = value;
                            _error = '';
                            _formKey.currentState?.reset();
                          }),
                ),
                const SizedBox(height: AppSpacing.xl),
                Text(
                  _register ? 'Junte-se à comunidade Fazbrike.' : 'Acesse sua conta para continuar.',
                  style: theme.textTheme.bodyLarge?.copyWith(color: theme.textTheme.bodySmall?.color),
                ),
                const SizedBox(height: AppSpacing.lg),
                if (_error.isNotEmpty) ...[
                  _ErrorBanner(message: _error),
                  const SizedBox(height: AppSpacing.lg),
                ],
                Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: _register ? _registerFields() : _loginFields(),
                  ),
                ),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: busy ? null : _submit,
                    style: _inkButtonStyle(context),
                    child: Text(
                      busy
                          ? (_register ? 'Criando conta...' : 'Entrando...')
                          : (_register ? 'Criar conta' : 'Entrar'),
                    ),
                  ),
                ),
                if (_register) ...[
                  const SizedBox(height: AppSpacing.lg),
                  Text(
                    'Ao criar uma conta você concorda com os termos de uso e a política de privacidade.',
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  List<Widget> _loginFields() => [
        AuthField(
          label: 'Email',
          controller: _email,
          hint: 'seu@email.com',
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          autofillHints: const [AutofillHints.email],
          validator: _validateEmail,
        ),
        AuthField(
          label: 'Senha',
          controller: _password,
          hint: 'Sua senha',
          obscureText: _obscure,
          autofillHints: const [AutofillHints.password],
          suffixIcon: _visibilityToggle(),
          validator: (value) => (value?.isEmpty ?? true) ? 'Informe sua senha.' : null,
        ),
        _RememberRow(
          value: _remember,
          onChanged: (value) => setState(() => _remember = value),
        ),
        const SizedBox(height: AppSpacing.lg),
      ];

  List<Widget> _registerFields() => [
        AuthField(
          label: 'Nome completo',
          controller: _name,
          hint: 'Seu nome completo',
          textInputAction: TextInputAction.next,
          autofillHints: const [AutofillHints.name],
          validator: (value) => (value?.trim().length ?? 0) < 2 ? 'Informe seu nome completo.' : null,
        ),
        AuthField(
          label: 'Email',
          controller: _email,
          hint: 'seu@email.com',
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          autofillHints: const [AutofillHints.email],
          validator: _validateEmail,
        ),
        AuthField(
          label: 'Senha',
          controller: _password,
          hint: 'Mínimo $_minPasswordLength caracteres',
          obscureText: _obscure,
          autofillHints: const [AutofillHints.newPassword],
          suffixIcon: _visibilityToggle(),
          onChanged: (_) => setState(() {}),
          validator: (value) => (value?.length ?? 0) < _minPasswordLength
              ? 'A senha deve ter pelo menos $_minPasswordLength caracteres.'
              : null,
        ),
        PasswordStrengthBar(password: _password.text),
        AuthField(
          label: 'Confirmar senha',
          controller: _confirm,
          hint: 'Confirme sua senha',
          obscureText: _obscure,
          suffixIcon: _visibilityToggle(),
          validator: (value) => value != _password.text ? 'As senhas não coincidem.' : null,
        ),
      ];

  String? _validateEmail(String? value) =>
      RegExp(r'^\S+@\S+\.\S+$').hasMatch(value?.trim() ?? '') ? null : 'Informe um email válido.';

  Widget _visibilityToggle() => IconButton(
        onPressed: () => setState(() => _obscure = !_obscure),
        tooltip: _obscure ? 'Mostrar senha' : 'Ocultar senha',
        icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
      );
}

/// CTA no tom do site (`btnInkClass`): preto no claro, claro no escuro — nunca
/// texto sem contraste sobre o fundo do botão.
ButtonStyle _inkButtonStyle(BuildContext context) {
  final scheme = Theme.of(context).colorScheme;
  return FilledButton.styleFrom(
    backgroundColor: scheme.onSurface,
    foregroundColor: scheme.surface,
    disabledBackgroundColor: scheme.onSurface.withValues(alpha: .5),
    disabledForegroundColor: scheme.surface.withValues(alpha: .9),
  );
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.danger.withValues(alpha: .08),
          borderRadius: BorderRadius.circular(AppRadius.control),
        ),
        child: Text(
          message,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.danger),
        ),
      );
}

class _RememberRow extends StatelessWidget {
  const _RememberRow({required this.value, required this.onChanged});

  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    // Flexible nos dois lados: em telas estreitas (ou com fonte ampliada) os
    // rótulos encurtam em vez de estourar a linha.
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Flexible(
          child: InkWell(
            onTap: () => onChanged(!value),
            borderRadius: BorderRadius.circular(AppRadius.chip),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(0, 4, AppSpacing.sm, 4),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 24,
                    height: 24,
                    child: Checkbox(
                      value: value,
                      onChanged: (next) => onChanged(next ?? false),
                      visualDensity: VisualDensity.compact,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Flexible(
                    child: Text(
                      'Lembrar de mim',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        Flexible(
          child: Text(
            'Esqueceu a senha?',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.right,
            style: theme.textTheme.bodySmall,
          ),
        ),
      ],
    );
  }
}
