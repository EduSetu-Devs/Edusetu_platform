import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getMyChildren, getChildSessions } from '../services/parentService';

const ParentLearningHistory = ({ onNavigateBack }) => {
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadChildren = async () => {
    const result = await getMyChildren();
    if (!result.success) { setError(result.error); setLoading(false); return; }
    const list = result.data.children || [];
    setChildren(list);
    if (list[0]) loadSessions(list[0].studentId);
    else setLoading(false);
  };
  const loadSessions = async (studentId) => {
    setSelected(String(studentId)); setLoading(true);
    const result = await getChildSessions(studentId);
    if (result.success) setSessions(result.data.sessions || []); else setError(result.error);
    setLoading(false);
  };
  useEffect(() => { loadChildren(); }, []);

  return <div className="max-w-6xl mx-auto my-6 px-4 space-y-6"><div><button onClick={onNavigateBack} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 mb-2"><ArrowLeft className="w-4 h-4" /> Back to dashboard</button><h1 className="text-3xl font-black text-slate-900">Child Learning History</h1><p className="text-sm text-slate-500 mt-1">Authorized class attendance, notes, feedback, and session history.</p></div>{children.length > 0 && <select value={selected} onChange={(event) => loadSessions(event.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm"><option value="">Select child</option>{children.map((child) => <option key={child.studentId} value={child.studentId}>{child.name}</option>)}</select>}{error && <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</p>}{loading ? <Loader2 className="animate-spin text-emerald-600" /> : sessions.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No class history available.</div> : <div className="grid gap-3">{sessions.map((item) => <article key={item.sessionId} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">{item.topic}</h2><p className="text-sm text-slate-600">{item.subject || 'Class'} · {item.teacher}</p></div><span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black">{item.status}</span></div><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-xs text-slate-600"><span>Date: {item.scheduledDate || 'Recorded'}</span><span>Attendance: {item.studentAttendanceStatus}</span><span>Attended: {item.studentAttendanceMinutes} min</span><span>Feedback: {item.feedback?.understandingLevel || 'Pending'}</span></div>{item.feedback?.feedback && <p className="mt-3 text-sm text-slate-700">{item.feedback.feedback}</p>}{item.note?.content && <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{item.note.content}</p>}</article>)}</div>}</div>;
};

export default ParentLearningHistory;
