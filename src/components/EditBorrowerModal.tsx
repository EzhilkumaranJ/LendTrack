import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  DollarSign, 
  Percent, 
  Calendar, 
  Clock, 
  Shield, 
  Phone, 
  Mail, 
  Info,
  Check,
  Trash2
} from 'lucide-react';
import { LoanEntry, RecurrenceType } from '../types';
import { calculateInterestPerPeriod, formatCurrency, computeNextDueDate } from '../utils/dateUtils';

interface EditBorrowerModalProps {
  isOpen: boolean;
  loan: LoanEntry | null;
  onClose: () => void;
  onSaveLoan: (updatedLoan: LoanEntry) => void;
  onDeleteLoan?: (loanId: string) => void;
}

export const EditBorrowerModal: React.FC<EditBorrowerModalProps> = ({
  isOpen,
  loan,
  onClose,
  onSaveLoan,
  onDeleteLoan,
}) => {
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerEmail, setBorrowerEmail] = useState('');
  
  const [principalAmount, setPrincipalAmount] = useState<number | ''>(0);
  const [currentOutstandingPrincipal, setCurrentOutstandingPrincipal] = useState<number | ''>(0);
  const [startDate, setStartDate] = useState<string>('');

  const [interestRate, setInterestRate] = useState<number | ''>(0);
  const [interestRateType, setInterestRateType] = useState<'monthly' | 'yearly' | 'flat_fee'>('monthly');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('monthly');
  const [customIntervalDays, setCustomIntervalDays] = useState<number>(30);
  const [dueDayOfMonth, setDueDayOfMonth] = useState<number>(1);
  const [nextInterestDueDate, setNextInterestDueDate] = useState<string>('');
  
  const [status, setStatus] = useState<'active' | 'settled' | 'defaulted'>('active');
  const [collateralDescription, setCollateralDescription] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (loan) {
      setBorrowerName(loan.borrowerName || '');
      setBorrowerPhone(loan.borrowerPhone || '');
      setBorrowerEmail(loan.borrowerEmail || '');
      setPrincipalAmount(loan.principalAmount);
      setCurrentOutstandingPrincipal(loan.currentOutstandingPrincipal);
      setStartDate(loan.startDate);
      setInterestRate(loan.interestRate);
      setInterestRateType(loan.interestRateType);
      setRecurrence(loan.recurrence);
      setCustomIntervalDays(loan.customIntervalDays || 30);
      setDueDayOfMonth(loan.dueDayOfMonth || 1);
      setNextInterestDueDate(loan.nextInterestDueDate);
      setStatus(loan.status);
      setCollateralDescription(loan.collateralDescription || '');
      setNotes(loan.notes || '');
    }
  }, [loan, isOpen]);

  if (!isOpen || !loan) return null;

  const numericPrincipal = typeof principalAmount === 'number' ? principalAmount : 0;
  const numericOutstanding = typeof currentOutstandingPrincipal === 'number' ? currentOutstandingPrincipal : 0;
  const numericRate = typeof interestRate === 'number' ? interestRate : 0;

  // Recalculate preview interest per period based on current outstanding principal
  const interestPerPeriod = calculateInterestPerPeriod(
    numericOutstanding,
    numericRate,
    interestRateType,
    recurrence
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim()) {
      alert('Please provide a borrower name.');
      return;
    }
    if (numericPrincipal <= 0) {
      alert('Please provide a valid original principal amount.');
      return;
    }

    const updatedLoan: LoanEntry = {
      ...loan,
      borrowerName: borrowerName.trim(),
      borrowerPhone: borrowerPhone.trim() || undefined,
      borrowerEmail: borrowerEmail.trim() || undefined,
      principalAmount: numericPrincipal,
      currentOutstandingPrincipal: numericOutstanding,
      startDate: startDate || loan.startDate,
      interestRate: numericRate,
      interestRateType,
      recurrence,
      customIntervalDays: recurrence === 'custom_days' ? customIntervalDays : undefined,
      dueDayOfMonth: recurrence === 'monthly' ? dueDayOfMonth : undefined,
      nextInterestDueDate: nextInterestDueDate || loan.nextInterestDueDate,
      interestPerPeriod: Number(interestPerPeriod.toFixed(2)),
      status,
      collateralDescription: collateralDescription.trim() || undefined,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSaveLoan(updatedLoan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div 
        id="edit-borrower-modal-content"
        className="bg-slate-900 border border-slate-800 w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col my-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Edit Borrower & Terms</h2>
              <p className="text-xs text-slate-400">Update contacts, rate, principal or due date</p>
            </div>
          </div>
          <button
            id="close-edit-borrower-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* 1. Borrower Contact Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Borrower Details
            </h3>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="edit-borrower-name"
                type="text"
                required
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
                </label>
                <input
                  id="edit-borrower-phone"
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
                  id="edit-borrower-email"
                  type="email"
                  placeholder="borrower@example.com"
                  value={borrowerEmail}
                  onChange={(e) => setBorrowerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Principal & Status Section */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              2. Principal & Loan Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Original Principal Lent (₹)
                </label>
                <input
                  id="edit-principal-amount"
                  type="number"
                  min="1"
                  step="any"
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Current Outstanding (₹)
                </label>
                <input
                  id="edit-outstanding-principal"
                  type="number"
                  min="0"
                  step="any"
                  value={currentOutstandingPrincipal}
                  onChange={(e) => setCurrentOutstandingPrincipal(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Start / Origination Date
                </label>
                <input
                  id="edit-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Loan Status
                </label>
                <select
                  id="edit-loan-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="active">Active (Ongoing Interest)</option>
                  <option value="settled">Settled / Closed</option>
                  <option value="defaulted">Defaulted</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Interest Rate & Recurrence */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              3. Interest & Due Date Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {interestRateType === 'flat_fee' ? 'Flat Amount (₹)' : 'Interest Rate (%)'}
                </label>
                <input
                  id="edit-interest-rate"
                  type="number"
                  step="any"
                  min="0"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Rate Frequency
                </label>
                <select
                  id="edit-rate-type"
                  value={interestRateType}
                  onChange={(e) => setInterestRateType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="monthly">Monthly % (e.g. 2% / month)</option>
                  <option value="yearly">Yearly % / P.A. (e.g. 12% p.a.)</option>
                  <option value="flat_fee">Flat Fixed Fee (₹ amount)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Recurrence Cycle
                </label>
                <select
                  id="edit-recurrence"
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly (Every 7 days)</option>
                  <option value="biweekly">Bi-weekly (Every 14 days)</option>
                  <option value="quarterly">Quarterly (Every 3 months)</option>
                  <option value="custom_days">Custom Interval (Days)</option>
                  <option value="one_time">One-time / Bullet</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Next Interest Due Date
                </label>
                <input
                  id="edit-next-due-date"
                  type="date"
                  value={nextInterestDueDate}
                  onChange={(e) => setNextInterestDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Calculated Preview Box */}
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold block">
                  New Interest Due Per Cycle
                </span>
                <span className="text-lg font-bold text-emerald-300">
                  {formatCurrency(interestPerPeriod)}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <span>Calculated on {formatCurrency(numericOutstanding)}</span>
              </div>
            </div>
          </div>

          {/* 4. Collateral & Notes */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              4. Collateral & Notes
            </h3>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Collateral / Security Description
              </label>
              <input
                id="edit-collateral"
                type="text"
                placeholder="e.g. Gold, vehicle papers, cheque, promissory note"
                value={collateralDescription}
                onChange={(e) => setCollateralDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Notes
              </label>
              <textarea
                id="edit-notes"
                rows={2}
                placeholder="Additional borrower notes or terms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between sticky bottom-0 bg-slate-900 py-2">
            {onDeleteLoan ? (
              <button
                type="button"
                id="delete-borrower-from-edit-btn"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${loan.borrowerName}'s entire loan record?`)) {
                    onDeleteLoan(loan.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                id="save-edit-borrower-btn"
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-600/30 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
