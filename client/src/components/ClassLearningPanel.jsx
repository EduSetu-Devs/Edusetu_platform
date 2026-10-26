import React, { useEffect, useState } from 'react';
import { Download, FileText, Loader2, Save, Upload } from 'lucide-react';
import apiClient from '../services/api';
import { getClassResources, uploadClassResource, saveClassNote, saveClassFeedback, getClassSummary } from '../services/teacherService';
import { getStudentClassResources, getStudentClassSummary } from '../services/studentService';

const ClassLearningPanel = ({ session, isTeacher = false }) => {
  const [resources, setResources] = useState([]);
  const [summary, setSummary] = useState(null);
  const [note, setNote] = useState(session.note?.content || '');
  const [feedback, setFeedback] = useState({ understandingLevel: session.feedback?.understandingLevel || 'Good', feedback: session.feedback?.feedback || '', improvementTopics: session.feedback?.improvementTopics || '', homeworkRecommendation: session.feedback?.homeworkRecommendation || '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    const [resourceResult, summaryResult] = await Promise.all([isTeacher ? getClassResources(session.id) : getStudentClassResources(session.id), isTeacher ? getClassSummary(session.id) : getStudentClassSummary(session.id)]);
    if (resourceResult.success) setResources(resourceResult.data.resources || []);
    if (summaryResult.success) {
      setSummary(summaryResult.data);
      setNote(summaryResult.data.note?.content || session.note?.content || '');
      if (summaryResult.data.feedback) setFeedback((current) => ({ ...current, ...summaryResult.data.feedback }));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [session.id]);

  const saveNoteAndFeedback = async () => {
    setBusy(true); setMessage('');
    const noteResult = await saveClassNote(session.id, note);
    const feedbackResult = await saveClassFeedback(session.id, feedback);
    setBusy(false);
    setMessage(noteResult.success && feedbackResult.success ? 'Notes and feedback saved.' : noteResult.error || feedbackResult.error);
    load();
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setMessage('');
    const result = await uploadClassResource(session.id, file);
    setBusy(false); setMessage(result.success ? 'Resource uploaded.' : result.error);
    if (result.success) load();
    event.target.value = '';
  };

  const download = async (resource) => {
    const response = await apiClient.get(`/teaching-resources/${resource.id}`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = resource.filename; anchor.click(); URL.revokeObjectURL(url);
  };

  return <section className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs" onClick={(event) => event.stopPropagation()}>
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2"><h4 className="font-bold text-slate-800">Class Resources</h4>{isTeacher && <label className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600 text-white font-bold cursor-pointer"><Upload className="w-3 h-3" /> Upload<input type="file" className="hidden" accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp" onChange={upload} /></label>}</div>
      {loading ? <Loader2 className="animate-spin text-indigo-600" /> : resources.length === 0 ? <p className="text-slate-500">No resources shared yet.</p> : <div className="space-y-2">{resources.map((resource) => <div key={resource.id} className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg p-2"><span className="truncate"><FileText className="inline w-3.5 h-3.5 mr-1 text-indigo-600" />{resource.filename}</span><button onClick={() => download(resource)} title="Download resource" className="p-1 text-indigo-600"><Download className="w-4 h-4" /></button></div>)}</div>}
    </div>
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3"><h4 className="font-bold text-slate-800 mb-2">Class Notes</h4>{isTeacher ? <textarea value={note} onChange={(event) => setNote(event.target.value)} rows="7" placeholder="Add notes for this class" className="w-full rounded-lg border border-slate-200 p-2 text-sm" /> : <p className="whitespace-pre-wrap text-slate-700">{note || 'No notes shared yet.'}</p>}</div>
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3"><h4 className="font-bold text-slate-800 mb-2">{isTeacher ? 'Class Feedback' : 'Teacher Feedback'}</h4>{isTeacher ? <div className="space-y-2"><select value={feedback.understandingLevel} onChange={(event) => setFeedback({ ...feedback, understandingLevel: event.target.value })} className="w-full rounded-lg border border-slate-200 p-2"><option>Excellent</option><option>Good</option><option>Needs practice</option><option>Needs support</option></select><textarea value={feedback.feedback} onChange={(event) => setFeedback({ ...feedback, feedback: event.target.value })} rows="3" placeholder="Student performance feedback" className="w-full rounded-lg border border-slate-200 p-2" /><input value={feedback.improvementTopics} onChange={(event) => setFeedback({ ...feedback, improvementTopics: event.target.value })} placeholder="Topics to improve" className="w-full rounded-lg border border-slate-200 p-2" /><input value={feedback.homeworkRecommendation} onChange={(event) => setFeedback({ ...feedback, homeworkRecommendation: event.target.value })} placeholder="Optional homework recommendation" className="w-full rounded-lg border border-slate-200 p-2" /><button disabled={busy} onClick={saveNoteAndFeedback} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 text-white px-3 py-2 font-bold"><Save className="w-3 h-3" /> Save</button></div> : <div className="space-y-1 text-slate-700"><p><strong>Understanding:</strong> {feedback.understandingLevel || 'Not provided'}</p><p>{feedback.feedback || 'No feedback shared yet.'}</p>{feedback.improvementTopics && <p><strong>Practice:</strong> {feedback.improvementTopics}</p>}{feedback.homeworkRecommendation && <p><strong>Recommendation:</strong> {feedback.homeworkRecommendation}</p>}</div>}</div>
    {summary && <div className="lg:col-span-3 rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-900"><strong>Class summary:</strong> Scheduled {summary.scheduledDuration} min · Actual {summary.actualDuration} min · Student attended {summary.studentAttendanceMinutes} min ({summary.studentAttendanceStatus})</div>}
    {message && <p className="lg:col-span-3 text-xs text-emerald-700">{message}</p>}
  </section>;
};

export default ClassLearningPanel;
