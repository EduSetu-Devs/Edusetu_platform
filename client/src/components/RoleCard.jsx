import React from 'react';
import { BookOpen, Users, ShieldCheck, HeartHandshake, ArrowRight } from 'lucide-react';

const roles = [
  {
    id: 'students',
    title: 'Students',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    description: 'Empowers students to stay organized and achieve academic success.',
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
    color: 'from-indigo-500 to-purple-500',
    bgLight: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    description: 'Enables teachers to manage classes and communicate effortlessly.',
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
    color: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    description: 'Keeps parents actively involved and informed about their child.',
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
    color: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    description: 'Oversees school-wide operations, security, and user management.',
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
    <div id="roles" className="py-8">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Designed for the Entire School Ecosystem
        </h2>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          EduSetu creates a cohesive bridge connecting students, teachers, parents, and school administration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <div
              key={role.id}
              className={`rounded-2xl border ${role.borderColor} bg-white p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between`}
            >
              <div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${role.color} flex items-center justify-center text-white shadow-md shadow-slate-200 mb-5`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-lg font-bold text-slate-900">{role.title}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">{role.description}</p>
                
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Core Capabilities</p>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {role.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className={`mr-2 font-bold ${role.textColor}`}>•</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${role.bgLight} ${role.textColor}`}>
                  Planned Role
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoleCard;
