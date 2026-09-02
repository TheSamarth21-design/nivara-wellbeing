import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../lib/apiClient';

interface Props {
  onLoggedOut: () => void;
}

export const PrivacyCenterView: React.FC<Props> = ({ onLoggedOut }) => {
  const [consents, setConsents] = useState<any>({
    consent_ai_personalization: true,
    consent_checkins: true,
    consent_academic_context: true,
    consent_routine_data: true,
    consent_counsellor_sharing: true,
    consent_campus_analytics: true,
    consent_ai_memory: true
  });

  const [researchConsent, setResearchConsent] = useState<{
    contributeToImprovement: boolean;
    allowDeidentifiedFeedback: boolean;
    allowDeidentifiedUsageAnalytics: boolean;
    allowPrivateChatForTraining: false;
  }>({
    contributeToImprovement: false,
    allowDeidentifiedFeedback: false,
    allowDeidentifiedUsageAnalytics: false,
    allowPrivateChatForTraining: false
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    ApiClient.getConsents().then((res) => {
      if (res.consents) setConsents(res.consents);
    });

    ApiClient.getResearchConsent().then((c) => {
      if (c) setResearchConsent(c);
    });
  }, []);

  const handleToggle = async (key: string) => {
    const updated = { ...consents, [key]: !consents[key] };
    setConsents(updated);
    await ApiClient.updateConsents(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResearchToggle = async (key: 'contributeToImprovement' | 'allowDeidentifiedFeedback' | 'allowDeidentifiedUsageAnalytics') => {
    const updated = {
      ...researchConsent,
      [key]: !researchConsent[key],
      allowPrivateChatForTraining: false as const
    };
    setResearchConsent(updated);
    await ApiClient.updateResearchConsent(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    window.open('/api/privacy/export', '_blank');
  };

  const handlePurge = async () => {
    if (confirm('Are you sure you want to completely purge your wellbeing data? This will permanently wipe your profile, check-ins, twin baseline, and memories.')) {
      await ApiClient.purgeData();
      alert('Your data has been wiped completely.');
      onLoggedOut();
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 py-6 flex flex-col gap-6 animate-fadeIn pb-24">
      <div className="flex flex-col gap-1">
        <h1 className="font-headline font-bold text-2xl text-on-background">Privacy & Consent Center 🛡️</h1>
        <p className="text-xs text-on-surface-variant max-w-xl">
          You are in full control. Toggle what information is shared, view what AI remembers, export your data, or wipe it at any time.
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded-2xl bg-primary-fixed text-on-primary-fixed text-xs font-semibold text-center animate-fadeIn">
          ✓ Consent settings updated and enforced on backend.
        </div>
      )}

      {/* Granular Consent Controls */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/60 flex flex-col gap-4">
        <h2 className="font-headline font-bold text-sm text-on-background">Granular Data Sharing Consents</h2>

        {[
          { key: 'consent_ai_personalization', title: 'AI Personalization', desc: 'Allows AI companion to adapt empathetic tone to your preferences.' },
          { key: 'consent_academic_context', title: 'Academic Context Correlation', desc: 'Allows your Twin to model stress against upcoming exams & workload.' },
          { key: 'consent_routine_data', title: 'Routine & Sleep Information', desc: 'Includes sleep patterns in restorative micro-nudge generation.' },
          { key: 'consent_counsellor_sharing', title: 'Silent Counsellor Summary', desc: 'Shares consented context summary when requesting support.' },
          { key: 'consent_campus_analytics', title: 'Anonymous Campus Radar', desc: 'Aggregates anonymized data into minimum N ≥ 5 cohort statistics.' },
          { key: 'consent_ai_memory', title: 'Controlled AI Memory', desc: 'Permits remembering approved coping strategies and goals.' }
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
            <div className="flex flex-col pr-4">
              <span className="text-xs font-bold text-on-background">{item.title}</span>
              <span className="text-[11px] text-on-surface-variant leading-tight mt-0.5">{item.desc}</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle(item.key)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 shrink-0 ${
                consents[item.key] ? 'bg-primary' : 'bg-surface-variant'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  consents[item.key] ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Parts 9 & 10: Help Improve Nivara (Research & Model Quality Consent) */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/60 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="font-headline font-bold text-sm text-on-background flex items-center gap-2">
              <span>Help Improve Nivara (Research & System Quality)</span>
              <span className="text-[10px] bg-secondary/15 text-secondary px-2 py-0.5 rounded-full font-semibold">
                Opt-in Only
              </span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Choose whether to share de-identified feedback to help our researchers evaluate system quality.
            </p>
          </div>
        </div>

        {/* Training Guarantee Alert */}
        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/25 flex items-center gap-3">
          <span className="text-lg">🔒</span>
          <span className="text-[11px] text-on-surface leading-tight font-medium">
            <strong>Private Chat Guarantee:</strong> Student private conversation content is strictly confidential and <strong>never</strong> automatically used for training AI models.
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
            <div className="flex flex-col pr-4">
              <span className="text-xs font-bold text-on-background">Contribute to Wellbeing Research</span>
              <span className="text-[11px] text-on-surface-variant leading-tight mt-0.5">
                Permits researchers to include anonymized evaluation benchmarks in model quality testing.
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleResearchToggle('contributeToImprovement')}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 shrink-0 ${
                researchConsent.contributeToImprovement ? 'bg-primary' : 'bg-surface-variant'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  researchConsent.contributeToImprovement ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
            <div className="flex flex-col pr-4">
              <span className="text-xs font-bold text-on-background">De-identified Response Feedback</span>
              <span className="text-[11px] text-on-surface-variant leading-tight mt-0.5">
                Shares 👍 / 👎 ratings and tags without your identity or chat history to fix unhelpful replies.
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleResearchToggle('allowDeidentifiedFeedback')}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 shrink-0 ${
                researchConsent.allowDeidentifiedFeedback ? 'bg-primary' : 'bg-surface-variant'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  researchConsent.allowDeidentifiedFeedback ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Data Export & Wipe Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col justify-between gap-3">
          <div>
            <h3 className="font-headline font-bold text-sm text-on-background">Export My Data</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Download all your check-ins, profile data, and simulation history in structured JSON format.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="py-3 rounded-full bg-surface-container text-xs font-bold text-primary hover:bg-surface-variant transition-colors"
          >
            Download Data (JSON)
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-error-container/20 border border-error-container shadow-sm flex flex-col justify-between gap-3">
          <div>
            <h3 className="font-headline font-bold text-sm text-error">Delete My Data</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Permanently wipe all records, identity mappings, check-ins, and twin history.
            </p>
          </div>
          <button
            onClick={handlePurge}
            className="py-3 rounded-full bg-error text-on-error text-xs font-bold hover:bg-error-container transition-colors"
          >
            Purge All Data
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={onLoggedOut}
        className="w-full py-3.5 rounded-full bg-surface-container font-semibold text-xs text-on-surface hover:bg-surface-variant transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
};
