/// Dough Hound - Main Entry Point
/// 
/// Native iOS/Android reserve balance forecaster

import 'package:flutter/material.dart';
import 'screens/screens.dart';

void main() {
  runApp(const DoughHoundApp());
}

class DoughHoundApp extends StatelessWidget {
  const DoughHoundApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Dough Hound',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        colorScheme: ColorScheme.dark(
          primary: Colors.lightBlue[400]!,
          secondary: Colors.lightBlue[300]!,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.lightBlue,
            foregroundColor: Colors.white,
          ),
        ),
      ),
      home: const HomeScreen(),
    );
  }
}
