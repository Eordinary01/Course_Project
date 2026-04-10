const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose'); 
const { getVideoDurationInSeconds } = require('get-video-duration');
const Course = require('../models/CourseSchema');
const Booking = require('../models/BookingSchema');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();


// Helper func 
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath;
        if (file.fieldname === 'video') {
            uploadPath = 'uploads/videos';
        } else if (file.fieldname === 'image') {
            uploadPath = 'uploads/images';
        } else {
            uploadPath = 'uploads/others';
        }
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'video') {
        const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid video format. Only MP4, WebM, OGG, and MOV are allowed.'), false);
        }
    } else if (file.fieldname === 'image') {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid image format. Only JPEG, PNG, GIF, and WEBP are allowed.'), false);
        }
    } else {
        cb(null, true);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: (req, file) => {
            if (file.fieldname === 'video') {
                return 500 * 1024 * 1024; // 500MB for videos
            }
            return 10 * 1024 * 1024; // 10MB for images
        }
    }
});

// Serve static files
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Get video duration helper function using get-video-duration
const getVideoDuration = async (filePath) => {
    try {
        const durationInSeconds = await getVideoDurationInSeconds(filePath);
        return Math.floor(durationInSeconds);
    } catch (error) {
        console.error('Error getting video duration:', error);
        return 0; // Return 0 if can't get duration
    }
};

// Alternative: Using ffprobe-static with fluent-ffmpeg (if you prefer)
// Uncomment this if you want to use fluent-ffmpeg instead
/*
const ffmpeg = require('fluent-ffmpeg');
const ffprobeStatic = require('ffprobe-static');
ffmpeg.setFfprobePath(ffprobeStatic.path);

const getVideoDurationAlt = (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                console.error('Error getting video duration:', err);
                resolve(0);
            } else {
                resolve(Math.floor(metadata.format.duration || 0));
            }
        });
    });
};
*/

// Get course image
router.get('/image/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/images', filename);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        const oldPath = path.join(__dirname, '../uploads', filename);
        if (fs.existsSync(oldPath)) {
            res.sendFile(oldPath);
        } else {
            res.status(404).json({ message: 'Image not found' });
        }
    }
});

// Get video stream with proper range support
router.get('/video/:filename', auth, async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../uploads/videos', filename);
        
        console.log('Video requested:', filename);
        console.log('File path:', filePath);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error('Video file not found:', filePath);
            return res.status(404).json({ message: 'Video not found' });
        }

        // Find course containing this video
        const course = await Course.findOne({ 'videos.videoUrl': `/uploads/videos/${filename}` });
        if (!course) {
            console.error('Course not found for video:', filename);
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check access permissions
        if (req.user.role !== 'admin') {
            const booking = await Booking.findOne({
                user: req.user.id,
                course: course._id,
                status: 'completed'
            });
            
            if (!booking) {
                console.error('Access denied for user:', req.user.id);
                return res.status(403).json({ message: 'Access denied. Purchase the course to view videos.' });
            }
        }

        // Get video stats
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        console.log('Video size:', fileSize);
        console.log('Range header:', range);

        // Set proper headers
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        // Handle range request (for video seeking)
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            
            if (start >= fileSize) {
                res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
                return;
            }
            
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(filePath, { start, end });
            
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
                'Cross-Origin-Resource-Policy': 'cross-origin'
            });
            
            file.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
                'Cross-Origin-Resource-Policy': 'cross-origin'
            });
            fs.createReadStream(filePath).pipe(res);
        }
    } catch (error) {
        console.error('Error streaming video:', error);
        res.status(500).json({ message: 'Error streaming video' });
    }
});

// Get all courses with filters
router.get('/', async (req, res) => {
    try {
        const { category, level, search, sort, minPrice, maxPrice, instructor } = req.query;
        
        let query = {};
        
        if (category) query.category = category;
        if (level) query.level = level;
        if (instructor) query.instructor = instructor;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }
        
        let coursesQuery = Course.find(query)
            .select('-videos.videoUrl -videos.likes')
            .populate('instructor', 'username email');
        
        // Sorting
        if (sort) {
            const sortOrder = sort.startsWith('-') ? -1 : 1;
            const sortField = sort.replace('-', '');
            coursesQuery = coursesQuery.sort({ [sortField]: sortOrder });
        } else {
            coursesQuery = coursesQuery.sort('-createdAt');
        }
        
        const courses = await coursesQuery;
        
        // Calculate ratings for each course
        const coursesWithRatings = courses.map(course => {
            const courseObj = course.toObject();
            courseObj.averageRating = course.calculateAverageRating();
            courseObj.reviewCount = course.reviews.length;
            return courseObj;
        });
        
        res.json(coursesWithRatings);
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get course statistics
router.get('/stats', async (req, res) => {
    try {
        const totalCourses = await Course.countDocuments();
        const coursesByCategory = await Course.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        const coursesByLevel = await Course.aggregate([
            { $group: { _id: '$level', count: { $sum: 1 } } }
        ]);
        
        res.json({
            totalCourses,
            coursesByCategory,
            coursesByLevel
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a specific course
router.get('/:id', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'username email')
            .populate('reviews.user', 'username');
            
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const publicCourse = course.toObject();
        
        // Add computed fields
        publicCourse.averageRating = course.calculateAverageRating();
        publicCourse.reviewCount = course.reviews.length;

        // Admin gets full access
        if (req.user && req.user.role === 'admin') {
            return res.json({
                ...course.toObject(),
                isEnrolled: true,
                hasVideos: course.videos && course.videos.length > 0
            });
        }

        // Check enrollment for regular users
        if (req.user) {
            const booking = await Booking.findOne({
                user: req.user.id,
                course: course.id,
                status: 'completed'
            });

            if (booking) {
                // Enrolled user gets full access
                return res.json({
                    ...course.toObject(),
                    isEnrolled: true,
                    hasVideos: course.videos && course.videos.length > 0
                });
            } else {
                // Non-enrolled user gets limited info
                const limitedVideos = course.videos.map(v => ({
                    title: v.title,
                    duration: v.duration,
                    durationFormatted: v.durationFormatted,
                    order: v.order,
                    _id: v._id
                }));
                
                delete publicCourse.videos;
                return res.json({
                    ...publicCourse,
                    videos: limitedVideos,
                    isEnrolled: false,
                    hasVideos: false
                });
            }
        } else {
            // No auth - minimal info
            delete publicCourse.videos;
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
        const { 
            title, 
            description, 
            price, 
            category, 
            level, 
            language,
            whatYouWillLearn,
            requirements,
            tags 
        } = req.body;
        
        const course = new Course({
            title,
            description,
            price: parseFloat(price),
            category,
            level: level || 'All Levels',
            language: language || 'English',
            instructor: req.user.id,
            image: req.file ? req.file.filename : null,
            whatYouWillLearn: whatYouWillLearn ? JSON.parse(whatYouWillLearn) : [],
            requirements: requirements ? JSON.parse(requirements) : [],
            tags: tags ? JSON.parse(tags) : []
        });
        
        await course.save();
        res.status(201).json(course);
    } catch (err) {
        console.error('Error creating course:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update an existing course
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { 
            title, 
            description, 
            price, 
            category, 
            level, 
            language,
            whatYouWillLearn,
            requirements,
            tags 
        } = req.body;
        
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Update fields
        if (title) course.title = title;
        if (description) course.description = description;
        if (price) course.price = parseFloat(price);
        if (category) course.category = category;
        if (level) course.level = level;
        if (language) course.language = language;
        
        if (whatYouWillLearn) {
            course.whatYouWillLearn = JSON.parse(whatYouWillLearn);
        }
        if (requirements) {
            course.requirements = JSON.parse(requirements);
        }
        if (tags) {
            course.tags = JSON.parse(tags);
        }
        
        if (req.file) {
            // Delete old image if exists
            if (course.image) {
                const oldImagePath = path.join(__dirname, '../uploads/images', course.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            course.image = req.file.filename;
        }

        await course.save();
        res.json(course);
    } catch (err) {
        console.error('Error updating course:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a course
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Delete course image
        if (course.image) {
            const imagePath = path.join(__dirname, '../uploads/images', course.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete all videos
        course.videos.forEach(video => {
            const videoPath = path.join(__dirname, '..', video.videoUrl);
            if (fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
            }
        });

        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        console.error('Error deleting course:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a video to a course with duration extraction
router.post('/:id/videos', adminAuth, upload.single('video'), async (req, res) => {
    try {
        const courseId = req.params.id;
        
        // Validate course ID
        if (!courseId || courseId === 'undefined' || courseId === 'null') {
            return res.status(400).json({ message: 'Invalid course ID' });
        }
        
        // Check if ID is valid MongoDB ObjectId
        if (!isValidObjectId(courseId)) {
            return res.status(400).json({ message: 'Invalid course ID format' });
        }
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No video file uploaded' });
        }

        const { title, description, order } = req.body;
        const videoUrl = `/uploads/videos/${req.file.filename}`;
        
        // Get video duration
        const duration = await getVideoDuration(req.file.path);
        console.log(`Video duration: ${duration} seconds`);

        course.videos.push({ 
            title, 
            description: description || '',
            videoUrl,
            duration,
            order: order ? parseInt(order) : course.videos.length
        });
        
        await course.save();

        res.status(201).json({
            message: 'Video added successfully',
            course: course
        });
    } catch (err) {
        console.error('Error adding video:', err);
        // Clean up uploaded file if there's an error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// Update video details
router.put('/:courseId/videos/:videoId', adminAuth, async (req, res) => {
    try {
        const { title, description, order } = req.body;
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        const video = course.videos.id(req.params.videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }
        
        if (title) video.title = title;
        if (description) video.description = description;
        if (order !== undefined) video.order = parseInt(order);
        
        await course.save();
        res.json(video);
    } catch (err) {
        console.error('Error updating video:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a video
router.delete('/:courseId/videos/:videoId', adminAuth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        const video = course.videos.id(req.params.videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }
        
        // Delete video file
        const videoPath = path.join(__dirname, '..', video.videoUrl);
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }
        
        video.remove();
        await course.save();
        
        res.json({ message: 'Video deleted successfully' });
    } catch (err) {
        console.error('Error deleting video:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update video order
router.put('/:id/videos/reorder', adminAuth, async (req, res) => {
    try {
        const { videoOrder } = req.body;
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        videoOrder.forEach((videoId, index) => {
            const video = course.videos.id(videoId);
            if (video) {
                video.order = index;
            }
        });
        
        await course.save();
        res.json({ message: 'Video order updated successfully' });
    } catch (err) {
        console.error('Error reordering videos:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a review
router.post('/:id/reviews', auth, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Check if user has purchased the course
        const booking = await Booking.findOne({
            user: req.user.id,
            course: course._id,
            status: 'completed'
        });
        
        if (!booking && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You must purchase the course to leave a review' });
        }
        
        // Check if user already reviewed
        const existingReviewIndex = course.reviews.findIndex(
            r => r.user.toString() === req.user.id
        );
        
        if (existingReviewIndex > -1) {
            course.reviews[existingReviewIndex].rating = rating;
            course.reviews[existingReviewIndex].comment = comment;
        } else {
            course.reviews.push({
                user: req.user.id,
                rating,
                comment
            });
        }
        
        await course.save();
        
        const updatedCourse = await Course.findById(course._id)
            .populate('reviews.user', 'username');
            
        res.json({
            averageRating: course.calculateAverageRating(),
            reviewCount: course.reviews.length,
            reviews: updatedCourse.reviews
        });
    } catch (err) {
        console.error('Error adding review:', err);
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
        
        const likeIndex = course.likes.indexOf(req.user.id);
        if (likeIndex > -1) {
            course.likes.splice(likeIndex, 1);
        } else {
            course.likes.push(req.user.id);
        }
        
        await course.save();
        res.json({ 
            likesCount: course.likes.length, 
            userLiked: likeIndex === -1 
        });
    } catch (err) {
        console.error('Error liking course:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Like/unlike a video
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

        // Emit socket event if socket.io is configured
        if (req.app.get('io')) {
            req.app.get('io').emit('videoLikeUpdate', {
                courseId: course._id,
                videoId: video._id,
                likesCount: video.likes.length,
                userLiked: userIndex === -1
            });
        }

        res.json({ 
            likesCount: video.likes.length, 
            userLiked: userIndex === -1 
        });
    } catch (err) {
        console.error('Error liking video:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get videos for enrolled users
router.get('/:id/videos', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Admin gets full access
        if (req.user.role === 'admin') {
            return res.json({
                videos: course.videos.sort((a, b) => a.order - b.order),
                totalDuration: course.totalDuration,
                totalDurationFormatted: course.totalDurationFormatted,
                totalVideos: course.totalVideos
            });
        }

        // Check enrollment for regular users
        const booking = await Booking.findOne({ 
            user: req.user.id, 
            course: course._id, 
            status: 'completed' 
        });

        if (!booking) {
            return res.status(403).json({ 
                message: 'Access denied. Purchase the course to view videos.' 
            });
        }

        res.json({
            videos: course.videos.sort((a, b) => a.order - b.order),
            totalDuration: course.totalDuration,
            totalDurationFormatted: course.totalDurationFormatted,
            totalVideos: course.totalVideos
        });
    } catch (err) {
        console.error('Error fetching videos:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get course statistics
router.get('/:id/stats', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        res.json({
            totalStudents: course.enrolledUsers.length,
            totalVideos: course.totalVideos,
            totalDuration: course.totalDuration,
            totalDurationFormatted: course.totalDurationFormatted,
            averageRating: course.calculateAverageRating(),
            reviewCount: course.reviews.length,
            likesCount: course.likes.length,
            createdAt: course.createdAt,
            lastUpdated: course.updatedAt
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;