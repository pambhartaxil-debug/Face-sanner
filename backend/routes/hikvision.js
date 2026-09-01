const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { request } = require('urllib');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/hikvision/sync
router.post('/sync', async (req, res) => {
  const { ip, username, password } = req.body;

  if (!ip || !username || !password) {
    return res.status(400).json({ error: 'IP, username, and password are required' });
  }

  try {
    const url = `http://${ip}/ISAPI/AccessControl/AcsEvent?format=json`;
    
    // We get logs for the last 7 days (or adjust as needed)
    const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endTime = new Date().toISOString();

    const payload = {
      AcsEventCond: {
        searchID: "1",
        searchResultPosition: 0,
        maxResults: 1000, // Fetch up to 1000 recent logs
        major: 5,         // 5 is Event
        minor: 75,        // 75 is Face Authentication Pass
        startTime: startTime,
        endTime: endTime
      }
    };

    const { data, res: response } = await request(url, {
      method: 'POST',
      digestAuth: `${username}:${password}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: payload,
      dataType: 'json',
      timeout: 10000
    });

    if (response.status !== 200) {
      return res.status(response.status).json({ error: 'Failed to communicate with Hikvision machine', details: data });
    }

    const events = data?.AcsEvent?.InfoList || [];
    let syncedCount = 0;

    // Process each Hikvision event
    for (const event of events) {
      const staffId = event.employeeNoString;
      if (!staffId) continue;

      const eventTime = new Date(event.time);

      // Check if we already have this log
      const existingLog = await prisma.attendance.findFirst({
        where: {
          staff: { staffId },
          createdAt: {
            gte: new Date(eventTime.getTime() - 1000), // Within 1 second tolerance
            lte: new Date(eventTime.getTime() + 1000)
          }
        }
      });

      if (!existingLog) {
        // Find staff in our DB
        const staff = await prisma.staff.findUnique({ where: { staffId } });
        if (staff) {
          // Check previous log to toggle Check-in / Check-out
          const lastLog = await prisma.attendance.findFirst({
            where: { staffId: staff.id },
            orderBy: { createdAt: 'desc' }
          });
          const isCheckIn = !lastLog || lastLog.status === 'Check-out';
          
          await prisma.attendance.create({
            data: {
              staffId: staff.id,
              checkInTime: isCheckIn ? eventTime : null,
              checkOutTime: isCheckIn ? null : eventTime,
              status: isCheckIn ? 'Check-in' : 'Check-out',
              createdAt: eventTime
            }
          });
          syncedCount++;
        }
      }
    }

    res.json({ success: true, message: `Successfully synced ${syncedCount} new records from Hikvision.` });

  } catch (error) {
    console.error('Hikvision Sync Error:', error);
    res.status(500).json({ error: 'Failed to connect to Hikvision device. Check IP and credentials.' });
  }
});

module.exports = router;
