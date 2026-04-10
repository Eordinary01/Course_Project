'use client'

import { useState, useCallback, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from 'axios';
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/auth/AuthContext";
import { 
    FaUpload, FaSpinner, FaTrash, FaPlay, FaPause, FaArrowLeft,
    FaVideo, FaHeading, FaAlignLeft, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function AddVideo() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    
    // Get courseId from params - it will be params.id if folder is [id]
    const courseId = params?.courseId;
    
    const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
        defaultValues: {
            title: '',
            description: '',
            order: 0
        }
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [submitStatus, setSubmitStatus] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoDuration, setVideoDuration] = useState(null);
    const [isValidCourseId, setIsValidCourseId] = useState(false);
    const videoRef = useRef(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const videoFile = watch("video");

    // Validate courseId on mount
    useEffect(() => {
        console.log('Params:', params);
        console.log('Course ID from params:', courseId);
        
        if (courseId && courseId !== 'undefined' && courseId !== 'null') {
            setIsValidCourseId(true);
        } else {
            console.error('Invalid or missing course ID');
            setIsValidCourseId(false);
        }
    }, [courseId, params]);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        setValue('video', acceptedFiles);
        setPreviewUrl(URL.createObjectURL(file));
        
        // Get video duration
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            const durationInSeconds = Math.floor(video.duration);
            setVideoDuration(formatDuration(durationInSeconds));
        };
        video.src = URL.createObjectURL(file);
    }, [setValue]);

    const formatDuration = (seconds) => {
        if (!seconds || seconds === 0) return '0:00';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'video/*': ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
        },
        maxSize: 500 * 1024 * 1024,
        multiple: false
    });

    const removeVideo = () => {
        setValue('video', null);
        setPreviewUrl(null);
        setVideoDuration(null);
        if (videoRef.current) {
            videoRef.current.pause();
        }
        setIsPlaying(false);
    };

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleVideoEnded = () => {
        setIsPlaying(false);
    };

    const onSubmit = async (data) => {
        // Validate courseId
        if (!courseId || courseId === 'undefined' || courseId === 'null') {
            setSubmitStatus({ 
                type: 'error', 
                message: 'Course ID is missing. Please go back and select a course.' 
            });
            return;
        }

        // Validate video file
        if (!data.video || !data.video[0]) {
            setSubmitStatus({ type: 'error', message: 'Please select a video file' });
            return;
        }

        setIsLoading(true);
        setSubmitStatus(null);
        
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('description', data.description || '');
            formData.append('order', data.order || '0');
            formData.append('video', data.video[0]);

            console.log('Uploading to:', `${API_URL}/courses/${courseId}/videos`);

            const response = await axios.post(
                `${API_URL}/courses/${courseId}/videos`, 
                formData, 
                {
                    headers: { 
                        'x-auth-token': localStorage.getItem('token'),
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                }
            );
            
            setSubmitStatus({ 
                type: 'success', 
                message: 'Video uploaded successfully! Redirecting...' 
            });
            
            // Reset form
            reset();
            setPreviewUrl(null);
            setVideoDuration(null);
            setUploadProgress(0);
            
            // Redirect after delay
            setTimeout(() => {
                router.push(`/courses/${courseId}`);
            }, 2000);
            
        } catch (error) {
            console.error('Error adding video:', error);
            
            let errorMessage = 'Failed to add video. Please try again.';
            
            if (error.response) {
                errorMessage = error.response.data?.message || errorMessage;
            } else if (error.request) {
                errorMessage = 'Network error. Please check your connection.';
            } else {
                errorMessage = error.message || errorMessage;
            }
            
            setSubmitStatus({ 
                type: 'error', 
                message: errorMessage
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Show error if courseId is invalid
    if (!isValidCourseId) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="min-h-screen flex items-center justify-center bg-white p-4"
            >
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FaExclamationTriangle className="text-3xl text-red-500" />
                    </div>
                    <h2 className="text-2xl font-light text-gray-900 mb-2">Invalid Course</h2>
                    <p className="text-gray-600 mb-6">
                        The course ID is missing or invalid. Please select a course first.
                    </p>
                    <Link 
                        href="/"
                        className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <FaArrowLeft className="mr-2" />
                        Return to Home
                    </Link>
                </div>
            </motion.div>
        );
    }

    // Check admin access
    if (user?.role !== 'admin') {
        return (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="min-h-screen flex items-center justify-center bg-white p-4"
            >
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FaExclamationTriangle className="text-3xl text-red-500" />
                    </div>
                    <h2 className="text-2xl font-light text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
                    <Link 
                        href="/"
                        className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <FaArrowLeft className="mr-2" />
                        Return to Home
                    </Link>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8"
        >
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link 
                        href={`/courses/${courseId}`} 
                        className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4 transition-colors"
                    >
                        <FaArrowLeft className="mr-2" />
                        <span className="text-sm">Back to Course</span>
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tight">
                        Add New Video
                    </h1>
                    <p className="mt-2 text-gray-500">
                        Upload a new video lesson for your course
                        <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                            Course ID: {courseId}
                        </span>
                    </p>
                </div>

                {/* Status Messages */}
                <AnimatePresence>
                    {submitStatus?.type === 'success' && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center"
                        >
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                <FaCheckCircle className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-green-800 font-medium">Success!</p>
                                <p className="text-green-600 text-sm">{submitStatus.message}</p>
                            </div>
                        </motion.div>
                    )}

                    {submitStatus?.type === 'error' && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center"
                        >
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                                <FaExclamationTriangle className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-red-800 font-medium">Error</p>
                                <p className="text-red-600 text-sm">{submitStatus.message}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Form Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Title Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FaHeading className="inline-block mr-2 text-yellow-400" />
                                Video Title <span className="text-red-500">*</span>
                            </label>
                            <input 
                                {...register('title', { required: 'Title is required' })} 
                                className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-150"
                                placeholder="e.g., Introduction to the Course"
                            />
                            {errors.title && (
                                <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Description Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FaAlignLeft className="inline-block mr-2 text-yellow-400" />
                                Video Description (Optional)
                            </label>
                            <textarea 
                                {...register('description')} 
                                className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-150 resize-none"
                                rows="4"
                                placeholder="Describe what this video covers..."
                            />
                        </div>

                        {/* Order Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FaVideo className="inline-block mr-2 text-yellow-400" />
                                Video Order (Optional)
                            </label>
                            <input 
                                {...register('order')} 
                                type="number"
                                min="0"
                                className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-150"
                                placeholder="0"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Determines the order of videos in the course. Leave as 0 for auto-ordering.
                            </p>
                        </div>

                        {/* Video Upload Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FaUpload className="inline-block mr-2 text-yellow-400" />
                                Video File <span className="text-red-500">*</span>
                            </label>
                            <div 
                                {...getRootProps()} 
                                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                                    isDragActive 
                                        ? 'border-yellow-400 bg-yellow-50' 
                                        : 'border-gray-200 hover:border-yellow-300 bg-gray-50 hover:bg-gray-100'
                                }`}
                            >
                                <input {...getInputProps()} />
                                <div className="space-y-2">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                        <FaUpload className="text-2xl text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">
                                            {isDragActive ? 'Drop the video here' : 'Drag & drop video here'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            or click to browse
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        MP4, WebM, OGG, MOV up to 500MB
                                    </p>
                                </div>
                            </div>
                            
                            {/* Video Preview */}
                            <AnimatePresence>
                                {videoFile && videoFile[0] && previewUrl && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {videoFile[0].name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {(videoFile[0].size / (1024 * 1024)).toFixed(2)} MB
                                                    {videoDuration && ` • Duration: ${videoDuration}`}
                                                </p>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={removeVideo}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                        
                                        <div className="relative rounded-lg overflow-hidden bg-black">
                                            <video 
                                                ref={videoRef}
                                                src={previewUrl} 
                                                className="w-full" 
                                                onEnded={handleVideoEnded}
                                            />
                                            <button 
                                                type="button"
                                                onClick={togglePlayPause}
                                                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-4 text-white transition-all duration-200"
                                            >
                                                {isPlaying ? <FaPause className="text-xl" /> : <FaPlay className="text-xl ml-0.5" />}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            {errors.video && (
                                <p className="mt-2 text-sm text-red-600">{errors.video.message}</p>
                            )}
                        </div>

                        {/* Upload Progress */}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Uploading...</span>
                                    <span className="text-gray-900 font-medium">{uploadProgress}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                        className="h-full bg-yellow-400 rounded-full"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium text-gray-900 transition-all duration-300 ${
                                isLoading 
                                    ? 'bg-gray-200 cursor-not-allowed' 
                                    : 'bg-yellow-400 hover:bg-yellow-500 hover:shadow-md'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <FaSpinner className="animate-spin mr-2" />
                                    {uploadProgress > 0 ? 'Uploading...' : 'Adding Video...'}
                                </>
                            ) : (
                                'Add Video'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </motion.div>
    );
}