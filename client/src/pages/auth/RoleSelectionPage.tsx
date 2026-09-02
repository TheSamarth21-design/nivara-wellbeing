import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../types/auth';
import { RoleCard } from '../../components/auth/RoleCard';

export const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectRole = (role: UserRole) => {
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      {/* Serene Floating Ambience */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl opacity-70 animate-subtle-float pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-fixed/30 rounded-full blur-3xl opacity-70 animate-subtle-float pointer-events-none" />

      <div className="max-w-md w-full flex flex-col gap-6 relative z-10 animate-fadeIn">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center gap-2">
          <img
            src="/logo.png"
            alt="Nivara Logo"
            className="w-16 h-16 rounded-3xl object-cover shadow-sm border border-outline-variant/40 mb-1"
          />
          <h1 className="font-headline font-extrabold text-2xl md:text-3xl text-on-background tracking-tight">
            Welcome to Nivara
          </h1>
          <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
            How would you like to continue today? Please select your campus role to enter your dedicated space.
          </p>
        </div>

        {/* Role Cards */}
        <div className="flex flex-col gap-3">
          <RoleCard
            role="student"
            title="Student"
            emoji="🎓"
            badge="Personal Space"
            description="Access your wellbeing tools, personal insights, resources, and support services."
            onClick={() => handleSelectRole('student')}
          />

          <RoleCard
            role="teacher"
            title="Teacher"
            emoji="👨‍🏫"
            badge="Academic Portal"
            description="Access student-related academic and wellbeing insights, resources, and management tools."
            onClick={() => handleSelectRole('teacher')}
          />

          <RoleCard
            role="counselor"
            title="Counselor"
            emoji="🧑‍⚕️"
            badge="Clinical Desk"
            description="Access counseling tools, support requests, appointments, and student wellbeing information."
            onClick={() => handleSelectRole('counselor')}
          />
        </div>

        {/* Identity & Confidentiality Note */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">verified_user</span>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Nivara strictly enforces role-based identity separation. Student reflections remain confidential and are never exposed without explicit consent.
          </p>
        </div>
      </div>
    </div>
  );
};
