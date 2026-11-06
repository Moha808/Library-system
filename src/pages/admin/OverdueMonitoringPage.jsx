import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  RotateCcw, 
  ArrowRight,
  BookOpen,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import { fetchCollection } from '../../firebase/dbAdapter';
import { runOverdueCheck } from '../../services/borrowService';
import { differenceInCalendarDays, parseISO, startOfDay, format } from 'date-fns';
import toast from 'react-hot-toast';

export function OverdueMonitoringPage() {
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    loadOverdues();
  }, []);

  async function loadOverdues() {
    setLoading(true);
    try {
      const active = await fetchCollection('borrowings', [
        { field: 'status', op: 'in', value: ['issued', 'overdue'] }
      ]);

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const overdues = active.filter(l => l.status === 'overdue' || (l.dueDate && l.dueDate < todayStr));

      setOverdueLoans(overdues);
    } catch (e) {
      toast.error('Failed to load overdue records');
    } finally {
      setLoading(false);
    }
  }

  async function handleRunScan() {
    setScanning(true);
    try {
      const res = await runOverdueCheck('LIBRARIAN');
      toast.success(`Overdue scan complete: ${res.overdueFlagged} newly flagged overdue, ${res.defaultsRecorded} defaults logged.`);
      loadOverdues();
    } catch (e) {
      toast.error('Failed to execute overdue scan');
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 m-0">Overdue Monitoring & Enforcement</h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit past-due book loans, identify chronic defaulters, and record automated default records
          </p>
        </div>

        <button
          onClick={handleRunScan}
          disabled={scanning}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-red-700 text-white hover:bg-red-800 shadow-2xs self-start transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Running System Scan...' : 'Run Overdue Check Now'}</span>
        </button>
      </div>

      {/* Overdue Summary Banner */}
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="text-xs text-red-900 leading-relaxed">
          <p className="font-bold">Overdue Penalty & Borrowing Block Policy</p>
          <p className="mt-0.5">
            Any patron with an overdue book has their borrowing rights automatically suspended until all outstanding books are returned. Late returns incur an automatic deduction of −5 points per loan, and patrons with 3+ defaults face repeated default penalties (−10 points).
          </p>
        </div>
      </div>

      {/* Table of Overdue Loans */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : overdueLoans.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <Clock className="w-10 h-10 mx-auto text-emerald-500" />
          <p className="text-sm font-bold text-slate-800">No overdue loans on record</p>
          <p className="text-xs text-slate-400">All current books on loan are within their scheduled borrowing window</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4 text-left">Patron Name & Matric</th>
                  <th className="py-3 px-4 text-left">Book Title</th>
                  <th className="py-3 px-4 text-left">Due Date</th>
                  <th className="py-3 px-4 text-center">Overdue Duration</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {overdueLoans.map(loan => {
                  const today = startOfDay(new Date());
                  const due = loan.dueDate ? startOfDay(parseISO(loan.dueDate)) : today;
                  const diff = differenceInCalendarDays(today, due);

                  return (
                    <tr key={loan.id} className="hover:bg-red-50/30">
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/admin/patrons/${loan.userId}`}
                          className="font-bold text-slate-900 hover:text-emerald-700"
                        >
                          {loan.userName}
                        </Link>
                        <p className="text-3xs text-slate-400 font-mono mt-0.5">{loan.userMatricNo} &bull; {loan.userDepartment}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {loan.bookTitle}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-red-700">
                        {loan.dueDate || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-bold text-2xs border border-red-300">
                          <AlertTriangle className="w-3 h-3" />
                          {diff} {diff === 1 ? 'day' : 'days'} overdue
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to="/admin/return"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-2xs hover:bg-emerald-800 transition-colors shadow-2xs"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Process Return</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
