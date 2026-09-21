import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  Phone, 
  Mail, 
  History, 
  CheckCircle2, 
  MoreVertical, 
  FileText,
  Shield,
  Trash2,
  Edit2,
  FastForward,
  BellOff,
  Database,
  Download,
  Upload,
  Clock,
  AlertTriangle,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { LoanEntry, PaymentType } from '../types';
import { 
  formatCurrency, 
  formatDueDateBadge, 
  calculateLoanTermDelayMetrics 
} from '../utils/dateUtils';

interface BorrowersListProps {
  loans: LoanEntry[];
  onOpenPayment: (loan: LoanEntry, initialType?: PaymentType) => void;
  onViewHistory: (loan: LoanEntry) => void;
  onDeleteLoan: (loanId: string) => void;
  onOpenAddLoan: () => void;
  onOpenBackup?: () => void;
  onEditLoan?: (loan: LoanEntry) => void;
}

export const BorrowersList: React.FC<BorrowersListProps> = ({
  loans,
  onOpenPayment,
  onViewHistory,
  onDeleteLoan,
  onOpenAddLoan,
  onOpenBackup,
  onEditLoan,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'settled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDelayLoanId, setExpandedDelayLoanId] = useState<string | null>(null);

  const filteredLoans = loans.filter((l) => {
    const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchesSearch =
      l.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.borrowerPhone && l.borrowerPhone.includes(searchQuery)) ||
      (l.notes && l.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="borrower-search-input"
            type="text"
            placeholder="Search borrower name, phone, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              id="borrower-filter-all"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'all'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({loans.length})
            </button>
            <button
              id="borrower-filter-active"
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'active'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active ({loans.filter((l) => l.status === 'active').length})
            </button>
            <button
              id="borrower-filter-settled"
              onClick={() => setFilterStatus('settled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === 'settled'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Settled ({loans.filter((l) => l.status === 'settled').length})
            </button>
          </div>

          {onOpenBackup && (
            <button
              id="borrowers-backup-btn"
              onClick={onOpenBackup}
              title="Export/Import Backup Data"
              className="hidden sm:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Backup</span>
            </button>
          )}
        </div>
      </div>

      {/* Borrowers Grid */}
      {filteredLoans.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white">No borrower entries found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search or add a new borrower.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredLoans.map((loan) => {
            const badge = formatDueDateBadge(loan.nextInterestDueDate);
            const totalInterestPaid = loan.payments
              .filter((p) => p.type === 'interest')
              .reduce((sum, p) => sum + p.amount, 0);
            const totalPrincipalPaid = loan.payments
              .filter((p) => p.type === 'principal' || p.type === 'full_settlement')
              .reduce((sum, p) => sum + p.amount, 0);

            const isSettled = loan.status === 'settled';
            const delayMetrics = calculateLoanTermDelayMetrics(loan, '2026-08-31');
            const isDelayExpanded = expandedDelayLoanId === loan.id;

            return (
              <div
                key={loan.id}
                id={`borrower-item-${loan.id}`}
                className={`rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between ${
                  isSettled
                    ? 'bg-slate-900/60 border-slate-800/60 opacity-85'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Card Header with Borrower Info & Edit / Delete Controls */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr ${loan.borrowerAvatarColor} flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0`}
                      >
                        {loan.borrowerName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm text-white truncate">{loan.borrowerName}</h3>
                          {isSettled ? (
                            <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                              SETTLED
                            </span>
                          ) : (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badge.badgeClass}`}>
                              {badge.text}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                          {loan.borrowerPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{loan.borrowerPhone}</span>
                            </span>
                          )}
                          {loan.borrowerEmail && (
                            <span className="hidden sm:flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{loan.borrowerEmail}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Edit Borrower Details anytime + Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      {onEditLoan && (
                        <button
                          id={`edit-borrower-btn-${loan.id}`}
                          onClick={() => onEditLoan(loan)}
                          title="Edit borrower details anytime"
                          className="px-2 py-1.5 text-slate-300 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold border border-slate-800 bg-slate-850"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete the loan for ${loan.borrowerName}?`)) {
                            onDeleteLoan(loan.id);
                          }
                        }}
                        title="Delete loan entry"
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Financial Overview Metrics */}
                  <div className="grid grid-cols-3 gap-2 my-3 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                        Outstanding
                      </span>
                      <span className={`text-sm font-bold ${isSettled ? 'text-slate-400' : 'text-white'}`}>
                        {formatCurrency(loan.currentOutstandingPrincipal)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                        Interest Paid
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        {formatCurrency(totalInterestPaid)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                        Per Cycle
                      </span>
                      <span className="text-sm font-bold text-sky-400">
                        {formatCurrency(loan.interestPerPeriod)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Timeline, Gaps & Total Delayed Days Analytics Column */}
                  <div className="mb-3 p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-white tracking-tight">
                          Payment Timeline & Delayed Days
                        </span>
                      </div>
                      <span 
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          delayMetrics.totalDelayedDays > 0 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {delayMetrics.totalDelayedDays > 0
                          ? `${delayMetrics.totalDelayedDays} Days Delayed in Term`
                          : 'On Track (0 Days Delay)'}
                      </span>
                    </div>

                    {/* Automatic Date Difference & Skipped Payment Breakdown Column */}
                    <div className="grid grid-cols-3 gap-1.5 text-[11px] pt-1 border-t border-slate-800/70">
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/60">
                        <span className="text-slate-400 block text-[10px] font-medium">Loan Term So Far:</span>
                        <span className="font-bold text-white text-xs">
                          {delayMetrics.daysFromStartToToday} days
                        </span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">
                          Started: {loan.startDate}
                        </span>
                      </div>

                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/60">
                        <span className="text-slate-400 block text-[10px] font-medium">Skipped Payments:</span>
                        <span className={`font-bold text-xs ${delayMetrics.skippedPaymentsCount > 0 ? 'text-purple-300' : 'text-slate-300'}`}>
                          {delayMetrics.skippedPaymentsCount} cycle{delayMetrics.skippedPaymentsCount === 1 ? '' : 's'}
                        </span>
                        <span className="block text-[9px] text-purple-400/90 mt-0.5">
                          +{delayMetrics.skippedEquivalentDays}d deferred
                        </span>
                      </div>

                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/60">
                        <span className="text-slate-400 block text-[10px] font-medium">Current Overdue:</span>
                        <span className={`font-bold text-xs ${delayMetrics.currentOverdueDays > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {delayMetrics.currentOverdueDays > 0 ? `${delayMetrics.currentOverdueDays} days` : '0 days'}
                        </span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">
                          Due: {loan.nextInterestDueDate}
                        </span>
                      </div>
                    </div>

                    {/* Detailed Payment Gaps / Interval Audit (Dates of payment from starting) */}
                    {delayMetrics.paymentGaps.length > 0 ? (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setExpandedDelayLoanId(isDelayExpanded ? null : loan.id)}
                          className="w-full flex items-center justify-between text-[10px] text-slate-400 hover:text-slate-200 py-0.5 transition-colors"
                        >
                          <span>Date difference logs ({delayMetrics.paymentGaps.length} payment{delayMetrics.paymentGaps.length === 1 ? '' : 's'})</span>
                          <span className="text-emerald-400 font-semibold">{isDelayExpanded ? 'Hide' : 'Show Details'}</span>
                        </button>

                        {isDelayExpanded && (
                          <div className="mt-1.5 space-y-1 max-h-36 overflow-y-auto bg-slate-900/95 p-2 rounded-lg border border-slate-800 text-[10px]">
                            {delayMetrics.paymentGaps.map((gap, i) => (
                              <div key={i} className="flex items-center justify-between py-1 border-b border-slate-800/50 last:border-0">
                                <span className="text-slate-300 font-medium">
                                  {gap.date} <span className="text-slate-500">({gap.type.replace('_', ' ')})</span>
                                </span>
                                <div className="text-right">
                                  <span className="text-amber-300 font-bold block">
                                    Day {gap.daysFromStart} from start
                                  </span>
                                  <span className="text-slate-400 text-[9px]">
                                    +{gap.daysSincePrevious}d interval
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic pt-0.5">
                        No payments recorded yet since start date ({loan.startDate}).
                      </div>
                    )}
                  </div>

                  {/* Terms Details */}
                  <div className="space-y-1 text-xs text-slate-300 mb-3 bg-slate-800/30 p-2 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rate & Terms:</span>
                      <span className="font-medium capitalize">
                        {loan.interestRateType === 'flat_fee'
                          ? `₹${loan.interestRate} flat fee`
                          : `${loan.interestRate}% (${loan.interestRateType})`}{' '}
                        • {loan.recurrence}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Started:</span>
                      <span className="font-medium">{loan.startDate} (Orig: {formatCurrency(loan.principalAmount)})</span>
                    </div>
                    {loan.collateralDescription && (
                      <div className="flex justify-between text-amber-300/90 text-[11px]">
                        <span className="text-slate-400">Collateral:</span>
                        <span className="truncate max-w-[180px]">{loan.collateralDescription}</span>
                      </div>
                    )}
                    {loan.notes && (
                      <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/60 truncate">
                        "{loan.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60 mt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onViewHistory(loan)}
                      className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors font-medium"
                    >
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      <span>History ({loan.payments.length})</span>
                    </button>
                  </div>

                  {!isSettled && (
                    <div className="flex items-center gap-1.5">
                      <button
                        id={`borrower-skip-btn-${loan.id}`}
                        onClick={() => onOpenPayment(loan, 'skip_interest')}
                        title="Skip/Waive interest for this cycle"
                        className="flex items-center gap-1 text-xs font-semibold text-purple-300 bg-purple-950/40 border border-purple-800/50 hover:bg-purple-900/40 px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
                      >
                        <FastForward className="w-3 h-3" />
                        <span>Skip</span>
                      </button>

                      <button
                        id={`borrower-pay-btn-${loan.id}`}
                        onClick={() => onOpenPayment(loan, 'interest')}
                        className="flex items-center gap-1 text-xs font-bold text-white px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-all shadow-sm active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pay</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
