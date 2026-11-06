import React, { useEffect, useState } from 'react';
import { 
  Sliders, 
  Scale, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Search, 
  Send,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchCollection } from '../../firebase/dbAdapter';
import { getAllDisputes, resolveDispute } from '../../services/disputeService';
import { manualAdjustScore } from '../../services/scoreService';
import { ClassificationBadge } from '../../components/ui/ClassificationBadge';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export function ScoreManagementPage() {
  const { currentUser } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [patrons, setPatrons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab: 'disputes' | 'manual'
  const [activeTab, setActiveTab] = useState('disputes');

  // Dispute Resolution Modal State
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [disputeAction, setDisputeAction] = useState('resolved'); // 'resolved' | 'rejected'
  const [scoreCorrection, setScoreCorrection] = useState(10);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [submittingResolve, setSubmittingResolve] = useState(false);

  // Manual Adjust form
  const [selectedPatronId, setSelectedPatronId] = useState('');
  const [pointsChange, setPointsChange] = useState(5);
  const [manualReason, setManualReason] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [allDisputes, allUsers, allScores] = await Promise.all([
        getAllDisputes(),
        fetchCollection('users'),
        fetchCollection('creditScores')
      ]);

      const scoreMap = new Map(allScores.map(s => [s.userId, s]));
      const patronList = allUsers
        .filter(u => u.role !== 'admin')
        .map(u => ({
          ...u,
          scoreDoc: scoreMap.get(u.id) || { score: 50, classification: 'fair' }
        }));

      setDisputes(allDisputes);
      setPatrons(patronList);
      if (patronList.length > 0 && !selectedPatronId) {
        setSelectedPatronId(patronList[0].id);
      }
    } catch (e) {
      toast.error('Failed to load score management data');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenResolve(dispute) {
    setSelectedDispute(dispute);
    setDisputeAction('resolved');
    setAdminResponse('Reviewed physical circulation record; claim accepted. Score adjusted accordingly.');
    setScoreCorrection(10);
    setResolveModalOpen(true);
  }

  async function handleSubmitResolve(e) {
    e.preventDefault();
    if (!selectedDispute) return;

    setSubmittingResolve(true);
    try {
      await resolveDispute({
        disputeId: selectedDispute.id,
        status: disputeAction,
        adminResponse,
        scoreAdjustment: disputeAction === 'resolved' ? Number(scoreCorrection) : 0,
        adminUid: currentUser?.id || currentUser?.uid || 'ADMIN'
      });

      toast.success(`Dispute marked as ${disputeAction}`);
      setResolveModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update dispute');
    } finally {
      setSubmittingResolve(false);
    }
  }

  async function handleSubmitManual(e) {
    e.preventDefault();
    if (!selectedPatronId) {
      toast.error('Please select a patron');
      return;
    }
    if (!manualReason || manualReason.trim().length < 5) {
      toast.error('A minimum 5-character reason is mandatory for manual adjustments');
      return;
    }

    setSubmittingManual(true);
    try {
      const res = await manualAdjustScore({
        userId: selectedPatronId,
        pointsChange: Number(pointsChange),
        reason: manualReason,
        adminUid: currentUser?.id || currentUser?.uid || 'ADMIN'
      });

      toast.success(`Score adjusted to ${res.newScore} with permanent audit log!`);
      setManualReason('');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to perform manual adjustment');
    } finally {
      setSubmittingManual(false);
    }
  }

  const openDisputes = disputes.filter(d => d.status === 'open');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 m-0">Credit Score Administration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Resolve student dispute tickets, apply corrective points adjustments, and log administrative score overrides
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start text-xs font-semibold">
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'disputes' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Disputes ({openDisputes.length} Open)</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'manual' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manual Override Tool</span>
          </button>
        </div>
      </div>

      {activeTab === 'disputes' ? (
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : disputes.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <Scale className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No disputes in system</p>
            </div>
          ) : (
            disputes.map(dispute => {
              const isOpen = dispute.status === 'open';
              const isResolved = dispute.status === 'resolved';

              return (
                <div
                  key={dispute.id}
                  className={`bg-white p-6 rounded-2xl border shadow-xs space-y-4 transition-all ${
                    isOpen ? 'border-amber-300 ring-2 ring-amber-50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {dispute.bookTitle || 'Borrowing Dispute'}
                        </h3>
                        <span className="text-3xs font-mono text-slate-400">
                          Ticket #{dispute.id.slice(-6)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Submitted by <strong className="text-slate-800">{dispute.userName}</strong> ({dispute.userMatricNo}) &bull; {dispute.createdAt ? dispute.createdAt.slice(0, 10) : 'N/A'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-2xs font-bold uppercase ${
                        isOpen ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        isResolved ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {dispute.status}
                      </span>

                      {isOpen && (
                        <button
                          onClick={() => handleOpenResolve(dispute)}
                          className="px-3 py-1 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-2xs"
                        >
                          Review & Resolve
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900 mb-1">Student's Statement:</p>
                    <p className="leading-relaxed">{dispute.message}</p>
                  </div>

                  {dispute.adminResponse && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Official Resolution by Library Staff:</span>
                      </p>
                      <p className="leading-relaxed">{dispute.adminResponse}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Manual Score Override Tool Form */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900 m-0">
              Manual Credit Score Adjustment
            </h2>
          </div>

          <form onSubmit={handleSubmitManual} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Select Student Patron
              </label>
              <select
                value={selectedPatronId}
                onChange={e => setSelectedPatronId(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
                required
              >
                {patrons.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.matricNo}) &bull; Current Score: {p.scoreDoc?.score ?? 50}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Points Adjustment (+ or −)
              </label>
              <input
                type="number"
                value={pointsChange}
                onChange={e => setPointsChange(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold"
                required
              />
              <p className="text-3xs text-slate-400 mt-1">
                Positive numbers add points (+), negative numbers deduct points (−). Score will be clamped between 0 and 100.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Mandatory Audit Justification (Minimum 5 characters)
              </label>
              <textarea
                rows={3}
                value={manualReason}
                onChange={e => setManualReason(e.target.value)}
                placeholder="e.g., Librarian discretion applied: patron produced approved medical certificate for 2-day return delay."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submittingManual}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              {submittingManual ? 'Updating...' : 'Commit Score Adjustment with Audit Log'}
            </button>
          </form>
        </div>
      )}

      {/* Review & Resolve Dispute Modal */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Dispute Resolution & Score Correction"
      >
        <form onSubmit={handleSubmitResolve} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-3xs uppercase font-bold text-slate-400">Student Claim:</span>
            <p className="text-slate-800 mt-1 font-medium">{selectedDispute?.message}</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Resolution Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                disputeAction === 'resolved' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-200'
              }`}>
                <input
                  type="radio"
                  name="action"
                  checked={disputeAction === 'resolved'}
                  onChange={() => setDisputeAction('resolved')}
                  className="hidden"
                />
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Uphold & Resolve</span>
              </label>

              <label className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                disputeAction === 'rejected' ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200'
              }`}>
                <input
                  type="radio"
                  name="action"
                  checked={disputeAction === 'rejected'}
                  onChange={() => setDisputeAction('rejected')}
                  className="hidden"
                />
                <XCircle className="w-4 h-4 text-red-600" />
                <span>Decline Claim</span>
              </label>
            </div>
          </div>

          {disputeAction === 'resolved' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Restorative Points to Grant
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={scoreCorrection}
                onChange={e => setScoreCorrection(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold"
              />
              <p className="text-3xs text-slate-400 mt-1">
                Automatically logged as a dispute resolution adjustment.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Administrative Response to Patron
            </label>
            <textarea
              rows={3}
              value={adminResponse}
              onChange={e => setAdminResponse(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResolveModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingResolve}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs"
            >
              {submittingResolve ? 'Committing...' : 'Commit Dispute Resolution'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
