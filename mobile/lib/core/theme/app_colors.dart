import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary palette
  static const Color primary = Color(0xFF6366F1);       // Indigo
  static const Color primaryLight = Color(0xFFEEF2FF);
  static const Color primaryDark = Color(0xFF4F46E5);

  // Semantic
  static const Color success = Color(0xFF22C55E);
  static const Color successLight = Color(0xFFF0FDF4);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFFFBEB);
  static const Color danger = Color(0xFFEF4444);
  static const Color dangerLight = Color(0xFFFEF2F2);
  static const Color info = Color(0xFF3B82F6);
  static const Color infoLight = Color(0xFFEFF6FF);

  // Text
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textMuted = Color(0xFF9CA3AF);

  // Backgrounds
  static const Color backgroundLight = Color(0xFFF9FAFB);
  static const Color backgroundDark = Color(0xFF0F172A);
  static const Color surfaceDark = Color(0xFF1E293B);

  // Borders
  static const Color border = Color(0xFFE5E7EB);
  static const Color borderDark = Color(0xFF334155);

  // Role colors
  static const Color adminColor = Color(0xFF8B5CF6);
  static const Color teacherColor = Color(0xFF3B82F6);
  static const Color studentColor = Color(0xFF22C55E);
  static const Color parentColor = Color(0xFFF59E0B);

  static Color roleColor(String role) {
    switch (role.toLowerCase()) {
      case 'admin': return adminColor;
      case 'teacher': return teacherColor;
      case 'student': return studentColor;
      case 'parent': return parentColor;
      default: return textSecondary;
    }
  }
}
