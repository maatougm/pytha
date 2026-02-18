import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';

class AdminShellScreen extends StatelessWidget {
  final Widget child;
  const AdminShellScreen({super.key, required this.child});

  static const _navItems = [
    _NavItem('/admin', Icons.dashboard_outlined, 'Dashboard'),
    _NavItem('/admin/users', Icons.people_outlined, 'Users'),
    _NavItem('/admin/moderation', Icons.shield_outlined, 'Moderation'),
    _NavItem('/admin/classes', Icons.class_outlined, 'Classes'),
    _NavItem('/admin/settings', Icons.settings_outlined, 'Settings'),
  ];

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final isWide = MediaQuery.of(context).size.width >= 768;

    if (isWide) {
      // Tablet: side navigation rail
      return Scaffold(
        body: Row(
          children: [
            NavigationRail(
              backgroundColor: Colors.white,
              selectedIndex: _selectedIndex(location),
              onDestinationSelected: (i) => context.go(_navItems[i].path),
              labelType: NavigationRailLabelType.all,
              selectedIconTheme: const IconThemeData(color: AppColors.primary),
              selectedLabelTextStyle: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
              leading: Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.school_rounded, color: Colors.white, size: 22),
                ),
              ),
              destinations: _navItems
                  .map((n) => NavigationRailDestination(
                        icon: Icon(n.icon),
                        label: Text(n.label),
                      ))
                  .toList(),
            ),
            const VerticalDivider(width: 1),
            Expanded(child: child),
          ],
        ),
      );
    }

    // Phone: bottom navigation bar
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex(location),
        onDestinationSelected: (i) => context.go(_navItems[i].path),
        destinations: _navItems
            .map((n) => NavigationDestination(icon: Icon(n.icon), label: n.label))
            .toList(),
      ),
    );
  }

  int _selectedIndex(String location) {
    for (int i = _navItems.length - 1; i >= 0; i--) {
      if (location.startsWith(_navItems[i].path)) return i;
    }
    return 0;
  }
}

class _NavItem {
  final String path;
  final IconData icon;
  final String label;
  const _NavItem(this.path, this.icon, this.label);
}
