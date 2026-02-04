
export type EntryType = 'bill' | 'paycheck' | 'purchase';

export type Frequency = 'weekly' | 'bi-weekly' | 'monthly' | 'one-time';

export interface FinancialEntry {
  id: string;
  type: EntryType;
  name: string;
  amount: number;
  date: Date;
  frequency: Frequency;
  occurrenceLimit?: number; // Optional limit on number of occurrences
  stopDate?: Date; // Optional stop date for recurring entries
  customDates?: string[]; // Optional manual selection of specific dates (ISO strings)
}

export interface DailyReserve {
  date: Date;
  reserve: number;
  entries: FinancialEntry[];
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isSelected: boolean;
}
