import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ApiClient } from '../../lib/apiClient';
import { LanguageToggle } from '../../components/common/LanguageToggle';

interface StudentRecord {
  id: string;
  name: string;
  wellbeingId: string;
  rollNo: string;
  department: string;
  reviewStatus: 'PENDING' | 'COMPLETED';
  indicator: string;
  indicatorTone: 'green' | 'yellow' | 'red';
  lastReviewDate: string;
  latestReview?: {
    participation: string;
    behavior: string;
    engagement: string;
    notes: string;
    action: string;
    updatedAt: string;
  };
}

const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: 'std-1',
    name: 'Aarav Sharma',
    wellbeingId: 'WELL-8F42',
    rollNo: 'CSE-2024-042',
    department: 'CSE 3rd Year',
    reviewStatus: 'PENDING',
    indicator: 'Elevated Pressure',
    indicatorTone: 'yellow',
    lastReviewDate: '4 days ago'
  },
  {
    id: 'std-2',
    name: 'Ananya Deshmukh',
    wellbeingId: 'WELL-3B19',
    rollNo: 'ECE-2024-019',
    department: 'ECE 1st Year',
    reviewStatus: 'PENDING',
    indicator: 'High Fatigue',
    indicatorTone: 'red',
    lastReviewDate: '1 week ago'
  },
  {
    id: 'std-3',
    name: 'Rohan Kulkarni',
    wellbeingId: 'WELL-9C14',
    rollNo: 'CSE-2024-088',
    department: 'CSE 3rd Year',
    reviewStatus: 'COMPLETED',
    indicator: 'Steady',
    indicatorTone: 'green',
    lastReviewDate: 'Yesterday',
    latestReview: {
      participation: 'Active & Engaged',
      behavior: 'Calm & Attentive',
      engagement: 'Consistent',
      notes: 'Actively contributed in compiler lab discussion; pace looks sustainable.',
      action: 'No intervention needed',
      updatedAt: 'Yesterday'
    }
  },
  {
    id: 'std-4',
    name: 'Sneha Patil',
    wellbeingId: 'WELL-5D71',
    rollNo: 'IT-2024-031',
    department: 'IT 2nd Year',
    reviewStatus: 'PENDING',
    indicator: 'Restless / Fatigue',
    indicatorTone: 'yellow',
    lastReviewDate: '5 days ago'
  },
  {
    id: 'std-5',
    name: 'Vikram Joshi',
    wellbeingId: 'WELL-2E67',
    rollNo: 'MECH-2024-015',
    department: 'Mech 2nd Year',
    reviewStatus: 'COMPLETED',
    indicator: 'Steady',
    indicatorTone: 'green',
    lastReviewDate: '2 days ago',
    latestReview: {
      participation: 'Moderate',
      behavior: 'Attentive',
      engagement: 'On Schedule',
      notes: 'Completed CAD assignment on time. Good group teamwork.',
      action: 'No intervention needed',
      updatedAt: '2 days ago'
    }
  },
  {
    id: 'std-6',
    name: 'Pooja Nair',
    wellbeingId: 'WELL-7A90',
    rollNo: 'CSE-2024-055',
    department: 'CSE 3rd Year',
    reviewStatus: 'PENDING',
    indicator: 'High Fatigue',
    indicatorTone: 'red',
    lastReviewDate: 'Not reviewed'
  }
];

export const TeacherDashboardPage: React.FC = () => {
  const { profile, logout } = useAuth();
  const { t } = useLanguage();
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('nivara_teacher_students');
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralNote, setReferralNote] = useState('');
  const [referralSent, setReferralSent] = useState(false);

  // Review Form States
  const [participation, setParticipation] = useState('Active');
  const [behavior, setBehavior] = useState('Attentive');
  const [engagement, setEngagement] = useState('Consistent');
  const [notes, setNotes] = useState('');
  const [action, setAction] = useState('No intervention needed');

  useEffect(() => {
    try {
      localStorage.setItem('nivara_teacher_students', JSON.stringify(students));
    } catch (e) {
      console.error(e);
    }
  }, [students]);

  const openReviewModal = (student: StudentRecord) => {
    setSelectedStudent(student);
    if (student.latestReview) {
      setParticipation(student.latestReview.participation);
      setBehavior(student.latestReview.behavior);
      setEngagement(student.latestReview.engagement);
      setNotes(student.latestReview.notes);
      setAction(student.latestReview.action);
    } else {
      setParticipation('Active');
      setBehavior('Attentive');
      setEngagement('Consistent');
      setNotes('');
      setAction('No intervention needed');
    }
    setReviewModalOpen(true);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === selectedStudent.id) {
          return {
            ...s,
            reviewStatus: 'COMPLETED',
            lastReviewDate: 'Just now',
            latestReview: {
              participation,
              behavior,
              engagement,
              notes: notes.trim() || 'Classroom performance and focus observed as satisfactory.',
              action,
              updatedAt: new Date().toLocaleDateString()
            }
          };
        }
        return s;
      })
    );

    setReviewModalOpen(false);
    setSelectedStudent(null);
  };

  const handleSendReferral = (e: React.FormEvent) => {
    e.preventDefault();
    setReferralSent(true);
    setTimeout(() => {
      setReferralSent(false);
      setShowReferralModal(false);
      setReferralNote('');
    }, 2000);
  };

  const pendingCount = students.filter((s) => s.reviewStatus === 'PENDING').length;
  const completedCount = students.filter((s) => s.reviewStatus === 'COMPLETED').length;
  const attentionCount = students.filter((s) => s.indicatorTone === 'red' || s.indicatorTone === 'yellow').length;

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col pb-16 selection:bg-secondary-fixed">
      {/* Teacher Portal Header */}
      <header className="bg-background/95 backdrop-blur sticky top-0 z-40 border-b border-surface-variant/40 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-[1100px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Nivara Logo"
              className="w-10 h-10 rounded-full object-cover shadow-sm border border-outline-variant/30"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-headline font-bold text-base text-primary">Nivara</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold uppercase tracking-wider">
                  {t('teacher_badge', 'Teacher Portal')}
                </span>
              </div>
              <span className="text-xs text-on-surface-variant">
                {t('teacher_portal_title')} • {profile?.name || 'Faculty Member'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />

            <button
              onClick={() => setShowReferralModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold hover:opacity-90 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">support_agent</span>
              <span>Refer to Counselor</span>
            </button>

            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-variant text-xs text-on-surface font-semibold flex items-center gap-1 border border-outline-variant/40 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1100px] mx-auto px-4 py-6 w-full flex flex-col gap-6 animate-fadeIn">
        {/* Welcome Banner */}
        <section className="p-6 rounded-3xl bg-secondary-fixed/25 border border-secondary-fixed flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-headline font-extrabold text-2xl text-on-background">
              {t('teacher_welcome')}, Prof. {profile?.name || 'Faculty'} 👨‍🏫
            </h1>
            <p className="text-xs text-on-surface-variant max-w-xl leading-relaxed">
              {t('teacher_sub')}
            </p>
          </div>
          <button
            onClick={() => setShowReferralModal(true)}
            className="sm:hidden w-full py-2.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">support_agent</span>
            <span>Refer to Counselor</span>
          </button>
        </section>

        {/* 4 Prominent Summary Stat Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Registered Students */}
          <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-secondary mb-2">
              <span className="text-xs font-bold text-on-surface">
                {t('teacher_stat_total_students')}
              </span>
              <span className="material-symbols-outlined text-xl text-secondary">groups</span>
            </div>
            <span className="text-3xl font-black font-headline text-on-background">
              140
            </span>
            <span className="text-[11px] text-on-surface-variant mt-1">
              {t('teacher_stat_students_sub')}
            </span>
          </div>

          {/* Card 2: Requiring Observation */}
          <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-warning mb-2">
              <span className="text-xs font-bold text-on-surface">
                {t('teacher_stat_attention')}
              </span>
              <span className="material-symbols-outlined text-xl text-error">visibility</span>
            </div>
            <span className="text-3xl font-black font-headline text-error">
              {attentionCount}
            </span>
            <span className="text-[11px] text-on-surface-variant mt-1">
              {t('teacher_stat_attention_sub')}
            </span>
          </div>

          {/* Card 3: Weekly Reviews Pending */}
          <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-secondary mb-2">
              <span className="text-xs font-bold text-on-surface">
                {t('teacher_stat_pending_reviews')}
              </span>
              <span className="material-symbols-outlined text-xl text-secondary">pending_actions</span>
            </div>
            <span className="text-3xl font-black font-headline text-secondary">
              {pendingCount}
            </span>
            <span className="text-[11px] text-on-surface-variant mt-1">
              {t('teacher_stat_pending_sub')}
            </span>
          </div>

          {/* Card 4: Completed Reviews */}
          <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-variant/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-primary mb-2">
              <span className="text-xs font-bold text-on-surface">
                {t('teacher_stat_completed_reviews')}
              </span>
              <span className="material-symbols-outlined text-xl text-primary">check_circle</span>
            </div>
            <span className="text-3xl font-black font-headline text-primary">
              {completedCount}
            </span>
            <span className="text-[11px] text-on-surface-variant mt-1">
              {t('teacher_stat_completed_sub')}
            </span>
          </div>
        </section>

        {/* Student Directory Table */}
        <section className="bg-surface-container-lowest rounded-3xl border border-surface-variant/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-surface-variant/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">table_chart</span>
              <h2 className="font-headline font-bold text-base text-on-background">
                {t('teacher_students_table_title')}
              </h2>
            </div>
            <span className="text-xs text-on-surface-variant">
              Cohort Shield Active • Total {students.length} in Active Batch
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant border-b border-surface-variant/40 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">{t('teacher_table_name')}</th>
                  <th className="px-5 py-3.5">{t('teacher_table_roll')}</th>
                  <th className="px-5 py-3.5">{t('teacher_table_status')}</th>
                  <th className="px-5 py-3.5">{t('teacher_table_indicator')}</th>
                  <th className="px-5 py-3.5">{t('teacher_table_last_review')}</th>
                  <th className="px-5 py-3.5 text-right">{t('teacher_table_action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/40">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-5 py-4 font-medium text-on-background">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {student.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span>{student.name}</span>
                          <span className="text-[10px] text-on-surface-variant font-mono">
                            {student.wellbeingId}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-on-surface">
                      <div className="flex flex-col">
                        <span>{student.rollNo}</span>
                        <span className="text-[10px] text-on-surface-variant">{student.department}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {student.reviewStatus === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold">
                          ✓ Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 font-medium ${
                          student.indicatorTone === 'red'
                            ? 'text-error'
                            : student.indicatorTone === 'yellow'
                            ? 'text-amber-600'
                            : 'text-primary'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            student.indicatorTone === 'red'
                              ? 'bg-error animate-pulse'
                              : student.indicatorTone === 'yellow'
                              ? 'bg-amber-500'
                              : 'bg-primary'
                          }`}
                        />
                        {student.indicator}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant">
                      {student.lastReviewDate}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openReviewModal(student)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all ${
                          student.reviewStatus === 'COMPLETED'
                            ? 'bg-surface-container text-on-surface hover:bg-surface-variant'
                            : 'bg-primary text-on-primary hover:opacity-90'
                        }`}
                      >
                        {student.reviewStatus === 'COMPLETED' ? 'View / Edit' : t('teacher_btn_review')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Prominent Teacher Guidelines Section */}
        <section className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-variant/60 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2.5 border-b border-surface-variant/40 pb-3">
            <span className="material-symbols-outlined text-primary text-2xl">menu_book</span>
            <div>
              <h2 className="font-headline font-bold text-lg text-on-background">
                {t('teacher_guidelines_title')}
              </h2>
              <p className="text-xs text-on-surface-variant">
                Evidence-based protocols for observing, mentoring, and supporting student wellbeing in educational settings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Guideline 1 */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔍</span>
                <h3 className="font-headline font-bold text-xs text-on-background">
                  {t('teacher_guideline_1_title')}
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t('teacher_guideline_1_desc')}
              </p>
            </div>

            {/* Guideline 2 */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">💬</span>
                <h3 className="font-headline font-bold text-xs text-on-background">
                  {t('teacher_guideline_2_title')}
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t('teacher_guideline_2_desc')}
              </p>
            </div>

            {/* Guideline 3 */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🕊️</span>
                <h3 className="font-headline font-bold text-xs text-on-background">
                  {t('teacher_guideline_3_title')}
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t('teacher_guideline_3_desc')}
              </p>
            </div>

            {/* Guideline 4 */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">⏳</span>
                <h3 className="font-headline font-bold text-xs text-on-background">
                  {t('teacher_guideline_4_title')}
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t('teacher_guideline_4_desc')}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Weekly Observational Review Modal */}
      {reviewModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl p-6 max-w-lg w-full border border-surface-variant/60 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-variant/40 pb-3">
              <div>
                <h3 className="font-headline font-bold text-base text-on-background">
                  {t('teacher_review_modal_title')}
                </h3>
                <span className="text-xs text-primary font-medium">
                  {selectedStudent.name} • {selectedStudent.rollNo} ({selectedStudent.department})
                </span>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant"
              >
                ✕
              </button>
            </div>

            {/* Crucial Non-Clinical Educational Disclaimer Alert */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
              <span className="text-lg text-amber-600 shrink-0">⚠️</span>
              <p className="text-xs text-on-surface leading-relaxed font-medium">
                {t('teacher_review_disclaimer')}
              </p>
            </div>

            <form onSubmit={handleSaveReview} className="flex flex-col gap-4">
              {/* Classroom Participation */}
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  {t('teacher_review_participation')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['High / Active', 'Moderate / Steady', 'Low / Withdrawn'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setParticipation(opt)}
                      className={`p-2 rounded-xl text-xs font-medium border transition-all ${
                        participation === opt
                          ? 'bg-primary text-on-primary border-primary font-bold shadow-sm'
                          : 'bg-surface-container-low border-outline-variant/40 text-on-surface'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Behaviour & Focus */}
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  {t('teacher_review_behavior')}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['Attentive', 'Restless', 'Fatigued', 'Distracted'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setBehavior(opt)}
                      className={`p-2 rounded-xl text-xs font-medium border transition-all ${
                        behavior === opt
                          ? 'bg-secondary text-on-secondary border-secondary font-bold shadow-sm'
                          : 'bg-surface-container-low border-outline-variant/40 text-on-surface'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Academic Engagement */}
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  {t('teacher_review_engagement')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Consistent', 'Slipping Deadlines', 'Needs Buffer'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setEngagement(opt)}
                      className={`p-2 rounded-xl text-xs font-medium border transition-all ${
                        engagement === opt
                          ? 'bg-tertiary text-on-tertiary border-tertiary font-bold shadow-sm'
                          : 'bg-surface-container-low border-outline-variant/40 text-on-surface'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observational Notes */}
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  {t('teacher_review_notes')}
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record classroom participation notes, assignment pacing observations, or teamwork engagement..."
                  className="w-full p-3 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-background focus:outline-none focus:border-primary"
                />
              </div>

              {/* Suggested Action */}
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  {t('teacher_review_action')}
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-background focus:outline-none focus:border-primary"
                >
                  <option value="No intervention needed">No intervention needed (Normal equilibrium)</option>
                  <option value="Encourage study breaks & sleep hygiene">Encourage study breaks & sleep hygiene</option>
                  <option value="Offer 1-on-1 academic pacing check-in">Offer 1-on-1 academic pacing check-in</option>
                  <option value="Coordinate buffer for upcoming milestone">Coordinate buffer for upcoming milestone</option>
                  <option value="Discreet campus counselor referral">Discreet campus counselor referral</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-variant/40">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-variant text-xs font-semibold text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold shadow-md hover:opacity-90"
                >
                  {t('teacher_save_review')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refer to Counselor Modal */}
      {showReferralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl p-6 max-w-md w-full border border-surface-variant/60 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-surface-variant/40 pb-3">
              <h3 className="font-headline font-bold text-base text-on-background">
                Refer Student / Class to Counseling
              </h3>
              <button
                onClick={() => setShowReferralModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant"
              >
                ✕
              </button>
            </div>

            {referralSent ? (
              <div className="p-4 rounded-2xl bg-primary-fixed text-on-primary-fixed text-xs font-semibold text-center">
                ✓ Confidential support referral dispatched to Campus Counseling Desk.
              </div>
            ) : (
              <form onSubmit={handleSendReferral} className="flex flex-col gap-3">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Notice a student experiencing intense academic fatigue or isolation? Submit a discreet notification. Identity remains strictly partitioned.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Student ID or Class Context (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WELL-8F42 or CSE 3rd Year Section A"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Observations / Support Request Notes
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe observed concerns (e.g. recurring absence, visible distress during exams)..."
                    value={referralNote}
                    onChange={(e) => setReferralNote(e.target.value)}
                    className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-background"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-secondary text-on-secondary text-xs font-semibold shadow-md hover:opacity-90"
                >
                  Submit Discreet Referral
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
