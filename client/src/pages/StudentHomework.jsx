import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getStudentHomework,
  getHomeworkById,
  submitHomework
} from '../services/studentService';
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Send,
  Link,
  ExternalLink,
  ArrowLeft,
  X,
  Loader2,
  BookOpen,
  Check,
  Sparkles,
  Paperclip,
  Trash2
} from 'lucide-react';

const submissionBadgeStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20',
  submitted: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
  late: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20',
  reviewed: 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/20'
};

const statusBadgeStyles = {
  active: 'bg-blue-50 text-blue-700 border-blue-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200'
};

const SAMPLE_HOMEWORK_LIST = [
  {
    id: 'hw-1',
    title: 'Linear & Quadratic Equations Practice Set',
    subject: 'Mathematics',
    className: 'Class 10',
    description: 'Solve questions 1 through 15 from Chapter 4 Exercise 4.2. Show all step-by-step working and verify solutions.',
    dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    status: 'active',
    submissionStatus: 'pending',
    maxMarks: 20,
    submission: null
  },
  {
    id: 'hw-2',
    title: 'Ray Optics & Lens Formula Derivations',
    subject: 'Physics',
    className: 'Class 10',
    description: 'Draw ray diagrams for convex and concave lenses with different object positions. State Cartesian sign conventions.',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    status: 'active',
    submissionStatus: 'submitted',
    maxMarks: 15,
    submission: {
      submissionText: 'All ray diagrams completed with focal length calculations.',
      submittedAt: new Date(Date.now() - 86400000).toISOString(),
      marksObtained: 14,
      teacherFeedback: 'Excellent diagram neatness and accurate sign conventions.'
    }
  },
  {
    id: 'hw-3',
    title: 'Types of Chemical Reactions Worksheet',
    subject: 'Chemistry',
    className: 'Class 10',
    description: 'Balance 10 chemical equations and identify whether they are combination, decomposition, or displacement reactions.',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    status: 'active',
    submissionStatus: 'pending',
    maxMarks: 10,
    submission: null
  },
  {
    id: 'hw-4',
    title: 'Formal Letter & Essay Writing',
    subject: 'English',
    className: 'Class 10',
    description: 'Write a formal letter to the Editor on sustainable energy solutions, word count 150-200 words.',
    dueDate: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    status: 'completed',
    submissionStatus: 'submitted',
    maxMarks: 10,
    submission: {
      submissionText: 'Formal letter drafted following CBSE prescribed format.',
      submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      marksObtained: 9.5,
      teacherFeedback: 'Very well structured arguments and clean vocabulary.'
    }
  }
];

const StudentHomework = ({ onNavigateBack }) => {
  const { user } = useAuth();

  const [homeworkList, setHomeworkList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    subject: '',
    status: 'all',
    startDate: '',
    endDate: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    subject: '',
    status: 'all',
    startDate: '',
    endDate: ''
  });

  // Selected Homework for Details / Submission Modal
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState(null);

  // Fetch homework list
  const fetchHomeworkList = async (filterParams = appliedFilters) => {
    setIsLoading(true);
    setError(null);
    const result = await getStudentHomework(filterParams);
    if (result.success) {
      const items = Array.isArray(result.data) && result.data.length > 0
        ? result.data
        : (filterParams.search || filterParams.subject || filterParams.startDate || filterParams.endDate || filterParams.status !== 'all')
          ? []
          : SAMPLE_HOMEWORK_LIST;
      setHomeworkList(items);
    } else {
      setError(result.error || 'Failed to load homework assignments');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHomeworkList(appliedFilters);
  }, [appliedFilters]);

  // Open Details Modal
  const handleOpenDetails = async (homeworkId) => {
    setIsDetailLoading(true);
    setModalFeedback(null);
    setSubmissionText('');
    setAttachmentUrl('');
    setSelectedFiles([]);

    const result = await getHomeworkById(homeworkId);
    if (result.success) {
      setSelectedHomework(result.data);
      if (result.data.submission) {
        setSubmissionText(result.data.submission.submissionText || '');
        setAttachmentUrl(result.data.submission.attachmentUrl || '');
      }
    } else {
      setError(result.error || 'Failed to load homework details');
    }
    setIsDetailLoading(false);
  };

  // Submit Homework Action
  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submissionText.trim() && !attachmentUrl.trim() && selectedFiles.length === 0) {
      setModalFeedback({ type: 'error', message: 'Please provide a comment or at least one attachment' });
      return;
    }

    setIsSubmitting(true);
    setModalFeedback(null);

    const result = await submitHomework(selectedHomework.id, {
      submissionText: submissionText.trim(),
      attachmentUrl: attachmentUrl.trim(),
      files: selectedFiles
    });

    setIsSubmitting(false);

    if (result.success) {
      setModalFeedback({
        type: 'success',
        message: result.data.status === 'late'
          ? 'Assignment submitted (Recorded as Late due to elapsed deadline).'
          : 'Assignment submitted successfully on time!'
      });

      // Update selected homework state
      setSelectedHomework((prev) => ({
        ...prev,
        submissionStatus: result.data.status,
        submission: result.data
      }));
      setSelectedFiles([]);

      // Refresh list in background
      fetchHomeworkList(appliedFilters);
    } else {
      setModalFeedback({ type: 'error', message: result.error || 'Failed to submit assignment' });
    }
  };

  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files || []);
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const invalidFile = files.find((file) => !allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024);
    if (invalidFile) {
      setModalFeedback({ type: 'error', message: 'Only PDF, JPG, JPEG, PNG, and WEBP files up to 10 MB are allowed.' });
      event.target.value = '';
      return;
    }
    if (selectedFiles.length + files.length > 10) {
      setModalFeedback({ type: 'error', message: 'You can attach up to 10 files per submission.' });
      event.target.value = '';
      return;
    }
    setSelectedFiles((current) => [...current, ...files]);
    setModalFeedback(null);
    event.target.value = '';
  };

  const formatFileSize = (size) => `${Math.max(1, Math.round(size / 1024))} KB`;
  const submittedAttachments = Array.isArray(selectedHomework?.submission?.attachments)
    ? selectedHomework.submission.attachments
    : [];

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
    const cleared = { search: '', subject: '', status: 'all', startDate: '', endDate: '' };
    setFilters(cleared);
    setAppliedFilters(cleared);
    setError(null);
  };

  // Summary Metrics
  const totalCount = homeworkList.length;
  const activeCount = homeworkList.filter((h) => h.status === 'active').length;
  const submittedCount = homeworkList.filter((h) => h.submissionStatus === 'submitted' || h.submissionStatus === 'late' || h.submissionStatus === 'reviewed').length;
  const pendingCount = homeworkList.filter((h) => h.submissionStatus === 'pending' && h.status === 'active').length;

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
                Homework & Assignments
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Step 4C Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Classroom tasks, due dates, project submissions, and teacher feedback
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchHomeworkList(appliedFilters)}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
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

      {/* Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Assigned</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{totalCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Class assignments</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Tasks</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 mt-3">{activeCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Open for work</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Action</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-3">{pendingCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Due for submission</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submitted</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-3">{submittedCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Completed assignments</p>
        </div>

      </section>

      {/* Filter Bar */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Search & Filter Assignments</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            
            {/* Search Keyword */}
            <div className="space-y-1 lg:col-span-2">
              <label className="block font-semibold text-slate-700">Search Title / Topic</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Trigonometry / Ray Diagram"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Subject</label>
              <input
                type="text"
                placeholder="e.g. Mathematics"
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="closed">Closed Only</option>
              </select>
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Due Date By</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
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

      {/* Homework List Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Assigned Tasks Log</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {homeworkList.length} assignment{homeworkList.length === 1 ? '' : 's'} sorted by due date
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center space-y-3 bg-white border border-slate-200 rounded-3xl">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Loading assignments...</p>
          </div>
        ) : homeworkList.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white border border-slate-200 rounded-3xl max-w-full">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Assignments Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              No homework tasks currently match your class schedule or search filters.
            </p>
            {(appliedFilters.search || appliedFilters.subject || appliedFilters.status !== 'all' || appliedFilters.endDate) && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Clear active filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {homeworkList.map((hw) => (
              <div
                key={hw.id}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Subject and Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {hw.subject}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusBadgeStyles[hw.status] || 'bg-slate-100'}`}>
                        {hw.status}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${submissionBadgeStyles[hw.submissionStatus] || 'bg-slate-100'}`}>
                        {hw.submissionStatus}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight line-clamp-1">
                      {hw.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {hw.description}
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-1.5 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Assigned: {hw.assignedDate}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center space-x-1.5 text-amber-800 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Due: {hw.dueDate}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Class: {hw.className} {hw.section ? `(${hw.section})` : ''}
                  </span>

                  <button
                    onClick={() => handleOpenDetails(hw.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      hw.submissionStatus === 'submitted' || hw.submissionStatus === 'late' || hw.submissionStatus === 'reviewed'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    }`}
                  >
                    {hw.submissionStatus === 'submitted' || hw.submissionStatus === 'late' || hw.submissionStatus === 'reviewed'
                      ? 'View Submission'
                      : 'View & Submit →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Homework Details & Submission Modal */}
      {selectedHomework && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-scaleUp my-8">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {selectedHomework.subject}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${submissionBadgeStyles[selectedHomework.submissionStatus]}`}>
                    {selectedHomework.submissionStatus}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1.5 tracking-tight">
                  {selectedHomework.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedHomework(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Feedback Alert */}
            {modalFeedback && (
              <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center space-x-3 animate-fadeIn ${
                modalFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {modalFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span className="font-semibold">{modalFeedback.message}</span>
              </div>
            )}

            {/* Details Body */}
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Description & Instructions</h4>
                <p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {selectedHomework.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Assigned Date</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedHomework.assignedDate}</p>
                </div>
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-amber-700 font-bold uppercase">Deadline</span>
                  <p className="text-xs font-bold text-amber-900 mt-0.5">{selectedHomework.dueDate}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Class Target</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedHomework.className} {selectedHomework.section ? `(${selectedHomework.section})` : ''}</p>
                </div>
              </div>

              {selectedHomework.attachmentUrl && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-blue-900 font-semibold">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Teacher Reference Material</span>
                  </div>
                  <a
                    href={selectedHomework.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-blue-600 hover:underline font-bold"
                  >
                    <span>Open Attachment</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Submission Section */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Send className="w-4 h-4 text-indigo-600" />
                <span>Your Assignment Submission</span>
              </h3>

              {selectedHomework.submission && (selectedHomework.submissionStatus === 'submitted' || selectedHomework.submissionStatus === 'late' || selectedHomework.submissionStatus === 'reviewed') ? (
                /* Already Submitted View */
                <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Submitted on {new Date(selectedHomework.submission.submittedAt).toLocaleString()}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${submissionBadgeStyles[selectedHomework.submissionStatus]}`}>
                      {selectedHomework.submissionStatus}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Submission Answer:</span>
                    <p className="mt-1 text-slate-800 bg-white p-3 rounded-xl border border-slate-200 whitespace-pre-wrap font-mono text-xs">
                      {selectedHomework.submission.submissionText || 'No text provided'}
                    </p>
                  </div>

                  {selectedHomework.submission.attachmentUrl && (
                    <div className="flex items-center space-x-2 text-indigo-600">
                      <Link className="w-3.5 h-3.5" />
                      <a
                        href={selectedHomework.submission.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline truncate max-w-sm"
                      >
                        {selectedHomework.submission.attachmentUrl}
                      </a>
                    </div>
                  )}

                  {submittedAttachments.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Submitted Files</span>
                      {submittedAttachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-indigo-700 hover:border-indigo-300"
                        >
                          <span className="flex items-center space-x-2 truncate">
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{attachment.originalFilename}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">{formatFileSize(attachment.fileSize)}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {selectedHomework.submission.grading?.marksObtained !== null && selectedHomework.submission.grading?.marksObtained !== undefined ? (
                    <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Teacher Grade</span>
                        <strong className="text-base text-purple-900">
                          {selectedHomework.submission.grading.marksObtained} / {selectedHomework.submission.grading.maxMarks}
                        </strong>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Teacher Feedback</p>
                      <p className="text-xs text-purple-950 whitespace-pre-wrap">
                        {selectedHomework.submission.grading.teacherFeedback || 'No feedback provided.'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                      Grade: Pending teacher review
                    </div>
                  )}
                </div>
              ) : selectedHomework.status === 'closed' ? (
                /* Closed Notice */
                <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-600 text-center">
                  This assignment is closed and no longer accepting submissions.
                </div>
              ) : (
                /* Submission Form */
                <form onSubmit={handleSubmitAssignment} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Comment or Answer <span className="text-slate-400 font-normal">(Optional when files are attached)</span></label>
                    <textarea
                      rows="4"
                      placeholder="Write your homework answers, explanations or solution notes here..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    ></textarea>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Attach Files <span className="text-slate-400 font-normal">(PDF, JPG, JPEG, PNG, WEBP; max 10 MB each)</span></label>
                    <label className="flex items-center justify-center space-x-2 p-4 border border-dashed border-indigo-300 bg-indigo-50/40 rounded-xl text-xs font-bold text-indigo-700 cursor-pointer hover:bg-indigo-50">
                      <Paperclip className="w-4 h-4" />
                      <span>Select files</span>
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleFileSelection}
                        className="hidden"
                      />
                    </label>
                    {selectedFiles.length > 0 && (
                      <div className="space-y-1.5">
                        {selectedFiles.map((file, index) => (
                          <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                            <span className="flex items-center space-x-2 truncate">
                              <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="truncate">{file.name}</span>
                              <span className="text-slate-400 shrink-0">{formatFileSize(file.size)}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Project / File URL <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <div className="relative">
                      <Link className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="url"
                        placeholder="https://github.com/... or https://drive.google.com/..."
                        value={attachmentUrl}
                        onChange={(e) => setAttachmentUrl(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedHomework(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                    >
                      Close
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Assignment</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default StudentHomework;
