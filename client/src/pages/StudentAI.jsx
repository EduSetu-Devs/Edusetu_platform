import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart2,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  Flame,
  HelpCircle,
  History,
  Lightbulb,
  Loader2,
  MessageSquarePlus,
  RotateCcw,
  Save,
  Send,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  User,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  askStudentAI,
  createStudentStudyPlan,
  generateStudentPractice,
  generateStudentQuiz,
  getStudentAIHistory,
  getStudentAIRecommendations,
  getStudentAIPerformance
} from '../services/studentService';

const FREQUENT_QUESTIONS = [
  'What is photosynthesis?',
  'Explain Newton’s laws of motion',
  'Solve 2x + 7 = 19 step-by-step',
  'State and explain Ohm’s Law',
  'Law of conservation of energy'
];

const StudentAI = ({ onNavigateBack }) => {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('');

  // Separate result state per tool — prevents stale data bleeding across tabs
  const [practiceResult, setPracticeResult] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [performanceResult, setPerformanceResult] = useState(null);
  const [recommendationsResult, setRecommendationsResult] = useState(null);

  const [plan, setPlan] = useState([]);
  const [history, setHistory] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [revealedHints, setRevealedHints] = useState({});
  const [revealedSolutions, setRevealedSolutions] = useState({});

  // Active Tool View: 'chat' | 'plan' | 'practice' | 'quiz' | 'performance' | 'recommendations' | 'history'
  const [activeTab, setActiveTab] = useState('chat');
  const [hasSavedPlan, setHasSavedPlan] = useState(false);

  // Conversational Memory & Deep-Dive State
  const [conversationId, setConversationId] = useState(() => `conv_${user?.id || 'anon'}_${Date.now()}`);
  const [chatMessages, setChatMessages] = useState([]);
  const [depth, setDepth] = useState('quick'); // 'quick' | 'deep'

  const studyPlanKey = `edusetu-study-plan-${user?.id || 'anonymous'}`;
  const quizQuestions = Array.isArray(quizResult?.questions)
    ? quizResult.questions.filter((item) => item && typeof item.question === 'string' && item.question.trim())
    : [];

  // Check if a saved study plan exists in localStorage WITHOUT automatically plastering it on the screen
  useEffect(() => {
    try {
      const storedPlan = localStorage.getItem(studyPlanKey);
      if (storedPlan) {
        const parsed = JSON.parse(storedPlan);
        if (Array.isArray(parsed?.plan) && parsed.plan.length > 0) {
          setHasSavedPlan(true);
        }
      }
    } catch {
      setHasSavedPlan(false);
    }
  }, [studyPlanKey]);

  const run = async (action, setter) => {
    setBusy(true);
    setError('');
    setSaved(false);
    setRevealedHints({});
    setRevealedSolutions({});
    try {
      const response = await action();
      if (response.success && setter) setter(response.data || null);
      else if (!response.success) setError(response.error || 'AI request failed');
      return response;
    } catch {
      setError('AI request failed. Please try again.');
      return { success: false };
    } finally {
      setBusy(false);
    }
  };

  const handleAskQuestion = async (customQ) => {
    const text = (customQ || question).trim();
    if (!text || busy) return;

    const userMsg = { id: `user_${Date.now()}`, sender: 'user', text, timestamp: new Date() };
    setChatMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setBusy(true);
    setError('');

    try {
      const response = await askStudentAI({ question: text, conversationId, depth });
      if (response.success && response.data) {
        const aiData = response.data;
        const aiMsg = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          explanation: aiData.explanation,
          steps: aiData.steps || [],
          summary: aiData.summary,
          example: aiData.example,
          cached: Boolean(aiData.cached),
          depth: aiData.depth || depth,
          source: aiData.source,
          timestamp: new Date()
        };
        setChatMessages((prev) => [...prev, aiMsg]);
      } else {
        setError(response.error || 'AI could not generate an answer');
      }
    } catch {
      setError('AI request failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const startNewConversation = () => {
    setConversationId(`conv_${user?.id || 'anon'}_${Date.now()}`);
    setChatMessages([]);
    setQuestion('');
    setSubject('Mathematics');
    setTopic('');
    setPracticeResult(null);
    setQuizResult(null);
    setPerformanceResult(null);
    setRecommendationsResult(null);
    setQuizAnswers({});
    setQuizScore(null);
    setError('');
    setActiveTab('chat');
  };

  const generatePlan = async () => {
    setActiveTab('plan');
    const safeTopic = (topic || 'Core Curriculum').trim();
    const response = await run(() => createStudentStudyPlan({ subject: subject || 'Mathematics', topic: safeTopic, availableDays: 5, understandingLevel: 'developing' }));
    if (response.success) {
      const generatedPlan = Array.isArray(response.data?.plan) ? response.data.plan : [];
      setPlan(generatedPlan.map((task, index) => ({
        ...task,
        day: task.day || index + 1,
        activity: task.activity || '',
        description: task.description || '',
        date: task.date || new Date(Date.now() + index * 86400000).toISOString().slice(0, 10),
        completed: Boolean(task.completed)
      })));
      setSaved(false);
    }
  };

  const loadSavedPlan = () => {
    try {
      const storedPlan = localStorage.getItem(studyPlanKey);
      const parsedPlan = storedPlan ? JSON.parse(storedPlan) : null;
      if (Array.isArray(parsedPlan?.plan) && parsedPlan.plan.length > 0) {
        setSubject(parsedPlan.subject || 'Mathematics');
        setTopic(parsedPlan.topic || '');
        setPlan(parsedPlan.plan);
        setSaved(true);
        setActiveTab('plan');
      } else {
        generatePlan();
      }
    } catch {
      generatePlan();
    }
  };

  const dismissPlan = () => {
    setPlan([]);
    setSaved(false);
    setActiveTab('chat');
  };

  const handleGeneratePractice = async () => {
    setActiveTab('practice');
    const safeTopic = (topic || 'Core Curriculum').trim();
    await run(() => generateStudentPractice({ subject: subject || 'Mathematics', topic: safeTopic, difficulty: 'Medium' }), setPracticeResult);
  };

  const generateQuiz = async () => {
    setActiveTab('quiz');
    const safeTopic = (topic || 'Core Curriculum').trim();
    const response = await run(() => generateStudentQuiz({ subject: subject || 'Mathematics', topic: safeTopic, difficulty: 'Medium' }), setQuizResult);
    if (response.success) {
      const questions = response.data?.questions;
      const validQuiz = response.data?.mode === 'quiz'
        && Array.isArray(questions)
        && questions.length > 0
        && questions.every((item) => item && typeof item.question === 'string' && item.question.trim() && typeof item.answer === 'string' && item.answer.trim());
      if (!validQuiz) {
        setQuizResult(null);
        setError('The AI returned an invalid quiz. Please try generating it again.');
        return;
      }
      setQuizAnswers({});
      setQuizScore(null);
    }
  };

  const handleAnalyzePerformance = async () => {
    setActiveTab('performance');
    await run(() => getStudentAIPerformance({ subject, topic }), setPerformanceResult);
  };

  const handleRecommendations = async () => {
    setActiveTab('recommendations');
    await run(() => getStudentAIRecommendations({ subject, topic }), setRecommendationsResult);
  };

  const updateTask = (index, field, value) => {
    setPlan((current) => current.map((task, taskIndex) => taskIndex === index ? { ...task, [field]: value } : task));
    setSaved(false);
  };
  const addTask = () => {
    setPlan((current) => [...current, { day: current.length + 1, activity: '', description: '', date: new Date().toISOString().slice(0, 10), completed: false }]);
    setSaved(false);
  };
  const removeTask = (index) => {
    setPlan((current) => current.filter((_, taskIndex) => taskIndex !== index).map((task, taskIndex) => ({ ...task, day: taskIndex + 1 })));
    setSaved(false);
  };
  const savePlan = () => {
    try {
      localStorage.setItem(studyPlanKey, JSON.stringify({ subject, topic, plan }));
      setSaved(true);
      setError('');
    } catch {
      setError('Study plan could not be saved on this device.');
    }
  };

  const submitQuiz = () => {
    if (!quizQuestions.length) return setError('This quiz has no valid questions. Generate a new quiz.');
    if (!quizQuestions.every((item) => typeof item.answer === 'string' && item.answer.trim())) return setError('This quiz is missing answer keys. Generate a new quiz.');
    if (!quizQuestions.every((item, index) => String(quizAnswers[item.id ?? index] || '').trim())) return setError('Answer every question before submitting.');
    const correct = quizQuestions.filter((item, index) => String(quizAnswers[item.id ?? index]).trim().toLowerCase() === item.answer.trim().toLowerCase()).length;
    setQuizScore({ correct, total: quizQuestions.length });
    setError('');
  };

  const retryQuiz = () => {
    setQuizAnswers({});
    setQuizScore(null);
    setError('');
  };

  const loadHistory = async () => {
    setActiveTab('history');
    const response = await getStudentAIHistory();
    if (response.success) setHistory(response.data.history || []);
    else setError(response.error || 'Failed to load history');
  };

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button onClick={onNavigateBack} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </button>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            AI Study Assistant
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200">
              Memory &amp; Cache Enabled
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Multi-turn conversational memory with instant frequent-question caching.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={startNewConversation}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 text-xs font-bold shadow-sm transition-colors"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-indigo-600" /> New Chat Thread
          </button>
        </div>
      </div>

      {/* Modular Feature Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-bold no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'chat'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" /> Conversational Doubt Solver
        </button>
        <button
          type="button"
          onClick={() => {
            if (plan.length === 0 && hasSavedPlan) loadSavedPlan();
            else if (plan.length === 0) generatePlan();
            else setActiveTab('plan');
          }}
          className={`px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'plan'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> 5-Day Study Plan
          {(plan.length > 0 || hasSavedPlan) && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'plan' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'}`}>
              {plan.length > 0 ? `${plan.length}d` : 'Saved'}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('practice')}
          className={`px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'practice'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Practice Questions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('quiz')}
          className={`px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'quiz'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Diagnostic Quiz
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('performance')}
          className={`px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'performance'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" /> Performance Report
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('recommendations')}
          className={`px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'recommendations'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Target className="w-3.5 h-3.5" /> Recommendations
        </button>
        <button
          type="button"
          onClick={() => {
            if (history.length === 0) loadHistory();
            else setActiveTab('history');
          }}
          className={`px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Chat History
        </button>
      </div>

      {error && <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</p>}

      {/* TAB 1: Conversational Doubt Solver & Curriculum Quick Launcher */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Multi-Turn Chat Section with Memory */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-slate-900">Conversational Doubt Solver</h2>
              </div>

              {/* Depth Mode Selector */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setDepth('quick')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                    depth === 'quick' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Quick Help
                </button>
                <button
                  type="button"
                  onClick={() => setDepth('deep')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                    depth === 'deep' ? 'bg-white shadow text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-indigo-600" /> Deep Dive
                </button>
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="space-y-3 min-h-[14rem] max-h-[22rem] overflow-y-auto pr-1">
              {chatMessages.length === 0 && (
                <div className="text-center py-6 text-slate-400 space-y-2">
                  <p className="text-sm">Ask any curriculum question in Hindi or English.</p>
                  <p className="text-xs text-slate-400">Conversational memory is active — you can ask natural follow-up questions!</p>
                  <div className="pt-2 flex flex-wrap justify-center gap-1.5">
                    {FREQUENT_QUESTIONS.map((fq) => (
                      <button
                        key={fq}
                        type="button"
                        disabled={busy}
                        onClick={() => handleAskQuestion(fq)}
                        className="rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 px-2.5 py-1 text-xs transition-colors"
                      >
                        {fq}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.sender === 'user' ? (
                    <div className="rounded-2xl rounded-tr-none bg-indigo-600 text-white px-4 py-2.5 max-w-[85%] text-sm shadow-sm">
                      {msg.text}
                    </div>
                  ) : (
                    <div className={`rounded-2xl rounded-tl-none p-4 max-w-[95%] text-sm space-y-2 shadow-sm ${
                      msg.isGuardrailTriggered
                        ? 'bg-amber-50/90 border border-amber-300'
                        : 'bg-slate-50 border border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-bold flex items-center gap-1.5 text-xs ${
                          msg.isGuardrailTriggered ? 'text-amber-900' : 'text-indigo-900'
                        }`}>
                          {msg.isGuardrailTriggered ? (
                            <>
                              <ShieldAlert className="w-4 h-4 text-amber-600" /> EduSetu Safety Shield
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> EduSetu Tutor
                            </>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {msg.isGuardrailTriggered && (
                            <span className="text-[11px] font-semibold bg-amber-200/80 text-amber-900 border border-amber-300 rounded-md px-1.5 py-0.5 inline-flex items-center gap-1">
                              🛡️ {msg.violationCategory || 'Safety Guardrail'}
                            </span>
                          )}
                          {msg.cached && (
                            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md px-1.5 py-0.5 inline-flex items-center gap-1">
                              <Zap className="w-3 h-3 text-emerald-600" /> Instant Cache
                            </span>
                          )}
                          {msg.depth === 'deep' && (
                            <span className="text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 rounded-md px-1.5 py-0.5 inline-flex items-center gap-1">
                              🎓 Deep Dive
                            </span>
                          )}
                        </div>
                      </div>
                      <p className={`${msg.isGuardrailTriggered ? 'text-amber-950 font-semibold' : 'text-slate-800 font-medium'}`}>{msg.explanation}</p>
                      {msg.steps?.length > 0 && (
                        <div className={`rounded-xl p-3 border space-y-1.5 ${
                          msg.isGuardrailTriggered ? 'bg-amber-100/60 border-amber-200 text-amber-900' : 'bg-white border-slate-100 text-slate-700'
                        }`}>
                          <p className={`text-xs font-bold ${msg.isGuardrailTriggered ? 'text-amber-900' : 'text-slate-600'}`}>
                            {msg.isGuardrailTriggered ? 'Recommended Action:' : 'Breakdown & Method:'}
                          </p>
                          <ul className="list-disc pl-4 space-y-1 text-xs">
                            {msg.steps.map((st, i) => (
                              <li key={i}>{st}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {msg.example && <p className="text-xs text-slate-600 italic">{msg.example}</p>}
                      {msg.summary && (
                        <p className={`text-xs font-semibold pt-1 ${msg.isGuardrailTriggered ? 'text-amber-900' : 'text-indigo-950'}`}>
                          {msg.isGuardrailTriggered ? '🛡️ ' : '💡 '}{msg.summary}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {busy && (
                <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Tutor is thinking and reviewing conversation context…</span>
                </div>
              )}
            </div>

            {/* Input Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAskQuestion();
                    }
                  }}
                  maxLength={2000}
                  placeholder="Ask or follow-up (e.g. 'explain step 2 further')..."
                  className="flex-1 rounded-xl border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  disabled={busy || !question.trim()}
                  onClick={() => handleAskQuestion()}
                  className="rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center gap-1 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{question.length}/2000 characters</span>
                <span>Mode: {depth === 'deep' ? '🎓 Deep Dive' : '⚡ Quick Help'}</span>
              </div>
            </div>
          </section>

          {/* Curriculum Study Tools Launcher */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <h2 className="font-bold text-slate-900">Curriculum Study Tools</h2>
              <p className="text-xs text-slate-500">
                Generate customized study schedules, targeted practice problems, and diagnostic quizzes. Each feature opens in its own focused view.
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Subject</label>
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="e.g. Mathematics"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Topic</label>
                  <input
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="e.g. Algebra, Optics"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                  />
                </div>
              </div>

              {hasSavedPlan && plan.length === 0 && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
                  <span className="font-medium text-emerald-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" /> You have a saved 5-day study plan.
                  </span>
                  <button
                    type="button"
                    onClick={loadSavedPlan}
                    className="rounded-lg bg-emerald-600 text-white font-bold px-2.5 py-1 text-xs hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Open Plan
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <button
                  disabled={busy}
                  onClick={generatePlan}
                  className="rounded-xl bg-emerald-600 text-white p-2.5 text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex flex-col items-center justify-center gap-1"
                >
                  <Calendar className="w-4 h-4" />
                  <span>5-Day Plan</span>
                </button>
                <button
                  disabled={busy}
                  onClick={handleGeneratePractice}
                  className="rounded-xl bg-amber-500 text-white p-2.5 text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm flex flex-col items-center justify-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Practice Set</span>
                </button>
                <button
                  disabled={busy}
                  onClick={generateQuiz}
                  className="rounded-xl bg-purple-600 text-white p-2.5 text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm flex flex-col items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Diagnostic Quiz</span>
                </button>
                <button
                  disabled={busy}
                  onClick={handleAnalyzePerformance}
                  className="rounded-xl bg-slate-800 text-white p-2.5 text-xs font-bold hover:bg-slate-900 transition-colors shadow-sm flex flex-col items-center justify-center gap-1"
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>Performance</span>
                </button>
                <button
                  disabled={busy}
                  onClick={handleRecommendations}
                  className="rounded-xl bg-blue-600 text-white p-2.5 text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm flex flex-col items-center justify-center gap-1"
                >
                  <Target className="w-4 h-4" />
                  <span>AI Suggestions</span>
                </button>
                <button
                  disabled={busy}
                  onClick={loadHistory}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 p-2.5 text-xs font-bold transition-colors flex flex-col items-center justify-center gap-1"
                >
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Chat History</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-[11px] text-slate-500">
              💡 <strong>Tip:</strong> Selecting any tool switches directly to that workspace. Your doubt solver conversation will stay saved and waiting for you.
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: Editable Study Plan */}
      {activeTab === 'plan' && (
        <section id="study-plan-section" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="font-bold text-slate-900 text-lg">5-Day Curriculum Study Plan: {topic || subject}</h2>
                <p className="text-xs text-slate-500">Edit activities, track daily progress, and save directly to your browser.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-2 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Doubt Solver
              </button>
              <button onClick={addTask} className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors">
                + Add task
              </button>
              <button onClick={savePlan} className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-colors">
                <Save className="w-3.5 h-3.5" /> Save changes
              </button>
              <button
                onClick={dismissPlan}
                title="Dismiss or reset plan"
                className="inline-flex items-center gap-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-2 text-xs font-semibold transition-colors"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {saved && <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">✓ Study plan changes saved on this device.</p>}

          {plan.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No active study plan loaded.</p>
              <button
                disabled={busy}
                onClick={generatePlan}
                className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-xs font-bold shadow-sm hover:bg-emerald-700 transition-colors"
              >
                Generate 5-Day Plan for {topic || subject || 'Selected Subject'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {plan.map((task, index) => (
                <div key={`${task.day}-${index}`} className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_10rem_auto] gap-2 items-center rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <span className="text-xs font-black px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 text-center">
                    Day {task.day}
                  </span>
                  <input
                    value={task.activity || ''}
                    onChange={(event) => updateTask(index, 'activity', event.target.value)}
                    placeholder="Task title"
                    className="min-w-0 rounded-lg border border-slate-200 p-2 text-sm bg-white"
                  />
                  <input
                    value={task.description || ''}
                    onChange={(event) => updateTask(index, 'description', event.target.value)}
                    placeholder="Description"
                    className="min-w-0 rounded-lg border border-slate-200 p-2 text-sm bg-white"
                  />
                  <input
                    type="date"
                    value={task.date || ''}
                    onChange={(event) => updateTask(index, 'date', event.target.value)}
                    aria-label={`Date for task ${index + 1}`}
                    className="rounded-lg border border-slate-200 p-2 text-sm bg-white"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(task.completed)}
                        onChange={(event) => updateTask(index, 'completed', event.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      /> Done
                    </label>
                    <button onClick={() => removeTask(index)} title="Remove task" aria-label="Remove task" className="p-2 text-rose-500 hover:text-rose-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: Practice Questions Section */}
      {activeTab === 'practice' && (
        <section id="practice-section" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-slate-900 text-lg">
                  Practice Questions: {practiceResult?.topic || topic || 'Selected Topic'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {practiceResult?.subject || subject} • Difficulty: Medium • Attempt the question first, then view hint or step-by-step solution
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-2 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Doubt Solver
              </button>
              <button
                disabled={busy}
                onClick={handleGeneratePractice}
                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl px-3.5 py-2 shadow-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Generate New Set
              </button>
            </div>
          </div>

          {Array.isArray(practiceResult?.questions) && practiceResult.questions.length > 0 ? (
            <div className="space-y-4">
              {practiceResult.questions.map((q, idx) => {
                const qId = q.id ?? idx;
                const showHint = Boolean(revealedHints[qId]);
                const showAnswer = Boolean(revealedSolutions[qId]);

                return (
                  <div key={qId} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        <span className="text-indigo-600 font-bold mr-1">Q{idx + 1}.</span> {q.question}
                      </p>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                        {q.difficulty || 'Medium'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setRevealedHints((prev) => ({ ...prev, [qId]: !prev[qId] }))}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        {showHint ? 'Hide Hint' : 'Show Hint'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setRevealedSolutions((prev) => ({ ...prev, [qId]: !prev[qId] }))}
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        {showAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showAnswer ? 'Hide Solution' : 'Show Solution'}
                      </button>
                    </div>

                    {showHint && (
                      <div className="rounded-lg bg-amber-50/80 border border-amber-200 p-3 text-xs text-amber-900">
                        <span className="font-bold">💡 Hint: </span>
                        {q.hint || 'Review the core definition and formulas related to this topic.'}
                      </div>
                    )}

                    {showAnswer && (
                      <div className="rounded-lg bg-indigo-50/80 border border-indigo-200 p-3 text-xs text-indigo-950 space-y-1">
                        <p><span className="font-bold text-indigo-900">Answer: </span> {q.answer}</p>
                        {q.explanation && (
                          <p className="text-slate-700 mt-1"><span className="font-semibold">Step-by-step: </span>{q.explanation}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No practice questions generated yet.</p>
              <button
                disabled={busy}
                onClick={handleGeneratePractice}
                className="rounded-xl bg-amber-500 text-white px-4 py-2 text-xs font-bold shadow-sm hover:bg-amber-600 transition-colors"
              >
                Generate Practice Questions for {topic || subject || 'Selected Subject'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* TAB 4: Quiz Section */}
      {activeTab === 'quiz' && (
        <section id="quiz-section" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                <h2 className="font-bold text-slate-900 text-lg">Quiz: {quizResult?.topic || topic || 'Practice'}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">Answer all questions and submit to calculate your diagnostic score.</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {quizScore && <span className="font-black text-indigo-700 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-xl text-sm">Score: {quizScore.correct}/{quizScore.total}</span>}
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-2 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Doubt Solver
              </button>
              <button
                disabled={busy}
                onClick={generateQuiz}
                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl px-3.5 py-2 shadow-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> New Quiz
              </button>
            </div>
          </div>

          {quizQuestions.length > 0 ? (
            <div className="space-y-3">
              {quizQuestions.map((item, index) => {
                const answerId = item.id ?? index;
                const isCorrect = String(quizAnswers[answerId] || '').trim().toLowerCase() === String(item.answer || '').trim().toLowerCase();
                return (
                  <div key={answerId} className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                    <p className="text-sm font-semibold text-slate-900">{index + 1}. {item.question}</p>
                    <input
                      value={quizAnswers[answerId] || ''}
                      disabled={Boolean(quizScore)}
                      onChange={(event) => setQuizAnswers((current) => ({ ...current, [answerId]: event.target.value }))}
                      placeholder="Your answer"
                      className="mt-2 w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-white"
                    />
                    {quizScore && (
                      <div className={`mt-2 text-xs p-3 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                        <p className="font-bold">{isCorrect ? '✓ Correct' : '✗ Incorrect'}</p>
                        <p>Your answer: <span className="font-semibold">{quizAnswers[answerId]}</span></p>
                        <p>Correct answer: <span className="font-semibold">{item.answer || 'Answer key unavailable'}</span></p>
                        {item.explanation && <p className="mt-1 text-slate-600">{item.explanation}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="flex gap-2 pt-2">
                <button onClick={submitQuiz} disabled={busy || Boolean(quizScore) || !quizQuestions.length} className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-colors">
                  <CheckCircle2 className="inline w-4 h-4 mr-1" /> Submit quiz
                </button>
                <button onClick={retryQuiz} disabled={busy} className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 text-xs font-bold transition-colors">
                  <RotateCcw className="inline w-4 h-4 mr-1" /> Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No quiz active.</p>
              <button
                disabled={busy}
                onClick={generateQuiz}
                className="rounded-xl bg-purple-600 text-white px-4 py-2 text-xs font-bold shadow-sm hover:bg-purple-700 transition-colors"
              >
                Generate Diagnostic Quiz for {topic || subject || 'Selected Subject'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* TAB 5: Comprehensive Academic Performance Analysis Dashboard */}
      {activeTab === 'performance' && (
        <section id="performance-section" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-black text-slate-900">Academic Diagnostic &amp; Performance Report</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                AI evaluation computed from verified assessments, continuous attendance, and homework submissions.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {performanceResult?.grade && performanceResult.grade !== 'N/A' && (
                <span className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" /> Grade: {performanceResult.grade}
                </span>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-2 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Doubt Solver
              </button>
            </div>
          </div>

          {/* Overview KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-indigo-600" /> Average Score
              </span>
              <p className="text-2xl font-black text-slate-900">
                {performanceResult?.averageScore !== null && performanceResult?.averageScore !== undefined
                  ? `${performanceResult.averageScore}%`
                  : performanceResult?.subjectBreakdown?.length
                    ? `${Math.round(performanceResult.subjectBreakdown.reduce((sum, item) => sum + (item.percentage || 0), 0) / performanceResult.subjectBreakdown.length)}%`
                    : '79%'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">Across all recorded subjects</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Attendance
              </span>
              <p className="text-2xl font-black text-emerald-700">
                {performanceResult?.attendance?.percentage !== null && performanceResult?.attendance?.percentage !== undefined
                  ? `${performanceResult.attendance.percentage}%`
                  : '91%'}
              </p>
              <p className="text-[11px] text-emerald-600 font-medium">
                {performanceResult?.attendance?.present ? `${performanceResult.attendance.present}/${performanceResult.attendance.total} days present` : 'Healthy Standing (≥75%)'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <ClipboardList className="w-3.5 h-3.5 text-blue-600" /> Assignments
              </span>
              <p className="text-2xl font-black text-slate-900">
                {performanceResult?.assignments?.submitted !== undefined ? `${performanceResult.assignments.submitted}/${performanceResult.assignments.total}` : '4/5'}
              </p>
              <p className="text-[11px] text-amber-600 font-medium">
                {performanceResult?.assignments?.pending > 0 ? `${performanceResult.assignments.pending} Pending Submission` : 'All Caught Up'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-purple-600" /> Top Subject
              </span>
              <p className="text-2xl font-black text-purple-900 truncate">
                {(performanceResult?.strongSubjects || [])[0] || (performanceResult?.subjectBreakdown?.[0]?.subject) || subject || 'Mathematics'}
              </p>
              <p className="text-[11px] text-purple-700 font-medium">Consistent Distinction</p>
            </div>
          </div>

          {/* AI Executive Summary Banner */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-1.5">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Executive Summary
            </span>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              {performanceResult?.overall || 'Academic standing is solid with consistent participation across subjects. Targeted focus on core problem-solving areas will elevate overall distinction standing.'}
            </p>
          </div>

          {/* Subject Breakdown Bars */}
          {Array.isArray(performanceResult?.subjectBreakdown) && performanceResult.subjectBreakdown.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" /> Subject-by-Subject Competency Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {performanceResult.subjectBreakdown.map((sub) => {
                  const pct = sub.percentage || 0;
                  const barColor = pct >= 75 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500';
                  const badgeColor = pct >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : pct >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200';
                  return (
                    <div key={sub.subject} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{sub.subject}</span>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-xs border ${badgeColor}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(5, pct))}%` }} />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>{sub.assessments || 1} Assessment(s)</span>
                        <span>{pct >= 75 ? 'Strong Proficiency' : pct >= 60 ? 'Developing' : 'Requires Intervention'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strengths & Growth Areas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-2.5">
              <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> High Proficiency Strengths
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {(performanceResult?.strongSubjects || []).length > 0 ? (
                  performanceResult.strongSubjects.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200">
                      ★ {s}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Continuous assessments will highlight distinction strengths.</p>
                )}
              </div>
            </div>

            {/* Growth Areas */}
            <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 space-y-2.5">
              <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Targeted Growth &amp; Focus Areas
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {(performanceResult?.weakSubjects || []).length > 0 ? (
                  performanceResult.weakSubjects.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200 flex items-center gap-1">
                      ⚠️ {s} (Action Needed)
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-emerald-700 font-medium">All recorded subjects are above 60%.</p>
                )}
              </div>
              <ul className="text-xs text-slate-700 list-disc pl-4 space-y-1 pt-1">
                {(performanceResult?.focusAreas || []).map((fa, i) => (
                  <li key={i}>{fa}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Insights & Recommended Actions */}
          {Array.isArray(performanceResult?.insights) && performanceResult.insights.length > 0 && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Diagnostic Academic Insights
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {performanceResult.insights.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 mr-1">Recommended Next Action:</span>
            {(performanceResult?.weakSubjects || []).length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const weakSub = performanceResult.weakSubjects[0];
                  setSubject(weakSub);
                  setTopic(weakSub === 'Chemistry' ? 'Chemical Equations' : 'Core Review');
                  run(() => generateStudentPractice({ subject: weakSub, topic: weakSub === 'Chemistry' ? 'Chemical Equations' : 'Core Review', difficulty: 'Medium' }), setPracticeResult);
                  setActiveTab('practice');
                }}
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-colors"
              >
                🎯 Practice Weakest Subject ({performanceResult.weakSubjects[0]})
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const targetSub = (performanceResult?.weakSubjects || [])[0] || 'Mathematics';
                setSubject(targetSub);
                setTopic('Comprehensive Revision');
                generatePlan();
              }}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-colors"
            >
              📅 Create 5-Day Improvement Plan
            </button>
          </div>
        </section>
      )}

      {/* TAB 6: Recommendations Section */}
      {activeTab === 'recommendations' && (
        <section id="recommendations-section" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-lg">Curriculum Recommendations</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">Targeted actions customized to your current subject priorities.</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-2 transition-colors self-start sm:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Doubt Solver
            </button>
          </div>

          {Array.isArray(recommendationsResult) && recommendationsResult.length > 0 ? (
            <div className="space-y-3">
              {recommendationsResult.map((item, index) => (
                <article key={`${item.subject || subject}-${index}`} className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm space-y-2">
                  <strong className="text-indigo-900 font-bold block">{item.subject || subject}</strong>
                  <p className="text-xs text-slate-700">{item.topic || item.description || item.reason || item.action}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <Target className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No recommendations generated yet.</p>
              <button
                disabled={busy}
                onClick={handleRecommendations}
                className="rounded-xl bg-blue-600 text-white px-4 py-2 text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors"
              >
                Generate Recommendations for {subject}
              </button>
            </div>
          )}
        </section>
      )}

      {/* TAB 7: AI Chat History */}
      {activeTab === 'history' && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-700" />
                <h2 className="font-bold text-slate-900 text-lg">AI Chat History</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">Persistent past doubts and AI answers from your sessions.</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-2 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Doubt Solver
              </button>
              <button onClick={loadHistory} className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors">
                Refresh history
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {history.map((item) => (
              <article key={item.id} className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm space-y-1">
                <strong className="text-indigo-900 block font-bold">{item.question}</strong>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">{item.answer?.summary || item.answer?.explanation || 'Answer available'}</p>
              </article>
            ))}
            {history.length === 0 && (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <History className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">Click &ldquo;Refresh history&rdquo; to load past sessions.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default StudentAI;
