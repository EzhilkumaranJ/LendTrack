import React from 'react';
import { DollarSign, TrendingUp, Users, AlertCircle, Clock } from 'lucide-react';
import { LoanEntry } from '../types';
import { formatCurrency } from '../utils/dateUtils';

interface DashboardStatsProps {
  loans: LoanEntry[];
  currentMonthKey: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ loans, currentMonthKey }) => {
  // 1. Total Outstanding Principal
  const totalOutstanding = loans
    .filter((l) => l.status === 'active')
    .reduce((sum, l) => sum + l.currentOutstandingPrincipal, 0);

  // 2. Original Principal Lent
  const totalPrincipalLent = loans.reduce((sum, l) => sum + l.principalAmount, 0);

  // 3. Current Month's Collected Interest & Waived Interest
  let thisMonthInterestCollected = 0;
  let thisMonthPrincipalCollected = 0;
  let thisMonthInterestSkipped = 0;
  loans.forEach((l) => {
    l.payments.forEach((p) => {
      if (p.date.startsWith(currentMonthKey)) {
        if (p.type === 'interest') {
          thisMonthInterestCollected += p.amount;
        } else if (p.type === 'principal' || p.type === 'full_settlement') {
          thisMonthPrincipalCollected += p.amount;
        } else if (p.type === 'skip_interest') {
          thisMonthInterestSkipped += p.amount;
        }
      }
    });
  });

  // 4. Expected / Upcoming Active Interest (total per period)
  const expectedMonthlyInterest = loans
    .filter((l) => l.status === 'active')
    .reduce((sum, l) => sum + l.interestPerPeriod, 0);

  // 5. Overdue / Due Today loans (excluding muted ones)
  const todayStr = '2026-08-31';
  const overdueCount = loans.filter(
    (l) => l.status === 'active' && 
           l.nextInterestDueDate < todayStr && 
           !l.remindersMuted &&
           !(l.remindersMutedUntil && l.nextInterestDueDate <= l.remindersMutedUntil)
  ).length;
  const dueTodayCount = loans.filter(
    (l) => l.status === 'active' && 
           l.nextInterestDueDate === todayStr && 
           !l.remindersMuted &&
           !(l.remindersMutedUntil && l.nextInterestDueDate <= l.remindersMutedUntil)
  ).length;

  const activeBorrowersCount = loans.filter((l) => l.status === 'active').length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Total Outstanding Balance */}
      <div 
        id="stat-outstanding-card"
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Outstanding</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
            ₹
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
            <span>{activeBorrowersCount} active loans</span>
            <span className="text-slate-500">Orig: {formatCurrency(totalPrincipalLent)}</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-sky-500 opacity-80" />
      </div>

      {/* 2. Monthly Collected Interest */}
      <div 
        id="stat-monthly-earnings-card"
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">August Collected</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-400">
            {formatCurrency(thisMonthInterestCollected)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
            <span>Interest Earned</span>
            <div className="flex items-center gap-1.5 font-medium">
              {thisMonthPrincipalCollected > 0 && (
                <span className="text-teal-400">+{formatCurrency(thisMonthPrincipalCollected)} princ.</span>
              )}
              {thisMonthInterestSkipped > 0 && (
                <span className="text-purple-300 text-[10px] bg-purple-950/60 px-1 py-0.2 rounded border border-purple-800/40">
                  {formatCurrency(thisMonthInterestSkipped)} waived
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80" />
      </div>

      {/* 3. Expected Periodic Interest */}
      <div 
        id="stat-projected-interest-card"
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Projected Yield</span>
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-sky-300">
            {formatCurrency(expectedMonthlyInterest)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Per repeating cycle
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-blue-600 opacity-80" />
      </div>

      {/* 4. Overdue / Due Today alerts */}
      <div 
        id="stat-alerts-card"
        className={`border rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between ${
          overdueCount > 0
            ? 'bg-rose-950/30 border-rose-800/60'
            : dueTodayCount > 0
            ? 'bg-amber-950/30 border-amber-800/60'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Action Required</span>
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
            overdueCount > 0
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
          }`}>
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {overdueCount > 0 ? (
              <span className="text-rose-400">{overdueCount} Overdue</span>
            ) : dueTodayCount > 0 ? (
              <span className="text-amber-300">{dueTodayCount} Due Today</span>
            ) : (
              <span className="text-emerald-400">All Current</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {dueTodayCount > 0 && overdueCount > 0 ? `${dueTodayCount} also due today` : 'Automated reminder active'}
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${
          overdueCount > 0 ? 'bg-rose-500' : dueTodayCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
        } opacity-80`} />
      </div>
    </div>
  );
};
