import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Award, 
  ArrowUpRight, 
  RotateCcw, 
  CheckSquare, 
  Plus, 
  RefreshCw,
  Sliders,
  FileText,
  Download
} from 'lucide-react';
import { fetchCollection } from '../../firebase/dbAdapter';
import { getScoringSettings } from '../../services/settingsService';
import { runOverdueCheck } from '../../services/borrowService';
import { StatCard } from '../../components/ui/StatCard';
import { ScoreDistributionChart } from '../../components/charts/ScoreDistributionChart';
import { BorrowingActivityChart } from '../../components/charts/BorrowingActivityChart';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export function AdminDashboard() {
  const { currentUser, updateUserProfile } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalPatrons: 0,
    activeLoans: 0,
    overdueCount: 0,
    defaultersCount: 0,
    averageScore: 50,
    pendingRequests: 0
  });

  const [distribution, setDistribution] = useState({});
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanningOverdue, setScanningOverdue] = useState(false);

  useEffect(() => {
    // Automatic overdue check on dashboard mount
    handleScanOverdue(true);
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [books, users, loans, scores] = await Promise.all([
        fetchCollection('books'),
        fetchCollection('users'),
        fetchCollection('borrowings'),
        fetchCollection('creditScores')
      ]);

      const patrons = users.filter(u => u.role !== 'admin');
      const active = loans.filter(b => ['issued', 'overdue'].includes(b.status));
      const overdues = loans.filter(b => b.status === 'overdue');
      const requests = loans.filter(b => b.status === 'requested');
      const defaulters = scores.filter(s => (s.defaultCount || 0) > 0 || (s.score || 50) < 40);

      let totalScore = 0;
      const dist = { excellent: 0, good: 0, fair: 0, poor: 0, veryPoor: 0 };
      scores.forEach(s => {
        const sc = s.score ?? 50;
        totalScore += sc;
        const cls = s.classification || 'fair';
        dist[cls] = (dist[cls] || 0) + 1;
      });

      const avg = scores.length > 0 ? Math.round(totalScore / scores.length) : 50;

      setStats({
        totalBooks: books.length,
        totalPatrons: patrons.length,
        activeLoans: active.length,
        overdueCount: overdues.length,
        defaultersCount: defaulters.length,
        averageScore: avg,
        pendingRequests: requests.length
      });

      setDistribution(dist);
      setBorrowings(loans);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleScanOverdue(silent = false) {
    setScanningOverdue(true);
    try {
      const res = await runOverdueCheck('LIBRARIAN');
      if (!silent) {
        toast.success(`Overdue check complete: ${res.overdueFlagged} loans flagged, ${res.defaultsRecorded} defaults logged.`);
      }
      await loadDashboardData();
    } catch (e) {
      if (!silent) toast.error('Error during overdue check');
    } finally {
      setScanningOverdue(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions & Overdue Scan */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 m-0">
              Librarian Administrative Console
            </h1>
            <span className="text-2xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              FCAHPT Vom
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <p className="text-xs text-slate-600">
              Librarian: <strong className="text-emerald-900 font-bold">{currentUser?.name || 'College Librarian'}</strong> ({currentUser?.email})
            </p>
            {!editingName ? (
              <button
                onClick={() => {
                  setNewName(currentUser?.name || '');
                  setEditingName(true);
                }}
                className="text-2xs font-bold text-emerald-700 hover:text-emerald-900 underline px-1"
                title="Change display name"
              >
                Edit Name
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 p-1 rounded-lg border border-emerald-200">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter full name"
                  className="text-xs px-2 py-0.5 rounded border border-slate-300 bg-white focus:outline-emerald-500"
                />
                <button
                  onClick={async () => {
                    if (newName.trim()) {
                      await updateUserProfile({ name: newName.trim() });
                      toast.success('Admin name updated successfully!');
                      setEditingName(false);
                    }
                  }}
                  className="text-2xs font-bold bg-emerald-700 text-white px-2 py-0.5 rounded hover:bg-emerald-800"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="text-2xs text-slate-500 hover:text-slate-700 px-1"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time monitoring of college book borrowing, algorithmic credit ratings, and default enforcement
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="/FCAHPT_Vom_Library_Books_Catalogue.pdf"
              download="FCAHPT_Vom_Library_Books_Catalogue.pdf"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors whitespace-nowrap"
              title="Download Catalogue PDF"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Download Catalogue (PDF)</span>
            </a>

            <button
              onClick={() => handleScanOverdue(false)}
              disabled={scanningOverdue}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 whitespace-nowrap"
              title="Scan active loans for past-due dates and record defaults"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanningOverdue ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{scanningOverdue ? 'Scanning...' : 'Overdue Check'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/admin/return"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 shadow-2xs transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Process Return</span>
            </Link>

            <Link
              to="/admin/issue"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-2xs transition-colors whitespace-nowrap"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Issue Book</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Books"
          value={stats.totalBooks}
          icon={BookOpen}
          color="slate"
          subtitle="Library inventory"
        />
        <StatCard
          title="Patrons"
          value={stats.totalPatrons}
          icon={Users}
          color="blue"
          subtitle="Registered students"
        />
        <StatCard
          title="Active Loans"
          value={stats.activeLoans}
          icon={Clock}
          color="emerald"
          subtitle="Currently on loan"
        />
        <StatCard
          title="Overdue Books"
          value={stats.overdueCount}
          icon={AlertTriangle}
          color="red"
          subtitle="Past due date"
        />
        <StatCard
          title="Defaulters"
          value={stats.defaultersCount}
          icon={ShieldAlert}
          color="orange"
          subtitle="Defaults on record"
        />
        <StatCard
          title="Avg Score"
          value={`${stats.averageScore}`}
          icon={Award}
          color="purple"
          subtitle="Overall college mean"
        />
      </div>

      {/* Pending Borrow Requests Notice */}
      {stats.pendingRequests > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                {stats.pendingRequests} Student Borrow {stats.pendingRequests === 1 ? 'Request' : 'Requests'} Pending Approval
              </p>
              <p className="text-2xs text-amber-700">
                Review patron credit ratings and approve loan issue to set scheduled due dates.
              </p>
            </div>
          </div>
          <Link
            to="/admin/requests"
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 shrink-0 transition-colors shadow-2xs"
          >
            Review Queue
          </Link>
        </div>
      )}

      {/* Two Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Credit Score Distribution</h3>
              <p className="text-2xs text-slate-500">Patron breakdown across the 5 FCAHPT Vom tiers</p>
            </div>
            <Link to="/admin/reports" className="text-xs font-semibold text-emerald-700 hover:underline">
              Summary Report &rarr;
            </Link>
          </div>
          <ScoreDistributionChart distribution={distribution} />
        </div>

        {/* Borrowing Activity Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Borrowing Volume (Monthly Trend)</h3>
              <p className="text-2xs text-slate-500">Total books issued over academic sessions</p>
            </div>
            <Link to="/admin/reports" className="text-xs font-semibold text-emerald-700 hover:underline">
              Activity Report &rarr;
            </Link>
          </div>
          <BorrowingActivityChart borrowings={borrowings} />
        </div>
      </div>

      {/* Administrative Quick Jump Hub */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Circulation & Scoring Operations</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link
            to="/admin/requests"
            className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 hover:border-amber-400 hover:bg-amber-50/70 transition-all flex flex-col justify-between"
          >
            <CheckSquare className="w-5 h-5 text-amber-600 mb-2" />
            <div>
              <p className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>Borrow Queue</span>
                {stats.pendingRequests > 0 && (
                  <span className="px-1.5 py-0.5 text-2xs font-bold rounded-full bg-amber-500 text-white">
                    {stats.pendingRequests}
                  </span>
                )}
              </p>
              <p className="text-2xs text-slate-500 mt-0.5">Review student borrow requests</p>
            </div>
          </Link>

          <Link
            to="/admin/return"
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex flex-col justify-between"
          >
            <RotateCcw className="w-5 h-5 text-emerald-700 mb-2" />
            <div>
              <p className="text-xs font-bold text-slate-900">Process Return</p>
              <p className="text-2xs text-slate-500 mt-0.5">Inspect condition & score impact preview</p>
            </div>
          </Link>

          <Link
            to="/admin/overdue"
            className="p-4 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/50 transition-all flex flex-col justify-between"
          >
            <AlertTriangle className="w-5 h-5 text-red-600 mb-2" />
            <div>
              <p className="text-xs font-bold text-slate-900">Overdue Monitor</p>
              <p className="text-2xs text-slate-500 mt-0.5">Track past-due loans & defaults</p>
            </div>
          </Link>

          <Link
            to="/admin/scores"
            className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all flex flex-col justify-between"
          >
            <Sliders className="w-5 h-5 text-blue-700 mb-2" />
            <div>
              <p className="text-xs font-bold text-slate-900">Score Overrides</p>
              <p className="text-2xs text-slate-500 mt-0.5">Manual score corrections & disputes</p>
            </div>
          </Link>

          <Link
            to="/admin/reports"
            className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all flex flex-col justify-between"
          >
            <FileText className="w-5 h-5 text-purple-700 mb-2" />
            <div>
              <p className="text-xs font-bold text-slate-900">Export Reports</p>
              <p className="text-2xs text-slate-500 mt-0.5">Printable views & CSV exports</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
