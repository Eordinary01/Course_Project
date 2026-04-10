import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { FaThumbsUp, FaSpinner, FaPaperPlane, FaUser, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

export default function VideoPlayer({ video, courseId, user }) {
    const [likesCount, setLikesCount] = useState(video.likes?.length || 0);
    const [hasLiked, setHasLiked] = useState(() => {
        if (!user || !video.likes) return false;
        const userId = user.id || user._id;
        return video.likes.includes(userId);
    });
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [videoError, setVideoError] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const videoRef = useRef(null);
    const socketRef = useRef(null);
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET || API_URL?.replace('/api', '');

    // Get user ID safely
    const getUserId = () => {
        if (!user) return null;
        return user.id || user._id;
    };

    // Get video URL with proper authentication
    const getVideoUrl = () => {
        if (!video?.videoUrl) return '';
        
        console.log('Raw video URL:', video.videoUrl);
        
        // If it's already a full URL
        if (video.videoUrl.startsWith('http://') || video.videoUrl.startsWith('https://')) {
            return video.videoUrl;
        }
        
        // Get the base URL without /api
        const baseUrl = API_URL?.replace('/api', '') || 'http://localhost:8890';
        
        // Ensure the path starts with /
        const videoPath = video.videoUrl.startsWith('/') ? video.videoUrl : `/${video.videoUrl}`;
        
        // Construct full URL
        const fullUrl = `${baseUrl}${videoPath}`;
        console.log('Constructed video URL:', fullUrl);
        
        return fullUrl;
    };

    // Initialize socket connection
    useEffect(() => {
        const userId = getUserId();
        
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socketRef.current.on('connect', () => {
            console.log('Socket connected:', socketRef.current.id);
            if (userId) {
                socketRef.current.emit('authenticate', userId);
            }
            socketRef.current.emit('join-course', courseId);
        });

        socketRef.current.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        socketRef.current.on('videoLikeUpdate', (data) => {
            if (data.courseId === courseId && data.videoId === video._id) {
                setLikesCount(data.likesCount);
                const currentUserId = getUserId();
                if (currentUserId) {
                    setHasLiked(data.userLiked);
                }
            }
        });

        socketRef.current.on('newComment', (data) => {
            if (data.courseId === courseId) {
                fetchComments();
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.emit('leave-course', courseId);
                socketRef.current.disconnect();
            }
        };
    }, [courseId, video._id, user, SOCKET_URL]);

    const fetchComments = useCallback(async () => {
        if (!showComments) return;
        
        try {
            setIsCommentsLoading(true);
            const token = localStorage.getItem('token');
            const headers = token ? { 'x-auth-token': token } : {};
            
            const res = await axios.get(`${API_URL}/comments/${courseId}`, { headers });
            setComments(Array.isArray(res.data) ? res.data : []);
            setError(null);
        } catch (error) {
            console.error('Error fetching comments:', error);
            setError('Unable to load comments');
            setComments([]);
        } finally {
            setIsCommentsLoading(false);
        }
    }, [courseId, showComments, API_URL]);

    useEffect(() => {
        if (showComments) {
            fetchComments();
        }
    }, [fetchComments, showComments]);

    const handleLike = async () => {
        if (!user) {
            setError('Please login to like videos');
            return;
        }
        
        try {
            setIsLoading(true);
            setError(null);
            
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${API_URL}/courses/${courseId}/videos/${video._id}/like`,
                {},
                { headers: { 'x-auth-token': token } }
            );
            
            setLikesCount(res.data.likesCount);
            setHasLiked(res.data.userLiked);
        } catch (error) {
            console.error('Error updating like:', error);
            setError('Failed to update like. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        
        if (!user) {
            setError('Please login to comment');
            return;
        }
        
        if (!newComment.trim()) return;

        try {
            setIsLoading(true);
            setError(null);
            
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/comments/${courseId}`,
                { content: newComment.trim() },
                { headers: { 'x-auth-token': token } }
            );
            
            setNewComment('');
            await fetchComments();
        } catch (error) {
            console.error('Error posting comment:', error);
            setError('Failed to post comment. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVideoError = (e) => {
        const videoElement = e.target;
        console.error('Video error details:', {
            error: videoElement.error,
            errorCode: videoElement.error?.code,
            errorMessage: videoElement.error?.message,
            networkState: videoElement.networkState,
            readyState: videoElement.readyState,
            src: videoElement.src
        });
        
        // Map error codes to user-friendly messages
        const errorMessages = {
            1: 'Video loading aborted',
            2: 'Network error while loading video',
            3: 'Video decoding failed',
            4: 'Video not found or access denied'
        };
        
        const errorCode = videoElement.error?.code;
        const errorMessage = errorMessages[errorCode] || 'Failed to load video';
        
        setVideoError(errorMessage);
        setVideoLoaded(false);
    };

    const handleVideoLoaded = () => {
        console.log('Video loaded successfully');
        setVideoLoaded(true);
        setVideoError(null);
    };

    const handleRetry = () => {
        setVideoError(null);
        setVideoLoaded(false);
        if (videoRef.current) {
            videoRef.current.load();
        }
    };

    const getUserInitial = (username) => {
        return username ? username.charAt(0).toUpperCase() : 'U';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const videoUrl = getVideoUrl();

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Video Player */}
            <div className="relative bg-black" style={{ paddingBottom: '56.25%' }}>
                {videoUrl ? (
                    <>
                        {!videoLoaded && !videoError && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <FaSpinner className="animate-spin text-4xl text-yellow-400" />
                            </div>
                        )}
                        
                        {videoError ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                <div className="text-center p-6">
                                    <FaExclamationTriangle className="text-4xl text-yellow-400 mx-auto mb-4" />
                                    <p className="text-white mb-2">Failed to load video</p>
                                    <p className="text-gray-400 text-sm mb-4">{videoError}</p>
                                    <button
                                        onClick={handleRetry}
                                        className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg font-medium hover:bg-yellow-500 transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <video
                                ref={videoRef}
                                key={videoUrl}
                                src={videoUrl}
                                controls
                                controlsList="nodownload"
                                className="absolute top-0 left-0 w-full h-full object-contain"
                                onError={handleVideoError}
                                onLoadedData={handleVideoLoaded}
                                onCanPlay={() => console.log('Video can play')}
                                preload="metadata"
                                crossOrigin="anonymous"
                            />
                        )}
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <FaExclamationTriangle className="text-4xl text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400">Video not available</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Rest of the component */}
            <div className="p-6">
                <div className="mb-4">
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                        {video.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        {video.durationFormatted && (
                            <div className="flex items-center">
                                <FaClock className="mr-1 text-yellow-400 text-xs" />
                                <span>{video.durationFormatted}</span>
                            </div>
                        )}
                    </div>
                </div>
                
                {video.description && (
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        {video.description}
                    </p>
                )}

                {/* Like Button */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLike}
                        disabled={isLoading}
                        className={`inline-flex items-center px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                            hasLiked
                                ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <FaThumbsUp className={`mr-2 ${hasLiked ? 'text-gray-900' : 'text-gray-500'}`} />
                        <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
                    </motion.button>
                    
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                    >
                        {showComments ? 'Hide Comments' : `Show Comments (${comments.length})`}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Comments Section */}
                <AnimatePresence>
                    {showComments && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-6"
                        >
                            <form onSubmit={handleComment} className="mb-6">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={user ? "Add a comment..." : "Please login to comment"}
                                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-150"
                                        disabled={!user || isLoading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!user || !newComment.trim() || isLoading}
                                        className={`px-5 py-3 rounded-xl font-medium transition-all duration-200 ${
                                            user && newComment.trim() && !isLoading
                                                ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {isLoading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {isCommentsLoading ? (
                                    <div className="text-center py-8">
                                        <FaSpinner className="animate-spin text-2xl text-yellow-400 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">Loading comments...</p>
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <FaUser className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 text-sm">No comments yet</p>
                                        <p className="text-gray-400 text-xs mt-1">Be the first to share your thoughts!</p>
                                    </div>
                                ) : (
                                    comments.map((comment, index) => (
                                        <motion.div
                                            key={comment._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-medium text-yellow-700">
                                                        {getUserInitial(comment.user?.username)}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-medium text-gray-900 text-sm">
                                                            {comment.user?.username || 'Anonymous'}
                                                        </p>
                                                        <span className="text-xs text-gray-400">
                                                            {formatDate(comment.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 text-sm leading-relaxed break-words">
                                                        {comment.content}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}