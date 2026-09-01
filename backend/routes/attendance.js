const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/attendance - Log attendance
router.post('/', async (req, res) => {
  try {
    const { staffId } = req.body;
    if (!staffId) return res.status(400).json({ error: 'Staff ID is required' });

    const staff = await prisma.staff.findUnique({ where: { staffId } });
    if (!staff) return res.status(404).json({ error: 'Staff not found' });

    // Determine if Check-in or Check-out
    // We check if there's already a log for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const logsToday = await prisma.attendance.findMany({
      where: {
        staffId: staff.id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Handle cooldown (e.g. 1 minute)
    const now = new Date();
    if (logsToday.length > 0) {
      const lastLog = logsToday[0];
      const diffMs = now.getTime() - lastLog.createdAt.getTime();
      if (diffMs < 60 * 1000) { // 1 minute cooldown
        return res.status(429).json({ error: 'Cooldown active (1 min)' });
      }
    }

    // If even number of logs today, it's a check-in. If odd, it's a check-out.
    const isCheckIn = logsToday.length % 2 === 0;

    let attendance;
    if (isCheckIn) {
      attendance = await prisma.attendance.create({
        data: {
          staffId: staff.id,
          checkInTime: now,
          status: 'present'
        }
      });
    } else {
      // Find the last check-in and update it with a check-out time
      // Or just create a new record for checkout
      attendance = await prisma.attendance.create({
        data: {
          staffId: staff.id,
          checkOutTime: now,
          status: 'present' // Or whatever logic you want
        }
      });
    }

    res.status(201).json({ 
      message: 'Attendance logged', 
      type: isCheckIn ? 'Check-in' : 'Check-out',
      staffName: staff.name,
      attendance 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/attendance - Get history
router.get('/', async (req, res) => {
  try {
    const attendances = await prisma.attendance.findMany({
      include: {
        staff: {
          select: { staffId: true, name: true, department: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(attendances);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
