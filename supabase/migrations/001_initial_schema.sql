-- Kindred Schema for Supabase PostgreSQL
-- Production Schema for SIH 2026

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Identity Separation Mapping
CREATE TABLE IF NOT EXISTS user_identity_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID NOT NULL UNIQUE,
    wellbeing_id VARCHAR(32) NOT NULL UNIQUE, -- e.g., WELL-8F42
    email VARCHAR(255),
    mobile VARCHAR(32),
    role VARCHAR(32) NOT NULL DEFAULT 'STUDENT', -- STUDENT, COUNSELLOR, ADMIN
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Student Wellbeing Profile
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wellbeing_id VARCHAR(32) NOT NULL REFERENCES user_identity_mapping(wellbeing_id) ON DELETE CASCADE,
    preferred_name VARCHAR(128) NOT NULL,
    age_range VARCHAR(32),
    education_level VARCHAR(64),
    year_of_study VARCHAR(32),
    department VARCHAR(128),
    primary_goal VARCHAR(128),
    preferred_language VARCHAR(16) DEFAULT 'en', -- en, hi, mr
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Academic Context
CREATE TABLE IF NOT EXISTS academic_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wellbeing_id VARCHAR(32) NOT NULL REFERENCES user_identity_mapping(wellbeing_id) ON DELETE CASCADE,
    current_workload VARCHAR(32) NOT NULL, -- Low, Moderate, High, Very high
    upcoming_event VARCHAR(64) NOT NULL,   -- No major event, Exams, Assignments, Project deadline, Placement/interview, Other
    academic_pressure VARCHAR(32) NOT NULL, -- Manageable, A little stressful, Quite stressful, Very difficult
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Routine Profile (Optional)
CREATE TABLE IF NOT EXISTS routine_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wellbeing_id VARCHAR(32) NOT NULL REFERENCES user_identity_mapping(wellbeing_id) ON DELETE CASCADE,
    sleep_duration VARCHAR(32), -- <5, 5-6, 6-7, 7-8, 8+
    routine_structure VARCHAR(32), -- Mostly structured, Somewhat structured, Irregular
    study_pattern VARCHAR(32), -- Morning, Afternoon, Evening, Late night, Changes frequently
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Student Stressors
CREATE TABLE IF NOT EXISTS student_stressors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wellbeing_id VARCHAR(32) NOT NULL REFERENCES user_identity_mapping(wellbeing_id) ON DELETE CASCADE,
    stressor_tags TEXT[] NOT NULL DEFAULT '{}',
    social_connection VARCHAR(64),
    primary_turn_to VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Support Preferences
CREATE TABLE IF NOT EXISTS support_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wellbeing_id VARCHAR(32) NOT NULL REFERENCES user_identity_mapping(wellbeing_id) ON DELETE CASCADE,
    comfortable_support_types TEXT[] NOT NULL DEFAULT '{}',
    response_preference VARCHAR(64), -- Keep it simple, Give practical suggestions, Let me talk first, Show support options, A mix
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Granular Consents
CREATE TABLE IF NOT EXISTS student_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wellbeing_id VARCHAR(32) NOT NULL REFERENCES user_identity_mapping(wellbeing_id) ON DELETE CASCADE,
    consent_ai_personalization BOOLEAN NOT NULL DEFAULT TRUE,
    consent_checkins BOOLEAN NOT NULL DEFAULT TRUE,
    consent_academic_context BOOLEAN NOT NULL DEFAULT TRUE,
    consent_routine_data BOOLEAN NOT NULL DEFAULT TRUE,
    consent_counsellor_sharing BOOLEAN NOT NULL DEFAULT TRUE,
    consent_campus_analytics BOOLEAN NOT NULL DEFAULT TRUE,
    consent_ai_memory BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Wellbeing Check-ins
CREATE TABLE IF NOT EXISTS wellbeing_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wellbeing_id VARCHAR(32) NOT NULL REFERENCES user_identity_mapping(wellbeing_id) ON DELETE CASCADE,
    mood_tier VARCHAR(32) NOT NULL, -- good, okay, not_great, difficult
    mood_score INTEGER NOT NULL,    -- 4=good, 3=okay, 2=not_great, 1=difficult
    feeling_tags TEXT[] DEFAULT '{}',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Digital Twin Baselines & Metrics
CREATE TABLE IF NOT EXISTS twin_baselines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wellbeing_id VARCHAR(32) NOT NULL UNIQUE REFERENCES user_identity_mapping(wellbeing_id) ON DELETE CASCADE,
    baseline_mood_avg NUMERIC(3, 2) DEFAULT 3.0,
    checkin_count INTEGER NOT NULL DEFAULT 0,
    current_pattern_state VARCHAR(32) NOT NULL DEFAULT 'Cold Start', -- Cold Start, Stable, Changing, Improving, Needs Attention
    confidence_level VARCHAR(32) NOT NULL DEFAULT 'Initial', -- Initial, Moderate, Established
    last_shift_detected VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. AI Companion Messages & Memory
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wellbeing_id VARCHAR(32) NOT NULL REFERENCES user_identity_mapping(wellbeing_id) ON DELETE CASCADE,
    sender VARCHAR(16) NOT NULL, -- user, assistant, system
    message TEXT NOT NULL,
    safety_tier VARCHAR(16) NOT NULL DEFAULT 'GREEN', -- GREEN, YELLOW, RED
    suggested_action VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_memory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wellbeing_id VARCHAR(32) NOT NULL REFERENCES user_identity_mapping(wellbeing_id) ON DELETE CASCADE,
    memory_key VARCHAR(64) NOT NULL,
    memory_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Silent Counsellor Bridge & Support Requests
CREATE TABLE IF NOT EXISTS support_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wellbeing_id VARCHAR(32) NOT NULL REFERENCES user_identity_mapping(wellbeing_id) ON DELETE CASCADE,
    reason TEXT,
    priority VARCHAR(16) NOT NULL DEFAULT 'STANDARD', -- STANDARD, PRIORITY, URGENT
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',    -- PENDING, ACCEPTED, IN_SESSION, COMPLETED, CANCELLED
    assigned_counsellor_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS counsellor_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    support_request_id UUID NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
    sender_role VARCHAR(16) NOT NULL, -- student, counsellor
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Closed-Loop Follow-ups
CREATE TABLE IF NOT EXISTS support_followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    support_request_id UUID NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
    wellbeing_id VARCHAR(32) NOT NULL REFERENCES user_identity_mapping(wellbeing_id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, SKIPPED
    student_feedback_mood VARCHAR(32),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. What-if Simulation History
CREATE TABLE IF NOT EXISTS simulation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wellbeing_id VARCHAR(32) NOT NULL REFERENCES user_identity_mapping(wellbeing_id) ON DELETE CASCADE,
    scenario_title VARCHAR(128) NOT NULL,
    selected_pathway VARCHAR(128) NOT NULL,
    projected_implication TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Audit Logs (Immutable)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wellbeing_id VARCHAR(32),
    action VARCHAR(64) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkins_wellbeing ON wellbeing_checkins(wellbeing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_convo_wellbeing ON ai_conversations(wellbeing_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status, created_at DESC);
