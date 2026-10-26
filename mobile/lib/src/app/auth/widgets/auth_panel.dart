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
import 'package:fazbrike/src/app/auth/widgets/social_login_buttons.dart';
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
  int _registerStep = 0;
  bool _remember = false;
  bool _acceptTerms = false;
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

  void _nextRegisterStep() {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _error = '';
      _registerStep += 1;
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_register && !_acceptTerms) {
      setState(() => _error = 'Aceite os Termos de uso e a Política de privacidade para criar a conta.');
      return;
    }
    setState(() => _error = '');
    try {
      final form = ref.read(authFormProvider.notifier);
      if (_register) {
        final email = await form.register(_name.text, _email.text, _password.text, acceptTerms: _acceptTerms);
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

    return LayoutBuilder(
      builder: (context, constraints) {
        final minHeight = constraints.maxHeight - 32;
        return Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: SingleChildScrollView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.sm, AppSpacing.xl, AppSpacing.xl),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: minHeight < 0 ? 0 : minHeight),
                child: IntrinsicHeight(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const AuthBrandHeader(),
                      const SizedBox(height: AppSpacing.xxl),
                      Text(
                        _register ? 'Criar conta' : 'Entrar',
                        style: theme.textTheme.headlineSmall,
                      ),
                      if (_register) ...[
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'Passo ${_registerStep + 1} de 3',
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ],
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        _register ? _registerHelp : 'Acesse sua conta para continuar.',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                          height: 1.4,
                          color: theme.textTheme.bodySmall?.color,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xxl),
                      if (_error.isNotEmpty) ...[
                        _ErrorBanner(message: _error),
                        const SizedBox(height: AppSpacing.xl),
                      ],
                      Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: _register ? _registerFields() : _loginFields(),
                        ),
                      ),
                      _accountActions(busy, theme),
                      if (!_register || _registerStep == 0)
                        SocialLoginButtons(onError: (message) => setState(() => _error = message)),
                      const SizedBox(height: AppSpacing.lg),
                      AuthModeTabs(
                        isRegister: _register,
                        onChanged: busy
                            ? null
                            : (value) => setState(() {
                                  _register = value;
                                  _registerStep = 0;
                                  _error = '';
                                  _formKey.currentState?.reset();
                                }),
                      ),
                      const Spacer(),
                      const SizedBox(height: AppSpacing.lg),
                      TextButton.icon(
                        onPressed: () => context.push('/ajuda'),
                        icon: const Icon(Icons.help_outline, size: 22),
                        label: const Text('Central de ajuda'),
                        style: TextButton.styleFrom(
                          foregroundColor: theme.colorScheme.onSurface,
                          minimumSize: const Size.fromHeight(48),
                          textStyle: theme.textTheme.titleMedium,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
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
          // Ainda não há recuperação de senha automática: o pedido vai para o suporte.
          onForgot: () => context.push('/ajuda/contato?assunto=conta'),
        ),
        const SizedBox(height: AppSpacing.sm),
      ];

  String get _registerHelp => switch (_registerStep) {
        0 => 'Junte-se à comunidade Fazbrike.',
        1 => 'Escolha uma senha para entrar depois.',
        _ => 'Aceite os termos para abrir a conta.',
      };

  Widget _accountActions(bool busy, ThemeData theme) {
    final onLastStep = _register && _registerStep == 2;
    final label = busy
        ? (_register ? 'Criando conta...' : 'Entrando...')
        : onLastStep
            ? 'Criar conta'
            : _register
                ? 'Continuar'
                : 'Entrar';
    final onPressed = busy ? null : (_register && _registerStep < 2 ? _nextRegisterStep : _submit);
    final primary = FilledButton(
      onPressed: onPressed,
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(56),
        textStyle: theme.textTheme.titleMedium,
      ),
      child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis),
    );
    if (!_register || _registerStep == 0) return primary;
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: busy
                ? null
                : () => setState(() {
                      _registerStep -= 1;
                      _error = '';
                    }),
            style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(56)),
            child: const Text('Voltar'),
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(flex: 2, child: primary),
      ],
    );
  }

  List<Widget> _registerFields() => switch (_registerStep) {
        0 => [
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
              textInputAction: TextInputAction.done,
              autofillHints: const [AutofillHints.email],
              validator: _validateEmail,
            ),
          ],
        1 => [
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
              textInputAction: TextInputAction.done,
              suffixIcon: _visibilityToggle(),
              validator: (value) => value != _password.text ? 'As senhas não coincidem.' : null,
            ),
          ],
        _ => [
            _TermsRow(
              value: _acceptTerms,
              onChanged: (value) => setState(() {
                _acceptTerms = value;
                if (value) _error = '';
              }),
            ),
            const SizedBox(height: AppSpacing.sm),
          ],
      };

  String? _validateEmail(String? value) =>
      RegExp(r'^\S+@\S+\.\S+$').hasMatch(value?.trim() ?? '') ? null : 'Informe um email válido.';

  Widget _visibilityToggle() => IconButton(
        onPressed: () => setState(() => _obscure = !_obscure),
        tooltip: _obscure ? 'Mostrar senha' : 'Ocultar senha',
        icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
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
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w500,
                color: AppColors.danger,
                height: 1.4,
              ),
        ),
      );
}

class _RememberRow extends StatelessWidget {
  const _RememberRow({required this.value, required this.onChanged, required this.onForgot});

  final bool value;
  final ValueChanged<bool> onChanged;
  final VoidCallback onForgot;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final label = theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        InkWell(
          onTap: () => onChanged(!value),
          borderRadius: BorderRadius.circular(AppRadius.control),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 48),
            child: Row(
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
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Text(
                    'Lembrar de mim',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: label,
                  ),
                ),
              ],
            ),
          ),
        ),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton(
            onPressed: onForgot,
            style: TextButton.styleFrom(
              foregroundColor: theme.colorScheme.onSurface,
              minimumSize: const Size(48, 48),
              padding: EdgeInsets.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              alignment: Alignment.centerLeft,
              textStyle: label?.copyWith(decoration: TextDecoration.underline),
            ),
            child: const Text('Esqueceu a senha?', maxLines: 1, overflow: TextOverflow.ellipsis),
          ),
        ),
      ],
    );
  }
}

/// Aceite obrigatório no cadastro, com acesso aos textos completos.
class _TermsRow extends StatelessWidget {
  const _TermsRow({required this.value, required this.onChanged});

  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final label = theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500, height: 1.4);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InkWell(
          onTap: () => onChanged(!value),
          borderRadius: BorderRadius.circular(AppRadius.control),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
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
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    'Li e aceito os Termos de uso e a Política de privacidade, e declaro ter 18 anos ou mais.',
                    style: label,
                  ),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 40),
          child: Wrap(
            spacing: AppSpacing.md,
            children: [
              _link(context, 'Ler termos de uso', '/legal/termos-de-uso'),
              _link(context, 'Ler política de privacidade', '/legal/politica-de-privacidade'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _link(BuildContext context, String label, String route) => InkWell(
        onTap: () => context.push(route),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 44),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Text(
              label,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    decoration: TextDecoration.underline,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
        ),
      );
}
