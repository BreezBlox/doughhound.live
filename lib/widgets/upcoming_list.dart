/// Upcoming Transactions List Widget
/// 
/// Table showing the next 10 days of transactions

import 'package:flutter/material.dart';
import '../models/models.dart';

class UpcomingList extends StatelessWidget {
  final List<DayForecast> forecast;

  const UpcomingList({super.key, required this.forecast});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Upcoming 10 Days',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.grey[400],
            ),
          ),
          const SizedBox(height: 12),
          
          // Header Row
          _buildHeaderRow(),
          const Divider(color: Color(0xFF334155)),

          // Data Rows
          ...forecast.map(_buildDataRow),
        ],
      ),
    );
  }

  Widget _buildHeaderRow() {
    return Row(
      children: [
        Expanded(
          flex: 2,
          child: Text(
            'DATE',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1,
              color: Colors.grey[600],
            ),
          ),
        ),
        Expanded(
          flex: 2,
          child: Text(
            'NET (+/-)',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1,
              color: Colors.grey[600],
            ),
          ),
        ),
        Expanded(
          flex: 2,
          child: Text(
            'BALANCE',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1,
              color: Colors.grey[600],
            ),
          ),
        ),
        Expanded(
          flex: 3,
          child: Text(
            'EVENTS',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1,
              color: Colors.grey[600],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDataRow(DayForecast day) {
    final netColor = day.netChange > 0
        ? Colors.green[400]
        : (day.netChange < 0 ? Colors.red[400] : Colors.grey[600]);
    final netSign = day.netChange > 0 ? '+' : '';

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Color(0xFF1E293B), width: 0.5),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              day.dateString,
              style: TextStyle(
                fontSize: 12,
                fontFamily: 'monospace',
                color: Colors.grey[500],
              ),
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              '$netSign\$${day.netChange.toStringAsFixed(0)}',
              style: TextStyle(
                fontSize: 12,
                fontFamily: 'monospace',
                color: netColor,
              ),
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              '\$${day.balance.toStringAsFixed(0)}',
              style: const TextStyle(
                fontSize: 12,
                fontFamily: 'monospace',
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              day.eventsSummary.isEmpty ? '-' : day.eventsSummary,
              style: TextStyle(
                fontSize: 10,
                color: Colors.grey[500],
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
