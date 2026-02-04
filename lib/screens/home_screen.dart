/// Dough Hound - Home Screen
/// 
/// Main dashboard showing reserve balance, chart, and upcoming transactions

import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/services.dart';
import '../widgets/widgets.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // State
  double _currentBalance = 65.00; // TODO: Load from storage
  List<Transaction> _transactions = [];
  List<DayForecast> _forecast = [];
  int _viewMonths = 3;

  @override
  void initState() {
    super.initState();
    _loadSampleData(); // TODO: Replace with real storage
    _generateForecast();
  }

  void _loadSampleData() {
    // Sample transactions for testing
    _transactions = [
      Transaction(
        id: '1',
        date: DateTime.now(),
        name: 'Rent',
        amount: 885,
        type: TransactionType.bill,
        frequency: Frequency.monthly,
      ),
      Transaction(
        id: '2',
        date: DateTime.now().add(const Duration(days: 2)),
        name: 'Paycheck',
        amount: 800,
        type: TransactionType.paycheck,
        frequency: Frequency.biWeekly,
      ),
      Transaction(
        id: '3',
        date: DateTime.now(),
        name: 'Groceries',
        amount: 50,
        type: TransactionType.purchase,
        frequency: Frequency.weekly,
      ),
    ];
  }

  void _generateForecast() {
    final startDate = DateTime.now();
    _forecast = ForecastService.generateForecast(
      _transactions,
      startDate,
      _currentBalance,
      months: 24,
    );
    setState(() {});
  }

  void _updateBalance(double newBalance) {
    setState(() {
      _currentBalance = newBalance;
    });
    _generateForecast();
  }

  void _addQuickExpense(String name, double amount) {
    final tx = Transaction(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      date: DateTime.now(),
      name: name,
      amount: amount,
      type: TransactionType.withdrawal,
      frequency: Frequency.oneTime,
    );
    setState(() {
      _transactions.add(tx);
    });
    _generateForecast();
    // TODO: Persist to storage
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Dark slate
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              _buildHeader(),
              const SizedBox(height: 24),

              // Chart Card
              _buildChartCard(),
              const SizedBox(height: 16),

              // Upcoming 10 Days
              UpcomingList(forecast: _forecast.take(10).toList()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Title
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Dough Hound',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.lightBlue[400],
              ),
            ),
            Text(
              'Reserve Balance Forecaster',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),

        // Balance Display
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              'CURRENT RESERVE',
              style: TextStyle(
                fontSize: 10,
                letterSpacing: 1.5,
                color: Colors.grey[600],
              ),
            ),
            Row(
              children: [
                Text(
                  '\$${_currentBalance.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                    color: Colors.white,
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.edit, color: Colors.grey[600], size: 20),
                  onPressed: _showEditBalanceDialog,
                ),
              ],
            ),
            // Quick Add Button
            TextButton(
              onPressed: _showQuickAddDialog,
              child: Text(
                '+ Quick Add Expense',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.lightBlue[400],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildChartCard() {
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
          // Chart Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Projection',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[200],
                ),
              ),
              // View Toggles
              _buildViewToggles(),
            ],
          ),
          const SizedBox(height: 16),

          // Chart
          SizedBox(
            height: 300,
            child: ReserveChart(
              forecast: _getFilteredForecast(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildViewToggles() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFF334155).withOpacity(0.5),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          _viewToggle('1M', 1),
          _viewToggle('2M', 2),
          _viewToggle('3M', 3),
          _viewToggle('All', 24),
        ],
      ),
    );
  }

  Widget _viewToggle(String label, int months) {
    final isSelected = _viewMonths == months;
    return GestureDetector(
      onTap: () => setState(() => _viewMonths = months),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? Colors.lightBlue : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : Colors.grey[500],
          ),
        ),
      ),
    );
  }

  List<DayForecast> _getFilteredForecast() {
    if (_forecast.isEmpty) return [];
    final endDate = DateTime.now().add(Duration(days: _viewMonths * 30));
    return _forecast.where((d) => d.date.isBefore(endDate)).toList();
  }

  void _showEditBalanceDialog() {
    final controller = TextEditingController(text: _currentBalance.toString());
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Update Balance', style: TextStyle(color: Colors.white)),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Enter new balance',
            hintStyle: TextStyle(color: Colors.grey[600]),
            filled: true,
            fillColor: const Color(0xFF334155),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final val = double.tryParse(controller.text);
              if (val != null) {
                _updateBalance(val);
                Navigator.pop(context);
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showQuickAddDialog() {
    final amountController = TextEditingController();
    final nameController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Quick Add Expense', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Description',
                hintStyle: TextStyle(color: Colors.grey[600]),
                filled: true,
                fillColor: const Color(0xFF334155),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Amount',
                hintStyle: TextStyle(color: Colors.grey[600]),
                filled: true,
                fillColor: const Color(0xFF334155),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              final amount = double.tryParse(amountController.text);
              if (amount != null) {
                _addQuickExpense(
                  nameController.text.isEmpty ? 'Quick Expense' : nameController.text,
                  amount,
                );
                Navigator.pop(context);
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}
