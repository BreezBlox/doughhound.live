/// Transaction model for Dough Hound
/// 
/// Represents a single financial entry (expense, paycheck, etc.)

enum TransactionType { withdrawal, paycheck, deposit, bill, purchase }
enum Frequency { oneTime, weekly, biWeekly, monthly }

class Transaction {
  final String id;
  final DateTime date;
  final String name;
  final double amount;
  final TransactionType type;
  final Frequency frequency;
  final DateTime? stopDate;

  Transaction({
    required this.id,
    required this.date,
    required this.name,
    required this.amount,
    required this.type,
    this.frequency = Frequency.oneTime,
    this.stopDate,
  });

  /// Returns true if this is income (positive)
  bool get isIncome => type == TransactionType.paycheck || type == TransactionType.deposit;

  /// Returns the signed amount (positive for income, negative for expenses)
  double get signedAmount => isIncome ? amount : -amount;

  /// Create from JSON/Map (for storage)
  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] as String,
      date: DateTime.parse(json['date'] as String),
      name: json['name'] as String,
      amount: (json['amount'] as num).toDouble(),
      type: TransactionType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => TransactionType.withdrawal,
      ),
      frequency: Frequency.values.firstWhere(
        (e) => e.name == json['frequency'],
        orElse: () => Frequency.oneTime,
      ),
      stopDate: json['stopDate'] != null ? DateTime.parse(json['stopDate']) : null,
    );
  }

  /// Convert to JSON/Map (for storage)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'date': date.toIso8601String(),
      'name': name,
      'amount': amount,
      'type': type.name,
      'frequency': frequency.name,
      'stopDate': stopDate?.toIso8601String(),
    };
  }

  @override
  String toString() => 'Transaction($name, \$$amount, ${type.name})';
}
