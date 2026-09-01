export const getEnrolledStaff = async () => {
  const data = localStorage.getItem('enrolledStaff');
  return data ? JSON.parse(data) : [];
};

export const enrollStaff = async (staffData) => {
  const staff = await getEnrolledStaff();
  const staffToSave = { ...staffData, descriptor: Array.from(staffData.descriptor) };
  staff.push(staffToSave);
  localStorage.setItem('enrolledStaff', JSON.stringify(staff));
  return staffToSave;
};

export const getAttendanceLogs = async () => {
  const logs = localStorage.getItem('attendanceLogs');
  return logs ? JSON.parse(logs) : [];
};

export const logAttendance = async (staffId, staffName, status = null) => {
  const logs = await getAttendanceLogs();
  const now = new Date();
  
  const lastLog = logs.find(log => log.staffId === staffId);
  if (lastLog) {
    const diffMins = (now - new Date(lastLog.timestamp)) / 60000;
    if (diffMins < 1) {
      return { success: false, message: 'Already checked in recently. Please wait 1 minute.' };
    }
  }

  // Use passed status, or fallback to toggling
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
};
