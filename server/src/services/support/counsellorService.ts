import { db } from '../../db/databaseAdapter.js';

export class CounsellorService {
  public static getCounsellorQueue() {
    const requests = db.getSupportRequests();
    return requests.map(r => {
      const profile = db.getProfile(r.wellbeing_id);
      const academics = db.getAcademicContext(r.wellbeing_id);
      const twin = db.getTwinBaseline(r.wellbeing_id);
      const consents = db.getConsents(r.wellbeing_id);

      // Identity separation strictly enforced: Only pseudonymous ID & consented context
      return {
        requestId: r.id,
        pseudonymousId: `Anonymous Student ${r.wellbeing_id}`,
        wellbeingId: r.wellbeing_id,
        priority: r.priority,
        status: r.status,
        reason: r.reason || 'General wellbeing support requested',
        createdAt: r.created_at,
        contextSummary: {
          yearOfStudy: profile?.year_of_study || 'Unknown',
          department: profile?.department || 'Unspecified',
          currentWorkload: consents?.consent_academic_context ? academics?.current_workload : 'Restricted by student consent',
          academicPressure: consents?.consent_academic_context ? academics?.academic_pressure : 'Restricted by student consent',
          patternState: twin?.current_pattern_state || 'Cold Start'
        }
      };
    });
  }

  public static acceptRequest(requestId: string, counsellorId: string) {
    return db.updateSupportRequest(requestId, {
      status: 'IN_SESSION',
      assigned_counsellor_id: counsellorId
    });
  }

  public static completeSession(requestId: string, scheduledFollowupDays = 7) {
    const req = db.getSupportRequestById(requestId);
    if (req) {
      db.updateSupportRequest(requestId, { status: 'COMPLETED' });
      const followupDate = new Date(Date.now() + scheduledFollowupDays * 86400000).toISOString();
      db.createFollowup(requestId, req.wellbeing_id, followupDate, 'Routine 7-day wellbeing check-in post session');
      return { success: true, followupScheduled: followupDate };
    }
    return { success: false };
  }
}
