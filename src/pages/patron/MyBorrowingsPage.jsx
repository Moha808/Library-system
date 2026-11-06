import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Scale, 
  XCircle, 
  Calendar,
  Send,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPatronBorrowings } from '../../services/borrowService';
import { createDispute } from '../../services/disputeService';
import { Modal } from '../../components/ui/Modal';
import { differenceInCalendarDays, parseISO, startOfDay, format } from 'date-fns';
import toast from 'react-hot-toast';

export function MyBorrowingsPage() {
  const { currentUser } = useAuth();
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Dispute modal state
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [disputeMessage, setDisputeMessage] = useState('');
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [submittingDispute, setSubmittingDispute] = useState(false);

  useEffect(() => {
    loadBorrowings();
  }, [currentUser]);

  async function loadBorrowings() {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getPatronBorrowings(currentUser.id || currentUser.uid);
      setBorrowings(data);
    } catch (e) {
      toast.error('Failed to load your borrowing records');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenDispute(borrow) {
    setSelectedBorrow(borrow);
    setDisputeMessage('');
    setDisputeModalOpen(true);
  }

  async function handleSubmitDispute(e) {
    e.preventDefault();
    if (!disputeMessage || disputeMessage.trim().length < 5) {
      toast.error('Please describe your dispute clearly (minimum 5 characters)');
      return;
    }

    setSubmittingDispute(true);
    try {
      await createDispute({
        userId: currentUser.id || currentUser.uid,
        borrowId: selectedBorrow?.id,
        message: disputeMessage
      });
      toast.success('Dispute submitted! Library administration will review your claim.');
      setDisputeModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to submit dispute');
    } finally {
      setSubmittingDispute(false);
    }
  }

  const filtered = borrowings.filter(b => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return ['issued', 'overdue'].includes(b.status);
    if (statusFilter === 'returned') return b.status === 'returned';
    if (statusFilter === 'requested') return b.status === 'requested';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 m-0">My Borrowing Records</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track all active loans, return due dates, historical books, and file disputes for score deductions
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({borrowings.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'active' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Loans ({borrowings.filter(b => ['issued', 'overdue'].includes(b.status)).length})
          </button>
          <button
            onClick={() => setStatusFilter('returned')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'returned' ? 'bg-white text-blue-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Returned ({borrowings.filter(b => b.status === 'returned').length})
          </button>
          <button
            onClick={() => setStatusFilter('requested')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'requested' ? 'bg-white text-amber-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Requests ({borrowings.filter(b => b.status === 'requested').length})
          </button>
        </div>
      </div>

      {/* Borrowings Table */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <Clock className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No borrowing records found</p>
          <p className="text-xs text-slate-400">Borrow your first textbook from the catalogue</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4 text-left">Book Title</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Borrowed On</th>
                  <th className="py-3 px-4 text-left">Due Date</th>
                  <th className="py-3 px-4 text-left">Return Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map(loan => {
                  const today = startOfDay(new Date());
                  const due = loan.dueDate ? startOfDay(parseISO(loan.dueDate)) : null;
                  const diff = due ? differenceInCalendarDays(due, today) : 0;
                  const isOverdue = diff < 0 || loan.status === 'overdue';

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{loan.bookTitle}</p>
                        <p className="text-slate-400 text-3xs font-mono">Ref: #{loan.id.slice(-6)}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {loan.bookCategory || 'General'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {loan.borrowDate || (loan.status === 'requested' ? 'Pending Approval' : 'N/A')}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {loan.dueDate || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        {loan.status === 'returned' ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-2xs border border-emerald-200 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Returned on {loan.returnDate}
                            </span>
                            <span className="text-3xs text-slate-500">
                              Condition: <strong className="capitalize">{loan.returnCondition || 'Good'}</strong>
                              {loan.lateDays > 0 ? ` (${loan.lateDays} days late)` : ' (Punctual)'}
                            </span>
                          </div>
                        ) : loan.status === 'lost' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-2xs border border-red-200">
                            <XCircle className="w-3 h-3" /> Reported Lost
                          </span>
                        ) : loan.status === 'requested' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-2xs border border-amber-200">
                            <Clock className="w-3 h-3" /> Awaiting Librarian Issue
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-2xs border border-red-300">
                            <AlertCircle className="w-3 h-3" /> OVERDUE ({Math.abs(diff)} days)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-2xs border border-blue-200">
                            <Clock className="w-3 h-3" /> On Loan ({diff} days left)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenDispute(loan)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold text-slate-700 bg-slate-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 rounded-lg border border-slate-200 transition-colors"
                          title="Raise a dispute regarding condition, timing, or penalty"
                        >
                          <Scale className="w-3 h-3 text-amber-600" />
                          <span>Raise Dispute</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      <Modal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        title="Raise Borrowing / Score Dispute"
      >
        <form onSubmit={handleSubmitDispute} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <p className="font-bold text-slate-900">{selectedBorrow?.bookTitle}</p>
            <p className="text-2xs text-slate-500">
              Loan ID: #{selectedBorrow?.id} &bull; Due: {selectedBorrow?.dueDate || 'N/A'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Explain Your Dispute
            </label>
            <p className="text-2xs text-slate-500 mb-1">
              Provide context (e.g. preexisting book wear, exact desk return time, or medical justification).
            </p>
            <textarea
              rows={4}
              value={disputeMessage}
              onChange={e => setDisputeMessage(e.target.value)}
              placeholder="e.g., The cover tear was preexisting before I checked out the book from the shelf..."
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDisputeModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingDispute}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {submittingDispute ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Dispute to Library Desk</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
