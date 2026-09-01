import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Enrollment from './pages/Enrollment';
import Scan from './pages/Scan';
import History from './pages/History';

function App() {
  return (
    <HashRouter>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/scan" replace />} />
            <Route path="/enroll" element={<Enrollment />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
