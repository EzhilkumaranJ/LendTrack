import React from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Share2, 
  ExternalLink, 
  AlertCircle, 
  DollarSign, 
  History, 
  ArrowUpRight,
  Send,
  FastForward,
  BellOff
} from 'lucide-react';
import { LoanEntry, PaymentType } from '../types';
import { 
  formatCurrency, 
  formatDueDateBadge, 
  generateGoogleCalendarUrl, 
  downloadIcs 
} from '../utils/dateUtils';

interface UpcomingInterestListProps {
  loans: LoanEntry[];
  onOpenPayment: (loan: LoanEntry, initialType?: PaymentType) => void;
  onViewHistory: (loan: LoanEntry) => void;
  onOpenCalendarModal: (loan?: LoanEntry) => void;
}

export const UpcomingInterestList: React.FC<UpcomingInterestListProps> = ({
  loans,
  onOpenPayment,
  onViewHistory,
  onOpenCalendarModal,
}) => {
  // Filter active loans and sort strictly by nextInterestDueDate ascending
  const activeLoans = loans
    .filter((l) => l.status === 'active')
    .sort((a, b) => a.nextInterestDueDate.localeCompare(b.nextInterestDueDate));

  const handleShareReminder = (loan: LoanEntry) => {
    const text = `Hi ${loan.borrowerName}, this is a gentle reminder that your interest payment of ${formatCurrency(
      loan.interestPerPeriod
    )} is due on ${loan.nextInterestDueDate}. Outstanding balance: ${formatCurrency(
      loan.currentOutstandingPrincipal
    )}. Thank you!`;

    if (navigator.share) {
      navigator.share({
        title: `Payment Reminder - ${loan.borrowerName}`,
        text: text,
      }).catch(() => {});
    } else {
      // Copy to clipboard or open WhatsApp
      if (loan.borrowerPhone) {
        const cleanPhone = loan.borrowerPhone.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
      } else {
        navigator.clipboard.writeText(text);
        alert('Reminder message copied to clipboard!');
      }
    }
  };

  if (activeLoans.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-6 h-6 text-slate-500" />
        </div>
        <h3 className="text-base font-bold text-white">No Upcoming Interest Due</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          All loans are settled or up to date. Add a new borrower loan entry to start tracking repeating interest collections.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-amber-500/15 text-amber-400 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-white">Upcoming Interest Schedule</h2>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
            {activeLoans.length} scheduled
          </span>
        </div>
        <span className="text-[11px] text-slate-400">Sorted by due date</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {activeLoans.map((loan) => {
          const badge = formatDueDateBadge(loan.nextInterestDueDate);
          const isOverdue = badge.status === 'overdue';
          const isToday = badge.status === 'today';

          return (
            <div
              key={loan.id}
              id={`loan-card-${loan.id}`}
              className={`rounded-2xl p-4 transition-all duration-200 border relative overflow-hidden flex flex-col justify-between ${
                isOverdue
                  ? 'bg-rose-950/20 border-rose-800/60 shadow-lg shadow-rose-950/20'
                  : isToday
                  ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-950/20'
                  : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700'
              }`}
            >
              {/* Top Row: Borrower Info & Due Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${loan.borrowerAvatarColor} flex items-center justify-center text-white font-bold text-base shadow-md`}
                  >
                    {loan.borrowerName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
                      {loan.borrowerName}
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Bal: {formatCurrency(loan.currentOutstandingPrincipal)}</span>
                      <span>•</span>
                      <span className="capitalize text-slate-300">
                        {loan.interestRateType === 'flat_fee'
                          ? `₹${loan.interestRate} flat`
                          : `${loan.interestRate}% ${loan.recurrence}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {loan.remindersMutedUntil && loan.nextInterestDueDate <= loan.remindersMutedUntil && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium" title="Reminders silenced for this cycle">
                        <BellOff className="w-3 h-3" />
                        <span className="hidden sm:inline">Muted</span>
                      </span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-block ${badge.badgeClass}`}>
                      {badge.text}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    {loan.nextInterestDueDate}
                  </div>
                </div>
              </div>

              {/* Interest Amount Callout Box */}
              <div className="my-3.5 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium block">
                    Interest Due
                  </span>
                  <div className="text-xl font-extrabold text-emerald-400 tracking-tight">
                    {formatCurrency(loan.interestPerPeriod)}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium block">
                    Recurrence Plan
                  </span>
                  <div className="text-xs font-semibold text-slate-300 capitalize">
                    {loan.recurrence === 'custom_days'
                      ? `Every ${loan.customIntervalDays} days`
                      : loan.dueDayOfMonth
                      ? `Monthly (on day ${loan.dueDayOfMonth})`
                      : loan.recurrence}
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                <div className="flex items-center gap-1">
                  {/* Google Calendar 1-Click Link */}
                  <a
                    id={`gcal-link-${loan.id}`}
                    href={generateGoogleCalendarUrl(loan)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Add event to Google Calendar"
                    className="p-2 rounded-xl bg-slate-800 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 transition-colors flex items-center gap-1 text-xs font-medium"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="hidden sm:inline">Google Cal</span>
                  </a>

                  {/* Share SMS / WhatsApp Reminder */}
                  <button
                    id={`share-btn-${loan.id}`}
                    onClick={() => handleShareReminder(loan)}
                    title="Send reminder via WhatsApp / Share"
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>

                  {/* Payment History View */}
                  <button
                    id={`history-btn-${loan.id}`}
                    onClick={() => onViewHistory(loan)}
                    title="View borrower payment history"
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors relative"
                  >
                    <History className="w-4 h-4" />
                    {loan.payments.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-slate-700 text-slate-300 text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                        {loan.payments.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Right Action Group: Skip & Collect */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    id={`skip-btn-${loan.id}`}
                    onClick={() => onOpenPayment(loan, 'skip_interest')}
                    title="Skip interest collection for this period"
                    className="flex items-center gap-1 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-800/60 text-xs font-semibold px-2.5 py-2 rounded-xl transition-all active:scale-95"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>Skip</span>
                  </button>

                  <button
                    id={`collect-btn-${loan.id}`}
                    onClick={() => onOpenPayment(loan, 'interest')}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md shadow-emerald-700/30 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Collect</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
