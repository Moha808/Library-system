import React, { useEffect, useState } from 'react';
import { 
  CheckSquare, 
  Check, 
  X, 
  Clock, 
  BookOpen, 
  User, 
  Calendar, 
  AlertCircle,
  RefreshCw 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchCollection } from '../../firebase/dbAdapter';
import { approveRequest, rejectRequest } from '../../services/borrowService';
import { getPatronScore, classifyScore } from '../../services/scoreService';
import { ClassificationBadge } from '../../components/ui/ClassificationBadge';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export function BorrowRequestsPage() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reject modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const [allRequests, allScores] = await Promise.all([
        fetchCollection('borrowings', [{ field: 'status', op: '==', value: 'requested' }], { field: 'createdAt', direction: 'desc' }),
        fetchCollection('creditScores')
      ]);

      const scoreMap = new Map(allScores.map(s => [s.userId, s]));
      const enriched = allRequests.map(r => ({
        ...r,
        scoreDoc: scoreMap.get(r.userId) || { score: 50, classification: 'fair' }
      }));

      setRequests(enriched);
    } catch (e) {
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(request) {
    setProcessingId(request.id);
    try {
      const res = await approveRequest(request.id, currentUser?.id || currentUser?.uid || 'ADMIN');
      toast.success(`Request approved! Book issued with scheduled due date: ${res.dueDate}`);
      loadRequests();
    } catch (err) {
      toast.error(err.message || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  }

  function openRejectModal(request) {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectModalOpen(true);
  }

  async function handleConfirmReject(e) {
    e.preventDefault();
    if (!selectedRequest) return;

    setProcessingId(selectedRequest.id);
    try {
      await rejectRequest(
        selectedRequest.id, 
        rejectionReason || 'Declined by library administration', 
        currentUser?.id || currentUser?.uid || 'ADMIN'
      );
      toast.success('Borrow request rejected');
      setRejectModalOpen(false);
      loadRequests();
    } catch (err) {
      toast.error(err.message || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 m-0">Borrow Requests Queue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming book reservation requests from students, verify tier clearance, and issue loans
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadRequests}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Refresh borrow requests"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-600'}`} />
            <span>Refresh</span>
          </button>
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-700" />
            <span>{requests.length} Pending Approval</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <CheckSquare className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No pending borrow requests</p>
          <p className="text-xs text-slate-400">All student borrow requests have been processed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const score = req.scoreDoc?.score ?? 50;
            const classification = req.scoreDoc?.classification || 'fair';
            const isProcessing = processingId === req.id;

            return (
              <div
                key={req.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{req.bookTitle}</h3>
                    <ClassificationBadge tier={classification} score={score} size="sm" />
                  </div>

                  <p className="text-xs text-slate-600">
                    Requested by <strong className="text-slate-800">{req.userName}</strong> ({req.userMatricNo}) &bull; {req.userDepartment}
                  </p>

                  <div className="flex items-center gap-3 text-3xs text-slate-400 font-mono pt-1">
                    <span>Submitted: {req.createdAt ? req.createdAt.slice(0, 16).replace('T', ' ') : 'N/A'}</span>
                    <span>Entitlement: {req.requestedDays || 14} days</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openRejectModal(req)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>

                  <button
                    onClick={() => handleApprove(req)}
                    disabled={isProcessing}
                    className="px-4 py-1.5 text-xs font-bold rounded-xl text-white bg-emerald-700 hover:bg-emerald-800 shadow-2xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Issue</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Decline Borrow Request"
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <p className="text-xs text-slate-600">
            Please provide an explainable reason for declining this request. The student will be able to see this reason in their portal.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Rejection Reason
            </label>
            <input
              type="text"
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g., Physical book reserved for in-library reference only..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
            >
              Confirm Decline
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
