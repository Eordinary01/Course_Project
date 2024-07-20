const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Be more specific in production
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set io instance on app to use in routes
app.set('io', io);

app.get('/', (req, res) => {
    res.json({message: 'Dev has Arrived! Server Started'});
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/bookings',require('./routes/booking'));

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 8890;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));