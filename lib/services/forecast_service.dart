/// Forecast Service
/// 
/// Ported from Code.gs - generates daily forecast from transactions

import '../models/models.dart';

class ForecastService {
  /// Expand recurring transactions into individual events
  static List<Transaction> expandRecurringEntries(
    List<Transaction> entries,
    DateTime startDate,
    DateTime endDate,
  ) {
    final allEvents = <Transaction>[];
    const maxIterations = 1000;

    for (final entry in entries) {
      var currentDate = DateTime(entry.date.year, entry.date.month, entry.date.day);
      final stopDate = entry.stopDate ?? endDate;
      var count = 0;

      // One-time transactions
      if (entry.frequency == Frequency.oneTime) {
        if (!currentDate.isBefore(startDate) && !currentDate.isAfter(endDate)) {
          allEvents.add(entry);
        }
        continue;
      }

      // Recurring transactions
      while (!currentDate.isAfter(stopDate) && !currentDate.isAfter(endDate) && count < maxIterations) {
        if (!currentDate.isBefore(startDate)) {
          allEvents.add(Transaction(
            id: entry.id,
            date: currentDate,
            name: entry.name,
            amount: entry.amount,
            type: entry.type,
            frequency: entry.frequency,
            stopDate: entry.stopDate,
          ));
        }

        // Increment date based on frequency
        switch (entry.frequency) {
          case Frequency.weekly:
            currentDate = currentDate.add(const Duration(days: 7));
            break;
          case Frequency.biWeekly:
            currentDate = currentDate.add(const Duration(days: 14));
            break;
          case Frequency.monthly:
            currentDate = DateTime(currentDate.year, currentDate.month + 1, currentDate.day);
            break;
          case Frequency.oneTime:
            count = maxIterations; // Should not reach here
            break;
        }
        count++;
      }
    }

    return allEvents;
  }

  /// Calculate daily reserves
  static List<DayForecast> calculateDailyReserves(
    List<Transaction> events,
    DateTime startDate,
    DateTime endDate,
    double startBalance,
  ) {
    final dailyData = <DayForecast>[];
    var currentDate = DateTime(startDate.year, startDate.month, startDate.day);
    var cumulativeReserve = startBalance;

    // Group events by date string
    final eventsByDate = <String, List<Transaction>>{};
    for (final e in events) {
      final dString = _formatDate(e.date);
      eventsByDate.putIfAbsent(dString, () => []).add(e);
    }

    while (!currentDate.isAfter(endDate)) {
      final dString = _formatDate(currentDate);
      final dayEvents = eventsByDate[dString] ?? [];

      var dailyNet = 0.0;
      for (final e in dayEvents) {
        dailyNet += e.signedAmount;
      }

      cumulativeReserve += dailyNet;

      dailyData.add(DayForecast(
        date: currentDate,
        netChange: dailyNet,
        balance: cumulativeReserve,
        events: dayEvents,
      ));

      currentDate = currentDate.add(const Duration(days: 1));
    }

    return dailyData;
  }

  /// Generate full forecast
  static List<DayForecast> generateForecast(
    List<Transaction> transactions,
    DateTime startDate,
    double startBalance, {
    int months = 24,
  }) {
    final endDate = DateTime(startDate.year, startDate.month + months, startDate.day);
    final expandedEvents = expandRecurringEntries(transactions, startDate, endDate);
    return calculateDailyReserves(expandedEvents, startDate, endDate, startBalance);
  }

  static String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}
