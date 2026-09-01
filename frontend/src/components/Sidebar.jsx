import React from 'react';
import { NavLink } from 'react-router-dom';
import { Camera, UserPlus, Clock, Server } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-blue-900 text-white flex flex-col h-full shadow-xl">
      <div className="p-6 border-b border-blue-800">
        <h1 className="text-2xl font-bold flex items-center">
          <Camera className="mr-2" />
          FaceID
        </h1>
        <p className="text-blue-300 text-sm mt-1">Attendance System</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <NavLink 
          to="/scan" 
          className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}
        >
          <Camera size={20} />
          <span>Scanner</span>
        </NavLink>
        
        <NavLink 
          to="/enroll" 
          className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}
        >
          <UserPlus size={20} />
          <span>Enroll Staff</span>
        </NavLink>
        
        <NavLink 
          to="/history" 
          className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}
        >
          <Clock size={20} />
          <span>History</span>
        </NavLink>

        <NavLink 
          to="/hikvision" 
          className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}
        >
          <Server size={20} />
          <span>Hikvision Sync</span>
        </NavLink>
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
