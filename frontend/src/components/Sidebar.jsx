import React from 'react';
import { NavLink } from 'react-router-dom';
import { Camera, UserPlus, History } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { path: '/scan', icon: Camera, label: 'Scan Attendance' },
    { path: '/enroll', icon: UserPlus, label: 'Enroll Staff' },
    { path: '/history', icon: History, label: 'History Logs' }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">FaceGuard</h1>
        <p className="text-sm text-gray-500 mt-1">Staff Attendance</p>
      </div>
      
      <nav className="flex-1 mt-6">
        <ul>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-6 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Powered by face-api.js
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
