import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStudentAttendance, getStudentAttendanceSummary } from '../services/studentService';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Filter,
  RefreshCw,
  Search,
  ArrowLeft,
  AlertCircle,
  Loader2,
  TrendingUp,
  Percent,
  Layers
} from 'lucide-react';

const statusBadgeStyles = {
  present: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
  absent: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20',
  late: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20',
  leave: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20'
};

const statusIcons = {
  present: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
  absent: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
  late: <Clock className="w-3.5 h-3.5 text-amber-600" />,
  leave: <FileText className="w-3.5 h-3.5 text-blue-600" />
};

const StudentAttendance = ({ onNavigateBack }) => {
  const { user } = useAuth();

  const [attendanceList, setAttendanceList] = useState([]);
  const [summary, setSummary] = useState({
    totalClasses: 0,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    attendancePercentage: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    subject: '',
    startDate: '',
    endDate: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    subject: '',
    startDate: '',
    endDate: ''
  });

  const fetchAttendanceData = async (filterParams = appliedFilters) => {
    setIsLoading(true);
    setError(null);

    const [attRes, sumRes] = await Promise.all([
      getStudentAttendance(filterParams),
      getStudentAttendanceSummary(filterParams)
    ]);

    if (attRes.success && sumRes.success) {
      setAttendanceList(attRes.data || []);
      setSummary(sumRes.data || {
        totalClasses: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        attendancePercentage: 0
      });
    } else {
      setError(attRes.error || sumRes.error || 'Failed to load attendance records');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchAttendanceData(appliedFilters);
  }, [appliedFilters]);

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
    const cleared = { subject: '', startDate: '', endDate: '' };
    setFilters(cleared);
    setAppliedFilters(cleared);
    setError(null);
  };

  // Helper for attendance progress bar coloring
  const getPercentageColor = (pct) => {
    if (pct >= 75) return 'text-emerald-600 border-emerald-500 bg-emerald-50';
    if (pct >= 60) return 'text-amber-600 border-amber-500 bg-amber-50';
    return 'text-rose-600 border-rose-500 bg-rose-50';
  };

  const getProgressBarBg = (pct) => {
    if (pct >= 75) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
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
                My Attendance Records
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Step 4B Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Subject-wise attendance log and percentage analytics
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchAttendanceData(appliedFilters)}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-xs sm:text-sm text-rose-800 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Attendance Error</p>
            <p className="text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Attendance Summary Analytics Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Attendance Percentage Gauge */}
        <div className="sm:col-span-2 lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Attendance Percentage</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                {summary.attendancePercentage}%
              </h3>
            </div>
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center font-bold text-lg ${getPercentageColor(summary.attendancePercentage)}`}>
              <Percent className="w-7 h-7" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressBarBg(summary.attendancePercentage)}`}
                style={{ width: `${Math.min(summary.attendancePercentage, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>Required: 75% Minimum</span>
              <span className={summary.attendancePercentage >= 75 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                {summary.attendancePercentage >= 75 ? 'Eligible' : 'Shortage'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Classes */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Classes</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{summary.totalClasses}</p>
          <p className="text-[11px] text-slate-500 mt-1">Conducted sessions</p>
        </div>

        {/* Card 3: Present Classes */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Present</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-3">{summary.present}</p>
          <p className="text-[11px] text-slate-500 mt-1">Classes attended</p>
        </div>

        {/* Card 4: Absent & Other */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Absent / Leaves</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-3">
            {summary.absent} <span className="text-xs font-normal text-slate-400">({summary.late}L / {summary.leave}Lv)</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Missed sessions</p>
        </div>

      </section>

      {/* Filter Bar */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Filter Attendance History</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            
            {/* Subject */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Subject Name</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Mathematics / Physics"
                  value={filters.subject}
                  onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">To Date</label>
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

      {/* Attendance History Table */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Attendance Log</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {attendanceList.length} recorded session{attendanceList.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Loading attendance history...</p>
          </div>
        ) : attendanceList.length === 0 ? (
          <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Attendance Records</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No classroom attendance entries match your current search filters or date range.
            </p>
            {(appliedFilters.subject || appliedFilters.startDate || appliedFilters.endDate) && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {attendanceList.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 whitespace-nowrap font-mono text-slate-900">
                      {record.date}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {record.subject}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                        statusBadgeStyles[record.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {statusIcons[record.status]}
                        <span>{record.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 max-w-xs truncate">
                      {record.remarks || <span className="text-slate-300 italic">None</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
};

export default StudentAttendance;
