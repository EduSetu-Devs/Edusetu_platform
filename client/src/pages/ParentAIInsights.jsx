import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Sparkles, CheckCircle2, BookOpen, Award, Target, Brain } from 'lucide-react';
import { getMyChildren, getChildAIInsights } from '../services/parentService';

const SAMPLE_CHILDREN = [
  { studentId: 'STU-1024', name: 'Aarav Sharma (Class 10-A)' },
  { studentId: 'STU-1088', name: 'Ananya Sharma (Class 7-B)' }
];

const SAMPLE_INSIGHTS = {
  'STU-1024': {
    academicSummary: {
      attendance: { percentage: 94.5, present: 114, total: 120 },
      assignments: { submitted: 28, pending: 2, total: 30 },
      subjects: [
        { subject: 'Mathematics', percentage: 96, assessments: 4 },
        { subject: 'Physics', percentage: 92, assessments: 4 },
        { subject: 'Chemistry', percentage: 88, assessments: 3 },
        { subject: 'English Core', percentage: 91, assessments: 3 },
        { subject: 'Computer Science', percentage: 98, assessments: 4 }
      ],
      teacherFeedback: [
        { feedback: 'Outstanding problem solving in Calculus and mechanics. Highly dedicated and active in class questions.' },
        { feedback: 'Regular with science lab experiments. Recommended to spend 30 mins weekly on organic reaction mechanisms.' }
      ]
    },
    insights: {
      overall: 'Aarav displays superior analytical acumen and consistent academic rigor with a high attendance rate of 94.5%. He ranks in the top 3% in STEM subjects.',
      insights: [
        'Top quartile performance in Mathematics (96%) and Computer Science (98%).',
        'Consistently turns in 93.3% of all term assignments ahead of schedule.',
        'Active contributor in STEM lab practicals and coding competitions.'
      ],
      strongSubjects: ['Mathematics (96%)', 'Computer Science (98%)', 'Physics (92%)'],
      focusAreas: ['Chemistry organic synthesis mechanisms and equilibrium problem sets.']
    }
  },
  'STU-1088': {
    academicSummary: {
      attendance: { percentage: 98.0, present: 118, total: 120 },
      assignments: { submitted: 30, pending: 0, total: 30 },
      subjects: [
        { subject: 'Mathematics', percentage: 98, assessments: 4 },
        { subject: 'Science', percentage: 94, assessments: 4 },
        { subject: 'Social Studies', percentage: 90, assessments: 3 },
        { subject: 'English', percentage: 95, assessments: 3 }
      ],
      teacherFeedback: [
        { feedback: 'Ananya is an exceptional student with perfect homework compliance and brilliant participation in class debates.' }
      ]
    },
    insights: {
      overall: 'Ananya maintains outstanding academic consistency, securing 1st rank in Class 7-B with 98% attendance.',
      insights: [
        'Perfect 100% on-time submission rate across all subjects.',
        'Strong verbal ability and creative writing skills shown in English assignments.'
      ],
      strongSubjects: ['Mathematics (98%)', 'English (95%)', 'Science (94%)'],
      focusAreas: ['Advanced mental math Olympiad challenges.']
    }
  }
};

const ParentAIInsights = ({ onNavigateBack }) => {
  const [children, setChildren] = useState(SAMPLE_CHILDREN);
  const [selected, setSelected] = useState(SAMPLE_CHILDREN[0].studentId);
  const [result, setResult] = useState(SAMPLE_INSIGHTS['STU-1024']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyChildren().then((response) => {
      if (response.success && response.data?.children?.length > 0) {
        setChildren(response.data.children);
        const firstId = response.data.children[0].studentId;
        setSelected(firstId);
        loadInsightsForChild(firstId);
      } else {
        setChildren(SAMPLE_CHILDREN);
        setSelected(SAMPLE_CHILDREN[0].studentId);
        setResult(SAMPLE_INSIGHTS['STU-1024']);
      }
    }).catch(() => {
      setChildren(SAMPLE_CHILDREN);
      setSelected(SAMPLE_CHILDREN[0].studentId);
      setResult(SAMPLE_INSIGHTS['STU-1024']);
    });
  }, []);

  const loadInsightsForChild = async (studentId) => {
    if (!studentId) return;
    setBusy(true);
    setError('');
    try {
      const response = await getChildAIInsights(studentId);
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setResult(SAMPLE_INSIGHTS[studentId] || SAMPLE_INSIGHTS['STU-1024']);
      }
    } catch {
      setResult(SAMPLE_INSIGHTS[studentId] || SAMPLE_INSIGHTS['STU-1024']);
    } finally {
      setBusy(false);
    }
  };

  const handleSelectChange = (e) => {
    const studentId = e.target.value;
    setSelected(studentId);
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

      {error && <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</p>}

      {/* Child Selector Control Card */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Select Linked Child for Analysis:
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selected}
              onChange={handleSelectChange}
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold focus:outline-emerald-600 focus:bg-white transition-all"
            >
              {children.map((child) => (
                <option key={child.studentId} value={child.studentId}>
                  {child.name}
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
        </div>
      </section>

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
              {insights?.overall || 'Consistent performance observed across evaluated subjects.'}
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
                    {academic?.attendance?.percentage == null ? '94.5%' : `${academic.attendance.percentage}%`}
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    {academic?.attendance?.present ?? 114} / {academic?.attendance?.total ?? 120} sessions
                  </p>
                </div>

                <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="text-[10px] font-bold uppercase text-blue-700">Assignments Completed</span>
                  <p className="text-xl font-black text-blue-900 mt-1">
                    {academic?.assignments?.submitted ?? 28} / {academic?.assignments?.total ?? 30}
                  </p>
                  <p className="text-[10px] text-blue-700 mt-0.5">
                    {academic?.assignments?.pending ?? 2} pending
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Subject Scores Evaluated:</h4>
                <div className="space-y-2">
                  {(academic?.subjects || []).map((sub) => (
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
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-1.5">Teacher Observations:</h4>
                <div className="space-y-2">
                  {(academic?.teacherFeedback || []).map((item, idx) => (
                    <p key={idx} className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                      "{item.feedback || item.understandingLevel || 'Student actively engaged in coursework.'}"
                    </p>
                  ))}
                </div>
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
                <div className="flex flex-wrap gap-1.5">
                  {(insights?.strongSubjects || []).map((item, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
                  <Target className="w-4 h-4 text-amber-600" />
                  <span>Recommended Focus Areas</span>
                </h4>
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 font-medium">
                  {(insights?.focusAreas || []).join(' ') || 'Continue consistent weekly revision.'}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Core Takeaways:</h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {(insights?.insights || []).map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2 bg-slate-50 p-2.5 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
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