const express = require('express');
const multer = require('multer');
const Course = require('../models/CourseSchema');
const Booking = require('../models/BookingSchema');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const path = require('path');

const router = express.Router();

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Serve static files from the 'uploads' directory
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

router.get('/image/:filename', (req, res) => {
    const { filename } = req.params;
    res.sendFile(path.join(__dirname, '../uploads', filename));
});

// Get all courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find().select('-videos');
        res.json(courses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a specific course
router.get('/:id', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const publicCourse = course.toObject();
        delete publicCourse.videos;

        if (req.user && req.user.role === 'admin') {
            return res.json({
                ...course.toObject(),
                isEnrolled: true,
                hasVideos: course.videos && course.videos.length > 0
            });
        }

        if (req.user) {
            const booking = await Booking.findOne({
                user: req.user.id,
                course: course.id,
                status: 'completed'
            });

            if (booking) {
                return res.json({
                    ...course.toObject(),
                    isEnrolled: true,
                    hasVideos: course.videos && course.videos.length > 0
                });
            } else {
                return res.json({
                    ...publicCourse,
                    isEnrolled: false,
                    hasVideos: false
                });
            }
        } else {
            return res.json({
                ...publicCourse,
                isEnrolled: false,
                hasVideos: false
            });
        }
    } catch (err) {
        console.error('Error in GET /:id route:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new course
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        const { title, description, price } = req.body;
        const course = new Course({
            title,
            description,
            price,
            instructor: req.user.id,
            image: req.file ? req.file.filename : null,
        });
        await course.save();
        res.json(course);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update an existing course
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { title, description, price } = req.body;
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        course.title = title || course.title;
        course.description = description || course.description;
        course.price = price || course.price;
        if (req.file) {
            course.image = req.file.filename;
        }

        await course.save();
        res.json(course);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Like/unlike a course
router.post('/:id/like', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        if (course.likes.includes(req.user.id)) {
            course.likes = course.likes.filter(like => like.toString() !== req.user.id);
        } else {
            course.likes.push(req.user.id);
        }
        
        await course.save();
        res.json(course);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a video to a course
router.post('/:id/videos', adminAuth, upload.single('video'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const { title, description } = req.body;
        const videoUrl = `/uploads/${req.file.filename}`;

        course.videos.push({ title, description, videoUrl });
        await course.save();

        res.json(course);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/:courseId/videos/:videoId/like', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const video = course.videos.id(req.params.videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        const userIndex = video.likes.indexOf(req.user.id);
        if (userIndex > -1) {
            video.likes.splice(userIndex, 1);
        } else {
            video.likes.push(req.user.id);
        }

        await course.save();

        req.app.get('io').emit('videoLikeUpdate', {
            courseId: course._id,
            videoId: video._id,
            likesCount: video.likes.length,
            userLiked: userIndex === -1
        });

        res.json({ 
            likesCount: video.likes.length, 
            userLiked: userIndex === -1 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id/videos', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (req.user.role === 'admin') {
            return res.json(course.videos);
        }

        const booking = await Booking.findOne({ 
            user: req.user.id, 
            course: course._id, 
            status: 'completed' 
        });

        if (!booking) {
            return res.status(403).json({ message: 'Access denied. Purchase the course to view videos.' });
        }

        res.json(course.videos);
    } catch (err) {
        console.error('Error fetching videos:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
