import { LoanEntry, AppNotification, MonthlyEarningStat, AppBackupData } from '../types';
import { calculateInterestPerPeriod, computeNextDueDate } from './dateUtils';

const STORAGE_KEY = 'lending_tracker_loans_inr_v2';
const NOTIFICATIONS_KEY = 'lending_tracker_notifications_inr_v2';

const INITIAL_LOANS: LoanEntry[] = [
  {
    id: 'loan-1',
    borrowerName: 'Rajesh Sharma',
    borrowerPhone: '+91 98450 12345',
    borrowerEmail: 'rajesh.sharma@example.com',
    borrowerAvatarColor: 'from-amber-500 to-orange-600',
    principalAmount: 200000,
    currentOutstandingPrincipal: 160000,
    startDate: '2026-05-15',
    interestRate: 2, // 2% per month (₹2 per ₹100)
    interestRateType: 'monthly',
    recurrence: 'monthly',
    dueDayOfMonth: 31,
    nextInterestDueDate: '2026-08-31', // Due today!
    interestPerPeriod: 3200, // 2% of ₹1,60,000
    status: 'active',
    notes: 'Textile shop inventory working capital. Pays regularly on month-end.',
    collateralDescription: 'Shop lease agreement & promissory note',
    payments: [
      { id: 'p-1', loanId: 'loan-1', amount: 4000, type: 'interest', date: '2026-06-15', receiptNumber: 'REC-1001' },
      { id: 'p-2', loanId: 'loan-1', amount: 40000, type: 'principal', date: '2026-06-20', receiptNumber: 'REC-1002' },
      { id: 'p-3', loanId: 'loan-1', amount: 3200, type: 'interest', date: '2026-07-15', receiptNumber: 'REC-1003' },
    ],
    createdAt: '2026-05-15T10:00:00Z',
    updatedAt: '2026-07-15T12:00:00Z',
  },
  {
    id: 'loan-2',
    borrowerName: 'Priya Sundaram',
    borrowerPhone: '+91 98201 67890',
    borrowerEmail: 'priya.sundaram@example.com',
    borrowerAvatarColor: 'from-rose-500 to-pink-600',
    principalAmount: 500000,
    currentOutstandingPrincipal: 500000,
    startDate: '2026-06-01',
    interestRate: 2.5, // 2.5% monthly
    interestRateType: 'monthly',
    recurrence: 'monthly',
    dueDayOfMonth: 28,
    nextInterestDueDate: '2026-08-28', // 3 days overdue!
    interestPerPeriod: 12500, // 2.5% of ₹5,00,000
    status: 'active',
    notes: 'Boutique bridal collection advance financing.',
    collateralDescription: 'Gold jewellery guarantee deposit receipt',
    payments: [
      { id: 'p-4', loanId: 'loan-2', amount: 12500, type: 'interest', date: '2026-06-28', receiptNumber: 'REC-1004' },
      { id: 'p-5', loanId: 'loan-2', amount: 12500, type: 'interest', date: '2026-07-28', receiptNumber: 'REC-1005' },
    ],
    createdAt: '2026-06-01T09:00:00Z',
    updatedAt: '2026-07-28T14:30:00Z',
  },
  {
    id: 'loan-3',
    borrowerName: 'Amit Patel',
    borrowerPhone: '+91 94480 34567',
    borrowerEmail: 'amit.patel@example.com',
    borrowerAvatarColor: 'from-emerald-500 to-teal-600',
    principalAmount: 100000,
    currentOutstandingPrincipal: 100000,
    startDate: '2026-08-10',
    interestRate: 1.5,
    interestRateType: 'monthly',
    recurrence: 'biweekly',
    nextInterestDueDate: '2026-09-03', // in 3 days
    interestPerPeriod: 750,
    status: 'active',
    notes: 'Agricultural equipment & borewell pump maintenance.',
    payments: [],
    createdAt: '2026-08-10T11:00:00Z',
    updatedAt: '2026-08-10T11:00:00Z',
  },
  {
    id: 'loan-4',
    borrowerName: 'Sneha Reddy',
    borrowerPhone: '+91 97402 88990',
    borrowerEmail: 'sneha.reddy@example.com',
    borrowerAvatarColor: 'from-purple-500 to-indigo-600',
    principalAmount: 350000,
    currentOutstandingPrincipal: 250000,
    startDate: '2026-04-01',
    interestRate: 2,
    interestRateType: 'monthly',
    recurrence: 'monthly',
    dueDayOfMonth: 10,
    nextInterestDueDate: '2026-09-10', // in 10 days
    interestPerPeriod: 5000,
    status: 'active',
    notes: 'Diagnostics clinic equipment expansion. Pays on 10th of every month.',
    payments: [
      { id: 'p-6', loanId: 'loan-4', amount: 7000, type: 'interest', date: '2026-05-10', receiptNumber: 'REC-1006' },
      { id: 'p-7', loanId: 'loan-4', amount: 100000, type: 'principal', date: '2026-05-10', receiptNumber: 'REC-1007' },
      { id: 'p-8', loanId: 'loan-4', amount: 5000, type: 'interest', date: '2026-06-10', receiptNumber: 'REC-1008' },
      { id: 'p-9', loanId: 'loan-4', amount: 5000, type: 'interest', date: '2026-07-10', receiptNumber: 'REC-1009' },
      { id: 'p-10', loanId: 'loan-4', amount: 5000, type: 'interest', date: '2026-08-10', receiptNumber: 'REC-1010' },
    ],
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-08-10T09:00:00Z',
  },
  {
    id: 'loan-5',
    borrowerName: 'Vikram Malhotra',
    borrowerPhone: '+91 99001 22334',
    borrowerEmail: 'vikram.m@example.com',
    borrowerAvatarColor: 'from-cyan-500 to-blue-600',
    principalAmount: 80000,
    currentOutstandingPrincipal: 80000,
    startDate: '2026-08-15',
    interestRate: 1500, // flat fee ₹1,500 weekly
    interestRateType: 'flat_fee',
    recurrence: 'weekly',
    nextInterestDueDate: '2026-09-05',
    interestPerPeriod: 1500,
    status: 'active',
    notes: 'Short term project float for event catering.',
    payments: [
      { id: 'p-11', loanId: 'loan-5', amount: 1500, type: 'interest', date: '2026-08-22', receiptNumber: 'REC-1011' },
      { id: 'p-12', loanId: 'loan-5', amount: 1500, type: 'interest', date: '2026-08-29', receiptNumber: 'REC-1012' },
    ],
    createdAt: '2026-08-15T15:00:00Z',
    updatedAt: '2026-08-29T16:00:00Z',
  },
  {
    id: 'loan-6',
    borrowerName: 'Ananya Iyer',
    borrowerPhone: '+91 98800 55667',
    borrowerEmail: 'ananya.iyer@example.com',
    borrowerAvatarColor: 'from-emerald-600 to-green-700',
    principalAmount: 150000,
    currentOutstandingPrincipal: 0,
    startDate: '2026-03-01',
    interestRate: 2,
    interestRateType: 'monthly',
    recurrence: 'monthly',
    dueDayOfMonth: 1,
    nextInterestDueDate: '2026-08-01',
    interestPerPeriod: 0,
    status: 'settled',
    notes: 'Fully settled with all interest cleared.',
    payments: [
      { id: 'p-13', loanId: 'loan-6', amount: 3000, type: 'interest', date: '2026-04-01', receiptNumber: 'REC-1013' },
      { id: 'p-14', loanId: 'loan-6', amount: 3000, type: 'interest', date: '2026-05-01', receiptNumber: 'REC-1014' },
      { id: 'p-15', loanId: 'loan-6', amount: 3000, type: 'interest', date: '2026-06-01', receiptNumber: 'REC-1015' },
      { id: 'p-16', loanId: 'loan-6', amount: 150000, type: 'full_settlement', date: '2026-07-01', receiptNumber: 'REC-1016' },
    ],
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-07-01T11:00:00Z',
  }
];

export function getStoredLoans(): LoanEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LOANS));
      return INITIAL_LOANS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_LOANS;
  }
}

export function saveStoredLoans(loans: LoanEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
  } catch (err) {
    console.error('Failed to persist loans:', err);
  }
}

export function getStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) {
      const initial: AppNotification[] = [
        {
          id: 'notif-1',
          loanId: 'loan-1',
          borrowerName: 'Rajesh Sharma',
          title: 'Interest Due Today',
          message: 'Rajesh Sharma has interest payment of ₹3,200 due today.',
          type: 'due_today',
          date: '2026-08-31T08:00:00Z',
          dueDate: '2026-08-31',
          amountDue: 3200,
          isRead: false,
        },
        {
          id: 'notif-2',
          loanId: 'loan-2',
          borrowerName: 'Priya Sundaram',
          title: 'Overdue Alert: Priya Sundaram',
          message: 'Interest payment of ₹12,500 is 3 days overdue (Due Aug 28).',
          type: 'overdue',
          date: '2026-08-31T07:30:00Z',
          dueDate: '2026-08-28',
          amountDue: 12500,
          isRead: false,
        },
        {
          id: 'notif-3',
          loanId: 'loan-3',
          borrowerName: 'Amit Patel',
          title: 'Upcoming Reminder',
          message: 'Amit Patel has ₹750 interest due in 3 days (Sep 3).',
          type: 'upcoming',
          date: '2026-08-31T06:00:00Z',
          dueDate: '2026-09-03',
          amountDue: 750,
          isRead: true,
        },
      ];
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredNotifications(notifs: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
  } catch (err) {
    console.error('Failed to save notifications', err);
  }
}

export function calculateMonthlyEarningsStats(loans: LoanEntry[]): MonthlyEarningStat[] {
  // Generate stats for past 5 months + current month + next month
  const months: MonthlyEarningStat[] = [];
  const baseDate = new Date('2026-08-31T00:00:00');

  for (let i = -4; i <= 2; i++) {
    const targetMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
    const monthKey = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = targetMonth.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    let interestCollected = 0;
    let principalCollected = 0;
    let projectedInterest = 0;

    loans.forEach((loan) => {
      // Calculate actual collected in this month
      loan.payments.forEach((p) => {
        if (p.date.startsWith(monthKey)) {
          if (p.type === 'interest') {
            interestCollected += p.amount;
          } else if (p.type === 'principal' || p.type === 'full_settlement') {
            principalCollected += p.amount;
          }
        }
      });

      // Calculate projected interest for current or future months
      if (loan.status === 'active' && i >= 0) {
        // Approximate expected interest for this month based on period
        projectedInterest += loan.interestPerPeriod;
      }
    });

    months.push({
      monthKey,
      monthLabel,
      interestCollected,
      principalCollected,
      projectedInterest: i >= 0 ? Math.max(projectedInterest, interestCollected) : 0,
    });
  }

  return months;
}

/**
 * Generate standard JSON backup structure
 */
export function createBackupPayload(loans: LoanEntry[], notifications: AppNotification[]): AppBackupData {
  return {
    version: '1.0',
    appName: 'Lending & Interest Due Tracker',
    exportedAt: new Date().toISOString(),
    currency: 'INR (₹)',
    totalLoansCount: loans.length,
    activeLoansCount: loans.filter((l) => l.status === 'active').length,
    loans,
    notifications,
  };
}

/**
 * Trigger file download of the backup in JSON format (drive/cloud storage ready)
 */
export function downloadBackupFile(backupData: AppBackupData): void {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(backupData, null, 2)
  )}`;
  const dateStr = new Date().toISOString().split('T')[0];
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `lending-tracker-backup-${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Validate and parse uploaded backup file content
 */
export function parseAndValidateBackup(jsonString: string): {
  success: boolean;
  data?: AppBackupData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);

    // Support either full AppBackupData structure OR raw LoanEntry[] array
    let validatedLoans: LoanEntry[] = [];
    let validatedNotifications: AppNotification[] = [];

    if (Array.isArray(parsed)) {
      // Raw array of loans
      validatedLoans = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.loans)) {
      validatedLoans = parsed.loans;
      if (Array.isArray(parsed.notifications)) {
        validatedNotifications = parsed.notifications;
      }
    } else {
      return {
        success: false,
        error: 'Invalid file format. Expected a valid Lending Tracker JSON backup file.',
      };
    }

    // Basic schema check on loans
    for (let i = 0; i < validatedLoans.length; i++) {
      const l = validatedLoans[i];
      if (!l.id || !l.borrowerName || typeof l.principalAmount !== 'number') {
        return {
          success: false,
          error: `Loan entry #${i + 1} is missing required fields (id, borrowerName, or principalAmount).`,
        };
      }
      if (!Array.isArray(l.payments)) {
        l.payments = [];
      }
    }

    const payload: AppBackupData = {
      version: parsed.version || '1.0',
      appName: parsed.appName || 'Lending & Interest Due Tracker',
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      currency: parsed.currency || 'INR (₹)',
      totalLoansCount: validatedLoans.length,
      activeLoansCount: validatedLoans.filter((l) => l.status === 'active').length,
      loans: validatedLoans,
      notifications: validatedNotifications,
    };

    return { success: true, data: payload };
  } catch (err) {
    return {
      success: false,
      error: `Could not parse JSON file: ${(err as Error).message}`,
    };
  }
}
