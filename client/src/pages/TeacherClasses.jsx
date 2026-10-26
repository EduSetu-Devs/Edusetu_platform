import React, { useEffect, useState } from 'react';
import { CalendarPlus, CheckCircle2, Clock3, MapPin, MonitorPlay, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { createTeacherSession, getTeachingSubjects, getTeacherSessions, startTeacherSession, cancelTeacherSession, completeTeacherSession, getMyStudents } from '../services/teacherService';
import ClassLearningPanel from '../components/ClassLearningPanel';

const initialForm = { studentId: '', subjectId: '', title: '', description: '', mode: 'ONLINE', scheduledDate: '', startTime: '', endTime: '', location: '' };
const statusTabs = ['ALL', 'SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'];

const TeacherClasses = ({ onNavigateBack, onNavigateToClassroom }) => {
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const load = async () => {
    setLoading(true);
    const [sessionRes, studentRes, subjectRes] = await Promise.all([getTeacherSessions(), getMyStudents(), getTeachingSubjects()]);
    if (sessionRes.success) { const nextSessions = sessionRes.data.sessions || []; setSessions(nextSessions); setSelectedSessionId((current) => current || nextSessions[0]?.id || null); }
    if (studentRes.success) setStudents(studentRes.data.students || []);
    if (subjectRes.success) setSubjects(subjectRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const schedule = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);
    const result = await createTeacherSession({ ...form, subjectId: form.subjectId || undefined });
    setSaving(false);
    if (!result.success) {
      setFeedback({ type: 'error', text: result.error });
      return;
    }
    setFeedback({ type: 'success', text: 'Class scheduled and student notified.' });
    setForm(initialForm);
    load();
  };

  const runAction = async (action, id, message, navigateToClassroom = false) => {
    const result = await action(id);
    setFeedback(result.success ? { type: 'success', text: message } : { type: 'error', text: result.error });
    if (result.success) {
      if (navigateToClassroom) onNavigateToClassroom(id);
      else load();
    }
  };

  const visibleSessions = activeTab === 'ALL' ? sessions : sessions.filter((session) => session.status === activeTab);

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <button onClick={onNavigateBack} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 mb-2"><ArrowLeft className="w-4 h-4" /> Back to dashboard</button>
          <h1 className="text-3xl font-black text-slate-900">My Classes</h1>
          <p className="text-sm text-slate-500 mt-1">Schedule and manage your authorized one-to-one teaching sessions.</p>
        </div>
        <div className="px-4 py-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-bold">Phase 1 classroom infrastructure</div>
      </div>

      {feedback && <div className={`p-3 rounded-xl border text-sm ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>{feedback.text}</div>}

      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5"><CalendarPlus className="w-5 h-5 text-indigo-600" /><h2 className="text-lg font-bold text-slate-900">Create Class</h2></div>
        <form onSubmit={schedule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-xs font-bold text-slate-600">Student<select required name="studentId" value={form.studentId} onChange={updateForm} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal"><option value="">Select authorized student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} ({student.studentId})</option>)}</select></label>
          <label className="text-xs font-bold text-slate-600">Subject<select name="subjectId" value={form.subjectId} onChange={updateForm} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal"><option value="">Select subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-600">Class title<input required name="title" value={form.title} onChange={updateForm} placeholder="Algebra foundations" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" /></label>
          <label className="text-xs font-bold text-slate-600">Teaching mode<select name="mode" value={form.mode} onChange={updateForm} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal"><option value="ONLINE">Online</option><option value="OFFLINE">Offline</option></select></label>
          <label className="text-xs font-bold text-slate-600 md:col-span-2">Topic / description<textarea name="description" value={form.description} onChange={updateForm} rows="2" placeholder="What will this class cover?" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" /></label>
          <label className="text-xs font-bold text-slate-600">Date<input required type="date" name="scheduledDate" value={form.scheduledDate} onChange={updateForm} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-600">Start<input required type="time" name="startTime" value={form.startTime} onChange={updateForm} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" /></label><label className="text-xs font-bold text-slate-600">End<input required type="time" name="endTime" value={form.endTime} onChange={updateForm} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" /></label></div>
          {form.mode === 'OFFLINE' && <label className="text-xs font-bold text-slate-600 md:col-span-2">Location / venue<input required name="location" value={form.location} onChange={updateForm} placeholder="Room 204" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" /></label>}
          <button disabled={saving} className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3 font-bold text-sm">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />} Schedule class</button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto">{statusTabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{tab === 'ALL' ? 'All classes' : tab}</button>)}</div>
        {loading ? <div className="p-10 text-center"><Loader2 className="mx-auto animate-spin text-indigo-600" /></div> : visibleSessions.length === 0 ? <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-sm text-slate-500">No classes in this view.</div> : <div className="grid gap-3">{visibleSessions.map((session) => <article key={session.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div className="flex items-center gap-2"><h3 className="font-bold text-slate-900">{session.title}</h3><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${session.status === 'LIVE' ? 'bg-rose-100 text-rose-700' : session.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : session.status === 'CANCELLED' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>{session.status}</span>{session.bookingStatus && <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black">{session.bookingStatus}</span>}</div><p className="text-sm text-slate-600 mt-1">{session.student} {session.subject ? `• ${session.subject}` : ''}</p><div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-3"><span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />{session.scheduledDate} · {session.startTime}–{session.endTime}</span><span className="inline-flex items-center gap-1">{session.mode === 'ONLINE' ? <MonitorPlay className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}{session.mode === 'ONLINE' ? 'Online' : session.location}</span></div></div><div className="flex gap-2">{session.status === 'SCHEDULED' && session.mode === 'ONLINE' && (!session.tutorRequestId || session.bookingStatus === 'CONFIRMED') && <button onClick={() => runAction(startTeacherSession, session.id, 'Class is live and the student was notified.', true)} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">Start class</button>}{session.status === 'LIVE' && <><button onClick={() => onNavigateToClassroom(session.id)} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">Open classroom</button><button onClick={() => runAction(completeTeacherSession, session.id, 'Class marked completed.')} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"><CheckCircle2 className="inline w-3.5 h-3.5 mr-1" />Complete</button></>}{session.status === 'SCHEDULED' && <button onClick={() => runAction(cancelTeacherSession, session.id, 'Class cancelled and the student was notified.')} className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold"><XCircle className="inline w-3.5 h-3.5 mr-1" />Cancel</button>}</div></div></article>)}</div>}
        {visibleSessions[0] && <div className="flex gap-2 overflow-x-auto"><span className="text-xs font-bold text-slate-500 py-2">Learning details:</span>{visibleSessions.map((session) => <button key={session.id} onClick={() => setSelectedSessionId(session.id)} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${selectedSessionId === session.id ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{session.title}</button>)}</div>}
        {sessions.find((session) => session.id === selectedSessionId) && <ClassLearningPanel session={sessions.find((session) => session.id === selectedSessionId)} isTeacher />}
      </section>
    </div>
  );
};

export default TeacherClasses;
