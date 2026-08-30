import { db } from '../../db/databaseAdapter.js';

export interface SimulationRequest {
  wellbeingId: string;
  scenarioTitle: string; // e.g. "Exams in 10 Days"
  timeHorizonDays: number;
  selectedPathway: 'A_UNCHANGED' | 'B_REDUCE_WORKLOAD' | 'C_COUNSELLOR_ACADEMIC' | 'D_PEER_STUDY_PLAN';
}

export interface SimulationResult {
  scenarioTitle: string;
  pathwayName: string;
  projectedImplications: {
    workloadPressure: 'High' | 'Moderate' | 'Low' | 'Balanced';
    recoveryTime: 'Limited' | 'Adequate' | 'High';
    stressMitigation: string;
    supportInvolvement: string;
  };
  narrativeSummary: string;
  disclaimer: string;
}

export class SupportSimulationEngine {
  public static runSimulation(req: SimulationRequest): SimulationResult {
    let pathwayName = 'Current Pace (Unchanged)';
    let workload: 'High' | 'Moderate' | 'Low' | 'Balanced' = 'High';
    let recovery: 'Limited' | 'Adequate' | 'High' = 'Limited';
    let stressMitigation = 'Minimal buffer for unexpected delays.';
    let support = 'Self-directed';
    let summary = 'Maintaining current workload may lead to sleep deficits as the deadline nears.';

    if (req.selectedPathway === 'B_REDUCE_WORKLOAD') {
      pathwayName = 'Selective Workload Reduction';
      workload = 'Moderate';
      recovery = 'Adequate';
      stressMitigation = 'De-prioritizes secondary tasks to protect evening sleep.';
      support = 'Self-management';
      summary = 'Focusing on core high-weight deliverables creates recovery windows and lowers cognitive fatigue.';
    } else if (req.selectedPathway === 'C_COUNSELLOR_ACADEMIC') {
      pathwayName = 'Counsellor + Academic Liaison';
      workload = 'Balanced';
      recovery = 'High';
      stressMitigation = 'Formal extension/assignment flexibility paired with guided coping.';
      support = 'Human Professional + Faculty';
      summary = 'Proactively involving campus support helps establish structured adjustments before peak crisis.';
    } else if (req.selectedPathway === 'D_PEER_STUDY_PLAN') {
      pathwayName = 'Peer Support & Structured Milestones';
      workload = 'Balanced';
      recovery = 'Adequate';
      stressMitigation = 'Shared accountability reduces isolation and last-minute cramming.';
      support = 'Peer Study Circle';
      summary = 'Collaborative study intervals break heavy material into manageable daily chunks.';
    }

    const narrative = `Choosing '${pathwayName}' creates a ${workload.toLowerCase()} workload intensity with ${recovery.toLowerCase()} recovery margins. ${stressMitigation}`;

    db.saveSimulation({
      wellbeing_id: req.wellbeingId,
      scenario_title: req.scenarioTitle,
      selected_pathway: pathwayName,
      projected_implication: narrative
    });

    return {
      scenarioTitle: req.scenarioTitle,
      pathwayName,
      projectedImplications: {
        workloadPressure: workload,
        recoveryTime: recovery,
        stressMitigation,
        supportInvolvement: support
      },
      narrativeSummary: narrative,
      disclaimer: 'This is a support-planning simulation, not a medical prediction.'
    };
  }
}
