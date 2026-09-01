const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for photoUrl base64

// Routes
const authRoutes = require('./routes/auth');
const staffRoutes = require('./routes/staff');
const attendanceRoutes = require('./routes/attendance');
const hikvisionRoutes = require('./routes/hikvision');

app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/hikvision', hikvisionRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.send('Face Recognition Attendance API is running.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
