'use client'

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from 'axios';
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth/AuthContext";
import { motion } from "framer-motion";
import { FiUpload } from "react-icons/fi";

export default function AddCourse() {
    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === 'image' && value.image?.[0]) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewImage(reader.result);
                };
                reader.readAsDataURL(value.image[0]);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch]);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('description', data.description);
            formData.append('price', data.price);
            formData.append('image', data.image[0]);
    
            const response = await axios.post(`${API_URL}/courses`, formData, {
                headers: { 
                    'x-auth-token': localStorage.getItem('token'),
                    'Content-Type': 'multipart/form-data'
                }
            });
    
            if (response.status === 200) {
                router.push('/');
                reset();
            } else {
                throw new Error('Failed to add course');
            }
        } catch (error) {
            console.error('Error adding course:', error);
            // Error handling logic (unchanged)
        } finally {
            setIsLoading(false);
        }
    };

    if (user?.role !== 'admin') {
        return (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
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
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-100 p-4"
        >
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="md:flex">
                    <div className="md:w-1/2 p-8">
                        <h2 className="text-3xl font-bold mb-6 text-indigo-600">Add New Course</h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Course Title</label>
                                <input 
                                    {...register('title', { required: 'Title is required' })} 
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
                                    placeholder="Enter course title"
                                />
                                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Course Description</label>
                                <textarea 
                                    {...register('description', { required: 'Description is required' })} 
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
                                    rows="4"
                                    placeholder="Enter course description"
                                />
                                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                                <input 
                                    {...register('price', { required: 'Price is required', min: { value: 0, message: 'Price must be positive' } })} 
                                    type="number" 
                                    step="0.01"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-black"
                                    placeholder="Enter course price"
                                />
                                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Course Image</label>
                                <div className="mt-1 flex items-center">
                                    <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-indigo rounded-lg shadow-lg tracking-wide uppercase border border-indigo cursor-pointer hover:bg-indigo-500 hover:text-white">
                                        <FiUpload className="w-8 h-8" />
                                        <span className="mt-2 text-base leading-normal">Select a file</span>
                                        <input 
                                            {...register('image', { required: 'Image is required' })} 
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image.message}</p>}
                            </div>
                            <div>
                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading ? 'Adding Course...' : 'Add Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="md:w-1/2 bg-indigo-100 p-8 flex items-center justify-center">
                        {previewImage ? (
                            <img src={previewImage} alt="Course preview" className="max-w-full max-h-96 object-contain rounded-lg shadow-lg" />
                        ) : (
                            <div className="text-center text-gray-500">
                                <FiUpload className="w-16 h-16 mx-auto mb-4" />
                                <p>Upload an image to see preview</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}