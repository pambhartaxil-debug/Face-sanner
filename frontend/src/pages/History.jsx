import React, { useState, useEffect } from 'react';
import { getAttendanceLogs } from '../utils/storage';
import { Download, Search, Filter } from 'lucide-react';

const History = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      const fetchedLogs = await getAttendanceLogs();
      setLogs(fetchedLogs);
    };
    fetchLogs();
  }, []);

  const handleExportCSV = () => {
    if (logs.length === 0) return;

    const headers = ['ID', 'Staff Name', 'Staff ID', 'Status', 'Date', 'Time'];
    const rows = logs.map(log => {
      const d = new Date(log.timestamp);
      return [
        log.id,
        log.staffName,
        log.staffId,
        log.status,
        d.toLocaleDateString(),
        d.toLocaleTimeString()
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(log => {
    const matchName = log.staffName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      log.staffId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (dateFilter) {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      return matchName && logDate === dateFilter;
    }
    return matchName;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance History</h2>
          <p className="text-gray-600 mt-1">View and export staff attendance records.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export to CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-semibold">Staff Member</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No attendance logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const d = new Date(log.timestamp);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{log.staffName}</div>
                        <div className="text-xs text-gray-500">{log.staffId}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'Check-in' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 text-sm text-gray-600 font-medium">
                        {d.toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
