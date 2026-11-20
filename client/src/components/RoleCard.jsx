import React from 'react';
import { BookOpen, Users, ShieldCheck, HeartHandshake, ArrowRight, Sparkles, Compass } from 'lucide-react';

const roles = [
  {
    id: 'students',
    title: 'Students',
    icon: BookOpen,
    color: 'from-blue-600 to-cyan-500',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200/80',
    textColor: 'text-blue-700',
    shadowColor: 'shadow-blue-500/10',
    description: 'Empowers students to stay organized and achieve academic success with AI tutoring & tracking.',
    features: [
      'Access class announcements & circulars',
      'View daily homework & assignment deadlines',
      'Track subject-wise attendance & test grades',
      'Receive direct notifications from subject teachers'
    ]
  },
  {
    id: 'teachers',
    title: 'Teachers',
    icon: Users,
    color: 'from-indigo-600 to-purple-600',
    bgLight: 'bg-indigo-50',
    borderColor: 'border-indigo-200/80',
    textColor: 'text-indigo-700',
    shadowColor: 'shadow-indigo-500/10',
    description: 'Enables teachers to manage classes, attendance, homework, and communicate effortlessly.',
    features: [
      'Post classroom notices and study materials',
      'Record student attendance in real-time',
      'Create and evaluate assignments',
      'Send direct messages/updates to parents'
    ]
  },
  {
    id: 'parents',
    title: 'Parents',
    icon: HeartHandshake,
    color: 'from-emerald-600 to-teal-500',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-200/80',
    textColor: 'text-emerald-700',
    shadowColor: 'shadow-emerald-500/10',
    description: 'Keeps parents actively involved and informed about their child progress and attendance.',
    features: [
      'Real-time attendance & absence alerts',
      'Monitor academic progress and report cards',
      'Direct one-on-one communication with teachers',
      'View school fee dues, exam dates & event calendars'
    ]
  },
  {
    id: 'admin',
    title: 'Administrator',
    icon: ShieldCheck,
    color: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200/80',
    textColor: 'text-amber-700',
    shadowColor: 'shadow-amber-500/10',
    description: 'Oversees school-wide operations, institutional security, roster assignments, and analytics.',
    features: [
      'Manage student, teacher & parent accounts',
      'Configure classes, sections, and subjects',
      'Broadcast school-wide official notices',
      'Monitor platform security, logs, and system health'
    ]
  }
];

const RoleCard = () => {
  return (
    <div id="roles" className="py-16 relative perspective-1000">
      {/* Background 3D glowing blur sphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-300/30 to-purple-300/30 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />

      <div className="text-center max-w-3xl mx-auto mb-16 relative z-10 animate-fade-up">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700 mb-4 shadow-sm">
          <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
          <span>3D Interactive Ecosystem Pillars</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
          Designed for the Entire School Ecosystem
        </h2>
        <p className="text-slate-600 mt-4 text-base sm:text-lg leading-relaxed">
          EduSetu creates a cohesive 3D animated bridge connecting students, teachers, parents, and school administration with depth and realism.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
        {roles.map((role, idx) => {
          const Icon = role.icon;
          return (
            <div
              key={role.id}
              style={{ animationDelay: `${idx * 150}ms` }}
              className={`rounded-3xl border ${role.borderColor} bg-white/95 backdrop-blur-xl p-7 shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 flex flex-col justify-between group animate-fade-up hover:border-indigo-400 transform-gpu hover:rotate-x-2 hover:rotate-y-2`}
            >
              <div>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${role.color} flex items-center justify-center text-white shadow-xl shadow-slate-300/50 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                  <Icon className="w-8 h-8" />
                </div>

                <h3 className="text-2xl font-black text-slate-950 group-hover:text-indigo-600 transition-colors">{role.title}</h3>
                <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">{role.description}</p>

                <div className="space-y-3 border-t border-slate-100 pt-5">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Core Capabilities</p>
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    {role.features.map((feat, i) => (
                      <li key={i} className="flex items-start">
                        <span className={`mr-2.5 font-bold ${role.textColor} text-sm`}>•</span>
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
                <span className={`text-xs font-bold px-3.5 py-1.5 rounded-full ${role.bgLight} ${role.textColor} shadow-xs`}>
                  Active 3D Role
                </span>
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoleCard;
