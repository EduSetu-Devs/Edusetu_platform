import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getTeacherProfile,
  getMyHomework,
  createHomework,
  updateHomework,
  deleteHomework,
  getHomeworkSubmissions,
  getSubmissionDetails,
  gradeSubmission,
  getAttachmentViewUrl,
  getAttachmentDownloadUrl,
  downloadAttachmentFile
} from '../services/teacherService';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Edit3,
  Trash2,
  Eye,
  FileText,
  ExternalLink,
  Users,
  X,
  Sparkles,
  Save,
  Check,
  Download,
  FileIcon,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const statusBadgeStyles = {
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  closed: 'bg-slate-100 text-slate-700 border-slate-200',
  draft: 'bg-amber-100 text-amber-800 border-amber-200'
};

const submissionBadgeStyles = {
  submitted: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
  late: 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/20',
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
  not_submitted: 'bg-slate-100 text-slate-600 border-slate-200',
  reviewed: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20'
};

const formatFileSize = (size) => {
  if (!size || isNaN(size)) return '0 KB';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateStr;
  }
};

const TeacherHomework = ({ onNavigateBack }) => {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [homeworkList, setHomeworkList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }

  // Filters & Search for Assignment List
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Create Homework Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    subject: '',
    dueDate: '',
    status: 'active',
    attachmentUrl: ''
  });

  // Edit Homework Modal State
  const [editingHomework, setEditingHomework] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Submissions Review Modal State
  const [selectedHomeworkSubmissions, setSelectedHomeworkSubmissions] = useState(null);
  const [submissionsRoster, setSubmissionsRoster] = useState(null);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
  const [submissionSearchTerm, setSubmissionSearchTerm] = useState('');
  const [submissionFilterTab, setSubmissionFilterTab] = useState('all'); // 'all' | 'submitted' | 'not_submitted'
  const [gradingStudentId, setGradingStudentId] = useState(null);
  const [gradingForm, setGradingForm] = useState({ marks: '', feedback: '', maxMarks: 10 });
  const [isGrading, setIsGrading] = useState(false);
  const [gradingFeedback, setGradingFeedback] = useState(null);

  // Image Preview Lightbox Modal
  const [previewImage, setPreviewImage] = useState(null); // { url, filename, size }

  // PDF Viewer Modal State
  const [previewPdf, setPreviewPdf] = useState(null); // { url, downloadUrl, filename, size }

  // Delete Confirmation Modal State
  const [deletingHomework, setDeletingHomework] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Downloading State for feedback
  const [downloadingId, setDownloadingId] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setFeedback(null);

    const [profRes, hwRes] = await Promise.all([
      getTeacherProfile(),
      getMyHomework({
        search: searchTerm,
        subject: selectedSubject,
        status: selectedStatus
      })
    ]);

    setIsLoading(false);

    if (profRes.success) {
      setProfile(profRes.data);
      if (!createForm.subject && Array.isArray(profRes.data.subjects) && profRes.data.subjects.length > 0) {
        setCreateForm((prev) => ({ ...prev, subject: profRes.data.subjects[0] }));
      }
    }

    if (hwRes.success) {
      setHomeworkList(Array.isArray(hwRes.data.homework) ? hwRes.data.homework : []);
    } else {
      setFeedback({ type: 'error', message: hwRes.error || 'Failed to load homework assignments' });
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSubject, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Create Homework Handler
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.description.trim() || !createForm.subject.trim() || !createForm.dueDate) {
      setFeedback({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    setIsCreating(true);
    setFeedback(null);

    const res = await createHomework(createForm);
    setIsCreating(false);

    if (res.success) {
      setIsCreateOpen(false);
      setCreateForm({
        title: '',
        description: '',
        subject: Array.isArray(profile?.subjects) && profile.subjects.length > 0 ? profile.subjects[0] : 'Mathematics',
        dueDate: '',
        status: 'active',
        attachmentUrl: ''
      });
      setFeedback({ type: 'success', message: 'Homework assignment published successfully!' });
      loadData();
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to create homework assignment' });
    }
  };

  // Edit Homework Handler
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingHomework.title.trim() || !editingHomework.description.trim() || !editingHomework.dueDate) {
      setFeedback({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    setIsUpdating(true);
    setFeedback(null);

    const res = await updateHomework(editingHomework.id, {
      title: editingHomework.title,
      description: editingHomework.description,
      subject: editingHomework.subject,
      dueDate: editingHomework.dueDate,
      status: editingHomework.status,
      attachmentUrl: editingHomework.attachmentUrl
    });

    setIsUpdating(false);

    if (res.success) {
      setEditingHomework(null);
      setFeedback({ type: 'success', message: 'Homework assignment updated successfully!' });
      loadData();
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to update homework assignment' });
    }
  };

  // Delete Homework Handler
  const handleDeleteConfirm = async () => {
    if (!deletingHomework) return;

    setIsDeleting(true);
    const res = await deleteHomework(deletingHomework.id);
    setIsDeleting(false);

    if (res.success) {
      setDeletingHomework(null);
      setFeedback({ type: 'success', message: 'Homework assignment deleted successfully!' });
      loadData();
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to delete homework assignment' });
    }
  };

  // Open Submissions Review Modal
  const handleOpenSubmissions = async (hw) => {
    setSelectedHomeworkSubmissions(hw);
    setIsSubmissionsLoading(true);
    setSubmissionsRoster(null);
    setSubmissionSearchTerm('');
    setSubmissionFilterTab('all');
    setGradingStudentId(null);
    setGradingFeedback(null);

    const res = await getHomeworkSubmissions(hw.id);
    setIsSubmissionsLoading(false);

    if (res.success) {
      setSubmissionsRoster(res.data);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to fetch assignment submissions' });
    }
  };

  const handleOpenGrading = (student) => {
    const grading = student.grading || {};
    setGradingStudentId(student.studentProfileId);
    setGradingForm({
      marks: grading.marksObtained === null || grading.marksObtained === undefined ? '' : String(grading.marksObtained),
      feedback: grading.teacherFeedback || '',
      maxMarks: Number(grading.maxMarks || selectedHomeworkSubmissions?.maxMarks || 10)
    });
    setGradingFeedback(null);
  };

  const handleSaveGrade = async (student) => {
    const marks = Number(gradingForm.marks);
    const maxMarks = Number(gradingForm.maxMarks);
    if (gradingForm.marks === '' || !Number.isFinite(marks)) {
      setGradingFeedback({ type: 'error', message: 'Marks must be numeric.' });
      return;
    }
    if (marks < 0) {
      setGradingFeedback({ type: 'error', message: 'Marks cannot be negative.' });
      return;
    }
    if (marks > maxMarks) {
      setGradingFeedback({ type: 'error', message: `Marks cannot exceed ${maxMarks}.` });
      return;
    }

    setIsGrading(true);
    setGradingFeedback(null);
    const result = await gradeSubmission(selectedHomeworkSubmissions.id, student.submissionId, {
      marks,
      feedback: gradingForm.feedback
    });
    setIsGrading(false);

    if (!result.success) {
      setGradingFeedback({ type: 'error', message: result.error || 'Failed to save grade.' });
      return;
    }

    setSubmissionsRoster((current) => ({
      ...current,
      students: (current?.students || []).map((currentStudent) =>
        currentStudent.studentProfileId === student.studentProfileId
          ? {
              ...currentStudent,
              status: 'reviewed',
              submissionStatus: 'reviewed',
              grading: result.data
            }
          : currentStudent
      ),
      submissions: (current?.submissions || []).map((submission) =>
        submission.id === student.submissionId
          ? { ...submission, status: 'reviewed', grading: result.data }
          : submission
      )
    }));
    setGradingFeedback({ type: 'success', message: 'Grade and feedback saved.' });
  };

  // Download attachment handler
  const handleDownloadAttachment = async (attachment) => {
    setDownloadingId(attachment.id);
    await downloadAttachmentFile(attachment.id, attachment.originalFilename);
    setDownloadingId(null);
  };

  // Derived statistics
  const totalHw = homeworkList.length;
  const activeHw = homeworkList.filter((h) => h.status === 'active').length;
  const totalSubmissionsCount = homeworkList.reduce((acc, h) => acc + (h.submitted || 0) + (h.late || 0), 0);
  const totalPendingCount = homeworkList.reduce((acc, h) => acc + (h.pending || 0), 0);

  // Filtered Students in Submissions Roster
  const getFilteredStudents = () => {
    if (!submissionsRoster || !Array.isArray(submissionsRoster.students)) return [];
    let list = submissionsRoster.students;

    // Filter by tab
    if (submissionFilterTab === 'submitted') {
      list = list.filter((s) => s.status === 'submitted' || s.status === 'late' || s.status === 'reviewed');
    } else if (submissionFilterTab === 'not_submitted') {
      list = list.filter((s) => s.status === 'pending' || s.status === 'not_submitted' || !s.submissionId);
    }

    // Filter by search
    if (submissionSearchTerm.trim()) {
      const q = submissionSearchTerm.toLowerCase().trim();
      list = list.filter((s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.studentId && s.studentId.toLowerCase().includes(q)) ||
        (s.rollNumber && String(s.rollNumber).toLowerCase().includes(q))
      );
    }

    return list;
  };

  const filteredStudents = getFilteredStudents();

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
              Homework & Assignment Hub
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Classroom Assignments
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
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-2xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Assignment</span>
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

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Created</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalHw}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Active Tasks</p>
          <p className="text-2xl font-black text-emerald-900 mt-1">{activeHw}</p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Total Submissions</p>
          <p className="text-2xl font-black text-blue-900 mt-1">{totalSubmissionsCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Pending Solutions</p>
          <p className="text-2xl font-black text-amber-900 mt-1">{totalPendingCount}</p>
        </div>

      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        
        <form onSubmit={handleSearchSubmit} className="relative flex-grow w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assignments by title, topic, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                getMyHomework({ subject: selectedSubject, status: selectedStatus }).then((res) => {
                  if (res.success) setHomeworkList(Array.isArray(res.data.homework) ? res.data.homework : []);
                });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          
          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="">All Subjects</option>
            {Array.isArray(profile?.subjects) &&
              profile.subjects.map((sub, idx) => (
                <option key={idx} value={sub}>
                  {sub}
                </option>
              ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
          </select>

        </div>

      </div>

      {/* Homework List Cards / Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading homework assignments...</p>
          </div>
        ) : homeworkList.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Assignments Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || selectedSubject || selectedStatus
                ? 'No assignments match your current search and filter criteria.'
                : 'You have not posted any homework assignments yet. Click "Create New Assignment" to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homeworkList.map((hw) => (
              <div
                key={hw.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {hw.subject}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                      statusBadgeStyles[hw.status] || 'bg-slate-100'
                    }`}>
                      {hw.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{hw.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{hw.description}</p>
                </div>

                {/* Meta & Stats */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: <strong className="text-slate-800">{hw.dueDate}</strong></span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{hw.className} {hw.section ? `(${hw.section})` : ''}</span>
                    </div>
                  </div>

                  {/* Submission Progress Pill */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                      <span>Submissions Completed</span>
                      <span className="text-indigo-600 font-bold">
                        {(hw.submitted || 0) + (hw.late || 0)} / {hw.totalStudents || 0}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{
                          width: `${
                            hw.totalStudents > 0
                              ? Math.min(100, (((hw.submitted || 0) + (hw.late || 0)) / hw.totalStudents) * 100)
                              : 0
                          }%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleOpenSubmissions(hw)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Submissions</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingHomework({ ...hw })}
                        title="Edit Assignment"
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingHomework(hw)}
                        title="Delete Assignment"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE HOMEWORK MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Create New Homework Assignment</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              
              {/* Read-Only Classroom Scope */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Assigned Class & Section:</span>
                <span className="font-bold text-indigo-600">
                  {profile?.className || 'Class 10'} • Section {profile?.section || 'A'}
                </span>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Assignment Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4 Trigonometry Problem Set"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Subject *</label>
                  {Array.isArray(profile?.subjects) && profile.subjects.length > 0 ? (
                    <select
                      value={createForm.subject}
                      onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                      required
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
                      placeholder="e.g. Mathematics"
                      value={createForm.subject}
                      onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                      required
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Due Date *</label>
                  <input
                    type="date"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Instructions & Problem Description *</label>
                <textarea
                  rows={4}
                  placeholder="Describe the assignment instructions, questions to solve, or submission requirements..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Attachment URL <span className="text-slate-400 font-normal">(Optional PDF/Drive Link)</span></label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={createForm.attachmentUrl}
                  onChange={(e) => setCreateForm({ ...createForm, attachmentUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Publish Assignment</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* EDIT HOMEWORK MODAL */}
      {editingHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Edit Homework Assignment</h3>
              </div>
              <button
                onClick={() => setEditingHomework(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Assignment Title *</label>
                <input
                  type="text"
                  value={editingHomework.title}
                  onChange={(e) => setEditingHomework({ ...editingHomework, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Due Date *</label>
                  <input
                    type="date"
                    value={editingHomework.dueDate}
                    onChange={(e) => setEditingHomework({ ...editingHomework, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Status *</label>
                  <select
                    value={editingHomework.status}
                    onChange={(e) => setEditingHomework({ ...editingHomework, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Instructions & Problem Description *</label>
                <textarea
                  rows={4}
                  value={editingHomework.description}
                  onChange={(e) => setEditingHomework({ ...editingHomework, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Attachment URL</label>
                <input
                  type="url"
                  value={editingHomework.attachmentUrl || ''}
                  onChange={(e) => setEditingHomework({ ...editingHomework, attachmentUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingHomework(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Delete Assignment?</h3>
              <p className="text-slate-500">
                Are you sure you want to delete <strong className="text-slate-800">{deletingHomework.title}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingHomework(null)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE SUBMISSIONS REVIEW MODAL */}
      {selectedHomeworkSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-800 text-white flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 uppercase tracking-wider">
                    {selectedHomeworkSubmissions.subject}
                  </span>
                  <span className="text-[11px] text-indigo-200">
                    Class: <strong>{selectedHomeworkSubmissions.className} {selectedHomeworkSubmissions.section ? `(${selectedHomeworkSubmissions.section})` : ''}</strong>
                  </span>
                  <span className="text-[11px] text-amber-200">
                    • Due: <strong>{selectedHomeworkSubmissions.dueDate}</strong>
                  </span>
                </div>
                <h3 className="text-xl font-black tracking-tight">{selectedHomeworkSubmissions.title}</h3>
                <p className="text-xs text-indigo-200/90 line-clamp-1">{selectedHomeworkSubmissions.description}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedHomeworkSubmissions(null);
                  setSubmissionsRoster(null);
                }}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Metrics Ribbon */}
            {submissionsRoster && (
              <div className="grid grid-cols-4 gap-2 p-4 bg-slate-50 border-b border-slate-100 text-center text-xs shrink-0">
                <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Enrolled</p>
                  <p className="text-lg font-black text-slate-800">{submissionsRoster.stats?.totalStudents || 0}</p>
                </div>
                <div className="p-2 bg-emerald-50/70 rounded-xl border border-emerald-100 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-emerald-700">Submitted On Time</p>
                  <p className="text-lg font-black text-emerald-700">{submissionsRoster.stats?.submitted || 0}</p>
                </div>
                <div className="p-2 bg-amber-50/70 rounded-xl border border-amber-100 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-amber-700">Late Submissions</p>
                  <p className="text-lg font-black text-amber-700">{submissionsRoster.stats?.late || 0}</p>
                </div>
                <div className="p-2 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Not Submitted</p>
                  <p className="text-lg font-black text-slate-700">{submissionsRoster.stats?.pending || 0}</p>
                </div>
              </div>
            )}

            {/* Filter Tabs & Search Bar */}
            <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              
              {/* Tab selector */}
              <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSubmissionFilterTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    submissionFilterTab === 'all'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Students ({submissionsRoster?.stats?.totalStudents || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionFilterTab('submitted')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    submissionFilterTab === 'submitted'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Submitted ({(submissionsRoster?.stats?.submitted || 0) + (submissionsRoster?.stats?.late || 0)})
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionFilterTab('not_submitted')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    submissionFilterTab === 'not_submitted'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Not Submitted ({submissionsRoster?.stats?.pending || 0})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student or roll #..."
                  value={submissionSearchTerm}
                  onChange={(e) => setSubmissionSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

            </div>

            {/* Submissions List Container */}
            <div className="p-6 overflow-y-auto space-y-4 flex-grow text-xs bg-slate-50/40">
              {isSubmissionsLoading ? (
                <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-slate-500 font-medium">Fetching class submissions...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-16 text-center space-y-2 bg-white rounded-2xl border border-slate-200">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No Students Found</p>
                  <p className="text-slate-400 text-xs">
                    {submissionSearchTerm
                      ? 'No students match your search keyword.'
                      : 'No students match the selected submission status tab.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStudents.map((stu) => {
                    const isSubmitted = stu.status === 'submitted' || stu.status === 'late' || stu.status === 'reviewed';
                    const attachmentsList = Array.isArray(stu.attachments) ? stu.attachments : [];

                    return (
                      <div
                        key={stu.studentId}
                        className={`bg-white border rounded-2xl p-5 shadow-xs transition-all space-y-4 ${
                          isSubmitted ? 'border-slate-200 hover:border-indigo-200' : 'border-slate-200/80 bg-slate-50/50'
                        }`}
                      >
                        {/* Student Header & Status */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                              isSubmitted
                                ? 'bg-gradient-to-tr from-indigo-600 to-blue-500 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {stu.name ? stu.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-black text-slate-900">{stu.name}</h4>
                                {stu.rollNumber && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-bold">
                                    Roll #{stu.rollNumber}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono">
                                ID: {stu.studentId} {stu.email ? `• ${stu.email}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {isSubmitted ? (
                              <span className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase flex items-center space-x-1.5 ${
                                submissionBadgeStyles[stu.status] || 'bg-slate-100'
                              }`}>
                                {stu.status === 'late' ? (
                                  <>
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Late Submission</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{stu.status === 'reviewed' ? 'Graded' : 'Submitted'}</span>
                                  </>
                                )}
                              </span>
                            ) : (
                              <span className="text-[11px] px-3 py-1 rounded-full font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200 flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Not Submitted</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Submission Details Body */}
                        {isSubmitted ? (
                          <div className="space-y-4">
                            
                            {/* Submission Timestamp */}
                            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                Submitted:{' '}
                                <strong className="text-slate-800 font-semibold">
                                  {formatDateTime(stu.submittedAt)}
                                </strong>
                              </span>
                            </div>

                            {/* Grading */}
                            {stu.grading?.marksObtained !== null && stu.grading?.marksObtained !== undefined && (
                              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Grade</span>
                                  <strong className="text-sm text-blue-900">
                                    {stu.grading.marksObtained} / {stu.grading.maxMarks}
                                  </strong>
                                </div>
                                {stu.grading.teacherFeedback && (
                                  <p className="text-xs text-blue-950 whitespace-pre-wrap">{stu.grading.teacherFeedback}</p>
                                )}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenGrading(stu)}
                              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-[11px] transition-colors"
                            >
                              {stu.grading?.marksObtained !== null && stu.grading?.marksObtained !== undefined
                                ? 'Update Grade'
                                : 'Grade Submission'}
                            </button>

                            {gradingStudentId === stu.studentProfileId && (
                              <div className="p-4 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Grade Submission</span>
                                  <span className="text-[11px] text-slate-500">Maximum: {gradingForm.maxMarks}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,160px)_1fr] gap-3">
                                  <label className="space-y-1">
                                    <span className="block text-[11px] font-semibold text-slate-700">Marks Obtained</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max={gradingForm.maxMarks}
                                      step="0.01"
                                      value={gradingForm.marks}
                                      onChange={(event) => setGradingForm((current) => ({ ...current, marks: event.target.value }))}
                                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                  </label>
                                  <label className="space-y-1">
                                    <span className="block text-[11px] font-semibold text-slate-700">Teacher Feedback (Optional)</span>
                                    <textarea
                                      rows="2"
                                      value={gradingForm.feedback}
                                      onChange={(event) => setGradingForm((current) => ({ ...current, feedback: event.target.value }))}
                                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                  </label>
                                </div>
                                {gradingFeedback && (
                                  <p className={`text-[11px] font-semibold ${gradingFeedback.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {gradingFeedback.message}
                                  </p>
                                )}
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setGradingStudentId(null)}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-[11px]"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveGrade(stu)}
                                    disabled={isGrading}
                                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] disabled:opacity-50"
                                  >
                                    {isGrading ? 'Saving...' : 'Save Grade'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Comment / Answer Text Box */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                                <MessageSquare className="w-3 h-3 text-indigo-500" />
                                <span>Student Answer / Comment</span>
                              </span>
                              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-800 text-xs whitespace-pre-wrap leading-relaxed">
                                {stu.comment || stu.submissionText ? (
                                  stu.comment || stu.submissionText
                                ) : (
                                  <span className="text-slate-400 italic">No written comment provided.</span>
                                )}
                              </div>
                            </div>

                            {/* External URL Reference if present */}
                            {stu.attachmentUrl && (
                              <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-indigo-900 font-semibold truncate max-w-md">
                                  <ExternalLink className="w-4 h-4 shrink-0 text-indigo-600" />
                                  <span className="truncate">{stu.attachmentUrl}</span>
                                </div>
                                <a
                                  href={stu.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg shrink-0"
                                >
                                  Open Link
                                </a>
                              </div>
                            )}

                            {/* Uploaded File Attachments List */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                                <Paperclip className="w-3 h-3 text-indigo-500" />
                                <span>Attachments ({attachmentsList.length})</span>
                              </span>

                              {attachmentsList.some((att) => att.mimeType === 'application/pdf' || att.mimeType?.startsWith('image/')) && (
                                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                                  AI analysis for PDF/image submissions is currently unavailable. You can still preview, download, grade, and provide manual feedback below.
                                </p>
                              )}

                              {attachmentsList.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic pl-1">No file attachments uploaded.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {attachmentsList.map((att) => {
                                    const isPdf = att.mimeType === 'application/pdf';
                                    const isImage = att.mimeType && att.mimeType.startsWith('image/');
                                    const viewUrl = att.viewUrl || getAttachmentViewUrl(att.id);
                                    const downloadUrl = att.downloadUrl || getAttachmentDownloadUrl(att.id);

                                    return (
                                      <div
                                        key={att.id}
                                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2.5 hover:bg-white hover:border-indigo-200 transition-all"
                                      >
                                        <div className="flex items-center space-x-2.5 min-w-0">
                                          {isImage ? (
                                            <button
                                              type="button"
                                              onClick={() => setPreviewImage({ url: viewUrl, filename: att.originalFilename, size: att.fileSize })}
                                              className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 hover:opacity-80 transition-opacity bg-white"
                                              title="Click to Preview Image"
                                            >
                                              <img
                                                src={viewUrl}
                                                alt={att.originalFilename}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                              />
                                            </button>
                                          ) : isPdf ? (
                                            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                                              <FileText className="w-5 h-5" />
                                            </div>
                                          ) : (
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                                              <FileIcon className="w-5 h-5" />
                                            </div>
                                          )}

                                          <div className="min-w-0">
                                            <p className="font-bold text-slate-900 truncate text-xs" title={att.originalFilename}>
                                              {att.originalFilename}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-mono">
                                              {formatFileSize(att.fileSize)}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Attachment Action Buttons */}
                                        <div className="flex items-center space-x-1.5 shrink-0">
                                          {isImage ? (
                                            <button
                                              type="button"
                                              onClick={() => setPreviewImage({ url: viewUrl, filename: att.originalFilename, size: att.fileSize })}
                                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] transition-colors flex items-center space-x-1"
                                            >
                                              <Eye className="w-3 h-3" />
                                              <span>Preview</span>
                                            </button>
                                          ) : isPdf ? (
                                            <button
                                              type="button"
                                              onClick={() => setPreviewPdf({ url: viewUrl, downloadUrl, filename: att.originalFilename, size: att.fileSize })}
                                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px] transition-colors flex items-center space-x-1"
                                            >
                                              <Eye className="w-3 h-3" />
                                              <span>View PDF</span>
                                            </button>
                                          ) : (
                                            <a
                                              href={viewUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors flex items-center space-x-1"
                                            >
                                              <Eye className="w-3 h-3" />
                                              <span>Open</span>
                                            </a>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() => handleDownloadAttachment(att)}
                                            disabled={downloadingId === att.id}
                                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-colors flex items-center space-x-1 disabled:opacity-50"
                                            title="Download attachment"
                                          >
                                            {downloadingId === att.id ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                              <Download className="w-3 h-3" />
                                            )}
                                            <span>Download</span>
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                          </div>
                        ) : (
                          /* Not Submitted Placeholder */
                          <div className="py-2 px-3 bg-slate-100/60 rounded-xl border border-slate-200 text-slate-500 flex items-center justify-between text-xs">
                            <span className="italic">No submission received from this student yet.</span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">Pending</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Showing {filteredStudents.length} of {submissionsRoster?.stats?.totalStudents || 0} students
              </span>
              <button
                onClick={() => {
                  setSelectedHomeworkSubmissions(null);
                  setSubmissionsRoster(null);
                }}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors"
              >
                Close Submissions
              </button>
            </div>

          </div>
        </div>
      )}

      {/* IMAGE PREVIEW LIGHTBOX MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-white text-xs pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2 truncate pr-4">
                <ImageIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="font-bold truncate">{previewImage.filename}</span>
                <span className="text-slate-400 font-mono">({formatFileSize(previewImage.size)})</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow max-h-[72vh] flex items-center justify-center bg-slate-950 rounded-2xl overflow-hidden p-2">
              <img
                src={previewImage.url}
                alt={previewImage.filename}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <a
                href={previewImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in New Tab</span>
              </a>
              <a
                href={`${previewImage.url}&download=1`}
                download={previewImage.filename}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Image</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* PDF VIEWER MODAL */}
      {previewPdf && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setPreviewPdf(null)}
        >
          <div
            className="relative max-w-4xl w-full h-[88vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5 truncate pr-4">
                <FileText className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm truncate">{previewPdf.filename}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">{formatFileSize(previewPdf.size)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={previewPdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>New Window</span>
                </a>
                <a
                  href={`${previewPdf.url}&download=1`}
                  download={previewPdf.filename}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewPdf(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-grow w-full bg-slate-100 relative">
              <iframe
                src={previewPdf.url}
                title={previewPdf.filename}
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherHomework;
