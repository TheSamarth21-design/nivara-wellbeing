# Nivara — Digital Twin for Student Wellbeing & Anonymous Campus Radar

> **SIH 2026 Production-Quality Prototype**

Nivara is an AI-assisted, privacy-preserving student wellbeing platform that models personal wellbeing patterns over time, provides non-clinical support pathways, connects students discreetly with human counsellors, and provides institutions with anonymous campus-level wellbeing radar analytics.

---

## 🌟 Core Differentiators

1. **Digital Wellbeing Twin**: Longitudinal pattern modelling comparing a student against their own baseline (not an arbitrary universal "normal").
2. **What-If Support Simulator**: Scenario planner illustrating qualitative workload and recovery outcomes.
3. **Silent Counsellor Bridge**: Pseudonymous support requests (`Anonymous Student WELL-8F42`) with consented context.
4. **Anonymous Campus Radar**: Departmental heatmaps with strict $N \ge 5$ privacy cohort masking.
5. **3-Tier Safety Engine**: Layered Green/Yellow/Red risk classifier with Tele-MANAS (14416) emergency integration.
6. **Closed-Loop Follow-Up**: 7-day post-session check-in measuring support pathway efficacy.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
npm --prefix client install
```

### 2. Run the Development Server
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`

### 3. Run Automated Verification Tests
```bash
npm test
```
