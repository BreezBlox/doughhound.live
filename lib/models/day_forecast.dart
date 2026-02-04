/// Daily forecast data point
/// 
/// Represents the balance and events for a single day

import 'transaction.dart';

class DayForecast {
  final DateTime date;
  final double netChange;
  final double balance;
  final List<Transaction> events;

  DayForecast({
    required this.date,
    required this.netChange,
    required this.balance,
    required this.events,
  });

  /// Format date as YYYY-MM-DD
  String get dateString => '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

  /// Get event summary string
  String get eventsSummary {
    if (events.isEmpty) return '';
    return events.map((e) => '${e.name} (${e.signedAmount >= 0 ? '+' : ''}\$${e.signedAmount.toStringAsFixed(0)})').join(', ');
  }
}
