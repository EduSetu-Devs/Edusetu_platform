import React, { useState, useEffect } from 'react';
import {
  getMyStudents,
  getStudentDetails,
  getStudentAttendanceSummary,
  getStudentMarksSummary,
  getStudentHomeworkSummary
} from '../services/teacherService';
import {
  Users,
  Search,
  ArrowLeft,
  GraduationCap,
  CalendarCheck,
  Award,
  ClipboardList,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';

const gradeBadgeColors = {
  'A+': 'bg-purple-100 text-purple-800 border-purple-200',
  'A': 'bg-blue-100 text-blue-800 border-blue-200',
  'B+': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'B': 'bg-teal-100 text-teal-800 border-teal-200',
  'C': 'bg-amber-100 text-amber-800 border-amber-200',
  'D': 'bg-orange-100 text-orange-800 border-orange-200',
  'F': 'bg-rose-100 text-rose-800 border-rose-200',
  'N/A': 'bg-slate-100 text-slate-700 border-slate-200'
};

const TeacherStudents = ({ onNavigateBack }) => {
  const [teacherMeta, setTeacherMeta] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  // Modal State for Selected Student
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'attendance' | 'marks' | 'homework'
  const [studentDetails, setStudentDetails] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState(null);
  const [studentMarks, setStudentMarks] = useState(null);
  const [studentHomework, setStudentHomework] = useState(null);

  const fetchStudents = async (query = '') => {
    setIsLoading(true);
    setErrorMessage(null);

    const result = await getMyStudents({ search: query });
    setIsLoading(false);

    if (result.success) {
      setTeacherMeta(result.data.teacher);
      setStudents(result.data.students || []);
    } else {
      setErrorMessage(result.error || 'Failed to load assigned students');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    fetchStudents('');
  };

  // Open Student Details Modal and Fetch Academic Summaries Concurrently
  const handleOpenStudentDetail = async (student) => {
    setSelectedStudent(student);
    setIsDetailLoading(true);
    setActiveTab('overview');

    const [detailsRes, attRes, marksRes, hwRes] = await Promise.all([
      getStudentDetails(student.id),
      getStudentAttendanceSummary(student.id),
      getStudentMarksSummary(student.id),
      getStudentHomeworkSummary(student.id)
    ]);

    setIsDetailLoading(false);

    if (detailsRes.success) setStudentDetails(detailsRes.data);
    if (attRes.success) setStudentAttendance(attRes.data);
    if (marksRes.success) setStudentMarks(marksRes.data);
    if (hwRes.success) setStudentHomework(hwRes.data);
  };

  const handleCloseModal = () => {
    setSelectedStudent(null);
    setStudentDetails(null);
    setStudentAttendance(null);
    setStudentMarks(null);
    setStudentHomework(null);
  };

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 space-y-8">
      
      {/* Top Header */}
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
              My Students Roster
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {students.length} Enrolled
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Assigned Class:{' '}
            <strong className="text-slate-800">
              {teacherMeta?.className || 'Class Not Set'} {teacherMeta?.section ? `(${teacherMeta.section})` : ''}
            </strong>
          </p>
        </div>

        {/* Classroom Badge */}
        <div className="flex items-center space-x-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
          <Users className="w-5 h-5 text-indigo-600" />
          <div className="text-xs">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Authorized Scope</p>
            <p className="font-bold text-slate-800">
              {teacherMeta?.className || 'Class 10'} • Section {teacherMeta?.section || 'A'}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-grow w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student by name, student ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <button
          onClick={() => fetchStudents(searchTerm)}
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
        </button>
      </div>

      {/* Error Feedback */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Students List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading classroom roster...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Students Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? `No students matching "${searchTerm}" found in your assigned class.`
                : 'No students currently enrolled in this class and section.'}
            </p>
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3.5 px-4">Roll No</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Class / Section</th>
                  <th className="py-3.5 px-4 text-right">Academic Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                      {student.rollNumber ? `#${student.rollNumber}` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{student.name}</p>
                          <p className="text-[11px] text-slate-400">{student.phone || 'No phone set'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600">
                      {student.studentId}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 truncate max-w-[160px]">
                      {student.email}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {student.className} {student.section ? `(${student.section})` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenStudentDetail(student)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors shadow-xs"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>View Profile & Analytics</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STUDENT DETAIL & ACADEMIC SUMMARY MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-700 to-blue-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white text-indigo-700 flex items-center justify-center font-bold text-xl shadow-md">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">{selectedStudent.name}</h3>
                  <p className="text-xs text-indigo-200 font-mono">
                    ID: {selectedStudent.studentId} • Roll: {selectedStudent.rollNumber || 'N/A'} • {selectedStudent.className} ({selectedStudent.section})
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center space-x-2 px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50 text-xs font-semibold shrink-0">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'attendance' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Attendance ({studentAttendance?.percentage ?? 0}%)</span>
              </button>
              <button
                onClick={() => setActiveTab('marks')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'marks' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-purple-600'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Marks & Performance ({studentMarks?.overallGrade ?? 'N/A'})</span>
              </button>
              <button
                onClick={() => setActiveTab('homework')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'homework' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Homework ({studentHomework?.submitted ?? 0}/{studentHomework?.totalAssignments ?? 0})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow text-xs">
              {isDetailLoading ? (
                <div className="py-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-slate-500 font-medium">Fetching academic analytics...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Summary Metrics Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        
                        {/* Attendance Card */}
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Attendance</span>
                            <CalendarCheck className="w-4 h-4 text-emerald-600" />
                          </div>
                          <p className="text-2xl font-black text-emerald-900 mt-2">
                            {studentAttendance?.percentage ?? 0}%
                          </p>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            {studentAttendance?.present ?? 0} present of {studentAttendance?.totalClasses ?? 0} total classes
                          </p>
                        </div>

                        {/* Marks GPA Card */}
                        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">Academic Score</span>
                            <Award className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex items-baseline space-x-2 mt-2">
                            <span className="text-2xl font-black text-purple-900">
                              {studentMarks?.overallPercentage ?? 0}%
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                              gradeBadgeColors[studentMarks?.overallGrade] || 'bg-slate-100'
                            }`}>
                              Grade {studentMarks?.overallGrade || 'N/A'}
                            </span>
                          </div>
                          <p className="text-[11px] text-purple-700 mt-0.5">
                            {studentMarks?.totalExams ?? 0} evaluation tests recorded
                          </p>
                        </div>

                        {/* Homework Submissions Card */}
                        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Assignments</span>
                            <ClipboardList className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="text-2xl font-black text-blue-900 mt-2">
                            {studentHomework?.submitted ?? 0} / {studentHomework?.totalAssignments ?? 0}
                          </p>
                          <p className="text-[11px] text-blue-700 mt-0.5">
                            {studentHomework?.pending ?? 0} pending assignments
                          </p>
                        </div>

                      </div>

                      {/* Personal & Academic Details */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <h4 className="font-bold text-slate-800 text-sm">Student Demographics</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 font-medium">Email:</span>{' '}
                            <span className="font-semibold text-slate-800">{studentDetails?.email || selectedStudent.email}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Phone:</span>{' '}
                            <span className="font-semibold text-slate-800">{studentDetails?.phone || 'Not Provided'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Date of Birth:</span>{' '}
                            <span className="font-semibold text-slate-800">{studentDetails?.dateOfBirth || 'Not Set'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Gender:</span>{' '}
                            <span className="font-semibold text-slate-800 capitalize">{studentDetails?.gender || 'Not Set'}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-slate-400 font-medium">Residential Address:</span>{' '}
                            <span className="font-semibold text-slate-800">{studentDetails?.address || 'Not Provided'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ATTENDANCE */}
                  {activeTab === 'attendance' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-3 bg-slate-50 border rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Total Classes</p>
                          <p className="text-lg font-black text-slate-800 mt-1">{studentAttendance?.totalClasses ?? 0}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-emerald-600">Present</p>
                          <p className="text-lg font-black text-emerald-700 mt-1">{studentAttendance?.present ?? 0}</p>
                        </div>
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-rose-600">Absent</p>
                          <p className="text-lg font-black text-rose-700 mt-1">{studentAttendance?.absent ?? 0}</p>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-amber-600">Late / Leave</p>
                          <p className="text-lg font-black text-amber-700 mt-1">
                            {(studentAttendance?.late ?? 0) + (studentAttendance?.leave ?? 0)}
                          </p>
                        </div>
                      </div>

                      {/* Visual Percentage Bar */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>Overall Attendance Compliance</span>
                          <span>{studentAttendance?.percentage ?? 0}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              (studentAttendance?.percentage ?? 0) >= 75
                                ? 'bg-emerald-500'
                                : (studentAttendance?.percentage ?? 0) >= 60
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${studentAttendance?.percentage ?? 0}%` }}
                          ></div>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Minimum required standard is 75%. Current status:{' '}
                          {(studentAttendance?.percentage ?? 0) >= 75 ? (
                            <strong className="text-emerald-600">Good Standing</strong>
                          ) : (
                            <strong className="text-rose-600">Below Threshold</strong>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: MARKS */}
                  {activeTab === 'marks' && (
                    <div className="space-y-4">
                      {/* Overall GPA Banner */}
                      <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Cumulative Performance</p>
                          <p className="text-2xl font-black text-purple-900 mt-1">
                            {studentMarks?.overallPercentage ?? 0}% • Grade {studentMarks?.overallGrade || 'N/A'}
                          </p>
                          <p className="text-[11px] text-purple-700">
                            Total Points: {studentMarks?.totalObtainedMarks ?? 0} / {studentMarks?.totalMaxMarks ?? 0}
                          </p>
                        </div>
                        <Award className="w-10 h-10 text-purple-600" />
                      </div>

                      {/* Subject Progress Cards */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Subject Analytics</h4>
                        {studentMarks?.subjects && studentMarks.subjects.length > 0 ? (
                          studentMarks.subjects.map((sub, idx) => (
                            <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800">{sub.subject}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-slate-600">
                                    {sub.totalObtainedMarks} / {sub.totalMaxMarks} ({sub.percentage}%)
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase border ${
                                    gradeBadgeColors[sub.grade] || 'bg-slate-100'
                                  }`}>
                                    {sub.grade}
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full bg-purple-600 rounded-full"
                                  style={{ width: `${sub.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 italic">No subject marks recorded yet.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: HOMEWORK */}
                  {activeTab === 'homework' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 bg-slate-50 border rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Total</p>
                          <p className="text-lg font-black text-slate-800 mt-1">{studentHomework?.totalAssignments ?? 0}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-emerald-600">Submitted</p>
                          <p className="text-lg font-black text-emerald-700 mt-1">{studentHomework?.submitted ?? 0}</p>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                          <p className="text-[10px] uppercase font-bold text-amber-600">Pending</p>
                          <p className="text-lg font-black text-amber-700 mt-1">{studentHomework?.pending ?? 0}</p>
                        </div>
                      </div>

                      {/* Recent Submissions */}
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Recent Submissions</h4>
                        {studentHomework?.recentSubmissions && studentHomework.recentSubmissions.length > 0 ? (
                          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                            {studentHomework.recentSubmissions.map((sub, idx) => (
                              <div key={idx} className="p-3 bg-slate-50/50 flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-bold text-slate-900">{sub.homeworkTitle}</p>
                                  <p className="text-[11px] text-slate-500">{sub.subject}</p>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  sub.status === 'submitted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {sub.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No submissions recorded yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors"
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

export default TeacherStudents;
