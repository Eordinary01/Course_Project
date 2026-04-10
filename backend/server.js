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

// CORS configuration
const allowedOrigins = [
    "http://localhost:3000",
    "https://course-project-frontend-omega.vercel.app",
    "https://course-project-frontend-omega.vercel.app/"
];

// Express CORS
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization']
}));

// Socket.io CORS
const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
        allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization']
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

app.use(express.json());

// MongoDB Connection with better error handling
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set io instance on app to use in routes
app.set('io', io);

// Make io available to routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Dev has Arrived! Server Started' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/bookings', require('./routes/booking'));

// Socket.io connection handling with better error handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Join a room based on user ID if authenticated
    socket.on('authenticate', (userId) => {
        if (userId) {
            socket.join(`user:${userId}`);
            console.log(`User ${userId} joined their room`);
        }
    });
    
    // Join course room for live updates
    socket.on('join-course', (courseId) => {
        if (courseId) {
            socket.join(`course:${courseId}`);
            console.log(`Client joined course room: ${courseId}`);
        }
    });
    
    // Leave course room
    socket.on('leave-course', (courseId) => {
        if (courseId) {
            socket.leave(`course:${courseId}`);
            console.log(`Client left course room: ${courseId}`);
        }
    });
    
    socket.on('disconnect', (reason) => {
        console.log('Client disconnected:', socket.id, 'Reason:', reason);
    });
    
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// Handle 404
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 8890;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));