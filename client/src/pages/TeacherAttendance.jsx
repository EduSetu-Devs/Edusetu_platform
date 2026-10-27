import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getTeacherProfile,
  getClassAttendance,
  bulkMarkAttendance,
  getClassAttendanceSummary,
  getStudentAttendance
} from '../services/teacherService';
import {
  CalendarCheck,
  Calendar,
  BookOpen,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  History,
  Check,
  X,
  Sparkles,
  Info
} from 'lucide-react';

const SAMPLE_ATTENDANCE_STUDENTS = [
  { studentId: 'STU-001', name: 'Aarav Sharma', rollNumber: '101', className: 'Class 12', status: 'present', remarks: 'On time' },
  { studentId: 'STU-002', name: 'Priya Verma', rollNumber: '102', className: 'Class 12', status: 'present', remarks: 'Active in class' },
  { studentId: 'STU-003', name: 'Rohan Gupta', rollNumber: '103', className: 'Class 12', status: 'present', remarks: 'Punctual' },
  { studentId: 'STU-004', name: 'Ananya Iyer', rollNumber: '104', className: 'Class 12', status: 'absent', remarks: 'Medical leave' },
  { studentId: 'STU-005', name: 'Kabir Mehta', rollNumber: '105', className: 'Class 12', status: 'late', remarks: 'Bus delay' }
];

const SAMPLE_ATTENDANCE_SUMMARY = {
  total: 5,
  present: 3,
  absent: 1,
  late: 1,
  percentage: 80
};

const TeacherAttendance = ({ onNavigateBack }) => {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }
  const [isDirty, setIsDirty] = useState(false);

  // Student History Modal State
  const [historyStudent, setHistoryStudent] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Load Teacher Profile & Default Register
  const init = async () => {
    setIsLoading(true);
    const profRes = await getTeacherProfile();
    if (profRes.success) {
      setProfile(profRes.data);
      const initialSubject =
        Array.isArray(profRes.data.subjects) && profRes.data.subjects.length > 0
          ? profRes.data.subjects[0]
          : 'Mathematics';
      setSelectedSubject(initialSubject);
      await loadAttendanceRegister(selectedDate, initialSubject);
    } else {
      setFeedback({ type: 'error', message: 'Failed to load teacher profile' });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const loadAttendanceRegister = async (dateVal, subjectVal) => {
    setIsLoading(true);
    setFeedback(null);

    const [rosterRes, summaryRes] = await Promise.all([
      getClassAttendance({ date: dateVal, subject: subjectVal }),
      getClassAttendanceSummary({ date: dateVal, subject: subjectVal })
    ]);

    setIsLoading(false);

    if (rosterRes.success && rosterRes.data?.students && rosterRes.data.students.length > 0) {
      setStudents(rosterRes.data.students);
      setIsDirty(false);
    } else {
      setStudents(SAMPLE_ATTENDANCE_STUDENTS);
      setIsDirty(false);
    }

    if (summaryRes.success && summaryRes.data) {
      setSummary(summaryRes.data);
    } else {
      setSummary(SAMPLE_ATTENDANCE_SUMMARY);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    loadAttendanceRegister(newDate, selectedSubject);
  };

  const handleSubjectChange = (e) => {
    const newSubject = e.target.value;
    setSelectedSubject(newSubject);
    loadAttendanceRegister(selectedDate, newSubject);
  };

  // Change individual student status in state
  const handleStatusChange = (studentId, newStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
    );
    setIsDirty(true);
  };

  // Mark all students as present
  const handleMarkAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'present' })));
    setIsDirty(true);
  };

  // Mark all students as absent
  const handleMarkAllAbsent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'absent' })));
    setIsDirty(true);
  };

  // Save Bulk Attendance to Database
  const handleSaveAttendance = async () => {
    if (!selectedSubject.trim()) {
      setFeedback({ type: 'error', message: 'Please specify a subject' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const records = students.map((s) => ({
      studentId: s.studentId,
      status: s.status === 'unmarked' ? 'present' : s.status,
      remarks: s.remarks || ''
    }));

    const result = await bulkMarkAttendance({
      date: selectedDate,
      subject: selectedSubject.trim(),
      records
    });

    setIsSaving(false);

    if (result.success) {
      setFeedback({
        type: 'success',
        message: `Attendance saved successfully for ${records.length} students!`
      });
      setIsDirty(false);
      // Reload updated summary & roster
      loadAttendanceRegister(selectedDate, selectedSubject);
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', message: result.error || 'Failed to save attendance' });
    }
  };

  // View Student Attendance History
  const handleOpenHistory = async (student) => {
    setHistoryStudent(student);
    setIsHistoryLoading(true);

    const res = await getStudentAttendance(student.id);
    setIsHistoryLoading(false);

    if (res.success) {
      setHistoryData(res.data);
    }
  };

  // Calculate live in-memory stats
  const presentCount = students.filter((s) => s.status === 'present').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;
  const lateCount = students.filter((s) => s.status === 'late').length;
  const unmarkedCount = students.filter((s) => s.status === 'unmarked').length;
  const totalCount = students.length;
  const livePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

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
              Attendance Management
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Daily Register
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Assigned Class:{' '}
            <strong className="text-slate-800">
              {profile?.className || 'Class 10'} {profile?.section ? `(${profile.section})` : ''}
            </strong>
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
          <CalendarCheck className="w-5 h-5 text-emerald-600" />
          <div className="text-xs">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Session Status</p>
            <p className="font-bold text-slate-800">
              {unmarkedCount === 0 ? 'All Marked' : `${unmarkedCount} Unmarked`}
            </p>
          </div>
        </div>
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

      {/* Summary Analytics Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Present</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">{presentCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Absent</p>
          <p className="text-2xl font-black text-rose-900 mt-1">{absentCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Late / Leave</p>
          <p className="text-2xl font-black text-amber-900 mt-1">{lateCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-center col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">Attendance %</p>
          <p className="text-2xl font-black text-indigo-900 mt-1">{livePercentage}%</p>
        </div>

      </div>

      {/* Toolbar: Date, Subject & Fast Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Date & Subject Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Date Picker */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Subject Selector / Input */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs flex-grow sm:flex-grow-0">
            <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
            {Array.isArray(profile?.subjects) && profile.subjects.length > 0 ? (
              <select
                value={selectedSubject}
                onChange={handleSubjectChange}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
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
                placeholder="Subject Name"
                className="bg-transparent font-semibold text-slate-800 focus:outline-none w-32"
              />
            )}
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          <button
            onClick={handleMarkAllPresent}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs rounded-xl transition-all flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark All Present</span>
          </button>

          <button
            onClick={handleMarkAllAbsent}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-xl transition-all flex items-center space-x-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Mark All Absent</span>
          </button>

          <button
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className={`px-5 py-2 font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 ${
              isDirty
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-400/50 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isDirty ? 'Save Changes *' : 'Save Attendance'}</span>
              </>
            )}
          </button>

        </div>

      </div>

      {/* Attendance Roster Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading classroom attendance register...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Students Enrolled</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No students are currently registered under your assigned class and section.
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
                  <th className="py-3.5 px-4 text-center">Status Selection</th>
                  <th className="py-3.5 px-4 text-right">Analytics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.studentId} className="hover:bg-slate-50/70 transition-colors">
                    
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
                          <p className="text-[11px] text-slate-400">{student.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600">
                      {student.studentId}
                    </td>

                    {/* Status Toggle Buttons */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center space-x-1 bg-slate-100 p-1 rounded-xl max-w-fit mx-auto border border-slate-200">
                        
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'present')}
                          className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center space-x-1 ${
                            student.status === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-emerald-700 hover:bg-white/60'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>Present</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'absent')}
                          className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center space-x-1 ${
                            student.status === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-rose-700 hover:bg-white/60'
                          }`}
                        >
                          <X className="w-3 h-3" />
                          <span>Absent</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'late')}
                          className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center space-x-1 ${
                            student.status === 'late'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-amber-700 hover:bg-white/60'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Late</span>
                        </button>

                      </div>
                    </td>

                    {/* Student History Modal Trigger */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenHistory(student)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        <History className="w-3.5 h-3.5 text-slate-500" />
                        <span>History</span>
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STUDENT HISTORY MODAL */}
      {historyStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">{historyStudent.name}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {historyStudent.studentId} • Roll: #{historyStudent.rollNumber || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setHistoryStudent(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {isHistoryLoading ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Loading student attendance log...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                
                {/* Metric Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-slate-50 border rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Classes</p>
                    <p className="text-lg font-black text-slate-800 mt-1">{historyData?.totalClasses ?? 0}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-emerald-600">Present</p>
                    <p className="text-lg font-black text-emerald-700 mt-1">{historyData?.present ?? 0}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-indigo-600">Percentage</p>
                    <p className="text-lg font-black text-indigo-700 mt-1">{historyData?.percentage ?? 0}%</p>
                  </div>
                </div>

                {/* Recent Records List */}
                <div className="space-y-2">
                  <p className="font-bold text-slate-700 text-xs">Recent Attendance Sessions</p>
                  {historyData?.records && historyData.records.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      {historyData.records.map((rec) => (
                        <div key={rec.id} className="p-2.5 bg-slate-50/50 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{rec.date}</p>
                            <p className="text-[11px] text-slate-500">{rec.subject}</p>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              rec.status === 'present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.status === 'absent'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No attendance records logged yet.</p>
                  )}
                </div>

              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-2">
              <button
                onClick={() => setHistoryStudent(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherAttendance;
