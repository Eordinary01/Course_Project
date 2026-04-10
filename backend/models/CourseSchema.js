const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true },
  duration: { type: Number, default: 0 }, // Duration in seconds
  durationFormatted: { type: String }, // Formatted duration like "12:30"
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  order: { type: Number, default: 0 }, // Order of video in the course
  createdAt: { type: Date, default: Date.now }
});

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Course details
  category: { type: String },
  level: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
    default: 'All Levels'
  },
  language: { type: String, default: 'English' },
  
  // Time tracking
  totalDuration: { type: Number, default: 0 }, // Total duration in seconds
  totalDurationFormatted: { type: String }, // Formatted total like "8h 30m"
  totalVideos: { type: Number, default: 0 },
  
  // Ratings and reviews
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  videos: [VideoSchema],
  enrolledUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Additional metadata
  whatYouWillLearn: [{ type: String }],
  requirements: [{ type: String }],
  tags: [{ type: String }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to calculate total duration and format
CourseSchema.pre('save', function(next) {
  // Calculate total duration from all videos
  if (this.videos && this.videos.length > 0) {
    this.totalDuration = this.videos.reduce((total, video) => total + (video.duration || 0), 0);
    this.totalVideos = this.videos.length;
    this.totalDurationFormatted = formatDuration(this.totalDuration);
  } else {
    this.totalDuration = 0;
    this.totalVideos = 0;
    this.totalDurationFormatted = '0h 0m';
  }
  
  // Format individual video durations
  this.videos.forEach(video => {
    if (video.duration) {
      video.durationFormatted = formatDuration(video.duration);
    }
  });
  
  this.updatedAt = new Date();
  next();
});

// Helper function to format duration
function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Method to calculate average rating
CourseSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) return 0;
  
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  return (totalRating / this.reviews.length).toFixed(1);
};

module.exports = mongoose.model('Course', CourseSchema);