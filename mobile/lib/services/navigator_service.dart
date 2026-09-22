import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class NavigatorService {
  NavigatorService._();
  static final NavigatorService instance = NavigatorService._();

  late GoRouter router;

  void go(String location) => router.go(location);
  void push(String location) => router.push(location);
}

final rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');
