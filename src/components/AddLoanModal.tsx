import React, { useState, useId } from 'react';
import { 
  X, 
  UserPlus, 
  DollarSign, 
  Percent, 
  Calendar, 
  Clock, 
  Shield, 
  Phone, 
  Mail, 
  Info,
  Sparkles
} from 'lucide-react';
import { LoanEntry, RecurrenceType } from '../types';
import { calculateInterestPerPeriod, formatCurrency, computeNextDueDate } from '../utils/dateUtils';

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLoan: (newLoan: LoanEntry) => void;
}

const AVATAR_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-cyan-500 to-blue-600',
];

export const AddLoanModal: React.FC<AddLoanModalProps> = ({
  isOpen,
  onClose,
  onAddLoan,
}) => {
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [principalAmount, setPrincipalAmount] = useState<number | ''>(100000);
  const [startDate, setStartDate] = useState<string>('2026-08-31');

  // Interest & Recurrence
  const [interestRate, setInterestRate] = useState<number | ''>(2);
  const [interestRateType, setInterestRateType] = useState<'monthly' | 'yearly' | 'flat_fee'>('monthly');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('monthly');
  const [customIntervalDays, setCustomIntervalDays] = useState<number>(30);
  const [dueDayOfMonth, setDueDayOfMonth] = useState<number>(31);
  const [firstDueDate, setFirstDueDate] = useState<string>('2026-09-30');

  const [collateralDescription, setCollateralDescription] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const numericPrincipal = typeof principalAmount === 'number' ? principalAmount : 0;
  const numericRate = typeof interestRate === 'number' ? interestRate : 0;

  const interestPerPeriod = calculateInterestPerPeriod(
    numericPrincipal,
    numericRate,
    interestRateType,
    recurrence
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim() || numericPrincipal <= 0) {
      alert('Please provide a borrower name and a valid principal amount.');
      return;
    }

    const randomGradient = AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)];

    const newLoan: LoanEntry = {
      id: `loan-${Date.now()}`,
      borrowerName: borrowerName.trim(),
      borrowerPhone: borrowerPhone.trim() || undefined,
      borrowerEmail: borrowerEmail.trim() || undefined,
      borrowerAvatarColor: randomGradient,
      principalAmount: numericPrincipal,
      currentOutstandingPrincipal: numericPrincipal,
      startDate: startDate || new Date().toISOString().split('T')[0],
      interestRate: numericRate,
      interestRateType,
      recurrence,
      customIntervalDays: recurrence === 'custom_days' ? customIntervalDays : undefined,
      dueDayOfMonth: recurrence === 'monthly' ? dueDayOfMonth : undefined,
      nextInterestDueDate: firstDueDate || computeNextDueDate(startDate, recurrence, customIntervalDays, dueDayOfMonth),
      interestPerPeriod: Number(interestPerPeriod.toFixed(2)),
      status: 'active',
      notes: notes.trim() || undefined,
      collateralDescription: collateralDescription.trim() || undefined,
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddLoan(newLoan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div 
        id="add-loan-modal-content"
        className="bg-slate-900 border border-slate-800 w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col my-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add Borrower & Loan Entry</h2>
              <p className="text-xs text-slate-400">Set principal amount & repeating due dates</p>
            </div>
          </div>
          <button
            id="close-add-loan-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Borrower Info Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Borrower Information
            </h3>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Borrower Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-borrower-name"
                type="text"
                required
                placeholder="e.g., Rajesh Sharma"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone (for SMS/WhatsApp reminders)
                </label>
                <input
                  id="input-borrower-phone"
                  type="tel"
                  placeholder="+91 98000 00000"
                  value={borrowerPhone}
                  onChange={(e) => setBorrowerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email (Optional)
                </label>
                <input
                  id="input-borrower-email"
                  type="email"
                  placeholder="borrower@example.com"
                  value={borrowerEmail}
                  onChange={(e) => setBorrowerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Loan Principal Section */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              2. Principal & Lending Terms
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Principal Lent (₹) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                  <input
                    id="input-principal-amount"
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white font-bold placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Lending Start Date
                </label>
                <input
                  id="input-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    const dayOfStart = parseInt(newStart.split('-')[2], 10) || 1;
                    setStartDate(newStart);
                    if (recurrence === 'monthly') {
                      setDueDayOfMonth(dayOfStart);
                    }
                    setFirstDueDate(computeNextDueDate(newStart, recurrence, customIntervalDays, dayOfStart));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Interest Rate & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Interest Rate / Fee <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="input-interest-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    {interestRateType === 'flat_fee' ? '₹ Flat Fee' : '%'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Rate Frequency
                </label>
                <select
                  id="select-interest-type"
                  value={interestRateType}
                  onChange={(e) => setInterestRateType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="monthly">% Monthly (₹ per ₹100 / month - Standard)</option>
                  <option value="yearly">% Annual (Per annum / APR)</option>
                  <option value="flat_fee">₹ Fixed Flat Fee per cycle</option>
                </select>
              </div>
            </div>
          </div>

          {/* Repeating Due Date & Recurrence Schedule */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              3. Repeating Due Date & Reminder Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Collection Frequency
                </label>
                <select
                  id="select-recurrence"
                  value={recurrence}
                  onChange={(e) => {
                    const rec = e.target.value as RecurrenceType;
                    setRecurrence(rec);
                    setFirstDueDate(computeNextDueDate(startDate, rec, customIntervalDays, dueDayOfMonth));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="monthly">Monthly (Same Day Every Month)</option>
                  <option value="weekly">Weekly (Every 7 Days)</option>
                  <option value="biweekly">Bi-weekly (Every 14 Days)</option>
                  <option value="quarterly">Quarterly (Every 3 Months)</option>
                  <option value="one_time">One-Time Due Date</option>
                </select>
              </div>

              {recurrence === 'monthly' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Monthly Due Day (1 - 31)
                  </label>
                  <input
                    id="input-due-day"
                    type="number"
                    min="1"
                    max="31"
                    value={dueDayOfMonth}
                    onChange={(e) => {
                      const day = parseInt(e.target.value, 10) || 1;
                      setDueDayOfMonth(day);
                      setFirstDueDate(computeNextDueDate(startDate, recurrence, customIntervalDays, day));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  First Due Date
                </label>
                <input
                  id="input-first-due-date"
                  type="date"
                  required
                  value={firstDueDate}
                  onChange={(e) => setFirstDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {recurrence === 'monthly' && (
              <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                💡 <span className="text-slate-300 font-medium">Monthly Rule:</span> Repeats on the same day every month (e.g. {dueDayOfMonth === 1 ? '1st' : dueDayOfMonth === 2 ? '2nd' : dueDayOfMonth === 3 ? '3rd' : `${dueDayOfMonth}th`} of every month). In shorter months (like Feb or 30-day months without 31st), it rolls to the 1st of the next month.
              </p>
            )}

            {/* Live Calculation Preview Callout */}
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-emerald-300/80 font-medium block">
                    Fixed Periodic Interest
                  </span>
                  <span className="text-lg font-extrabold text-emerald-400">
                    {formatCurrency(interestPerPeriod)}
                  </span>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-400">
                <span className="text-slate-300 font-semibold block capitalize">
                  {recurrence}
                </span>
                <span>Auto-advances every cycle</span>
              </div>
            </div>
          </div>

          {/* Notes & Collateral Section */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              4. Additional Details & Collateral
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-slate-400" /> Collateral or Security Guarantee
              </label>
              <input
                id="input-collateral"
                type="text"
                placeholder="e.g. Vehicle title, equipment serial number, promissory note"
                value={collateralDescription}
                onChange={(e) => setCollateralDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Notes & Terms Summary
              </label>
              <textarea
                id="input-notes"
                rows={2}
                placeholder="Specific repayment conditions, borrower agreement notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5 sticky bottom-0 bg-slate-900 py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-add-loan-btn"
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-600/30 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Loan Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
