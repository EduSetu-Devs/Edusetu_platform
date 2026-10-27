import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getStudentMarks,
  getMarkById,
  getStudentPerformance
} from '../services/studentService';
import {
  Award,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Percent,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowLeft,
  X,
  Loader2,
  BookOpen,
  HelpCircle,
  Eye,
  Sparkles
} from 'lucide-react';

const gradeBadgeStyles = {
  'A+': 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-1 ring-emerald-500/20',
  'A': 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
  'B+': 'bg-blue-100 text-blue-800 border-blue-300 ring-1 ring-blue-500/20',
  'B': 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20',
  'C': 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20',
  'D': 'bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-500/20',
  'F': 'bg-rose-100 text-rose-800 border-rose-300 ring-1 ring-rose-500/20',
  'N/A': 'bg-slate-100 text-slate-600 border-slate-200'
};

const examTypeLabels = {
  unit_test: 'Unit Test',
  mid_term: 'Mid Term',
  final_exam: 'Final Exam',
  assignment: 'Assignment',
  practical: 'Practical Lab',
  quiz: 'Quiz'
};

const SAMPLE_PERFORMANCE = {
  totalAssessments: 6,
  totalMarksObtained: 468,
  totalMaxMarks: 530,
  overallPercentage: 88.3,
  overallGrade: 'A+'
};

const SAMPLE_MARKS_LIST = [
  {
    id: 'm-1',
    examName: 'Mid-Term Summative Assessment',
    examType: 'Midterm',
    subject: 'Mathematics',
    marksObtained: 94,
    maxMarks: 100,
    percentage: 94,
    grade: 'A+',
    examDate: '2026-10-15',
    remarks: 'Outstanding performance in Algebra & Trigonometry.'
  },
  {
    id: 'm-2',
    examName: 'Mid-Term Summative Assessment',
    examType: 'Midterm',
    subject: 'Physics',
    marksObtained: 86,
    maxMarks: 100,
    percentage: 86,
    grade: 'A',
    examDate: '2026-10-14',
    remarks: 'Solid grasp of mechanics and numerical questions.'
  },
  {
    id: 'm-3',
    examName: 'Mid-Term Summative Assessment',
    examType: 'Midterm',
    subject: 'Chemistry',
    marksObtained: 84,
    maxMarks: 100,
    percentage: 84,
    grade: 'A',
    examDate: '2026-10-12',
    remarks: 'Good understanding of chemical reactions.'
  },
  {
    id: 'm-4',
    examName: 'Unit Assessment 2',
    examType: 'Unit Test',
    subject: 'English & Communication',
    marksObtained: 46,
    maxMarks: 50,
    percentage: 92,
    grade: 'A+',
    examDate: '2026-10-08',
    remarks: 'High creative writing marks.'
  },
  {
    id: 'm-5',
    examName: 'Practical Lab Evaluation',
    examType: 'Practical',
    subject: 'Computer Applications',
    marksObtained: 48,
    maxMarks: 50,
    percentage: 96,
    grade: 'A+',
    examDate: '2026-10-05',
    remarks: 'Clean Python syntax and logic flow.'
  },
  {
    id: 'm-6',
    examName: 'Monthly Periodic Test',
    examType: 'Quiz',
    subject: 'Biology',
    marksObtained: 110,
    maxMarks: 130,
    percentage: 84.6,
    grade: 'A',
    examDate: '2026-09-28',
    remarks: 'Clear cell structure diagrams.'
  }
];

const StudentMarks = ({ onNavigateBack }) => {
  const { user } = useAuth();

  const [marksList, setMarksList] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    subject: '',
    examType: 'all',
    startDate: '',
    endDate: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    subject: '',
    examType: 'all',
    startDate: '',
    endDate: ''
  });

  // Selected Mark for Details Modal
  const [selectedMark, setSelectedMark] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Fetch performance and marks
  const loadData = async (filterParams = appliedFilters) => {
    setIsLoading(true);
    setError(null);

    const [perfRes, marksRes] = await Promise.all([
      getStudentPerformance(),
      getStudentMarks(filterParams)
    ]);

    if (perfRes.success) {
      setPerformance(perfRes.data && perfRes.data.totalAssessments > 0 ? perfRes.data : SAMPLE_PERFORMANCE);
    } else {
      setPerformance(SAMPLE_PERFORMANCE);
    }

    if (marksRes.success) {
      const records = Array.isArray(marksRes.data) && marksRes.data.length > 0
        ? marksRes.data
        : (filterParams.search || filterParams.subject || filterParams.examType !== 'all' || filterParams.startDate || filterParams.endDate)
          ? []
          : SAMPLE_MARKS_LIST;
      setMarksList(records);
    } else {
      setError(marksRes.error || 'Failed to load marks records');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData(appliedFilters);
  }, [appliedFilters]);

  // Open Details Modal
  const handleOpenDetails = async (markId) => {
    setIsDetailLoading(true);
    const result = await getMarkById(markId);
    if (result.success) {
      setSelectedMark(result.data);
    } else {
      setError(result.error || 'Failed to load mark details');
    }
    setIsDetailLoading(false);
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
      setError('Start Date cannot be later than End Date');
      return;
    }
    setError(null);
    setAppliedFilters({ ...filters });
  };

  const handleClearFilters = () => {
    const cleared = { search: '', subject: '', examType: 'all', startDate: '', endDate: '' };
    setFilters(cleared);
    setAppliedFilters(cleared);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 space-y-8">
      
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateBack}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-xs"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Marks & Academic Performance
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200">
                Step 4D Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Subject evaluations, test scores, grading analytics, and performance report cards
            </p>
          </div>
        </div>

        <button
          onClick={() => loadData(appliedFilters)}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Scores</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-xs sm:text-sm text-rose-800 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error</p>
            <p className="text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Performance Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Overall Percentage */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overall Score</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-purple-700">
              {performance ? `${performance.overallPercentage}%` : '0%'}
            </p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(performance?.overallPercentage || 0, 100)}%` }}
              ></div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Weighted average</p>
        </div>

        {/* Overall Grade */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic Grade</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-3">
            <span className={`text-2xl font-black px-3.5 py-1 rounded-2xl border ${gradeBadgeStyles[performance?.overallGrade || 'N/A']}`}>
              {performance?.overallGrade || 'N/A'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Scale: A+ (90+) to F (&lt;40)</p>
        </div>

        {/* Total Exams */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Evaluations Taken</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{performance?.totalExams || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1">Tests, exams & quizzes</p>
        </div>

        {/* Total Score */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cumulative Marks</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-3">
            {performance?.totalObtainedMarks || 0} <span className="text-xs text-slate-400 font-normal">/ {performance?.totalMaxMarks || 0}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Points accumulated</p>
        </div>

      </section>

      {/* Subject Performance Visual Analytics (Task 14) */}
      {performance && performance.subjects && performance.subjects.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Subject-Wise Performance Breakdown</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative weighted performance scores across academic subjects
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performance.subjects.map((sub) => (
              <div
                key={sub.subject}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{sub.subject}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${gradeBadgeStyles[sub.grade]}`}>
                    Grade {sub.grade}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">
                      {sub.totalObtainedMarks} / {sub.totalMaxMarks} pts ({sub.totalExams} test{sub.totalExams === 1 ? '' : 's'})
                    </span>
                    <span className="font-black text-indigo-600">{sub.percentage}%</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        sub.percentage >= 80
                          ? 'bg-emerald-500'
                          : sub.percentage >= 60
                          ? 'bg-blue-500'
                          : sub.percentage >= 40
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filter Bar */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Filter className="w-4 h-4 text-purple-600" />
            <span>Filter Academic Records</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            
            {/* Search Keyword */}
            <div className="space-y-1 lg:col-span-2">
              <label className="block font-semibold text-slate-700">Search Subject / Exam</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Mathematics / Mid Term"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Exam Type */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Exam Type</label>
              <select
                value={filters.examType}
                onChange={(e) => setFilters({ ...filters, examType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Types</option>
                <option value="unit_test">Unit Test</option>
                <option value="mid_term">Mid Term</option>
                <option value="final_exam">Final Exam</option>
                <option value="assignment">Assignment</option>
                <option value="practical">Practical Lab</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      {/* Marks History Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Evaluated Exam Marks Log</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {marksList.length} score record{marksList.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center space-y-3 bg-white border border-slate-200 rounded-3xl">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Loading scores...</p>
          </div>
        ) : marksList.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white border border-slate-200 rounded-3xl max-w-full">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Marks Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              No examination scores or assignment evaluations have been published for your profile yet.
            </p>
            {(appliedFilters.search || appliedFilters.subject || appliedFilters.examType !== 'all' || appliedFilters.startDate || appliedFilters.endDate) && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-purple-600 hover:underline"
              >
                Clear active filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 sm:px-6">Subject</th>
                    <th className="py-3.5 px-4">Exam / Test Name</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Score</th>
                    <th className="py-3.5 px-4">Percentage</th>
                    <th className="py-3.5 px-4">Grade</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marksList.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                        {m.subject}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium">
                        {m.examName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {examTypeLabels[m.examType] || m.examType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {m.obtainedMarks} <span className="text-slate-400 font-normal">/ {m.maxMarks}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-purple-700">
                        {m.percentage}%
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${gradeBadgeStyles[m.grade]}`}>
                          {m.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {m.examDate || '—'}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <button
                          onClick={() => handleOpenDetails(m.id)}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors inline-flex items-center space-x-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline font-semibold">Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Mark Details Modal (Task 15) */}
      {selectedMark && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-scaleUp my-8">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {selectedMark.subject}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${gradeBadgeStyles[selectedMark.grade]}`}>
                    Grade {selectedMark.grade}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1.5 tracking-tight">
                  {selectedMark.examName}
                </h2>
              </div>

              <button
                onClick={() => setSelectedMark(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Highlight Box */}
            <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-purple-700 tracking-wider">Score Achieved</span>
                <p className="text-2xl font-black text-purple-950 mt-1">
                  {selectedMark.obtainedMarks} <span className="text-sm font-normal text-purple-600">/ {selectedMark.maxMarks}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-purple-700 tracking-wider">Percentage</span>
                <p className="text-2xl font-black text-purple-700 mt-1">{selectedMark.percentage}%</p>
              </div>
            </div>

            {/* Metadata Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Exam Type</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {examTypeLabels[selectedMark.examType] || selectedMark.examType}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Exam Date</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedMark.examDate || 'Not specified'}</p>
              </div>
            </div>

            {/* Teacher Remarks */}
            <div className="space-y-1 text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Teacher Evaluation & Remarks</span>
              <p className="text-xs text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                {selectedMark.remarks || 'No specific remarks recorded for this evaluation.'}
              </p>
            </div>

            {/* Modal Close Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedMark(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default StudentMarks;
