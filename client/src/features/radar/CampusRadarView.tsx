import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../lib/apiClient';

export const CampusRadarView: React.FC = () => {
  const [radar, setRadar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.getCampusRadar()
      .then((res) => setRadar(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="max-w-[900px] mx-auto p-8 text-center text-xs text-on-surface-variant">Loading Campus Radar...</div>;
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6 flex flex-col gap-6 animate-fadeIn pb-24">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-headline font-bold text-2xl text-on-background">Anonymous Campus Wellbeing Radar</h1>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold">
            Cohort Shield Active
          </span>
        </div>
        <p className="text-xs text-on-surface-variant max-w-xl">
          Aggregated departmental insights for institutional support planning. Individual student identities are never exposed (N ≥ 5 cohort threshold).
        </p>
      </div>

      {/* Campus Active Initiatives */}
      <div className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col gap-3">
        <h2 className="font-headline font-bold text-sm text-on-background flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">campaign</span>
          <span>Active Institutional Wellbeing Initiatives</span>
        </h2>
        <div className="flex flex-col gap-2">
          {(radar?.activeCampusInitiatives && radar.activeCampusInitiatives.length > 0 ? radar.activeCampusInitiatives : [
            '24/7 Library Quiet Zone & Wellness Corner active across campus',
            'Peer-Led Academic Revision Groups active across hostel blocks',
            'Tele-MANAS Toll-Free helpline posters stationed at student centers'
          ]).map((init: string, idx: number) => (
            <div key={idx} className="p-3 rounded-2xl bg-surface-container-low text-xs text-on-surface flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span>{init}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Department Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(radar?.departments || []).map((dept: any, idx: number) => (
          <div key={idx} className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col justify-between gap-4">
            <div>
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-headline font-bold text-sm text-on-background">{dept.department}</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface">
                  {dept.studentCount} Students
                </span>
              </div>

              {dept.isCohortProtected ? (
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 my-2 text-xs text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-primary">lock</span>
                  <span>{dept.privacyNotice}</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant">Average Wellbeing Index</span>
                    <span className="text-sm font-bold text-primary">{dept.averageMoodIndex} / 4.0</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-on-surface-variant font-medium">Workload Distribution</span>
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-surface-container">
                      <div style={{ width: '45%' }} className="bg-error-container" title="High Workload" />
                      <div style={{ width: '35%' }} className="bg-secondary-container" title="Moderate Workload" />
                      <div style={{ width: '20%' }} className="bg-primary-fixed" title="Low Workload" />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-primary-fixed/20 border border-primary-fixed text-[11px] text-primary font-medium">
                    🏛️ Action: {dept.recommendedCampusAction}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
