import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMyRequests,
  getIncomingRequests,
  acceptTutorRequest,
  rejectTutorRequest,
  cancelTutorRequest,
  getTutorBookingSlots,
  createTutorBooking,
  confirmTutorBooking,
  rejectTutorBooking
} from '../services/tutorService';
import {
  Send,
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Video,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react';

const SAMPLE_INCOMING_REQUESTS = [
  {
    id: 101,
    subject: 'Physics',
    gradeLevel: 'Class 12',
    preferredMode: 'online',
    preferredSchedule: 'Mon & Thu 5:00 PM – 6:30 PM',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    startTime: '17:00',
    endTime: '18:30',
    budget: 950,
    status: 'pending',
    student: { name: 'Aarav Sharma', email: 'aarav@edusetu.in' },
    message: 'Hello Sir, I need 1-on-1 tutoring sessions for JEE Advanced Rotational Dynamics and Optics.',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 102,
    subject: 'Mathematics',
    gradeLevel: 'Class 11',
    preferredMode: 'online',
    preferredSchedule: 'Tue & Fri 6:00 PM – 7:00 PM',
    scheduledDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    startTime: '18:00',
    endTime: '19:00',
    budget: 850,
    status: 'pending',
    student: { name: 'Rohan Mehra', email: 'rohan@edusetu.in' },
    message: 'Looking for conceptual clarity and problem-solving practice in Trigonometry and Conic Sections.',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 103,
    subject: 'Physics',
    gradeLevel: 'Class 12',
    preferredMode: 'online',
    preferredSchedule: 'Saturday 4:00 PM',
    scheduledDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    startTime: '16:00',
    endTime: '17:00',
    budget: 950,
    status: 'accepted',
    student: { name: 'Sneha Patel', email: 'sneha@edusetu.in' },
    message: 'Introductory session successfully accepted and scheduled.',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

const SAMPLE_OUTGOING_REQUESTS = [
  {
    id: 201,
    subject: 'Advanced Physics',
    gradeLevel: 'Class 12',
    preferredMode: 'online',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    startTime: '17:00',
    budget: 950,
    status: 'pending',
    tutor: { name: 'Er. Ashutosh Tripathi', headline: 'Senior Physics Faculty' },
    message: 'Inquiring for 1-on-1 guidance in mechanics.',
    createdAt: new Date().toISOString()
  }
];

const TutorRequestsPage = ({ onNavigate, onEnterClassroom }) => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [activeTab, setActiveTab] = useState(isTeacher ? 'incoming' : 'outgoing');
  const [filterStatus, setFilterStatus] = useState('all');
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Response Modal State (for Accept / Reject)
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // 'accept' | 'reject'
  const [responseMsg, setResponseMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingRequest, setBookingRequest] = useState(null);
  const [bookingForm, setBookingForm] = useState({ date: '', durationMinutes: '60', mode: 'ONLINE', startTime: '', topic: '' });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    let res;
    if (activeTab === 'incoming') {
      res = await getIncomingRequests();
    } else {
      res = await getMyRequests();
    }

    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      setRequests(res.data);
    } else {
      setRequests(activeTab === 'incoming' ? SAMPLE_INCOMING_REQUESTS : SAMPLE_OUTGOING_REQUESTS);
    }
    setIsLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleOpenActionModal = (reqItem, type) => {
    setSelectedRequest(reqItem);
    setActionType(type);
    setResponseMsg(
      type === 'accept'
        ? 'I am excited to accept your tutoring request! Let us connect for scheduled sessions.'
        : 'Thank you for reaching out, but I am currently unavailable due to existing commitments.'
    );
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;
    setIsProcessing(true);
    setFeedback(null);

    let res;
    if (actionType === 'accept') {
      res = await acceptTutorRequest(selectedRequest.id, responseMsg);
    } else {
      res = await rejectTutorRequest(selectedRequest.id, responseMsg);
    }

    setIsProcessing(false);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: actionType === 'accept'
          ? 'Request accepted! A live Teaching Session has been created and linked.'
          : 'Request declined.'
      });
      setSelectedRequest(null);
      fetchRequests();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to process request' });
    }
  };

  const handleCancelRequest = async (reqId) => {
    if (!window.confirm('Are you sure you want to cancel this tutoring request?')) return;
    const res = await cancelTutorRequest(reqId);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Request cancelled successfully.' });
      fetchRequests();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to cancel request' });
    }
  };

  const openBooking = (request) => {
    setBookingRequest(request);
    setAvailableSlots([]);
    setBookingForm({
      date: '',
      durationMinutes: '60',
      mode: request.preferredMode === 'offline' ? 'OFFLINE' : 'ONLINE',
      startTime: '',
      topic: ''
    });
  };

  const loadAvailableSlots = async () => {
    if (!bookingRequest || !bookingForm.date) {
      setFeedback({ type: 'error', message: 'Select a class date first.' });
      return;
    }
    setIsLoadingSlots(true);
    const result = await getTutorBookingSlots(bookingRequest.id, {
      date: bookingForm.date,
      durationMinutes: bookingForm.durationMinutes,
      mode: bookingForm.mode
    });
    setIsLoadingSlots(false);
    if (!result.success) {
      setFeedback({ type: 'error', message: result.error });
      setAvailableSlots([]);
      return;
    }
    setAvailableSlots(result.data.slots || []);
    setBookingForm(current => ({ ...current, startTime: result.data.slots?.[0] || '' }));
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    if (!bookingRequest || !bookingForm.startTime) return;
    setIsProcessing(true);
    const result = await createTutorBooking({
      tutorRequestId: bookingRequest.id,
      date: bookingForm.date,
      startTime: bookingForm.startTime,
      durationMinutes: Number(bookingForm.durationMinutes),
      mode: bookingForm.mode,
      topic: bookingForm.topic
    });
    setIsProcessing(false);
    if (!result.success) {
      setFeedback({ type: 'error', message: result.error });
      return;
    }
    setBookingRequest(null);
    setFeedback({ type: 'success', message: 'Booking request sent to the tutor for confirmation.' });
    fetchRequests();
  };

  const handleBookingDecision = async (request, decision) => {
    if (!request.teachingSession?.id) return;
    const result = decision === 'confirm'
      ? await confirmTutorBooking(request.teachingSession.id)
      : await rejectTutorBooking(request.teachingSession.id, 'Tutor declined booking');
    setFeedback(result.success
      ? { type: 'success', message: decision === 'confirm' ? 'Class booking confirmed.' : 'Class booking declined.' }
      : { type: 'error', message: result.error });
    if (result.success) fetchRequests();
  };

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Accepted</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Declined</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Tutor Booking Requests</h1>
              <p className="text-xs text-slate-500">
                Track and manage tutoring engagements, schedules, and live classroom links.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate('find-tutors')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Explore Tutors
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Main Controls: Perspective Tab & Status Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          
          {/* Incoming / Outgoing Tabs (for teachers) */}
          <div className="flex items-center space-x-2">
            {isTeacher && (
              <button
                onClick={() => { setActiveTab('incoming'); setFeedback(null); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'incoming'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Incoming Tutor Requests</span>
              </button>
            )}

            <button
              onClick={() => { setActiveTab('outgoing'); setFeedback(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'outgoing'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTeacher ? 'My Outgoing Requests' : 'My Sent Tutor Requests'}</span>
            </button>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs">
            {['all', 'pending', 'accepted', 'rejected'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-colors ${
                  filterStatus === st ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-xs">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">No requests found</h3>
            <p className="text-xs text-slate-500">There are no {filterStatus !== 'all' ? filterStatus : ''} requests in this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((reqItem) => {
              const isIncoming = activeTab === 'incoming';
              const otherPartyName = isIncoming
                ? reqItem.requester?.name || 'Learner'
                : reqItem.tutorProfile?.user?.name || 'Tutor';

              return (
                <div
                  key={reqItem.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center">
                        {otherPartyName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {isIncoming ? `Request from ${otherPartyName}` : `Request to ${otherPartyName}`}
                        </h3>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {isIncoming ? `Role: ${reqItem.requesterRole}` : 'Educator'} • Sent {new Date(reqItem.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getStatusBadge(reqItem.status)}
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 block font-medium">Subject & Level</span>
                      <span className="font-bold text-slate-800">
                        {reqItem.subject} {reqItem.gradeLevel ? `(${reqItem.gradeLevel})` : ''}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 block font-medium">Mode & Budget</span>
                      <span className="font-bold text-slate-800 capitalize">
                        {reqItem.preferredMode} {reqItem.budget ? `• ₹${reqItem.budget}/hr` : ''}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-slate-400 block font-medium">Preferred Schedule</span>
                      <span className="font-bold text-slate-800">
                        {reqItem.scheduledDate
                          ? `${reqItem.scheduledDate} • ${String(reqItem.startTime).slice(0, 5)}–${String(reqItem.endTime).slice(0, 5)}`
                          : reqItem.preferredSchedule || 'Flexible'}
                      </span>
                    </div>
                  </div>

                  {/* Message */}
                  {reqItem.message && (
                    <div className="text-xs text-slate-600 bg-slate-50/60 p-3 rounded-xl">
                      <span className="font-semibold text-slate-700">Message: </span>
                      {reqItem.message}
                    </div>
                  )}

                  {/* Response Message */}
                  {reqItem.responseMessage && (
                    <div className="text-xs text-indigo-900 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                      <span className="font-semibold text-indigo-950">Tutor Response: </span>
                      {reqItem.responseMessage}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      {reqItem.status === 'accepted' && !isIncoming && !reqItem.teachingSessionId && (
                        <button
                          onClick={() => openBooking(reqItem)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                        >
                          Book a class
                        </button>
                      )}

                      {isIncoming && reqItem.teachingSession?.bookingStatus === 'REQUESTED' && (
                        <div className="flex items-center gap-2 ml-auto">
                          <button onClick={() => handleBookingDecision(reqItem, 'reject')} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Decline class</button>
                          <button onClick={() => handleBookingDecision(reqItem, 'confirm')} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Confirm class</button>
                        </div>
                      )}

                      {reqItem.status === 'accepted' && reqItem.teachingSession?.bookingStatus === 'CONFIRMED' && (
                        <button
                          onClick={() => {
                            if (onEnterClassroom) onNavigate('my-bookings');
                            else onNavigate('my-bookings');
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>View class</span>
                      </button>
                    )}

                    {/* Incoming Actions for Tutor */}
                    {isIncoming && reqItem.status === 'pending' && (
                      <div className="flex items-center space-x-2 ml-auto">
                        <button
                          onClick={() => handleOpenActionModal(reqItem, 'reject')}
                          className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleOpenActionModal(reqItem, 'accept')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                        >
                          Accept request
                        </button>
                      </div>
                    )}

                    {/* Outgoing Cancel for Requester */}
                    {!isIncoming && reqItem.status === 'pending' && (
                      <button
                        onClick={() => handleCancelRequest(reqItem.id)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-semibold ml-auto"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Accept / Decline Response Modal */}
        {selectedRequest && actionType && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  {actionType === 'accept' ? 'Accept Tutor Request' : 'Decline Request'}
                </h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Response Message for {selectedRequest.requester?.name || 'Learner'}
                  </label>
                  <textarea
                    rows={3}
                    value={responseMsg}
                    onChange={(e) => setResponseMsg(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {actionType === 'accept' && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    <span className="font-bold">Booking flow: </span>
                    The learner will choose an available slot after you accept. The class is created after the tutor confirms that booking.
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    disabled={isProcessing}
                    className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs disabled:opacity-50 ${
                      actionType === 'accept'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {isProcessing ? 'Processing...' : actionType === 'accept' ? 'Confirm & Accept' : 'Confirm Decline'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {bookingRequest && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
            <form onSubmit={submitBooking} className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div><h3 className="text-lg font-bold text-slate-900">Book a class</h3><p className="text-xs text-slate-500">Available times are based on the tutor's active schedule.</p></div>
                <button type="button" onClick={() => setBookingRequest(null)} aria-label="Close booking form"><X className="w-5 h-5" /></button>
              </div>
              <label className="block text-xs font-semibold text-slate-600">Date<input required type="date" min={new Date().toISOString().slice(0, 10)} value={bookingForm.date} onChange={(event) => { setBookingForm({ ...bookingForm, date: event.target.value, startTime: '' }); setAvailableSlots([]); }} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-slate-600">Duration<select value={bookingForm.durationMinutes} onChange={(event) => { setBookingForm({ ...bookingForm, durationMinutes: event.target.value, startTime: '' }); setAvailableSlots([]); }} className="mt-1 w-full rounded-xl border border-slate-200 p-2"><option value="30">30 minutes</option><option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option></select></label>
                <label className="text-xs font-semibold text-slate-600">Mode<select value={bookingForm.mode} onChange={(event) => { setBookingForm({ ...bookingForm, mode: event.target.value, startTime: '' }); setAvailableSlots([]); }} className="mt-1 w-full rounded-xl border border-slate-200 p-2"><option value="ONLINE">Online</option><option value="OFFLINE">Offline</option></select></label>
              </div>
              <button type="button" disabled={!bookingForm.date || isLoadingSlots} onClick={loadAvailableSlots} className="w-full rounded-xl border border-indigo-200 bg-indigo-50 py-2 text-sm font-bold text-indigo-700 disabled:opacity-50">{isLoadingSlots ? 'Checking times…' : 'Show available times'}</button>
              {availableSlots.length > 0 && <label className="block text-xs font-semibold text-slate-600">Available start time<select required value={bookingForm.startTime} onChange={(event) => setBookingForm({ ...bookingForm, startTime: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2">{availableSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}</select></label>}
              {bookingForm.date && !isLoadingSlots && availableSlots.length === 0 && <p className="text-xs text-amber-700">No available times for this date and duration.</p>}
              <label className="block text-xs font-semibold text-slate-600">Topic or note (optional)<textarea maxLength={500} value={bookingForm.topic} onChange={(event) => setBookingForm({ ...bookingForm, topic: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2" rows="2" /></label>
              <button disabled={isProcessing || !bookingForm.startTime} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white disabled:opacity-50">{isProcessing ? 'Sending…' : 'Request booking'}</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default TutorRequestsPage;
