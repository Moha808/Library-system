import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  ArrowRight,
  Filter,
  GraduationCap
} from 'lucide-react';
import { fetchCollection, modifyDocument } from '../../firebase/dbAdapter';
import { ClassificationBadge } from '../../components/ui/ClassificationBadge';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';

export function PatronsManagementPage() {
  const [patrons, setPatrons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [pendingStatusPatron, setPendingStatusPatron] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadPatrons();
  }, []);

  async function loadPatrons() {
    setLoading(true);
    try {
      const [allUsers, allScores] = await Promise.all([
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

      setPatrons(patronList);
    } catch (e) {
      toast.error('Failed to load patron directory');
    } finally {
      setLoading(false);
    }
  }

  function handleToggleStatus(patron) {
    setPendingStatusPatron(patron);
  }

  async function handleConfirmToggleStatus() {
    if (!pendingStatusPatron) return;
    const newStatus = pendingStatusPatron.status === 'suspended' ? 'active' : 'suspended';
    setUpdating(true);
    try {
      await modifyDocument('users', pendingStatusPatron.id, { status: newStatus });
      toast.success(`Patron account ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`);
      setPendingStatusPatron(null);
      loadPatrons();
    } catch (err) {
      toast.error('Failed to update patron account status');
    } finally {
      setUpdating(false);
    }
  }

  const filtered = patrons.filter(p => {
    if (tierFilter !== 'all') {
      const pTier = p.scoreDoc?.classification || 'fair';
      if (pTier.toLowerCase() !== tierFilter.toLowerCase()) return false;
    }

    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.matricNo && p.matricNo.toLowerCase().includes(term)) ||
      (p.department && p.department.toLowerCase().includes(term)) ||
      (p.email && p.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 m-0">Student Patron Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage FCAHPT Vom student accounts, inspect real-time credit ratings, and enforce account suspensions
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 self-start">
          <Users className="w-4 h-4 text-emerald-700" />
          <span>{patrons.length} Registered Students</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, matric no, email, or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="min-w-[180px]">
          <select
            value={tierFilter}
            onChange={e => setTierFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 text-slate-700"
          >
            <option value="all">All Credit Tiers</option>
            <option value="excellent">Excellent (80-100)</option>
            <option value="good">Good (60-79)</option>
            <option value="fair">Fair (40-59)</option>
            <option value="poor">Poor (20-39)</option>
            <option value="verypoor">Very Poor (0-19)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <Users className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No patrons match your search</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4 text-left">Patron Name</th>
                  <th className="py-3 px-4 text-left">Matric No & Dept</th>
                  <th className="py-3 px-4 text-left">Credit Rating</th>
                  <th className="py-3 px-4 text-center">Defaults</th>
                  <th className="py-3 px-4 text-center">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map(p => {
                  const score = p.scoreDoc?.score ?? 50;
                  const classification = p.scoreDoc?.classification || 'fair';
                  const isSuspended = p.status === 'suspended';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4">
                        <Link 
                          to={`/admin/patrons/${p.id}`}
                          className="font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1.5"
                        >
                          <span>{p.name}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </Link>
                        <p className="text-3xs text-slate-400 font-mono mt-0.5">{p.email}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <p className="font-mono font-semibold">{p.matricNo || 'N/A'}</p>
                        <p className="text-2xs text-slate-500">{p.department}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <ClassificationBadge tier={classification} score={score} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {(p.scoreDoc?.defaultCount || 0) > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-2xs font-bold border border-red-200">
                            {p.scoreDoc.defaultCount} defaults
                          </span>
                        ) : (
                          <span className="text-slate-400 text-2xs">0 defaults</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider ${
                          isSuspended ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                            isSuspended 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          }`}
                          title={isSuspended ? 'Activate Account' : 'Suspend Account'}
                        >
                          {isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </button>
                        <Link
                          to={`/admin/patrons/${p.id}`}
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

      <ConfirmModal
        isOpen={Boolean(pendingStatusPatron)}
        onClose={() => setPendingStatusPatron(null)}
        onConfirm={handleConfirmToggleStatus}
        title={pendingStatusPatron?.status === 'suspended' ? 'Reinstate Patron Borrowing Rights' : 'Suspend Patron Account'}
        message={pendingStatusPatron ? (
          pendingStatusPatron.status === 'suspended' 
            ? `Are you sure you want to reinstate book borrowing privileges for ${pendingStatusPatron.name} (${pendingStatusPatron.matricNo || 'Patron'})?` 
            : `Are you sure you want to suspend borrowing privileges for ${pendingStatusPatron.name} (${pendingStatusPatron.matricNo || 'Patron'})? They will be blocked from borrowing books until cleared.`
        ) : ''}
        confirmText={pendingStatusPatron?.status === 'suspended' ? 'Reinstate Rights' : 'Suspend Account'}
        cancelText="Cancel"
        type={pendingStatusPatron?.status === 'suspended' ? 'primary' : 'danger'}
        loading={updating}
      />
    </div>
  );
}
