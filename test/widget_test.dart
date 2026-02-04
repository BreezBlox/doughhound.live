// Basic Flutter widget test for Dough Hound

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:dough_hound_app/main.dart';

void main() {
  testWidgets('App loads without crashing', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const DoughHoundApp());

    // Verify that the app title is displayed
    expect(find.text('Dough Hound'), findsOneWidget);
  });
}
