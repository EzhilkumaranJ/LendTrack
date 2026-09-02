export type RecurrenceType = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'custom_days' | 'one_time';

export type PaymentType = 'interest' | 'principal' | 'full_settlement' | 'skip_interest';

export interface PaymentRecord {
  id: string;
  loanId: string;
  amount: number; // For skip_interest: the skipped interest amount
  type: PaymentType;
  date: string; // ISO string YYYY-MM-DD
  notes?: string;
  skipReason?: string;
  receiptNumber?: string;
}

export interface LoanEntry {
  id: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  borrowerAvatarColor: string;
  
  // Principal details
  principalAmount: number; // Original amount lent
  currentOutstandingPrincipal: number; // Remaining principal
  startDate: string; // YYYY-MM-DD
  
  // Interest details
  interestRate: number; // e.g., 5%
  interestRateType: 'monthly' | 'yearly' | 'flat_fee'; // e.g. 5% monthly or 2% flat
  recurrence: RecurrenceType;
  customIntervalDays?: number; // if recurrence is custom_days
  dueDayOfMonth?: number; // e.g. 1st, 15th, 30th of month
  
  // Calculated / Next payment details
  nextInterestDueDate: string; // YYYY-MM-DD
  interestPerPeriod: number; // calculated base interest due per interval
  
  // Reminder settings
  remindersMuted?: boolean;
  remindersMutedUntil?: string; // e.g. muted until this date
  
  // Notes & Status
  status: 'active' | 'settled' | 'defaulted';
  notes?: string;
  collateralDescription?: string;
  
  // History
  payments: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  loanId?: string;
  borrowerName?: string;
  title: string;
  message: string;
  type: 'due_today' | 'overdue' | 'upcoming' | 'payment_received';
  date: string;
  dueDate?: string;
  amountDue?: number;
  isRead: boolean;
}

export interface MonthlyEarningStat {
  monthKey: string; // '2026-08'
  monthLabel: string; // 'Aug 2026'
  interestCollected: number;
  principalCollected: number;
  projectedInterest: number;
}

export interface AppBackupData {
  version: string; // e.g. "1.0"
  appName: string;
  exportedAt: string; // ISO string
  currency: string;
  totalLoansCount: number;
  activeLoansCount: number;
  loans: LoanEntry[];
  notifications?: AppNotification[];
}
