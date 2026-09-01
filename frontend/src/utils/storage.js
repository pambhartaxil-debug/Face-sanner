const API_BASE_URL = 'http://localhost:5001/api';
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const getEnrolledStaff = async () => {
  if (!isLocal) {
    const data = localStorage.getItem('enrolledStaff');
    return data ? JSON.parse(data) : [];
  }
  
  try {
    const res = await fetch(`${API_BASE_URL}/staff`);
    if (!res.ok) throw new Error('Failed to fetch staff');
    const data = await res.json();
    return data.map(staff => ({
      id: staff.staffId,
      name: staff.name,
      department: staff.department,
      photoUrl: staff.photoUrl,
      descriptor: staff.faceDescriptor
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const enrollStaff = async (staffData) => {
  if (!isLocal) {
    const staff = await getEnrolledStaff();
    const staffToSave = { ...staffData, descriptor: Array.from(staffData.descriptor) };
    staff.push(staffToSave);
    localStorage.setItem('enrolledStaff', JSON.stringify(staff));
    return staffToSave;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        staffId: staffData.id,
        name: staffData.name,
        department: staffData.department,
        photoUrl: staffData.photoUrl,
        faceDescriptor: Array.from(staffData.descriptor)
      })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to enroll');
    }
    return await res.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const getAttendanceLogs = async () => {
  if (!isLocal) {
    const logs = localStorage.getItem('attendanceLogs');
    return logs ? JSON.parse(logs) : [];
  }

  try {
    const res = await fetch(`${API_BASE_URL}/attendance`);
    if (!res.ok) throw new Error('Failed to fetch logs');
    const data = await res.json();
    
    return data.map(log => {
      const time = log.checkInTime || log.checkOutTime || log.createdAt;
      const type = log.checkInTime ? 'Check-in' : 'Check-out';
      
      return {
        id: log.id,
        staffId: log.staff.staffId,
        staffName: log.staff.name,
        timestamp: time,
        status: type
      };
    });
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const logAttendance = async (staffId, staffName, status = null) => {
  if (!isLocal) {
    const logs = await getAttendanceLogs();
    const now = new Date();
    
    const lastLog = logs.find(log => log.staffId === staffId);
    if (lastLog) {
      const diffMins = (now - new Date(lastLog.timestamp)) / 60000;
      if (diffMins < 1) {
        return { success: false, message: 'Already checked in recently. Please wait 1 minute.' };
      }
    }

    let finalStatus;
    if (status) {
      finalStatus = status;
    } else {
      finalStatus = (!lastLog || lastLog.status === 'Check-out') ? 'Check-in' : 'Check-out';
    }

    const newLog = {
      id: Date.now().toString(),
      staffId,
      staffName,
      timestamp: now.toISOString(),
      status: finalStatus
    };

    logs.unshift(newLog);
    localStorage.setItem('attendanceLogs', JSON.stringify(logs));
    return { success: true, log: newLog };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, type: status })
    });
    
    const data = await res.json();
    
    if (res.status === 429) {
      return { success: false, message: 'Cooldown active (1 min)' };
    }
    
    if (!res.ok) {
      return { success: false, message: data.error || 'Failed to log attendance' };
    }
    
    return { 
      success: true, 
      log: {
        status: data.type,
      } 
    };
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Network error' };
  }
};

export const syncHikvision = async (ip, username, password) => {
  if (!isLocal) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          success: false, 
          message: 'Hikvision Sync is only available when running locally (localhost) due to browser security.' 
        });
      }, 1500);
    });
  }

  try {
    const res = await fetch(`${API_BASE_URL}/hikvision/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, username, password })
    });
    
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.error || 'Sync failed' };
    }
    
    return { success: true, message: data.message };
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Network error connecting to backend' };
  }
};
