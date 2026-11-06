import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  ShieldAlert, 
  Calendar,
  Sparkles,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPatronScore, classifyScore } from '../../services/scoreService';
import { getScoringSettings } from '../../services/settingsService';
import { fetchCollection } from '../../firebase/dbAdapter';
import { ScoreGauge } from '../../components/ui/ScoreGauge';
import { ClassificationBadge } from '../../components/ui/ClassificationBadge';
import { StatCard } from '../../components/ui/StatCard';
import { ScoreHistoryChart } from '../../components/charts/ScoreHistoryChart';
import { differenceInCalendarDays, parseISO, startOfDay, format } from 'date-fns';

export function PatronDashboard() {
  const { currentUser } = useAuth();
  const [scoreDoc, setScoreDoc] = useState(null);
  const [settings, setSettings] = useState(null);
  const [borrowings, setBorrowings] = useState([]);
  const [scoreLogs, setScoreLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!currentUser?.id && !currentUser?.uid) return;
      const uid = currentUser.id || currentUser.uid;

      try {
        const [score, scoringCfg, userLoans, logs] = await Promise.all([
          getPatronScore(uid),
          getScoringSettings(),
          fetchCollection('borrowings', [{ field: 'userId', op: '==', value: uid }]),
          fetchCollection('scoreLogs', [{ field: 'userId', op: '==', value: uid }], { field: 'createdAt', direction: 'asc' })
        ]);

        setScoreDoc(score);
        setSettings(scoringCfg);
        setBorrowings(userLoans);
        setScoreLogs(logs);
      } catch (err) {
        console.error('Failed to load patron dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentScore = scoreDoc?.score ?? 50;
  const classification = classifyScore(currentScore, settings);

  const activeLoans = borrowings.filter(b => ['issued', 'overdue'].includes(b.status));
  const overdueLoans = borrowings.filter(b => b.status === 'overdue');
  const pendingRequests = borrowings.filter(b => b.status === 'requested');

  const maxAllowed = classification.maxBooks;
  const loanDays = classification.loanDays;
  const availableSlots = Math.max(0, maxAllowed - (activeLoans.length + pendingRequests.length));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 m-0">
              Welcome, {currentUser?.name}
            </h1>
            <ClassificationBadge tier={classification.tier} score={currentScore} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Matric No: <strong className="text-slate-700">{currentUser?.matricNo || 'N/A'}</strong> &bull; Department: <span className="text-slate-700">{currentUser?.department || 'N/A'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/patron/books"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-xs transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Borrow a Book</span>
          </Link>
        </div>
      </div>

      {/* Overdue Warning Alert if any */}
      {overdueLoans.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-300 flex items-start gap-3 animate-pulse">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-red-900">
            <p className="font-bold">Overdue Book Alert</p>
            <p className="mt-0.5">
              You have {overdueLoans.length} {overdueLoans.length === 1 ? 'book' : 'books'} past due. Borrowing is blocked until these books are returned to the library counter. Late returns incur a score penalty of −{settings?.latePenalty || 5} points.
            </p>
          </div>
          <Link
            to="/patron/borrowings"
            className="text-xs font-bold text-red-800 underline shrink-0"
          >
            View Overdue
          </Link>
        </div>
      )}

      {/* Main Grid: Gauge & Entitlements on Left, Stats on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Credit Score Gauge & Allowance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Borrowing Credit Score
              </span>
              <Link to="/patron/score-history" className="text-2xs font-semibold text-emerald-700 hover:underline">
                View History
              </Link>
            </div>

            <ScoreGauge score={currentScore} size={190} showLabel={true} />
          </div>

          {/* Current Allowance Box */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Current Tier Limit:</span>
              <strong className="text-slate-900">{maxAllowed} books concurrently</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Loan Duration:</span>
              <strong className="text-slate-900">{loanDays} days per loan</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Currently Borrowed:</span>
              <span className="font-bold text-slate-800">{activeLoans.length} active</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold">
              <span className="text-slate-700">Available Slots:</span>
              <span className={availableSlots > 0 ? 'text-emerald-700' : 'text-amber-700'}>
                {availableSlots} {availableSlots === 1 ? 'book' : 'books'} left to borrow
              </span>
            </div>
          </div>
        </div>

        {/* Right Columns: Stats Cards & Score Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Borrowed"
              value={scoreDoc?.totalBorrowed ?? borrowings.length}
              icon={BookOpen}
              color="blue"
              subtitle="All-time books checked out"
            />
            <StatCard
              title="On-Time Returns"
              value={scoreDoc?.onTimeReturns ?? 0}
              icon={CheckCircle2}
              color="emerald"
              subtitle="Punctual or early"
            />
            <StatCard
              title="Late Returns"
              value={scoreDoc?.lateReturns ?? 0}
              icon={Clock}
              color="amber"
              subtitle="Past scheduled due date"
            />
            <StatCard
              title="Defaults / Damaged"
              value={(scoreDoc?.defaultCount ?? 0)}
              icon={AlertTriangle}
              color="red"
              subtitle="Late, damage, or lost"
            />
          </div>

          {/* Score History Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Credit Score Trend</h3>
                <p className="text-2xs text-slate-500">Historical performance across borrowing transactions</p>
              </div>
              <Link to="/patron/score-history" className="text-xs font-semibold text-emerald-700 hover:underline">
                Audit Trail &rarr;
              </Link>
            </div>
            <ScoreHistoryChart data={scoreLogs} />
          </div>
        </div>
      </div>

      {/* Active Borrowed Books with Due Date Countdowns */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Currently Borrowed Books & Due Dates ({activeLoans.length})
            </h3>
          </div>
          <Link to="/patron/borrowings" className="text-xs font-semibold text-emerald-700 hover:underline">
            View All Loans &rarr;
          </Link>
        </div>

        {activeLoans.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium text-slate-600">You currently have no books on loan</p>
            <p className="text-2xs text-slate-400">Visit the library catalogue to search for textbooks</p>
            <Link
              to="/patron/books"
              className="inline-flex items-center gap-1.5 mt-2 px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200"
            >
              Browse Catalogue
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4 text-left">Book Title</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Borrowed On</th>
                  <th className="py-3 px-4 text-left">Due Date</th>
                  <th className="py-3 px-4 text-left">Status / Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {activeLoans.map(loan => {
                  const today = startOfDay(new Date());
                  const due = loan.dueDate ? startOfDay(parseISO(loan.dueDate)) : null;
                  const diff = due ? differenceInCalendarDays(due, today) : 0;
                  const isOverdue = diff < 0 || loan.status === 'overdue';

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {loan.bookTitle}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {loan.bookCategory || 'General'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {loan.borrowDate || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {loan.dueDate || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-bold text-2xs border border-red-300">
                            <AlertCircle className="w-3 h-3" />
                            OVERDUE by {Math.abs(diff)} {Math.abs(diff) === 1 ? 'day' : 'days'}
                          </span>
                        ) : diff === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-2xs border border-amber-300">
                            <Clock className="w-3 h-3" />
                            DUE TODAY
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-2xs border border-emerald-300">
                            <Clock className="w-3 h-3" />
                            {diff} {diff === 1 ? 'day' : 'days'} remaining
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
