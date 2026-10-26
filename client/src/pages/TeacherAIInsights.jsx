import React, { useState } from 'react';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { getMyStudents, getTeacherStudentAIInsights, getTeacherClassAIInsights, getTeacherSessions } from '../services/teacherService';

const TeacherAIInsights = ({ onNavigateBack }) => {
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadChoices = async () => {
    setError('');
    try {
      const [studentResult, sessionResult] = await Promise.all([
        getMyStudents(),
        getTeacherSessions({ status: 'COMPLETED' })
      ]);
      if (studentResult.success) setStudents(studentResult.data.students || []);
      else setError(studentResult.error || 'Unable to load authorized students.');
      if (sessionResult.success) setSessions(sessionResult.data.sessions || []);
      else setError(sessionResult.error || 'Unable to load completed classes.');
    } catch {
      setError('Unable to load teacher insight choices. Please try again.');
    }
  };

  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      const response = await action();
      if (response.success) setResult(response.data);
      else setError(response.error || 'Unable to generate insights.');
    } catch {
      setError('Unable to generate insights. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const academic = result?.academicSummary;

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 space-y-6">
      <div>
        <button onClick={onNavigateBack} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </button>
        <h1 className="text-3xl font-black text-slate-900">AI Insights</h1>
        <p className="text-sm text-slate-500 mt-1">Insights use recorded marks, attendance, submissions, feedback, and sessions only.</p>
        <p className="text-sm font-semibold text-slate-700 mt-1">AI insights are advisory. You remain the final authority; verify records before acting.</p>
      </div>
      {error && <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</p>}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <button onClick={loadChoices} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold">Load authorized students and completed classes</button>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <select value={studentId} onChange={(event) => setStudentId(event.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm">
              <option value="">Select authorized student</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.name} ({student.studentId})</option>)}
            </select>
            <button disabled={busy || !studentId} onClick={() => run(() => getTeacherStudentAIInsights(studentId))} className="mt-2 rounded-xl bg-indigo-600 text-white px-4 py-2 text-xs font-bold">
              {busy ? <Loader2 className="inline animate-spin w-4 h-4" /> : <Sparkles className="inline w-4 h-4" />} Analyze student
            </button>
          </div>
          <div>
            <select value={sessionId} onChange={(event) => setSessionId(event.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm">
              <option value="">Select completed class</option>
              {sessions.map((session) => <option key={session.id} value={session.id}>{session.title} · {session.student}</option>)}
            </select>
            <button disabled={busy || !sessionId} onClick={() => run(() => getTeacherClassAIInsights(sessionId))} className="mt-2 rounded-xl bg-emerald-600 text-white px-4 py-2 text-xs font-bold">Analyze class</button>
          </div>
        </div>
      </section>
      {result && <section className="bg-white border border-slate-200 rounded-2xl p-5 text-sm space-y-4">
        <div>
          <h2 className="font-bold">Advisory insight</h2>
          <p className="mt-2">{result.overall || result.summary}</p>
          {result.insights && <ul className="list-disc pl-5">{result.insights.map((item) => <li key={item}>{item}</li>)}</ul>}
          {result.strongSubjects && <p className="mt-2"><strong>Strong areas:</strong> {result.strongSubjects.join(', ') || 'None recorded'}</p>}
          {(result.weakSubjects || result.focusAreas) && <p><strong>Focus areas:</strong> {(result.weakSubjects || result.focusAreas).join(', ') || 'None recorded'}</p>}
          {result.followUp && <p className="mt-2"><strong>Suggested follow-up:</strong> {result.followUp}</p>}
        </div>
        {academic && <div>
          <h2 className="font-bold">Recorded academic data</h2>
          <p className="mt-2">Attendance: {academic.attendance?.percentage == null ? 'No recorded data' : `${academic.attendance.percentage}% (${academic.attendance.present}/${academic.attendance.total})`}</p>
          <p>Assignments: {academic.assignments?.submitted ?? 0} submitted, {academic.assignments?.pending ?? 0} pending of {academic.assignments?.total ?? 0}</p>
          <p className="mt-2 font-semibold">Marks by subject</p>
          {academic.subjects?.length ? academic.subjects.map((subject) => (
            <p key={subject.subject}>{subject.subject}: {subject.percentage}% across {subject.assessments} assessment(s)</p>
          )) : <p>No marks are recorded.</p>}
          <p className="mt-2 font-semibold">Teacher feedback</p>
          {academic.teacherFeedback?.length ? academic.teacherFeedback.map((item, index) => (
            <p key={`${item.feedback}-${index}`}>{item.feedback || item.improvementTopics || item.understandingLevel || 'Feedback recorded'}</p>
          )) : <p>No teacher feedback is recorded.</p>}
        </div>}
      </section>}
    </div>
  );
};

export default TeacherAIInsights;