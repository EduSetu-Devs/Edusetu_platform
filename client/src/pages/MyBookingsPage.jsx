import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Clock3, Loader2, MapPin, MonitorPlay, RefreshCw, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  cancelTutorBooking,
  confirmTutorBooking,
  getTutorBookingSlots,
  getTutorBookings,
  reportTutorBooking,
  rejectTutorBooking,
  rescheduleTutorBooking,
  getTutorAssignmentEligibility
} from '../services/tutorService';
import { startTeacherSession } from '../services/teacherService';
import { joinStudentSession } from '../services/studentService';

const SAMPLE_BOOKINGS = [
  {
    id: 101,
    tutorName: 'Er. Ashutosh Tripathi',
    studentName: 'Aarav Sharma',
    subject: 'Physics',
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    startTime: '17:00',
    durationMinutes: 60,
    mode: 'ONLINE',
    status: 'CONFIRMED',
    hourlyRate: 950,
    topic: 'Rotational Motion & Moment of Inertia'
  },
  {
    id: 102,
    tutorName: 'Er. Ashutosh Tripathi',
    studentName: 'Rohan Mehra',
    subject: 'Mathematics',
    date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    startTime: '18:00',
    durationMinutes: 60,
    mode: 'ONLINE',
    status: 'CONFIRMED',
    hourlyRate: 850,
    topic: 'Trigonometric Equations & Graphs'
  },
  {
    id: 103,
    tutorName: 'Er. Ashutosh Tripathi',
    studentName: 'Sneha Patel',
    subject: 'Physics',
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    startTime: '16:00',
    durationMinutes: 60,
    mode: 'ONLINE',
    status: 'COMPLETED',
    hourlyRate: 950,
    topic: 'Ray Optics & Refraction at Spherical Surfaces'
  }
];

const MyBookingsPage = ({ onNavigateToClassroom, onNavigateBack }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [editing, setEditing] = useState(null);
  const [schedule, setSchedule] = useState({ date: '', durationMinutes: '60', mode: 'ONLINE', startTime: '' });
  const [slots, setSlots] = useState([]);
  const [saving, setSaving] = useState(false);
  const [assignmentEligibility, setAssignmentEligibility] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [result, eligibility] = await Promise.all([
      getTutorBookings(),
      user?.role === 'teacher' ? Promise.resolve(null) : getTutorAssignmentEligibility()
    ]);
    if (result.success && result.data && result.data.length > 0) {
      setBookings(result.data);
    } else if (result.success) {
      setBookings(SAMPLE_BOOKINGS);
    } else {
      setBookings(SAMPLE_BOOKINGS);
      if (result.error) setFeedback(result.error);
    }
    if (eligibility?.success) setAssignmentEligibility(eligibility.data);
    else if (eligibility) setFeedback(eligibility.error);
    setLoading(false);
  }, [user?.role]);

  useEffect(() => { load(); }, [load]);

  const refreshSlots = async () => {
    if (!editing || !schedule.date) return;
    const result = await getTutorBookingSlots(editing.tutorRequestId, {
      date: schedule.date,
      durationMinutes: schedule.durationMinutes,
      mode: schedule.mode
    });
    if (!result.success) {
      setFeedback(result.error);
      setSlots([]);
      return;
    }
    setSlots(result.data.slots || []);
    setSchedule(current => ({ ...current, startTime: result.data.slots?.[0] || '' }));
  };

  const doBookingAction = async (action, bookingId, reason = '') => {
    setSaving(true);
    setFeedback('');
    const result = await action(bookingId, reason);
    setSaving(false);
    if (!result.success) {
      setFeedback(result.error);
      return false;
    }
    await load();
    return true;
  };

  const reportIssue = async (booking) => {
    const description = window.prompt('Describe the booking issue (up to 2000 characters):');
    if (description === null) return;
    const category = window.prompt(
      'Issue category: TUTOR_ISSUE, STUDENT_ISSUE, BOOKING_ISSUE, TECHNICAL_ISSUE, OTHER',
      user?.role === 'teacher' ? 'STUDENT_ISSUE' : 'TUTOR_ISSUE'
    );
    if (category === null) return;
    setSaving(true);
    const result = await reportTutorBooking(booking.id, { category, description });
    setSaving(false);
    setFeedback(result.success ? 'Issue report submitted to the administrator.' : result.error);
  };

  const submitReschedule = async (event) => {
    event.preventDefault();
    if (!editing || !schedule.startTime) return;
    const ok = await doBookingAction(rescheduleTutorBooking, editing.id, {
      date: schedule.date,
      startTime: schedule.startTime,
      durationMinutes: Number(schedule.durationMinutes),
      mode: schedule.mode
    });
    if (ok) setEditing(null);
  };

  const isTutor = user?.role === 'teacher';
  const title = isTutor ? 'My Tutor Bookings' : 'My Classes & Bookings';
  const canManageBooking = booking => {
    if (isTutor) return true;
    if (user?.role === 'student') return Boolean(assignmentEligibility?.canRequest);
    if (user?.role === 'parent') {
      return Boolean(assignmentEligibility?.children?.some(
        child => child.studentProfileId === booking.studentProfileId && child.canRequest
      ));
    }
    return false;
  };

  return (
    <div className="max-w-5xl mx-auto my-8 px-4 space-y-6">
      <div>
        {onNavigateBack && <button onClick={onNavigateBack} className="mb-2 text-xs font-semibold text-indigo-600">← Back</button>}
        <h1 className="text-3xl font-black text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">Marketplace bookings are teaching sessions. Pending requests need tutor confirmation before class.</p>
      </div>
      {feedback && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{feedback}</div>}
      {loading ? <div className="p-10 text-center"><Loader2 className="mx-auto animate-spin text-indigo-600" /></div> : bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No marketplace classes yet.</div>
      ) : bookings.map(booking => (
        <article key={booking.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-slate-900">{booking.subject}</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">{booking.bookingStatus || booking.status}</span>
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">{booking.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{isTutor ? `Student: ${booking.studentName}` : `Tutor: ${booking.teacherName}`}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{booking.date}</span>
                <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{booking.startTime}–{booking.endTime} ({booking.durationMinutes} min)</span>
                <span className="inline-flex items-center gap-1">{booking.mode === 'ONLINE' ? <MonitorPlay className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}{booking.mode === 'ONLINE' ? 'Online' : booking.location || 'Tutor area'}</span>
              </div>
              {booking.topic && <p className="mt-3 text-xs text-slate-600">{booking.topic}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {isTutor && booking.bookingStatus === 'REQUESTED' && <button disabled={saving} onClick={() => doBookingAction(confirmTutorBooking, booking.id)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Confirm</button>}
              {isTutor && booking.bookingStatus === 'REQUESTED' && <button disabled={saving} onClick={() => doBookingAction(rejectTutorBooking, booking.id, 'Tutor declined booking')} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">Decline</button>}
              {!isTutor && canManageBooking(booking) && ['REQUESTED', 'CONFIRMED'].includes(booking.bookingStatus) && booking.status === 'SCHEDULED' && <button disabled={saving} onClick={() => { setEditing(booking); setSchedule({ date: '', durationMinutes: String(booking.durationMinutes), mode: booking.mode, startTime: '' }); setSlots([]); }} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"><RefreshCw className="h-3.5 w-3.5" />Reschedule</button>}
              {canManageBooking(booking) && ['REQUESTED', 'CONFIRMED'].includes(booking.bookingStatus) && booking.status === 'SCHEDULED' && <button disabled={saving} onClick={() => { const reason = window.prompt('Cancellation reason (optional):'); if (reason !== null) doBookingAction(cancelTutorBooking, booking.id, reason); }} className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50"><XCircle className="h-3.5 w-3.5" />Cancel</button>}
              <button disabled={saving} onClick={() => reportIssue(booking)} className="rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold text-amber-800 disabled:opacity-50">Report issue</button>
              {isTutor && booking.mode === 'ONLINE' && booking.bookingStatus === 'CONFIRMED' && booking.status === 'SCHEDULED' && <button disabled={saving} onClick={() => doBookingAction(startTeacherSession, booking.id).then(ok => { if (ok) onNavigateToClassroom(booking.id); })} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Start class</button>}
              {!isTutor && booking.mode === 'ONLINE' && booking.status === 'LIVE' && <button disabled={saving} onClick={async () => { const result = await joinStudentSession(booking.id); if (result.success) onNavigateToClassroom(booking.id); else setFeedback(result.error); }} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Join class</button>}
            </div>
          </div>
        </article>
      ))}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form onSubmit={submitReschedule} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6">
            <h2 className="text-lg font-bold">Request a new class time</h2>
            <label className="block text-xs font-semibold">Date<input required type="date" min={new Date().toISOString().slice(0, 10)} value={schedule.date} onChange={event => { setSchedule({ ...schedule, date: event.target.value, startTime: '' }); setSlots([]); }} className="mt-1 w-full rounded-xl border p-2" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold">Duration<select value={schedule.durationMinutes} onChange={event => { setSchedule({ ...schedule, durationMinutes: event.target.value, startTime: '' }); setSlots([]); }} className="mt-1 w-full rounded-xl border p-2">{[30, 60, 90, 120].map(minutes => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>
              <label className="text-xs font-semibold">Mode<select value={schedule.mode} onChange={event => { setSchedule({ ...schedule, mode: event.target.value, startTime: '' }); setSlots([]); }} className="mt-1 w-full rounded-xl border p-2"><option value="ONLINE">Online</option><option value="OFFLINE">Offline</option></select></label>
            </div>
            <button type="button" onClick={refreshSlots} disabled={!schedule.date} className="w-full rounded-xl bg-indigo-50 p-2 text-xs font-bold text-indigo-700 disabled:opacity-50">Check available times</button>
            {slots.length > 0 && <label className="block text-xs font-semibold">Start time<select required value={schedule.startTime} onChange={event => setSchedule({ ...schedule, startTime: event.target.value })} className="mt-1 w-full rounded-xl border p-2">{slots.map(slot => <option key={slot}>{slot}</option>)}</select></label>}
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-xl px-3 py-2 text-xs font-bold">Close</button><button disabled={saving || !schedule.startTime} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Request reschedule</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
