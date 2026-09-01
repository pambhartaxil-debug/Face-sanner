const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/staff - Enroll new staff
router.post('/', async (req, res) => {
  try {
    const { staffId, name, department, photoUrl, faceDescriptor } = req.body;

    if (!staffId || !name || !faceDescriptor) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert faceDescriptor array to JSON string
    const descriptorString = JSON.stringify(faceDescriptor);

    const staff = await prisma.staff.create({
      data: {
        staffId,
        name,
        department,
        photoUrl,
        faceDescriptor: descriptorString
      }
    });

    res.status(201).json({ message: 'Staff enrolled successfully', staffId: staff.staffId });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Staff ID already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/staff - Get all enrolled staff (Frontend needs this to load descriptors)
router.get('/', async (req, res) => {
  try {
    const staffMembers = await prisma.staff.findMany();
    
    // Parse the JSON string back to an array for the frontend
    const parsedStaff = staffMembers.map(staff => ({
      ...staff,
      faceDescriptor: JSON.parse(staff.faceDescriptor)
    }));

    res.json(parsedStaff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/staff/:id - Get single staff
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const staff = await prisma.staff.findUnique({ where: { staffId: req.params.id } });
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    
    staff.faceDescriptor = JSON.parse(staff.faceDescriptor);
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
