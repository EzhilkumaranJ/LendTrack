import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Receipt, 
  Sparkles, 
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  FastForward,
  BellOff,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LoanEntry, PaymentRecord, PaymentType } from '../types';
import { 
  formatCurrency, 
  computeNextDueDate, 
  calculateInterestPerPeriod 
} from '../utils/dateUtils';
import { playNotificationSound } from '../utils/notifications';

interface PaymentModalProps {
  loan: LoanEntry | null;
  isOpen: boolean;
  initialType?: PaymentType;
  onClose: () => void;
  onRecordPayment: (
    loanId: string,
    payment: PaymentRecord,
    newOutstandingPrincipal: number,
    nextDueDate: string,
    newStatus: 'active' | 'settled',
    muteReminders?: boolean
  ) => void;
}

const SKIP_REASONS = [
  'Amount lent in middle of month (Grace period)',
  'First cycle introductory waiver',
  'Festival / Special goodwill concession',
  'Mutual agreement / Temporary deferral',
  'Other / Custom reason',
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  loan,
  isOpen,
  initialType = 'interest',
  onClose,
  onRecordPayment,
}) => {
  const [paymentType, setPaymentType] = useState<PaymentType>(initialType);
  const [amount, setAmount] = useState<number | ''>(loan?.interestPerPeriod ?? 0);
  const [paymentDate, setPaymentDate] = useState<string>('2026-08-31');
  const [notes, setNotes] = useState('');
  const [selectedSkipReason, setSelectedSkipReason] = useState<string>(SKIP_REASONS[0]);
  const [customSkipReason, setCustomSkipReason] = useState<string>('');
  const [muteReminders, setMuteReminders] = useState<boolean>(true);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [customNextDate, setCustomNextDate] = useState<string>('');

  // Sync state whenever active loan, initialType, or paymentType changes
  useEffect(() => {
    if (!loan) return;

    const autoNextDate = computeNextDueDate(
      loan.nextInterestDueDate,
      loan.recurrence,
      loan.customIntervalDays,
      loan.dueDayOfMonth
    );
    setCustomNextDate(autoNextDate);
    setReceiptNumber(`REC-${Date.now().toString().slice(-5)}`);

    if (isOpen && initialType) {
      setPaymentType(initialType);
    }
  }, [loan, isOpen, initialType]);

  useEffect(() => {
    if (!loan) return;

    if (paymentType === 'interest' || paymentType === 'skip_interest') {
      setAmount(loan.interestPerPeriod);
      if (paymentType === 'skip_interest') {
        setMuteReminders(true);
      }
    } else if (paymentType === 'full_settlement') {
      setAmount(loan.currentOutstandingPrincipal + loan.interestPerPeriod);
    } else if (paymentType === 'principal') {
      setAmount(Math.min(25000, loan.currentOutstandingPrincipal));
    }
  }, [paymentType, loan]);

  if (!isOpen || !loan) return null;

  const numericAmount = typeof amount === 'number' ? amount : 0;

  // Calculate resulting principal (Skip interest strictly leaves principal untouched!)
  let newPrincipal = loan.currentOutstandingPrincipal;
  let newStatus: 'active' | 'settled' = 'active';

  if (paymentType === 'principal') {
    newPrincipal = Math.max(0, loan.currentOutstandingPrincipal - numericAmount);
    if (newPrincipal === 0) newStatus = 'settled';
  } else if (paymentType === 'full_settlement') {
    newPrincipal = 0;
    newStatus = 'settled';
  } else if (paymentType === 'skip_interest') {
    newPrincipal = loan.currentOutstandingPrincipal; // Untouched!
    newStatus = 'active';
  }

  const newInterestPerPeriod = calculateInterestPerPeriod(
    newPrincipal,
    loan.interestRate,
    loan.interestRateType,
    loan.recurrence
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount < 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const finalReason = paymentType === 'skip_interest'
      ? (selectedSkipReason === 'Other / Custom reason' ? customSkipReason.trim() || 'Interest skipped' : selectedSkipReason)
      : notes.trim();

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      loanId: loan.id,
      amount: numericAmount,
      type: paymentType,
      date: paymentDate || new Date().toISOString().split('T')[0],
      notes: finalReason || undefined,
      skipReason: paymentType === 'skip_interest' ? finalReason : undefined,
      receiptNumber: paymentType === 'skip_interest' ? undefined : receiptNumber.trim() || undefined,
    };

    if (paymentType === 'skip_interest') {
      playNotificationSound('reminder');
    } else {
      // Confetti celebration & audio chime
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b'],
        });
        playNotificationSound('payment');
      } catch {}
    }

    onRecordPayment(
      loan.id,
      newPayment,
      newPrincipal,
      paymentType === 'full_settlement' ? loan.nextInterestDueDate : customNextDate,
      newStatus,
      paymentType === 'skip_interest' ? muteReminders : false
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div 
        id="payment-modal-content"
        className="bg-slate-900 border border-slate-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              paymentType === 'skip_interest' 
                ? 'bg-purple-500/20 text-purple-400' 
                : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {paymentType === 'skip_interest' ? <FastForward className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {paymentType === 'skip_interest' ? 'Skip Interest Collection' : 'Record Payment'}
              </h2>
              <p className="text-xs text-slate-400">Borrower: {loan.borrowerName}</p>
            </div>
          </div>
          <button
            id="close-payment-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Card */}
        <div className="p-4 mx-5 mt-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              Outstanding Principal
            </span>
            <span className="text-lg font-bold text-white">
              {formatCurrency(loan.currentOutstandingPrincipal)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              Period Interest
            </span>
            <span className="text-lg font-extrabold text-emerald-400">
              {formatCurrency(loan.interestPerPeriod)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Payment Type Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Action Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                id="pay-type-interest"
                onClick={() => setPaymentType('interest')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                  paymentType === 'interest'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Interest
              </button>
              <button
                type="button"
                id="pay-type-principal"
                onClick={() => setPaymentType('principal')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                  paymentType === 'principal'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Principal
              </button>
              <button
                type="button"
                id="pay-type-settlement"
                onClick={() => setPaymentType('full_settlement')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                  paymentType === 'full_settlement'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Full Settle
              </button>
              <button
                type="button"
                id="pay-type-skip"
                onClick={() => setPaymentType('skip_interest')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center flex items-center justify-center gap-1 ${
                  paymentType === 'skip_interest'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-purple-300'
                }`}
              >
                <FastForward className="w-3 h-3" />
                <span>Skip Interest</span>
              </button>
            </div>
          </div>

          {/* Conditional form fields based on type */}
          {paymentType === 'skip_interest' ? (
            /* SKIP INTEREST WORKFLOW */
            <div className="space-y-3.5">
              {/* Skip Safeguard Callout */}
              <div className="bg-purple-950/30 border border-purple-800/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-purple-200 leading-relaxed">
                    <strong className="text-purple-100 block mb-0.5">Principal is Protected & Unaltered</strong>
                    Skipping interest will <strong>not</strong> add anything to the principal balance ({formatCurrency(loan.currentOutstandingPrincipal)} remains unchanged). The skipped period of {formatCurrency(loan.interestPerPeriod)} is logged separately for your records.
                  </div>
                </div>
              </div>

              {/* Reason for Skipping */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Reason for Skipping Collection <span className="text-purple-400">*</span>
                </label>
                <select
                  id="select-skip-reason"
                  value={selectedSkipReason}
                  onChange={(e) => setSelectedSkipReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 mb-2"
                >
                  {SKIP_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {selectedSkipReason === 'Other / Custom reason' && (
                  <input
                    id="input-custom-skip-reason"
                    type="text"
                    placeholder="Enter specific reason (e.g. lent on 18th, waiving first 12 days)"
                    value={customSkipReason}
                    onChange={(e) => setCustomSkipReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                )}
              </div>

              {/* Effective Date & Next Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Skipped Cycle Date
                  </label>
                  <input
                    id="input-skip-date"
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center justify-between">
                    <span>Next Due Date</span>
                    <span className="text-[10px] text-slate-400 font-normal">Advances</span>
                  </label>
                  <input
                    id="input-skip-next-due-date"
                    type="date"
                    required
                    value={customNextDate}
                    onChange={(e) => setCustomNextDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Reminder Switch Off Option */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
                    <BellOff className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Switch Off Reminders for this Cycle
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Mutes upcoming & overdue alerts until next due date ({customNextDate})
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="toggle-mute-reminders"
                  checked={muteReminders}
                  onChange={(e) => setMuteReminders(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
                />
              </div>
            </div>
          ) : (
            /* STANDARD PAYMENT WORKFLOW */
            <>
              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Amount Received (₹) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                    <input
                      id="input-payment-amount"
                      type="number"
                      min="0.01"
                      step="any"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Payment Date
                  </label>
                  <input
                    id="input-payment-date"
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Next Due Date Schedule */}
              {paymentType !== 'full_settlement' && (
                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Next Repeating Due Date
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      Auto-advanced ({loan.recurrence})
                    </span>
                  </div>
                  <input
                    id="input-next-due-date-adjust"
                    type="date"
                    required
                    value={customNextDate}
                    onChange={(e) => setCustomNextDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Receipt & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Receipt / Ref #
                  </label>
                  <input
                    id="input-receipt-number"
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Payment Memo / Mode
                  </label>
                  <input
                    id="input-payment-memo"
                    type="text"
                    placeholder="e.g. Cash, UPI, Bank Transfer"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Outcome Summary Callout */}
              <div className="bg-slate-950/90 rounded-2xl p-3 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>New Remaining Balance:</span>
                  <span className={`font-bold ${newStatus === 'settled' ? 'text-emerald-400' : 'text-white'}`}>
                    {formatCurrency(newPrincipal)} {newStatus === 'settled' && '(Fully Cleared!)'}
                  </span>
                </div>
                {newStatus === 'active' && (
                  <div className="flex justify-between text-slate-400">
                    <span>Next Cycle Interest:</span>
                    <span className="font-semibold text-emerald-400">
                      {formatCurrency(newInterestPerPeriod)} (Due {customNextDate})
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-payment-btn"
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95 flex items-center gap-1.5 ${
                paymentType === 'skip_interest'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-600/30'
              }`}
            >
              {paymentType === 'skip_interest' ? (
                <>
                  <FastForward className="w-4 h-4" />
                  <span>Confirm & Skip Period</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Advance Schedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

