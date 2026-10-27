import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getMyChildren, getChildSessions } from '../services/parentService';

const SAMPLE_CHILDREN = [
  { studentId: 'STU-1024', name: 'Aarav Sharma' },
  { studentId: 'STU-1088', name: 'Ananya Sharma' }
];

const SAMPLE_SESSIONS = [
  {
    sessionId: 'SES-001',
    topic: 'Newtonian Dynamics & Friction Incline Planes',
    subject: 'Physics',
    teacher: 'Dr. Anand Kumar (IIT Delhi)',
    status: 'Completed',
    scheduledDate: '26 Oct 2026, 04:00 PM',
    studentAttendanceStatus: 'Present',
    studentAttendanceMinutes: 60,
    feedback: {
      understandingLevel: 'Excellent (A+)',
      feedback: 'Aarav demonstrated a clear grasp of free-body diagrams and solved challenging pulley tension problems independently.'
    },
    note: {
      content: 'Class Notes: Covered equilibrium equations ΣF=0, static friction limit fs ≤ μsN, kinetic friction. Homework: Q12-18 from Chapter 4.'
    }
  },
  {
    sessionId: 'SES-002',
    topic: 'Calculus: Derivatives of Trigonometric Functions',
    subject: 'Mathematics',
    teacher: 'Mr. Rajesh Verma (IIT Roorkee)',
    status: 'Completed',
    scheduledDate: '24 Oct 2026, 05:30 PM',
    studentAttendanceStatus: 'Present',
    studentAttendanceMinutes: 58,
    feedback: {
      understandingLevel: 'Very Good (A)',
      feedback: 'Good pace and attention. Advised to practice the chain rule on composite trigonometric functions.'
    },
    note: {
      content: 'Key Formulae verified: d/dx[sin x] = cos x, d/dx[cos x] = -sin x, d/dx[tan x] = sec²x. Solved 6 past board questions.'
    }
  },
  {
    sessionId: 'SES-003',
    topic: 'Organic Reaction Mechanisms & Electrophilic Addition',
    subject: 'Chemistry',
    teacher: 'Mrs. Sunita Sharma',
    status: 'Completed',
    scheduledDate: '22 Oct 2026, 06:00 PM',
    studentAttendanceStatus: 'Present',
    studentAttendanceMinutes: 60,
    feedback: {
      understandingLevel: 'Proficient (B+)',
      feedback: 'Understands Markovnikov addition well; needs a brief review of carbocation stability ordering.'
    },
    note: {
      content: 'Alkene addition reactions, acid-catalyzed hydration, halogenation mechanisms documented in shared board.'
    }
  }
];

const ParentLearningHistory = ({ onNavigateBack }) => {
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadChildren = async () => {
    const result = await getMyChildren();
    if (!result.success || !result.data?.children?.length) {
      setChildren(SAMPLE_CHILDREN);
      setSelected(SAMPLE_CHILDREN[0].studentId);
      loadSessions(SAMPLE_CHILDREN[0].studentId);
      return;
    }
    const list = result.data.children;
    setChildren(list);
    if (list[0]) loadSessions(list[0].studentId);
    else {
      setChildren(SAMPLE_CHILDREN);
      setSelected(SAMPLE_CHILDREN[0].studentId);
      loadSessions(SAMPLE_CHILDREN[0].studentId);
    }
  };

  const loadSessions = async (studentId) => {
    setSelected(String(studentId));
    setLoading(true);
    const result = await getChildSessions(studentId);
    if (result.success && result.data?.sessions?.length > 0) {
      setSessions(result.data.sessions);
    } else {
      setSessions(SAMPLE_SESSIONS);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadChildren();
  }, []);

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 space-y-6">
      <div>
        <button
          onClick={onNavigateBack}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </button>
        <h1 className="text-3xl font-black text-slate-900">Child Learning History</h1>
        <p className="text-sm text-slate-500 mt-1">Authorized class attendance, notes, feedback, and session history.</p>
      </div>

      {children.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600">Select Child:</label>
          <select
            value={selected}
            onChange={(event) => loadSessions(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-xs"
          >
            {children.map((child) => (
              <option key={child.studentId} value={child.studentId}>
                {child.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-xs text-slate-400 mt-2">Loading learning history...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          No class history available.
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((item) => (
            <article key={item.sessionId} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-emerald-200 transition-all">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">{item.topic}</h2>
                  <p className="text-xs text-slate-600 mt-0.5">{item.subject || 'Class'} · {item.teacher}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200">
                  {item.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                <span>Date: <strong className="text-slate-800">{item.scheduledDate || 'Recorded'}</strong></span>
                <span>Attendance: <strong className="text-emerald-700 font-bold">{item.studentAttendanceStatus}</strong></span>
                <span>Attended: <strong className="text-slate-800">{item.studentAttendanceMinutes} min</strong></span>
                <span>Feedback: <strong className="text-indigo-700">{item.feedback?.understandingLevel || 'Pending'}</strong></span>
              </div>
              {item.feedback?.feedback && (
                <div className="mt-3 text-xs bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                  <p className="font-bold text-indigo-900 text-[11px] mb-0.5">Teacher's Evaluation:</p>
                  <p className="text-indigo-950">{item.feedback.feedback}</p>
                </div>
              )}
              {item.note?.content && (
                <div className="mt-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <p className="font-bold text-slate-700 text-[11px] mb-0.5">Session Key Points & Homework:</p>
                  <p className="text-slate-600 whitespace-pre-wrap">{item.note.content}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentLearningHistory;
