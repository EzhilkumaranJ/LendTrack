// Utilities for interest calculation, recurring due date projections, and calendar integrations

import { LoanEntry, RecurrenceType } from '../types';

export function calculateInterestPerPeriod(
  principal: number,
  rate: number,
  rateType: 'monthly' | 'yearly' | 'flat_fee',
  recurrence: RecurrenceType = 'monthly'
): number {
  if (rateType === 'flat_fee') {
    return rate; // Flat currency amount
  }

  // Monthly percentage base (Standard Indian & Direct monthly lending: ₹ per ₹100 / month)
  // No date-wise or day-count division needed: repeats fixed periodic amount
  if (rateType === 'monthly') {
    const monthlyRate = rate / 100;
    const monthlyInterest = principal * monthlyRate;

    switch (recurrence) {
      case 'weekly':
        return (monthlyInterest * 12) / 52;
      case 'biweekly':
        return (monthlyInterest * 12) / 26;
      case 'monthly':
      default:
        return monthlyInterest;
      case 'quarterly':
        return monthlyInterest * 3;
      case 'one_time':
        return monthlyInterest;
    }
  }

  // Yearly percentage base (Per annum / APR)
  if (rateType === 'yearly') {
    const yearlyRate = rate / 100;
    const yearlyInterest = principal * yearlyRate;

    switch (recurrence) {
      case 'weekly':
        return yearlyInterest / 52;
      case 'biweekly':
        return yearlyInterest / 26;
      case 'monthly':
      default:
        return yearlyInterest / 12;
      case 'quarterly':
        return yearlyInterest / 4;
      case 'one_time':
        return yearlyInterest;
    }
  }

  return 0;
}

function formatDateIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computeNextDueDate(
  currentDueDate: string,
  recurrence: RecurrenceType = 'monthly',
  customIntervalDays?: number,
  dueDayOfMonth?: number
): string {
  const parts = currentDueDate.split('-');
  if (parts.length !== 3) {
    return new Date().toISOString().split('T')[0];
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1-12
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return new Date().toISOString().split('T')[0];
  }

  switch (recurrence) {
    case 'weekly': {
      const d = new Date(year, month - 1, day + 7);
      return formatDateIso(d);
    }
    case 'biweekly': {
      const d = new Date(year, month - 1, day + 14);
      return formatDateIso(d);
    }
    case 'quarterly': {
      const targetDay = dueDayOfMonth && dueDayOfMonth >= 1 && dueDayOfMonth <= 31 ? dueDayOfMonth : day;
      let targetMonth = month + 3;
      let targetYear = year;
      if (targetMonth > 12) {
        targetYear += Math.floor((targetMonth - 1) / 12);
        targetMonth = ((targetMonth - 1) % 12) + 1;
      }
      const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
      if (targetDay <= daysInTargetMonth) {
        return formatDateIso(new Date(targetYear, targetMonth - 1, targetDay));
      } else {
        // Roll to 1st of next month if date does not exist in target month
        return formatDateIso(new Date(targetYear, targetMonth, 1));
      }
    }
    case 'one_time': {
      return currentDueDate;
    }
    case 'custom_days': {
      const d = new Date(year, month - 1, day + (customIntervalDays && customIntervalDays > 0 ? customIntervalDays : 30));
      return formatDateIso(d);
    }
    case 'monthly':
    default: {
      // Repeats on the same day every month irrespective of the number of days in the month
      // (e.g. 1st of month repeats on 1st of every month: 1 Sep, 1 Oct, 1 Nov, 1 Dec...)
      const targetDay = dueDayOfMonth && dueDayOfMonth >= 1 && dueDayOfMonth <= 31 ? dueDayOfMonth : day;
      let targetMonth = month + 1;
      let targetYear = year;
      if (targetMonth > 12) {
        targetYear += 1;
        targetMonth = 1;
      }

      const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();

      if (targetDay <= daysInTargetMonth) {
        // Day exists in target month (e.g. 1st, 15th, 28th)
        return formatDateIso(new Date(targetYear, targetMonth - 1, targetDay));
      } else {
        // Dates like 31 (or 29, 30) not present in shorter months (e.g. Feb 28 or Sep 30)
        // Rollover to the immediate next day of the next month (e.g. 1st of following month)
        return formatDateIso(new Date(targetYear, targetMonth, 1));
      }
    }
  }
}

export function getDaysDiff(targetDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDateStr + 'T00:00:00');
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDueDateBadge(dueDateStr: string): {
  text: string;
  badgeClass: string;
  status: 'overdue' | 'today' | 'tomorrow' | 'upcoming';
  daysDiff: number;
} {
  const daysDiff = getDaysDiff(dueDateStr);

  if (daysDiff < 0) {
    const daysAgo = Math.abs(daysDiff);
    return {
      text: `${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} overdue`,
      badgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
      status: 'overdue',
      daysDiff,
    };
  } else if (daysDiff === 0) {
    return {
      text: 'Due Today',
      badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse',
      status: 'today',
      daysDiff,
    };
  } else if (daysDiff === 1) {
    return {
      text: 'Due Tomorrow',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      status: 'tomorrow',
      daysDiff,
    };
  } else if (daysDiff <= 7) {
    return {
      text: `In ${daysDiff} days`,
      badgeClass: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
      status: 'upcoming',
      daysDiff,
    };
  } else {
    return {
      text: new Date(dueDateStr + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      badgeClass: 'bg-slate-800 text-slate-300 border border-slate-700',
      status: 'upcoming',
      daysDiff,
    };
  }
}

export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

// Indian compact number formatter (e.g. ₹50k, ₹1.5L, ₹25L, ₹1.2Cr)
export function formatIndianShort(amount: number): string {
  if (isNaN(amount) || amount === 0) return '₹0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    // 1 Crore = 10,000,000
    const cr = abs / 10000000;
    return `${sign}₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2).replace(/\.?0+$/, '')} Cr`;
  }
  if (abs >= 100000) {
    // 1 Lakh = 100,000
    const lakh = abs / 100000;
    return `${sign}₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2).replace(/\.?0+$/, '')} L`;
  }
  if (abs >= 1000) {
    const k = abs / 1000;
    return `${sign}₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace(/\.?0+$/, '')}k`;
  }
  return `${sign}₹${abs.toLocaleString('en-IN')}`;
}

// Generates direct Google Calendar Web URL (Instant 1-click add to Google Calendar without OAuth!)
export function generateGoogleCalendarUrl(loan: LoanEntry): string {
  const dateFormatted = loan.nextInterestDueDate.replace(/-/g, '');
  const title = encodeURIComponent(`💰 Interest Due: ${loan.borrowerName} (${formatCurrency(loan.interestPerPeriod)})`);
  const details = encodeURIComponent(
    `Lending Reminder for ${loan.borrowerName}\n` +
    `• Outstanding Balance: ${formatCurrency(loan.currentOutstandingPrincipal)}\n` +
    `• Interest Due: ${formatCurrency(loan.interestPerPeriod)}\n` +
    `• Rate: ${loan.interestRate}% (${loan.interestRateType})\n` +
    `• Recurrence: ${loan.recurrence}\n` +
    (loan.borrowerPhone ? `• Phone: ${loan.borrowerPhone}\n` : '') +
    (loan.notes ? `• Notes: ${loan.notes}` : '')
  );
  
  // Create all-day event
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateFormatted}/${dateFormatted}&details=${details}`;
}

// Generate .ics calendar download file
export function generateIcsFile(loan: LoanEntry): string {
  const dateFormatted = loan.nextInterestDueDate.replace(/-/g, '');
  const uid = `${loan.id}-${Date.now()}@lendingtracker.app`;
  
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lending Tracker App//Reminders//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART;VALUE=DATE:${dateFormatted}`,
    `DTEND;VALUE=DATE:${dateFormatted}`,
    `SUMMARY:💰 Interest Due: ${loan.borrowerName} (${formatCurrency(loan.interestPerPeriod)})`,
    `DESCRIPTION:Interest collection of ${formatCurrency(loan.interestPerPeriod)} from ${loan.borrowerName}. Outstanding balance: ${formatCurrency(loan.currentOutstandingPrincipal)}.`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT9H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: Interest due today from ${loan.borrowerName}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(loan: LoanEntry) {
  const icsData = generateIcsFile(loan);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `interest-reminder-${loan.borrowerName.toLowerCase().replace(/\s+/g, '-')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
