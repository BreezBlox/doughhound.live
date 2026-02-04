/// Reserve Balance Chart Widget
/// 
/// Line chart showing projected balance over time

import 'package:flutter/material.dart';
import '../models/models.dart';

class ReserveChart extends StatelessWidget {
  final List<DayForecast> forecast;

  const ReserveChart({super.key, required this.forecast});

  @override
  Widget build(BuildContext context) {
    if (forecast.isEmpty) {
      return const Center(
        child: Text(
          'No forecast data',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    // Find min/max for scaling
    final values = forecast.map((f) => f.balance).toList();
    final minVal = values.reduce((a, b) => a < b ? a : b);
    final maxVal = values.reduce((a, b) => a > b ? a : b);
    final range = maxVal - minVal;
    final padding = range * 0.1;

    return CustomPaint(
      painter: _ChartPainter(
        forecast: forecast,
        minVal: minVal - padding,
        maxVal: maxVal + padding,
      ),
      size: Size.infinite,
    );
  }
}

class _ChartPainter extends CustomPainter {
  final List<DayForecast> forecast;
  final double minVal;
  final double maxVal;

  _ChartPainter({
    required this.forecast,
    required this.minVal,
    required this.maxVal,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (forecast.isEmpty) return;

    final range = maxVal - minVal;
    if (range == 0) return;

    // Grid lines
    final gridPaint = Paint()
      ..color = const Color(0xFF334155)
      ..strokeWidth = 1;

    for (var i = 0; i <= 4; i++) {
      final y = size.height * (i / 4);
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // Danger zone line at $1000
    if (minVal < 1000 && maxVal > 1000) {
      final dangerY = size.height - ((1000 - minVal) / range * size.height);
      final dangerPaint = Paint()
        ..color = Colors.red.withOpacity(0.5)
        ..strokeWidth = 1
        ..style = PaintingStyle.stroke;
      canvas.drawLine(Offset(0, dangerY), Offset(size.width, dangerY), dangerPaint);
    }

    // Line path
    final linePaint = Paint()
      ..color = const Color(0xFF0EA5E9) // Sky-500
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          const Color(0xFF0EA5E9).withOpacity(0.5),
          const Color(0xFF0EA5E9).withOpacity(0.0),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final linePath = Path();
    final fillPath = Path();

    for (var i = 0; i < forecast.length; i++) {
      final x = i / (forecast.length - 1) * size.width;
      final y = size.height - ((forecast[i].balance - minVal) / range * size.height);

      if (i == 0) {
        linePath.moveTo(x, y);
        fillPath.moveTo(x, size.height);
        fillPath.lineTo(x, y);
      } else {
        linePath.lineTo(x, y);
        fillPath.lineTo(x, y);
      }
    }

    // Close fill path
    fillPath.lineTo(size.width, size.height);
    fillPath.close();

    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(linePath, linePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
