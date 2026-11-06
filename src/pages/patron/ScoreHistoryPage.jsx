import React, { useEffect, useState } from 'react';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Sliders, 
  HelpCircle,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchCollection } from '../../firebase/dbAdapter';
import { getPatronScore, classifyScore } from '../../services/scoreService';
import { ClassificationBadge } from '../../components/ui/ClassificationBadge';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export function ScoreHistoryPage() {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [scoreDoc, setScoreDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all | positive | negative | manual

  useEffect(() => {
    async function loadLogs() {
      if (!currentUser) return;
      const uid = currentUser.id || currentUser.uid;
      setLoading(true);
      try {
        const [score, userLogs] = await Promise.all([
          getPatronScore(uid),
          fetchCollection('scoreLogs', [{ field: 'userId', op: '==', value: uid }], { field: 'createdAt', direction: 'desc' })
        ]);
        setScoreDoc(score);
        setLogs(userLogs);
      } catch (e) {
        toast.error('Failed to load score history logs');
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, [currentUser]);

  const currentScore = scoreDoc?.score ?? 50;
  const classification = classifyScore(currentScore);

  const filteredLogs = logs.filter(log => {
    if (filterType === 'positive') return (log.points || 0) > 0;
    if (filterType === 'negative') return (log.points || 0) < 0;
    if (filterType === 'manual') return log.event === 'MANUAL_ADJUSTMENT';
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Current Score Status */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 m-0">Score Audit Trail</h1>
            <ClassificationBadge tier={classification.tier} score={currentScore} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete, transparent ledger of every borrowing behaviour event affecting your score
          </p>
        </div>

        <Link
          to="/patron/how-it-works"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 self-start hover:bg-emerald-100 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Scoring Rules Guide</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs font-semibold">
        <span className="text-slate-400 flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterType === 'all' ? 'bg-slate-900 text-white shadow-2xs font-bold' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Activity ({logs.length})
        </button>
        <button
          onClick={() => setFilterType('positive')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterType === 'positive' ? 'bg-emerald-700 text-white shadow-2xs font-bold' : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          Points Gained (+)
        </button>
        <button
          onClick={() => setFilterType('negative')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterType === 'negative' ? 'bg-red-700 text-white shadow-2xs font-bold' : 'bg-white text-red-800 border border-red-200 hover:bg-red-50'
          }`}
        >
          Penalties Deducted (−)
        </button>
        <button
          onClick={() => setFilterType('manual')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterType === 'manual' ? 'bg-blue-700 text-white shadow-2xs font-bold' : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-50'
          }`}
        >
          Staff Adjustments
        </button>
      </div>

      {/* Timeline List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <History className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No score events found</p>
          <p className="text-xs text-slate-400">Score logs are automatically recorded when books are returned or reviewed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map(log => {
            const isPositive = (log.points || 0) > 0;
            const isNegative = (log.points || 0) < 0;

            return (
              <div 
                key={log.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between gap-4 transition-all hover:border-slate-300"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    isNegative ? 'bg-red-50 text-red-700 border border-red-200' :
                    'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> :
                     isNegative ? <TrendingDown className="w-4 h-4" /> :
                     <Sliders className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {log.event.replace(/_/g, ' ')}
                      </span>
                      {log.bookTitle && (
                        <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {log.bookTitle}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      {log.reason}
                    </p>

                    <div className="flex items-center gap-3 text-3xs text-slate-400 mt-2 font-mono">
                      <span>Recorded: {log.createdAt ? log.createdAt.replace('T', ' ').slice(0, 16) : 'N/A'}</span>
                      <span>By: {log.createdBy || 'SYSTEM'}</span>
                    </div>
                  </div>
                </div>

                {/* Score delta pill */}
                <div className="text-right shrink-0">
                  <span className={`text-sm font-extrabold font-mono px-2.5 py-1 rounded-lg border ${
                    isPositive ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                    isNegative ? 'bg-red-100 text-red-800 border-red-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {isPositive ? `+${log.points}` : log.points} pts
                  </span>

                  {log.scoreBefore !== undefined && log.scoreAfter !== undefined && (
                    <div className="text-3xs text-slate-400 font-mono mt-1.5 flex items-center justify-end gap-1">
                      <span>{log.scoreBefore}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                      <strong className="text-slate-800">{log.scoreAfter}</strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
