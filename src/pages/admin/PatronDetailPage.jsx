import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  History, 
  Scale, 
  ShieldAlert, 
  UserX, 
  UserCheck 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchDocument, fetchCollection, modifyDocument } from '../../firebase/dbAdapter';
import { getPatronScore, classifyScore, manualAdjustScore } from '../../services/scoreService';
import { ScoreGauge } from '../../components/ui/ScoreGauge';
import { ClassificationBadge } from '../../components/ui/ClassificationBadge';
import { StatCard } from '../../components/ui/StatCard';
import { ScoreHistoryChart } from '../../components/charts/ScoreHistoryChart';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export function PatronDetailPage() {
  const { id } = useParams();
  const { currentUser } = useAuth();

  const [patron, setPatron] = useState(null);
  const [scoreDoc, setScoreDoc] = useState(null);
  const [borrowings, setBorrowings] = useState([]);
  const [scoreLogs, setScoreLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual Adjustment Modal state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [pointsChange, setPointsChange] = useState(10);
  const [adjustReason, setAdjustReason] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Tab state: 'loans' | 'logs'
  const [activeTab, setActiveTab] = useState('loans');

  useEffect(() => {
    loadPatronData();
  }, [id]);

  async function loadPatronData() {
    setLoading(true);
    try {
      const [user, score, loans, logs] = await Promise.all([
        fetchDocument('users', id),
        getPatronScore(id),
        fetchCollection('borrowings', [{ field: 'userId', op: '==', value: id }], { field: 'createdAt', direction: 'desc' }),
        fetchCollection('scoreLogs', [{ field: 'userId', op: '==', value: id }], { field: 'createdAt', direction: 'desc' })
      ]);

      setPatron(user);
      setScoreDoc(score);
      setBorrowings(loans);
      setScoreLogs(logs);
    } catch (e) {
      toast.error('Failed to load patron dossier');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus() {
    if (!patron) return;
    const newStatus = patron.status === 'suspended' ? 'active' : 'suspended';
    try {
      await modifyDocument('users', patron.id, { status: newStatus });
      toast.success(`Account marked as ${newStatus}`);
      loadPatronData();
    } catch (e) {
      toast.error('Failed to update status');
    }
  }

  async function handleManualAdjust(e) {
    e.preventDefault();
    if (!adjustReason || adjustReason.trim().length < 5) {
      toast.error('Please provide an explanatory reason (minimum 5 characters)');
      return;
    }

    setSubmittingAdjust(true);
    try {
      await manualAdjustScore({
        userId: id,
        pointsChange: Number(pointsChange),
        reason: adjustReason,
        adminUid: currentUser?.id || currentUser?.uid || 'ADMIN'
      });

      toast.success(`Score adjustment of ${pointsChange > 0 ? '+' : ''}${pointsChange} applied with audit trail!`);
      setAdjustModalOpen(false);
      setAdjustReason('');
      loadPatronData();
    } catch (err) {
      toast.error(err.message || 'Failed to adjust score');
    } finally {
      setSubmittingAdjust(false);
    }
  }

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!patron) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
        <p className="text-sm font-bold text-slate-700">Patron record not found</p>
        <Link to="/admin/patrons" className="text-xs text-emerald-700 underline mt-2 inline-block">
          Return to Patrons Directory
        </Link>
      </div>
    );
  }

  const currentScore = scoreDoc?.score ?? 50;
  const classification = classifyScore(currentScore);
  const isSuspended = patron.status === 'suspended';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top back bar & Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/patrons"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patron Directory
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleStatus}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors ${
              isSuspended 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' 
                : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
            }`}
          >
            {isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
            <span>{isSuspended ? 'Reinstate Account' : 'Suspend Account'}</span>
          </button>

          <button
            onClick={() => setAdjustModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manual Score Adjustment</span>
          </button>
        </div>
      </div>

      {/* Patron Dossier Card & Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Patron Dossier
              </span>
              <ClassificationBadge tier={classification.tier} score={currentScore} size="sm" />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg uppercase shadow-md">
                {patron.name[0]}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-snug">{patron.name}</h2>
                <p className="text-xs text-slate-500 font-mono">{patron.matricNo || 'N/A'}</p>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-2xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Department:</span>
                <strong className="text-slate-800">{patron.department}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-slate-700">{patron.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono text-slate-700">{patron.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-400">Status:</span>
                <strong className={isSuspended ? 'text-red-700' : 'text-emerald-700'}>
                  {isSuspended ? 'Suspended' : 'Active'}
                </strong>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <ScoreGauge score={currentScore} size={150} showLabel={false} />
          </div>
        </div>

        {/* Stats & Score Trend Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Borrowed"
              value={scoreDoc?.totalBorrowed ?? borrowings.length}
              icon={BookOpen}
              color="blue"
            />
            <StatCard
              title="On-Time Returns"
              value={scoreDoc?.onTimeReturns ?? 0}
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              title="Late Returns"
              value={scoreDoc?.lateReturns ?? 0}
              icon={Clock}
              color="amber"
            />
            <StatCard
              title="Total Defaults"
              value={scoreDoc?.defaultCount ?? 0}
              icon={AlertTriangle}
              color="red"
            />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Credit Score Trajectory
            </h3>
            <ScoreHistoryChart data={scoreLogs.slice().reverse()} />
          </div>
        </div>
      </div>

      {/* Tabs for Borrowing History & Score Audit Trail */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 px-6 pt-3 flex items-center gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('loans')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'loans' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Borrowing History ({borrowings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'logs' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Score Audit Ledger ({scoreLogs.length})</span>
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'loans' ? (
            borrowings.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No borrowing records on file</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Book Title</th>
                      <th className="py-2.5 px-3 text-left">Borrow Date</th>
                      <th className="py-2.5 px-3 text-left">Due Date</th>
                      <th className="py-2.5 px-3 text-left">Return Date</th>
                      <th className="py-2.5 px-3 text-left">Condition / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {borrowings.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 font-bold text-slate-900">{b.bookTitle}</td>
                        <td className="py-3 px-3 text-slate-500">{b.borrowDate || 'N/A'}</td>
                        <td className="py-3 px-3 text-slate-700">{b.dueDate || 'N/A'}</td>
                        <td className="py-3 px-3 text-slate-700">{b.returnDate || 'Pending'}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${
                            b.status === 'returned' ? 'bg-emerald-100 text-emerald-800' :
                            b.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {b.status} {b.returnCondition ? `(${b.returnCondition})` : ''}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            scoreLogs.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No audit log entries recorded</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Event</th>
                      <th className="py-2.5 px-3 text-left">Reason / Audit Trail</th>
                      <th className="py-2.5 px-3 text-center">Score Delta</th>
                      <th className="py-2.5 px-3 text-center">Before &rarr; After</th>
                      <th className="py-2.5 px-3 text-right">Date & Author</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {scoreLogs.map(log => {
                      const isPos = (log.points || 0) > 0;
                      const isNeg = (log.points || 0) < 0;

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-3 font-bold uppercase text-slate-800 text-2xs">
                            {log.event.replace(/_/g, ' ')}
                          </td>
                          <td className="py-3 px-3 text-slate-700 text-2xs max-w-sm">
                            {log.reason}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`font-mono font-bold text-2xs px-2 py-0.5 rounded-md ${
                              isPos ? 'bg-emerald-100 text-emerald-800' :
                              isNeg ? 'bg-red-100 text-red-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {isPos ? `+${log.points}` : log.points}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-2xs text-slate-600">
                            {log.scoreBefore} &rarr; <strong>{log.scoreAfter}</strong>
                          </td>
                          <td className="py-3 px-3 text-right text-3xs text-slate-400 font-mono">
                            <p>{log.createdAt ? log.createdAt.slice(0, 16).replace('T', ' ') : 'N/A'}</p>
                            <p className="text-slate-500">{log.createdBy || 'SYSTEM'}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      {/* Manual Score Adjustment Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Administrative Credit Score Override"
      >
        <form onSubmit={handleManualAdjust} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Adjusting a student's score manually updates their borrowing tier and creates a permanent entry in the institutional audit ledger.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Score Points Change (+ or −)
            </label>
            <input
              type="number"
              value={pointsChange}
              onChange={e => setPointsChange(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold"
              required
            />
            <p className="text-3xs text-slate-400 mt-1">
              Current score: <strong>{currentScore}</strong> &rarr; Projected score: <strong>{Math.max(0, Math.min(100, currentScore + Number(pointsChange)))}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Mandatory Audit Reason
            </label>
            <textarea
              rows={3}
              value={adjustReason}
              onChange={e => setAdjustReason(e.target.value)}
              placeholder="e.g., Granted +10 credit points after verifying approved medical absence excuse during exam week..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAdjustModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAdjust}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {submittingAdjust ? 'Committing...' : 'Commit Score Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
