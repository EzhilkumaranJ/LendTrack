import React, { useState } from 'react';
import { 
  TrendingUp, 
  Calculator, 
  Calendar, 
  Database, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Shield,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { LoanEntry, PaymentRecord } from '../types';
import { formatCurrency, formatDueDateBadge } from '../utils/dateUtils';

interface TabletSidebarInsightsProps {
  loans: LoanEntry[];
  onOpenAddLoan: () => void;
  onOpenCalendar: () => void;
  onOpenBackup: () => void;
  onViewHistory: (loan: LoanEntry) => void;
}

export const TabletSidebarInsights: React.FC<TabletSidebarInsightsProps> = ({
  loans,
  onOpenAddLoan,
  onOpenCalendar,
  onOpenBackup,
  onViewHistory,
}) => {
  // Quick Calculator state
  const [calcPrincipal, setCalcPrincipal] = useState<number | ''>(100000);
  const [calcRate, setCalcRate] = useState<number | ''>(2);
  const [calcPeriod, setCalcPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');

  // Compute monthly progress
  const currentMonthKey = '2026-08';
  let collectedThisMonth = 0;
  let scheduledThisMonth = 0;

  loans.forEach((loan) => {
    if (loan.status === 'active') {
      scheduledThisMonth += loan.interestPerPeriod;
    }
    loan.payments.forEach((p) => {
      if (p.date.startsWith(currentMonthKey) && p.type === 'interest') {
        collectedThisMonth += p.amount;
      }
    });
  });

  const totalMonthlyTarget = Math.max(scheduledThisMonth + collectedThisMonth, 1);
  const collectionPercentage = Math.min(
    100,
    Math.round((collectedThisMonth / (scheduledThisMonth > 0 ? scheduledThisMonth : totalMonthlyTarget)) * 100)
  );

  // Recent payments across all loans (last 4)
  const recentPayments: { payment: PaymentRecord; loan: LoanEntry }[] = [];
  loans.forEach((loan) => {
    loan.payments.forEach((p) => {
      recentPayments.push({ payment: p, loan });
    });
  });
  recentPayments.sort((a, b) => b.payment.date.localeCompare(a.payment.date));
  const latestPayments = recentPayments.slice(0, 4);

  // Quick Calculator Calculation
  const numP = typeof calcPrincipal === 'number' ? calcPrincipal : 0;
  const numR = typeof calcRate === 'number' ? calcRate : 0;
  let computedCalcInterest = 0;
  if (calcPeriod === 'monthly') {
    computedCalcInterest = (numP * numR) / 100;
  } else if (calcPeriod === 'weekly') {
    computedCalcInterest = ((numP * numR) / 100) / 4.33;
  } else {
    computedCalcInterest = ((numP * numR) / 100) / 12;
  }

  return (
    <div className="space-y-4">
      {/* 1. Tablet Collection Efficiency Hub */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                August Collection Rate
              </h3>
              <p className="text-[11px] text-slate-400">Monthly recovery progress</p>
            </div>
          </div>
          <span className="text-sm font-bold text-emerald-400">
            {collectionPercentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(collectionPercentage, 4)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Collected: <strong className="text-white">{formatCurrency(collectedThisMonth)}</strong></span>
            <span>Pending: <strong className="text-amber-400">{formatCurrency(scheduledThisMonth)}</strong></span>
          </div>
        </div>

        {/* Tablet Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
          <button
            id="tablet-new-entry-btn"
            onClick={onOpenAddLoan}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all active:scale-98 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Borrower</span>
          </button>
          <button
            id="tablet-calendar-sync-btn"
            onClick={onOpenCalendar}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold text-xs border border-slate-700/60 transition-all active:scale-98"
          >
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>Sync Reminders</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Interest Estimator Tool (Built for Tablet Multi-tasking) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/15 text-indigo-400 rounded-xl">
              <Calculator className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Quick Interest Estimator
            </h3>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
            Tablet Tool
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[10px] uppercase text-slate-400 font-medium block mb-1">
              Principal (₹)
            </label>
            <input
              type="number"
              value={calcPrincipal}
              onChange={(e) => setCalcPrincipal(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500"
              placeholder="100000"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase text-slate-400 font-medium block mb-1">
              Rate (% / mo)
            </label>
            <input
              type="number"
              step="0.1"
              value={calcRate}
              onChange={(e) => setCalcRate(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500"
              placeholder="2"
            />
          </div>
        </div>

        <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-300">Calculated Return:</span>
          <span className="text-base font-extrabold text-emerald-400">
            {formatCurrency(Math.round(computedCalcInterest))}<span className="text-xs font-normal text-slate-400">/mo</span>
          </span>
        </div>
      </div>

      {/* 3. Recent Payment Audit Trail */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-500/15 text-sky-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Recent Transactions
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Audit Trail</span>
        </div>

        {latestPayments.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-3">No payments recorded yet</p>
        ) : (
          <div className="space-y-2">
            {latestPayments.map(({ payment, loan }) => (
              <button
                key={payment.id}
                onClick={() => onViewHistory(loan)}
                className="w-full text-left bg-slate-950/60 hover:bg-slate-800/60 p-2.5 rounded-xl border border-slate-800/80 transition-all flex items-center justify-between group"
              >
                <div className="truncate pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                      {loan.borrowerName}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                      payment.type === 'interest'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : payment.type === 'principal'
                        ? 'bg-teal-500/20 text-teal-300'
                        : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {payment.type === 'skip_interest' ? 'Waived' : payment.type}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    {payment.date}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-emerald-400">
                    +{formatCurrency(payment.amount)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onOpenBackup}
          className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-1 flex items-center justify-center gap-1 transition-colors"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export or import data backup</span>
        </button>
      </div>
    </div>
  );
};
