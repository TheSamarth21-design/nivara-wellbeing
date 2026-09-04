import React, { useState } from 'react';
import { StudentStressAssessmentResponse, WellbeingSummarySharePayload } from '../../types/ai';
import { AiApiClient } from '../../services/aiApi';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  result: StudentStressAssessmentResponse;
  wellbeingId: string;
  studentReflection?: string;
  onRetake: () => void;
  onBackToDashboard: () => void;
  onOpenBreathing?: () => void;
}

export const AssessmentResultCard: React.FC<Props> = ({
  result,
  wellbeingId,
  studentReflection,
  onRetake,
  onBackToDashboard,
  onOpenBreathing
}) => {
  const { t } = useLanguage();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);
  const [includeReflection, setIncludeReflection] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareConfirmation, setShareConfirmation] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  const isCrisis = result.safety_status === 'crisis_escalated' || result.status === 'crisis_escalated';

  // 1. IMMEDIATE CRISIS ESCALATION PRIORITY
  if (isCrisis) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fadeIn">
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-error flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-error/15 text-error flex items-center justify-center text-3xl">
              <span className="material-symbols-outlined text-4xl">emergency</span>
            </div>
            <div>
              <span className="text-xs font-bold text-error uppercase tracking-wider">
                Immediate Safety Priority
              </span>
              <h2 className="font-headline font-bold text-xl sm:text-2xl text-on-background">
                Support is Available Right Now
              </h2>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-error-container/30 border border-error-container text-xs sm:text-sm text-on-error-container leading-relaxed">
            {result.recommendations?.[0] ||
              'A safety threshold was noted in your reflection. Experimental model scores are suppressed to prioritize your safety and immediate support.'}
          </div>

          {/* India-First Emergency Helplines */}
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-on-background">Tele-MANAS (Govt. of India)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">24/7 TOLL-FREE</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  National Tele-Mental Health Programme • Multi-lingual Support
                </p>
                <span className="text-sm font-mono font-bold text-primary mt-1 block">14416 / 1800-891-4416</span>
              </div>
              <a
                href="tel:14416"
                className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-md hover:bg-primary-container"
              >
                <span className="material-symbols-outlined text-base">call</span>
                <span>Call 14416</span>
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-on-background">National Emergency Services</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-error/20 text-error font-bold">IMMEDIATE POLICE / MEDICAL</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">Single emergency response across India</p>
                <span className="text-sm font-mono font-bold text-error mt-1 block">112</span>
              </div>
              <a
                href="tel:112"
                className="px-5 py-2.5 rounded-full bg-error text-on-error text-xs font-bold flex items-center justify-center gap-1.5 shadow-md hover:opacity-90"
              >
                <span className="material-symbols-outlined text-base">call</span>
                <span>Call 112</span>
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-on-background">Vandrevala Foundation</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold">CONFIDENTIAL</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">Free 24/7 crisis counselling in English, Hindi, Marathi</p>
                <span className="text-sm font-mono font-bold text-secondary mt-1 block">+91 9999 666 555</span>
              </div>
              <a
                href="tel:+919999666555"
                className="px-5 py-2.5 rounded-full bg-secondary text-on-secondary text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
              >
                <span className="material-symbols-outlined text-base">call</span>
                <span>Call Helpline</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {onOpenBreathing && (
              <button
                type="button"
                onClick={onOpenBreathing}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-surface-container border border-outline-variant text-xs font-semibold flex items-center justify-center gap-2 text-on-surface hover:bg-surface-variant"
              >
                <span className="material-symbols-outlined text-base text-primary">air</span>
                <span>Take a Guided Breath</span>
              </button>
            )}
            <button
              type="button"
              onClick={onBackToDashboard}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary-container"
            >
              Return to Safe Space
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. STANDARD / UNCERTAIN EXPERIMENTAL PATTERN DISPLAY
  const confidencePercent = Math.round((result.confidence || 0) * 100);
  const displayLabel = result.stress_prediction || result.stress_level || 'class_1';

  const handleShareSubmit = async () => {
    if (!consentGranted) return;
    setIsSharing(true);
    setShareError(null);

    const payload: WellbeingSummarySharePayload = {
      student_wellbeing_id: wellbeingId,
      assessment_timestamp: new Date().toISOString(),
      model_version: result.model_version,
      pattern_classification: displayLabel,
      tentative_severity: result.tentative_severity,
      confidence: result.confidence,
      uncertain: result.uncertain,
      confidence_tier: result.confidence_tier,
      safety_status: result.safety_status || 'safe',
      recommendations: result.recommendations,
      student_reflection: includeReflection ? studentReflection : undefined,
      consent_granted: true,
      consent_scopes: ['share_wellbeing_summary']
    };

    try {
      const res = await AiApiClient.shareSummaryWithCounselor(payload);
      setShareConfirmation({ id: res.confirmation_id, message: res.message });
    } catch (err: any) {
      setShareError(err?.message || 'Failed to authorize counselor sharing.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fadeIn flex flex-col gap-6">
      {/* Main Pattern Card */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-sm border border-surface-variant/50 flex flex-col gap-6">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-variant/30 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
              AI Wellbeing Analysis
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
              Experimental • Non-Diagnostic
            </span>
          </div>
          <span className="text-xs text-on-surface-variant font-mono">
            {result.model_version}
          </span>
        </div>

        {/* Uncertainty Alert Banner */}
        {result.uncertain && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-800 dark:text-amber-200">
            <span className="material-symbols-outlined text-xl text-amber-600 dark:text-amber-400 shrink-0">
              help_outline
            </span>
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-bold text-sm">Mixed Wellbeing Pattern Detected</span>
              <p className="leading-relaxed">
                Your responses show a mixed pattern, so the system cannot confidently classify this result ({confidencePercent}% confidence).
                This is natural when balance fluctuates across different areas of life.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-[10px] font-semibold">
                  No immediate retake required
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-[10px] font-semibold">
                  Discussion with counselor recommended
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Pattern Result Presentation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-on-surface-variant font-medium">
              Experimental Wellbeing Pattern
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="font-headline font-bold text-2xl text-on-background capitalize">
                {displayLabel.replace('_', ' ')}
              </h3>
              {result.tentative_severity && (
                <span className="text-xs text-on-surface-variant/80">
                  (Tentative indicator: {result.tentative_severity})
                </span>
              )}
            </div>
            <p className="text-[11px] text-on-surface-variant/70 mt-1 max-w-sm">
              Non-clinical classification derived from 19 self-reported wellbeing indicators.
            </p>
          </div>

          <div className="flex flex-col items-end sm:border-l sm:border-surface-variant/40 sm:pl-5">
            <span className="text-xs text-on-surface-variant">Calibrated Confidence</span>
            <span className="font-headline font-bold text-2xl text-primary mt-1">
              {confidencePercent}%
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-semibold capitalize mt-1">
              {result.confidence_tier || 'standard'} tier
            </span>
          </div>
        </div>

        {/* Non-Diagnostic Disclaimer */}
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-[11px] text-on-surface-variant/80 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-primary shrink-0">info</span>
          <span>
            {result.non_diagnostic_framing ||
              'This assessment is intended for wellbeing reflection and is not a medical or clinical diagnosis. It does not replace guidance from a qualified professional.'}
          </span>
        </div>

        {/* Model Transparency Box */}
        <div className="border-t border-surface-variant/30 pt-4 flex flex-col gap-2 text-xs text-on-surface-variant">
          <span className="font-bold text-on-background flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
            Model Governance & Transparency
          </span>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-on-surface-variant">
            <li className="flex items-center gap-1.5">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Feature set:</strong> 19 clean questionnaire indicators</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Leakage hardening:</strong> blood_pressure excluded for leakage hardening (legacy dataset feature, not collected by Nivara)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Status:</strong> {result.validation_status || 'experimental'}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Provenance:</strong> {result.provenance_status || 'partially_verified'}</span>
            </li>
          </ul>
        </div>

        {/* Practical Habit Recommendations */}
        {result.recommendations && result.recommendations.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <h4 className="font-headline font-bold text-sm text-on-background flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-primary">lightbulb</span>
              Non-Medical Habit Suggestions
            </h4>
            <div className="flex flex-col gap-2">
              {result.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface flex items-start gap-2.5"
                >
                  <span className="text-primary font-bold text-xs mt-0.5">•</span>
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-surface-variant/30">
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">share</span>
            <span>Share Summary with Counselor</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onRetake}
              className="px-4 py-2 rounded-full border border-outline-variant text-xs text-on-surface hover:bg-surface-container"
            >
              Review Responses
            </button>
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Counselor Bridge Share Modal with Explicit Consent */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-surface-variant flex flex-col gap-5 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">contact_support</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-on-background">
                    Share Wellbeing Summary
                  </h3>
                  <p className="text-[11px] text-on-surface-variant">
                    Nivara Counselor Bridge • Privacy-Preserving
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="text-xs text-on-surface-variant hover:text-on-surface p-1"
              >
                ✕
              </button>
            </div>

            {shareConfirmation ? (
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>Consent Granted & Summary Shared</span>
                </div>
                <p className="text-xs text-on-surface">{shareConfirmation.message}</p>
                <div className="p-2.5 rounded-lg bg-surface-container text-[11px] font-mono text-on-surface-variant flex items-center justify-between">
                  <span>Confirmation ID:</span>
                  <span className="font-bold text-primary">{shareConfirmation.id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsShareModalOpen(false);
                    setShareConfirmation(null);
                  }}
                  className="mt-2 w-full py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Nivara does not replace human professionals. Sharing your wellbeing summary allows your assigned campus counselor to review non-clinical trends and provide guided support.
                </p>

                {/* Preview what will be shared */}
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2 text-xs">
                  <span className="font-bold text-on-background text-[11px] uppercase tracking-wider">
                    What will be shared:
                  </span>
                  <div className="flex flex-col gap-1 text-on-surface-variant text-[11px]">
                    <div>• <strong>Student ID:</strong> {wellbeingId}</div>
                    <div>• <strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                    <div>• <strong>Pattern:</strong> {displayLabel} ({confidencePercent}% confidence)</div>
                    <div>• <strong>Model Version:</strong> {result.model_version}</div>
                    <div>• <strong>Habit Suggestions:</strong> {result.recommendations?.length || 0} items</div>
                    <div className="text-primary font-medium mt-1">
                      ℹ Raw questionnaire scores will NOT be shared.
                    </div>
                  </div>
                </div>

                {/* Optional reflection toggle */}
                {studentReflection && (
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-on-surface">
                    <input
                      type="checkbox"
                      checked={includeReflection}
                      onChange={(e) => setIncludeReflection(e.target.checked)}
                      className="mt-0.5 rounded text-primary focus:ring-primary"
                    />
                    <span>Also include my written personal reflection in the counselor summary.</span>
                  </label>
                )}

                {/* Explicit Consent Checkbox */}
                <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/40 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="consentCheck"
                    checked={consentGranted}
                    onChange={(e) => setConsentGranted(e.target.checked)}
                    className="mt-0.5 rounded text-secondary focus:ring-secondary"
                  />
                  <label htmlFor="consentCheck" className="text-xs text-on-surface leading-relaxed cursor-pointer">
                    <strong>Explicit Consent:</strong> I authorize Nivara to share this non-clinical wellbeing summary with authorized campus wellbeing counselors. I understand this is not a medical diagnosis.
                  </label>
                </div>

                {shareError && (
                  <div className="text-xs text-error p-2 bg-error/10 rounded-lg">
                    {shareError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(false)}
                    className="px-4 py-2 rounded-full border border-outline-variant text-xs text-on-surface-variant hover:bg-surface-variant"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleShareSubmit}
                    disabled={!consentGranted || isSharing}
                    className="px-5 py-2 rounded-full bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSharing && <span className="material-symbols-outlined text-xs animate-spin">refresh</span>}
                    <span>Authorize & Share</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
