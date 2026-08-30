-- Fictional Demonstration Seed Data for SIH 2026 Kindred Evaluation

-- 1. Demo Student 1: Established Twin
INSERT INTO user_identity_mapping (auth_user_id, wellbeing_id, email, mobile, role, onboarding_completed)
VALUES 
('11111111-1111-1111-1111-111111111111', 'WELL-8F42', 'student.demo@college.edu', '+919876543210', 'STUDENT', TRUE)
ON CONFLICT (wellbeing_id) DO NOTHING;

INSERT INTO student_profiles (wellbeing_id, preferred_name, age_range, education_level, year_of_study, department, primary_goal, preferred_language)
VALUES 
('WELL-8F42', 'Aarav', '20-22', 'Undergraduate', '3rd Year', 'Computer Science & Engineering', 'Handle academic stress', 'en')
ON CONFLICT DO NOTHING;

INSERT INTO academic_context (wellbeing_id, current_workload, upcoming_event, academic_pressure)
VALUES 
('WELL-8F42', 'High', 'Exams', 'Quite stressful')
ON CONFLICT DO NOTHING;

INSERT INTO student_stressors (wellbeing_id, stressor_tags, social_connection, primary_turn_to)
VALUES 
('WELL-8F42', ARRAY['Academic pressure', 'Exams', 'Sleep/routine'], 'Mostly connected', 'Friend')
ON CONFLICT DO NOTHING;

INSERT INTO support_preferences (wellbeing_id, comfortable_support_types, response_preference)
VALUES 
('WELL-8F42', ARRAY['Someone listening', 'Quick calming exercises', 'Study/academic planning'], 'Give practical suggestions')
ON CONFLICT DO NOTHING;

INSERT INTO student_consents (wellbeing_id)
VALUES ('WELL-8F42')
ON CONFLICT DO NOTHING;

INSERT INTO twin_baselines (wellbeing_id, baseline_mood_avg, checkin_count, current_pattern_state, confidence_level, last_shift_detected)
VALUES 
('WELL-8F42', 3.10, 14, 'Changing', 'Established', 'Workload elevation preceding mid-term examinations')
ON CONFLICT (wellbeing_id) DO NOTHING;

-- Seed Check-ins over past 7 days
INSERT INTO wellbeing_checkins (wellbeing_id, mood_tier, mood_score, feeling_tags, note, created_at)
VALUES 
('WELL-8F42', 'good', 4, ARRAY['Focused', 'Calm'], 'Productive morning in lab', NOW() - INTERVAL '6 days'),
('WELL-8F42', 'good', 4, ARRAY['Energized'], 'Met project team', NOW() - INTERVAL '5 days'),
('WELL-8F42', 'okay', 3, ARRAY['Tired'], 'Late night assignment submission', NOW() - INTERVAL '4 days'),
('WELL-8F42', 'okay', 3, ARRAY['Overwhelmed'], 'Exam syllabus released', NOW() - INTERVAL '3 days'),
('WELL-8F42', 'not_great', 2, ARRAY['Anxious', 'Tired'], 'Slept under 5 hours', NOW() - INTERVAL '2 days'),
('WELL-8F42', 'not_great', 2, ARRAY['Stressed'], 'Exam pressure mounting', NOW() - INTERVAL '1 days'),
('WELL-8F42', 'okay', 3, ARRAY['Grounded'], 'Did 2-minute breathing reset', NOW() - INTERVAL '2 hours');

-- Demo Counsellor Account
INSERT INTO user_identity_mapping (auth_user_id, wellbeing_id, email, mobile, role, onboarding_completed)
VALUES 
('22222222-2222-2222-2222-222222222222', 'COUNSELLOR-01', 'counsellor.sharma@college.edu', '+919988776655', 'COUNSELLOR', TRUE)
ON CONFLICT (wellbeing_id) DO NOTHING;

-- Demo Admin Account
INSERT INTO user_identity_mapping (auth_user_id, wellbeing_id, email, mobile, role, onboarding_completed)
VALUES 
('33333333-3333-3333-3333-333333333333', 'ADMIN-01', 'wellbeing.director@college.edu', '+919123456789', 'ADMIN', TRUE)
ON CONFLICT (wellbeing_id) DO NOTHING;
