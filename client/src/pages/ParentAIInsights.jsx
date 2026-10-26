import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { getMyChildren, getChildAIInsights } from '../services/parentService';

const ParentAIInsights = ({ onNavigateBack }) => {
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyChildren().then((response) => {
      if (response.success) setChildren(response.data.children || []);
      else setError(response.error);
    }).catch(() => setError('Unable to load authorized children.'));
  }, []);

  const generate = async () => {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const response = await getChildAIInsights(selected);
      if (response.success) setResult(response.data);
      else setError(response.error);
    } catch {
      setError('Unable to load child insights. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const academic = result?.academicSummary;
  const insights = result?.insights;

  return (
    <div className="max-w-5xl mx-auto my-6 px-4 space-y-6">
      <div>
        <button onClick={onNavigateBack} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </button>
        <h1 className="text-3xl font-black text-slate-900">Child Insights</h1>
        <p className="text-sm text-slate-500 mt-1">A limited summary based only on your authorized child’s academic records.</p>
      </div>
      {error && <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</p>}
      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <select value={selected} onChange={(event) => setSelected(event.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm">
          <option value="">Select authorized child</option>
          {children.map((child) => <option key={child.studentId} value={child.studentId}>{child.name}</option>)}
        </select>
        <button disabled={busy || !selected} onClick={generate} className="mt-3 rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-bold">
          {busy ? <Loader2 className="inline w-4 h-4 animate-spin" /> : <Sparkles className="inline w-4 h-4" />} Generate insights
        </button>
      </section>
      {result && <section className="bg-white border border-slate-200 rounded-2xl p-5 text-sm space-y-4">
        <div>
          <h2 className="font-bold">Academic summary</h2>
          <p className="mt-2">Attendance: {academic?.attendance?.percentage == null ? 'No recorded data' : `${academic.attendance.percentage}% (${academic.attendance.present}/${academic.attendance.total})`}</p>
          <p>Assignments: {academic?.assignments?.submitted ?? 0} submitted, {academic?.assignments?.pending ?? 0} pending of {academic?.assignments?.total ?? 0}</p>
          <p className="mt-2 font-semibold">Recorded performance</p>
          {academic?.subjects?.length ? academic.subjects.map((subject) => (
            <p key={subject.subject}>{subject.subject}: {subject.percentage}% across {subject.assessments} assessment(s)</p>
          )) : <p>No marks are recorded.</p>}
          <p className="mt-2 font-semibold">Teacher feedback</p>
          {academic?.teacherFeedback?.length ? academic.teacherFeedback.map((item, index) => (
            <p key={`${item.feedback}-${index}`}>{item.feedback || item.improvementTopics || item.understandingLevel || 'Feedback recorded'}</p>
          )) : <p>No teacher feedback is recorded.</p>}
        </div>
        <div>
          <h2 className="font-bold">Advisory insights</h2>
          <p className="mt-2">{insights?.overall || 'There is not enough recorded data for a conclusion.'}</p>
          <ul className="list-disc pl-5">{(insights?.insights || []).map((item) => <li key={item}>{item}</li>)}</ul>
          <p className="mt-2"><strong>Strong subjects:</strong> {(insights?.strongSubjects || []).join(', ') || 'No recorded strong subjects yet'}</p>
          <p><strong>Focus areas:</strong> {(insights?.focusAreas || []).join(' ') || 'No recorded focus areas'}</p>
        </div>
      </section>}
    </div>
  );
};

export default ParentAIInsights;