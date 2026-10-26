import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getTeacherProfile,
  getClassMarks,
  bulkCreateMarks,
  getClassResultSummary,
  getStudentResult,
  getStudentMarks
} from '../services/teacherService';
import {
  FileSpreadsheet,
  Award,
  BookOpen,
  Calendar,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Users,
  Eye,
  History,
  X,
  Sparkles,
  Info
} from 'lucide-react';

const gradeBadgeStyles = {
  'A+': 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black',
  A: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
  'B+': 'bg-blue-100 text-blue-800 border-blue-200 font-bold',
  B: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
  C: 'bg-amber-100 text-amber-800 border-amber-200 font-semibold',
  D: 'bg-orange-100 text-orange-800 border-orange-200 font-semibold',
  F: 'bg-rose-100 text-rose-800 border-rose-200 font-bold',
  'N/A': 'bg-slate-100 text-slate-500 border-slate-200 font-medium'
};

const calculateGradeLocal = (percentage) => {
  if (percentage === null || percentage === undefined || isNaN(Number(percentage))) return 'N/A';
  const p = Number(percentage);
  if (p >= 90) return 'A+';
  if (p >= 80) return 'A';
  if (p >= 70) return 'B+';
  if (p >= 60) return 'B';
  if (p >= 50) return 'C';
  if (p >= 40) return 'D';
  return 'F';
};

const TeacherMarks = ({ onNavigateBack }) => {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedExamType, setSelectedExamType] = useState('mid_term');
  const [examName, setExamName] = useState('Mid Term Exam');
  const [maxMarks, setMaxMarks] = useState(100);

  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }

  // Student Result Modal State
  const [resultStudent, setResultStudent] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [isResultLoading, setIsResultLoading] = useState(false);

  const loadData = async (subjectVal, examTypeVal, examNameVal) => {
    setIsLoading(true);
    setFeedback(null);

    const [profRes, rosterRes, sumRes] = await Promise.all([
      profile ? Promise.resolve({ success: true, data: profile }) : getTeacherProfile(),
      getClassMarks({ subject: subjectVal, examType: examTypeVal, examName: examNameVal }),
      getClassResultSummary({ subject: subjectVal, examType: examTypeVal, examName: examNameVal })
    ]);

    setIsLoading(false);

    if (profRes.success && !profile) {
      setProfile(profRes.data);
    }

    if (rosterRes.success) {
      setStudents(
        rosterRes.data.students.map((s) => ({
          ...s,
          currentMarks: s.obtainedMarks !== null ? s.obtainedMarks : ''
        }))
      );
      setIsDirty(false);
    } else {
      setFeedback({ type: 'error', message: rosterRes.error || 'Failed to load class marks' });
    }

    if (sumRes.success) {
      setSummary(sumRes.data);
    }
  };

  useEffect(() => {
    getTeacherProfile().then((res) => {
      if (res.success) {
        setProfile(res.data);
        const initSub =
          Array.isArray(res.data.subjects) && res.data.subjects.length > 0
            ? res.data.subjects[0]
            : 'Mathematics';
        setSelectedSubject(initSub);
        loadData(initSub, selectedExamType, examName);
      }
    });
  }, []);

  const handleFilterChange = () => {
    loadData(selectedSubject, selectedExamType, examName);
  };

  const handleMarkChange = (studentProfileId, value) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentProfileId === studentProfileId) {
          const numVal = value === '' ? '' : Number(value);
          const max = Number(maxMarks) || 100;
          let calculatedPercentage = null;
          let calculatedGrade = 'N/A';

          if (value !== '' && !isNaN(numVal)) {
            calculatedPercentage = Math.round((numVal / max) * 10000) / 100;
            calculatedGrade = calculateGradeLocal(calculatedPercentage);
          }

          return {
            ...s,
            currentMarks: value,
            percentage: calculatedPercentage,
            grade: calculatedGrade
          };
        }
        return s;
      })
    );
    setIsDirty(true);
  };

  const handleSaveAll = async () => {
    const validRecords = [];
    for (const s of students) {
      if (s.currentMarks !== '' && s.currentMarks !== null && !isNaN(Number(s.currentMarks))) {
        const val = Number(s.currentMarks);
        if (val < 0 || val > maxMarks) {
          setFeedback({
            type: 'error',
            message: `Invalid marks for ${s.name}: Marks must be between 0 and ${maxMarks}`
          });
          return;
        }
        validRecords.push({
          studentProfileId: s.studentProfileId,
          obtainedMarks: val,
          remarks: s.remarks || ''
        });
      }
    }

    if (validRecords.length === 0) {
      setFeedback({ type: 'error', message: 'No marks entered to save' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const res = await bulkCreateMarks({
      subject: selectedSubject.trim(),
      examType: selectedExamType,
      examName: examName.trim(),
      maxMarks: Number(maxMarks),
      records: validRecords
    });

    setIsSaving(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Successfully saved marks for ${validRecords.length} students!`
      });
      setIsDirty(false);
      loadData(selectedSubject, selectedExamType, examName);
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to save marks' });
    }
  };

  const handleOpenStudentResult = async (student) => {
    setResultStudent(student);
    setIsResultLoading(true);

    const res = await getStudentResult(student.studentProfileId);
    setIsResultLoading(false);

    if (res.success) {
      setResultData(res.data);
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={onNavigateBack}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Faculty Dashboard</span>
          </button>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Marks & Result Management
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Gradebook Entry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Assigned Class:{' '}
            <strong className="text-slate-800">
              {profile?.className || 'Class 10'} {profile?.section ? `(${profile.section})` : ''}
            </strong>
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className={`px-6 py-2.5 font-semibold text-xs rounded-2xl shadow-md transition-all flex items-center space-x-1.5 shrink-0 ${
            isDirty
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 ring-2 ring-indigo-400 animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Records...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isDirty ? 'Save Changes *' : 'Save Marks'}</span>
            </>
          )}
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center space-x-3 transition-all animate-fadeIn ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Class Result Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">Class Average</p>
          <p className="text-2xl font-black text-indigo-900 mt-1">{summary?.classAverage ?? 0}%</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Highest Score</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">{summary?.highestMarks ?? 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Lowest Score</p>
          <p className="text-2xl font-black text-amber-900 mt-1">{summary?.lowestMarks ?? 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-800">Passed (&ge;40%)</p>
          <p className="text-2xl font-black text-teal-900 mt-1">{summary?.passCount ?? 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Failed (&lt;40%)</p>
          <p className="text-2xl font-black text-rose-900 mt-1">{summary?.failCount ?? 0}</p>
        </div>

      </div>

      {/* Exam & Assessment Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full">
          
          {/* Subject Dropdown */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject</label>
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
              <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
              {Array.isArray(profile?.subjects) && profile.subjects.length > 0 ? (
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    loadData(e.target.value, selectedExamType, examName);
                  }}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none w-full cursor-pointer"
                >
                  {profile.subjects.map((sub, idx) => (
                    <option key={idx} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none w-full"
                />
              )}
            </div>
          </div>

          {/* Exam Type Dropdown */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Assessment Type</label>
            <select
              value={selectedExamType}
              onChange={(e) => {
                setSelectedExamType(e.target.value);
                loadData(selectedSubject, e.target.value, examName);
              }}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="mid_term">Mid Term Exam</option>
              <option value="final_exam">Final Exam</option>
              <option value="unit_test">Unit Test</option>
              <option value="assignment">Assignment / Project</option>
              <option value="practical">Practical / Lab</option>
              <option value="quiz">Quiz / Class Test</option>
            </select>
          </div>

          {/* Exam Name Input */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Exam Title / Label</label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              onBlur={handleFilterChange}
              placeholder="e.g. Mid Term Exam"
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
            />
          </div>

          {/* Max Marks Input */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Max Marks</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
            />
          </div>

        </div>

      </div>

      {/* Students Marks Entry Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading classroom gradebook roster...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Students Enrolled</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No students are currently registered in your assigned class and section.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3.5 px-4">Roll</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4 text-center">Marks Obtained (Out of {maxMarks})</th>
                  <th className="py-3.5 px-4 text-center">Percentage</th>
                  <th className="py-3.5 px-4 text-center">Grade</th>
                  <th className="py-3.5 px-4 text-right">Academic Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.studentProfileId} className="hover:bg-slate-50/70 transition-colors">
                    
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                      {student.rollNumber ? `#${student.rollNumber}` : '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{student.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{student.studentId}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600">
                      {student.studentId}
                    </td>

                    {/* Editable Marks Input */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center space-x-1.5">
                        <input
                          type="number"
                          min="0"
                          max={maxMarks}
                          value={student.currentMarks}
                          onChange={(e) => handleMarkChange(student.studentProfileId, e.target.value)}
                          placeholder="Score"
                          className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-slate-400 font-medium">/ {maxMarks}</span>
                      </div>
                    </td>

                    {/* Auto-Calculated Percentage */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {student.percentage !== null && student.percentage !== undefined
                        ? `${student.percentage}%`
                        : '—'}
                    </td>

                    {/* Auto-Calculated Grade */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${
                        gradeBadgeStyles[student.grade] || 'bg-slate-100 text-slate-700'
                      }`}>
                        {student.grade || 'N/A'}
                      </span>
                    </td>

                    {/* Cumulative Report Card Trigger */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenStudentResult(student)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs transition-colors"
                      >
                        <Award className="w-3.5 h-3.5 text-purple-600" />
                        <span>Result & GPA</span>
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CUMULATIVE STUDENT RESULT MODAL */}
      {resultStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900">{resultStudent.name}'s Academic Card</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {resultStudent.studentId}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setResultStudent(null);
                  setResultData(null);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isResultLoading ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-purple-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Calculating GPA and academic performance...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                
                {/* Metric Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-indigo-600">Total Exams</p>
                    <p className="text-lg font-black text-indigo-700 mt-1">{resultData?.totalExams ?? 0}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-emerald-600">Overall %</p>
                    <p className="text-lg font-black text-emerald-700 mt-1">{resultData?.overallPercentage ?? 0}%</p>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-purple-600">GPA Score</p>
                    <p className="text-lg font-black text-purple-700 mt-1">{resultData?.gpa ?? '0.00'}</p>
                  </div>
                </div>

                {/* Subject-Wise Breakdown Table */}
                <div className="space-y-2">
                  <p className="font-bold text-slate-700 text-xs">Subject-Wise Breakdown</p>
                  {resultData?.subjects && resultData.subjects.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      {resultData.subjects.map((sub, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50/50 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{sub.subject}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              Score: {sub.totalObtainedMarks} / {sub.totalMaxMarks} ({sub.percentage}%)
                            </p>
                          </div>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                              gradeBadgeStyles[sub.grade] || 'bg-slate-100'
                            }`}
                          >
                            {sub.grade}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No evaluated marks recorded for this student.</p>
                  )}
                </div>

              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => {
                  setResultStudent(null);
                  setResultData(null);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors"
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

export default TeacherMarks;
