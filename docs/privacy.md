# Nivara Privacy & Identity Separation Architecture

## 1. Identity Separation
Nivara strictly bifurcates student identities:
- **Authentication Identity**: `auth_user_id`, email, mobile (+91).
- **Wellbeing Identity**: `wellbeing_id` (e.g. `WELL-8F42`).

Counsellors, faculty, and campus administrators never receive or view personal contact details.

## 2. Campus Radar Privacy Threshold
- Enforces strict $N \ge 5$ minimum cohort threshold.
- Sub-cohorts under 5 students are masked with: *"Not enough data to protect student privacy."*
