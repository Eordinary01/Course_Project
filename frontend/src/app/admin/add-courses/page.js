'use client'

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from 'axios';
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth/AuthContext";
import { motion } from "framer-motion";
import { FiUpload, FiArrowLeft, FiCheck, FiAlertCircle, FiPlus, FiX } from "react-icons/fi";
import { FaSpinner, FaImage, FaDollarSign, FaHeading, FaAlignLeft, FaList, FaTag, FaGraduationCap, FaGlobe, FaChartLine } from 'react-icons/fa';
import Link from 'next/link';

export default function AddCourse() {
    const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
        defaultValues: {
            whatYouWillLearn: [''],
            requirements: [''],
            tags: ['']
        }
    });
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [submitStatus, setSubmitStatus] = useState(null);
    const [learningPoints, setLearningPoints] = useState(['']);
    const [requirements, setRequirements] = useState(['']);
    const [tags, setTags] = useState(['']);
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

    const addLearningPoint = () => {
        setLearningPoints([...learningPoints, '']);
    };

    const removeLearningPoint = (index) => {
        const updated = learningPoints.filter((_, i) => i !== index);
        setLearningPoints(updated);
    };

    const updateLearningPoint = (index, value) => {
        const updated = [...learningPoints];
        updated[index] = value;
        setLearningPoints(updated);
    };

    const addRequirement = () => {
        setRequirements([...requirements, '']);
    };

    const removeRequirement = (index) => {
        const updated = requirements.filter((_, i) => i !== index);
        setRequirements(updated);
    };

    const updateRequirement = (index, value) => {
        const updated = [...requirements];
        updated[index] = value;
        setRequirements(updated);
    };

    const addTag = () => {
        setTags([...tags, '']);
    };

    const removeTag = (index) => {
        const updated = tags.filter((_, i) => i !== index);
        setTags(updated);
    };

    const updateTag = (index, value) => {
        const updated = [...tags];
        updated[index] = value;
        setTags(updated);
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        setSubmitStatus(null);
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('description', data.description);
            formData.append('price', data.price);
            formData.append('image', data.image[0]);
            formData.append('category', data.category);
            formData.append('level', data.level);
            formData.append('language', data.language);
            
            // Filter out empty values and append as JSON strings
            const validLearningPoints = learningPoints.filter(point => point.trim() !== '');
            const validRequirements = requirements.filter(req => req.trim() !== '');
            const validTags = tags.filter(tag => tag.trim() !== '');
            
            formData.append('whatYouWillLearn', JSON.stringify(validLearningPoints));
            formData.append('requirements', JSON.stringify(validRequirements));
            formData.append('tags', JSON.stringify(validTags));
    
            const response = await axios.post(`${API_URL}/courses`, formData, {
                headers: { 
                    'x-auth-token': localStorage.getItem('token'),
                    'Content-Type': 'multipart/form-data'
                }
            });
    
            if (response.status === 200 || response.status === 201) {
                setSubmitStatus('success');
                setTimeout(() => {
                    router.push('/');
                    reset();
                }, 1500);
            } else {
                throw new Error('Failed to add course');
            }
        } catch (error) {
            console.error('Error adding course:', error);
            setSubmitStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    const categories = [
        'Web Development',
        'Mobile Development',
        'Data Science',
        'Machine Learning',
        'Artificial Intelligence',
        'Cloud Computing',
        'DevOps',
        'Cybersecurity',
        'Blockchain',
        'UI/UX Design',
        'Digital Marketing',
        'Business',
        'Finance',
        'Personal Development',
        'Other'
    ];

    const levels = [
        'Beginner',
        'Intermediate',
        'Advanced',
        'All Levels'
    ];

    const languages = [
        'English',
        'Hindi',
        'Spanish',
        'French',
        'German',
        'Chinese',
        'Japanese',
        'Arabic',
        'Portuguese',
        'Russian'
    ];

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
                        <FiAlertCircle className="text-3xl text-red-500" />
                    </div>
                    <h2 className="text-2xl font-light text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
                    <Link 
                        href="/"
                        className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <FiArrowLeft className="mr-2" />
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
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link 
                        href="/" 
                        className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4 transition-colors"
                    >
                        <FiArrowLeft className="mr-2" />
                        <span className="text-sm">Back to Courses</span>
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tight">
                        Add New Course
                    </h1>
                    <p className="mt-2 text-gray-500">Create and publish a new course for your students</p>
                </div>

                {/* Success/Error Messages */}
                {submitStatus === 'success' && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center"
                    >
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <FiCheck className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-green-800 font-medium">Course Added Successfully!</p>
                            <p className="text-green-600 text-sm">Redirecting to home page...</p>
                        </div>
                    </motion.div>
                )}

                {submitStatus === 'error' && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center"
                    >
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                            <FiAlertCircle className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-red-800 font-medium">Failed to Add Course</p>
                            <p className="text-red-600 text-sm">Please check your inputs and try again.</p>
                        </div>
                    </motion.div>
                )}

                {/* Form Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="lg:flex">
                        {/* Form Section */}
                        <div className="lg:w-3/5 p-8 lg:p-10 max-h-[800px] overflow-y-auto">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {/* Basic Information */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">
                                        Basic Information
                                    </h3>
                                    
                                    {/* Title Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <FaHeading className="inline-block mr-2 text-yellow-400" />
                                            Course Title
                                        </label>
                                        <input 
                                            {...register('title', { required: 'Title is required' })} 
                                            className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-150"
                                            placeholder="e.g., Complete Web Development Bootcamp"
                                        />
                                        {errors.title && (
                                            <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
                                        )}
                                    </div>

                                    {/* Description Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <FaAlignLeft className="inline-block mr-2 text-yellow-400" />
                                            Course Description
                                        </label>
                                        <textarea 
                                            {...register('description', { required: 'Description is required' })} 
                                            className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-150 resize-none"
                                            rows="4"
                                            placeholder="Describe what students will learn in this course..."
                                        />
                                        {errors.description && (
                                            <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
                                        )}
                                    </div>

                                    {/* Category, Level, Language - Three Column Layout */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <FaList className="inline-block mr-2 text-yellow-400" />
                                                Category
                                            </label>
                                            <select 
                                                {...register('category', { required: 'Category is required' })}
                                                className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-150"
                                            >
                                                <option value="">Select category</option>
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                            {errors.category && (
                                                <p className="mt-2 text-sm text-red-600">{errors.category.message}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <FaChartLine className="inline-block mr-2 text-yellow-400" />
                                                Level
                                            </label>
                                            <select 
                                                {...register('level', { required: 'Level is required' })}
                                                className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-150"
                                            >
                                                <option value="">Select level</option>
                                                {levels.map(level => (
                                                    <option key={level} value={level}>{level}</option>
                                                ))}
                                            </select>
                                            {errors.level && (
                                                <p className="mt-2 text-sm text-red-600">{errors.level.message}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <FaGlobe className="inline-block mr-2 text-yellow-400" />
                                                Language
                                            </label>
                                            <select 
                                                {...register('language')}
                                                className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-150"
                                            >
                                                {languages.map(lang => (
                                                    <option key={lang} value={lang}>{lang}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Price Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <FaDollarSign className="inline-block mr-2 text-yellow-400" />
                                            Price (₹)
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <span className="text-gray-500">₹</span>
                                            </div>
                                            <input 
                                                {...register('price', { 
                                                    required: 'Price is required', 
                                                    min: { value: 0, message: 'Price must be positive' } 
                                                })} 
                                                type="number" 
                                                step="0.01"
                                                className="block w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-150"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {errors.price && (
                                            <p className="mt-2 text-sm text-red-600">{errors.price.message}</p>
                                        )}
                                    </div>
                                </div>

                                {/* What You'll Learn */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">
                                        <FaGraduationCap className="inline-block mr-2 text-yellow-400" />
                                        What You'll Learn
                                    </h3>
                                    {learningPoints.map((point, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={point}
                                                onChange={(e) => updateLearningPoint(index, e.target.value)}
                                                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-150"
                                                placeholder={`Learning point ${index + 1}`}
                                            />
                                            {learningPoints.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeLearningPoint(index)}
                                                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <FiX />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addLearningPoint}
                                        className="inline-flex items-center text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                                    >
                                        <FiPlus className="mr-1" />
                                        Add Learning Point
                                    </button>
                                </div>

                                {/* Requirements */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">
                                        Requirements
                                    </h3>
                                    {requirements.map((req, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={req}
                                                onChange={(e) => updateRequirement(index, e.target.value)}
                                                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-150"
                                                placeholder={`Requirement ${index + 1}`}
                                            />
                                            {requirements.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRequirement(index)}
                                                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <FiX />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addRequirement}
                                        className="inline-flex items-center text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                                    >
                                        <FiPlus className="mr-1" />
                                        Add Requirement
                                    </button>
                                </div>

                                {/* Tags */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">
                                        <FaTag className="inline-block mr-2 text-yellow-400" />
                                        Tags
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag, index) => (
                                            <div key={index} className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    value={tag}
                                                    onChange={(e) => updateTag(index, e.target.value)}
                                                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition duration-150"
                                                    placeholder={`Tag ${index + 1}`}
                                                    style={{ width: '150px' }}
                                                />
                                                {tags.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTag(index)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <FiX size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addTag}
                                            className="inline-flex items-center px-4 py-2 text-sm text-yellow-600 hover:text-yellow-700 font-medium border border-dashed border-gray-300 rounded-lg hover:border-yellow-400 transition-colors"
                                        >
                                            <FiPlus className="mr-1" />
                                            Add Tag
                                        </button>
                                    </div>
                                </div>

                                {/* Image Upload Field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FaImage className="inline-block mr-2 text-yellow-400" />
                                        Course Image
                                    </label>
                                    <div className="relative">
                                        <input 
                                            {...register('image', { required: 'Course image is required' })} 
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="image-upload"
                                        />
                                        <label 
                                            htmlFor="image-upload"
                                            className="flex flex-col items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-yellow-400 transition-colors duration-200 bg-gray-50 hover:bg-gray-100"
                                        >
                                            <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-600">
                                                Click to upload or drag and drop
                                            </span>
                                            <span className="text-xs text-gray-400 mt-1">
                                                PNG, JPG, GIF up to 10MB
                                            </span>
                                        </label>
                                    </div>
                                    {errors.image && (
                                        <p className="mt-2 text-sm text-red-600">{errors.image.message}</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-gray-900 transition-all duration-300 ${
                                        isLoading 
                                            ? 'bg-gray-200 cursor-not-allowed' 
                                            : 'bg-yellow-400 hover:bg-yellow-500 hover:shadow-md'
                                    }`}
                                >
                                    {isLoading ? (
                                        <>
                                            <FaSpinner className="animate-spin mr-2" />
                                            Creating Course...
                                        </>
                                    ) : (
                                        'Publish Course'
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Preview Section */}
                        <div className="lg:w-2/5 bg-gradient-to-br from-yellow-50 to-white p-8 lg:p-10 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-gray-100">
                            <div className="w-full">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Course Preview</h3>
                                {previewImage ? (
                                    <div className="space-y-4">
                                        <div className="relative rounded-xl overflow-hidden shadow-lg">
                                            <img 
                                                src={previewImage} 
                                                alt="Course preview" 
                                                className="w-full h-48 object-cover"
                                            />
                                            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">
                                                Preview
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-500">Title</p>
                                                <p className="font-medium text-gray-900">
                                                    {watch('title') || 'Course Title'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Category</p>
                                                <p className="text-sm text-gray-700">
                                                    {watch('category') || 'Not selected'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Level</p>
                                                <p className="text-sm text-gray-700">
                                                    {watch('level') || 'Not selected'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Price</p>
                                                <p className="text-lg font-medium text-gray-900">
                                                    ₹{watch('price') || '0'}
                                                </p>
                                            </div>
                                            {learningPoints.filter(p => p.trim()).length > 0 && (
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-2">What You'll Learn</p>
                                                    <ul className="space-y-1">
                                                        {learningPoints.filter(p => p.trim()).slice(0, 3).map((point, i) => (
                                                            <li key={i} className="text-sm text-gray-600 flex items-start">
                                                                <span className="text-yellow-400 mr-2">•</span>
                                                                {point}
                                                            </li>
                                                        ))}
                                                        {learningPoints.filter(p => p.trim()).length > 3 && (
                                                            <li className="text-sm text-gray-400">
                                                                +{learningPoints.filter(p => p.trim()).length - 3} more
                                                            </li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <FaImage className="text-3xl text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Image Selected</h3>
                                        <p className="text-gray-500 text-sm">
                                            Upload an image to see the preview here
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}