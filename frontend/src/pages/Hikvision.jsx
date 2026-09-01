import React, { useState } from 'react';
import { syncHikvision } from '../utils/storage';
import { Download, CheckCircle, AlertCircle } from 'lucide-react';

const Hikvision = () => {
  const [formData, setFormData] = useState({ ip: '', username: 'admin', password: '' });
  const [status, setStatus] = useState(''); // 'syncing', 'success', 'error'
  const [message, setMessage] = useState('');

  const handleSync = async (e) => {
    e.preventDefault();
    if (!formData.ip || !formData.username || !formData.password) {
      setStatus('error');
      setMessage('Please fill in all fields');
      return;
    }

    setStatus('syncing');
    setMessage('Connecting to Hikvision device...');

    const res = await syncHikvision(formData.ip, formData.username, formData.password);
    
    if (res.success) {
      setStatus('success');
      setMessage(res.message);
    } else {
      setStatus('error');
      setMessage(res.message);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Hikvision Integration</h2>
        <p className="text-gray-600 mt-2">Sync attendance logs directly from your Hikvision Face Scanner over the local network.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSync} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device IP Address</label>
            <input
              type="text"
              placeholder="e.g. 192.168.1.64"
              value={formData.ip}
              onChange={(e) => setFormData({...formData, ip: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'syncing'}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          >
            {status === 'syncing' ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Syncing...
              </span>
            ) : (
              <span className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Sync Logs Now
              </span>
            )}
          </button>
        </form>

        {status === 'success' && (
          <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <p>{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hikvision;
