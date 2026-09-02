import React, { useState } from 'react';
import { ApiClient } from '../../lib/apiClient';

export const WhatIfSimulatorView: React.FC = () => {
  const [scenario, setScenario] = useState('Upcoming Mid-Term Assessments (in 10 days)');
  const [pathway, setPathway] = useState<'A_UNCHANGED' | 'B_REDUCE_WORKLOAD' | 'C_COUNSELLOR_ACADEMIC' | 'D_PEER_STUDY_PLAN'>('B_REDUCE_WORKLOAD');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.runSimulator(scenario, pathway);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6 flex flex-col gap-6 animate-fadeIn pb-24">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-headline font-bold text-2xl text-on-background">What-If Support Simulator 🌿</h1>
        <p className="text-xs text-on-surface-variant max-w-xl">
          Simulate different support pathways and study schedules. Provides qualitative planning guidance, not medical predictions.
        </p>
      </div>

      {/* Scenario Configuration Box */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-surface-variant/60 flex flex-col gap-5">
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-2">Select Upcoming Scenario</label>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-background"
          >
            <option>Upcoming Mid-Term Assessments (in 10 days)</option>
            <option>Major Project Deliverable & Assignment Crunch</option>
            <option>Placement Interview Week with Back-to-Back Schedules</option>
            <option>Post-Illness Academic Backlog Catchup</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-2">Choose Support Pathway</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'A_UNCHANGED', name: 'Option A: Current Pace', desc: 'Keep study workload unchanged without extra buffers' },
              { id: 'B_REDUCE_WORKLOAD', name: 'Option B: Workload Reduction', desc: 'De-prioritize non-essential tasks to protect 7-hour sleep' },
              { id: 'C_COUNSELLOR_ACADEMIC', name: 'Option C: Counsellor + Academic Liaison', desc: 'Request academic extension + guided coping sessions' },
              { id: 'D_PEER_STUDY_PLAN', name: 'Option D: Peer Study Circle', desc: 'Form structured group milestones with daily check-ins' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPathway(opt.id as any)}
                className={`p-4 rounded-2xl text-left border transition-all ${
                  pathway === opt.id
                    ? 'bg-primary-fixed/30 border-primary font-bold shadow-sm'
                    : 'bg-surface-container-low border-outline-variant/40 hover:bg-surface-container'
                }`}
              >
                <span className="text-xs font-bold text-on-background block">{opt.name}</span>
                <span className="text-[11px] text-on-surface-variant mt-1 block font-normal">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading}
          className="w-full py-3.5 rounded-full bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container transition-colors shadow-md disabled:opacity-50"
        >
          {loading ? 'Running Qualitative Projection...' : 'Simulate Pathway Outcomes'}
        </button>
      </div>

      {/* Projection Results */}
      {result && (
        <div className="p-6 rounded-3xl bg-surface-container-lowest border border-primary-fixed/80 shadow-md flex flex-col gap-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-surface-variant/40 pb-3">
            <span className="font-headline font-bold text-base text-on-background">
              Simulated Pathway: {result.pathwayName || 'Workload Adjustment'}
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold uppercase">
              Projected
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col">
              <span className="text-[10px] text-on-surface-variant">Workload Pressure</span>
              <span className="text-sm font-bold text-primary mt-1">{result.projectedImplications?.workloadPressure || 'Moderate'}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col">
              <span className="text-[10px] text-on-surface-variant">Recovery Margins</span>
              <span className="text-sm font-bold text-secondary mt-1">{result.projectedImplications?.recoveryTime || 'Adequate'}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col">
              <span className="text-[10px] text-on-surface-variant">Support Channel</span>
              <span className="text-xs font-bold text-on-surface mt-1">{result.projectedImplications?.supportInvolvement || 'Self-management'}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col">
              <span className="text-[10px] text-on-surface-variant">Mitigation</span>
              <span className="text-xs font-medium text-on-surface mt-1">{result.projectedImplications?.stressMitigation || 'Creates buffer for rest'}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-primary-fixed/20 border border-primary-fixed text-xs text-primary leading-relaxed">
            {result.narrativeSummary || 'Pathway creates manageable workload intervals with protected rest buffers.'}
          </div>

          <span className="text-[10px] text-on-surface-variant italic text-center">
            {result.disclaimer || 'This is a support-planning simulation, not a clinical diagnostic prediction.'}
          </span>
        </div>
      )}
    </div>
  );
};
