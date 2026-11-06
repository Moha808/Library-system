import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, 
  Search, 
  BookOpen, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchCollection } from '../../firebase/dbAdapter';
import { checkEligibility } from '../../services/eligibilityService';
import { directIssueBook } from '../../services/borrowService';
import { ClassificationBadge } from '../../components/ui/ClassificationBadge';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';

export function IssueBookPage() {
  const { currentUser } = useAuth();
  const [patrons, setPatrons] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected State
  const [selectedPatron, setSelectedPatron] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Administrative Override state
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [issuing, setIssuing] = useState(false);

  // Search filters
  const [patronSearch, setPatronSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [allUsers, allBooks, allScores] = await Promise.all([
        fetchCollection('users'),
        fetchCollection('books'),
        fetchCollection('creditScores')
      ]);

      const scoreMap = new Map(allScores.map(s => [s.userId, s]));
      const patronList = allUsers
        .filter(u => u.role !== 'admin')
        .map(u => ({
          ...u,
          scoreDoc: scoreMap.get(u.id) || { score: 50, classification: 'fair' }
        }));

      setPatrons(patronList);
      setBooks(allBooks);
    } catch (e) {
      toast.error('Failed to load circulation records');
    } finally {
      setLoading(false);
    }
  }

  // Check eligibility whenever patron or book changes
  useEffect(() => {
    async function verify() {
      if (selectedPatron && selectedBook) {
        setVerifying(true);
        try {
          const res = await checkEligibility(selectedPatron.id, selectedBook.id);
          setEligibilityResult(res);
          setShowOverrideForm(!res.eligible);
        } catch (e) {
          console.error(e);
        } finally {
          setVerifying(false);
        }
      } else {
        setEligibilityResult(null);
        setShowOverrideForm(false);
      }
    }
    verify();
  }, [selectedPatron, selectedBook]);

  async function handleConfirmIssue() {
    if (!selectedPatron || !selectedBook) return;

    if (!eligibilityResult?.eligible && (!overrideReason || overrideReason.trim().length < 5)) {
      toast.error('A minimum 5-character reason is required for administrative overrides');
      return;
    }

    setIssuing(true);
    try {
      const res = await directIssueBook({
        userId: selectedPatron.id,
        bookId: selectedBook.id,
        adminUid: currentUser?.id || currentUser?.uid || 'ADMIN',
        overrideReason: !eligibilityResult?.eligible ? overrideReason : null
      });

      toast.success(`Book successfully issued to ${selectedPatron.name}! Due date: ${res.dueDate}`);
      setSelectedBook(null);
      setSelectedPatron(null);
      setOverrideReason('');
      setShowOverrideForm(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to issue book');
    } finally {
      setIssuing(false);
    }
  }

  const filteredPatrons = patrons.filter(p => {
    if (!patronSearch.trim()) return true;
    const term = patronSearch.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.matricNo && p.matricNo.toLowerCase().includes(term)) ||
      (p.department && p.department.toLowerCase().includes(term))
    );
  });

  const filteredBooks = books.filter(b => {
    if (!bookSearch.trim()) return true;
    const term = bookSearch.toLowerCase();
    return (
      (b.title && b.title.toLowerCase().includes(term)) ||
      (b.author && b.author.toLowerCase().includes(term)) ||
      (b.category && b.category.toLowerCase().includes(term))
    );
  });

  const previewDueDate = eligibilityResult?.loanDays 
    ? format(addDays(new Date(), eligibilityResult.loanDays), 'yyyy-MM-dd')
    : format(addDays(new Date(), 14), 'yyyy-MM-dd');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-black text-slate-900 m-0">Direct Book Issue Desk</h1>
        <p className="text-xs text-slate-500 mt-1">
          Issue library literature directly to students with automatic tier clearance and authorized librarian overrides
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1: Select Patron (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[580px]">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
            1. Select Patron ({filteredPatrons.length})
          </span>

          <div className="relative my-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patron by name or matric..."
              value={patronSearch}
              onChange={e => setPatronSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredPatrons.map(p => {
              const isSelected = selectedPatron?.id === p.id;
              const score = p.scoreDoc?.score ?? 50;
              const classification = p.scoreDoc?.classification || 'fair';

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatron(p)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs font-medium' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-bold text-slate-900 truncate">{p.name}</p>
                    <ClassificationBadge tier={classification} score={score} size="sm" />
                  </div>
                  <p className="text-slate-500 text-3xs mt-1 font-mono">{p.matricNo}</p>
                  <p className="text-slate-400 text-3xs truncate">{p.department}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Book (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[580px]">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
            2. Select Book ({filteredBooks.length})
          </span>

          <div className="relative my-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, author, category..."
              value={bookSearch}
              onChange={e => setBookSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredBooks.map(b => {
              const isSelected = selectedBook?.id === b.id;
              const hasCopies = (b.availableCopies || 0) > 0;

              return (
                <div
                  key={b.id}
                  onClick={() => hasCopies && setSelectedBook(b)}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    !hasCopies ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50' :
                    isSelected ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs font-medium cursor-pointer' :
                    'border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-slate-900 line-clamp-1">{b.title}</p>
                    <span className={`text-3xs font-extrabold px-1.5 py-0.5 rounded ${
                      hasCopies ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {hasCopies ? `${b.availableCopies} avail` : '0 copies'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-2xs mt-0.5 line-clamp-1">{b.author}</p>
                  <p className="text-slate-400 text-3xs mt-1 truncate">{b.category}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Eligibility & Issue Confirmation (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between h-[580px]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 block">
              3. Verification & Loan Terms
            </span>

            {/* Selected Summary */}
            <div className="mt-3 space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-3xs uppercase font-bold text-slate-400">Patron:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {selectedPatron ? `${selectedPatron.name} (${selectedPatron.matricNo})` : 'None selected'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-3xs uppercase font-bold text-slate-400">Book:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {selectedBook ? selectedBook.title : 'None selected'}
                </p>
              </div>
            </div>

            {/* Eligibility Verdict */}
            <div className="mt-4">
              {verifying ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Checking borrower score clearance...</span>
                </div>
              ) : eligibilityResult ? (
                eligibilityResult.eligible ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Approved: {eligibilityResult.tierLabel} Tier</span>
                    </div>
                    <div className="text-emerald-800 text-2xs space-y-1">
                      <p>Loan Period: <strong>{eligibilityResult.loanDays} days</strong></p>
                      <p>Projected Due Date: <strong>{previewDueDate}</strong></p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-red-900">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>Ineligible to Borrow</span>
                    </div>
                    <p className="text-2xs text-red-800 leading-relaxed font-medium">
                      {eligibilityResult.reason}
                    </p>
                  </div>
                )
              ) : (
                <p className="text-center py-6 text-xs text-slate-400">
                  Select both a patron and a book to calculate loan eligibility.
                </p>
              )}
            </div>

            {/* Administrative Override Field if blocked */}
            {showOverrideForm && (
              <div className="mt-3 p-3.5 bg-amber-50 rounded-xl border border-amber-300 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Librarian Override Required</span>
                </div>
                <p className="text-3xs text-amber-800">
                  You may override this block if there are extenuating academic reasons. Reason is logged to audit trail.
                </p>
                <input
                  type="text"
                  placeholder="e.g., Final year project thesis urgent research waiver..."
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-amber-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={handleConfirmIssue}
              disabled={
                issuing || 
                !selectedPatron || 
                !selectedBook || 
                (!eligibilityResult?.eligible && (!overrideReason || overrideReason.trim().length < 5))
              }
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-md flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
            >
              {issuing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>
                    {!eligibilityResult?.eligible && overrideReason ? 'Issue Book with Override' : 'Issue Book to Patron'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
