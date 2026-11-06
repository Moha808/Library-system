import React, { useEffect, useState } from 'react';
import { 
  HelpCircle, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { getScoringSettings } from '../../services/settingsService';
import { DEFAULT_SCORING_SETTINGS } from '../../firebase/dbAdapter';

export function HowItWorksPage() {
  const [settings, setSettings] = useState(DEFAULT_SCORING_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const s = await getScoringSettings();
        setSettings(s);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
          <BookOpen className="w-4 h-4" />
          <span>FCAHPT Library Policy Framework</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 m-0">
          How the LibCredit Scoring Model Works
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          The LibCredit system at the Federal College of Animal Health and Production Technology (FCAHPT), Vom evaluates student borrowing behaviour objectively, fostering high punctuality, proper book preservation, and fair access to library literature.
        </p>
      </div>

      {/* Formula Box */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white shadow-md">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-300">
          The Credit Score Formula
        </h3>
        <div className="mt-2 text-lg sm:text-2xl font-mono font-bold tracking-tight text-white flex flex-wrap items-center gap-2">
          <span>Score = 50 (Initial)</span>
          <span className="text-emerald-400">+ Positive Points</span>
          <span className="text-rose-400">− Negative Penalties</span>
        </div>
        <p className="mt-2 text-xs text-slate-300">
          Scores are strictly clamped between a minimum of <strong>0</strong> and a maximum of <strong>100</strong>. Every single score event produces an auditable log entry that you can inspect on your timeline.
        </p>
      </div>

      {/* Rules Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positive Rules */}
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-800">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold">Positive Scoring Events</h3>
          </div>
          <ul className="space-y-3 text-xs text-slate-700">
            <li className="flex items-start justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div>
                <strong className="block text-slate-900">Punctual Return (On Due Date)</strong>
                <span className="text-slate-500">Returned on or before 4:00 PM on the due date.</span>
              </div>
              <span className="font-mono font-bold text-emerald-700 text-sm">+{settings.onTimeBonus || 10}</span>
            </li>
            <li className="flex items-start justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div>
                <strong className="block text-slate-900">Early Return (Before Due Date)</strong>
                <span className="text-slate-500">Returned days in advance so other students can borrow.</span>
              </div>
              <span className="font-mono font-bold text-emerald-700 text-sm">+{settings.earlyBonus || 10}</span>
            </li>
            <li className="flex items-start justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div>
                <strong className="block text-slate-900">Book in Good Condition</strong>
                <span className="text-slate-500">Clean, crisp pages, undamaged spine, no water or dirt damage.</span>
              </div>
              <span className="font-mono font-bold text-emerald-700 text-sm">+{settings.goodConditionBonus || 5}</span>
            </li>
          </ul>
        </div>

        {/* Negative Rules */}
        <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-red-800">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <h3 className="text-base font-bold">Negative Penalties & Defaults</h3>
          </div>
          <ul className="space-y-3 text-xs text-slate-700">
            <li className="flex items-start justify-between p-3 rounded-xl bg-red-50/60 border border-red-100">
              <div>
                <strong className="block text-slate-900">Late Book Return</strong>
                <span className="text-slate-500">Returned past the scheduled due date.</span>
              </div>
              <span className="font-mono font-bold text-red-700 text-sm">−{settings.latePenalty || 5}</span>
            </li>
            <li className="flex items-start justify-between p-3 rounded-xl bg-red-50/60 border border-red-100">
              <div>
                <strong className="block text-slate-900">Physical Damage to Book</strong>
                <span className="text-slate-500">Torn covers, missing pages, liquid spills, or defaced diagrams.</span>
              </div>
              <span className="font-mono font-bold text-red-700 text-sm">−{settings.damagedConditionPenalty || 10}</span>
            </li>
            <li className="flex items-start justify-between p-3 rounded-xl bg-red-50/60 border border-red-100">
              <div>
                <strong className="block text-slate-900">Lost or Non-Returned Book</strong>
                <span className="text-slate-500">Book lost, unreturned, or reported irrecoverable.</span>
              </div>
              <span className="font-mono font-bold text-red-700 text-sm">−{settings.lostConditionPenalty || 20}</span>
            </li>
            <li className="flex items-start justify-between p-3 rounded-xl bg-orange-50/60 border border-orange-100">
              <div>
                <strong className="block text-slate-900">Repeated Default Penalty</strong>
                <span className="text-slate-500">Applied when a patron already has {settings.repeatedDefaultThreshold || 3}+ prior defaults.</span>
              </div>
              <span className="font-mono font-bold text-orange-700 text-sm">−{settings.repeatedDefaultPenalty || 10}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Tier Classifications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">
            Classification Tiers & Borrowing Entitlements
          </h3>
          <p className="text-2xs text-slate-500 mt-0.5">
            Your score band directly dictates how many books you can check out and for how long.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4 text-left">Score Range</th>
                <th className="py-3 px-4 text-left">Tier Classification</th>
                <th className="py-3 px-4 text-left">Borrowing Limit</th>
                <th className="py-3 px-4 text-left">Loan Period</th>
                <th className="py-3 px-4 text-left">Status & Privilege</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr className="hover:bg-emerald-50/40">
                <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">80 – 100</td>
                <td className="py-3.5 px-4 font-bold text-emerald-900">Excellent</td>
                <td className="py-3.5 px-4">Up to 5 books</td>
                <td className="py-3.5 px-4">21 days</td>
                <td className="py-3.5 px-4 text-emerald-700">Priority Borrowing (Highest clearance)</td>
              </tr>
              <tr className="hover:bg-blue-50/40">
                <td className="py-3.5 px-4 font-mono font-bold text-blue-800">60 – 79</td>
                <td className="py-3.5 px-4 font-bold text-blue-900">Good</td>
                <td className="py-3.5 px-4">Up to 4 books</td>
                <td className="py-3.5 px-4">14 days</td>
                <td className="py-3.5 px-4 text-blue-700">Normal borrowing privileges</td>
              </tr>
              <tr className="hover:bg-amber-50/40">
                <td className="py-3.5 px-4 font-mono font-bold text-amber-800">40 – 59</td>
                <td className="py-3.5 px-4 font-bold text-amber-900">Fair (Initial Baseline)</td>
                <td className="py-3.5 px-4">Up to 3 books</td>
                <td className="py-3.5 px-4">14 days</td>
                <td className="py-3.5 px-4 text-amber-700">Normal borrowing with system monitoring</td>
              </tr>
              <tr className="hover:bg-orange-50/40">
                <td className="py-3.5 px-4 font-mono font-bold text-orange-800">20 – 39</td>
                <td className="py-3.5 px-4 font-bold text-orange-900">Poor</td>
                <td className="py-3.5 px-4">1 book only</td>
                <td className="py-3.5 px-4">7 days</td>
                <td className="py-3.5 px-4 text-orange-700">Restricted borrowing privileges</td>
              </tr>
              <tr className="hover:bg-red-50/40">
                <td className="py-3.5 px-4 font-mono font-bold text-red-800">0 – 19</td>
                <td className="py-3.5 px-4 font-bold text-red-900">Very Poor</td>
                <td className="py-3.5 px-4">0 books</td>
                <td className="py-3.5 px-4">Blocked</td>
                <td className="py-3.5 px-4 text-red-700 font-bold">Borrowing Blocked (Admin override required)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Disputes & Transparency Section */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Scale className="w-4 h-4 text-emerald-700" />
          <span>Filing a Dispute & Staff Reviews</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          If you believe a return condition was marked inaccurately (for example, preexisting water damage or spine wear), or if an administrative timing error recorded your return as late, you have the right to file a dispute directly through your patron portal. College library staff review physical desk records and can adjust scores immediately.
        </p>
      </div>
    </div>
  );
}
