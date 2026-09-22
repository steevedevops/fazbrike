import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class BaseDash extends StatelessWidget {
  const BaseDash({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final index = location.startsWith('/catalogo') || location == '/geral'
        ? 1
        : location.startsWith('/vender')
            ? 2
            : location.startsWith('/mensagens')
                ? 3
                : location.startsWith('/perfil')
                    ? 4
                    : 0;
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) {
          const paths = ['/', '/catalogo', '/vender', '/mensagens', '/perfil'];
          context.go(paths[value]);
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Início'),
          NavigationDestination(icon: Icon(Icons.search), label: 'Explorar'),
          NavigationDestination(icon: Icon(Icons.add_box_outlined), selectedIcon: Icon(Icons.add_box), label: 'Vender'),
          NavigationDestination(icon: Icon(Icons.chat_bubble_outline), selectedIcon: Icon(Icons.chat_bubble), label: 'Mensagens'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Perfil'),
        ],
      ),
    );
  }
}
