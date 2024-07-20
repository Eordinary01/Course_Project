'use client'
import { useEffect, useState } from "react";
import axios from 'axios';
import { useAuth } from "@/app/auth/AuthContext";
import VideoPlayer from "@/app/components/VideoPlayer";
import Link from 'next/link';
import { FaPlus, FaSpinner, FaBook, FaVideo, FaEdit, FaCog, FaShoppingCart } from 'react-icons/fa';
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

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await axios.get(`${API_URL}/courses/${params.id}`, {
                    headers: { 'x-auth-token': localStorage.getItem('token') }
                });
                setCourse(res.data);
                if (res.data.videos && res.data.videos.length > 0) {
                    setSelectedVideo(res.data.videos[0]);
                }
                // Update isEnrolled status
                setIsEnrolled(
                    (res.data.enrolledUsers && res.data.enrolledUsers.includes(user?.id)) ||
                    localStorage.getItem(`enrolled_${res.data._id}`) === 'true'
                );
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
            const res = await axios.post(`${API_URL}/bookings`, { courseId: course._id }, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
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
            // Refresh course data to update enrollment status
            const updatedCourse = await axios.get(`${API_URL}/courses/${params.id}`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setCourse(updatedCourse.data);
            setIsPaymentModalOpen(false);
            // Force a re-render by updating the state
            setIsEnrolled(true);
            
        } catch (err) {
            console.error('Error verifying payment:', err);
            setError('Payment verification failed');
        }
    };

    if (isLoading) return (
        <div className="flex justify-center items-center h-screen bg-gray-900">
            <FaSpinner className="animate-spin text-6xl text-blue-500" />
        </div>
    );
    if (error) return <div className="text-center text-red-600 text-2xl p-8 bg-gray-900">{error}</div>;
    if (!course) return <div className="text-center text-white text-2xl p-8 bg-gray-900">No course found</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-2xl font-bold text-white px-5">{course.title}</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <nav className="flex space-x-4">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 font-medium text-sm rounded-md transition-colors duration-200 ${
                                activeTab === 'overview'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                        >
                            <FaBook className="inline-block mr-2" />
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('videos')}
                            className={`px-4 py-2 font-medium text-sm rounded-md transition-colors duration-200 ${
                                activeTab === 'videos'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                        >
                            <FaVideo className="inline-block mr-2" />
                            Videos
                        </button>
                    </nav>
                    
                    {user?.role === 'admin' ? (
                        <div className="relative">
                            <button 
                                className="bg-white text-gray-800 rounded-full p-2 hover:bg-gray-200 transition-colors duration-200"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <FaCog className="text-xl" />
                            </button>
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                                    <Link href={`/admin/edit-course/${params.id}`} 
                                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <FaEdit className="inline-block mr-2" />
                                        Edit Course
                                    </Link>
                                    <Link href={`/admin/add-video/${params.id}`} 
                                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <FaPlus className="inline-block mr-2" />
                                        Add New Video
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : !isEnrolled && (
                        <button
                            onClick={handlePurchase}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                        >
                            <FaShoppingCart className="inline-block mr-2" />
                            Purchase Course
                        </button>
                    )}
                </div>

                {activeTab === 'overview' && (
                    <div className="bg-gray-800 shadow-lg rounded-lg p-8 animate-fadeIn">
                        <h2 className="text-2xl font-semibold mb-4 text-blue-400">Course Overview</h2>
                        <p className="text-gray-300 leading-relaxed">{course.description}</p>
                        <p className="text-xl font-semibold mt-4">Price: ₹{course.price}</p>
                    </div>
                )}

                {activeTab === 'videos' && (
                    <div className="bg-gray-800 shadow-lg rounded-lg p-8 animate-fadeIn">
                        <h2 className="text-2xl font-semibold mb-6 text-blue-400">Course Videos</h2>
                        {(isEnrolled || user?.role === 'admin') ? (
                            course.videos && course.videos.length > 0 ? (   
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2">
                                        <div className="bg-black rounded-lg overflow-hidden shadow-xl aspect-w-16 aspect-h-9">
                                            {selectedVideo && (
                                                <VideoPlayer video={selectedVideo} courseId={course._id} user={user} />
                                            )}
                                        </div>
                                        <div className="mt-4">
                                            <h3 className="text-xl font-semibold mb-2">{selectedVideo?.title}</h3>
                                            <p className="text-gray-300">{selectedVideo?.description}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-4">Video List</h3>
                                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                                            {course.videos.map(video => (
                                                <div 
                                                    key={video._id} 
                                                    onClick={() => setSelectedVideo(video)}
                                                    className={`cursor-pointer p-4 rounded-lg transition-all duration-200 ${
                                                        selectedVideo?._id === video._id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                                                    }`}
                                                >
                                                    <h4 className="text-lg font-semibold">{video.title}</h4>
                                                    <p className="text-gray-300 text-sm">{video.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-300">No videos available for this course yet.</div>
                            )
                        ) : (
                            <div className="text-center text-gray-300">
                                You need to purchase this course to access the videos.
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
