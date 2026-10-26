import React, { useCallback, useEffect, useState } from 'react';
import { getAdminMarketplaceBookings, getAdminMarketplaceReports, updateAdminMarketplaceReport } from '../services/adminService';

const AdminMarketplacePage = () => {
  const [bookings, setBookings] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('bookings');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [bookingResult, reportResult] = await Promise.all([
      getAdminMarketplaceBookings(),
      getAdminMarketplaceReports()
    ]);
    if (!bookingResult.success || !reportResult.success) {
      setError(bookingResult.error || reportResult.error);
    } else {
      setBookings(bookingResult.data.bookings || []);
      setReports(reportResult.data.reports || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateReport = async (report, status) => {
    const adminNote = window.prompt('Optional administrator note:', report.adminNote || '');
    if (adminNote === null) return;
    const result = await updateAdminMarketplaceReport(report.id, { status, adminNote });
    if (!result.success) setError(result.error);
    else await load();
  };

  return (
    <div className="mx-auto my-8 max-w-6xl space-y-6 px-4">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Tutor Marketplace Monitoring</h1>
        <p className="mt-1 text-sm text-slate-500">Review booking records and reported issues. Academic grades and attendance are not editable here.</p>
      </div>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('bookings')} className={`rounded-xl px-4 py-2 text-sm font-bold ${activeTab === 'bookings' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>Bookings ({bookings.length})</button>
        <button onClick={() => setActiveTab('reports')} className={`rounded-xl px-4 py-2 text-sm font-bold ${activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>Reports ({reports.length})</button>
      </div>
      {loading ? <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">Loading marketplace records…</p> : activeTab === 'bookings' ? (
        <div className="space-y-3">
          {bookings.length === 0 ? <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">No bookings found.</p> : bookings.map(booking => (
            <article key={booking.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="font-bold text-slate-900">{booking.subject} · {booking.date} {booking.startTime}–{booking.endTime}</h2><p className="mt-1 text-sm text-slate-600">Tutor: {booking.teacherName} · Student: {booking.studentName}</p><p className="mt-1 text-xs text-slate-500">{booking.mode} · {booking.status} · Booking {booking.bookingStatus || 'legacy'}</p></div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {reports.length === 0 ? <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">No reports found.</p> : reports.map(report => (
            <article key={report.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">{report.category.replaceAll('_', ' ')} · {report.status}</h2><p className="text-xs text-slate-500">By {report.reporter?.name} ({report.reporter?.role}) · Booking {report.booking?.id}</p></div><div className="flex gap-2"><button onClick={() => updateReport(report, 'REVIEWED')} className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">Mark reviewed</button><button onClick={() => updateReport(report, 'CLOSED')} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">Close</button></div></div>
              <p className="text-sm text-slate-700">{report.description}</p>
              {report.adminNote && <p className="text-xs text-slate-500">Admin note: {report.adminNote}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMarketplacePage;
