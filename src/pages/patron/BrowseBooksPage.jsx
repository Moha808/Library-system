import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAllBooks, BOOK_CATEGORIES } from '../../services/bookService';
import { checkEligibility } from '../../services/eligibilityService';
import { requestBorrow } from '../../services/borrowService';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export function BrowseBooksPage() {
  const { currentUser } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Eligibility check state & modal
  const [selectedBook, setSelectedBook] = useState(null);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [submittingBorrow, setSubmittingBorrow] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadBooks();
  }, [searchTerm, selectedCategory, availableOnly]);

  async function loadBooks() {
    setLoading(true);
    try {
      const data = await getAllBooks({
        search: searchTerm,
        category: selectedCategory,
        availableOnly
      });
      setBooks(data);
    } catch (e) {
      toast.error('Failed to load books catalogue');
    } finally {
      setLoading(false);
    }
  }

  async function handleInitiateBorrow(book) {
    if (!currentUser) {
      toast.error('Please log in to borrow books');
      return;
    }

    setSelectedBook(book);
    setCheckingEligibility(true);
    setModalOpen(true);

    try {
      const result = await checkEligibility(currentUser.id || currentUser.uid, book.id);
      setEligibilityResult(result);
    } catch (err) {
      toast.error('Could not verify borrowing eligibility');
      setModalOpen(false);
    } finally {
      setCheckingEligibility(false);
    }
  }

  async function handleConfirmBorrow() {
    if (!selectedBook || !eligibilityResult?.eligible) return;
    setSubmittingBorrow(true);
    try {
      await requestBorrow(currentUser.id || currentUser.uid, selectedBook.id);
      toast.success(`Borrow request submitted for "${selectedBook.title}"! Awaiting librarian issue.`);
      setModalOpen(false);
      loadBooks();
    } catch (err) {
      toast.error(err.message || 'Failed to submit borrow request');
    } finally {
      setSubmittingBorrow(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 m-0">Library Catalogue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse and borrow textbooks tailored for FCAHPT Vom animal science, veterinary, and agricultural curricula
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 self-start">
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <span>{books.length} titles in library</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Category dropdown */}
        <div className="relative min-w-[220px]">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full py-2.5 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-700"
          >
            <option value="">All Academic Disciplines</option>
            {BOOK_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Available only toggle */}
        <label className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={e => setAvailableOnly(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>Available Only</span>
        </label>
      </div>

      {/* Books List Grid */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : books.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No books matched your search</p>
          <p className="text-xs text-slate-400">Try adjusting your keywords or clearing the category filter</p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory(''); setAvailableOnly(false); }}
            className="text-xs font-semibold text-emerald-700 underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {books.map(book => {
            const hasCopies = (book.availableCopies || 0) > 0;
            return (
              <div 
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-3xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[200px]">
                      {book.category}
                    </span>
                    <span className={`text-3xs font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      hasCopies 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {hasCopies ? `${book.availableCopies} Copies Available` : 'On Loan'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    By <span className="font-medium text-slate-700">{book.author}</span>
                  </p>

                  <div className="mt-3 flex items-center justify-between text-3xs text-slate-400 border-t border-slate-100 pt-2 font-mono">
                    <span>ISBN: {book.isbn || 'N/A'}</span>
                    <span>Loc: {book.shelfLocation || 'Main Stack'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleInitiateBorrow(book)}
                    disabled={!hasCopies}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      hasCopies 
                        ? 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-2xs' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{hasCopies ? 'Borrow This Title' : 'All Copies Borrowed'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Eligibility Verification & Confirmation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Borrowing Eligibility Verification"
      >
        {checkingEligibility ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Verifying borrowing eligibility with LibCredit scoring engine...</p>
          </div>
        ) : eligibilityResult ? (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-3xs uppercase font-bold text-slate-400">Selected Title:</span>
              <p className="font-bold text-slate-900 mt-0.5">{selectedBook?.title}</p>
              <p className="text-slate-500 text-2xs">By {selectedBook?.author}</p>
            </div>

            {/* Result Verdict Box */}
            {eligibilityResult.eligible ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  <span>Borrowing Request Approved by Engine</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {eligibilityResult.reason}
                </p>
                <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs text-emerald-950 font-semibold">
                  <span>Authorized Loan Period:</span>
                  <span className="font-bold font-mono">{eligibilityResult.loanDays} Calendar Days</span>
                </div>
                {eligibilityResult.needsMonitoring && (
                  <p className="text-2xs text-amber-800 font-medium pt-1">
                    * Note: Your account is in the Fair Tier (Normal with Monitoring). Prompt return ensures score ascension!
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-red-50 border border-red-300 space-y-2">
                <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span>Borrowing Blocked by Scoring Policy</span>
                </div>
                <p className="text-xs text-red-800 leading-relaxed font-medium">
                  {eligibilityResult.reason}
                </p>
                <div className="pt-2 border-t border-red-200 text-2xs text-red-700">
                  <p>How to resolve:</p>
                  <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-slate-600">
                    <li>Return any currently overdue books immediately.</li>
                    <li>Wait for active books to be returned to free up quota slots.</li>
                    <li>Speak with the college librarian at the circulation desk if you require an administrative override.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>

              {eligibilityResult.eligible && (
                <button
                  type="button"
                  onClick={handleConfirmBorrow}
                  disabled={submittingBorrow}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingBorrow ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm Borrow Request</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
