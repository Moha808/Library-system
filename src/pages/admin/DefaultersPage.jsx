import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  ArrowRight, 
  AlertTriangle, 
  UserX, 
  UserCheck 
} from 'lucide-react';
import { fetchCollection, modifyDocument } from '../../firebase/dbAdapter';
import { ClassificationBadge } from '../../components/ui/ClassificationBadge';
import toast from 'react-hot-toast';

export function DefaultersPage() {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('score_asc'); // 'score_asc' | 'defaults_desc'

  useEffect(() => {
    loadDefaulters();
  }, []);

  async function loadDefaulters() {
    setLoading(true);
    try {
      const [allUsers, allScores] = await Promise.all([
        fetchCollection('users'),
        fetchCollection('creditScores')
      ]);

      const userMap = new Map(allUsers.map(u => [u.id, u]));

      // Filter patrons with defaults or low scores
      const list = allScores
        .filter(s => (s.defaultCount || 0) > 0 || (s.score || 50) < 40)
        .map(s => {
          const u = userMap.get(s.userId);
          return {
            userId: s.userId,
            name: u?.name || 'Unknown Student',
            matricNo: u?.matricNo || 'N/A',
            department: u?.department || 'N/A',
            email: u?.email || 'N/A',
            status: u?.status || 'active',
            score: s.score,
            classification: s.classification || 'poor',
            defaultCount: s.defaultCount || 0,
            lateReturns: s.lateReturns || 0,
            damagedReturns: s.damagedReturns || 0,
            lostBooks: s.lostBooks || 0
          };
        });

      setDefaulters(list);
    } catch (e) {
      toast.error('Failed to load defaulters');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await modifyDocument('users', userId, { status: newStatus });
      toast.success(`Patron account ${newStatus}`);
      loadDefaulters();
    } catch (e) {
      toast.error('Failed to update status');
    }
  }

  const sorted = [...defaulters].sort((a, b) => {
    if (sortBy === 'score_asc') return a.score - b.score;
    if (sortBy === 'defaults_desc') return b.defaultCount - a.defaultCount;
    return 0;
  });

  const filtered = sorted.filter(p => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.matricNo.toLowerCase().includes(term) ||
      p.department.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 m-0">Library Defaulters Tracker</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track students with active penalties, repeated defaults, damaged literature, or restricted borrowing status
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-900 border border-orange-200 text-xs font-bold flex items-center gap-1.5 self-start">
          <ShieldAlert className="w-4 h-4 text-orange-700" />
          <span>{defaulters.length} Defaulters on File</span>
        </div>
      </div>

      {/* Search and Sort Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search defaulter by student name, matric no, department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="min-w-[200px]">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full py-2 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 text-slate-700"
          >
            <option value="score_asc">Sort by Score (Lowest First)</option>
            <option value="defaults_desc">Sort by Default Count (Highest First)</option>
          </select>
        </div>
      </div>

      {/* Defaulters Table */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <ShieldAlert className="w-10 h-10 mx-auto text-emerald-500" />
          <p className="text-sm font-bold text-slate-700">No defaulters found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4 text-left">Patron</th>
                  <th className="py-3 px-4 text-left">Credit Rating</th>
                  <th className="py-3 px-4 text-center">Total Defaults</th>
                  <th className="py-3 px-4 text-left">Breakdown (Late / Dmg / Lost)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map(p => {
                  const isSuspended = p.status === 'suspended';

                  return (
                    <tr key={p.userId} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/admin/patrons/${p.userId}`}
                          className="font-bold text-slate-900 hover:text-emerald-700"
                        >
                          {p.name}
                        </Link>
                        <p className="text-3xs text-slate-400 font-mono mt-0.5">{p.matricNo} &bull; {p.department}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <ClassificationBadge tier={p.classification} score={p.score} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-red-700">
                        {p.defaultCount}
                      </td>
                      <td className="py-3.5 px-4 text-2xs text-slate-600 font-mono">
                        <span className="text-amber-700 font-bold">{p.lateReturns} late</span> &bull;{' '}
                        <span className="text-orange-700 font-bold">{p.damagedReturns} damaged</span> &bull;{' '}
                        <span className="text-red-700 font-bold">{p.lostBooks} lost</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${
                          isSuspended ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleStatus(p.userId, p.status)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold ${
                            isSuspended 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                          title={isSuspended ? 'Reinstate' : 'Suspend'}
                        >
                          {isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        </button>
                        <Link
                          to={`/admin/patrons/${p.userId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200"
                        >
                          Dossier
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
