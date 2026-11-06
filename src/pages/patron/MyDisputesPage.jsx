import React, { useEffect, useState } from 'react';
import { 
  Scale, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Send,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPatronDisputes, createDispute } from '../../services/disputeService';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export function MyDisputesPage() {
  const { currentUser } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, [currentUser]);

  async function loadDisputes() {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getPatronDisputes(currentUser.id || currentUser.uid);
      setDisputes(data);
    } catch (e) {
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!message || message.trim().length < 5) {
      toast.error('Please enter a detailed message (minimum 5 characters)');
      return;
    }

    setSubmitting(true);
    try {
      await createDispute({
        userId: currentUser.id || currentUser.uid,
        borrowId: null,
        message
      });
      toast.success('Dispute ticket submitted successfully');
      setNewModalOpen(false);
      setMessage('');
      loadDisputes();
    } catch (err) {
      toast.error(err.message || 'Failed to submit dispute');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 m-0">Dispute Resolution Desk</h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit and monitor reviews on score deductions, book condition assessments, or timing disagreements
          </p>
        </div>

        <button
          onClick={() => setNewModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-2xs self-start transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Raise New Dispute</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <Scale className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No disputes filed</p>
          <p className="text-xs text-slate-400">If you ever have an inaccurate score penalty, submit a review request here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map(dispute => {
            const isResolved = dispute.status === 'resolved';
            const isRejected = dispute.status === 'rejected';
            const isOpen = dispute.status === 'open';

            return (
              <div 
                key={dispute.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {dispute.bookTitle || 'General Score Dispute'}
                      </span>
                      <span className="text-3xs font-mono text-slate-400">
                        Ticket #{dispute.id.slice(-6)}
                      </span>
                    </div>
                    <span className="text-3xs text-slate-400 font-mono mt-0.5 block">
                      Submitted: {dispute.createdAt ? dispute.createdAt.slice(0, 10) : 'N/A'}
                    </span>
                  </div>

                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold uppercase tracking-wider ${
                    isResolved ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    isRejected ? 'bg-red-100 text-red-800 border border-red-200' :
                    'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {isResolved ? <CheckCircle2 className="w-3 h-3" /> :
                     isRejected ? <XCircle className="w-3 h-3" /> :
                     <Clock className="w-3 h-3" />}
                    <span>{dispute.status}</span>
                  </span>
                </div>

                {/* Patron Message */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <p className="font-semibold text-slate-900 mb-1">Your Submission:</p>
                  <p className="leading-relaxed">{dispute.message}</p>
                </div>

                {/* Librarian Response */}
                {dispute.adminResponse && (
                  <div className={`p-3.5 rounded-xl border text-xs ${
                    isResolved ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold flex items-center gap-1.5 text-slate-900">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Library Administration Response:</span>
                      </p>
                      {dispute.scoreAdjustmentApplied && (
                        <span className="font-mono font-bold text-emerald-700 text-2xs bg-emerald-100 px-2 py-0.5 rounded-md">
                          +{dispute.scoreAdjustmentApplied} pts restored
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed">{dispute.adminResponse}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Dispute Modal */}
      <Modal
        isOpen={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        title="Submit a Dispute Ticket"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Explain the situation to the library staff. If this relates to a specific book, please mention the title or borrowing date.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Dispute Explanation
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="e.g., I handed in the poultry health manual on Friday afternoon to the student assistant before closing..."
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setNewModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
