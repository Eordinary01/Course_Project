'use client'

import { useState, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from 'axios';
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth/AuthContext";
import { FaUpload, FaSpinner, FaTrash, FaPlay, FaPause } from 'react-icons/fa';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Toast } from "@/app/components/Toast";
import { Input, TextArea, Button } from "@/app/components/FormElements";

export default function AddVideo({ params }) {
    const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm();
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [toastMessage, setToastMessage] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const videoFile = watch("video");

    const onDrop = useCallback((acceptedFiles) => {
        setValue('video', acceptedFiles);
        setPreviewUrl(URL.createObjectURL(acceptedFiles[0]));
    }, [setValue]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: 'video/*',
        maxSize: 100 * 1024 * 1024, // 100MB
    });

    const removeVideo = () => {
        setValue('video', null);
        setPreviewUrl(null);
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

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('description', data.description);
            formData.append('video', data.video[0]);

            await axios.post(`${API_URL}/courses/${params.courseId}/videos`, formData, {
                headers: { 
                    'x-auth-token': localStorage.getItem('token'),
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });
            setToastMessage('Video uploaded successfully!');
            router.push(`/courses/${params.courseId}`);
        } catch (error) {
            console.error('Error adding video:', error);
            setToastMessage('Failed to add video. Please try again.');
        } finally {
            setIsLoading(false);
            setUploadProgress(0);
        }
    };

    if (user?.role !== 'admin') {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center justify-center h-screen bg-gradient-to-r from-red-50 to-red-100"
            >
                <div className="text-center p-8 bg-white rounded-lg shadow-xl">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Not Authorized</h2>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-100 p-4"
        >
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-8">
                    <h2 className="text-3xl font-bold mb-6 text-center text-indigo-600">Add New Video</h2>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-black">
                        <Controller
                            name="title"
                            control={control}
                            rules={{ required: 'Title is required' }}
                            render={({ field }) => (
                                <Input
                                    label="Video Title"
                                    error={errors.title?.message}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <TextArea
                                    label="Video Description"
                                    rows={4}
                                    {...field}
                                />
                            )}
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Video File</label>
                            <div 
                                {...getRootProps()} 
                                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md transition-colors ${isDragActive ? 'border-indigo-500 bg-indigo-50' : ''}`}
                            >
                                <input {...getInputProps()} />
                                <div className="space-y-1 text-center">
                                    <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="text-sm text-gray-600">
                                        {isDragActive ? 'Drop the video here' : 'Drag & drop video here, or click to select'}
                                    </p>
                                    <p className="text-xs text-gray-500">MP4, WebM, or OGG up to 100MB</p>
                                </div>
                            </div>
                            <AnimatePresence>
                                {videoFile && videoFile[0] && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 bg-gray-100 p-4 rounded-lg"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm text-gray-600 truncate">{videoFile[0].name}</p>
                                            <Button type="button" onClick={removeVideo} variant="icon">
                                                <FaTrash className="text-red-500" />
                                            </Button>
                                        </div>
                                        {previewUrl && (
                                            <div className="relative">
                                                <video 
                                                    ref={videoRef}
                                                    src={previewUrl} 
                                                    className="w-full rounded-md" 
                                                    controls={false}
                                                />
                                                <button 
                                                    onClick={togglePlayPause}
                                                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-3 text-white"
                                                >
                                                    {isPlaying ? <FaPause /> : <FaPlay />}
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {errors.video && <p className="mt-1 text-sm text-red-600">{errors.video.message}</p>}
                        </div>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                                className="h-2 bg-indigo-500 rounded-full"
                            />
                        )}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? (
                                <>
                                    <FaSpinner className="animate-spin mr-2" />
                                    Uploading...
                                </>
                            ) : 'Add Video'}
                        </Button>
                    </form>
                </div>
            </div>
            <Toast message={toastMessage} onClose={() => setToastMessage('')} />
        </motion.div>
    );
}