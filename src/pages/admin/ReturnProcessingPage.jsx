import React, { useEffect, useState } from 'react';
import { 
  RotateCcw, 
  Search, 
  BookOpen, 
  User, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchCollection } from '../../firebase/dbAdapter';
import { getPatronScore, calculatePoints, classifyScore, clampScore, processReturn } from '../../services/scoreService';
import { getScoringSettings } from '../../services/settingsService';
import { format, parseISO, startOfDay, differenceInCalendarDays } from 'date-fns';
import { ClassificationBadge } from '../../components/ui/ClassificationBadge';
import toast from 'react-hot-toast';

export function ReturnProcessingPage() {
  const { currentUser } = useAuth();
  const [activeLoans, setActiveLoans] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter active loans
  const [search, setSearch] = useState('');

  // Selected Loan for return
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [patronScoreDoc, setPatronScoreDoc] = useState(null);

  // Return Form State
  const [returnDate, setReturnDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [returnCondition, setReturnCondition] = useState('good'); // good | fair | damaged | lost
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadActiveLoans();
  }, []);

  async function loadActiveLoans() {
    setLoading(true);
    try {
      const [loans, cfg] = await Promise.all([
        fetchCollection('borrowings', [{ field: 'status', op: 'in', value: ['issued', 'overdue'] }]),
        getScoringSettings()
      ]);
      setActiveLoans(loans);
      setSettings(cfg);
    } catch (e) {
      toast.error('Failed to load active loans');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectLoan(loan) {
    setSelectedLoan(loan);
    try {
      const score = await getPatronScore(loan.userId);
      setPatronScoreDoc(score);
    } catch (e) {
      console.error(e);
    }
  }

  // Live score calculation preview
  let preview = null;
  if (selectedLoan && patronScoreDoc && settings) {
    const currentScore = patronScoreDoc.score || 50;
    const currentDefaults = patronScoreDoc.defaultCount || 0;

    const calc = calculatePoints({
      dueDate: selectedLoan.dueDate,
      returnDate,
      returnCondition,
      currentDefaultCount: currentDefaults,
      settings
    });

    const newScore = clampScore(currentScore + calc.totalPointsChange);
    const prevClass = classifyScore(currentScore, settings);
    const newClass = classifyScore(newScore, settings);

    preview = {
      currentScore,
      newScore,
      prevClass,
      newClass,
      calc
    };
  }

  async function handleConfirmReturn() {
    if (!selectedLoan) return;
    setIsProcessing(true);
    try {
      const result = await processReturn({
        borrowId: selectedLoan.id,
        returnDate,
        returnCondition,
        adminUid: currentUser?.id || currentUser?.uid || 'ADMIN'
      });

      toast.success(
        `Return processed! Patron score updated from ${result.previousScore} to ${result.newScore} (${result.pointsChange >= 0 ? '+' : ''}${result.pointsChange} pts).`
      );

      setSelectedLoan(null);
      setPatronScoreDoc(null);
      loadActiveLoans();
    } catch (err) {
      toast.error(err.message || 'Failed to process return');
    } finally {
      setIsProcessing(false);
    }
  }

  const filteredLoans = activeLoans.filter(l => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (l.bookTitle && l.bookTitle.toLowerCase().includes(term)) ||
      (l.userName && l.userName.toLowerCase().includes(term)) ||
      (l.userMatricNo && l.userMatricNo.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-black text-slate-900 m-0">
          Book Return & Credit Score Processing
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Inspect physical book condition, record check-in date, preview real-time credit score adjustments, and commit atomic score logs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Loan Selector (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Active Loan ({filteredLoans.length})
            </span>
          </div>

          {/* Search box */}
          <div className="relative mt-3 mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, matric, or title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Loans list */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active loans match the search query
              </div>
            ) : (
              filteredLoans.map(loan => {
                const isSelected = selectedLoan?.id === loan.id;
                const isOverdue = loan.status === 'overdue' || (loan.dueDate && loan.dueDate < format(new Date(), 'yyyy-MM-dd'));

                return (
                  <div
                    key={loan.id}
                    onClick={() => handleSelectLoan(loan)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs font-medium' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-slate-900 leading-tight line-clamp-1">
                        {loan.bookTitle}
                      </p>
                      {isOverdue && (
                        <span className="text-3xs uppercase font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 shrink-0">
                          Overdue
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center justify-between text-2xs text-slate-500">
                      <span>{loan.userName} ({loan.userMatricNo})</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-3xs text-slate-400 font-mono border-t border-slate-100 pt-1.5">
                      <span>Borrowed: {loan.borrowDate || 'N/A'}</span>
                      <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
                        Due: {loan.dueDate || 'N/A'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Return Assessment & Live Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!selectedLoan ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs h-[650px] flex flex-col items-center justify-center space-y-3">
              <RotateCcw className="w-12 h-12 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-800">No Loan Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Select an active borrowing record from the list on the left to inspect the book condition and preview score changes.
              </p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              {/* Selected Dossier Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-3xs uppercase font-extrabold tracking-wider text-slate-400">
                    Book & Patron Details
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-0.5">{selectedLoan.bookTitle}</h3>
                  <p className="text-slate-600 text-2xs mt-0.5">
                    Patron: <strong className="text-slate-800">{selectedLoan.userName}</strong> ({selectedLoan.userMatricNo})
                  </p>
                </div>
                {preview && (
                  <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                    <span className="text-3xs uppercase text-slate-400 font-bold">Current Score</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <ClassificationBadge tier={preview.prevClass.tier} score={preview.currentScore} size="sm" />
                    </div>
                  </div>
                )}
              </div>

              {/* Form Controls: Return Date & Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Return Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Return Date
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={e => setReturnDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-3xs text-slate-400 mt-1">
                    Scheduled Due Date was: <strong>{selectedLoan.dueDate}</strong>
                  </p>
                </div>

                {/* Return Condition Options */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Returned Physical Condition
                  </label>
                  <select
                    value={returnCondition}
                    onChange={e => setReturnCondition(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="good">Good Condition (+{settings?.goodConditionBonus || 5} pts)</option>
                    <option value="fair">Fair / Normal Wear (0 pts)</option>
                    <option value="damaged">Damaged Book (−{settings?.damagedConditionPenalty || 10} pts, Default)</option>
                    <option value="lost">Lost / Unreturned (−{settings?.lostConditionPenalty || 20} pts, Default)</option>
                  </select>
                  <p className="text-3xs text-slate-400 mt-1">
                    Damaged and Lost books automatically log defaults into patron record.
                  </p>
                </div>
              </div>

              {/* LIVE SCORE IMPACT PREVIEW (Required by Prompt) */}
              {preview && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                      <span>Live Algorithmic Score Impact Preview</span>
                    </div>
                    <span className="text-3xs text-slate-400 uppercase font-mono">
                      Deterministic Preview
                    </span>
                  </div>

                  {/* Score progression meter */}
                  <div className="flex items-center justify-between bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                    <div>
                      <span className="text-3xs text-slate-400 uppercase font-bold">Score Before</span>
                      <p className="text-2xl font-black font-mono text-slate-200">{preview.currentScore}</p>
                      <span className="text-3xs text-slate-400">{preview.prevClass.label}</span>
                    </div>

                    <div className="text-center px-4">
                      <span className={`text-base font-extrabold font-mono px-3 py-1 rounded-full ${
                        preview.calc.totalPointsChange > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        preview.calc.totalPointsChange < 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {preview.calc.totalPointsChange > 0 ? `+${preview.calc.totalPointsChange}` : preview.calc.totalPointsChange} pts
                      </span>
                      <p className="text-3xs text-slate-400 mt-1">Net Adjustment</p>
                    </div>

                    <div className="text-right">
                      <span className="text-3xs text-slate-400 uppercase font-bold">New Score</span>
                      <p className="text-2xl font-black font-mono text-emerald-400">{preview.newScore}</p>
                      <span className="text-3xs text-emerald-300">{preview.newClass.label}</span>
                    </div>
                  </div>

                  {/* Breakdown of rules applied */}
                  <div className="space-y-1.5 text-xs">
                    <p className="text-3xs uppercase font-extrabold text-slate-400">Rules Applied:</p>
                    {preview.calc.breakdown.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-2xs">
                        <span className="text-slate-300">{item.reason}</span>
                        <span className={`font-mono font-bold ${item.points > 0 ? 'text-emerald-400' : item.points < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                          {item.points > 0 ? `+${item.points}` : item.points}
                        </span>
                      </div>
                    ))}
                  </div>

                  {preview.calc.isRepeatedDefault && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-2xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Repeated default penalty applied: Patron has 3 or more defaults on file.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedLoan(null)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmReturn}
                  disabled={isProcessing}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 shadow-md flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Commit Return & Atomic Score Update</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
