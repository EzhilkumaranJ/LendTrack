import { LoanEntry, AppNotification, MonthlyEarningStat, AppBackupData } from '../types';
import { calculateInterestPerPeriod, computeNextDueDate } from './dateUtils';
import { SPREADSHEET_LOANS, INITIAL_SPREADSHEET_NOTIFICATIONS } from '../data/spreadsheetData';

const STORAGE_KEY = 'lending_tracker_loans_spreadsheet_v3';
const NOTIFICATIONS_KEY = 'lending_tracker_notifications_spreadsheet_v3';

const INITIAL_LOANS: LoanEntry[] = SPREADSHEET_LOANS;

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
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_SPREADSHEET_NOTIFICATIONS));
      return INITIAL_SPREADSHEET_NOTIFICATIONS;
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
