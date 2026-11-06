import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Database,
  Trash2,
  BookOpen
} from 'lucide-react';
import { 
  getScoringSettings, 
  updateScoringSettings, 
  resetScoringSettings 
} from '../../services/settingsService';
import { DEFAULT_SCORING_SETTINGS } from '../../firebase/dbAdapter';
import { seedBooksAndSettings, clearMockUserData } from '../../services/seedService';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SCORING_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const s = await getScoringSettings();
      setSettings(s);
    } catch (e) {
      toast.error('Failed to load scoring settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateScoringSettings(settings);
      toast.success('Scoring rules and tier configurations updated successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setConfirmConfig({
      title: 'Reset Scoring Rules to Institutional Defaults',
      message: 'Are you sure you want to reset ALL credit scoring rules, tier thresholds, and loan duration limits to FCAHPT Vom defaults? Any custom scoring tweaks will be overwritten.',
      confirmText: 'Reset Defaults',
      type: 'warning',
      action: async () => {
        try {
          await resetScoringSettings();
          setSettings(DEFAULT_SCORING_SETTINGS);
          toast.success('Scoring rules reset to institutional defaults');
        } catch (err) {
          toast.error('Failed to reset settings');
        }
      }
    });
  }

  function handleSyncBooks() {
    setConfirmConfig({
      title: 'Sync 87 College Textbooks & Scoring Settings',
      message: 'This will verify and sync all 87 accredited multidisciplinary textbooks across the 14 FCAHPT Vom departments into Firestore. Existing book records will be refreshed.',
      confirmText: 'Sync Textbooks',
      type: 'primary',
      action: async () => {
        setSyncing(true);
        try {
          const result = await seedBooksAndSettings();
          toast.success(`Successfully populated ${result.booksCount} books and institutional scoring settings!`, { duration: 5000 });
          setTimeout(() => window.location.reload(), 1200);
        } catch (err) {
          toast.error('Failed to sync books: ' + err.message);
        } finally {
          setSyncing(false);
        }
      }
    });
  }

  function handlePurgeMockData() {
    setConfirmConfig({
      title: 'Purge Mock Patron & Loan Records',
      message: 'This will purge all mock demo patron profiles, mock loans, and test defaults from local cache so that only genuine registered student and librarian records are shown. Proceed?',
      confirmText: 'Purge Mock Records',
      type: 'danger',
      action: () => {
        clearMockUserData();
        toast.success('All mock users and test loans purged! Only real registered accounts will appear.');
        setTimeout(() => window.location.reload(), 1200);
      }
    });
  }

  function updateField(field, value) {
    setSettings(prev => ({ ...prev, [field]: Number(value) }));
  }

  function updateTier(tierKey, field, value) {
    setSettings(prev => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        [tierKey]: {
          ...prev.tiers[tierKey],
          [field]: field === 'label' || field === 'description' || field === 'color' ? value : Number(value)
        }
      }
    }));
  }

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 m-0">LibCredit Scoring Engine Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure credit score point values, classification thresholds, and borrowing tier entitlements
          </p>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 self-start transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Defaults</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Score Points Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 m-0">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            Score Point Values
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Initial Score (New Patron)
              </label>
              <input
                type="number" min={0} max={100}
                value={settings.initialScore}
                onChange={e => updateField('initialScore', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                On-Time Return Bonus (+)
              </label>
              <input
                type="number" min={0} max={50}
                value={settings.onTimeBonus}
                onChange={e => updateField('onTimeBonus', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 font-mono bg-emerald-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                Early Return Bonus (+)
              </label>
              <input
                type="number" min={0} max={50}
                value={settings.earlyBonus}
                onChange={e => updateField('earlyBonus', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 font-mono bg-emerald-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                Good Condition Bonus (+)
              </label>
              <input
                type="number" min={0} max={50}
                value={settings.goodConditionBonus}
                onChange={e => updateField('goodConditionBonus', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 font-mono bg-emerald-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-red-700 mb-1">
                Late Return Penalty (−)
              </label>
              <input
                type="number" min={0} max={50}
                value={settings.latePenalty}
                onChange={e => updateField('latePenalty', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-red-300 font-mono bg-red-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-red-700 mb-1">
                Damaged Book Penalty (−)
              </label>
              <input
                type="number" min={0} max={50}
                value={settings.damagedConditionPenalty}
                onChange={e => updateField('damagedConditionPenalty', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-red-300 font-mono bg-red-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-red-700 mb-1">
                Lost Book Penalty (−)
              </label>
              <input
                type="number" min={0} max={50}
                value={settings.lostConditionPenalty}
                onChange={e => updateField('lostConditionPenalty', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-red-300 font-mono bg-red-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-orange-700 mb-1">
                Repeated Default Extra Penalty (−)
              </label>
              <input
                type="number" min={0} max={50}
                value={settings.repeatedDefaultPenalty}
                onChange={e => updateField('repeatedDefaultPenalty', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-orange-300 font-mono bg-orange-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-orange-700 mb-1">
                Repeated Default Threshold (≥)
              </label>
              <input
                type="number" min={1} max={20}
                value={settings.repeatedDefaultThreshold}
                onChange={e => updateField('repeatedDefaultThreshold', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-orange-300 font-mono bg-orange-50/50"
              />
              <p className="text-3xs text-slate-400 mt-1">
                Apply repeated-default penalty when patron has this many or more prior defaults.
              </p>
            </div>
          </div>
        </div>

        {/* Tier Threshold & Entitlements Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 m-0">
            <Settings className="w-4 h-4 text-emerald-700" />
            Tier Classification Thresholds & Borrowing Limits
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500 text-2xs">
                <tr>
                  <th className="py-2 px-3 text-left">Tier</th>
                  <th className="py-2 px-3 text-center">Min Score</th>
                  <th className="py-2 px-3 text-center">Max Books</th>
                  <th className="py-2 px-3 text-center">Loan Period (Days)</th>
                  <th className="py-2 px-3 text-left">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {['excellent', 'good', 'fair', 'poor', 'veryPoor'].map(tierKey => {
                  const tier = settings.tiers[tierKey];
                  const colors = {
                    excellent: 'border-emerald-200 bg-emerald-50/30',
                    good: 'border-blue-200 bg-blue-50/30',
                    fair: 'border-amber-200 bg-amber-50/30',
                    poor: 'border-orange-200 bg-orange-50/30',
                    veryPoor: 'border-red-200 bg-red-50/30'
                  };

                  return (
                    <tr key={tierKey} className={colors[tierKey]}>
                      <td className="py-2.5 px-3 font-bold text-slate-900 capitalize">
                        {tier.label || tierKey}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number" min={0} max={100}
                          value={tier.minScore}
                          onChange={e => updateTier(tierKey, 'minScore', e.target.value)}
                          className="w-16 px-2 py-1 text-center rounded-lg border border-slate-300 font-mono text-xs"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number" min={0} max={20}
                          value={tier.maxBooks}
                          onChange={e => updateTier(tierKey, 'maxBooks', e.target.value)}
                          className="w-16 px-2 py-1 text-center rounded-lg border border-slate-300 font-mono text-xs"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number" min={0} max={90}
                          value={tier.loanDays}
                          onChange={e => updateTier(tierKey, 'loanDays', e.target.value)}
                          className="w-16 px-2 py-1 text-center rounded-lg border border-slate-300 font-mono text-xs"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={tier.description || ''}
                          onChange={e => updateTier(tierKey, 'description', e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 shadow-md flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Scoring Rule Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Database Sync & Maintenance Utility */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-300 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900 m-0">Library Database Sync & Clean Management</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Manage your live database state. Populate the 87 accredited multidisciplinary textbooks across all 14 college departments or purge test mock records so that only real, registered students and staff are active.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleSyncBooks}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 shadow-2xs disabled:opacity-50 transition-colors"
          >
            {syncing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <BookOpen className="w-4 h-4" />
                <span>Sync 87 College Textbooks & Settings</span>
              </>
            )}
          </button>

          <button
            onClick={handlePurgeMockData}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-white border border-red-300 text-red-700 hover:bg-red-50 shadow-2xs transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Purge Mock Patron & Loan Records</span>
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmConfig)}
        onClose={() => setConfirmConfig(null)}
        onConfirm={async () => {
          if (confirmConfig?.action) {
            const action = confirmConfig.action;
            setConfirmConfig(null);
            await action();
          }
        }}
        title={confirmConfig?.title || 'Confirm Action'}
        message={confirmConfig?.message || ''}
        confirmText={confirmConfig?.confirmText || 'Confirm'}
        type={confirmConfig?.type || 'primary'}
      />
    </div>
  );
}
