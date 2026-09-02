import React from 'react';
import { 
  X, 
  History, 
  ArrowDownRight, 
  Calendar, 
  Receipt, 
  FileText, 
  Printer, 
  Share2, 
  CheckCircle2, 
  DollarSign, 
  TrendingDown,
  FastForward,
  ShieldCheck,
  BellOff
} from 'lucide-react';
import { LoanEntry, PaymentRecord } from '../types';
import { formatCurrency } from '../utils/dateUtils';

interface PaymentHistoryModalProps {
  loan: LoanEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPayment: (loan: LoanEntry) => void;
}

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({
  loan,
  isOpen,
  onClose,
  onOpenPayment,
}) => {
  if (!isOpen || !loan) return null;

  const sortedPayments = [...loan.payments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalInterestPaid = loan.payments
    .filter((p) => p.type === 'interest')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPrincipalPaid = loan.payments
    .filter((p) => p.type === 'principal' || p.type === 'full_settlement')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalInterestSkipped = loan.payments
    .filter((p) => p.type === 'skip_interest')
    .reduce((sum, p) => sum + p.amount, 0);

  const skippedCyclesCount = loan.payments.filter((p) => p.type === 'skip_interest').length;

  const printStatement = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div 
        id="payment-history-modal-content"
        className="bg-slate-900 border border-slate-800 w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Payment Ledger & History</h2>
              <p className="text-xs text-slate-400">Borrower: {loan.borrowerName}</p>
            </div>
          </div>
          <button
            id="close-history-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loan Financial Snapshot */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className={`grid ${totalInterestSkipped > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-2.5 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center`}>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Orig. Lent
              </span>
              <span className="text-sm font-bold text-white">
                {formatCurrency(loan.principalAmount)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Interest Paid
              </span>
              <span className="text-sm font-bold text-emerald-400">
                {formatCurrency(totalInterestPaid)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Remaining Bal
              </span>
              <span className="text-sm font-bold text-sky-400">
                {formatCurrency(loan.currentOutstandingPrincipal)}
              </span>
            </div>
            {totalInterestSkipped > 0 && (
              <div>
                <span className="text-[10px] text-purple-400 uppercase tracking-wider block font-semibold">
                  Skipped / Waived
                </span>
                <span className="text-sm font-bold text-purple-300">
                  {formatCurrency(totalInterestSkipped)}
                </span>
              </div>
            )}
          </div>

          {/* Repayment Terms Detail */}
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between text-slate-300">
            <div>
              <span className="text-slate-400 block text-[11px]">Active Plan:</span>
              <span className="font-semibold capitalize">
                {loan.interestRateType === 'flat_fee'
                  ? `₹${loan.interestRate} flat`
                  : `${loan.interestRate}% (${loan.interestRateType})`}{' '}
                • {loan.recurrence}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Next Due:</span>
              <span className="font-semibold text-emerald-300 font-mono">
                {loan.status === 'settled' ? 'Settled' : loan.nextInterestDueDate}
              </span>
            </div>
          </div>

          {totalInterestSkipped > 0 && (
            <div className="bg-purple-950/20 border border-purple-800/40 rounded-xl p-2.5 flex items-center gap-2 text-xs text-purple-300">
              <FastForward className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>
                <strong>{skippedCyclesCount} cycle(s) skipped</strong> ({formatCurrency(totalInterestSkipped)} waived). Principal was preserved without penalties.
              </span>
            </div>
          )}

          {/* Payments Timeline List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Transaction History ({loan.payments.length})
              </h3>
              {loan.payments.length > 0 && (
                <button
                  onClick={printStatement}
                  className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Ledger</span>
                </button>
              )}
            </div>

            {sortedPayments.length === 0 ? (
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-6 text-center text-xs text-slate-400">
                <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <span>No payments logged yet for this entry.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedPayments.map((p) => {
                  const isInterest = p.type === 'interest';
                  const isFull = p.type === 'full_settlement';
                  const isSkip = p.type === 'skip_interest';

                  return (
                    <div
                      key={p.id}
                      className={`border rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-colors ${
                        isSkip 
                          ? 'bg-purple-950/20 border-purple-800/40 hover:border-purple-700/60' 
                          : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSkip
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                              : isInterest
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isFull
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                          }`}
                        >
                          {isSkip ? <FastForward className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white capitalize">
                              {isSkip
                                ? 'Interest Skipped / Waived'
                                : p.type === 'full_settlement'
                                ? 'Full Settlement'
                                : p.type === 'principal'
                                ? 'Principal Paydown'
                                : 'Interest Payment'}
                            </span>
                            {p.receiptNumber && (
                              <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                {p.receiptNumber}
                              </span>
                            )}
                            {isSkip && (
                              <span className="text-[10px] bg-purple-900/60 text-purple-300 border border-purple-700/50 px-1.5 py-0.2 rounded font-medium">
                                Waived
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {p.date}
                            </span>
                            {p.notes && (
                              <span>• <span className="italic text-slate-300">{p.notes}</span></span>
                            )}
                            {isSkip && (
                              <span className="text-[10px] text-purple-400 font-medium">
                                (Principal unchanged)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-sm font-extrabold ${
                            isSkip
                              ? 'text-purple-300 line-through decoration-purple-500/60'
                              : isInterest
                              ? 'text-emerald-400'
                              : isFull
                              ? 'text-amber-400'
                              : 'text-cyan-400'
                          }`}
                        >
                          {isSkip ? `${formatCurrency(p.amount)}` : `+${formatCurrency(p.amount)}`}
                        </span>
                        {isSkip && (
                          <div className="text-[10px] text-purple-400/80 font-medium">
                            ₹0 Collected
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>

          {loan.status === 'active' && (
            <button
              onClick={() => {
                onClose();
                onOpenPayment(loan);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-700/30 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Payment / Skip</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
