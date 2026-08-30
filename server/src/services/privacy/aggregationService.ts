import { db } from '../../db/databaseAdapter.js';
import { config } from '../../config/index.js';

export interface DepartmentRadarMetric {
  department: string;
  studentCount: number;
  isCohortProtected: boolean;
  privacyNotice?: string;
  averageMoodIndex?: number;
  topReportedStressors?: string[];
  workloadDistribution?: {
    high: number;
    moderate: number;
    low: number;
  };
  recommendedCampusAction?: string;
}

export class AggregationService {
  public static getCampusRadar(): {
    overallTotalStudents: number;
    departments: DepartmentRadarMetric[];
    activeCampusInitiatives: string[];
  } {
    const profiles = db.getAllProfilesForRadar();
    const checkins = db.getAllCheckinsForRadar();
    const academics = db.getAllAcademicsForRadar();

    const deptMap: { [dept: string]: string[] } = {};

    profiles.forEach(p => {
      const d = p.department || 'General Campus';
      if (!deptMap[d]) deptMap[d] = [];
      deptMap[d].push(p.wellbeing_id);
    });

    const result: DepartmentRadarMetric[] = [];

    for (const [dept, ids] of Object.entries(deptMap)) {
      const count = ids.length;

      // STRICT PRIVACY THRESHOLD ENFORCEMENT
      if (count < config.privacy.cohortMinThreshold) {
        result.push({
          department: dept,
          studentCount: count,
          isCohortProtected: true,
          privacyNotice: 'Not enough data to protect student privacy (Cohort threshold N >= 5).'
        });
        continue;
      }

      // Aggregate anonymized calculations
      const deptCheckins = checkins.filter(c => ids.includes(c.wellbeing_id));
      const avgScore = deptCheckins.length > 0
        ? parseFloat((deptCheckins.reduce((s, c) => s + c.mood_score, 0) / deptCheckins.length).toFixed(2))
        : 3.0;

      const deptAcademics = academics.filter(a => ids.includes(a.wellbeing_id));
      const highCount = deptAcademics.filter(a => a.current_workload === 'High' || a.current_workload === 'Very high').length;
      const modCount = deptAcademics.filter(a => a.current_workload === 'Moderate').length;
      const lowCount = deptAcademics.filter(a => a.current_workload === 'Low').length;

      result.push({
        department: dept,
        studentCount: count,
        isCohortProtected: false,
        averageMoodIndex: avgScore,
        topReportedStressors: ['Exam Timetable', 'Project Milestones', 'Sleep Disruption'],
        workloadDistribution: {
          high: highCount,
          moderate: modCount,
          low: lowCount
        },
        recommendedCampusAction: avgScore < 2.8 ? 'Deploy campus study lounge relaxation hours & exam stress workshops' : 'Routine academic counseling availability'
      });
    }

    return {
      overallTotalStudents: profiles.length,
      departments: result,
      activeCampusInitiatives: [
        '24/7 Library Quiet Zone & Wellness Corner launched',
        'Peer-Led Academic Revision Groups active across hostel blocks',
        'Tele-MANAS Toll-Free helpline posters stationed at all student centers'
      ]
    };
  }
}
