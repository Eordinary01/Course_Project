// app/components/CourseCard.js
import Image from 'next/image';
import { FaPlay, FaClock, FaStar, FaSpinner, FaUser, FaArrowRight } from 'react-icons/fa';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CourseCard({ course, user }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const imageUrl = course.image 
    ? `${API_URL}/courses/image/${course.image}` 
    : '';

  const handleViewCourse = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/courses/${course._id}`);
    } catch (error) {
      console.error('Error loading course:', error);
      setIsLoading(false);
    }
  };

  // Helper function to get instructor name
  const getInstructorName = () => {
    if (!course.instructor) return 'Expert Instructor';
    if (typeof course.instructor === 'object') {
      return course.instructor.username || course.instructor.email || 'Expert Instructor';
    }
    return course.instructor;
  };

  // Helper function to get rating
  const getRating = () => {
    return course.averageRating || course.rating || '4.5';
  };

  // Helper function to get review count
  const getReviewCount = () => {
    return course.reviewCount || course.reviews?.length || '128';
  };

  // Helper function to get video count
  const getVideoCount = () => {
    return course.totalVideos || course.videos?.length || 0;
  };

  // Helper function to get duration
  const getDuration = () => {
    return course.totalDurationFormatted || course.duration || '8h 30m';
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <div className="relative h-52 w-full bg-gray-100">
          <Image 
            src={imageError ? '/placeholder-image.jpg' : imageUrl}
            alt={`Cover image for ${course.title}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        </div>
        
        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm border border-gray-100">
          ₹{course.price}
        </div>
        
        {/* Category Badge */}
        {course.category && (
          <div className="absolute top-4 left-4 bg-yellow-400 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium">
            {course.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-medium text-gray-900 mb-3 line-clamp-2 group-hover:text-gray-700 transition-colors">
          {course.title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {Array.isArray(course.description) 
            ? course.description[0] 
            : course.description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-1">
            <FaPlay className="text-yellow-400 text-xs" />
            <span className="font-medium text-gray-700">{getVideoCount()}</span>
            <span className="text-gray-500">videos</span>
          </div>
          <div className="flex items-center space-x-1">
            <FaClock className="text-yellow-400 text-xs" />
            <span className="font-medium text-gray-700">{getDuration()}</span>
          </div>
        </div>

        {/* Instructor & Rating */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <FaUser className="text-gray-500 text-xs" />
            </div>
            <span className="text-sm text-gray-700 font-medium">
              {getInstructorName()}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <FaStar className="text-yellow-400" />
            <span className="text-sm font-medium text-gray-900">
              {getRating()}
            </span>
            <span className="text-xs text-gray-400">
              ({getReviewCount()})
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleViewCourse}
          disabled={isLoading}
          className={`group/btn relative w-full inline-flex items-center justify-center px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
            isLoading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500 hover:shadow-md'
          }`}
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <span>View Course</span>
              <FaArrowRight className="ml-2 text-sm group-hover/btn:translate-x-1 transition-transform duration-300" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}