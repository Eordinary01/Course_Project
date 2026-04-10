'use client'
import { useEffect, useState } from "react";
import axios from 'axios';
import { useAuth } from "@/app/auth/AuthContext";
import VideoPlayer from "@/app/components/VideoPlayer";
import Link from 'next/link';
import { 
    FaPlus, FaSpinner, FaBook, FaVideo, FaEdit, FaCog, FaShoppingCart, 
    FaArrowLeft, FaLock, FaCheckCircle, FaUsers, FaClock, FaStar,
    FaGraduationCap, FaList, FaTag, FaGlobe, FaChartLine
} from 'react-icons/fa';
import PaymentModal from "@/app/components/PaymentModal";

export default function CoursePage({ params }) {
    const [course, setCourse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);
    const { user } = useAuth();

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    // Helper to get user ID safely
    const getUserId = () => {
        if (!user) return null;
        return user.id || user._id;
    };

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'x-auth-token': token } : {};
                
                const res = await axios.get(`${API_URL}/courses/${params.id}`, { headers });
                setCourse(res.data);
                
                if (res.data.videos && res.data.videos.length > 0) {
                    // Sort videos by order
                    const sortedVideos = [...res.data.videos].sort((a, b) => (a.order || 0) - (b.order || 0));
                    setSelectedVideo(sortedVideos[0]);
                }
                
                // Check enrollment status
                const userId = getUserId();
                const isUserEnrolled = 
                    res.data.isEnrolled ||
                    (res.data.enrolledUsers && userId && res.data.enrolledUsers.includes(userId)) ||
                    localStorage.getItem(`enrolled_${res.data._id}`) === 'true';
                
                setIsEnrolled(isUserEnrolled);
            } catch (err) {
                setError('Failed to fetch course data');
                console.error('Error fetching course:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCourse();
    }, [params.id, user]);

    const handlePurchase = async () => {
        try {
            const res = await axios.post(`${API_URL}/bookings`, 
                { courseId: course._id }, 
                { headers: { 'x-auth-token': localStorage.getItem('token') } }
            );
            setOrderDetails(res.data);
            setIsPaymentModalOpen(true);
        } catch (err) {
            console.error('Error creating booking:', err);
            setError('Failed to initiate purchase');
        }
    };

    const handlePaymentSuccess = async (paymentDetails) => {
        try {
            await axios.post(`${API_URL}/bookings/verify`, {
                ...paymentDetails,
                bookingId: orderDetails.booking
            }, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            
            const updatedCourse = await axios.get(`${API_URL}/courses/${params.id}`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            
            setCourse(updatedCourse.data);
            setIsPaymentModalOpen(false);
            setIsEnrolled(true);
            localStorage.setItem(`enrolled_${course._id}`, 'true');
        } catch (err) {
            console.error('Error verifying payment:', err);
            setError('Payment verification failed');
        }
    };

    // Helper function to get instructor name
    const getInstructorName = () => {
        if (!course?.instructor) return 'Expert Instructor';
        if (typeof course.instructor === 'object') {
            return course.instructor.username || course.instructor.email || 'Expert Instructor';
        }
        return course.instructor;
    };

    // Helper function to get total duration
    const getTotalDuration = () => {
        return course?.totalDuration || course?.duration || '0h 0m';
    };

    // Helper function to get video count
    const getVideoCount = () => {
        return course?.totalVideos || course?.videos?.length || 0;
    };

    // Helper function to get student count
    const getStudentCount = () => {
        return course?.enrolledUsers?.length || 0;
    };

    // Helper function to get rating
    const getRating = () => {
        return course?.averageRating || course?.rating || '0.0';
    };

    // Helper function to get review count
    const getReviewCount = () => {
        return course?.reviewCount || course?.reviews?.length || 0;
    };

    if (isLoading) return (
        <div className="flex justify-center items-center min-h-screen bg-white">
            <div className="text-center">
                <FaSpinner className="animate-spin text-4xl text-yellow-400 mx-auto mb-4" />
                <p className="text-gray-500 font-light">Loading course...</p>
            </div>
        </div>
    );
    
    if (error) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                    <p className="text-red-700">{error}</p>
                </div>
                <Link 
                    href="/"
                    className="inline-flex items-center mt-4 text-gray-600 hover:text-gray-900"
                >
                    <FaArrowLeft className="mr-2" />
                    Back to Courses
                </Link>
            </div>
        </div>
    );
    
    if (!course) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <p className="text-gray-500 text-xl font-light">No course found</p>
                <Link 
                    href="/"
                    className="inline-flex items-center mt-4 text-gray-600 hover:text-gray-900"
                >
                    <FaArrowLeft className="mr-2" />
                    Back to Courses
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-gradient-to-b from-yellow-50 to-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Link 
                        href="/" 
                        className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4 transition-colors"
                    >
                        <FaArrowLeft className="mr-2 text-sm" />
                        <span className="text-sm">Back to Courses</span>
                    </Link>
                    
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tight">
                                {course.title}
                            </h1>
                            
                            {/* Course Meta */}
                            <div className="flex flex-wrap items-center gap-4 mt-3">
                                {course.category && (
                                    <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                        <FaList className="mr-1" />
                                        {course.category}
                                    </span>
                                )}
                                {course.level && (
                                    <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                        <FaChartLine className="mr-1" />
                                        {course.level}
                                    </span>
                                )}
                                {course.language && (
                                    <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                        <FaGlobe className="mr-1" />
                                        {course.language}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Rating Display */}
                        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                            <div className="flex items-center">
                                <FaStar className="text-yellow-400 mr-1" />
                                <span className="text-2xl font-medium text-gray-900">
                                    {getRating()}
                                </span>
                            </div>
                            <div className="text-sm text-gray-500">
                                ({getReviewCount()} reviews)
                            </div>
                        </div>
                    </div>
                    
                    {/* Course Stats */}
                    <div className="flex flex-wrap items-center gap-6 mt-6">
                        <div className="flex items-center text-gray-600">
                            <FaUsers className="mr-2 text-yellow-400" />
                            <span className="text-sm">
                                {getStudentCount()} students enrolled
                            </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                            <FaVideo className="mr-2 text-yellow-400" />
                            <span className="text-sm">
                                {getVideoCount()} videos
                            </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                            <FaClock className="mr-2 text-yellow-400" />
                            <span className="text-sm">
                                {getTotalDuration()} total
                            </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                            <FaGraduationCap className="mr-2 text-yellow-400" />
                            <span className="text-sm">
                                Instructor: {getInstructorName()}
                            </span>
                        </div>
                        {isEnrolled && (
                            <div className="flex items-center text-green-600">
                                <FaCheckCircle className="mr-2" />
                                <span className="text-sm font-medium">Enrolled</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Navigation and Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <nav className="flex space-x-1 p-1 bg-gray-50 rounded-lg">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-5 py-2.5 font-medium text-sm rounded-lg transition-all duration-200 ${
                                activeTab === 'overview'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            <FaBook className="inline-block mr-2" />
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('videos')}
                            className={`px-5 py-2.5 font-medium text-sm rounded-lg transition-all duration-200 ${
                                activeTab === 'videos'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            <FaVideo className="inline-block mr-2" />
                            Videos ({getVideoCount()})
                        </button>
                    </nav>
                    
                    <div className="flex items-center gap-3">
                        {user?.role === 'admin' ? (
                            <div className="relative">
                                <button 
                                    className="bg-gray-100 text-gray-700 rounded-lg p-3 hover:bg-gray-200 transition-colors duration-200"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                >
                                    <FaCog className="text-lg" />
                                </button>
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                                        <Link 
                                            href={`/admin/edit-course/${params.id}`}
                                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <FaEdit className="mr-3 text-gray-400" />
                                            Edit Course
                                        </Link>
                                        <Link 
                                            href={`/admin/add-video/${params.id}`}
                                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <FaPlus className="mr-3 text-gray-400" />
                                            Add New Video
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ) : !isEnrolled && user && (
                            <button
                                onClick={handlePurchase}
                                className="flex items-center bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-yellow-500 transition-all duration-300 shadow-sm hover:shadow"
                            >
                                <FaShoppingCart className="inline-block mr-2" />
                                Purchase for ₹{course.price}
                            </button>
                        )}
                        
                        {!user && !isEnrolled && (
                            <Link
                                href="/login"
                                className="flex items-center bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-yellow-500 transition-all duration-300 shadow-sm hover:shadow"
                            >
                                <FaLock className="inline-block mr-2" />
                                Login to Purchase
                            </Link>
                        )}
                        
                        {isEnrolled && user?.role !== 'admin' && (
                            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg flex items-center">
                                <FaCheckCircle className="mr-2" />
                                <span className="text-sm font-medium">You're enrolled</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area - Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Description */}
                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                            <h2 className="text-2xl font-light text-gray-900 mb-6">About this course</h2>
                            <div className="prose prose-lg max-w-none">
                                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                    {Array.isArray(course.description) 
                                        ? course.description.join('\n') 
                                        : course.description}
                                </p>
                            </div>
                        </div>

                        {/* What You'll Learn */}
                        {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
                            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                                <h2 className="text-2xl font-light text-gray-900 mb-6">
                                    <FaGraduationCap className="inline-block mr-2 text-yellow-400" />
                                    What You'll Learn
                                </h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {course.whatYouWillLearn.map((item, index) => (
                                        <div key={index} className="flex items-start space-x-3">
                                            <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                                            <span className="text-gray-700">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Requirements */}
                        {course.requirements && course.requirements.length > 0 && (
                            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                                <h2 className="text-2xl font-light text-gray-900 mb-6">
                                    <FaList className="inline-block mr-2 text-yellow-400" />
                                    Requirements
                                </h2>
                                <ul className="space-y-2">
                                    {course.requirements.map((item, index) => (
                                        <li key={index} className="flex items-start space-x-3">
                                            <span className="text-yellow-400">•</span>
                                            <span className="text-gray-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Tags */}
                        {course.tags && course.tags.length > 0 && (
                            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                                <h2 className="text-2xl font-light text-gray-900 mb-4">
                                    <FaTag className="inline-block mr-2 text-yellow-400" />
                                    Tags
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {course.tags.map((tag, index) => (
                                        <span 
                                            key={index}
                                            className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Course Features */}
                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                            <h2 className="text-2xl font-light text-gray-900 mb-6">Course Features</h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FaVideo className="text-yellow-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900">Video Content</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {getVideoCount()} high-quality video lessons
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FaClock className="text-yellow-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900">Duration</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {getTotalDuration()} of content
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FaChartLine className="text-yellow-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900">Level</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {course.level || 'All Levels'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content Area - Videos Tab */}
                {activeTab === 'videos' && (
                    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                        {(isEnrolled || user?.role === 'admin') ? (
                            course.videos && course.videos.length > 0 ? (   
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Video Player Section */}
                                    <div className="lg:col-span-2">
                                        <div className="bg-black rounded-xl overflow-hidden shadow-lg">
                                            {selectedVideo && (
                                                <VideoPlayer 
                                                    video={selectedVideo} 
                                                    courseId={course._id} 
                                                    user={user} 
                                                />
                                            )}
                                        </div>
                                        <div className="mt-6">
                                            <h3 className="text-xl font-medium text-gray-900 mb-2">
                                                {selectedVideo?.title}
                                            </h3>
                                            <p className="text-gray-600 leading-relaxed">
                                                {selectedVideo?.description}
                                            </p>
                                            {selectedVideo?.durationFormatted && (
                                                <p className="text-sm text-gray-500 mt-2">
                                                    Duration: {selectedVideo.durationFormatted}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Video List Section */}
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                                            Course Content ({getVideoCount()} videos)
                                        </h3>
                                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                                            {[...course.videos]
                                                .sort((a, b) => (a.order || 0) - (b.order || 0))
                                                .map((video, index) => (
                                                <div 
                                                    key={video._id} 
                                                    onClick={() => setSelectedVideo(video)}
                                                    className={`cursor-pointer p-4 rounded-xl transition-all duration-200 ${
                                                        selectedVideo?._id === video._id 
                                                            ? 'bg-yellow-50 border-2 border-yellow-400' 
                                                            : 'bg-white border border-gray-200 hover:border-yellow-300 hover:shadow-sm'
                                                    }`}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <span className="text-xs font-medium text-gray-600">
                                                                {index + 1}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">
                                                                {video.title}
                                                            </h4>
                                                            <p className="text-gray-500 text-xs line-clamp-2">
                                                                {video.description}
                                                            </p>
                                                            {video.duration && (
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    {video.duration}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {selectedVideo?._id === video._id && (
                                                            <FaVideo className="text-yellow-400 text-sm flex-shrink-0" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FaVideo className="text-gray-400 text-xl" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
                                    <p className="text-gray-500">
                                        Videos for this course will be available soon.
                                    </p>
                                </div>
                            )
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaLock className="text-yellow-600 text-xl" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Enroll to Access Videos</h3>
                                <p className="text-gray-500 mb-6">
                                    Purchase this course to unlock all {getVideoCount()} videos and start learning.
                                </p>
                                {user ? (
                                    <button
                                        onClick={handlePurchase}
                                        className="inline-flex items-center bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-yellow-500 transition-all duration-300"
                                    >
                                        <FaShoppingCart className="mr-2" />
                                        Purchase for ₹{course.price}
                                    </button>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-yellow-500 transition-all duration-300"
                                    >
                                        <FaLock className="mr-2" />
                                        Login to Purchase
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {isPaymentModalOpen && (
                <PaymentModal 
                    orderDetails={orderDetails}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}