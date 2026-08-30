import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../lib/apiClient';

export const AdminPortalView: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    ApiClient.getAdminMetrics().then(res => setMetrics(res));
  }, []);

  return (
    <div className="max-w-[900px] mx-auto px-4 py-6 flex flex-col gap-6 animate-fadeIn pb-24">
      <div className="flex flex-col gap-1">
        <h1 className="font-headline font-bold text-2xl text-on-background">Campus Wellbeing Administration</h1>
        <p className="text-xs text-on-surface-variant max-w-xl">
          System health, aggregate radar analytics, security audit logs, and crisis contact configuration.
        </p>
      </div>

      {metrics && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase font-bold">Total Students</span>
            <span className="text-xl font-bold text-primary mt-1">{metrics.radar?.overallTotalStudents || 16}</span>
          </div>
          <div className="p-4 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase font-bold">Support Requests</span>
            <span className="text-xl font-bold text-secondary mt-1">{metrics.totalSupportRequests || 0}</span>
          </div>
          <div className="p-4 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col">
            <span className="text-[10px] text-on-surface-variant uppercase font-bold">Security Audit Events</span>
            <span className="text-xl font-bold text-tertiary mt-1">{metrics.totalAuditLogs || 0}</span>
          </div>
        </div>
      )}

      {/* Security Audit Logs */}
      <div className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col gap-3">
        <h2 className="font-headline font-bold text-sm text-on-background">Immutable Security Audit Logs</h2>
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
          {metrics?.recentAuditLogs?.map((log: any) => (
            <div key={log.id} className="p-2.5 rounded-xl bg-surface-container-low text-xs flex justify-between items-center">
              <span className="font-mono text-primary font-semibold">{log.action}</span>
              <span className="text-[10px] text-on-surface-variant">{log.wellbeing_id || 'System'} • {log.created_at?.slice(0, 19)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
