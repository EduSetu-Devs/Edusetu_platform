import React, { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock3, Loader2, MapPin, MonitorPlay, Play } from 'lucide-react';
import { getStudentSessions, joinStudentSession } from '../services/studentService';
import ClassLearningPanel from '../components/ClassLearningPanel';

const tabs = ['ALL', 'SCHEDULED', 'LIVE', 'COMPLETED'];

const StudentClasses = ({ onNavigateBack, onNavigateToClassroom }) => {
  const [sessions, setSessions] = useState([]);
  const [tab, setTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const load = async () => {
    setLoading(true);
    const result = await getStudentSessions();
    if (result.success) { const nextSessions = result.data.sessions || []; setSessions(nextSessions); setSelectedSessionId((current) => current || nextSessions[0]?.id || null); }
    else setFeedback({ type: 'error', text: result.error });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const visible = tab === 'ALL' ? sessions : sessions.filter((session) => session.status === tab);

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 space-y-8">
      <div><button onClick={onNavigateBack} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 mb-2"><ArrowLeft className="w-4 h-4" /> Back to dashboard</button><h1 className="text-3xl font-black text-slate-900">My Classes</h1><p className="text-sm text-slate-500 mt-1">Your scheduled, live, and completed learning sessions.</p></div>
      {feedback && <div className={`p-3 rounded-xl border text-sm ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>{feedback.text}</div>}
      <div className="flex gap-2 overflow-x-auto">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${tab === item ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{item === 'ALL' ? 'All classes' : item}</button>)}</div>
      {loading ? <div className="p-10 text-center"><Loader2 className="mx-auto animate-spin text-indigo-600" /></div> : visible.length === 0 ? <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-sm text-slate-500">No classes in this view.</div> : <div className="grid gap-3">{visible.map((session) => <article key={session.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div className="flex items-center gap-2"><h2 className="font-bold text-slate-900">{session.title}</h2><span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black">{session.status}</span></div><p className="text-sm text-slate-600 mt-1">Teacher: <strong>{session.teacher}</strong>{session.subject ? ` · ${session.subject}` : ''}</p><div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-3"><span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{session.scheduledDate}</span><span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />{session.startTime}–{session.endTime}</span><span className="inline-flex items-center gap-1">{session.mode === 'ONLINE' ? <MonitorPlay className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}{session.mode === 'ONLINE' ? 'Online' : session.location}</span></div></div>{session.mode === 'ONLINE' && session.status === 'LIVE' && <button onClick={async () => { const result = await joinStudentSession(session.id); if (result.success) onNavigateToClassroom(session.id); else setFeedback({ type: 'error', text: result.error }); }} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"><Play className="w-3.5 h-3.5" />Join class</button>}</div></article>)}</div>}
      {visible[0] && <div className="flex gap-2 overflow-x-auto"><span className="text-xs font-bold text-slate-500 py-2">Learning details:</span>{visible.map((session) => <button key={session.id} onClick={() => setSelectedSessionId(session.id)} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${selectedSessionId === session.id ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{session.title}</button>)}</div>}
      {sessions.find((session) => session.id === selectedSessionId) && <ClassLearningPanel session={sessions.find((session) => session.id === selectedSessionId)} />}
    </div>
  );
};

export default StudentClasses;
