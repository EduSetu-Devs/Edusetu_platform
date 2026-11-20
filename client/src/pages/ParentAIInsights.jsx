import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Sparkles, CheckCircle2, BookOpen, Award, Target, Brain, Info } from 'lucide-react';
import { getMyChildren, getChildAIInsights } from '../services/parentService';

const ParentAIInsights = ({ onNavigateBack }) => {
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadInsightsForChild = useCallback(async (studentId) => {
    if (!studentId) return;
    setBusy(true);
    setError('');
    try {
      const response = await getChildAIInsights(studentId);
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setResult(null);
        setError(response.error || 'Unable to generate insights for this child.');
      }
    } catch {
      setResult(null);
      setError('Unable to generate insights. Please try again.');
    } finally {
      setBusy(false);
    }
  }, []);

  const loadChildren = useCallback(async () => {
    setError('');
    try {
      const response = await getMyChildren();
      if (response.success && Array.isArray(response.data?.children)) {
        setChildren(response.data.children);
        if (response.data.children.length > 0) {
          const firstId = response.data.children[0].studentId;
          setSelected(firstId);
          await loadInsightsForChild(firstId);
        } else {
          setChildren([]);
          setSelected('');
          setResult(null);
        }
      } else {
        setChildren([]);
        setSelected('');
        setResult(null);
        setError(response.error || 'Unable to load linked children.');
      }
    } catch {
      setChildren([]);
      setSelected('');
      setResult(null);
      setError('Unable to load linked children. Please try again.');
    }
  }, [loadInsightsForChild]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  const handleSelectChange = (e) => {
    const studentId = e.target.value;
    setSelected(studentId);
    setResult(null);
    if (studentId) {
      loadInsightsForChild(studentId);
    }
  };

  const academic = result?.academicSummary;
  const insights = result?.insights;

  return (
    <div className="max-w-5xl mx-auto my-6 px-4 space-y-6 animate-fadeIn">
      {/* Top Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors mb-2 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Back to Parent Dashboard</span>
            </button>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center space-x-2">
            <span>Child Academic AI Insights</span>
            <Sparkles className="w-6 h-6 text-emerald-600" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Personalized academic summary, performance trends, and advisory insights based on official school records.
          </p>
        </div>

        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="sm:self-start px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors hidden sm:inline-flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-4 flex items-start space-x-2.5 text-xs text-indigo-900 leading-relaxed">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p>
          <strong>AI-generated advisory content.</strong> Output may be incomplete or inaccurate and is not a substitute
          for a teacher's professional judgement. Review official records before acting.{' '}
          <a href="/terms" className="font-bold underline">Terms</a>{' '}
          <span aria-hidden="true">·</span>{' '}
          <a href="/privacy" className="font-bold underline">Privacy</a>
        </p>
      </div>

      {error && <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</p>}

      {/* Child Selector Control Card */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Select Linked Child for Analysis:
          </label>

          {children.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No linked student profiles are available for this account. Ask your school administrator to link your
              child before using AI insights.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selected}
                onChange={handleSelectChange}
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:outline-emerald-600 focus:bg-white transition-all"
              >
                {children.map((child) => (
                  <option key={child.studentId} value={child.studentId}>
                    {child.name}{child.className ? ` (Class ${child.className}${child.section ? `-${child.section}` : ''})` : ''}
                  </option>
                ))}
              </select>

              <button
                disabled={busy || !selected}
                onClick={() => loadInsightsForChild(selected)}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Records...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Refresh AI Insights</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {!result && !busy && children.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-sm text-slate-600">
          Select a child and choose <strong>Refresh AI Insights</strong> to generate an advisory summary from recorded
          school data.
        </section>
      )}

      {/* Insights Results */}
      {result && (
        <section className="space-y-6">
          {/* Executive Advisory Banner */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-md space-y-3">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-amber-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">AI Pedagogical Assessment</span>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-emerald-50">
              {insights?.overall || insights?.summary || 'No advisory summary was generated from the available records.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Academic Metric Summary */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Academic Summary</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase text-emerald-700">Attendance Rate</span>
                  <p className="text-xl font-black text-emerald-900 mt-1">
                    {academic?.attendance?.percentage == null ? 'No data' : `${academic.attendance.percentage}%`}
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    {academic?.attendance?.total == null
                      ? 'No attendance recorded'
                      : `${academic.attendance.present ?? 0} / ${academic.attendance.total} sessions`}
                  </p>
                </div>

                <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="text-[10px] font-bold uppercase text-blue-700">Assignments Completed</span>
                  <p className="text-xl font-black text-blue-900 mt-1">
                    {academic?.assignments?.submitted ?? 0} / {academic?.assignments?.total ?? 0}
                  </p>
                  <p className="text-[10px] text-blue-700 mt-0.5">
                    {academic?.assignments?.pending ?? 0} pending
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Subject Scores Evaluated:</h4>
                {academic?.subjects?.length ? (
                  <div className="space-y-2">
                    {academic.subjects.map((sub) => (
                      <div key={sub.subject} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                        <span className="font-semibold text-slate-800">{sub.subject}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-slate-400">{sub.assessments} tests</span>
                          <span className="font-bold text-emerald-700 px-2 py-0.5 bg-emerald-100/60 rounded-md">
                            {sub.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">No marks are recorded yet.</p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-1.5">Teacher Observations:</h4>
                {academic?.teacherFeedback?.length ? (
                  <div className="space-y-2">
                    {academic.teacherFeedback.map((item, idx) => (
                      <p key={`${item.feedback || item.understandingLevel || 'feedback'}-${idx}`} className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                        "{item.feedback || item.understandingLevel || 'Teacher feedback recorded.'}"
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">No teacher feedback is recorded.</p>
                )}
              </div>
            </div>

            {/* Card 2: Strengths & Growth Areas */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <Target className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Strengths & Advisory Focus</h3>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Key Strengths</span>
                </h4>
                {insights?.strongSubjects?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {insights.strongSubjects.map((item, idx) => (
                      <span key={`${item}-${idx}`} className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No strengths were identified from recorded data.</p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
                  <Target className="w-4 h-4 text-amber-600" />
                  <span>Recommended Focus Areas</span>
                </h4>
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 font-medium">
                  {insights?.focusAreas?.length
                    ? insights.focusAreas.join(' ')
                    : 'No specific focus areas were identified from recorded data.'}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Core Takeaways:</h4>
                {insights?.insights?.length ? (
                  <ul className="space-y-2 text-xs text-slate-700">
                    {insights.insights.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="flex items-start space-x-2 bg-slate-50 p-2.5 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">No advisory takeaways were generated.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Bottom Back Button */}
      {onNavigateBack && (
        <div className="pt-4 border-t border-slate-200 flex justify-center">
          <button
            onClick={onNavigateBack}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Return to Parent Dashboard</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ParentAIInsights;
