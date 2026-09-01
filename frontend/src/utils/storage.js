const API_BASE_URL = 'http://localhost:5001/api';

export const getEnrolledStaff = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/staff`);
    if (!res.ok) throw new Error('Failed to fetch staff');
    const data = await res.json();
    // Transform backend fields to match what frontend expects
    return data.map(staff => ({
      id: staff.staffId, // frontend uses `id` as `staffId` in FaceMatcher
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
  try {
    const res = await fetch(`${API_BASE_URL}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        staffId: staffData.id,
        name: staffData.name,
        department: staffData.department,
        photoUrl: staffData.photoUrl,
        faceDescriptor: staffData.descriptor
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
  try {
    const res = await fetch(`${API_BASE_URL}/attendance`);
    if (!res.ok) throw new Error('Failed to fetch logs');
    const data = await res.json();
    
    // Transform backend fields to match what frontend expects
    return data.map(log => {
      // Backend handles checkIn and checkOut separate times on same record or separate records.
      // Based on our implementation, it creates a new record for every scan with either checkInTime or checkOutTime
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

export const logAttendance = async (staffId, staffName) => {
  try {
    const res = await fetch(`${API_BASE_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId })
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
